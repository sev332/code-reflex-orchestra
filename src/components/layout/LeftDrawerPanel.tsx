// Left drawer panel for utilities (storage, library, search, history)
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  FileText, 
  FolderKanban, 
  BookOpen,
  Search,
  Clock,
  Star,
  Settings,
  Plus,
  Upload,
  ChevronRight,
  File,
  Folder,
  Database,
  HardDrive,
  Cloud,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LeftDrawerType } from './LeftIconBar';

interface LeftDrawerPanelProps {
  activeDrawer: LeftDrawerType;
  onClose: () => void;
  onNavigate?: (view: string) => void;
  className?: string;
}

export function LeftDrawerPanel({ activeDrawer, onClose, onNavigate, className }: LeftDrawerPanelProps) {
  if (!activeDrawer) return null;

  // Skip drawer types that are now inline workspace panels
  if (['builder', 'dream', 'code-builder', 'orchestration'].includes(activeDrawer)) {
    return null;
  }

  const renderContent = () => {
    switch (activeDrawer) {
      case 'documents':
        return <DocumentStoragePanel onNavigate={onNavigate} />;
      case 'projects':
        return <ProjectsPanel />;
      case 'library':
        return <LibraryPanel />;
      case 'search':
        return <SearchPanel />;
      case 'history':
        return <HistoryPanel />;
      case 'favorites':
        return <FavoritesPanel />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "fixed left-12 top-12 bottom-0 w-80 bg-background/95 backdrop-blur-xl border-r border-border/50 z-30 flex flex-col animate-slide-in-right",
      className
    )}>
      {renderContent()}
    </div>
  );
}

