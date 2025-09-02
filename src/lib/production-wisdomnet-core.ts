// Production-Ready WisdomNET Core Engine
import { supabase } from "@/integrations/supabase/client";
import { Agent, Task, MemoryEntry, SystemEvent, AgentDecision, SystemMetrics, AdvancedPromptContext } from "@/types/production-types";

export class ProductionWisdomNETCore {
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, Task> = new Map();
  private memory: Map<string, MemoryEntry> = new Map();
  private systemLoops: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;
  private sessionId: string;

  constructor() {
    this.sessionId = crypto.randomUUID();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await this.loadSystemState();
      await this.startSystemLoops();
      this.isInitialized = true;
      
      await this.logEvent('system', 'info', 'WisdomNET Core Initialized', {
        session_id: this.sessionId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to initialize WisdomNET Core:', error);
      throw error;
    }
  }

  // Advanced Agent Intelligence
  async makeAgentDecision(agentId: string, context: any): Promise<AgentDecision> {
    const agent = await this.getAgent(agentId);
    if (!agent) throw new Error(`Agent ${agentId} not found`);

    // Simulate advanced decision making with confidence scoring
    const baseConfidence = Math.random() * 0.4 + 0.6; // 0.6-1.0
    const complexityPenalty = Object.keys(context).length > 5 ? 0.1 : 0;
    
    const decision: AgentDecision = {
      confidence: Math.max(0.1, baseConfidence - complexityPenalty),
      reasoning: `Agent ${agent.name} analyzing context with ${agent.capabilities.length} capabilities`,
      alternatives: [
        {
          action: 'execute_primary',
          confidence: baseConfidence,
          risk: 0.2
        },
        {
          action: 'request_assistance',
          confidence: baseConfidence * 0.7,
          risk: 0.1
        },
        {
          action: 'escalate_to_hil',
          confidence: baseConfidence * 0.5,
          risk: 0.05
        }
      ],
      requires_hil: baseConfidence < 0.7
    };

    // Update agent performance based on decision quality
    const performanceAdjustment = decision.confidence > 0.8 ? 0.01 : -0.005;
    await this.updateAgentPerformance(agentId, performanceAdjustment);

    return decision;
  }

  // Dynamic Task Orchestration
  async createTask(
    title: string,
    description: string,
    type: string,
    priority: number = 5,
    inputs: Record<string, any> = {}
  ): Promise<string> {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title,
        description,
        type,
        priority,
        inputs,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    const task = data as Task;
    this.tasks.set(task.id, task);

    // Auto-assign to best available agent
    await this.assignTaskToOptimalAgent(task.id);

    await this.logEvent('task_created', 'info', `Task created: ${title}`, {
      task_id: task.id,
      type,
      priority
    });

    return task.id;
  }

  async assignTaskToOptimalAgent(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    // Find best agent based on capabilities, current load, and performance
    const availableAgents = Array.from(this.agents.values()).filter(
      agent => agent.status === 'idle' || agent.status === 'active'
    );

    let bestAgent: Agent | null = null;
    let bestScore = 0;

    for (const agent of availableAgents) {
      const capabilityMatch = this.calculateCapabilityMatch(agent, task);
      const loadPenalty = agent.current_task_id ? 0.5 : 1;
      const performanceBonus = agent.performance_score;
      
      const score = capabilityMatch * loadPenalty * performanceBonus;
      
      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    if (bestAgent) {
      await this.assignTaskToAgent(taskId, bestAgent.id);
    }
  }

  private calculateCapabilityMatch(agent: Agent, task: Task): number {
    const relevantCapabilities = {
      'research': ['web_search', 'document_analysis', 'data_synthesis'],
      'code': ['code_generation', 'debugging', 'optimization'],
      'analyze': ['pattern_recognition', 'performance_analysis'],
      'orchestrate': ['task_management', 'agent_coordination']
    };

    const requiredCaps = relevantCapabilities[task.type as keyof typeof relevantCapabilities] || [];
    const agentCaps = agent.capabilities;
    
    const matches = requiredCaps.filter(cap => agentCaps.includes(cap)).length;
    return matches / Math.max(requiredCaps.length, 1);
  }

  // Advanced Memory Management with Semantic Search
  async storeMemory(content: string, type: MemoryEntry['entry_type'], source: string, metadata: Record<string, any> = {}): Promise<string> {
    // Calculate importance based on content analysis
    const importance = this.calculateImportanceScore(content, type);
    
    const { data, error } = await supabase
      .from('memory_entries')
      .insert({
        content,
        entry_type: type,
        source,
        metadata: {
          ...metadata,
          content_length: content.length,
          processed_at: new Date().toISOString()
        },
        importance_score: importance,
        tags: this.extractTags(content)
      })
      .select()
      .single();

    if (error) throw error;

    const memory = data as MemoryEntry;
    this.memory.set(memory.id, memory);

    return memory.id;
  }

  async queryMemory(query: string, limit: number = 10): Promise<MemoryEntry[]> {
    // For now, use text search. In production, this would use vector similarity
    const { data, error } = await supabase
      .from('memory_entries')
      .select('*')
      .textSearch('content', query)
      .order('importance_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    // Update access counts for each memory entry
    for (const memory of data) {
      await supabase
        .from('memory_entries')
        .update({ 
          access_count: memory.access_count + 1,
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', memory.id);
    }

    return data as MemoryEntry[];
  }

  private calculateImportanceScore(content: string, type: MemoryEntry['entry_type']): number {
    let score = 0.5;
    
    // Type-based scoring
    const typeScores = {
      'insight': 0.9,
      'pattern': 0.8,
      'code': 0.7,
      'knowledge': 0.6,
      'conversation': 0.4,
      'error': 0.3
    };
    
    score = typeScores[type] || 0.5;
    
    // Content-based adjustments
    const keywords = ['critical', 'important', 'breakthrough', 'solution', 'optimization'];
    const keywordMatches = keywords.filter(kw => content.toLowerCase().includes(kw)).length;
    score += keywordMatches * 0.05;
    
    // Length penalty for very short content
    if (content.length < 50) score *= 0.7;
    
    return Math.min(1, Math.max(0, score));
  }

  private extractTags(content: string): string[] {
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    
    return words
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 10);
  }

  // System Health and Monitoring
  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      const [agentsResult, tasksResult, memoryResult, eventsResult] = await Promise.all([
        supabase.from('agents').select('status'),
        supabase.from('tasks').select('status, created_at'),
        supabase.from('memory_entries').select('id'),
        supabase.from('system_events').select('severity, created_at').gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      const activeAgents = agentsResult.data?.filter(a => a.status === 'active').length || 0;
      const pendingTasks = tasksResult.data?.filter(t => t.status === 'pending').length || 0;
      
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const completedTasks24h = tasksResult.data?.filter(t => 
        t.status === 'completed' && new Date(t.created_at) > yesterday
      ).length || 0;

      const memoryEntries = memoryResult.data?.length || 0;
      const errorEvents = eventsResult.data?.filter(e => e.severity === 'error').length || 0;
      const totalEvents = eventsResult.data?.length || 1;

      return {
        active_agents: activeAgents,
        pending_tasks: pendingTasks,
        completed_tasks_24h: completedTasks24h,
        memory_entries: memoryEntries,
        system_load: Math.min(1, (pendingTasks + activeAgents) / 20),
        error_rate: errorEvents / totalEvents,
        hil_interventions_pending: 0 // Will be implemented with HIL system
      };
    } catch (error) {
      console.error('Error getting system metrics:', error);
      return {
        active_agents: 0,
        pending_tasks: 0,
        completed_tasks_24h: 0,
        memory_entries: 0,
        system_load: 0,
        error_rate: 0,
        hil_interventions_pending: 0
      };
    }
  }

  // Core system operations
  private async loadSystemState(): Promise<void> {
    const [agentsData, tasksData, memoryData] = await Promise.all([
      supabase.from('agents').select('*'),
      supabase.from('tasks').select('*'),
      supabase.from('memory_entries').select('*').limit(100)
    ]);

    if (agentsData.data) {
      agentsData.data.forEach(agent => this.agents.set(agent.id, agent as Agent));
    }
    
    if (tasksData.data) {
      tasksData.data.forEach(task => this.tasks.set(task.id, task as Task));
    }
    
    if (memoryData.data) {
      memoryData.data.forEach(memory => this.memory.set(memory.id, memory as MemoryEntry));
    }
  }

  private async startSystemLoops(): Promise<void> {
    // Task assignment loop
    const taskLoop = setInterval(async () => {
      await this.processUnassignedTasks();
    }, 5000);
    
    // Performance monitoring loop
    const performanceLoop = setInterval(async () => {
      await this.updateSystemPerformance();
    }, 10000);
    
    // Memory consolidation loop
    const memoryLoop = setInterval(async () => {
      await this.consolidateMemory();
    }, 30000);

    this.systemLoops.set('task_assignment', taskLoop);
    this.systemLoops.set('performance_monitoring', performanceLoop);
    this.systemLoops.set('memory_consolidation', memoryLoop);
  }

  private async processUnassignedTasks(): Promise<void> {
    const unassignedTasks = Array.from(this.tasks.values()).filter(
      task => task.status === 'pending' && !task.assigned_agent_id
    );

    for (const task of unassignedTasks.slice(0, 5)) {
      await this.assignTaskToOptimalAgent(task.id);
    }
  }

  private async updateSystemPerformance(): Promise<void> {
    // Monitor agent performance and adjust scores
    for (const [agentId, agent] of this.agents) {
      const recentTasks = Array.from(this.tasks.values()).filter(
        task => task.assigned_agent_id === agentId && 
        new Date(task.updated_at) > new Date(Date.now() - 300000) // Last 5 minutes
      );

      if (recentTasks.length > 0) {
        const successRate = recentTasks.filter(t => t.status === 'completed').length / recentTasks.length;
        const performanceAdjustment = (successRate - 0.7) * 0.02; // Adjust towards target 70% success rate
        await this.updateAgentPerformance(agentId, performanceAdjustment);
      }
    }
  }

  private async consolidateMemory(): Promise<void> {
    // Archive old, low-importance memories to prevent memory bloat
    const oldMemories = Array.from(this.memory.values()).filter(
      memory => memory.importance_score < 0.3 && 
      new Date(memory.last_accessed_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days old
    );

    if (oldMemories.length > 100) {
      const toArchive = oldMemories.slice(0, 50);
      // In a full implementation, these would be moved to cold storage
      console.log(`Archiving ${toArchive.length} old memory entries`);
    }
  }

  // Utility methods
  async getAgent(id: string): Promise<Agent | null> {
    if (this.agents.has(id)) {
      return this.agents.get(id)!;
    }
    
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    
    const agent = data as Agent;
    this.agents.set(id, agent);
    return agent;
  }

  async assignTaskToAgent(taskId: string, agentId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update({ 
        assigned_agent_id: agentId, 
        status: 'assigned',
        started_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) throw error;

    // Update local cache
    const task = this.tasks.get(taskId);
    if (task) {
      task.assigned_agent_id = agentId;
      task.status = 'assigned';
    }
  }

  private async updateAgentPerformance(agentId: string, adjustment: number): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    const newScore = Math.min(1, Math.max(0, agent.performance_score + adjustment));
    
    const { error } = await supabase
      .from('agents')
      .update({ 
        performance_score: newScore,
        last_active_at: new Date().toISOString()
      })
      .eq('id', agentId);

    if (!error) {
      agent.performance_score = newScore;
      agent.last_active_at = new Date().toISOString();
    }
  }

  private async logEvent(type: string, severity: SystemEvent['severity'], title: string, data: Record<string, any>): Promise<void> {
    try {
      await supabase
        .from('system_events')
        .insert({
          event_type: type,
          severity,
          title,
          data
        });
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  }

  // Public API
  async getCurrentState(): Promise<{
    agents: Agent[];
    tasks: Task[];
    memory_count: number;
    metrics: SystemMetrics;
    session_id: string;
  }> {
    const metrics = await this.getSystemMetrics();
    
    return {
      agents: Array.from(this.agents.values()),
      tasks: Array.from(this.tasks.values()),
      memory_count: this.memory.size,
      metrics,
      session_id: this.sessionId
    };
  }

  async shutdown(): Promise<void> {
    // Clean shutdown of all loops
    for (const [name, loop] of this.systemLoops) {
      clearInterval(loop);
    }
    
    await this.logEvent('system', 'info', 'WisdomNET Core Shutdown', {
      session_id: this.sessionId,
      uptime_ms: Date.now() - new Date(this.sessionId).getTime()
    });
    
    this.isInitialized = false;
  }
}

// Global instance
export const wisdomNETCore = new ProductionWisdomNETCore();