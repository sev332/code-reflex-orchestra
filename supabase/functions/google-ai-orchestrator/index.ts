import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, prompt, messages, options, image_data } = await req.json();
    const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
    
    if (!GOOGLE_AI_API_KEY) {
      throw new Error('GOOGLE_AI_API_KEY not configured');
    }

    const startTime = Date.now();

    // Handle different actions
    switch (action) {
      case 'image_generation':
        return await generateImage(prompt, options, GOOGLE_AI_API_KEY, startTime);
      
      case 'video_generation':
        return await generateVideo(prompt, options, GOOGLE_AI_API_KEY, startTime);
      
      case 'vision_analysis':
        return await analyzeVision(image_data, prompt, options, GOOGLE_AI_API_KEY, startTime);
      
      case 'chat':
        return await chat(prompt, messages, options, GOOGLE_AI_API_KEY, startTime);
      
      case 'smart_routing':
        // Automatically route to the best model/action
        if (image_data) {
          return await analyzeVision(image_data, prompt, options, GOOGLE_AI_API_KEY, startTime);
        } else if (prompt.toLowerCase().includes('generate video') || prompt.toLowerCase().includes('create video')) {
          return await generateVideo(prompt, options, GOOGLE_AI_API_KEY, startTime);
        } else if (prompt.toLowerCase().includes('generate') || prompt.toLowerCase().includes('create image')) {
          return await generateImage(prompt, options, GOOGLE_AI_API_KEY, startTime);
        } else {
          return await chat(prompt, messages, options, GOOGLE_AI_API_KEY, startTime);
        }
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    console.error('Google AI Orchestrator error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function generateImage(
  prompt: string, 
  options: any, 
  apiKey: string, 
  startTime: number
) {
  try {
    console.log('🎨 Generating image with Gemini...');
    
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate a high-quality image: ${prompt}. Be creative and detailed.`
            }]
          }],
          generationConfig: {
            temperature: options?.temperature || 1.0,
            maxOutputTokens: options?.max_tokens || 8192,
            responseModalities: ["image"],
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      
      // Parse error to provide better user feedback
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message?.includes('API key expired') || errorData.error?.message?.includes('API_KEY_INVALID')) {
          throw new Error('Google AI API key is invalid or expired. Please update your GOOGLE_AI_API_KEY secret.');
        }
      } catch (parseError) {
        // If parsing fails, use generic error
      }
      
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Gemini response received');
    
    // Extract images from response
    const images: string[] = [];
    const parts = data.candidates?.[0]?.content?.parts || [];
    
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mimeType = part.inlineData.mimeType || 'image/png';
        images.push(`data:${mimeType};base64,${part.inlineData.data}`);
      }
    }

    const processingTime = Date.now() - startTime;
    
    return new Response(
      JSON.stringify({
        success: true,
        images,
        content: `Generated ${images.length} image(s)`,
        model_used: 'gemini-2.0-flash-exp',
        processing_time: processingTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Image generation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function analyzeVision(
  imageData: string,
  prompt: string,
  options: any,
  apiKey: string,
  startTime: number
) {
  try {
    // Extract base64 data if it's a data URL
    let base64Data = imageData;
    let mimeType = 'image/png';
    
    if (imageData.startsWith('data:')) {
      const matches = imageData.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        base64Data = matches[2];
      }
    }

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: base64Data
                }
              }
            ]
          }]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No analysis available';
    
    const processingTime = Date.now() - startTime;
    
    return new Response(
      JSON.stringify({
        success: true,
        content,
        model_used: 'gemini-2.5-flash',
        processing_time: processingTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function generateVideo(
  prompt: string,
  options: any,
  apiKey: string,
  startTime: number
) {
  try {
    console.log('🎬 Generating video with Gemini...');
    
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate a video: ${prompt}. Create an engaging, high-quality video sequence.`
            }]
          }],
          generationConfig: {
            temperature: options?.temperature || 1.0,
            maxOutputTokens: options?.max_tokens || 8192,
            responseModalities: ["video"],
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      
      // Parse error to provide better user feedback
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message?.includes('API key expired') || errorData.error?.message?.includes('API_KEY_INVALID')) {
          throw new Error('Google AI API key is invalid or expired. Please update your GOOGLE_AI_API_KEY secret.');
        }
      } catch (parseError) {
        // If parsing fails, use generic error
      }
      
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Video generation response received');
    
    // Extract video from response
    const videos: string[] = [];
    const parts = data.candidates?.[0]?.content?.parts || [];
    
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mimeType = part.inlineData.mimeType || 'video/mp4';
        videos.push(`data:${mimeType};base64,${part.inlineData.data}`);
      }
    }

    const processingTime = Date.now() - startTime;
    
    return new Response(
      JSON.stringify({
        success: true,
        videos,
        content: `Generated ${videos.length} video(s)`,
        model_used: 'gemini-2.0-flash-exp',
        processing_time: processingTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Video generation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function chat(
  prompt: string,
  messages: any[] | undefined,
  options: any,
  apiKey: string,
  startTime: number
) {
  try {
    const contents = messages?.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    })) || [{ role: 'user', parts: [{ text: prompt }] }];

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: options?.temperature || 0.9,
            maxOutputTokens: options?.max_tokens || 8192,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    
    const processingTime = Date.now() - startTime;
    
    return new Response(
      JSON.stringify({
        success: true,
        content,
        model_used: 'gemini-2.5-pro',
        processing_time: processingTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
