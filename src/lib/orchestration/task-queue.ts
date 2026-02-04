// Task Queue - DAG-aware task management with dependencies

import {
  OrchestrationTask,
  TaskStatus,
  TaskPriority,
  AcceptanceCriterion,
  TaskHistoryEntry,
  DAGState,
  DAGNode,
  DAGEdge,
  generateId,
} from './types';
import { EventStore } from './event-store';

export class TaskQueue {
  private tasks: Map<string, OrchestrationTask> = new Map();
  private eventStore: EventStore;

  constructor(eventStore: EventStore) {
    this.eventStore = eventStore;
  }

  // ============================================================================
  // TASK CRUD
  // ============================================================================

  addTask(params: {
    title: string;
    prompt: string;
    acceptance_criteria?: AcceptanceCriterion[];
    dependencies?: string[];
    priority?: TaskPriority;
    context_refs?: string[];
    tags?: string[];
    parent_task_id?: string;
    estimated_tokens?: number;
  }): OrchestrationTask {
    const now = new Date().toISOString();
    const task: OrchestrationTask = {
      task_id: generateId(),
      title: params.title,
      prompt: params.prompt,
      acceptance_criteria: params.acceptance_criteria || [],
      dependencies: params.dependencies || [],
      priority: params.priority || 50,
      status: 'queued',
      context_refs: params.context_refs || [],
      history: [{
        timestamp: now,
        field: 'status',
        old_value: null,
        new_value: 'queued',
        reason: 'Task created',
      }],
      created_at: now,
      updated_at: now,
      retry_count: 0,
      max_retries: 3,
      parent_task_id: params.parent_task_id,
      subtask_ids: [],
      tags: params.tags || [],
      estimated_tokens: params.estimated_tokens,
    };

    // Check if blocked by unfinished dependencies
    if (this.hasUnfinishedDependencies(task)) {
      task.status = 'blocked';
      task.history.push({
        timestamp: now,
        field: 'status',
        old_value: 'queued',
        new_value: 'blocked',
        reason: 'Has unfinished dependencies',
      });
    }

    this.tasks.set(task.task_id, task);

    // Update parent if exists
    if (params.parent_task_id) {
      const parent = this.tasks.get(params.parent_task_id);
      if (parent) {
        parent.subtask_ids.push(task.task_id);
        parent.updated_at = now;
      }
    }

    // Log event
    this.eventStore.appendEvent('QUEUE_MUTATION', {
      mutation_type: 'add',
      task_id: task.task_id,
      task_title: task.title,
      priority: task.priority,
      dependencies: task.dependencies,
    });

    return task;
  }

  getTask(taskId: string): OrchestrationTask | undefined {
    return this.tasks.get(taskId);
  }

  getAllTasks(): OrchestrationTask[] {
    return Array.from(this.tasks.values());
  }

  updateTask(
    taskId: string,
    updates: Partial<OrchestrationTask>,
    reason: string
  ): OrchestrationTask | undefined {
    const task = this.tasks.get(taskId);
    if (!task) return undefined;

    const now = new Date().toISOString();

    // Track history for key fields
    const trackedFields = ['status', 'priority', 'prompt', 'dependencies'];
    for (const field of trackedFields) {
      if (field in updates && updates[field as keyof OrchestrationTask] !== task[field as keyof OrchestrationTask]) {
        task.history.push({
          timestamp: now,
          field,
          old_value: task[field as keyof OrchestrationTask],
          new_value: updates[field as keyof OrchestrationTask],
          reason,
        });
      }
    }

    // Apply updates
    Object.assign(task, updates, { updated_at: now });

    // Log event
    this.eventStore.appendEvent('QUEUE_MUTATION', {
      mutation_type: 'update',
      task_id: taskId,
      task_title: task.title,
      updates: Object.keys(updates),
      reason,
    });

    return task;
  }

  // ============================================================================
  // TASK STATUS MANAGEMENT
  // ============================================================================

  setTaskStatus(taskId: string, status: TaskStatus, reason: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    const now = new Date().toISOString();
    const oldStatus = task.status;

    task.history.push({
      timestamp: now,
      field: 'status',
      old_value: oldStatus,
      new_value: status,
      reason,
    });

    task.status = status;
    task.updated_at = now;

    if (status === 'active' && !task.started_at) {
      task.started_at = now;
    }

    if (status === 'done' || status === 'failed' || status === 'canceled') {
      task.completed_at = now;
      // Unblock dependent tasks
      this.updateBlockedTasks();
    }

    return true;
  }

  markTaskDone(taskId: string, result: OrchestrationTask['result']): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    task.result = result;
    task.actual_tokens = result?.tokens_used;
    
