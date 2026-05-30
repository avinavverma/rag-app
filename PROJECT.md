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

Gemini provider was replaced with Groq due to Gemini free-tier quota and billing friction during development/testing.

Streaming architecture, retrieval pipeline, prompt builder, and SSE contract remained unchanged because provider integration was isolated inside generator.py.

```md
## Segment 5 Complete — Streaming RAG Generation

### Overview
Implemented streaming grounded-answer generation using retrieval-augmented generation (RAG) with Groq-hosted Llama 3.1.

Pipeline:
question → retrieve relevant chunks → build grounded prompt → stream answer tokens via SSE → persist conversation to database.

### LLM Provider
- Provider: Groq
- Model: llama-3.1-8b-instant
- Streaming: enabled using Server-Sent Events (SSE)

### Prompt Strategy
- System prompt instructs the model to:
  - answer only from provided context
  - refuse if answer is not found in retrieved chunks
  - cite page numbers when using information from the document
- Retrieved chunks are formatted with page annotations before generation.

### Retrieval + Streaming Behavior
- `/query/stream` endpoint streams:
  1. retrieved sources
  2. generated token chunks
  3. done event
- Validation occurs before stream starts.
- Errors during generation are handled gracefully and terminate the stream cleanly.

### Persistence
After generation completes:
- user question saved to `messages`
- assistant response saved to `messages`
- assistant row stores retrieved sources metadata in `jsonb`

### Verification
Verified locally using uploaded robotics PDF.

Example query:
`What is RRT?`

Observed behavior:
- relevant chunks retrieved from Page 9
- grounded answer streamed token-by-token
- citation `(Page 9)` included in final response
- conversation rows persisted successfully in Supabase

### Notes
- Groq replaced Gemini during development due to Gemini free-tier quota and billing friction.
- Provider abstraction allowed migration with minimal architecture changes.
- Streaming token chunks are provider-level partial outputs and are expected to appear fragmented during raw terminal testing.
```

## Segment 6 Started — Auth

Date: 25-05-26

* Using Supabase Auth with email/password only
* Using @supabase/ssr for App Router middleware cookie sessions
* Backend still temporarily trusts x-user-id header until Segment 7
* Email confirmation disabled during development for faster iteration

## Segment 6 Complete — Frontend Authentication

### Completed

* Added Supabase email/password authentication
* Migrated to `@supabase/ssr` App Router auth pattern
* Added login and signup flows
* Added protected dashboard route
* Added middleware-based auth redirects
* Added session-aware root page redirect
* Added logout flow

### Supabase SSR Pattern

Frontend auth now uses:

* `lib/supabase/client.ts` for browser/client components
* `lib/supabase/server.ts` for server components and redirects
* `lib/supabase/middleware.ts` for middleware session refresh

### Protected Routes

Current protected route patterns:

* `/dashboard`
* `/workspace/:id`

Unauthenticated users are redirected to `/login`.

Authenticated users visiting `/login` or `/signup`
are redirected to `/dashboard`.

### Email Confirmation

Email confirmation is currently disabled during development
for faster iteration and testing.

This can be re-enabled later for production.

### Session/User State

Frontend auth state is exposed through:

```ts
useUser()
```

Available values:

* `user`
* `loading`
* `userId`

`user.id` will be used in Segment 7 to populate the backend
`x-user-id` header for temporary user isolation.

## Segment 7 Started — Document Dashboard (2026-05-24)

### Architecture Decisions

### Document List

Frontend dashboard document listing will use the Supabase browser client directly instead of a backend `GET /documents` endpoint.

Reasons:

* RLS already restricts rows to `auth.uid() = user_id`
* Supabase client automatically sends the authenticated user's JWT
* Avoids unnecessary backend proxy endpoints

### Upload Flow

PDF upload will use the backend ingest pipeline via:

```txt id="jlwm4f"
POST /ingest/upload
```

Frontend requests will include:

```txt id="jlwm4g"
x-user-id: <session user.id>
```

using the authenticated user returned by:

```ts id="jlwm4h"
useUser()
```

### Ingest Behavior

Ingestion remains synchronous in Segment 7.

Expected upload flow:

* user selects PDF
* frontend enters loading state
* backend performs extraction + chunking + embeddings
* frontend refreshes document list after completion

Uploads may take multiple seconds depending on PDF size
and embedding generation latency.


## Segment 7 Complete — Document Dashboard (2026-05-24)

### Completed

* Added authenticated document dashboard
* Added PDF upload flow from frontend to backend ingest pipeline
* Added document cards and status badges
* Added workspace route navigation
* Added shared frontend API/types layer
* Added upload loading and error states

### Document List Source

Dashboard document listing now reads directly from Supabase
using the authenticated browser session.

RLS policies restrict documents to the logged-in user.

No backend `GET /documents` proxy endpoint is currently used
by the frontend dashboard.

### Upload Architecture

Frontend uploads PDFs through:

```txt id="’wini5e"
POST /ingest/upload
```

using:

```txt id="’wini5f"
x-user-id: <session user.id>
```

The backend ingest pipeline performs:

* PDF extraction
* chunking
* embeddings
* chunk insertion
* document status updates

### Verification

Verified end-to-end locally in browser:

* authenticated upload flow
* synchronous ingest completion
* document list refresh
* workspace navigation
* Supabase document/chunk persistence
* error handling for invalid uploads/backend failures


