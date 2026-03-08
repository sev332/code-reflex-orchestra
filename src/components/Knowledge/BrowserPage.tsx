// Browser — Chrome-grade web research browser with tabs, bookmarks, history, reading mode, dev tools
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Globe, Plus, X, ArrowLeft, ArrowRight, RotateCcw, Lock, Search,
  Star, Bookmark, Clock, Download, Share2, Shield, Settings,
  ChevronDown, ExternalLink, Eye, Code2, FileText, Zap,
  Home, Layers, PanelRight, Volume2, VolumeX, Copy,
  ArrowUpRight, BookOpen, Hash, Image, Wifi, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ─────────────────────────────────
interface BrowserTab {
  id: string;
  title: string;
  url: string;
  isLoading: boolean;
  favicon?: string;
  content?: string;
  isBookmarked: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  isSecure: boolean;
  readingMode?: boolean;
}

interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  folder?: string;
}

interface HistoryItem {
  title: string;
  url: string;
  timestamp: Date;
}

// ─── Simulated Page Content ────────────────
const pageDB: Record<string, { title: string; content: string; sections?: { h: string; text: string }[] }> = {
  'react.dev': {
    title: 'React – The library for web and native user interfaces',
    content: 'React lets you build user interfaces out of individual pieces called components. Create your own React components like Thumbnail, LikeButton, and Video. Then combine them into entire screens, pages, and apps.',
    sections: [
      { h: 'Components', text: 'React components are JavaScript functions that return markup. They can be as small as a button, or as large as an entire page.' },
      { h: 'Props', text: 'React components use props to communicate with each other. Every parent component can pass information to its child components by giving them props.' },
      { h: 'State', text: "Components often need to change what's on the screen as a result of an interaction. State is like a component's personal memory." },
      { h: 'Hooks', text: 'Functions starting with use are called Hooks. useState and useEffect are built-in Hooks. You can also create your own.' },
      { h: 'Server Components', text: 'React Server Components let you write UI that can be rendered and optionally cached on the server, combining the best of server and client rendering.' },
    ],
  },
  'news.ycombinator.com': {
    title: 'Hacker News',
    content: 'The top stories on Hacker News today:',
    sections: [
      { h: '1. Show HN: Browser OS with 22 AI-powered applications', text: '485 points | 234 comments | submitted by lucid_dev | 3 hours ago' },
      { h: '2. Breakthrough in quantum error correction achieved', text: '342 points | 128 comments | submitted by quantum_res | 5 hours ago' },
      { h: '3. WebAssembly 3.0 specification draft released', text: '289 points | 95 comments | submitted by wasm_weekly | 6 hours ago' },
      { h: '4. Understanding transformer architectures from first principles', text: '267 points | 187 comments | submitted by ml_papers | 8 hours ago' },
      { h: '5. Open-source Figma alternative built entirely with Canvas API', text: '198 points | 76 comments | submitted by design_tools | 10 hours ago' },
      { h: '6. The state of Rust in production: 2026 survey results', text: '176 points | 143 comments | submitted by rustlang | 12 hours ago' },
      { h: '7. AI coding assistants: productivity gains and hidden costs', text: '165 points | 201 comments | submitted by dev_trends | 14 hours ago' },
    ],
  },
  'arxiv.org': {
    title: 'arXiv.org – Computer Science – Artificial Intelligence',
    content: 'Open-access archive for scholarly articles in computer science, artificial intelligence, and related fields.',
    sections: [
      { h: '[2603.01234] Emergent Multi-Step Reasoning in Language Models', text: 'Abstract: We investigate the emergence of compositional reasoning capabilities in large language models trained at scale. Through systematic evaluation across 12 benchmark tasks, we demonstrate that models above 70B parameters exhibit qualitatively different reasoning patterns...' },
      { h: '[2603.01235] Efficient Fine-tuning with Adaptive LoRA', text: 'Abstract: We present AdaptLoRA, a novel parameter-efficient fine-tuning method that dynamically adjusts rank allocation across attention layers. Our approach achieves 98.3% of full fine-tuning performance using only 0.4% of trainable parameters...' },
      { h: '[2603.01236] Graph Neural Networks for Code Understanding', text: 'Abstract: We propose CodeGraph, a graph neural network architecture designed for static code analysis. By representing programs as typed property graphs, our model captures both syntactic structure and semantic relationships...' },
    ],
  },
  'github.com': {
    title: 'GitHub – Where the world builds software',
    content: 'GitHub is where over 100 million developers shape the future of software, together.',
    sections: [
      { h: 'Trending Repositories', text: 'Discover what the GitHub community is most excited about today.' },
      { h: 'lucid-os/browser-os ⭐ 12.4k', text: 'A complete browser-based operating system with 22 AI-powered applications. Built with React, TypeScript, and Canvas APIs.' },
      { h: 'openai/reasoning-engine ⭐ 8.2k', text: 'Open-source implementation of chain-of-thought reasoning with verification and self-correction capabilities.' },
      { h: 'vercel/next-15 ⭐ 6.8k', text: 'The React Framework for the Web. Next.js 15 with native Server Components and improved streaming.' },
    ],
  },
  'developer.mozilla.org': {
    title: 'MDN Web Docs',
    content: 'Resources for developers, by developers. Documenting web technologies since 2005.',
    sections: [
      { h: 'Web APIs', text: 'Learn about the Web APIs available in modern browsers, from Canvas and WebGL to Web Audio and WebRTC.' },
      { h: 'JavaScript', text: 'Comprehensive guides and references for JavaScript, including ES2026 features, async patterns, and modules.' },
      { h: 'CSS', text: 'Master CSS layout with Grid, Flexbox, Container Queries, and the new cascade layers specification.' },
    ],
  },
};

