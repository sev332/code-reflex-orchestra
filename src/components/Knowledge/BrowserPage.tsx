// Browser/Research — Web research workspace with bookmarks, reading list, AI summarization
import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Globe, Plus, X, ArrowLeft, ArrowRight, RotateCcw, Lock, Search,
  Star, BookOpen, Download, Share2, ExternalLink, ChevronRight,
  Wand2, FileText, Clock, Bookmark, Maximize, Split,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrowserTab {
  id: string;
  title: string;
  url: string;
  isLoading: boolean;
  favicon?: string;
  content?: string;
}

interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  folder: string;
  addedAt: Date;
}

interface ReadingListItem {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  addedAt: Date;
  read: boolean;
}

const defaultBookmarks: BookmarkItem[] = [
  { id: 'b1', title: 'React Documentation', url: 'https://react.dev', folder: 'Dev', addedAt: new Date() },
  { id: 'b2', title: 'Three.js Docs', url: 'https://threejs.org/docs', folder: 'Dev', addedAt: new Date() },
  { id: 'b3', title: 'MDN Web Docs', url: 'https://developer.mozilla.org', folder: 'Dev', addedAt: new Date() },
  { id: 'b4', title: 'Hacker News', url: 'https://news.ycombinator.com', folder: 'News', addedAt: new Date() },
  { id: 'b5', title: 'arXiv CS', url: 'https://arxiv.org/list/cs.AI', folder: 'Research', addedAt: new Date() },
];

