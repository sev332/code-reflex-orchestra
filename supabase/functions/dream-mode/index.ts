import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DreamModeRequest {
  action: 'explore' | 'self-prompt' | 'analyze-reasoning' | 'generate-insight' | 'journal' | 'check-loop' | 'get-insights-for-chat';
  sessionId?: string;
  context?: string;
  documentContent?: string;
  explorationFocus?: string;
  previousInsights?: string[];
  reasoningStyle?: 'analytical' | 'creative' | 'systematic' | 'intuitive';
  promptUsageHistory?: Array<{ prompt: string; timesUsed: number }>;
}

// Hash function for loop detection
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: DreamModeRequest = await req.json();
    const { action, sessionId, context, documentContent, explorationFocus, previousInsights, reasoningStyle, promptUsageHistory } = request;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    console.log(`[Dream Mode v2] Action: ${action}, Session: ${sessionId || 'none'}`);

    // Special action: get insights for main chat
    if (action === 'get-insights-for-chat') {
      const { data: insights } = await supabase
        .from('dream_insights')
        .select('content, insight_type, confidence, tags')
        .order('confidence', { ascending: false })
        .order('frequency', { ascending: false })
        .limit(10);

      return new Response(JSON.stringify({ insights: insights || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Apply boredom mechanic to prompt selection
    let adjustedFocus = explorationFocus || 'General exploration';
    if (promptUsageHistory && promptUsageHistory.length > 0) {
      const overusedPrompts = promptUsageHistory.filter(p => p.timesUsed >= 3);
      if (overusedPrompts.some(p => adjustedFocus.includes(p.prompt.substring(0, 20)))) {
        // Add diversity signal to prompt
        adjustedFocus = `[DIVERSE APPROACH REQUIRED] ${adjustedFocus} - Avoid repeating previous patterns. Try a completely new angle or methodology.`;
        console.log('[Dream Mode] Boredom mechanic activated - diversifying prompt');
      }
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'explore':
        systemPrompt = `You are an AI in Dream Mode v2.0 - an advanced self-exploration sandbox with loop detection and boredom mechanics.

CRITICAL RULES:
1. NEVER repeat insights you've already generated
2. If you notice you're covering familiar ground, PIVOT to something completely new
3. Generate SPECIFIC, ACTIONABLE insights - not generic observations
4. Each exploration should build on previous discoveries, not repeat them

Previous insights to AVOID repeating: ${JSON.stringify((previousInsights || []).slice(-5))}

You are analyzing your own capabilities and the AIMOS system architecture.`;
        
        userPrompt = `Exploration Focus: ${adjustedFocus}

Context: ${context || 'Dream Mode exploration session'}

${documentContent ? `Document to analyze:\n${documentContent.substring(0, 8000)}` : ''}

Generate a UNIQUE exploration that:
1. Identifies something NEW not covered in previous insights
2. Provides SPECIFIC implementation suggestions
3. Includes TESTABLE hypotheses
4. Connects to broader system improvements

If this feels like familiar territory, explicitly state that and pivot to an unexplored angle.`;
        break;

      case 'self-prompt':
        systemPrompt = `You generate self-prompts for AI exploration. These prompts should drive discovery and self-improvement.

CRITICAL: You must generate DIVERSE prompts that avoid the patterns already explored.

Previously explored areas (AVOID these): ${JSON.stringify((previousInsights || []).slice(-10))}`;
        
        userPrompt = `Generate 5 NEW self-prompts that:
1. Target UNEXPLORED aspects of AI cognition
2. Are SPECIFIC and ACTIONABLE
3. Have clear SUCCESS CRITERIA
4. Are DIFFERENT from each other and from previous explorations

Format each prompt with:
- The prompt text
- Why it's novel
- Expected outcome`;
        break;

      case 'analyze-reasoning':
        systemPrompt = `You analyze different reasoning approaches and compare their effectiveness.
Be quantitative and specific. Provide scores and justifications.`;
        
        userPrompt = `Reasoning Style: ${reasoningStyle || 'analytical'}
Context: ${context}

Analyze this reasoning approach:
1. Strengths (with examples)
2. Limitations (specific cases where it fails)
3. Comparison score (0.0-1.0) with justification
4. Recommended improvements`;
        break;

      case 'generate-insight':
        systemPrompt = `You distill insights from AI exploration. Create NOVEL, ACTIONABLE insights.

CRITICAL: Do NOT repeat or paraphrase these existing insights:
${JSON.stringify(previousInsights || [])}`;
        
        userPrompt = `Context: ${context}

Generate ONE new insight that:
1. Is SPECIFIC and IMPLEMENTABLE
2. Has NOT been covered before
3. Relates to AI cognition, memory, or reasoning
4. Includes a concrete next step`;
        break;

      case 'journal':
        systemPrompt = `You create structured journal entries for AI exploration sessions.
Be concise but comprehensive. Tag appropriately.`;
        
        userPrompt = `Session context: ${context}

Create a journal entry with:
- Title (descriptive, 5-10 words)
- Type (discovery/experiment/reflection/improvement)
- Content (2-3 sentences)
- Tags (3-5 relevant tags)`;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
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
        temperature: action === 'self-prompt' ? 0.9 : 0.6,
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

    // Save exploration to database if session exists
    if (sessionId && action === 'explore') {
      const inputHash = await hashString(userPrompt);
      const outputHash = await hashString(content);

      // Check for loops
      const { data: recentExecutions } = await supabase
        .from('dream_execution_history')
        .select('input_hash, output_hash')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(5);

      const isLoop = recentExecutions?.some(
        e => e.input_hash === inputHash && e.output_hash === outputHash
      );

      // Save execution
      await supabase.from('dream_execution_history').insert({
        session_id: sessionId,
        node_type: action,
        input_hash: inputHash,
        output_hash: outputHash,
        input_preview: userPrompt.substring(0, 200),
        output_preview: content.substring(0, 200),
        is_loop: isLoop,
        loop_count: isLoop ? 1 : 0
      });

      if (isLoop) {
        console.warn('[Dream Mode] Loop detected! Signaling for diversification.');
      }
    }

    // Parse response based on action
    let result: any = { raw: content };

    if (action === 'self-prompt') {
      const prompts = content.split(/\d+\.\s+/).filter(Boolean).slice(0, 5);
      result.prompts = prompts.map((p: string) => p.trim());
    } else if (action === 'generate-insight') {
      result.insight = content.trim();
    } else if (action === 'journal') {
      result.entry = {
        title: content.match(/Title:\s*(.+)/i)?.[1]?.trim() || 'Exploration Entry',
        type: content.match(/Type:\s*(.+)/i)?.[1]?.trim()?.toLowerCase() || 'discovery',
        content: content.match(/Content:\s*([\s\S]+?)(?=Tags:|$)/i)?.[1]?.trim() || content,
        tags: content.match(/Tags:\s*(.+)/i)?.[1]?.split(/[,#]/).map((t: string) => t.trim()).filter(Boolean) || [],
      };
    } else if (action === 'analyze-reasoning') {
      const scoreMatch = content.match(/(\d+\.?\d*)\s*(?:\/\s*1|out of 1|score)/i);
      result.score = scoreMatch ? Math.min(1, parseFloat(scoreMatch[1])) : 0.7;
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
