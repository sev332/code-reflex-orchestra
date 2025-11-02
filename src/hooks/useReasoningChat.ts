import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ReasoningStep {
  node: string;
  name: string;
  output: string;
  tokens: number;
  timestamp: string;
}

export interface ReasoningVerification {
  confidence: number;
  provenance_coverage: number;
  semantic_entropy: number;
}

export interface ReasoningResponse {
  answer: string;
  reasoning: ReasoningStep[];
  verification: ReasoningVerification;
  trace_id: string;
}

export const useReasoningChat = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentReasoning, setCurrentReasoning] = useState<ReasoningStep[]>([]);

  const sendMessage = async (
    message: string,
    sessionId: string,
    userId?: string
  ): Promise<ReasoningResponse | null> => {
    setIsProcessing(true);
    setCurrentReasoning([]);

    try {
      const { data, error } = await supabase.functions.invoke("cmc-chat", {
        body: {
          message,
          sessionId,
          userId: userId || "anonymous",
        },
      });

      if (error) throw error;

      const response = data as ReasoningResponse;
      setCurrentReasoning(response.reasoning);

      // Show confidence toast
      const confPercent = Math.round(response.verification.confidence * 100);
      if (confPercent >= 80) {
        toast.success(`High confidence response (${confPercent}%)`);
      } else if (confPercent >= 60) {
        toast.info(`Moderate confidence (${confPercent}%)`);
      } else {
        toast.warning(`Low confidence (${confPercent}%) - reasoning may be uncertain`);
      }

      return response;
    } catch (error) {
      console.error("Reasoning chat error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process message");
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    sendMessage,
    isProcessing,
    currentReasoning,
  };
};
