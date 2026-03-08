// Notes/Wiki — Block-based editor with slash commands, inline formatting,
// bidirectional linking, knowledge graph, and AI assistance
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus, Trash2, Search, Star, Clock, Tag, Link2, GitBranch,
  FileText, ChevronRight, ChevronDown, Hash, Wand2, ArrowLeft,
  Edit3, Eye, BookOpen, Sparkles, Pin, FolderOpen,
  Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare,
  Code, Quote, Image, Table, Minus, Type, Bold, Italic,
  Strikethrough, Link, Copy, MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────
interface Block {
  id: string;
  type: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'bullet' | 'numbered' | 'todo' | 'code' | 'quote' | 'divider' | 'image' | 'table' | 'callout';
  content: string;
  checked?: boolean;
  language?: string;
  collapsed?: boolean;
}

interface Note {
  id: string;
  title: string;
  blocks: Block[];
  tags: string[];
  links: string[];
  createdAt: Date;
  updatedAt: Date;
  pinned: boolean;
  folder: string;
  icon?: string;
}

// ─── Slash Command Menu ───────────────────────────────────────
const SLASH_COMMANDS = [
  { type: 'heading1', label: 'Heading 1', icon: <Heading1 className="w-3.5 h-3.5" />, desc: 'Large heading' },
  { type: 'heading2', label: 'Heading 2', icon: <Heading2 className="w-3.5 h-3.5" />, desc: 'Medium heading' },
  { type: 'heading3', label: 'Heading 3', icon: <Heading3 className="w-3.5 h-3.5" />, desc: 'Small heading' },
  { type: 'bullet', label: 'Bullet List', icon: <List className="w-3.5 h-3.5" />, desc: 'Unordered list' },
  { type: 'numbered', label: 'Numbered List', icon: <ListOrdered className="w-3.5 h-3.5" />, desc: 'Ordered list' },
  { type: 'todo', label: 'To-do', icon: <CheckSquare className="w-3.5 h-3.5" />, desc: 'Task checkbox' },
  { type: 'code', label: 'Code Block', icon: <Code className="w-3.5 h-3.5" />, desc: 'Code snippet' },
  { type: 'quote', label: 'Quote', icon: <Quote className="w-3.5 h-3.5" />, desc: 'Block quote' },
  { type: 'divider', label: 'Divider', icon: <Minus className="w-3.5 h-3.5" />, desc: 'Horizontal rule' },
  { type: 'callout', label: 'Callout', icon: <Star className="w-3.5 h-3.5" />, desc: 'Highlighted block' },
  { type: 'table', label: 'Table', icon: <Table className="w-3.5 h-3.5" />, desc: 'Simple table' },
];

// ─── Convert markdown content to blocks ───────────────────────
function contentToBlocks(content: string): Block[] {
  return content.split('\n').map((line, i) => {
    const id = `b-${i}`;
    if (line.startsWith('# ')) return { id, type: 'heading1' as const, content: line.slice(2) };
    if (line.startsWith('## ')) return { id, type: 'heading2' as const, content: line.slice(3) };
    if (line.startsWith('### ')) return { id, type: 'heading3' as const, content: line.slice(4) };
    if (line.startsWith('- [ ] ')) return { id, type: 'todo' as const, content: line.slice(6), checked: false };
    if (line.startsWith('- [x] ')) return { id, type: 'todo' as const, content: line.slice(6), checked: true };
    if (line.startsWith('- ')) return { id, type: 'bullet' as const, content: line.slice(2) };
    if (line.match(/^\d+\./)) return { id, type: 'numbered' as const, content: line.replace(/^\d+\.\s*/, '') };
    if (line.startsWith('> ')) return { id, type: 'quote' as const, content: line.slice(2) };
    if (line.startsWith('---')) return { id, type: 'divider' as const, content: '' };
    if (line.startsWith('|')) return { id, type: 'paragraph' as const, content: line };
    return { id, type: 'paragraph' as const, content: line };
  }).filter(b => !(b.type === 'paragraph' && b.content === ''));
}

