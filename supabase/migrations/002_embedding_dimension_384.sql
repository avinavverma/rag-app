-- 002_embedding_dimension_384.sql
-- Change embedding dimension to 384 for BGE-small and remove old vectors.

-- WARNING: this truncates the chunks table. Re-upload or re-embed documents after deploy.
TRUNCATE TABLE chunks;

ALTER TABLE chunks
  ALTER COLUMN embedding TYPE vector(384);