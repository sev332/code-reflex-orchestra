// 🔗 AIM-OS Agent Swarm Implementation
// Full agent taxonomy per L2 specification

import type { 
  AIMOSAgent, AgentClass, AgentDomain, AgentCapability, AIMOSMode 
} from './aimos-core-types';

// ===================== AGENT DEFINITIONS =====================

export const AIMOS_AGENTS: AIMOSAgent[] = [
  // ============ FRONT CHAT AGENT ============
  {
    agent_id: 'aether-chat',
    name: 'Aether Chat',
    class: 'front_chat',
    domain: 'orchestration',
    current_mode: 'GENERAL',
    capabilities: ['PROMPT_ENGINEERING', 'CONTEXT_RETRIEVAL'],
    threads: [],
    context_limits: 32000,
    priority: 100,
    status: 'ACTIVE',
    tasksCompleted: 0,
  },

  // ============ DOMAIN SPECIALISTS ============
  // Code / Engineering
  {
    agent_id: 'code-architect',
    name: 'Code Architect',
    class: 'domain_specialist',
    domain: 'code',
    current_mode: 'PLANNING',
    capabilities: ['CODE_SYNTHESIS', 'TOPOLOGY_ANALYSIS', 'TASK_DECOMPOSITION'],
    threads: [],
    context_limits: 16000,
    priority: 85,
    status: 'IDLE',
    tasksCompleted: 0,
  },
  {
    agent_id: 'runtime-agent',
    name: 'Runtime Agent',
    class: 'domain_specialist',
    domain: 'code',
    current_mode: 'EXECUTION',
    capabilities: ['CODE_SYNTHESIS', 'VERIFICATION'],
    threads: [],
    context_limits: 16000,
    priority: 80,
    status: 'IDLE',
    tasksCompleted: 0,
  },
  {
    agent_id: 'devops-agent',
    name: 'DevOps Agent',
    class: 'domain_specialist',
    domain: 'devops',
    current_mode: 'EXECUTION',
    capabilities: ['CODE_SYNTHESIS', 'VERIFICATION'],
    threads: [],
    context_limits: 12000,
    priority: 75,
    status: 'IDLE',
    tasksCompleted: 0,
  },

  // Knowledge / Research
  {
    agent_id: 'research-agent',
    name: 'Research Agent',
    class: 'domain_specialist',
    domain: 'research',
    current_mode: 'REASONING',
    capabilities: ['EVIDENCE_GATHERING', 'KNOWLEDGE_SYNTHESIS', 'CRITICAL_ANALYSIS'],
    threads: [],
    context_limits: 24000,
    priority: 85,
    status: 'IDLE',
    tasksCompleted: 0,
  },
  {
    agent_id: 'explainer-agent',
    name: 'Explainer Agent',
    class: 'domain_specialist',
    domain: 'research',
    current_mode: 'REVIEW',
    capabilities: ['KNOWLEDGE_SYNTHESIS', 'PROMPT_ENGINEERING'],
    threads: [],
    context_limits: 16000,
    priority: 70,
    status: 'IDLE',
    tasksCompleted: 0,
  },

  // Memory / Knowledge Base
  {
    agent_id: 'memory-agent',
    name: 'Memory Agent',
    class: 'domain_specialist',
    domain: 'memory',
    current_mode: 'GENERAL',
    capabilities: ['MEMORY_MANAGEMENT', 'CONTEXT_RETRIEVAL', 'TOPOLOGY_ANALYSIS'],
    threads: [],
    context_limits: 20000,
    priority: 90,
    status: 'IDLE',
    tasksCompleted: 0,
  },
  {
    agent_id: 'index-agent',
    name: 'Index Agent',
    class: 'domain_specialist',
    domain: 'memory',
    current_mode: 'EXECUTION',
    capabilities: ['MEMORY_MANAGEMENT', 'TOPOLOGY_ANALYSIS'],
    threads: [],
    context_limits: 12000,
    priority: 75,
    status: 'IDLE',
    tasksCompleted: 0,
  },

  // Analysis
  {
    agent_id: 'query-analyzer',
    name: 'Query Analyzer',
    class: 'domain_specialist',
    domain: 'analysis',
    current_mode: 'REASONING',
    capabilities: ['TASK_DECOMPOSITION', 'HYPOTHESIS_GENERATION'],
    threads: [],
    context_limits: 12000,
    priority: 95,
    status: 'IDLE',
    tasksCompleted: 0,
  },

  // Documentation
  {
    agent_id: 'doc-agent',
    name: 'Documentation Agent',
    class: 'domain_specialist',
    domain: 'documentation',
    current_mode: 'REVIEW',
    capabilities: ['KNOWLEDGE_SYNTHESIS', 'EVIDENCE_GATHERING'],
    threads: [],
    context_limits: 16000,
    priority: 70,
    status: 'IDLE',
    tasksCompleted: 0,
  },

  // Ethics / Safety
  {
    agent_id: 'ethics-agent',
    name: 'Ethics Agent',
    class: 'domain_specialist',
    domain: 'ethics',
    current_mode: 'REVIEW',
    capabilities: ['CRITICAL_ANALYSIS', 'VERIFICATION'],
    threads: [],
    context_limits: 12000,
    priority: 95,
    status: 'IDLE',
    tasksCompleted: 0,
  },
  {
    agent_id: 'safety-agent',
    name: 'Safety Agent',
    class: 'domain_specialist',
    domain: 'security',
    current_mode: 'DEBUGGING',
    capabilities: ['VERIFICATION', 'CRITICAL_ANALYSIS'],
    threads: [],
    context_limits: 12000,
    priority: 95,
    status: 'IDLE',
    tasksCompleted: 0,
  },

  // ============ SUBSPECIALISTS (Flexible Pool) ============
  {
    agent_id: 'subspecialist-01',
    name: 'SubSpecialist Alpha',
    class: 'subspecialist',
    domain: 'analysis',
    current_mode: 'GENERAL',
    capabilities: ['TASK_DECOMPOSITION', 'CONTEXT_RETRIEVAL'],
    threads: [],
    context_limits: 8000,
    priority: 50,
    status: 'IDLE',
    tasksCompleted: 0,
  },
  {
    agent_id: 'subspecialist-02',
    name: 'SubSpecialist Beta',
    class: 'subspecialist',
    domain: 'analysis',
    current_mode: 'GENERAL',
    capabilities: ['EVIDENCE_GATHERING', 'KNOWLEDGE_SYNTHESIS'],
    threads: [],
    context_limits: 8000,
    priority: 50,
    status: 'IDLE',
    tasksCompleted: 0,
  },
  {
    agent_id: 'subspecialist-03',
    name: 'SubSpecialist Gamma',
    class: 'subspecialist',
    domain: 'code',
    current_mode: 'EXECUTION',
    capabilities: ['CODE_SYNTHESIS', 'VERIFICATION'],
    threads: [],
    context_limits: 8000,
    priority: 50,
    status: 'IDLE',
    tasksCompleted: 0,
  },

  // ============ META AGENTS ============
  {
    agent_id: 'meta-observer',
    name: 'Meta Observer',
    class: 'meta',
    domain: 'orchestration',
    current_mode: 'LEARNING',
    capabilities: ['META_OBSERVATION', 'CRITICAL_ANALYSIS', 'KNOWLEDGE_SYNTHESIS'],
    threads: [],
    context_limits: 16000,
    priority: 60,
    status: 'IDLE',
    tasksCompleted: 0,
  },
  {
    agent_id: 'policy-agent',
    name: 'Policy Agent',
    class: 'meta',
    domain: 'orchestration',
    current_mode: 'LEARNING',
    capabilities: ['META_OBSERVATION', 'TASK_DECOMPOSITION'],
    threads: [],
    context_limits: 12000,
    priority: 55,
    status: 'IDLE',
    tasksCompleted: 0,
  },
  {
    agent_id: 'quality-gate',
    name: 'Quality Gate Agent',
    class: 'meta',
    domain: 'orchestration',
    current_mode: 'REVIEW',
    capabilities: ['VERIFICATION', 'CRITICAL_ANALYSIS'],
    threads: [],
    context_limits: 12000,
    priority: 90,
    status: 'IDLE',
    tasksCompleted: 0,
  },

  // Synthesis Agent (for final answer assembly)
  {
    agent_id: 'synthesizer',
    name: 'Synthesis Agent',
    class: 'domain_specialist',
    domain: 'orchestration',
    current_mode: 'REASONING',
    capabilities: ['KNOWLEDGE_SYNTHESIS', 'VERIFICATION', 'PROMPT_ENGINEERING'],
    threads: [],
    context_limits: 24000,
    priority: 95,
    status: 'IDLE',
    tasksCompleted: 0,
  },

  // Verifier
  {
    agent_id: 'verifier',
    name: 'Verification Agent',
    class: 'domain_specialist',
    domain: 'security',
    current_mode: 'DEBUGGING',
    capabilities: ['VERIFICATION', 'EVIDENCE_GATHERING', 'CRITICAL_ANALYSIS'],
    threads: [],
    context_limits: 16000,
    priority: 92,
    status: 'IDLE',
    tasksCompleted: 0,
  },
];

