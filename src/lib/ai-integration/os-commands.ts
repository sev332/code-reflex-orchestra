// ═══════════════════════════════════════════════════════════════
// Natural Language OS Commands — AI-powered system operations
// Transforms natural language into OS-level actions
// ═══════════════════════════════════════════════════════════════

import type { PageId } from '@/components/layout/PageTopBar';
import { appRegistry } from './app-registry';
import { workflowEngine, type WorkflowTemplate } from './workflow-engine';
import type { AIAction, AIActionResult } from './types';

// ─── OS Command Types ───────────────────────────────────────
export type OSCommandType =
  | 'navigate'      // Go to an app
  | 'create'        // Create something
  | 'open'          // Open a specific item
  | 'search'        // Search across apps
  | 'workflow'      // Execute a cross-app workflow
  | 'system'        // System-level operations
  | 'help'          // Get help/info
  | 'analyze';      // AI analysis of current context

export interface OSCommand {
  type: OSCommandType;
  intent: string;
  targetApp?: PageId;
  params: Record<string, any>;
  confidence: number;
  suggestedWorkflow?: WorkflowTemplate;
}

export interface OSCommandResult {
  success: boolean;
  type: OSCommandType;
  message: string;
  action?: 'navigate' | 'execute' | 'display' | 'confirm';
  targetApp?: PageId;
  data?: any;
  suggestions?: string[];
}

// ─── Command Patterns ───────────────────────────────────────
interface CommandPattern {
  patterns: RegExp[];
  type: OSCommandType;
  extractor: (match: RegExpMatchArray, input: string) => Partial<OSCommand>;
}

