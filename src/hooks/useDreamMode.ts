// Dream Mode hook with loop detection, boredom mechanic, and data persistence
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface DreamSession {
  id: string;
  focus: string;
  status: 'active' | 'paused' | 'complete';
  documents: string[];
  started_at: string;
  ended_at?: string;
  total_explorations: number;
  total_insights: number;
  metadata: Record<string, any>;
}

export interface DreamInsight {
  id: string;
  session_id: string;
  content: string;
  insight_type: 'discovery' | 'improvement' | 'pattern' | 'warning' | 'meta';
  source_prompt?: string;
  reasoning_style?: 'analytical' | 'creative' | 'systematic' | 'intuitive';
  confidence: number;
  frequency: number;
  tags: string[];
  created_at: string;
}

export interface ReasoningBranch {
  id: string;
  name: string;
  style: 'analytical' | 'creative' | 'systematic' | 'intuitive';
  output: string;
  score: number;
  insights: string[];
  timestamp: string;
}

export interface ReasoningPath {
  id: string;
  session_id: string;
  prompt: string;
  context?: string;
  status: 'exploring' | 'complete' | 'paused';
  best_style?: string;
  best_score?: number;
  branches: ReasoningBranch[];
  insights_extracted: string[];
  created_at: string;
}

export interface JournalEntry {
  id: string;
  session_id: string;
  entry_type: 'discovery' | 'experiment' | 'reflection' | 'improvement' | 'loop_break' | 'insight';
  title: string;
  content: string;
  tags: string[];
  linked_docs: string[];
  created_at: string;
}

export interface PromptUsage {
  prompt_hash: string;
  prompt_text: string;
  times_selected: number;
  last_selected_at: string;
  decay_factor: number;
  utility_score: number;
  decayed_score: number;
}

interface LoopDetectionResult {
  isLoop: boolean;
  loopCount: number;
  similarExecutions: number;
}

// Hash function for loop detection
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

