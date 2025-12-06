import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type {
  AIMOSAgent, AIMOSMode, DiscordMessage, DiscordThread,
  GoalNode
} from '@/lib/aimos-core-types';

export interface AIMOSOrchestrationPlan {
  totalSteps: number;
  currentStep: number;
  complexity: string;
  memoryStrategy: string;
  globalMode: AIMOSMode;
  goalDecomposition: GoalNode[];
  estimatedDuration: number;
}

export interface AIMOSStreamingStep {
  type: string;
  status: 'pending' | 'working' | 'completed' | 'error';
  agent: string;
  agentRole: string;
  mode: AIMOSMode;
  duration?: number;
  output?: string;
  detail?: string;
  inputPrompt?: string;
  metrics?: {
    tokensUsed?: number;
    confidence?: number;
    coherenceScore?: number;
    informationDensity?: number;
    citationCount?: number;
  };
  sources_consulted?: Array<{
    type: string;
    files?: string[];
    results?: number;
  }>;
  evidence?: {
    found: string[];
    gaps: string[];
    confidence_breakdown: Record<string, number>;
  };
  thread_id?: string;
}

export interface AIMOSFinalResponse {
  answer: string;
  verification: {
    confidence: number;
    provenance_coverage: number;
    semantic_entropy: number;
  };
  agents: AIMOSAgent[];
  trace_id: string;
  mode_used: AIMOSMode;
  goal_progress?: {
    completed: string[];
    in_progress: string[];
  };
}

