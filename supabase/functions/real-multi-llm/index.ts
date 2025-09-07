// 🔗 CONNECT: Real Multi-LLM → Production AI → Operational Intelligence
// 🧩 INTENT: Production-ready multi-LLM system with real API integrations
// ✅ SPEC: Real-Multi-LLM-v1.0

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LLMRequest {
  model: string;
  messages: Array<{role: string, content: string}>;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  system_prompt?: string;
  strategy?: 'single' | 'parallel' | 'cascade' | 'consensus';
  fallback_models?: string[];
}

interface LLMResponse {
  id: string;
  model: string;
  provider: string;
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  finish_reason: string;
  response_time: number;
  cost: number;
}

interface MultiLLMResponse {
  strategy: string;
  primary_response: LLMResponse;
  all_responses: LLMResponse[];
  consensus?: string;
  total_cost: number;
  total_time: number;
  success: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const requestBody: LLMRequest = await req.json();
    const startTime = Date.now();

    // Validate request
    if (!requestBody.model || !requestBody.messages) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: model and messages'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let result: MultiLLMResponse;

    switch (requestBody.strategy || 'single') {
      case 'single':
        result = await handleSingleLLM(requestBody);
        break;
      case 'parallel':
        result = await handleParallelLLM(requestBody);
        break;
      case 'cascade':
        result = await handleCascadeLLM(requestBody);
        break;
      case 'consensus':
        result = await handleConsensusLLM(requestBody);
        break;
      default:
        throw new Error(`Unknown strategy: ${requestBody.strategy}`);
    }

    // Store conversation in database
    await storeConversation(supabase, requestBody, result);

