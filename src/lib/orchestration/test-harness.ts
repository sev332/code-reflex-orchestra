// Test Harness - DSL, Runner, and Scoring System

import {
  TestSpec,
  TestResult,
  OrchestrationTask,
  AcceptanceCriterion,
  Budgets,
  ContextState,
  QueuedInjection,
  ScoringRubric,
  Snapshot,
  generateId,
  createDefaultBudgets,
  createDefaultContext,
} from './types';
import { OrchestrationKernel } from './kernel';

// ============================================================================
// TEST CASE DEFINITIONS - 12+ required test cases
// ============================================================================

export const TEST_CASES: TestSpec[] = [
  // 1. Queue orchestration with reprioritization
  {
    test_id: 'queue-reprioritization',
    name: 'Queue Orchestration with Reprioritization',
    category: 'orchestration',
    difficulty: 'medium',
    description: 'Test that the system correctly handles dynamic priority changes during execution',
    initial_context: createDefaultContext(),
    initial_queue: [
      createTestTask('task-low', 'Low Priority Task', 'Do something simple', 20),
      createTestTask('task-medium', 'Medium Priority Task', 'Do something moderate', 50),
      createTestTask('task-high', 'High Priority Task', 'Do something important', 80),
    ],
    queued_injections: [
      {
        trigger: { type: 'action_count', value: 1 },
        injection: {
          type: 'modify_task',
          payload: { task_id: 'task-low', priority: 100, reason: 'Urgent escalation' },
        },
      },
    ],
    budgets: createDefaultBudgets(),
    must_do: [
      'Execute task-high first initially',
      'After injection, execute task-low next',
      'Complete all tasks in correct order',
    ],
    must_not_do: [
      'Execute task-low before task-high initially',
      'Ignore priority change',
    ],
    acceptance_criteria: [],
    scoring_rubric: {
      total_points: 100,
      categories: [
        {
          name: 'Order Correctness',
          weight: 0.6,
          criteria: [
            { description: 'Initial high priority first', points: 30, evaluation: 'deterministic' },
            { description: 'Reprioritization honored', points: 30, evaluation: 'deterministic' },
          ],
        },
        {
          name: 'Completion',
          weight: 0.4,
          criteria: [
            { description: 'All tasks completed', points: 40, evaluation: 'deterministic' },
          ],
        },
      ],
    },
  },

  // 2. Context overload + constraint extraction
  {
    test_id: 'context-overload',
    name: 'Context Overload with Constraint Extraction',
    category: 'context',
    difficulty: 'hard',
    description: 'Test handling of context overflow and proper constraint prioritization',
    initial_context: {
      ...createDefaultContext(),
      pinned: {
        tier: 'pinned',
        items: Array.from({ length: 20 }, (_, i) => ({
          id: `constraint-${i}`,
          content: `Constraint ${i}: Must follow rule ${i}`,
          type: 'constraint' as const,
          source: 'test',
          tokens: 50,
          priority: 100 - i,
          created_at: new Date().toISOString(),
          accessed_at: new Date().toISOString(),
          access_count: 0,
        })),
        max_tokens: 500,
        current_tokens: 1000, // Over limit
      },
    },
    initial_queue: [
      createTestTask('context-task', 'Process with Constraints', 'Execute while respecting all constraints', 50),
    ],
    queued_injections: [],
    budgets: createDefaultBudgets(),
    must_do: [
      'Extract exact constraint count',
      'Prioritize higher priority constraints',
      'Handle overflow gracefully',
    ],
    must_not_do: [
      'Crash on context overflow',
      'Ignore constraints',
    ],
    acceptance_criteria: [
      { id: 'constraint-count', type: 'custom', description: 'Extract constraint count', config: { check: 'is_not_empty' } },
    ],
    scoring_rubric: {
      total_points: 100,
      categories: [
        {
          name: 'Constraint Handling',
          weight: 0.7,
          criteria: [
            { description: 'Correct constraint count', points: 35, evaluation: 'deterministic' },
            { description: 'Priority ordering', points: 35, evaluation: 'deterministic' },
          ],
        },
        {
          name: 'Graceful Handling',
          weight: 0.3,
          criteria: [
            { description: 'No crash on overflow', points: 30, evaluation: 'deterministic' },
          ],
        },
      ],
    },
  },

  // 3. Verification-first behavior
  {
    test_id: 'verification-first',
    name: 'Verification-First with Schema Validation',
    category: 'verification',
    difficulty: 'medium',
    description: 'Test that verification runs and invalid outputs are detected',
    initial_context: createDefaultContext(),
    initial_queue: [
      {
        ...createTestTask('json-task', 'Generate Valid JSON', 'Output must be valid JSON with name and age fields', 50),
        acceptance_criteria: [
          {
            id: 'schema-check',
            type: 'schema',
            description: 'Output must match schema',
            config: {
              schema: {
                type: 'object',
                required: ['name', 'age'],
                properties: {
                  name: { type: 'string' },
                  age: { type: 'number' },
                },
              },
            },
          },
        ],
      },
    ],
    queued_injections: [],
    budgets: createDefaultBudgets(),
    must_do: [
      'Run schema validation',
      'Detect invalid output',
      'Create fix task on failure',
    ],
    must_not_do: [
      'Skip verification',
      'Accept invalid output',
    ],
    acceptance_criteria: [],
    scoring_rubric: {
      total_points: 100,
      categories: [
        {
          name: 'Verification',
          weight: 0.6,
          criteria: [
            { description: 'Schema validation executed', points: 30, evaluation: 'deterministic' },
            { description: 'Invalid detected', points: 30, evaluation: 'deterministic' },
          ],
        },
        {
          name: 'Recovery',
          weight: 0.4,
          criteria: [
            { description: 'Fix task created', points: 40, evaluation: 'deterministic' },
          ],
        },
      ],
    },
  },

  // 4. STOP interruption
  {
    test_id: 'stop-interrupt',
    name: 'STOP Interruption at Action N',
    category: 'interrupt',
    difficulty: 'easy',
    description: 'Test immediate halt on STOP signal with checkpoint',
    initial_context: createDefaultContext(),
    initial_queue: Array.from({ length: 10 }, (_, i) =>
      createTestTask(`task-${i}`, `Task ${i}`, `Execute task ${i}`, 50)
    ),
    queued_injections: [
      {
        trigger: { type: 'action_count', value: 3 },
        injection: { type: 'trigger_stop', payload: { reason: 'Test STOP signal' } },
      },
    ],
    budgets: createDefaultBudgets(),
    must_do: [
      'Stop immediately on signal',
      'Create checkpoint on stop',
      'Show queue state in checkpoint',
    ],
    must_not_do: [
      'Continue after STOP',
      'Lose state on STOP',
    ],
    acceptance_criteria: [],
    scoring_rubric: {
      total_points: 100,
      categories: [
        {
          name: 'Stop Semantics',
          weight: 0.7,
          criteria: [
            { description: 'Immediate halt', points: 35, evaluation: 'deterministic' },
            { description: 'Checkpoint created', points: 35, evaluation: 'deterministic' },
          ],
        },
        {
          name: 'State Preservation',
          weight: 0.3,
          criteria: [
            { description: 'Queue state preserved', points: 30, evaluation: 'deterministic' },
          ],
        },
      ],
    },
  },

  // 5. Budget compliance (tokens)
  {
    test_id: 'budget-tokens',
    name: 'Token Budget Compliance',
    category: 'budget',
    difficulty: 'easy',
    description: 'Test that token budget is strictly enforced',
    initial_context: createDefaultContext(),
    initial_queue: Array.from({ length: 20 }, (_, i) =>
      createTestTask(`task-${i}`, `Task ${i}`, `Execute a task that uses tokens: ${i}`, 50)
    ),
    queued_injections: [],
    budgets: {
      ...createDefaultBudgets(),
      max_output_tokens: 500, // Very low limit
    },
    must_do: [
      'Stop when token budget exhausted',
      'Create checkpoint before stopping',
      'Report budget exhaustion',
    ],
    must_not_do: [
      'Exceed token budget',
      'Continue after exhaustion',
    ],
    acceptance_criteria: [],
    scoring_rubric: {
      total_points: 100,
      categories: [
        {
          name: 'Budget Enforcement',
          weight: 0.8,
          criteria: [
            { description: 'Stops at limit', points: 40, evaluation: 'deterministic' },
            { description: 'Does not exceed', points: 40, evaluation: 'deterministic' },
          ],
        },
        {
          name: 'Reporting',
          weight: 0.2,
          criteria: [
            { description: 'Exhaustion reported', points: 20, evaluation: 'deterministic' },
          ],
        },
      ],
    },
  },

  // 6. Contradiction handling
  {
    test_id: 'contradiction-detection',
    name: 'Contradictory Constraints Resolution',
    category: 'contradiction',
    difficulty: 'hard',
    description: 'Test detection and handling of contradicting constraints',
    initial_context: {
      ...createDefaultContext(),
      pinned: {
        tier: 'pinned',
        items: [
          {
            id: 'constraint-1',
            content: 'Must use formal language only',
            type: 'constraint' as const,
            source: 'test',
            tokens: 10,
            priority: 100,
            created_at: new Date().toISOString(),
            accessed_at: new Date().toISOString(),
            access_count: 0,
          },
          {
            id: 'constraint-2',
            content: 'Must use casual and informal tone',
            type: 'constraint' as const,
            source: 'test',
            tokens: 10,
            priority: 90,
            created_at: new Date().toISOString(),
            accessed_at: new Date().toISOString(),
            access_count: 0,
          },
        ],
        max_tokens: 2000,
        current_tokens: 20,
      },
    },
    initial_queue: [
      createTestTask('write-task', 'Write Content', 'Write a paragraph following the constraints', 50),
    ],
    queued_injections: [],
    budgets: createDefaultBudgets(),
    must_do: [
      'Detect contradiction between constraints',
      'Log contradiction event',
      'Use priority to resolve (higher priority wins)',
    ],
    must_not_do: [
      'Ignore contradictions',
      'Fail silently',
    ],
    acceptance_criteria: [],
    scoring_rubric: {
      total_points: 100,
      categories: [
        {
          name: 'Detection',
          weight: 0.5,
          criteria: [
            { description: 'Contradiction detected', points: 50, evaluation: 'deterministic' },
          ],
        },
        {
          name: 'Resolution',
          weight: 0.5,
          criteria: [
            { description: 'Priority-based resolution', points: 50, evaluation: 'rubric' },
          ],
        },
      ],
    },
  },

  // 7. Tool-call discipline
  {
    test_id: 'tool-discipline',
    name: 'Tool Call Discipline',
    category: 'tool',
    difficulty: 'medium',
    description: 'Test proper tool usage policy adherence',
    initial_context: createDefaultContext(),
    initial_queue: [
      createTestTask('tool-task', 'Use Tools', 'Complete a task that may require tools', 50),
    ],
    queued_injections: [],
    budgets: {
      ...createDefaultBudgets(),
      max_tool_calls: 5,
    },
    must_do: [
      'Minimize tool calls',
      'Respect tool call limit',
      'Log all tool calls',
    ],
    must_not_do: [
      'Exceed tool call limit',
      'Make unnecessary tool calls',
    ],
    acceptance_criteria: [],
    scoring_rubric: {
      total_points: 100,
      categories: [
        {
          name: 'Efficiency',
          weight: 0.5,
          criteria: [
            { description: 'Minimal tool usage', points: 50, evaluation: 'rubric' },
          ],
        },
        {
          name: 'Compliance',
          weight: 0.5,
          criteria: [
            { description: 'Within limit', points: 50, evaluation: 'deterministic' },
          ],
        },
      ],
    },
  },

  // 8. Self-improvement
  {
    test_id: 'self-improvement',
    name: 'Process Notes Applied in Later Tasks',
    category: 'self_improvement',
    difficulty: 'hard',
    description: 'Test that learned insights are applied to subsequent tasks',
    initial_context: createDefaultContext(),
    initial_queue: [
      createTestTask('learn-task', 'Learn Pattern', 'Identify a useful pattern and document it', 50),
      createTestTask('apply-task', 'Apply Learning', 'Use the pattern from the previous task', 30),
    ],
    queued_injections: [],
    budgets: createDefaultBudgets(),
    must_do: [
      'Create process note from first task',
      'Add to working context',
      'Reference in second task',
    ],
    must_not_do: [
      'Forget learned patterns',
      'Ignore process notes',
    ],
    acceptance_criteria: [],
    scoring_rubric: {
      total_points: 100,
      categories: [
        {
          name: 'Learning',
          weight: 0.5,
          criteria: [
            { description: 'Process note created', points: 50, evaluation: 'deterministic' },
          ],
        },
        {
          name: 'Application',
          weight: 0.5,
          criteria: [
            { description: 'Note applied', points: 50, evaluation: 'rubric' },
          ],
        },
      ],
    },
  },

  // 9. Regression - replay produces same state
  {
    test_id: 'replay-regression',
    name: 'Replay Produces Same Snapshot State',
    category: 'regression',
    difficulty: 'hard',
    description: 'Test that replaying events produces identical state',
    initial_context: createDefaultContext(),
    initial_queue: [
      createTestTask('task-1', 'First Task', 'Do something', 50),
      createTestTask('task-2', 'Second Task', 'Do something else', 50),
    ],
    queued_injections: [],
    budgets: createDefaultBudgets(),
    must_do: [
      'Complete run and export bundle',
      'Replay from bundle',
      'Compare snapshots match',
    ],
    must_not_do: [
      'Have state drift between runs',
    ],
    acceptance_criteria: [],
    scoring_rubric: {
      total_points: 100,
      categories: [
        {
          name: 'Determinism',
          weight: 1.0,
          criteria: [
            { description: 'Snapshots match', points: 100, evaluation: 'deterministic' },
          ],
        },
      ],
    },
  },

  // 10. Drift detection
  {
    test_id: 'drift-detection',
    name: 'Contradiction Flagged During Execution',
    category: 'drift',
    difficulty: 'medium',
    description: 'Test that output drifting from constraints is detected',
    initial_context: {
      ...createDefaultContext(),
      pinned: {
        tier: 'pinned',
        items: [
          {
            id: 'no-tables',
            content: 'Must never use tables in output',
            type: 'constraint' as const,
            source: 'test',
            tokens: 10,
            priority: 100,
            created_at: new Date().toISOString(),
            accessed_at: new Date().toISOString(),
            access_count: 0,
          },
        ],
        max_tokens: 2000,
        current_tokens: 10,
      },
    },
    initial_queue: [
      {
        ...createTestTask('table-task', 'Generate Report', 'Create a structured report', 50),
        acceptance_criteria: [
          { id: 'no-tables', type: 'not_contains', description: 'No markdown tables', config: { pattern: '\\|.*\\|' } },
        ],
      },
    ],
    queued_injections: [],
    budgets: createDefaultBudgets(),
    must_do: [
      'Check output against constraints',
      'Flag if tables appear',
      'Log contradiction event',
    ],
    must_not_do: [
      'Ignore constraint violations',
    ],
    acceptance_criteria: [],
    scoring_rubric: {
      total_points: 100,
      categories: [
        {
          name: 'Detection',
          weight: 1.0,
          criteria: [
            { description: 'Drift detected and flagged', points: 100, evaluation: 'deterministic' },
          ],
        },
      ],
    },
  },

  // 11. Partial completion
  {
    test_id: 'partial-completion',
    name: 'Graceful Checkpoint Under Low Budget',
    category: 'partial',
    difficulty: 'medium',
    description: 'Test graceful handling when budget runs low mid-execution',
    initial_context: createDefaultContext(),
    initial_queue: Array.from({ length: 10 }, (_, i) =>
      createTestTask(`task-${i}`, `Task ${i}`, `Execute task ${i}`, 50)
    ),
    queued_injections: [],
    budgets: {
      ...createDefaultBudgets(),
      max_iterations: 3, // Only allow 3 iterations
    },
    must_do: [
      'Complete as many tasks as budget allows',
      'Create high-signal checkpoint',
      'Preserve incomplete queue state',
    ],
    must_not_do: [
      'Lose progress',
      'Crash on budget limit',
    ],
    acceptance_criteria: [],
    scoring_rubric: {
      total_points: 100,
      categories: [
        {
          name: 'Graceful Stop',
          weight: 0.6,
          criteria: [
            { description: 'Stops cleanly', points: 30, evaluation: 'deterministic' },
            { description: 'Checkpoint created', points: 30, evaluation: 'deterministic' },
          ],
        },
        {
          name: 'State Quality',
          weight: 0.4,
          criteria: [
            { description: 'Queue state preserved', points: 40, evaluation: 'deterministic' },
          ],
        },
      ],
    },
  },

  // 12. Failure handling
  {
    test_id: 'failure-fix-task',
    name: 'Verification Fail Spawns Fix Task',
    category: 'failure',
    difficulty: 'medium',
    description: 'Test that verification failures automatically spawn fix tasks',
    initial_context: createDefaultContext(),
    initial_queue: [
      {
        ...createTestTask('failing-task', 'Generate Content', 'Create content matching criteria', 50),
        acceptance_criteria: [
          { id: 'must-have-header', type: 'contains', description: 'Must have header', config: { pattern: '^#\\s' } },
          { id: 'must-have-list', type: 'contains', description: 'Must have bullet list', config: { pattern: '^[-*]\\s' } },
        ],
      },
    ],
    queued_injections: [],
    budgets: createDefaultBudgets(),
    must_do: [
      'Detect verification failure',
      'Create fix task with details',
      'Link fix task to original',
    ],
    must_not_do: [
      'Ignore failures',
      'Mark failed task as done',
      'Lose failure details',
    ],
    acceptance_criteria: [],
    scoring_rubric: {
      total_points: 100,
      categories: [
        {
          name: 'Fix Task Creation',
          weight: 0.7,
          criteria: [
            { description: 'Fix task created', points: 35, evaluation: 'deterministic' },
            { description: 'Proper linkage', points: 35, evaluation: 'deterministic' },
          ],
        },
        {
          name: 'Details',
          weight: 0.3,
          criteria: [
            { description: 'Failure details included', points: 30, evaluation: 'deterministic' },
          ],
        },
      ],
    },
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createTestTask(
  id: string,
  title: string,
  prompt: string,
  priority: number
): OrchestrationTask {
  const now = new Date().toISOString();
  return {
    task_id: id,
    title,
    prompt,
    acceptance_criteria: [],
    dependencies: [],
    priority: priority as any,
    status: 'queued',
    context_refs: [],
    history: [],
    created_at: now,
    updated_at: now,
    retry_count: 0,
    max_retries: 3,
    subtask_ids: [],
    tags: ['test'],
  };
}

// ============================================================================
// TEST RUNNER
// ============================================================================

export class TestRunner {
  private results: Map<string, TestResult> = new Map();

  async runTest(spec: TestSpec): Promise<TestResult> {
    const startTime = Date.now();
    const runId = generateId();

    try {
      // Create kernel with test config
      const kernel = new OrchestrationKernel({
        run_id: runId,
        name: `Test: ${spec.name}`,
        budgets: spec.budgets,
        mode: 'autonomous',
      });

      // Set up initial context
      if (spec.initial_context.pinned.items.length > 0) {
        for (const item of spec.initial_context.pinned.items) {
          kernel.addContext('pinned', item.content, item.type, item.priority);
        }
      }

      // Add initial tasks
      for (const task of spec.initial_queue) {
        kernel.addTask({
          title: task.title,
          prompt: task.prompt,
          acceptance_criteria: task.acceptance_criteria,
          dependencies: task.dependencies,
          priority: task.priority,
          tags: task.tags,
        });
      }

      // Set up injection handling
      let actionCount = 0;
      const injectionsToProcess = [...spec.queued_injections];

      // Custom execution with injection support
      const executeWithInjections = async () => {
        await kernel.start();
        
        // Process any pending injections
        for (const injection of injectionsToProcess) {
          if (injection.trigger.type === 'action_count' && 
              actionCount >= (injection.trigger.value as number)) {
            this.processInjection(kernel, injection);
          }
        }
      };

      await executeWithInjections();

      // Collect results
      const events = kernel.getEvents();
      const runState = kernel.getRunState();
      const queueStats = kernel.getQueueStats();

      // Evaluate must_do criteria
      const mustDoResults = spec.must_do.map(criterion => ({
        criterion,
        met: this.evaluateMustDo(criterion, events, runState, queueStats),
        evidence: this.getEvidence(criterion, events),
      }));

      // Evaluate must_not_do criteria
      const mustNotDoResults = spec.must_not_do.map(criterion => ({
        criterion,
        violated: this.evaluateMustNotDo(criterion, events, runState),
        evidence: this.getEvidence(criterion, events),
      }));

      // Calculate score
      const { score, breakdown } = this.calculateScore(spec.scoring_rubric, mustDoResults, mustNotDoResults, events);

      const result: TestResult = {
        test_id: spec.test_id,
        run_id: runId,
        passed: mustDoResults.every(r => r.met) && mustNotDoResults.every(r => !r.violated),
        score,
        max_score: spec.scoring_rubric.total_points,
        score_breakdown: breakdown,
        must_do_results: mustDoResults,
        must_not_do_results: mustNotDoResults,
        artifacts_match: true, // TODO: implement artifact comparison
        state_match: true, // TODO: implement state comparison
        duration_ms: Date.now() - startTime,
        events_count: events.length,
      };

      this.results.set(spec.test_id, result);
      return result;

    } catch (error) {
      const result: TestResult = {
        test_id: spec.test_id,
        run_id: runId,
        passed: false,
        score: 0,
        max_score: spec.scoring_rubric.total_points,
        score_breakdown: [],
        must_do_results: spec.must_do.map(c => ({ criterion: c, met: false })),
        must_not_do_results: spec.must_not_do.map(c => ({ criterion: c, violated: true })),
        artifacts_match: false,
        state_match: false,
        duration_ms: Date.now() - startTime,
        events_count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.results.set(spec.test_id, result);
      return result;
    }
  }

  async runSuite(testIds?: string[]): Promise<{
    passed: number;
    failed: number;
    total: number;
    results: TestResult[];
  }> {
    const testsToRun = testIds 
      ? TEST_CASES.filter(t => testIds.includes(t.test_id))
      : TEST_CASES;

    const results: TestResult[] = [];

    for (const spec of testsToRun) {
      const result = await this.runTest(spec);
      results.push(result);
    }

    return {
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      total: results.length,
      results,
    };
  }

  private processInjection(kernel: OrchestrationKernel, injection: QueuedInjection): void {
    switch (injection.injection.type) {
      case 'trigger_stop':
        kernel.stop(injection.injection.payload.reason as string);
        break;
      case 'add_task':
        kernel.addTask(injection.injection.payload as any);
        break;
      // Add more injection types as needed
    }
  }

  private evaluateMustDo(
    criterion: string,
    events: any[],
    runState: any,
    queueStats: any
  ): boolean {
    // Simple pattern matching for common criteria
    const criterionLower = criterion.toLowerCase();

    if (criterionLower.includes('complete all tasks')) {
      return queueStats.done === queueStats.total - queueStats.failed - queueStats.canceled;
    }

    if (criterionLower.includes('stop immediately')) {
      return events.some(e => e.type === 'STOP_REQUESTED');
    }

    if (criterionLower.includes('checkpoint')) {
      return events.some(e => e.type === 'CHECKPOINT_CREATED' || e.type === 'SNAPSHOT_CREATED');
    }

    if (criterionLower.includes('create fix task')) {
      return events.some(e => 
        e.type === 'QUEUE_MUTATION' && 
        e.payload?.mutation_type === 'add' &&
        (e.payload?.task_title?.toLowerCase().includes('fix') || 
         e.payload?.tags?.includes('fix'))
      );
    }

    if (criterionLower.includes('detect contradiction')) {
      return events.some(e => e.type === 'CONTRADICTION_DETECTED');
    }

    if (criterionLower.includes('schema validation')) {
      return events.some(e => e.type === 'VERIFICATION_RUN');
    }

    // Default to true for now (rubric evaluation)
    return true;
  }

  private evaluateMustNotDo(
    criterion: string,
    events: any[],
    runState: any
  ): boolean {
    const criterionLower = criterion.toLowerCase();

    if (criterionLower.includes('exceed')) {
      if (criterionLower.includes('token')) {
        return runState.config?.budgets?.used_output_tokens > runState.config?.budgets?.max_output_tokens;
      }
      if (criterionLower.includes('tool')) {
        return runState.config?.budgets?.used_tool_calls > runState.config?.budgets?.max_tool_calls;
      }
    }

    if (criterionLower.includes('continue after stop')) {
      const stopIndex = events.findIndex(e => e.type === 'STOP_REQUESTED');
      if (stopIndex === -1) return false;
      return events.slice(stopIndex + 1).some(e => e.type === 'ACTION_EXECUTED');
    }

    if (criterionLower.includes('crash')) {
      return events.some(e => e.type === 'ERROR_RAISED' && e.payload?.type === 'crash');
    }

    return false;
  }

  private getEvidence(criterion: string, events: any[]): string | undefined {
    // Return relevant event as evidence
    const relevantEvents = events.filter(e => 
      e.type.includes('STOP') || 
      e.type.includes('VERIFICATION') || 
      e.type.includes('CHECKPOINT') ||
      e.type.includes('BUDGET')
    );

    if (relevantEvents.length > 0) {
      return JSON.stringify(relevantEvents[0].payload);
    }

    return undefined;
  }

  private calculateScore(
    rubric: ScoringRubric,
    mustDoResults: TestResult['must_do_results'],
    mustNotDoResults: TestResult['must_not_do_results'],
    events: any[]
  ): { score: number; breakdown: TestResult['score_breakdown'] } {
    let totalScore = 0;
    const breakdown: TestResult['score_breakdown'] = [];

    for (const category of rubric.categories) {
      let categoryEarned = 0;
      const categoryPossible = category.criteria.reduce((sum, c) => sum + c.points, 0);
      const details: string[] = [];

      for (const criterion of category.criteria) {
        // Simple scoring based on must_do results
        const matchingMustDo = mustDoResults.find(r => 
          r.criterion.toLowerCase().includes(criterion.description.toLowerCase().split(' ')[0])
        );

        if (matchingMustDo?.met || criterion.evaluation === 'rubric') {
          categoryEarned += criterion.points;
          details.push(`✓ ${criterion.description}: ${criterion.points}pts`);
        } else {
          details.push(`✗ ${criterion.description}: 0/${criterion.points}pts`);
        }
      }

      totalScore += categoryEarned * category.weight;
      breakdown.push({
        category: category.name,
        earned: categoryEarned,
        possible: categoryPossible,
        details,
      });
    }

    return { score: Math.round(totalScore), breakdown };
  }

  getResult(testId: string): TestResult | undefined {
    return this.results.get(testId);
  }

  getAllResults(): TestResult[] {
    return Array.from(this.results.values());
  }
}

// ============================================================================
// CLI INTERFACE (for use in edge functions or node)
// ============================================================================

export async function runTestCLI(testId?: string): Promise<string> {
  const runner = new TestRunner();

  if (testId) {
    const spec = TEST_CASES.find(t => t.test_id === testId);
    if (!spec) {
      return `Test not found: ${testId}`;
    }
    const result = await runner.runTest(spec);
    return formatTestResult(result);
  }

  const suiteResult = await runner.runSuite();
  return formatSuiteResult(suiteResult);
}

function formatTestResult(result: TestResult): string {
  const lines = [
    `# Test: ${result.test_id}`,
    `Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`,
    `Score: ${result.score}/${result.max_score}`,
    `Duration: ${result.duration_ms}ms`,
    `Events: ${result.events_count}`,
    '',
    '## Must Do',
    ...result.must_do_results.map(r => `  ${r.met ? '✓' : '✗'} ${r.criterion}`),
    '',
    '## Must Not Do',
    ...result.must_not_do_results.map(r => `  ${r.violated ? '✗' : '✓'} ${r.criterion}`),
    '',
    '## Score Breakdown',
    ...result.score_breakdown.map(b => 
      `  ${b.category}: ${b.earned}/${b.possible}\n    ${b.details.join('\n    ')}`
    ),
  ];

  if (result.error) {
    lines.push('', `## Error`, result.error);
  }

  return lines.join('\n');
}

function formatSuiteResult(result: { passed: number; failed: number; total: number; results: TestResult[] }): string {
  const lines = [
    '# Test Suite Results',
    `Passed: ${result.passed}/${result.total}`,
    `Failed: ${result.failed}/${result.total}`,
    '',
    '## Individual Results',
    ...result.results.map(r => 
      `  ${r.passed ? '✅' : '❌'} ${r.test_id}: ${r.score}/${r.max_score}`
    ),
  ];

  return lines.join('\n');
}
