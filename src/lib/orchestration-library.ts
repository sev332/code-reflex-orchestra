import {
  Search, Code, Brain, Eye, Rocket, Settings2, Shield, Activity, 
  Cpu, Split, Repeat, Share2, Merge, CheckCircle, Filter, Layers, 
  PlayCircle, StopCircle, Globe, FileText, Archive, Radio, Database, 
  Zap, MemoryStick, HardDrive, Bot, Microscope, Package, Gauge, 
  Network, Monitor, Key, Lock, Bell, Mail, Phone, Smartphone, 
  CreditCard, ShoppingCart, Users, BarChart3, Clock, Webhook,
  Building, Server, Cloud, Container, GitBranch, TestTube,
  Fingerprint, Video, Image, Mic, PenTool, Columns, AppWindow,
  TrendingUp, Bitcoin, Warehouse, Truck, Factory, Briefcase,
  Pickaxe, Wallet, Scale, AlertTriangle, RefreshCw, MessageSquare,
  Cog, Link, Box, Workflow, Map, Target, Settings
} from 'lucide-react';

// Enhanced Node Definition
export interface OrchestrationNode {
  id: string;
  name: string;
  icon: any;
  type: string;
  category: NodeCategory;
  color: string;
  capabilities: string[];
  description?: string;
  documentation?: string;
  cost: 'free' | 'paid' | 'freemium' | 'enterprise';
  complexity: 'low' | 'medium' | 'high' | 'extreme';
  reliability: number; // 0-1 score
  scalability: 'single' | 'cluster' | 'distributed' | 'global';
  dependencies?: string[];
  compatibleWith?: string[];
  resourceRequirements: {
    cpu: 'low' | 'medium' | 'high';
    memory: 'low' | 'medium' | 'high';
    storage: 'low' | 'medium' | 'high';
    network: 'low' | 'medium' | 'high';
  };
  metadata?: Record<string, any>;
}

// Enhanced Connection Definition
export interface OrchestrationConnection {
  id: string;
  name: string;
  type: ConnectionType;
  color: string;
  bidirectional: boolean;
  description?: string;
  protocols?: string[];
  latency: 'real-time' | 'near-real-time' | 'batch' | 'async';
  reliability: number;
  security: 'none' | 'basic' | 'encrypted' | 'zero-trust';
}

// Node Categories
export enum NodeCategory {
  AGENTS = 'agents',
  CONTROL = 'control',
  DATA = 'data',
  AI_ML = 'ai_ml',
  MEDIA = 'media',
  COLLABORATION = 'collaboration',
  SECURITY = 'security',
  INFRASTRUCTURE = 'infra',
  BUSINESS = 'business',
  BLOCKCHAIN = 'blockchain',
  SUPPLY_CHAIN = 'supply_chain',
  NO_CODE = 'no_code',
  DEVELOPMENT_OPS = 'development_ops',
  DESIGN = 'design',
  COMMUNICATION = 'communication',
  ANALYTICS = 'analytics',
  INTEGRATION = 'integration'
}

// Connection Types
export enum ConnectionType {
  DATA_FLOW = 'data_flow',
  CONTROL_FLOW = 'control_flow',
  EVENT_STREAM = 'event_stream',
  MESSAGE_QUEUE = 'message_queue',
  API_CALL = 'api_call',
  WEBHOOK = 'webhook',
  DIRECT_LINK = 'direct_link',
  FEEDBACK_LOOP = 'feedback_loop',
  ORCHESTRATION = 'orchestration',
  DEPENDENCY = 'dependency',
  REPLICATION = 'replication',
  LOAD_BALANCE = 'load_balance'
}

