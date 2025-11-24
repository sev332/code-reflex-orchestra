import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Phase 2B: Document indexer for full RAG
// Indexes UNIFIED_TEXTBOOK.md and AIMOS.txt into vector database

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    if (action === "index_all") {
      // Index all documentation
      const results = {
        textbook: 0,
        aimos: 0,
        errors: [] as string[]
      };
      
      // Read UNIFIED_TEXTBOOK.md
      try {
        let textbookContent = "";
        try {
          textbookContent = await Deno.readTextFile("/var/task/docs/UNIFIED_TEXTBOOK.md");
        } catch {
          textbookContent = await Deno.readTextFile("./docs/UNIFIED_TEXTBOOK.md");
        }
        
        // Split into chapters
        const chapters = textbookContent.split(/\n# Chapter \d+:/);
        
        for (let i = 1; i < chapters.length; i++) {
          const chapterContent = chapters[i];
          const chapterTitle = chapterContent.split('\n')[0].trim();
          
          // Split chapter into sections (by ## or ###)
          const sections = chapterContent.split(/\n#{2,3} /);
          
          for (let j = 0; j < sections.length; j++) {
            const section = sections[j];
            if (section.length < 100) continue; // Skip tiny sections
            
            // Take first 1000 characters for embedding
            const chunk = section.substring(0, 1000);
            const tokenCount = Math.ceil(chunk.length / 4);
            
            // Generate embedding using Lovable AI gateway
            const embeddingResponse = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${lovableApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "text-embedding-ada-002",
                input: chunk
              }),
            });
            
            if (embeddingResponse.ok) {
              const embeddingResult = await embeddingResponse.json();
              const embedding = embeddingResult.data[0].embedding;
              
              // Store in database
              await supabase.from("documentation_chunks").insert({
                source: "unified_textbook",
                chapter: chapterTitle,
                section: sections[j].split('\n')[0].substring(0, 200),
                content: chunk,
                embedding: embedding,
                token_count: tokenCount,
                metadata: { chapter_index: i, section_index: j }
              });
              
              results.textbook++;
            } else {
              results.errors.push(`Failed to embed textbook chunk ${i}-${j}`);
            }
          }
        }
      } catch (e) {
        results.errors.push(`Textbook indexing error: ${e.message}`);
      }
      
      // Read AIMOS.txt
      try {
        let aimosContent = "";
        try {
          aimosContent = await Deno.readTextFile("/var/task/public/docs/AIMOS.txt");
        } catch {
          aimosContent = await Deno.readTextFile("./public/docs/AIMOS.txt");
        }
        
        // Split by section markers (underscores)
        const sections = aimosContent.split(/\n_{40,}/);
        
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          if (section.length < 100) continue;
          
          // Take first 1000 characters
          const chunk = section.substring(0, 1000);
          const tokenCount = Math.ceil(chunk.length / 4);
          
          // Generate embedding
          const embeddingResponse = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${lovableApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "text-embedding-ada-002",
              input: chunk
            }),
          });
          
          if (embeddingResponse.ok) {
            const embeddingResult = await embeddingResponse.json();
            const embedding = embeddingResult.data[0].embedding;
            
            // Extract section title (first line)
            const sectionTitle = section.split('\n').find(line => line.trim().length > 0)?.substring(0, 200) || "Untitled";
            
            await supabase.from("documentation_chunks").insert({
              source: "aimos",
              section: sectionTitle,
              content: chunk,
              embedding: embedding,
              token_count: tokenCount,
              metadata: { section_index: i }
            });
            
            results.aimos++;
          } else {
            results.errors.push(`Failed to embed AIMOS chunk ${i}`);
          }
        }
      } catch (e) {
        results.errors.push(`AIMOS indexing error: ${e.message}`);
      }
      
      return new Response(JSON.stringify({
        success: true,
        indexed: {
          textbook_chunks: results.textbook,
          aimos_chunks: results.aimos,
          total: results.textbook + results.aimos
        },
        errors: results.errors
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    if (action === "search") {
      const { query, limit = 5 } = await req.json();
      
      // Generate embedding for query
      const embeddingResponse = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-ada-002",
          input: query
        }),
      });
      
      if (!embeddingResponse.ok) {
        throw new Error("Failed to generate query embedding");
      }
      
      const embeddingResult = await embeddingResponse.json();
      const queryEmbedding = embeddingResult.data[0].embedding;
      
      // Search using vector similarity
      const { data: results, error } = await supabase.rpc("match_documentation", {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: limit
      });
      
      if (error) {
        console.error("Search error:", error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
          results: []
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      return new Response(JSON.stringify({
        success: true,
        results: results || []
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    return new Response(JSON.stringify({
      error: "Invalid action. Use 'index_all' or 'search'"
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
    
  } catch (error) {
    console.error("Document indexer error:", error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});