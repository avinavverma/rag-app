from uuid import UUID

from fastapi import (
    APIRouter,
    Header,
    HTTPException,
    Response,
    status,
)

from db.supabase import supabase

from services.storage import (
    BUCKET,
    delete_paths,
)

router = APIRouter(prefix="/documents", tags=["documents"])


@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_document(
    document_id: str,
    x_user_id: str = Header(
        ...,
        alias="x-user-id",
    ),
):
    try:
        user_id = str(UUID(x_user_id))
        doc_id = str(UUID(document_id))
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid UUID in x-user-id or document_id",
        )

    doc_response = (
        supabase.table("documents")
        .select("id, user_id, file_path")
        .eq("id", doc_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    if not doc_response.data:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    file_path = (
        doc_response.data.get("file_path")
        or ""
    )

    base_path = (
        file_path.rsplit("/", 1)[0]
        if "/" in file_path
        else f"{user_id}/{doc_id}"
    )

    delete_paths(
        BUCKET,
        [
            f"{base_path}/source.pdf",
            f"{base_path}/pages.json",
        ],
    )

    (
        supabase.table("documents")
        .delete()
        .eq("id", doc_id)
        .eq("user_id", user_id)
        .execute()
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )
