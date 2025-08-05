import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Plus, 
  Play, 
  Pause, 
  Settings, 
  Save, 
  Download,
  Upload,
  Layers,
  Network,
  Zap,
  Eye,
  Filter,
  Grid,
  List,
  Target,
  BarChart3,
  Clock,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

import { 
  orchestrationLibrary, 
  connectionLibrary, 
  templateLibrary,
  NodeCategory, 
  ConnectionType,
  OrchestrationNode, 
  OrchestrationConnection,
  OrchestrationTemplate,
  getNodesByCategory,
  getAllNodes,
  getNodeById,
  getCategoryColor
} from '@/lib/orchestration-library';

interface CanvasNode extends OrchestrationNode {
  position: { x: number; y: number };
  size: { width: number; height: number };
  selected: boolean;
  status: 'idle' | 'active' | 'error' | 'processing';
  connections: string[];
}

interface CanvasConnection {
  id: string;
  sourceId: string;
  targetId: string;
  type: ConnectionType;
  status: 'active' | 'idle' | 'error';
  throughput: number;
  latency: number;
}

const OrchestrationStudio: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasNodes, setCanvasNodes] = useState<Map<string, CanvasNode>>(new Map());
  const [canvasConnections, setCanvasConnections] = useState<Map<string, CanvasConnection>>(new Map());
  
  // UI State
  const [selectedCategory, setSelectedCategory] = useState<NodeCategory>(NodeCategory.AGENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);

  // Canvas state
  const [canvasSize] = useState({ width: 1200, height: 800 });
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Filter nodes based on search and category
  const filteredNodes = getNodesByCategory(selectedCategory).filter(node =>
    node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.capabilities.some(cap => cap.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Add node to canvas
  const addNodeToCanvas = useCallback((node: OrchestrationNode) => {
    const canvasNode: CanvasNode = {
      ...node,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      size: { width: 120, height: 80 },
      selected: false,
      status: 'idle',
      connections: []
    };
    
    setCanvasNodes(prev => new Map(prev).set(node.id, canvasNode));
  }, []);

  // Load template
  const loadTemplate = useCallback((template: OrchestrationTemplate) => {
    const newNodes = new Map<string, CanvasNode>();
    const newConnections = new Map<string, CanvasConnection>();

    // Add nodes
    template.nodes.forEach(nodeConfig => {
      const node = getNodeById(nodeConfig.nodeId);
      if (node) {
        const canvasNode: CanvasNode = {
          ...node,
          position: nodeConfig.position,
          size: { width: 120, height: 80 },
          selected: false,
          status: 'idle',
          connections: []
        };
        newNodes.set(node.id, canvasNode);
      }
    });

    // Add connections
    template.connections.forEach((conn, index) => {
      const connectionId = `conn-${index}`;
      const canvasConnection: CanvasConnection = {
        id: connectionId,
        sourceId: conn.sourceId,
        targetId: conn.targetId,
        type: conn.connectionType,
        status: 'idle',
        throughput: 0,
        latency: 0
      };
      newConnections.set(connectionId, canvasConnection);

      // Update node connections
      const sourceNode = newNodes.get(conn.sourceId);
      const targetNode = newNodes.get(conn.targetId);
      if (sourceNode) sourceNode.connections.push(connectionId);
      if (targetNode) targetNode.connections.push(connectionId);
    });

    setCanvasNodes(newNodes);
    setCanvasConnections(newConnections);
  }, []);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    // Apply zoom and pan
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(panOffset.x, panOffset.y);

    // Draw grid
    drawGrid(ctx);

    // Draw connections
    canvasConnections.forEach(connection => {
      drawConnection(ctx, connection);
    });

    // Draw nodes
    canvasNodes.forEach(node => {
      drawNode(ctx, node);
    });

    ctx.restore();
  }, [canvasNodes, canvasConnections, zoom, panOffset, canvasSize]);

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const gridSize = 20;
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 0.5;

    for (let x = 0; x <= canvasSize.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasSize.height);
      ctx.stroke();
    }

    for (let y = 0; y <= canvasSize.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasSize.width, y);
      ctx.stroke();
    }
  };

  const drawNode = (ctx: CanvasRenderingContext2D, node: CanvasNode) => {
    const { x, y } = node.position;
    const { width, height } = node.size;

    // Node background
    ctx.fillStyle = node.selected ? '#3b82f6' : node.color;
    ctx.fillRect(x, y, width, height);

    // Node border
    ctx.strokeStyle = node.selected ? '#1d4ed8' : '#e5e7eb';
    ctx.lineWidth = node.selected ? 2 : 1;
    ctx.strokeRect(x, y, width, height);

    // Node name
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(node.name, x + width / 2, y + height / 2);

    // Status indicator
    const statusColor = {
      'idle': '#6b7280',
      'active': '#10b981',
      'error': '#ef4444',
      'processing': '#f59e0b'
    }[node.status];
    
    ctx.fillStyle = statusColor;
    ctx.beginPath();
    ctx.arc(x + width - 8, y + 8, 4, 0, 2 * Math.PI);
    ctx.fill();
  };

  const drawConnection = (ctx: CanvasRenderingContext2D, connection: CanvasConnection) => {
    const sourceNode = canvasNodes.get(connection.sourceId);
    const targetNode = canvasNodes.get(connection.targetId);
    
    if (!sourceNode || !targetNode) return;

    const startX = sourceNode.position.x + sourceNode.size.width / 2;
    const startY = sourceNode.position.y + sourceNode.size.height / 2;
    const endX = targetNode.position.x + targetNode.size.width / 2;
    const endY = targetNode.position.y + targetNode.size.height / 2;

    const connectionInfo = connectionLibrary[connection.type];
    
    ctx.strokeStyle = connectionInfo.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Arrow head
    const angle = Math.atan2(endY - startY, endX - startX);
    const arrowLength = 10;
    
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowLength * Math.cos(angle - Math.PI / 6),
      endY - arrowLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowLength * Math.cos(angle + Math.PI / 6),
      endY - arrowLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

  // Calculate canvas metrics
  const canvasMetrics = {
    totalNodes: canvasNodes.size,
    activeNodes: Array.from(canvasNodes.values()).filter(n => n.status === 'active').length,
    totalConnections: canvasConnections.size,
    estimatedCost: Array.from(canvasNodes.values()).reduce((sum, node) => {
      const costMultiplier = { free: 0, freemium: 10, paid: 50, enterprise: 200 };
      return sum + costMultiplier[node.cost];
    }, 0),
    complexity: Array.from(canvasNodes.values()).reduce((max, node) => {
      const complexityScore = { low: 1, medium: 2, high: 3, extreme: 4 };
      return Math.max(max, complexityScore[node.complexity]);
    }, 0)
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Left Sidebar - Node Library */}
      <div className="w-80 border-r bg-card flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold mb-4">Orchestration Studio</h2>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as NodeCategory)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(NodeCategory).map(category => (
                <SelectItem key={category} value={category}>
                  {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex gap-2 mt-4">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Node Library */}
        <ScrollArea className="flex-1 p-4">
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
            {filteredNodes.map(node => (
              <Card 
                key={node.id} 
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => addNodeToCanvas(node)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <node.icon className="h-4 w-4" style={{ color: node.color }} />
                    <span className="text-sm font-medium truncate">{node.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {node.complexity}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {node.cost}
                    </Badge>
                  </div>
                  {node.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {node.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {/* Templates */}
        <div className="border-t p-4">
          <h3 className="font-medium mb-3">Templates</h3>
          <div className="space-y-2">
            {templateLibrary.slice(0, 3).map(template => (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => loadTemplate(template)}
              >
                <template.icon className="h-4 w-4 mr-2" />
                {template.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="border-b bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={isPlaying ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? 'Pause' : 'Run'}
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMetrics(!showMetrics)}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Metrics
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="absolute inset-0 bg-background cursor-crosshair"
            onMouseDown={(e) => {
              setIsDragging(true);
              setDragStart({ x: e.clientX, y: e.clientY });
            }}
            onMouseMove={(e) => {
              if (isDragging) {
                const deltaX = e.clientX - dragStart.x;
                const deltaY = e.clientY - dragStart.y;
                setPanOffset(prev => ({
                  x: prev.x + deltaX / zoom,
                  y: prev.y + deltaY / zoom
                }));
                setDragStart({ x: e.clientX, y: e.clientY });
              }
            }}
            onMouseUp={() => setIsDragging(false)}
            onWheel={(e) => {
              e.preventDefault();
              const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
              setZoom(prev => Math.max(0.1, Math.min(3, prev * zoomFactor)));
            }}
          />

          {/* Canvas Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(prev => Math.min(3, prev * 1.2))}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(prev => Math.max(0.1, prev / 1.2))}
            >
              <Zap className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setZoom(1);
                setPanOffset({ x: 0, y: 0 });
              }}
            >
              <Target className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Metrics & Properties */}
      {showMetrics && (
        <div className="w-80 border-l bg-card p-4">
          <h3 className="font-semibold mb-4">System Metrics</h3>
          
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Nodes</span>
                  <span className="text-sm font-medium">{canvasMetrics.totalNodes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <span className="text-sm font-medium text-green-600">{canvasMetrics.activeNodes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Connections</span>
                  <span className="text-sm font-medium">{canvasMetrics.totalConnections}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Cost Estimation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-lg font-semibold">${canvasMetrics.estimatedCost}/month</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Estimated operational cost
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Complexity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <Badge variant={canvasMetrics.complexity > 3 ? 'destructive' : 'secondary'}>
                    {['Low', 'Medium', 'High', 'Extreme'][canvasMetrics.complexity - 1] || 'None'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrchestrationStudio;