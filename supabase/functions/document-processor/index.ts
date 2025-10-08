import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chunk text into manageable pieces
function chunkText(text: string, chunkSize: number = 2000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
    if (start >= text.length) break;
  }

  return chunks;
}

// Generate hierarchical summaries using AI
async function generateHierarchicalSummary(
  chunks: string[],
  level: number,
  apiKey: string
): Promise<{ summaries: string[], masterSummary: string }> {
  const summaries: string[] = [];

  // First pass: summarize each chunk
  for (const chunk of chunks) {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a document analyst. Create a concise summary (max 200 words) of the following text chunk. Focus on key concepts, entities, and main points. Extract important tags as well.`
          },
          { role: 'user', content: chunk }
        ],
      }),
    });

    const data = await response.json();
    summaries.push(data.choices[0].message.content);
  }

  // Second pass: create master summary from all summaries
  const combinedSummaries = summaries.join('\n\n---\n\n');
  const masterResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: `You are a document analyst creating a master index. Synthesize the following section summaries into:
1. A comprehensive master summary (300-500 words)
2. Key topics (as a comma-separated list)
3. Main entities mentioned (people, places, concepts)
4. Document structure overview

Format as JSON: { "master_summary": "...", "topics": ["..."], "entities": ["..."], "structure": {...} }`
        },
        { role: 'user', content: combinedSummaries }
      ],
    }),
  });

  const masterData = await masterResponse.json();
  const masterContent = masterData.choices[0].message.content;
  
  // Parse JSON response
  let masterSummary = masterContent;
  try {
    const parsed = JSON.parse(masterContent);
    masterSummary = JSON.stringify(parsed, null, 2);
  } catch {
    // Keep as is if not valid JSON
  }

  return { summaries, masterSummary };
}

// Extract tags from text using AI
async function extractTags(text: string, apiKey: string): Promise<string[]> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: 'Extract 5-10 relevant tags from this text. Return only comma-separated tags, no explanation.'
        },
        { role: 'user', content: text.slice(0, 1000) }
      ],
    }),
  });

  const data = await response.json();
  const tagsStr = data.choices[0].message.content;
  return tagsStr.split(',').map((t: string) => t.trim()).filter((t: string) => t);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get document metadata
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !doc) {
      throw new Error('Document not found');
    }

    // Update status to processing
    await supabase
      .from('documents')
      .update({ processing_status: 'processing' })
      .eq('id', documentId);

    // Download document content
    const { data: fileData, error: fileError } = await supabase
      .storage
      .from('documents')
      .download(doc.file_path);

    if (fileError) throw fileError;

    // Convert to text (simplified - in production would handle different formats)
    const text = await fileData.text();

    // Chunk the document
    const chunks = chunkText(text);
    console.log(`Created ${chunks.length} chunks for document ${documentId}`);

    // Store base chunks
    const chunkRecords = [];
    for (let i = 0; i < chunks.length; i++) {
      const tags = await extractTags(chunks[i], lovableApiKey);
      
      const { data: chunkData } = await supabase
        .from('document_chunks')
        .insert({
          document_id: documentId,
          chunk_index: i,
          content: chunks[i],
          chunk_type: 'content',
          start_position: i * 1800, // Approximate
          end_position: (i + 1) * 1800,
          tags,
        })
        .select()
        .single();

      chunkRecords.push(chunkData);
    }

    // Generate hierarchical summaries
    console.log('Generating hierarchical summaries...');
    const { summaries, masterSummary } = await generateHierarchicalSummary(
      chunks,
      1,
      lovableApiKey
    );

    // Store level 1 summaries
    for (let i = 0; i < summaries.length; i++) {
      await supabase
        .from('document_chunks')
        .insert({
          document_id: documentId,
          chunk_index: i,
          content: summaries[i],
          chunk_type: 'summary_l1',
          parent_chunk_id: chunkRecords[i]?.id,
        });
    }

    // Store master index
    await supabase
      .from('document_chunks')
      .insert({
        document_id: documentId,
        chunk_index: 0,
        content: masterSummary,
        chunk_type: 'master_index',
      });

    // Parse master summary for analysis
    let analysisData = {
      master_summary: masterSummary,
      key_topics: [] as string[],
      entities: [] as any[],
      structure: {},
      complexity_score: 0.7,
      readability_score: 0.6,
      total_chunks: chunks.length,
      hierarchy_levels: 2,
    };

    try {
      const parsed = JSON.parse(masterSummary);
      analysisData = {
        ...analysisData,
        master_summary: parsed.master_summary || masterSummary,
        key_topics: parsed.topics || [],
        entities: parsed.entities?.map((e: string) => ({ name: e, type: 'general' })) || [],
        structure: parsed.structure || {},
      };
    } catch {
      // Keep defaults if parsing fails
    }

    // Store analysis
    await supabase
      .from('document_analysis')
      .insert({
        document_id: documentId,
        ...analysisData,
      });

    // Update document status
    await supabase
      .from('documents')
      .update({ processing_status: 'completed' })
      .eq('id', documentId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Document processed successfully',
        chunks: chunks.length,
        summaries: summaries.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Document processing error:', error);
    
    // Update document status to failed if we have the documentId
    try {
      const { documentId } = await req.json();
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase
        .from('documents')
        .update({ 
          processing_status: 'failed',
          processing_error: error.message 
        })
        .eq('id', documentId);
    } catch {}

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
