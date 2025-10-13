import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GoogleAIOptions {
  temperature?: number;
  max_tokens?: number;
  aspectRatio?: string;
  numberOfImages?: number;
}

interface GoogleAIResult {
  success: boolean;
  content?: string;
  images?: string[];
  videos?: string[];
  model_used?: string;
  processing_time?: number;
  error?: string;
}

export const useGoogleAI = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<GoogleAIResult | null>(null);

  const chat = async (
    prompt: string,
    messages?: Array<{ role: string; content: string }>,
    options?: GoogleAIOptions
  ): Promise<GoogleAIResult> => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-ai-orchestrator', {
        body: {
          action: 'chat',
          prompt,
          messages,
          options
        }
      });

      if (error) throw error;
      
      setLastResult(data);
      return data;
    } catch (error: any) {
      console.error('Google AI chat error:', error);
      const errorResult = {
        success: false,
        error: error.message
      };
      setLastResult(errorResult);
      toast.error(`Chat failed: ${error.message}`);
      return errorResult;
    } finally {
      setIsProcessing(false);
    }
  };

  const generateImage = async (
    prompt: string,
    options?: GoogleAIOptions
  ): Promise<GoogleAIResult> => {
    setIsProcessing(true);
    try {
      console.log('🎨 Generating image:', prompt);
      
      const { data, error } = await supabase.functions.invoke('google-ai-orchestrator', {
        body: {
          action: 'image_generation',
          prompt,
          options
        }
      });

      if (error) throw error;
      
      console.log('✅ Image generation result:', data);
      setLastResult(data);
      
      if (data.success && data.images && data.images.length > 0) {
        toast.success(`Generated ${data.images.length} image(s)!`);
      } else if (!data.success && data.error) {
        toast.error(`Image generation failed: ${data.error}`);
      }
      
      return data;
    } catch (error: any) {
      console.error('Image generation error:', error);
      const errorResult = {
        success: false,
        error: error.message
      };
      setLastResult(errorResult);
      toast.error(`Image generation failed: ${error.message}`);
      return errorResult;
    } finally {
      setIsProcessing(false);
    }
  };

  const analyzeImage = async (
    imageData: string,
    prompt?: string,
    options?: GoogleAIOptions
  ): Promise<GoogleAIResult> => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-ai-orchestrator', {
        body: {
          action: 'vision_analysis',
          image_data: imageData,
          prompt: prompt || 'Analyze this image in detail',
          options
        }
      });

      if (error) throw error;
      
      setLastResult(data);
      return data;
    } catch (error: any) {
      console.error('Vision analysis error:', error);
      const errorResult = {
        success: false,
        error: error.message
      };
      setLastResult(errorResult);
      toast.error(`Vision analysis failed: ${error.message}`);
      return errorResult;
    } finally {
      setIsProcessing(false);
    }
  };

  const generateVideo = async (
    prompt: string,
    options?: GoogleAIOptions
  ): Promise<GoogleAIResult> => {
    setIsProcessing(true);
    try {
      console.log('🎬 Generating video:', prompt);
      
      const { data, error } = await supabase.functions.invoke('google-ai-orchestrator', {
        body: {
          action: 'video_generation',
          prompt,
          options
        }
      });

      if (error) throw error;
      
      console.log('✅ Video generation result:', data);
      setLastResult(data);
      
      if (data.success && data.videos && data.videos.length > 0) {
        toast.success(`Generated ${data.videos.length} video(s)!`);
      } else if (!data.success && data.error) {
        toast.error(`Video generation failed: ${data.error}`);
      }
      
      return data;
    } catch (error: any) {
      console.error('Video generation error:', error);
      const errorResult = {
        success: false,
        error: error.message
      };
      setLastResult(errorResult);
      toast.error(`Video generation failed: ${error.message}`);
      return errorResult;
    } finally {
      setIsProcessing(false);
    }
  };

  const smartRoute = async (
    prompt: string,
    imageData?: string,
    options?: GoogleAIOptions
  ): Promise<GoogleAIResult> => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-ai-orchestrator', {
        body: {
          action: 'smart_routing',
          prompt,
          image_data: imageData,
          options
        }
      });

      if (error) throw error;
      
      setLastResult(data);
      return data;
    } catch (error: any) {
      console.error('Smart routing error:', error);
      const errorResult = {
        success: false,
        error: error.message
      };
      setLastResult(errorResult);
      toast.error(`Request failed: ${error.message}`);
      return errorResult;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    lastResult,
    chat,
    generateImage,
    generateVideo,
    analyzeImage,
    smartRoute
  };
};
