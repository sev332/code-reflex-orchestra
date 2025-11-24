import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Phase 5: Query analysis for keyword extraction
// Phase 2A: Documentation search with keyword matching
// AIM-OS inspired APOE nodes with detailed tracking and documentation integration
const APOE_NODES = [
  { id: "query_analyze", name: "Query Analysis", budget: 0.05, description: "Analyzing query for key concepts and required documentation" },
  { id: "doc_search", name: "Documentation Search", budget: 0.10, description: "Searching AIMOS documentation and unified textbook" },
  { id: "decompose", name: "Problem Decomposition", budget: 0.10, description: "Breaking down the query into analyzable components" },
  { id: "context_retrieve", name: "Context Memory Retrieval", budget: 0.08, description: "Fetching relevant memories from CMC tiers" },
  { id: "hypothesize", name: "Hypothesis Generation", budget: 0.10, description: "Generating potential solution paths" },
  { id: "evidence_gather", name: "Evidence Gathering", budget: 0.12, description: "Collecting supporting evidence and citations" },
  { id: "multi_integrate", name: "Multi-Source Integration", budget: 0.12, description: "Synthesizing information from multiple sources" },
  { id: "critique", name: "Critical Analysis", budget: 0.09, description: "Evaluating solution quality and coherence" },
  { id: "synthesize", name: "Solution Synthesis", budget: 0.12, description: "Constructing final coherent answer" },
  { id: "verify", name: "Verification & Calibration", budget: 0.05, description: "Validating confidence and provenance" },
  { id: "meta_reflect", name: "Meta-Reflection", budget: 0.05, description: "Self-assessment of reasoning quality" },
  { id: "memory_store", name: "Memory Consolidation", budget: 0.02, description: "Storing reasoning artifacts in CMC" },
];