export const useAIMOSStreaming = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [orchestrationPlan, setOrchestrationPlan] = useState<AIMOSOrchestrationPlan | null>(null);
  const [thinkingSteps, setThinkingSteps] = useState<AIMOSStreamingStep[]>([]);
  const [agents, setAgents] = useState<AIMOSAgent[]>([]);
  const [discordMessages, setDiscordMessages] = useState<DiscordMessage[]>([]);
  const [discordThreads, setDiscordThreads] = useState<DiscordThread[]>([]);
  const [finalResponse, setFinalResponse] = useState<AIMOSFinalResponse | null>(null);
  const [currentMode, setCurrentMode] = useState<AIMOSMode>('GENERAL');
  
  // Use refs to track latest values for return
  const finalResponseRef = useRef<AIMOSFinalResponse | null>(null);
  const agentsRef = useRef<AIMOSAgent[]>([]);
  const currentModeRef = useRef<AIMOSMode>('GENERAL');

  const startStreaming = useCallback(async (
    message: string,
    sessionId: string,
    userId?: string
  ): Promise<AIMOSFinalResponse | null> => {
    setIsStreaming(true);
    setOrchestrationPlan(null);
    setThinkingSteps([]);
    setAgents([]);
    setDiscordMessages([]);
    setDiscordThreads([]);
    setFinalResponse(null);
    finalResponseRef.current = null;
    agentsRef.current = [];
    currentModeRef.current = 'GENERAL';

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cmc-chat-stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ message, sessionId, userId }),
        }
      );

      if (!response.ok) {
        throw new Error(`Stream request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          
          try {
            const data = JSON.parse(line.slice(6));
            
            switch (data.type) {
              case 'orchestration_plan':
                setOrchestrationPlan({
                  totalSteps: data.totalSteps,
                  currentStep: 0,
                  complexity: data.complexity,
                  memoryStrategy: data.memoryStrategy,
                  globalMode: data.globalMode || 'REASONING',
                  goalDecomposition: data.goalDecomposition || [],
                  estimatedDuration: data.estimatedDuration || 0,
                });
                setCurrentMode(data.globalMode || 'REASONING');
                currentModeRef.current = data.globalMode || 'REASONING';
                if (data.agents) {
                  setAgents(data.agents);
                  agentsRef.current = data.agents;
                }
                if (data.threads) {
                  setDiscordThreads(data.threads);
                }
                break;

              case 'mode_change':
                setCurrentMode(data.mode);
                currentModeRef.current = data.mode;
                break;

              case 'agent_spawn':
                setAgents(prev => {
                  const existing = prev.find(a => a.agent_id === data.agent.agent_id);
                  let updated;
                  if (existing) {
                    updated = prev.map(a => 
                      a.agent_id === data.agent.agent_id ? { ...a, ...data.agent } : a
                    );
                  } else {
                    updated = [...prev, data.agent];
                  }
                  agentsRef.current = updated;
                  return updated;
                });
                break;

              case 'discord_message':
                setDiscordMessages(prev => [...prev, data.message]);
                break;

              case 'thread_created':
                setDiscordThreads(prev => [...prev, data.thread]);
                break;

              case 'step_start':
                setThinkingSteps(prev => [...prev, {
                  type: data.node,
                  status: 'working',
                  agent: data.agent,
                  agentRole: data.agentRole || data.agent_role || 'Worker',
                  mode: data.mode || currentModeRef.current,
                  inputPrompt: data.inputPrompt,
                  detail: data.detail || `Processing ${data.node}...`,
                  thread_id: data.thread_id,
                }]);
                setOrchestrationPlan(prev => prev ? {
                  ...prev,
                  currentStep: data.step
                } : null);
                
                // Update agent status
                setAgents(prev => {
                  const updated = prev.map(a => 
                    a.name === data.agent 
                      ? { ...a, status: 'WORKING' as const, currentTask: data.node }
                      : a
                  );
                  agentsRef.current = updated;
                  return updated;
                });
                break;

              case 'step_complete':
                setThinkingSteps(prev => prev.map((step, idx) =>
                  idx === prev.length - 1 ? {
                    ...step,
                    status: data.status === 'error' ? 'error' : 'completed',
                    duration: data.duration,
                    output: data.output || data.detail,
                    detail: data.detail || data.output || step.detail,
                    metrics: data.metrics,
                    sources_consulted: data.sources_consulted,
                    evidence: data.evidence,
                  } : step
                ));
                
                // Update agent status
                setAgents(prev => {
                  const updated = prev.map(a => 
                    a.name === (data.agent?.name || data.agent)
                      ? { 
                          ...a, 
                          status: 'ACTIVE' as const, 
                          tasksCompleted: (a.tasksCompleted || 0) + 1,
                          currentTask: undefined
                        }
                      : a
                  );
                  agentsRef.current = updated;
                  return updated;
                });
                break;

              case 'final':
                const final: AIMOSFinalResponse = {
                  answer: data.answer || data.content || '',
                  verification: data.verification || {
                    confidence: data.confidence || 0.7,
                    provenance_coverage: data.provenance_coverage || 0.8,
                    semantic_entropy: data.semantic_entropy || 0.1,
                  },
                  agents: data.agents || agentsRef.current,
                  trace_id: data.trace_id || crypto.randomUUID(),
                  mode_used: data.mode_used || currentModeRef.current,
                  goal_progress: data.goal_progress,
                };
                setFinalResponse(final);
                finalResponseRef.current = final;
                
                // Show confidence toast
                const conf = final.verification.confidence * 100;
                if (conf >= 80) {
                  toast.success(`High confidence response (${conf.toFixed(0)}%)`);
                } else if (conf >= 60) {
                  toast.info(`Moderate confidence (${conf.toFixed(0)}%)`);
                } else {
                  toast.warning(`Low confidence (${conf.toFixed(0)}%)`);
                }
                break;

              case 'error':
                toast.error(data.message || 'Streaming error occurred');
                break;
            }
          } catch (e) {
            console.warn('Failed to parse SSE data:', line, e);
          }
        }
      }

      // Return the final response from ref (has latest value)
      return finalResponseRef.current;
    } catch (error) {
      console.error('AIMOS streaming error:', error);
      toast.error(error instanceof Error ? error.message : 'Streaming failed');
      return null;
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsStreaming(false);
    setOrchestrationPlan(null);
    setThinkingSteps([]);
    setAgents([]);
    setDiscordMessages([]);
    setDiscordThreads([]);
    setFinalResponse(null);
    setCurrentMode('GENERAL');
    finalResponseRef.current = null;
    agentsRef.current = [];
    currentModeRef.current = 'GENERAL';
  }, []);

  return {
    startStreaming,
    reset,
    isStreaming,
    orchestrationPlan,
    thinkingSteps,
    agents,
    discordMessages,
    discordThreads,
    finalResponse,
    currentMode,
  };
};
