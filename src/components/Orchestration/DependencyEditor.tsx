// Dependency Editor - Visual task dependency editing before starting a run
import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  Position,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface DemoTask {
  title: string;
  prompt: string;
  priority: number;
  dependencies: string[];
}

interface DependencyEditorProps {
  tasks: DemoTask[];
  onDependenciesChange: (taskIndex: number, dependencies: string[]) => void;
}

export const DependencyEditor: React.FC<DependencyEditorProps> = ({
  tasks,
  onDependenciesChange,
}) => {
  const taskIds = useMemo(() => tasks.map((_, i) => `task-${i}`), [tasks.length]);

  const initialNodes: Node[] = useMemo(() => {
    const cols = Math.ceil(Math.sqrt(tasks.length));
    return tasks.map((task, i) => ({
      id: `task-${i}`,
      position: { x: (i % cols) * 260, y: Math.floor(i / cols) * 120 },
      data: {
        label: (
          <div className="text-left">
            <div className="font-semibold text-xs truncate max-w-[160px]">{task.title}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">P{task.priority}</div>
          </div>
        ),
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: {
        background: 'hsl(var(--card))',
        border: '2px solid hsl(var(--primary) / 0.5)',
        borderRadius: '8px',
        padding: '8px 12px',
        minWidth: '180px',
        color: 'hsl(var(--card-foreground))',
      },
    }));
  }, [tasks]);

  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    tasks.forEach((task, i) => {
      task.dependencies.forEach(dep => {
        const depIdx = taskIds.indexOf(dep);
        if (depIdx !== -1) {
          edges.push({
            id: `${dep}->task-${i}`,
            source: dep,
            target: `task-${i}`,
            animated: true,
            style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
          });
        }
      });
    });
    return edges;
  }, [tasks, taskIds]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    
    // Prevent self-connections
    if (connection.source === connection.target) return;

    // Add edge
    setEdges(eds => addEdge({
      ...connection,
      animated: true,
      style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
    }, eds));

    // Update dependencies
    const targetIdx = parseInt(connection.target.replace('task-', ''));
    const currentDeps = tasks[targetIdx]?.dependencies || [];
    if (!currentDeps.includes(connection.source)) {
      onDependenciesChange(targetIdx, [...currentDeps, connection.source]);
    }
  }, [tasks, onDependenciesChange, setEdges]);

  const onEdgeDelete = useCallback((deletedEdges: Edge[]) => {
    for (const edge of deletedEdges) {
      const targetIdx = parseInt(edge.target.replace('task-', ''));
      const currentDeps = tasks[targetIdx]?.dependencies || [];
      onDependenciesChange(targetIdx, currentDeps.filter(d => d !== edge.source));
    }
  }, [tasks, onDependenciesChange]);

  if (tasks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        Add tasks to edit dependencies
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div className="text-[10px] text-muted-foreground px-2 py-1 border-b border-border bg-muted/30">
        Drag from node edge to another node to create dependencies. Select an edge and press Delete to remove.
      </div>
      <div className="h-[calc(100%-24px)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgesDelete={onEdgeDelete}
          fitView
          proOptions={{ hideAttribution: true }}
          nodesDraggable
          nodesConnectable
          deleteKeyCode="Delete"
        >
          <Background color="hsl(var(--muted-foreground))" gap={20} size={1} style={{ opacity: 0.1 }} />
          <Controls className="!bg-card !border-border !shadow-lg" />
        </ReactFlow>
      </div>
    </div>
  );
};

export default DependencyEditor;
