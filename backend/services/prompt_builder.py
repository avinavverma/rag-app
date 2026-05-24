from models.schemas import RetrievedChunk

SYSTEM_INSTRUCTION = """You are a document study assistant. Answer ONLY using the provided context.
If the answer is not in the context, say you cannot find it in the document.
When you use information from a passage, cite the page number in parentheses, e.g. (Page 3).
Be concise and accurate."""

def build_prompt(question: str, chunks: list[RetrievedChunk]) -> str:
    if not chunks:
        context_block = "No context retrieved."
    else:
        parts = []
        for c in chunks:
            parts.append(f"[Page {c.page_number}]\n{c.content}")
        context_block = "\n\n---\n\n".join(parts)

    return f"""Context from the document:

{context_block}

Question: {question}

Answer:"""

# tune this after testing with the actual LLM responses - may want to add more explicit instructions on how to use the context, or how to format the answer