export function useDreamMode() {
  const [currentSession, setCurrentSession] = useState<DreamSession | null>(null);
  const [insights, setInsights] = useState<DreamInsight[]>([]);
  const [reasoningPaths, setReasoningPaths] = useState<ReasoningPath[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [promptUsage, setPromptUsage] = useState<Map<string, PromptUsage>>(new Map());
  const [isExploring, setIsExploring] = useState(false);
  const [loopDetected, setLoopDetected] = useState(false);
  const [explorationProgress, setExplorationProgress] = useState(0);
  const [currentThought, setCurrentThought] = useState('');
  
  const executionHistoryRef = useRef<Map<string, Array<{ inputHash: string; outputHash: string; timestamp: string }>>>(new Map());

  // Start a new dream session
  const startSession = useCallback(async (focus: string): Promise<DreamSession | null> => {
    try {
      const { data, error } = await supabase
        .from('dream_sessions')
        .insert({
          focus: focus || 'General exploration',
          status: 'active',
          documents: [],
          metadata: { version: '2.0', features: ['loop_detection', 'boredom_mechanic', 'temporal_decay'] }
        })
        .select()
        .single();

      if (error) throw error;

      const session: DreamSession = {
        id: data.id,
        focus: data.focus,
        status: data.status as 'active' | 'paused' | 'complete',
        documents: data.documents || [],
        started_at: data.started_at,
        total_explorations: 0,
        total_insights: 0,
        metadata: (data.metadata as Record<string, any>) || {}
      };

      setCurrentSession(session);
      setInsights([]);
      setReasoningPaths([]);
      setJournal([]);
      setPromptUsage(new Map());
      executionHistoryRef.current = new Map();
      setLoopDetected(false);

      // Add initial journal entry
      await addJournalEntry(session.id, {
        entry_type: 'discovery',
        title: 'Dream Session Started',
        content: `Started exploration session with focus: "${focus}". Loop detection and boredom mechanic enabled.`,
        tags: ['initialization', 'session_start']
      });

      toast.success('Dream Mode activated');
      return session;
    } catch (error) {
      console.error('Failed to start dream session:', error);
      toast.error('Failed to start dream session');
      return null;
    }
  }, []);

  // Detect loops using execution history
  const detectLoop = useCallback(async (
    nodeType: string,
    input: string,
    output: string
  ): Promise<LoopDetectionResult> => {
    if (!currentSession) return { isLoop: false, loopCount: 0, similarExecutions: 0 };

    const inputHash = await hashString(input);
    const outputHash = await hashString(output);

    // Get history for this node type
    const history = executionHistoryRef.current.get(nodeType) || [];
    
    // Check for repeated input/output pairs in last 5 executions
    const recentHistory = history.slice(-5);
    const matches = recentHistory.filter(
      h => h.inputHash === inputHash && h.outputHash === outputHash
    );

    const isLoop = matches.length >= 2;
    const loopCount = matches.length;

    // Add to history
    history.push({
      inputHash,
      outputHash,
      timestamp: new Date().toISOString()
    });

    // Keep only last 20 executions per node
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    executionHistoryRef.current.set(nodeType, history);

    // Save to database
    await supabase.from('dream_execution_history').insert({
      session_id: currentSession.id,
      node_type: nodeType,
      input_hash: inputHash,
      output_hash: outputHash,
      input_preview: input.substring(0, 200),
      output_preview: output.substring(0, 200),
      is_loop: isLoop,
      loop_count: loopCount
    });

    if (isLoop) {
      setLoopDetected(true);
      await addJournalEntry(currentSession.id, {
        entry_type: 'loop_break',
        title: `Loop Detected in ${nodeType}`,
        content: `Detected ${loopCount} repeated executions. Applying boredom mechanic to diversify exploration.`,
        tags: ['loop_detection', 'self_correction', nodeType]
      });
    }

    return { isLoop, loopCount, similarExecutions: matches.length };
  }, [currentSession]);

  // Calculate prompt score with boredom mechanic
  const calculatePromptScore = useCallback(async (
    promptText: string,
    baseUtility: number = 0.7
  ): Promise<{ score: number; usage: PromptUsage }> => {
    if (!currentSession) return { score: baseUtility, usage: {} as PromptUsage };

    const promptHash = await hashString(promptText);
    
    // Get existing usage from state or database
    let usage = promptUsage.get(promptHash);
    
    if (!usage) {
      // Check database
      const { data } = await supabase
        .from('dream_prompt_usage')
        .select('*')
        .eq('session_id', currentSession.id)
        .eq('prompt_hash', promptHash)
        .single();

      if (data) {
        usage = {
          prompt_hash: data.prompt_hash,
          prompt_text: data.prompt_text,
          times_selected: data.times_selected,
          last_selected_at: data.last_selected_at,
          decay_factor: data.decay_factor,
          utility_score: data.utility_score,
          decayed_score: data.decayed_score
        };
      }
    }

    const now = Date.now();
    const timeSinceLastUse = usage 
      ? now - new Date(usage.last_selected_at).getTime()
      : Infinity;
    
    // Time-based recovery: decay penalty reduces over time (5 min half-life)
    const timeDecay = Math.exp(-timeSinceLastUse / (1000 * 60 * 5));
    
    const timesSelected = usage?.times_selected || 0;
    const decayFactor = usage?.decay_factor || 0.1;
    
    // Boredom penalty: reduces score based on usage, but recovers over time
    const boredomPenalty = timesSelected * decayFactor * (1 - timeDecay);
    
    const finalScore = Math.max(0.1, baseUtility - boredomPenalty);

    const updatedUsage: PromptUsage = {
      prompt_hash: promptHash,
      prompt_text: promptText,
      times_selected: timesSelected,
      last_selected_at: usage?.last_selected_at || new Date().toISOString(),
      decay_factor: decayFactor,
      utility_score: baseUtility,
      decayed_score: finalScore
    };

    return { score: finalScore, usage: updatedUsage };
  }, [currentSession, promptUsage]);

  // Update prompt usage after selection
  const recordPromptUsage = useCallback(async (promptText: string, utilityScore: number) => {
    if (!currentSession) return;

    const promptHash = await hashString(promptText);
    const existingUsage = promptUsage.get(promptHash);

    const newUsage: PromptUsage = {
      prompt_hash: promptHash,
      prompt_text: promptText,
      times_selected: (existingUsage?.times_selected || 0) + 1,
      last_selected_at: new Date().toISOString(),
      decay_factor: existingUsage?.decay_factor || 0.1,
      utility_score: utilityScore,
      decayed_score: utilityScore // Will be recalculated on next use
    };

    // Update state
    setPromptUsage(prev => new Map(prev).set(promptHash, newUsage));

    // Upsert to database
    await supabase.from('dream_prompt_usage').upsert({
      session_id: currentSession.id,
      prompt_hash: promptHash,
      prompt_text: promptText,
      times_selected: newUsage.times_selected,
      last_selected_at: newUsage.last_selected_at,
      decay_factor: newUsage.decay_factor,
      utility_score: utilityScore,
      decayed_score: newUsage.decayed_score
    }, {
      onConflict: 'session_id,prompt_hash'
    });
  }, [currentSession, promptUsage]);

  // Select best prompt using boredom mechanic
  const selectBestPrompt = useCallback(async (
    prompts: Array<{ text: string; baseUtility: number }>
  ): Promise<{ text: string; score: number }> => {
    const scoredPrompts = await Promise.all(
      prompts.map(async p => {
        const { score } = await calculatePromptScore(p.text, p.baseUtility);
        return { text: p.text, score };
      })
    );

    // Sort by score descending
    scoredPrompts.sort((a, b) => b.score - a.score);

    const selected = scoredPrompts[0];
    
    // Record usage
    await recordPromptUsage(selected.text, selected.score);

    return selected;
  }, [calculatePromptScore, recordPromptUsage]);

  // Add insight to database
  const addInsight = useCallback(async (
    content: string,
    options: {
      insight_type?: DreamInsight['insight_type'];
      source_prompt?: string;
      reasoning_style?: ReasoningBranch['style'];
      confidence?: number;
      tags?: string[];
    } = {}
  ): Promise<DreamInsight | null> => {
    if (!currentSession) return null;

    try {
      // Check for duplicate/similar insights
      const contentHash = await hashString(content);
      const { data: existing } = await supabase
        .from('dream_insights')
        .select('*')
        .eq('session_id', currentSession.id)
        .ilike('content', `%${content.substring(0, 50)}%`)
        .limit(1);

      if (existing && existing.length > 0) {
        // Update frequency instead of creating duplicate
        await supabase
          .from('dream_insights')
          .update({ 
            frequency: existing[0].frequency + 1,
            last_occurred_at: new Date().toISOString()
          })
          .eq('id', existing[0].id);

        return existing[0] as DreamInsight;
      }

      const { data, error } = await supabase
        .from('dream_insights')
        .insert({
          session_id: currentSession.id,
          content,
          insight_type: options.insight_type || 'discovery',
          source_prompt: options.source_prompt,
          reasoning_style: options.reasoning_style,
          confidence: options.confidence || 0.5,
          tags: options.tags || []
        })
        .select()
        .single();

      if (error) throw error;

      const insight: DreamInsight = {
        id: data.id,
        session_id: data.session_id,
        content: data.content,
        insight_type: data.insight_type as DreamInsight['insight_type'],
        source_prompt: data.source_prompt,
        reasoning_style: data.reasoning_style as ReasoningBranch['style'] | undefined,
        confidence: data.confidence,
        frequency: data.frequency,
        tags: data.tags || [],
        created_at: data.created_at
      };

      setInsights(prev => [insight, ...prev]);

      // Update session stats
      await supabase
        .from('dream_sessions')
        .update({ total_insights: (currentSession.total_insights || 0) + 1 })
        .eq('id', currentSession.id);

      return insight;
    } catch (error) {
      console.error('Failed to add insight:', error);
      return null;
    }
  }, [currentSession]);

  // Add reasoning path with branches
  const addReasoningPath = useCallback(async (
    prompt: string,
    branches: ReasoningBranch[],
    context?: string
  ): Promise<ReasoningPath | null> => {
    if (!currentSession) return null;

    try {
      // Find best branch
      const bestBranch = branches.reduce((best, current) => 
        current.score > best.score ? current : best
      );

      // Extract insights from branches
      const allInsights = branches.flatMap(b => b.insights);
      const uniqueInsights = [...new Set(allInsights)];

      const { data, error } = await supabase
        .from('dream_reasoning_paths')
        .insert({
          session_id: currentSession.id,
          prompt,
          context,
          status: 'complete',
          best_style: bestBranch.style,
          best_score: bestBranch.score,
          branches: branches as any,
          insights_extracted: uniqueInsights
        })
        .select()
        .single();

      if (error) throw error;

      const path: ReasoningPath = {
        id: data.id,
        session_id: data.session_id,
        prompt: data.prompt,
        context: data.context,
        status: data.status as any,
        best_style: data.best_style,
        best_score: data.best_score,
        branches: (data.branches as any) || [],
        insights_extracted: data.insights_extracted || [],
        created_at: data.created_at
      };

      setReasoningPaths(prev => [path, ...prev]);

      // Save unique insights
      for (const insight of uniqueInsights) {
        await addInsight(insight, {
          source_prompt: prompt,
          reasoning_style: bestBranch.style,
          confidence: bestBranch.score
        });
      }

      // Update session stats
      await supabase
        .from('dream_sessions')
        .update({ total_explorations: (currentSession.total_explorations || 0) + 1 })
        .eq('id', currentSession.id);

      return path;
    } catch (error) {
      console.error('Failed to add reasoning path:', error);
      return null;
    }
  }, [currentSession, addInsight]);

  // Add journal entry
  const addJournalEntry = useCallback(async (
    sessionId: string,
    entry: {
      entry_type: JournalEntry['entry_type'];
      title: string;
      content: string;
      tags?: string[];
      linked_docs?: string[];
    }
  ): Promise<JournalEntry | null> => {
    try {
      const { data, error } = await supabase
        .from('dream_journal')
        .insert({
          session_id: sessionId,
          entry_type: entry.entry_type,
          title: entry.title,
          content: entry.content,
          tags: entry.tags || [],
          linked_docs: entry.linked_docs || []
        })
        .select()
        .single();

      if (error) throw error;

      const journalEntry: JournalEntry = {
        id: data.id,
        session_id: data.session_id,
        entry_type: data.entry_type as JournalEntry['entry_type'],
        title: data.title,
        content: data.content,
        tags: data.tags || [],
        linked_docs: data.linked_docs || [],
        created_at: data.created_at
      };

      setJournal(prev => [journalEntry, ...prev]);
      return journalEntry;
    } catch (error) {
      console.error('Failed to add journal entry:', error);
      return null;
    }
  }, []);

  // Load session data
  const loadSessionData = useCallback(async (sessionId: string) => {
    try {
      const [insightsRes, pathsRes, journalRes] = await Promise.all([
        supabase.from('dream_insights').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }),
        supabase.from('dream_reasoning_paths').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }),
        supabase.from('dream_journal').select('*').eq('session_id', sessionId).order('created_at', { ascending: false })
      ]);

      if (insightsRes.data) setInsights(insightsRes.data as DreamInsight[]);
      if (pathsRes.data) {
        setReasoningPaths(pathsRes.data.map(p => ({
          ...p,
          branches: (p.branches as any) || []
        })) as ReasoningPath[]);
      }
      if (journalRes.data) setJournal(journalRes.data as JournalEntry[]);
    } catch (error) {
      console.error('Failed to load session data:', error);
    }
  }, []);

  // End session
  const endSession = useCallback(async () => {
    if (!currentSession) return;

    try {
      await supabase
        .from('dream_sessions')
        .update({
          status: 'complete',
          ended_at: new Date().toISOString()
        })
        .eq('id', currentSession.id);

      await addJournalEntry(currentSession.id, {
        entry_type: 'reflection',
        title: 'Dream Session Complete',
        content: `Session ended. Generated ${insights.length} insights across ${reasoningPaths.length} exploration paths.`,
        tags: ['session_end', 'summary']
      });

      setCurrentSession(prev => prev ? { ...prev, status: 'complete' } : null);
      toast.success('Dream session completed');
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }, [currentSession, insights.length, reasoningPaths.length, addJournalEntry]);

  // Get all sessions for review
  const getAllSessions = useCallback(async (): Promise<DreamSession[]> => {
    try {
      const { data, error } = await supabase
        .from('dream_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as DreamSession[];
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      return [];
    }
  }, []);

  // Get insights for main chat access
  const getInsightsForChat = useCallback(async (limit: number = 10): Promise<DreamInsight[]> => {
    try {
      const { data, error } = await supabase
        .from('dream_insights')
        .select('*')
        .order('confidence', { ascending: false })
        .order('frequency', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as DreamInsight[];
    } catch (error) {
      console.error('Failed to fetch insights:', error);
      return [];
    }
  }, []);

  return {
    // Session management
    currentSession,
    startSession,
    endSession,
    loadSessionData,
    getAllSessions,
    
    // Data
    insights,
    reasoningPaths,
    journal,
    
    // Loop detection & boredom
    detectLoop,
    selectBestPrompt,
    calculatePromptScore,
    loopDetected,
    setLoopDetected,
    
    // Data creation
    addInsight,
    addReasoningPath,
    addJournalEntry: (entry: Parameters<typeof addJournalEntry>[1]) => 
      currentSession ? addJournalEntry(currentSession.id, entry) : Promise.resolve(null),
    
    // State
    isExploring,
    setIsExploring,
    explorationProgress,
    setExplorationProgress,
    currentThought,
    setCurrentThought,
    
    // Chat integration
    getInsightsForChat
  };
}