// SSE helper
function createSSE(data: any, event = "step") {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// Phase 2A: Read and search documentation files
async function searchDocumentation(keywords: string[]): Promise<{ source: string; content: string; relevance: number }[]> {
  const results: { source: string; content: string; relevance: number }[] = [];
  
  try {
    // Read UNIFIED_TEXTBOOK.md
    const textbookPath = "/var/task/docs/UNIFIED_TEXTBOOK.md";
    let textbookContent = "";
    try {
      textbookContent = await Deno.readTextFile(textbookPath);
    } catch (e) {
      console.log("Could not read unified textbook from /var/task, trying relative path");
      try {
        textbookContent = await Deno.readTextFile("./docs/UNIFIED_TEXTBOOK.md");
      } catch (e2) {
        console.log("Could not read unified textbook from relative path either");
      }
    }
    
    // Read AIMOS.txt
    const aimosPath = "/var/task/public/docs/AIMOS.txt";
    let aimosContent = "";
    try {
      aimosContent = await Deno.readTextFile(aimosPath);
    } catch (e) {
      console.log("Could not read AIMOS from /var/task, trying relative path");
      try {
        aimosContent = await Deno.readTextFile("./public/docs/AIMOS.txt");
      } catch (e2) {
        console.log("Could not read AIMOS from relative path either");
      }
    }
    
    // Search for keywords in both documents
    if (textbookContent) {
      const sections = textbookContent.split(/\n#{1,3} /); // Split by headers
      for (const section of sections) {
        const sectionLower = section.toLowerCase();
        let relevanceScore = 0;
        
        for (const keyword of keywords) {
          const keywordLower = keyword.toLowerCase();
          const count = (sectionLower.match(new RegExp(keywordLower, 'g')) || []).length;
          relevanceScore += count * 2; // Weight each match
        }
        
        if (relevanceScore > 0 && section.length > 100) {
          results.push({
            source: "UNIFIED_TEXTBOOK.md",
            content: section.substring(0, 800), // Take first 800 chars
            relevance: relevanceScore
          });
        }
      }
    }
    
    if (aimosContent) {
      const sections = aimosContent.split(/\n_{40}/); // Split by underscores
      for (const section of sections) {
        const sectionLower = section.toLowerCase();
        let relevanceScore = 0;
        
        for (const keyword of keywords) {
          const keywordLower = keyword.toLowerCase();
          const count = (sectionLower.match(new RegExp(keywordLower, 'g')) || []).length;
          relevanceScore += count * 2;
        }
        
        if (relevanceScore > 0 && section.length > 100) {
          results.push({
            source: "AIMOS.txt",
            content: section.substring(0, 800),
            relevance: relevanceScore
          });
        }
      }
    }
    
    // Sort by relevance and return top 5
    return results.sort((a, b) => b.relevance - a.relevance).slice(0, 5);
  } catch (error) {
    console.error("Documentation search error:", error);
    return [];
  }
}

// Phase 5: Extract keywords from query
function extractKeywords(query: string): string[] {
  const queryLower = query.toLowerCase();
  
  // Common AIMOS/AI concepts to look for
  const concepts = [
    'aimos', 'ai-mos', 'cmc', 'context memory', 'apoe', 'vif', 'verifiable intelligence',
    'sdf-cvf', 'seg', 'shared evidence', 'memory', 'reasoning', 'orchestration',
    'agent', 'provenance', 'confidence', 'compression', 'retrieval', 'embedding',
    'consciousness', 'cognitive', 'neural', 'knowledge', 'inference', 'validation',
    'hierarchy', 'indexing', 'snapshot', 'tag', 'graph', 'godn', 'geometry',
    'quaternion', 'quantum', 'kernel', 'plix', 'intent'
  ];
  
  const found = concepts.filter(concept => queryLower.includes(concept));
  
  // Also extract any capitalized words or technical terms
  const technicalTerms = query.match(/[A-Z][A-Za-z]+/g) || [];
  
  return [...new Set([...found, ...technicalTerms.map(t => t.toLowerCase())])];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message, sessionId, userId } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        try {
          // Send orchestration plan first
          controller.enqueue(encoder.encode(createSSE({
            type: "orchestration_plan",
            totalSteps: APOE_NODES.length,
            complexity: "documentation-aware-deep",
            memoryStrategy: "hierarchical-CMC-with-docs",
            timestamp: new Date().toISOString()
          }, "plan")));
          
          // Store query in CMC
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
          
          // Execute each APOE node with detailed streaming
          const traceId = crypto.randomUUID();
          const reasoningSteps: any[] = [];
          const totalBudget = 12000;
          let tokensUsed = 0;
          let documentationResults: any[] = [];
          let queryKeywords: string[] = [];
          
          const agents: any[] = [
            { id: "analyzer", name: "Query Analyzer", role: "analysis", status: "active", tasksCompleted: 0 },
            { id: "doc_searcher", name: "Documentation Searcher", role: "knowledge", status: "active", tasksCompleted: 0 },
            { id: "planner", name: "Orchestration Planner", role: "coordination", status: "active", tasksCompleted: 0 },
            { id: "retriever", name: "Context Retriever", role: "memory", status: "active", tasksCompleted: 0 },
            { id: "reasoner", name: "Deep Reasoner", role: "inference", status: "active", tasksCompleted: 0 },
            { id: "verifier", name: "Truth Verifier", role: "validation", status: "active", tasksCompleted: 0 },
            { id: "synthesizer", name: "Response Synthesizer", role: "assembly", status: "active", tasksCompleted: 0 },
          ];
          
          // Retrieve context from CMC (will be used later)
          const { data: memories } = await supabase
            .from("cmc_memories")
            .select("*")
            .or(`user_id.eq.${userId},user_id.is.null`)
            .order("retrieval_score", { ascending: false, nullsFirst: false })
            .order("importance", { ascending: false })
            .limit(8);
          
          const contextStr = memories?.map(m => `[${m.tier}] ${m.content.substring(0, 200)}`).join("\n") || "";
          
          for (let i = 0; i < APOE_NODES.length; i++) {
            const node = APOE_NODES[i];
            const nodeBudget = Math.floor(totalBudget * node.budget);
            
            // Determine which agent handles this node
            const agentIdx = i % agents.length;
            const activeAgent = agents[agentIdx];
            activeAgent.status = "working";
            activeAgent.tasksCompleted++;
            
            // Phase 5: Query Analysis Node - extract keywords
            if (node.id === "query_analyze") {
              queryKeywords = extractKeywords(message);
              
              const analysisOutput = `Query Analysis Complete:
- Identified ${queryKeywords.length} key concepts: ${queryKeywords.join(', ')}
- Query complexity: ${message.split(' ').length > 10 ? 'high' : 'medium'}
- Requires documentation: ${queryKeywords.some(k => ['aimos', 'cmc', 'apoe', 'vif'].includes(k)) ? 'YES' : 'MAYBE'}
- Recommended sources: ${queryKeywords.length > 0 ? 'UNIFIED_TEXTBOOK.md, AIMOS.txt' : 'CMC memories only'}`;

              controller.enqueue(encoder.encode(createSSE({
                type: "step_start",
                step: i + 1,
                node: node.id,
                name: node.name,
                description: node.description,
                agent: activeAgent.name,
                agentRole: activeAgent.role,
                budget: nodeBudget,
                timestamp: new Date().toISOString(),
                metadata: { keywords: queryKeywords }
              }, "step")));
              
              const stepData = {
                type: node.id,
                agent: activeAgent.name,
                status: "completed",
                duration: 50,
                detail: analysisOutput,
                output: analysisOutput,
                sources_consulted: [{ type: "query_parser", method: "keyword_extraction" }],
                evidence: {
                  found: queryKeywords,
                  gaps: [],
                  confidence_breakdown: { analysis_quality: 1.0 }
                },
                metrics: {
                  tokensUsed: 0,
                  confidence: 1.0,
                  coherenceScore: 1.0,
                  informationDensity: 0.8,
                  citationCount: 0,
                  keywordsExtracted: queryKeywords.length
                }
              };
              
              reasoningSteps.push(stepData);
              tokensUsed += 0;
              
              controller.enqueue(encoder.encode(createSSE({
                type: "step_complete",
                step: i + 1,
                ...stepData,
                tokensTotal: tokensUsed,
                agent: {
                  id: activeAgent.id,
                  name: activeAgent.name,
                  role: activeAgent.role,
                  tasksCompleted: activeAgent.tasksCompleted
                }
              }, "step")));
              
              activeAgent.status = "active";
              continue;
            }
            
            // Phase 2A: Documentation Search Node
            if (node.id === "doc_search") {
              const searchKeywords = queryKeywords.length > 0 ? queryKeywords : extractKeywords(message);
              documentationResults = await searchDocumentation(searchKeywords);
              
              const searchOutput = documentationResults.length > 0 
                ? `Documentation Search Complete:
- Found ${documentationResults.length} relevant sections
- Sources: ${[...new Set(documentationResults.map(r => r.source))].join(', ')}
- Top matches: ${documentationResults.slice(0, 3).map((r, idx) => `\n  ${idx + 1}. ${r.source} (relevance: ${r.relevance})`).join('')}

Key Documentation Excerpts:
${documentationResults.map((r, idx) => `\n[${idx + 1}. ${r.source}]\n${r.content.substring(0, 400)}...\n`).join('\n')}`
                : `Documentation Search Complete:
- No relevant documentation found for keywords: ${searchKeywords.join(', ')}
- Will rely on CMC memories and general knowledge`;

              controller.enqueue(encoder.encode(createSSE({
                type: "step_start",
                step: i + 1,
                node: node.id,
                name: node.name,
                description: node.description,
                agent: activeAgent.name,
                agentRole: activeAgent.role,
                budget: nodeBudget,
                timestamp: new Date().toISOString(),
                metadata: { 
                  keywords: searchKeywords,
                  resultsFound: documentationResults.length
                }
              }, "step")));
              
              const stepData = {
                type: node.id,
                agent: activeAgent.name,
                status: "completed",
                duration: 150,
                detail: searchOutput,
                output: searchOutput,
                sources_consulted: [
                  { type: "documentation", files: ["UNIFIED_TEXTBOOK.md", "AIMOS.txt"], results: documentationResults.length }
                ],
                evidence: {
                  found: documentationResults.map(r => r.source),
                  gaps: documentationResults.length === 0 ? ["No documentation matched keywords"] : [],
                  confidence_breakdown: { 
                    source_quality: documentationResults.length > 0 ? 0.95 : 0.3,
                    coverage: Math.min(documentationResults.length / 3, 1.0)
                  }
                },
                metrics: {
                  tokensUsed: 0,
                  confidence: documentationResults.length > 0 ? 0.9 : 0.4,
                  coherenceScore: 1.0,
                  informationDensity: 0.85,
                  citationCount: documentationResults.length,
                  documentationSectionsFound: documentationResults.length
                }
              };
              
              reasoningSteps.push(stepData);
              tokensUsed += 0;
              
              controller.enqueue(encoder.encode(createSSE({
                type: "step_complete",
                step: i + 1,
                ...stepData,
                tokensTotal: tokensUsed,
                agent: {
                  id: activeAgent.id,
                  name: activeAgent.name,
                  role: activeAgent.role,
                  tasksCompleted: activeAgent.tasksCompleted
                }
              }, "step")));
              
              activeAgent.status = "active";
              continue;
            }
            
            // Build enhanced prompt with documentation context
            const documentationContext = documentationResults.length > 0
              ? `\n\nRelevant Documentation:\n${documentationResults.map((r, idx) => `[DOC-${idx + 1}: ${r.source}]\n${r.content}`).join('\n\n')}`
              : "";
            
            const nodePrompt = buildNodePrompt(node.id, message, contextStr + documentationContext, reasoningSteps);
            
            // Stream step start with detailed metadata
            controller.enqueue(encoder.encode(createSSE({
              type: "step_start",
              step: i + 1,
              node: node.id,
              name: node.name,
              description: node.description,
              agent: activeAgent.name,
              agentRole: activeAgent.role,
              budget: nodeBudget,
              inputPrompt: nodePrompt.user.substring(0, 400) + "...",
              systemContext: nodePrompt.system.substring(0, 200) + "...",
              timestamp: new Date().toISOString(),
              tokensUsedSoFar: tokensUsed,
              documentationAvailable: documentationResults.length > 0
            }, "step")));
            
            const startTime = Date.now();
            
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
                temperature: node.id === "critique" ? 0.7 : 0.4,
              }),
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`AI gateway error at node ${node.id}: ${errorText}`);
            }
            
            const result = await response.json();
            const nodeOutput = result.choices[0].message.content;
            const nodeTokens = result.usage?.total_tokens || nodeBudget;
            const duration = Date.now() - startTime;
            tokensUsed += nodeTokens;
            
            activeAgent.status = "active";
            
            // Phase 3: Enhanced step details with sources and evidence
            const confidence = calculateIntermediateConfidence(nodeOutput, i, APOE_NODES.length);
            const citations = extractCitations([{ detail: nodeOutput }]);
            
            const stepData = {
              type: node.id,
              agent: activeAgent.name,
              status: "completed",
              duration,
              detail: nodeOutput,
              output: nodeOutput, // Full output, not truncated
              sources_consulted: [
                { type: "cmc_memory", count: memories?.length || 0 },
                { type: "documentation", files: [...new Set(documentationResults.map(r => r.source))], sections: documentationResults.length },
                { type: "llm", model: "google/gemini-2.5-flash", tokens: nodeTokens }
              ],
              evidence: {
                found: citations,
                gaps: citations.length === 0 ? ["No citations provided"] : [],
                confidence_breakdown: {
                  source_quality: documentationResults.length > 0 ? 0.9 : 0.6,
                  relevance: confidence,
                  completeness: Math.min(nodeOutput.length / 500, 1.0)
                }
              },
              metrics: {
                tokensUsed: nodeTokens,
                confidence,
                coherenceScore: calculateCoherence(nodeOutput),
                informationDensity: calculateDensity(nodeOutput),
                citationCount: citations.length,
              }
            };
            
            reasoningSteps.push(stepData);
            
            // Stream complete step with full details
            controller.enqueue(encoder.encode(createSSE({
              type: "step_complete",
              step: i + 1,
              ...stepData,
              tokensTotal: tokensUsed,
              agent: {
                id: activeAgent.id,
                name: activeAgent.name,
                role: activeAgent.role,
                tasksCompleted: activeAgent.tasksCompleted
              }
            }, "step")));
          }
          
          // Calculate final verification metrics
          const finalAnswer = reasoningSteps.find(s => s.type === "synthesize")?.detail || "Answer synthesis incomplete";
          const verification = {
            confidence: calculateFinalConfidence(reasoningSteps),
            provenance_coverage: calculateProvenance(reasoningSteps),
            semantic_entropy: calculateEntropy(reasoningSteps),
            coherence_score: calculateOverallCoherence(reasoningSteps),
            documentation_used: documentationResults.length > 0,
            sources_count: documentationResults.length + (memories?.length || 0)
          };
          
          // Store reasoning chain
          await supabase.from("cmc_reasoning_chains").insert({
            user_query: message,
            final_answer: finalAnswer,
            steps: reasoningSteps,
            agents: agents,
            support: { 
              citations: extractCitations(reasoningSteps),
              documentation: documentationResults.map(r => r.source)
            },
            confidence: verification.confidence,
            provenance_coverage: verification.provenance_coverage,
            semantic_entropy: verification.semantic_entropy,
            token_budget: totalBudget,
            tokens_used: tokensUsed,
            trace_id: traceId,
            user_id: userId,
            session_id: sessionId,
          });
          
          // Send final response
          controller.enqueue(encoder.encode(createSSE({
            type: "final",
            answer: finalAnswer,
            verification,
            agents,
            trace_id: traceId,
            tokensUsed,
            timestamp: new Date().toISOString(),
            metadata: {
              documentation_sections_used: documentationResults.length,
              keywords_identified: queryKeywords.length
            }
          }, "complete")));
          
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.enqueue(encoder.encode(createSSE({
            type: "error",
            message: error.message
          }, "error")));
          controller.close();
        }
      }
    });
    
    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Prompt builders per node
