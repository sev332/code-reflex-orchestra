-- Create comprehensive database schema for WisdomNET AGI (without vector extension)

-- Agent definitions and states
CREATE TABLE public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
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
  type TEXT NOT NULL,
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

-- Memory system for semantic storage (without vector for now)
CREATE TABLE public.memory_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  entry_type TEXT NOT NULL DEFAULT 'knowledge' CHECK (entry_type IN ('knowledge', 'conversation', 'code', 'insight', 'pattern', 'error')),
  source TEXT NOT NULL,
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
  human_participant_id UUID,
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
  event_type TEXT NOT NULL,
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

-- Create policies for public access
CREATE POLICY "Public access for agents" ON public.agents USING (true);
CREATE POLICY "Public access for tasks" ON public.tasks USING (true);
CREATE POLICY "Public access for memory_entries" ON public.memory_entries USING (true);
CREATE POLICY "Public access for conversations" ON public.conversations USING (true);
CREATE POLICY "Public access for messages" ON public.messages USING (true);
CREATE POLICY "Public access for system_events" ON public.system_events USING (true);
CREATE POLICY "Public access for prompt_templates" ON public.prompt_templates USING (true);
CREATE POLICY "Public access for hil_interventions" ON public.hil_interventions USING (true);

-- Create indexes for performance
CREATE INDEX idx_agents_status ON public.agents(status);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_assigned_agent ON public.tasks(assigned_agent_id);
CREATE INDEX idx_memory_entries_type ON public.memory_entries(entry_type);
CREATE INDEX idx_conversations_session ON public.conversations(session_id);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_system_events_type ON public.system_events(event_type);

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

-- Insert initial system agents
INSERT INTO public.agents (name, role, capabilities, configuration) VALUES
('Orchestrator-Prime', 'orchestrator', ARRAY['task_management', 'agent_coordination', 'system_optimization'], '{"max_concurrent_tasks": 10}'),
('Research-Alpha', 'researcher', ARRAY['web_search', 'document_analysis', 'data_synthesis'], '{"search_depth": "comprehensive"}'),
('Code-Beta', 'coder', ARRAY['code_generation', 'debugging', 'optimization'], '{"languages": ["typescript", "python"]}'),
('Analyst-Gamma', 'analyst', ARRAY['pattern_recognition', 'performance_analysis'], '{"analysis_depth": "deep"}'),
('Memory-Delta', 'memory_manager', ARRAY['knowledge_indexing', 'semantic_search'], '{"embedding_model": "all-MiniLM-L6-v2"}'),
('HIL-Monitor', 'hil_supervisor', ARRAY['human_interaction', 'safety_monitoring'], '{"intervention_threshold": 0.95}');

-- Insert initial prompt templates
INSERT INTO public.prompt_templates (name, template, variables) VALUES
('agent_task_assignment', 'You are {agent_role}. Task: {task_description}. Context: {context}. Capabilities: {capabilities}.', ARRAY['agent_role', 'task_description', 'context', 'capabilities']),
('memory_consolidation', 'Consolidate these entries: {entries}. Extract key insights.', ARRAY['entries']),
('hil_intervention_request', 'INTERVENTION REQUIRED. Agent: {agent_name}, Task: {task_title}, Reason: {reason}', ARRAY['agent_name', 'task_title', 'reason']);