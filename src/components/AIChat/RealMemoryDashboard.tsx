// 🔗 CONNECT: Real CMC → UI Visualization
// 🧩 INTENT: Live dashboard showing RS-based memory, reasoning chains, and verification
// ✅ SPEC: Real-time view of AIM-OS consciousness

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRealCMC } from '@/hooks/useRealCMC';
import { Brain, Database, CheckCircle2, AlertTriangle, Activity, Layers } from 'lucide-react';

export function RealMemoryDashboard() {
  const { 
    stats, 
    refreshStats, 
    buildHierarchy,
    lastChain,
    lastVerification,
    isProcessing 
  } = useRealCMC();
  
  const [hierarchy, setHierarchy] = useState<{
    L1: any[];
    L2: any[];
    L3: any[];
  }>({ L1: [], L2: [], L3: [] });
  
  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, [refreshStats]);
  
  const handleBuildHierarchy = async () => {
    const h = await buildHierarchy();
    setHierarchy(h);
  };
  
  return (
    <Card className="w-full p-6 bg-background/95 backdrop-blur">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Brain className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">AIM-OS Consciousness Monitor</h2>
          <p className="text-sm text-muted-foreground">Real-time memory & reasoning transparency</p>
        </div>
        {isProcessing && (
          <Badge variant="secondary" className="ml-auto animate-pulse">
            <Activity className="w-3 h-3 mr-1" />
            Processing
          </Badge>
        )}
      </div>
      
      <Tabs defaultValue="memory" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
          <TabsTrigger value="reasoning">Reasoning</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
        </TabsList>
        
        {/* Memory Stats */}
        <TabsContent value="memory" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Total Memories</span>
              </div>
              <div className="text-3xl font-bold">{stats.total}</div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Avg RS Score</span>
              </div>
              <div className="text-3xl font-bold">{stats.avg_rs_score.toFixed(3)}</div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Short-Term</span>
              </div>
              <div className="text-3xl font-bold">{stats.by_tier['short'] || 0}</div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Compressed</span>
              </div>
              <div className="text-3xl font-bold">{stats.compressed_count}</div>
            </Card>
          </div>
          
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Memory Distribution</h3>
            <div className="space-y-2">
              {Object.entries(stats.by_tier).map(([tier, count]) => (
                <div key={tier} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{tier} Tier</span>
                  <Badge variant="secondary">{count} memories</Badge>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
        
        {/* Memory Hierarchy */}
        <TabsContent value="hierarchy" className="space-y-4">
          <Button onClick={handleBuildHierarchy} disabled={isProcessing}>
            <Layers className="w-4 h-4 mr-2" />
            Build Memory Hierarchy
          </Button>
          
          <div className="grid gap-4">
            {/* L1: Short-term */}
            <Card className="p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Badge>L1</Badge>
                Short-Term Memory ({hierarchy.L1.length})
              </h3>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {hierarchy.L1.map((mem: any) => (
                    <div key={mem.id} className="text-xs p-2 bg-muted rounded">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-xs">
                          RS: {mem.retrieval_score?.toFixed(3)}
                        </Badge>
                        <span className="text-muted-foreground">{mem.token_count} tokens</span>
                      </div>
                      <p className="truncate">{mem.content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
            
            {/* L2: Medium-term */}
            <Card className="p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Badge>L2</Badge>
                Medium-Term Memory ({hierarchy.L2.length})
              </h3>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {hierarchy.L2.map((mem: any) => (
                    <div key={mem.id} className="text-xs p-2 bg-muted rounded">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-xs">
                          RS: {mem.retrieval_score?.toFixed(3)}
                        </Badge>
                        <span className="text-muted-foreground">{mem.token_count} tokens</span>
                      </div>
                      <p className="truncate">{mem.content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
            
            {/* L3: Long-term */}
            <Card className="p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Badge>L3</Badge>
                Long-Term Memory ({hierarchy.L3.length})
              </h3>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {hierarchy.L3.map((mem: any) => (
                    <div key={mem.id} className="text-xs p-2 bg-muted rounded">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-xs">
                          RS: {mem.retrieval_score?.toFixed(3)}
                        </Badge>
                        <span className="text-muted-foreground">{mem.token_count} tokens</span>
                      </div>
                      <p className="truncate">{mem.content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </TabsContent>
        
        {/* Reasoning Chain */}
        <TabsContent value="reasoning" className="space-y-4">
          {lastChain ? (
            <>
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Latest Reasoning Chain</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Trace ID:</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{lastChain.trace_id}</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Query:</span>
                    <span className="font-medium">{lastChain.user_query}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Confidence:</span>
                    <Badge variant={lastChain.confidence >= 0.8 ? 'default' : 'secondary'}>
                      {(lastChain.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Provenance κ:</span>
                    <Badge variant={lastChain.provenance_coverage >= 0.85 ? 'default' : 'destructive'}>
                      {(lastChain.provenance_coverage * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Token Usage:</span>
                    <span>{lastChain.tokens_used} / {lastChain.token_budget}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{lastChain.duration_ms}ms</span>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Reasoning Steps ({lastChain.steps.length})</h3>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {lastChain.steps.map((step, idx) => (
                      <div key={idx} className="p-3 bg-muted rounded">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{step.node}</Badge>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {step.duration_ms}ms
                            </Badge>
                            <Badge 
                              variant={step.status === 'completed' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {step.status}
                            </Badge>
                          </div>
                        </div>
                        {step.agent && (
                          <div className="text-xs text-muted-foreground mb-1">
                            Agent: {step.agent}
                          </div>
                        )}
                        {step.confidence && (
                          <div className="text-xs">
                            Confidence: {(step.confidence * 100).toFixed(0)}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </>
          ) : (
            <Card className="p-8 text-center">
              <Brain className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No reasoning chains yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Execute a query to see real APOE orchestration
              </p>
            </Card>
          )}
        </TabsContent>
        
        {/* Verification */}
        <TabsContent value="verification" className="space-y-4">
          {lastVerification ? (
            <>
              <Card className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  {lastVerification.passed ? (
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-yellow-500" />
                  )}
                  <div>
                    <h3 className="font-semibold">
                      {lastVerification.passed ? 'Verification Passed' : 'Verification Failed'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Confidence: {lastVerification.confidence_level}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Provenance Coverage (κ)</span>
                      <Badge variant={lastVerification.provenance_coverage >= 0.85 ? 'default' : 'destructive'}>
                        {(lastVerification.provenance_coverage * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${lastVerification.provenance_coverage * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  {lastVerification.calibration_score !== undefined && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Calibration (ECE)</span>
                        <Badge variant={lastVerification.calibration_score <= 0.10 ? 'default' : 'secondary'}>
                          {lastVerification.calibration_score.toFixed(3)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Target: ≤0.10 (excellent), ≤0.05 (perfect)
                      </p>
                    </div>
                  )}
                </div>
              </Card>
              
              {lastVerification.issues.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Issues Found
                  </h3>
                  <div className="space-y-2">
                    {lastVerification.issues.map((issue, idx) => (
                      <div key={idx} className="text-sm p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                        {issue}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
              
              {lastVerification.recommendations.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Recommendations</h3>
                  <div className="space-y-2">
                    {lastVerification.recommendations.map((rec, idx) => (
                      <div key={idx} className="text-sm p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                        • {rec}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-8 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No verification results yet</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
