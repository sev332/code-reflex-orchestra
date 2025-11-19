import { useState, useCallback } from "react";
import { toast } from "sonner";

export interface StreamingStep {
  type: string;
  agent: string;
  status: "pending" | "working" | "completed" | "error";
  duration?: number;
  detail?: string;
  metrics?: {
    tokensUsed?: number;
    confidence?: number;
    coherenceScore?: number;
    informationDensity?: number;
    citationCount?: number;
  };
  output?: string;
  inputPrompt?: string;
  systemContext?: string;
  timestamp?: string;
}

export interface OrchestrationPlan {
  totalSteps: number;
  currentStep: number;
  complexity: string;
  memoryStrategy: string;
  timestamp?: string;
}

export interface AgentInfo {
  id: string;
  name: string;
  role: string;
  status: string;
  tasksCompleted: number;
}

export interface FinalResponse {
  answer: string;
  verification: {
    confidence: number;
    provenance_coverage: number;
    semantic_entropy: number;
    coherence_score?: number;
  };
  agents: AgentInfo[];
  trace_id: string;
  tokensUsed: number;
}

export const useStreamingReasoning = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [orchestrationPlan, setOrchestrationPlan] = useState<OrchestrationPlan | null>(null);
  const [thinkingSteps, setThinkingSteps] = useState<StreamingStep[]>([]);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [finalResponse, setFinalResponse] = useState<FinalResponse | null>(null);

  const startStreaming = useCallback(async (
    message: string,
    sessionId: string,
    userId: string,
    onStepUpdate?: (step: StreamingStep) => void,
    onComplete?: (response: FinalResponse) => void
  ) => {
    setIsStreaming(true);
    setOrchestrationPlan(null);
    setThinkingSteps([]);
    setAgents([]);
    setFinalResponse(null);

    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${SUPABASE_URL}/functions/v1/cmc-chat-stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ message, sessionId, userId }),
      });

      if (!response.ok) {
        throw new Error(`Stream failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No reader available");

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim() || line.startsWith(":")) continue;

          if (line.startsWith("event: ")) {
            continue; // Skip event type lines
          }

          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "orchestration_plan") {
                const plan: OrchestrationPlan = {
                  totalSteps: data.totalSteps,
                  currentStep: 0,
                  complexity: data.complexity,
                  memoryStrategy: data.memoryStrategy,
                  timestamp: data.timestamp,
                };
                setOrchestrationPlan(plan);
              } else if (data.type === "step_start") {
                const newStep: StreamingStep = {
                  type: data.node,
                  agent: data.agent,
                  status: "working",
                  inputPrompt: data.inputPrompt,
                  systemContext: data.systemContext,
                  timestamp: data.timestamp,
                  metrics: {
                    tokensUsed: 0,
                  },
                };
                setThinkingSteps(prev => [...prev, newStep]);
                setOrchestrationPlan(prev => prev ? { ...prev, currentStep: data.step } : null);
              } else if (data.type === "step_complete") {
                const completedStep: StreamingStep = {
                  type: data.type,
                  agent: data.agent.name,
                  status: "completed",
                  duration: data.duration,
                  detail: data.detail,
                  output: data.output,
                  metrics: data.metrics,
                  timestamp: data.timestamp,
                };

                setThinkingSteps(prev => {
                  const newSteps = [...prev];
                  const lastIdx = newSteps.length - 1;
                  if (lastIdx >= 0) {
                    newSteps[lastIdx] = { ...newSteps[lastIdx], ...completedStep };
                  }
                  return newSteps;
                });

                // Update agent info
                setAgents(prev => {
                  const existing = prev.find(a => a.id === data.agent.id);
                  if (existing) {
                    return prev.map(a => 
                      a.id === data.agent.id 
                        ? { ...a, tasksCompleted: data.agent.tasksCompleted, status: "active" }
                        : a
                    );
                  } else {
                    return [...prev, data.agent];
                  }
                });

                if (onStepUpdate) {
                  onStepUpdate(completedStep);
                }
              } else if (data.type === "final") {
                const final: FinalResponse = {
                  answer: data.answer,
                  verification: data.verification,
                  agents: data.agents,
                  trace_id: data.trace_id,
                  tokensUsed: data.tokensUsed,
                };
                setFinalResponse(final);
                setAgents(data.agents);
                
                if (onComplete) {
                  onComplete(final);
                }
              } else if (data.type === "error") {
                throw new Error(data.message);
              }
            } catch (e) {
              console.error("Parse error:", e);
            }
          }
        }
      }

      setIsStreaming(false);
    } catch (error) {
      console.error("Streaming error:", error);
      toast.error(error instanceof Error ? error.message : "Streaming failed");
      setIsStreaming(false);
      throw error;
    }
  }, []);

  return {
    startStreaming,
    isStreaming,
    orchestrationPlan,
    thinkingSteps,
    agents,
    finalResponse,
  };
};