// ─── Default notes data ──────────────────────────────────────
const defaultNotes: Note[] = [
  {
    id: 'n1', title: 'AIMOS Architecture', folder: 'Architecture', icon: '🧠',
    blocks: contentToBlocks('# AIMOS Architecture\n\nAIMOS is a memory-centric, auditable operating system.\n\n## Core Components\n- **CMC** — Context Memory Core\n- **APOE** — Adaptive Prompt Orchestration Engine\n- **VIF** — Verifiable Intelligence Fabric\n- **SDF-CVF** — Build & Validation Fabric\n\n## Key Principles\n1. Memory-first: persist only what clears quality gates\n2. Structure over sprawl\n3. Proof beats persuasion\n4. Atomic evolution\n5. User sovereignty'),
    tags: ['architecture', 'aimos', 'core'], links: ['n2', 'n3'],
    createdAt: new Date('2026-01-15'), updatedAt: new Date('2026-03-01'), pinned: true,
  },
  {
    id: 'n2', title: 'CMC Deep Dive', folder: 'Architecture', icon: '💾',
    blocks: contentToBlocks('# CMC — Context Memory Core\n\nTurns ephemeral context into time-aware, queryable memory with rollback.\n\n## Components\n- Hierarchical indexing (short/medium/large/super)\n- Tag graph with semantic/temporal tags\n- Dumbbell compression (head/tail ≥ 20%)\n- Snapshots and branching\n- RS-based retrieval ranking\n\n## Mathematical Backbone\n- Quality Score: QS = 0.4·Comp + 0.3·Density + 0.3·Rel\n- Retrieval Score: RS = QS · IDS · (1 - DD)\n- Persist rule: QS > θ_Q ∧ DD < θ_D'),
    tags: ['cmc', 'memory', 'architecture'], links: ['n1'],
    createdAt: new Date('2026-01-20'), updatedAt: new Date('2026-02-15'), pinned: false,
  },
  {
    id: 'n3', title: 'APOE Pipeline', folder: 'Architecture', icon: '⚡',
    blocks: contentToBlocks('# APOE — Prompt Orchestration\n\nA cognitive compiler that plans, budgets, and routes reasoning.\n\n## Node Set\n- PLAN → DISAMBIGUATE → RETRIEVE → CONDENSE\n- REASON → CRITIC → VERIFY → FORMAT\n- AUDIT → REFLECT\n\n## Key Rules\n- If VERIFY fails → increase k, re-CONDENSE\n- If cost cap hit → reduce parallelism but NEVER cut VERIFY\n- Token budget allocated proportional to Need·Unc·Impact'),
    tags: ['apoe', 'orchestration', 'pipeline'], links: ['n1'],
    createdAt: new Date('2026-01-25'), updatedAt: new Date('2026-02-20'), pinned: false,
  },
  {
    id: 'n4', title: 'Q1 Review Meeting', folder: 'Meetings', icon: '📋',
    blocks: contentToBlocks('# Q1 Review Meeting\n\n## Highlights\n- Browser OS expansion approved\n- Wave 1 productivity apps shipped\n- 3D Studio prototype in progress\n\n## Action Items\n- [ ] Complete Wave 2 creative tools\n- [ ] Begin Wave 3 dev tools\n- [ ] Performance audit for canvas components\n- [x] App Launcher design finalized'),
    tags: ['meetings', 'q1', 'planning'], links: [],
    createdAt: new Date('2026-03-01'), updatedAt: new Date('2026-03-01'), pinned: false,
  },
  {
    id: 'n5', title: 'Retrieval Scoring', folder: 'Research', icon: '📊',
    blocks: contentToBlocks('# Retrieval Scoring Algorithm\n\n## RS Formula\n- RS = QS · IDS · (1 - DD)\n\n## Variables\n- QS (Quality Score) = weighted combo of completeness, density, relevance\n- IDS (Index Depth Score) = log-based depth with connection density\n- DD (Dependency Delta) = cosine similarity weighted change\n\n## Thresholds\n- θ_Q default: 0.60 / strict: 0.65\n- θ_D default: 0.20 / strict: 0.10\n- θ_L default: 0.15 / strict: 0.10'),
    tags: ['algorithms', 'retrieval', 'math'], links: ['n2'],
    createdAt: new Date('2026-02-01'), updatedAt: new Date('2026-02-10'), pinned: false,
  },
];

