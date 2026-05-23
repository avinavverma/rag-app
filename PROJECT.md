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