## Segment 8 Started — PDF Viewer Workspace (2026-05-25)

### Planned Features

* PDF rendering using `react-pdf` and `pdfjs-dist`
* Signed Supabase Storage URLs for authenticated PDF viewing
* Two-column workspace layout
* Left panel: PDF viewer
* Right panel: reserved for chat interface in Segment 9

### Storage Access Model

The `pdfs` bucket remains private.

Frontend access will use:

* authenticated Supabase session
* signed URLs with 1 hour TTL

Users may only read PDFs inside their own storage folder:

```txt id="’wini65"
{user_id}/{document_id}/source.pdf
```

### Workspace State Design

PDF page state will be controlled by the workspace parent component.

This allows future Segment 9 chat citations to trigger:

```ts id="’wini66"
onPageChange(pageNumber)
```

for citation-based page jumps.


## Segment 8 Complete — PDF Workspace Viewer (2026-05-25)

### Completed Features

* Workspace route:

  ```txt
  /workspace/[docId]
  ```

* Two-column workspace layout:

  * Left: PDF viewer
  * Right: placeholder chat panel for Segment 9

* Signed Supabase Storage URLs for authenticated PDF access

* `fetchDocumentById()` helper added

* PDF rendering using:

  * `react-pdf@9.1.1`
  * `pdfjs-dist@4.4.168`

### Worker Setup

PDF.js worker served from:

```txt
/public/pdf.worker.min.mjs
```

Worker configured client-side via:

```ts
pdfjs.GlobalWorkerOptions.workerSrc =
  "/pdf.worker.min.mjs";
```

### Storage Security

Applied authenticated read policy for private `pdfs` bucket:

* users may only access files under their own `user_id/` folder
* signed URLs use 1 hour expiration

### Rendering / Next.js Notes

Encountered compatibility issues with:

* Next.js 16
* react-pdf
* pdfjs-dist
* SSR evaluation

Final stable setup:

* dynamic import with:

  ```ts
  ssr: false
  ```
* dedicated `pdf-viewer-client.tsx`
* worker initialization inside `useEffect`
* webpack dev mode:

  ```bash
  npm run dev -- --webpack
  ```

Additional stability fixes:

* disabled text layer rendering
* disabled annotation layer rendering

### Verification

Verified:

* authenticated PDF viewing
* signed URL generation
* page rendering
* workspace navigation
* protected workspace route
* Supabase Storage access control


## Segment 9 Complete — Streaming Chat Workspace (2026-05-25)

### Completed Features

* Real-time streaming chat panel integrated into workspace view

* SSE frontend client for `/query/stream`

* Incremental token rendering during generation

* Source citation cards rendered beneath assistant responses

* Citation click → smooth PDF page navigation

* Shared workspace state:

  * current PDF page
  * chat messages
  * citation navigation

### Frontend Streaming Architecture

Added:

* `streamQuery()` SSE parser in `frontend/lib/api.ts`
* `useStream()` hook with:

  * streaming state
  * AbortController support
  * error handling

SSE event handling:

1. `sources`
2. `token`
3. `done`

### Chat UI

Added:

* `ChatPanel`
* `SourceCard`

Features:

* user / assistant bubbles
* streaming placeholder state
* disabled send during streaming
* auto-scroll to newest messages
* source previews with page references

### PDF Citation Navigation

PDF pages now include:

```txt id="gsgmgg"
data-page-number
```

Citation clicks:

* update shared `currentPage`
* smoothly scroll viewer to referenced page

### Verification

Verified:

* streaming answers render incrementally
* sources appear correctly
* source clicks jump to correct PDF page
* workspace remains responsive during streaming
* authenticated querying works end-to-end
* SSE parsing stable in browser

## Segment 10 Complete — Polish, Error States, and Logging (YYYY-MM-DD)

### Completed
- Shared LoadingState / ErrorState components
- Dashboard processing poll (3s) + non-clickable processing/failed cards
- Workspace processing poll + message history load
- Chat empty state + stream error on assistant bubble
- Backend timing logs: ingest_upload, retrieve_chunks, stream_retrieve, stream_generate
- Mobile stacked workspace layout (lg: side-by-side)

### Verified
- [ ] Upload failure shows error on dashboard
- [ ] Processing doc auto-updates to ready without refresh
- [ ] Workspace reload shows prior messages
- [ ] Stream failure shows error in chat
- [ ] PDF error shows retry
- [ ] Railway logs show duration_ms lines
- [ ] iPhone-width layout acceptable

## Segment 11 Complete

Date: 2026-05-30

### Deliverables

* Public project README
* Architecture diagram
* Documentation assets structure
* Deployment verification checklist
* Repository branding updated to trace

### Deployment Targets

Frontend:
https://use-trace.vercel.app

Backend:
https://rag-app-production-6307.up.railway.app

### Verification Checklist

* [ ] Signup
* [ ] Login
* [ ] Dashboard load
* [ ] PDF upload
* [ ] Processing completion
* [ ] Workspace open
* [ ] Streaming response generation
* [ ] Source citation display
* [ ] Citation page navigation
* [ ] Logout

### Current Limitations

* PDF-only ingestion
* No OCR support
* Synchronous document processing
* No multi-document retrieval

### Notes

Segment 11 focused exclusively on documentation, architecture visibility, deployment verification, and repository presentation. No product features, API contracts, schema definitions, or retrieval logic were modified.
