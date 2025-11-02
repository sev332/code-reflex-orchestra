import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChainNode {
  id: string;
  type: 'prompt' | 'llm' | 'tool' | 'condition' | 'merge' | 'output';
  data: any;
}

interface Edge {
  source: string;
  target: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { chain } = await req.json();
    const nodes: ChainNode[] = chain.nodes;
    const edges: Edge[] = chain.edges;
    
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🔗 Executing chain with", nodes.length, "nodes");

    // Build execution graph
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const outputs = new Map<string, any>();
    const visited = new Set<string>();

    // Find starting nodes (no incoming edges)
    const targetIds = new Set(edges.map(e => e.target));
    const startNodes = nodes.filter(n => !targetIds.has(n.id));

    if (startNodes.length === 0) {
      throw new Error("No starting nodes found in chain");
    }

    // Execute chain using DFS
    const executeNode = async (nodeId: string, context: Map<string, any>): Promise<any> => {
      if (visited.has(nodeId)) return outputs.get(nodeId);
      visited.add(nodeId);

      const node = nodeMap.get(nodeId);
      if (!node) throw new Error(`Node ${nodeId} not found`);

      console.log(`▶️  Executing ${node.type} node: ${node.data.label}`);

      let result: any;

      switch (node.type) {
        case 'prompt':
          result = { text: node.data.prompt || '' };
          break;

        case 'llm': {
          // Get inputs from previous nodes
          const prevEdges = edges.filter(e => e.target === nodeId);
          let inputText = node.data.prompt || '';
          
          // Append outputs from connected nodes
          for (const edge of prevEdges) {
            const prevOutput = context.get(edge.source);
            if (prevOutput?.text) {
              inputText += '\n\n' + prevOutput.text;
            }
          }

          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${lovableApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: node.data.model || "google/gemini-2.5-flash",
              messages: [
                { role: "user", content: inputText }
              ],
              max_tokens: node.data.maxTokens || 1000,
            }),
          });

          if (!response.ok) {
            throw new Error(`LLM API error: ${response.status}`);
          }

          const data = await response.json();
          result = { text: data.choices[0].message.content };
          break;
        }

        case 'tool': {
          const toolName = node.data.toolName || 'unknown';
          const prevEdges = edges.filter(e => e.target === nodeId);
          let input = '';
          for (const edge of prevEdges) {
            const prevOutput = context.get(edge.source);
            if (prevOutput?.text) input = prevOutput.text;
          }

          // Execute tool based on name
          switch (toolName) {
            case 'code_generator':
              result = {
                text: `Generated code:\n\nfunction example() {\n  // ${input}\n  return "Generated code";\n}`,
                generatedCode: `// Generated from: ${input}\n\nfunction example() {\n  console.log("Hello from generated code!");\n  return "Success";\n}\n\nexample();`
              };
              break;
            
            case 'search':
              result = { text: `Search results for: ${input}\n- Result 1\n- Result 2\n- Result 3` };
              break;
            
            default:
              result = { text: `Tool ${toolName} executed with input: ${input}` };
          }
          break;
        }

        case 'condition': {
          const prevEdges = edges.filter(e => e.target === nodeId);
          let input = '';
          for (const edge of prevEdges) {
            const prevOutput = context.get(edge.source);
            if (prevOutput?.text) input = prevOutput.text;
          }

          const condition = node.data.condition || 'true';
          // Simple evaluation (in production, use safer evaluation)
          const conditionMet = input.toLowerCase().includes(condition.toLowerCase());
          
          result = {
            text: input,
            conditionMet,
            branch: conditionMet ? 'true' : 'false'
          };
          break;
        }

        case 'merge': {
          const prevEdges = edges.filter(e => e.target === nodeId);
          const texts: string[] = [];
          
          for (const edge of prevEdges) {
            const prevOutput = context.get(edge.source);
            if (prevOutput?.text) texts.push(prevOutput.text);
          }

          result = { text: texts.join('\n\n---\n\n') };
          break;
        }

        case 'output': {
          const prevEdges = edges.filter(e => e.target === nodeId);
          let finalText = '';
          let generatedCode = '';
          
          for (const edge of prevEdges) {
            const prevOutput = context.get(edge.source);
            if (prevOutput?.text) finalText += prevOutput.text + '\n';
            if (prevOutput?.generatedCode) generatedCode = prevOutput.generatedCode;
          }

          result = { 
            text: finalText,
            generatedCode: generatedCode || undefined
          };
          break;
        }

        default:
          result = { text: `Unknown node type: ${node.type}` };
      }

      outputs.set(nodeId, result);
      context.set(nodeId, result);

      // Execute downstream nodes
      const nextEdges = edges.filter(e => e.source === nodeId);
      for (const edge of nextEdges) {
        await executeNode(edge.target, context);
      }

      return result;
    };

    // Execute all starting nodes
    const context = new Map<string, any>();
    for (const node of startNodes) {
      await executeNode(node.id, context);
    }

    // Find output nodes
    const sourceIds = new Set(edges.map(e => e.source));
    const outputNodes = nodes.filter(n => !sourceIds.has(n.id) || n.type === 'output');

    let finalOutput = '';
    let generatedCode: string | undefined;

    for (const node of outputNodes) {
      const output = outputs.get(node.id);
      if (output) {
        if (output.text) finalOutput += output.text + '\n\n';
        if (output.generatedCode) generatedCode = output.generatedCode;
      }
    }

    console.log("✅ Chain execution complete");

    return new Response(
      JSON.stringify({
        success: true,
        output: finalOutput.trim(),
        generatedCode,
        nodesExecuted: visited.size,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Chain execution error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
