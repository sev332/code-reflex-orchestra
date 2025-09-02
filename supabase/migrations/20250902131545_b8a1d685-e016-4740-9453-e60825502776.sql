-- Create comprehensive database schema for WisdomNET AGI

-- Agent definitions and states
CREATE TABLE public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'orchestrator', 'researcher', 'coder', 'analyst', etc.
  capabilities TEXT[] NOT NULL DEFAULT '{}',
  current_task_id UUID,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('active', 'idle', 'critical', 'experimental', 'error', 'paused')),
  performance_score DECIMAL(3,2) DEFAULT 0.5 CHECK (performance_score >= 0 AND performance_score <= 1),
  configuration JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Task management and orchestration
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'research', 'code', 'analyze', 'orchestrate', etc.
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'failed', 'cancelled')),
  assigned_agent_id UUID REFERENCES public.agents(id),
  parent_task_id UUID REFERENCES public.tasks(id),
  dependencies TEXT[] DEFAULT '{}',
  inputs JSONB DEFAULT '{}',
  outputs JSONB DEFAULT '{}',
  progress DECIMAL(3,2) DEFAULT 0 CHECK (progress >= 0 AND progress <= 1),
  estimated_duration_ms BIGINT,
  actual_duration_ms BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Vector memory system for semantic storage
CREATE TABLE public.memory_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(384), -- Using 384-dimensional embeddings
  entry_type TEXT NOT NULL DEFAULT 'knowledge' CHECK (entry_type IN ('knowledge', 'conversation', 'code', 'insight', 'pattern', 'error')),
  source TEXT NOT NULL, -- 'agent', 'user', 'system', 'external'
  source_id UUID,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  importance_score DECIMAL(3,2) DEFAULT 0.5 CHECK (importance_score >= 0 AND importance_score <= 1),
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Agent conversations and interactions
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  agent_id UUID REFERENCES public.agents(id),
  human_participant_id UUID, -- Future user reference
  title TEXT,
  context JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Individual messages in conversations
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'agent', 'system')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'code', 'task', 'insight', 'error')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- System events and activity logs
CREATE TABLE public.system_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'agent_action', 'task_update', 'error', 'performance', 'hil_intervention'
  agent_id UUID REFERENCES public.agents(id),
  task_id UUID REFERENCES public.tasks(id),
  severity TEXT DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Prompt templates and optimization
CREATE TABLE public.prompt_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  version INTEGER DEFAULT 1,
  template TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  performance_metrics JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Human-in-the-loop interventions
CREATE TABLE public.hil_interventions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id),
  task_id UUID REFERENCES public.tasks(id),
  intervention_type TEXT NOT NULL CHECK (intervention_type IN ('pause', 'redirect', 'override', 'approval_required', 'emergency_stop')),
  reason TEXT NOT NULL,
  human_input TEXT,
  resolution TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hil_interventions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (system operations)
CREATE POLICY "Public read access for agents" ON public.agents FOR SELECT USING (true);
CREATE POLICY "Public insert access for agents" ON public.agents FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for agents" ON public.agents FOR UPDATE USING (true);

CREATE POLICY "Public read access for tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Public insert access for tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for tasks" ON public.tasks FOR UPDATE USING (true);

CREATE POLICY "Public read access for memory_entries" ON public.memory_entries FOR SELECT USING (true);
CREATE POLICY "Public insert access for memory_entries" ON public.memory_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for memory_entries" ON public.memory_entries FOR UPDATE USING (true);

CREATE POLICY "Public read access for conversations" ON public.conversations FOR SELECT USING (true);
CREATE POLICY "Public insert access for conversations" ON public.conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for conversations" ON public.conversations FOR UPDATE USING (true);

CREATE POLICY "Public read access for messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Public insert access for messages" ON public.messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access for system_events" ON public.system_events FOR SELECT USING (true);
CREATE POLICY "Public insert access for system_events" ON public.system_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read access for prompt_templates" ON public.prompt_templates FOR SELECT USING (true);
CREATE POLICY "Public insert access for prompt_templates" ON public.prompt_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for prompt_templates" ON public.prompt_templates FOR UPDATE USING (true);

CREATE POLICY "Public read access for hil_interventions" ON public.hil_interventions FOR SELECT USING (true);
CREATE POLICY "Public insert access for hil_interventions" ON public.hil_interventions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for hil_interventions" ON public.hil_interventions FOR UPDATE USING (true);

-- Create indexes for performance
CREATE INDEX idx_agents_status ON public.agents(status);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_assigned_agent ON public.tasks(assigned_agent_id);
CREATE INDEX idx_memory_entries_type ON public.memory_entries(entry_type);
CREATE INDEX idx_memory_entries_importance ON public.memory_entries(importance_score DESC);
CREATE INDEX idx_conversations_session ON public.conversations(session_id);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_system_events_type ON public.system_events(event_type);
CREATE INDEX idx_system_events_severity ON public.system_events(severity);
CREATE INDEX idx_hil_interventions_status ON public.hil_interventions(status);

-- Create vector similarity search index (if vector extension is available)
CREATE INDEX ON public.memory_entries USING hnsw (embedding vector_cosine_ops);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prompt_templates_updated_at BEFORE UPDATE ON public.prompt_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial system agents
INSERT INTO public.agents (name, role, capabilities, configuration) VALUES
('Orchestrator-Prime', 'orchestrator', '{"task_management", "agent_coordination", "system_optimization", "decision_making"}', '{"max_concurrent_tasks": 10, "optimization_interval": 30000}'),
('Research-Alpha', 'researcher', '{"web_search", "document_analysis", "data_synthesis", "fact_verification"}', '{"search_depth": "comprehensive", "verification_threshold": 0.85}'),
('Code-Beta', 'coder', '{"code_generation", "debugging", "optimization", "testing", "refactoring"}', '{"languages": ["typescript", "python", "sql"], "quality_threshold": 0.9}'),
('Analyst-Gamma', 'analyst', '{"pattern_recognition", "performance_analysis", "predictive_modeling", "visualization"}', '{"analysis_depth": "deep", "confidence_threshold": 0.8}'),
('Memory-Delta', 'memory_manager', '{"knowledge_indexing", "semantic_search", "context_management", "memory_consolidation"}', '{"embedding_model": "all-MiniLM-L6-v2", "similarity_threshold": 0.75}'),
('HIL-Monitor', 'hil_supervisor', '{"human_interaction", "safety_monitoring", "intervention_management", "approval_workflows"}', '{"intervention_threshold": 0.95, "safety_checks": "enabled"});

-- Insert initial prompt templates
INSERT INTO public.prompt_templates (name, template, variables) VALUES
('agent_task_assignment', 'You are {agent_role}. Your task: {task_description}. Context: {context}. Use your capabilities: {capabilities}. Provide structured output.', '{"agent_role", "task_description", "context", "capabilities"}'),
('memory_consolidation', 'Consolidate these memory entries: {entries}. Extract key insights and patterns. Rate importance 0-1.', '{"entries"}'),
('hil_intervention_request', 'HUMAN INTERVENTION REQUIRED. Agent: {agent_name}, Task: {task_title}, Reason: {reason}. Approve/Reject/Modify?', '{"agent_name", "task_title", "reason"}'),
('system_optimization', 'Analyze system performance: {metrics}. Identify bottlenecks and suggest optimizations.', '{"metrics"}'),
('error_analysis', 'Error occurred: {error_details}. Agent: {agent_name}. Analyze cause and suggest resolution.', '{"error_details", "agent_name"}');