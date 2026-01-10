// Code Builder Chat - AI assistant sidebar for code generation
import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Send,
  Bot,
  User,
  Loader2,
  Code2,
  Sparkles,
  Copy,
  Check,
  Wand2,
  FileCode,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  codeBlocks?: { language: string; code: string }[];
}

interface CodeBuilderChatProps {
  activeFile: string | null;
  fileContent: string;
  onAIEdit: (command: string) => void;
}

export const CodeBuilderChat: React.FC<CodeBuilderChatProps> = ({
  activeFile,
  fileContent,
  onAIEdit
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "I'm your AI coding assistant. I can help you generate code, debug issues, refactor, and explain concepts. What would you like to build?",
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('dream-mode', {
        body: {
          action: 'code_assistant',
          message: userMessage.content,
          context: {
            activeFile,
            fileContent: fileContent.substring(0, 2000),
            previousMessages: messages.slice(-5).map(m => ({ role: m.role, content: m.content }))
          }
        }
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data?.response || "I can help you with that. What specific aspect would you like me to focus on?",
        timestamp: new Date().toISOString(),
        codeBlocks: data?.codeBlocks || []
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      // Fallback response
      const fallbackMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I understand you're looking to build or modify code. Here are some suggestions:\n\n• Be specific about the component or feature you want\n• Mention the framework (React, TypeScript, etc.)\n• Describe the expected behavior\n\nWhat would you like me to help you create?",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast.success('Code copied to clipboard');
  };

  const applyCode = (code: string) => {
    onAIEdit(code);
    toast.success('Code applied to editor');
  };

  const quickActions = [
    { label: 'Generate Component', icon: FileCode, prompt: 'Create a new React component for' },
    { label: 'Add Feature', icon: Sparkles, prompt: 'Add a feature that' },
    { label: 'Fix Bug', icon: Wand2, prompt: 'Debug and fix the issue with' },
    { label: 'Explain Code', icon: Lightbulb, prompt: 'Explain how this code works:' }
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-cyan-400" />
          <span className="font-medium">Code Assistant</span>
        </div>
        {activeFile && (
          <Badge variant="outline" className="mt-2 text-xs">
            <FileCode className="w-3 h-3 mr-1" />
            {activeFile}
          </Badge>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-2 border-b border-border/50 flex flex-wrap gap-1">
        {quickActions.map((action, i) => (
          <Button
            key={i}
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setInput(action.prompt + ' ')}
          >
            <action.icon className="w-3 h-3 mr-1" />
            {action.label}
          </Button>
        ))}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={cn(
              "flex gap-2",
              message.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}>
              <Avatar className="w-7 h-7 flex-shrink-0">
                <AvatarFallback className={cn(
                  message.role === 'user' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30"
                )}>
                  {message.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3 text-cyan-400" />}
                </AvatarFallback>
              </Avatar>

              <div className={cn(
                "flex flex-col max-w-[85%]",
                message.role === 'user' ? "items-end" : "items-start"
              )}>
                <Card className={cn(
                  "px-3 py-2",
                  message.role === 'user' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-card/80 backdrop-blur-sm border-border/50"
                )}>
                  <p className="text-xs whitespace-pre-wrap">{message.content}</p>
                </Card>

                {/* Code Blocks */}
                {message.codeBlocks?.map((block, i) => (
                  <Card key={i} className="mt-2 p-2 bg-muted/50 w-full">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-[10px]">{block.language}</Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6"
                          onClick={() => copyCode(block.code)}
                        >
                          {copiedCode === block.code ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6"
                          onClick={() => applyCode(block.code)}
                        >
                          <Wand2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <pre className="text-[10px] font-mono overflow-x-auto">
                      {block.code.substring(0, 200)}...
                    </pre>
                  </Card>
                ))}

                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex gap-2">
              <Avatar className="w-7 h-7">
                <AvatarFallback className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
                  <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                </AvatarFallback>
              </Avatar>
              <Card className="px-3 py-2 bg-card/80">
                <p className="text-xs text-muted-foreground">Generating code...</p>
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
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask me to generate code..."
            disabled={isProcessing}
            className="flex-1 text-xs bg-background/50"
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isProcessing}
            size="icon"
            className="w-8 h-8"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
