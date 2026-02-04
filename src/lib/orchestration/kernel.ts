// Orchestration Kernel - Main execution loop with event-sourced state

import {
  OrchestrationTask,
  RunConfig,
  RunState,
  Snapshot,
  ContextState,
  Artifact,
  VerificationResult,
  generateId,
  createDefaultBudgets,
  createDefaultContext,
} from './types';
import { EventStore } from './event-store';
import { TaskQueue } from './task-queue';
import { ContextManager } from './context-manager';
import { Verifier, Auditor } from './verifier';
import { AutonomyGovernor } from './autonomy-governor';

export interface KernelCallbacks {
  onEvent?: (event: ReturnType<EventStore['appendEvent']>) => void;
  onTaskStart?: (task: OrchestrationTask) => void;
  onTaskComplete?: (task: OrchestrationTask, success: boolean) => void;
  onCheckpoint?: (snapshot: Snapshot) => void;
  onStop?: (reason: string, snapshot: Snapshot) => void;
  executeTask?: (task: OrchestrationTask, context: string) => Promise<{
    output: string;
    tokens_used: number;
    artifacts?: Artifact[];
  }>;
}

export class OrchestrationKernel {
  private runId: string;
  private config: RunConfig;
  private eventStore: EventStore;
  private taskQueue: TaskQueue;
  private contextManager: ContextManager;
  private verifier: Verifier;
  private auditor: Auditor;
  private governor: AutonomyGovernor;
  private artifacts: Map<string, Artifact> = new Map();
  private callbacks: KernelCallbacks;
  private running: boolean = false;
  private actionsInCheckpoint: number = 0;

  constructor(config: Partial<RunConfig>, callbacks: KernelCallbacks = {}) {
    this.runId = config.run_id || generateId();
    this.config = {
      run_id: this.runId,
      project_id: config.project_id || generateId(),
      name: config.name || 'Untitled Run',
      description: config.description || '',
      mode: config.mode || 'supervised',
      budgets: config.budgets || createDefaultBudgets(),
      checkpoint_interval: config.checkpoint_interval || 10,
      risk_policy: config.risk_policy || {
        require_approval: ['delete', 'external_call'],
        allowed_tools: ['*'],
        blocked_tools: [],
        max_risk_per_action: 0.8,
        auto_approve_below_risk: 0.3,
      },
      created_at: new Date().toISOString(),
    };

    this.callbacks = callbacks;
    this.eventStore = new EventStore(this.runId);
    this.taskQueue = new TaskQueue(this.eventStore);
    this.contextManager = new ContextManager(this.eventStore);
    this.verifier = new Verifier(this.eventStore);
    this.auditor = new Auditor(this.eventStore);
    this.governor = new AutonomyGovernor(
      this.eventStore,
      this.config.budgets,
      this.config.mode,
      this.config.risk_policy
    );

    // Subscribe to events
    if (callbacks.onEvent) {
      this.eventStore.subscribe(callbacks.onEvent);
    }
  }

  // ============================================================================
  // RUN LIFECYCLE
  // ============================================================================

  async start(): Promise<void> {
    if (this.running) return;

    this.running = true;

    this.eventStore.appendEvent('RUN_STARTED', {
      run_id: this.runId,
      name: this.config.name,
      mode: this.config.mode,
      budgets: this.config.budgets,
    });

    await this.runLoop();
  }

  stop(reason: string = 'User requested stop'): Snapshot {
    this.governor.requestStop(reason);
    this.running = false;

    const snapshot = this.createCheckpoint('stop');

    if (this.callbacks.onStop) {
      this.callbacks.onStop(reason, snapshot);
    }

    this.eventStore.appendEvent('RUN_STOPPED', {
      reason,
      snapshot_id: snapshot.snapshot_id,
      queue_stats: this.taskQueue.getStats(),
      budget_status: this.governor.getBudgetStatus(),
    });

    return snapshot;
  }

  // ============================================================================
  // MAIN LOOP
  // ============================================================================

  private async runLoop(): Promise<void> {
    while (this.running) {
      // Check if we can proceed
      const canProceed = this.governor.canProceed();
      if (!canProceed.can) {
        this.stop(canProceed.reason || 'Cannot proceed');
        break;
      }

      // Get next task
      const task = this.taskQueue.getNextTask();
      if (!task) {
        // Check if any tasks are blocked or active
        const stats = this.taskQueue.getStats();
        if (stats.active === 0 && stats.blocked === 0) {
          // All done!
          this.eventStore.appendEvent('RUN_COMPLETED', {
            completed_tasks: stats.done,
            failed_tasks: stats.failed,
            canceled_tasks: stats.canceled,
          });
          this.running = false;
          break;
        }
        // Wait for blocked tasks to unblock
        await this.sleep(100);
        continue;
      }

      // Execute task
      await this.executeTask(task);

      // Check for checkpoint
      this.actionsInCheckpoint++;
      if (this.actionsInCheckpoint >= this.config.checkpoint_interval || this.governor.shouldCheckpoint()) {
        this.createCheckpoint('periodic');
        this.actionsInCheckpoint = 0;
      }

      // Consume iteration budget
      if (!this.governor.consumeIteration()) {
        this.stop('Iteration budget exhausted');
        break;
      }
    }
  }

