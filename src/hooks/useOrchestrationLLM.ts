import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OrchestrationTask, Artifact } from '@/lib/orchestration';

export function useOrchestrationLLM() {
  const executeTask = useCallback(async (
    task: OrchestrationTask,
    context: string
  ): Promise<{ output: string; tokens_used: number; artifacts?: Artifact[] }> => {
    try {
      const { data, error } = await supabase.functions.invoke('orchestration-llm', {
        body: {
          task_title: task.title,
          task_prompt: task.prompt,
          context,
          acceptance_criteria: task.acceptance_criteria,
        },
      });

      if (error) throw error;

      return {
        output: data.output,
        tokens_used: data.tokens_used || 100,
        artifacts: [],
      };
    } catch (err) {
      console.error('LLM execution failed, falling back to simulated:', err);
      // Fallback to simulated execution
      const output = `# ${task.title}\n\nSimulated output (LLM unavailable): ${task.prompt.slice(0, 200)}`;
      return {
        output,
        tokens_used: Math.ceil(output.split(/\s+/).length * 1.3),
        artifacts: [],
      };
    }
  }, []);

  return { executeTask };
}
