-- Dream Sessions table for persistent dream mode data
CREATE TABLE IF NOT EXISTS public.dream_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  focus TEXT NOT NULL DEFAULT 'General exploration',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'complete')),
  documents TEXT[] DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  total_explorations INTEGER DEFAULT 0,
  total_insights INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dream Insights table for storing discovered insights
CREATE TABLE IF NOT EXISTS public.dream_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES dream_sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  insight_type TEXT DEFAULT 'discovery' CHECK (insight_type IN ('discovery', 'improvement', 'pattern', 'warning', 'meta')),
  source_prompt TEXT,
  reasoning_style TEXT CHECK (reasoning_style IN ('analytical', 'creative', 'systematic', 'intuitive')),
  confidence REAL DEFAULT 0.5,
  frequency INTEGER DEFAULT 1,
  last_occurred_at TIMESTAMPTZ DEFAULT now(),
  tags TEXT[] DEFAULT '{}',
  linked_insights UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dream Reasoning Paths for multi-path comparison
CREATE TABLE IF NOT EXISTS public.dream_reasoning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES dream_sessions(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  context TEXT,
  status TEXT DEFAULT 'complete' CHECK (status IN ('exploring', 'complete', 'paused')),
  best_style TEXT,
  best_score REAL,
  branches JSONB NOT NULL DEFAULT '[]',
  insights_extracted TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prompt Usage Tracking for boredom mechanic
CREATE TABLE IF NOT EXISTS public.dream_prompt_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES dream_sessions(id) ON DELETE CASCADE,
  prompt_hash TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  times_selected INTEGER DEFAULT 1,
  last_selected_at TIMESTAMPTZ DEFAULT now(),
  decay_factor REAL DEFAULT 0.1,
  utility_score REAL DEFAULT 0.5,
  decayed_score REAL DEFAULT 0.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, prompt_hash)
);

-- Execution History for loop detection
CREATE TABLE IF NOT EXISTS public.dream_execution_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES dream_sessions(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  output_hash TEXT NOT NULL,
  input_preview TEXT,
  output_preview TEXT,
  execution_time_ms INTEGER,
  is_loop BOOLEAN DEFAULT false,
  loop_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hierarchical Index for document/memory organization
CREATE TABLE IF NOT EXISTS public.dream_hierarchical_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL UNIQUE,
  parent_path TEXT,
  node_type TEXT CHECK (node_type IN ('folder', 'document', 'section', 'insight')),
  content_id UUID,
  title TEXT NOT NULL,
  depth INTEGER DEFAULT 0,
  children_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dream Journal for reflection and learning
CREATE TABLE IF NOT EXISTS public.dream_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES dream_sessions(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('discovery', 'experiment', 'reflection', 'improvement', 'loop_break', 'insight')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  linked_docs TEXT[] DEFAULT '{}',
  linked_insights UUID[] DEFAULT '{}',
  reasoning_path_id UUID REFERENCES dream_reasoning_paths(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_dream_insights_session ON public.dream_insights(session_id);
CREATE INDEX idx_dream_insights_type ON public.dream_insights(insight_type);
CREATE INDEX idx_dream_insights_tags ON public.dream_insights USING GIN(tags);
CREATE INDEX idx_dream_paths_session ON public.dream_reasoning_paths(session_id);
CREATE INDEX idx_dream_prompt_usage_session ON public.dream_prompt_usage(session_id);
CREATE INDEX idx_dream_execution_session ON public.dream_execution_history(session_id);
CREATE INDEX idx_dream_execution_hashes ON public.dream_execution_history(input_hash, output_hash);
CREATE INDEX idx_dream_hierarchical_path ON public.dream_hierarchical_index(path);
CREATE INDEX idx_dream_hierarchical_parent ON public.dream_hierarchical_index(parent_path);
CREATE INDEX idx_dream_journal_session ON public.dream_journal(session_id);

-- Enable RLS
ALTER TABLE public.dream_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dream_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dream_reasoning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dream_prompt_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dream_execution_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dream_hierarchical_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dream_journal ENABLE ROW LEVEL SECURITY;

-- Policies for public access (this is an AI-internal system)
CREATE POLICY "Allow all access to dream_sessions" ON public.dream_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to dream_insights" ON public.dream_insights FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to dream_reasoning_paths" ON public.dream_reasoning_paths FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to dream_prompt_usage" ON public.dream_prompt_usage FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to dream_execution_history" ON public.dream_execution_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to dream_hierarchical_index" ON public.dream_hierarchical_index FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to dream_journal" ON public.dream_journal FOR ALL USING (true) WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_dream_sessions_updated_at
  BEFORE UPDATE ON public.dream_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dream_hierarchical_index_updated_at
  BEFORE UPDATE ON public.dream_hierarchical_index
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();