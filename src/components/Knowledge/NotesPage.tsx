// Notes/Wiki — Bidirectional linking, graph view, AI-assisted knowledge base
import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus, Trash2, Search, Star, Clock, Tag, Link2, GitBranch,
  FileText, ChevronRight, ChevronDown, Hash, Wand2, ArrowLeft,
  Edit3, Eye, BookOpen, Sparkles, Pin, FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  links: string[]; // IDs of linked notes
  createdAt: Date;
  updatedAt: Date;
  pinned: boolean;
  folder: string;
}

const defaultNotes: Note[] = [
  {
    id: 'n1', title: 'AIMOS Architecture', folder: 'Architecture',
    content: '# AIMOS Architecture\n\nAIMOS is a memory-centric, auditable operating system that compiles user intent into optimal prompt chains and verifiable outputs.\n\n## Core Components\n- **CMC** — Context Memory Core\n- **APOE** — Adaptive Prompt Orchestration Engine\n- **VIF** — Verifiable Intelligence Fabric\n- **SDF-CVF** — Build & Validation Fabric\n\nSee also: [[CMC Deep Dive]], [[APOE Pipeline]]\n\n## Key Principles\n1. Memory-first: persist only what clears quality gates\n2. Structure over sprawl\n3. Proof beats persuasion\n4. Atomic evolution\n5. User sovereignty',
    tags: ['architecture', 'aimos', 'core'], links: ['n2', 'n3'],
    createdAt: new Date('2026-01-15'), updatedAt: new Date('2026-03-01'), pinned: true,
  },
  {
    id: 'n2', title: 'CMC Deep Dive', folder: 'Architecture',
    content: '# CMC — Context Memory Core\n\nTurns ephemeral context into time-aware, queryable memory with rollback.\n\n## Components\n- Hierarchical indexing (short/medium/large/super)\n- Tag graph with semantic/temporal tags\n- Dumbbell compression (head/tail ≥ 20%)\n- Snapshots and branching\n- RS-based retrieval ranking\n\n## Mathematical Backbone\n- Quality Score: QS = 0.4·Comp + 0.3·Density + 0.3·Rel\n- Retrieval Score: RS = QS · IDS · (1 - DD)\n- Persist rule: QS > θ_Q ∧ DD < θ_D\n\nRelated: [[AIMOS Architecture]], [[Retrieval Scoring]]',
    tags: ['cmc', 'memory', 'architecture'], links: ['n1'],
    createdAt: new Date('2026-01-20'), updatedAt: new Date('2026-02-15'), pinned: false,
  },
  {
    id: 'n3', title: 'APOE Pipeline', folder: 'Architecture',
    content: '# APOE — Prompt Orchestration\n\nA cognitive compiler that plans, budgets, and routes reasoning across nodes.\n\n## Node Set\nPLAN → DISAMBIGUATE → RETRIEVE → CONDENSE → REASON → CRITIC → VERIFY → FORMAT → AUDIT → REFLECT\n\n## Key Rules\n- If VERIFY fails → increase k, re-CONDENSE, re-REASON\n- If cost cap hit → reduce parallelism but NEVER cut VERIFY\n- Token budget allocated proportional to Need·Unc·Impact\n\nSee: [[AIMOS Architecture]]',
    tags: ['apoe', 'orchestration', 'pipeline'], links: ['n1'],
    createdAt: new Date('2026-01-25'), updatedAt: new Date('2026-02-20'), pinned: false,
  },
  {
    id: 'n4', title: 'Meeting Notes - Q1 Review', folder: 'Meetings',
    content: '# Q1 Review Meeting\n\n**Date:** 2026-03-01\n**Attendees:** Team\n\n## Highlights\n- Browser OS expansion approved\n- Wave 1 productivity apps shipped\n- 3D Studio prototype in progress\n\n## Action Items\n- [ ] Complete Wave 2 creative tools\n- [ ] Begin Wave 3 dev tools\n- [ ] Performance audit for canvas-based components\n\n## Decisions\n- App Launcher over scrollable tabs\n- React Three Fiber for 3D (not Babylon.js)',
    tags: ['meetings', 'q1', 'planning'], links: [],
    createdAt: new Date('2026-03-01'), updatedAt: new Date('2026-03-01'), pinned: false,
  },
  {
    id: 'n5', title: 'Retrieval Scoring', folder: 'Research',
    content: '# Retrieval Scoring Algorithm\n\n## RS Formula\nRS = QS · IDS · (1 - DD)\n\nWhere:\n- QS (Quality Score) = weighted combination of completeness, density, relevance\n- IDS (Index Depth Score) = log-based depth with connection density\n- DD (Dependency Delta) = cosine similarity weighted change measure\n\n## Thresholds\n| Symbol | Default | Strict |\n|--------|---------|--------|\n| θ_Q    | 0.60    | 0.65   |\n| θ_D    | 0.20    | 0.10   |\n| θ_L    | 0.15    | 0.10   |\n\nRelated: [[CMC Deep Dive]]',
    tags: ['algorithms', 'retrieval', 'math'], links: ['n2'],
    createdAt: new Date('2026-02-01'), updatedAt: new Date('2026-02-10'), pinned: false,
  },
];

