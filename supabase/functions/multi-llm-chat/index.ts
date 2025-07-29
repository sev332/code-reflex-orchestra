import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model: 'openai' | 'google' | 'cerebras';
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

async function callOpenAI(messages: ChatMessage[], temperature = 0.7, maxTokens = 2000) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGoogleAI(messages: ChatMessage[], temperature = 0.7, maxTokens = 2000) {
  const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${Deno.env.get('GOOGLE_AI_API_KEY')}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    }),
  });

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
}

async function callCerebras(messages: ChatMessage[], temperature = 0.7, maxTokens = 2000) {
  const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('CEREBRAS_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama3.1-70b',
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, model, temperature = 0.7, maxTokens = 2000, systemPrompt } = await req.json() as ChatRequest;

    // Add system prompt if provided
    const fullMessages = systemPrompt 
      ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
      : messages;

    let response: string;

    switch (model) {
      case 'openai':
        response = await callOpenAI(fullMessages, temperature, maxTokens);
        break;
      case 'google':
        response = await callGoogleAI(fullMessages, temperature, maxTokens);
        break;
      case 'cerebras':
        response = await callCerebras(fullMessages, temperature, maxTokens);
        break;
      default:
        throw new Error(`Unsupported model: ${model}`);
    }

    // Log conversation for RAG memory
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabase.from('ai_conversations').insert({
      model_used: model,
      user_message: messages[messages.length - 1]?.content,
      ai_response: response,
      temperature,
      max_tokens: maxTokens,
      created_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ 
        response,
        model_used: model,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Multi-LLM Chat Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});