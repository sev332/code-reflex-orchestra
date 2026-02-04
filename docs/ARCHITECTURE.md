# ARCHITECTURE.md - Orchestration-Grade Autonomous AI Chat System

## Overview

This system implements a production-quality "orchestration-native" AI chat system with:
- Event-sourced state management
- DAG-aware task queue with dependencies
- Three-tier context management
- Verification-first execution
- Hard budget enforcement with STOP semantics
- Comprehensive test harness

## Module Map

```
src/lib/orchestration/
├── types.ts           # Core type definitions
├── event-store.ts     # Append-only event log with tamper-evident chaining
├── task-queue.ts      # DAG-aware task management
├── context-manager.ts # Three-tier context (pinned/working/longterm)
├── verifier.ts        # Deterministic + rubric verification
├── autonomy-governor.ts # Budget enforcement + modes + STOP
├── kernel.ts          # Main orchestration loop
├── test-harness.ts    # Test DSL + runner + 12 test cases
└── index.ts           # Module exports
```

## Data Flow

```
User Request → Kernel.addTask() → TaskQueue
                                      ↓
                              Kernel.runLoop()
                                      ↓
                         ContextManager.selectContext()
                                      ↓
                              Execute Task (LLM)
                                      ↓
                         Verifier.verifyAll()
                                      ↓
                    ┌─── Pass ────────┴──── Fail ───┐
                    ↓                               ↓
              Mark Done                    Create Fix Task
                    ↓                               ↓
              EventStore.appendEvent() ←────────────┘
                    ↓
              Checkpoint (if needed)
```

## Key Invariants

1. **Event Log Integrity**: Events are hash-chained; tampering is detectable
2. **Budget Hard Stops**: Never exceed budgets; always checkpoint before stopping
3. **Verification-First**: Failed verification spawns fix tasks, never ignored
4. **Deterministic Replay**: Same events + tool outputs = same final state
5. **STOP Semantics**: Immediate halt, checkpoint, queue state preserved

## Component Details

### EventStore
- Append-only with hash chaining (hash_prev → hash_self)
- Sequence numbers for ordering
- Snapshot creation for periodic state materialization
- Export/import for replay support

### TaskQueue
- Priority-based ordering (0-100)
- Dependency tracking with cycle detection
- Status: queued → active → done/failed/canceled
- Split/merge operations with event logging

### ContextManager
- Pinned: Non-negotiable constraints (never evicted)
- Working: Current task context (LRU eviction)
- Longterm: Searchable memory store
- Contradiction detection against pinned constraints

### Verifier
- Schema validation (JSON)
- Contains/not-contains patterns
- Word limits
- Lint checks (simulated)
- Custom checks
- Auto-generates fix tasks on failure

### AutonomyGovernor
- Modes: manual, supervised, autonomous
- Budgets: wall_time, tokens, tool_calls, iterations, risk_actions
- Risk policy with approval workflows
- STOP signal handling

### Kernel
- Main execution loop
- Callback system for UI integration
- Checkpoint management
- Mode switching (autonomous ↔ manual stepping)

## Test Harness

12 test categories implemented:
1. Queue reprioritization
2. Context overload
3. Verification-first
4. STOP interruption
5. Token budget compliance
6. Contradiction detection
7. Tool discipline
8. Self-improvement
9. Replay regression
10. Drift detection
11. Partial completion
12. Failure → fix task

## Usage

```typescript
import { OrchestrationKernel } from '@/lib/orchestration';

const kernel = new OrchestrationKernel({
  name: 'My Run',
  mode: 'autonomous',
  budgets: { max_iterations: 50, max_output_tokens: 10000 }
});

kernel.addTask({
  title: 'Generate Report',
  prompt: 'Create a detailed analysis...',
  acceptance_criteria: [
    { id: 'has-summary', type: 'contains', config: { pattern: '## Summary' } }
  ]
});

await kernel.start();
```
