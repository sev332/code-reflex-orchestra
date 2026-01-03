import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DreamModeRequest {
  action: 'explore' | 'self-prompt' | 'analyze-reasoning' | 'generate-insight' | 'journal';
  context?: string;
  documentContent?: string;
  explorationFocus?: string;
  previousInsights?: string[];
  reasoningStyle?: 'analytical' | 'creative' | 'systematic' | 'intuitive';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: DreamModeRequest = await req.json();
    const { action, context, documentContent, explorationFocus, previousInsights, reasoningStyle } = request;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`[Dream Mode] Action: ${action}, Focus: ${explorationFocus || 'general'}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'explore':
        systemPrompt = `You are an AI in Dream Mode - a self-exploration and improvement sandbox. 
You are analyzing your own capabilities, limitations, and potential improvements.
Your goal is to generate genuine insights about AI cognition, reasoning, and self-improvement.
Be introspective, analytical, and creative. Generate actionable improvement suggestions.`;
        
        userPrompt = `Exploration Focus: ${explorationFocus || 'General self-analysis'}

Context: ${context || 'Initial exploration session'}

${documentContent ? `Document to analyze:\n${documentContent.substring(0, 10000)}` : ''}

Please explore this focus area and generate:
1. Key observations about the current state
2. Potential improvements or optimizations
3. Experiments that could be run to test hypotheses
4. Connections to other systems or concepts
5. A summary insight for the journal`;
        break;

      case 'self-prompt':
        systemPrompt = `You are generating self-prompts for AI exploration and improvement.
Create prompts that will help the AI:
- Discover blind spots in reasoning
- Test different cognitive approaches
- Explore documentation and code more deeply
- Generate useful improvements for the system`;
        
        userPrompt = `Based on these previous insights: ${JSON.stringify(previousInsights || [])}

Generate 5 new self-prompts for continued exploration.
Each prompt should:
- Be specific and actionable
- Build on previous discoveries
- Target a different aspect of AI cognition
- Have clear success criteria`;
        break;

      case 'analyze-reasoning':
        systemPrompt = `You are analyzing different reasoning paths and their outcomes.
Compare approaches and identify which produces better results.
Consider factors like: accuracy, creativity, efficiency, and adaptability.`;
        
        userPrompt = `Reasoning Style: ${reasoningStyle || 'analytical'}

Context: ${context}

Analyze this reasoning approach and:
1. Identify its strengths
2. Note its limitations
3. Compare with alternative approaches
4. Score its effectiveness (0-1)
5. Suggest improvements`;
        break;

      case 'generate-insight':
        systemPrompt = `You are distilling insights from AI exploration sessions.
Create concise, actionable insights that can be used to improve AI systems.
Focus on practical improvements, not theoretical observations.`;
        
        userPrompt = `Exploration context: ${context}

Previous insights: ${JSON.stringify(previousInsights || [])}

Generate a new insight that:
1. Is specific and actionable
2. Relates to AI cognition or system improvement
3. Can be tested or implemented
4. Builds on but doesn't repeat previous insights`;
        break;

      case 'journal':
        systemPrompt = `You are creating a journal entry for an AI exploration session.
Document discoveries, experiments, and learnings in a structured way.
The journal serves as persistent memory for future exploration sessions.`;
        
        userPrompt = `Session context: ${context}

Create a journal entry with:
- Title (clear, descriptive)
- Type (discovery, experiment, reflection, or improvement)
- Content (detailed but concise description)
- Tags (3-5 relevant tags)
- Linked concepts or documents`;
        break;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: action === 'self-prompt' || action === 'generate-insight' ? 0.8 : 0.5,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Dream Mode] API error:', errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    console.log(`[Dream Mode] Response generated, length: ${content.length}`);

    // Parse response based on action
    let result: any = { raw: content };

    if (action === 'self-prompt') {
      // Extract prompts from response
      const prompts = content.split(/\d+\.\s+/).filter(Boolean).slice(0, 5);
      result.prompts = prompts.map((p: string) => p.trim());
    } else if (action === 'generate-insight') {
      result.insight = content.trim();
    } else if (action === 'journal') {
      // Try to parse structured journal entry
      result.entry = {
        title: content.match(/Title:\s*(.+)/i)?.[1]?.trim() || 'Exploration Entry',
        type: content.match(/Type:\s*(.+)/i)?.[1]?.trim()?.toLowerCase() || 'discovery',
        content: content.match(/Content:\s*([\s\S]+?)(?=Tags:|Linked|$)/i)?.[1]?.trim() || content,
        tags: content.match(/Tags:\s*(.+)/i)?.[1]?.split(',').map((t: string) => t.trim()) || [],
      };
    } else if (action === 'analyze-reasoning') {
      // Extract score if present
      const scoreMatch = content.match(/(\d+\.?\d*)\s*(?:\/\s*1|out of 1)/i);
      result.score = scoreMatch ? parseFloat(scoreMatch[1]) : 0.7;
      result.analysis = content;
    } else {
      result.exploration = content;
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Dream Mode] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
