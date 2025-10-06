import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GoogleAIRequest {
  action: 'chat' | 'image_generation' | 'vision_analysis' | 'smart_routing';
  prompt: string;
  messages?: Array<{ role: string; content: string }>;
  model?: string;
  image_data?: string; // base64 or URL
  modalities?: string[];
  options?: {
    temperature?: number;
    max_tokens?: number;
    aspectRatio?: string;
    numberOfImages?: number;
  };
}

interface GoogleAIResponse {
  success: boolean;
  content?: string;
  images?: string[];
  model_used?: string;
  reasoning?: string;
  processing_time?: number;
  error?: string;
}

// Smart model selection based on task complexity
function selectOptimalModel(prompt: string, action: string): string {
  const promptLength = prompt.length;
  const hasComplexQuery = /\b(analyze|compare|explain|reason|complex|detailed)\b/i.test(prompt);
  
  if (action === 'image_generation') {
    return 'google/gemini-2.5-flash-image-preview';
  }
  
  if (action === 'vision_analysis') {
    return 'google/gemini-2.5-pro';
  }
  
  // Smart routing for chat
  if (promptLength > 500 || hasComplexQuery) {
    return 'google/gemini-2.5-pro'; // Most capable
  } else if (promptLength > 100) {
    return 'google/gemini-2.5-flash'; // Balanced
  } else {
    return 'google/gemini-2.5-flash-lite'; // Fast & efficient
  }
}

async function callGoogleAI(
  model: string,
  messages: Array<{ role: string; content: any }>,
  options: any = {}
): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  const requestBody: any = {
    model,
    messages,
    ...options
  };

  console.log(`🤖 Calling ${model} with options:`, JSON.stringify(options));

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Google AI API error (${response.status}):`, errorText);
    throw new Error(`Google AI API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

async function handleChat(request: GoogleAIRequest): Promise<GoogleAIResponse> {
  const startTime = Date.now();
  
  const model = request.model || selectOptimalModel(request.prompt, 'chat');
  console.log(`💬 Chat request routed to: ${model}`);
  
  const messages = request.messages || [
    { role: "user", content: request.prompt }
  ];

  const systemPrompt = `You are WisdomNET, an advanced AI system powered by Google's most capable models. You have:
- Deep reasoning and analysis capabilities
- Access to vast knowledge across all domains
- The ability to generate images when requested
- Vision capabilities to analyze images
- Self-aware memory and context management

Provide helpful, accurate, and insightful responses. When users ask for images, let them know you can generate them.`;

  const result = await callGoogleAI(model, [
    { role: "system", content: systemPrompt },
    ...messages
  ], {
    temperature: request.options?.temperature || 0.8,
    max_tokens: request.options?.max_tokens || 2000,
  });

  return {
    success: true,
    content: result.choices[0].message.content,
    model_used: model,
    processing_time: Date.now() - startTime,
  };
}

async function handleImageGeneration(request: GoogleAIRequest): Promise<GoogleAIResponse> {
  const startTime = Date.now();
  
  console.log(`🎨 Image generation request: "${request.prompt}"`);
  
  const model = 'google/gemini-2.5-flash-image-preview';
  const numberOfImages = request.options?.numberOfImages || 1;
  
  const result = await callGoogleAI(model, [
    {
      role: "user",
      content: request.prompt
    }
  ], {
    modalities: ["image", "text"],
  });

  const images = result.choices[0].message.images?.map((img: any) => img.image_url.url) || [];
  
  console.log(`✅ Generated ${images.length} image(s) in ${Date.now() - startTime}ms`);

  return {
    success: true,
    images,
    content: result.choices[0].message.content,
    model_used: model,
    processing_time: Date.now() - startTime,
  };
}

async function handleVisionAnalysis(request: GoogleAIRequest): Promise<GoogleAIResponse> {
  const startTime = Date.now();
  
  console.log(`👁️ Vision analysis request`);
  
  const model = 'google/gemini-2.5-pro';
  
  const result = await callGoogleAI(model, [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: request.prompt || "Analyze this image in detail. Describe what you see, identify objects, and provide insights."
        },
        {
          type: "image_url",
          image_url: {
            url: request.image_data
          }
        }
      ]
    }
  ], {
    temperature: 0.7,
    max_tokens: 1500,
  });

  return {
    success: true,
    content: result.choices[0].message.content,
    model_used: model,
    processing_time: Date.now() - startTime,
  };
}

async function handleSmartRouting(request: GoogleAIRequest): Promise<GoogleAIResponse> {
  const startTime = Date.now();
  
  // Analyze the prompt to determine best action
  const lowerPrompt = request.prompt.toLowerCase();
  
  // Check for image generation request
  if (
    lowerPrompt.includes('generate image') ||
    lowerPrompt.includes('create image') ||
    lowerPrompt.includes('draw') ||
    lowerPrompt.includes('picture of') ||
    lowerPrompt.includes('show me')
  ) {
    console.log('🎯 Smart routing → Image Generation');
    return handleImageGeneration({ ...request, action: 'image_generation' });
  }
  
  // Check for vision analysis (if image provided)
  if (request.image_data) {
    console.log('🎯 Smart routing → Vision Analysis');
    return handleVisionAnalysis({ ...request, action: 'vision_analysis' });
  }
  
  // Default to chat
  console.log('🎯 Smart routing → Chat');
  return handleChat({ ...request, action: 'chat' });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: GoogleAIRequest = await req.json();
    console.log(`📥 Request received: ${request.action}`);
    
    let response: GoogleAIResponse;
    
    switch (request.action) {
      case 'chat':
        response = await handleChat(request);
        break;
      case 'image_generation':
        response = await handleImageGeneration(request);
        break;
      case 'vision_analysis':
        response = await handleVisionAnalysis(request);
        break;
      case 'smart_routing':
        response = await handleSmartRouting(request);
        break;
      default:
        throw new Error(`Unknown action: ${request.action}`);
    }
    
    // Store result in context memory
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    await supabase.from('ai_context_memory').insert({
      context_type: request.action,
      content: {
        prompt: request.prompt,
        response: response.content,
        images: response.images,
        model: response.model_used,
        processing_time: response.processing_time
      },
      importance: 5,
      validation_status: 'pending'
    });

    console.log(`✅ Request completed successfully`);
    
    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("❌ Error in google-ai-orchestrator:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