const defaultReadingList: ReadingListItem[] = [
  { id: 'r1', title: 'Attention Is All You Need', url: 'https://arxiv.org/abs/1706.03762', excerpt: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks...', addedAt: new Date(), read: false },
  { id: 'r2', title: 'The Bitter Lesson - Rich Sutton', url: 'http://www.incompleteideas.net/IncIdeas/BitterLesson.html', excerpt: 'The biggest lesson that can be read from 70 years of AI research is that general methods that leverage computation are ultimately the most effective...', addedAt: new Date(), read: true },
  { id: 'r3', title: 'Scaling Laws for Neural Language Models', url: 'https://arxiv.org/abs/2001.08361', excerpt: 'We study empirical scaling laws for language model performance on the cross-entropy loss...', addedAt: new Date(), read: false },
];

const renderPageContent = (url: string) => {
  // Simulated page content based on URL
  if (url.includes('react.dev')) return `# React Documentation\n\nReact lets you build user interfaces out of individual pieces called components.\n\n## Quick Start\nCreate your first React app using create-react-app or Vite.\n\n## Core Concepts\n- Components and Props\n- State and Lifecycle\n- Hooks (useState, useEffect, useContext)\n- Context API\n- Refs and the DOM\n\n## Advanced Topics\n- Code Splitting\n- Error Boundaries\n- Concurrent Features\n- Server Components`;
  if (url.includes('news.ycombinator')) return `# Hacker News — Top Stories\n\n1. Show HN: Browser-based operating system with AI integration (342 pts)\n2. New breakthrough in quantum computing error correction (289 pts)\n3. The state of WebAssembly in 2026 (205 pts)\n4. Understanding transformer architectures from scratch (178 pts)\n5. Open source alternative to Figma built with Canvas API (156 pts)`;
  if (url.includes('arxiv')) return `# arXiv.org — CS.AI Recent Papers\n\n## Latest Submissions\n\n**[2603.01234] Emergent Reasoning in Large Language Models**\nAuthors: A. Smith, B. Jones\nAbstract: We investigate the emergence of reasoning capabilities in language models trained at scale...\n\n**[2603.01235] Efficient Fine-tuning with LoRA Variants**\nAuthors: C. Lee, D. Kim\nAbstract: We present a comprehensive study of parameter-efficient fine-tuning methods...`;
  return `# ${url}\n\nPage content loading...\n\nThis is a simulated browser view. In a production environment, this would render the actual web page content using an embedded iframe or a server-side rendering proxy.`;
};

export function BrowserPage() {
  const [tabs, setTabs] = useState<BrowserTab[]>([
    { id: 'tab-1', title: 'New Tab', url: '', isLoading: false },
  ]);
  const [activeTabId, setActiveTabId] = useState('tab-1');
  const [urlInput, setUrlInput] = useState('');

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const navigate = useCallback((url: string) => {
    if (!url) return;
    if (!url.startsWith('http')) url = `https://${url}`;
    setTabs(prev => prev.map(t =>
      t.id === activeTabId ? { ...t, url, title: new URL(url).hostname, isLoading: true, content: renderPageContent(url) } : t
    ));
    setUrlInput(url);
    setTimeout(() => {
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, isLoading: false } : t));
    }, 500);
  }, [activeTabId]);

  const addTab = useCallback(() => {
    const t: BrowserTab = { id: `tab-${Date.now()}`, title: 'New Tab', url: '', isLoading: false };
    setTabs(prev => [...prev, t]);
    setActiveTabId(t.id);
    setUrlInput('');
  }, []);

  const closeTab = useCallback((id: string) => {
    setTabs(prev => {
      const f = prev.filter(t => t.id !== id);
      if (f.length === 0) { const n = { id: `tab-${Date.now()}`, title: 'New Tab', url: '', isLoading: false }; setActiveTabId(n.id); return [n as BrowserTab]; }
      if (activeTabId === id) setActiveTabId(f[0].id);
      return f;
    });
  }, [activeTabId]);


  return (
    <div className="h-full flex flex-col bg-background/30">
      {/* Tab bar */}
      <div className="h-9 bg-background/60 backdrop-blur border-b border-border/30 flex items-center px-1 shrink-0">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={cn(
              'group flex items-center gap-1.5 px-3 py-1 max-w-[200px] rounded-t-md text-xs cursor-pointer transition-all border-b-2',
              tab.id === activeTabId ? 'bg-background/80 border-primary text-foreground' : 'border-transparent text-muted-foreground hover:bg-muted/30'
            )}
            onClick={() => { setActiveTabId(tab.id); setUrlInput(tab.url); }}
          >
            {tab.isLoading ? <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin shrink-0" /> :
             <Globe className="w-3 h-3 shrink-0" />}
            <span className="truncate">{tab.title || 'New Tab'}</span>
            <button onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }} className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity shrink-0">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <Button variant="ghost" size="icon" onClick={addTab} className="w-7 h-7 ml-1 shrink-0">
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* URL bar */}
      <div className="h-10 bg-background/80 backdrop-blur border-b border-border/30 flex items-center px-2 gap-1.5 shrink-0">
        <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0"><ArrowLeft className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0"><ArrowRight className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0" onClick={() => activeTab.url && navigate(activeTab.url)}>
          <RotateCcw className="w-4 h-4" />
        </Button>
        <div className="flex-1 relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-400" />
          <Input
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && navigate(urlInput)}
            placeholder="Search or enter URL..."
            className="h-8 pl-9 pr-10 text-xs bg-muted/30 border-border/30 rounded-full"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>

      {/* Content area — center only, no internal side panel */}
      <div className="flex-1 overflow-auto">
        {activeTab.url ? (
          <div className="p-8 max-w-4xl mx-auto">
            <div className="prose prose-invert prose-sm max-w-none">
              {(activeTab.content || '').split('\n').map((line, i) => {
                if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-foreground mb-4">{line.slice(2)}</h1>;
                if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold text-foreground mt-6 mb-2">{line.slice(3)}</h2>;
                if (line.startsWith('**[')) return <p key={i} className="text-sm text-primary font-medium mt-3">{line.replace(/\*\*/g, '')}</p>;
                if (line.startsWith('**')) return <p key={i} className="text-sm font-medium text-foreground/90">{line.replace(/\*\*/g, '')}</p>;
                if (line.startsWith('- ')) return <p key={i} className="text-sm text-foreground/80 pl-4">• {line.slice(2)}</p>;
                if (line.match(/^\d+\./)) return <p key={i} className="text-sm text-foreground/80 pl-4">{line}</p>;
                if (line.trim() === '') return <div key={i} className="h-2" />;
                return <p key={i} className="text-sm text-foreground/70">{line}</p>;
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <Globe className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
              <h2 className="text-lg font-semibold mb-2">LUCID Browser</h2>
              <p className="text-sm text-muted-foreground mb-6">Research the web with AI-powered summarization and organization</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { title: 'React Docs', url: 'https://react.dev' },
                  { title: 'Hacker News', url: 'https://news.ycombinator.com' },
                  { title: 'arXiv CS.AI', url: 'https://arxiv.org/list/cs.AI' },
                ].map(q => (
                  <button key={q.url} onClick={() => { setUrlInput(q.url); navigate(q.url); }}
                    className="p-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors text-xs text-center">
                    <Globe className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                    {q.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
