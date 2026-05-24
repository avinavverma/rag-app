# backend/routers/query.py
from uuid import UUID
from fastapi import APIRouter, Header, HTTPException
from models.schemas import RetrieveRequest, RetrieveResponse
from services.retriever import retrieve_chunks
from db.supabase import supabase

import json
from fastapi.responses import StreamingResponse
from models.schemas import StreamRequest
from services.prompt_builder import build_prompt, SYSTEM_INSTRUCTION
from services.generator import stream_answer
from services.messages_db import save_conversation_turn

router = APIRouter(prefix="/query", tags=["query"])

def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"

def _preview(text: str, max_len: int = 200) -> str:
    return text if len(text) <= max_len else text[:max_len] + "..."

@router.post("/retrieve", response_model=RetrieveResponse)
async def retrieve(
    body: RetrieveRequest,
    x_user_id: str = Header(..., alias="x-user-id"),
):
    try:
        user_id = str(UUID(x_user_id))
        document_id = str(UUID(body.document_id))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID in x-user-id or document_id")

    doc = (
        supabase.table("documents")
        .select("id, status")
        .eq("id", document_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    if not doc.data:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.data.get("status") != "ready":
        raise HTTPException(status_code=400, detail="Document is not ready for queries")

    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    chunks = retrieve_chunks(body.question, document_id, user_id)
    return RetrieveResponse(chunks=chunks)


@router.post("/stream")
async def stream_query(body: StreamRequest, x_user_id: str = Header(..., alias="x-user-id")):

    try:
        user_id = str(UUID(x_user_id))
        document_id = str(UUID(body.document_id))
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid UUID in x-user-id or document_id"
        )

    doc = (
        supabase.table("documents")
        .select("id, status")
        .eq("id", document_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    if not doc or not doc.data:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.data.get("status") != "ready":
        raise HTTPException(
            status_code=400,
            detail="Document is not ready for queries"
        )

    if not body.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty"
        )
    
    chunks = retrieve_chunks(body.question, document_id, user_id)

    sources_payload = [
        {
            "chunk_id": c.chunk_id,
            "page_number": c.page_number,       # always full int — never truncate
            "content": _preview(c.content),     # preview only
            "similarity": c.similarity,
        }
        for c in chunks
    ]

    def event_generator():  # SYNC — not async
        yield _sse({"type": "sources", "sources": sources_payload})

        prompt = build_prompt(body.question, chunks)
        full_answer: list[str] = []
        try:
            for token in stream_answer(prompt, SYSTEM_INSTRUCTION):
                full_answer.append(token)
                yield _sse({"type": "token", "token": token})
        except RuntimeError as e:
            yield _sse({"type": "token", "token": f"\n[Error: {e}]"})

            yield _sse({"type": "done"})
            return

        answer_text = "".join(full_answer)
        save_conversation_turn(user_id, document_id, body.question, answer_text, sources_payload)

        yield _sse({"type": "done"})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )