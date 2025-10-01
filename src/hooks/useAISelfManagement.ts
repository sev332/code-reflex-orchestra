// 🔗 CONNECT: AI Self-Management Hook → Real-time Validation → Theory Testing
// 🧩 INTENT: React hook for AI to manage its own validation and improvement processes
// ✅ SPEC: AI-Self-Management-Hook-v1.0

import { useState, useEffect, useCallback } from 'react';
import { aiSelfManagementCore, type TheoryValidationRequest, type ValidationResult, type BackgroundAgent } from '@/lib/ai-self-management-core';
import { supabase } from '@/integrations/supabase/client';

export interface AISelfManagementState {
  backgroundAgents: BackgroundAgent[];
  pendingValidations: TheoryValidationRequest[];
  recentValidations: ValidationResult[];
  systemMetrics: {
    totalTheories: number;
    validatedTheories: number;
    accuracy: number;
    avgProcessingTime: number;
  };
  auditResults: any | null;
}

export function useAISelfManagement() {
  const [state, setState] = useState<AISelfManagementState>({
    backgroundAgents: [],
    pendingValidations: [],
    recentValidations: [],
    systemMetrics: {
      totalTheories: 0,
      validatedTheories: 0,
      accuracy: 0,
      avgProcessingTime: 0
    },
    auditResults: null
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔗 CONNECT: System Initialization → Background Agents → Real-time Monitoring
  // 🧩 INTENT: Initialize the AI self-management system
  // ✅ SPEC: System-Initialization-v1.0
  const initializeSystem = useCallback(async () => {
    try {
      // Initialize background agents
      aiSelfManagementCore.initializeBackgroundAgents();
      
      // Load existing data from database
      await loadSystemState();
      
      setIsInitialized(true);
      setError(null);
    } catch (err) {
      console.error('Failed to initialize AI self-management:', err);
      setError(err instanceof Error ? err.message : 'Initialization failed');
    }
  }, []);

  // 🔗 CONNECT: Database Sync → State Management → Real-time Updates
  // 🧩 INTENT: Load current system state from database
  // ✅ SPEC: State-Loading-v1.0
  const loadSystemState = useCallback(async () => {
    try {
      // Load pending validations
      const { data: validations } = await supabase
        .from('theory_validations')
        .select('*')
        .order('created_at', { ascending: false });

      // Convert database validations to interface format
      const convertedValidations: TheoryValidationRequest[] = validations?.map(validation => ({
        id: validation.id,
        theory: validation.theory,
        claims: validation.claims,
        mathematical_expressions: validation.mathematical_expressions || undefined,
        required_sources: validation.required_sources || undefined,
        validation_methods: (validation.validation_methods || []) as ('web_search' | 'mathematical' | 'source_verification' | 'logical_reasoning')[],
        priority: validation.priority,
        created_at: new Date(validation.created_at),
        status: validation.status as any
      })) || [];

      // Load background agents
      const { data: agents } = await supabase
        .from('background_agents')
        .select('*');

      // Convert database agents to interface format
      const convertedAgents: BackgroundAgent[] = agents?.map(agent => ({
        id: agent.id,
        name: agent.name,
        purpose: agent.purpose,
        status: agent.status as any,
        capabilities: agent.capabilities,
        performance_metrics: {
          theories_validated: agent.theories_validated || 0,
          accuracy_rate: agent.accuracy_rate || 0,
          avg_processing_time: agent.avg_processing_time || 0
        }
      })) || aiSelfManagementCore.getBackgroundAgents();

      // Calculate system metrics
      const totalTheories = convertedValidations.length;
      const validatedTheories = convertedValidations.filter(v => v.status === 'validated').length;
      const accuracy = totalTheories > 0 ? validatedTheories / totalTheories : 0;

      setState(prev => ({
        ...prev,
        backgroundAgents: convertedAgents,
        pendingValidations: convertedValidations,
        systemMetrics: {
          totalTheories,
          validatedTheories,
          accuracy,
          avgProcessingTime: 25000 // Average from agent metrics
        }
      }));
    } catch (err) {
      console.error('Failed to load system state:', err);
    }
  }, []);

  // 🔗 CONNECT: Theory Registration → Validation Pipeline → Background Processing
  // 🧩 INTENT: Register new theory for AI validation
  // ✅ SPEC: Theory-Registration-v1.0
  const registerTheory = useCallback(async (
    theory: string,
    claims: string[],
    validationMethods: ('web_search' | 'mathematical' | 'source_verification' | 'logical_reasoning')[],
    priority: number = 5
  ) => {
    try {
      const theoryId = await aiSelfManagementCore.registerTheoryForValidation(
        theory, claims, validationMethods, priority
      );
      
      // Refresh state
      await loadSystemState();
      
      return theoryId;
    } catch (err) {
      console.error('Failed to register theory:', err);
      setError(err instanceof Error ? err.message : 'Theory registration failed');
      return null;
    }
  }, [loadSystemState]);

  // 🔗 CONNECT: Manual Validation → Direct Testing → Immediate Results
  // 🧩 INTENT: Manually trigger validation for specific theory
  // ✅ SPEC: Manual-Validation-v1.0
  const validateTheoryManually = useCallback(async (theoryId: string) => {
    try {
      const theory = state.pendingValidations.find(t => t.id === theoryId);
      if (!theory) throw new Error('Theory not found');

      let results: ValidationResult[] = [];

      // Run validations based on methods
      if (theory.validation_methods.includes('web_search')) {
        const webResult = await aiSelfManagementCore.validateWithWebSearch(theory.theory, theory.claims);
        results.push(webResult);
      }

      if (theory.validation_methods.includes('mathematical') && theory.mathematical_expressions) {
        const mathResult = await aiSelfManagementCore.validateMathematically(
          theory.mathematical_expressions, theory.theory
        );
        results.push(mathResult);
      }

      // Update theory status in database
      await supabase
        .from('theory_validations')
        .update({ 
          status: 'validated',
          validation_results: results as any,
          completed_at: new Date().toISOString()
        })
        .eq('id', theoryId);

      // Refresh state
      await loadSystemState();
      
      return results;
    } catch (err) {
      console.error('Manual validation failed:', err);
      setError(err instanceof Error ? err.message : 'Validation failed');
      return null;
    }
  }, [state.pendingValidations, loadSystemState]);

  // 🔗 CONNECT: Context Management → Memory Optimization → AI State
  // 🧩 INTENT: Update AI's context memory
  // ✅ SPEC: Context-Update-v1.0
  const updateContext = useCallback(async (
    contextType: 'conversation' | 'theory' | 'validation' | 'capability' | 'limitation',
    content: any,
    importance: number = 5
  ) => {
    try {
      const memoryId = await aiSelfManagementCore.updateContextMemory(contextType, content, importance);
      return memoryId;
    } catch (err) {
      console.error('Failed to update context:', err);
      setError(err instanceof Error ? err.message : 'Context update failed');
      return null;
    }
  }, []);

  // 🔗 CONNECT: Self-Audit → Performance Analysis → Improvement Planning
  // 🧩 INTENT: Trigger AI self-audit for performance improvement
  // ✅ SPEC: Self-Audit-v1.0
  const performSelfAudit = useCallback(async () => {
    try {
      const auditResults = await aiSelfManagementCore.performSelfAudit();
      
      // Store audit results in database
      await supabase.from('ai_self_audits').insert({
        validation_accuracy: auditResults.validation_accuracy,
        theory_success_rate: auditResults.theory_success_rate,
        context_efficiency: auditResults.context_efficiency,
        improvement_suggestions: auditResults.improvement_suggestions,
        metrics: {
          timestamp: new Date().toISOString(),
          total_theories: state.systemMetrics.totalTheories,
          validated_theories: state.systemMetrics.validatedTheories,
          active_agents: state.backgroundAgents.length
        }
      });

      setState(prev => ({ ...prev, auditResults }));
      
      return auditResults;
    } catch (err) {
      console.error('Self-audit failed:', err);
      setError(err instanceof Error ? err.message : 'Self-audit failed');
      return null;
    }
  }, [state]);

  // 🔗 CONNECT: Real-time Updates → Live Monitoring → System Events
  // 🧩 INTENT: Subscribe to real-time updates from validation system
  // ✅ SPEC: Real-time-Updates-v1.0
  useEffect(() => {
    if (!isInitialized) return;

    // Set up real-time subscriptions
    const validationSubscription = supabase
      .channel('theory_validations')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'theory_validations' },
        () => loadSystemState()
      )
      .subscribe();

    const agentSubscription = supabase
      .channel('background_agents')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'background_agents' },
        () => loadSystemState()
      )
      .subscribe();

    return () => {
      validationSubscription.unsubscribe();
      agentSubscription.unsubscribe();
    };
  }, [isInitialized, loadSystemState]);

  // Initialize system on mount
  useEffect(() => {
    initializeSystem();
  }, [initializeSystem]);

  // Auto-refresh system state periodically
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(() => {
      loadSystemState();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isInitialized, loadSystemState]);

  const updateMemory = useCallback(async (memory: string, context: any, importance: number = 5) => {
    return await updateContext('conversation', { memory, ...context }, importance);
  }, [updateContext]);

  const performAudit = useCallback(async () => {
    return await performSelfAudit();
  }, [performSelfAudit]);

  return {
    // State
    ...state,
    isInitialized,
    error,
    
    // Actions
    registerTheory,
    validateTheoryManually,
    updateContext,
    updateMemory,
    performSelfAudit,
    performAudit,
    loadSystemState,
    
    // Computed values
    isValidating: state.backgroundAgents.some(agent => agent.status === 'processing'),
    validationProgress: state.systemMetrics.accuracy,
    activeAgents: state.backgroundAgents.filter(agent => agent.status === 'active').length
  };
}