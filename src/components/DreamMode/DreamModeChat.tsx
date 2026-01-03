// Compact chat component for Dream Mode sidebar
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Send,
  Loader2,
  User,
  Bot,
  Brain,
  Sparkles,
  FileText,
  Code2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  context?: {
    documents?: string[];
    action?: string;
  };
}

interface DreamModeChatProps {
  onDocumentAction?: (action: 'read' | 'edit', docId: string) => void;
  activeDocument?: string | null;
}

export const DreamModeChat: React.FC<DreamModeChatProps> = ({
  onDocumentAction,
  activeDocument
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Dream Mode active. I can help you explore documents, analyze code, and work on self-improvement tasks. What would you like to explore?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef(crypto.randomUUID());

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      // Check for document-related commands
      const lowerInput = input.toLowerCase();
      
      if (lowerInput.includes('read') || lowerInput.includes('open') || lowerInput.includes('load')) {
        // Document reading action
        const aiMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'I\'ll open the document for analysis. You can see it in the main workspace while we discuss it.',
          timestamp: new Date().toISOString(),
          context: { action: 'read_document' }
        };
        setMessages(prev => [...prev, aiMessage]);
        
        if (onDocumentAction) {
          onDocumentAction('read', 'AIMOS.txt');
        }
      } else if (lowerInput.includes('edit') || lowerInput.includes('modify') || lowerInput.includes('update')) {
        // Document editing action
        const aiMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Switching to edit mode. I can help you make changes to the document structure, add new sections, or improve existing content.',
          timestamp: new Date().toISOString(),
          context: { action: 'edit_document' }
        };
        setMessages(prev => [...prev, aiMessage]);
        
        if (onDocumentAction) {
          onDocumentAction('edit', 'AIMOS.txt');
        }
      } else {
        // General AI response
        const { data, error } = await supabase.functions.invoke('cmc-chat', {
          body: {
            message: input.trim(),
            sessionId: sessionIdRef.current,
            mode: 'dream',
            context: {
              activeDocument,
              dreamMode: true
            }
          }
        });

        if (error) throw error;

        const aiMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data?.answer || data?.content || 'I processed your request. Let me know if you\'d like to explore further.',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      // Fallback response
      const fallbackMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'I\'m processing your request. In Dream Mode, I can explore documents, analyze reasoning paths, and help generate insights for self-improvement.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, fallbackMessage]);
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
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-3">
          {messages.map(message => (
            <div key={message.id} className={cn(
              "flex gap-2",
              message.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}>
              <Avatar className="w-6 h-6 flex-shrink-0">
                <AvatarFallback className={cn(
                  "text-[10px]",
                  message.role === 'user'
                    ? "bg-primary text-primary-foreground"
                    : "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30"
                )}>
                  {message.role === 'user' ? <User className="w-3 h-3" /> : <Brain className="w-3 h-3 text-purple-400" />}
                </AvatarFallback>
              </Avatar>

              <div className={cn(
                "max-w-[85%]",
                message.role === 'user' ? "text-right" : "text-left"
              )}>
                <Card className={cn(
                  "px-3 py-2 text-xs",
                  message.role === 'user'
                    ? "bg-primary text-primary-foreground"
                    : "bg-card/80 backdrop-blur-sm border-purple-500/20"
                )}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </Card>
                
                {message.context?.action && (
                  <Badge variant="outline" className="mt-1 text-[10px] border-purple-500/30 text-purple-400">
                    {message.context.action === 'read_document' ? (
                      <><FileText className="w-2 h-2 mr-1" />Reading</>
                    ) : (
                      <><Code2 className="w-2 h-2 mr-1" />Editing</>
                    )}
                  </Badge>
                )}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex gap-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                  <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                </AvatarFallback>
              </Avatar>
              <Card className="px-3 py-2 bg-card/80 border-purple-500/20">
                <span className="text-xs text-muted-foreground">Thinking...</span>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-border/50">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Explore, analyze, improve..."
            disabled={isProcessing}
            className="flex-1 text-xs h-8 bg-background/50"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            size="sm"
            className="h-8 px-3 bg-gradient-to-r from-purple-500 to-pink-500"
          >
            {isProcessing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Send className="w-3 h-3" />
            )}
          </Button>
        </div>
        
        <div className="flex items-center justify-center gap-2 mt-2 text-[10px] text-muted-foreground">
          <Sparkles className="w-2 h-2 text-purple-400" />
          <span>Dream Mode • Self-Exploration Active</span>
        </div>
      </div>
    </div>
  );
};
