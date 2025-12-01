// 🔗 AIM-OS Core Types - Three Layer Architecture
// L1: Aether Chat (UI Layer)
// L2: APOE Orchestrator + Agent Swarm (Cognitive Layer)
// L3: CMC/HHNI/SEG/Agent Discord (Memory Layer)

// ===================== MODES =====================
// Global cognitive states for agents
export type AIMOSMode = 
  | 'GENERAL'    // Light, conversational, low-cost
  | 'PLANNING'   // Goals, milestones, structure
  | 'REASONING'  // Deep logic, proofs, comparisons  
  | 'DEBUGGING'  // Error-hunting, adversarial checking
  | 'EXECUTION'  // Doing the work (code, tools, edits)
  | 'REVIEW'     // Summarizing, QA, integration
  | 'LEARNING';  // Distilling patterns into policies

export interface ModeConfig {
  mode: AIMOSMode;
  contextPriority: 'session' | 'user' | 'global';
  strictness: number; // 0-1, how strict/exploratory
  parallelism: number; // How many parallel tool calls allowed
  toolUsage: 'minimal' | 'moderate' | 'heavy';
}

// ===================== AGENT TAXONOMY =====================
export type AgentClass = 'front_chat' | 'domain_specialist' | 'subspecialist' | 'meta';

export type AgentDomain = 
  | 'orchestration' | 'memory' | 'research' | 'code' | 'devops'
  | 'ux' | 'ethics' | 'documentation' | 'security' | 'analysis';

export type AgentCapability = 
  | 'PROMPT_ENGINEERING' | 'TOPOLOGY_ANALYSIS' | 'CODE_SYNTHESIS'
  | 'MEMORY_MANAGEMENT' | 'EVIDENCE_GATHERING' | 'VERIFICATION'
  | 'TASK_DECOMPOSITION' | 'CONTEXT_RETRIEVAL' | 'HYPOTHESIS_GENERATION'
  | 'CRITICAL_ANALYSIS' | 'KNOWLEDGE_SYNTHESIS' | 'META_OBSERVATION';

export interface AIMOSAgent {
  agent_id: string;
  name: string;
  class: AgentClass;
  domain: AgentDomain;
  current_mode: AIMOSMode;
  capabilities: AgentCapability[];
  threads: string[]; // Thread IDs this agent follows
  context_limits: number; // Max tokens hot
  priority: number; // Dynamic importance
  status: 'ACTIVE' | 'IDLE' | 'WORKING' | 'THROTTLED' | 'COOLDOWN';
  tasksCompleted: number;
  currentTask?: string;
}

// ===================== AGENT DISCORD =====================
// Message types in agent communication
export type DiscordMessageType = 
  | 'THOUGHT'       // Internal reasoning snippet
  | 'DECISION'      // Commit point
  | 'TASK_PROPOSE'  // Proposing a task
  | 'TASK_ACCEPT'   // Accepting a task
  | 'TASK_COMPLETE' // Completing a task
  | 'TOOL_CALL'     // Calling a tool
  | 'TOOL_RESULT'   // Result from a tool
  | 'SUMMARY'       // Compressed recap
  | 'ALERT';        // Needs attention

export interface DiscordMessage {
  id: string;
  timestamp: string;
  author_agent: string;
  author_name: string;
  thread_id: string;
  channel: string;
  workspace: string;
  mode: AIMOSMode;
  type: DiscordMessageType;
  content: string;
  links?: {
    docs?: string[];
    code?: string[];
    artifacts?: string[];
    threads?: string[];
  };
  metadata?: Record<string, any>;
}

export interface DiscordThread {
  id: string;
  workspace: string;
  channel: string;
  name: string;
  mode: AIMOSMode;
  scope?: string; // Bug ID, feature ID, T-level
  participants: string[]; // Agent IDs
  created_at: string;
  last_activity: string;
  message_count: number;
  status: 'active' | 'archived' | 'resolved';
}

export interface DiscordChannel {
  id: string;
  workspace: string;
  name: string;
  description: string;
  threads: DiscordThread[];
}

export interface DiscordWorkspace {
  id: string;
  name: string;
  channels: DiscordChannel[];
}

// ===================== GOAL GRAPH (T-Levels) =====================
export type TLevel = 'T0' | 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6';

export interface GoalNode {
  id: string;
  level: TLevel;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'blocked';
  assigned_agents: string[];
  parent_id?: string;
  children_ids: string[];
  created_at: string;
  updated_at: string;
}

// T0: One-line intent
// T1: High-level brief
// T2: Module breakdown
// T3: Architecture
// T4: Detailed spec
// T5: Implementation & tests
// T6: Monitoring, evolution

// ===================== APOE ORCHESTRATOR =====================
export interface APOETask {
  id: string;
  goal_id: string;
  title: string;
  description: string;
  assigned_agent: string;
  mode: AIMOSMode;
  priority: number;
  token_budget: number;
  status: 'queued' | 'assigned' | 'in_progress' | 'completed' | 'failed';
  result?: any;
  thread_id?: string;
}

export interface APOEOrchestrationState {
  global_mode_hint: string;
  goal_graph: GoalNode[];
  active_tasks: APOETask[];
  resource_status: {
    total_token_budget: number;
    used_tokens: number;
    available_agents: number;
    active_agents: number;
    parallel_limit: number;
  };
  event_queue: Array<{
    type: 'user_message' | 'tool_result' | 'time_trigger' | 'agent_message';
    payload: any;
    timestamp: string;
  }>;
}

// ===================== STREAMING EVENTS =====================
export interface AIMOSStreamEvent {
  type: 'orchestration_plan' | 'mode_change' | 'agent_spawn' | 'agent_message' 
       | 'task_start' | 'task_complete' | 'step_start' | 'step_complete' 
       | 'final' | 'error' | 'discord_message';
  timestamp: string;
  payload: any;
}

// Full orchestration plan sent at start
export interface OrchestrationPlanEvent {
  type: 'orchestration_plan';
  global_mode: AIMOSMode;
  goal_decomposition: GoalNode[];
  assigned_agents: AIMOSAgent[];
  total_steps: number;
  token_budget: number;
  estimated_duration_ms: number;
  threads_created: string[];
}

// Agent message event (for Discord view)
export interface AgentMessageEvent {
  type: 'discord_message';
  message: DiscordMessage;
}

// ===================== AIMOS RESPONSE =====================
export interface AIMOSResponse {
  answer: string;
  trace_id: string;
  mode_used: AIMOSMode;
  agents_involved: AIMOSAgent[];
  steps: Array<{
    node: string;
    agent: string;
    mode: AIMOSMode;
    output: string;
    metrics: {
      tokens: number;
      confidence: number;
      coherence: number;
      duration_ms: number;
    };
    sources?: string[];
    thread_id?: string;
  }>;
  discord_log: DiscordMessage[];
  verification: {
    confidence: number;
    provenance_coverage: number;
    semantic_entropy: number;
    citations: Array<{
      source: string;
      quote: string;
      relevance: number;
    }>;
  };
  goal_progress?: {
    completed: string[];
    in_progress: string[];
    blocked: string[];
  };
}
