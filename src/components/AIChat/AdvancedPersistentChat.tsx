// Streamlined AI Chat component without embedded toolbars
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Send, 
  Brain, 
  Sparkles,
  Loader2,
  User,
  Bot,
  ChevronDown,
  ChevronRight,
  CheckCircle
} from 'lucide-react';
import { WisdomNetLogo } from '@/components/WisdomNET/WisdomNetLogo';
import { supabase } from '@/integrations/supabase/client';
import { useAIMOSStreaming } from '@/hooks/useAIMOSStreaming';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  confidence?: number;
  metadata?: {
    model?: string;
    orchestration?: any;
  };
}

interface AdvancedPersistentChatProps {
  onDocumentsClick?: () => void;
}

export const AdvancedPersistentChat: React.FC<AdvancedPersistentChatProps> = ({ onDocumentsClick }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedOrchestration, setExpandedOrchestration] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef(crypto.randomUUID());
  
  const { 
    startStreaming, 
    isStreaming, 
    orchestrationPlan, 
    thinkingSteps, 
    agents: streamingAgents,
    discordMessages,
    discordThreads,
    finalResponse,
    currentMode 
  } = useAIMOSStreaming();

  // Auto-scroll
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Initialize conversation
  useEffect(() => {
    initializeConversation();
  }, []);

  const initializeConversation = async () => {
    try {
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
      } else {
        const systemMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'system',
          content: 'WisdomNET AGI initialized. I have persistent memory and full reasoning capabilities.',
          timestamp: new Date().toISOString(),
          confidence: 1.0
        };
        setMessages([systemMessage]);
        await saveMessage(systemMessage);
      }
    } catch (error) {
      console.error('Failed to initialize conversation:', error);
    }
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

  const handleSend = async () => {
    if (!input.trim() || isProcessing || isStreaming) return;
    
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    await saveMessage(userMessage);
    setInput('');
    setIsProcessing(true);

    try {
      const response = await startStreaming(
        userMessage.content,
        sessionIdRef.current,
        'user-' + crypto.randomUUID()
      );
      
      if (response) {
        const aiMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.answer,
          timestamp: new Date().toISOString(),
          confidence: response.verification?.confidence,
          metadata: {
            model: 'AIMOS-Stream',
            orchestration: {
              thinkingSteps: thinkingSteps,
              agents: streamingAgents,
              discordMessages: discordMessages,
              discordThreads: discordThreads,
              orchestrationPlan: orchestrationPlan,
              verification: response.verification,
              trace_id: response.trace_id,
              mode_used: response.mode_used
            }
          }
        };
        
        setMessages(prev => [...prev, aiMessage]);
        await saveMessage(aiMessage);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      toast.error('Failed to process message');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4">
        <div className="max-w-4xl mx-auto py-6 space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={cn(
              "flex gap-3",
              message.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}>
              {/* Avatar */}
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className={cn(
                  message.role === 'user' ? "bg-primary text-primary-foreground" : "bg-card"
                )}>
                  {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>

              {/* Message Content */}
              <div className={cn(
                "flex flex-col max-w-[80%]",
                message.role === 'user' ? "items-end" : "items-start"
              )}>
                <Card className={cn(
                  "px-4 py-3",
                  message.role === 'user' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-card"
                )}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </Card>
                
                {/* Metadata */}
                <div className={cn(
                  "flex items-center gap-2 mt-1 px-1",
                  message.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  
                  {message.confidence && (
                    <Badge variant="outline" className="text-xs py-0 h-5">
                      {Math.round(message.confidence * 100)}% confident
                    </Badge>
                  )}
                  
                  {/* Expandable Orchestration */}
                  {message.metadata?.orchestration && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1 text-xs text-muted-foreground"
                      onClick={() => setExpandedOrchestration(
                        expandedOrchestration === message.id ? null : message.id
                      )}
                    >
                      {expandedOrchestration === message.id ? (
                        <ChevronDown className="w-3 h-3 mr-1" />
                      ) : (
                        <ChevronRight className="w-3 h-3 mr-1" />
                      )}
                      View reasoning
                    </Button>
                  )}
                </div>

                {/* Expanded Orchestration Details */}
                {expandedOrchestration === message.id && message.metadata?.orchestration && (
                  <Card className="mt-2 p-3 bg-muted/50 w-full max-w-lg">
                    <p className="text-xs font-medium mb-2">Reasoning Trace</p>
                    <div className="space-y-2">
                      {message.metadata.orchestration.thinkingSteps?.slice(0, 5).map((step: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          <span className="font-medium">{step.agent || step.name}</span>
                          <span className="text-muted-foreground truncate">{step.output?.substring(0, 50)}...</span>
                        </div>
                      ))}
                    </div>
                    {message.metadata.orchestration.verification && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            κ: {message.metadata.orchestration.verification.provenance_coverage?.toFixed(2)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Entropy: {message.metadata.orchestration.verification.semantic_entropy?.toFixed(3)}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </Card>
                )}
              </div>
            </div>
          ))}

          {/* Streaming Indicator */}
          {isStreaming && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-card">
                  <Brain className="w-4 h-4 animate-pulse text-amber-500" />
                </AvatarFallback>
              </Avatar>
              <Card className="px-4 py-3 bg-card">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {currentMode ? `${currentMode} mode active...` : 'Thinking...'}
                  </span>
                </div>
                {orchestrationPlan && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Step {orchestrationPlan.currentStep || 0} of {orchestrationPlan.totalSteps || 0}
                  </div>
                )}
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border bg-background/80 backdrop-blur-sm p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask anything..."
              disabled={isProcessing || isStreaming}
              className="flex-1"
            />
            <Button 
              onClick={handleSend} 
              disabled={!input.trim() || isProcessing || isStreaming}
              className="px-6"
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AIMOS v2.0
            </span>
            <span>•</span>
            <span>Streaming Mode</span>
            <span>•</span>
            <span>{messages.length} messages</span>
          </div>
        </div>
      </div>
    </div>
  );
};