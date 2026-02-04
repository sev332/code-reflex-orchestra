// Autonomy Governor - Budget management, modes, and STOP semantics

import {
  Budgets,
  BudgetStatus,
  AutonomyMode,
  RiskPolicy,
  RunState,
  OrchestrationTask,
  generateId,
} from './types';
import { EventStore } from './event-store';

export class AutonomyGovernor {
  private eventStore: EventStore;
  private budgets: Budgets;
  private mode: AutonomyMode;
  private riskPolicy: RiskPolicy;
  private stopped: boolean = false;
  private stopReason?: string;
  private startTime: number;
  private pendingApprovals: Map<string, {
    action: string;
    risk_level: number;
    resolve: (approved: boolean) => void;
  }> = new Map();

  constructor(
    eventStore: EventStore,
    budgets: Budgets,
    mode: AutonomyMode = 'supervised',
    riskPolicy?: RiskPolicy
  ) {
    this.eventStore = eventStore;
    this.budgets = { ...budgets };
    this.mode = mode;
    this.riskPolicy = riskPolicy || {
      require_approval: ['delete', 'external_call', 'overwrite'],
      allowed_tools: ['*'],
      blocked_tools: [],
      max_risk_per_action: 0.8,
      auto_approve_below_risk: 0.3,
    };
    this.startTime = Date.now();
  }

  // ============================================================================
  // STOP SEMANTICS
  // ============================================================================

  requestStop(reason: string): void {
    this.stopped = true;
    this.stopReason = reason;

    this.eventStore.appendEvent('STOP_REQUESTED', {
      reason,
      timestamp: new Date().toISOString(),
      budgets_at_stop: this.getBudgetStatus(),
    });
  }

  isStopped(): boolean {
    return this.stopped;
  }

  getStopReason(): string | undefined {
    return this.stopReason;
  }

  // ============================================================================
  // BUDGET MANAGEMENT
  // ============================================================================

  getBudgets(): Budgets {
    // Update wall time
    this.budgets.used_wall_time_ms = Date.now() - this.startTime;
    return { ...this.budgets };
  }

  getBudgetStatus(): BudgetStatus {
    const budgets = this.getBudgets();
    
    const details = {
      wall_time: {
        used: budgets.used_wall_time_ms,
        max: budgets.max_wall_time_ms,
        percent: budgets.used_wall_time_ms / budgets.max_wall_time_ms,
      },
      tokens: {
        used: budgets.used_output_tokens,
        max: budgets.max_output_tokens,
        percent: budgets.used_output_tokens / budgets.max_output_tokens,
      },
      tool_calls: {
        used: budgets.used_tool_calls,
        max: budgets.max_tool_calls,
        percent: budgets.used_tool_calls / budgets.max_tool_calls,
      },
      iterations: {
        used: budgets.used_iterations,
        max: budgets.max_iterations,
        percent: budgets.used_iterations / budgets.max_iterations,
      },
      risk_actions: {
        used: budgets.used_risk_actions,
        max: budgets.max_risk_actions,
        percent: budgets.used_risk_actions / budgets.max_risk_actions,
      },
    };

    const exhausted = Object.values(details).some(d => d.percent >= 1.0);
    const nearLimit = Object.values(details).some(d => d.percent >= budgets.warning_threshold);

    return { exhausted, near_limit: nearLimit, details };
  }

  consumeTokens(count: number): boolean {
    if (this.stopped) return false;

    const newTotal = this.budgets.used_output_tokens + count;
    if (newTotal > this.budgets.max_output_tokens) {
      this.eventStore.appendEvent('BUDGET_EXHAUSTED', {
        budget_type: 'tokens',
        used: newTotal,
        max: this.budgets.max_output_tokens,
      });
      this.requestStop('Token budget exhausted');
      return false;
    }

    this.budgets.used_output_tokens = newTotal;
    this.emitBudgetTick();
    return true;
  }

  consumeToolCall(): boolean {
    if (this.stopped) return false;

    const newTotal = this.budgets.used_tool_calls + 1;
    if (newTotal > this.budgets.max_tool_calls) {
      this.eventStore.appendEvent('BUDGET_EXHAUSTED', {
        budget_type: 'tool_calls',
        used: newTotal,
        max: this.budgets.max_tool_calls,
      });
      this.requestStop('Tool call budget exhausted');
      return false;
    }

    this.budgets.used_tool_calls = newTotal;
    this.emitBudgetTick();
    return true;
  }

  consumeIteration(): boolean {
    if (this.stopped) return false;

    const newTotal = this.budgets.used_iterations + 1;
    if (newTotal > this.budgets.max_iterations) {
      this.eventStore.appendEvent('BUDGET_EXHAUSTED', {
        budget_type: 'iterations',
        used: newTotal,
        max: this.budgets.max_iterations,
      });
      this.requestStop('Iteration budget exhausted');
      return false;
    }

    this.budgets.used_iterations = newTotal;
    this.emitBudgetTick();
    return true;
  }

  consumeRiskAction(): boolean {
    if (this.stopped) return false;

    const newTotal = this.budgets.used_risk_actions + 1;
    if (newTotal > this.budgets.max_risk_actions) {
      this.eventStore.appendEvent('BUDGET_EXHAUSTED', {
        budget_type: 'risk_actions',
        used: newTotal,
        max: this.budgets.max_risk_actions,
      });
      this.requestStop('Risk action budget exhausted');
      return false;
    }

    this.budgets.used_risk_actions = newTotal;
    this.emitBudgetTick();
    return true;
  }

