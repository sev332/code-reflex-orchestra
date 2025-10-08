import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EditSuggestion {
  edited_text: string;
  reasoning: string;
  impact: string;
  alternatives: string[];
}

export const useDocumentEditor = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isResearching, setIsResearching] = useState(false);

  const analyzeSection = async (
    documentId: string,
    chunkId: string | null,
    selectedText: string
  ): Promise<string | null> => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('document-ai-editor', {
        body: {
          action: 'analyze_section',
          documentId,
          chunkId,
          selectedText,
        },
      });

      if (error) throw error;
      return data.analysis;
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(`Analysis failed: ${error.message}`);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const suggestEdit = async (
    documentId: string,
    chunkId: string | null,
    selectedText: string,
    startPosition: number,
    endPosition: number,
    userPrompt: string
  ): Promise<EditSuggestion | null> => {
    setIsEditing(true);
    try {
      toast.info('AI is analyzing and suggesting edits...');

      const { data, error } = await supabase.functions.invoke('document-ai-editor', {
        body: {
          action: 'suggest_edit',
          documentId,
          chunkId,
          selectedText,
          startPosition,
          endPosition,
          userPrompt,
        },
      });

      if (error) throw error;

      toast.success('Edit suggestion generated!');
      return {
        edited_text: data.edited_text,
        reasoning: data.reasoning,
        impact: data.impact,
        alternatives: data.alternatives || [],
      };
    } catch (error: any) {
      console.error('Edit suggestion error:', error);
      toast.error(`Edit failed: ${error.message}`);
      return null;
    } finally {
      setIsEditing(false);
    }
  };

  const deepResearch = async (
    documentId: string,
    chunkId: string | null,
    selectedText: string,
    researchPrompt: string
  ): Promise<string | null> => {
    setIsResearching(true);
    try {
      toast.info('Conducting deep research... This may take a moment.');

      const { data, error } = await supabase.functions.invoke('document-ai-editor', {
        body: {
          action: 'deep_research',
          documentId,
          chunkId,
          selectedText,
          userPrompt: researchPrompt,
          includeResearch: true,
        },
      });

      if (error) throw error;

      toast.success('Research completed!');
      return data.research;
    } catch (error: any) {
      console.error('Research error:', error);
      toast.error(`Research failed: ${error.message}`);
      return null;
    } finally {
      setIsResearching(false);
    }
  };

  const getEditHistory = async (documentId: string) => {
    try {
      const { data, error } = await supabase
        .from('document_edit_history')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Get history error:', error);
      return [];
    }
  };

  const saveManualEdit = async (
    documentId: string,
    chunkId: string | null,
    originalContent: string,
    newContent: string,
    startPosition: number,
    endPosition: number
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('document_edit_history')
        .insert({
          document_id: documentId,
          chunk_id: chunkId,
          user_id: user.id,
          edit_type: 'manual',
          original_content: originalContent,
          new_content: newContent,
          start_position: startPosition,
          end_position: endPosition,
        });

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Save edit error:', error);
      return false;
    }
  };

  return {
    isAnalyzing,
    isEditing,
    isResearching,
    analyzeSection,
    suggestEdit,
    deepResearch,
    getEditHistory,
    saveManualEdit,
  };
};
