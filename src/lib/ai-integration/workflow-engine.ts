// ═══════════════════════════════════════════════════════════════
// Cross-App Workflow Engine — Orchestrates multi-app AI workflows
// Enables complex tasks spanning multiple applications
// ═══════════════════════════════════════════════════════════════

import type { PageId } from '@/components/layout/PageTopBar';
import type { AIWorkflow, WorkflowStep, AIAction, AIActionResult } from './types';
import { appRegistry } from './app-registry';

// ─── Workflow Templates ─────────────────────────────────────
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  trigger: string[];  // NL phrases that trigger this workflow
  steps: Omit<WorkflowStep, 'stepId'>[];
  category: 'productivity' | 'creative' | 'data' | 'automation';
}

// Pre-built workflow templates for common cross-app tasks
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'task-from-email',
    name: 'Create Task from Email',
    description: 'Extract action items from an email and create tasks',
    trigger: ['create task from this email', 'turn email into task', 'extract tasks from email'],
    category: 'productivity',
    steps: [
      { appId: 'email', capabilityId: 'email.read', params: { current: true } },
      { appId: 'tasks', capabilityId: 'tasks.create', params: { fromEmail: true }, dependsOn: ['step_0'] },
    ],
  },
  {
    id: 'calendar-from-email',
    name: 'Schedule Meeting from Email',
    description: 'Create calendar event from email discussion',
    trigger: ['schedule this', 'add to calendar from email', 'create meeting from email'],
    category: 'productivity',
    steps: [
      { appId: 'email', capabilityId: 'email.read', params: { current: true } },
      { appId: 'calendar', capabilityId: 'calendar.create', params: { fromEmail: true }, dependsOn: ['step_0'] },
    ],
  },
  {
    id: 'data-to-presentation',
    name: 'Spreadsheet to Presentation',
    description: 'Generate presentation slides from spreadsheet data',
    trigger: ['create presentation from data', 'make slides from spreadsheet', 'visualize this data as slides'],
    category: 'creative',
    steps: [
      { appId: 'spreadsheet', capabilityId: 'ss.read', params: { selection: true } },
      { appId: 'presentations', capabilityId: 'pres.create', params: { fromData: true }, dependsOn: ['step_0'] },
    ],
  },
  {
    id: 'notes-to-tasks',
    name: 'Notes to Task List',
    description: 'Extract action items from notes and create tasks',
    trigger: ['create tasks from notes', 'turn notes into todos', 'extract action items'],
    category: 'productivity',
    steps: [
      { appId: 'notes', capabilityId: 'notes.read', params: { current: true } },
      { appId: 'tasks', capabilityId: 'tasks.create_batch', params: { fromNotes: true }, dependsOn: ['step_0'] },
    ],
  },
  {
    id: 'design-to-code',
    name: 'Design to Code',
    description: 'Generate code component from Illustrator design',
    trigger: ['generate code from design', 'export design as component', 'create component from illustration'],
    category: 'creative',
    steps: [
      { appId: 'illustrator', capabilityId: 'ill.export', params: { format: 'svg' } },
      { appId: 'code-builder', capabilityId: 'ide.create', params: { fromSvg: true }, dependsOn: ['step_0'] },
    ],
  },
  {
    id: 'api-to-dashboard',
    name: 'API to Dashboard',
    description: 'Create dashboard visualization from API response',
    trigger: ['visualize api response', 'create dashboard from api', 'show api data in dashboard'],
    category: 'data',
    steps: [
      { appId: 'api-studio', capabilityId: 'api.execute', params: { current: true } },
      { appId: 'dashboard-builder', capabilityId: 'dash.create', params: { fromApi: true }, dependsOn: ['step_0'] },
    ],
  },
  {
    id: 'db-to-spreadsheet',
    name: 'Database to Spreadsheet',
    description: 'Export database query results to spreadsheet',
    trigger: ['export query to spreadsheet', 'save results to excel', 'create spreadsheet from database'],
    category: 'data',
    steps: [
      { appId: 'database-explorer', capabilityId: 'db.query', params: { current: true } },
      { appId: 'spreadsheet', capabilityId: 'ss.import', params: { fromDb: true }, dependsOn: ['step_0'] },
    ],
  },
  {
    id: 'research-workflow',
    name: 'Web Research to Notes',
    description: 'Research a topic and compile findings into notes',
    trigger: ['research and take notes', 'compile research', 'gather information about'],
    category: 'productivity',
    steps: [
      { appId: 'browser', capabilityId: 'browser.search', params: {} },
      { appId: 'notes', capabilityId: 'notes.create', params: { fromResearch: true }, dependsOn: ['step_0'] },
    ],
  },
];

