// Run History Browser - View all past test runs and their results
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle, XCircle, Clock, Trash2, TrendingUp,
  TrendingDown, Minus, Activity, Brain
} from 'lucide-react';
import { runLogStore, RunLogEntry, RunLogSummary } from '@/lib/orchestration/run-log-store';
import { TestResultDetail } from './TestResultDetail';

export const RunHistoryBrowser: React.FC = () => {
  const [selectedLog, setSelectedLog] = useState<RunLogEntry | null>(null);
  const [filter, setFilter] = useState<'all' | 'test' | 'demo'>('all');

  const logs = useMemo(() => {
    const allLogs = runLogStore.getLogs();
    if (filter === 'test') return allLogs.filter(l => l.type === 'test');
    if (filter === 'demo') return allLogs.filter(l => l.type === 'demo');
    return allLogs;
  }, [filter]);

  const summary = useMemo(() => runLogStore.getSummary(), []);
  const improvements = useMemo(() => runLogStore.analyzeForImprovements(), []);

  if (selectedLog) {
    return <TestResultDetail log={selectedLog} onBack={() => setSelectedLog(null)} />;
  }

  const trendIcon = summary.recentTrend === 'improving' 
    ? <TrendingUp className="w-4 h-4 text-green-400" />
    : summary.recentTrend === 'declining'
    ? <TrendingDown className="w-4 h-4 text-red-400" />
    : <Minus className="w-4 h-4 text-muted-foreground" />;

  return (
    <div className="h-full flex flex-col">
      {/* Summary Header */}
      <div className="border-b border-border p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Run History
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(['all', 'test', 'demo'] as const).map(f => (
                <Button
                  key={f}
                  size="sm"
                  variant={filter === f ? 'default' : 'ghost'}
                  className="text-xs h-6 px-2"
                  onClick={() => setFilter(f)}
                >
                  {f}
                </Button>
              ))}
            </div>
            {logs.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-6 px-2 text-destructive"
                onClick={() => {
                  runLogStore.clearLogs();
                  setFilter('all');
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-1.5 bg-muted/30 rounded text-xs">
            <div className="font-bold">{summary.totalRuns}</div>
            <div className="text-muted-foreground">Runs</div>
          </div>
          <div className="text-center p-1.5 bg-muted/30 rounded text-xs">
            <div className="font-bold">{Math.round(summary.passRate * 100)}%</div>
            <div className="text-muted-foreground">Pass Rate</div>
          </div>
          <div className="text-center p-1.5 bg-muted/30 rounded text-xs">
            <div className="font-bold">{Math.round(summary.avgScore)}</div>
            <div className="text-muted-foreground">Avg Score</div>
          </div>
          <div className="text-center p-1.5 bg-muted/30 rounded text-xs flex flex-col items-center">
            {trendIcon}
            <div className="text-muted-foreground">{summary.recentTrend}</div>
          </div>
        </div>

        {/* Improvement suggestions */}
        {improvements.length > 0 && (
          <div className="space-y-1">
            {improvements.slice(0, 2).map((imp, i) => (
              <div key={i} className="text-[10px] p-1.5 bg-primary/5 border border-primary/20 rounded flex items-start gap-1.5">
                <Brain className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                {imp}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No run history yet. Run some tests to see results here.
            </p>
          ) : (
            logs.map(log => (
              <Card
                key={log.id}
                className="bg-card/50 cursor-pointer hover:bg-card/80 transition-colors"
                onClick={() => setSelectedLog(log)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    {log.status === 'passed' || log.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{log.name}</span>
                        <Badge variant="secondary" className="text-[10px]">{log.type}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {log.duration_ms}ms
                        </span>
                        <span>{log.events.length} events</span>
                        <span>{log.tasksSummary.done}/{log.tasksSummary.total} tasks</span>
                      </div>
                    </div>
                    {log.testResult && (
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold">
                          {log.testResult.score}/{log.testResult.max_score}
                        </div>
                        <Progress
                          value={(log.testResult.score / log.testResult.max_score) * 100}
                          className="h-1 w-16"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default RunHistoryBrowser;
