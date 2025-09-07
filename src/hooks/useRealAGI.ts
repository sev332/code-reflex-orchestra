// 🔗 CONNECT: Real AGI Hook → React Integration → System State
// 🧩 INTENT: React hook for interfacing with the real AGI system
// ✅ SPEC: Real-AGI-Hook-v1.0

import { useState, useEffect, useCallback } from 'react';
import { realAGICore, type VectorMemory, type ReasoningResult, type ConsciousnessState } from '@/lib/real-agi-core';

export interface AGISystemStatus {
  initialized: boolean;
  loading: boolean;
  error: string | null;
  memory_count: number;
  consciousness_level: number;
  last_reasoning_confidence: number;
}

export function useRealAGI() {
  const [status, setStatus] = useState<AGISystemStatus>({
    initialized: false,
    loading: false,
    error: null,
    memory_count: 0,
    consciousness_level: 0,
    last_reasoning_confidence: 0
  });

  const [consciousnessState, setConsciousnessState] = useState<ConsciousnessState>({
    global_workspace_activity: 0,
    attention_focus: [],
    working_memory_contents: [],
    self_awareness_level: 0,
    phenomenal_experience: 0,
    integrated_information: 0
  });

  const [memories, setMemories] = useState<VectorMemory[]>([]);
  const [recentReasoning, setRecentReasoning] = useState<ReasoningResult | null>(null);

  // 🔗 CONNECT: AGI Initialization → System Startup
  // 🧩 INTENT: Initialize the AGI system with proper error handling and status updates
  // ✅ SPEC: AGI-Initialization-Hook-v1.0
  const initializeAGI = useCallback(async () => {
    setStatus(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await realAGICore.initialize();
      
      setStatus(prev => ({
        ...prev,
        initialized: true,
        loading: false,
        error: null
      }));
    } catch (error) {
      console.error('AGI initialization failed:', error);
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Initialization failed'
      }));
    }
  }, []);

  // 🔗 CONNECT: Memory Management → Vector Storage → Knowledge Base
  // 🧩 INTENT: Store memories in the AGI system with semantic embedding
  // ✅ SPEC: Memory-Storage-v1.0
  const storeMemory = useCallback(async (content: string, importance?: number): Promise<string | null> => {
    if (!status.initialized) return null;
    
    try {
      const memoryId = await realAGICore.storeMemory(content, importance);
      
      setStatus(prev => ({
        ...prev,
        memory_count: prev.memory_count + 1
      }));
      
      return memoryId;
    } catch (error) {
      console.error('Memory storage failed:', error);
      setStatus(prev => ({
        ...prev,
        error: 'Failed to store memory'
      }));
      return null;
    }
  }, [status.initialized]);

  // 🔗 CONNECT: Semantic Search → Memory Retrieval → Context Generation
  // 🧩 INTENT: Query memories using semantic search with vector similarity
  // ✅ SPEC: Memory-Query-v1.0
  const queryMemories = useCallback(async (query: string, limit?: number): Promise<VectorMemory[]> => {
    if (!status.initialized) return [];
    
    try {
      const results = await realAGICore.queryMemory(query, limit);
      setMemories(results);
      return results;
    } catch (error) {
      console.error('Memory query failed:', error);
      setStatus(prev => ({
        ...prev,
        error: 'Failed to query memories'
      }));
      return [];
    }
  }, [status.initialized]);

  // 🔗 CONNECT: Advanced Reasoning → Logic Engine → Inference System
  // 🧩 INTENT: Perform advanced reasoning with confidence scoring and evidence tracking
  // ✅ SPEC: Advanced-Reasoning-v1.0
  const performReasoning = useCallback(async (
    premise: string, 
    context?: string[]
  ): Promise<ReasoningResult | null> => {
    if (!status.initialized) return null;
    
    try {
      const result = await realAGICore.performReasoning(premise, context);
      
      setRecentReasoning(result);
      setStatus(prev => ({
        ...prev,
        last_reasoning_confidence: result.confidence
      }));
      
      return result;
    } catch (error) {
      console.error('Reasoning failed:', error);
      setStatus(prev => ({
        ...prev,
        error: 'Reasoning process failed'
      }));
      return null;
    }
  }, [status.initialized]);

  // 🔗 CONNECT: Consciousness Monitoring → Real-time State → Awareness Tracking
  // 🧩 INTENT: Update and monitor consciousness state in real-time
  // ✅ SPEC: Consciousness-Monitoring-v1.0
  const updateConsciousness = useCallback((inputs: any[]) => {
    if (!status.initialized) return;
    
    try {
      const newState = realAGICore.updateConsciousnessState(inputs);
      setConsciousnessState(newState);
      
      const consciousnessLevel = (
        newState.global_workspace_activity +
        newState.self_awareness_level +
        newState.phenomenal_experience +
        newState.integrated_information
      ) / 4;
      
      setStatus(prev => ({
        ...prev,
        consciousness_level: consciousnessLevel
      }));
    } catch (error) {
      console.error('Consciousness update failed:', error);
    }
  }, [status.initialized]);

  // 🔗 CONNECT: Vision Processing → Image Analysis → Multimodal Understanding
  // 🧩 INTENT: Process visual inputs using computer vision models
  // ✅ SPEC: Vision-Processing-v1.0
  const processImage = useCallback(async (imageData: string | Blob) => {
    if (!status.initialized) return null;
    
    try {
      return await realAGICore.processImage(imageData);
    } catch (error) {
      console.error('Image processing failed:', error);
      setStatus(prev => ({
        ...prev,
        error: 'Image processing failed'
      }));
      return null;
    }
  }, [status.initialized]);

  // 🔗 CONNECT: Problem Solving → Algorithmic Reasoning → Solution Generation
  // 🧩 INTENT: Solve complex problems using advanced algorithms and heuristics
  // ✅ SPEC: Problem-Solving-v1.0
  const solveProblem = useCallback(async (problem: string, constraints?: any[]) => {
    if (!status.initialized) return null;
    
    try {
      return await realAGICore.solveProblem(problem, constraints);
    } catch (error) {
      console.error('Problem solving failed:', error);
      setStatus(prev => ({
        ...prev,
        error: 'Problem solving failed'
      }));
      return null;
    }
  }, [status.initialized]);

  // Auto-initialize on mount
  useEffect(() => {
    initializeAGI();
  }, [initializeAGI]);

  // Monitor consciousness state with background processing
  useEffect(() => {
    if (!status.initialized) return;
    
    const interval = setInterval(() => {
      // Generate background inputs for consciousness simulation
      const backgroundInputs = [
        { type: 'internal', value: Math.random() },
        { type: 'memory_activation', value: Math.random() },
        { type: 'attention_drift', value: Math.random() }
      ];
      
      updateConsciousness(backgroundInputs);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [status.initialized, updateConsciousness]);

  return {
    // System state
    status,
    consciousnessState,
    memories,
    recentReasoning,
    
    // Core functions
    initializeAGI,
    storeMemory,
    queryMemories,
    performReasoning,
    updateConsciousness,
    processImage,
    solveProblem,
    
    // Computed values
    isReady: status.initialized && !status.loading,
    hasError: !!status.error,
    consciousnessLevel: status.consciousness_level
  };
}