// Enhanced Orchestration Library
export const orchestrationLibrary: Record<NodeCategory, OrchestrationNode[]> = {
  // Core AI Agents
  [NodeCategory.AGENTS]: [
    {
      id: 'research_agent',
      name: 'Research Agent',
      icon: Search,
      type: 'agent_research',
      category: NodeCategory.AGENTS,
      color: '#39ff8a',
      capabilities: ['web-research', 'data-analysis', 'report-generation', 'fact-checking', 'trend-analysis'],
      description: 'Autonomous research agent that gathers, analyzes, and synthesizes information from multiple sources',
      cost: 'paid',
      complexity: 'medium',
      reliability: 0.92,
      scalability: 'distributed',
      resourceRequirements: { cpu: 'medium', memory: 'high', storage: 'medium', network: 'high' }
    },
    {
      id: 'code_agent',
      name: 'Code Agent',
      icon: Code,
      type: 'agent_code',
      category: NodeCategory.AGENTS,
      color: '#b794f6',
      capabilities: ['code-generation', 'debugging', 'refactoring', 'testing', 'documentation'],
      description: 'AI-powered coding assistant that writes, reviews, and optimizes code',
      cost: 'paid',
      complexity: 'high',
      reliability: 0.89,
      scalability: 'cluster',
      resourceRequirements: { cpu: 'high', memory: 'high', storage: 'medium', network: 'medium' }
    },
    {
      id: 'memory_agent',
      name: 'Memory Agent',
      icon: Brain,
      type: 'agent_memory',
      category: NodeCategory.AGENTS,
      color: '#ff8c42',
      capabilities: ['context-retention', 'knowledge-storage', 'recall', 'pattern-recognition', 'learning'],
      description: 'Long-term memory system that maintains context and learns from interactions',
      cost: 'freemium',
      complexity: 'high',
      reliability: 0.95,
      scalability: 'distributed',
      resourceRequirements: { cpu: 'medium', memory: 'high', storage: 'high', network: 'medium' }
    },
    {
      id: 'audit_agent',
      name: 'Audit Agent',
      icon: Eye,
      type: 'agent_audit',
      category: NodeCategory.AGENTS,
      color: '#ff6b6b',
      capabilities: ['compliance-checking', 'security-audit', 'quality-assurance', 'risk-assessment'],
      description: 'Compliance and audit agent that monitors for violations and ensures quality',
      cost: 'enterprise',
      complexity: 'high',
      reliability: 0.97,
      scalability: 'global',
      resourceRequirements: { cpu: 'medium', memory: 'medium', storage: 'high', network: 'medium' }
    },
    {
      id: 'architect_agent',
      name: 'Architect Agent',
      icon: Settings2,
      type: 'agent_architect',
      category: NodeCategory.AGENTS,
      color: '#ffe66d',
      capabilities: ['system-design', 'scalability-planning', 'performance-optimization', 'architecture-review'],
      description: 'System architecture agent that designs and optimizes complex systems',
      cost: 'enterprise',
      complexity: 'extreme',
      reliability: 0.94,
      scalability: 'distributed',
      resourceRequirements: { cpu: 'high', memory: 'high', storage: 'medium', network: 'medium' }
    }
  ],

  // Control Flow & Process Management
  [NodeCategory.CONTROL]: [
    {
      id: 'decision_gate',
      name: 'Decision Gate',
      icon: Split,
      type: 'decision_gate',
      category: NodeCategory.CONTROL,
      color: '#b794f6',
      capabilities: ['conditional-branching', 'rule-evaluation', 'path-selection', 'logic-processing'],
      description: 'Intelligent decision point that routes data based on complex conditions',
      cost: 'free',
      complexity: 'low',
      reliability: 0.99,
      scalability: 'single',
      resourceRequirements: { cpu: 'low', memory: 'low', storage: 'low', network: 'low' }
    },
    {
      id: 'workflow_orchestrator',
      name: 'Workflow Orchestrator',
      icon: Workflow,
      type: 'workflow_orchestrator',
      category: NodeCategory.CONTROL,
      color: '#818cf8',
      capabilities: ['workflow-management', 'step-coordination', 'error-handling', 'retry-logic'],
      description: 'Advanced workflow engine that coordinates complex multi-step processes',
      cost: 'paid',
      complexity: 'high',
      reliability: 0.96,
      scalability: 'distributed',
      resourceRequirements: { cpu: 'medium', memory: 'medium', storage: 'medium', network: 'high' }
    },
    {
      id: 'parallel_executor',
      name: 'Parallel Executor',
      icon: Share2,
      type: 'parallel_executor',
      category: NodeCategory.CONTROL,
      color: '#ff6b6b',
      capabilities: ['concurrent-execution', 'thread-management', 'synchronization', 'load-distribution'],
      description: 'High-performance parallel processing engine for concurrent task execution',
      cost: 'paid',
      complexity: 'medium',
      reliability: 0.93,
      scalability: 'cluster',
      resourceRequirements: { cpu: 'high', memory: 'medium', storage: 'low', network: 'medium' }
    }
  ],

  // Data Processing & Storage
  [NodeCategory.DATA]: [
    {
      id: 'data_lake',
      name: 'Data Lake',
      icon: HardDrive,
      type: 'data_lake',
      category: NodeCategory.DATA,
      color: '#b0c4de',
      capabilities: ['massive-storage', 'schema-flexibility', 'real-time-ingestion', 'analytics-ready'],
      description: 'Scalable data lake for storing structured and unstructured data at scale',
      cost: 'paid',
      complexity: 'high',
      reliability: 0.98,
      scalability: 'global',
      resourceRequirements: { cpu: 'medium', memory: 'high', storage: 'high', network: 'high' }
    },
    {
      id: 'stream_processor',
      name: 'Stream Processor',
      icon: Zap,
      type: 'stream_processor',
      category: NodeCategory.DATA,
      color: '#dda0dd',
      capabilities: ['real-time-processing', 'event-streaming', 'windowing', 'aggregation'],
      description: 'High-throughput stream processing engine for real-time data analytics',
      cost: 'paid',
      complexity: 'high',
      reliability: 0.94,
      scalability: 'distributed',
      resourceRequirements: { cpu: 'high', memory: 'high', storage: 'medium', network: 'high' }
    },
    {
      id: 'knowledge_graph',
      name: 'Knowledge Graph',
      icon: Network,
      type: 'knowledge_graph',
      category: NodeCategory.DATA,
      color: '#87ceeb',
      capabilities: ['relationship-mapping', 'semantic-search', 'inference', 'entity-resolution'],
      description: 'Graph database system for managing complex relationships and knowledge',
      cost: 'enterprise',
      complexity: 'extreme',
      reliability: 0.96,
      scalability: 'distributed',
      resourceRequirements: { cpu: 'high', memory: 'high', storage: 'high', network: 'medium' }
    }
  ],

  // AI & Machine Learning
  [NodeCategory.AI_ML]: [
    {
      id: 'llm_router',
      name: 'LLM Router',
      icon: Brain,
      type: 'llm_router',
      category: NodeCategory.AI_ML,
      color: '#c084fc',
      capabilities: ['model-selection', 'load-balancing', 'cost-optimization', 'performance-routing'],
      description: 'Intelligent routing system for distributing requests across multiple LLMs',
      cost: 'paid',
      complexity: 'high',
      reliability: 0.95,
      scalability: 'global',
      resourceRequirements: { cpu: 'medium', memory: 'medium', storage: 'low', network: 'high' }
    },
    {
      id: 'model_training_farm',
      name: 'Model Training Farm',
      icon: Cpu,
      type: 'model_training_farm',
      category: NodeCategory.AI_ML,
      color: '#8b5cf6',
      capabilities: ['distributed-training', 'hyperparameter-tuning', 'model-versioning', 'experiment-tracking'],
      description: 'Scalable infrastructure for training and fine-tuning machine learning models',
      cost: 'enterprise',
      complexity: 'extreme',
      reliability: 0.92,
      scalability: 'global',
      resourceRequirements: { cpu: 'high', memory: 'high', storage: 'high', network: 'high' }
    },
    {
      id: 'vector_database',
      name: 'Vector Database',
      icon: Database,
      type: 'vector_database',
      category: NodeCategory.AI_ML,
      color: '#6d28d9',
      capabilities: ['embedding-storage', 'similarity-search', 'vector-indexing', 'rag-support'],
      description: 'High-performance vector database for embedding storage and semantic search',
      cost: 'paid',
      complexity: 'medium',
      reliability: 0.97,
      scalability: 'distributed',
      resourceRequirements: { cpu: 'medium', memory: 'high', storage: 'high', network: 'medium' }
    }
  ],

  // Infrastructure & DevOps
  [NodeCategory.INFRASTRUCTURE]: [
    {
      id: 'kubernetes_cluster',
      name: 'Kubernetes Cluster',
      icon: Container,
      type: 'kubernetes_cluster',
      category: NodeCategory.INFRASTRUCTURE,
      color: '#326ce5',
      capabilities: ['container-orchestration', 'auto-scaling', 'service-discovery', 'load-balancing'],
      description: 'Production-ready Kubernetes cluster for container orchestration',
      cost: 'paid',
      complexity: 'high',
      reliability: 0.98,
      scalability: 'global',
      resourceRequirements: { cpu: 'high', memory: 'high', storage: 'medium', network: 'high' }
    },
    {
      id: 'edge_computing_network',
      name: 'Edge Computing Network',
      icon: Network,
      type: 'edge_computing_network',
      category: NodeCategory.INFRASTRUCTURE,
      color: '#6495ed',
      capabilities: ['edge-deployment', 'low-latency', 'geographic-distribution', 'offline-capability'],
      description: 'Distributed edge computing network for low-latency applications',
      cost: 'enterprise',
      complexity: 'extreme',
      reliability: 0.94,
      scalability: 'global',
      resourceRequirements: { cpu: 'high', memory: 'medium', storage: 'medium', network: 'high' }
    },
    {
      id: 'serverless_platform',
      name: 'Serverless Platform',
      icon: Cloud,
      type: 'serverless_platform',
      category: NodeCategory.INFRASTRUCTURE,
      color: '#f0ffff',
      capabilities: ['function-as-a-service', 'auto-scaling', 'pay-per-use', 'event-driven'],
      description: 'Serverless computing platform for event-driven applications',
      cost: 'freemium',
      complexity: 'medium',
      reliability: 0.96,
      scalability: 'global',
      resourceRequirements: { cpu: 'medium', memory: 'low', storage: 'low', network: 'medium' }
    }
  ],

  // Security & Compliance
  [NodeCategory.SECURITY]: [
    {
      id: 'zero_trust_gateway',
      name: 'Zero Trust Gateway',
      icon: Shield,
      type: 'zero_trust_gateway',
      category: NodeCategory.SECURITY,
      color: '#f43f5e',
      capabilities: ['identity-verification', 'policy-enforcement', 'threat-detection', 'access-control'],
      description: 'Zero-trust security gateway that verifies every connection',
      cost: 'enterprise',
      complexity: 'high',
      reliability: 0.99,
      scalability: 'global',
      resourceRequirements: { cpu: 'medium', memory: 'medium', storage: 'medium', network: 'high' }
    },
    {
      id: 'threat_intelligence',
      name: 'Threat Intelligence',
      icon: Eye,
      type: 'threat_intelligence',
      category: NodeCategory.SECURITY,
      color: '#d946ef',
      capabilities: ['threat-detection', 'behavioral-analysis', 'anomaly-detection', 'incident-response'],
      description: 'AI-powered threat intelligence system for proactive security monitoring',
      cost: 'enterprise',
      complexity: 'extreme',
      reliability: 0.97,
      scalability: 'distributed',
      resourceRequirements: { cpu: 'high', memory: 'high', storage: 'high', network: 'high' }
    }
  ],

  // Business Logic & Analytics
  [NodeCategory.BUSINESS]: [
    {
      id: 'customer_journey_engine',
      name: 'Customer Journey Engine',
      icon: Users,
      type: 'customer_journey_engine',
      category: NodeCategory.BUSINESS,
      color: '#6a5acd',
      capabilities: ['journey-mapping', 'personalization', 'behavior-tracking', 'experience-optimization'],
      description: 'Advanced customer journey orchestration and optimization engine',
      cost: 'enterprise',
      complexity: 'high',
      reliability: 0.94,
      scalability: 'global',
      resourceRequirements: { cpu: 'medium', memory: 'high', storage: 'high', network: 'medium' }
    },
    {
      id: 'predictive_analytics',
      name: 'Predictive Analytics',
      icon: BarChart3,
      type: 'predictive_analytics',
      category: NodeCategory.BUSINESS,
      color: '#00bfff',
      capabilities: ['forecasting', 'trend-analysis', 'risk-prediction', 'decision-support'],
      description: 'AI-powered predictive analytics engine for business intelligence',
      cost: 'paid',
      complexity: 'high',
      reliability: 0.93,
      scalability: 'distributed',
      resourceRequirements: { cpu: 'high', memory: 'high', storage: 'high', network: 'medium' }
    }
  ],

  // Development & Operations
  [NodeCategory.DEVELOPMENT_OPS]: [
    {
      id: 'ci_cd_orchestrator',
      name: 'CI/CD Orchestrator',
      icon: Rocket,
      type: 'ci_cd_orchestrator',
      category: NodeCategory.DEVELOPMENT_OPS,
      color: '#ff69b4',
      capabilities: ['build-automation', 'testing-pipeline', 'deployment-automation', 'rollback-management'],
      description: 'Advanced CI/CD pipeline orchestrator with intelligent deployment strategies',
      cost: 'paid',
      complexity: 'high',
      reliability: 0.96,
      scalability: 'distributed',
      resourceRequirements: { cpu: 'medium', memory: 'medium', storage: 'medium', network: 'high' }
    },
    {
      id: 'code_quality_analyzer',
      name: 'Code Quality Analyzer',
      icon: TestTube,
      type: 'code_quality_analyzer',
      category: NodeCategory.DEVELOPMENT_OPS,
      color: '#ff9800',
      capabilities: ['static-analysis', 'security-scanning', 'performance-profiling', 'technical-debt-assessment'],
      description: 'Comprehensive code quality analysis and improvement recommendations',
      cost: 'freemium',
      complexity: 'medium',
      reliability: 0.95,
      scalability: 'cluster',
      resourceRequirements: { cpu: 'medium', memory: 'medium', storage: 'low', network: 'low' }
    }
  ],

  // Communication & Collaboration
  [NodeCategory.COMMUNICATION]: [
    {
      id: 'omnichannel_messenger',
      name: 'Omnichannel Messenger',
      icon: MessageSquare,
      type: 'omnichannel_messenger',
      category: NodeCategory.COMMUNICATION,
      color: '#ff69b4',
      capabilities: ['multi-platform', 'message-routing', 'conversation-history', 'ai-assistance'],
      description: 'Unified messaging platform that connects all communication channels',
      cost: 'paid',
      complexity: 'high',
      reliability: 0.97,
      scalability: 'global',
      resourceRequirements: { cpu: 'medium', memory: 'medium', storage: 'high', network: 'high' }
    },
    {
      id: 'smart_notification_hub',
      name: 'Smart Notification Hub',
      icon: Bell,
      type: 'smart_notification_hub',
      category: NodeCategory.COMMUNICATION,
      color: '#ffdab9',
      capabilities: ['intelligent-routing', 'preference-learning', 'delivery-optimization', 'analytics'],
      description: 'AI-powered notification system that learns user preferences and optimizes delivery',
      cost: 'freemium',
      complexity: 'medium',
      reliability: 0.96,
      scalability: 'distributed',
      resourceRequirements: { cpu: 'low', memory: 'medium', storage: 'medium', network: 'high' }
    }
  ],

  // Media Processing
  [NodeCategory.MEDIA]: [
    {
      id: 'ai_media_processor',
      name: 'AI Media Processor',
      icon: Video,
      type: 'ai_media_processor',
      category: NodeCategory.MEDIA,
      color: '#ef4444',
      capabilities: ['content-analysis', 'auto-editing', 'quality-enhancement', 'format-conversion'],
      description: 'AI-powered media processing pipeline for video, audio, and image content',
      cost: 'paid',
      complexity: 'high',
      reliability: 0.93,
      scalability: 'cluster',
      resourceRequirements: { cpu: 'high', memory: 'high', storage: 'high', network: 'medium' }
    }
  ],

  // Design & Creativity
  [NodeCategory.DESIGN]: [
    {
      id: 'design_system_manager',
      name: 'Design System Manager',
      icon: PenTool,
      type: 'design_system_manager',
      category: NodeCategory.DESIGN,
      color: '#18a0fb',
      capabilities: ['component-library', 'design-tokens', 'version-control', 'consistency-checking'],
      description: 'Centralized design system management with automatic consistency enforcement',
      cost: 'paid',
      complexity: 'medium',
      reliability: 0.97,
      scalability: 'distributed',
      resourceRequirements: { cpu: 'low', memory: 'medium', storage: 'medium', network: 'medium' }
    }
  ],

  // Collaboration
  [NodeCategory.COLLABORATION]: [
    {
      id: 'realtime_collaboration_engine',
      name: 'Real-time Collaboration Engine',
      icon: Users,
      type: 'realtime_collaboration_engine',
      category: NodeCategory.COLLABORATION,
      color: '#14b8a6',
      capabilities: ['operational-transform', 'conflict-resolution', 'presence-awareness', 'version-history'],
      description: 'Advanced real-time collaboration engine with conflict resolution',
      cost: 'enterprise',
      complexity: 'extreme',
      reliability: 0.98,
      scalability: 'global',
      resourceRequirements: { cpu: 'medium', memory: 'high', storage: 'medium', network: 'high' }
    }
  ],

  // Analytics
  [NodeCategory.ANALYTICS]: [
    {
      id: 'behavioral_analytics_engine',
      name: 'Behavioral Analytics Engine',
      icon: Eye,
      type: 'behavioral_analytics_engine',
      category: NodeCategory.ANALYTICS,
      color: '#ff9800',
      capabilities: ['user-tracking', 'pattern-recognition', 'predictive-modeling', 'cohort-analysis'],
      description: 'Advanced behavioral analytics with privacy-first tracking and insights',
      cost: 'paid',
      complexity: 'high',
      reliability: 0.94,
      scalability: 'distributed',
      resourceRequirements: { cpu: 'high', memory: 'high', storage: 'high', network: 'medium' }
    }
  ],

  // Integration
  [NodeCategory.INTEGRATION]: [
    {
      id: 'api_orchestration_hub',
      name: 'API Orchestration Hub',
      icon: Webhook,
      type: 'api_orchestration_hub',
      category: NodeCategory.INTEGRATION,
      color: '#ff1493',
      capabilities: ['api-composition', 'request-routing', 'data-transformation', 'error-handling'],
      description: 'Centralized API orchestration hub for managing complex integrations',
      cost: 'paid',
      complexity: 'high',
      reliability: 0.96,
      scalability: 'distributed',
      resourceRequirements: { cpu: 'medium', memory: 'medium', storage: 'low', network: 'high' }
    }
  ],

  // Blockchain
  [NodeCategory.BLOCKCHAIN]: [
    {
      id: 'smart_contract_engine',
      name: 'Smart Contract Engine',
      icon: Bitcoin,
      type: 'smart_contract_engine',
      category: NodeCategory.BLOCKCHAIN,
      color: '#f2a900',
      capabilities: ['contract-execution', 'gas-optimization', 'security-verification', 'cross-chain'],
      description: 'Advanced smart contract execution engine with cross-chain capabilities',
      cost: 'enterprise',
      complexity: 'extreme',
      reliability: 0.95,
      scalability: 'distributed',
      resourceRequirements: { cpu: 'high', memory: 'medium', storage: 'medium', network: 'high' }
    }
  ],

  // Supply Chain
  [NodeCategory.SUPPLY_CHAIN]: [
    {
      id: 'supply_chain_optimizer',
      name: 'Supply Chain Optimizer',
      icon: Truck,
      type: 'supply_chain_optimizer',
      category: NodeCategory.SUPPLY_CHAIN,
      color: '#8b4513',
      capabilities: ['route-optimization', 'inventory-management', 'demand-forecasting', 'supplier-coordination'],
      description: 'AI-powered supply chain optimization with real-time visibility',
      cost: 'enterprise',
      complexity: 'extreme',
      reliability: 0.96,
      scalability: 'global',
      resourceRequirements: { cpu: 'high', memory: 'high', storage: 'high', network: 'high' }
    }
  ],

  // No-Code/Low-Code
  [NodeCategory.NO_CODE]: [
    {
      id: 'visual_workflow_builder',
      name: 'Visual Workflow Builder',
      icon: AppWindow,
      type: 'visual_workflow_builder',
      category: NodeCategory.NO_CODE,
      color: '#0ea5e9',
      capabilities: ['drag-drop-interface', 'code-generation', 'integration-connectors', 'version-control'],
      description: 'No-code visual workflow builder with automatic code generation',
      cost: 'freemium',
      complexity: 'medium',
      reliability: 0.92,
      scalability: 'distributed',
      resourceRequirements: { cpu: 'medium', memory: 'medium', storage: 'medium', network: 'medium' }
    }
  ]
};

