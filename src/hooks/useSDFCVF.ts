// 🔗 CONNECT: SDF-CVF Hook → React Component Integration
// 🧩 INTENT: Provide React hook interface for SDF-CVF reasoning traces and validation
// ✅ SPEC: Real-time reasoning trace management with component state synchronization

import { useState, useEffect, useCallback } from 'react';
import { sdfCvfCore } from '@/lib/sdf-cvf-core';

interface ReasoningTrace {
  '@context': string;
  artifact: 'code' | 'doc' | 'blueprint' | 'reasoning' | 'memory' | 'action';
  tags: Array<{
    type: 'CONNECT' | 'INTENT' | 'SPEC' | 'VALIDATE' | 'TRACE';
    source?: string;
    target?: string;
    rationale?: string;
    contract?: string;
    confidence?: number;
  }>;
  trace: {
    reasoning: string;
    compliance: boolean;
    confidence_score: number;
    validation_results: ValidationResult[];
    graph_links: string[];
    timestamp: string;
    agent_id?: string;
    context_memory_ids?: string[];
  };
  metadata: {
    source_file?: string;
    line_numbers?: number[];
    related_artifacts?: string[];
    priority: number;
    ethical_review?: boolean;
  };
}

interface ValidationResult {
  rule: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  auto_fixable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface SDFCVFState {
  reasoningTraces: ReasoningTrace[];
  validationResults: ValidationResult[];
  contextStatus: {
    total_memories: number;
    active_connections: number;
    compliance_score: number;
    last_updated: string;
  };
  isValidating: boolean;
  error: string | null;
}

export const useSDFCVF = () => {
  const [state, setState] = useState<SDFCVFState>({
    reasoningTraces: [],
    validationResults: [],
    contextStatus: {
      total_memories: 0,
      active_connections: 0,
      compliance_score: 0,
      last_updated: new Date().toISOString()
    },
    isValidating: false,
    error: null
  });

  // Initialize SDF-CVF context
  useEffect(() => {
    initializeContext();
  }, []);

  const initializeContext = async () => {
    try {
      setState(prev => ({ ...prev, isValidating: true, error: null }));
      
      const context = await sdfCvfCore.retrieveCMCContext();
      
      setState(prev => ({
        ...prev,
        contextStatus: {
          total_memories: context.domain_indexes.reduce((sum, domain) => sum + domain.entries.length, 0),
          active_connections: context.connected_dependencies.length,
          compliance_score: 0.87, // Calculate from validation results
          last_updated: new Date().toISOString()
        },
        isValidating: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initialize SDF-CVF context',
        isValidating: false
      }));
    }
  };

  // Create reasoning trace with NL tags
  const createReasoningTrace = useCallback(async (
    intent: string,
    connections: string[],
    specifications: string[],
    artifact: string = 'reasoning'
  ): Promise<ReasoningTrace | null> => {
    try {
      setState(prev => ({ ...prev, isValidating: true, error: null }));
      
      const result = await sdfCvfCore.writeCodeWithNLTags(
        artifact,
        intent,
        connections,
        specifications
      );
      
      const newTrace = result.trace;
      
      setState(prev => ({
        ...prev,
        reasoningTraces: [newTrace, ...prev.reasoningTraces.slice(0, 49)], // Keep last 50
        isValidating: false
      }));
      
      return newTrace;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create reasoning trace',
        isValidating: false
      }));
      return null;
    }
  }, []);

  // Validate artifact with comprehensive checking
  const validateArtifact = useCallback(async (
    artifacts: string[]
  ): Promise<ValidationResult[]> => {
    try {
      setState(prev => ({ ...prev, isValidating: true, error: null }));
      
      const results = await sdfCvfCore.validateComprehensively(artifacts);
      
      setState(prev => ({
        ...prev,
        validationResults: results,
        contextStatus: {
          ...prev.contextStatus,
          compliance_score: calculateComplianceScore(results),
          last_updated: new Date().toISOString()
        },
        isValidating: false
      }));
      
      return results;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to validate artifacts',
        isValidating: false
      }));
      return [];
    }
  }, []);

  // Detect and validate connections
  const validateConnections = useCallback(async (
    artifact: string
  ): Promise<ValidationResult[]> => {
    try {
      setState(prev => ({ ...prev, isValidating: true, error: null }));
      
      const results = await sdfCvfCore.detectAndValidateConnections(artifact);
      
      setState(prev => ({
        ...prev,
        validationResults: [...prev.validationResults, ...results],
        contextStatus: {
          ...prev.contextStatus,
          active_connections: prev.contextStatus.active_connections + results.filter(r => r.status === 'pass').length,
          last_updated: new Date().toISOString()
        },
        isValidating: false
      }));
      
      return results;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to validate connections',
        isValidating: false
      }));
      return [];
    }
  }, []);

  // Update documentation atomically
  const updateDocumentationAtomically = useCallback(async (
    codeChanges: string[],
    docChanges: string[],
    tagUpdates: any[]
  ): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isValidating: true, error: null }));
      
      const success = await sdfCvfCore.updateDocumentationAtomically(
        codeChanges,
        docChanges,
        tagUpdates
      );
      
      if (success) {
        // Refresh context after successful update
        await initializeContext();
      }
      
      setState(prev => ({
        ...prev,
        isValidating: false,
        error: success ? null : 'Documentation update failed validation'
      }));
      
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update documentation',
        isValidating: false
      }));
      return false;
    }
  }, []);

  // Get recent reasoning traces
  const getRecentTraces = useCallback((limit: number = 10): ReasoningTrace[] => {
    return state.reasoningTraces.slice(0, limit);
  }, [state.reasoningTraces]);

  // Get validation summary
  const getValidationSummary = useCallback(() => {
    const results = state.validationResults;
    return {
      total: results.length,
      passed: results.filter(r => r.status === 'pass').length,
      failed: results.filter(r => r.status === 'fail').length,
      warnings: results.filter(r => r.status === 'warning').length,
      critical: results.filter(r => r.severity === 'critical').length,
      auto_fixable: results.filter(r => r.auto_fixable).length
    };
  }, [state.validationResults]);

  // Clear traces and validation results
  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      reasoningTraces: [],
      validationResults: [],
      error: null
    }));
  }, []);

  // Refresh context
  const refreshContext = useCallback(async () => {
    await initializeContext();
  }, []);

  return {
    // State
    reasoningTraces: state.reasoningTraces,
    validationResults: state.validationResults,
    contextStatus: state.contextStatus,
    isValidating: state.isValidating,
    error: state.error,
    
    // Actions
    createReasoningTrace,
    validateArtifact,
    validateConnections,
    updateDocumentationAtomically,
    
    // Utilities
    getRecentTraces,
    getValidationSummary,
    clearHistory,
    refreshContext,
    
    // Computed
    isReady: !state.isValidating && !state.error,
    complianceScore: state.contextStatus.compliance_score,
    hasActiveConnections: state.contextStatus.active_connections > 0
  };
};

// Helper function to calculate compliance score
function calculateComplianceScore(results: ValidationResult[]): number {
  if (results.length === 0) return 1.0;
  
  const passed = results.filter(r => r.status === 'pass').length;
  const total = results.length;
  
  // Weight critical failures more heavily
  const criticalFailures = results.filter(r => r.status === 'fail' && r.severity === 'critical').length;
  const penalty = criticalFailures * 0.2;
  
  return Math.max(0, (passed / total) - penalty);
}