import { useState } from 'react';
import { aimosCore, AIMOSMemory, AIMOSThinkingMode } from '@/lib/ai-mos-core';
import { toast } from 'sonner';

/**
 * React Hook for AI-MOS (AI Memory Operating System)
 * Provides advanced thinking, memory management, and prompt chaining
 */
export const useAIMOS = () => {
  const [isThinking, setIsThinking] = useState(false);
  const [currentMode, setCurrentMode] = useState<AIMOSThinkingMode['mode']>('standard');
  const [memoryStats, setMemoryStats] = useState({
    totalMemories: 0,
    hierarchyLevels: 0,
    lastCompression: null as string | null
  });
  
  /**
   * Execute advanced thinking with AI-MOS
   */
  const think = async (
    prompt: string,
    options: {
      mode?: AIMOSThinkingMode['mode'];
      depth?: number;
      chainLength?: number;
    } = {}
  ) => {
    setIsThinking(true);
    setCurrentMode(options.mode || 'standard');
    
    try {
      const thinkingMode: AIMOSThinkingMode = {
        mode: options.mode || 'standard',
        depth: options.depth || 5,
        memoryIntegration: true,
        chainLength: options.chainLength || 3,
        parallelBranches: 1
      };
      
      toast.info(`🧠 AI-MOS ${thinkingMode.mode} mode activated...`, {
        description: `Depth: ${thinkingMode.depth}, Chain: ${thinkingMode.chainLength} steps`
      });
      
      const result = await aimosCore.executeThinkingMode(
        prompt,
        thinkingMode
      );
      
      toast.success('✅ AI-MOS reasoning complete!', {
        description: `Used ${result.memoriesUsed.length} memories, confidence: ${(result.confidence * 100).toFixed(0)}%`
      });
      
      return result;
    } catch (error: any) {
      console.error('AI-MOS thinking error:', error);
      toast.error('AI-MOS thinking failed', {
        description: error.message
      });
      return null;
    } finally {
      setIsThinking(false);
    }
  };
  
  /**
   * Store a new memory in AI-MOS
   */
  const storeMemory = async (
    content: string,
    options: {
      type?: AIMOSMemory['memoryType'];
      importance?: number;
      tags?: string[];
    } = {}
  ): Promise<string | null> => {
    try {
      const memoryId = await aimosCore.storeMemory({
        content,
        memoryType: options.type || 'episodic',
        importance: options.importance || 5,
        contextTags: options.tags || [],
        spatiotemporalContext: {
          timestamp: new Date().toISOString(),
          relatedMemories: [],
          hierarchyLevel: 1
        },
        compressionState: 'raw',
        accessPattern: {
          accessCount: 1,
          lastAccessed: new Date().toISOString(),
          decayRate: 0.1
        },
        validationStatus: 'unvalidated',
        metadata: {}
      });
      
      toast.success('Memory stored in AI-MOS');
      await updateMemoryStats();
      
      return memoryId;
    } catch (error: any) {
      console.error('Memory storage error:', error);
      toast.error('Failed to store memory');
      return null;
    }
  };
  
  /**
   * Retrieve memories from AI-MOS
   */
  const retrieveMemories = async (
    query: {
      tags?: string[];
      type?: AIMOSMemory['memoryType'];
      minImportance?: number;
      limit?: number;
    }
  ): Promise<AIMOSMemory[]> => {
    try {
      const memories = await aimosCore.retrieveMemories(query);
      return memories;
    } catch (error) {
      console.error('Memory retrieval error:', error);
      return [];
    }
  };
  
  /**
   * Compress memories (optimize storage)
   */
  const compressMemories = async () => {
    try {
      toast.info('🗜️ Compressing AI-MOS memories...');
      await aimosCore.compressMemories();
      await updateMemoryStats();
      toast.success('Memory compression complete!');
    } catch (error) {
      console.error('Memory compression error:', error);
      toast.error('Memory compression failed');
    }
  };
  
  /**
   * Build memory hierarchy
   */
  const buildHierarchy = async () => {
    try {
      const hierarchy = await aimosCore.buildMemoryHierarchy();
      toast.success('Memory hierarchy built!', {
        description: `L3: ${hierarchy.L3.length}, L2: ${hierarchy.L2.length}, L1: ${hierarchy.L1.length}`
      });
      return hierarchy;
    } catch (error) {
      console.error('Hierarchy building error:', error);
      toast.error('Failed to build hierarchy');
      return null;
    }
  };
  
  /**
   * Update memory statistics
   */
  const updateMemoryStats = async () => {
    try {
      const memories = await aimosCore.retrieveMemories({ limit: 1000 });
      const hierarchy = await aimosCore.buildMemoryHierarchy();
      
      setMemoryStats({
        totalMemories: memories.length,
        hierarchyLevels: Object.keys(hierarchy).length,
        lastCompression: new Date().toISOString()
      });
    } catch (error) {
      console.error('Stats update error:', error);
    }
  };
  
  return {
    isThinking,
    currentMode,
    memoryStats,
    think,
    storeMemory,
    retrieveMemories,
    compressMemories,
    buildHierarchy,
    updateMemoryStats
  };
};
