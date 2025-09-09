// 🔗 CONNECT: SDF-CVF Dashboard → AI Self-Organization Interface
// 🧩 INTENT: Beautiful interface for monitoring reasoning traces and validation status
// ✅ SPEC: Real-time SDF-CVF metrics with neural aesthetics and interactive controls

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  GitBranch,
  Shield,
  Activity,
  Database,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Eye,
  Brain,
  Network,
  Zap,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useSDFCVF } from '@/hooks/useSDFCVF';

export const SDFCVFDashboard: React.FC = () => {
  const {
    reasoningTraces,
    validationResults,
    contextStatus,
    isValidating,
    error,
    getValidationSummary,
    getRecentTraces,
    refreshContext,
    createReasoningTrace,
    validateArtifact,
    complianceScore,
    hasActiveConnections
  } = useSDFCVF();

  const validationSummary = getValidationSummary();
  const recentTraces = getRecentTraces(5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-wisdom-success';
      case 'fail': return 'text-destructive';
      case 'warning': return 'text-wisdom-warning';
      default: return 'text-muted-foreground';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-4 h-4 text-destructive" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-wisdom-warning" />;
      case 'medium': return <Eye className="w-4 h-4 text-primary" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-wisdom-success" />;
      default: return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const handleTestReasoning = async () => {
    await createReasoningTrace(
      'Test SDF-CVF reasoning trace generation',
      ['memory_system', 'validation_engine'],
      ['maintain_compliance', 'ensure_traceability'],
      'test_artifact'
    );
  };

  const handleValidateSystem = async () => {
    await validateArtifact(['current_system_state']);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neural-glow font-neural flex items-center gap-3">
            <GitBranch className="w-6 h-6" />
            SDF-CVF Core
          </h2>
          <p className="text-muted-foreground mt-1">
            Self-Documenting Framework with Component Validation
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={refreshContext}
            disabled={isValidating}
            variant="outline"
            size="sm"
            className="neural-glow"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
            Refresh Context
          </Button>
          
          <Button
            onClick={handleTestReasoning}
            disabled={isValidating}
            variant="outline"
            size="sm"
            className="neural-glow"
          >
            <Brain className="w-4 h-4 mr-2" />
            Test Reasoning
          </Button>
          
          <Button
            onClick={handleValidateSystem}
            disabled={isValidating}
            className="bg-gradient-neural hover:opacity-90 neural-glow"
            size="sm"
          >
            <Shield className="w-4 h-4 mr-2" />
            Validate System
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="w-4 h-4" />
              <span className="font-medium">SDF-CVF Error:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="neural-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              Context Memories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {contextStatus.total_memories}
            </div>
            <p className="text-xs text-muted-foreground">
              Active memory entries
            </p>
          </CardContent>
        </Card>

        <Card className="neural-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Network className="w-4 h-4 text-accent" />
              Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {contextStatus.active_connections}
            </div>
            <p className="text-xs text-muted-foreground">
              Validated links
            </p>
          </CardContent>
        </Card>

        <Card className="neural-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-wisdom-success" />
              Compliance Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-wisdom-success">
              {(complianceScore * 100).toFixed(0)}%
            </div>
            <Progress value={complianceScore * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="neural-glow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-wisdom-neural" />
              Last Updated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium text-wisdom-neural">
              {new Date(contextStatus.last_updated).toLocaleTimeString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Context refresh
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Validation Summary */}
      <Card className="neural-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Validation Summary
          </CardTitle>
          <CardDescription>
            Current validation status across all artifacts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">
                {validationSummary.total}
              </div>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-wisdom-success">
                {validationSummary.passed}
              </div>
              <p className="text-xs text-muted-foreground">Passed</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">
                {validationSummary.failed}
              </div>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-wisdom-warning">
                {validationSummary.warnings}
              </div>
              <p className="text-xs text-muted-foreground">Warnings</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">
                {validationSummary.critical}
              </div>
              <p className="text-xs text-muted-foreground">Critical</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {validationSummary.auto_fixable}
              </div>
              <p className="text-xs text-muted-foreground">Auto-Fixable</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reasoning Traces */}
        <Card className="neural-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-wisdom-neural" />
              Recent Reasoning Traces
            </CardTitle>
            <CardDescription>
              Latest AI reasoning and decision paths
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {recentTraces.length > 0 ? (
                  recentTraces.map((trace, index) => (
                    <div key={index} className="border-l-2 border-primary/30 pl-4 py-2">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {trace.artifact}
                        </Badge>
                        <Badge 
                          variant={trace.trace.compliance ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {(trace.trace.confidence_score * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      
                      <p className="text-sm mb-1 line-clamp-2">
                        {trace.trace.reasoning}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {trace.tags.length} tags
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Priority: {trace.metadata.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(trace.trace.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No reasoning traces yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Validation Results */}
        <Card className="neural-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" />
              Validation Results
            </CardTitle>
            <CardDescription>
              Latest artifact validation outcomes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {validationResults.length > 0 ? (
                  validationResults.slice(0, 10).map((result, index) => (
                    <div key={index} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/5">
                      {getSeverityIcon(result.severity)}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium truncate">
                            {result.rule}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getStatusColor(result.status)}`}
                          >
                            {result.status}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {result.message}
                        </p>
                        
                        {result.auto_fixable && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            Auto-fixable
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No validation results</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {hasActiveConnections ? (
              <CheckCircle className="w-4 h-4 text-wisdom-success" />
            ) : (
              <XCircle className="w-4 h-4 text-muted-foreground" />
            )}
            <span>Connection Integrity</span>
          </div>
          
          <div className="flex items-center gap-2">
            {complianceScore > 0.8 ? (
              <CheckCircle className="w-4 h-4 text-wisdom-success" />
            ) : complianceScore > 0.6 ? (
              <AlertTriangle className="w-4 h-4 text-wisdom-warning" />
            ) : (
              <XCircle className="w-4 h-4 text-destructive" />
            )}
            <span>System Compliance</span>
          </div>
          
          <div className="flex items-center gap-2">
            {isValidating ? (
              <RefreshCw className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <Zap className="w-4 h-4 text-primary" />
            )}
            <span>{isValidating ? 'Validating...' : 'Ready'}</span>
          </div>
        </div>
        
        <div className="text-right">
          <p>SDF-CVF v2.0 • Neural Compliance Engine</p>
        </div>
      </div>
    </div>
  );
};