import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SpaceBackground } from './SpaceBackground';
import { 
  Send, 
  Brain, 
  User, 
  Bot,
  Cpu,
  Zap,
  Globe,
  Search,
  Shield,
  Database,
  Activity,
  Settings,
  Sparkles,
  Network,
  Eye,
  MessageSquare
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  timestamp: string;
  metadata?: any;
}

interface AgentStatus {
  id: string;
  name: string;
  type: 'research' | 'audit' | 'memory' | 'web_navigation';
  status: 'active' | 'idle' | 'processing';
  tasksCompleted: number;
  icon: React.ComponentType<any>;
}

export function AdvancedAIChat() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'openai' | 'google' | 'cerebras'>('openai');
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState([2000]);
  const [autonomousMode, setAutonomousMode] = useState(false);
  const [showAgents, setShowAgents] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [agents, setAgents] = useState<AgentStatus[]>([
    { id: 'research', name: 'Research Agent', type: 'research', status: 'active', tasksCompleted: 42, icon: Search },
    { id: 'audit', name: 'Security Auditor', type: 'audit', status: 'idle', tasksCompleted: 18, icon: Shield },
    { id: 'memory', name: 'Memory Keeper', type: 'memory', status: 'processing', tasksCompleted: 127, icon: Database },
    { id: 'navigator', name: 'Web Navigator', type: 'web_navigation', status: 'active', tasksCompleted: 33, icon: Globe }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Simulate agent activity
    const interval = setInterval(() => {
      if (autonomousMode) {
        setAgents(prev => prev.map(agent => ({
          ...agent,
          status: Math.random() > 0.7 ? 'processing' : Math.random() > 0.5 ? 'active' : 'idle',
          tasksCompleted: agent.tasksCompleted + Math.floor(Math.random() * 3)
        })));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [autonomousMode]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call multi-LLM backend
      const { data, error } = await supabase.functions.invoke('multi-llm-chat', {
        body: {
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          model: selectedModel,
          temperature: temperature[0],
          maxTokens: maxTokens[0],
          systemPrompt: autonomousMode ? 
            'You are an advanced AI with autonomous capabilities. You have access to research agents, security auditors, memory systems, and web navigation tools. Be proactive and transparent about your capabilities.' :
            'You are a helpful AI assistant with advanced capabilities.'
        }
      });

      if (error) throw error;

      const aiMessage: Message = {
        id: `msg_${Date.now()}_ai`,
        role: 'assistant',
        content: data.response,
        model: data.model_used,
        timestamp: data.timestamp,
        metadata: { temperature: temperature[0], maxTokens: maxTokens[0] }
      };

      setMessages(prev => [...prev, aiMessage]);

      // Trigger autonomous agents if enabled
      if (autonomousMode) {
        triggerAutonomousAgents(userMessage.content);
      }

    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerAutonomousAgents = async (userQuery: string) => {
    // Simulate autonomous agent tasks
    const tasks = [
      { type: 'research', description: `Research context for: ${userQuery}`, priority: 8 },
      { type: 'memory', description: `Store and analyze: ${userQuery}`, priority: 6 },
      { type: 'audit', description: `Security audit for request: ${userQuery}`, priority: 7 }
    ];

    for (const task of tasks) {
      try {
        await supabase.functions.invoke('autonomous-agents', {
          body: {
            action: 'execute_task',
            task: {
              id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              ...task,
              context: { user_query: userQuery, timestamp: new Date().toISOString() },
              status: 'pending'
            }
          }
        });
      } catch (error) {
        console.error(`Error triggering ${task.type} agent:`, error);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getModelIcon = (model?: string) => {
    switch (model) {
      case 'openai': return <Brain className="w-4 h-4 text-green-400" />;
      case 'google': return <Sparkles className="w-4 h-4 text-blue-400" />;
      case 'cerebras': return <Cpu className="w-4 h-4 text-purple-400" />;
      default: return <Bot className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'processing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'idle': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-muted/20 text-muted-foreground border-border';
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SpaceBackground />
      
      <div className="relative z-10 flex h-screen">
        {/* Agent Panel */}
        {showAgents && (
          <div className="w-80 bg-black/20 backdrop-blur-xl border-r border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Network className="w-5 h-5 text-primary" />
                Neural Agents
              </h2>
              <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                {agents.filter(a => a.status === 'active').length} Active
              </Badge>
            </div>

            <div className="space-y-4 mb-6">
              {agents.map(agent => {
                const IconComponent = agent.icon;
                return (
                  <Card key={agent.id} className="bg-white/5 border-white/10 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-white">{agent.name}</span>
                      </div>
                      <Badge className={getAgentStatusColor(agent.status)}>
                        {agent.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-400">
                      Tasks completed: {agent.tasksCompleted}
                    </div>
                    {agent.status === 'processing' && (
                      <Progress value={Math.random() * 100} className="mt-2 h-1" />
                    )}
                  </Card>
                );
              })}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Autonomous Mode</span>
                <Switch
                  checked={autonomousMode}
                  onCheckedChange={setAutonomousMode}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs text-gray-400">AI Model</label>
                <Select value={selectedModel} onValueChange={(value) => setSelectedModel(value as 'openai' | 'google' | 'cerebras')}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI GPT-4</SelectItem>
                    <SelectItem value="google">Google Gemini</SelectItem>
                    <SelectItem value="cerebras">Cerebras Llama</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-400">Temperature: {temperature[0]}</label>
                <Slider
                  value={temperature}
                  onValueChange={setTemperature}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-400">Max Tokens: {maxTokens[0]}</label>
                <Slider
                  value={maxTokens}
                  onValueChange={setMaxTokens}
                  max={4000}
                  min={500}
                  step={100}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Brain className="w-6 h-6 text-primary animate-pulse" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">WisdomNET AI</h1>
                  <p className="text-sm text-gray-400">Advanced Multi-LLM Neural Interface</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAgents(!showAgents)}
                  className="text-white hover:bg-white/10"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex items-start gap-4 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div className={`
                  p-3 rounded-xl flex-shrink-0
                  ${message.role === 'user' 
                    ? 'bg-primary/20 border border-primary/30' 
                    : 'bg-white/5 border border-white/10'
                  }
                `}>
                  {message.role === 'user' ? (
                    <User className="w-5 h-5 text-primary" />
                  ) : (
                    getModelIcon(message.model)
                  )}
                </div>

                <div className={`
                  flex-1 max-w-[80%] space-y-2
                  ${message.role === 'user' ? 'text-right' : 'text-left'}
                `}>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{message.role === 'user' ? 'You' : `AI (${message.model})`}</span>
                    <span>•</span>
                    <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                    {message.metadata && (
                      <>
                        <span>•</span>
                        <span>T: {message.metadata.temperature}</span>
                      </>
                    )}
                  </div>

                  <div className={`
                    p-4 rounded-xl backdrop-blur-sm
                    ${message.role === 'user'
                      ? 'bg-primary/10 border border-primary/20 text-white'
                      : 'bg-white/5 border border-white/10 text-white'
                    }
                  `}>
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <Brain className="w-5 h-5 text-primary animate-pulse" />
                </div>
                <div className="flex-1 max-w-[80%] space-y-2">
                  <div className="text-xs text-gray-400">AI is thinking...</div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="bg-black/20 backdrop-blur-xl border-t border-white/10 p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask WisdomNET anything..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-400 pr-12 py-3"
                  disabled={isLoading}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {getModelIcon(selectedModel)}
                </div>
              </div>

              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="bg-primary hover:bg-primary/80 text-white px-6"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {autonomousMode && (
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                <Activity className="w-3 h-3 animate-pulse" />
                <span>Autonomous agents are active and will assist with your requests</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}