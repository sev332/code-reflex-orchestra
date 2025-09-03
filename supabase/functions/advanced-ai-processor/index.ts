import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIRequest {
  type: 'reasoning' | 'creative' | 'analytical' | 'memory_search';
  prompt: string;
  context?: any;
  model_preference?: string;
  priority?: number;
}

interface ModelResponse {
  content: string;
  confidence: number;
  processing_time: number;
  model_used: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const aiRequest: AIRequest = await req.json();
    const startTime = Date.now();

    // Intelligent model selection based on task type
    const selectedModel = selectOptimalModel(aiRequest.type, aiRequest.priority);
    
    // Process the request with the selected AI model
    const response = await processWithAI(aiRequest, selectedModel);
    
    const processingTime = Date.now() - startTime;

    // Store the interaction in memory for learning
    await storeInteraction(supabase, aiRequest, response, processingTime);

    // Log system event
    await supabase
      .from('system_events')
      .insert({
        event_type: 'ai_processing',
        title: `AI processing completed`,
        description: `Processed ${aiRequest.type} request using ${selectedModel}`,
        data: {
          processing_time: processingTime,
          model: selectedModel,
          confidence: response.confidence
        },
        severity: 'info'
      });

    return new Response(JSON.stringify({
      success: true,
      response: response.content,
      confidence: response.confidence,
      model_used: selectedModel,
      processing_time: processingTime
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Advanced AI processing error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: 'Advanced AI processing failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function selectOptimalModel(type: string, priority?: number): string {
  // Intelligent model routing based on task type and priority
  switch (type) {
    case 'reasoning':
      return priority && priority >= 8 ? 'o3-2025-04-16' : 'gpt-5-2025-08-07';
    case 'creative':
      return 'gpt-5-2025-08-07';
    case 'analytical':
      return 'o4-mini-2025-04-16';
    case 'memory_search':
      return 'gpt-5-mini-2025-08-07';
    default:
      return 'gpt-4.1-2025-04-14';
  }
}

async function processWithAI(request: AIRequest, model: string): Promise<ModelResponse> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Enhanced prompt with system context
  const systemPrompt = buildSystemPrompt(request.type);
  
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: request.prompt }
  ];

  // Add context if provided
  if (request.context) {
    messages.splice(1, 0, {
      role: 'user', 
      content: `Context: ${JSON.stringify(request.context)}`
    });
  }

  const requestBody: any = {
    model,
    messages,
    max_completion_tokens: 4000
  };

  // Only add temperature for legacy models
  if (model.includes('gpt-4o')) {
    requestBody.temperature = 0.7;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    content: data.choices[0].message.content,
    confidence: calculateConfidence(data.choices[0], request.type),
    processing_time: 0, // Will be set by caller
    model_used: model
  };
}

function buildSystemPrompt(type: string): string {
  const basePrompt = "You are part of WisdomNET, an advanced AGI system. ";
  
  switch (type) {
    case 'reasoning':
      return basePrompt + "Focus on logical analysis, step-by-step reasoning, and providing well-structured solutions. Break down complex problems systematically.";
    case 'creative':
      return basePrompt + "Think creatively and innovatively. Provide original ideas, alternative approaches, and imaginative solutions.";
    case 'analytical':
      return basePrompt + "Perform deep analysis, identify patterns, extract insights, and provide data-driven conclusions.";
    case 'memory_search':
      return basePrompt + "Help retrieve and synthesize relevant information from the knowledge base. Focus on accuracy and relevance.";
    default:
      return basePrompt + "Provide helpful, accurate, and contextually appropriate responses.";
  }
}

function calculateConfidence(choice: any, type: string): number {
  // Simple confidence calculation based on response characteristics
  const baseConfidence = 0.8;
  
  // Adjust based on finish reason
  if (choice.finish_reason === 'stop') {
    return Math.min(0.95, baseConfidence + 0.1);
  } else if (choice.finish_reason === 'length') {
    return Math.max(0.6, baseConfidence - 0.1);
  }
  
  return baseConfidence;
}

async function storeInteraction(
  supabase: any, 
  request: AIRequest, 
  response: ModelResponse, 
  processingTime: number
) {
  try {
    await supabase
      .from('memory_entries')
      .insert({
        content: `Request: ${request.prompt}\nResponse: ${response.content}`,
        entry_type: 'conversation',
        source: 'advanced-ai-processor',
        tags: [request.type, response.model_used],
        importance_score: response.confidence,
        metadata: {
          processing_time: processingTime,
          model: response.model_used,
          request_type: request.type,
          confidence: response.confidence
        }
      });
  } catch (error) {
    console.error('Failed to store interaction:', error);
  }
}