// ─── Workflow Execution State ───────────────────────────────
export interface WorkflowExecution {
  workflowId: string;
  executionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  currentStep: number;
  stepResults: Map<string, AIActionResult>;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

// ─── Workflow Engine ────────────────────────────────────────
class WorkflowEngine {
  private executions = new Map<string, WorkflowExecution>();
  private activeWorkflows = new Map<string, AIWorkflow>();
  private listeners: Array<(exec: WorkflowExecution) => void> = [];

  // Match user input to a workflow template
  matchWorkflow(input: string): WorkflowTemplate | null {
    const normalized = input.toLowerCase().trim();
    for (const template of WORKFLOW_TEMPLATES) {
      for (const trigger of template.trigger) {
        if (normalized.includes(trigger) || this.fuzzyMatch(normalized, trigger)) {
          return template;
        }
      }
    }
    return null;
  }

  private fuzzyMatch(input: string, trigger: string): boolean {
    const inputWords = new Set(input.split(/\s+/));
    const triggerWords = trigger.split(/\s+/);
    const matchCount = triggerWords.filter(w => inputWords.has(w)).length;
    return matchCount >= Math.ceil(triggerWords.length * 0.6);
  }

  // Create workflow from template
  createFromTemplate(template: WorkflowTemplate, customParams?: Record<string, any>): AIWorkflow {
    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const steps: WorkflowStep[] = template.steps.map((s, i) => ({
      ...s,
      stepId: `step_${i}`,
      params: { ...s.params, ...customParams },
    }));

    const workflow: AIWorkflow = {
      id: workflowId,
      name: template.name,
      description: template.description,
      steps,
      trigger: 'manual',
      status: 'idle',
    };

    this.activeWorkflows.set(workflowId, workflow);
    return workflow;
  }

  // Execute a workflow
  async execute(workflow: AIWorkflow): Promise<WorkflowExecution> {
    const executionId = `exec_${Date.now()}`;
    const execution: WorkflowExecution = {
      workflowId: workflow.id,
      executionId,
      status: 'running',
      currentStep: 0,
      stepResults: new Map(),
      startedAt: new Date().toISOString(),
    };

    this.executions.set(executionId, execution);
    workflow.status = 'running';
    this.notifyListeners(execution);

    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        execution.currentStep = i;
        this.notifyListeners(execution);

        // Check dependencies
        if (step.dependsOn?.length) {
          const depsMet = step.dependsOn.every(depId => {
            const depResult = execution.stepResults.get(depId);
            return depResult?.success;
          });
          if (!depsMet) {
            throw new Error(`Dependencies not met for step ${step.stepId}`);
          }
        }

        // Build params with output mapping from previous steps
        const params = { ...step.params };
        if (step.outputMapping) {
          for (const [outputKey, inputKey] of Object.entries(step.outputMapping)) {
            const [sourceStep, sourceField] = outputKey.split('.');
            const sourceResult = execution.stepResults.get(sourceStep);
            if (sourceResult?.data?.[sourceField]) {
              params[inputKey] = sourceResult.data[sourceField];
            }
          }
        }

        // Execute the action
        const action: AIAction = {
          id: `action_${step.stepId}_${Date.now()}`,
          appId: step.appId,
          capabilityId: step.capabilityId,
          params,
          timestamp: new Date().toISOString(),
          source: 'workflow',
        };

        const result = await appRegistry.executeAction(action);
        execution.stepResults.set(step.stepId, result);

        if (!result.success) {
          throw new Error(result.error || `Step ${step.stepId} failed`);
        }
      }

      execution.status = 'completed';
      execution.completedAt = new Date().toISOString();
      workflow.status = 'completed';
    } catch (err) {
      execution.status = 'failed';
      execution.error = err instanceof Error ? err.message : 'Unknown error';
      execution.completedAt = new Date().toISOString();
      workflow.status = 'failed';
    }

    this.notifyListeners(execution);
    return execution;
  }

  // Get execution status
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  // Subscribe to execution updates
  onExecutionUpdate(cb: (exec: WorkflowExecution) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notifyListeners(exec: WorkflowExecution) {
    this.listeners.forEach(cb => cb(exec));
  }

  // Get all available templates
  getTemplates(): WorkflowTemplate[] {
    return WORKFLOW_TEMPLATES;
  }

  // Get templates by category
  getTemplatesByCategory(category: WorkflowTemplate['category']): WorkflowTemplate[] {
    return WORKFLOW_TEMPLATES.filter(t => t.category === category);
  }
}

export const workflowEngine = new WorkflowEngine();
