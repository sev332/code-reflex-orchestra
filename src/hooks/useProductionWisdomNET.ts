import { useState, useEffect, useCallback } from 'react';
import { wisdomNETCore } from '@/lib/production-wisdomnet-core';
import { Agent, Task, SystemMetrics, MemoryEntry } from '@/types/production-types';

export function useProductionWisdomNET() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    active_agents: 0,
    pending_tasks: 0,
    completed_tasks_24h: 0,
    memory_entries: 0,
    system_load: 0,
    error_rate: 0,
    hil_interventions_pending: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const initialize = useCallback(async () => {
    if (isInitialized) return;
    
    setIsLoading(true);
    try {
      await wisdomNETCore.initialize();
      await refreshState();
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize WisdomNET:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  const refreshState = useCallback(async () => {
    try {
      const state = await wisdomNETCore.getCurrentState();
      setAgents(state.agents);
      setTasks(state.tasks);
      setMetrics(state.metrics);
    } catch (error) {
      console.error('Failed to refresh WisdomNET state:', error);
    }
  }, []);

  const createTask = useCallback(async (
    title: string,
    description: string,
    type: string,
    priority: number = 5
  ): Promise<string> => {
    const taskId = await wisdomNETCore.createTask(title, description, type, priority);
    await refreshState();
    return taskId;
  }, [refreshState]);

  const queryMemory = useCallback(async (query: string): Promise<MemoryEntry[]> => {
    return await wisdomNETCore.queryMemory(query);
  }, []);

  const storeMemory = useCallback(async (
    content: string,
    type: MemoryEntry['entry_type'],
    source: string,
    metadata?: Record<string, any>
  ): Promise<string> => {
    return await wisdomNETCore.storeMemory(content, type, source, metadata);
  }, []);

  const getSystemMetrics = useCallback(async (): Promise<SystemMetrics> => {
    return await wisdomNETCore.getSystemMetrics();
  }, []);

  // Auto-refresh state periodically
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(() => {
      refreshState();
    }, 5000);

    return () => clearInterval(interval);
  }, [isInitialized, refreshState]);

  return {
    // State
    isInitialized,
    isLoading,
    agents,
    tasks,
    metrics,
    
    // Actions
    initialize,
    refreshState,
    createTask,
    queryMemory,
    storeMemory,
    getSystemMetrics
  };
}