// ─── Block Renderer Component ────────────────────────────────
const BlockRenderer: React.FC<{
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
  onDelete: () => void;
  onInsertAfter: (type: Block['type']) => void;
  onNavigateLink: (title: string) => void;
  isEditing: boolean;
}> = ({ block, onUpdate, onDelete, onInsertAfter, onNavigateLink, isEditing }) => {
  const [showSlash, setShowSlash] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '/' && block.content === '') {
      setShowSlash(true);
      setSlashFilter('');
      e.preventDefault();
    } else if (e.key === 'Enter' && !e.shiftKey && !showSlash) {
      e.preventDefault();
      onInsertAfter('paragraph');
    } else if (e.key === 'Backspace' && block.content === '' && block.type !== 'divider') {
      e.preventDefault();
      onDelete();
    } else if (e.key === 'Escape') {
      setShowSlash(false);
    }
  };

  const handleSlashSelect = (type: string) => {
    setShowSlash(false);
    onUpdate({ type: type as Block['type'], content: '' });
  };

  const filteredCommands = SLASH_COMMANDS.filter(c =>
    c.label.toLowerCase().includes(slashFilter.toLowerCase())
  );

  // Render wiki links in view mode
  const renderInlineContent = (text: string) => {
    const parts = text.split(/(\[\[.+?\]\]|\*\*.+?\*\*|\*.+?\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      const wikiMatch = part.match(/\[\[(.+?)\]\]/);
      if (wikiMatch) {
        return (
          <button key={i} onClick={() => onNavigateLink(wikiMatch[1])}
            className="text-primary hover:underline font-medium">
            {wikiMatch[1]}
          </button>
        );
      }
      const boldMatch = part.match(/\*\*(.+?)\*\*/);
      if (boldMatch) return <strong key={i} className="font-semibold">{boldMatch[1]}</strong>;
      const italicMatch = part.match(/\*(.+?)\*/);
      if (italicMatch) return <em key={i}>{italicMatch[1]}</em>;
      const codeMatch = part.match(/`([^`]+)`/);
      if (codeMatch) return <code key={i} className="bg-muted/40 text-primary/80 rounded px-1 py-0.5 text-[0.85em] font-mono">{codeMatch[1]}</code>;
      return <span key={i}>{part}</span>;
    });
  };

  if (block.type === 'divider') {
    return <hr className="my-3 border-border/30" />;
  }

  const viewContent = () => {
    switch (block.type) {
      case 'heading1': return <h1 className="text-2xl font-bold mb-1">{renderInlineContent(block.content)}</h1>;
      case 'heading2': return <h2 className="text-lg font-semibold mt-4 mb-1 text-foreground/90">{renderInlineContent(block.content)}</h2>;
      case 'heading3': return <h3 className="text-base font-semibold mt-3 mb-0.5">{renderInlineContent(block.content)}</h3>;
      case 'bullet': return <p className="text-sm pl-4 flex gap-2"><span className="text-muted-foreground">•</span>{renderInlineContent(block.content)}</p>;
      case 'numbered': return <p className="text-sm pl-4">{renderInlineContent(block.content)}</p>;
      case 'todo': return (
        <label className="text-sm flex items-center gap-2 pl-2 cursor-pointer">
          <input type="checkbox" checked={block.checked} onChange={() => onUpdate({ checked: !block.checked })}
            className="w-4 h-4 rounded border-border accent-primary" />
          <span className={cn(block.checked && 'line-through text-muted-foreground')}>{renderInlineContent(block.content)}</span>
        </label>
      );
      case 'code': return (
        <pre className="bg-muted/20 rounded-lg p-3 text-xs font-mono text-foreground/80 overflow-x-auto border border-border/20">
          <code>{block.content}</code>
        </pre>
      );
      case 'quote': return (
        <blockquote className="border-l-2 border-primary/40 pl-3 text-sm text-foreground/70 italic">{renderInlineContent(block.content)}</blockquote>
      );
      case 'callout': return (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm flex gap-2">
          <span>💡</span>
          <span>{renderInlineContent(block.content)}</span>
        </div>
      );
      default: return <p className="text-sm text-foreground/80 leading-relaxed">{renderInlineContent(block.content)}</p>;
    }
  };

  if (!isEditing) return <div className="relative group py-0.5">{viewContent()}</div>;

  const textareaClass = cn(
    'w-full bg-transparent border-none outline-none resize-none',
    'focus-visible:ring-0 focus-visible:ring-offset-0',
    block.type === 'heading1' && 'text-2xl font-bold',
    block.type === 'heading2' && 'text-lg font-semibold',
    block.type === 'heading3' && 'text-base font-semibold',
    block.type === 'code' && 'font-mono text-xs bg-muted/20 rounded p-2',
    block.type === 'quote' && 'italic text-foreground/70 border-l-2 border-primary/40 pl-3',
    block.type === 'callout' && 'bg-primary/5 rounded p-2',
    !['heading1', 'heading2', 'heading3', 'code'].includes(block.type) && 'text-sm',
  );

  return (
    <div className="relative group py-0.5">
      <div className="flex items-start gap-1">
        {/* Block type indicator */}
        <div className="w-6 shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab pt-0.5">
          <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground/40" />
        </div>

        {block.type === 'todo' && (
          <input type="checkbox" checked={block.checked} onChange={() => onUpdate({ checked: !block.checked })}
            className="w-4 h-4 rounded border-border accent-primary mt-0.5 shrink-0" />
        )}
        {block.type === 'bullet' && <span className="text-muted-foreground shrink-0 mt-0.5">•</span>}

        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={block.content}
          onChange={e => {
            onUpdate({ content: e.target.value });
            if (showSlash) setSlashFilter(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          className={textareaClass}
          rows={1}
          style={{ height: 'auto', minHeight: block.type === 'code' ? '60px' : '24px' }}
          placeholder={block.type === 'paragraph' ? "Type '/' for commands..." : ''}
        />
      </div>

      {/* Slash command menu */}
      {showSlash && (
        <div className="absolute left-6 top-full z-50 w-56 bg-card border border-border/40 rounded-lg shadow-xl shadow-black/30 py-1 backdrop-blur-xl">
          <div className="px-2 py-1 text-[9px] text-muted-foreground font-semibold uppercase">Blocks</div>
          {filteredCommands.map(cmd => (
            <button
              key={cmd.type}
              onClick={() => handleSlashSelect(cmd.type)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-muted/30 transition-colors"
            >
              <span className="w-6 h-6 rounded bg-muted/30 flex items-center justify-center shrink-0">{cmd.icon}</span>
              <div className="text-left">
                <p className="font-medium">{cmd.label}</p>
                <p className="text-[10px] text-muted-foreground">{cmd.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Knowledge Graph Canvas ──────────────────────────────────
const KnowledgeGraph: React.FC<{
  notes: Note[];
  activeNoteId: string;
  onSelectNote: (id: string) => void;
}> = ({ notes, activeNoteId, onSelectNote }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = 'hsl(220, 27%, 4%)';
    ctx.fillRect(0, 0, w, h);

    // Position nodes in force layout (simplified)
    const positions = notes.map((_, i) => {
      const angle = (i / notes.length) * Math.PI * 2;
      const r = Math.min(w, h) * 0.32;
      return { x: w / 2 + Math.cos(angle) * r, y: h / 2 + Math.sin(angle) * r };
    });

    // Draw edges
    notes.forEach((note, i) => {
      note.links.forEach(linkId => {
        const j = notes.findIndex(n => n.id === linkId);
        if (j < 0) return;

        const active = note.id === activeNoteId || linkId === activeNoteId;
        ctx.strokeStyle = active ? 'hsla(193, 100%, 50%, 0.4)' : 'hsla(193, 100%, 50%, 0.1)';
        ctx.lineWidth = active ? 1.5 : 0.5;
        ctx.beginPath();
        ctx.moveTo(positions[i].x, positions[i].y);
        ctx.lineTo(positions[j].x, positions[j].y);
        ctx.stroke();

        // Animated particle on active edges
        if (active) {
          const t = (Date.now() % 3000) / 3000;
          const px = positions[i].x + (positions[j].x - positions[i].x) * t;
          const py = positions[i].y + (positions[j].y - positions[i].y) * t;
          ctx.fillStyle = 'hsl(193, 100%, 50%)';
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    });

    // Draw nodes
    notes.forEach((note, i) => {
      const { x, y } = positions[i];
      const isActive = note.id === activeNoteId;
      const isLinked = notes.find(n => n.id === activeNoteId)?.links.includes(note.id);
      const r = isActive ? 10 : isLinked ? 7 : 5;

      // Glow
      if (isActive || isLinked) {
        ctx.fillStyle = `hsla(193, 100%, 50%, ${isActive ? 0.15 : 0.08})`;
        ctx.beginPath();
        ctx.arc(x, y, r + 8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = isActive
        ? 'hsl(193, 100%, 50%)'
        : isLinked
          ? 'hsl(270, 100%, 70%)'
          : 'hsla(193, 100%, 50%, 0.4)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = isActive ? 'hsl(193, 100%, 85%)' : 'hsla(193, 30%, 65%, 0.6)';
      ctx.font = `${isActive ? '10' : '9'}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(note.title.slice(0, 18), x, y + r + 12);
    });
  }, [notes, activeNoteId]);

  useEffect(() => {
    let running = true;
    const loop = () => {
      if (!running) return;
      draw();
      requestAnimationFrame(loop);
    };
    loop();
    return () => { running = false; };
  }, [draw]);

  const handleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    notes.forEach((note, i) => {
      const angle = (i / notes.length) * Math.PI * 2;
      const r = Math.min(w, h) * 0.32;
      const x = w / 2 + Math.cos(angle) * r;
      const y = h / 2 + Math.sin(angle) * r;
      if (Math.hypot(mx - x, my - y) < 15) {
        onSelectNote(note.id);
      }
    });
  };

  return <canvas ref={canvasRef} className="w-full h-full cursor-pointer" onClick={handleClick} />;
};

