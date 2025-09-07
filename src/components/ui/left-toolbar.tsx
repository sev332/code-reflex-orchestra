// 🔗 CONNECT: UI Components → Left Toolbar System → Drawer Navigation
// 🧩 INTENT: Vertical left toolbar with expandable drawer panels for system navigation
// ✅ SPEC: Left-Toolbar-System-v1.0

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Database, 
  Users, 
  Activity, 
  Settings, 
  Eye, 
  Network,
  Zap,
  MemoryStick,
  Cpu,
  GitBranch,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolbarItem {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  badge?: string;
  content: React.ReactNode;
}

interface LeftToolbarProps {
  className?: string;
}

export function LeftToolbar({ className }: LeftToolbarProps) {
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);

  const toolbarItems: ToolbarItem[] = [
    {
      id: 'agents',
      icon: Users,
      label: 'Agents',
      badge: '12',
      content: (
        <div className="p-6 space-y-4">
          <h3 className="text-xl font-semibold mb-4">Active Agents</h3>
          <div className="space-y-3">
            {[
              { name: 'Neural Architect', status: 'Active', performance: 94 },
              { name: 'Code Generator', status: 'Active', performance: 87 },
              { name: 'Research Agent', status: 'Idle', performance: 92 },
              { name: 'Test Orchestrator', status: 'Active', performance: 89 }
            ].map((agent, i) => (
              <div key={i} className="p-3 bg-card border rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{agent.name}</span>
                  <Badge variant={agent.status === 'Active' ? 'default' : 'secondary'}>
                    {agent.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Performance: {agent.performance}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'memory',
      icon: Database,
      label: 'Memory',
      badge: '2.4TB',
      content: (
        <div className="p-6 space-y-4">
          <h3 className="text-xl font-semibold mb-4">Memory Systems</h3>
          <div className="space-y-3">
            {[
              { type: 'Vector Memory', usage: '67%', size: '1.2TB' },
              { type: 'Neural Cache', usage: '34%', size: '512GB' },
              { type: 'Knowledge Graph', usage: '78%', size: '678GB' },
              { type: 'Experience Buffer', usage: '23%', size: '156GB' }
            ].map((memory, i) => (
              <div key={i} className="p-3 bg-card border rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{memory.type}</span>
                  <Badge>{memory.size}</Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Usage: {memory.usage}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'analytics',
      icon: Activity,
      label: 'Analytics',
      content: (
        <div className="p-6 space-y-4">
          <h3 className="text-xl font-semibold mb-4">System Analytics</h3>
          <div className="grid grid-cols-1 gap-4">
            {[
              { metric: 'Neural Throughput', value: '2.4M ops/sec', trend: '+12%' },
              { metric: 'Learning Rate', value: '94.7%', trend: '+5%' },
              { metric: 'Response Time', value: '23ms avg', trend: '-8%' },
              { metric: 'Accuracy Score', value: '99.2%', trend: '+2%' }
            ].map((stat, i) => (
              <div key={i} className="p-3 bg-card border rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{stat.metric}</span>
                  <Badge variant="outline">{stat.trend}</Badge>
                </div>
                <div className="text-lg font-bold text-primary mt-1">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'monitoring',
      icon: Eye,
      label: 'Monitor',
      content: (
        <div className="p-6 space-y-4">
          <h3 className="text-xl font-semibold mb-4">Live Monitoring</h3>
          <div className="space-y-3">
            {[
              { system: 'Neural Networks', status: 'Healthy', load: '67%' },
              { system: 'Memory Systems', status: 'Optimal', load: '34%' },
              { system: 'Agent Swarm', status: 'Active', load: '89%' },
              { system: 'Data Pipeline', status: 'Flowing', load: '45%' }
            ].map((system, i) => (
              <div key={i} className="p-3 bg-card border rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{system.system}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <Badge variant="outline">{system.status}</Badge>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Load: {system.load}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'network',
      icon: Network,
      label: 'Network',
      content: (
        <div className="p-6 space-y-4">
          <h3 className="text-xl font-semibold mb-4">Network Topology</h3>
          <div className="space-y-3">
            {[
              { node: 'Primary Hub', connections: 24, status: 'Active' },
              { node: 'Memory Cluster', connections: 18, status: 'Syncing' },
              { node: 'Compute Grid', connections: 31, status: 'Active' },
              { node: 'Edge Nodes', connections: 12, status: 'Standby' }
            ].map((node, i) => (
              <div key={i} className="p-3 bg-card border rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{node.node}</span>
                  <Badge>{node.connections} links</Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Status: {node.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Settings',
      content: (
        <div className="p-6 space-y-4">
          <h3 className="text-xl font-semibold mb-4">System Configuration</h3>
          <div className="space-y-4">
            {[
              { setting: 'Neural Learning Rate', value: '0.001', description: 'Base learning rate for neural networks' },
              { setting: 'Memory Retention', value: '30 days', description: 'How long to retain memory entries' },
              { setting: 'Agent Concurrency', value: '16', description: 'Maximum concurrent agents' },
              { setting: 'Auto-scaling', value: 'Enabled', description: 'Automatic resource scaling' }
            ].map((setting, i) => (
              <div key={i} className="p-3 bg-card border rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{setting.setting}</span>
                  <Badge variant="outline">{setting.value}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {setting.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }
  ];

  const handleDrawerToggle = (itemId: string) => {
    setActiveDrawer(activeDrawer === itemId ? null : itemId);
  };

  return (
    <>
      {/* Left Toolbar */}
      <div className={cn(
        "fixed left-0 top-0 h-full w-16 bg-card/95 backdrop-blur-sm border-r border-border z-40 flex flex-col items-center py-4 space-y-2",
        className
      )}>
        {toolbarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeDrawer === item.id;
          
          return (
            <div key={item.id} className="relative">
              <Button
                variant={isActive ? "default" : "ghost"}
                size="icon"
                onClick={() => handleDrawerToggle(item.id)}
                className={cn(
                  "w-12 h-12 rounded-lg transition-all duration-200",
                  isActive && "neural-glow"
                )}
                title={item.label}
              >
                <Icon className="w-5 h-5" />
              </Button>
              {item.badge && (
                <Badge 
                  className="absolute -top-1 -right-1 px-1 py-0 text-xs min-w-0 h-5"
                  variant="destructive"
                >
                  {item.badge}
                </Badge>
              )}
            </div>
          );
        })}
      </div>

      {/* Drawer Content */}
      {activeDrawer && (
        <div className="fixed left-16 top-0 h-full w-80 bg-background/95 backdrop-blur-sm border-r border-border z-30 overflow-y-auto scrollbar-neural">
          {toolbarItems.find(item => item.id === activeDrawer)?.content}
        </div>
      )}
    </>
  );
}