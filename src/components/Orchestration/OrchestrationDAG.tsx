import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { OrchestrationTask } from '@/lib/orchestration';

interface OrchestrationDAGProps {
  tasks: OrchestrationTask[];
}

const statusColors: Record<string, string> = {
  queued: '#eab308',
  active: '#3b82f6',
  done: '#22c55e',
  failed: '#ef4444',
  blocked: '#f97316',
  canceled: '#6b7280',
};

export const OrchestrationDAG: React.FC<OrchestrationDAGProps> = ({ tasks }) => {
  const { nodes, edges } = useMemo(() => {
    if (!tasks.length) return { nodes: [], edges: [] };

    // Build dependency map for layout
    const depMap = new Map<string, string[]>();
    tasks.forEach(t => depMap.set(t.task_id, t.dependencies));

    // Topological sort for column placement
    const columns = new Map<string, number>();
    const getColumn = (id: string, visited = new Set<string>()): number => {
      if (columns.has(id)) return columns.get(id)!;
      if (visited.has(id)) return 0;
      visited.add(id);
      const deps = depMap.get(id) || [];
      const col = deps.length === 0 ? 0 : Math.max(...deps.map(d => getColumn(d, visited))) + 1;
      columns.set(id, col);
      return col;
    };
    tasks.forEach(t => getColumn(t.task_id));

    // Group by column for Y positioning
    const colGroups = new Map<number, string[]>();
    tasks.forEach(t => {
      const col = columns.get(t.task_id) || 0;
      if (!colGroups.has(col)) colGroups.set(col, []);
      colGroups.get(col)!.push(t.task_id);
    });

    const nodes: Node[] = tasks.map(task => {
      const col = columns.get(task.task_id) || 0;
      const group = colGroups.get(col) || [];
      const row = group.indexOf(task.task_id);
      const color = statusColors[task.status] || '#6b7280';

      return {
        id: task.task_id,
        position: { x: col * 280, y: row * 120 },
        data: {
          label: (
            <div className="text-left">
              <div className="font-semibold text-xs truncate max-w-[180px]">{task.title}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[10px] opacity-70">{task.status}</span>
                <span className="text-[10px] opacity-50 ml-auto">P{task.priority}</span>
              </div>
            </div>
          ),
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: {
          background: 'hsl(var(--card))',
          border: `2px solid ${color}`,
          borderRadius: '8px',
          padding: '8px 12px',
          minWidth: '200px',
          color: 'hsl(var(--card-foreground))',
        },
      };
    });

    const edges: Edge[] = tasks.flatMap(task =>
      task.dependencies.map(dep => ({
        id: `${dep}->${task.task_id}`,
        source: dep,
        target: task.task_id,
        animated: task.status === 'active',
        style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1.5 },
      }))
    );

    return { nodes, edges };
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        No tasks to visualize
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={false}
      >
        <Background color="hsl(var(--muted-foreground))" gap={20} size={1} style={{ opacity: 0.15 }} />
        <Controls className="!bg-card !border-border !shadow-lg" />
        <MiniMap
          nodeColor={(node) => {
            const border = (node.style as any)?.border || '';
            const match = border.match(/#[a-f0-9]+/i);
            return match ? match[0] : '#6b7280';
          }}
          className="!bg-card/80 !border-border"
          maskColor="hsl(var(--background) / 0.6)"
        />
      </ReactFlow>
    </div>
  );
};

export default OrchestrationDAG;