export function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(defaultNotes);
  const [activeNoteId, setActiveNoteId] = useState<string>('n1');
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [showGraph, setShowGraph] = useState(false);

  const activeNote = notes.find(n => n.id === activeNoteId);

  const folders = useMemo(() => {
    const f = new Set(notes.map(n => n.folder));
    return Array.from(f);
  }, [notes]);

  const filteredNotes = useMemo(() => {
    let result = notes;
    if (activeFolder) result = result.filter(n => n.folder === activeFolder);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some(t => t.includes(q)));
    }
    return result.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
  }, [notes, activeFolder, searchQuery]);

  const backlinks = useMemo(() => {
    if (!activeNoteId) return [];
    return notes.filter(n => n.links.includes(activeNoteId) && n.id !== activeNoteId);
  }, [activeNoteId, notes]);

  const allTags = useMemo(() => {
    const tags = new Map<string, number>();
    notes.forEach(n => n.tags.forEach(t => tags.set(t, (tags.get(t) || 0) + 1)));
    return Array.from(tags.entries()).sort((a, b) => b[1] - a[1]);
  }, [notes]);

  const createNote = useCallback(() => {
    const n: Note = {
      id: `n-${Date.now()}`, title: 'Untitled Note', content: '# Untitled Note\n\nStart writing...',
      tags: [], links: [], createdAt: new Date(), updatedAt: new Date(),
      pinned: false, folder: activeFolder || 'Inbox',
    };
    setNotes(prev => [n, ...prev]);
    setActiveNoteId(n.id);
    setIsEditing(true);
  }, [activeFolder]);

  const updateNote = useCallback((updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === activeNoteId ? { ...n, ...updates, updatedAt: new Date() } : n));
  }, [activeNoteId]);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (activeNoteId === id) {
      const remaining = notes.filter(n => n.id !== id);
      setActiveNoteId(remaining[0]?.id || '');
    }
  }, [activeNoteId, notes]);

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      // Handle wiki-style links [[Note Title]]
      const withLinks = line.replace(/\[\[(.+?)\]\]/g, (_, title) => {
        const linked = notes.find(n => n.title === title);
        return linked ? `<link id="${linked.id}">${title}</link>` : `<broken>${title}</broken>`;
      });

      if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mb-3">{line.slice(2)}</h1>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold mt-5 mb-2 text-foreground/90">{line.slice(3)}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} className="text-base font-semibold mt-4 mb-1.5">{line.slice(4)}</h3>;
      if (line.startsWith('- [ ] ')) return <p key={i} className="text-sm flex items-center gap-2 pl-2"><input type="checkbox" className="w-4 h-4 rounded" />{line.slice(6)}</p>;
      if (line.startsWith('- [x] ')) return <p key={i} className="text-sm flex items-center gap-2 pl-2 line-through text-muted-foreground"><input type="checkbox" checked readOnly className="w-4 h-4 rounded" />{line.slice(6)}</p>;
      if (line.startsWith('- ')) return <p key={i} className="text-sm pl-4 text-foreground/80">• {line.slice(2)}</p>;
      if (line.startsWith('|')) return <p key={i} className="text-xs font-mono text-foreground/70">{line}</p>;
      if (line.match(/^\d+\./)) return <p key={i} className="text-sm pl-4 text-foreground/80">{line}</p>;
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-sm font-semibold">{line.replace(/\*\*/g, '')}</p>;
      if (line.trim() === '') return <div key={i} className="h-2" />;

      // Render links
      if (withLinks.includes('<link')) {
        const parts = withLinks.split(/(<link id="[^"]+">.*?<\/link>|<broken>.*?<\/broken>)/);
        return <p key={i} className="text-sm text-foreground/80">{parts.map((part, j) => {
          const linkMatch = part.match(/<link id="([^"]+)">(.*?)<\/link>/);
          if (linkMatch) return <button key={j} onClick={() => setActiveNoteId(linkMatch[1])} className="text-primary hover:underline font-medium">{linkMatch[2]}</button>;
          const brokenMatch = part.match(/<broken>(.*?)<\/broken>/);
          if (brokenMatch) return <span key={j} className="text-red-400/60 line-through">{brokenMatch[1]}</span>;
          return <span key={j}>{part}</span>;
        })}</p>;
      }

      return <p key={i} className="text-sm text-foreground/80">{line}</p>;
    });
  };

  return (
    <div className="h-full flex flex-col bg-background/30">
      <div className="h-10 bg-background/80 backdrop-blur-xl border-b border-border/30 flex items-center px-3 gap-2 shrink-0">
        <BookOpen className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold">Notes & Wiki</span>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={createNote} className="h-7 text-xs gap-1">
          <Plus className="w-3.5 h-3.5" /> New Note
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowGraph(v => !v)} className={cn('h-7 text-xs gap-1', showGraph && 'text-primary')}>
          <GitBranch className="w-3.5 h-3.5" /> Graph
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Notes list */}
        <div className="w-64 bg-background/60 backdrop-blur-xl border-r border-border/30 flex flex-col shrink-0">
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search notes..." className="h-7 text-xs pl-8 bg-muted/30 border-border/30" />
            </div>
          </div>

          {/* Folders */}
          <div className="px-2 pb-1 flex flex-wrap gap-1">
            <Button variant="ghost" size="sm" onClick={() => setActiveFolder(null)}
              className={cn('h-5 text-[10px] px-1.5', !activeFolder && 'bg-primary/15 text-primary')}>All</Button>
            {folders.map(f => (
              <Button key={f} variant="ghost" size="sm" onClick={() => setActiveFolder(f)}
                className={cn('h-5 text-[10px] px-1.5', activeFolder === f && 'bg-primary/15 text-primary')}>{f}</Button>
            ))}
          </div>

          <ScrollArea className="flex-1">
            <div className="p-1 space-y-0.5">
              {filteredNotes.map(note => (
                <button
                  key={note.id}
                  onClick={() => { setActiveNoteId(note.id); setIsEditing(false); }}
                  className={cn(
                    'w-full text-left p-2 rounded-lg transition-colors',
                    activeNoteId === note.id ? 'bg-primary/15' : 'hover:bg-muted/30'
                  )}
                >
                  <div className="flex items-start gap-1.5">
                    {note.pinned && <Pin className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{note.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{note.content.split('\n').find(l => !l.startsWith('#') && l.trim())?.slice(0, 60)}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-2.5 h-2.5 text-muted-foreground/50" />
                        <span className="text-[9px] text-muted-foreground/50">{note.updatedAt.toLocaleDateString()}</span>
                        {note.links.length > 0 && <Badge variant="outline" className="text-[8px] h-3.5 px-1 ml-auto">{note.links.length} links</Badge>}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>

          {/* Tags */}
          <div className="p-2 border-t border-border/20">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Tags</p>
            <div className="flex flex-wrap gap-1">
              {allTags.slice(0, 8).map(([tag, count]) => (
                <button key={tag} onClick={() => setSearchQuery(tag)} className="text-[10px] text-muted-foreground hover:text-primary transition-colors">
                  #{tag} <span className="opacity-50">({count})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Note content */}
        {activeNote ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Note header */}
            <div className="px-6 py-3 border-b border-border/20 flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-muted-foreground">{activeNote.folder}</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-medium flex-1">{activeNote.title}</span>
              <div className="flex items-center gap-1">
                {activeNote.tags.map(t => (
                  <Badge key={t} variant="outline" className="text-[9px] h-4 px-1.5">#{t}</Badge>
                ))}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(v => !v)}
                className={cn('h-7 text-xs gap-1', isEditing && 'text-primary')}>
                {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                {isEditing ? 'Preview' : 'Edit'}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => updateNote({ pinned: !activeNote.pinned })} className="w-7 h-7">
                <Pin className={cn('w-3.5 h-3.5', activeNote.pinned && 'text-amber-400 fill-amber-400')} />
              </Button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="px-8 py-6 max-w-3xl mx-auto">
                {isEditing ? (
                  <Textarea
                    value={activeNote.content}
                    onChange={e => updateNote({ content: e.target.value })}
                    className="min-h-[500px] font-mono text-sm bg-transparent border-none resize-none"
                    spellCheck={false}
                  />
                ) : (
                  <div className="space-y-0.5">
                    {renderContent(activeNote.content)}
                  </div>
                )}

                {/* Backlinks */}
                {backlinks.length > 0 && (
                  <div className="mt-8 pt-4 border-t border-border/20">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5" /> Backlinks ({backlinks.length})
                    </p>
                    <div className="space-y-1">
                      {backlinks.map(bl => (
                        <button key={bl.id} onClick={() => setActiveNoteId(bl.id)}
                          className="w-full text-left p-2 rounded-lg hover:bg-muted/30 transition-colors">
                          <p className="text-xs font-medium text-primary">{bl.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{bl.content.split('\n').find(l => !l.startsWith('#'))?.slice(0, 80)}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Select a note or create a new one</p>
            </div>
          </div>
        )}

        {/* Graph view */}
        {showGraph && (
          <div className="w-80 bg-background/60 backdrop-blur-xl border-l border-border/30 flex flex-col shrink-0">
            <div className="px-3 py-2 border-b border-border/20">
              <span className="text-xs font-semibold">Knowledge Graph</span>
            </div>
            <div className="flex-1 relative bg-[#0a0a14]">
              {/* Simple SVG graph visualization */}
              <svg className="w-full h-full">
                {notes.map((note, i) => {
                  const angle = (i / notes.length) * Math.PI * 2;
                  const cx = 50 + Math.cos(angle) * 30;
                  const cy = 50 + Math.sin(angle) * 30;
                  return (
                    <g key={note.id}>
                      {note.links.map(linkId => {
                        const li = notes.findIndex(n => n.id === linkId);
                        if (li < 0) return null;
                        const la = (li / notes.length) * Math.PI * 2;
                        return (
                          <line key={linkId}
                            x1={`${cx}%`} y1={`${cy}%`}
                            x2={`${50 + Math.cos(la) * 30}%`} y2={`${50 + Math.sin(la) * 30}%`}
                            stroke="hsl(var(--primary) / 0.3)" strokeWidth="1"
                          />
                        );
                      })}
                      <circle
                        cx={`${cx}%`} cy={`${cy}%`} r="6"
                        fill={note.id === activeNoteId ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.4)'}
                        className="cursor-pointer"
                        onClick={() => setActiveNoteId(note.id)}
                      />
                      <text
                        x={`${cx}%`} y={`${cy + 4}%`}
                        textAnchor="middle" fontSize="8"
                        fill="hsl(var(--muted-foreground))"
                      >
                        {note.title.slice(0, 15)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
