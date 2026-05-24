# from openai import OpenAI
# from dotenv import load_dotenv

# load_dotenv()

# BATCH_SIZE = 64

# def embed_texts(texts: list[str]) -> list[list[float]]:
#     if not texts:
#         return []

#     client = OpenAI()  # reads OPENAI_API_KEY from env
#     all_embeddings: list[list[float]] = []

#     for i in range(0, len(texts), BATCH_SIZE):
#         batch = texts[i : i + BATCH_SIZE]
#         response = client.embeddings.create(
#             model="text-embedding-3-small",
#             input=batch,
#         )
#         batch_embeddings = [d.embedding for d in response.data]
#         all_embeddings.extend(batch_embeddings)

#     return all_embeddings

# import random


# EMBEDDING_DIMENSION = 1536


# def embed_texts(texts: list[str]) -> list[list[float]]:
#     """
#     Temporary mock embeddings.

#     Returns random 1536-dimensional vectors so the
#     ingestion/vector pipeline can be fully tested
#     without OpenAI API quota.
#     """

#     if not texts:
#         return []

#     return [
#         [random.random() for _ in range(EMBEDDING_DIMENSION)]
#         for _ in texts
#     ]

# backend/services/embedder.py
from typing import List
import numpy as np
from sentence_transformers import SentenceTransformer
from services.embedding_config import EMBEDDING_MODEL, EMBEDDING_DIMENSION

_model: SentenceTransformer | None = None

def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBEDDING_MODEL)
    return _model

def warm_up() -> None:
    # load model into memory (call at startup to avoid first-request latency)
    _get_model()

def embed_texts(texts: List[str]) -> List[List[float]]:
    """
    Encode list[str] -> list[list[float]] using BGE model.
    Returns normalized vectors of EMBEDDING_DIMENSION floats.
    """
    if not texts:
        return []

    model = _get_model()
    vectors = model.encode(texts, normalize_embeddings=True)
    # Ensure dimension correctness
    if vectors.shape[1] != EMBEDDING_DIMENSION:
        raise RuntimeError(f"Embedding dimension {vectors.shape[1]} != expected {EMBEDDING_DIMENSION}")
    return [v.tolist() for v in vectors]
