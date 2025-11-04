/**
 * Multi-LLM Engine - Routes requests to different AI providers
 * Supports Lovable AI Gateway (Gemini, GPT), Anthropic, and custom models
 */

export interface LLMConfig {
  provider: 'lovable' | 'anthropic' | 'custom';
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface MultiLLMRequest {
  provider: 'lovable' | 'anthropic' | 'custom';
  model: string;
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latency: number;
}

export class MultiLLMEngine {
  private static instance: MultiLLMEngine;
  
  private constructor() {}
  
  static getInstance(): MultiLLMEngine {
    if (!MultiLLMEngine.instance) {
      MultiLLMEngine.instance = new MultiLLMEngine();
    }
    return MultiLLMEngine.instance;
  }

  /**
   * Route LLM request to appropriate provider
   */
  async route(
    messages: LLMMessage[],
    config: LLMConfig
  ): Promise<LLMResponse> {
    const startTime = Date.now();
    
    switch (config.provider) {
      case 'lovable':
        return this.callLovableAI(messages, config, startTime);
      case 'anthropic':
        return this.callAnthropic(messages, config, startTime);
      case 'custom':
        return this.callCustomProvider(messages, config, startTime);
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  private async callLovableAI(
    messages: LLMMessage[],
    config: LLMConfig,
    startTime: number
  ): Promise<LLMResponse> {
    // Lovable AI calls should go through edge function
    // This is a client-side helper that delegates to the backend
    throw new Error('Lovable AI must be called through edge function');
  }

  private async callAnthropic(
    messages: LLMMessage[],
    config: LLMConfig,
    startTime: number
  ): Promise<LLMResponse> {
    // Anthropic calls should go through edge function
    throw new Error('Anthropic must be called through edge function');
  }

  private async callCustomProvider(
    messages: LLMMessage[],
    config: LLMConfig,
    startTime: number
  ): Promise<LLMResponse> {
    // Custom provider calls should go through edge function
    throw new Error('Custom provider must be called through edge function');
  }

  /**
   * Get available models for a provider
   */
  getAvailableModels(provider: string): string[] {
    switch (provider) {
      case 'lovable':
        return [
          'google/gemini-2.5-pro',
          'google/gemini-2.5-flash',
          'google/gemini-2.5-flash-lite',
          'openai/gpt-5',
          'openai/gpt-5-mini',
          'openai/gpt-5-nano'
        ];
      case 'anthropic':
        return [
          'claude-sonnet-4-5',
          'claude-opus-4-1-20250805',
          'claude-sonnet-4-20250514'
        ];
      case 'custom':
        return ['custom-model'];
      default:
        return [];
    }
  }

  /**
   * Select optimal model based on task type
   */
  selectOptimalModel(taskType: 'reasoning' | 'coding' | 'creative' | 'fast'): LLMConfig {
    switch (taskType) {
      case 'reasoning':
        return {
          provider: 'lovable',
          model: 'google/gemini-2.5-pro',
          temperature: 0.3,
          maxTokens: 4096
        };
      case 'coding':
        return {
          provider: 'lovable',
          model: 'openai/gpt-5',
          temperature: 0.2,
          maxTokens: 8192
        };
      case 'creative':
        return {
          provider: 'lovable',
          model: 'google/gemini-2.5-flash',
          temperature: 0.8,
          maxTokens: 2048
        };
      case 'fast':
        return {
          provider: 'lovable',
          model: 'google/gemini-2.5-flash-lite',
          temperature: 0.5,
          maxTokens: 1024
        };
    }
  }
}

export const llmEngine = MultiLLMEngine.getInstance();
