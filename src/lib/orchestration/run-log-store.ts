// Persistent Run & Test Log Store
// Saves all run results, test results, events, and internal traces to localStorage
// Enables historical review and improvement analysis

import { TestResult, OrchestrationEvent, Snapshot, Budgets } from './types';

export interface RunLogEntry {
  id: string;
  type: 'test' | 'demo' | 'manual';
  name: string;
  timestamp: string;
  duration_ms: number;
  status: 'passed' | 'failed' | 'stopped' | 'completed' | 'error';
  
  // Full event trace
  events: OrchestrationEvent[];
  
  // Snapshots taken during run
  snapshots: Snapshot[];
  
  // Budget state at end
  budgets?: Budgets;
  
  // For test runs
  testResult?: TestResult;
  
  // Task summary
  tasksSummary: {
    total: number;
    done: number;
    failed: number;
    queued: number;
    canceled: number;
  };
  
  // Internal system traces
  traces: RunTrace[];
  
  // AI-generated improvement suggestions
  improvements?: string[];
}

export interface RunTrace {
  timestamp: string;
  system: 'kernel' | 'verifier' | 'auditor' | 'governor' | 'context' | 'queue' | 'llm';
  action: string;
  details: Record<string, unknown>;
}

export interface RunLogSummary {
  totalRuns: number;
  totalTests: number;
  passRate: number;
  avgScore: number;
  avgDuration: number;
  recentTrend: 'improving' | 'declining' | 'stable';
  topFailures: { testId: string; count: number }[];
}

const STORAGE_KEY = 'orchestration-run-logs';
const MAX_LOGS = 100;

export class RunLogStore {
  private logs: RunLogEntry[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch {
      this.logs = [];
    }
  }

  private save() {
    try {
      // Keep only most recent logs
      if (this.logs.length > MAX_LOGS) {
        this.logs = this.logs.slice(-MAX_LOGS);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
    } catch {
      // Storage full - trim more aggressively
      this.logs = this.logs.slice(-20);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
      } catch { /* give up */ }
    }
  }

  addLog(entry: RunLogEntry) {
    this.logs.push(entry);
    this.save();
  }

  getLogs(): RunLogEntry[] {
    return [...this.logs].reverse();
  }

  getLog(id: string): RunLogEntry | undefined {
    return this.logs.find(l => l.id === id);
  }

  getTestLogs(): RunLogEntry[] {
    return this.logs.filter(l => l.type === 'test').reverse();
  }

  getDemoLogs(): RunLogEntry[] {
    return this.logs.filter(l => l.type === 'demo').reverse();
  }

  getSummary(): RunLogSummary {
    const testLogs = this.logs.filter(l => l.type === 'test');
    const passedTests = testLogs.filter(l => l.status === 'passed');
    
    // Count failures by test ID
    const failureCounts = new Map<string, number>();
    testLogs.filter(l => l.status === 'failed').forEach(l => {
      const id = l.testResult?.test_id || l.name;
      failureCounts.set(id, (failureCounts.get(id) || 0) + 1);
    });

    const topFailures = Array.from(failureCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([testId, count]) => ({ testId, count }));

    // Trend: compare last 5 vs previous 5
    const recent5 = testLogs.slice(-5);
    const prev5 = testLogs.slice(-10, -5);
    const recentPassRate = recent5.length ? recent5.filter(l => l.status === 'passed').length / recent5.length : 0;
    const prevPassRate = prev5.length ? prev5.filter(l => l.status === 'passed').length / prev5.length : 0;
    const trend: RunLogSummary['recentTrend'] = 
      recentPassRate > prevPassRate + 0.1 ? 'improving' :
      recentPassRate < prevPassRate - 0.1 ? 'declining' : 'stable';

    return {
      totalRuns: this.logs.length,
      totalTests: testLogs.length,
      passRate: testLogs.length ? passedTests.length / testLogs.length : 0,
      avgScore: testLogs.length ? testLogs.reduce((s, l) => s + (l.testResult?.score || 0), 0) / testLogs.length : 0,
      avgDuration: this.logs.length ? this.logs.reduce((s, l) => s + l.duration_ms, 0) / this.logs.length : 0,
      recentTrend: trend,
      topFailures,
    };
  }

  clearLogs() {
    this.logs = [];
    this.save();
  }

  // Generate improvement suggestions based on log analysis
  analyzeForImprovements(): string[] {
    const suggestions: string[] = [];
    const summary = this.getSummary();

    if (summary.passRate < 0.5) {
      suggestions.push('Pass rate below 50% - review test case configurations and kernel execution logic.');
    }

    if (summary.topFailures.length > 0) {
      suggestions.push(`Most common failures: ${summary.topFailures.map(f => f.testId).join(', ')}. Focus debugging here.`);
    }

    if (summary.avgDuration > 5000) {
      suggestions.push('Average run duration exceeds 5s - consider optimizing simulated execution or reducing queue sizes.');
    }

    if (summary.recentTrend === 'declining') {
      suggestions.push('Recent trend is declining - review recent changes for regressions.');
    }

    // Check for common event patterns
    const recentLogs = this.logs.slice(-5);
    const budgetExhausted = recentLogs.filter(l => 
      l.events.some(e => e.type === 'BUDGET_EXHAUSTED')
    ).length;
    if (budgetExhausted > 2) {
      suggestions.push('Frequent budget exhaustion - consider increasing budget limits or optimizing token usage.');
    }

    return suggestions;
  }
}

// Singleton instance
export const runLogStore = new RunLogStore();
