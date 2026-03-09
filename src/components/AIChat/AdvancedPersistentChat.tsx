// Streamlined AI Chat component with persistent messages — no workspace mode buttons
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Brain, 
  Sparkles,
  Loader2,
  User,
  Bot,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Lightbulb,
  Zap,
  Command,
  Play,
  X,
} from 'lucide-react';
import { useAIMOSStreaming } from '@/hooks/useAIMOSStreaming';
import { useDreamInsights } from '@/hooks/useDreamInsights';
import { useChatPersistence, ChatMessage } from '@/hooks/useChatPersistence';
import { useAIIntegration } from '@/contexts/AIIntegrationContext';
import { osCommandParser, workflowEngine, getContextualSuggestions } from '@/lib/ai-integration';
import type { OSCommandResult } from '@/lib/ai-integration';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AdvancedPersistentChatProps {
  onDocumentsClick?: () => void;
}

export const AdvancedPersistentChat: React.FC<AdvancedPersistentChatProps> = ({ onDocumentsClick }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedOrchestration, setExpandedOrchestration] = useState<string | null>(null);
  const [showDreamInsights, setShowDreamInsights] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [pendingWorkflow, setPendingWorkflow] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { activePage, setActivePage, systemPrompt } = useAIIntegration();
  
  const { 
    messages, 
    isLoading: messagesLoading, 
    addMessage, 
    getSessionId 
  } = useChatPersistence();
  
  const { 
    insights: dreamInsights, 
    getRelevantInsights, 
    formatForChatContext,
    getSystemPromptInsights 
  } = useDreamInsights();
  
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

  useEffect(() => {
    setSuggestions(getContextualSuggestions(activePage));
  }, [activePage]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleOSCommand = async (commandInput: string): Promise<boolean> => {
    const command = osCommandParser.parse(commandInput);
    if (!command) return false;

    const result = await osCommandParser.execute(command);
    
    const commandMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: result.message,
      timestamp: new Date().toISOString(),
      metadata: {
        type: 'os_command',
        commandType: result.type,
        success: result.success,
        data: result.data,
        suggestions: result.suggestions,
      }
    };
    await addMessage(commandMessage);

    if (result.action === 'navigate' && result.targetApp) {
      setActivePage(result.targetApp);
      toast.success(`Navigated to ${result.targetApp}`);
    }

    if (result.action === 'confirm' && command.suggestedWorkflow) {
      setPendingWorkflow(command.suggestedWorkflow);
    }

    return true;
  };

  const executeWorkflow = async () => {
    if (!pendingWorkflow) return;
    
    const workflowMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `🔄 Running workflow: **${pendingWorkflow.name}**...`,
      timestamp: new Date().toISOString(),
      metadata: { type: 'workflow_start' }
    };
    await addMessage(workflowMessage);
    
    try {
      const workflow = workflowEngine.createFromTemplate(pendingWorkflow);
      const execution = await workflowEngine.execute(workflow);
      
      const resultMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: execution.status === 'completed'
          ? `✅ Workflow **${pendingWorkflow.name}** completed successfully!`
          : `❌ Workflow failed: ${execution.error}`,
        timestamp: new Date().toISOString(),
        metadata: { type: 'workflow_result', execution }
      };
      await addMessage(resultMessage);
    } catch (err) {
      toast.error('Workflow execution failed');
    }
    
    setPendingWorkflow(null);
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing || isStreaming) return;
    
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    await addMessage(userMessage);
    const userInput = input.trim();
    setInput('');
    setIsProcessing(true);

    try {
      const wasCommand = await handleOSCommand(userInput);
      if (wasCommand) {
        setIsProcessing(false);
        return;
      }

      const relevantInsights = getRelevantInsights(userMessage.content, 3);
      const insightContext = relevantInsights.length > 0 
        ? formatForChatContext(userMessage.content)
        : '';
      
      const enhancedQuery = `${userInput}${insightContext ? '\n' + insightContext : ''}`;

      const response = await startStreaming(
        enhancedQuery,
        getSessionId(),
        'user-' + crypto.randomUUID()
      );
      
      if (response && response.answer) {
        const aiMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.answer,
          timestamp: new Date().toISOString(),
          confidence: response.verification?.confidence,
          metadata: {
            model: 'LUCID-Stream',
            dreamInsights: relevantInsights.map(i => i.content),
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
        
        await addMessage(aiMessage);
      } else {
        toast.error('No response received. Check the edge function logs.');
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
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4">
        <div className="py-6 space-y-6 max-w-4xl mx-auto">
          {messages.map((message) => (
            <div key={message.id} className={cn(
              "flex gap-3",
              message.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}>
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className={cn(
                  message.role === 'user' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30"
                )}>
                  {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-cyan-400" />}
                </AvatarFallback>
              </Avatar>

              <div className={cn(
                "flex flex-col max-w-[80%]",
                message.role === 'user' ? "items-end" : "items-start"
              )}>
                <Card className={cn(
                  "px-4 py-3",
                  message.role === 'user' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-card/80 backdrop-blur-sm border-border/50"
                )}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </Card>
                
                <div className={cn(
                  "flex items-center gap-2 mt-1 px-1",
                  message.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  
                  {message.confidence && (
                    <Badge variant="outline" className="text-xs py-0 h-5 border-cyan-500/30 text-cyan-400">
                      {Math.round(message.confidence * 100)}% confident
                    </Badge>
                  )}
                  
                  {message.metadata?.dreamInsights && message.metadata.dreamInsights.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1 text-xs text-muted-foreground hover:text-purple-400"
                      onClick={() => setShowDreamInsights(!showDreamInsights)}
                    >
                      <Lightbulb className="w-3 h-3 mr-1 text-purple-400" />
                      {message.metadata.dreamInsights.length} insights
                    </Button>
                  )}
                  
                  {message.metadata?.orchestration && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1 text-xs text-muted-foreground hover:text-cyan-400"
                      onClick={() => setExpandedOrchestration(
                        expandedOrchestration === message.id ? null : message.id
                      )}
                    >
                      {expandedOrchestration === message.id ? (
                        <ChevronDown className="w-3 h-3 mr-1" />
                      ) : (
                        <ChevronRight className="w-3 h-3 mr-1" />
                      )}
                      Reasoning
                    </Button>
                  )}
                </div>

                {showDreamInsights && message.metadata?.dreamInsights && message.metadata.dreamInsights.length > 0 && (
                  <Card className="mt-2 p-3 bg-purple-500/5 backdrop-blur-sm w-full border-purple-500/30">
                    <p className="text-xs font-medium mb-2 text-purple-400 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" />
                      Dream Mode Insights Applied
                    </p>
                    <div className="space-y-1">
                      {message.metadata.dreamInsights.map((insight: string, i: number) => (
                        <p key={i} className="text-xs text-muted-foreground">
                          • {insight.length > 100 ? insight.substring(0, 100) + '...' : insight}
                        </p>
                      ))}
                    </div>
                  </Card>
                )}

                {expandedOrchestration === message.id && message.metadata?.orchestration && (
                  <Card className="mt-2 p-3 bg-muted/30 backdrop-blur-sm w-full border-border/50">
                    <p className="text-xs font-medium mb-2 text-cyan-400">Reasoning Trace</p>
                    <div className="space-y-2">
                      {message.metadata.orchestration.thinkingSteps?.slice(0, 5).map((step: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium text-foreground">{step.agent || step.name || step.type}</span>
                            <p className="text-muted-foreground mt-0.5">{step.detail || step.output?.substring(0, 100)}...</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {message.metadata.orchestration.verification && (
                      <div className="mt-2 pt-2 border-t border-border/50">
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400">
                            κ: {message.metadata.orchestration.verification.provenance_coverage?.toFixed(2)}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
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
                <AvatarFallback className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                  <Brain className="w-4 h-4 animate-pulse text-amber-500" />
                </AvatarFallback>
              </Avatar>
              <Card className="px-4 py-3 bg-card/80 backdrop-blur-sm border-amber-500/30">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  <span className="text-sm text-muted-foreground">
                    {currentMode ? `${currentMode} mode active...` : 'Thinking...'}
                  </span>
                </div>
                {orchestrationPlan && (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-muted-foreground">
                      Step {orchestrationPlan.currentStep || 0} of {orchestrationPlan.totalSteps || 0}
                    </div>
                    {thinkingSteps.length > 0 && (
                      <div className="text-xs text-cyan-400">
                        {thinkingSteps[thinkingSteps.length - 1]?.type}: {thinkingSteps[thinkingSteps.length - 1]?.detail?.substring(0, 60)}...
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area — clean, no workspace modes */}
      <div className="border-t border-border/50 p-4" style={{ background: 'hsl(var(--background) / 0.6)', backdropFilter: 'blur(24px)' }}>
        <div className="max-w-4xl mx-auto">
          {/* Workflow Confirmation */}
          {pendingWorkflow && (
            <div className="mb-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
              <div className="flex items-center gap-2 text-sm font-medium mb-1">
                <Zap className="w-4 h-4 text-primary" />
                Run workflow: {pendingWorkflow.name}?
              </div>
              <p className="text-xs text-muted-foreground mb-2">{pendingWorkflow.description}</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={executeWorkflow} className="text-xs">
                  <Play className="w-3 h-3 mr-1" /> Run
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPendingWorkflow(null)} className="text-xs">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Quick Suggestions */}
          {suggestions.length > 0 && !input && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {suggestions.slice(0, 4).map((s, i) => (
                <button
                  key={i}
                  onClick={() => setInput(s)}
                  className="px-2 py-1 text-[10px] rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border/30 flex items-center gap-1"
                >
                  <Command className="w-2.5 h-2.5" />
                  {s.length > 30 ? s.slice(0, 30) + '...' : s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Try "go to tasks" or "create a note"...`}
              disabled={isProcessing || isStreaming}
              className="flex-1 bg-background/50 border-border/50 focus:border-primary/50"
            />
            <Button 
              onClick={handleSend} 
              disabled={!input.trim() || isProcessing || isStreaming}
              className="w-10 h-10 p-0 rounded-full bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 shadow-lg shadow-primary/20"
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 shadow-inner" />
              )}
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Command className="w-3 h-3" /> OS Commands
            </span>
            <span>•</span>
            <span>{messages.length} messages</span>
          </div>
        </div>
      </div>
    </div>
  );
};
