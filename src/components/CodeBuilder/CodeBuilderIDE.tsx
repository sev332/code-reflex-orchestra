// Code Builder IDE - Full-featured code editor with folder structure, AI assistance, and SAM Analysis
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileCode, Plus, Save, Download, Upload, Trash2, Copy,
  FolderTree, Folder, FolderOpen, File, ChevronRight,
  ChevronDown, Search, Sparkles, Play, Terminal, GitBranch,
  Brain, Eye, Zap, RefreshCw, Check, X, Settings,
  Code2, FileJson, FileType, Loader2, Map
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SAMAnalysisPanel } from '@/components/SAM/SAMAnalysisPanel';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  children?: FileNode[];
  isOpen?: boolean;
}

interface CodeBuilderIDEProps {
  onClose?: () => void;
}

const getFileIcon = (name: string) => {
  if (name.endsWith('.tsx') || name.endsWith('.ts')) return <FileCode className="w-4 h-4 text-blue-400" />;
  if (name.endsWith('.json')) return <FileJson className="w-4 h-4 text-yellow-400" />;
  if (name.endsWith('.css') || name.endsWith('.scss')) return <FileType className="w-4 h-4 text-pink-400" />;
  if (name.endsWith('.md')) return <FileType className="w-4 h-4 text-gray-400" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
};

const getLanguage = (name: string): string => {
  if (name.endsWith('.tsx')) return 'typescript';
  if (name.endsWith('.ts')) return 'typescript';
  if (name.endsWith('.js') || name.endsWith('.jsx')) return 'javascript';
  if (name.endsWith('.json')) return 'json';
  if (name.endsWith('.css')) return 'css';
  if (name.endsWith('.scss')) return 'scss';
  if (name.endsWith('.html')) return 'html';
  if (name.endsWith('.md')) return 'markdown';
  return 'plaintext';
};

