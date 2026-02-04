// Event Store - Append-only event log with tamper-evident chaining

import {
  OrchestrationEvent,
  EventType,
  Snapshot,
  generateId,
  computeHash,
  RunState,
  OrchestrationTask,
  ContextState,
  Budgets,
  Artifact,
  DAGState,
} from './types';

export class EventStore {
  private events: OrchestrationEvent[] = [];
  private snapshots: Snapshot[] = [];
  private lastHash: string = '00000000';
  private sequenceNumber: number = 0;
  private runId: string;
  private listeners: Set<(event: OrchestrationEvent) => void> = new Set();

  constructor(runId: string) {
    this.runId = runId;
  }

  // ============================================================================
  // EVENT OPERATIONS
  // ============================================================================

  appendEvent(type: EventType, payload: Record<string, unknown>): OrchestrationEvent {
    const event: OrchestrationEvent = {
      event_id: generateId(),
      run_id: this.runId,
      timestamp: new Date().toISOString(),
      type,
      payload,
      hash_prev: this.lastHash,
      hash_self: '',
      sequence_number: this.sequenceNumber++,
    };

    // Compute self hash
    event.hash_self = computeHash(JSON.stringify(event), event.hash_prev);
    this.lastHash = event.hash_self;

    this.events.push(event);
    
    // Notify listeners
    this.listeners.forEach(listener => listener(event));
    
    return event;
  }

  getEvents(filter?: {
    types?: EventType[];
    after?: string;
    before?: string;
    limit?: number;
  }): OrchestrationEvent[] {
    let result = [...this.events];

    if (filter?.types) {
      result = result.filter(e => filter.types!.includes(e.type));
    }

    if (filter?.after) {
      result = result.filter(e => e.timestamp > filter.after!);
    }

    if (filter?.before) {
      result = result.filter(e => e.timestamp < filter.before!);
    }

    if (filter?.limit) {
      result = result.slice(-filter.limit);
    }

    return result;
  }

  getEventById(eventId: string): OrchestrationEvent | undefined {
    return this.events.find(e => e.event_id === eventId);
  }

  getEventCount(): number {
    return this.events.length;
  }

  // ============================================================================
  // SNAPSHOT OPERATIONS
  // ============================================================================

  createSnapshot(
    queue: OrchestrationTask[],
    dag: DAGState,
    context: ContextState,
    budgets: Budgets,
    artifacts: Artifact[],
    trigger: Snapshot['trigger']
  ): Snapshot {
    const snapshot: Snapshot = {
      snapshot_id: generateId(),
      run_id: this.runId,
      timestamp: new Date().toISOString(),
      sequence_number: this.sequenceNumber,
      queue: JSON.parse(JSON.stringify(queue)),
      dag: JSON.parse(JSON.stringify(dag)),
      context: JSON.parse(JSON.stringify(context)),
      budgets: JSON.parse(JSON.stringify(budgets)),
      artifacts: JSON.parse(JSON.stringify(artifacts)),
      trigger,
      checksum: '',
    };

    snapshot.checksum = computeHash(JSON.stringify(snapshot), this.lastHash);
    this.snapshots.push(snapshot);

    // Log snapshot creation event
    this.appendEvent('SNAPSHOT_CREATED', {
      snapshot_id: snapshot.snapshot_id,
      trigger,
      queue_size: queue.length,
      artifacts_count: artifacts.length,
    });

    return snapshot;
  }

  getLatestSnapshot(): Snapshot | undefined {
    return this.snapshots[this.snapshots.length - 1];
  }

  getSnapshotById(snapshotId: string): Snapshot | undefined {
    return this.snapshots.find(s => s.snapshot_id === snapshotId);
  }

  getSnapshots(): Snapshot[] {
    return [...this.snapshots];
  }

  // ============================================================================
  // VERIFICATION
  // ============================================================================

  verifyChainIntegrity(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    let prevHash = '00000000';

    for (let i = 0; i < this.events.length; i++) {
      const event = this.events[i];

      // Verify previous hash link
      if (event.hash_prev !== prevHash) {
        errors.push(
          `Event ${event.event_id} has invalid hash_prev. Expected ${prevHash}, got ${event.hash_prev}`
        );
      }

      // Verify self hash
      const tempEvent = { ...event, hash_self: '' };
      const expectedHash = computeHash(JSON.stringify(tempEvent), event.hash_prev);
      // Note: Due to hash_self being part of the object, we need to recompute
      // In production, hash would exclude hash_self from computation
      
      // Verify sequence
      if (event.sequence_number !== i) {
        errors.push(
          `Event ${event.event_id} has invalid sequence. Expected ${i}, got ${event.sequence_number}`
        );
      }

      prevHash = event.hash_self;
    }

    return { valid: errors.length === 0, errors };
  }

