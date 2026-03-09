// ═══════════════════════════════════════════════════════════════
// AI Integration Core Types — The nervous system of LUCID OS
// Every app implements AIIntegration so the AI can see & act within it
// ═══════════════════════════════════════════════════════════════

import type { PageId } from '@/components/layout/PageTopBar';

// ─── Capability Taxonomy ────────────────────────────────────
export type AICapabilityCategory =
  | 'read'        // Observe state
  | 'write'       // Modify state
  | 'create'      // Create new items
  | 'delete'      // Remove items
  | 'navigate'    // Navigate within app
  | 'transform'   // Transform/process data
  | 'export'      // Export data
  | 'import'      // Import data
  | 'automate'    // Trigger automation
  | 'analyze';    // Analyze/insight

export interface AICapability {
  id: string;
  name: string;
  description: string;
  category: AICapabilityCategory;
  parameters?: AIActionParam[];
  examples?: string[];            // NL examples that trigger this
  requiresConfirmation?: boolean; // Destructive actions need user OK
}

export interface AIActionParam {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'enum';
  description: string;
  required: boolean;
  enumValues?: string[];
  defaultValue?: any;
}

// ─── Action Dispatch ────────────────────────────────────────
export interface AIAction {
  id: string;
  appId: PageId;
  capabilityId: string;
  params: Record<string, any>;
  timestamp: string;
  source: 'user_chat' | 'workflow' | 'automation' | 'suggestion';
}

export interface AIActionResult {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
  sideEffects?: string[];  // What else changed
  suggestedFollowUp?: string[];
}

// ─── Application Context ────────────────────────────────────
export interface AppContext {
  appId: PageId;
  appName: string;
  summary: string;           // One-line description of current state
  activeView?: string;       // Sub-view/tab within the app
  selectedItems?: string[];  // Currently selected item IDs
  itemCount?: number;        // Total items in workspace
  recentActions?: string[];  // Last 5 actions user took
  metadata?: Record<string, any>; // App-specific context
}

// ─── AI Integration Interface ───────────────────────────────
export interface AIIntegration {
  appId: PageId;
  getContext(): AppContext;
  getCapabilities(): AICapability[];
  executeAction(action: AIAction): Promise<AIActionResult>;
  getSystemPromptFragment(): string; // Injected into AI system prompt
}

// ─── App Registration ───────────────────────────────────────
export interface AppRegistration {
  id: PageId;
  name: string;
  icon: string;              // Lucide icon name
  category: AppCategory;
  description: string;
  capabilities: AICapability[];
  systemPromptFragment: string;
  contextProvider?: () => AppContext;
  actionHandler?: (action: AIAction) => Promise<AIActionResult>;
}

export type AppCategory =
  | 'productivity'
  | 'creative'
  | 'dev'
  | 'knowledge'
  | 'system'
  | 'ai';

// ─── Cross-App Workflow ─────────────────────────────────────
export interface WorkflowStep {
  stepId: string;
  appId: PageId;
  capabilityId: string;
  params: Record<string, any>;
  dependsOn?: string[];      // stepIds that must complete first
  outputMapping?: Record<string, string>; // Map outputs to next step inputs
}

export interface AIWorkflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  trigger: 'manual' | 'event' | 'schedule';
  status: 'idle' | 'running' | 'completed' | 'failed';
}

// ─── Context Change Events ──────────────────────────────────
export interface ContextChangeEvent {
  appId: PageId;
  timestamp: string;
  changeType: 'navigation' | 'selection' | 'data_change' | 'view_change';
  summary: string;
  previousContext?: Partial<AppContext>;
  newContext: AppContext;
}

export type ContextChangeCallback = (event: ContextChangeEvent) => void;
