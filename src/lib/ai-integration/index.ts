// AI Integration barrel export
export { appRegistry } from './app-registry';
export { registerAllApps } from './app-definitions';
export { workflowEngine, WORKFLOW_TEMPLATES, type WorkflowTemplate, type WorkflowExecution } from './workflow-engine';
export { osCommandParser, getContextualSuggestions, type OSCommand, type OSCommandResult, type OSCommandType } from './os-commands';
export type {
  AIIntegration, AICapability, AICapabilityCategory, AIAction,
  AIActionParam, AIActionResult, AppContext, AppRegistration,
  AppCategory, WorkflowStep, AIWorkflow, ContextChangeEvent,
  ContextChangeCallback,
} from './types';
