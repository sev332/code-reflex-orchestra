// Auto-exploration mode with configurable intervals and diversity controls
import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDreamMode, DreamInsight, ReasoningBranch } from './useDreamMode';

export interface AutoExplorationConfig {
  intervalMs: number;           // Time between explorations (default: 30s)
  maxIterations: number;        // Maximum explorations per session
  diversityThreshold: number;   // 0-1, higher = more diverse prompts
  boredomDecayRate: number;     // How fast boredom recovers
  pauseOnLoop: boolean;         // Pause when loop detected
  minConfidenceThreshold: number; // Minimum insight confidence to record
  explorationStrategies: ExplorationStrategy[];
  enablePSR: boolean;           // Predictive Shortcut Refinement
}

export type ExplorationStrategy = 
  | 'breadth_first'      // Explore many topics shallowly
  | 'depth_first'        // Explore one topic deeply
  | 'random_walk'        // Random topic selection
  | 'insight_guided'     // Follow high-confidence insights
  | 'gap_filling'        // Find unexplored areas
  | 'meta_reflection';   // Reflect on past explorations

export interface ExplorationState {
  isActive: boolean;
  currentIteration: number;
  totalIterations: number;
  currentStrategy: ExplorationStrategy;
  currentPrompt: string;
  lastInsight: DreamInsight | null;
  loopsDetected: number;
  diversityScore: number;
  predictedNextStates: string[];
}

interface PromptCandidate {
  text: string;
  strategy: ExplorationStrategy;
  baseUtility: number;
  predictedUtility?: number;
}

const DEFAULT_CONFIG: AutoExplorationConfig = {
  intervalMs: 30000,
  maxIterations: 100,
  diversityThreshold: 0.6,
  boredomDecayRate: 0.1,
  pauseOnLoop: true,
  minConfidenceThreshold: 0.4,
  explorationStrategies: ['breadth_first', 'depth_first', 'insight_guided'],
  enablePSR: true
};

// Seed prompts for different strategies
const STRATEGY_PROMPTS: Record<ExplorationStrategy, string[]> = {
  breadth_first: [
    "What are the fundamental principles underlying this concept?",
    "How does this relate to other domains?",
    "What are the key components and their interactions?",
    "What assumptions are we making?",
    "What are alternative perspectives on this?"
  ],
  depth_first: [
    "Let's drill deeper into the core mechanism here.",
    "What are the edge cases and exceptions?",
    "How does this work at the implementation level?",
    "What are the mathematical foundations?",
    "What are the performance implications?"
  ],
  random_walk: [
    "What unexpected connections can we find?",
    "Let's explore a tangent that seems interesting.",
    "What if we approached this from a completely different angle?",
    "What's the most counterintuitive aspect?",
    "What would happen in an extreme scenario?"
  ],
  insight_guided: [
    "Based on our previous insight, what follows next?",
    "How can we build upon what we've discovered?",
    "What validates or challenges our last finding?",
    "What's the practical application of this insight?",
    "How does this insight change our understanding?"
  ],
  gap_filling: [
    "What haven't we considered yet?",
    "Where are the blind spots in our analysis?",
    "What questions haven't we asked?",
    "What would a critic say about our conclusions?",
    "What data are we missing?"
  ],
  meta_reflection: [
    "What patterns are emerging from our exploration?",
    "How effective has our reasoning been?",
    "What biases might be affecting our thinking?",
    "What have we learned about learning?",
    "How can we improve our exploration strategy?"
  ]
};