// Connection Library
export const connectionLibrary: Record<ConnectionType, OrchestrationConnection> = {
  [ConnectionType.DATA_FLOW]: {
    id: 'data_flow',
    name: 'Data Flow',
    type: ConnectionType.DATA_FLOW,
    color: '#3b82f6',
    bidirectional: false,
    description: 'Unidirectional data pipeline for structured data transfer',
    protocols: ['HTTP', 'gRPC', 'Apache Kafka'],
    latency: 'near-real-time',
    reliability: 0.98,
    security: 'encrypted'
  },
  [ConnectionType.EVENT_STREAM]: {
    id: 'event_stream',
    name: 'Event Stream',
    type: ConnectionType.EVENT_STREAM,
    color: '#10b981',
    bidirectional: false,
    description: 'High-throughput event streaming for real-time processing',
    protocols: ['Kafka', 'Pulsar', 'EventStore'],
    latency: 'real-time',
    reliability: 0.96,
    security: 'encrypted'
  },
  [ConnectionType.API_CALL]: {
    id: 'api_call',
    name: 'API Call',
    type: ConnectionType.API_CALL,
    color: '#f59e0b',
    bidirectional: true,
    description: 'RESTful or GraphQL API communication',
    protocols: ['REST', 'GraphQL', 'gRPC'],
    latency: 'near-real-time',
    reliability: 0.95,
    security: 'encrypted'
  },
  [ConnectionType.CONTROL_FLOW]: {
    id: 'control_flow',
    name: 'Control Flow',
    type: ConnectionType.CONTROL_FLOW,
    color: '#8b5cf6',
    bidirectional: false,
    description: 'Process orchestration and workflow control',
    protocols: ['BPMN', 'Temporal', 'Zeebe'],
    latency: 'async',
    reliability: 0.97,
    security: 'encrypted'
  },
  [ConnectionType.MESSAGE_QUEUE]: {
    id: 'message_queue',
    name: 'Message Queue',
    type: ConnectionType.MESSAGE_QUEUE,
    color: '#ef4444',
    bidirectional: false,
    description: 'Asynchronous message passing with guaranteed delivery',
    protocols: ['RabbitMQ', 'Amazon SQS', 'Redis Pub/Sub'],
    latency: 'async',
    reliability: 0.99,
    security: 'encrypted'
  },
  [ConnectionType.WEBHOOK]: {
    id: 'webhook',
    name: 'Webhook',
    type: ConnectionType.WEBHOOK,
    color: '#f97316',
    bidirectional: false,
    description: 'Event-driven HTTP callbacks for real-time notifications',
    protocols: ['HTTP POST', 'Webhook Standards'],
    latency: 'real-time',
    reliability: 0.92,
    security: 'basic'
  },
  [ConnectionType.DIRECT_LINK]: {
    id: 'direct_link',
    name: 'Direct Link',
    type: ConnectionType.DIRECT_LINK,
    color: '#06b6d4',
    bidirectional: true,
    description: 'High-performance direct connection for low-latency communication',
    protocols: ['TCP', 'WebSockets', 'gRPC Streaming'],
    latency: 'real-time',
    reliability: 0.97,
    security: 'encrypted'
  },
  [ConnectionType.FEEDBACK_LOOP]: {
    id: 'feedback_loop',
    name: 'Feedback Loop',
    type: ConnectionType.FEEDBACK_LOOP,
    color: '#84cc16',
    bidirectional: true,
    description: 'Bidirectional feedback for continuous improvement and learning',
    protocols: ['Custom', 'ML Feedback APIs'],
    latency: 'batch',
    reliability: 0.94,
    security: 'encrypted'
  },
  [ConnectionType.ORCHESTRATION]: {
    id: 'orchestration',
    name: 'Orchestration',
    type: ConnectionType.ORCHESTRATION,
    color: '#ec4899',
    bidirectional: true,
    description: 'High-level system orchestration and coordination',
    protocols: ['Kubernetes API', 'Workflow Engines'],
    latency: 'async',
    reliability: 0.96,
    security: 'zero-trust'
  },
  [ConnectionType.DEPENDENCY]: {
    id: 'dependency',
    name: 'Dependency',
    type: ConnectionType.DEPENDENCY,
    color: '#6b7280',
    bidirectional: false,
    description: 'Dependency relationship for proper execution order',
    protocols: ['Dependency Management'],
    latency: 'async',
    reliability: 0.99,
    security: 'basic'
  },
  [ConnectionType.REPLICATION]: {
    id: 'replication',
    name: 'Replication',
    type: ConnectionType.REPLICATION,
    color: '#a78bfa',
    bidirectional: false,
    description: 'Data replication for redundancy and performance',
    protocols: ['Database Replication', 'Event Sourcing'],
    latency: 'near-real-time',
    reliability: 0.98,
    security: 'encrypted'
  },
  [ConnectionType.LOAD_BALANCE]: {
    id: 'load_balance',
    name: 'Load Balance',
    type: ConnectionType.LOAD_BALANCE,
    color: '#14b8a6',
    bidirectional: false,
    description: 'Traffic distribution for optimal performance',
    protocols: ['HTTP Load Balancing', 'TCP Load Balancing'],
    latency: 'real-time',
    reliability: 0.97,
    security: 'encrypted'
  }
};

