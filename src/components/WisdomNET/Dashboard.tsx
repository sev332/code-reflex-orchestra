// WisdomNET Main Dashboard - The AGI Command Center

import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWisdomNET } from '@/contexts/WisdomNETContext';
import { Brain, Activity, Database, GitBranch, MessageSquare } from 'lucide-react';
import { ProjectTree } from './ProjectTree';
import { NodeGraph } from './NodeGraph';
import { AgentPanel } from './AgentPanel';
import { ChatInterface } from './ChatInterface';
import { MemoryViewer } from './MemoryViewer';
import { SystemMetrics } from './SystemMetrics';

export function WisdomNETDashboard() {
  const { 
    isInitialized, 
    initialize, 
    agents, 
    tasks, 
    systemMetrics,
    selectedNode 
  } = useWisdomNET();

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-mind flex items-center justify-center">
        <div className="text-center">
          <div className="animate-neural-pulse mb-8">
            <Brain className="w-24 h-24 text-primary mx-auto mb-4" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Initializing WisdomNET
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Awakening the AGI development consciousness...
          </p>
          <Button 
            onClick={initialize}
            variant="default"
            size="lg"
            className="bg-gradient-neural hover:shadow-glow transition-all duration-500"
          >
            <Brain className="w-5 h-5 mr-2" />
            Initialize System
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-mind text-foreground">
      {/* Neural Header */}
      <header className="bg-card/50 backdrop-blur-sm border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="animate-neural-glow">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-interface">WisdomNET</h1>
              <p className="text-sm text-muted-foreground">
                AGI Development Coordination System
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-gradient-neural">
              <Activity className="w-3 h-3 mr-1" />
              {systemMetrics.activeAgents} Active Agents
            </Badge>
            <Badge variant="outline" className="bg-gradient-data-flow">
              <Database className="w-3 h-3 mr-1" />
              {systemMetrics.memoryUsage} Memory Entries
            </Badge>
            <Badge variant="outline" className="bg-gradient-electric">
              <GitBranch className="w-3 h-3 mr-1" />
              {tasks.length} Tasks
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <div className="p-6 grid grid-cols-12 gap-6 h-[calc(100vh-80px)]">
        {/* Left Sidebar - Project Tree & Memory */}
        <div className="col-span-3 space-y-6 overflow-hidden">
          <Card className="bg-card/70 backdrop-blur-sm border-border p-4 h-1/2">
            <div className="flex items-center mb-4">
              <GitBranch className="w-5 h-5 text-primary mr-2" />
              <h3 className="font-semibold">Project Structure</h3>
            </div>
            <ProjectTree />
          </Card>
          
          <Card className="bg-card/70 backdrop-blur-sm border-border p-4 h-1/2">
            <div className="flex items-center mb-4">
              <Database className="w-5 h-5 text-wisdom-memory mr-2" />
              <h3 className="font-semibold">Memory Index</h3>
            </div>
            <MemoryViewer />
          </Card>
        </div>

        {/* Center - Main Work Area */}
        <div className="col-span-6 space-y-6 overflow-hidden">
          {/* Node Graph Visualization */}
          <Card className="bg-card/70 backdrop-blur-sm border-border p-0 h-2/3">
            <NodeGraph />
          </Card>
          
          {/* Chat Interface */}
          <Card className="bg-card/70 backdrop-blur-sm border-border p-4 h-1/3">
            <div className="flex items-center mb-4">
              <MessageSquare className="w-5 h-5 text-accent mr-2" />
              <h3 className="font-semibold">Neural Interface</h3>
            </div>
            <ChatInterface />
          </Card>
        </div>

        {/* Right Sidebar - Agents & Tasks */}
        <div className="col-span-3 space-y-6 overflow-hidden">
          <Card className="bg-card/70 backdrop-blur-sm border-border p-4 h-full">
            <div className="flex items-center mb-4">
              <Brain className="w-5 h-5 text-agent-active mr-2" />
              <h3 className="font-semibold">Agent Network</h3>
            </div>
            <AgentPanel />
          </Card>
        </div>
      </div>

      {/* Neural Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-neural-pulse" />
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-neural-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-wisdom-neural/5 rounded-full blur-2xl animate-neural-pulse" style={{ animationDelay: '2s' }} />
      </div>
    </div>
  );
}