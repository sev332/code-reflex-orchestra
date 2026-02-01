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
  Map,
  Monitor
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSAMAnalysis } from '@/hooks/useSAMAnalysis';
import { SAMAnalysisPanel } from '@/components/SAM/SAMAnalysisPanel';
import { CodePreviewPane } from './CodePreviewPane';

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

// Code Workspace Panel with Live Preview
const CodeWorkspace: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [code, setCode] = useState(`// Your code here
import React from 'react';

export function App() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Hello World</h1>
      <p className="text-gray-600">Edit the code to see live updates!</p>
    </div>
  );
}`);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'sam'>('editor');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src']));
  const [selectedFile, setSelectedFile] = useState('app');
  const [previewHtml, setPreviewHtml] = useState('');

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

  // Generate preview HTML from code
  const generatePreview = useCallback(() => {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; }
    .p-8 { padding: 2rem; }
    .text-2xl { font-size: 1.5rem; }
    .font-bold { font-weight: 700; }
    .mb-4 { margin-bottom: 1rem; }
    .text-gray-600 { color: #4b5563; }
  </style>
</head>
<body>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Hello World</h1>
    <p class="text-gray-600">Edit the code to see live updates!</p>
  </div>
</body>
</html>`;
    setPreviewHtml(html);
  }, [code]);

  // Update preview when code changes
  React.useEffect(() => {
    generatePreview();
  }, [code, generatePreview]);

  const renderFileTree = (items: any[], depth = 0) => {
    return items.map(item => (
      <div key={item.id}>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start h-7 px-2 text-xs hover:bg-accent/50",
            selectedFile === item.id && item.type === 'file' && "bg-primary/10 text-primary"
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (item.type === 'folder') {
              toggleFolder(item.id);
            } else {
              setSelectedFile(item.id);
            }
          }}
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
        <div className="px-3 py-2 border-b border-border/30 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">FILES</span>
          <Button variant="ghost" size="icon" className="w-5 h-5">
            <Plus className="w-3 h-3" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="py-1">
            {renderFileTree(fileTree)}
          </div>
        </ScrollArea>
      </div>

      {/* Main Editor/Preview Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-background/40">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <Play className="w-3.5 h-3.5 text-emerald-400" /> Run
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <Save className="w-3.5 h-3.5" /> Save
          </Button>
          <div className="h-4 w-px bg-border/50" />
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <Wand2 className="w-3.5 h-3.5 text-purple-400" /> AI Assist
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <Map className="w-3.5 h-3.5" /> SAM
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b border-border/30 bg-transparent px-3">
            <TabsTrigger value="editor" className="text-xs data-[state=active]:bg-primary/10">
              <Code2 className="w-3.5 h-3.5 mr-1.5" /> Editor
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs data-[state=active]:bg-primary/10">
              <Monitor className="w-3.5 h-3.5 mr-1.5" /> Live Preview
            </TabsTrigger>
            <TabsTrigger value="sam" className="text-xs data-[state=active]:bg-primary/10">
              <Map className="w-3.5 h-3.5 mr-1.5" /> SAM
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="flex-1 m-0 p-0">
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
          </TabsContent>

          <TabsContent value="preview" className="flex-1 m-0 p-2">
            <CodePreviewPane 
              code={code}
              html={previewHtml}
              isBuilding={false}
              onRefresh={generatePreview}
            />
          </TabsContent>

          <TabsContent value="sam" className="flex-1 m-0 p-0">
            <SAMAnalysisPanel
              content={code}
              contentType="code"
              onApplySAM={(doc) => setCode(doc)}
            />
          </TabsContent>
        </Tabs>
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
