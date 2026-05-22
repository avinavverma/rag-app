from db.supabase import supabase


BUCKET = "pdfs"


def upload_bytes(
    bucket: str,
    path: str,
    data: bytes,
    content_type: str,
):
    return supabase.storage.from_(bucket).upload(
        path=path,
        file=data,
        file_options={
            "content-type": content_type
        },
    )