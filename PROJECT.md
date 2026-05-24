# PROJECT Decisions Log

## Initial Architecture Decisions

Date: 2026-05-21

### Monorepo Structure

```txt
frontend/
backend/
```

Reason:
Single repository simplifies deployment and coordination between frontend and backend.

---

### Vector Database

Using pgvector inside Supabase instead of Pinecone.

Reason:
- fewer services
- simpler infrastructure
- lower operational complexity
- sufficient for portfolio-scale workloads

---

### Ingestion Architecture

Synchronous ingestion pipeline.

Reason:
Avoid queues/workers/background jobs during MVP stage.

Frontend simply waits while processing completes.

---

### Chunking Strategy

Chunk size:
```txt
500
```

Overlap:
```txt
50
```

Reason:
Balance between retrieval precision and contextual continuity.

---

### Locked Schema

Core tables:
- documents
- chunks
- messages
- notes

No schema changes without explicit documented reason.

---

### Deployment Architecture

Frontend:
```txt
Vercel
```

Backend:
```txt
Railway
```

Database/Auth/Storage:
```txt
Supabase
```

---

### AI Models

Embeddings:
```txt
text-embedding-3-small
```

Generation:
```txt
gpt-4o-mini
```

Reason:
Good quality-to-cost ratio for portfolio-scale RAG application.

### Storage

Created private Supabase Storage bucket:

```txt
pdfs
```

Reason:
Uploaded PDFs should only be accessible to authenticated users.

---

## Segment 2 Started

Date: 2026-05-22

### Extracted Text Storage Decision

Extracted page text is stored in Supabase Storage as JSON files instead of new database columns.

Storage paths:

```txt
{user_id}/{document_id}/source.pdf
{user_id}/{document_id}/pages.json
```

documents.file_path stores ONLY the source.pdf path.

pages.json structure:

```json
{
  "pages": [
    {
      "page_number": 1,
      "text": "..."
    }
  ]
}
```

Reason:
- avoids schema changes
- Segment 3 can chunk directly from JSON without re-parsing PDFs
- extracted text can be manually inspected/debugged
- keeps ingestion deterministic

### Segment 2 Authentication

Until Segment 6 auth integration:
- backend routes use x-user-id header manually
- curl requests use a real Supabase auth.users UUID

---

## Segment 2 Complete

Date: 2026-05-23

Verified locally and on Railway:

- PDF upload works
- source.pdf uploads to Supabase Storage
- pages.json uploads correctly
- documents row created successfully
- page_count updates correctly
- PDF text extraction verified manually
- Production Railway upload verified

Decision:
- zero extracted pages returns 400 error

---

## Segment 3 Started

Date: 2026-05-23

### Chunking Decisions

Chunking uses RecursiveCharacterTextSplitter with:

- chunk_size = 500
- chunk_overlap = 50

Chunking is performed per-page using extracted page text from Segment 2.

Pages are NOT merged into a single document string before chunking in order to preserve page_number metadata.

### Offset Semantics

char_start and char_end are offsets within an individual page’s text, not global document offsets.

chunk_index is global across the whole document:
0, 1, 2, 3, ... across all pages.

char_start is resolved using:

page.text.find(chunk, search_from)

If not found:
- fallback to search_from

char_end:

char_start + len(chunk)

search_from advances using:

char_start + 1

to correctly handle overlapping chunks.

### Embedding Decisions

Embedding model:
- text-embedding-3-small

Embedding dimension:
- 1536

Embedding batch size:
- 64

### Pipeline Architecture

Segment 3 extends the synchronous ingest pipeline:

PDF
→ extract pages
→ chunk pages
→ embed chunks
→ insert chunks rows
→ documents.status = ready

pages.json in Storage remains an audit/debug artifact only.

Chunking uses in-memory pages from extract_pages() during upload.

## Segment 3 Complete

Verified:
- PDF upload pipeline
- Page extraction
- Recursive chunking (500/50)
- Offset correctness
- Chunk persistence
- pgvector integration
- documents.status transitions
- Railway production deployment

Temporary mocked embeddings are currently used due to unavailable OpenAI API quota.
The embedding interface remains swappable without architectural changes.

## Segment 3.5 — Local Semantic Embeddings (BGE-384)

Date: 2026-05-24

The project migrated from temporary mocked embeddings / OpenAI-compatible 1536-dimensional vectors to local semantic embeddings using:

- Model: `BAAI/bge-small-en-v1.5`
- Provider: `sentence-transformers`
- Embedding dimension: `384`

A Supabase migration updated the `chunks.embedding` column from `vector(1536)` to `vector(384)`.

Why this change:
- eliminate OpenAI embedding API costs
- enable fully local embedding generation
- support meaningful semantic retrieval for Segment 4
- improve development iteration speed

Notes:
- existing chunk embeddings were deleted during migration
- PDFs must be re-uploaded/re-ingested after migration
- `embed_texts()` interface remained unchanged, so the ingestion pipeline architecture did not require router changes

Verification completed:
- embeddings generated locally
- embedding dimension verified as 384
- semantic similarity sanity check passed
- ingestion pipeline successfully re-uploaded documents with real embeddings

## Segment 4 Complete — Semantic Retrieval

### Overview

Implemented semantic retrieval using pgvector cosine similarity search with BAAI/bge-small-en-v1.5 embeddings.

Users can now:

* Upload PDFs
* Store chunk embeddings in Supabase pgvector
* Ask natural-language questions
* Retrieve semantically relevant chunks from uploaded documents

This segment intentionally excludes:

* LLM answer generation
* Streaming responses
* Chat persistence
* Frontend chat UI

Focus was strictly on validating retrieval quality before introducing generation.

---

### Architecture

Query flow:

Question
→ embed_query() using BGE query embeddings
→ Supabase RPC match_chunks()
→ cosine similarity search in pgvector
→ top-k chunk retrieval

Implemented:

* `embed_query()` with `prompt_name="query"`
* `retriever.py` retrieval service
* `/query/retrieve` FastAPI endpoint
* `match_chunks` PostgreSQL RPC function
* Retrieval request/response schemas

---

### Verification Results

Verified locally using robotics PDF examples.

Example query:

> "What is RRT?"

Top retrieved chunk correctly returned:

* Rapidly-exploring Random Tree (RRT)
* algorithm steps
* advantages
* limitations

Additional retrieval checks:

* "What is graph based mapping?"
* "What are the advantages of A* algorithm?"

Results showed semantically relevant retrieval even when wording differed from document phrasing, confirming embeddings are functioning semantically rather than through naive keyword matching.

---

### Notes

* Retrieval uses normalized 384-dimensional BGE embeddings
* pgvector similarity search working correctly in both local and production environments
* Generic course-header chunks occasionally appear in lower-ranked results due to small document size and top-k retrieval settings
* PDF Unicode extraction still produces some malformed bullet characters (`â¢`) from source PDFs; retrieval quality unaffected

---

### Status

Segment 4 retrieval pipeline is operational locally and ready for:

* LLM answer generation
* streaming responses
* citation grounding
* frontend chat integration

## Segment 5 Started — Generation + Streaming

### LLM Provider Decision

Segment 5 introduces streamed answer generation using Google Gemini 2.0 Flash.

Gemini was selected because:

* free tier is sufficient for portfolio/demo usage
* native streaming support is simple to integrate
* strong instruction-following for grounded document QA
* works well with Railway deployment (API-only, no GPU/server management)
* pairs cleanly with local BGE embeddings for a cost-efficient architecture

Alternatives considered:

* Groq: extremely fast but weaker citation reliability in some cases
* Ollama/local LLMs: avoided due to RAM usage, cold starts, and deployment complexity
* OpenAI: skipped due to API cost constraints

---

### Prompt Strategy

Generation is retrieval-grounded.

Pipeline:

question
→ retrieve relevant chunks
→ build page-labeled context
→ generate answer from context only

Prompt rules:

* answer only using retrieved context
* cite page numbers when relevant
* refuse unsupported claims if information is absent from context
* prioritize concise and grounded responses over verbosity

---

### Message Persistence

Each streamed interaction stores two rows in the `messages` table:

1. User message

   * role = `user`
   * content = raw question

2. Assistant message

   * role = `assistant`
   * content = full generated answer
   * sources = JSON metadata for retrieved chunks

Stored source metadata includes:

* chunk_id
* page_number
* similarity
* short chunk preview

This persistence layer will later support:

* frontend chat history
* citations
* source cards
* conversational UX