  checkWallTime(): boolean {
    this.budgets.used_wall_time_ms = Date.now() - this.startTime;
    
    if (this.budgets.used_wall_time_ms > this.budgets.max_wall_time_ms) {
      this.eventStore.appendEvent('BUDGET_EXHAUSTED', {
        budget_type: 'wall_time',
        used: this.budgets.used_wall_time_ms,
        max: this.budgets.max_wall_time_ms,
      });
      this.requestStop('Wall time budget exhausted');
      return false;
    }

    return true;
  }

  private emitBudgetTick(): void {
    const status = this.getBudgetStatus();
    const maxPercent = Math.max(
      ...Object.values(status.details).map(d => d.percent)
    );

    this.eventStore.appendEvent('BUDGET_TICK', {
      percent_used: Math.round(maxPercent * 100),
      near_limit: status.near_limit,
      details: status.details,
    });
  }

  // ============================================================================
  // MODE MANAGEMENT
  // ============================================================================

  getMode(): AutonomyMode {
    return this.mode;
  }

  setMode(mode: AutonomyMode): void {
    const oldMode = this.mode;
    this.mode = mode;

    this.eventStore.appendEvent('CONTEXT_UPDATED', {
      action: 'mode_change',
      old_mode: oldMode,
      new_mode: mode,
    });
  }

  // ============================================================================
  // RISK POLICY
  // ============================================================================

  async checkActionPermission(
    actionType: string,
    riskLevel: number,
    description: string
  ): Promise<{ allowed: boolean; reason: string }> {
    // Check if tool is blocked
    if (this.riskPolicy.blocked_tools.includes(actionType)) {
      return { allowed: false, reason: `Action type '${actionType}' is blocked by policy` };
    }

    // Check if risk level exceeds maximum
    if (riskLevel > this.riskPolicy.max_risk_per_action) {
      return { 
        allowed: false, 
        reason: `Risk level ${riskLevel} exceeds maximum ${this.riskPolicy.max_risk_per_action}` 
      };
    }

    // In autonomous mode with low risk, auto-approve
    if (this.mode === 'autonomous' && riskLevel <= this.riskPolicy.auto_approve_below_risk) {
      return { allowed: true, reason: 'Auto-approved: low risk in autonomous mode' };
    }

    // Check if action type requires approval
    const requiresApproval = this.riskPolicy.require_approval.some(
      pattern => actionType.includes(pattern) || pattern === '*'
    );

    if (!requiresApproval && this.mode !== 'manual') {
      return { allowed: true, reason: 'Action type does not require approval' };
    }

    // In manual mode, always require approval
    if (this.mode === 'manual') {
      return this.requestApproval(actionType, riskLevel, description);
    }

    // In supervised mode, require approval for risky actions
    if (this.mode === 'supervised' && requiresApproval) {
      return this.requestApproval(actionType, riskLevel, description);
    }

    return { allowed: true, reason: 'Approved by policy' };
  }

  private async requestApproval(
    actionType: string,
    riskLevel: number,
    description: string
  ): Promise<{ allowed: boolean; reason: string }> {
    const approvalId = generateId();

    this.eventStore.appendEvent('ACTION_EXECUTED', {
      action: 'approval_requested',
      approval_id: approvalId,
      action_type: actionType,
      risk_level: riskLevel,
      description,
    });

    // For now, simulate approval (in real app, would wait for user input)
    // In production, this would create a pending approval that blocks until resolved
    return new Promise((resolve) => {
      this.pendingApprovals.set(approvalId, {
        action: actionType,
        risk_level: riskLevel,
        resolve: (approved: boolean) => {
          resolve({
            allowed: approved,
            reason: approved ? 'User approved' : 'User rejected',
          });
        },
      });

      // Auto-approve after timeout for demo (would not do this in production)
      setTimeout(() => {
        if (this.pendingApprovals.has(approvalId)) {
          this.approveAction(approvalId, true);
        }
      }, 100);
    });
  }

  approveAction(approvalId: string, approved: boolean): void {
    const pending = this.pendingApprovals.get(approvalId);
    if (pending) {
      pending.resolve(approved);
      this.pendingApprovals.delete(approvalId);

      this.eventStore.appendEvent('ACTION_EXECUTED', {
        action: 'approval_resolved',
        approval_id: approvalId,
        approved,
      });
    }
  }

  getPendingApprovals(): Array<{
    id: string;
    action: string;
    risk_level: number;
  }> {
    return Array.from(this.pendingApprovals.entries()).map(([id, data]) => ({
      id,
      action: data.action,
      risk_level: data.risk_level,
    }));
  }

  // ============================================================================
  // PRE-ACTION CHECKS
  // ============================================================================

  canProceed(): { can: boolean; reason?: string } {
    if (this.stopped) {
      return { can: false, reason: this.stopReason || 'Run stopped' };
    }

    if (!this.checkWallTime()) {
      return { can: false, reason: 'Wall time budget exhausted' };
    }

    const status = this.getBudgetStatus();
    if (status.exhausted) {
      return { can: false, reason: 'Budget exhausted' };
    }

    return { can: true };
  }

  shouldCheckpoint(): boolean {
    const status = this.getBudgetStatus();
    return status.near_limit || this.stopped;
  }

  // ============================================================================
  // STATE SERIALIZATION
  // ============================================================================

  getState(): {
    budgets: Budgets;
    mode: AutonomyMode;
    stopped: boolean;
    stop_reason?: string;
    pending_approvals: number;
  } {
    return {
      budgets: this.getBudgets(),
      mode: this.mode,
      stopped: this.stopped,
      stop_reason: this.stopReason,
      pending_approvals: this.pendingApprovals.size,
    };
  }

  restoreState(state: { budgets: Budgets; mode: AutonomyMode }): void {
    this.budgets = { ...state.budgets };
    this.mode = state.mode;
    this.startTime = Date.now() - state.budgets.used_wall_time_ms;
  }
}
