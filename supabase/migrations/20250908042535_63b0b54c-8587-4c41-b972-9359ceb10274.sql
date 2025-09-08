-- Create tables for AI self-management system

-- Theory validations table
CREATE TABLE public.theory_validations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  theory TEXT NOT NULL,
  claims TEXT[] NOT NULL DEFAULT '{}',
  mathematical_expressions TEXT[] DEFAULT '{}',
  required_sources TEXT[] DEFAULT '{}',
  validation_methods TEXT[] NOT NULL DEFAULT '{}',
  priority INTEGER NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'pending',
  validation_results JSONB DEFAULT '{}',
  confidence_score NUMERIC DEFAULT 0,
  evidence JSONB DEFAULT '[]',
  sources TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- AI context memory table  
CREATE TABLE public.ai_context_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  context_type TEXT NOT NULL,
  content JSONB NOT NULL,
  importance INTEGER NOT NULL DEFAULT 5,
  last_accessed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  access_frequency INTEGER NOT NULL DEFAULT 1,
  related_memories UUID[] DEFAULT '{}',
  validation_status TEXT NOT NULL DEFAULT 'unvalidated',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Background agents table
CREATE TABLE public.background_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle',
  current_task_id UUID REFERENCES public.theory_validations(id),
  capabilities TEXT[] NOT NULL DEFAULT '{}',
  theories_validated INTEGER DEFAULT 0,
  accuracy_rate NUMERIC DEFAULT 0,
  avg_processing_time INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Self audit logs table
CREATE TABLE public.ai_self_audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  validation_accuracy NUMERIC NOT NULL,
  theory_success_rate NUMERIC NOT NULL,
  context_efficiency NUMERIC NOT NULL,
  improvement_suggestions TEXT[] DEFAULT '{}',
  metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.theory_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_context_memory ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.background_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_self_audits ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (AI system access)
CREATE POLICY "Public access for theory_validations" ON public.theory_validations FOR ALL USING (true);
CREATE POLICY "Public access for ai_context_memory" ON public.ai_context_memory FOR ALL USING (true);
CREATE POLICY "Public access for background_agents" ON public.background_agents FOR ALL USING (true);
CREATE POLICY "Public access for ai_self_audits" ON public.ai_self_audits FOR ALL USING (true);

-- Create triggers for updated_at columns
CREATE TRIGGER update_theory_validations_updated_at
  BEFORE UPDATE ON public.theory_validations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_context_memory_updated_at
  BEFORE UPDATE ON public.ai_context_memory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_background_agents_updated_at
  BEFORE UPDATE ON public.background_agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();