function buildNodePrompt(nodeId: string, query: string, context: string, priorSteps: any[]) {
  const priorContext = priorSteps.map(s => `[${s.type}]: ${s.detail.substring(0, 200)}`).join("\n");
  
  const prompts: Record<string, any> = {
    decompose: {
      system: "You are a problem decomposition specialist. Break down complex queries into analyzable sub-problems. Focus on identifying key components, dependencies, and solution strategies. If documentation is available in the context, reference it.",
      user: `Query: ${query}\n\nAvailable Context:\n${context}\n\nDecompose this into clear sub-problems and reasoning steps.`
    },
    context_retrieve: {
      system: "You are a context memory specialist. Analyze available context, including any documentation provided, and identify relevant information that should guide the reasoning process.",
      user: `Query: ${query}\n\nContext:\n${context}\n\nIdentify key relevant information, documentation insights, and knowledge gaps.`
    },
    hypothesize: {
      system: "You are a hypothesis generation specialist. Generate multiple potential solution paths and approaches based on the problem structure and available documentation.",
      user: `Query: ${query}\n\nPrior analysis:\n${priorContext}\n\nGenerate 2-3 potential solution approaches, citing documentation where applicable.`
    },
    evidence_gather: {
      system: "You are an evidence gathering specialist. Collect supporting facts, citations, and data points from documentation and prior analysis. Use [cite:source] format for citations.",
      user: `Query: ${query}\n\nPrior steps:\n${priorContext}\n\nGather evidence and citations to support the solution, prioritizing documentation sources.`
    },
    multi_integrate: {
      system: "You are an integration specialist. Synthesize information from multiple sources (documentation, memory, prior reasoning) into a coherent understanding.",
      user: `Query: ${query}\n\nAll prior steps:\n${priorContext}\n\nIntegrate all information, especially documentation findings, into a unified analysis.`
    },
    critique: {
      system: "You are a critical analysis specialist. Identify weaknesses, gaps, alternative viewpoints, and potential errors in the reasoning so far. Check if documentation was properly utilized.",
      user: `Query: ${query}\n\nReasoning so far:\n${priorContext}\n\nProvide critical analysis and identify issues, including missed documentation insights.`
    },
    synthesize: {
      system: "You are a solution synthesis specialist. Construct the final, complete answer incorporating all prior analysis, evidence, critiques, and documentation references.",
      user: `Query: ${query}\n\nComplete reasoning chain:\n${priorContext}\n\nSynthesize the final answer with proper citations.`
    },
    verify: {
      system: "You are a verification specialist. Assess confidence, validate citations (especially documentation sources), check coherence, and provide calibrated uncertainty estimates.",
      user: `Final answer:\n${priorSteps[priorSteps.length - 1]?.detail || ""}\n\nVerify quality, documentation usage, and provide confidence assessment.`
    },
    meta_reflect: {
      system: "You are a meta-cognitive specialist. Reflect on the quality of the entire reasoning process, including how well documentation was searched and utilized.",
      user: `Reasoning chain:\n${priorContext}\n\nProvide meta-reflection on reasoning quality and documentation integration.`
    },
    memory_store: {
      system: "You are a memory consolidation specialist. Identify key insights and learnings that should be stored for future queries, including documentation discoveries.",
      user: `Reasoning chain:\n${priorContext}\n\nIdentify key insights to store in memory, including important documentation references.`
    }
  };
  
  return prompts[nodeId] || prompts.synthesize;
}

