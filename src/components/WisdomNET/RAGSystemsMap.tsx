import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, Cpu, GitBranch, Layers, Network, Brain, Activity } from "lucide-react";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { useWisdomNET } from "@/contexts/WisdomNETContext";

const initialNodes: Node[] = [
  { id: "user", position: { x: -200, y: 0 }, data: { label: "User" }, type: "input" },
  { id: "chaining", position: { x: 0, y: -140 }, data: { label: "Chaining Engine (LCEL)" }, type: "default" },
  { id: "agents", position: { x: 0, y: 140 }, data: { label: "Agent Manager" }, type: "default" },
  { id: "deepthink", position: { x: 260, y: 0 }, data: { label: "Deep Think Interconnect" }, type: "default" },
  { id: "dtp", position: { x: 520, y: -140 }, data: { label: "Dynamic Token Power" }, type: "default" },
  { id: "memory", position: { x: 520, y: 140 }, data: { label: "Memory Stores (Vector/RAG)" }, type: "default" },
  { id: "llm", position: { x: 780, y: 0 }, data: { label: "LLM Stack" }, type: "output" },
  { id: "tools", position: { x: 260, y: 220 }, data: { label: "Tool Calls" }, type: "default" },
  { id: "logging", position: { x: 260, y: -220 }, data: { label: "Logging & Trace" }, type: "default" },
];

const initialEdges: Edge[] = [
  { id: "e-user-chain", source: "user", target: "chaining", label: "prompt", animated: true },
  { id: "e-chain-agents", source: "chaining", target: "agents", label: "handoff", animated: true },
  { id: "e-agents-deep", source: "agents", target: "deepthink", label: "tasks" },
  { id: "e-deep-dtp", source: "deepthink", target: "dtp", label: "context map" },
  { id: "e-dtp-llm", source: "dtp", target: "llm", label: "sharded ctx", animated: true },
  { id: "e-deep-memory", source: "deepthink", target: "memory", label: "RAG" },
  { id: "e-agents-tools", source: "agents", target: "tools", label: "invoke" },
  { id: "e-chain-logging", source: "chaining", target: "logging", label: "trace" },
  { id: "e-memory-llm", source: "memory", target: "llm", label: "retrieval" },
  { id: "e-tools-llm", source: "tools", target: "llm", label: "augmentation" },
];

const chartConfig = {
  throughput: {
    label: "Throughput",
    color: "hsl(var(--primary))",
  },
  latency: {
    label: "Latency",
    color: "hsl(var(--accent))",
  },
} as const;

