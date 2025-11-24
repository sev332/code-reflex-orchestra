-- Phase 2B: Create documentation_chunks table for RAG
-- This table stores indexed documentation with vector embeddings

CREATE TABLE IF NOT EXISTS documentation_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL, -- 'unified_textbook' | 'aimos' | 'knowledge_base'
  chapter TEXT,
  section TEXT,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 or similar embedding dimensions
  metadata JSONB DEFAULT '{}'::jsonb,
  token_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_documentation_chunks_embedding 
ON documentation_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for source filtering
CREATE INDEX IF NOT EXISTS idx_documentation_chunks_source 
ON documentation_chunks (source);

-- Create full-text search index
CREATE INDEX IF NOT EXISTS idx_documentation_chunks_content_fts 
ON documentation_chunks 
USING gin(to_tsvector('english', content));

-- Enable RLS
ALTER TABLE documentation_chunks ENABLE ROW LEVEL SECURITY;

-- Public read access for all documentation
CREATE POLICY "Public can read documentation chunks"
ON documentation_chunks
FOR SELECT
USING (true);

-- Only service role can insert/update documentation
CREATE POLICY "Service role can manage documentation chunks"
ON documentation_chunks
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON TABLE documentation_chunks IS 'Stores indexed documentation chunks with vector embeddings for RAG search';
COMMENT ON COLUMN documentation_chunks.embedding IS 'Vector embedding for semantic similarity search';
COMMENT ON COLUMN documentation_chunks.source IS 'Source document: unified_textbook, aimos, or knowledge_base';
COMMENT ON COLUMN documentation_chunks.content IS 'Text content of the chunk, max ~1000 tokens';