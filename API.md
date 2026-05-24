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