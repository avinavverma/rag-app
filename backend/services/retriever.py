from db.supabase import supabase
from services.embedder import embed_query
from services.timing import timed
from models.schemas import RetrievedChunk

TOP_K = 5


def retrieve_chunks(
    question: str,
    document_id: str,
    user_id: str,
    top_k: int = TOP_K,
) -> list[RetrievedChunk]:

    with timed(
        "retrieve_chunks",
        document_id=document_id,
        user_id=user_id,
    ):
        query_embedding = embed_query(question)

        response = supabase.rpc(
            "match_chunks",
            {
                "query_embedding": query_embedding,
                "match_document_id": document_id,
                "match_user_id": user_id,
                "match_count": top_k,
            },
        ).execute()

        rows = response.data or []

        return [
            RetrievedChunk(
                chunk_id=row["id"],
                page_number=row["page_number"],
                content=row["content"],
                similarity=float(row["similarity"]),
            )
            for row in rows
        ]