const COMMAND_PATTERNS: CommandPattern[] = [
  // Navigation commands
  {
    patterns: [
      /^(?:go to|open|switch to|show)\s+(?:the\s+)?(.+?)(?:\s+app)?$/i,
      /^(.+?)(?:\s+app)?$/i,
    ],
    type: 'navigate',
    extractor: (match, input) => {
      const target = match[1]?.toLowerCase().trim();
      const appMap: Record<string, PageId> = {
        'tasks': 'tasks', 'todo': 'tasks', 'task manager': 'tasks',
        'calendar': 'calendar', 'schedule': 'calendar', 'events': 'calendar',
        'email': 'email', 'mail': 'email', 'inbox': 'email',
        'spreadsheet': 'spreadsheet', 'excel': 'spreadsheet', 'sheets': 'spreadsheet',
        '3d studio': '3d-studio', '3d': '3d-studio', 'studio': '3d-studio',
        'illustrator': 'illustrator', 'draw': 'illustrator', 'vector': 'illustrator',
        'image editor': 'image-editor', 'photos': 'image-editor', 'images': 'image-editor',
        'audio editor': 'audio-editor', 'audio': 'audio-editor', 'music': 'audio-editor',
        'video editor': 'video-editor', 'video': 'video-editor',
        'presentations': 'presentations', 'slides': 'presentations', 'powerpoint': 'presentations',
        'code builder': 'code-builder', 'code': 'code-builder', 'ide': 'code-builder',
        'terminal': 'terminal', 'shell': 'terminal', 'console': 'terminal',
        'api studio': 'api-studio', 'api': 'api-studio', 'rest': 'api-studio',
        'database': 'database-explorer', 'db': 'database-explorer', 'sql': 'database-explorer',
        'dashboard': 'dashboard-builder', 'dashboards': 'dashboard-builder',
        'browser': 'browser', 'web': 'browser', 'internet': 'browser',
        'notes': 'notes', 'wiki': 'notes', 'notebook': 'notes',
        'files': 'file-manager', 'file manager': 'file-manager', 'explorer': 'file-manager',
        'settings': 'settings', 'preferences': 'settings', 'config': 'settings',
        'map': 'glass-map', 'maps': 'glass-map', 'location': 'glass-map',
        'comms': 'comms-hub', 'communications': 'comms-hub', 'chat': 'comms-hub',
        'orchestration': 'orchestration-studio', 'workflows': 'orchestration-studio',
        'dream': 'dream-mode', 'dream mode': 'dream-mode',
      };
      return { targetApp: appMap[target], params: { query: target } };
    },
  },
  // Create commands
  {
    patterns: [
      /^(?:create|new|add|make)\s+(?:a\s+)?(?:new\s+)?(.+)$/i,
    ],
    type: 'create',
    extractor: (match, input) => {
      const target = match[1]?.toLowerCase().trim();
      const createMap: Record<string, { app: PageId; capability: string }> = {
        'task': { app: 'tasks', capability: 'tasks.create' },
        'event': { app: 'calendar', capability: 'calendar.create' },
        'meeting': { app: 'calendar', capability: 'calendar.create' },
        'email': { app: 'email', capability: 'email.compose' },
        'note': { app: 'notes', capability: 'notes.create' },
        'document': { app: 'notes', capability: 'notes.create' },
        'file': { app: 'file-manager', capability: 'files.create' },
        'folder': { app: 'file-manager', capability: 'files.create_folder' },
        'slide': { app: 'presentations', capability: 'pres.add_slide' },
        'presentation': { app: 'presentations', capability: 'pres.create' },
        'spreadsheet': { app: 'spreadsheet', capability: 'ss.create' },
        'shape': { app: 'illustrator', capability: 'ill.shape' },
        'layer': { app: 'image-editor', capability: 'img.layer' },
        'project': { app: 'code-builder', capability: 'ide.create' },
      };
      const mapping = Object.entries(createMap).find(([k]) => target.includes(k));
      if (mapping) {
        return { targetApp: mapping[1].app, params: { capability: mapping[1].capability, query: target } };
      }
      return { params: { query: target } };
    },
  },
  // Search commands
  {
    patterns: [
      /^(?:search|find|look for|search for)\s+(.+)$/i,
    ],
    type: 'search',
    extractor: (match) => ({
      params: { query: match[1]?.trim() },
    }),
  },
  // System commands
  {
    patterns: [
      /^(?:clear|reset|restart|refresh)\s+(.+)?$/i,
    ],
    type: 'system',
    extractor: (match) => ({
      params: { action: match[0]?.split(' ')[0], target: match[1]?.trim() },
    }),
  },
  // Help commands
  {
    patterns: [
      /^(?:help|what can you do|show commands|list actions|capabilities)$/i,
      /^(?:how do i|how to)\s+(.+)$/i,
    ],
    type: 'help',
    extractor: (match) => ({
      params: { query: match[1]?.trim() },
    }),
  },
  // Analysis commands
  {
    patterns: [
      /^(?:analyze|summarize|explain|describe)\s+(?:this|the|current)?\s*(.+)?$/i,
    ],
    type: 'analyze',
    extractor: (match) => ({
      params: { target: match[1]?.trim() || 'current' },
    }),
  },
];

// ─── OS Command Parser ──────────────────────────────────────
class OSCommandParser {
  // Parse natural language input into an OS command
  parse(input: string): OSCommand | null {
    const normalized = input.trim();
    
    // First, check for workflow matches
    const workflow = workflowEngine.matchWorkflow(normalized);
    if (workflow) {
      return {
        type: 'workflow',
        intent: normalized,
        params: {},
        confidence: 0.9,
        suggestedWorkflow: workflow,
      };
    }

    // Then check command patterns
    for (const pattern of COMMAND_PATTERNS) {
      for (const regex of pattern.patterns) {
        const match = normalized.match(regex);
        if (match) {
          const extracted = pattern.extractor(match, normalized);
          return {
            type: pattern.type,
            intent: normalized,
            confidence: extracted.targetApp ? 0.95 : 0.7,
            ...extracted,
            params: extracted.params || {},
          };
        }
      }
    }

    return null;
  }

