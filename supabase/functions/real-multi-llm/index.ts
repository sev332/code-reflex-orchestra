import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LLMRequest {
  provider: 'lovable' | 'anthropic';
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, model, messages, temperature, maxTokens }: LLMRequest = await req.json();

    console.log(`Multi-LLM routing: ${provider}/${model}`);

    let response;
    const startTime = Date.now();

    switch (provider) {
      case 'lovable': {
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        if (!LOVABLE_API_KEY) {
          throw new Error('LOVABLE_API_KEY not configured');
        }

        response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: temperature || 0.7,
            max_tokens: maxTokens || 2048,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Lovable AI error:', response.status, errorText);
          throw new Error(`Lovable AI error: ${response.status}`);
        }

        const data = await response.json();
        const latency = Date.now() - startTime;

        return new Response(JSON.stringify({
          content: data.choices[0].message.content,
          model,
          provider: 'lovable',
          usage: data.usage,
          latency
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'anthropic': {
        const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
        if (!ANTHROPIC_API_KEY) {
          throw new Error('ANTHROPIC_API_KEY not configured');
        }

        // Convert messages format for Anthropic
        const systemMessage = messages.find(m => m.role === 'system');
        const conversationMessages = messages.filter(m => m.role !== 'system');

        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            system: systemMessage?.content || '',
            messages: conversationMessages,
            temperature: temperature || 0.7,
            max_tokens: maxTokens || 2048,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Anthropic error:', response.status, errorText);
          throw new Error(`Anthropic error: ${response.status}`);
        }

        const data = await response.json();
        const latency = Date.now() - startTime;

        return new Response(JSON.stringify({
          content: data.content[0].text,
          model,
          provider: 'anthropic',
          usage: {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: data.usage.input_tokens + data.usage.output_tokens
          },
          latency
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

  } catch (error) {
    console.error('Multi-LLM error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