function DocumentStoragePanel({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const folders = [
    { name: 'My Documents', count: 12, icon: Folder },
    { name: 'Shared', count: 5, icon: Cloud },
    { name: 'Recent', count: 8, icon: Clock },
    { name: 'Starred', count: 3, icon: Star },
  ];

  const recentDocs = [
    { name: 'AIMOS Architecture.md', type: 'markdown', size: '24 KB', updated: '2h ago' },
    { name: 'Project Roadmap.docx', type: 'document', size: '156 KB', updated: '5h ago' },
    { name: 'Research Notes.txt', type: 'text', size: '8 KB', updated: '1d ago' },
    { name: 'API Documentation.md', type: 'markdown', size: '45 KB', updated: '2d ago' },
  ];

  return (
    <>
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Document Storage</h3>
          </div>
          <Button variant="ghost" size="icon" className="w-7 h-7">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search documents..." className="pl-8 h-8 text-sm bg-muted/30 border-none" />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Folders */}
          <div>
            <p className="text-xs text-muted-foreground px-2 py-1 uppercase tracking-wide">Folders</p>
            <div className="space-y-1">
              {folders.map((folder, i) => {
                const Icon = folder.icon;
                return (
                  <Button
                    key={i}
                    variant="ghost"
                    className="w-full justify-start h-9 px-2"
                  >
                    <Icon className="w-4 h-4 mr-2 text-cyan-400" />
                    <span className="flex-1 text-left text-sm">{folder.name}</span>
                    <Badge variant="secondary" className="text-[10px]">{folder.count}</Badge>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Recent Documents */}
          <div>
            <p className="text-xs text-muted-foreground px-2 py-1 uppercase tracking-wide">Recent</p>
            <div className="space-y-1">
              {recentDocs.map((doc, i) => (
                <Button
                  key={i}
                  variant="ghost"
                  className="w-full justify-start h-auto py-2 px-2"
                >
                  <FileText className="w-4 h-4 mr-2 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.size} • {doc.updated}</p>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
      
      <div className="p-3 border-t border-border/50 space-y-2">
        <Button variant="outline" className="w-full text-sm">
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
        <Button 
          variant="default" 
          className="w-full text-sm"
          onClick={() => onNavigate?.('documents')}
        >
          Open Library
          <ChevronRight className="w-4 h-4 ml-auto" />
        </Button>
      </div>
    </>
  );
}

function ProjectsPanel() {
  const projects = [
    { name: 'AIMOS Development', status: 'active', tasks: 12, progress: 67 },
    { name: 'Research Pipeline', status: 'active', tasks: 5, progress: 45 },
    { name: 'Documentation', status: 'paused', tasks: 3, progress: 80 },
  ];

  return (
    <>
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Projects</h3>
          </div>
          <Button variant="ghost" size="icon" className="w-7 h-7">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {projects.map((project, i) => (
            <Card key={i} className="p-3 cursor-pointer hover:bg-accent/50 transition-colors border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <Folder className="w-4 h-4 text-cyan-400" />
                <span className="font-medium text-sm">{project.name}</span>
              </div>
              <div className="h-1.5 bg-muted/30 rounded-full mb-2">
                <div 
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                  {project.status}
                </Badge>
                <span className="text-xs text-muted-foreground">{project.tasks} tasks</span>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </>
  );
}

function LibraryPanel() {
  const categories = [
    { name: 'System Documentation', count: 42, icon: Database },
    { name: 'Research Papers', count: 18, icon: FileText },
    { name: 'Code References', count: 156, icon: File },
    { name: 'Tagged Content', count: 89, icon: Tag },
  ];

  return (
    <>
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Knowledge Library</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Indexed knowledge and documentation
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <Card key={i} className="p-3 cursor-pointer hover:bg-accent/50 transition-colors border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">{cat.count} indexed items</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </>
  );
}

function SearchPanel() {
  return (
    <>
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search everything..." className="pl-9 bg-muted/30 border-none" autoFocus />
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Search across documents, conversations, memory, and knowledge.
        </p>
        
        <div className="mt-4 space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Search in</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="cursor-pointer hover:bg-accent/50">Documents</Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-accent/50">Messages</Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-accent/50">Memory</Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-accent/50">Code</Badge>
          </div>
        </div>
      </div>
    </>
  );
}

function HistoryPanel() {
  const history = [
    { query: 'APOE orchestration architecture', time: '10m ago', type: 'search' },
    { query: 'Document analysis chain', time: '1h ago', type: 'chat' },
    { query: 'Memory systems overview', time: '3h ago', type: 'search' },
    { query: 'Code refactoring patterns', time: '5h ago', type: 'chat' },
    { query: 'SAM protocol validation', time: '1d ago', type: 'chat' },
  ];

  return (
    <>
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">History</h3>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {history.map((item, i) => (
            <Button key={i} variant="ghost" className="w-full justify-start h-auto py-2.5 px-2">
              <Clock className="w-4 h-4 mr-2 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm truncate">{item.query}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                  <Badge variant="outline" className="text-[9px] py-0">{item.type}</Badge>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
      <div className="p-3 border-t border-border/50">
        <Button variant="outline" className="w-full text-sm text-muted-foreground">
          Clear History
        </Button>
      </div>
    </>
  );
}

function FavoritesPanel() {
  const favorites = [
    { name: 'AIMOS Core Architecture', type: 'document' },
    { name: 'Research Pipeline Chain', type: 'chain' },
  ];

  return (
    <>
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Favorites</h3>
        </div>
      </div>
      <ScrollArea className="flex-1">
        {favorites.length > 0 ? (
          <div className="p-3 space-y-1">
            {favorites.map((item, i) => (
              <Button key={i} variant="ghost" className="w-full justify-start h-9 px-2">
                <Star className="w-4 h-4 mr-2 text-amber-400 fill-amber-400" />
                <span className="flex-1 text-left text-sm truncate">{item.name}</span>
                <Badge variant="outline" className="text-[9px]">{item.type}</Badge>
              </Button>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No favorites yet</p>
            <p className="text-xs">Star items to access them quickly</p>
          </div>
        )}
      </ScrollArea>
    </>
  );
}

function SettingsPanel() {
  const settingSections = [
    { name: 'General', description: 'App preferences and defaults' },
    { name: 'Appearance', description: 'Theme and visual settings' },
    { name: 'AI Preferences', description: 'Model selection and behavior' },
    { name: 'Keyboard Shortcuts', description: 'Customize key bindings' },
    { name: 'Storage', description: 'Manage local and cloud storage' },
  ];

  return (
    <>
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Settings</h3>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {settingSections.map((section, i) => (
            <Button key={i} variant="ghost" className="w-full justify-start h-auto py-3 px-2">
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{section.name}</p>
                <p className="text-xs text-muted-foreground">{section.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Button>
          ))}
        </div>
      </ScrollArea>
    </>
  );
}
