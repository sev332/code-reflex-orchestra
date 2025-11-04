import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChainNode } from '@/components/Orchestration/PromptChainDesigner';
import { Edge } from '@xyflow/react';

export interface SavedChain {
  id: string;
  name: string;
  description: string;
  nodes: ChainNode[];
  edges: Edge[];
  createdAt: string;
  executionCount: number;
}

export const useOrchestrationMemory = () => {
  const [savedChains, setSavedChains] = useState<SavedChain[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const saveChain = useCallback(async (
    name: string,
    description: string,
    nodes: ChainNode[],
    edges: Edge[]
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('orchestration-memory', {
        body: {
          action: 'save',
          name,
          description,
          nodes,
          edges
        }
      });

      if (error) throw error;

      toast.success('Chain saved to memory');
      await loadChains();
      return true;
    } catch (error) {
      console.error('Save chain error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save chain');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadChains = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('orchestration-memory', {
        body: { action: 'list' }
      });

      if (error) throw error;

      setSavedChains(data.chains || []);
      return data.chains || [];
    } catch (error) {
      console.error('Load chains error:', error);
      toast.error('Failed to load saved chains');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadChain = useCallback(async (id: string): Promise<SavedChain | null> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('orchestration-memory', {
        body: { action: 'load', chainId: id }
      });

      if (error) throw error;

      toast.success('Chain loaded');
      return data.chain;
    } catch (error) {
      console.error('Load chain error:', error);
      toast.error('Failed to load chain');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteChain = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('orchestration-memory', {
        body: { action: 'delete', chainId: id }
      });

      if (error) throw error;

      toast.success('Chain deleted');
      await loadChains();
      return true;
    } catch (error) {
      console.error('Delete chain error:', error);
      toast.error('Failed to delete chain');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadChains]);

  const incrementExecutionCount = useCallback(async (id: string) => {
    try {
      await supabase.functions.invoke('orchestration-memory', {
        body: { action: 'increment', chainId: id }
      });
    } catch (error) {
      console.error('Increment execution error:', error);
    }
  }, []);

  return {
    savedChains,
    isLoading,
    saveChain,
    loadChains,
    loadChain,
    deleteChain,
    incrementExecutionCount
  };
};
