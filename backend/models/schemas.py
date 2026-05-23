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