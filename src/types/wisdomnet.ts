// WisdomNET Core Types and Interfaces

export interface WisdomManifest {
  id: string;
  name: string;
  version: string;
  created: string;
  purpose: string;
  ethics: string[];
  structure: ProjectStructure;
  memoryModel: MemoryModel;
  agents: AgentDefinition[];
}

export interface ProjectStructure {
  root: string;
  branches: Branch[];
  maxDepth: number;
  indexStrategy: 'breadth-first' | 'depth-first' | 'semantic';
}

export interface Branch {
  id: string;
  name: string;
  type: 'domain' | 'module' | 'component' | 'data' | 'agent';
  parent?: string;
  children: string[];
  metadata: NodeMetadata;
  path: string;
}

export interface NodeMetadata {
  description: string;
  author: string;
  created: string;
  lastModified: string;
  parentLinks: string[];
  childLinks: string[];
  auditState: 'clean' | 'modified' | 'needs-review' | 'deprecated';
  agentLastTouched: string;
  vectorEmbedding?: number[];
  tags: string[];
  importance: number; // 0-10 scale
}

export interface MemoryModel {
  shortTerm: MemoryLayer;
  longTerm: MemoryLayer;
  deepMemory: MemoryLayer;
  compressionStrategy: 'semantic' | 'frequency' | 'recency' | 'importance';
}

export interface MemoryLayer {
  maxItems: number;
  retentionDays: number;
  compressionThreshold: number;
  vectorDimensions: number;
  indexType: 'faiss' | 'hnswlib' | 'annoy' | 'pinecone';
}

export interface AgentDefinition {
  id: string;
  name: string;
  role: AgentRole;
  capabilities: string[];
  memoryAccess: MemoryAccessLevel;
  priority: number;
  status: AgentStatus;
  currentTask?: string;
  workingMemory: any[];
  lastActivity: string;
}

export type AgentRole = 
  | 'orchestrator' 
  | 'planner' 
  | 'engineer' 
  | 'memory-keeper' 
  | 'qa-verifier' 
  | 'ui-designer'
  | 'security-auditor'
  | 'performance-optimizer';

export type MemoryAccessLevel = 'read-only' | 'write-restricted' | 'full-access';

export type AgentStatus = 'idle' | 'thinking' | 'working' | 'collaborating' | 'error' | 'offline';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'build' | 'refactor' | 'analyze' | 'optimize' | 'test' | 'document';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in-progress' | 'review' | 'completed' | 'blocked';
  assignedAgent: string;
  dependencies: string[];
  subtasks: string[];
  estimated: number; // minutes
  actual?: number;
  created: string;
  deadline?: string;
  artifacts: string[]; // file paths or URLs
}

export interface Loop {
  id: string;
  type: 'build' | 'memory' | 'refactor';
  phases: LoopPhase[];
  currentPhase: number;
  status: 'active' | 'paused' | 'completed' | 'failed';
  iterations: number;
  maxIterations: number;
  metrics: LoopMetrics;
}

export interface LoopPhase {
  name: string;
  agent: string;
  input: any;
  output?: any;
  duration?: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface LoopMetrics {
  successRate: number;
  avgDuration: number;
  qualityScore: number;
  resourceUsage: number;
}

export interface RAGContext {
  query: string;
  retrievedDocs: RetrievedDocument[];
  contextWindow: number;
  relevanceThreshold: number;
  reranked: boolean;
}

export interface RetrievedDocument {
  id: string;
  content: string;
  source: string;
  score: number;
  metadata: Record<string, any>;
  embedding?: number[];
}

export interface Activity {
  id: string;
  timestamp: string;
  agent: string;
  action: string;
  target: string;
  details: Record<string, any>;
  success: boolean;
  duration: number;
  chainOfThought?: string[];
}