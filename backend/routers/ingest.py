import json

from uuid import UUID

from fastapi import (
    APIRouter,
    File,
    Form,
    Header,
    HTTPException,
    UploadFile,
)

from db.supabase import supabase

from models.schemas import UploadResponse

from services.chunker import chunk_document
from services.chunks_db import insert_chunks
from services.embedder import embed_texts
from services.pdf_parser import extract_pages
from services.storage import (
    BUCKET,
    upload_bytes,
)
from services.timing import timed

router = APIRouter(
    prefix="/ingest",
    tags=["ingest"],
)


@router.post(
    "/upload",
    response_model=UploadResponse,
)
async def upload_document(
    x_user_id: str = Header(
        ...,
        alias="x-user-id",
    ),
    file: UploadFile = File(...),
    name: str = Form(...),
):
    try:
        user_id = str(UUID(x_user_id))
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid x-user-id",
        )

    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="File must be a PDF",
        )

    file_bytes = await file.read()

    if not file_bytes.startswith(b"%PDF"):
        raise HTTPException(
            status_code=400,
            detail="Invalid PDF file",
        )

    document_response = (
        supabase.table("documents")
        .insert(
            {
                "user_id": user_id,
                "name": name,
                "file_size": len(file_bytes),
                "status": "processing",
                "file_path": "",
            }
        )
        .execute()
    )

    document = document_response.data[0]

    document_id = document["id"]

    source_pdf_path = (
        f"{user_id}/{document_id}/source.pdf"
    )

    pages_json_path = (
        f"{user_id}/{document_id}/pages.json"
    )

    supabase.table("documents").update(
        {
            "file_path": source_pdf_path
        }
    ).eq(
        "id",
        document_id,
    ).execute()

    try:
        with timed(
            "ingest_upload",
            user_id=user_id,
            document_id=document_id,
        ):
            upload_bytes(
                bucket=BUCKET,
                path=source_pdf_path,
                data=file_bytes,
                content_type="application/pdf",
            )

            pages = extract_pages(file_bytes)

            if len(pages) == 0:
                raise HTTPException(
                    status_code=400,
                    detail="No pages extracted",
                )

            pages_json = json.dumps(
                {
                    "pages": [
                        page.model_dump()
                        for page in pages
                    ]
                }
            ).encode("utf-8")

            upload_bytes(
                bucket=BUCKET,
                path=pages_json_path,
                data=pages_json,
                content_type="application/json",
            )

            supabase.table("documents").update(
                {
                    "page_count": len(pages)
                }
            ).eq(
                "id",
                document_id,
            ).execute()

            chunk_records = chunk_document(
                pages
            )

            if not chunk_records:
                raise ValueError(
                    "No chunks generated from pages"
                )

            texts = [
                c.content
                for c in chunk_records
            ]

            embeddings = embed_texts(texts)

            for c, e in zip(
                chunk_records,
                embeddings,
            ):
                c.embedding = e

            insert_chunks(
                document_id,
                user_id,
                chunk_records,
            )

            supabase.table("documents").update(
                {
                    "status": "ready"
                }
            ).eq(
                "id",
                document_id,
            ).execute()

            return UploadResponse(
                document_id=document_id,
                status="ready",
            )

    except Exception as e:
        supabase.table("documents").update(
            {
                "status": "failed"
            }
        ).eq(
            "id",
            document_id,
        ).execute()

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )