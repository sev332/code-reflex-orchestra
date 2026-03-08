// BlueprintCanvas — Immersive Unreal Engine × n8n orchestration canvas
// Full-screen infinite canvas with APOE pipeline nodes, typed sockets, glowing wires, particle FX
import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  Position,
  Handle,
  NodeProps,
  BaseEdge,
  getBezierPath,
  EdgeProps,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Play, Pause, RotateCcw, ZoomIn, ZoomOut, Maximize,
  Brain, Search, Minimize2, GitBranch, ShieldCheck, FileText,
  Target, Sparkles, AlertTriangle, Cpu, Eye, Wand2,
  Plus, Trash2, Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ═══════════════════════════════════════════
// APOE Node Type Definitions
// ═══════════════════════════════════════════

interface APOENodeData {
  label: string;
  type: APOENodeType;
  status: 'idle' | 'running' | 'done' | 'error' | 'waiting';
  description: string;
  tokenBudget?: number;
  tokensUsed?: number;
  confidence?: number;
  duration?: number;
  [key: string]: unknown;
}

type APOENodeType = 'plan' | 'disambiguate' | 'retrieve' | 'condense' | 'reason' | 'critic' | 'verify' | 'styleguard' | 'format' | 'auditpack' | 'reflect' | 'trigger' | 'output';

interface SocketDef {
  id: string;
  label: string;
  color: string;
  type: 'exec' | 'data' | 'trigger';
  position: 'left' | 'right';
}

const nodeTypeConfig: Record<APOENodeType, {
  icon: React.ComponentType<any>;
  color: string;
  glow: string;
  inputs: SocketDef[];
  outputs: SocketDef[];
}> = {
  trigger: {
    icon: Sparkles,
    color: 'from-amber-600 to-orange-700',
    glow: 'shadow-amber-500/40',
    inputs: [],
    outputs: [
      { id: 'exec-out', label: 'Exec', color: '#f59e0b', type: 'exec', position: 'right' },
      { id: 'goal-out', label: 'Goal', color: '#3b82f6', type: 'data', position: 'right' },
    ],
  },
  plan: {
    icon: Target,
    color: 'from-blue-600 to-cyan-700',
    glow: 'shadow-cyan-500/40',
    inputs: [
      { id: 'exec-in', label: 'Exec', color: '#f59e0b', type: 'exec', position: 'left' },
      { id: 'goal-in', label: 'Goal', color: '#3b82f6', type: 'data', position: 'left' },
    ],
    outputs: [
      { id: 'exec-out', label: 'Exec', color: '#f59e0b', type: 'exec', position: 'right' },
      { id: 'tasks-out', label: 'Tasks', color: '#8b5cf6', type: 'data', position: 'right' },
      { id: 'needs-out', label: 'Needs', color: '#06b6d4', type: 'data', position: 'right' },
    ],
  },
  disambiguate: {
    icon: AlertTriangle,
    color: 'from-yellow-600 to-amber-700',
    glow: 'shadow-yellow-500/40',
    inputs: [
      { id: 'exec-in', label: 'Exec', color: '#f59e0b', type: 'exec', position: 'left' },
      { id: 'query-in', label: 'Query', color: '#3b82f6', type: 'data', position: 'left' },
    ],
    outputs: [
      { id: 'exec-out', label: 'Exec', color: '#f59e0b', type: 'exec', position: 'right' },
      { id: 'clarified-out', label: 'Clarified', color: '#22c55e', type: 'data', position: 'right' },
    ],
  },
  retrieve: {
    icon: Search,
    color: 'from-emerald-600 to-green-700',
    glow: 'shadow-emerald-500/40',
    inputs: [
      { id: 'exec-in', label: 'Exec', color: '#f59e0b', type: 'exec', position: 'left' },
      { id: 'query-in', label: 'Query', color: '#3b82f6', type: 'data', position: 'left' },
    ],
    outputs: [
      { id: 'exec-out', label: 'Exec', color: '#f59e0b', type: 'exec', position: 'right' },
      { id: 'snippets-out', label: 'Snippets', color: '#22c55e', type: 'data', position: 'right' },
      { id: 'citations-out', label: 'Citations', color: '#06b6d4', type: 'data', position: 'right' },
    ],
  },
  condense: {
    icon: Compress,
    color: 'from-violet-600 to-purple-700',
    glow: 'shadow-violet-500/40',
    inputs: [
      { id: 'exec-in', label: 'Exec', color: '#f59e0b', type: 'exec', position: 'left' },
      { id: 'content-in', label: 'Content', color: '#8b5cf6', type: 'data', position: 'left' },
    ],
    outputs: [
      { id: 'exec-out', label: 'Exec', color: '#f59e0b', type: 'exec', position: 'right' },
      { id: 'condensed-out', label: 'Condensed', color: '#a855f7', type: 'data', position: 'right' },
    ],
  },
  reason: {
    icon: Brain,
    color: 'from-pink-600 to-rose-700',
    glow: 'shadow-pink-500/40',
    inputs: [
      { id: 'exec-in', label: 'Exec', color: '#f59e0b', type: 'exec', position: 'left' },
      { id: 'context-in', label: 'Context', color: '#8b5cf6', type: 'data', position: 'left' },
      { id: 'snippets-in', label: 'Snippets', color: '#22c55e', type: 'data', position: 'left' },
    ],
    outputs: [
      { id: 'exec-out', label: 'Exec', color: '#f59e0b', type: 'exec', position: 'right' },
      { id: 'answer-out', label: 'Answer', color: '#ec4899', type: 'data', position: 'right' },
      { id: 'confidence-out', label: 'Confidence', color: '#f97316', type: 'data', position: 'right' },
    ],
  },
  critic: {
    icon: Eye,
    color: 'from-orange-600 to-red-700',
    glow: 'shadow-orange-500/40',
    inputs: [
      { id: 'exec-in', label: 'Exec', color: '#f59e0b', type: 'exec', position: 'left' },
      { id: 'answer-in', label: 'Answer', color: '#ec4899', type: 'data', position: 'left' },
    ],
    outputs: [
      { id: 'exec-out', label: 'Exec', color: '#f59e0b', type: 'exec', position: 'right' },
      { id: 'critique-out', label: 'Critique', color: '#f97316', type: 'data', position: 'right' },
      { id: 'score-out', label: 'Score', color: '#eab308', type: 'data', position: 'right' },
    ],
  },
  verify: {
    icon: ShieldCheck,
    color: 'from-teal-600 to-emerald-700',
    glow: 'shadow-teal-500/40',
    inputs: [
      { id: 'exec-in', label: 'Exec', color: '#f59e0b', type: 'exec', position: 'left' },
      { id: 'answer-in', label: 'Answer', color: '#ec4899', type: 'data', position: 'left' },
      { id: 'citations-in', label: 'Citations', color: '#06b6d4', type: 'data', position: 'left' },
    ],
    outputs: [
      { id: 'exec-out', label: 'Exec', color: '#f59e0b', type: 'exec', position: 'right' },
      { id: 'verified-out', label: 'Verified', color: '#14b8a6', type: 'data', position: 'right' },
      { id: 'pass-out', label: 'Pass?', color: '#22c55e', type: 'exec', position: 'right' },
      { id: 'fail-out', label: 'Fail?', color: '#ef4444', type: 'exec', position: 'right' },
    ],
  },
  styleguard: {
    icon: Wand2,
    color: 'from-fuchsia-600 to-pink-700',
    glow: 'shadow-fuchsia-500/40',
    inputs: [
      { id: 'exec-in', label: 'Exec', color: '#f59e0b', type: 'exec', position: 'left' },
      { id: 'content-in', label: 'Content', color: '#8b5cf6', type: 'data', position: 'left' },
    ],
    outputs: [
      { id: 'exec-out', label: 'Exec', color: '#f59e0b', type: 'exec', position: 'right' },
      { id: 'styled-out', label: 'Styled', color: '#d946ef', type: 'data', position: 'right' },
    ],
  },
  format: {
    icon: FileText,
    color: 'from-sky-600 to-blue-700',
    glow: 'shadow-sky-500/40',
    inputs: [
      { id: 'exec-in', label: 'Exec', color: '#f59e0b', type: 'exec', position: 'left' },
      { id: 'content-in', label: 'Content', color: '#8b5cf6', type: 'data', position: 'left' },
    ],
    outputs: [
      { id: 'exec-out', label: 'Exec', color: '#f59e0b', type: 'exec', position: 'right' },
      { id: 'formatted-out', label: 'Output', color: '#0ea5e9', type: 'data', position: 'right' },
    ],
  },
  auditpack: {
    icon: GitBranch,
    color: 'from-indigo-600 to-violet-700',
    glow: 'shadow-indigo-500/40',
    inputs: [
      { id: 'exec-in', label: 'Exec', color: '#f59e0b', type: 'exec', position: 'left' },
      { id: 'trace-in', label: 'Trace', color: '#6366f1', type: 'data', position: 'left' },
    ],
    outputs: [
      { id: 'exec-out', label: 'Exec', color: '#f59e0b', type: 'exec', position: 'right' },
      { id: 'audit-out', label: 'Audit', color: '#818cf8', type: 'data', position: 'right' },
    ],
  },
  reflect: {
    icon: Cpu,
    color: 'from-slate-600 to-zinc-700',
    glow: 'shadow-slate-500/40',
    inputs: [
      { id: 'exec-in', label: 'Exec', color: '#f59e0b', type: 'exec', position: 'left' },
      { id: 'result-in', label: 'Result', color: '#0ea5e9', type: 'data', position: 'left' },
    ],
    outputs: [
      { id: 'learning-out', label: 'Learning', color: '#94a3b8', type: 'data', position: 'right' },
    ],
  },
  output: {
    icon: Sparkles,
    color: 'from-emerald-500 to-cyan-600',
    glow: 'shadow-emerald-500/40',
    inputs: [
      { id: 'exec-in', label: 'Exec', color: '#f59e0b', type: 'exec', position: 'left' },
      { id: 'final-in', label: 'Final', color: '#0ea5e9', type: 'data', position: 'left' },
    ],
    outputs: [],
  },
};

// ═══════════════════════════════════════════
// Custom Blueprint Node Component
// ═══════════════════════════════════════════

function BlueprintNode({ data, selected }: NodeProps<Node<APOENodeData>>) {
  const config = nodeTypeConfig[data.type] || nodeTypeConfig.plan;
  const Icon = config.icon;
  const isRunning = data.status === 'running';
  const isDone = data.status === 'done';
  const isError = data.status === 'error';

  return (
    <div className={cn(
      'relative group min-w-[220px] select-none',
      selected && 'ring-2 ring-primary/50 rounded-xl',
    )}>
      {/* Outer glow aura for running/active nodes */}
      {isRunning && (
        <div className={cn(
          'absolute -inset-3 rounded-2xl opacity-30 blur-xl animate-pulse',
          config.glow.replace('shadow-', 'bg-').replace('/40', '/60'),
        )} />
      )}
      {isDone && (
        <div className="absolute -inset-2 rounded-2xl bg-emerald-500/10 blur-lg" />
      )}
      {isError && (
        <div className="absolute -inset-2 rounded-2xl bg-red-500/20 blur-lg animate-pulse" />
      )}

      {/* Node body */}
      <div className={cn(
        'relative rounded-xl overflow-hidden border transition-all duration-300',
        isRunning ? 'border-primary/60' : isDone ? 'border-emerald-500/40' : isError ? 'border-red-500/40' : 'border-border/60',
      )}>
        {/* Header bar */}
        <div className={cn(
          'flex items-center gap-2 px-3 py-2 bg-gradient-to-r',
          config.color,
        )}>
          <Icon className="w-4 h-4 text-white/90" />
          <span className="text-xs font-bold text-white/95 uppercase tracking-wider flex-1 truncate">
            {data.label}
          </span>
          {isRunning && (
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          )}
          {isDone && (
            <div className="w-2 h-2 rounded-full bg-emerald-300" />
          )}
          {data.confidence !== undefined && (
            <span className="text-[9px] text-white/70 font-mono">{(data.confidence * 100).toFixed(0)}%</span>
          )}
        </div>

        {/* Body */}
        <div className="bg-card/95 backdrop-blur-sm px-3 py-2.5 space-y-1.5">
          <p className="text-[10px] text-muted-foreground leading-tight">{data.description}</p>

          {/* Token budget bar */}
          {data.tokenBudget && (
            <div className="space-y-0.5">
              <div className="flex justify-between text-[9px] text-muted-foreground">
                <span>Tokens</span>
                <span className="font-mono">{data.tokensUsed || 0}/{data.tokenBudget}</span>
              </div>
              <div className="h-1 bg-muted/40 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    isRunning ? 'bg-primary animate-pulse' : isDone ? 'bg-emerald-500' : 'bg-muted-foreground/30',
                  )}
                  style={{ width: `${Math.min(100, ((data.tokensUsed || 0) / data.tokenBudget) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {data.duration !== undefined && (
            <div className="text-[9px] text-muted-foreground font-mono">
              ⏱ {data.duration}ms
            </div>
          )}
        </div>
      </div>

      {/* Input handles (left) */}
      {config.inputs.map((socket, i) => {
        const offset = (i + 1) / (config.inputs.length + 1) * 100;
        return (
          <React.Fragment key={socket.id}>
            <Handle
              type="target"
              position={Position.Left}
              id={socket.id}
              style={{
                top: `${40 + offset * 0.6}%`,
                width: socket.type === 'exec' ? 12 : 10,
                height: socket.type === 'exec' ? 12 : 10,
                backgroundColor: socket.color,
                border: `2px solid ${socket.color}33`,
                borderRadius: socket.type === 'exec' ? 2 : '50%',
                boxShadow: `0 0 8px ${socket.color}40`,
              }}
            />
            <span
              className="absolute text-[8px] text-muted-foreground pointer-events-none font-medium"
              style={{ left: 16, top: `calc(${40 + offset * 0.6}% - 5px)` }}
            >
              {socket.label}
            </span>
          </React.Fragment>
        );
      })}

      {/* Output handles (right) */}
      {config.outputs.map((socket, i) => {
        const offset = (i + 1) / (config.outputs.length + 1) * 100;
        return (
          <React.Fragment key={socket.id}>
            <Handle
              type="source"
              position={Position.Right}
              id={socket.id}
              style={{
                top: `${40 + offset * 0.6}%`,
                width: socket.type === 'exec' ? 12 : 10,
                height: socket.type === 'exec' ? 12 : 10,
                backgroundColor: socket.color,
                border: `2px solid ${socket.color}33`,
                borderRadius: socket.type === 'exec' ? 2 : '50%',
                boxShadow: `0 0 8px ${socket.color}40`,
              }}
            />
            <span
              className="absolute text-[8px] text-muted-foreground pointer-events-none font-medium text-right"
              style={{ right: 16, top: `calc(${40 + offset * 0.6}% - 5px)` }}
            >
              {socket.label}
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════
// Custom Animated Edge with Glow + Particles
// ═══════════════════════════════════════════

function GlowEdge({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, data,
}: EdgeProps) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  const isActive = (data as any)?.active;
  const color = (data as any)?.color || '#f59e0b';

  return (
    <>
      {/* Glow layer */}
      <BaseEdge
        id={`${id}-glow`}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: isActive ? 6 : 3,
          opacity: isActive ? 0.25 : 0.08,
          filter: 'blur(4px)',
        }}
      />
      {/* Main wire */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: isActive ? 2.5 : 1.5,
          opacity: isActive ? 1 : 0.5,
          ...style,
        }}
      />
      {/* Animated particle dot (when active) */}
      {isActive && (
        <circle r="3" fill={color} filter={`drop-shadow(0 0 4px ${color})`}>
          <animateMotion dur="1.5s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
    </>
  );
}

// ═══════════════════════════════════════════
// Node Types & Edge Types for ReactFlow
// ═══════════════════════════════════════════

const nodeTypes = { blueprint: BlueprintNode };
const edgeTypes = { glow: GlowEdge };

// ═══════════════════════════════════════════
// Default APOE Chain
// ═══════════════════════════════════════════

const defaultNodes: Node<APOENodeData>[] = [
  { id: 'trigger-1', type: 'blueprint', position: { x: 0, y: 200 }, data: { label: 'User Intent', type: 'trigger', status: 'done', description: 'Captures user goal and constraints' } },
  { id: 'plan-1', type: 'blueprint', position: { x: 320, y: 120 }, data: { label: 'PLAN', type: 'plan', status: 'done', description: 'Decompose goal into sub-tasks, allocate budget', tokenBudget: 2000, tokensUsed: 1420, duration: 340 } },
  { id: 'retrieve-1', type: 'blueprint', position: { x: 640, y: 40 }, data: { label: 'RETRIEVE', type: 'retrieve', status: 'running', description: 'Fetch relevant context from CMC and external sources', tokenBudget: 3000, tokensUsed: 1800 } },
  { id: 'condense-1', type: 'blueprint', position: { x: 960, y: 40 }, data: { label: 'CONDENSE', type: 'condense', status: 'waiting', description: 'Dumbbell compression: pin head/tail, compress middle', tokenBudget: 1500 } },
  { id: 'reason-1', type: 'blueprint', position: { x: 1280, y: 120 }, data: { label: 'REASON', type: 'reason', status: 'idle', description: 'Multi-temperature reasoning with constraint adherence', tokenBudget: 8000, confidence: 0.0 } },
  { id: 'critic-1', type: 'blueprint', position: { x: 1280, y: 360 }, data: { label: 'CRITIC', type: 'critic', status: 'idle', description: 'Evaluate answer quality, check for hallucinations' } },
  { id: 'verify-1', type: 'blueprint', position: { x: 1600, y: 200 }, data: { label: 'VERIFY', type: 'verify', status: 'idle', description: 'Check provenance coverage κ, uncertainty bounds', tokenBudget: 2000 } },
  { id: 'format-1', type: 'blueprint', position: { x: 1920, y: 120 }, data: { label: 'FORMAT', type: 'format', status: 'idle', description: 'Apply style guide and output schema' } },
  { id: 'audit-1', type: 'blueprint', position: { x: 1920, y: 340 }, data: { label: 'AUDITPACK', type: 'auditpack', status: 'idle', description: 'Bundle trace, citations, confidence for audit log' } },
  { id: 'output-1', type: 'blueprint', position: { x: 2240, y: 200 }, data: { label: 'OUTPUT', type: 'output', status: 'idle', description: 'Final verified answer delivered to user' } },
];

const defaultEdges: Edge[] = [
  { id: 'e-t1-p1', source: 'trigger-1', target: 'plan-1', sourceHandle: 'exec-out', targetHandle: 'exec-in', type: 'glow', data: { active: true, color: '#f59e0b' } },
  { id: 'e-t1-p1d', source: 'trigger-1', target: 'plan-1', sourceHandle: 'goal-out', targetHandle: 'goal-in', type: 'glow', data: { active: true, color: '#3b82f6' } },
  { id: 'e-p1-r1', source: 'plan-1', target: 'retrieve-1', sourceHandle: 'exec-out', targetHandle: 'exec-in', type: 'glow', data: { active: true, color: '#f59e0b' } },
  { id: 'e-p1-r1d', source: 'plan-1', target: 'retrieve-1', sourceHandle: 'needs-out', targetHandle: 'query-in', type: 'glow', data: { active: true, color: '#06b6d4' } },
  { id: 'e-r1-c1', source: 'retrieve-1', target: 'condense-1', sourceHandle: 'exec-out', targetHandle: 'exec-in', type: 'glow', data: { active: false, color: '#f59e0b' } },
  { id: 'e-r1-c1d', source: 'retrieve-1', target: 'condense-1', sourceHandle: 'snippets-out', targetHandle: 'content-in', type: 'glow', data: { active: false, color: '#22c55e' } },
  { id: 'e-c1-rs1', source: 'condense-1', target: 'reason-1', sourceHandle: 'exec-out', targetHandle: 'exec-in', type: 'glow', data: { active: false, color: '#f59e0b' } },
  { id: 'e-c1-rs1d', source: 'condense-1', target: 'reason-1', sourceHandle: 'condensed-out', targetHandle: 'context-in', type: 'glow', data: { active: false, color: '#a855f7' } },
  { id: 'e-rs1-cr1', source: 'reason-1', target: 'critic-1', sourceHandle: 'answer-out', targetHandle: 'answer-in', type: 'glow', data: { active: false, color: '#ec4899' } },
  { id: 'e-rs1-v1', source: 'reason-1', target: 'verify-1', sourceHandle: 'exec-out', targetHandle: 'exec-in', type: 'glow', data: { active: false, color: '#f59e0b' } },
  { id: 'e-rs1-v1d', source: 'reason-1', target: 'verify-1', sourceHandle: 'answer-out', targetHandle: 'answer-in', type: 'glow', data: { active: false, color: '#ec4899' } },
  { id: 'e-r1-v1c', source: 'retrieve-1', target: 'verify-1', sourceHandle: 'citations-out', targetHandle: 'citations-in', type: 'glow', data: { active: false, color: '#06b6d4' } },
  { id: 'e-v1-f1', source: 'verify-1', target: 'format-1', sourceHandle: 'exec-out', targetHandle: 'exec-in', type: 'glow', data: { active: false, color: '#f59e0b' } },
  { id: 'e-v1-f1d', source: 'verify-1', target: 'format-1', sourceHandle: 'verified-out', targetHandle: 'content-in', type: 'glow', data: { active: false, color: '#14b8a6' } },
  { id: 'e-v1-a1', source: 'verify-1', target: 'audit-1', sourceHandle: 'exec-out', targetHandle: 'exec-in', type: 'glow', data: { active: false, color: '#f59e0b' } },
  { id: 'e-f1-o1', source: 'format-1', target: 'output-1', sourceHandle: 'exec-out', targetHandle: 'exec-in', type: 'glow', data: { active: false, color: '#f59e0b' } },
  { id: 'e-f1-o1d', source: 'format-1', target: 'output-1', sourceHandle: 'formatted-out', targetHandle: 'final-in', type: 'glow', data: { active: false, color: '#0ea5e9' } },
];

// ═══════════════════════════════════════════
// Node palette for drag-to-add
// ═══════════════════════════════════════════

const paletteItems: { type: APOENodeType; label: string }[] = [
  { type: 'trigger', label: 'Trigger' },
  { type: 'plan', label: 'PLAN' },
  { type: 'disambiguate', label: 'DISAMBIGUATE' },
  { type: 'retrieve', label: 'RETRIEVE' },
  { type: 'condense', label: 'CONDENSE' },
  { type: 'reason', label: 'REASON' },
  { type: 'critic', label: 'CRITIC' },
  { type: 'verify', label: 'VERIFY' },
  { type: 'styleguard', label: 'STYLEGUARD' },
  { type: 'format', label: 'FORMAT' },
  { type: 'auditpack', label: 'AUDITPACK' },
  { type: 'reflect', label: 'REFLECT' },
  { type: 'output', label: 'Output' },
];

// ═══════════════════════════════════════════
// Main Canvas Component
// ═══════════════════════════════════════════

function BlueprintCanvasInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const reactFlow = useReactFlow();

  const onConnect = useCallback((connection: Connection) => {
    const color = connection.sourceHandle?.includes('exec') ? '#f59e0b' : '#8b5cf6';
    setEdges(eds => addEdge({
      ...connection,
      type: 'glow',
      data: { active: false, color },
    }, eds));
  }, [setEdges]);

  const addNode = useCallback((type: APOENodeType) => {
    const config = nodeTypeConfig[type];
    const Icon = config.icon;
    const viewport = reactFlow.getViewport();
    const newNode: Node<APOENodeData> = {
      id: `${type}-${Date.now()}`,
      type: 'blueprint',
      position: { x: (-viewport.x + 400) / viewport.zoom, y: (-viewport.y + 300) / viewport.zoom },
      data: {
        label: type.toUpperCase(),
        type,
        status: 'idle',
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} node — configure via properties`,
        tokenBudget: 2000,
        tokensUsed: 0,
      },
    };
    setNodes(nds => [...nds, newNode]);
    setShowPalette(false);
  }, [reactFlow, setNodes]);

  // Simulate execution progress
  const simulateRun = useCallback(() => {
    setIsSimulating(true);
    const nodeOrder = ['trigger-1', 'plan-1', 'retrieve-1', 'condense-1', 'reason-1', 'critic-1', 'verify-1', 'format-1', 'audit-1', 'output-1'];
    let step = 0;

    const interval = setInterval(() => {
      if (step >= nodeOrder.length) {
        clearInterval(interval);
        setIsSimulating(false);
        return;
      }

      setNodes(nds => nds.map(n => {
        const idx = nodeOrder.indexOf(n.id);
        if (idx < step) return { ...n, data: { ...n.data, status: 'done' as const, tokensUsed: n.data.tokenBudget || 0, confidence: 0.92, duration: Math.floor(Math.random() * 500 + 100) } };
        if (idx === step) return { ...n, data: { ...n.data, status: 'running' as const, tokensUsed: Math.floor((n.data.tokenBudget || 1000) * 0.6) } };
        return { ...n, data: { ...n.data, status: 'idle' as const } };
      }));

      // Activate edges up to current step
      setEdges(eds => eds.map(e => {
        const srcIdx = nodeOrder.indexOf(e.source);
        const tgtIdx = nodeOrder.indexOf(e.target);
        return { ...e, data: { ...(e.data || {}), active: srcIdx < step && tgtIdx <= step } };
      }));

      step++;
    }, 1200);

    return () => clearInterval(interval);
  }, [setNodes, setEdges]);

  const resetSimulation = useCallback(() => {
    setIsSimulating(false);
    setNodes(defaultNodes);
    setEdges(defaultEdges);
  }, [setNodes, setEdges]);

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.15}
        maxZoom={2}
        defaultEdgeOptions={{ type: 'glow' }}
        className="blueprint-canvas"
      >
        <Background
          color="hsl(var(--muted-foreground))"
          gap={24}
          size={1}
          style={{ opacity: 0.08 }}
        />
        {/* Secondary grid for depth */}
        <Background
          id="bg-2"
          color="hsl(var(--muted-foreground))"
          gap={120}
          size={1.5}
          style={{ opacity: 0.04 }}
        />
        <MiniMap
          nodeColor={() => 'hsl(var(--primary))'}
          className="!bg-card/80 !border-border/40 !rounded-xl !shadow-2xl"
          maskColor="hsl(var(--background) / 0.7)"
          style={{ width: 160, height: 100 }}
        />

        {/* Top-left: Execution Controls */}
        <Panel position="top-left" className="flex items-center gap-1.5">
          <Button
            size="sm"
            onClick={isSimulating ? resetSimulation : simulateRun}
            className={cn(
              'gap-1.5 rounded-lg shadow-lg',
              isSimulating
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-primary text-primary-foreground hover:bg-primary/90',
            )}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isSimulating ? 'Stop' : 'Run Pipeline'}
          </Button>
          <Button size="sm" variant="outline" onClick={resetSimulation} className="gap-1 rounded-lg shadow-lg">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </Button>
        </Panel>

        {/* Top-right: Add nodes */}
        <Panel position="top-right">
          <div className="relative">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowPalette(!showPalette)}
              className="gap-1.5 rounded-lg shadow-lg"
            >
              <Plus className="w-3.5 h-3.5" /> Add Node
            </Button>

            {showPalette && (
              <div className="absolute top-10 right-0 w-52 bg-card/95 backdrop-blur-xl border border-border/40 rounded-xl shadow-2xl p-2 z-50 space-y-0.5 animate-scale-in">
                {paletteItems.map(item => {
                  const conf = nodeTypeConfig[item.type];
                  const Icon = conf.icon;
                  return (
                    <button
                      key={item.type}
                      onClick={() => addNode(item.type)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                        'hover:bg-muted/50 text-foreground/80 hover:text-foreground',
                      )}
                    >
                      <div className={cn('w-5 h-5 rounded flex items-center justify-center bg-gradient-to-br', conf.color)}>
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Panel>

        {/* Bottom-left: Stats */}
        <Panel position="bottom-left">
          <div className="bg-card/80 backdrop-blur-xl border border-border/30 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-primary font-mono">{nodes.length}</div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Nodes</div>
            </div>
            <div className="w-px h-8 bg-border/30" />
            <div className="text-center">
              <div className="text-lg font-bold text-muted-foreground font-mono">{edges.length}</div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Wires</div>
            </div>
            <div className="w-px h-8 bg-border/30" />
            <div className="text-center">
              <div className={cn('text-lg font-bold font-mono', isSimulating ? 'text-amber-400' : 'text-emerald-400')}>
                {isSimulating ? 'LIVE' : 'IDLE'}
              </div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Status</div>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function BlueprintCanvas() {
  return (
    <ReactFlowProvider>
      <BlueprintCanvasInner />
    </ReactFlowProvider>
  );
}

export default BlueprintCanvas;