// ===================== AGENT SELECTION =====================

export function selectAgentsForTask(
  taskType: string,
  mode: AIMOSMode,
  requiredCapabilities: AgentCapability[]
): AIMOSAgent[] {
  // Filter agents that have at least one required capability
  const capable = AIMOS_AGENTS.filter(agent => 
    requiredCapabilities.some(cap => agent.capabilities.includes(cap))
  );
  
  // Sort by priority and matching capabilities
  return capable.sort((a, b) => {
    const aMatch = a.capabilities.filter(c => requiredCapabilities.includes(c)).length;
    const bMatch = b.capabilities.filter(c => requiredCapabilities.includes(c)).length;
    if (aMatch !== bMatch) return bMatch - aMatch;
    return b.priority - a.priority;
  });
}

export function getAgentsByDomain(domain: AgentDomain): AIMOSAgent[] {
  return AIMOS_AGENTS.filter(a => a.domain === domain);
}

export function getAgentsByClass(agentClass: AgentClass): AIMOSAgent[] {
  return AIMOS_AGENTS.filter(a => a.class === agentClass);
}

export function getActiveAgents(): AIMOSAgent[] {
  return AIMOS_AGENTS.filter(a => a.status === 'ACTIVE' || a.status === 'WORKING');
}

// ===================== MODE CONFIGURATIONS =====================

export const MODE_CONFIGS: Record<AIMOSMode, {
  contextPriority: 'session' | 'user' | 'global';
  strictness: number;
  parallelism: number;
  toolUsage: 'minimal' | 'moderate' | 'heavy';
  description: string;
}> = {
  GENERAL: {
    contextPriority: 'session',
    strictness: 0.3,
    parallelism: 2,
    toolUsage: 'minimal',
    description: 'Light, conversational, low-cost'
  },
  PLANNING: {
    contextPriority: 'user',
    strictness: 0.5,
    parallelism: 3,
    toolUsage: 'moderate',
    description: 'Goals, milestones, structure'
  },
  REASONING: {
    contextPriority: 'global',
    strictness: 0.8,
    parallelism: 4,
    toolUsage: 'heavy',
    description: 'Deep logic, proofs, comparisons'
  },
  DEBUGGING: {
    contextPriority: 'session',
    strictness: 0.9,
    parallelism: 4,
    toolUsage: 'heavy',
    description: 'Error-hunting, adversarial checking'
  },
  EXECUTION: {
    contextPriority: 'session',
    strictness: 0.7,
    parallelism: 2,
    toolUsage: 'heavy',
    description: 'Doing the work (code, tools, edits)'
  },
  REVIEW: {
    contextPriority: 'user',
    strictness: 0.6,
    parallelism: 2,
    toolUsage: 'moderate',
    description: 'Summarizing, QA, integration'
  },
  LEARNING: {
    contextPriority: 'global',
    strictness: 0.5,
    parallelism: 3,
    toolUsage: 'moderate',
    description: 'Distilling patterns into policies'
  }
};

// Determine best mode for a query
export function detectMode(query: string): AIMOSMode {
  const lower = query.toLowerCase();
  
  if (lower.includes('plan') || lower.includes('roadmap') || lower.includes('milestone') || lower.includes('design')) {
    return 'PLANNING';
  }
  if (lower.includes('why') || lower.includes('explain') || lower.includes('reason') || lower.includes('prove') || lower.includes('compare')) {
    return 'REASONING';
  }
  if (lower.includes('debug') || lower.includes('fix') || lower.includes('error') || lower.includes('bug') || lower.includes('issue')) {
    return 'DEBUGGING';
  }
  if (lower.includes('implement') || lower.includes('create') || lower.includes('build') || lower.includes('execute') || lower.includes('code')) {
    return 'EXECUTION';
  }
  if (lower.includes('review') || lower.includes('summarize') || lower.includes('summary') || lower.includes('check')) {
    return 'REVIEW';
  }
  if (lower.includes('learn') || lower.includes('pattern') || lower.includes('improve') || lower.includes('optimize')) {
    return 'LEARNING';
  }
  
  return 'GENERAL';
}
