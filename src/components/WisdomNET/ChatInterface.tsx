// WisdomNET Chat Interface - Natural Language Neural Communication

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useWisdomNET } from '@/contexts/WisdomNETContext';
import { 
  Send, 
  Brain, 
  User, 
  Code, 
  FileText, 
  Zap,
  MessageSquare,
  Lightbulb,
  Cpu
} from 'lucide-react';
import type { ChatMessage } from '@/contexts/WisdomNETContext';
import { useWisdomLinking } from '@/hooks/useWisdomLinking';

export function ChatInterface() {
  const { chatHistory, sendChatMessage, agents } = useWisdomNET();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const { gotoRag, gotoAgents, gotoMemory } = useWisdomLinking();

  const handleSend = () => {
    if (!input.trim()) return;
    
    setIsTyping(true);
    sendChatMessage(input.trim());
    setInput('');
    
    // Reset typing indicator after AI response
    setTimeout(() => setIsTyping(false), 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getMessageIcon = (message: ChatMessage) => {
    if (message.sender === 'user') {
      return <User className="w-4 h-4 text-primary" />;
    }
    if (message.sender === 'system') {
      return <Cpu className="w-4 h-4 text-accent" />;
    }
    
    // Find agent by ID
    const agent = agents.find(a => a.id === message.sender);
    if (agent) {
      const agentIcons = {
        'orchestrator': Brain,
        'planner': FileText,
        'engineer': Code,
        'memory-keeper': Brain,
        'qa-verifier': Zap,
        'ui-designer': Lightbulb,
        'security-auditor': Brain,
        'performance-optimizer': Cpu
      };
      const IconComponent = agentIcons[agent.role as keyof typeof agentIcons] || Brain;
      return <IconComponent className="w-4 h-4 text-agent-active" />;
    }
    
    return <MessageSquare className="w-4 h-4 text-muted-foreground" />;
  };

  const getMessageSenderName = (message: ChatMessage) => {
    if (message.sender === 'user') return 'You';
    if (message.sender === 'system') return 'WisdomNET';
    
    const agent = agents.find(a => a.id === message.sender);
    return agent ? agent.name : 'Agent';
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'code':
        return 'bg-neural/10 text-neural border-neural/30';
      case 'task':
        return 'bg-wisdom-success/10 text-wisdom-success border-wisdom-success/30';
      case 'analysis':
        return 'bg-wisdom-memory/10 text-wisdom-memory border-wisdom-memory/30';
      default:
        return 'bg-accent/10 text-accent border-accent/30';
    }
  };

  const quickActions = [
    { label: 'Create Task', value: 'Create a new development task' },
    { label: 'Query Memory', value: 'Search the knowledge base for' },
    { label: 'Analyze Code', value: 'Analyze the current codebase structure' },
    { label: 'System Status', value: 'Show me the current system status' }
  ];

  return (
    <div className="flex flex-col h-[400px]">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-muted/5 rounded-lg">
        {chatHistory.map((message) => (
          <div 
            key={message.id} 
            className={`flex items-start space-x-3 ${
              message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            {/* Avatar */}
            <div className={`
              p-2 rounded-lg flex-shrink-0
              ${message.sender === 'user' 
                ? 'bg-primary/20' 
                : 'bg-gradient-to-br from-accent/20 to-neural/20'
              }
            `}>
              {getMessageIcon(message)}
            </div>
            
            {/* Message Content */}
            <div className={`
              flex-1 max-w-[80%]
              ${message.sender === 'user' ? 'text-right' : 'text-left'}
            `}>
              {/* Sender & Time */}
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-xs font-medium">
                  {getMessageSenderName(message)}
                </span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getMessageTypeColor(message.type)}`}
                >
                  {message.type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              {/* Message Text */}
              <div className={`
                p-3 rounded-lg 
                ${message.sender === 'user'
                  ? 'bg-primary/10 border border-primary/20'
                  : 'bg-card/50 border border-border'
                }
              `}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {/* Metadata */}
                {message.metadata && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {message.type === 'task' && message.metadata.taskId && (
                      <span>Task ID: {message.metadata.taskId}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-accent/20 to-neural/20">
              <Brain className="w-4 h-4 text-agent-active animate-neural-pulse" />
            </div>
            <div className="bg-card/50 border border-border p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-primary rounded-full animate-neural-pulse" />
                <div className="w-1 h-1 bg-primary rounded-full animate-neural-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-1 h-1 bg-primary rounded-full animate-neural-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="py-2">
        <div className="flex space-x-2 overflow-x-auto">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              className="whitespace-nowrap text-xs bg-muted/20 hover:bg-accent/20"
              onClick={() => setInput(action.value)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Deep Links */}
      <div className="flex items-center gap-2 justify-end pb-2">
        <Button variant="secondary" size="sm" className="h-6 px-2 text-xs" onClick={() => gotoRag('chat_hub', ['e-chat','e-memory-link'])}>RAG Map</Button>
        <Button variant="outline" size="sm" className="h-6 px-2 text-xs" onClick={() => gotoAgents('chat_orchestrator')}>Agent Graph</Button>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => gotoMemory('chat_context')}>Memory</Button>
      </div>

      {/* Input Area */}
      <div className="flex items-center space-x-2 pt-2 border-t border-border">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask WisdomNET anything..."
          className="flex-1 bg-muted/30 border-border focus:border-primary/50 focus:ring-primary/20"
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim()}
          size="sm"
          className="bg-gradient-neural hover:shadow-glow"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}