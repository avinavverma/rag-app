# API Contracts

## Base URLs

Development:
```txt
http://localhost:8000
```

Production:
```txt
https://rag-app-production-6307.up.railway.app/
```

---

## Authentication

All authenticated backend routes require:

```txt
x-user-id: <uuid>
```

---

## Error Shape

```json
{
  "detail": "string"
}
```

Uses FastAPI default error format.

---

# Endpoints

## GET /health

Response:

```json
{
  "status": "ok"
}
```

---

## POST /ingest/upload

Description:
Uploads a PDF document for ingestion.

Final behavior (Segments 2–3):
- PDF uploaded
- text extracted
- chunked
- embedded
- stored
- document marked ready

Processing is synchronous in this version.

Headers:

```txt
x-user-id: string
Content-Type: multipart/form-data
```

Body:
- file → PDF
- name → document name

Response:

```json
{
  "document_id": "uuid",
  "status": "processing"
}
```

### Segment 2 Behavior

Segment 2 returns:

```json
{
  "document_id": "uuid",
  "status": "processing"
}
```

after:
- source PDF stored in Supabase Storage
- pages.json extracted and stored
- documents row created/updated

Segment 2 does NOT:
- insert chunks
- generate embeddings
- mark documents as ready

Documents remain in `processing` status until Segment 3 completes chunking and embeddings.

---

### Segment 3 Behavior

After Segment 3, successful upload returns:

```json
{
  "document_id": "uuid",
  "status": "ready"
}
```

The endpoint remains synchronous:
- client waits until chunking and embeddings complete
- chunks are inserted before response returns

On failure after the documents row exists:
- documents.status is set to failed

## GET /documents

Headers:

```txt
x-user-id: string
```

Response:

```json
{
  "documents": [
    {
      "id": "uuid",
      "name": "string",
      "status": "processing | ready | failed",
      "page_count": 10,
      "created_at": "timestamp"
    }
  ]
}
```

---

## GET /documents/{document_id}

Headers:

```txt
x-user-id: string
```

Response:

```json
{
  "id": "uuid",
  "name": "string",
  "status": "ready",
  "page_count": 10,
  "file_path": "string",
  "created_at": "timestamp"
}
```

---

## POST /query/stream

Headers:

```txt
x-user-id: string
Content-Type: application/json
```

Request Body:

```json
{
  "question": "string",
  "document_id": "uuid"
}
```

Response:
```txt
text/event-stream
```

SSE Event Order:

1. Sources event
2. Token events
3. Done event

Sources event:

```json
{
  "type": "sources",
  "sources": []
}
```

Token event:

```json
{
  "type": "token",
  "token": "string"
}
```

Done event:

```json
{
  "type": "done"
}
```

### Embedding Provider

The ingestion pipeline currently uses local semantic embeddings via:

- `sentence-transformers`
- `BAAI/bge-small-en-v1.5`
- 384-dimensional normalized vectors

Embeddings are generated locally during ingestion and stored in Supabase pgvector (`vector(384)`).

## POST /query/retrieve

Description:
Retrieves the top 5 most similar chunks for a question scoped to one document.
No LLM — retrieval only (Segment 4).

Headers:
x-user-id: string
Content-Type: application/json

Request Body:
{
  "question": "string",
  "document_id": "uuid"
}

Response:
{
  "chunks": [
    {
      "chunk_id": "uuid",
      "page_number": 1,
      "content": "string",
      "similarity": 0.87
    }
  ]
}

Notes:
- similarity is cosine similarity in [0, 1] (higher = more relevant)
- Returns at most 5 chunks, ordered by similarity descending
- Filtered by both document_id and user_id

### Segment 5 Behavior

* Uses retrieved chunks from the same retrieval pipeline as `POST /query/retrieve`
* LLM provider: Google Gemini 2.0 Flash (free tier)
* SSE event order is always:

  1. `sources`
  2. `token` (repeated streaming events)
  3. `done`
* After stream completion, both user and assistant messages are persisted to the `messages` table
* `sources[].content` contains a short preview of chunk text (truncated), not the full chunk body

Example SSE sequence:

```text
data: {
  "type": "sources",
  "sources": [
    {
      "chunk_id": "8064b63f-d4af-4d02-9eff-1255281c867a",
      "page_number": 9,
      "content": "Rapidly-exploring Random Tree (RRT) builds a tree that expands toward unexplored regions...",
      "similarity": 0.6757
    }
  ]
}

data: {
  "type": "token",
  "token": "RRT "
}

data: {
  "type": "token",
  "token": "is "
}

data: {
  "type": "done"
}
```
---

## Frontend Authentication (Segment 6)

Frontend authentication now uses Supabase Auth with cookie-based sessions via `@supabase/ssr`.

Frontend protected routes currently include:

* `/dashboard`
* `/workspace/:id`

Unauthenticated users are redirected to `/login`.

Authenticated users visiting `/login` or `/signup`
are redirected to `/dashboard`.

### Current Backend Auth Model

Backend API routes still temporarily trust:

```txt
x-user-id: <uuid>
```

During Segment 7, frontend requests will populate this header
using the authenticated Supabase session user ID obtained from:

```ts
useUser().userId
```

Full backend JWT verification will be added in a later segment.


---

## Dashboard Document Source (Segment 7)

Frontend dashboard document listing reads directly from Supabase using the authenticated browser session and RLS policies.

Document upload continues to use:

```txt id="jlwm3g"
POST /ingest/upload
```

through the FastAPI backend.
