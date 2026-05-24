# scripts/check_embedding.py

import ast

from db.supabase import supabase

rows = (
    supabase
    .table("chunks")
    .select("id, embedding")
    .limit(1)
    .execute()
    .data
)

if not rows:
    print("no chunks found")
else:
    emb = rows[0]["embedding"]

    parsed = ast.literal_eval(emb)

    print("embedding type:", type(parsed))
    print("embedding length:", len(parsed))