// Production-ready WisdomNET Types
export interface Agent {
  id: string;
  name: string;
  role: 'orchestrator' | 'researcher' | 'coder' | 'analyst' | 'memory_manager' | 'hil_supervisor';
  capabilities: string[];
  current_task_id?: string;
  status: 'active' | 'idle' | 'critical' | 'experimental' | 'error' | 'paused';
  performance_score: number;
  configuration: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_active_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: string;
  priority: number;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  assigned_agent_id?: string;
  parent_task_id?: string;
  dependencies: string[];
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  progress: number;
  estimated_duration_ms?: number;
  actual_duration_ms?: number;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface MemoryEntry {
  id: string;
  content: string;
  entry_type: 'knowledge' | 'conversation' | 'code' | 'insight' | 'pattern' | 'error';
  source: string;
  source_id?: string;
  tags: string[];
  metadata: Record<string, any>;
  importance_score: number;
  access_count: number;
  created_at: string;
  last_accessed_at: string;
}

export interface Conversation {
  id: string;
  session_id: string;
  agent_id?: string;
  human_participant_id?: string;
  title?: string;
  context: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'agent' | 'system';
  content: string;
  message_type: 'text' | 'code' | 'task' | 'insight' | 'error';
  metadata: Record<string, any>;
  created_at: string;
}

export interface SystemEvent {
  id: string;
  event_type: string;
  agent_id?: string;
  task_id?: string;
  severity: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description?: string;
  data: Record<string, any>;
  created_at: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  version: number;
  template: string;
  variables: string[];
  performance_metrics: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HILIntervention {
  id: string;
  agent_id?: string;
  task_id?: string;
  intervention_type: 'pause' | 'redirect' | 'override' | 'approval_required' | 'emergency_stop';
  reason: string;
  human_input?: string;
  resolution?: string;
  status: 'pending' | 'approved' | 'rejected' | 'resolved';
  created_at: string;
  resolved_at?: string;
}

export interface AgentDecision {
  confidence: number;
  reasoning: string;
  alternatives: Array<{
    action: string;
    confidence: number;
    risk: number;
  }>;
  requires_hil?: boolean;
}

export interface SystemMetrics {
  active_agents: number;
  pending_tasks: number;
  completed_tasks_24h: number;
  memory_entries: number;
  system_load: number;
  error_rate: number;
  hil_interventions_pending: number;
}

export interface AdvancedPromptContext {
  agent: Agent;
  task?: Task;
  conversation_history: Message[];
  relevant_memory: MemoryEntry[];
  system_state: SystemMetrics;
  dynamic_variables: Record<string, any>;
}