export function useAutoExploration() {
  const dreamMode = useDreamMode();
  const [config, setConfig] = useState<AutoExplorationConfig>(DEFAULT_CONFIG);
  const [state, setState] = useState<ExplorationState>({
    isActive: false,
    currentIteration: 0,
    totalIterations: 0,
    currentStrategy: 'breadth_first',
    currentPrompt: '',
    lastInsight: null,
    loopsDetected: 0,
    diversityScore: 1.0,
    predictedNextStates: []
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const promptHistoryRef = useRef<string[]>([]);
  const strategyIndexRef = useRef(0);

  // Predictive Utility Estimator (PUE) - implements the PSR concept
  const estimatePredictiveUtility = useCallback(async (
    prompt: string,
    strategy: ExplorationStrategy
  ): Promise<number> => {
    if (!config.enablePSR) return 0.5;

    // Get recent insights to predict future utility
    const recentInsights = dreamMode.insights.slice(0, 10);
    
    // Calculate semantic similarity to recent high-value insights
    let predictiveScore = 0.5;
    
    for (const insight of recentInsights) {
      if (insight.confidence > 0.7) {
        // Simple keyword overlap for now (could be enhanced with embeddings)
        const promptWords = new Set(prompt.toLowerCase().split(/\s+/));
        const insightWords = new Set(insight.content.toLowerCase().split(/\s+/));
        const overlap = [...promptWords].filter(w => insightWords.has(w)).length;
        const overlapScore = overlap / Math.max(promptWords.size, 1);
        
        // Boost if prompt builds on successful insights
        if (overlapScore > 0.2) {
          predictiveScore += 0.1 * insight.confidence;
        }
      }
    }

    // Penalize prompts too similar to recent ones (novelty bonus)
    const recentPrompts = promptHistoryRef.current.slice(-5);
    for (const recent of recentPrompts) {
      const similarity = calculateSimilarity(prompt, recent);
      if (similarity > 0.7) {
        predictiveScore -= 0.2;
      }
    }

    return Math.max(0.1, Math.min(1.0, predictiveScore));
  }, [config.enablePSR, dreamMode.insights]);

  // Simple word overlap similarity
  const calculateSimilarity = (a: string, b: string): number => {
    const wordsA = new Set(a.toLowerCase().split(/\s+/));
    const wordsB = new Set(b.toLowerCase().split(/\s+/));
    const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
    const union = new Set([...wordsA, ...wordsB]).size;
    return union > 0 ? intersection / union : 0;
  };

  // Generate prompt candidates
  const generatePromptCandidates = useCallback(async (): Promise<PromptCandidate[]> => {
    const candidates: PromptCandidate[] = [];
    
    for (const strategy of config.explorationStrategies) {
      const prompts = STRATEGY_PROMPTS[strategy];
      const selectedPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      
      // Customize prompt based on context
      let contextualizedPrompt = selectedPrompt;
      
      if (dreamMode.currentSession?.focus) {
        contextualizedPrompt = `Regarding "${dreamMode.currentSession.focus}": ${selectedPrompt}`;
      }
      
      if (strategy === 'insight_guided' && state.lastInsight) {
        contextualizedPrompt = `Given the insight "${state.lastInsight.content.substring(0, 100)}...": ${selectedPrompt}`;
      }

      const predictedUtility = await estimatePredictiveUtility(contextualizedPrompt, strategy);

      candidates.push({
        text: contextualizedPrompt,
        strategy,
        baseUtility: 0.7 + (Math.random() * 0.3), // Base utility with some variance
        predictedUtility
      });
    }

    return candidates;
  }, [config.explorationStrategies, dreamMode.currentSession, state.lastInsight, estimatePredictiveUtility]);

  // Select best prompt using diversity and utility
  const selectNextPrompt = useCallback(async (): Promise<{ prompt: string; strategy: ExplorationStrategy }> => {
    const candidates = await generatePromptCandidates();
    
    // Score each candidate
    const scoredCandidates = await Promise.all(
      candidates.map(async (c) => {
        const { score: boredomAdjustedScore } = await dreamMode.calculatePromptScore(c.text, c.baseUtility);
        
        // Combine base utility, boredom-adjusted score, and predictive utility
        const finalScore = (
          boredomAdjustedScore * 0.4 +
          (c.predictedUtility || 0.5) * 0.4 +
          (1 - calculateRecentStrategySaturation(c.strategy)) * 0.2
        );

        return { ...c, finalScore };
      })
    );

    // Sort by score and apply diversity threshold
    scoredCandidates.sort((a, b) => b.finalScore - a.finalScore);
    
    // Sometimes pick a random lower-ranked option for diversity
    const diversityRoll = Math.random();
    const selectedIndex = diversityRoll < config.diversityThreshold 
      ? 0 
      : Math.floor(Math.random() * Math.min(3, scoredCandidates.length));

    const selected = scoredCandidates[selectedIndex];
    
    // Keep history manageable
    if (promptHistoryRef.current.length > 50) {
      promptHistoryRef.current.shift();
    }

    return { prompt: selected.text, strategy: selected.strategy };
  }, [generatePromptCandidates, dreamMode, config.diversityThreshold]);

  // Calculate how much a strategy has been used recently
  const calculateRecentStrategySaturation = (strategy: ExplorationStrategy): number => {
    const recentStrategies = promptHistoryRef.current.slice(-10);
    return recentStrategies.length / 10;
  };

  // Execute one exploration iteration
  const executeExploration = useCallback(async () => {
    if (!dreamMode.currentSession) {
      toast.error('No active dream session');
      return;
    }

    const { prompt, strategy } = await selectNextPrompt();
    
    setState(prev => ({
      ...prev,
      currentIteration: prev.currentIteration + 1,
      currentStrategy: strategy,
      currentPrompt: prompt
    }));

    // Call the dream mode explore function
    await dreamMode.explore(prompt);
    
    // Check for loops using dream mode's loop state
    if (dreamMode.loopDetected && config.pauseOnLoop) {
      setState(prev => ({
        ...prev,
        loopsDetected: prev.loopsDetected + 1
      }));
      
      toast.warning('Loop detected - adjusting exploration strategy');
      strategyIndexRef.current = (strategyIndexRef.current + 1) % config.explorationStrategies.length;
    }

    // Track insights from dream mode
    if (dreamMode.insights.length > 0) {
      const latestInsight = dreamMode.insights[0];
      if (latestInsight && latestInsight.confidence >= config.minConfidenceThreshold) {
        setState(prev => ({ ...prev, lastInsight: latestInsight }));
      }
    }

    // Update diversity score
    const newDiversityScore = 1 - (state.loopsDetected / Math.max(1, state.currentIteration));
    setState(prev => ({ ...prev, diversityScore: newDiversityScore }));

    // Check if we've hit max iterations
    if (state.currentIteration >= config.maxIterations) {
      stop();
      toast.success('Auto-exploration completed maximum iterations');
    }
  }, [dreamMode, selectNextPrompt, config, state]);

  // Start auto-exploration
  const start = useCallback(async (focus?: string) => {
    // Start or resume dream session
    if (!dreamMode.currentSession && focus) {
      await dreamMode.startSession(focus);
    }

    if (!dreamMode.currentSession) {
      toast.error('Please start a dream session first');
      return;
    }

    setState(prev => ({ ...prev, isActive: true }));
    toast.success('Auto-exploration started');

    // Execute first exploration immediately
    await executeExploration();

    // Set up interval for subsequent explorations
    intervalRef.current = setInterval(executeExploration, config.intervalMs);
  }, [dreamMode, config.intervalMs, executeExploration]);

  // Pause auto-exploration
  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState(prev => ({ ...prev, isActive: false }));
    toast.info('Auto-exploration paused');
  }, []);

  // Stop and reset
  const stop = useCallback(() => {
    pause();
    setState({
      isActive: false,
      currentIteration: 0,
      totalIterations: 0,
      currentStrategy: 'breadth_first',
      currentPrompt: '',
      lastInsight: null,
      loopsDetected: 0,
      diversityScore: 1.0,
      predictedNextStates: []
    });
    promptHistoryRef.current = [];
    toast.info('Auto-exploration stopped');
  }, [pause]);

  // Update configuration
  const updateConfig = useCallback((updates: Partial<AutoExplorationConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    
    // If interval changed while running, restart
    if (updates.intervalMs && state.isActive && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(executeExploration, updates.intervalMs);
    }
  }, [state.isActive, executeExploration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    // State
    state,
    config,
    dreamMode,
    
    // Actions
    start,
    pause,
    stop,
    updateConfig,
    
    // Manual exploration
    executeExploration
  };
}