const resolveUrl = (input: string): string => {
  if (input.startsWith('http')) return input;
  if (input.includes('.')) return `https://${input}`;
  return `https://www.google.com/search?q=${encodeURIComponent(input)}`;
};

const getPageData = (url: string) => {
  for (const [domain, data] of Object.entries(pageDB)) {
    if (url.includes(domain)) return data;
  }
  return null;
};

const getDomain = (url: string) => {
  try { return new URL(url).hostname; } catch { return url; }
};

// ─── Quick Links ───────────────────────────
const quickLinks = [
  { title: 'React Docs', url: 'https://react.dev', icon: '⚛️' },
  { title: 'Hacker News', url: 'https://news.ycombinator.com', icon: '📰' },
  { title: 'arXiv CS.AI', url: 'https://arxiv.org/list/cs.AI', icon: '📄' },
  { title: 'GitHub', url: 'https://github.com', icon: '🐙' },
  { title: 'MDN Docs', url: 'https://developer.mozilla.org', icon: '📘' },
  { title: 'TypeScript', url: 'https://www.typescriptlang.org', icon: '🔷' },
];

// ─── Main Component ────────────────────────
export function BrowserPage() {
  const [tabs, setTabs] = useState<BrowserTab[]>([
    { id: 'tab-1', title: 'New Tab', url: '', isLoading: false, isBookmarked: false, canGoBack: false, canGoForward: false, isSecure: true },
  ]);
  const [activeTabId, setActiveTabId] = useState('tab-1');
  const [urlInput, setUrlInput] = useState('');
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([
    { id: 'b1', title: 'React', url: 'https://react.dev', folder: 'Dev' },
    { id: 'b2', title: 'GitHub', url: 'https://github.com', folder: 'Dev' },
    { id: 'b3', title: 'Hacker News', url: 'https://news.ycombinator.com', folder: 'News' },
    { id: 'b4', title: 'MDN', url: 'https://developer.mozilla.org', folder: 'Dev' },
  ]);
  const [browsingHistory, setBrowsingHistory] = useState<HistoryItem[]>([]);
  const [showPanel, setShowPanel] = useState<'none' | 'bookmarks' | 'history' | 'devtools'>('none');
  const [showBookmarkBar, setShowBookmarkBar] = useState(true);
  const urlRef = useRef<HTMLInputElement>(null);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const pageData = activeTab.url ? getPageData(activeTab.url) : null;

  const navigate = useCallback((url: string) => {
    if (!url) return;
    const resolved = resolveUrl(url);
    const page = getPageData(resolved);
    setTabs(prev => prev.map(t =>
      t.id === activeTabId ? {
        ...t, url: resolved,
        title: page?.title || getDomain(resolved),
        isLoading: true,
        content: '', isSecure: resolved.startsWith('https'),
        canGoBack: true,
        isBookmarked: bookmarks.some(b => b.url === resolved),
      } : t
    ));
    setUrlInput(resolved);
    setBrowsingHistory(prev => [{ title: page?.title || getDomain(resolved), url: resolved, timestamp: new Date() }, ...prev.slice(0, 99)]);
    setTimeout(() => {
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, isLoading: false } : t));
    }, 300 + Math.random() * 400);
  }, [activeTabId, bookmarks]);

  const addTab = useCallback(() => {
    const t: BrowserTab = { id: `tab-${Date.now()}`, title: 'New Tab', url: '', isLoading: false, isBookmarked: false, canGoBack: false, canGoForward: false, isSecure: true };
    setTabs(prev => [...prev, t]);
    setActiveTabId(t.id);
    setUrlInput('');
    setTimeout(() => urlRef.current?.focus(), 50);
  }, []);

  const closeTab = useCallback((id: string) => {
    setTabs(prev => {
      const remaining = prev.filter(t => t.id !== id);
      if (remaining.length === 0) {
        const newTab: BrowserTab = { id: `tab-${Date.now()}`, title: 'New Tab', url: '', isLoading: false, isBookmarked: false, canGoBack: false, canGoForward: false, isSecure: true };
        setActiveTabId(newTab.id);
        setUrlInput('');
        return [newTab];
      }
      if (activeTabId === id) {
        const idx = prev.findIndex(t => t.id === id);
        const nextTab = remaining[Math.min(idx, remaining.length - 1)];
        setActiveTabId(nextTab.id);
        setUrlInput(nextTab.url);
      }
      return remaining;
    });
  }, [activeTabId]);

  const toggleBookmark = useCallback(() => {
    if (!activeTab.url) return;
    if (activeTab.isBookmarked) {
      setBookmarks(prev => prev.filter(b => b.url !== activeTab.url));
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, isBookmarked: false } : t));
    } else {
      setBookmarks(prev => [...prev, { id: `b-${Date.now()}`, title: activeTab.title, url: activeTab.url }]);
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, isBookmarked: true } : t));
    }
  }, [activeTab, activeTabId]);

  const formatTime = (d: Date) => {
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col bg-background/30">
      {/* ─── Tab Bar ─── */}
      <div className="h-9 bg-background/70 backdrop-blur border-b border-border/20 flex items-center px-1 shrink-0">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={cn(
              'group flex items-center gap-1.5 px-3 py-1 max-w-[220px] min-w-[100px] rounded-t-lg text-xs cursor-pointer transition-all relative',
              tab.id === activeTabId ? 'bg-background/90 text-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/20 hover:text-foreground'
            )}
            onClick={() => { setActiveTabId(tab.id); setUrlInput(tab.url); }}
          >
            {tab.isLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin shrink-0" />
            ) : (
              <Globe className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate flex-1">{tab.title || 'New Tab'}</span>
            <button onClick={e => { e.stopPropagation(); closeTab(tab.id); }}
              className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity shrink-0 w-4 h-4 flex items-center justify-center rounded-sm hover:bg-muted/30">
              <X className="w-3 h-3" />
            </button>
            {tab.id === activeTabId && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />}
          </div>
        ))}
        <Button variant="ghost" size="icon" onClick={addTab} className="w-7 h-7 ml-0.5 shrink-0">
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* ─── URL Bar ─── */}
      <div className="h-11 bg-background/80 backdrop-blur border-b border-border/20 flex items-center px-2 gap-1.5 shrink-0">
        <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0" disabled={!activeTab.canGoBack}><ArrowLeft className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0" disabled={!activeTab.canGoForward}><ArrowRight className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0" onClick={() => activeTab.url && navigate(activeTab.url)}>
          <RotateCcw className={cn('w-4 h-4', activeTab.isLoading && 'animate-spin')} />
        </Button>
        <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0" onClick={() => { navigate(''); setUrlInput(''); }}>
          <Home className="w-4 h-4" />
        </Button>

        <div className="flex-1 relative">
          {activeTab.isSecure && activeTab.url && <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-400" />}
          {!activeTab.url && <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />}
          <Input
            ref={urlRef}
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && navigate(urlInput)}
            onFocus={e => e.target.select()}
            placeholder="Search or enter URL..."
            className={cn('h-8 text-xs bg-muted/20 border-border/20 rounded-full', activeTab.url ? 'pl-9' : 'pl-9', 'pr-20')}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {activeTab.url && (
              <button onClick={toggleBookmark} className="p-1 rounded-sm hover:bg-muted/30 transition-colors">
                <Star className={cn('w-3.5 h-3.5', activeTab.isBookmarked ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground')} />
              </button>
            )}
            <button onClick={() => activeTab.url && navigator.clipboard.writeText(activeTab.url)} className="p-1 rounded-sm hover:bg-muted/30 transition-colors">
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-0.5 ml-1">
          <Button variant="ghost" size="icon" onClick={() => setShowPanel(showPanel === 'bookmarks' ? 'none' : 'bookmarks')}
            className={cn('w-8 h-8', showPanel === 'bookmarks' && 'text-primary bg-primary/10')}>
            <Bookmark className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowPanel(showPanel === 'history' ? 'none' : 'history')}
            className={cn('w-8 h-8', showPanel === 'history' && 'text-primary bg-primary/10')}>
            <Clock className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowPanel(showPanel === 'devtools' ? 'none' : 'devtools')}
            className={cn('w-8 h-8', showPanel === 'devtools' && 'text-primary bg-primary/10')}>
            <Code2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ─── Bookmark Bar ─── */}
      {showBookmarkBar && bookmarks.length > 0 && (
        <div className="h-7 bg-background/60 border-b border-border/10 flex items-center px-3 gap-1 shrink-0 overflow-x-auto">
          {bookmarks.map(bm => (
            <button key={bm.id} onClick={() => navigate(bm.url)}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors shrink-0">
              <Globe className="w-3 h-3" />
              {bm.title}
            </button>
          ))}
        </div>
      )}

      {/* ─── Content ─── */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto">
          {activeTab.url ? (
            pageData ? (
              <div className="max-w-3xl mx-auto p-8">
                {/* Page header */}
                <div className="mb-6 pb-4 border-b border-border/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded bg-muted/20 flex items-center justify-center">
                      <Globe className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{getDomain(activeTab.url)}</span>
                    {activeTab.isSecure && <Shield className="w-3 h-3 text-emerald-400" />}
                  </div>
                  <h1 className="text-2xl font-bold text-foreground leading-tight">{pageData.title}</h1>
                  <p className="text-sm text-foreground/70 mt-3 leading-relaxed">{pageData.content}</p>
                </div>

                {/* Page sections */}
                {pageData.sections?.map((section, i) => (
                  <div key={i} className="mb-6">
                    <h2 className="text-lg font-semibold text-foreground mb-2">{section.h}</h2>
                    <p className="text-sm text-foreground/70 leading-relaxed">{section.text}</p>
                  </div>
                ))}

                {/* Related links */}
                <div className="mt-8 pt-4 border-t border-border/20">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Related Pages</h3>
                  <div className="flex gap-2 flex-wrap">
                    {quickLinks.filter(l => !activeTab.url.includes(new URL(l.url).hostname)).slice(0, 3).map(link => (
                      <button key={link.url} onClick={() => navigate(link.url)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/20 text-xs hover:bg-muted/20 hover:border-border/40 transition-all">
                        <span>{link.icon}</span>
                        <span>{link.title}</span>
                        <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{getDomain(activeTab.url)}</span>
                </div>
                <h1 className="text-xl font-bold mb-4">{getDomain(activeTab.url)}</h1>
                <p className="text-sm text-muted-foreground">This page would load actual web content in a production environment using a rendering proxy or embedded iframe.</p>
              </div>
            )
          ) : (
            /* ─── New Tab Page ─── */
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-lg">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Globe className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-1">LUCID Browser</h2>
                <p className="text-sm text-muted-foreground mb-8">Search the web or enter a URL to get started</p>

                {/* Search bar on new tab */}
                <div className="relative max-w-md mx-auto mb-8">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && navigate(urlInput)}
                    placeholder="Search or enter URL..."
                    className="h-11 pl-11 text-sm bg-muted/20 border-border/20 rounded-xl"
                    autoFocus
                  />
                </div>

                {/* Quick links grid */}
                <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                  {quickLinks.map(link => (
                    <button key={link.url} onClick={() => { setUrlInput(link.url); navigate(link.url); }}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/10 hover:bg-muted/25 border border-border/10 hover:border-border/30 transition-all">
                      <span className="text-2xl">{link.icon}</span>
                      <span className="text-xs text-foreground/70">{link.title}</span>
                    </button>
                  ))}
                </div>

                {/* Recent history */}
                {browsingHistory.length > 0 && (
                  <div className="mt-8 text-left max-w-md mx-auto">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-1">Recently Visited</h3>
                    {browsingHistory.slice(0, 5).map((h, i) => (
                      <button key={i} onClick={() => navigate(h.url)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/20 text-xs transition-colors">
                        <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="truncate flex-1 text-left text-foreground/70">{h.title}</span>
                        <span className="text-[9px] text-muted-foreground shrink-0">{formatTime(h.timestamp)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── Side Panel ─── */}
        {showPanel !== 'none' && (
          <div className="w-64 bg-background/50 backdrop-blur-xl border-l border-border/30 flex flex-col shrink-0">
            <div className="px-3 py-2 border-b border-border/20 flex items-center justify-between">
              <span className="text-xs font-semibold capitalize">{showPanel}</span>
              <Button variant="ghost" size="icon" onClick={() => setShowPanel('none')} className="w-5 h-5"><X className="w-3 h-3" /></Button>
            </div>
            <ScrollArea className="flex-1">
              {showPanel === 'bookmarks' && (
                <div className="p-2 space-y-0.5">
                  {bookmarks.map(bm => (
                    <button key={bm.id} onClick={() => navigate(bm.url)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/20 text-xs transition-colors">
                      <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0 text-left">
                        <p className="truncate text-foreground/80">{bm.title}</p>
                        <p className="text-[9px] text-muted-foreground truncate">{getDomain(bm.url)}</p>
                      </div>
                      {bm.folder && <Badge variant="outline" className="text-[8px] h-4 px-1">{bm.folder}</Badge>}
                    </button>
                  ))}
                </div>
              )}

              {showPanel === 'history' && (
                <div className="p-2 space-y-0.5">
                  {browsingHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-6 h-6 mx-auto text-muted-foreground/20 mb-2" />
                      <p className="text-[10px] text-muted-foreground">No browsing history</p>
                    </div>
                  ) : browsingHistory.map((h, i) => (
                    <button key={i} onClick={() => navigate(h.url)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/20 text-xs transition-colors">
                      <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0 text-left">
                        <p className="truncate text-foreground/80">{h.title}</p>
                        <p className="text-[9px] text-muted-foreground">{formatTime(h.timestamp)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {showPanel === 'devtools' && (
                <div className="p-3 space-y-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Page Info</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span className="text-muted-foreground">URL</span><span className="font-mono text-foreground/70 truncate ml-2 max-w-[140px]">{activeTab.url || '—'}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Protocol</span><span className="font-mono">{activeTab.isSecure ? 'HTTPS' : 'HTTP'}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="text-emerald-400">200 OK</span></div>
                    </div>
                  </div>
                  {pageData && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Content</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between"><span className="text-muted-foreground">Title</span><span className="truncate ml-2 max-w-[140px]">{pageData.title}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Sections</span><span>{pageData.sections?.length || 0}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Words</span><span>~{Math.floor(pageData.content.length / 5)}</span></div>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Performance</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span className="text-muted-foreground">Load time</span><span className="font-mono">{(300 + Math.random() * 400).toFixed(0)}ms</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">DOM nodes</span><span className="font-mono">{Math.floor(50 + Math.random() * 200)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Resources</span><span className="font-mono">{Math.floor(5 + Math.random() * 20)}</span></div>
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
