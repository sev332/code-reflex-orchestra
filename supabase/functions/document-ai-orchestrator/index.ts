import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Document AI Orchestrator - Full IDE capabilities with RAG, versioning, and streaming

interface OrchestrationStep {
  id: string;
  type: string;
  status: 'pending' | 'active' | 'complete' | 'error';
  details: string;
  progress: number;
  timestamp: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      action, 
      content, 
      instruction, 
      documentId,
      chunks,
      query,
      targetMetrics,
      stream = true
    } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Action: Improve document content
    if (action === 'improve') {
      console.log('[DOC-AI] Improving document section');
      
      const systemPrompt = `You are an expert document editor and writer. Your task is to improve the given content according to the user's instructions.

Guidelines:
- Maintain the original tone and style
- Preserve key information and structure
- Add depth, examples, and clarity
- Ensure smooth flow and transitions
- Use proper markdown formatting
- Be comprehensive but concise

Instruction: ${instruction}`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Original content:\n\n${content}` },
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[DOC-AI] AI gateway error:', error);
        throw new Error(`AI gateway error: ${response.status}`);
      }

      // Return streaming response
      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    // Action: Analyze document structure
    if (action === 'analyze') {
      console.log('[DOC-AI] Analyzing document structure');
      
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
              content: `Analyze this document and provide:
1. Overall structure assessment
2. Key topics and themes
3. Quality score (0-1)
4. Readability assessment
5. Improvement suggestions
6. Missing sections that should be added

Format as JSON: { "structure": {...}, "topics": [...], "quality": 0.0, "readability": 0.0, "suggestions": [...], "missing": [...] }`,
            },
            { role: 'user', content },
          ],
        }),
      });

      const data = await response.json();
      let analysis;
      try {
        analysis = JSON.parse(data.choices[0].message.content);
      } catch {
        analysis = { raw: data.choices[0].message.content };
      }

      return new Response(JSON.stringify({ success: true, analysis }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: Generate document outline
    if (action === 'generate_outline') {
      console.log('[DOC-AI] Generating document outline');
      
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
              content: `You are a professional document architect. Create a comprehensive outline for the requested document.

Target metrics: ${JSON.stringify(targetMetrics || {})}

Generate a detailed outline with:
- Chapters (# headers)
- Sections (## headers)
- Subsections (### headers)
- Brief descriptions for each
- Estimated word counts

Format as valid markdown outline.`,
            },
            { role: 'user', content: instruction },
          ],
          stream: true,
        }),
      });

      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    // Action: Expand section
    if (action === 'expand_section') {
      console.log('[DOC-AI] Expanding section');
      
      const contextChunks = chunks?.slice(0, 3).map((c: any) => c.content).join('\n\n---\n\n') || '';
      
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
              content: `Expand this section significantly while maintaining consistency with the rest of the document.

Context from other sections:
${contextChunks}

Guidelines:
- At least triple the content length
- Add examples, details, and depth
- Maintain style consistency
- Include relevant sub-sections if appropriate
- Use proper markdown formatting`,
            },
            { role: 'user', content },
          ],
          stream: true,
        }),
      });

      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    // Action: RAG search with context
    if (action === 'rag_search') {
      console.log('[DOC-AI] Performing RAG search:', query);
      
      // Search documentation chunks
      const { data: docResults } = await supabase.rpc('match_documentation', {
        query_embedding: query, // In production, generate embedding first
        match_threshold: 0.5,
        match_count: 5,
      });

      // Also search document chunks if documentId provided
      let localResults: any[] = [];
      if (documentId) {
        const { data } = await supabase
          .from('document_chunks')
          .select('*')
          .eq('document_id', documentId)
          .textSearch('content', query.split(' ').join(' | '));
        localResults = data || [];
      }

      return new Response(JSON.stringify({
        success: true,
        results: {
          documentation: docResults || [],
          local: localResults,
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: Generate system map
    if (action === 'generate_map') {
      console.log('[DOC-AI] Generating system map');
      
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
              content: `Analyze this document and create a system map showing:
1. Main concepts and their relationships
2. Hierarchical structure
3. Cross-references and dependencies
4. Key entities and connections

Format as JSON: { 
  "nodes": [{ "id": "...", "label": "...", "type": "concept|entity|section" }], 
  "edges": [{ "source": "...", "target": "...", "label": "..." }],
  "hierarchy": {...}
}`,
            },
            { role: 'user', content },
          ],
        }),
      });

      const data = await response.json();
      let map;
      try {
        map = JSON.parse(data.choices[0].message.content);
      } catch {
        map = { raw: data.choices[0].message.content };
      }

      return new Response(JSON.stringify({ success: true, map }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Action: Organize and structure
    if (action === 'organize') {
      console.log('[DOC-AI] Organizing document');
      
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
              content: `Reorganize this document for optimal structure and flow:

1. Create a logical chapter structure
2. Group related content together
3. Add missing transitions
4. Ensure proper header hierarchy
5. Create a table of contents
6. Add summary sections where needed

Return the fully reorganized document in markdown format.`,
            },
            { role: 'user', content },
          ],
          stream: true,
        }),
      });

      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    // Action: Generate new version with improvements
    if (action === 'create_version') {
      console.log('[DOC-AI] Creating improved version');
      
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
              content: `Create an improved version of this document:

Improvements to make:
${instruction || 'General quality improvements, clarity, structure, and completeness'}

Target metrics: ${JSON.stringify(targetMetrics || {})}

Produce the complete improved document maintaining all existing content while enhancing it.`,
            },
            { role: 'user', content },
          ],
          stream: true,
        }),
      });

      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error: any) {
    console.error('[DOC-AI] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
