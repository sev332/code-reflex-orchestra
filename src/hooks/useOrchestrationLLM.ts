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
      const output = `# ${task.title}\n\nSimulated output (LLM unavailable): ${task.prompt.slice(0, 200)}`;
      return {
        output,
        tokens_used: Math.ceil(output.split(/\s+/).length * 1.3),
        artifacts: [],
      };
    }
  }, []);

  const executeTaskStreaming = useCallback(async (
    task: OrchestrationTask,
    context: string,
    onChunk: (chunk: string, accumulated: string) => void
  ): Promise<{ output: string; tokens_used: number; artifacts?: Artifact[] }> => {
    try {
      const { data, error } = await supabase.functions.invoke('orchestration-llm', {
        body: {
          task_title: task.title,
          task_prompt: task.prompt,
          context,
          acceptance_criteria: task.acceptance_criteria,
          stream: true,
        },
      });

      if (error) throw error;

      // If we get a readable stream, process it
      if (data instanceof ReadableStream) {
        const reader = data.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6);
              if (jsonStr === '[DONE]') continue;
              try {
                const parsed = JSON.parse(jsonStr);
                const delta = parsed.choices?.[0]?.delta?.content || '';
                if (delta) {
                  accumulated += delta;
                  onChunk(delta, accumulated);
                }
              } catch { /* skip non-JSON lines */ }
            }
          }
        }

        return {
          output: accumulated,
          tokens_used: Math.ceil(accumulated.split(/\s+/).length * 1.3),
          artifacts: [],
        };
      }

      // Fallback: non-streaming response
      const output = typeof data === 'string' ? data : data.output || '';
      onChunk(output, output);
      return {
        output,
        tokens_used: data.tokens_used || Math.ceil(output.split(/\s+/).length * 1.3),
        artifacts: [],
      };
    } catch (err) {
      console.error('Streaming LLM failed, falling back to simulated:', err);
      const output = `# ${task.title}\n\nSimulated output (streaming unavailable): ${task.prompt.slice(0, 200)}`;
      onChunk(output, output);
      return {
        output,
        tokens_used: Math.ceil(output.split(/\s+/).length * 1.3),
        artifacts: [],
      };
    }
  }, []);

  return { executeTask, executeTaskStreaming };
}
