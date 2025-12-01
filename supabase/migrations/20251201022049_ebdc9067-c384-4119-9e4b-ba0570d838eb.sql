-- Fix function search_path warning
CREATE OR REPLACE FUNCTION match_documentation(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  source text,
  chapter text,
  section text,
  content text,
  similarity float
)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT
    documentation_chunks.id,
    documentation_chunks.source,
    documentation_chunks.chapter,
    documentation_chunks.section,
    documentation_chunks.content,
    1 - (documentation_chunks.embedding <=> query_embedding) AS similarity
  FROM documentation_chunks
  WHERE 1 - (documentation_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY documentation_chunks.embedding <=> query_embedding
  LIMIT match_count;
$$;

COMMENT ON FUNCTION match_documentation IS 'Searches documentation chunks using vector similarity with secure search_path';