  // Execute a parsed command
  async execute(command: OSCommand): Promise<OSCommandResult> {
    switch (command.type) {
      case 'navigate':
        if (command.targetApp) {
          return {
            success: true,
            type: 'navigate',
            message: `Navigating to ${command.targetApp}`,
            action: 'navigate',
            targetApp: command.targetApp,
          };
        }
        return {
          success: false,
          type: 'navigate',
          message: `Could not find app: ${command.params.query}`,
          suggestions: this.getSimilarApps(command.params.query),
        };

      case 'create':
        if (command.targetApp && command.params.capability) {
          const action: AIAction = {
            id: `cmd_${Date.now()}`,
            appId: command.targetApp,
            capabilityId: command.params.capability,
            params: command.params,
            timestamp: new Date().toISOString(),
            source: 'user_chat',
          };
          const result = await appRegistry.executeAction(action);
          return {
            success: result.success,
            type: 'create',
            message: result.success ? `Created successfully` : (result.error || 'Failed to create'),
            action: 'navigate',
            targetApp: command.targetApp,
            data: result.data,
          };
        }
        return {
          success: false,
          type: 'create',
          message: `Please specify what to create`,
          suggestions: ['task', 'event', 'note', 'file', 'email'],
        };

      case 'workflow':
        if (command.suggestedWorkflow) {
          return {
            success: true,
            type: 'workflow',
            message: `Found workflow: ${command.suggestedWorkflow.name}`,
            action: 'confirm',
            data: command.suggestedWorkflow,
          };
        }
        return {
          success: false,
          type: 'workflow',
          message: 'No matching workflow found',
          suggestions: workflowEngine.getTemplates().map(t => t.name),
        };

      case 'search':
        return {
          success: true,
          type: 'search',
          message: `Searching for: ${command.params.query}`,
          action: 'display',
          data: { query: command.params.query },
        };

      case 'help':
        const apps = appRegistry.getAllApps();
        const capabilities = apps.flatMap(a => a.capabilities.slice(0, 2));
        return {
          success: true,
          type: 'help',
          message: 'Here are some things I can help with:',
          action: 'display',
          data: {
            apps: apps.map(a => ({ name: a.name, actions: a.capabilities.length })),
            workflows: workflowEngine.getTemplates().map(t => t.name),
            sampleCommands: [
              'Go to Tasks',
              'Create a new note',
              'Search for meetings',
              'Create task from email',
              'Analyze current spreadsheet',
            ],
          },
        };

      case 'analyze':
        return {
          success: true,
          type: 'analyze',
          message: `Analyzing ${command.params.target}...`,
          action: 'execute',
          data: command.params,
        };

      case 'system':
        return {
          success: true,
          type: 'system',
          message: `System command: ${command.params.action}`,
          action: 'confirm',
          data: command.params,
        };

      default:
        return {
          success: false,
          type: command.type,
          message: 'Unknown command type',
        };
    }
  }

  private getSimilarApps(query: string): string[] {
    const apps = appRegistry.getAllApps();
    const queryLower = query.toLowerCase();
    return apps
      .filter(a => 
        a.name.toLowerCase().includes(queryLower) ||
        a.description.toLowerCase().includes(queryLower)
      )
      .slice(0, 3)
      .map(a => a.name);
  }
}

export const osCommandParser = new OSCommandParser();

// ─── Predictive Suggestions ─────────────────────────────────
export function getContextualSuggestions(activeApp: PageId): string[] {
  const suggestions: string[] = [];
  const app = appRegistry.getApp(activeApp);
  const context = appRegistry.getContext(activeApp);

  if (!app) return suggestions;

  // Add app-specific suggestions
  const topCapabilities = app.capabilities.slice(0, 3);
  topCapabilities.forEach(cap => {
    if (cap.examples?.length) {
      suggestions.push(cap.examples[0]);
    }
  });

  // Add relevant workflow suggestions
  const workflows = workflowEngine.getTemplates();
  workflows
    .filter(w => w.steps.some(s => s.appId === activeApp))
    .slice(0, 2)
    .forEach(w => {
      suggestions.push(w.trigger[0]);
    });

  // Add context-based suggestions
  if (context?.itemCount === 0) {
    suggestions.unshift(`Create your first item in ${app.name}`);
  }
  if (context?.selectedItems?.length) {
    suggestions.push('Analyze selected items');
  }

  return suggestions.slice(0, 5);
}
