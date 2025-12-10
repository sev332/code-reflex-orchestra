// Full-featured Document IDE with AI Orchestration
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, Plus, Save, Download, Upload, Trash2, Copy, ClipboardPaste,
  FolderTree, Tag, Map, Wand2, Play, Pause, RotateCcw, ChevronRight,
  ChevronDown, Search, Settings, Sparkles, BookOpen, Layers, GitBranch,
  Brain, Eye, History, Zap, RefreshCw, Check, X, Clock, ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useDocumentAI, AIThoughtStep, DocumentChunk, DocumentProject } from '@/hooks/useDocumentAI';

interface DocumentIDEProps {
  onClose?: () => void;
}

export function DocumentIDE({ onClose }: DocumentIDEProps) {
  const {
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
  } = useDocumentAI();

  const [activeTab, setActiveTab] = useState<'editor' | 'structure' | 'index' | 'map' | 'versions' | 'ai'>('editor');
  const [selectedChunk, setSelectedChunk] = useState<DocumentChunk | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [aiInstruction, setAiInstruction] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DocumentChunk[]>([]);
  const [showThinking, setShowThinking] = useState(true);
  const [targetMetrics, setTargetMetrics] = useState({
    minWords: 10000,
    minChapters: 10,
    minQuality: 0.85,
  });
  
  const editorRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with default project
  useEffect(() => {
    if (!currentProject) {
      setCurrentProject({
        id: crypto.randomUUID(),
        name: 'New Document',
        content: '# New Document\n\nStart writing here...',
        chunks: [],
        versions: [],
        masterIndex: '',
        systemMap: {},
        metrics: { wordCount: 5, chapters: 1, sections: 0, quality: 0.5, readability: 0.7 },
      });
    }
  }, [currentProject, setCurrentProject]);

  const handleEditorMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    editor.updateOptions({
      theme: 'vs-dark',
      fontSize: 14,
      minimap: { enabled: true },
      wordWrap: 'on',
      lineNumbers: 'on',
      padding: { top: 16 },
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
    });
  };

  const handleContentChange = useCallback((value: string | undefined) => {
    if (!currentProject || !value) return;
    
    const wordCount = value.split(/\s+/).filter(Boolean).length;
    setCurrentProject({
      ...currentProject,
      content: value,
      metrics: { ...currentProject.metrics, wordCount },
    });
  }, [currentProject, setCurrentProject]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      await uploadAndProcess(file);
    } catch (error) {
      toast.error('Failed to upload document');
    }
  };

  const handleRagSearch = async () => {
    if (!searchQuery || !currentProject?.chunks.length) return;
    
    const results = await ragSearch(searchQuery, currentProject.chunks);
    setSearchResults(results);
    toast.success(`Found ${results.length} relevant sections`);
  };

  const handleAIImprove = async () => {
    if (!aiInstruction || !selectedChunk) {
      toast.error('Select a section and enter an instruction');
      return;
    }

    setStreamingContent('');
    
    try {
      const improved = await improveDocument(
        selectedChunk.content,
        aiInstruction,
        (chunk) => setStreamingContent(prev => prev + chunk)
      );

      // Update the chunk
      if (currentProject) {
        const updatedChunks = currentProject.chunks.map(c =>
          c.id === selectedChunk.id ? { ...c, content: improved, wordCount: improved.split(/\s+/).length } : c
        );
        setCurrentProject({
          ...currentProject,
          chunks: updatedChunks,
          content: updatedChunks.map(c => c.content).join('\n\n'),
        });
      }

      toast.success('Section improved!');
    } catch (error) {
      toast.error('AI improvement failed');
    }
  };

  const handleAutoBuild = async () => {
    if (!currentProject) return;

    try {
      await autoBuildDocument(
        currentProject,
        targetMetrics,
        (updated) => setCurrentProject(updated)
      );
    } catch (error) {
      toast.error('Auto-build failed');
    }
  };

  const downloadDocument = () => {
    if (!currentProject) return;
    
    const blob = new Blob([currentProject.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Document downloaded');
  };

  const renderThoughtStep = (step: AIThoughtStep) => {
    const statusColors = {
      pending: 'bg-muted text-muted-foreground',
      active: 'bg-primary/20 text-primary animate-pulse',
      complete: 'bg-green-500/20 text-green-400',
      error: 'bg-destructive/20 text-destructive',
    };

    const typeIcons = {
      analyze: Brain,
      chunk: Layers,
      index: BookOpen,
      improve: Sparkles,
      organize: FolderTree,
      rag_search: Search,
      version: GitBranch,
    };

    const Icon = typeIcons[step.type] || Zap;

    return (
      <div key={step.id} className={cn("p-3 rounded-lg border border-border/30", statusColors[step.status])}>
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium">{step.title}</span>
          {step.status === 'active' && <RefreshCw className="w-3 h-3 animate-spin ml-auto" />}
          {step.status === 'complete' && <Check className="w-3 h-3 ml-auto" />}
          {step.status === 'error' && <X className="w-3 h-3 ml-auto" />}
        </div>
        <p className="text-xs text-muted-foreground">{step.details}</p>
        {step.status === 'active' && (
          <Progress value={step.progress} className="h-1 mt-2" />
        )}
        {step.metrics && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {Object.entries(step.metrics).map(([key, value]) => (
              <Badge key={key} variant="outline" className="text-[10px]">
                {key}: {typeof value === 'number' ? value.toFixed(2) : String(value)}
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderChunkTree = (chunks: DocumentChunk[]) => {
    const chapters = chunks.filter(c => c.type === 'chapter');
    const sections = chunks.filter(c => c.type === 'section');
    
    return (
      <div className="space-y-1">
        {chapters.map((chapter, idx) => (
          <div key={chapter.id}>
            <div
              className={cn(
                "flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors",
                selectedChunk?.id === chapter.id ? "bg-primary/20 text-primary" : "hover:bg-muted/50"
              )}
              onClick={() => setSelectedChunk(chapter)}
            >
              <ChevronDown className="w-4 h-4" />
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm flex-1 truncate">
                {chapter.content.split('\n')[0].replace(/^#\s*/, '')}
              </span>
              <Badge variant="outline" className="text-[10px]">{chapter.wordCount}w</Badge>
            </div>
            <div className="ml-4">
              {sections
                .filter(s => s.index > chapter.index && (chapters[idx + 1] ? s.index < chapters[idx + 1].index : true))
                .map(section => (
                  <div
                    key={section.id}
                    className={cn(
                      "flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer transition-colors ml-2",
                      selectedChunk?.id === section.id ? "bg-primary/20 text-primary" : "hover:bg-muted/50"
                    )}
                    onClick={() => setSelectedChunk(section)}
                  >
                    <FileText className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs flex-1 truncate">
                      {section.content.split('\n')[0].replace(/^##\s*/, '')}
                    </span>
                    <Badge variant="outline" className="text-[9px]">{section.wordCount}w</Badge>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!currentProject) return null;

  return (
    <div className="h-full flex flex-col bg-background/95 backdrop-blur">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-primary" />
          <Input
            value={currentProject.name}
            onChange={(e) => setCurrentProject({ ...currentProject, name: e.target.value })}
            className="h-8 w-48 text-sm font-medium bg-transparent border-none"
          />
          <div className="flex items-center gap-1">
            <Badge variant="outline">{currentProject.metrics.wordCount.toLocaleString()} words</Badge>
            <Badge variant="outline">{currentProject.chunks.length} chunks</Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={downloadDocument}>
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <Save className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-border/50 mx-1" />
          
          <Button
            variant={isProcessing ? "destructive" : "default"}
            size="sm"
            className="h-8 gap-1"
            onClick={isProcessing ? stopProcessing : handleAutoBuild}
          >
            {isProcessing ? (
              <>
                <Pause className="w-4 h-4" />
                Stop
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Auto Build
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Progress Metrics */}
      <div className="px-4 py-2 border-b border-border/30 bg-muted/20">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">
            Progress: {currentProject.metrics.wordCount.toLocaleString()} / {targetMetrics.minWords.toLocaleString()} words
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Quality: {(currentProject.metrics.quality * 100).toFixed(0)}%
            </Badge>
            <Badge variant="outline" className="text-xs">
              {currentProject.versions.length} versions
            </Badge>
          </div>
        </div>
        <Progress 
          value={Math.min(100, (currentProject.metrics.wordCount / targetMetrics.minWords) * 100)} 
          className="h-1.5" 
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Document Tree & AI */}
        <div className="w-72 border-r border-border/30 flex flex-col">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex flex-col h-full">
            <TabsList className="mx-2 mt-2 justify-start w-auto bg-muted/30 flex-shrink-0">
              <TabsTrigger value="editor" className="text-xs"><FileText className="w-3 h-3" /></TabsTrigger>
              <TabsTrigger value="structure" className="text-xs"><FolderTree className="w-3 h-3" /></TabsTrigger>
              <TabsTrigger value="ai" className="text-xs"><Brain className="w-3 h-3" /></TabsTrigger>
              <TabsTrigger value="versions" className="text-xs"><History className="w-3 h-3" /></TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="flex-1 flex flex-col m-0 overflow-hidden">
              <div className="p-2 border-b border-border/30">
                <div className="flex gap-1">
                  <Input 
                    placeholder="Search..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-7 text-xs bg-muted/30 border-none"
                  />
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={handleRagSearch}>
                    <Search className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2">
                  {currentProject.chunks.length > 0 ? (
                    renderChunkTree(currentProject.chunks)
                  ) : (
                    <p className="text-xs text-muted-foreground p-2">
                      Upload a document or start writing to see structure
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="ai" className="flex-1 flex flex-col m-0 overflow-hidden">
              <div className="p-2 space-y-2 flex-shrink-0">
                <Textarea
                  placeholder="Enter AI instruction (e.g., 'Expand this section with more examples')"
                  value={aiInstruction}
                  onChange={(e) => setAiInstruction(e.target.value)}
                  className="text-xs h-20 bg-muted/30 border-border/30"
                />
                <Button 
                  size="sm" 
                  className="w-full h-7 text-xs gap-1"
                  onClick={handleAIImprove}
                  disabled={isProcessing || !selectedChunk}
                >
                  <Sparkles className="w-3 h-3" />
                  Improve Selected
                </Button>
              </div>
              
              <div className="px-2 py-1 border-y border-border/30 flex items-center justify-between flex-shrink-0">
                <span className="text-xs font-medium">AI Thinking</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-5 text-xs"
                  onClick={() => setShowThinking(!showThinking)}
                >
                  {showThinking ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </Button>
              </div>
              
              {showThinking && (
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-2">
                    {thoughtSteps.length > 0 ? (
                      thoughtSteps.map(renderThoughtStep)
                    ) : (
                      <p className="text-xs text-muted-foreground p-2">
                        AI thinking process will appear here
                      </p>
                    )}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="structure" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-2">
                  <Card className="p-3 border-border/30 space-y-2">
                    <h4 className="text-xs font-medium">Target Metrics</h4>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Min Words</span>
                        <Input
                          type="number"
                          value={targetMetrics.minWords}
                          onChange={(e) => setTargetMetrics({ ...targetMetrics, minWords: parseInt(e.target.value) || 0 })}
                          className="w-24 h-6 text-xs"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Min Chapters</span>
                        <Input
                          type="number"
                          value={targetMetrics.minChapters}
                          onChange={(e) => setTargetMetrics({ ...targetMetrics, minChapters: parseInt(e.target.value) || 0 })}
                          className="w-24 h-6 text-xs"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Min Quality</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={targetMetrics.minQuality}
                          onChange={(e) => setTargetMetrics({ ...targetMetrics, minQuality: parseFloat(e.target.value) || 0 })}
                          className="w-24 h-6 text-xs"
                        />
                      </div>
                    </div>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="versions" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-2">
                  {currentProject.versions.map((version) => (
                    <Card key={version.id} className="p-2 border-border/30">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-xs">v{version.version}</Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {version.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{version.changes[0]}</p>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="secondary" className="text-[9px]">{version.metrics.wordCount}w</Badge>
                        <Badge variant="secondary" className="text-[9px]">{version.metrics.chapters} ch</Badge>
                      </div>
                    </Card>
                  ))}
                  {currentProject.versions.length === 0 && (
                    <p className="text-xs text-muted-foreground p-2">No versions yet</p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Center - Monaco Editor */}
        <div className="flex-1 flex flex-col">
          {selectedChunk ? (
            <>
              <div className="p-2 border-b border-border/30 flex items-center gap-2">
                <span className="text-sm font-medium truncate">
                  {selectedChunk.content.split('\n')[0].replace(/^#+\s*/, '')}
                </span>
                <Badge variant="outline" className="text-xs">{selectedChunk.type}</Badge>
                <div className="flex-1" />
                <div className="flex gap-1">
                  {selectedChunk.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">
                      <Tag className="w-2 h-2 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <Editor
                  height="100%"
                  defaultLanguage="markdown"
                  value={selectedChunk.content}
                  onChange={(value) => {
                    if (!value) return;
                    const updatedChunks = currentProject.chunks.map(c =>
                      c.id === selectedChunk.id 
                        ? { ...c, content: value, wordCount: value.split(/\s+/).length } 
                        : c
                    );
                    setCurrentProject({
                      ...currentProject,
                      chunks: updatedChunks,
                      content: updatedChunks.map(c => c.content).join('\n\n'),
                    });
                    setSelectedChunk({ ...selectedChunk, content: value });
                  }}
                  onMount={handleEditorMount}
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    minimap: { enabled: true },
                    wordWrap: 'on',
                    padding: { top: 16 },
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex-1">
              <Editor
                height="100%"
                defaultLanguage="markdown"
                value={currentProject.content}
                onChange={handleContentChange}
                onMount={handleEditorMount}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  minimap: { enabled: true },
                  wordWrap: 'on',
                  padding: { top: 16 },
                }}
              />
            </div>
          )}
        </div>

        {/* Right Panel - Streaming Output & Search Results */}
        {(streamingContent || searchResults.length > 0) && (
          <div className="w-80 border-l border-border/30 flex flex-col">
            <div className="p-2 border-b border-border/30">
              <span className="text-xs font-medium">
                {streamingContent ? 'AI Output' : 'Search Results'}
              </span>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {streamingContent && (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <pre className="text-xs whitespace-pre-wrap bg-muted/30 p-2 rounded">
                      {streamingContent}
                    </pre>
                  </div>
                )}
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map(result => (
                      <Card 
                        key={result.id} 
                        className="p-2 border-border/30 cursor-pointer hover:bg-muted/30"
                        onClick={() => setSelectedChunk(result)}
                      >
                        <p className="text-xs font-medium truncate">
                          {result.content.split('\n')[0].replace(/^#+\s*/, '')}
                        </p>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">
                          {result.content.slice(0, 150)}...
                        </p>
                        <div className="flex gap-1 mt-1">
                          {result.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-[9px]">{tag}</Badge>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
