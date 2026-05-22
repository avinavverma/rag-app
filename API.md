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