export default function RAGSystemsMap() {
  const { systemMetrics } = useWisdomNET();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Node | null>(null);

  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  const focusNode = useCallback((nodeId: string) => {
    const n = nodes.find((n) => n.id === nodeId);
    if (n && rfInstance) {
      const x = n.position.x + (((n as any).width) || 0) / 2;
      const y = n.position.y + (((n as any).height) || 0) / 2;
      rfInstance.setCenter(x, y, { zoom: 1.2, duration: 400 });
    }
  }, [nodes, rfInstance]);

  const tracePath = useCallback((edgeIds: string[]) => {
    setEdges((eds) =>
      eds.map((e) =>
        edgeIds.includes(e.id)
          ? { ...e, animated: true, style: { ...(e.style || {}), strokeWidth: 2.5, opacity: 1 } }
          : { ...e, style: { ...(e.style || {}), opacity: 0.35 } }
      )
    );
    setTimeout(() => {
      setEdges((eds) => eds.map((e) => ({ ...e, style: undefined })));
    }, 1800);
  }, [setEdges]);

  const onConnect = useCallback((connection: Connection) => setEdges((eds) => addEdge({ ...connection, animated: true }, eds)), [setEdges]);

  const handleNodeClick = useCallback((_e: React.MouseEvent, node: Node) => {
    setSelected(node);
    setOpen(true);
  }, []);

  const chartData = useMemo(() =>
    Array.from({ length: 12 }).map((_, i) => ({
      name: `t${i + 1}`,
      throughput: Math.max(20, Math.round(80 + Math.sin(i) * 25 + (systemMetrics?.activeAgents || 5))),
      latency: Math.max(30, Math.round(120 - Math.cos(i) * 30)),
    })),
  [systemMetrics]);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const detail: any = (e as any).detail || {};
      if (detail?.nodeId) {
        focusNode(detail.nodeId);
      }
      if (Array.isArray(detail?.trace)) {
        tracePath(detail.trace);
      }
    };
    // @ts-ignore - Custom event typing
    window.addEventListener('wisdomnet:focus-node', handler as any);
    return () => {
      // @ts-ignore
      window.removeEventListener('wisdomnet:focus-node', handler as any);
    };
  }, [focusNode, tracePath]);

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    tracePath([edge.id]);
    const target = nodes.find((n) => n.id === edge.target);
    if (target) {
      setSelected(target);
      setOpen(true);
      focusNode(target.id);
    }
  }, [nodes, tracePath, focusNode]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "WisdomNET RAG Systems Map",
    applicationCategory: "DeveloperApplication",
    description: "Interactive RAG architecture map linking agents, chains, tools, memory, and LLMs with live metrics.",
    operatingSystem: "Web",
  };

  return (
    <div className="h-full flex flex-col">
      <Helmet>
        <title>RAG Systems Map | WisdomNET</title>
        <meta name="description" content="Interactive, lucid-style RAG system diagram with live metrics and deep interconnects." />
        <link rel="canonical" href="/" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Helmet>

      <Card className="bg-card/70 backdrop-blur-sm border-border p-3 h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">RAG Systems Map</h2>
            <Badge variant="outline" className="ml-2 cursor-pointer" title="View agents" onClick={() => focusNode('agents')}>{systemMetrics?.activeAgents ?? 0} agents</Badge>
            <Badge variant="outline" className="cursor-pointer" title="View memory" onClick={() => focusNode('memory')}>{systemMetrics?.memoryUsage ?? 0} memory entries</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => { window.dispatchEvent(new CustomEvent('wisdomnet:navigate-tab', { detail: { tab: 'orchestrator' } })); }}><GitBranch className="h-4 w-4 mr-1" /> Snapshot</Button>
            <Button variant="outline" size="sm" onClick={() => { window.dispatchEvent(new CustomEvent('wisdomnet:navigate-tab', { detail: { tab: 'orchestrator' } })); }}><Layers className="h-4 w-4 mr-1" /> Templates</Button>
          </div>
        </div>
        <Separator className="mb-3" />

        <div className="flex gap-3 h-full">
          <div className="flex-1 rounded-lg border border-border overflow-hidden">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={handleNodeClick}
              onEdgeClick={onEdgeClick}
              onInit={setRfInstance}
              fitView
              attributionPosition="top-right"
              style={{ backgroundColor: "transparent" }}
            >
              <MiniMap zoomable pannable />
              <Controls />
              <Background />
            </ReactFlow>
          </div>

          <div className="w-80 shrink-0 space-y-3">
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-2"><Network className="h-4 w-4 text-primary" /><span className="font-medium">Navigate & Trace</span></div>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" onClick={() => focusNode('user')}>User</Button>
                <Button variant="outline" size="sm" onClick={() => focusNode('chaining')}>Chain</Button>
                <Button variant="outline" size="sm" onClick={() => focusNode('agents')}>Agents</Button>
                <Button variant="outline" size="sm" onClick={() => focusNode('deepthink')}>Deep</Button>
                <Button variant="outline" size="sm" onClick={() => focusNode('dtp')}>DTP</Button>
                <Button variant="outline" size="sm" onClick={() => focusNode('memory')}>Memory</Button>
                <Button variant="outline" size="sm" onClick={() => focusNode('tools')}>Tools</Button>
                <Button variant="outline" size="sm" onClick={() => focusNode('logging')}>Trace</Button>
                <Button variant="outline" size="sm" onClick={() => focusNode('llm')}>LLM</Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => tracePath(['e-user-chain','e-chain-agents','e-agents-deep','e-deep-dtp','e-dtp-llm'])}>User → LLM</Button>
                <Button size="sm" variant="secondary" onClick={() => tracePath(['e-agents-deep','e-deep-memory','e-memory-llm'])}>Agents ↔ Memory</Button>
                <Button size="sm" variant="secondary" onClick={() => tracePath(['e-agents-tools','e-tools-llm'])}>Tools Augment</Button>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-2"><Activity className="h-4 w-4 text-primary" /><span className="font-medium">Live Throughput</span></div>
              <ChartContainer config={chartConfig} className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ left: 4, right: 4, top: 10, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="throughput" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
                    <Area type="monotone" dataKey="latency" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.15)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
              <ChartContainer config={chartConfig}>
                <ChartLegend content={<ChartLegendContent />} className="mt-2" />
              </ChartContainer>
            </Card>

            <Card className="p-3">
              <div className="flex items-center gap-2 mb-2"><Brain className="h-4 w-4 text-primary" /><span className="font-medium">Deep Think</span></div>
              <p className="text-sm text-muted-foreground">Recursive self-reflection, parallel branching, dynamic rerouting.</p>
            </Card>

            <Card className="p-3">
              <div className="flex items-center gap-2 mb-2"><Database className="h-4 w-4 text-primary" /><span className="font-medium">Dynamic Token Power</span></div>
              <p className="text-sm text-muted-foreground">Shards and routes large context across multi-call workflows to beat token limits.</p>
            </Card>
          </div>
        </div>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[420px] sm:w-[420px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selected?.id === "deepthink" && <Cpu className="h-4 w-4 text-primary" />}
              {selected?.id === "dtp" && <Database className="h-4 w-4 text-primary" />}
              {selected?.id === "agents" && <Brain className="h-4 w-4 text-primary" />}
              {selected?.id === "chaining" && <GitBranch className="h-4 w-4 text-primary" />}
              {String(((selected?.data as any)?.label ?? "Node"))}
            </SheetTitle>
            <SheetDescription>
              Click connections to explore the living RAG diagram. Every node links workflows, tools, memory, and LLM calls.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Overview</h4>
              <p className="text-sm text-muted-foreground">
                {selected?.id === "deepthink" && "Extreme interconnect layer enabling recursive self-reflection and emergent behavior across agents and chains."}
                {selected?.id === "dtp" && "Context distribution engine that shards, compresses, and routes knowledge across multi-step prompts."}
                {selected?.id === "agents" && "Specialized agents collaborate via memory and tools with autonomous handoffs and verification."}
                {selected?.id === "chaining" && "Deterministic prompt sequencing with tool calls and output parsing for reliable generation."}
                {selected && ["deepthink","dtp","agents","chaining"].indexOf(selected.id) === -1 && "Part of the end-to-end orchestration fabric."}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-1">Key links</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li><a className="underline underline-offset-2" href="#" aria-label="Open orchestration library" onClick={() => { window.dispatchEvent(new CustomEvent('wisdomnet:navigate-tab', { detail: { tab: 'orchestrator' } })); setOpen(false); }}>Orchestration Library</a></li>
                <li><a className="underline underline-offset-2" href="#" aria-label="Open templates" onClick={() => { window.dispatchEvent(new CustomEvent('wisdomnet:navigate-tab', { detail: { tab: 'orchestrator' } })); setOpen(false); }}>Enterprise Templates</a></li>
                <li><a className="underline underline-offset-2" href="#" aria-label="Open patterns" onClick={() => { window.dispatchEvent(new CustomEvent('wisdomnet:navigate-tab', { detail: { tab: 'rag-map' } })); }}>Architectural Patterns</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Health</h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md border border-border p-2">
                  <div className="text-xs text-muted-foreground">Agents</div>
                  <div className="text-sm font-semibold">{systemMetrics?.activeAgents ?? 0}</div>
                </div>
                <div className="rounded-md border border-border p-2">
                  <div className="text-xs text-muted-foreground">Tasks</div>
                  <div className="text-sm font-semibold">{systemMetrics?.completedTasks ?? 0}</div>
                </div>
                <div className="rounded-md border border-border p-2">
                  <div className="text-xs text-muted-foreground">Load</div>
                  <div className="text-sm font-semibold">{Math.round(systemMetrics?.systemLoad ?? 0)}%</div>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
