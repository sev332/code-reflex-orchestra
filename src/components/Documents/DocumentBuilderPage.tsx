// Full AI-powered Document Builder — main content for the Documents page
import React, { useState, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Plus,
  Save,
  Download,
  Trash2,
  Copy,
  ChevronRight,
  ChevronDown,
  Wand2,
  Play,
  Pause,
  RotateCcw,
  BookOpen,
  Map,
  Layers,
  Sparkles,
  PenTool,
  Eye,
  Split,
  Send,
  Bot,
  FolderTree,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DocNode {
  id: string;
  title: string;
  content: string;
  type: 'chapter' | 'section' | 'subsection' | 'note';
  tags: string[];
  children: DocNode[];
  wordCount: number;
  quality: number;
}

type ViewMode = 'edit' | 'preview' | 'split';

export function DocumentBuilderPage() {
  const [nodes, setNodes] = useState<DocNode[]>([
    {
      id: '1', title: 'Introduction', content: '# Introduction\n\nBegin writing your document here. The AI assistant can help you plan, write, and refine content.\n\n## Getting Started\n\nUse the AI panel on the right to:\n- Generate outlines and structure\n- Write and expand sections\n- Refine and edit existing content\n- Check quality and consistency',
      type: 'chapter', tags: ['intro'], children: [], wordCount: 42, quality: 0.6,
    },
  ]);
  const [selectedId, setSelectedId] = useState('1');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['1']));
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [activeTab, setActiveTab] = useState<'editor' | 'outline' | 'index' | 'map'>('editor');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiWorking, setIsAiWorking] = useState(false);
  const [projectName, setProjectName] = useState('Untitled Document');
  const editorRef = useRef<any>(null);

  const selectedNode = findNode(nodes, selectedId);
  const totalWords = countAllWords(nodes);

  function findNode(list: DocNode[], id: string): DocNode | null {
    for (const n of list) {
      if (n.id === id) return n;
      const found = findNode(n.children, id);
      if (found) return found;
    }
    return null;
  }

  function countAllWords(list: DocNode[]): number {
    return list.reduce((sum, n) => sum + n.wordCount + countAllWords(n.children), 0);
  }

  const updateNode = useCallback((id: string, updater: (n: DocNode) => DocNode) => {
    const update = (list: DocNode[]): DocNode[] =>
      list.map(n => n.id === id ? updater(n) : { ...n, children: update(n.children) });
    setNodes(prev => update(prev));
  }, []);

  const handleContentChange = useCallback((value: string | undefined) => {
    if (!value || !selectedId) return;
    const wc = value.split(/\s+/).filter(Boolean).length;
    updateNode(selectedId, n => ({ ...n, content: value, wordCount: wc }));
  }, [selectedId, updateNode]);

  const addNode = (parentId: string | null, type: DocNode['type'] = 'section') => {
    const newNode: DocNode = {
      id: crypto.randomUUID(), title: `New ${type}`, content: `# New ${type}\n\n`,
      type, tags: [], children: [], wordCount: 0, quality: 0,
    };
    if (!parentId) {
      setNodes(prev => [...prev, newNode]);
    } else {
      const add = (list: DocNode[]): DocNode[] =>
        list.map(n => n.id === parentId ? { ...n, children: [...n.children, newNode] } : { ...n, children: add(n.children) });
      setNodes(prev => add(prev));
      setExpandedIds(prev => new Set([...prev, parentId]));
    }
    setSelectedId(newNode.id);
    toast.success(`Added ${type}`);
  };

  const deleteNode = (id: string) => {
    const remove = (list: DocNode[]): DocNode[] =>
      list.filter(n => n.id !== id).map(n => ({ ...n, children: remove(n.children) }));
    setNodes(prev => remove(prev));
    if (selectedId === id) setSelectedId(nodes[0]?.id || '');
    toast.success('Deleted');
  };

  const handleAiSubmit = () => {
    if (!aiPrompt.trim()) return;
    setIsAiWorking(true);
    // Simulate AI response
    setTimeout(() => {
      if (selectedNode) {
        const addition = `\n\n## AI Generated\n\n${aiPrompt}\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`;
        updateNode(selectedId, n => ({
          ...n,
          content: n.content + addition,
          wordCount: (n.content + addition).split(/\s+/).filter(Boolean).length,
        }));
      }
      setIsAiWorking(false);
      setAiPrompt('');
      toast.success('AI content generated');
    }, 1500);
  };

  const renderTree = (list: DocNode[], depth = 0) =>
    list.map(node => (
      <div key={node.id}>
        <div
          className={cn(
            'flex items-center gap-1.5 py-1 px-1 rounded-md cursor-pointer transition-colors group',
            selectedId === node.id ? 'bg-primary/15 text-primary' : 'hover:bg-muted/50'
          )}
          style={{ paddingLeft: depth * 14 + 4 }}
          onClick={() => setSelectedId(node.id)}
        >
          {node.children.length > 0 ? (
            <button onClick={(e) => { e.stopPropagation(); setExpandedIds(prev => { const s = new Set(prev); s.has(node.id) ? s.delete(node.id) : s.add(node.id); return s; }); }} className="shrink-0">
              {expandedIds.has(node.id) ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ) : <div className="w-3.5" />}
          <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs flex-1 truncate">{node.title}</span>
          <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100">{node.wordCount}w</span>
        </div>
        {expandedIds.has(node.id) && node.children.length > 0 && renderTree(node.children, depth + 1)}
      </div>
    ));

  return (
    <div className="h-full flex flex-col">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <Input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="h-7 w-48 text-sm font-semibold bg-transparent border-none px-1"
          />
          <Badge variant="outline" className="text-[10px]">{totalWords.toLocaleString()} words</Badge>
          <Badge variant="outline" className="text-[10px]">{nodes.length} chapters</Badge>
        </div>
        <div className="flex items-center gap-1">
          {/* View mode toggles */}
          <div className="flex items-center bg-muted/30 rounded-lg p-0.5 mr-2">
            {([['edit', PenTool], ['split', Split], ['preview', Eye]] as const).map(([mode, Icon]) => (
              <Button
                key={mode}
                variant="ghost"
                size="icon"
                onClick={() => setViewMode(mode)}
                className={cn('w-7 h-7 rounded-md', viewMode === mode && 'bg-primary/15 text-primary')}
              >
                <Icon className="w-3.5 h-3.5" />
              </Button>
            ))}
          </div>
          <Button variant="ghost" size="icon" className="w-8 h-8"><Save className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" className="w-8 h-8"><Download className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Document tree sidebar */}
        <div className="w-56 border-r border-border/30 flex flex-col shrink-0">
          <div className="p-2 border-b border-border/20 flex items-center gap-1">
            <FolderTree className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Structure</span>
            <div className="flex-1" />
            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => addNode(null, 'chapter')}>
              <Plus className="w-3 h-3" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-1.5">{renderTree(nodes)}</div>
          </ScrollArea>
          <div className="p-1.5 border-t border-border/20 flex gap-1">
            <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs" onClick={() => addNode(selectedId, 'section')}>
              <Plus className="w-3 h-3 mr-1" /> Section
            </Button>
            {selectedNode && (
              <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive" onClick={() => deleteNode(selectedId)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Editor area */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedNode ? (
            <>
              {/* Node header */}
              <div className="px-4 py-2 border-b border-border/20 flex items-center gap-2 shrink-0">
                <Input
                  value={selectedNode.title}
                  onChange={(e) => updateNode(selectedId, n => ({ ...n, title: e.target.value }))}
                  className="h-7 text-sm font-medium bg-transparent border-none px-1 flex-1"
                />
                <Badge variant="outline" className="text-[10px]">{selectedNode.type}</Badge>
                {selectedNode.tags.map(t => (
                  <Badge key={t} variant="secondary" className="text-[10px]"><Tag className="w-2.5 h-2.5 mr-0.5" />{t}</Badge>
                ))}
              </div>

              {/* Editor / Preview */}
              <div className="flex-1 flex">
                {(viewMode === 'edit' || viewMode === 'split') && (
                  <div className={cn('flex-1', viewMode === 'split' && 'border-r border-border/20')}>
                    <Editor
                      height="100%"
                      defaultLanguage="markdown"
                      value={selectedNode.content}
                      onChange={handleContentChange}
                      onMount={(editor) => { editorRef.current = editor; }}
                      theme="vs-dark"
                      options={{
                        fontSize: 14, minimap: { enabled: false }, wordWrap: 'on',
                        lineNumbers: 'on', padding: { top: 16, bottom: 16 },
                        smoothScrolling: true, cursorBlinking: 'smooth',
                      }}
                    />
                  </div>
                )}
                {(viewMode === 'preview' || viewMode === 'split') && (
                  <div className="flex-1 overflow-auto">
                    <div className="p-6 prose prose-invert prose-sm max-w-none">
                      {/* Simple markdown preview */}
                      {selectedNode.content.split('\n').map((line, i) => {
                        if (line.startsWith('### ')) return <h3 key={i} className="text-base font-semibold mt-4 mb-2">{line.slice(4)}</h3>;
                        if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold mt-6 mb-2 text-primary">{line.slice(3)}</h2>;
                        if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mt-6 mb-3 text-primary">{line.slice(2)}</h1>;
                        if (line.startsWith('- ')) return <li key={i} className="text-sm text-muted-foreground ml-4">{line.slice(2)}</li>;
                        if (line.trim() === '') return <br key={i} />;
                        return <p key={i} className="text-sm text-foreground/80 mb-2">{line}</p>;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a section to edit</p>
                <p className="text-xs text-muted-foreground/60">or create a new chapter</p>
              </div>
            </div>
          )}
        </div>

        {/* AI Assistant Panel */}
        <div className="w-72 border-l border-border/30 flex flex-col shrink-0">
          <div className="px-3 py-2 border-b border-border/20 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium uppercase tracking-wider">AI Writer</span>
          </div>

          {/* Quick actions */}
          <div className="p-2 border-b border-border/20 grid grid-cols-2 gap-1">
            {[
              { label: 'Expand', icon: Plus, action: 'Expand this section with more detail and examples' },
              { label: 'Improve', icon: Wand2, action: 'Improve the writing quality, clarity, and flow' },
              { label: 'Outline', icon: FolderTree, action: 'Generate a detailed outline for this document' },
              { label: 'Continue', icon: Play, action: 'Continue writing from where the content ends' },
            ].map(({ label, icon: Icon, action }) => (
              <Button
                key={label}
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1 border-border/30"
                onClick={() => { setAiPrompt(action); }}
              >
                <Icon className="w-3 h-3" /> {label}
              </Button>
            ))}
          </div>

          {/* AI conversation area */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
              <Card className="p-3 border-border/20 bg-muted/20">
                <div className="flex items-start gap-2">
                  <Bot className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-foreground/80">
                      I'm your AI writing assistant. I can help you:
                    </p>
                    <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                      <li>• Generate and expand content</li>
                      <li>• Plan document structure</li>
                      <li>• Refine writing quality</li>
                      <li>• Maintain consistency</li>
                    </ul>
                  </div>
                </div>
              </Card>

              {isAiWorking && (
                <Card className="p-3 border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-primary">Writing...</p>
                  </div>
                </Card>
              )}
            </div>
          </ScrollArea>

          {/* AI Input */}
          <div className="p-2 border-t border-border/20">
            <div className="flex gap-1">
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask AI to write, edit, or plan..."
                className="min-h-[60px] max-h-[120px] text-xs bg-muted/30 border-border/30 resize-none"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiSubmit(); } }}
              />
            </div>
            <Button
              className="w-full mt-1 h-7 text-xs gap-1"
              onClick={handleAiSubmit}
              disabled={isAiWorking || !aiPrompt.trim()}
            >
              <Send className="w-3 h-3" />
              {isAiWorking ? 'Working...' : 'Send to AI'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
