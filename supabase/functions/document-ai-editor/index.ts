import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      action, 
      documentId, 
      chunkId, 
      selectedText, 
      startPosition, 
      endPosition, 
      userPrompt,
      includeResearch 
    } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) throw new Error('Unauthorized');

    // Get document and chunk context
    const { data: doc } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    const { data: chunk } = chunkId ? await supabase
      .from('document_chunks')
      .select('*')
      .eq('id', chunkId)
      .single() : { data: null };

    // Get master index for context
    const { data: masterIndex } = await supabase
      .from('document_chunks')
      .select('content')
      .eq('document_id', documentId)
      .eq('chunk_type', 'master_index')
      .single();

    // Get surrounding chunks for context
    const { data: nearbyChunks } = chunk ? await supabase
      .from('document_chunks')
      .select('content')
      .eq('document_id', documentId)
      .eq('chunk_type', 'content')
      .gte('chunk_index', chunk.chunk_index - 1)
      .lte('chunk_index', chunk.chunk_index + 1)
      .order('chunk_index') : { data: [] };

    // Get document analysis
    const { data: analysis } = await supabase
      .from('document_analysis')
      .select('*')
      .eq('document_id', documentId)
      .single();

    // Build context for AI
    const context = {
      document_title: doc?.title,
      master_index: masterIndex?.content,
      selected_section: selectedText,
      nearby_context: nearbyChunks?.map((c: any) => c.content).join('\n\n'),
      document_topics: analysis?.key_topics,
      document_entities: analysis?.entities,
    };

    // Different actions
    if (action === 'analyze_section') {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are a document analysis expert. Analyze the selected section in context of the full document.

Document Context:
- Title: ${context.document_title}
- Master Index: ${context.master_index}
- Key Topics: ${context.document_topics?.join(', ')}

Provide:
1. Summary of selected section
2. How it relates to the document's main themes
3. Key entities or concepts
4. Suggestions for improvement
5. Related sections that might be relevant`
            },
            {
              role: 'user',
              content: `Selected section:\n${selectedText}\n\nNearby context:\n${context.nearby_context}`
            }
          ],
        }),
      });

      const data = await response.json();
      return new Response(
        JSON.stringify({ 
          success: true,
          analysis: data.choices[0].message.content 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'suggest_edit') {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro',
          messages: [
            {
              role: 'system',
              content: `You are a professional editor with deep understanding of document structure and coherence.

Document Context:
- Title: ${context.document_title}
- Master Index: ${context.master_index}
- Key Topics: ${context.document_topics?.join(', ')}

User's editing request: "${userPrompt}"

Provide:
1. Edited version of the selected text that addresses the user's request
2. Detailed reasoning for your changes
3. How the edit improves the document's overall coherence
4. Alternative approaches if applicable

Format as JSON: { "edited_text": "...", "reasoning": "...", "impact": "...", "alternatives": ["..."] }`
            },
            {
              role: 'user',
              content: `Original section:\n${selectedText}\n\nNearby context:\n${context.nearby_context}`
            }
          ],
        }),
      });

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      let editResult;
      try {
        editResult = JSON.parse(content);
      } catch {
        editResult = {
          edited_text: content,
          reasoning: 'AI-generated edit',
          impact: 'Improved based on user request',
          alternatives: []
        };
      }

      // Store edit in history
      await supabase
        .from('document_edit_history')
        .insert({
          document_id: documentId,
          chunk_id: chunkId,
          user_id: user.id,
          edit_type: 'ai_assisted',
          original_content: selectedText,
          new_content: editResult.edited_text,
          edit_prompt: userPrompt,
          ai_reasoning: editResult.reasoning,
          start_position: startPosition,
          end_position: endPosition,
        });

      return new Response(
        JSON.stringify({ 
          success: true,
          ...editResult
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'deep_research' && includeResearch) {
      // Use Gemini Pro for deep research
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro',
          messages: [
            {
              role: 'system',
              content: `You are a research expert. Conduct deep research on the topic in the selected section.

Document Context:
- Title: ${context.document_title}
- Master Index: ${context.master_index}

Research Focus: "${userPrompt}"

Provide comprehensive research including:
1. Key insights and findings
2. Supporting evidence and references
3. How this relates to the document's themes
4. Recommendations for content expansion
5. Areas requiring further investigation`
            },
            {
              role: 'user',
              content: `Section for research:\n${selectedText}`
            }
          ],
        }),
      });

      const data = await response.json();
      return new Response(
        JSON.stringify({ 
          success: true,
          research: data.choices[0].message.content 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error: any) {
    console.error('Document AI editor error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
