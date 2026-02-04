// Orchestration Core Types - Event Sourced Autonomous AI System

// ============================================================================
// EVENT TYPES - Append-only event log entries
// ============================================================================

export type EventType =
  | 'RUN_STARTED'
  | 'RUN_STOPPED'
  | 'RUN_COMPLETED'
  | 'PLAN_CREATED'
  | 'ACTION_EXECUTED'
  | 'TOOL_CALLED'
  | 'TOOL_RESULT'
  | 'VERIFICATION_RUN'
  | 'VERIFICATION_PASSED'
  | 'VERIFICATION_FAILED'
  | 'AUDIT_NOTE'
  | 'CHECKPOINT_CREATED'
  | 'QUEUE_MUTATION'
  | 'SNAPSHOT_CREATED'
  | 'BUDGET_TICK'
  | 'BUDGET_EXHAUSTED'
  | 'ERROR_RAISED'
  | 'CONTEXT_UPDATED'
  | 'CONTRADICTION_DETECTED'
  | 'STOP_REQUESTED';

export interface OrchestrationEvent {
  event_id: string;
  run_id: string;
  timestamp: string;
  type: EventType;
  payload: Record<string, unknown>;
  hash_prev: string;
  hash_self: string;
  sequence_number: number;
}

// ============================================================================
// TASK TYPES - First-class task objects with acceptance criteria
// ============================================================================

export type TaskStatus = 
  | 'queued' 
  | 'active' 
  | 'blocked' 
  | 'done' 
  | 'failed' 
  | 'canceled';

export type TaskPriority = 0 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100;

export interface AcceptanceCriterion {
  id: string;
  type: 'schema' | 'contains' | 'not_contains' | 'word_limit' | 'custom' | 'lint' | 'test';
  description: string;
  config: Record<string, unknown>;
  passed?: boolean;
  evidence?: string;
}

export interface TaskHistoryEntry {
  timestamp: string;
  field: string;
  old_value: unknown;
  new_value: unknown;
  reason: string;
}

export interface OrchestrationTask {
  task_id: string;
  title: string;
  prompt: string;
  acceptance_criteria: AcceptanceCriterion[];
  dependencies: string[];
  priority: TaskPriority;
  status: TaskStatus;
  context_refs: string[];
  history: TaskHistoryEntry[];
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  result?: TaskResult;
  retry_count: number;
  max_retries: number;
  parent_task_id?: string;
  subtask_ids: string[];
  tags: string[];
  estimated_tokens?: number;
  actual_tokens?: number;
}

export interface TaskResult {
  success: boolean;
  output: string;
  artifacts: Artifact[];
  verification_results: VerificationResult[];
  tokens_used: number;
  duration_ms: number;
}

// ============================================================================
// BUDGET TYPES - Hard constraints for autonomous operation
// ============================================================================

export interface Budgets {
  max_wall_time_ms: number;
  max_output_tokens: number;
  max_tool_calls: number;
  max_iterations: number;
  max_risk_actions: number;
  
  // Current usage
  used_wall_time_ms: number;
  used_output_tokens: number;
  used_tool_calls: number;
  used_iterations: number;
  used_risk_actions: number;
  
  // Thresholds for warnings
  warning_threshold: number; // 0.0-1.0, typically 0.8
}

export interface BudgetStatus {
  exhausted: boolean;
  near_limit: boolean;
  details: {
    wall_time: { used: number; max: number; percent: number };
    tokens: { used: number; max: number; percent: number };
    tool_calls: { used: number; max: number; percent: number };
    iterations: { used: number; max: number; percent: number };
    risk_actions: { used: number; max: number; percent: number };
  };
}

// ============================================================================
// CONTEXT TYPES - Three-tier context management
// ============================================================================

export interface ContextTier {
  tier: 'pinned' | 'working' | 'longterm';
  items: ContextItem[];
  max_tokens: number;
  current_tokens: number;
}

export interface ContextItem {
  id: string;
  content: string;
  type: 'constraint' | 'definition' | 'artifact' | 'summary' | 'memory' | 'instruction';
  source: string;
  tokens: number;
  priority: number;
  created_at: string;
  accessed_at: string;
  access_count: number;
  embedding?: number[];
}

export interface ContextState {
  pinned: ContextTier;
  working: ContextTier;
  longterm: ContextTier;
  total_tokens: number;
  max_total_tokens: number;
}

// ============================================================================
// VERIFICATION & AUDIT TYPES
// ============================================================================

export type VerificationType = 
  | 'schema_validation'
  | 'contains_check'
  | 'exclusion_check'
  | 'word_limit'
  | 'lint_check'
  | 'test_run'
  | 'rubric_eval'
  | 'contradiction_check';

export interface VerificationResult {
  criterion_id: string;
  type: VerificationType;
  passed: boolean;
  message: string;
  evidence?: string;
  score?: number;
  details?: Record<string, unknown>;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  type: 'decision' | 'contradiction' | 'risk' | 'quality' | 'process';
  description: string;
  evidence: string[];
  severity: 'info' | 'warning' | 'error' | 'critical';
  resolved: boolean;
  resolution?: string;
}

// ============================================================================
// ARTIFACT TYPES
// ============================================================================

