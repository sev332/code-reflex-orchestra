// Test Result Detail - Full visibility into test execution
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle, XCircle, Clock, Activity, FileText, Shield,
  ChevronDown, ChevronRight, ArrowLeft, Brain, Cpu, Eye
} from 'lucide-react';
import { RunLogEntry } from '@/lib/orchestration/run-log-store';

interface TestResultDetailProps {
  log: RunLogEntry;
  onBack: () => void;
}

export const TestResultDetail: React.FC<TestResultDetailProps> = ({ log, onBack }) => {
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());
  const result = log.testResult;

  const toggleEvent = (idx: number) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const getEventIcon = (type: string) => {
    if (type.includes('VERIFICATION')) return <Shield className="w-3 h-3" />;
    if (type.includes('ACTION') || type.includes('PLAN')) return <Brain className="w-3 h-3" />;
    if (type.includes('BUDGET')) return <Cpu className="w-3 h-3" />;
    if (type.includes('QUEUE')) return <Activity className="w-3 h-3" />;
    return <FileText className="w-3 h-3" />;
  };

  const getEventColor = (type: string) => {
    if (type.includes('PASSED') || type === 'RUN_COMPLETED') return 'text-green-400';
    if (type.includes('FAILED') || type.includes('ERROR')) return 'text-red-400';
    if (type.includes('STOP') || type.includes('BUDGET_EXHAUSTED')) return 'text-yellow-400';
    if (type.includes('VERIFICATION')) return 'text-blue-400';
    return 'text-muted-foreground';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-3 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {log.status === 'passed' ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400" />
            )}
            <span className="font-medium text-sm">{log.name}</span>
            <Badge variant="outline" className="text-xs">
              {log.status}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {log.duration_ms}ms
            </span>
            <span>{log.events.length} events</span>
            <span>{new Date(log.timestamp).toLocaleString()}</span>
          </div>
        </div>
        {result && (
          <div className="text-right">
            <div className="text-lg font-bold">{result.score}/{result.max_score}</div>
            <Progress 
              value={(result.score / result.max_score) * 100} 
              className="h-1.5 w-24"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <Tabs defaultValue="events" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-3 mt-2 w-fit">
          <TabsTrigger value="events" className="gap-1 text-xs">
            <Activity className="w-3 h-3" /> Events ({log.events.length})
          </TabsTrigger>
          <TabsTrigger value="scoring" className="gap-1 text-xs">
            <CheckCircle className="w-3 h-3" /> Scoring
          </TabsTrigger>
          <TabsTrigger value="traces" className="gap-1 text-xs">
            <Brain className="w-3 h-3" /> Internal Traces
          </TabsTrigger>
          <TabsTrigger value="criteria" className="gap-1 text-xs">
            <Shield className="w-3 h-3" /> Criteria
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-1 text-xs">
            <Eye className="w-3 h-3" /> Insights
          </TabsTrigger>
        </TabsList>

        {/* Events Timeline */}
        <TabsContent value="events" className="flex-1 overflow-hidden px-3 pb-3">
          <ScrollArea className="h-full">
            <div className="space-y-1">
              {log.events.map((event, idx) => (
                <div key={idx} className="group">
                  <div
                    className="flex items-start gap-2 text-xs p-2 rounded hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleEvent(idx)}
                  >
                    {/* Timeline indicator */}
                    <div className="flex flex-col items-center mt-0.5">
                      <div className={`${getEventColor(event.type)}`}>
                        {getEventIcon(event.type)}
                      </div>
                      {idx < log.events.length - 1 && (
                        <div className="w-px h-full bg-border mt-1 min-h-[8px]" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${getEventColor(event.type)}`}>
                          {event.type}
                        </Badge>
                        <span className="text-muted-foreground truncate">
                          #{event.sequence_number}
                        </span>
                        <span className="text-muted-foreground ml-auto shrink-0">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    {expandedEvents.has(idx) ? (
                      <ChevronDown className="w-3 h-3 text-muted-foreground mt-0.5" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-muted-foreground mt-0.5" />
                    )}
                  </div>

                  {/* Expanded payload */}
                  {expandedEvents.has(idx) && (
                    <div className="ml-7 mb-2 p-2 rounded bg-muted/30 border border-border">
                      <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap overflow-auto max-h-48">
                        {JSON.stringify(event.payload, null, 2)}
                      </pre>
                      <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                        <span>hash: {event.hash_self.slice(0, 8)}</span>
                        <span>prev: {event.hash_prev.slice(0, 8)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Scoring Breakdown */}
        <TabsContent value="scoring" className="flex-1 overflow-hidden px-3 pb-3">
          <ScrollArea className="h-full">
            {result ? (
              <div className="space-y-4">
                {result.score_breakdown.map((cat, idx) => (
                  <Card key={idx} className="bg-card/50">
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>{cat.category}</span>
                        <Badge variant={cat.earned === cat.possible ? 'default' : 'secondary'}>
                          {cat.earned}/{cat.possible}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-3">
                      <div className="space-y-1">
                        {cat.details.map((detail, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            {detail.startsWith('✓') ? (
                              <CheckCircle className="w-3 h-3 text-green-400 shrink-0" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-400 shrink-0" />
                            )}
                            <span>{detail.replace(/^[✓✗]\s*/, '')}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No scoring data</p>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Internal Traces */}
        <TabsContent value="traces" className="flex-1 overflow-hidden px-3 pb-3">
          <ScrollArea className="h-full">
            <div className="space-y-1">
              {log.traces.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No internal traces recorded</p>
              ) : (
                log.traces.map((trace, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs p-2 rounded hover:bg-muted/50">
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {trace.system}
                    </Badge>
                    <span className="font-medium">{trace.action}</span>
                    <span className="text-muted-foreground ml-auto shrink-0">
                      {new Date(trace.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Must Do / Must Not Do Criteria */}
        <TabsContent value="criteria" className="flex-1 overflow-hidden px-3 pb-3">
          <ScrollArea className="h-full">
            {result ? (
              <div className="space-y-4">
                <Card className="bg-card/50">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-sm text-green-400">Must Do</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-3 space-y-2">
                    {result.must_do_results.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        {r.met ? (
                          <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <span>{r.criterion}</span>
                          {r.evidence && (
                            <pre className="text-[10px] text-muted-foreground mt-1 bg-muted/30 p-1 rounded overflow-auto max-h-20">
                              {r.evidence}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-card/50">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-sm text-red-400">Must Not Do</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-3 space-y-2">
                    {result.must_not_do_results.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        {!r.violated ? (
                          <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <span>{r.criterion}</span>
                          {r.evidence && (
                            <pre className="text-[10px] text-muted-foreground mt-1 bg-muted/30 p-1 rounded overflow-auto max-h-20">
                              {r.evidence}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No criteria data</p>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Insights & Improvements */}
        <TabsContent value="insights" className="flex-1 overflow-hidden px-3 pb-3">
          <ScrollArea className="h-full">
            <div className="space-y-4">
              {/* Task Summary */}
              <Card className="bg-card/50">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm">Task Summary</CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-3">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-muted/30 rounded">
                      <div className="text-lg font-bold">{log.tasksSummary.total}</div>
                      <div className="text-muted-foreground">Total</div>
                    </div>
                    <div className="text-center p-2 bg-green-500/10 rounded">
                      <div className="text-lg font-bold text-green-400">{log.tasksSummary.done}</div>
                      <div className="text-muted-foreground">Done</div>
                    </div>
                    <div className="text-center p-2 bg-red-500/10 rounded">
                      <div className="text-lg font-bold text-red-400">{log.tasksSummary.failed}</div>
                      <div className="text-muted-foreground">Failed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Improvement Suggestions */}
              {log.improvements && log.improvements.length > 0 && (
                <Card className="bg-card/50">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Brain className="w-4 h-4 text-primary" />
                      Improvement Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-3 space-y-2">
                    {log.improvements.map((imp, i) => (
                      <div key={i} className="text-xs p-2 bg-primary/5 border border-primary/20 rounded">
                        {imp}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Budget Usage */}
              {log.budgets && (
                <Card className="bg-card/50">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-sm">Budget Usage</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-3 space-y-2">
                    {[
                      { label: 'Tokens', used: log.budgets.used_output_tokens, max: log.budgets.max_output_tokens },
                      { label: 'Iterations', used: log.budgets.used_iterations, max: log.budgets.max_iterations },
                      { label: 'Tool Calls', used: log.budgets.used_tool_calls, max: log.budgets.max_tool_calls },
                    ].map((b, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{b.label}</span>
                          <span>{b.used}/{b.max}</span>
                        </div>
                        <Progress value={b.max > 0 ? (b.used / b.max) * 100 : 0} className="h-1.5" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestResultDetail;
