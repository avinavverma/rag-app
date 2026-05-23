from db.supabase import supabase
from models.schemas import ChunkRecord

def insert_chunks(document_id: str, user_id: str, chunks: list[ChunkRecord]) -> None:
    if not chunks:
        return

    rows = [
        {
            "document_id": document_id,
            "user_id": user_id,
            "content": chunk.content,
            "page_number": chunk.page_number,
            "chunk_index": chunk.chunk_index,
            "char_start": chunk.char_start,
            "char_end": chunk.char_end,
            "embedding": chunk.embedding,
        }
        for chunk in chunks
    ]

    batch_size = 50
    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        supabase.table("chunks").insert(batch).execute()