// Template Definitions
export interface OrchestrationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: 'low' | 'medium' | 'high' | 'extreme';
  icon: any;
  nodes: Array<{
    nodeId: string;
    position: { x: number; y: number };
    config?: Record<string, any>;
  }>;
  connections: Array<{
    sourceId: string;
    targetId: string;
    connectionType: ConnectionType;
  }>;
  estimatedCost: string;
  buildTime: string;
  useCase: string;
}

// Enhanced Template Library
export const templateLibrary: OrchestrationTemplate[] = [
  {
    id: 'ai_research_pipeline',
    name: 'AI Research Pipeline',
    description: 'Autonomous research system with multi-agent collaboration and knowledge synthesis',
    category: 'AI Systems',
    complexity: 'high',
    icon: Search,
    nodes: [
      { nodeId: 'research_agent', position: { x: 100, y: 100 } },
      { nodeId: 'memory_agent', position: { x: 300, y: 100 } },
      { nodeId: 'knowledge_graph', position: { x: 500, y: 100 } },
      { nodeId: 'vector_database', position: { x: 300, y: 300 } },
      { nodeId: 'predictive_analytics', position: { x: 500, y: 300 } }
    ],
    connections: [
      { sourceId: 'research_agent', targetId: 'memory_agent', connectionType: ConnectionType.DATA_FLOW },
      { sourceId: 'memory_agent', targetId: 'knowledge_graph', connectionType: ConnectionType.DATA_FLOW },
      { sourceId: 'knowledge_graph', targetId: 'vector_database', connectionType: ConnectionType.DATA_FLOW },
      { sourceId: 'vector_database', targetId: 'predictive_analytics', connectionType: ConnectionType.DATA_FLOW },
      { sourceId: 'predictive_analytics', targetId: 'research_agent', connectionType: ConnectionType.FEEDBACK_LOOP }
    ],
    estimatedCost: '$500-2000/month',
    buildTime: '2-4 weeks',
    useCase: 'Automated research and knowledge discovery for enterprises'
  },
  {
    id: 'enterprise_ai_platform',
    name: 'Enterprise AI Platform',
    description: 'Complete enterprise AI infrastructure with security, compliance, and scalability',
    category: 'Enterprise',
    complexity: 'extreme',
    icon: Building,
    nodes: [
      { nodeId: 'zero_trust_gateway', position: { x: 100, y: 100 } },
      { nodeId: 'llm_router', position: { x: 300, y: 100 } },
      { nodeId: 'model_training_farm', position: { x: 500, y: 100 } },
      { nodeId: 'kubernetes_cluster', position: { x: 300, y: 300 } },
      { nodeId: 'audit_agent', position: { x: 100, y: 300 } },
      { nodeId: 'behavioral_analytics_engine', position: { x: 500, y: 300 } }
    ],
    connections: [
      { sourceId: 'zero_trust_gateway', targetId: 'llm_router', connectionType: ConnectionType.API_CALL },
      { sourceId: 'llm_router', targetId: 'model_training_farm', connectionType: ConnectionType.ORCHESTRATION },
      { sourceId: 'kubernetes_cluster', targetId: 'llm_router', connectionType: ConnectionType.ORCHESTRATION },
      { sourceId: 'audit_agent', targetId: 'zero_trust_gateway', connectionType: ConnectionType.CONTROL_FLOW },
      { sourceId: 'behavioral_analytics_engine', targetId: 'audit_agent', connectionType: ConnectionType.DATA_FLOW }
    ],
    estimatedCost: '$10,000-50,000/month',
    buildTime: '3-6 months',
    useCase: 'Large-scale enterprise AI deployment with enterprise-grade security'
  },
  {
    id: 'realtime_collaboration_platform',
    name: 'Real-time Collaboration Platform',
    description: 'Multi-user real-time collaboration with conflict resolution and presence awareness',
    category: 'Collaboration',
    complexity: 'high',
    icon: Users,
    nodes: [
      { nodeId: 'realtime_collaboration_engine', position: { x: 300, y: 100 } },
      { nodeId: 'omnichannel_messenger', position: { x: 100, y: 200 } },
      { nodeId: 'design_system_manager', position: { x: 500, y: 200 } },
      { nodeId: 'edge_computing_network', position: { x: 300, y: 300 } }
    ],
    connections: [
      { sourceId: 'realtime_collaboration_engine', targetId: 'omnichannel_messenger', connectionType: ConnectionType.EVENT_STREAM },
      { sourceId: 'realtime_collaboration_engine', targetId: 'design_system_manager', connectionType: ConnectionType.DIRECT_LINK },
      { sourceId: 'edge_computing_network', targetId: 'realtime_collaboration_engine', connectionType: ConnectionType.LOAD_BALANCE }
    ],
    estimatedCost: '$2,000-8,000/month',
    buildTime: '4-8 weeks',
    useCase: 'High-performance collaborative editing and design tools'
  }
];

