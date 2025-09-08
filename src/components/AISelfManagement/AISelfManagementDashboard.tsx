// 🔗 CONNECT: AI Self-Management Dashboard → Real-time Monitoring → System Control
// 🧩 INTENT: Main dashboard for AI to monitor and control its own validation processes
// ✅ SPEC: AI-Self-Management-Dashboard-v1.0

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Search, Calculator, CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react';
import { useAISelfManagement } from '@/hooks/useAISelfManagement';

export function AISelfManagementDashboard() {
  const {
    backgroundAgents,
    pendingValidations,
    systemMetrics,
    auditResults,
    isInitialized,
    error,
    registerTheory,
    validateTheoryManually,
    performSelfAudit,
    isValidating,
    validationProgress,
    activeAgents
  } = useAISelfManagement();

  const [newTheory, setNewTheory] = useState({
    theory: '',
    claims: [''],
    validationMethods: ['web_search'],
    priority: 5
  });

  // 🔗 CONNECT: Theory Registration → UI Form → Validation Pipeline
  // 🧩 INTENT: Handle new theory submission from AI
  // ✅ SPEC: Theory-Registration-UI-v1.0
  const handleSubmitTheory = async () => {
    if (!newTheory.theory.trim() || newTheory.claims.every(c => !c.trim())) {
      return;
    }

    const filteredClaims = newTheory.claims.filter(c => c.trim());
    await registerTheory(
      newTheory.theory,
      filteredClaims,
      newTheory.validationMethods as any,
      newTheory.priority
    );

    // Reset form
    setNewTheory({
      theory: '',
      claims: [''],
      validationMethods: ['web_search'],
      priority: 5
    });
  };

  const addClaim = () => {
    setNewTheory(prev => ({
      ...prev,
      claims: [...prev.claims, '']
    }));
  };

  const updateClaim = (index: number, value: string) => {
    setNewTheory(prev => ({
      ...prev,
      claims: prev.claims.map((claim, i) => i === index ? value : claim)
    }));
  };

  const toggleValidationMethod = (method: string) => {
    setNewTheory(prev => ({
      ...prev,
      validationMethods: prev.validationMethods.includes(method)
        ? prev.validationMethods.filter(m => m !== method)
        : [...prev.validationMethods, method]
    }));
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Brain className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Initializing AI Self-Management System...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAgents}</div>
            <p className="text-xs text-muted-foreground">Background agents working</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Theories Validated</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.validatedTheories}</div>
            <p className="text-xs text-muted-foreground">
              {systemMetrics.totalTheories} total theories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validation Accuracy</CardTitle>
            <Brain className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(systemMetrics.accuracy * 100).toFixed(1)}%</div>
            <Progress value={systemMetrics.accuracy * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(systemMetrics.avgProcessingTime / 1000).toFixed(1)}s</div>
            <p className="text-xs text-muted-foreground">Average validation time</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Interface */}
      <Tabs defaultValue="register" className="space-y-4">
        <TabsList>
          <TabsTrigger value="register">Register Theory</TabsTrigger>
          <TabsTrigger value="validations">Active Validations</TabsTrigger>
          <TabsTrigger value="agents">Background Agents</TabsTrigger>
          <TabsTrigger value="audit">Self-Audit</TabsTrigger>
        </TabsList>

        {/* Theory Registration */}
        <TabsContent value="register" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Register New Theory for Validation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Theory Statement</label>
                <Textarea
                  value={newTheory.theory}
                  onChange={(e) => setNewTheory(prev => ({ ...prev, theory: e.target.value }))}
                  placeholder="Enter the theory you want to validate..."
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Claims to Validate</label>
                {newTheory.claims.map((claim, index) => (
                  <Input
                    key={index}
                    value={claim}
                    onChange={(e) => updateClaim(index, e.target.value)}
                    placeholder={`Claim ${index + 1}`}
                    className="mt-1"
                  />
                ))}
                <Button variant="outline" onClick={addClaim} className="mt-2">
                  Add Another Claim
                </Button>
              </div>

              <div>
                <label className="text-sm font-medium">Validation Methods</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {[
                    { id: 'web_search', label: 'Web Search', icon: Search },
                    { id: 'mathematical', label: 'Mathematical', icon: Calculator },
                    { id: 'source_verification', label: 'Source Verification', icon: CheckCircle },
                    { id: 'logical_reasoning', label: 'Logical Reasoning', icon: Brain }
                  ].map((method) => {
                    const Icon = method.icon;
                    const isSelected = newTheory.validationMethods.includes(method.id);
                    return (
                      <Button
                        key={method.id}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleValidationMethod(method.id)}
                        className="flex items-center space-x-1"
                      >
                        <Icon className="h-3 w-3" />
                        <span>{method.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Priority (1-10)</label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={newTheory.priority}
                  onChange={(e) => setNewTheory(prev => ({ ...prev, priority: parseInt(e.target.value) || 5 }))}
                  className="mt-1 w-24"
                />
              </div>

              <Button onClick={handleSubmitTheory} className="w-full" disabled={isValidating}>
                {isValidating ? 'Processing...' : 'Register Theory for Validation'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Validations */}
        <TabsContent value="validations" className="space-y-4">
          {pendingValidations.map((validation) => (
            <Card key={validation.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{validation.theory}</CardTitle>
                  <Badge variant={
                    validation.status === 'validated' ? 'default' :
                    validation.status === 'validating' ? 'secondary' :
                    validation.status === 'refuted' ? 'destructive' : 'outline'
                  }>
                    {validation.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <strong>Claims:</strong>
                    <ul className="list-disc list-inside ml-4">
                      {validation.claims.map((claim, index) => (
                        <li key={index} className="text-sm">{claim}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong>Validation Methods:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {validation.validation_methods.map((method) => (
                        <Badge key={method} variant="outline" className="text-xs">
                          {method}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Priority: {validation.priority} | Created: {new Date(validation.created_at).toLocaleDateString()}
                    </span>
                    {validation.status === 'pending' && (
                      <Button 
                        size="sm" 
                        onClick={() => validateTheoryManually(validation.id)}
                        disabled={isValidating}
                      >
                        Validate Now
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {pendingValidations.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No active validations. Register a theory to get started.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Background Agents */}
        <TabsContent value="agents" className="space-y-4">
          {backgroundAgents.map((agent) => (
            <Card key={agent.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{agent.name}</CardTitle>
                  <Badge variant={
                    agent.status === 'active' ? 'default' :
                    agent.status === 'processing' ? 'secondary' :
                    agent.status === 'error' ? 'destructive' : 'outline'
                  }>
                    {agent.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{agent.purpose}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Capabilities:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {agent.capabilities.map((cap) => (
                        <Badge key={cap} variant="outline" className="text-xs">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <strong>Performance:</strong>
                    <div className="space-y-1 mt-1">
                      <div>Theories: {agent.performance_metrics.theories_validated}</div>
                      <div>Accuracy: {(agent.performance_metrics.accuracy_rate * 100).toFixed(1)}%</div>
                      <div>Avg Time: {(agent.performance_metrics.avg_processing_time / 1000).toFixed(1)}s</div>
                    </div>
                  </div>
                </div>
                {agent.current_task && (
                  <div className="mt-3 p-2 bg-muted rounded">
                    <strong className="text-xs">Current Task:</strong>
                    <p className="text-xs mt-1">{agent.current_task.theory}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Self-Audit */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Self-Audit System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={performSelfAudit} className="w-full">
                Perform Self-Audit Analysis
              </Button>

              {auditResults && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {(auditResults.validation_accuracy * 100).toFixed(1)}%
                          </div>
                          <p className="text-sm text-muted-foreground">Validation Accuracy</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {(auditResults.theory_success_rate * 100).toFixed(1)}%
                          </div>
                          <p className="text-sm text-muted-foreground">Theory Success Rate</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {(auditResults.context_efficiency * 100).toFixed(1)}%
                          </div>
                          <p className="text-sm text-muted-foreground">Context Efficiency</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Improvement Suggestions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {auditResults.improvement_suggestions.map((suggestion: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 text-orange-500" />
                            <span className="text-sm">{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}