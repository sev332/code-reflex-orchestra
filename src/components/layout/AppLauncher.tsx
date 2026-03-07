// Full-screen app launcher grid — macOS Launchpad style
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare, Zap, FileText, Code2, Image, Music, Video, Map,
  Table2, CalendarDays, Mail, KanbanSquare, MessageCircle,
  Box, LayoutDashboard, Database, Terminal, Globe, StickyNote,
  FolderOpen, Presentation, Beaker, Search, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PageId } from './PageTopBar';

interface AppDef {
  id: PageId;
  label: string;
  icon: React.ComponentType<any>;
  category: string;
  color: string;
  description: string;
  status?: 'new' | 'beta';
}

export const allApps: AppDef[] = [
  // AI & Core
  { id: 'chat', label: 'Chat', icon: MessageSquare, category: 'AI & Core', color: 'from-cyan-500 to-blue-600', description: 'AI assistant hub' },
  { id: 'orchestration', label: 'Orchestration', icon: Zap, category: 'AI & Core', color: 'from-amber-500 to-orange-600', description: 'AI workflow studio' },
  // Productivity
  { id: 'documents', label: 'Documents', icon: FileText, category: 'Productivity', color: 'from-blue-500 to-indigo-600', description: 'Word processor' },
  { id: 'spreadsheet', label: 'Spreadsheet', icon: Table2, category: 'Productivity', color: 'from-emerald-500 to-green-600', description: 'Data & formulas' },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays, category: 'Productivity', color: 'from-red-500 to-rose-600', description: 'Scheduling' },
  { id: 'email', label: 'Email', icon: Mail, category: 'Productivity', color: 'from-sky-500 to-blue-600', description: 'Mail client' },
  { id: 'tasks', label: 'Tasks', icon: KanbanSquare, category: 'Productivity', color: 'from-violet-500 to-purple-600', description: 'Project management' },
  { id: 'presentations', label: 'Slides', icon: Presentation, category: 'Productivity', color: 'from-orange-500 to-amber-600', description: 'Slide decks', status: 'beta' },
  // Creative
  { id: 'image', label: 'Image', icon: Image, category: 'Creative', color: 'from-pink-500 to-rose-600', description: 'Image editor' },
  { id: 'audio', label: 'Audio', icon: Music, category: 'Creative', color: 'from-purple-500 to-violet-600', description: 'Audio production' },
  { id: 'video', label: 'Video', icon: Video, category: 'Creative', color: 'from-red-500 to-pink-600', description: 'Video editor' },
  { id: 'studio3d', label: '3D Studio', icon: Box, category: 'Creative', color: 'from-indigo-500 to-blue-600', description: 'CAD & 3D scenes', status: 'beta' },
  // Dev & Data
  { id: 'ide', label: 'Code IDE', icon: Code2, category: 'Dev & Data', color: 'from-green-500 to-emerald-600', description: 'Software dev' },
  { id: 'terminal', label: 'Terminal', icon: Terminal, category: 'Dev & Data', color: 'from-gray-500 to-zinc-600', description: 'Shell emulator', status: 'beta' },
  { id: 'apistudio', label: 'API Studio', icon: Beaker, category: 'Dev & Data', color: 'from-teal-500 to-cyan-600', description: 'API testing', status: 'beta' },
  { id: 'database', label: 'Database', icon: Database, category: 'Dev & Data', color: 'from-amber-500 to-yellow-600', description: 'DB explorer', status: 'beta' },
  { id: 'dashboard', label: 'Dashboards', icon: LayoutDashboard, category: 'Dev & Data', color: 'from-blue-500 to-cyan-600', description: 'Analytics builder', status: 'beta' },
  // Knowledge & System
  { id: 'browser', label: 'Browser', icon: Globe, category: 'Knowledge', color: 'from-sky-500 to-indigo-600', description: 'Web research', status: 'beta' },
  { id: 'notes', label: 'Notes', icon: StickyNote, category: 'Knowledge', color: 'from-yellow-500 to-amber-600', description: 'Wiki & notes', status: 'beta' },
  { id: 'files', label: 'Files', icon: FolderOpen, category: 'System', color: 'from-slate-500 to-gray-600', description: 'File manager', status: 'beta' },
  { id: 'map', label: 'Map', icon: Map, category: 'System', color: 'from-emerald-500 to-teal-600', description: 'Geospatial' },
  { id: 'comms', label: 'Comms', icon: MessageCircle, category: 'System', color: 'from-purple-500 to-indigo-600', description: 'Messaging hub', status: 'beta' },
];

const categories = ['AI & Core', 'Productivity', 'Creative', 'Dev & Data', 'Knowledge', 'System'];

interface AppLauncherProps {
  isOpen: boolean;
  onClose: () => void;
  onAppSelect: (id: PageId) => void;
  pinnedApps: PageId[];
  onTogglePin: (id: PageId) => void;
}

export function AppLauncher({ isOpen, onClose, onAppSelect, pinnedApps, onTogglePin }: AppLauncherProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return allApps;
    const q = search.toLowerCase();
    return allApps.filter(a => a.label.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.category.toLowerCase().includes(q));
  }, [search]);

  const grouped = useMemo(() => {
    const map: Record<string, AppDef[]> = {};
    categories.forEach(c => { map[c] = []; });
    filtered.forEach(a => { if (map[a.category]) map[a.category].push(a); });
    return map;
  }, [filtered]);

  if (!isOpen) return null;

  const handleSelect = (id: PageId) => {
    onAppSelect(id);
    onClose();
    setSearch('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl" />
      
      {/* Content */}
      <div
        className="relative z-10 w-full max-w-5xl max-h-[85vh] overflow-y-auto rounded-2xl px-8 py-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search bar */}
        <div className="flex items-center gap-3 mb-8">
          <div className="relative flex-1 max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search apps..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 text-lg bg-white/10 border-white/20 rounded-xl text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/10">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Category grids */}
        {categories.map((cat) => {
          const apps = grouped[cat];
          if (!apps || apps.length === 0) return null;
          return (
            <div key={cat} className="mb-8">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 px-1">{cat}</h3>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {apps.map((app) => {
                  const Icon = app.icon;
                  const isPinned = pinnedApps.includes(app.id);
                  return (
                    <button
                      key={app.id}
                      onClick={() => handleSelect(app.id)}
                      onContextMenu={(e) => { e.preventDefault(); onTogglePin(app.id); }}
                      className="group flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-white/10 transition-all duration-200 cursor-pointer"
                    >
                      <div className={cn(
                        'w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg transition-transform group-hover:scale-110',
                        app.color
                      )}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium text-foreground leading-tight">{app.label}</p>
                        {app.status && (
                          <Badge variant="outline" className="text-[8px] px-1 py-0 mt-0.5 border-white/20 text-muted-foreground">
                            {app.status}
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <p className="text-center text-xs text-muted-foreground/50 mt-4">Right-click to pin/unpin apps from the top bar</p>
      </div>
    </div>
  );
}
