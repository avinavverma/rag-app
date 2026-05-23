Segment 3 — Chunking and Embeddings (Step-by-Step)

Segment 2 is complete (PROJECT.md verified). Segment 3 completes the ingest half of the RAG flow:

pages.json (in memory from extract_pages)
  → RecursiveCharacterTextSplitter per page
  → OpenAI embeddings (1536-dim)
  → chunks table
  → documents.status = ready

Contract source: API.md, locked schema in supabase/migrations/001_initial_schema.sql.

Integration point: Extend existing backend/routers/ingest.py — same POST /ingest/upload, synchronous end-to-end (no new endpoint, no queue).



Segment 3 vs Segment 2











Segment 2 (done)



Segment 3 (this plan)





Response status



processing



ready (on success)





Storage



source.pdf + pages.json



Unchanged





DB writes



documents only



chunks rows + update documents





OpenAI / LangChain



No



Yes



Architecture (same request)

sequenceDiagram
  participant API as ingest_upload
  participant Parser as pdf_parser
  participant Chunker as chunker
  participant Embedder as embedder
  participant DB as Supabase

  API->>Parser: extract_pages
  API->>DB: INSERT documents processing
  API->>DB: Storage source.pdf + pages.json
  API->>Chunker: chunk_document pages
  API->>Embedder: embed_texts batch
  API->>DB: INSERT chunks with embeddings
  API->>DB: UPDATE documents status ready
  API->>API: Return document_id + ready

Use in-memory pages from extract_pages() — do not re-download pages.json in the same request (fewer failure points). pages.json in Storage remains the audit/debug artifact from Segment 2.



Order of work (strict sequence)

Step 1 — Document decisions (15 min)

1a. Update API.md — add ### Segment 3 Behavior under POST /ingest/upload:





After Segment 3, successful upload returns:

{ "document_id": "uuid", "status": "ready" }





Endpoint remains synchronous — client waits until chunks + embeddings are stored (matches final brief)



On failure after documents row exists: status: failed (already handled in ingest try/except)

1b. Append to PROJECT.md — dated “Segment 3”:





Chunk params: chunk_size=500, chunk_overlap=50



char_start / char_end are offsets within that page’s text (not global document offset)



chunk_index is global across the whole document (0, 1, 2, … across all pages)



Embedding model: text-embedding-3-small, dimension 1536



Batch size for OpenAI (e.g. 64 or 100 texts per request) — pick one, log it



How char_start/char_end are computed (see Step 4)

1c. Pre-flight





OPENAI_API_KEY in local backend/.env and Railway env



Supabase chunks.embedding column is vector(1536) (already in migration)



Step 2 — Dependencies (5 min)

Add to backend/requirements.txt:

openai
langchain-text-splitters

Install:

cd backend
pip install -r requirements.txt

No LlamaIndex, no full langchain meta-package.



Step 3 — Pydantic updates (10 min)

Edit backend/models/schemas.py:





Change UploadResponse.status to Literal["processing", "ready"] (or Literal["ready"] only if upload always completes pipeline — prefer union for failed-path clarity)



Add internal ChunkRecord model (not exposed on API): content, page_number, chunk_index, char_start, char_end, optional embedding: list[float]



Step 4 — Chunker service (30–45 min)

Create backend/services/chunker.py:

from langchain_text_splitters import RecursiveCharacterTextSplitter

def chunk_document(pages: list[PageText]) -> list[ChunkRecord]:
    ...

Splitter config (locked):

RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
)

Per-page algorithm:





Skip empty pages (or skip chunks with empty content after strip)



text_chunks = splitter.split_text(page.text)



For each piece, resolve offsets in page.text:





char_start = page.text.find(piece, search_from); if -1, fall back to search_from



char_end = char_start + len(piece)



Advance search_from to char_start + 1 (handles overlap without duplicate global offsets)



Assign global chunk_index incrementing across all pages

Do not merge all pages into one string before splitting — that would lose correct page_number metadata.

Sanity test: print first 3 chunks for a known PDF page in REPL before embedding (verify char_start/char_end slice matches content).



Step 5 — Embedder service (20 min)

Create backend/services/embedder.py:

from openai import OpenAI