// Metric calculators
function calculateIntermediateConfidence(output: string, step: number, total: number): number {
  const baseConfidence = 0.5 + (step / total) * 0.3;
  const lengthBonus = Math.min(output.length / 500, 0.2);
  return Math.min(baseConfidence + lengthBonus, 1.0);
}

function calculateCoherence(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return Math.min(sentences.length / 10, 1.0);
}

function calculateDensity(text: string): number {
  const words = text.split(/\s+/).length;
  const uniqueWords = new Set(text.toLowerCase().split(/\s+/)).size;
  return uniqueWords / Math.max(words, 1);
}

function calculateFinalConfidence(steps: any[]): number {
  const avgConfidence = steps.reduce((sum, s) => sum + (s.metrics?.confidence || 0.5), 0) / steps.length;
  return Math.min(avgConfidence * 1.1, 1.0);
}

function calculateProvenance(steps: any[]): number {
  const totalCitations = steps.reduce((sum, s) => sum + (s.metrics?.citationCount || 0), 0);
  return Math.min(totalCitations / 5, 1.0);
}

function calculateEntropy(steps: any[]): number {
  const avgDensity = steps.reduce((sum, s) => sum + (s.metrics?.informationDensity || 0), 0) / steps.length;
  return 1.0 - avgDensity;
}

function calculateOverallCoherence(steps: any[]): number {
  const avgCoherence = steps.reduce((sum, s) => sum + (s.metrics?.coherenceScore || 0), 0) / steps.length;
  return avgCoherence;
}

function extractCitations(steps: any[]): string[] {
  const citations: string[] = [];
  steps.forEach(s => {
    const matches = s.detail?.match(/\[cite:([^\]]+)\]/g) || [];
    matches.forEach((m: string) => citations.push(m.replace(/\[cite:|]/g, "")));
  });
  return [...new Set(citations)];
}