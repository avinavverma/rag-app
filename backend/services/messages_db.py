from db.supabase import supabase

def save_conversation_turn(
    user_id: str,
    document_id: str,
    question: str,
    answer: str,
    sources: list[dict],
) -> None:
    supabase.table("messages").insert([
        {
            "user_id": user_id,
            "document_id": document_id,
            "role": "user",
            "content": question,
            "sources": None,
        },
        {
            "user_id": user_id,
            "document_id": document_id,
            "role": "assistant",
            "content": answer,
            "sources": sources,
        },
    ]).execute()