export interface Artifact {
  id: string;
  name: string;
  type: 'code' | 'document' | 'data' | 'config' | 'test' | 'output';
  content: string;
  version: number;
  created_at: string;
  updated_at: string;
  task_id: string;
  checksum: string;
  metadata: Record<string, unknown>;
}

// ============================================================================
// SNAPSHOT TYPES - Materialized state for replay
// ============================================================================

export interface Snapshot {
  snapshot_id: string;
  run_id: string;
  timestamp: string;
  sequence_number: number;
  
  // State
  queue: OrchestrationTask[];
  dag: DAGState;
  context: ContextState;
  budgets: Budgets;
  artifacts: Artifact[];
  
  // Metadata
  trigger: 'periodic' | 'checkpoint' | 'stop' | 'budget_warning' | 'manual';
  checksum: string;
}

export interface DAGState {
  nodes: DAGNode[];
  edges: DAGEdge[];
  execution_order: string[];
  completed: string[];
  blocked: string[];
}

export interface DAGNode {
  task_id: string;
  status: TaskStatus;
  depth: number;
}

export interface DAGEdge {
  from: string;
  to: string;
  type: 'dependency' | 'blocks' | 'spawned';
}

// ============================================================================
// RUN TYPES - Top-level orchestration run
// ============================================================================

export type AutonomyMode = 'manual' | 'supervised' | 'autonomous';

export interface RunConfig {
  run_id: string;
  project_id: string;
  name: string;
  description: string;
  mode: AutonomyMode;
  budgets: Budgets;
  checkpoint_interval: number; // actions between checkpoints
  risk_policy: RiskPolicy;
  created_at: string;
}

export interface RiskPolicy {
  require_approval: string[]; // action types requiring approval
  allowed_tools: string[];
  blocked_tools: string[];
  max_risk_per_action: number;
  auto_approve_below_risk: number;
}

export interface RunState {
  config: RunConfig;
  status: 'initializing' | 'running' | 'paused' | 'stopped' | 'completed' | 'failed';
  current_task_id?: string;
  iteration: number;
  started_at: string;
  stopped_at?: string;
  stop_reason?: string;
  last_checkpoint_at: string;
  events_count: number;
}

// ============================================================================
// TEST HARNESS TYPES
// ============================================================================

export interface TestSpec {
  test_id: string;
  name: string;
  category: 'orchestration' | 'context' | 'verification' | 'interrupt' | 'budget' | 'contradiction' | 'tool' | 'self_improvement' | 'regression' | 'drift' | 'partial' | 'failure';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  description: string;
  
  // Initial state
  initial_context: ContextState;
  initial_queue: OrchestrationTask[];
  
  // Injections during run
  queued_injections: QueuedInjection[];
  
  // Constraints
  budgets: Budgets;
  
  // Expectations
  must_do: string[];
  must_not_do: string[];
  acceptance_criteria: AcceptanceCriterion[];
  
  // Scoring
  scoring_rubric: ScoringRubric;
  
  // Optional golden expectations
  expected_artifacts?: Artifact[];
  expected_final_state?: Partial<Snapshot>;
}

export interface QueuedInjection {
  trigger: {
    type: 'action_count' | 'time_elapsed' | 'task_completed' | 'event_type';
    value: number | string;
  };
  injection: {
    type: 'add_task' | 'modify_task' | 'cancel_task' | 'add_constraint' | 'trigger_stop';
    payload: Record<string, unknown>;
  };
}

export interface ScoringRubric {
  total_points: number;
  categories: ScoringCategory[];
}

export interface ScoringCategory {
  name: string;
  weight: number;
  criteria: ScoringCriterion[];
}

export interface ScoringCriterion {
  description: string;
  points: number;
  evaluation: 'deterministic' | 'rubric';
  check?: string; // For deterministic checks
}

export interface TestResult {
  test_id: string;
  run_id: string;
  passed: boolean;
  score: number;
  max_score: number;
  score_breakdown: {
    category: string;
    earned: number;
    possible: number;
    details: string[];
  }[];
  must_do_results: { criterion: string; met: boolean; evidence?: string }[];
  must_not_do_results: { criterion: string; violated: boolean; evidence?: string }[];
  artifacts_match: boolean;
  state_match: boolean;
  duration_ms: number;
  events_count: number;
  error?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}

export function computeHash(data: string, prevHash: string): string {
  // Simple hash for demo - in production use crypto.subtle.digest
  let hash = 0;
  const combined = prevHash + data;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export function createDefaultBudgets(): Budgets {
  return {
    max_wall_time_ms: 300000, // 5 minutes
    max_output_tokens: 50000,
    max_tool_calls: 100,
    max_iterations: 50,
    max_risk_actions: 5,
    used_wall_time_ms: 0,
    used_output_tokens: 0,
    used_tool_calls: 0,
    used_iterations: 0,
    used_risk_actions: 0,
    warning_threshold: 0.8,
  };
}

export function createDefaultContext(): ContextState {
  return {
    pinned: { tier: 'pinned', items: [], max_tokens: 2000, current_tokens: 0 },
    working: { tier: 'working', items: [], max_tokens: 4000, current_tokens: 0 },
    longterm: { tier: 'longterm', items: [], max_tokens: 20000, current_tokens: 0 },
    total_tokens: 0,
    max_total_tokens: 26000,
  };
}
