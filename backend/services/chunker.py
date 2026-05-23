from langchain_text_splitters import RecursiveCharacterTextSplitter

from models.schemas import ChunkRecord, PageText


splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
)


def chunk_document(pages: list[PageText]) -> list[ChunkRecord]:
    chunks: list[ChunkRecord] = []

    global_chunk_index = 0

    for page in pages:
        if not page.text.strip():
            continue

        text_chunks = splitter.split_text(page.text)

        search_from = 0

        for piece in text_chunks:
            piece = piece.strip()

            if not piece:
                continue

            char_start = page.text.find(piece, search_from)

            if char_start == -1:
                char_start = search_from

            char_end = char_start + len(piece)

            chunks.append(
                ChunkRecord(
                    content=piece,
                    page_number=page.page_number,
                    chunk_index=global_chunk_index,
                    char_start=char_start,
                    char_end=char_end,
                )
            )

            global_chunk_index += 1

            search_from = char_start + 1

    return chunks