export function CodeBuilderIDE({ onClose }: CodeBuilderIDEProps) {
  const [fileTree, setFileTree] = useState<FileNode[]>([
    {
      id: 'src',
      name: 'src',
      type: 'folder',
      isOpen: true,
      children: [
        {
          id: 'components',
          name: 'components',
          type: 'folder',
          isOpen: true,
          children: [
            {
              id: 'app-tsx',
              name: 'App.tsx',
              type: 'file',
              language: 'typescript',
              content: `import React from 'react';

function App() {
  return (
    <div className="app">
      <h1>Welcome to Code Builder</h1>
      <p>Start building your application here.</p>
    </div>
  );
}

export default App;`
            }
          ]
        },
        {
          id: 'index-tsx',
          name: 'index.tsx',
          type: 'file',
          language: 'typescript',
          content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
        },
        {
          id: 'index-css',
          name: 'index.css',
          type: 'file',
          language: 'css',
          content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

p {
  color: rgba(255, 255, 255, 0.7);
}`
        }
      ]
    },
    {
      id: 'package-json',
      name: 'package.json',
      type: 'file',
      language: 'json',
      content: `{
  "name": "my-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}`
    }
  ]);

  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [openFiles, setOpenFiles] = useState<FileNode[]>([]);
  const [aiInstruction, setAiInstruction] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>(['> Code Builder IDE initialized...']);
  const [activeTab, setActiveTab] = useState<'files' | 'ai' | 'sam' | 'terminal'>('files');
  const [newItemName, setNewItemName] = useState('');
  const [newItemType, setNewItemType] = useState<'file' | 'folder'>('file');
  const [showNewItem, setShowNewItem] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  
  const editorRef = useRef<any>(null);

  // Find file in tree
  const findFile = (nodes: FileNode[], id: string): FileNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findFile(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Update file content
  const updateFileContent = (id: string, content: string) => {
    const updateTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === id) {
          return { ...node, content };
        }
        if (node.children) {
          return { ...node, children: updateTree(node.children) };
        }
        return node;
      });
    };
    setFileTree(updateTree(fileTree));
    
    // Update open files
    setOpenFiles(prev => prev.map(f => f.id === id ? { ...f, content } : f));
    if (selectedFile?.id === id) {
      setSelectedFile({ ...selectedFile, content });
    }
  };

  // Toggle folder open/closed
  const toggleFolder = (id: string) => {
    const updateTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === id) {
          return { ...node, isOpen: !node.isOpen };
        }
        if (node.children) {
          return { ...node, children: updateTree(node.children) };
        }
        return node;
      });
    };
    setFileTree(updateTree(fileTree));
  };

  // Select file
  const selectFile = (file: FileNode) => {
    if (file.type === 'file') {
      setSelectedFile(file);
      if (!openFiles.find(f => f.id === file.id)) {
        setOpenFiles(prev => [...prev, file]);
      }
    } else {
      toggleFolder(file.id);
      setSelectedFolder(file.id);
    }
  };

  // Close file tab
  const closeFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenFiles(prev => prev.filter(f => f.id !== id));
    if (selectedFile?.id === id) {
      const remaining = openFiles.filter(f => f.id !== id);
      setSelectedFile(remaining.length > 0 ? remaining[remaining.length - 1] : null);
    }
  };

  // Add new file or folder
  const addNewItem = (parentId: string | null) => {
    if (!newItemName.trim()) return;

    const newItem: FileNode = {
      id: crypto.randomUUID(),
      name: newItemName,
      type: newItemType,
      ...(newItemType === 'file' ? { content: '', language: getLanguage(newItemName) } : { children: [], isOpen: true })
    };

    const addToTree = (nodes: FileNode[]): FileNode[] => {
      if (!parentId) {
        return [...nodes, newItem];
      }
      return nodes.map(node => {
        if (node.id === parentId && node.type === 'folder') {
          return { ...node, children: [...(node.children || []), newItem] };
        }
        if (node.children) {
          return { ...node, children: addToTree(node.children) };
        }
        return node;
      });
    };

    setFileTree(addToTree(fileTree));
    setNewItemName('');
    setShowNewItem(false);
    
    if (newItemType === 'file') {
      selectFile(newItem);
    }
    
    toast.success(`${newItemType === 'file' ? 'File' : 'Folder'} created`);
  };

  // Delete file or folder
  const deleteItem = (id: string) => {
    const deleteFromTree = (nodes: FileNode[]): FileNode[] => {
      return nodes.filter(node => {
        if (node.id === id) return false;
        if (node.children) {
          node.children = deleteFromTree(node.children);
        }
        return true;
      });
    };
    
    setFileTree(deleteFromTree(fileTree));
    setOpenFiles(prev => prev.filter(f => f.id !== id));
    if (selectedFile?.id === id) {
      setSelectedFile(null);
    }
    toast.success('Item deleted');
  };

  // AI Code Generation
  const generateCode = async () => {
    if (!aiInstruction.trim()) {
      toast.error('Please enter an instruction');
      return;
    }

    setIsGenerating(true);
    setTerminalOutput(prev => [...prev, `> AI generating code: "${aiInstruction}"...`]);

    try {
      const { data, error } = await supabase.functions.invoke('dream-mode', {
        body: {
          action: 'generate_code',
          instruction: aiInstruction,
          currentFile: selectedFile?.content || '',
          fileName: selectedFile?.name || 'new-file.tsx',
          fileTree: fileTree.map(f => ({ name: f.name, type: f.type }))
        }
      });

      if (error) throw error;

      if (data?.code) {
        if (selectedFile) {
          updateFileContent(selectedFile.id, data.code);
          setTerminalOutput(prev => [...prev, `> Code generated and applied to ${selectedFile.name}`]);
        } else {
          // Create new file with generated code
          const newFile: FileNode = {
            id: crypto.randomUUID(),
            name: data.fileName || 'generated.tsx',
            type: 'file',
            content: data.code,
            language: 'typescript'
          };
          setFileTree(prev => [...prev, newFile]);
          selectFile(newFile);
          setTerminalOutput(prev => [...prev, `> New file created: ${newFile.name}`]);
        }
        toast.success('Code generated successfully!');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      setTerminalOutput(prev => [...prev, `> Error: ${error}`]);
      toast.error('Failed to generate code');
    } finally {
      setIsGenerating(false);
      setAiInstruction('');
    }
  };

  // Render file tree
  const renderTree = (nodes: FileNode[], depth = 0) => {
    return nodes.map(node => (
      <div key={node.id}>
        <div
          className={cn(
            "flex items-center gap-1 py-1 px-2 cursor-pointer rounded-md transition-colors",
            selectedFile?.id === node.id ? "bg-primary/20 text-primary" : "hover:bg-muted/50"
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => selectFile(node)}
        >
          {node.type === 'folder' ? (
            <>
              {node.isOpen ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
              {node.isOpen ? (
                <FolderOpen className="w-4 h-4 text-amber-400" />
              ) : (
                <Folder className="w-4 h-4 text-amber-400" />
              )}
            </>
          ) : (
            <>
              <span className="w-4" />
              {getFileIcon(node.name)}
            </>
          )}
          <span className="text-sm flex-1 truncate">{node.name}</span>
          <Button
            variant="ghost"
            size="icon"
            className="w-5 h-5 opacity-0 group-hover:opacity-100"
            onClick={(e) => { e.stopPropagation(); deleteItem(node.id); }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
        {node.type === 'folder' && node.isOpen && node.children && (
          renderTree(node.children, depth + 1)
        )}
      </div>
    ));
  };

  const handleEditorMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    editor.updateOptions({
      theme: 'vs-dark',
      fontSize: 14,
      minimap: { enabled: true },
      wordWrap: 'on',
      lineNumbers: 'on',
      padding: { top: 16 },
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
    });
  };

  return (
    <div className="h-full flex flex-col bg-background/95 backdrop-blur">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          <Code2 className="w-5 h-5 text-cyan-400" />
          <span className="font-semibold">Code Builder IDE</span>
          <Badge variant="outline" className="text-xs">AI Assisted</Badge>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setShowNewItem(true)}>
            <Plus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <Save className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <Play className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - File Tree & AI */}
        <div className="w-64 border-r border-border/30 flex flex-col">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex flex-col h-full">
            <TabsList className="mx-2 mt-2 justify-start w-auto bg-muted/30 flex-shrink-0">
              <TabsTrigger value="files" className="text-xs"><FolderTree className="w-3 h-3" /></TabsTrigger>
              <TabsTrigger value="ai" className="text-xs"><Brain className="w-3 h-3" /></TabsTrigger>
              <TabsTrigger value="sam" className="text-xs"><Map className="w-3 h-3" /></TabsTrigger>
              <TabsTrigger value="terminal" className="text-xs"><Terminal className="w-3 h-3" /></TabsTrigger>
            </TabsList>

            <TabsContent value="files" className="flex-1 m-0 overflow-hidden">
              <div className="p-2 border-b border-border/30">
                <Input 
                  placeholder="Search files..." 
                  className="h-7 text-xs bg-muted/30 border-none"
                />
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2">
                  {renderTree(fileTree)}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="ai" className="flex-1 flex flex-col m-0 overflow-hidden">
              <div className="p-2 space-y-2 flex-shrink-0">
                <Textarea
                  placeholder="Describe what code you want to generate..."
                  value={aiInstruction}
                  onChange={(e) => setAiInstruction(e.target.value)}
                  className="text-xs h-24 bg-muted/30 border-border/30"
                />
                <Button 
                  size="sm" 
                  className="w-full h-8 text-xs gap-1"
                  onClick={generateCode}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      Generate Code
                    </>
                  )}
                </Button>
              </div>
              <div className="flex-1 p-2">
                <Card className="h-full p-3 bg-muted/20">
                  <p className="text-xs text-muted-foreground">
                    AI suggestions and code insights will appear here as you work.
                  </p>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="sam" className="flex-1 m-0 overflow-hidden">
              <SAMAnalysisPanel
                content={selectedFile?.content || ''}
                contentType="code"
                fileName={selectedFile?.name || 'untitled'}
                language={selectedFile?.language || 'typescript'}
                onApplySAM={(samContent) => {
                  // Create a new SAM documentation file
                  const samFile: FileNode = {
                    id: crypto.randomUUID(),
                    name: `${selectedFile?.name?.replace(/\.[^/.]+$/, '') || 'untitled'}_SAM.md`,
                    type: 'file',
                    content: samContent,
                    language: 'markdown',
                  };
                  setFileTree(prev => [...prev, samFile]);
                  selectFile(samFile);
                  setTerminalOutput(prev => [...prev, `> SAM documentation generated: ${samFile.name}`]);
                  toast.success('SAM documentation created!');
                }}
              />
            </TabsContent>

            <TabsContent value="terminal" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-2 font-mono text-xs space-y-1">
                  {terminalOutput.map((line, i) => (
                    <div key={i} className="text-muted-foreground">{line}</div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* File Tabs */}
          {openFiles.length > 0 && (
            <div className="flex items-center border-b border-border/30 bg-muted/10 overflow-x-auto">
              {openFiles.map(file => (
                <div
                  key={file.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 border-r border-border/30 cursor-pointer",
                    selectedFile?.id === file.id ? "bg-background" : "hover:bg-muted/30"
                  )}
                  onClick={() => setSelectedFile(file)}
                >
                  {getFileIcon(file.name)}
                  <span className="text-xs">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-4 h-4"
                    onClick={(e) => closeFile(file.id, e)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Monaco Editor */}
          <div className="flex-1">
            {selectedFile ? (
              <Editor
                height="100%"
                language={selectedFile.language || 'typescript'}
                value={selectedFile.content || ''}
                onChange={(value) => updateFileContent(selectedFile.id, value || '')}
                onMount={handleEditorMount}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  minimap: { enabled: true },
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  padding: { top: 16 },
                  smoothScrolling: true,
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Code2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Select a file to start editing</p>
                  <p className="text-xs mt-1">or use AI to generate new code</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Item Modal */}
      {showNewItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNewItem(false)}>
          <Card className="p-4 w-80" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-3">Create New Item</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  variant={newItemType === 'file' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewItemType('file')}
                >
                  <File className="w-4 h-4 mr-1" />
                  File
                </Button>
                <Button
                  variant={newItemType === 'folder' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewItemType('folder')}
                >
                  <Folder className="w-4 h-4 mr-1" />
                  Folder
                </Button>
              </div>
              <Input
                placeholder={newItemType === 'file' ? 'filename.tsx' : 'folder-name'}
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addNewItem(selectedFolder)}
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowNewItem(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={() => addNewItem(selectedFolder)}>
                  Create
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
