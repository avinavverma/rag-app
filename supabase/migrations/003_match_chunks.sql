-- 003_match_chunks.sql
-- Cosine similarity search over chunks.embedding (vector 384)

create or replace function match_chunks(
  query_embedding vector(384),
  match_document_id uuid,
  match_user_id uuid,
  match_count int default 5
)
returns table (
  id uuid,
  content text,
  page_number int,
  similarity float
)
language sql
stable
as $$
  select
    c.id,
    c.content,
    c.page_number,
    1 - (c.embedding <=> query_embedding) as similarity
  from chunks c
  where c.document_id = match_document_id
    and c.user_id = match_user_id
    and c.embedding is not null
  order by c.embedding <=> query_embedding
  limit match_count;
$$;