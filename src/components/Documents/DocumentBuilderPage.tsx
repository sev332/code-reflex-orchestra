// Full AI-powered Document Builder — center content only (uses shell drawers)
import React, { useState, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Save,
  Download,
  BookOpen,
  PenTool,
  Eye,
  Split,
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
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
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

      {/* Main content — center only, no internal sidebars */}
      <div className="flex-1 flex overflow-hidden">
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
                <p className="text-sm">Select a section from the left drawer</p>
                <p className="text-xs text-muted-foreground/60">or create a new chapter</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
