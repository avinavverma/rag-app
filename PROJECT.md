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