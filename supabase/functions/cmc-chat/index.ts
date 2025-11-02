import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// APOE 8-Node Reasoning Chain
const APOE_NODES = [
  { id: "decompose", name: "Problem Decomposition", budget: 0.15 },
  { id: "context", name: "Context Retrieval", budget: 0.10 },
  { id: "hypothesize", name: "Hypothesis Generation", budget: 0.15 },
  { id: "evidence", name: "Evidence Gathering", budget: 0.15 },
  { id: "integrate", name: "Multi-Source Integration", budget: 0.15 },
  { id: "critique", name: "Critical Analysis", budget: 0.10 },
  { id: "synthesize", name: "Solution Synthesis", budget: 0.15 },
  { id: "verify", name: "Verification & Confidence", budget: 0.05 },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message, sessionId, userId } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log("🧠 CMC: Starting reasoning pipeline for:", message.substring(0, 50));
    
    // Step 1: Store user query in CMC memory
    const messageHash = await crypto.subtle.digest(
      "SHA-256", 
      new TextEncoder().encode(message)
    ).then(h => Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join(''));
    
    await supabase.from("cmc_memories").insert({
      content: message,
      content_hash: messageHash,
      tier: "working",
      source: "user_query",
      user_id: userId,
      session_id: sessionId,
      token_count: Math.ceil(message.length / 4),
      tags: ["query", "user_input"],
      importance: 0.8,
    });
    
    // Step 2: Retrieve relevant context from CMC memory
    const { data: memories } = await supabase
      .from("cmc_memories")
      .select("*")
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order("retrieval_score", { ascending: false, nullsFirst: false })
      .order("importance", { ascending: false })
      .limit(5);
    
    const contextStr = memories?.map(m => `[${m.tier}] ${m.content}`).join("\n") || "";
    
    // Step 3: Execute APOE 8-node reasoning chain
    const traceId = crypto.randomUUID();
    const reasoningSteps: any[] = [];
    const totalBudget = 8000;
    let tokensUsed = 0;
    
    for (const node of APOE_NODES) {
      const nodeBudget = Math.floor(totalBudget * node.budget);
      const nodePrompt = buildNodePrompt(node.id, message, contextStr, reasoningSteps);
      
      console.log(`📊 APOE Node: ${node.name} (budget: ${nodeBudget})`);
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: nodePrompt.system },
            { role: "user", content: nodePrompt.user }
          ],
          max_tokens: nodeBudget,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI gateway error at node ${node.id}: ${errorText}`);
      }
      
      const result = await response.json();
      const nodeOutput = result.choices[0].message.content;
      const nodeTokens = result.usage?.total_tokens || nodeBudget;
      tokensUsed += nodeTokens;
      
      reasoningSteps.push({
        node: node.id,
        name: node.name,
        output: nodeOutput,
        tokens: nodeTokens,
        timestamp: new Date().toISOString(),
      });
    }
    
    const finalAnswer = reasoningSteps[reasoningSteps.length - 1].output;
    
    // Step 4: VIF Verification
    const { data: evidenceData } = await supabase
      .from("cmc_evidence_graph")
      .select("*")
      .limit(10);
    
    const provenanceCoverage = calculateProvenanceCoverage(reasoningSteps, evidenceData || []);
    const semanticEntropy = calculateSemanticEntropy(reasoningSteps);
    const confidence = 1 - (semanticEntropy * 0.5 + (1 - provenanceCoverage) * 0.5);
    
    console.log(`✅ VIF: κ=${provenanceCoverage.toFixed(2)}, H=${semanticEntropy.toFixed(2)}, conf=${confidence.toFixed(2)}`);
    
    // Step 5: Store reasoning chain
    await supabase.from("cmc_reasoning_chains").insert({
      trace_id: traceId,
      user_query: message,
      final_answer: finalAnswer,
      steps: reasoningSteps,
      agents: APOE_NODES.map(n => n.name),
      token_budget: totalBudget,
      tokens_used: tokensUsed,
      support: { evidenceCount: evidenceData?.length || 0 },
      confidence,
      provenance_coverage: provenanceCoverage,
      semantic_entropy: semanticEntropy,
      user_id: userId,
      session_id: sessionId,
    });
    
    // Step 6: Store answer in CMC memory
    const answerHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(finalAnswer)
    ).then(h => Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join(''));
    
    await supabase.from("cmc_memories").insert({
      content: finalAnswer,
      content_hash: answerHash,
      tier: "working",
      source: "apoe_reasoning",
      user_id: userId,
      session_id: sessionId,
      token_count: Math.ceil(finalAnswer.length / 4),
      tags: ["answer", "apoe", `confidence_${Math.round(confidence * 100)}`],
      importance: confidence,
      quality_score: confidence,
    });
    
    return new Response(
      JSON.stringify({
        answer: finalAnswer,
        reasoning: reasoningSteps,
        verification: {
          confidence,
          provenance_coverage: provenanceCoverage,
          semantic_entropy: semanticEntropy,
        },
        trace_id: traceId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ CMC Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildNodePrompt(nodeId: string, query: string, context: string, previousSteps: any[]) {
  const prevOutputs = previousSteps.map(s => `${s.name}: ${s.output}`).join("\n\n");
  
  const prompts: Record<string, { system: string; user: string }> = {
    decompose: {
      system: "Break down the user's query into atomic sub-problems. List 3-5 clear, focused questions.",
      user: `Query: ${query}\n\nDecompose this into sub-problems:`,
    },
    context: {
      system: "Review available context and identify relevant information for the query.",
      user: `Query: ${query}\n\nContext:\n${context}\n\nSummarize relevant context:`,
    },
    hypothesize: {
      system: "Generate 2-3 potential solution hypotheses based on the decomposition and context.",
      user: `Query: ${query}\n\n${prevOutputs}\n\nPropose hypotheses:`,
    },
    evidence: {
      system: "Identify what evidence would support or refute each hypothesis. Be specific.",
      user: `${prevOutputs}\n\nWhat evidence is needed?`,
    },
    integrate: {
      system: "Synthesize information from multiple sources and reasoning paths. Look for convergence.",
      user: `${prevOutputs}\n\nIntegrate findings:`,
    },
    critique: {
      system: "Critically analyze the reasoning so far. Identify gaps, biases, and weaknesses.",
      user: `${prevOutputs}\n\nCritique this reasoning:`,
    },
    synthesize: {
      system: "Create a coherent, comprehensive answer that addresses the original query.",
      user: `Original Query: ${query}\n\n${prevOutputs}\n\nSynthesize final answer:`,
    },
    verify: {
      system: "Assess confidence level (0-1) and list key assumptions. Be honest about uncertainty.",
      user: `${prevOutputs}\n\nVerify and assess confidence:`,
    },
  };
  
  return prompts[nodeId] || prompts.synthesize;
}

function calculateProvenanceCoverage(steps: any[], evidence: any[]): number {
  if (evidence.length === 0) return 0.3;
  
  let citedSources = 0;
  const allText = steps.map(s => s.output).join(" ").toLowerCase();
  
  for (const ev of evidence) {
    if (allText.includes(ev.source.toLowerCase()) || 
        allText.includes(ev.content.substring(0, 50).toLowerCase())) {
      citedSources++;
    }
  }
  
  return Math.min(citedSources / Math.max(evidence.length, 3), 1.0);
}

function calculateSemanticEntropy(steps: any[]): number {
  const outputs = steps.map(s => s.output);
  if (outputs.length < 2) return 0.1;
  
  let totalEntropy = 0;
  for (let i = 1; i < outputs.length; i++) {
    const prev = outputs[i - 1].toLowerCase();
    const curr = outputs[i].toLowerCase();
    
    const prevWords = new Set(prev.split(/\s+/));
    const currWords = new Set(curr.split(/\s+/));
    const intersection = new Set([...prevWords].filter(w => currWords.has(w)));
    
    const similarity = intersection.size / Math.max(prevWords.size, currWords.size);
    totalEntropy += (1 - similarity);
  }
  
  return Math.min(totalEntropy / (outputs.length - 1), 1.0);
}
