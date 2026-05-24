# backend/routers/query.py
from uuid import UUID
from fastapi import APIRouter, Header, HTTPException
from models.schemas import RetrieveRequest, RetrieveResponse
from services.retriever import retrieve_chunks
from db.supabase import supabase

router = APIRouter(prefix="/query", tags=["query"])

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