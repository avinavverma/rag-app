# backend/services/embedding_config.py
import os

EMBEDDING_PROVIDER = os.getenv("EMBEDDING_PROVIDER", "sentence-transformers")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5")
EMBEDDING_DIMENSION = int(os.getenv("EMBEDDING_DIMENSION", "384"))