    return this.setTaskStatus(taskId, 'done', 'Task completed successfully');
  }

  markTaskFailed(taskId: string, error: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    task.retry_count++;

    if (task.retry_count < task.max_retries) {
      return this.setTaskStatus(taskId, 'queued', `Retry ${task.retry_count}/${task.max_retries}: ${error}`);
    }

    return this.setTaskStatus(taskId, 'failed', `Max retries exceeded: ${error}`);
  }

  // ============================================================================
  // DEPENDENCY MANAGEMENT
  // ============================================================================

  private hasUnfinishedDependencies(task: OrchestrationTask): boolean {
    return task.dependencies.some(depId => {
      const dep = this.tasks.get(depId);
      return dep && dep.status !== 'done';
    });
  }

  private updateBlockedTasks(): void {
    for (const task of this.tasks.values()) {
      if (task.status === 'blocked' && !this.hasUnfinishedDependencies(task)) {
        this.setTaskStatus(task.task_id, 'queued', 'Dependencies resolved');
      }
    }
  }

  addDependency(taskId: string, dependencyId: string, reason: string): boolean {
    const task = this.tasks.get(taskId);
    const dependency = this.tasks.get(dependencyId);
    
    if (!task || !dependency) return false;
    if (task.dependencies.includes(dependencyId)) return true;

    // Check for circular dependency
    if (this.wouldCreateCycle(taskId, dependencyId)) {
      this.eventStore.appendEvent('ERROR_RAISED', {
        type: 'circular_dependency',
        task_id: taskId,
        dependency_id: dependencyId,
        message: 'Cannot add dependency: would create cycle',
      });
      return false;
    }

    task.dependencies.push(dependencyId);
    task.updated_at = new Date().toISOString();

    if (dependency.status !== 'done') {
      this.setTaskStatus(taskId, 'blocked', `Blocked by ${dependency.title}`);
    }

    this.eventStore.appendEvent('QUEUE_MUTATION', {
      mutation_type: 'add_dependency',
      task_id: taskId,
      dependency_id: dependencyId,
      reason,
    });

    return true;
  }

  private wouldCreateCycle(taskId: string, newDepId: string): boolean {
    const visited = new Set<string>();
    const stack = [newDepId];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current === taskId) return true;
      if (visited.has(current)) continue;
      
      visited.add(current);
      const task = this.tasks.get(current);
      if (task) {
        stack.push(...task.dependencies);
      }
    }

    return false;
  }

  // ============================================================================
  // TASK SPLITTING & MERGING
  // ============================================================================

  splitTask(taskId: string, subtasks: Array<{
    title: string;
    prompt: string;
    acceptance_criteria?: AcceptanceCriterion[];
  }>, reason: string): OrchestrationTask[] {
    const parent = this.tasks.get(taskId);
    if (!parent) return [];

    const created: OrchestrationTask[] = [];
    let prevTaskId: string | undefined;

    for (let i = 0; i < subtasks.length; i++) {
      const subtask = this.addTask({
        ...subtasks[i],
        parent_task_id: taskId,
        priority: parent.priority,
        dependencies: prevTaskId ? [prevTaskId] : [],
        context_refs: parent.context_refs,
        tags: [...parent.tags, 'subtask'],
      });
      created.push(subtask);
      prevTaskId = subtask.task_id;
    }

    // Mark parent as blocked until subtasks complete
    parent.subtask_ids = created.map(t => t.task_id);
    this.setTaskStatus(taskId, 'blocked', `Split into ${subtasks.length} subtasks: ${reason}`);

    this.eventStore.appendEvent('QUEUE_MUTATION', {
      mutation_type: 'split',
      task_id: taskId,
      subtask_ids: created.map(t => t.task_id),
      reason,
    });

    return created;
  }

  mergeTasks(taskIds: string[], mergedTitle: string, reason: string): OrchestrationTask | undefined {
    const tasks = taskIds.map(id => this.tasks.get(id)).filter(Boolean) as OrchestrationTask[];
    if (tasks.length !== taskIds.length) return undefined;

    // Collect all dependencies and context refs
    const allDeps = new Set<string>();
    const allContextRefs = new Set<string>();
    const allTags = new Set<string>();
    let highestPriority: TaskPriority = 0;

    for (const task of tasks) {
      task.dependencies.forEach(d => allDeps.add(d));
      task.context_refs.forEach(c => allContextRefs.add(c));
      task.tags.forEach(t => allTags.add(t));
      if (task.priority > highestPriority) highestPriority = task.priority;
    }

    // Remove self-references
    taskIds.forEach(id => allDeps.delete(id));

    // Create merged task
    const mergedTask = this.addTask({
      title: mergedTitle,
      prompt: tasks.map(t => `## ${t.title}\n${t.prompt}`).join('\n\n'),
      acceptance_criteria: tasks.flatMap(t => t.acceptance_criteria),
      dependencies: Array.from(allDeps),
      priority: highestPriority,
      context_refs: Array.from(allContextRefs),
      tags: Array.from(allTags),
    });

    // Cancel original tasks
    for (const task of tasks) {
      this.setTaskStatus(task.task_id, 'canceled', `Merged into ${mergedTask.task_id}`);
    }

    this.eventStore.appendEvent('QUEUE_MUTATION', {
      mutation_type: 'merge',
      merged_task_ids: taskIds,
      new_task_id: mergedTask.task_id,
      reason,
    });

    return mergedTask;
  }

  // ============================================================================
  // PRIORITIZATION
  // ============================================================================

  reprioritize(taskId: string, newPriority: TaskPriority, reason: string): boolean {
    return !!this.updateTask(taskId, { priority: newPriority }, reason);
  }

  batchReprioritize(updates: Array<{ taskId: string; priority: TaskPriority }>, reason: string): void {
    for (const update of updates) {
      this.reprioritize(update.taskId, update.priority, reason);
    }
  }

  // ============================================================================
  // QUEUE OPERATIONS
  // ============================================================================

  getNextTask(): OrchestrationTask | undefined {
    const available = Array.from(this.tasks.values())
      .filter(t => t.status === 'queued')
      .sort((a, b) => {
        // Higher priority first
        if (b.priority !== a.priority) return b.priority - a.priority;
        // Older tasks first
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

    return available[0];
  }

  getQueuedTasks(): OrchestrationTask[] {
    return Array.from(this.tasks.values())
      .filter(t => t.status === 'queued')
      .sort((a, b) => b.priority - a.priority);
  }

  getActiveTasks(): OrchestrationTask[] {
    return Array.from(this.tasks.values()).filter(t => t.status === 'active');
  }

  getBlockedTasks(): OrchestrationTask[] {
    return Array.from(this.tasks.values()).filter(t => t.status === 'blocked');
  }

  getCompletedTasks(): OrchestrationTask[] {
    return Array.from(this.tasks.values()).filter(t => t.status === 'done');
  }

  getFailedTasks(): OrchestrationTask[] {
    return Array.from(this.tasks.values()).filter(t => t.status === 'failed');
  }

  // ============================================================================
  // DAG OPERATIONS
  // ============================================================================

  getDAGState(): DAGState {
    const nodes: DAGNode[] = [];
    const edges: DAGEdge[] = [];
    const depths = new Map<string, number>();

    // Calculate depths
    const calculateDepth = (taskId: string, visited: Set<string> = new Set()): number => {
      if (visited.has(taskId)) return 0;
      if (depths.has(taskId)) return depths.get(taskId)!;

      visited.add(taskId);
      const task = this.tasks.get(taskId);
      if (!task) return 0;

      if (task.dependencies.length === 0) {
        depths.set(taskId, 0);
        return 0;
      }

      const maxDepDeph = Math.max(
        ...task.dependencies.map(d => calculateDepth(d, visited))
      );
      const depth = maxDepDeph + 1;
      depths.set(taskId, depth);
      return depth;
    };

    // Build nodes and edges
    for (const task of this.tasks.values()) {
      calculateDepth(task.task_id);
      
      nodes.push({
        task_id: task.task_id,
        status: task.status,
        depth: depths.get(task.task_id) || 0,
      });

      for (const depId of task.dependencies) {
        edges.push({
          from: depId,
          to: task.task_id,
          type: 'dependency',
        });
      }

      for (const subId of task.subtask_ids) {
        edges.push({
          from: task.task_id,
          to: subId,
          type: 'spawned',
        });
      }
    }

    // Calculate execution order (topological sort)
    const executionOrder = this.topologicalSort();

    return {
      nodes,
      edges,
      execution_order: executionOrder,
      completed: this.getCompletedTasks().map(t => t.task_id),
      blocked: this.getBlockedTasks().map(t => t.task_id),
    };
  }

  private topologicalSort(): string[] {
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    // Initialize
    for (const task of this.tasks.values()) {
      inDegree.set(task.task_id, task.dependencies.length);
      
      for (const dep of task.dependencies) {
        const adj = adjacency.get(dep) || [];
        adj.push(task.task_id);
        adjacency.set(dep, adj);
      }
    }

    // Find all nodes with no dependencies
    const queue: string[] = [];
    for (const [taskId, degree] of inDegree.entries()) {
      if (degree === 0) queue.push(taskId);
    }

    // Process
    const result: string[] = [];
    while (queue.length > 0) {
      // Sort by priority within the queue
      queue.sort((a, b) => {
        const taskA = this.tasks.get(a);
        const taskB = this.tasks.get(b);
        return (taskB?.priority || 0) - (taskA?.priority || 0);
      });

      const current = queue.shift()!;
      result.push(current);

      const neighbors = adjacency.get(current) || [];
      for (const neighbor of neighbors) {
        const newDegree = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) queue.push(neighbor);
      }
    }

    return result;
  }

  // ============================================================================
  // SERIALIZATION
  // ============================================================================

  toArray(): OrchestrationTask[] {
    return Array.from(this.tasks.values());
  }

  fromArray(tasks: OrchestrationTask[]): void {
    this.tasks.clear();
    for (const task of tasks) {
      this.tasks.set(task.task_id, task);
    }
  }

  getStats(): {
    total: number;
    queued: number;
    active: number;
    blocked: number;
    done: number;
    failed: number;
    canceled: number;
  } {
    const tasks = Array.from(this.tasks.values());
    return {
      total: tasks.length,
      queued: tasks.filter(t => t.status === 'queued').length,
      active: tasks.filter(t => t.status === 'active').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
      done: tasks.filter(t => t.status === 'done').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      canceled: tasks.filter(t => t.status === 'canceled').length,
    };
  }
}
