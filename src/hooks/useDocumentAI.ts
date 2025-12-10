// AI-powered Document Processing Hook with RAG, Orchestration, and Version Control
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DocumentChunk {
  id: string;
  content: string;
  type: 'chapter' | 'section' | 'paragraph' | 'index' | 'summary';
  index: number;
  wordCount: number;
  tags: string[];
  metadata: Record<string, any>;
}

export interface DocumentVersion {
  id: string;
  version: number;
  createdAt: Date;
  changes: string[];
  metrics: {
    wordCount: number;
    chapters: number;
    quality: number;
  };
}

export interface AIThoughtStep {
  id: string;
  type: 'analyze' | 'chunk' | 'index' | 'improve' | 'organize' | 'rag_search' | 'version';
  status: 'pending' | 'active' | 'complete' | 'error';
  title: string;
  details: string;
  progress: number;
  timestamp: Date;
  metrics?: Record<string, any>;
}

export interface DocumentProject {
  id: string;
  name: string;
  content: string;
  chunks: DocumentChunk[];
  versions: DocumentVersion[];
  masterIndex: string;
  systemMap: Record<string, any>;
  metrics: {
    wordCount: number;
    chapters: number;
    sections: number;
    quality: number;
    readability: number;
  };
}

export function useDocumentAI() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [thoughtSteps, setThoughtSteps] = useState<AIThoughtStep[]>([]);
  const [currentProject, setCurrentProject] = useState<DocumentProject | null>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const addThoughtStep = useCallback((step: Omit<AIThoughtStep, 'id' | 'timestamp'>) => {
    const newStep: AIThoughtStep = {
      ...step,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setThoughtSteps(prev => [...prev, newStep]);
    return newStep.id;
  }, []);

  const updateThoughtStep = useCallback((id: string, updates: Partial<AIThoughtStep>) => {
    setThoughtSteps(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  // Chunk large documents intelligently
  const chunkDocument = useCallback(async (content: string): Promise<DocumentChunk[]> => {
    const stepId = addThoughtStep({
      type: 'chunk',
      status: 'active',
      title: 'Analyzing Document Structure',
      details: 'Detecting chapters, sections, and natural boundaries...',
      progress: 0,
    });

    const chunks: DocumentChunk[] = [];
    
    // Split by markdown headers
    const lines = content.split('\n');
    let currentChunk: { content: string; type: DocumentChunk['type']; startLine: number } = {
      content: '',
      type: 'paragraph',
      startLine: 0,
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect chapter (# Header)
      if (line.match(/^# /)) {
        if (currentChunk.content.trim()) {
          chunks.push(createChunk(currentChunk.content, currentChunk.type, chunks.length));
        }
        currentChunk = { content: line + '\n', type: 'chapter', startLine: i };
      }
      // Detect section (## Header)
      else if (line.match(/^## /)) {
        if (currentChunk.content.trim()) {
          chunks.push(createChunk(currentChunk.content, currentChunk.type, chunks.length));
        }
        currentChunk = { content: line + '\n', type: 'section', startLine: i };
      }
      // Continue current chunk
      else {
        currentChunk.content += line + '\n';
        
        // Split large chunks (>3000 chars)
        if (currentChunk.content.length > 3000 && line.match(/^$/)) {
          chunks.push(createChunk(currentChunk.content, currentChunk.type, chunks.length));
          currentChunk = { content: '', type: 'paragraph', startLine: i + 1 };
        }
      }

      updateThoughtStep(stepId, { progress: Math.floor((i / lines.length) * 100) });
    }

    // Add final chunk
    if (currentChunk.content.trim()) {
      chunks.push(createChunk(currentChunk.content, currentChunk.type, chunks.length));
    }

    updateThoughtStep(stepId, {
      status: 'complete',
      progress: 100,
      details: `Created ${chunks.length} chunks from document`,
      metrics: { totalChunks: chunks.length, avgChunkSize: Math.floor(content.length / chunks.length) },
    });

    return chunks;
  }, [addThoughtStep, updateThoughtStep]);

  const createChunk = (content: string, type: DocumentChunk['type'], index: number): DocumentChunk => ({
    id: crypto.randomUUID(),
    content,
    type,
    index,
    wordCount: content.split(/\s+/).filter(Boolean).length,
    tags: extractTags(content),
    metadata: { createdAt: new Date().toISOString() },
  });

  const extractTags = (content: string): string[] => {
    const words = content.toLowerCase().split(/\W+/);
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'just', 'don', 'now', 'and', 'but', 'or', 'this', 'that', 'these', 'those', 'it', 'its']);
    
    const wordFreq: Record<string, number> = {};
    words.forEach(w => {
      if (w.length > 3 && !stopWords.has(w)) {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
      }
    });
    
    return Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  };

  // RAG search through document
  const ragSearch = useCallback(async (query: string, chunks: DocumentChunk[]): Promise<DocumentChunk[]> => {
    const stepId = addThoughtStep({
      type: 'rag_search',
      status: 'active',
      title: 'RAG Search',
      details: `Searching for: "${query}"`,
      progress: 0,
    });

    // Simple semantic search (in production, use embeddings)
    const queryTerms = query.toLowerCase().split(/\s+/);
    const scored = chunks.map(chunk => {
      const content = chunk.content.toLowerCase();
      let score = 0;
      queryTerms.forEach(term => {
        const matches = (content.match(new RegExp(term, 'g')) || []).length;
        score += matches;
      });
      return { chunk, score };
    });

    const results = scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => s.chunk);

    updateThoughtStep(stepId, {
      status: 'complete',
      progress: 100,
      details: `Found ${results.length} relevant chunks`,
      metrics: { resultsCount: results.length, topScores: scored.slice(0, 3).map(s => s.score) },
    });

    return results;
  }, [addThoughtStep, updateThoughtStep]);

  // Generate master index
  const generateIndex = useCallback(async (chunks: DocumentChunk[]): Promise<string> => {
    const stepId = addThoughtStep({
      type: 'index',
      status: 'active',
      title: 'Generating Master Index',
      details: 'Building hierarchical document structure...',
      progress: 0,
    });

    let index = '# Master Index\n\n';
    
    chunks.forEach((chunk, i) => {
      if (chunk.type === 'chapter') {
        const title = chunk.content.split('\n')[0].replace(/^#\s*/, '');
        index += `## ${i + 1}. ${title}\n`;
        index += `- Words: ${chunk.wordCount}\n`;
        index += `- Tags: ${chunk.tags.join(', ')}\n\n`;
      } else if (chunk.type === 'section') {
        const title = chunk.content.split('\n')[0].replace(/^##\s*/, '');
        index += `  ### ${title}\n`;
      }
      
      updateThoughtStep(stepId, { progress: Math.floor((i / chunks.length) * 100) });
    });

    updateThoughtStep(stepId, {
      status: 'complete',
      progress: 100,
      details: 'Master index generated successfully',
    });

    return index;
  }, [addThoughtStep, updateThoughtStep]);

  // AI-powered document improvement
  const improveDocument = useCallback(async (
    content: string,
    instruction: string,
    onStream: (chunk: string) => void
  ): Promise<string> => {
    const stepId = addThoughtStep({
      type: 'improve',
      status: 'active',
      title: 'AI Document Improvement',
      details: instruction,
      progress: 0,
    });

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/document-ai-orchestrator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: 'improve',
          content,
          instruction,
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error('AI improvement failed');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const chunk = parsed.choices?.[0]?.delta?.content;
              if (chunk) {
                result += chunk;
                onStream(chunk);
                updateThoughtStep(stepId, { 
                  progress: Math.min(95, Math.floor((result.length / content.length) * 100)),
                  details: `Improving... (${result.length} chars generated)`,
                });
              }
            } catch {}
          }
        }
      }

      updateThoughtStep(stepId, {
        status: 'complete',
        progress: 100,
        details: `Document improved: ${result.length} characters`,
        metrics: { originalLength: content.length, newLength: result.length },
      });

      return result;
    } catch (error: any) {
      updateThoughtStep(stepId, {
        status: 'error',
        details: `Error: ${error.message}`,
      });
      throw error;
    }
  }, [addThoughtStep, updateThoughtStep]);

  // Auto-build document with AI orchestration
  const autoBuildDocument = useCallback(async (
    project: DocumentProject,
    targetMetrics: { minWords: number; minChapters: number; minQuality: number },
    onProgress: (project: DocumentProject) => void
  ): Promise<DocumentProject> => {
    setIsProcessing(true);
    setThoughtSteps([]);

    let currentProject = { ...project };

    try {
      // Phase 1: Analyze current state
      const analyzeStep = addThoughtStep({
        type: 'analyze',
        status: 'active',
        title: 'Phase 1: Analyzing Document',
        details: 'Evaluating current structure and content quality...',
        progress: 0,
      });

      const chunks = await chunkDocument(currentProject.content);
      currentProject.chunks = chunks;
      
      updateThoughtStep(analyzeStep, {
        status: 'complete',
        progress: 100,
        details: `Found ${chunks.length} sections, ${currentProject.metrics.wordCount} words`,
      });

      // Phase 2: Generate index
      const masterIndex = await generateIndex(chunks);
      currentProject.masterIndex = masterIndex;
      onProgress(currentProject);

      // Phase 3: Improve content iteratively
      let iterations = 0;
      const maxIterations = 10;

      while (
        iterations < maxIterations &&
        (currentProject.metrics.wordCount < targetMetrics.minWords ||
         currentProject.chunks.filter(c => c.type === 'chapter').length < targetMetrics.minChapters)
      ) {
        iterations++;

        const improveStep = addThoughtStep({
          type: 'improve',
          status: 'active',
          title: `Phase 3: Improvement Iteration ${iterations}`,
          details: `Target: ${targetMetrics.minWords} words, ${targetMetrics.minChapters} chapters`,
          progress: 0,
        });

        // Find weakest section
        const weakestChunk = chunks.reduce((min, c) => 
          c.wordCount < min.wordCount ? c : min
        , chunks[0]);

        // Expand weak section using AI
        let expandedContent = '';
        await improveDocument(
          weakestChunk.content,
          `Expand this section to at least 500 words while maintaining quality. Add more detail, examples, and depth.`,
          (chunk) => {
            expandedContent += chunk;
            setStreamingContent(prev => prev + chunk);
          }
        );

        // Update chunk
        weakestChunk.content = expandedContent;
        weakestChunk.wordCount = expandedContent.split(/\s+/).filter(Boolean).length;

        // Recalculate metrics
        currentProject.metrics.wordCount = chunks.reduce((sum, c) => sum + c.wordCount, 0);
        currentProject.content = chunks.map(c => c.content).join('\n\n');

        updateThoughtStep(improveStep, {
          status: 'complete',
          progress: 100,
          details: `Now at ${currentProject.metrics.wordCount} words`,
          metrics: { iteration: iterations, wordCount: currentProject.metrics.wordCount },
        });

        onProgress(currentProject);
      }

      // Phase 4: Create version
      const version: DocumentVersion = {
        id: crypto.randomUUID(),
        version: currentProject.versions.length + 1,
        createdAt: new Date(),
        changes: [`Auto-build completed with ${iterations} iterations`],
        metrics: {
          wordCount: currentProject.metrics.wordCount,
          chapters: chunks.filter(c => c.type === 'chapter').length,
          quality: currentProject.metrics.quality,
        },
      };
      currentProject.versions.push(version);

      addThoughtStep({
        type: 'version',
        status: 'complete',
        title: 'Version Created',
        details: `Version ${version.version} saved`,
        progress: 100,
      });

      setCurrentProject(currentProject);
      toast.success('Document auto-build completed!');
      return currentProject;

    } catch (error: any) {
      toast.error(`Auto-build failed: ${error.message}`);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [addThoughtStep, updateThoughtStep, chunkDocument, generateIndex, improveDocument]);

  // Upload and process document
  const uploadAndProcess = useCallback(async (file: File): Promise<DocumentProject> => {
    setIsProcessing(true);
    setThoughtSteps([]);

    const uploadStep = addThoughtStep({
      type: 'analyze',
      status: 'active',
      title: 'Uploading Document',
      details: `Processing ${file.name}...`,
      progress: 0,
    });

    try {
      const content = await file.text();
      
      updateThoughtStep(uploadStep, {
        progress: 50,
        details: `Loaded ${content.length} characters`,
      });

      const chunks = await chunkDocument(content);
      const masterIndex = await generateIndex(chunks);
      const wordCount = content.split(/\s+/).filter(Boolean).length;

      const project: DocumentProject = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^/.]+$/, ''),
        content,
        chunks,
        versions: [{
          id: crypto.randomUUID(),
          version: 1,
          createdAt: new Date(),
          changes: ['Initial upload'],
          metrics: { wordCount, chapters: chunks.filter(c => c.type === 'chapter').length, quality: 0.7 },
        }],
        masterIndex,
        systemMap: {},
        metrics: {
          wordCount,
          chapters: chunks.filter(c => c.type === 'chapter').length,
          sections: chunks.filter(c => c.type === 'section').length,
          quality: 0.7,
          readability: 0.8,
        },
      };

      updateThoughtStep(uploadStep, {
        status: 'complete',
        progress: 100,
        details: `Processed: ${chunks.length} chunks, ${wordCount} words`,
      });

      setCurrentProject(project);
      toast.success('Document uploaded and processed!');
      return project;

    } catch (error: any) {
      updateThoughtStep(uploadStep, {
        status: 'error',
        details: `Upload failed: ${error.message}`,
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [addThoughtStep, updateThoughtStep, chunkDocument, generateIndex]);

  const stopProcessing = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsProcessing(false);
  }, []);

  const clearThoughts = useCallback(() => {
    setThoughtSteps([]);
  }, []);

  return {
    isProcessing,
    thoughtSteps,
    currentProject,
    streamingContent,
    chunkDocument,
    ragSearch,
    generateIndex,
    improveDocument,
    autoBuildDocument,
    uploadAndProcess,
    stopProcessing,
    clearThoughts,
    setCurrentProject,
    setStreamingContent,
  };
}