// ─── Main NotesPage ──────────────────────────────────────────
export function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(defaultNotes);
  const [activeNoteId, setActiveNoteId] = useState<string>('n1');
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [showGraph, setShowGraph] = useState(false);

  const activeNote = notes.find(n => n.id === activeNoteId);

  const folders = useMemo(() => Array.from(new Set(notes.map(n => n.folder))), [notes]);

  const filteredNotes = useMemo(() => {
    let result = notes;
    if (activeFolder) result = result.filter(n => n.folder === activeFolder);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.blocks.some(b => b.content.toLowerCase().includes(q)) ||
        n.tags.some(t => t.includes(q))
      );
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
      id: `n-${Date.now()}`, title: 'Untitled Note', icon: '📝',
      blocks: [{ id: 'b-0', type: 'heading1', content: 'Untitled Note' }, { id: 'b-1', type: 'paragraph', content: '' }],
      tags: [], links: [], createdAt: new Date(), updatedAt: new Date(),
      pinned: false, folder: activeFolder || 'Inbox',
    };
    setNotes(prev => [n, ...prev]);
    setActiveNoteId(n.id);
    setIsEditing(true);
  }, [activeFolder]);

  const updateNoteBlocks = useCallback((blocks: Block[]) => {
    setNotes(prev => prev.map(n => n.id === activeNoteId ? { ...n, blocks, updatedAt: new Date() } : n));
  }, [activeNoteId]);

  const updateBlock = useCallback((blockId: string, updates: Partial<Block>) => {
    if (!activeNote) return;
    const newBlocks = activeNote.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b);
    updateNoteBlocks(newBlocks);
  }, [activeNote, updateNoteBlocks]);

  const deleteBlock = useCallback((blockId: string) => {
    if (!activeNote || activeNote.blocks.length <= 1) return;
    updateNoteBlocks(activeNote.blocks.filter(b => b.id !== blockId));
  }, [activeNote, updateNoteBlocks]);

  const insertBlockAfter = useCallback((afterId: string, type: Block['type']) => {
    if (!activeNote) return;
    const idx = activeNote.blocks.findIndex(b => b.id === afterId);
    const newBlock: Block = { id: `b-${Date.now()}`, type, content: '' };
    const newBlocks = [...activeNote.blocks];
    newBlocks.splice(idx + 1, 0, newBlock);
    updateNoteBlocks(newBlocks);
  }, [activeNote, updateNoteBlocks]);

  const navigateToLink = useCallback((title: string) => {
    const target = notes.find(n => n.title === title);
    if (target) {
      setActiveNoteId(target.id);
      setIsEditing(false);
    }
  }, [notes]);

  const updateNote = useCallback((updates: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === activeNoteId ? { ...n, ...updates, updatedAt: new Date() } : n));
  }, [activeNoteId]);

  return (
    <div className="h-full flex flex-col bg-background/30">
      {/* Header */}
      <div className="h-10 bg-background/80 backdrop-blur-xl border-b border-border/30 flex items-center px-3 gap-2 shrink-0">
        <BookOpen className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold">Notes & Wiki</span>

        <div className="relative w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search notes..." className="h-7 text-xs pl-8 bg-muted/30 border-border/30" />
        </div>

        <select
          value={activeFolder || 'all'}
          onChange={(e) => setActiveFolder(e.target.value === 'all' ? null : e.target.value)}
          className="h-7 rounded-md border border-border/30 bg-muted/30 px-2 text-xs text-foreground"
        >
          <option value="all">All folders</option>
          {folders.map((folder) => (
            <option key={folder} value={folder}>{folder}</option>
          ))}
        </select>

        <select
          value={activeNoteId}
          onChange={(e) => { setActiveNoteId(e.target.value); setIsEditing(false); }}
          className="h-7 min-w-48 rounded-md border border-border/30 bg-muted/30 px-2 text-xs text-foreground"
        >
          {(filteredNotes.length > 0 ? filteredNotes : notes).map((note) => (
            <option key={note.id} value={note.id}>{note.title}</option>
          ))}
        </select>

        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={createNote} className="h-7 text-xs gap-1">
          <Plus className="w-3.5 h-3.5" /> New Note
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowGraph(v => !v)} className={cn('h-7 text-xs gap-1', showGraph && 'text-primary')}>
          <GitBranch className="w-3.5 h-3.5" /> Graph
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Note content */}
        {activeNote ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 py-2 border-b border-border/20 flex items-center gap-2 shrink-0">
              {activeNote.icon && <span className="text-lg">{activeNote.icon}</span>}
              <span className="text-[10px] text-muted-foreground">{activeNote.folder}</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-medium flex-1">{activeNote.title}</span>
              <div className="flex items-center gap-0.5">
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

            <ScrollArea className="flex-1">
              <div className="px-8 py-6 max-w-3xl mx-auto">
                {/* Block-based content */}
                {activeNote.blocks.map(block => (
                  <BlockRenderer
                    key={block.id}
                    block={block}
                    isEditing={isEditing}
                    onUpdate={(updates) => updateBlock(block.id, updates)}
                    onDelete={() => deleteBlock(block.id)}
                    onInsertAfter={(type) => insertBlockAfter(block.id, type)}
                    onNavigateLink={navigateToLink}
                  />
                ))}

                {/* Add block button in edit mode */}
                {isEditing && (
                  <Button
                    variant="ghost" size="sm"
                    className="mt-2 text-[10px] text-muted-foreground gap-1"
                    onClick={() => {
                      const lastBlock = activeNote.blocks[activeNote.blocks.length - 1];
                      if (lastBlock) insertBlockAfter(lastBlock.id, 'paragraph');
                    }}
                  >
                    <Plus className="w-3 h-3" /> Add block
                  </Button>
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
                          <p className="text-xs font-medium text-primary">{bl.icon} {bl.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {bl.blocks.find(b => b.type === 'paragraph')?.content.slice(0, 80)}
                          </p>
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
          <div className="w-80 border-l border-border/30 flex flex-col shrink-0">
            <div className="px-3 py-2 border-b border-border/20 flex items-center justify-between">
              <span className="text-xs font-semibold">Knowledge Graph</span>
              <Badge variant="outline" className="text-[8px] h-3.5">{notes.length} nodes</Badge>
            </div>
            <KnowledgeGraph notes={notes} activeNoteId={activeNoteId} onSelectNote={setActiveNoteId} />
          </div>
        )}
      </div>
    </div>
  );
}
