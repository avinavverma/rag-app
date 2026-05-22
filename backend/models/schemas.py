from uuid import UUID
from typing import Literal

from pydantic import BaseModel

class HealthResponse(BaseModel):
    status: str


class UploadResponse(BaseModel):
    document_id: UUID
    status: Literal["processing"]


class PageText(BaseModel):
    page_number: int
    text: str