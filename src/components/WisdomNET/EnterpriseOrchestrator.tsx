import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Network, 
  Plus, 
  Play, 
  Pause, 
  Settings, 
  Save, 
  Download,
  Users,
  Brain,
  Target,
  Shield,
  Zap,
  TrendingUp,
  GitBranch,
  Eye,
  Layers
} from 'lucide-react';

// Enterprise Node Types
enum EnterpriseNodeType {
  EXECUTIVE_DECISION = 'executive_decision',
  STRATEGIC_PLANNING = 'strategic_planning',
  OPERATIONAL_EXECUTION = 'operational_execution',
  TECHNICAL_ARCHITECTURE = 'technical_architecture',
  DATA_ANALYTICS = 'data_analytics',
  CUSTOMER_EXPERIENCE = 'customer_experience',
  FINANCIAL_MANAGEMENT = 'financial_management',
  COMPLIANCE_MONITORING = 'compliance_monitoring',
  SECURITY_ENFORCEMENT = 'security_enforcement',
  INNOVATION_ENGINE = 'innovation_engine'
}

// Connection Types
enum ConnectionType {
  HIERARCHICAL = 'hierarchical',
  COLLABORATIVE = 'collaborative',
  DATA_FLOW = 'data_flow',
  CONTROL_FLOW = 'control_flow',
  FEEDBACK_LOOP = 'feedback_loop',
  ESCALATION = 'escalation'
}

// Orchestration Templates
enum OrchestrationTemplate {
  STARTUP_BUILDER = 'startup_builder',
  ENTERPRISE_ARCHITECT = 'enterprise_architect',
  FINANCIAL_SERVICES = 'financial_services',
  MANUFACTURING = 'manufacturing',
  HEALTHCARE = 'healthcare',
  CUSTOM = 'custom'
}

interface EnterpriseNode {
  id: string;
  name: string;
  type: EnterpriseNodeType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  connections: string[];
  capabilities: string[];
  status: 'active' | 'idle' | 'error' | 'processing';
  load: number;
  efficiency: number;
  metadata: Record<string, any>;
}

interface EnterpriseConnection {
  id: string;
  sourceId: string;
  targetId: string;
  type: ConnectionType;
  strength: number;
  latency: number;
  throughput: number;
  status: 'active' | 'idle' | 'congested' | 'error';
}

interface GradientWave {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  intensity: number;
  propagationSpeed: number;
  contextPayload: any;
  visualEffect: 'pulse' | 'flow' | 'ripple' | 'burst';
}

