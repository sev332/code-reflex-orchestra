// 🔗 CONNECT: Gemini Background Agents → Deep Search → Real-time Analysis
// 🧩 INTENT: React hook for managing Gemini-powered background agents
// ✅ SPEC: Gemini-Agent-Hook-v1.0

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AgentTask {
  id: string;
  type: 'deep_search' | 'research' | 'analysis' | 'synthesis' | 'validation' | 'monitoring';
  query: string;
  context?: any;
  priority: number;
  parameters?: {
    search_depth?: number;
    sources?: string[];
    analysis_type?: string;
    check_interval?: number;
  };
}

export interface AgentResult {
  success: boolean;
  agent_id: string;
  task_type: string;
  results: any;
  reasoning_trace: any;
  sources?: string[];
  confidence: number;
  processing_time: number;
}

export interface AgentMetrics {
  total_tasks: number;
  completed_tasks: number;
  avg_processing_time: number;
  avg_confidence: number;
  active_agents: number;
}

export function useGeminiAgents() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [recentResults, setRecentResults] = useState<AgentResult[]>([]);
  const [metrics, setMetrics] = useState<AgentMetrics>({
    total_tasks: 0,
    completed_tasks: 0,
    avg_processing_time: 0,
    avg_confidence: 0,
    active_agents: 0
  });

  const executeAgentTask = useCallback(async (task: AgentTask): Promise<AgentResult | null> => {
    setIsProcessing(true);
    const agentId = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setActiveAgents(prev => [...prev, agentId]);

    try {
      console.log(`🚀 Launching Gemini agent for ${task.type}:`, task.query);

      const { data, error } = await supabase.functions.invoke('gemini-agents', {
        body: {
          action: 'execute_task',
          task
        }
      });

      if (error) {
        console.error('Agent execution error:', error);
        throw error;
      }

      const result = data as AgentResult;
      console.log(`✅ Agent completed task in ${result.processing_time}ms with ${result.confidence * 100}% confidence`);

      // Update metrics
      setMetrics(prev => ({
        total_tasks: prev.total_tasks + 1,
        completed_tasks: prev.completed_tasks + 1,
        avg_processing_time: (prev.avg_processing_time * prev.completed_tasks + result.processing_time) / (prev.completed_tasks + 1),
        avg_confidence: (prev.avg_confidence * prev.completed_tasks + result.confidence) / (prev.completed_tasks + 1),
        active_agents: activeAgents.length
      }));

      // Store result
      setRecentResults(prev => [result, ...prev].slice(0, 50));

      return result;

    } catch (error) {
      console.error('Failed to execute agent task:', error);
      return null;
    } finally {
      setActiveAgents(prev => prev.filter(id => id !== agentId));
      setIsProcessing(false);
    }
  }, [activeAgents.length]);

  const performDeepSearch = useCallback(async (
    query: string, 
    context?: any,
    searchDepth: number = 3
  ): Promise<AgentResult | null> => {
    const task: AgentTask = {
      id: `deep-search-${Date.now()}`,
      type: 'deep_search',
      query,
      context,
      priority: 8,
      parameters: { search_depth: searchDepth }
    };

    return executeAgentTask(task);
  }, [executeAgentTask]);

  const performResearch = useCallback(async (
    query: string,
    context?: any
  ): Promise<AgentResult | null> => {
    const task: AgentTask = {
      id: `research-${Date.now()}`,
      type: 'research',
      query,
      context,
      priority: 7
    };

    return executeAgentTask(task);
  }, [executeAgentTask]);

  const performAnalysis = useCallback(async (
    query: string,
    analysisType: string = 'comprehensive',
    context?: any
  ): Promise<AgentResult | null> => {
    const task: AgentTask = {
      id: `analysis-${Date.now()}`,
      type: 'analysis',
      query,
      context,
      priority: 7,
      parameters: { analysis_type: analysisType }
    };

    return executeAgentTask(task);
  }, [executeAgentTask]);

  const performSynthesis = useCallback(async (
    query: string,
    context?: any
  ): Promise<AgentResult | null> => {
    const task: AgentTask = {
      id: `synthesis-${Date.now()}`,
      type: 'synthesis',
      query,
      context,
      priority: 6
    };

    return executeAgentTask(task);
  }, [executeAgentTask]);

  const validateTheory = useCallback(async (
    theory: string,
    context?: any
  ): Promise<AgentResult | null> => {
    const task: AgentTask = {
      id: `validation-${Date.now()}`,
      type: 'validation',
      query: theory,
      context,
      priority: 9
    };

    return executeAgentTask(task);
  }, [executeAgentTask]);

  const startMonitoring = useCallback(async (
    topic: string,
    checkInterval: number = 3600000, // 1 hour default
    context?: any
  ): Promise<AgentResult | null> => {
    const task: AgentTask = {
      id: `monitoring-${Date.now()}`,
      type: 'monitoring',
      query: topic,
      context,
      priority: 5,
      parameters: { check_interval: checkInterval }
    };

    return executeAgentTask(task);
  }, [executeAgentTask]);

  const executeMultiAgentTask = useCallback(async (
    query: string,
    taskTypes: ('deep_search' | 'research' | 'analysis' | 'synthesis')[],
    context?: any
  ): Promise<AgentResult[]> => {
    console.log(`🌐 Launching multi-agent swarm for: ${query}`);
    
    const tasks = taskTypes.map(type => ({
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      query,
      context,
      priority: 7,
      parameters: {}
    }));

    const results = await Promise.all(
      tasks.map(task => executeAgentTask(task))
    );

    return results.filter((r): r is AgentResult => r !== null);
  }, [executeAgentTask]);

  return {
    // State
    isProcessing,
    activeAgents,
    recentResults,
    metrics,

    // Actions
    executeAgentTask,
    performDeepSearch,
    performResearch,
    performAnalysis,
    performSynthesis,
    validateTheory,
    startMonitoring,
    executeMultiAgentTask,

    // Computed
    hasActiveAgents: activeAgents.length > 0,
    totalAgents: activeAgents.length
  };
}
