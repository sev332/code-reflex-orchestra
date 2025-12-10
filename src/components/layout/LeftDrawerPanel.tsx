// Left drawer panel for user tools
import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  FileText, 
  FolderKanban, 
  Workflow, 
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
  PenTool
} from 'lucide-react';
import { DocumentBuilder } from '@/components/Documents/DocumentBuilder';
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

  const renderContent = () => {
    switch (activeDrawer) {
      case 'documents':
        return <DocumentsPanel onNavigate={onNavigate} />;
      case 'projects':
        return <ProjectsPanel />;
      case 'orchestration':
        return <OrchestrationPanel onNavigate={onNavigate} />;
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
      case 'builder':
        return <BuilderPanel />;
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "fixed left-12 top-12 bottom-0 w-72 bg-background/95 backdrop-blur-xl border-r border-border/50 z-30 flex flex-col animate-slide-in-right",
      className
    )}>
      {renderContent()}
    </div>
  );
}

function DocumentsPanel({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const recentDocs = [
    { name: 'AIMOS Architecture.md', type: 'markdown', updated: '2h ago' },
    { name: 'Project Roadmap.docx', type: 'document', updated: '5h ago' },
    { name: 'Research Notes.txt', type: 'text', updated: '1d ago' },
  ];

  return (
    <>
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Documents</h3>
          <Button variant="ghost" size="icon" className="w-7 h-7">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search documents..." className="pl-8 h-8 text-sm" />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          <p className="text-xs text-muted-foreground px-2 py-1">Recent</p>
          {recentDocs.map((doc, i) => (
            <Button
              key={i}
              variant="ghost"
              className="w-full justify-start h-auto py-2 px-2"
              onClick={() => onNavigate?.('documents')}
            >
              <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
              <div className="flex-1 text-left">
                <p className="text-sm truncate">{doc.name}</p>
                <p className="text-xs text-muted-foreground">{doc.updated}</p>
              </div>
            </Button>
          ))}
          
          <div className="pt-2">
            <Button 
              variant="outline" 
              className="w-full justify-center text-sm"
              onClick={() => onNavigate?.('documents')}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </div>
      </ScrollArea>
      
      <div className="p-3 border-t border-border/50">
        <Button 
          variant="default" 
          className="w-full"
          onClick={() => onNavigate?.('documents')}
        >
          Open Document Library
          <ChevronRight className="w-4 h-4 ml-auto" />
        </Button>
      </div>
    </>
  );
}

function ProjectsPanel() {
  const projects = [
    { name: 'AIMOS Development', status: 'active', tasks: 12 },
    { name: 'Research Pipeline', status: 'active', tasks: 5 },
    { name: 'Documentation', status: 'paused', tasks: 3 },
  ];

  return (
    <>
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Projects</h3>
          <Button variant="ghost" size="icon" className="w-7 h-7">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {projects.map((project, i) => (
            <Card key={i} className="p-3 cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Folder className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">{project.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="text-xs">
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

function OrchestrationPanel({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const chains = [
    { name: 'Research Pipeline', nodes: 8, status: 'ready' },
    { name: 'Code Analysis', nodes: 5, status: 'ready' },
    { name: 'Document Processing', nodes: 6, status: 'draft' },
  ];

  return (
    <>
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Orchestration</h3>
          <Button variant="ghost" size="icon" className="w-7 h-7">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          <p className="text-xs text-muted-foreground px-2">Prompt Chains</p>
          {chains.map((chain, i) => (
            <Card key={i} className="p-3 cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Workflow className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">{chain.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant={chain.status === 'ready' ? 'default' : 'outline'} className="text-xs">
                  {chain.nodes} nodes
                </Badge>
                <span className="text-xs text-muted-foreground">{chain.status}</span>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-3 border-t border-border/50">
        <Button 
          variant="default" 
          className="w-full"
          onClick={() => onNavigate?.('orchestration')}
        >
          Open Studio
          <ChevronRight className="w-4 h-4 ml-auto" />
        </Button>
      </div>
    </>
  );
}

function LibraryPanel() {
  return (
    <>
      <div className="p-4 border-b border-border/50">
        <h3 className="font-semibold text-sm">Knowledge Library</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4">
          <p className="text-sm text-muted-foreground">
            Access indexed knowledge, documentation, and research materials.
          </p>
          <div className="mt-4 space-y-2">
            <Card className="p-3">
              <p className="font-medium text-sm">System Documentation</p>
              <p className="text-xs text-muted-foreground">42 indexed documents</p>
            </Card>
            <Card className="p-3">
              <p className="font-medium text-sm">Research Papers</p>
              <p className="text-xs text-muted-foreground">18 indexed documents</p>
            </Card>
          </div>
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
          <Input placeholder="Search everything..." className="pl-9" autoFocus />
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Search across documents, conversations, memory, and knowledge.
        </p>
      </div>
    </>
  );
}

function HistoryPanel() {
  const history = [
    { query: 'APOE orchestration architecture', time: '10m ago' },
    { query: 'Document analysis', time: '1h ago' },
    { query: 'Memory systems overview', time: '3h ago' },
  ];

  return (
    <>
      <div className="p-4 border-b border-border/50">
        <h3 className="font-semibold text-sm">History</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {history.map((item, i) => (
            <Button key={i} variant="ghost" className="w-full justify-start h-auto py-2">
              <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
              <div className="flex-1 text-left">
                <p className="text-sm truncate">{item.query}</p>
                <p className="text-xs text-muted-foreground">{item.time}</p>
              </div>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </>
  );
}

function FavoritesPanel() {
  return (
    <>
      <div className="p-4 border-b border-border/50">
        <h3 className="font-semibold text-sm">Favorites</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 text-center text-muted-foreground">
          <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No favorites yet</p>
          <p className="text-xs">Star items to access them quickly</p>
        </div>
      </ScrollArea>
    </>
  );
}

function SettingsPanel() {
  return (
    <>
      <div className="p-4 border-b border-border/50">
        <h3 className="font-semibold text-sm">Settings</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            General
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            Appearance
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            AI Preferences
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            Keyboard Shortcuts
          </Button>
        </div>
      </ScrollArea>
    </>
  );
}

function BuilderPanel() {
  const [showFullBuilder, setShowFullBuilder] = useState(false);

  if (showFullBuilder) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <DocumentBuilder onClose={() => setShowFullBuilder(false)} />
      </div>
    );
  }

  return (
    <>
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Document Builder</h3>
          <Button variant="ghost" size="icon" className="w-7 h-7">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div className="text-center py-6">
            <PenTool className="w-12 h-12 mx-auto mb-3 text-primary/60" />
            <h4 className="font-medium mb-1">Advanced Document Editor</h4>
            <p className="text-xs text-muted-foreground mb-4">
              Monaco editor with AI-powered organization, tagging, and automated document building.
            </p>
          </div>
          
          <Card className="p-3 cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">New Document</span>
            </div>
            <p className="text-xs text-muted-foreground">Start with a blank document</p>
          </Card>
          
          <Card className="p-3 cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">From Template</span>
            </div>
            <p className="text-xs text-muted-foreground">Use a pre-built structure</p>
          </Card>
        </div>
      </ScrollArea>
      
      <div className="p-3 border-t border-border/50">
        <Button 
          variant="default" 
          className="w-full"
          onClick={() => setShowFullBuilder(true)}
        >
          Open Full Builder
          <ChevronRight className="w-4 h-4 ml-auto" />
        </Button>
      </div>
    </>
  );
}