def embed_texts(texts: list[str]) -> list[list[float]]:
    # model="text-embedding-3-small"
    # batch in groups of N (e.g. 64)

Rules:





One OpenAI client from env OPENAI_API_KEY



Input order must match output order (map embeddings back to chunks by index)



Empty strings: skip chunk earlier in chunker, or embed placeholder — prefer skip empty chunks



On API error: let exception propagate → ingest sets documents.status = failed



Step 6 — Persist chunks (30 min)

Add helper in backend/services/chunker.py or new backend/services/chunks_db.py:

def insert_chunks(document_id: str, user_id: str, chunks: list[ChunkRecord]) -> None:
    # supabase.table("chunks").insert([...]) in batches of ~50 rows

Each row:

{
  "document_id": document_id,
  "user_id": user_id,
  "content": chunk.content,
  "page_number": chunk.page_number,
  "chunk_index": chunk.chunk_index,
  "char_start": chunk.char_start,
  "char_end": chunk.char_end,
  "embedding": embedding_list,  # 1536 floats
}

Supabase/pgvector note: pass embedding as Python list[float]; if insert fails, check Supabase docs for vector string format and log fix in PROJECT.md.

Idempotency (minimal): For Segment 3, assume one-shot upload per new document. If re-running failed doc, optional: delete existing chunks for document_id before insert — only if you hit duplicate test uploads; not required for first pass.



Step 7 — Wire ingest router (30 min)

Edit backend/routers/ingest.py — after page_count update and before return:

chunk_records = chunk_document(pages)
texts = [c.content for c in chunk_records]
embeddings = embed_texts(texts)
for c, e in zip(chunk_records, embeddings):
    c.embedding = e
insert_chunks(document_id, user_id, chunk_records)

supabase.table("documents").update({"status": "ready"}).eq("id", document_id).execute()

return UploadResponse(document_id=document_id, status="ready")

Keep existing try/except → on any failure after insert, set status: failed (already present).

Do not change PDF validation, storage paths, or pages.json format.



Step 8 — Local verification (30 min, required)

8a. Start backend

cd backend
uvicorn main:app --reload --port 8000

8b. curl (same as Segment 2):

curl -X POST http://localhost:8000/ingest/upload \
  -H "x-user-id: YOUR_TEST_USER_UUID" \
  -F "file=@C:/path/to/real-document.pdf" \
  -F "name=Segment 3 Test"

Expected:

{ "document_id": "...", "status": "ready" }

8c. Supabase → documents





status = ready



page_count still correct

8d. Supabase → chunks

Manually inspect several rows (not just count):





content reads sensibly (no garbage / mid-word only if PDF extraction is poor)



page_number matches where text came from



chunk_index sequential globally



char_start / char_end: slicing page.text[char_start:char_end] in a scratch script matches content (spot-check 2 chunks)



embedding not null; dimension 1536 if inspectable

8e. Failure mode





Temporarily break OPENAI_API_KEY → upload should return 500 and documents.status = failed; no silent partial state without investigation (if partial chunks inserted, note cleanup in PROJECT.md)



Step 9 — Production smoke test (15 min)

Repeat curl against Railway production URL. Confirm ready + chunks visible in Supabase for that document_id.



Step 10 — Commit and freeze (10 min)





Commit: feat: Segment 3 chunking and embeddings



Append Segment 3 Complete to PROJECT.md with date + what you verified



Do not implement retrieval (Segment 4) or change frontend



Files touched (checklist)







File



Action





API.md



Segment 3 behavior + ready response





PROJECT.md



Chunking/embedding decisions + completion log





backend/requirements.txt



+openai, +langchain-text-splitters





backend/models/schemas.py



UploadResponse ready, ChunkRecord





backend/services/chunker.py



New





backend/services/embedder.py



New





backend/routers/ingest.py



Wire chunk → embed → insert → ready

Not touched: frontend/, backend/routers/query.py, pgvector match_chunks SQL (Segment 4), LLM streaming (Segment 5).



Explicit non-goals





Retrieval / similarity search endpoint



GPT / SSE / messages table writes



Frontend upload or status polling (Segments 7–10)



Re-parsing PDFs (read pages in memory; Storage JSON is backup)



New tables or schema migrations