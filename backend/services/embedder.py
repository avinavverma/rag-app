from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

BATCH_SIZE = 64

def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []

    client = OpenAI()  # reads OPENAI_API_KEY from env
    all_embeddings: list[list[float]] = []

    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i : i + BATCH_SIZE]
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=batch,
        )
        batch_embeddings = [d.embedding for d in response.data]
        all_embeddings.extend(batch_embeddings)

    return all_embeddings