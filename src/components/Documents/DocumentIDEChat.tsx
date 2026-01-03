// Compact chat component for Document IDE sidebar
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
  FileText,
  Sparkles,
  Wand2,
  BookOpen,
  ListTree,
  Tags
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  action?: {
    type: 'structure' | 'edit' | 'index' | 'tag';
    details?: string;
  };
}

interface DocumentIDEChatProps {
  activeDocument?: string | null;
  documentContent?: string;
  onAIEdit?: (editCommand: string) => void;
}

export const DocumentIDEChat: React.FC<DocumentIDEChatProps> = ({
  activeDocument,
  documentContent,
  onAIEdit
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'I\'m ready to help you build and organize your documents. I can structure content, add chapters, create indexes, and improve your writing. What would you like to work on?',
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
      // Check for document action commands
      const lowerInput = input.toLowerCase();
      let action: Message['action'] | undefined;

      if (lowerInput.includes('structure') || lowerInput.includes('organize') || lowerInput.includes('chapter')) {
        action = { type: 'structure', details: 'Restructuring document' };
      } else if (lowerInput.includes('index') || lowerInput.includes('table of contents')) {
        action = { type: 'index', details: 'Creating index' };
      } else if (lowerInput.includes('tag') || lowerInput.includes('label')) {
        action = { type: 'tag', details: 'Adding tags' };
      } else if (lowerInput.includes('edit') || lowerInput.includes('improve') || lowerInput.includes('rewrite')) {
        action = { type: 'edit', details: 'Editing content' };
      }

      // Call AI for document operations
      const { data, error } = await supabase.functions.invoke('document-ai-orchestrator', {
        body: {
          action: action?.type || 'analyze',
          content: documentContent?.substring(0, 5000) || '',
          instruction: input.trim(),
          documentId: activeDocument
        }
      });

      if (error) throw error;

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data?.result || data?.analysis || 'I\'ve processed your request. The document is being updated.',
        timestamp: new Date().toISOString(),
        action
      };
      setMessages(prev => [...prev, aiMessage]);

      if (action && onAIEdit) {
        onAIEdit(input.trim());
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      const fallbackMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'I can help you structure documents, create chapters, build indexes, add tags, and improve content. Just describe what you\'d like to do!',
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

  const quickActions = [
    { icon: ListTree, label: 'Structure', command: 'Help me structure this document with chapters and sections' },
    { icon: BookOpen, label: 'Index', command: 'Create a table of contents for this document' },
    { icon: Tags, label: 'Tags', command: 'Add semantic tags to key concepts in this document' },
    { icon: Wand2, label: 'Improve', command: 'Improve the writing quality of the current section' }
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Quick Actions */}
      <div className="px-3 py-2 border-b border-border/50">
        <p className="text-[10px] text-muted-foreground mb-2">Quick Actions</p>
        <div className="grid grid-cols-2 gap-1">
          {quickActions.map(action => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              className="h-7 text-[10px] justify-start"
              onClick={() => {
                setInput(action.command);
              }}
            >
              <action.icon className="w-3 h-3 mr-1" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

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
                    : "bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30"
                )}>
                  {message.role === 'user' ? <User className="w-3 h-3" /> : <FileText className="w-3 h-3 text-cyan-400" />}
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
                    : "bg-card/80 backdrop-blur-sm border-cyan-500/20"
                )}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </Card>
                
                {message.action && (
                  <Badge variant="outline" className="mt-1 text-[10px] border-cyan-500/30 text-cyan-400">
                    {message.action.type === 'structure' && <ListTree className="w-2 h-2 mr-1" />}
                    {message.action.type === 'index' && <BookOpen className="w-2 h-2 mr-1" />}
                    {message.action.type === 'tag' && <Tags className="w-2 h-2 mr-1" />}
                    {message.action.type === 'edit' && <Wand2 className="w-2 h-2 mr-1" />}
                    {message.action.details}
                  </Badge>
                )}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex gap-2">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
                  <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                </AvatarFallback>
              </Avatar>
              <Card className="px-3 py-2 bg-card/80 border-cyan-500/20">
                <span className="text-xs text-muted-foreground">Processing...</span>
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
            placeholder="Structure, edit, organize..."
            disabled={isProcessing}
            className="flex-1 text-xs h-8 bg-background/50"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            size="sm"
            className="h-8 px-3 bg-gradient-to-r from-cyan-500 to-blue-500"
          >
            {isProcessing ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Send className="w-3 h-3" />
            )}
          </Button>
        </div>
        
        <div className="flex items-center justify-center gap-2 mt-2 text-[10px] text-muted-foreground">
          <Sparkles className="w-2 h-2 text-cyan-400" />
          <span>Document IDE • AI-Powered Editing</span>
        </div>
      </div>
    </div>
  );
};
