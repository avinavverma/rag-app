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


def delete_paths(
    bucket: str,
    paths: list[str],
):
    if not paths:
        return None

    return supabase.storage.from_(bucket).remove(
        paths
    )