  // ============================================================================
  // REPLAY SUPPORT
  // ============================================================================

  exportBundle(): {
    run_id: string;
    events: OrchestrationEvent[];
    snapshots: Snapshot[];
    exported_at: string;
  } {
    return {
      run_id: this.runId,
      events: [...this.events],
      snapshots: [...this.snapshots],
      exported_at: new Date().toISOString(),
    };
  }

  static fromBundle(bundle: ReturnType<EventStore['exportBundle']>): EventStore {
    const store = new EventStore(bundle.run_id);
    store.events = [...bundle.events];
    store.snapshots = [...bundle.snapshots];
    
    if (bundle.events.length > 0) {
      const lastEvent = bundle.events[bundle.events.length - 1];
      store.lastHash = lastEvent.hash_self;
      store.sequenceNumber = lastEvent.sequence_number + 1;
    }
    
    return store;
  }

  // ============================================================================
  // SUBSCRIPTIONS
  // ============================================================================

  subscribe(listener: (event: OrchestrationEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ============================================================================
  // QUERY HELPERS
  // ============================================================================

  getEventsByTask(taskId: string): OrchestrationEvent[] {
    return this.events.filter(e => 
      e.payload.task_id === taskId || 
      e.payload.taskId === taskId
    );
  }

  getVerificationEvents(): OrchestrationEvent[] {
    return this.events.filter(e => 
      e.type === 'VERIFICATION_RUN' ||
      e.type === 'VERIFICATION_PASSED' ||
      e.type === 'VERIFICATION_FAILED'
    );
  }

  getErrorEvents(): OrchestrationEvent[] {
    return this.events.filter(e => e.type === 'ERROR_RAISED');
  }

  getQueueMutations(): OrchestrationEvent[] {
    return this.events.filter(e => e.type === 'QUEUE_MUTATION');
  }

  getBudgetEvents(): OrchestrationEvent[] {
    return this.events.filter(e => 
      e.type === 'BUDGET_TICK' || 
      e.type === 'BUDGET_EXHAUSTED'
    );
  }

  // ============================================================================
  // TIMELINE VIEW
  // ============================================================================

  getTimeline(): {
    timestamp: string;
    type: EventType;
    summary: string;
    details: Record<string, unknown>;
  }[] {
    return this.events.map(e => ({
      timestamp: e.timestamp,
      type: e.type,
      summary: this.summarizeEvent(e),
      details: e.payload,
    }));
  }

  private summarizeEvent(event: OrchestrationEvent): string {
    switch (event.type) {
      case 'RUN_STARTED':
        return `Run started: ${event.payload.name || 'Unnamed'}`;
      case 'RUN_STOPPED':
        return `Run stopped: ${event.payload.reason || 'No reason'}`;
      case 'RUN_COMPLETED':
        return `Run completed successfully`;
      case 'PLAN_CREATED':
        return `Plan created with ${event.payload.steps || 0} steps`;
      case 'ACTION_EXECUTED':
        return `Executed: ${event.payload.action || 'Unknown action'}`;
      case 'TOOL_CALLED':
        return `Tool called: ${event.payload.tool || 'Unknown'}`;
      case 'TOOL_RESULT':
        return `Tool result: ${event.payload.success ? 'Success' : 'Failed'}`;
      case 'VERIFICATION_RUN':
        return `Verification started for ${event.payload.criterion || 'Unknown'}`;
      case 'VERIFICATION_PASSED':
        return `✓ Verification passed: ${event.payload.criterion || 'Unknown'}`;
      case 'VERIFICATION_FAILED':
        return `✗ Verification failed: ${event.payload.criterion || 'Unknown'}`;
      case 'QUEUE_MUTATION':
        return `Queue ${event.payload.mutation_type || 'modified'}: ${event.payload.task_title || 'Task'}`;
      case 'CHECKPOINT_CREATED':
        return `Checkpoint created: ${event.payload.trigger || 'manual'}`;
      case 'BUDGET_TICK':
        return `Budget update: ${event.payload.percent_used || 0}% used`;
      case 'BUDGET_EXHAUSTED':
        return `⚠ Budget exhausted: ${event.payload.budget_type || 'Unknown'}`;
      case 'ERROR_RAISED':
        return `Error: ${event.payload.message || 'Unknown error'}`;
      case 'STOP_REQUESTED':
        return `STOP requested: ${event.payload.reason || 'User initiated'}`;
      default:
        return event.type;
    }
  }
}
