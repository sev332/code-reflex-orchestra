// 🔗 CONNECT: UI Components → Right Toolbar System → AI Chat Interface
// 🧩 INTENT: Vertical right toolbar with AI chat drawer for intelligent assistance
// ✅ SPEC: Right-Toolbar-AI-Chat-v1.0

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Lightbulb,
  Zap,
  Brain,
  Cpu,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

interface RightToolbarProps {
  className?: string;
}

export function RightToolbar({ className }: RightToolbarProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: 'WisdomNET AI Assistant activated. I can help you with AGI development, neural architecture, agent orchestration, and system optimization. What would you like to explore?',
      timestamp: new Date(),
      status: 'sent'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isChatOpen]);

  const quickActions = [
    {
      icon: Brain,
      label: 'Neural Analysis',
      prompt: 'Analyze the current neural network performance and suggest optimizations'
    },
    {
      icon: Cpu,
      label: 'System Status',
      prompt: 'Provide a comprehensive system status report including all active components'
    },
    {
      icon: Zap,
      label: 'Agent Tasks',
      prompt: 'Show me the current agent tasks and recommend priority adjustments'
    },
    {
      icon: Lightbulb,
      label: 'AI Insights',
      prompt: 'Generate insights about the current AGI development patterns and potential improvements'
    }
  ];

  const simulateAIResponse = async (userMessage: string): Promise<string> => {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Generate contextual responses based on message content
    const responses = [
      "I've analyzed your request and identified several optimization opportunities in the neural pathway configurations. Would you like me to detail the specific recommendations?",
      "Based on current system metrics, I recommend adjusting the agent concurrency levels and implementing adaptive memory pruning. This should improve overall throughput by approximately 15-20%.",
      "The consciousness emergence simulation shows promising phi values. Consider enhancing the integration scores in the global workspace network for better self-awareness development.",
      "I've detected anomalous patterns in the vector memory system. Running diagnostic protocols now... Results suggest implementing memory defragmentation during the next maintenance window.",
      "The autonomous agent swarm is operating at 94% efficiency. I recommend fine-tuning the collaboration protocols to achieve optimal performance thresholds.",
      "Analysis complete: The multi-modal processor shows excellent integration with the reasoning engine. Consider expanding the sensory input channels for enhanced cognitive capabilities."
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      status: 'sent'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const aiResponse = await simulateAIResponse(content);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        status: 'sent'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        status: 'error'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInputValue(prompt);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return (
    <>
      {/* Right Toolbar */}
      <div className={cn(
        "fixed right-0 top-0 h-full w-16 bg-card/95 backdrop-blur-sm border-l border-border z-40 flex flex-col items-center py-4 space-y-2",
        className
      )}>
        <div className="relative">
          <Button
            variant={isChatOpen ? "default" : "ghost"}
            size="icon"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={cn(
              "w-12 h-12 rounded-lg transition-all duration-200",
              isChatOpen && "neural-glow"
            )}
            title="AI Assistant"
          >
            <MessageSquare className="w-5 h-5" />
          </Button>
          {messages.length > 1 && (
            <Badge 
              className="absolute -top-1 -right-1 px-1 py-0 text-xs min-w-0 h-5 animate-pulse"
              variant="destructive"
            >
              {messages.length - 1}
            </Badge>
          )}
        </div>
      </div>

      {/* AI Chat Drawer */}
      {isChatOpen && (
        <div className="fixed right-16 top-0 h-full w-96 bg-background/95 backdrop-blur-sm border-l border-border z-30 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">WisdomNET AI</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Online & Learning
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-b border-border">
            <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action.prompt)}
                    className="h-auto p-2 flex flex-col items-center gap-1 text-xs"
                  >
                    <Icon className="w-4 h-4" />
                    {action.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={cn(
                  "flex gap-3",
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}>
                  <div className={cn(
                    "p-2 rounded-lg flex-shrink-0",
                    message.role === 'user' 
                      ? "bg-primary/10" 
                      : message.role === 'system'
                      ? "bg-accent/10"
                      : "bg-muted/50"
                  )}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : message.role === 'system' ? (
                      <Sparkles className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  
                  <div className={cn(
                    "flex-1 max-w-[80%]",
                    message.role === 'user' ? 'text-right' : 'text-left'
                  )}>
                    <div className={cn(
                      "p-3 rounded-lg text-sm",
                      message.role === 'user' 
                        ? "bg-primary text-primary-foreground ml-auto" 
                        : message.role === 'system'
                        ? "bg-accent/20 border border-accent/30"
                        : "bg-muted border"
                    )}>
                      {message.content}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 px-1">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                      {message.status === 'sending' && (
                        <RefreshCw className="w-3 h-3 inline ml-1 animate-spin" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex gap-3">
                  <div className="p-2 rounded-lg bg-muted/50 flex-shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="p-3 rounded-lg bg-muted border text-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about AGI development..."
                className="flex-1"
                disabled={isTyping}
              />
              <Button 
                size="icon"
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim() || isTyping}
                className="neural-glow"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}