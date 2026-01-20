// Inline workspace panels that appear beside chat
import React, { useState, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Editor from '@monaco-editor/react';
import {
  FileText,
  Code2,
  Workflow,
  X,
  Maximize2,
  Minimize2,
  Plus,
  Save,
  Play,
  FolderTree,
  Settings2,
  Wand2,
  Expand,
  Layers,
  Eye,
  GitBranch,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  Map
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSAMAnalysis } from '@/hooks/useSAMAnalysis';
import { SAMAnalysisPanel } from '@/components/SAM/SAMAnalysisPanel';

export type WorkspacePanelType = 'document' | 'code' | 'orchestration' | null;

interface WorkspacePanelProps {
  type: WorkspacePanelType;
  onClose: () => void;
  onFullscreen?: () => void;
  isFullscreen?: boolean;
}

// Document Workspace Panel
const DocumentWorkspace: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [content, setContent] = useState('# New Document\n\nStart writing here...');
  const [activeTab, setActiveTab] = useState('editor');
  const { analyzeWithAI, isAnalyzing, analysisResult } = useSAMAnalysis();

  const handleAnalyze = async () => {
    await analyzeWithAI(content, 'document');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-background/40">
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> New
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
          <Save className="w-3.5 h-3.5" /> Save
        </Button>
        <div className="h-4 w-px bg-border/50" />
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
          <Wand2 className="w-3.5 h-3.5" /> Enhance
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
          <Expand className="w-3.5 h-3.5" /> Expand
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
          <Layers className="w-3.5 h-3.5" /> Organize
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1.5 text-xs"
          onClick={handleAnalyze}
          disabled={isAnalyzing}
        >
          <Map className="w-3.5 h-3.5" /> SAM Check
        </Button>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-border/30 bg-transparent px-3">
          <TabsTrigger value="editor" className="text-xs data-[state=active]:bg-primary/10">
            <FileText className="w-3.5 h-3.5 mr-1.5" /> Editor
          </TabsTrigger>
          <TabsTrigger value="preview" className="text-xs data-[state=active]:bg-primary/10">
            <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview
          </TabsTrigger>
          <TabsTrigger value="sam" className="text-xs data-[state=active]:bg-primary/10">
            <Map className="w-3.5 h-3.5 mr-1.5" /> SAM
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="flex-1 m-0 p-0">
          <Editor
            height="100%"
            defaultLanguage="markdown"
            value={content}
            onChange={(value) => setContent(value || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineHeight: 1.6,
              padding: { top: 12, bottom: 12 },
              wordWrap: 'on',
              scrollBeyondLastLine: false,
            }}
          />
        </TabsContent>

        <TabsContent value="preview" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 prose prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }} />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="sam" className="flex-1 m-0 p-0">
          <SAMAnalysisPanel
            content={content}
            contentType="document"
            onApplySAM={(doc) => setContent(doc)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Code Workspace Panel  
const CodeWorkspace: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [code, setCode] = useState('// Your code here\nfunction hello() {\n  console.log("Hello World");\n}');
  const [activeTab, setActiveTab] = useState('editor');
  const [showPreview, setShowPreview] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src']));

  const fileTree = [
    { id: 'src', name: 'src', type: 'folder', children: [
      { id: 'components', name: 'components', type: 'folder', children: [
        { id: 'app', name: 'App.tsx', type: 'file' },
        { id: 'button', name: 'Button.tsx', type: 'file' },
      ]},
      { id: 'hooks', name: 'hooks', type: 'folder', children: [
        { id: 'usestate', name: 'useState.ts', type: 'file' },
      ]},
      { id: 'main', name: 'main.tsx', type: 'file' },
    ]},
    { id: 'package', name: 'package.json', type: 'file' },
  ];

  const toggleFolder = (id: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileTree = (items: any[], depth = 0) => {
    return items.map(item => (
      <div key={item.id}>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-7 px-2 text-xs hover:bg-accent/50"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => item.type === 'folder' && toggleFolder(item.id)}
        >
          {item.type === 'folder' ? (
            <>
              {expandedFolders.has(item.id) ? (
                <ChevronDown className="w-3 h-3 mr-1 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3 h-3 mr-1 text-muted-foreground" />
              )}
              <Folder className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
            </>
          ) : (
            <File className="w-3.5 h-3.5 mr-1.5 ml-4 text-muted-foreground" />
          )}
          {item.name}
        </Button>
        {item.type === 'folder' && expandedFolders.has(item.id) && item.children && (
          renderFileTree(item.children, depth + 1)
        )}
      </div>
    ));
  };

  return (
    <div className="flex h-full">
      {/* File Tree Sidebar */}
      <div className="w-48 border-r border-border/30 bg-background/20 flex flex-col">
        <div className="px-3 py-2 border-b border-border/30">
          <span className="text-xs font-medium text-muted-foreground">FILES</span>
        </div>
        <ScrollArea className="flex-1">
          <div className="py-1">
            {renderFileTree(fileTree)}
          </div>
        </ScrollArea>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-background/40">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <Play className="w-3.5 h-3.5" /> Run
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <Save className="w-3.5 h-3.5" /> Save
          </Button>
          <div className="h-4 w-px bg-border/50" />
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1.5 text-xs"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <GitBranch className="w-3.5 h-3.5" /> Branch
          </Button>
        </div>

        {/* Editor/Preview Split */}
        <div className="flex-1 flex">
          <div className={cn("flex-1", showPreview && "w-1/2")}>
            <Editor
              height="100%"
              defaultLanguage="typescript"
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineHeight: 1.5,
                padding: { top: 12 },
                scrollBeyondLastLine: false,
              }}
            />
          </div>
          
          {showPreview && (
            <div className="w-1/2 border-l border-border/30 bg-white">
              <div className="p-2 border-b border-border/30 bg-background/60 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Preview</span>
              </div>
              <iframe 
                className="w-full h-full bg-white" 
                srcDoc="<html><body><h1>Preview</h1><p>App preview would render here</p></body></html>"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Orchestration Workspace Panel
const OrchestrationWorkspace: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [chains, setChains] = useState([
    { id: '1', name: 'Research Pipeline', nodes: 5, status: 'ready' },
    { id: '2', name: 'Document Analysis', nodes: 8, status: 'running' },
    { id: '3', name: 'Code Review', nodes: 3, status: 'draft' },
  ]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-background/40">
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> New Chain
        </Button>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
          <Play className="w-3.5 h-3.5" /> Execute
        </Button>
        <div className="h-4 w-px bg-border/50" />
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
          <Settings2 className="w-3.5 h-3.5" /> Settings
        </Button>
      </div>

      {/* Chains List & Canvas */}
      <div className="flex-1 flex">
        {/* Chains Sidebar */}
        <div className="w-56 border-r border-border/30 bg-background/20">
          <div className="px-3 py-2 border-b border-border/30">
            <span className="text-xs font-medium text-muted-foreground">PROMPT CHAINS</span>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {chains.map(chain => (
                <Button 
                  key={chain.id}
                  variant="ghost" 
                  className="w-full justify-start h-auto py-2 px-3"
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <Workflow className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="text-sm">{chain.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] py-0">
                        {chain.nodes} nodes
                      </Badge>
                      <Badge 
                        variant={chain.status === 'running' ? 'default' : 'outline'} 
                        className={cn(
                          "text-[10px] py-0",
                          chain.status === 'running' && "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        )}
                      >
                        {chain.status}
                      </Badge>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center bg-[radial-gradient(circle,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]">
          <div className="text-center text-muted-foreground">
            <Workflow className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Select a chain to view or edit</p>
            <p className="text-xs mt-1">or create a new one</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const WorkspacePanel: React.FC<WorkspacePanelProps> = ({
  type,
  onClose,
  onFullscreen,
  isFullscreen
}) => {
  if (!type) return null;

  const getIcon = () => {
    switch (type) {
      case 'document': return <FileText className="w-4 h-4 text-cyan-400" />;
      case 'code': return <Code2 className="w-4 h-4 text-emerald-400" />;
      case 'orchestration': return <Workflow className="w-4 h-4 text-purple-400" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'document': return 'Document Builder';
      case 'code': return 'Code Builder';
      case 'orchestration': return 'Orchestration';
    }
  };

  const getGradient = () => {
    switch (type) {
      case 'document': return 'border-l-cyan-500/50';
      case 'code': return 'border-l-emerald-500/50';
      case 'orchestration': return 'border-l-purple-500/50';
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-background/60 backdrop-blur-xl border-l-2",
      getGradient()
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-background/40">
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="text-sm font-medium">{getTitle()}</span>
        </div>
        <div className="flex items-center gap-1">
          {onFullscreen && (
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onFullscreen}>
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </Button>
          )}
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onClose}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {type === 'document' && <DocumentWorkspace onClose={onClose} />}
        {type === 'code' && <CodeWorkspace onClose={onClose} />}
        {type === 'orchestration' && <OrchestrationWorkspace onClose={onClose} />}
      </div>
    </div>
  );
};