  private async executeTask(task: OrchestrationTask): Promise<void> {
    // Mark task as active
    this.taskQueue.setTaskStatus(task.task_id, 'active', 'Starting execution');

    if (this.callbacks.onTaskStart) {
      this.callbacks.onTaskStart(task);
    }

    const startTime = Date.now();

    try {
      // Plan phase
      this.eventStore.appendEvent('PLAN_CREATED', {
        task_id: task.task_id,
        task_title: task.title,
        steps: ['select_context', 'execute', 'verify', 'audit'],
      });

      // Select context
      const contextItems = this.contextManager.selectContext(task.prompt, 4000);
      const contextStr = contextItems.map(c => c.content).join('\n\n---\n\n');

      // Check for contradictions
      const contradictions = this.contextManager.detectContradictions(task.prompt);
      if (contradictions.hasContradiction) {
        this.auditor.addEntry({
          type: 'contradiction',
          description: 'Task prompt contradicts pinned constraints',
          evidence: contradictions.contradictions.map(c => c.conflict),
          severity: 'warning',
          resolved: false,
        });
      }

      // Execute (via callback or simulated)
      let result: { output: string; tokens_used: number; artifacts?: Artifact[] };

      if (this.callbacks.executeTask) {
        result = await this.callbacks.executeTask(task, contextStr);
      } else {
        // Simulated execution
        result = await this.simulateExecution(task, contextStr);
      }

      this.eventStore.appendEvent('ACTION_EXECUTED', {
        task_id: task.task_id,
        action: 'llm_completion',
        tokens_used: result.tokens_used,
        output_length: result.output.length,
      });

      // Consume token budget
      if (!this.governor.consumeTokens(result.tokens_used)) {
        throw new Error('Token budget exhausted');
      }

      // Store artifacts
      if (result.artifacts) {
        for (const artifact of result.artifacts) {
          this.artifacts.set(artifact.id, artifact);
        }
      }

      // Verify
      const verification = await this.verifier.verifyAll(
        task.acceptance_criteria,
        result.output,
        Object.fromEntries(
          Array.from(this.artifacts.values()).map(a => [a.name, a.content])
        )
      );

      if (!verification.allPassed) {
        // Create fix task
        const fixTaskData = this.verifier.generateFixTask(
          task,
          verification.failedCriteria,
          verification.results
        );

        const fixTask = this.taskQueue.addTask({
          title: fixTaskData.title!,
          prompt: fixTaskData.prompt!,
          acceptance_criteria: fixTaskData.acceptance_criteria,
          dependencies: fixTaskData.dependencies,
          priority: fixTaskData.priority,
          context_refs: fixTaskData.context_refs,
          tags: fixTaskData.tags,
        });

        // Audit check
        this.auditor.checkFollowUpCreated(task, [fixTask]);

        // Mark original as failed
        this.taskQueue.markTaskFailed(task.task_id, 'Verification failed');

        if (this.callbacks.onTaskComplete) {
          this.callbacks.onTaskComplete(task, false);
        }

        return;
      }

      // Audit checks
      this.auditor.checkAcceptanceMeaningful(task, result.output, verification.results);

      // Mark as done
      const duration = Date.now() - startTime;
      this.taskQueue.markTaskDone(task.task_id, {
        success: true,
        output: result.output,
        artifacts: result.artifacts || [],
        verification_results: verification.results,
        tokens_used: result.tokens_used,
        duration_ms: duration,
      });

      // Add output to context
      this.contextManager.addItem('working', {
        content: `Task "${task.title}" completed:\n${result.output.slice(0, 500)}`,
        type: 'summary',
        source: task.task_id,
        tokens: Math.ceil(result.output.slice(0, 500).split(/\s+/).length * 1.3),
        priority: 50,
      });

      if (this.callbacks.onTaskComplete) {
        this.callbacks.onTaskComplete(task, true);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.eventStore.appendEvent('ERROR_RAISED', {
        task_id: task.task_id,
        error: errorMessage,
        type: 'execution_error',
      });

      this.taskQueue.markTaskFailed(task.task_id, errorMessage);

      if (this.callbacks.onTaskComplete) {
        this.callbacks.onTaskComplete(task, false);
      }
    }
  }

  private async simulateExecution(
    task: OrchestrationTask,
    context: string
  ): Promise<{ output: string; tokens_used: number; artifacts?: Artifact[] }> {
    // Simulate LLM execution
    await this.sleep(50);

    const output = `# ${task.title}

## Task Completed

This is a simulated response for the task: "${task.prompt.slice(0, 100)}..."

### Key Points
- Task was processed successfully
- Context length: ${context.length} characters
- Acceptance criteria count: ${task.acceptance_criteria.length}

### Output
The task has been completed according to the specified requirements.
`;

    return {
      output,
      tokens_used: Math.ceil(output.split(/\s+/).length * 1.3),
      artifacts: [],
    };
  }

  // ============================================================================
  // CHECKPOINTING
  // ============================================================================

  createCheckpoint(trigger: Snapshot['trigger']): Snapshot {
    const snapshot = this.eventStore.createSnapshot(
      this.taskQueue.toArray(),
      this.taskQueue.getDAGState(),
      this.contextManager.getState(),
      this.governor.getBudgets(),
      Array.from(this.artifacts.values()),
      trigger
    );

    // Create context summary
    const summary = this.contextManager.summarizeContext(
      this.governor.getBudgets().used_iterations
    );

    if (this.callbacks.onCheckpoint) {
      this.callbacks.onCheckpoint(snapshot);
    }

    return snapshot;
  }

  // ============================================================================
  // TASK MANAGEMENT
  // ============================================================================

  addTask(params: Parameters<TaskQueue['addTask']>[0]): OrchestrationTask {
    return this.taskQueue.addTask(params);
  }

  addTasks(tasks: Array<Parameters<TaskQueue['addTask']>[0]>): OrchestrationTask[] {
    return tasks.map(t => this.taskQueue.addTask(t));
  }

  getTask(taskId: string): OrchestrationTask | undefined {
    return this.taskQueue.getTask(taskId);
  }

  getTasks(): OrchestrationTask[] {
    return this.taskQueue.getAllTasks();
  }

  getQueueStats() {
    return this.taskQueue.getStats();
  }

  // ============================================================================
  // CONTEXT MANAGEMENT
  // ============================================================================

  addConstraint(content: string, priority: number = 100) {
    return this.contextManager.addConstraint(content, priority);
  }

  addContext(
    tier: 'pinned' | 'working' | 'longterm',
    content: string,
    type: 'constraint' | 'definition' | 'artifact' | 'summary' | 'memory' | 'instruction',
    priority: number = 50
  ) {
    return this.contextManager.addItem(tier, {
      content,
      type,
      source: 'user',
      tokens: Math.ceil(content.split(/\s+/).length * 1.3),
      priority,
    });
  }

  getContextStats() {
    return this.contextManager.getStats();
  }

  // ============================================================================
  // STATE ACCESS
  // ============================================================================

  getRunState(): RunState {
    return {
      config: this.config,
      status: this.running ? 'running' : (this.governor.isStopped() ? 'stopped' : 'completed'),
      current_task_id: this.taskQueue.getActiveTasks()[0]?.task_id,
      iteration: this.governor.getBudgets().used_iterations,
      started_at: this.config.created_at,
      stopped_at: this.governor.isStopped() ? new Date().toISOString() : undefined,
      stop_reason: this.governor.getStopReason(),
      last_checkpoint_at: this.eventStore.getLatestSnapshot()?.timestamp || this.config.created_at,
      events_count: this.eventStore.getEventCount(),
    };
  }

  getBudgetStatus() {
    return this.governor.getBudgetStatus();
  }

  getEvents(filter?: Parameters<EventStore['getEvents']>[0]) {
    return this.eventStore.getEvents(filter);
  }

  getTimeline() {
    return this.eventStore.getTimeline();
  }

  getAuditEntries() {
    return this.auditor.getAllEntries();
  }

  getArtifacts(): Artifact[] {
    return Array.from(this.artifacts.values());
  }

  // ============================================================================
  // REPLAY SUPPORT
  // ============================================================================

  exportBundle() {
    return {
      config: this.config,
      ...this.eventStore.exportBundle(),
      final_snapshot: this.createCheckpoint('manual'),
    };
  }

  static fromBundle(bundle: ReturnType<OrchestrationKernel['exportBundle']>): OrchestrationKernel {
    const kernel = new OrchestrationKernel(bundle.config);
    
    // Restore from snapshot
    const snapshot = bundle.final_snapshot;
    kernel.taskQueue.fromArray(snapshot.queue);
    kernel.contextManager.setState(snapshot.context);
    kernel.governor.restoreState({
      budgets: snapshot.budgets,
      mode: bundle.config.mode,
    });
    
    for (const artifact of snapshot.artifacts) {
      kernel.artifacts.set(artifact.id, artifact);
    }

    return kernel;
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================================================
  // MODE CONTROL
  // ============================================================================

  setMode(mode: 'manual' | 'supervised' | 'autonomous') {
    this.governor.setMode(mode);
  }

  getMode() {
    return this.governor.getMode();
  }

  // Single step execution for manual mode
  async step(): Promise<boolean> {
    if (this.governor.getMode() !== 'manual') {
      console.warn('step() should only be used in manual mode');
    }

    const task = this.taskQueue.getNextTask();
    if (!task) return false;

    await this.executeTask(task);
    return true;
  }
}
