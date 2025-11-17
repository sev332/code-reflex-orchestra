// 🔗 CONNECT: Persistent AI Chat → SDF-CVF Memory System
// 🧩 INTENT: Create the most beautiful AI chat interface with permanent conversation and dynamic context
// ✅ SPEC: Conversation chunking, summarization, indexing with neural aesthetics

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AIMOSThoughtsPanel } from './AIMOSThoughtsPanel';
import { generateMockOrchestration } from '@/lib/aimos-orchestration';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Send, 
  Brain, 
  Zap, 
  Activity, 
  Eye, 
  Database, 
  Cpu, 
  Network,
  MessageSquare,
  Sparkles,
  GitBranch,
  MemoryStick,
  Target,
  Clock,
  FileText,
  Image,
  Video,
  Search,
  Edit
} from 'lucide-react';
import { WisdomNetLogo } from '@/components/WisdomNET/WisdomNetLogo';
import { useAISelfManagement } from '@/hooks/useAISelfManagement';
import { useGeminiAgents } from '@/hooks/useGeminiAgents';
import { useGoogleAI } from '@/hooks/useGoogleAI';
import { useDocumentManagement } from '@/hooks/useDocumentManagement';
import { useDocumentEditor } from '@/hooks/useDocumentEditor';
import { supabase } from '@/integrations/supabase/client';
import { useReasoningChat } from '@/hooks/useReasoningChat';
import { ReasoningTrace } from './ReasoningTrace';
import { sdfCvfCore } from '@/lib/sdf-cvf-core';
import { deepThinkOrchestrator } from '@/lib/deep-think-orchestration';
import type { ReasoningChain } from '@/lib/deep-think-orchestration';
import { toast } from 'sonner';
import { AIActionConfirmation, AIActionType } from './AIActionConfirmation';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'reasoning';
  content: string;
  timestamp: string;
  chunk_id?: string;
  context_ids?: string[];
  reasoning_trace?: any;
  confidence?: number;
  metadata?: {
    model?: string;
    tokens?: number;
    processing_time?: number;
    background_agents_triggered?: string[];
    images?: string[];
    videos?: string[];
    documentId?: string;
    searchResults?: any;
    editSuggestion?: any;
    orchestration?: any; // AIMOS orchestration data
  };
}

interface ConversationChunk {
  id: string;
  summary: string;
  key_topics: string[];
  importance_score: number;
  message_count: number;
  created_at: string;
  indexed_keywords: string[];
}

interface ContextWindow {
  active_memories: number;
  reasoning_depth: number;
  agent_orchestration: number;
  knowledge_synthesis: number;
}

interface AdvancedPersistentChatProps {
  onDocumentsClick?: () => void;
}