// Utility Functions
export const getNodesByCategory = (category: NodeCategory): OrchestrationNode[] => {
  return orchestrationLibrary[category] || [];
};

export const getAllNodes = (): OrchestrationNode[] => {
  return Object.values(orchestrationLibrary).flat();
};

export const getNodeById = (id: string): OrchestrationNode | undefined => {
  return getAllNodes().find(node => node.id === id);
};

export const getCompatibleNodes = (nodeId: string): OrchestrationNode[] => {
  const node = getNodeById(nodeId);
  if (!node || !node.compatibleWith) return [];
  
  return getAllNodes().filter(n => node.compatibleWith!.includes(n.type));
};

export const getConnectionsByType = (type: ConnectionType): OrchestrationConnection => {
  return connectionLibrary[type];
};

export const getCategoryColor = (category: NodeCategory): string => {
  const colors: Record<NodeCategory, string> = {
    [NodeCategory.AGENTS]: '#39ff8a',
    [NodeCategory.CONTROL]: '#b794f6',
    [NodeCategory.DATA]: '#87ceeb',
    [NodeCategory.AI_ML]: '#c084fc',
    [NodeCategory.MEDIA]: '#ef4444',
    [NodeCategory.COLLABORATION]: '#14b8a6',
    [NodeCategory.SECURITY]: '#f43f5e',
    [NodeCategory.INFRASTRUCTURE]: '#6495ed',
    [NodeCategory.BUSINESS]: '#6a5acd',
    [NodeCategory.BLOCKCHAIN]: '#f2a900',
    [NodeCategory.SUPPLY_CHAIN]: '#8b4513',
    [NodeCategory.NO_CODE]: '#0ea5e9',
    [NodeCategory.DEVELOPMENT_OPS]: '#ff9800',
    [NodeCategory.DESIGN]: '#18a0fb',
    [NodeCategory.COMMUNICATION]: '#ff69b4',
    [NodeCategory.ANALYTICS]: '#ff9800',
    [NodeCategory.INTEGRATION]: '#ff1493'
  };
  return colors[category] || '#6b7280';
};