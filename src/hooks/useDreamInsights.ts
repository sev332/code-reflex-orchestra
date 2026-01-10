// Hook to connect Dream Mode insights to main chat
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DreamInsight {
  id: string;
  content: string;
  insight_type: string | null;
  confidence: number | null;
  frequency: number | null;
  reasoning_style: string | null;
  tags: string[] | null;
  created_at: string;
}

export interface DreamJournalEntry {
  id: string;
  title: string;
  content: string;
  entry_type: string;
  tags: string[] | null;
  created_at: string;
}

export function useDreamInsights() {
  const [insights, setInsights] = useState<DreamInsight[]>([]);
  const [journal, setJournal] = useState<DreamJournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Fetch recent insights from dream sessions
  const fetchInsights = useCallback(async (limit = 50) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('dream_insights')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      setInsights(data || []);
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Error fetching dream insights:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch journal entries
  const fetchJournal = useCallback(async (limit = 20) => {
    try {
      const { data, error } = await supabase
        .from('dream_journal')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setJournal(data || []);
    } catch (error) {
      console.error('Error fetching dream journal:', error);
    }
  }, []);

  // Get insights relevant to a query (for RAG-like retrieval)
  const getRelevantInsights = useCallback((query: string, maxResults = 5): DreamInsight[] => {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    // Score each insight based on relevance
    const scoredInsights = insights.map(insight => {
      let score = 0;
      const contentLower = insight.content.toLowerCase();
      
      // Check word matches
      queryWords.forEach(word => {
        if (contentLower.includes(word)) score += 2;
      });

      // Check tag matches
      insight.tags?.forEach(tag => {
        if (queryLower.includes(tag.toLowerCase())) score += 3;
      });

      // Boost by confidence and frequency
      score += (insight.confidence || 0.5) * 2;
      score += Math.min((insight.frequency || 1) * 0.5, 3);

      return { insight, score };
    });

    // Sort by score and return top results
    return scoredInsights
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(item => item.insight);
  }, [insights]);

  // Get high-confidence insights for system prompts
  const getSystemPromptInsights = useCallback((): string[] => {
    return insights
      .filter(i => (i.confidence || 0) >= 0.8 && (i.frequency || 0) >= 2)
      .slice(0, 10)
      .map(i => i.content);
  }, [insights]);

  // Get insights by type
  const getInsightsByType = useCallback((type: string): DreamInsight[] => {
    return insights.filter(i => i.insight_type === type);
  }, [insights]);

  // Get improvement suggestions
  const getImprovementSuggestions = useCallback((): DreamInsight[] => {
    return insights.filter(i => 
      i.insight_type === 'improvement' || 
      i.content.toLowerCase().includes('improve') ||
      i.content.toLowerCase().includes('should') ||
      i.content.toLowerCase().includes('need')
    ).slice(0, 10);
  }, [insights]);

  // Format insights for chat context
  const formatForChatContext = useCallback((query: string): string => {
    const relevant = getRelevantInsights(query, 3);
    
    if (relevant.length === 0) return '';

    return `\n\n[Dream Mode Insights]\n${relevant.map(i => 
      `- ${i.content} (confidence: ${((i.confidence || 0) * 100).toFixed(0)}%)`
    ).join('\n')}`;
  }, [getRelevantInsights]);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('dream_insights_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'dream_insights' },
        (payload) => {
          setInsights(prev => [payload.new as DreamInsight, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchInsights();
    fetchJournal();
  }, [fetchInsights, fetchJournal]);

  return {
    insights,
    journal,
    isLoading,
    lastSyncTime,
    fetchInsights,
    fetchJournal,
    getRelevantInsights,
    getSystemPromptInsights,
    getInsightsByType,
    getImprovementSuggestions,
    formatForChatContext
  };
}