    // Log system event
    await supabase.from('system_events').insert({
      event_type: 'llm_request',
      severity: 'info',
      title: `Multi-LLM Request: ${requestBody.strategy || 'single'}`,
      data: {
        model: requestBody.model,
        strategy: requestBody.strategy,
        response_time: result.total_time,
        cost: result.total_cost,
        success: result.success
      }
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Multi-LLM request failed:', error);
    
    return new Response(JSON.stringify({
      error: error.message,
      strategy: 'error',
      success: false,
      total_time: Date.now(),
      total_cost: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// 🔗 CONNECT: Single LLM → Direct API → Model Response
// 🧩 INTENT: Handle single LLM requests with provider-specific logic
// ✅ SPEC: Single-LLM-Handler-v1.0
async function handleSingleLLM(request: LLMRequest): Promise<MultiLLMResponse> {
  const startTime = Date.now();
  
  try {
    const response = await callLLMAPI(request.model, request);
    const totalTime = Date.now() - startTime;
    
    return {
      strategy: 'single',
      primary_response: response,
      all_responses: [response],
      total_cost: response.cost,
      total_time: totalTime,
      success: true
    };
  } catch (error) {
    console.error('Single LLM call failed:', error);
    throw error;
  }
}

// 🔗 CONNECT: Parallel LLM → Concurrent Processing → Best Response Selection
// 🧩 INTENT: Execute multiple LLMs in parallel and select best response
// ✅ SPEC: Parallel-LLM-Handler-v1.0
async function handleParallelLLM(request: LLMRequest): Promise<MultiLLMResponse> {
  const startTime = Date.now();
  const models = [request.model, ...(request.fallback_models || [])];
  
  try {
    // Execute all models in parallel
    const promises = models.map(async (model) => {
      try {
        return await callLLMAPI(model, { ...request, model });
      } catch (error) {
        console.error(`Model ${model} failed:`, error);
        return null;
      }
    });
    
    const responses = (await Promise.all(promises)).filter(r => r !== null) as LLMResponse[];
    
    if (responses.length === 0) {
      throw new Error('All models failed');
    }
    
    // Select best response based on scoring
    const bestResponse = selectBestResponse(responses);
    const totalTime = Date.now() - startTime;
    const totalCost = responses.reduce((sum, r) => sum + r.cost, 0);
    
    return {
      strategy: 'parallel',
      primary_response: bestResponse,
      all_responses: responses,
      total_cost: totalCost,
      total_time: totalTime,
      success: true
    };
  } catch (error) {
    console.error('Parallel LLM execution failed:', error);
    throw error;
  }
}

// 🔗 CONNECT: Cascade LLM → Fallback Strategy → Reliability Enhancement
// 🧩 INTENT: Try models in sequence until one succeeds (reliability strategy)
// ✅ SPEC: Cascade-LLM-Handler-v1.0
async function handleCascadeLLM(request: LLMRequest): Promise<MultiLLMResponse> {
  const startTime = Date.now();
  const models = [request.model, ...(request.fallback_models || [])];
  const responses: LLMResponse[] = [];
  
  for (const model of models) {
    try {
      const response = await callLLMAPI(model, { ...request, model });
      responses.push(response);
      
      const totalTime = Date.now() - startTime;
      
      return {
        strategy: 'cascade',
        primary_response: response,
        all_responses: responses,
        total_cost: responses.reduce((sum, r) => sum + r.cost, 0),
        total_time: totalTime,
        success: true
      };
    } catch (error) {
      console.error(`Cascade model ${model} failed:`, error);
      continue;
    }
  }
  
  throw new Error('All cascade models failed');
}

// 🔗 CONNECT: Consensus LLM → Multiple Validation → Truth Convergence
// 🧩 INTENT: Get consensus from multiple models for high-stakes decisions
// ✅ SPEC: Consensus-LLM-Handler-v1.0
async function handleConsensusLLM(request: LLMRequest): Promise<MultiLLMResponse> {
  const startTime = Date.now();
  const models = [request.model, ...(request.fallback_models || [])].slice(0, 3); // Limit to 3 for consensus
  
  try {
    const promises = models.map(model => callLLMAPI(model, { ...request, model }));
    const responses = await Promise.all(promises);
    
    // Calculate consensus
    const consensus = calculateConsensus(responses);
    const primaryResponse = selectBestResponse(responses);
    const totalTime = Date.now() - startTime;
    const totalCost = responses.reduce((sum, r) => sum + r.cost, 0);
    
    return {
      strategy: 'consensus',
      primary_response: primaryResponse,
      all_responses: responses,
      consensus,
      total_cost: totalCost,
      total_time: totalTime,
      success: true
    };
  } catch (error) {
    console.error('Consensus LLM execution failed:', error);
    throw error;
  }
}

// 🔗 CONNECT: LLM API Router → Provider Selection → API Integration
// 🧩 INTENT: Route requests to appropriate LLM provider with proper authentication
// ✅ SPEC: LLM-API-Router-v1.0
async function callLLMAPI(model: string, request: LLMRequest): Promise<LLMResponse> {
  const startTime = Date.now();
  let provider: string;
  let apiKey: string;
  let endpoint: string;
  let requestBody: any;
  
  // Determine provider and configuration
  if (model.startsWith('gpt-') || model.includes('openai')) {
    provider = 'openai';
    apiKey = Deno.env.get('OPENAI_API_KEY') ?? '';
    endpoint = 'https://api.openai.com/v1/chat/completions';
    
    requestBody = {
      model: model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_completion_tokens: request.max_tokens ?? 2000,
      stream: false
    };
    
    // Handle newer models that don't support temperature
    if (model.includes('gpt-5') || model.includes('o3') || model.includes('o4')) {
      delete requestBody.temperature;
    } else {
      requestBody.max_tokens = requestBody.max_completion_tokens;
      delete requestBody.max_completion_tokens;
    }
    
  } else if (model.startsWith('claude-')) {
    provider = 'anthropic';
    apiKey = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
    endpoint = 'https://api.anthropic.com/v1/messages';
    
    requestBody = {
      model: model,
      messages: request.messages.filter(m => m.role !== 'system'),
      system: request.messages.find(m => m.role === 'system')?.content || request.system_prompt,
      max_tokens: request.max_tokens ?? 2000,
      temperature: request.temperature ?? 0.7
    };
    
  } else if (model.startsWith('gemini-')) {
    provider = 'google';
    apiKey = Deno.env.get('GOOGLE_AI_API_KEY') ?? '';
    endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    
    const contents = request.messages.map(m => ({
      parts: [{ text: m.content }],
      role: m.role === 'assistant' ? 'model' : 'user'
    }));
    
    requestBody = {
      contents,
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.max_tokens ?? 2000
      }
    };
    
  } else if (model.startsWith('llama')) {
    provider = 'cerebras';
    apiKey = Deno.env.get('CEREBRAS_API_KEY') ?? '';
    endpoint = 'https://api.cerebras.ai/v1/chat/completions';
    
    requestBody = {
      model: model,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? 2000,
      stream: false
    };
    
  } else {
    throw new Error(`Unsupported model: ${model}`);
  }
  
  if (!apiKey) {
    throw new Error(`API key not configured for ${provider}`);
  }
  
  // Make API call
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (provider === 'openai' || provider === 'cerebras') {
    headers['Authorization'] = `Bearer ${apiKey}`;
  } else if (provider === 'anthropic') {
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
  } else if (provider === 'google') {
    headers['x-goog-api-key'] = apiKey;
  }
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`${provider} API error:`, errorText);
    throw new Error(`${provider} API error: ${response.status} - ${errorText}`);
  }
  
  const data = await response.json();
  const responseTime = Date.now() - startTime;
  
  // Parse response based on provider
  let content: string;
  let usage: any;
  let finishReason: string;
  
  if (provider === 'openai' || provider === 'cerebras') {
    content = data.choices[0]?.message?.content || '';
    usage = data.usage;
    finishReason = data.choices[0]?.finish_reason || 'stop';
  } else if (provider === 'anthropic') {
    content = data.content[0]?.text || '';
    usage = data.usage;
    finishReason = data.stop_reason || 'stop_sequence';
  } else if (provider === 'google') {
    content = data.candidates[0]?.content?.parts[0]?.text || '';
    usage = {
      prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
      completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
      total_tokens: data.usageMetadata?.totalTokenCount || 0
    };
    finishReason = data.candidates[0]?.finishReason || 'STOP';
  } else {
    throw new Error('Unknown provider response format');
  }
  
  // Calculate cost (simplified)
  const cost = calculateCost(provider, usage);
  
  return {
    id: `${model}_${Date.now()}`,
    model,
    provider,
    content,
    usage: usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    finish_reason: finishReason,
    response_time: responseTime,
    cost
  };
}

// 🔗 CONNECT: Response Selection → Quality Scoring → Best Response
// 🧩 INTENT: Select best response based on multiple quality factors
// ✅ SPEC: Response-Selection-v1.0
function selectBestResponse(responses: LLMResponse[]): LLMResponse {
  if (responses.length === 1) return responses[0];
  
  return responses.reduce((best, current) => {
    const bestScore = calculateResponseScore(best);
    const currentScore = calculateResponseScore(current);
    return currentScore > bestScore ? current : best;
  });
}

function calculateResponseScore(response: LLMResponse): number {
  let score = 0;
  
  // Content length factor (prefer substantial responses)
  score += Math.min(response.content.length / 100, 10) * 0.3;
  
  // Response time factor (prefer faster responses)
  score += (5000 / Math.max(response.response_time, 100)) * 0.2;
  
  // Cost efficiency factor (prefer lower cost)
  score += (1 / Math.max(response.cost + 0.001, 0.001)) * 0.2;
  
  // Finish reason factor (prefer complete responses)
  if (response.finish_reason === 'stop') score += 3;
  
  // Provider reliability factor
  const providerScores = {
    'openai': 1.0,
    'anthropic': 0.95,
    'google': 0.9,
    'cerebras': 0.85
  };
  score += (providerScores[response.provider as keyof typeof providerScores] || 0.8) * 0.3;
  
  return score;
}

// 🔗 CONNECT: Consensus Calculation → Response Analysis → Agreement Detection
// 🧩 INTENT: Calculate consensus among multiple LLM responses
// ✅ SPEC: Consensus-Calculation-v1.0
function calculateConsensus(responses: LLMResponse[]): string {
  if (responses.length < 2) return responses[0]?.content || '';
  
  // Simple consensus: find common themes/phrases
  const contents = responses.map(r => r.content.toLowerCase());
  const words = contents.flatMap(content => content.split(/\s+/));
  const wordCounts = new Map<string, number>();
  
  // Count word frequencies
  for (const word of words) {
    if (word.length > 3) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
  }
  
  // Find consensus phrases (words that appear in multiple responses)
  const consensusWords = Array.from(wordCounts.entries())
    .filter(([_, count]) => count > 1)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 10)
    .map(([word, _]) => word);
  
  return consensusWords.length > 0 
    ? `Consensus themes: ${consensusWords.join(', ')}`
    : 'No clear consensus found';
}

// 🔗 CONNECT: Cost Calculation → Usage Tracking → Financial Monitoring
// 🧩 INTENT: Calculate API costs for financial tracking and optimization
// ✅ SPEC: Cost-Calculation-v1.0
function calculateCost(provider: string, usage: any): number {
  const pricing = {
    openai: { input: 0.005, output: 0.015 },
    anthropic: { input: 0.003, output: 0.015 },
    google: { input: 0.00125, output: 0.005 },
    cerebras: { input: 0.0001, output: 0.0001 }
  };
  
  const rates = pricing[provider as keyof typeof pricing] || { input: 0.001, output: 0.002 };
  
  const inputCost = (usage.prompt_tokens || 0) * rates.input / 1000;
  const outputCost = (usage.completion_tokens || 0) * rates.output / 1000;
  
  return inputCost + outputCost;
}

// 🔗 CONNECT: Conversation Storage → Database Persistence → Audit Trail
// 🧩 INTENT: Store conversation data for analysis and audit purposes
// ✅ SPEC: Conversation-Storage-v1.0
async function storeConversation(supabase: any, request: LLMRequest, response: MultiLLMResponse) {
  try {
    // Create conversation record
    const { data: conversation } = await supabase
      .from('conversations')
      .insert({
        session_id: crypto.randomUUID(),
        title: `${request.strategy || 'single'} LLM Request`,
        context: {
          strategy: request.strategy,
          model: request.model,
          fallback_models: request.fallback_models,
          parameters: {
            temperature: request.temperature,
            max_tokens: request.max_tokens
          }
        }
      })
      .select()
      .single();
    
    if (conversation) {
      // Store messages
      const messages = [
        ...request.messages.map(msg => ({
          conversation_id: conversation.id,
          role: msg.role,
          content: msg.content,
          message_type: 'text' as const,
          metadata: { source: 'user_input' }
        })),
        {
          conversation_id: conversation.id,
          role: 'assistant' as const,
          content: response.primary_response.content,
          message_type: 'text' as const,
          metadata: {
            source: 'llm_response',
            model: response.primary_response.model,
            provider: response.primary_response.provider,
            strategy: response.strategy,
            cost: response.total_cost,
            response_time: response.total_time,
            all_responses: response.all_responses.length
          }
        }
      ];
      
      await supabase.from('messages').insert(messages);
    }
  } catch (error) {
    console.error('Failed to store conversation:', error);
  }
}