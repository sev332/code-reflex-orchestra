-- Enable pgvector extension for semantic embeddings
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- AIM-OS Memory Foundation (CMC) Schema
-- Hierarchical memory with RS-based retrieval and temporal decay

-- Enhanced memory storage with RS components
CREATE TABLE IF NOT EXISTS public.cmc_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('short', 'medium', 'large', 'super_index')),
  token_count INTEGER NOT NULL,
  
  -- RS Score Components
  quality_score DECIMAL(5,4), -- QS = 0.4×Completeness + 0.3×Density + 0.3×Relevance
  index_depth_score DECIMAL(5,4), -- IDS = normalized log depth × connection density
  dependency_delta DECIMAL(5,4), -- DD = cosine similarity × change magnitude × time decay
  retrieval_score DECIMAL(5,4), -- RS = QS × IDS × (1 - DD)
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  parent_tags TEXT[] DEFAULT '{}',
  semantic_embedding vector(1536), -- for similarity search
  importance DECIMAL(3,2) DEFAULT 0.5,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Compression state
  is_compressed BOOLEAN DEFAULT false,
  compression_ratio DECIMAL(4,3),
  original_token_count INTEGER,
  head_span INTEGER, -- tokens preserved at start
  tail_span INTEGER, -- tokens preserved at end
  
  -- Provenance
  source TEXT,
  user_id UUID,
  session_id UUID,
  
  CONSTRAINT valid_tier_size CHECK (
    (tier = 'short' AND token_count <= 200) OR
    (tier = 'medium' AND token_count <= 800) OR
    (tier = 'large' AND token_count >= 800) OR
    (tier = 'super_index')
  )
);

-- Tag graph for semantic relationships
CREATE TABLE IF NOT EXISTS public.cmc_tag_graph (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag TEXT NOT NULL UNIQUE,
  parent_tag TEXT,
  priority DECIMAL(3,2) DEFAULT 0.5,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ DEFAULT now(),
  decay_tau DECIMAL(5,2) DEFAULT 0.95, -- exponential decay parameter
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reasoning chains (APOE traces)
CREATE TABLE IF NOT EXISTS public.cmc_reasoning_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id TEXT NOT NULL UNIQUE,
  user_query TEXT NOT NULL,
  
  -- Chain execution
  steps JSONB NOT NULL, -- [{node, input, output, duration, confidence}]
  agents JSONB NOT NULL, -- [{agent, role, actions}]
  token_budget INTEGER NOT NULL,
  tokens_used INTEGER NOT NULL,
  
  -- Results
  final_answer TEXT NOT NULL,
  support JSONB NOT NULL, -- [{cid, quote, score}]
  assumptions TEXT[] DEFAULT '{}',
  confidence DECIMAL(3,2),
  
  -- Verification
  provenance_coverage DECIMAL(3,2), -- κ (kappa)
  semantic_entropy DECIMAL(5,4),
  logit_variance DECIMAL(5,4),
  
  -- Audit
  healing_events JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  duration_ms INTEGER,
  
  user_id UUID,
  session_id UUID
);

-- Evidence graph (SEG) - shared provenance
CREATE TABLE IF NOT EXISTS public.cmc_evidence_graph (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id TEXT NOT NULL, -- CID for tamper detection
  content TEXT NOT NULL,
  content_type TEXT NOT NULL, -- 'document', 'code', 'conversation', 'web'
  source TEXT NOT NULL,
  
  -- Metadata
  author TEXT,
  created_date TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  
  -- Usage tracking
  citation_count INTEGER DEFAULT 0,
  last_cited_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cmc_memories_tier ON public.cmc_memories(tier);
CREATE INDEX IF NOT EXISTS idx_cmc_memories_rs ON public.cmc_memories(retrieval_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_cmc_memories_tags ON public.cmc_memories USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_cmc_memories_accessed ON public.cmc_memories(last_accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_cmc_memories_hash ON public.cmc_memories(content_hash);
CREATE INDEX IF NOT EXISTS idx_cmc_tag_graph_tag ON public.cmc_tag_graph(tag);
CREATE INDEX IF NOT EXISTS idx_cmc_tag_graph_parent ON public.cmc_tag_graph(parent_tag);
CREATE INDEX IF NOT EXISTS idx_cmc_reasoning_trace ON public.cmc_reasoning_chains(trace_id);
CREATE INDEX IF NOT EXISTS idx_cmc_evidence_cid ON public.cmc_evidence_graph(content_id);

-- Vector similarity index
CREATE INDEX IF NOT EXISTS idx_cmc_memories_embedding ON public.cmc_memories 
USING ivfflat (semantic_embedding vector_cosine_ops) WITH (lists = 100);

-- Update trigger
CREATE TRIGGER update_cmc_memories_updated_at
  BEFORE UPDATE ON public.cmc_memories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies (allow all for now, refine later based on auth needs)
ALTER TABLE public.cmc_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmc_tag_graph ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmc_reasoning_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cmc_evidence_graph ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to cmc_memories" ON public.cmc_memories FOR ALL USING (true);
CREATE POLICY "Allow all access to cmc_tag_graph" ON public.cmc_tag_graph FOR ALL USING (true);
CREATE POLICY "Allow all access to cmc_reasoning_chains" ON public.cmc_reasoning_chains FOR ALL USING (true);
CREATE POLICY "Allow all access to cmc_evidence_graph" ON public.cmc_evidence_graph FOR ALL USING (true);