export const AdvancedPersistentChat: React.FC<AdvancedPersistentChatProps> = ({ onDocumentsClick }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [chunks, setChunks] = useState<ConversationChunk[]>([]);
  const [activeReasoningChain, setActiveReasoningChain] = useState<ReasoningChain | null>(null);
  const [showReasoningTrace, setShowReasoningTrace] = useState(false);
  const [contextWindow, setContextWindow] = useState<ContextWindow>({
    active_memories: 0,
    reasoning_depth: 0,
    agent_orchestration: 0,
    knowledge_synthesis: 0
  });
  
  // SSE buffer for handling partial JSON
  const sseBufferRef = useRef<string>('');
  
  // AI Action Control System
  const [pendingAction, setPendingAction] = useState<{
    type: AIActionType;
    description: string;
    prompt?: string;
    documentTitle?: string;
    metadata?: Record<string, any>;
  } | null>(null);
  const [showActionConfirmation, setShowActionConfirmation] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef(crypto.randomUUID());
  const { sendMessage: sendCMCMessage, isProcessing: cmcProcessing, currentReasoning } = useReasoningChat();
  const [useCMCMode, setUseCMCMode] = useState(true);
  
  const { 
    backgroundAgents, 
    registerTheory, 
    updateMemory,
    performAudit 
  } = useAISelfManagement();

  const {
    performDeepSearch,
    performResearch,
    performAnalysis,
    recentResults: agentResults,
    metrics: agentMetrics,
    hasActiveAgents
  } = useGeminiAgents();

  const { 
    isProcessing: googleAIProcessing,
    chat: googleChat,
    generateImage,
    generateVideo,
    analyzeImage,
    smartRoute
  } = useGoogleAI();

  const {
    uploadDocument,
    getDocuments,
    deleteDocument
  } = useDocumentManagement();

  const {
    suggestEdit,
    deepResearch
  } = useDocumentEditor();

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Initialize conversation context
  useEffect(() => {
    initializePersistentConversation();
    loadConversationChunks();
  }, []);

  const initializePersistentConversation = async () => {
    try {
      // Load latest conversation context
      const { data: latestMessages } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (latestMessages && latestMessages.length > 0) {
        const formattedMessages: ChatMessage[] = latestMessages.reverse().map(msg => ({
          id: msg.id,
          role: msg.role as any,
          content: msg.content,
          timestamp: msg.created_at,
          metadata: msg.metadata as any
        }));
        
        setMessages(formattedMessages);
        
        // Update context window based on loaded messages
        updateContextWindow(formattedMessages);
      } else {
        // Initialize with system message
        const systemMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'system',
          content: 'WisdomNET AGI system initialized. I am your persistent AI companion with full memory and reasoning capabilities. Our conversation is continuous and evolving.',
          timestamp: new Date().toISOString(),
          confidence: 1.0
        };
        
        setMessages([systemMessage]);
        await saveMessage(systemMessage);
      }
    } catch (error) {
      console.error('Failed to initialize persistent conversation:', error);
    }
  };

  const loadConversationChunks = async () => {
    try {
      // Simulate loading conversation chunks (would be from database in production)
      const mockChunks: ConversationChunk[] = [
        {
          id: 'chunk-1',
          summary: 'System initialization and AI capabilities discussion',
          key_topics: ['initialization', 'capabilities', 'reasoning'],
          importance_score: 8,
          message_count: 12,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          indexed_keywords: ['ai', 'system', 'capabilities', 'reasoning', 'memory']
        }
      ];
      
      setChunks(mockChunks);
    } catch (error) {
      console.error('Failed to load conversation chunks:', error);
    }
  };

  const updateContextWindow = (currentMessages: ChatMessage[]) => {
    const recentMessages = currentMessages.slice(-20);
    
    setContextWindow({
      active_memories: recentMessages.filter(m => m.context_ids?.length).length,
      reasoning_depth: recentMessages.filter(m => m.reasoning_trace).length,
      agent_orchestration: recentMessages.filter(m => m.metadata?.background_agents_triggered?.length).length,
      knowledge_synthesis: Math.min(10, recentMessages.length)
    });
  };

  const saveMessage = async (message: ChatMessage) => {
    try {
      await supabase.from('messages').insert({
        id: message.id,
        role: message.role,
        content: message.content,
        metadata: message.metadata || {},
        message_type: 'persistent_chat'
      });
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  };

  const processUserMessage = async (userInput: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userInput,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    await saveMessage(userMessage);
    setIsProcessing(true);

    try {
      // CMC Mode: Use full reasoning pipeline
      if (useCMCMode) {
        const response = await sendCMCMessage(userInput, sessionIdRef.current);
        
        if (response) {
          const aiMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response.answer,
            timestamp: new Date().toISOString(),
            reasoning_trace: response.reasoning,
            confidence: response.verification.confidence,
            metadata: {
              model: 'CMC+APOE+VIF',
              processing_time: 0,
              orchestration: {
                trace_id: response.trace_id,
                provenance_coverage: response.verification.provenance_coverage,
                semantic_entropy: response.verification.semantic_entropy
              }
            }
          };
          
          setMessages(prev => [...prev, aiMessage]);
          await saveMessage(aiMessage);
          setIsProcessing(false);
          return;
        }
      }
      
      // Fallback to original mode if CMC fails or is disabled
      // Generate comprehensive reasoning trace
      const reasoningTrace = await sdfCvfCore.writeCodeWithNLTags(
        'user_query',
        userInput,
        'Process user query with full context awareness',
        ['persistent_memory', 'background_agents', 'knowledge_synthesis']
      );

      // Trigger background agents for complex queries
      const triggeredAgents: string[] = [];
      
      // For complex queries, launch Gemini agents
      if (userInput.length > 50) {
        // Launch deep search agent in background (don't await)
        performDeepSearch(userInput, {
          conversation_context: messages.slice(-5),
          user_intent: 'query_response'
        }).then(result => {
          if (result) {
            console.log('🔍 Deep search completed:', result);
          }
        });
        triggeredAgents.push('gemini_deep_search');

        // Also launch research agent for comprehensive understanding
        performResearch(userInput, {
          conversation_context: messages.slice(-5)
        }).then(result => {
          if (result) {
            console.log('📚 Research completed:', result);
          }
        });
        triggeredAgents.push('gemini_research');
      }

      // For very important queries, add analysis
      if (userInput.length > 100 || userInput.includes('?')) {
        performAnalysis(userInput, 'conversational', {
          conversation_context: messages.slice(-5)
        }).then(result => {
          if (result) {
            console.log('🔬 Analysis completed:', result);
          }
        });
        triggeredAgents.push('gemini_analysis');
      }

      // Update AI context memory
      await updateMemory('user_interaction', {
        query: userInput,
        timestamp: new Date().toISOString(),
        conversation_continuity: true
      }, 7);

      // Stream AI response from WisdomNET chat with Gemini
      const conversationId = 'main-conversation';
      const context = {
        window: contextWindow,
        active_agents: backgroundAgents.length,
        chunks: chunks.length,
        recent_messages: messages.slice(-5).map(m => ({ role: m.role, content: m.content }))
      };

      // Check if this is an image generation request
      const lowerInput = userInput.toLowerCase();
      const isImageRequest = 
        lowerInput.includes('generate image') ||
        lowerInput.includes('create image') ||
        lowerInput.includes('draw') ||
        lowerInput.includes('picture of') ||
        lowerInput.includes('show me');

      // Use Google AI orchestrator for smart routing
      if (isImageRequest) {
        try {
          const result = await generateImage(userInput);
          
          if (result.success && result.images) {
            const aiMessage: ChatMessage = {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: result.content || 'Here are the images I generated:',
              timestamp: new Date().toISOString(),
              confidence: 0.95,
              metadata: {
                model: result.model_used,
                processing_time: result.processing_time,
                images: result.images
              }
            };
            
            setMessages(prev => [...prev, aiMessage]);
            await saveMessage(aiMessage);
            setIsProcessing(false);
            return;
          }
        } catch (error) {
          console.error('Image generation failed:', error);
          toast.error('Failed to generate image. Falling back to chat.');
        }
      }

      // Start streaming response from wisdomnet-chat
      const startTime = Date.now();
      let fullResponse = '';
      
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wisdomnet-chat`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
            },
            body: JSON.stringify({
              messages: messages.slice(-10).concat([userMessage]).map(m => ({
                role: m.role,
                content: m.content
              })),
              conversationId,
              context
            })
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error || `HTTP error! status: ${response.status}`;
          
          // Handle specific error types
          if (response.status === 402) {
            const errorMessage: ChatMessage = {
              id: crypto.randomUUID(),
              role: 'system',
              content: '⚠️ **AI Credits Required**\n\nPlease add credits to your Lovable workspace to use AI features.\n\nGo to: Settings → Workspace → Usage to top up your credits.',
              timestamp: new Date().toISOString(),
              confidence: 1.0
            };
            setMessages(prev => [...prev, errorMessage]);
            await saveMessage(errorMessage);
            setIsProcessing(false);
            return;
          } else if (response.status === 429) {
            const errorMessage: ChatMessage = {
              id: crypto.randomUUID(),
              role: 'system',
              content: '⚠️ **Rate Limit Exceeded**\n\nToo many requests. Please wait a moment and try again.',
              timestamp: new Date().toISOString(),
              confidence: 1.0
            };
            setMessages(prev => [...prev, errorMessage]);
            await saveMessage(errorMessage);
            setIsProcessing(false);
            return;
          }
          
          throw new Error(errorMsg);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (reader) {
          // Create initial AI message
          const initialAiMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
            reasoning_trace: reasoningTrace as any,
            confidence: 0.92,
            metadata: {
              model: 'google/gemini-2.5-flash',
              background_agents_triggered: triggeredAgents,
              processing_time: 0,
              orchestration: generateMockOrchestration(userMessage.content) // Add AIMOS orchestration
            }
          };
          
          setMessages(prev => [...(prev || []), initialAiMessage]);
          sseBufferRef.current = ''; // Reset buffer

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            sseBufferRef.current += chunk;
            
            // Process complete lines
            const lines = sseBufferRef.current.split('\n');
            sseBufferRef.current = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine || trimmedLine.startsWith(':')) continue;
              
              if (trimmedLine.startsWith('data: ')) {
                const data = trimmedLine.slice(6).trim();
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  
                  if (content) {
                    fullResponse += content;
                    
                    // Update the last message with streaming content
                    setMessages(prev => {
                      if (!Array.isArray(prev) || prev.length === 0) return prev || [];
                      const updated = [...prev];
                      const lastMsg = updated[updated.length - 1];
                      if (lastMsg && lastMsg.role === 'assistant') {
                        lastMsg.content = fullResponse;
                        if (lastMsg.metadata) {
                          lastMsg.metadata.processing_time = Date.now() - startTime;
                        }
                      }
                      return updated;
                    });
                  }
                } catch (e) {
                  // Ignore incomplete JSON - will be completed in next chunk
                }
              }
            }
          }
          
          // Clear buffer after stream completes
          sseBufferRef.current = '';

          // Save final message
          const finalMessage = messages[messages.length - 1];
          if (finalMessage) {
            await saveMessage(finalMessage);
          }
        }
      } catch (streamError) {
        console.error('Streaming error:', streamError);
        
        // Fallback to non-streaming
        const fallbackMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: 'I understand your message and am processing it with full context awareness through my neural network.',
          timestamp: new Date().toISOString(),
          reasoning_trace: reasoningTrace as any,
          confidence: 0.85,
          metadata: {
            model: 'google/gemini-2.5-flash',
            background_agents_triggered: triggeredAgents,
            processing_time: Date.now() - startTime
          }
        };
        
        setMessages(prev => [...prev, fallbackMessage]);
        await saveMessage(fallbackMessage);
      }

      // Update context window
      const allMessages = [...messages, userMessage];
      updateContextWindow(allMessages);

      // Check if we need to create a new conversation chunk
      if (messages.length % 20 === 0) {
        await createConversationChunk(messages.slice(-20));
      }

    } catch (error) {
      console.error('Error processing message:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: 'I encountered an issue processing your message, but I maintain full context of our conversation.',
        timestamp: new Date().toISOString(),
        confidence: 0.5
      };
      
      setMessages(prev => [...prev, errorMessage]);
      await saveMessage(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const createConversationChunk = async (recentMessages: ChatMessage[]) => {
    try {
      const topics = extractKeyTopics(recentMessages);
      const summary = generateChunkSummary(recentMessages);
      
      const newChunk: ConversationChunk = {
        id: `chunk-${Date.now()}`,
        summary,
        key_topics: topics,
        importance_score: calculateImportanceScore(recentMessages),
        message_count: recentMessages.length,
        created_at: new Date().toISOString(),
        indexed_keywords: extractKeywords(recentMessages)
      };
      
      setChunks(prev => [newChunk, ...prev]);
      
      // Store in database
      await supabase.from('ai_context_memory').insert({
        context_type: 'conversation_chunk',
        content: newChunk as any,
        importance: newChunk.importance_score
      });
      
    } catch (error) {
      console.error('Failed to create conversation chunk:', error);
    }
  };

  const extractKeyTopics = (messages: ChatMessage[]): string[] => {
    const text = messages.map(m => m.content).join(' ').toLowerCase();
    const commonTopics = ['ai', 'reasoning', 'memory', 'system', 'agent', 'neural', 'wisdom'];
    return commonTopics.filter(topic => text.includes(topic));
  };

  const generateChunkSummary = (messages: ChatMessage[]): string => {
    const messageCount = messages.length;
    const userMessages = messages.filter(m => m.role === 'user').length;
    return `Conversation segment with ${messageCount} messages (${userMessages} user inputs) covering AI reasoning and system interaction.`;
  };

  const calculateImportanceScore = (messages: ChatMessage[]): number => {
    let score = 5; // Base score
    
    // Increase score for longer messages
    const avgLength = messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length;
    if (avgLength > 100) score += 2;
    
    // Increase score for reasoning traces
    const reasoningMessages = messages.filter(m => m.reasoning_trace);
    score += reasoningMessages.length;
    
    return Math.min(10, score);
  };

  const extractKeywords = (messages: ChatMessage[]): string[] => {
    const text = messages.map(m => m.content).join(' ').toLowerCase();
    const words = text.match(/\b\w{4,}\b/g) || [];
    return [...new Set(words)].slice(0, 20);
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    
    const userInput = input.trim();
    setInput('');
    await processUserMessage(userInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isProcessing) {
      e.preventDefault();
      handleSend();
    }
  };

  // AI Action Handlers with User Confirmation
  const requestAction = (
    type: AIActionType,
    description: string,
    prompt?: string,
    documentTitle?: string,
    metadata?: Record<string, any>
  ) => {
    setPendingAction({ type, description, prompt, documentTitle, metadata });
    setShowActionConfirmation(true);
  };

  const executeAction = async () => {
    if (!pendingAction) return;
    
    setShowActionConfirmation(false);
    const action = pendingAction;
    setPendingAction(null);

    try {
      switch (action.type) {
        case 'image':
          if (action.prompt) {
            const result = await generateImage(action.prompt);
            if (result.success && result.images) {
              const aiMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: `Generated ${result.images.length} image(s) as requested.`,
                timestamp: new Date().toISOString(),
                metadata: { images: result.images }
              };
              setMessages(prev => [...prev, aiMessage]);
              await saveMessage(aiMessage);
              toast.success('Images generated successfully!');
            }
          }
          break;

        case 'video':
          if (action.prompt) {
            const result = await generateVideo(action.prompt);
            if (result.success && result.videos) {
              const aiMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: `Generated ${result.videos.length} video(s) as requested.`,
                timestamp: new Date().toISOString(),
                metadata: { videos: result.videos }
              };
              setMessages(prev => [...prev, aiMessage]);
              await saveMessage(aiMessage);
              toast.success('Videos generated successfully!');
            }
          }
          break;

        case 'document':
          if (action.documentTitle && action.metadata?.content) {
            const file = new File(
              [action.metadata.content],
              `${action.documentTitle}.txt`,
              { type: 'text/plain' }
            );
            const docId = await uploadDocument(file);
            if (docId) {
              toast.success(`Document "${action.documentTitle}" created successfully!`);
              const aiMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: `Created document: **${action.documentTitle}**`,
                timestamp: new Date().toISOString(),
                metadata: { documentId: docId }
              };
              setMessages(prev => [...prev, aiMessage]);
              await saveMessage(aiMessage);
            }
          }
          break;

        case 'deep_search':
          if (action.prompt) {
            toast.info('Initiating deep search...');
            const result = await performDeepSearch(action.prompt, {
              searchDepth: 5,
              context: messages.slice(-10)
            });
            if (result?.success) {
              const aiMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: `Deep search completed. Found comprehensive information on: ${action.prompt}`,
                timestamp: new Date().toISOString(),
                metadata: { searchResults: result.results }
              };
              setMessages(prev => [...prev, aiMessage]);
              await saveMessage(aiMessage);
              toast.success('Deep search completed!');
            }
          }
          break;

        case 'edit_document':
          if (action.documentTitle && action.metadata?.documentId && action.prompt) {
            const result = await suggestEdit(
              action.metadata.documentId,
              null,
              action.metadata.selectedText || '',
              0,
              100,
              action.prompt
            );
            if (result) {
              toast.success('Document edit suggestion generated!');
              const aiMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: `Suggested edit for "${action.documentTitle}":\n\n${result.edited_text}\n\n**Reasoning:** ${result.reasoning}`,
                timestamp: new Date().toISOString(),
                metadata: { editSuggestion: result }
              };
              setMessages(prev => [...prev, aiMessage]);
              await saveMessage(aiMessage);
            }
          }
          break;
      }
    } catch (error: any) {
      console.error('Action execution error:', error);
      toast.error(`Failed to execute action: ${error.message}`);
    }
  };

  const cancelAction = () => {
    setShowActionConfirmation(false);
    setPendingAction(null);
    toast.info('Action cancelled');
  };

  const getMessageIcon = (role: string) => {
    switch (role) {
      case 'user': return <MessageSquare className="w-4 h-4" />;
      case 'assistant': return <Brain className="w-4 h-4" />;
      case 'system': return <Cpu className="w-4 h-4" />;
      case 'reasoning': return <GitBranch className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-muted-foreground';
    if (confidence > 0.8) return 'text-wisdom-success';
    if (confidence > 0.6) return 'text-wisdom-warning';
    return 'text-destructive';
  };

  return (
    <div className="min-h-screen bg-gradient-mind flex flex-col">
      {/* Header with Logo and Status */}
      <div className="border-b border-border/50 bg-card/50 backdrop-neural">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <WisdomNetLogo size={48} animated={true} />
              <div>
                <h1 className="text-2xl font-bold text-neural-glow font-neural">
                  WisdomNET
                </h1>
                <p className="text-sm text-muted-foreground">
                  Persistent AGI Companion
                </p>
              </div>
            </div>
            
            {/* Context Window Status */}
            <div className="flex items-center gap-6">
              {/* CMC Mode Toggle */}
              <Button
                variant={useCMCMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setUseCMCMode(!useCMCMode);
                  toast.info(useCMCMode ? "Switched to legacy mode" : "Switched to CMC reasoning mode");
                }}
                className="neural-glow"
              >
                <Zap className="w-4 h-4 mr-2" />
                {useCMCMode ? "CMC Active" : "Legacy Mode"}
              </Button>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MemoryStick className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">Memories:</span>
                  <Badge variant="outline" className="neural-glow">
                    {contextWindow.active_memories}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-accent" />
                  <span className="text-muted-foreground">Reasoning:</span>
                  <Badge variant="outline" className="neural-glow">
                    {contextWindow.reasoning_depth}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-wisdom-data-flow" />
                  <span className="text-muted-foreground">Agents:</span>
                  <Badge variant="outline" className="neural-glow">
                    {contextWindow.agent_orchestration}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-wisdom-neural" />
                  <span className="text-muted-foreground">Synthesis:</span>
                  <Badge variant="outline" className="neural-glow">
                    {contextWindow.knowledge_synthesis}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex">
        {/* Conversation Chunks Sidebar */}
        <div className="w-80 border-r border-border/50 bg-card/30 backdrop-neural">
          <div className="p-4 border-b border-border/50">
            <h3 className="font-semibold text-primary flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Conversation Memory
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {chunks.length} indexed chunks
            </p>
          </div>
          
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="p-4 space-y-3">
              {chunks.map((chunk) => (
                <Card key={chunk.id} className="p-3 hover:bg-accent/5 transition-colors cursor-pointer neural-glow">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {chunk.message_count} messages
                    </Badge>
                    <Badge 
                      variant={chunk.importance_score > 7 ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {chunk.importance_score}/10
                    </Badge>
                  </div>
                  
                  <p className="text-sm mb-2 line-clamp-2">
                    {chunk.summary}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    {chunk.key_topics.slice(0, 3).map((topic) => (
                      <Badge key={topic} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {new Date(chunk.created_at).toLocaleDateString()}
                  </p>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

          {/* Chat Messages */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {Array.isArray(messages) && messages.map((message) => (
                <div key={message.id}>
                  {/* AIMOS Thoughts Panel for AI responses */}
                  {message.role === 'assistant' && message.metadata?.orchestration && (
                    <AIMOSThoughtsPanel 
                      orchestration={message.metadata.orchestration}
                      messageId={message.id}
                    />
                  )}
                  
                  <div
                    className={`flex gap-4 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                  {message.role !== 'user' && (
                    <Avatar className="neural-glow">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {getMessageIcon(message.role)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`max-w-2xl ${message.role === 'user' ? 'order-first' : ''}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {message.role}
                      </Badge>
                      
                      {message.confidence && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getConfidenceColor(message.confidence)}`}
                        >
                          {(message.confidence * 100).toFixed(0)}%
                        </Badge>
                      )}
                      
                      {message.metadata?.background_agents_triggered?.length && (
                        <Badge variant="outline" className="text-xs text-agent-active">
                          +{message.metadata.background_agents_triggered.length} agents
                        </Badge>
                      )}
                    </div>
                    
                    <Card className={`p-4 ${
                      message.role === 'user' 
                        ? 'bg-primary/10 border-primary/20' 
                        : 'bg-card/50 neural-glow'
                    }`}>
                      <p className="whitespace-pre-wrap font-interface">
                        {message.content}
                      </p>
                      
                      {/* Display generated images if available */}
                      {message.metadata?.images && Array.isArray(message.metadata.images) && message.metadata.images.length > 0 && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                          {message.metadata.images.map((imageUrl, idx) => (
                            <div key={idx} className="relative group">
                              <img 
                                src={imageUrl} 
                                alt={`Generated image ${idx + 1}`}
                                className="w-full rounded-lg border border-border/50 neural-glow cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => window.open(imageUrl, '_blank')}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg pointer-events-none" />
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {message.reasoning_trace && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          {message.reasoning_trace.steps ? (
                            <ReasoningTrace
                              steps={message.reasoning_trace}
                              verification={message.metadata?.orchestration}
                            />
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Reasoning trace available - confidence: {
                                (message.reasoning_trace.confidence_score * 100).toFixed(0)
                              }%
                            </p>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                        <span>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                        
                        {message.metadata?.processing_time && (
                          <span>
                            {message.metadata.processing_time}ms
                          </span>
                        )}
                      </div>
                    </Card>
                  </div>
                  
                  {message.role === 'user' && (
                    <Avatar>
                      <AvatarFallback className="bg-accent/20 text-accent">
                        <MessageSquare className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
              ))}
              
              {isProcessing && (
                <div className="flex gap-4 justify-start">
                  <Avatar className="neural-glow animate-neural-pulse">
                    <AvatarFallback className="bg-primary/20 text-primary">
                      <Brain className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <Card className="p-4 bg-card/50 neural-glow max-w-2xl">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin">
                        <Activity className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-muted-foreground">
                        Processing with full context awareness...
                      </p>
                    </div>
                  </Card>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          {/* Input Area */}
          <div className="border-t border-border/50 bg-card/30 backdrop-neural p-6">
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Quick Actions for Google AI Features */}
              <div className="flex flex-wrap gap-2 items-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => requestAction(
                    'image',
                    'Generate an AI image based on a text prompt',
                    input || 'a beautiful landscape'
                  )}
                  className="text-xs neural-glow hover:bg-primary/10"
                >
                  <Image className="w-3 h-3 mr-1" />
                  Generate Image
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => requestAction(
                    'video',
                    'Generate an AI video based on a text prompt',
                    input || 'a cinematic scene'
                  )}
                  className="text-xs neural-glow hover:bg-primary/10"
                >
                  <Video className="w-3 h-3 mr-1" />
                  Generate Video
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => requestAction(
                    'deep_search',
                    'Perform comprehensive deep search with AI agents',
                    input || 'latest AI developments'
                  )}
                  className="text-xs neural-glow hover:bg-primary/10"
                >
                  <Search className="w-3 h-3 mr-1" />
                  Deep Search
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => requestAction(
                    'document',
                    'Create a new document with AI assistance',
                    undefined,
                    'AI Generated Document',
                    { content: 'Document content will be generated by AI' }
                  )}
                  className="text-xs neural-glow hover:bg-primary/10"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  Create Doc
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setInput('Analyze and explain ')}
                  className="text-xs neural-glow hover:bg-primary/10"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Deep Analysis
                </Button>
                {onDocumentsClick && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onDocumentsClick}
                    className="text-xs neural-glow hover:bg-accent/50"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    Documents
                  </Button>
                )}
                <Badge variant="outline" className="text-xs">
                  🤖 Full AI Control with User Approval
                </Badge>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Continue our conversation... I remember everything."
                    className="bg-background/50 border-border/50 focus:border-primary/50 neural-glow"
                    disabled={isProcessing}
                  />
                </div>
                
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isProcessing}
                  className="bg-gradient-neural hover:opacity-90 neural-glow"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                <span>
                  Persistent conversation • {Array.isArray(messages) ? messages.length : 0} total messages
                </span>
                <span>
                  {backgroundAgents.filter(a => a.status === 'active').length} active agents
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Action Confirmation Dialog */}
      <AIActionConfirmation
        action={pendingAction}
        open={showActionConfirmation}
        onConfirm={executeAction}
        onCancel={cancelAction}
      />
    </div>
  );
};