const EnterpriseOrchestrator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Map<string, EnterpriseNode>>(new Map());
  const [connections, setConnections] = useState<Map<string, EnterpriseConnection>>(new Map());
  const [waves, setWaves] = useState<Map<string, GradientWave>>(new Map());
  const [selectedTemplate, setSelectedTemplate] = useState<OrchestrationTemplate>(OrchestrationTemplate.STARTUP_BUILDER);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [connectionMode, setConnectionMode] = useState(false);
  const [sourceNode, setSourceNode] = useState<string | null>(null);

  // Animation frame for gradient waves
  const animationFrameRef = useRef<number>();

  // Canvas dimensions
  const CANVAS_WIDTH = 1200;
  const CANVAS_HEIGHT = 800;

  // Node configuration
  const getNodeConfig = (type: EnterpriseNodeType) => {
    const configs = {
      [EnterpriseNodeType.EXECUTIVE_DECISION]: {
        color: 'hsl(var(--primary))',
        icon: '👑',
        size: { width: 120, height: 80 },
        capabilities: ['Strategic Decision', 'Resource Allocation', 'Vision Setting']
      },
      [EnterpriseNodeType.STRATEGIC_PLANNING]: {
        color: 'hsl(210, 70%, 50%)',
        icon: '🎯',
        size: { width: 110, height: 75 },
        capabilities: ['Market Analysis', 'Roadmap Planning', 'Risk Assessment']
      },
      [EnterpriseNodeType.OPERATIONAL_EXECUTION]: {
        color: 'hsl(145, 70%, 50%)',
        icon: '⚡',
        size: { width: 100, height: 70 },
        capabilities: ['Task Execution', 'Process Management', 'Quality Control']
      },
      [EnterpriseNodeType.TECHNICAL_ARCHITECTURE]: {
        color: 'hsl(30, 70%, 50%)',
        icon: '🏗️',
        size: { width: 115, height: 75 },
        capabilities: ['System Design', 'Integration', 'Scalability Planning']
      },
      [EnterpriseNodeType.DATA_ANALYTICS]: {
        color: 'hsl(270, 70%, 50%)',
        icon: '📊',
        size: { width: 105, height: 70 },
        capabilities: ['Data Processing', 'Insights Generation', 'Predictive Analytics']
      },
      [EnterpriseNodeType.CUSTOMER_EXPERIENCE]: {
        color: 'hsl(15, 70%, 50%)',
        icon: '👥',
        size: { width: 110, height: 75 },
        capabilities: ['User Research', 'Experience Design', 'Feedback Analysis']
      },
      [EnterpriseNodeType.FINANCIAL_MANAGEMENT]: {
        color: 'hsl(120, 70%, 40%)',
        icon: '💰',
        size: { width: 105, height: 70 },
        capabilities: ['Budget Planning', 'Cost Analysis', 'ROI Optimization']
      },
      [EnterpriseNodeType.COMPLIANCE_MONITORING]: {
        color: 'hsl(0, 70%, 50%)',
        icon: '🛡️',
        size: { width: 100, height: 70 },
        capabilities: ['Regulatory Compliance', 'Audit Management', 'Policy Enforcement']
      },
      [EnterpriseNodeType.SECURITY_ENFORCEMENT]: {
        color: 'hsl(350, 70%, 45%)',
        icon: '🔒',
        size: { width: 100, height: 70 },
        capabilities: ['Threat Detection', 'Access Control', 'Security Monitoring']
      },
      [EnterpriseNodeType.INNOVATION_ENGINE]: {
        color: 'hsl(300, 70%, 50%)',
        icon: '🚀',
        size: { width: 115, height: 75 },
        capabilities: ['Innovation Research', 'Prototype Development', 'Technology Scouting']
      }
    };
    return configs[type];
  };

  // Template configurations
  const getTemplateConfiguration = (template: OrchestrationTemplate) => {
    const templates = {
      [OrchestrationTemplate.STARTUP_BUILDER]: {
        name: 'Startup Builder',
        description: 'Agile startup development with rapid iteration',
        nodes: [
          { type: EnterpriseNodeType.EXECUTIVE_DECISION, position: { x: 100, y: 100 } },
          { type: EnterpriseNodeType.STRATEGIC_PLANNING, position: { x: 300, y: 100 } },
          { type: EnterpriseNodeType.TECHNICAL_ARCHITECTURE, position: { x: 500, y: 100 } },
          { type: EnterpriseNodeType.OPERATIONAL_EXECUTION, position: { x: 300, y: 250 } },
          { type: EnterpriseNodeType.CUSTOMER_EXPERIENCE, position: { x: 100, y: 250 } },
          { type: EnterpriseNodeType.DATA_ANALYTICS, position: { x: 500, y: 250 } }
        ],
        connections: [
          { source: 0, target: 1, type: ConnectionType.HIERARCHICAL },
          { source: 1, target: 2, type: ConnectionType.COLLABORATIVE },
          { source: 1, target: 3, type: ConnectionType.CONTROL_FLOW },
          { source: 4, target: 1, type: ConnectionType.FEEDBACK_LOOP },
          { source: 5, target: 1, type: ConnectionType.DATA_FLOW }
        ]
      },
      [OrchestrationTemplate.ENTERPRISE_ARCHITECT]: {
        name: 'Enterprise Architect',
        description: 'Large-scale enterprise architecture management',
        nodes: [
          { type: EnterpriseNodeType.EXECUTIVE_DECISION, position: { x: 200, y: 50 } },
          { type: EnterpriseNodeType.TECHNICAL_ARCHITECTURE, position: { x: 200, y: 150 } },
          { type: EnterpriseNodeType.SECURITY_ENFORCEMENT, position: { x: 50, y: 250 } },
          { type: EnterpriseNodeType.COMPLIANCE_MONITORING, position: { x: 200, y: 250 } },
          { type: EnterpriseNodeType.OPERATIONAL_EXECUTION, position: { x: 350, y: 250 } },
          { type: EnterpriseNodeType.DATA_ANALYTICS, position: { x: 200, y: 350 } }
        ],
        connections: [
          { source: 0, target: 1, type: ConnectionType.HIERARCHICAL },
          { source: 1, target: 2, type: ConnectionType.CONTROL_FLOW },
          { source: 1, target: 3, type: ConnectionType.CONTROL_FLOW },
          { source: 1, target: 4, type: ConnectionType.CONTROL_FLOW },
          { source: 3, target: 5, type: ConnectionType.DATA_FLOW },
          { source: 2, target: 3, type: ConnectionType.COLLABORATIVE }
        ]
      },
      [OrchestrationTemplate.FINANCIAL_SERVICES]: {
        name: 'Financial Services',
        description: 'Regulated financial services with compliance focus',
        nodes: [
          { type: EnterpriseNodeType.EXECUTIVE_DECISION, position: { x: 200, y: 50 } },
          { type: EnterpriseNodeType.FINANCIAL_MANAGEMENT, position: { x: 100, y: 150 } },
          { type: EnterpriseNodeType.COMPLIANCE_MONITORING, position: { x: 300, y: 150 } },
          { type: EnterpriseNodeType.SECURITY_ENFORCEMENT, position: { x: 200, y: 200 } },
          { type: EnterpriseNodeType.DATA_ANALYTICS, position: { x: 100, y: 300 } },
          { type: EnterpriseNodeType.CUSTOMER_EXPERIENCE, position: { x: 300, y: 300 } }
        ],
        connections: [
          { source: 0, target: 1, type: ConnectionType.HIERARCHICAL },
          { source: 0, target: 2, type: ConnectionType.HIERARCHICAL },
          { source: 2, target: 3, type: ConnectionType.CONTROL_FLOW },
          { source: 1, target: 4, type: ConnectionType.DATA_FLOW },
          { source: 2, target: 5, type: ConnectionType.FEEDBACK_LOOP },
          { source: 3, target: 4, type: ConnectionType.COLLABORATIVE }
        ]
      }
    };
    return templates[template];
  };

  // Load template
  const loadTemplate = useCallback((template: OrchestrationTemplate) => {
    const config = getTemplateConfiguration(template);
    const newNodes = new Map<string, EnterpriseNode>();
    const newConnections = new Map<string, EnterpriseConnection>();

    // Create nodes and store them in order
    const nodeArray: EnterpriseNode[] = [];
    config.nodes.forEach((nodeConfig, index) => {
      const nodeType = nodeConfig.type;
      const nodeConfigData = getNodeConfig(nodeType);
      const node: EnterpriseNode = {
        id: `node-${index}`,
        name: `${nodeType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} ${index + 1}`,
        type: nodeType,
        position: nodeConfig.position,
        size: nodeConfigData.size,
        connections: [],
        capabilities: nodeConfigData.capabilities,
        status: 'idle',
        load: Math.random() * 0.5 + 0.1,
        efficiency: Math.random() * 0.3 + 0.7,
        metadata: {}
      };
      newNodes.set(node.id, node);
      nodeArray.push(node);
    });

    // Create connections
    config.connections.forEach((connConfig, index) => {
      const sourceNode = nodeArray[connConfig.source];
      const targetNode = nodeArray[connConfig.target];
      
      if (!sourceNode || !targetNode) {
        console.error(`Invalid connection indices: source=${connConfig.source}, target=${connConfig.target}`);
        return;
      }
      
      const connection: EnterpriseConnection = {
        id: `connection-${index}`,
        sourceId: sourceNode.id,
        targetId: targetNode.id,
        type: connConfig.type,
        strength: Math.random() * 0.4 + 0.6,
        latency: Math.random() * 50 + 10,
        throughput: Math.random() * 100 + 50,
        status: 'active'
      };
      
      newConnections.set(connection.id, connection);
      sourceNode.connections.push(targetNode.id);
    });

    setNodes(newNodes);
    setConnections(newConnections);
  }, []);

  // Canvas drawing
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid
    ctx.strokeStyle = 'hsl(var(--muted-foreground) / 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_WIDTH; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Draw connections
    connections.forEach(connection => {
      const sourceNode = nodes.get(connection.sourceId);
      const targetNode = nodes.get(connection.targetId);
      
      if (!sourceNode || !targetNode) return;

      const startX = sourceNode.position.x + sourceNode.size.width / 2;
      const startY = sourceNode.position.y + sourceNode.size.height / 2;
      const endX = targetNode.position.x + targetNode.size.width / 2;
      const endY = targetNode.position.y + targetNode.size.height / 2;

      // Connection line
      ctx.strokeStyle = connection.status === 'active' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))';
      ctx.lineWidth = Math.max(2, connection.strength * 4);
      ctx.setLineDash(connection.type === ConnectionType.FEEDBACK_LOOP ? [5, 5] : []);
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      
      // Curved line for better visualization
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      const offset = connection.type === ConnectionType.HIERARCHICAL ? -30 : 0;
      
      ctx.quadraticCurveTo(midX, midY + offset, endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Connection type indicator
      ctx.fillStyle = 'hsl(var(--primary))';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(connection.type.charAt(0).toUpperCase(), midX, midY + offset - 5);

      // Arrow head
      const angle = Math.atan2(endY - startY, endX - startX);
      const headLength = 10;
      
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - headLength * Math.cos(angle - Math.PI / 6),
        endY - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - headLength * Math.cos(angle + Math.PI / 6),
        endY - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    });

    // Draw gradient waves
    waves.forEach(wave => {
      const sourceNode = nodes.get(wave.sourceNodeId);
      const targetNode = nodes.get(wave.targetNodeId);
      
      if (!sourceNode || !targetNode) return;

      const progress = (Date.now() / 1000) % 2; // 2-second cycle
      const startX = sourceNode.position.x + sourceNode.size.width / 2;
      const startY = sourceNode.position.y + sourceNode.size.height / 2;
      const endX = targetNode.position.x + targetNode.size.width / 2;
      const endY = targetNode.position.y + targetNode.size.height / 2;
      
      const currentX = startX + (endX - startX) * progress;
      const currentY = startY + (endY - startY) * progress;

      // Gradient wave effect
      const gradient = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, 20);
      gradient.addColorStop(0, `hsl(var(--primary) / ${wave.intensity})`);
      gradient.addColorStop(1, `hsl(var(--primary) / 0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(currentX, currentY, 20, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw nodes
    nodes.forEach(node => {
      const config = getNodeConfig(node.type);
      
      // Node background
      ctx.fillStyle = config.color;
      ctx.fillRect(node.position.x, node.position.y, node.size.width, node.size.height);

      // Node border
      ctx.strokeStyle = selectedNode === node.id ? 'hsl(var(--ring))' : 'hsl(var(--border))';
      ctx.lineWidth = selectedNode === node.id ? 3 : 2;
      ctx.strokeRect(node.position.x, node.position.y, node.size.width, node.size.height);

      // Status indicator
      const statusColors = {
        active: 'hsl(var(--success))',
        idle: 'hsl(var(--muted-foreground))',
        error: 'hsl(var(--destructive))',
        processing: 'hsl(var(--warning))'
      };
      
      ctx.fillStyle = statusColors[node.status];
      ctx.beginPath();
      ctx.arc(node.position.x + node.size.width - 8, node.position.y + 8, 4, 0, Math.PI * 2);
      ctx.fill();

      // Load indicator
      const loadWidth = (node.size.width - 10) * node.load;
      ctx.fillStyle = 'hsl(var(--primary) / 0.3)';
      ctx.fillRect(node.position.x + 5, node.position.y + node.size.height - 8, loadWidth, 3);

      // Node icon
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'white';
      ctx.fillText(
        config.icon,
        node.position.x + node.size.width / 2,
        node.position.y + 35
      );

      // Node name
      ctx.font = '10px sans-serif';
      ctx.fillStyle = 'white';
      ctx.fillText(
        node.name.substring(0, 12) + (node.name.length > 12 ? '...' : ''),
        node.position.x + node.size.width / 2,
        node.position.y + node.size.height - 10
      );
    });
  }, [nodes, connections, waves, selectedNode]);

  // Animation loop
  useEffect(() => {
    if (isRunning) {
      const animate = () => {
        drawCanvas();
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animate();
    } else {
      drawCanvas();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, drawCanvas]);

  // Canvas click handler
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check for node clicks
    let clickedNode: string | null = null;
    nodes.forEach(node => {
      if (
        x >= node.position.x &&
        x <= node.position.x + node.size.width &&
        y >= node.position.y &&
        y <= node.position.y + node.size.height
      ) {
        clickedNode = node.id;
      }
    });

    if (connectionMode && clickedNode) {
      if (!sourceNode) {
        setSourceNode(clickedNode);
      } else if (sourceNode !== clickedNode) {
        // Create connection
        const newConnection: EnterpriseConnection = {
          id: `connection-${Date.now()}`,
          sourceId: sourceNode,
          targetId: clickedNode,
          type: ConnectionType.COLLABORATIVE,
          strength: 0.8,
          latency: 25,
          throughput: 75,
          status: 'active'
        };
        
        setConnections(prev => new Map(prev).set(newConnection.id, newConnection));
        setSourceNode(null);
        setConnectionMode(false);
      }
    } else {
      setSelectedNode(clickedNode);
    }
  }, [nodes, connectionMode, sourceNode]);

  // Add node
  const addNode = useCallback((nodeType: EnterpriseNodeType) => {
    const config = getNodeConfig(nodeType);
    const newNode: EnterpriseNode = {
      id: `node-${Date.now()}`,
      name: `${nodeType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
      type: nodeType,
      position: { x: 100 + Math.random() * 400, y: 100 + Math.random() * 300 },
      size: config.size,
      connections: [],
      capabilities: config.capabilities,
      status: 'idle',
      load: Math.random() * 0.5 + 0.1,
      efficiency: Math.random() * 0.3 + 0.7,
      metadata: {}
    };
    
    setNodes(prev => new Map(prev).set(newNode.id, newNode));
  }, []);

  // Create gradient wave
  const createGradientWave = useCallback((sourceId: string, targetId: string) => {
    const wave: GradientWave = {
      id: `wave-${Date.now()}`,
      sourceNodeId: sourceId,
      targetNodeId: targetId,
      intensity: 0.6,
      propagationSpeed: 1.0,
      contextPayload: { message: 'Context transfer', timestamp: Date.now() },
      visualEffect: 'pulse'
    };
    
    setWaves(prev => new Map(prev).set(wave.id, wave));
    
    // Remove wave after animation
    setTimeout(() => {
      setWaves(prev => {
        const newWaves = new Map(prev);
        newWaves.delete(wave.id);
        return newWaves;
      });
    }, 2000);
  }, []);

  // Initialize with startup template
  useEffect(() => {
    loadTemplate(OrchestrationTemplate.STARTUP_BUILDER);
  }, [loadTemplate]);

  const selectedNodeData = selectedNode ? nodes.get(selectedNode) : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-6 w-6" />
                Enterprise Orchestration System
              </CardTitle>
              <CardDescription>
                Advanced AI agent orchestration with gradient wave context management
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={isRunning ? "destructive" : "default"}
                size="sm"
                onClick={() => setIsRunning(!isRunning)}
              >
                {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isRunning ? 'Pause' : 'Start'}
              </Button>
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="designer" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="designer">Visual Designer</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="designer" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant={connectionMode ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => {
                      setConnectionMode(!connectionMode);
                      setSourceNode(null);
                    }}
                  >
                    <GitBranch className="h-4 w-4" />
                    {connectionMode ? 'Cancel Connection' : 'Connect Nodes'}
                  </Button>
                  
                  <Select
                    onValueChange={(value) => addNode(value as EnterpriseNodeType)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Add Node..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(EnterpriseNodeType).map(type => (
                        <SelectItem key={type} value={type}>
                          {getNodeConfig(type).icon} {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    Nodes: {nodes.size}
                  </Badge>
                  <Badge variant="outline">
                    Connections: {connections.size}
                  </Badge>
                  <Badge variant="outline">
                    Active Waves: {waves.size}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="border border-border rounded-lg cursor-pointer bg-background"
                    onClick={handleCanvasClick}
                  />
                </div>

                <div className="space-y-4">
                  {selectedNodeData && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Node Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm font-medium">{selectedNodeData.name}</p>
                          <Badge variant="outline" className="mt-1">
                            {selectedNodeData.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div>
                          <p className="text-xs text-muted-foreground">Status</p>
                          <Badge variant={selectedNodeData.status === 'active' ? 'default' : 'secondary'}>
                            {selectedNodeData.status}
                          </Badge>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">Load</p>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${selectedNodeData.load * 100}%` }}
                            />
                          </div>
                          <p className="text-xs mt-1">{Math.round(selectedNodeData.load * 100)}%</p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">Efficiency</p>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-success h-2 rounded-full" 
                              style={{ width: `${selectedNodeData.efficiency * 100}%` }}
                            />
                          </div>
                          <p className="text-xs mt-1">{Math.round(selectedNodeData.efficiency * 100)}%</p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">Capabilities</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedNodeData.capabilities.map((cap, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {cap}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            const connectedNodes = Array.from(connections.values())
                              .filter(conn => conn.sourceId === selectedNodeData.id)
                              .map(conn => conn.targetId);
                            
                            if (connectedNodes.length > 0) {
                              createGradientWave(selectedNodeData.id, connectedNodes[0]);
                            }
                          }}
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Send Wave
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button size="sm" variant="outline" className="w-full">
                        <Eye className="h-3 w-3 mr-1" />
                        Monitor System
                      </Button>
                      <Button size="sm" variant="outline" className="w-full">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Optimize Performance
                      </Button>
                      <Button size="sm" variant="outline" className="w-full">
                        <Shield className="h-3 w-3 mr-1" />
                        Security Scan
                      </Button>
                      <Button size="sm" variant="outline" className="w-full">
                        <Settings className="h-3 w-3 mr-1" />
                        Configuration
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {Object.values(OrchestrationTemplate).filter(t => t !== OrchestrationTemplate.CUSTOM).map(template => {
                  const config = getTemplateConfiguration(template);
                  return (
                    <Card key={template} className="cursor-pointer hover:bg-accent" onClick={() => {
                      setSelectedTemplate(template);
                      loadTemplate(template);
                    }}>
                      <CardHeader>
                        <CardTitle className="text-sm">{config.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {config.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {config.nodes.length} Nodes
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {config.connections.length} Connections
                          </Badge>
                        </div>
                        <Button size="sm" className="w-full">
                          Load Template
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="monitoring" className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">System Load</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round(Array.from(nodes.values()).reduce((sum, node) => sum + node.load, 0) / nodes.size * 100)}%
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Efficiency</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round(Array.from(nodes.values()).reduce((sum, node) => sum + node.efficiency, 0) / nodes.size * 100)}%
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Active Connections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Array.from(connections.values()).filter(conn => conn.status === 'active').length}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Wave Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {waves.size}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Connection Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Array.from(connections.values()).filter(connection => {
                      const sourceNode = nodes.get(connection.sourceId);
                      const targetNode = nodes.get(connection.targetId);
                      return sourceNode && targetNode;
                    }).map(connection => {
                      const sourceNode = nodes.get(connection.sourceId);
                      const targetNode = nodes.get(connection.targetId);
                      
                      if (!sourceNode || !targetNode) return null;
                      
                      return (
                        <div key={connection.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="text-sm">
                            {sourceNode.name} → {targetNode.name}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={connection.status === 'active' ? 'default' : 'secondary'}>
                              {connection.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {connection.latency.toFixed(0)}ms
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Node Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Array.from(nodes.values()).map(node => (
                        <div key={node.id} className="flex items-center justify-between">
                          <span className="text-sm">{node.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${node.efficiency * 100}%` }}
                              />
                            </div>
                            <span className="text-xs">{Math.round(node.efficiency * 100)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">System Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-primary" />
                        <span className="text-sm">Advanced context processing active</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-success" />
                        <span className="text-sm">Optimal agent distribution achieved</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-warning" />
                        <span className="text-sm">Gradient wave optimization in progress</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-info" />
                        <span className="text-sm">Performance trending upward</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnterpriseOrchestrator;