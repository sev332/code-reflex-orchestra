// ═══════════════════════════════════════════════════════════════
// Application Registry — Central catalog of all LUCID OS apps
// Maps every app with its AI capabilities, context, and actions
// ═══════════════════════════════════════════════════════════════

import type { PageId } from '@/components/layout/PageTopBar';
import type {
  AppRegistration, AppCategory, AICapability, AIAction,
  AIActionResult, AppContext, AIIntegration
} from './types';

// ─── Registry Singleton ─────────────────────────────────────
class ApplicationRegistry {
  private apps = new Map<PageId, AppRegistration>();
  private integrations = new Map<PageId, AIIntegration>();
  private contextListeners: Array<(appId: PageId, ctx: AppContext) => void> = [];

  // Register a full app definition
  register(app: AppRegistration) {
    this.apps.set(app.id, app);
  }

  // Register a live integration (from a mounted component)
  registerIntegration(integration: AIIntegration) {
    this.integrations.set(integration.appId, integration);
  }

  unregisterIntegration(appId: PageId) {
    this.integrations.delete(appId);
  }

  // Get all registered apps
  getAllApps(): AppRegistration[] {
    return Array.from(this.apps.values());
  }

  getApp(id: PageId): AppRegistration | undefined {
    return this.apps.get(id);
  }

  getAppsByCategory(cat: AppCategory): AppRegistration[] {
    return this.getAllApps().filter(a => a.category === cat);
  }

  // Get live context for a specific app
  getContext(appId: PageId): AppContext | null {
    const integration = this.integrations.get(appId);
    if (integration) return integration.getContext();
    const reg = this.apps.get(appId);
    if (reg?.contextProvider) return reg.contextProvider();
    return null;
  }

  // Get capabilities for a specific app
  getCapabilities(appId: PageId): AICapability[] {
    const integration = this.integrations.get(appId);
    if (integration) return integration.getCapabilities();
    return this.apps.get(appId)?.capabilities ?? [];
  }

  // Execute an action via live integration or registered handler
  async executeAction(action: AIAction): Promise<AIActionResult> {
    const integration = this.integrations.get(action.appId);
    if (integration) return integration.executeAction(action);

    const reg = this.apps.get(action.appId);
    if (reg?.actionHandler) return reg.actionHandler(action);

    return { success: false, error: `No handler registered for app: ${action.appId}` };
  }

  // Build a combined system prompt for the AI with all app knowledge
  buildSystemPrompt(activeAppId: PageId): string {
    const parts: string[] = [
      '# LUCID OS — AI Integration Context',
      '',
      `You are the AI assistant for LUCID Browser OS. The user is currently on the **${this.apps.get(activeAppId)?.name ?? activeAppId}** app.`,
      '',
    ];

    // Active app deep context
    const activeCtx = this.getContext(activeAppId);
    const activeReg = this.apps.get(activeAppId);
    if (activeReg) {
      parts.push(`## Active App: ${activeReg.name}`);
      parts.push(activeReg.description);
      parts.push('');
      if (activeReg.systemPromptFragment) {
        parts.push(activeReg.systemPromptFragment);
        parts.push('');
      }
      if (activeCtx) {
        parts.push(`### Current State: ${activeCtx.summary}`);
        if (activeCtx.activeView) parts.push(`View: ${activeCtx.activeView}`);
        if (activeCtx.itemCount !== undefined) parts.push(`Items: ${activeCtx.itemCount}`);
        if (activeCtx.selectedItems?.length) parts.push(`Selected: ${activeCtx.selectedItems.join(', ')}`);
        parts.push('');
      }
      const caps = this.getCapabilities(activeAppId);
      if (caps.length) {
        parts.push('### Available Actions');
        caps.forEach(c => {
          parts.push(`- **${c.name}** (${c.category}): ${c.description}`);
          if (c.examples?.length) parts.push(`  Examples: ${c.examples.map(e => `"${e}"`).join(', ')}`);
        });
        parts.push('');
      }
    }

    // Brief summary of all other apps
    parts.push('## Other Available Apps');
    this.getAllApps()
      .filter(a => a.id !== activeAppId)
      .forEach(a => {
        const capCount = a.capabilities.length;
        parts.push(`- **${a.name}**: ${a.description} (${capCount} AI actions available)`);
      });

    return parts.join('\n');
  }

  // Subscribe to context updates
  onContextChange(cb: (appId: PageId, ctx: AppContext) => void) {
    this.contextListeners.push(cb);
    return () => {
      this.contextListeners = this.contextListeners.filter(l => l !== cb);
    };
  }

  notifyContextChange(appId: PageId, ctx: AppContext) {
    this.contextListeners.forEach(cb => cb(appId, ctx));
  }
}

export const appRegistry = new ApplicationRegistry();
