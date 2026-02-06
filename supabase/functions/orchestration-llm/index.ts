import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { task_title, task_prompt, context, acceptance_criteria, stream } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an orchestration agent executing tasks within an autonomous pipeline.
You must produce high-quality, verifiable output that meets acceptance criteria.

Rules:
- Be precise and structured
- Include all required sections/fields specified in acceptance criteria
- If criteria mention JSON schema, output valid JSON
- If criteria mention word limits, respect them
- Always include a "## Summary" section at the end

Context provided:
${context || 'No additional context.'}

Acceptance criteria:
${acceptance_criteria?.map((c: any) => `- ${c.description} (${c.type})`).join('\n') || 'None specified.'}`;

    const requestBody = {
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Task: ${task_title}\n\n${task_prompt}` },
      ],
      temperature: 0.4,
      max_tokens: 2048,
      stream: !!stream,
    };

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limited. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Credits exhausted. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Streaming response
    if (stream && response.body) {
      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming response
    const data = await response.json();
    const content = data.choices[0].message.content;
    const usage = data.usage;

    return new Response(JSON.stringify({
      output: content,
      tokens_used: usage?.total_tokens || Math.ceil(content.split(/\s+/).length * 1.3),
      model: 'google/gemini-3-flash-preview',
      usage,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Orchestration LLM error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
