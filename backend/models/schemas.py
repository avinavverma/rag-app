from uuid import UUID
from typing import Literal, Optional

from pydantic import BaseModel

class HealthResponse(BaseModel):
    status: str


class UploadResponse(BaseModel):
    document_id: str
    status: Literal["processing", "ready"]


class PageText(BaseModel):
    page_number: int
    text: str


class ChunkRecord(BaseModel):
    content: str
    page_number: int
    chunk_index: int
    char_start: int
    char_end: int
    embedding: Optional[list[float]] = None

class RetrieveRequest(BaseModel):
    question: str
    document_id: str

class RetrievedChunk(BaseModel):
    chunk_id: str
    page_number: int
    content: str
    similarity: float

class RetrieveResponse(BaseModel):
    chunks: list[RetrievedChunk]