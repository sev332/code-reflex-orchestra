// Enhanced Orchestration Test Runner with persistent logging
import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Play, CheckCircle, XCircle, Clock, RefreshCw, 
  ChevronDown, ChevronRight, FileText, Eye
} from 'lucide-react';
import { TestRunner, TEST_CASES } from '@/lib/orchestration';
import { runLogStore, RunLogEntry } from '@/lib/orchestration/run-log-store';
import { generateId } from '@/lib/orchestration/types';
import { TestResultDetail } from './TestResultDetail';

interface LocalTestResult {
  test_id: string;
  passed: boolean;
  score: number;
  max_score: number;
  duration_ms: number;
  details: string[];
  error?: string;
  logId?: string;
}

export const OrchestrationTestRunner: React.FC = () => {
  const [results, setResults] = useState<LocalTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const saveTestLog = useCallback((
    testId: string,
    spec: typeof TEST_CASES[0],
    result: Awaited<ReturnType<TestRunner['runTest']>>,
    duration: number,
    events: any[]
  ): string => {
    const logId = generateId();
    const logEntry: RunLogEntry = {
      id: logId,
      type: 'test',
      name: `${spec.name} (${testId})`,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
      status: result.passed ? 'passed' : 'failed',
      events: events,
      snapshots: [],
      testResult: result,
      tasksSummary: {
        total: spec.initial_queue.length,
        done: result.must_do_results.filter(r => r.met).length,
        failed: result.must_do_results.filter(r => !r.met).length,
        queued: 0,
        canceled: 0,
      },
      traces: [
        { timestamp: new Date().toISOString(), system: 'kernel', action: 'test_started', details: { test_id: testId } },
        { timestamp: new Date().toISOString(), system: 'verifier', action: 'criteria_checked', details: { must_do: result.must_do_results.length, must_not_do: result.must_not_do_results.length } },
        { timestamp: new Date().toISOString(), system: 'auditor', action: 'scoring_completed', details: { score: result.score, max: result.max_score } },
      ],
      improvements: runLogStore.analyzeForImprovements(),
    };
    runLogStore.addLog(logEntry);
    return logId;
  }, []);

  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    setResults([]);
    
    const runner = new TestRunner();
    const newResults: LocalTestResult[] = [];

    for (const testCase of TEST_CASES) {
      setCurrentTest(testCase.test_id);
      const startTime = Date.now();
      
      try {
        const result = await runner.runTest(testCase);
        const duration = Date.now() - startTime;
        const logId = saveTestLog(testCase.test_id, testCase, result, duration, []);
        
        newResults.push({
          test_id: testCase.test_id,
          passed: result.passed,
          score: result.score,
          max_score: result.max_score,
          duration_ms: duration,
          details: result.score_breakdown.flatMap(b => b.details),
          logId,
        });
      } catch (error) {
        newResults.push({
          test_id: testCase.test_id,
          passed: false,
          score: 0,
          max_score: 100,
          duration_ms: Date.now() - startTime,
          details: [],
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      
      setResults([...newResults]);
    }
    
    setCurrentTest(null);
    setIsRunning(false);
  }, [saveTestLog]);

  const runSingleTest = useCallback(async (testId: string) => {
    setIsRunning(true);
    setCurrentTest(testId);
    
    const runner = new TestRunner();
    const testCase = TEST_CASES.find(t => t.test_id === testId);
    if (!testCase) { setIsRunning(false); return; }

    const startTime = Date.now();
    try {
      const result = await runner.runTest(testCase);
      const duration = Date.now() - startTime;
      const logId = saveTestLog(testId, testCase, result, duration, []);
      
      setResults(prev => {
        const filtered = prev.filter(r => r.test_id !== testId);
        return [...filtered, {
          test_id: testCase.test_id,
          passed: result.passed,
          score: result.score,
          max_score: result.max_score,
          duration_ms: duration,
          details: result.score_breakdown.flatMap(b => b.details),
          logId,
        }];
      });
    } catch (error) {
      setResults(prev => {
        const filtered = prev.filter(r => r.test_id !== testId);
        return [...filtered, {
          test_id: testCase.test_id,
          passed: false,
          score: 0,
          max_score: 100,
          duration_ms: Date.now() - startTime,
          details: [],
          error: error instanceof Error ? error.message : 'Unknown error',
        }];
      });
    }
    
    setCurrentTest(null);
    setIsRunning(false);
  }, [saveTestLog]);

  const toggleExpanded = (testId: string) => {
    setExpandedTests(prev => {
      const next = new Set(prev);
      next.has(testId) ? next.delete(testId) : next.add(testId);
      return next;
    });
  };

  // Show detail view if a log is selected
  if (selectedLogId) {
    const log = runLogStore.getLog(selectedLogId);
    if (log) {
      return <TestResultDetail log={log} onBack={() => setSelectedLogId(null)} />;
    }
  }

  const totalPassed = results.filter(r => r.passed).length;
  const totalScore = results.reduce((acc, r) => acc + r.score, 0);
  const maxScore = results.reduce((acc, r) => acc + r.max_score, 0);

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Test Harness</h2>
          {results.length > 0 && (
            <Badge variant="outline" className={totalPassed === results.length ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary-foreground'}>
              {totalPassed}/{results.length} passed
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={runAllTests} disabled={isRunning}>
            {isRunning ? (
              <><RefreshCw className="w-4 h-4 mr-1 animate-spin" /> Running...</>
            ) : (
              <><Play className="w-4 h-4 mr-1" /> Run All Tests</>
            )}
          </Button>
        </div>
      </div>

      {/* Score Summary */}
      {results.length > 0 && (
        <div className="border-b border-border p-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Total Score</span>
            <span className="font-medium">{totalScore}/{maxScore} ({maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0}%)</span>
          </div>
          <Progress value={maxScore > 0 ? (totalScore / maxScore) * 100 : 0} className="h-2" />
        </div>
      )}

      {/* Test List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {TEST_CASES.map(testCase => {
            const result = results.find(r => r.test_id === testCase.test_id);
            const isExpanded = expandedTests.has(testCase.test_id);
            const isCurrent = currentTest === testCase.test_id;

            return (
              <Card key={testCase.test_id} className="bg-card/50">
                <CardContent className="p-3">
                  <div 
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => result && toggleExpanded(testCase.test_id)}
                  >
                    {isCurrent ? (
                      <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                    ) : result ? (
                      result.passed ? (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive" />
                      )
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-muted-foreground/50" />
                    )}

                    {result && (
                      isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{testCase.test_id}</span>
                        <Badge variant="secondary" className="text-xs">{testCase.category}</Badge>
                      </div>
                    </div>

                    {result && (
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{result.score}/{result.max_score}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {result.duration_ms}ms
                        </span>
                      </div>
                    )}

                    {/* View Detail Button */}
                    {result?.logId && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLogId(result.logId!);
                        }}
                        title="View full details"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                    )}

                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={(e) => {
                        e.stopPropagation();
                        runSingleTest(testCase.test_id);
                      }}
                      disabled={isRunning}
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                  </div>

                  {isExpanded && result && (
                    <div className="mt-3 pt-3 border-t border-border space-y-2">
                      {result.error && (
                        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                          Error: {result.error}
                        </div>
                      )}
                      {result.details.map((detail, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          {detail.startsWith('✓') ? (
                            <CheckCircle className="w-3 h-3 text-primary mt-0.5" />
                          ) : (
                            <XCircle className="w-3 h-3 text-destructive mt-0.5" />
                          )}
                          <span>{detail.replace(/^[✓✗]\s*/, '')}</span>
                        </div>
                      ))}
                      {result.details.length === 0 && !result.error && (
                        <div className="text-sm text-muted-foreground">No additional details</div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default OrchestrationTestRunner;
