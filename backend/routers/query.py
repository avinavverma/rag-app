import json
import logging
import time

from uuid import UUID

from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import StreamingResponse

from db.supabase import supabase

from models.schemas import (
    RetrieveRequest,
    RetrieveResponse,
    StreamRequest,
)

from services.generator import stream_answer
from services.messages_db import save_conversation_turn
from services.prompt_builder import (
    build_prompt,
    SYSTEM_INSTRUCTION,
)
from services.retriever import retrieve_chunks
from services.timing import timed

router = APIRouter(prefix="/query", tags=["query"])

logger = logging.getLogger("margin")


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


def _preview(text: str, max_len: int = 200) -> str:
    return (
        text
        if len(text) <= max_len
        else text[:max_len] + "..."
    )


@router.post(
    "/retrieve",
    response_model=RetrieveResponse,
)
async def retrieve(
    body: RetrieveRequest,
    x_user_id: str = Header(
        ...,
        alias="x-user-id",
    ),
):
    try:
        user_id = str(UUID(x_user_id))
        document_id = str(
            UUID(body.document_id)
        )
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid UUID in x-user-id or document_id",
        )

    doc = (
        supabase.table("documents")
        .select("id, status")
        .eq("id", document_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    if not doc.data:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    if doc.data.get("status") != "ready":
        raise HTTPException(
            status_code=400,
            detail="Document is not ready for queries",
        )

    if not body.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty",
        )

    with timed(
        "query_retrieve",
        document_id=document_id,
        user_id=user_id,
    ):
        chunks = retrieve_chunks(
            body.question,
            document_id,
            user_id,
        )

    return RetrieveResponse(chunks=chunks)


@router.post("/stream")
async def stream_query(
    body: StreamRequest,
    x_user_id: str = Header(
        ...,
        alias="x-user-id",
    ),
):
    try:
        user_id = str(UUID(x_user_id))
        document_id = str(
            UUID(body.document_id)
        )
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid UUID in x-user-id or document_id",
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
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    if doc.data.get("status") != "ready":
        raise HTTPException(
            status_code=400,
            detail="Document is not ready for queries",
        )

    if not body.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty",
        )

    retrieve_start = time.perf_counter()

    chunks = retrieve_chunks(
        body.question,
        document_id,
        user_id,
    )

    retrieve_ms = (
        time.perf_counter() - retrieve_start
    ) * 1000

    logger.info(
        "stream_retrieve completed duration_ms=%.1f document_id=%s",
        retrieve_ms,
        document_id,
    )

    sources_payload = [
        {
            "chunk_id": c.chunk_id,
            "page_number": c.page_number,
            "content": _preview(c.content),
            "similarity": c.similarity,
        }
        for c in chunks
    ]

    def event_generator():
        yield _sse(
            {
                "type": "sources",
                "sources": sources_payload,
            }
        )

        prompt = build_prompt(
            body.question,
            chunks,
        )

        full_answer: list[str] = []

        gen_start = time.perf_counter()

        try:
            for token in stream_answer(
                prompt,
                SYSTEM_INSTRUCTION,
            ):
                full_answer.append(token)

                yield _sse(
                    {
                        "type": "token",
                        "token": token,
                    }
                )

        except RuntimeError as e:
            logger.exception(
                "stream_generate failed document_id=%s",
                document_id,
            )

            yield _sse(
                {
                    "type": "token",
                    "token": f"\n\n[Generation failed: {e}]",
                }
            )

            yield _sse({"type": "done"})
            return

        gen_ms = (
            time.perf_counter() - gen_start
        ) * 1000

        logger.info(
            "stream_generate completed duration_ms=%.1f document_id=%s",
            gen_ms,
            document_id,
        )

        answer_text = "".join(
            full_answer
        )

        save_conversation_turn(
            user_id,
            document_id,
            body.question,
            answer_text,
            sources_payload,
        )

        yield _sse({"type": "done"})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
