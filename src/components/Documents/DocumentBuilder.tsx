// Advanced Document Builder with Monaco Editor
import React, { useState, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Plus, 
  Save, 
  Download,
  Upload,
  Trash2,
  Copy,
  Scissors,
  ClipboardPaste,
  FolderTree,
  Tag,
  Map,
  Wand2,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  Search,
  Settings,
  Sparkles,
  BookOpen,
  Layers,
  GitBranch
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DocumentNode {
  id: string;
  title: string;
  content: string;
  type: 'chapter' | 'section' | 'subsection' | 'note';
  tags: string[];
  children: DocumentNode[];
  metadata: {
    wordCount: number;
    createdAt: Date;
    updatedAt: Date;
    quality?: number;
  };
}

interface DocumentProject {
  id: string;
  name: string;
  description: string;
  nodes: DocumentNode[];
  masterIndex: string;
  systemMap: string;
  targetMetrics: {
    minWords: number;
    maxWords: number;
    minQuality: number;
    targetChapters: number;
  };
}

interface DocumentBuilderProps {
  onClose?: () => void;
}

export function DocumentBuilder({ onClose }: DocumentBuilderProps) {
  const [activeTab, setActiveTab] = useState<'editor' | 'structure' | 'index' | 'map'>('editor');
  const [project, setProject] = useState<DocumentProject>({
    id: crypto.randomUUID(),
    name: 'New Document Project',
    description: 'A comprehensive document project',
    nodes: [
      {
        id: '1',
        title: 'Introduction',
        content: '# Introduction\n\nWelcome to your document project.',
        type: 'chapter',
        tags: ['intro', 'overview'],
        children: [],
        metadata: {
          wordCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
          quality: 0.8,
        },
      },
    ],
    masterIndex: '# Master Index\n\n- Introduction',
    systemMap: '# System Map\n\nDocument structure overview',
    targetMetrics: {
      minWords: 10000,
      maxWords: 50000,
      minQuality: 0.85,
      targetChapters: 10,
    },
  });
  
  const [selectedNode, setSelectedNode] = useState<DocumentNode | null>(project.nodes[0]);
  const [isAutoBuilding, setIsAutoBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['1']));
  const editorRef = useRef<any>(null);

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
    editor.updateOptions({
      theme: 'vs-dark',
      fontSize: 14,
      minimap: { enabled: false },
      wordWrap: 'on',
      lineNumbers: 'on',
      padding: { top: 16 },
    });
  };

  const updateNodeContent = useCallback((content: string) => {
    if (!selectedNode) return;
    
    const wordCount = content.split(/\s+/).filter(Boolean).length;
    
    setProject(prev => {
      const updateNode = (nodes: DocumentNode[]): DocumentNode[] => {
        return nodes.map(node => {
          if (node.id === selectedNode.id) {
            return {
              ...node,
              content,
              metadata: {
                ...node.metadata,
                wordCount,
                updatedAt: new Date(),
              },
            };
          }
          return { ...node, children: updateNode(node.children) };
        });
      };
      return { ...prev, nodes: updateNode(prev.nodes) };
    });
    
    setSelectedNode(prev => prev ? { ...prev, content, metadata: { ...prev.metadata, wordCount, updatedAt: new Date() } } : null);
  }, [selectedNode]);

  const addNode = (parentId: string | null, type: DocumentNode['type']) => {
    const newNode: DocumentNode = {
      id: crypto.randomUUID(),
      title: `New ${type}`,
      content: `# New ${type}\n\nContent here...`,
      type,
      tags: [],
      children: [],
      metadata: {
        wordCount: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
        quality: 0,
      },
    };

    setProject(prev => {
      if (!parentId) {
        return { ...prev, nodes: [...prev.nodes, newNode] };
      }
      
      const addToParent = (nodes: DocumentNode[]): DocumentNode[] => {
        return nodes.map(node => {
          if (node.id === parentId) {
            return { ...node, children: [...node.children, newNode] };
          }
          return { ...node, children: addToParent(node.children) };
        });
      };
      return { ...prev, nodes: addToParent(prev.nodes) };
    });

    setSelectedNode(newNode);
    toast.success(`Created new ${type}`);
  };

  const deleteNode = (nodeId: string) => {
    setProject(prev => {
      const removeNode = (nodes: DocumentNode[]): DocumentNode[] => {
        return nodes.filter(n => n.id !== nodeId).map(n => ({
          ...n,
          children: removeNode(n.children),
        }));
      };
      return { ...prev, nodes: removeNode(prev.nodes) };
    });
    
    if (selectedNode?.id === nodeId) {
      setSelectedNode(project.nodes[0] || null);
    }
    toast.success('Node deleted');
  };

  const toggleExpanded = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const copyToClipboard = () => {
    if (selectedNode) {
      navigator.clipboard.writeText(selectedNode.content);
      toast.success('Copied to clipboard');
    }
  };

  const pasteFromClipboard = async () => {
    const text = await navigator.clipboard.readText();
    if (selectedNode && editorRef.current) {
      const editor = editorRef.current;
      const selection = editor.getSelection();
      editor.executeEdits('paste', [{
        range: selection,
        text: text,
      }]);
    }
  };

  const startAutoBuild = () => {
    setIsAutoBuilding(true);
    setBuildProgress(0);
    
    const interval = setInterval(() => {
      setBuildProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAutoBuilding(false);
          toast.success('Auto-build completed!');
          return 100;
        }
        return prev + 2;
      });
    }, 200);
  };

  const calculateTotalWords = (): number => {
    const countWords = (nodes: DocumentNode[]): number => {
      return nodes.reduce((acc, node) => {
        return acc + node.metadata.wordCount + countWords(node.children);
      }, 0);
    };
    return countWords(project.nodes);
  };

  const calculateProgress = (): number => {
    const total = calculateTotalWords();
    const { minWords, maxWords } = project.targetMetrics;
    return Math.min(100, (total / minWords) * 100);
  };

  const renderNodeTree = (nodes: DocumentNode[], depth = 0): React.ReactNode => {
    return nodes.map(node => (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            "flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors",
            selectedNode?.id === node.id ? "bg-primary/20 text-primary" : "hover:bg-muted/50"
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => setSelectedNode(node)}
        >
          {node.children.length > 0 && (
            <button onClick={(e) => { e.stopPropagation(); toggleExpanded(node.id); }}>
              {expandedNodes.has(node.id) ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          {node.children.length === 0 && <div className="w-4" />}
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm flex-1 truncate">{node.title}</span>
          <Badge variant="outline" className="text-[10px] py-0">
            {node.metadata.wordCount}w
          </Badge>
        </div>
        {expandedNodes.has(node.id) && node.children.length > 0 && (
          <div>{renderNodeTree(node.children, depth + 1)}</div>
        )}
      </div>
    ));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <Input
            value={project.name}
            onChange={(e) => setProject(prev => ({ ...prev, name: e.target.value }))}
            className="h-8 w-48 text-sm font-medium bg-transparent border-none"
          />
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => addNode(null, 'chapter')}>
            <Plus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={copyToClipboard}>
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={pasteFromClipboard}>
            <ClipboardPaste className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <Save className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <Download className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-border/50 mx-1" />
          
          <Button
            variant={isAutoBuilding ? "destructive" : "default"}
            size="sm"
            className="h-8 gap-1"
            onClick={isAutoBuilding ? () => setIsAutoBuilding(false) : startAutoBuild}
          >
            {isAutoBuilding ? (
              <>
                <Pause className="w-4 h-4" />
                Stop
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Auto Build
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-2 border-b border-border/30 bg-muted/20">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">
            {calculateTotalWords().toLocaleString()} / {project.targetMetrics.minWords.toLocaleString()} words
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {project.nodes.length} chapters
            </Badge>
            {isAutoBuilding && (
              <Badge className="bg-primary/20 text-primary animate-pulse text-xs">
                Building... {buildProgress}%
              </Badge>
            )}
          </div>
        </div>
        <Progress value={calculateProgress()} className="h-1.5" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2 justify-start w-auto bg-muted/30">
          <TabsTrigger value="editor" className="text-xs gap-1">
            <FileText className="w-3 h-3" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="structure" className="text-xs gap-1">
            <FolderTree className="w-3 h-3" />
            Structure
          </TabsTrigger>
          <TabsTrigger value="index" className="text-xs gap-1">
            <Layers className="w-3 h-3" />
            Index
          </TabsTrigger>
          <TabsTrigger value="map" className="text-xs gap-1">
            <Map className="w-3 h-3" />
            System Map
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="flex-1 flex m-0 p-0">
          {/* Document Tree */}
          <div className="w-64 border-r border-border/30 flex flex-col">
            <div className="p-2 border-b border-border/30 flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search..." className="h-7 text-xs bg-muted/30 border-none" />
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {renderNodeTree(project.nodes)}
              </div>
            </ScrollArea>
            <div className="p-2 border-t border-border/30 flex gap-1">
              <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs" onClick={() => addNode(selectedNode?.id || null, 'section')}>
                <Plus className="w-3 h-3 mr-1" />
                Section
              </Button>
              {selectedNode && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-7 h-7 text-destructive hover:text-destructive"
                  onClick={() => deleteNode(selectedNode.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 flex flex-col">
            {selectedNode ? (
              <>
                <div className="p-2 border-b border-border/30 flex items-center gap-2">
                  <Input
                    value={selectedNode.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setProject(prev => {
                        const updateTitle = (nodes: DocumentNode[]): DocumentNode[] => {
                          return nodes.map(n => 
                            n.id === selectedNode.id 
                              ? { ...n, title } 
                              : { ...n, children: updateTitle(n.children) }
                          );
                        };
                        return { ...prev, nodes: updateTitle(prev.nodes) };
                      });
                      setSelectedNode(prev => prev ? { ...prev, title } : null);
                    }}
                    className="h-7 text-sm font-medium bg-muted/30 border-none"
                  />
                  <Badge variant="outline" className="text-xs">{selectedNode.type}</Badge>
                  <div className="flex-1" />
                  <div className="flex gap-1">
                    {selectedNode.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <Editor
                    height="100%"
                    defaultLanguage="markdown"
                    value={selectedNode.content}
                    onChange={(value) => updateNodeContent(value || '')}
                    onMount={handleEditorMount}
                    theme="vs-dark"
                    options={{
                      fontSize: 14,
                      minimap: { enabled: false },
                      wordWrap: 'on',
                      lineNumbers: 'on',
                      padding: { top: 16 },
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p>Select a node to edit</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="structure" className="flex-1 m-0 p-4">
          <Card className="h-full p-4 border-border/30">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Document Structure
            </h3>
            <ScrollArea className="h-[calc(100%-40px)]">
              <div className="space-y-2">
                {project.nodes.map((node, i) => (
                  <Card key={node.id} className="p-3 border-border/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{node.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {node.metadata.wordCount} words • {node.children.length} subsections
                        </p>
                      </div>
                      <Badge variant="outline">{node.type}</Badge>
                    </div>
                    {node.metadata.quality !== undefined && (
                      <div className="mt-2">
                        <Progress value={node.metadata.quality * 100} className="h-1" />
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Quality: {Math.round(node.metadata.quality * 100)}%
                        </p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="index" className="flex-1 m-0 p-0">
          <Editor
            height="100%"
            defaultLanguage="markdown"
            value={project.masterIndex}
            onChange={(value) => setProject(prev => ({ ...prev, masterIndex: value || '' }))}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              wordWrap: 'on',
              padding: { top: 16 },
            }}
          />
        </TabsContent>

        <TabsContent value="map" className="flex-1 m-0 p-0">
          <Editor
            height="100%"
            defaultLanguage="markdown"
            value={project.systemMap}
            onChange={(value) => setProject(prev => ({ ...prev, systemMap: value || '' }))}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              wordWrap: 'on',
              padding: { top: 16 },
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
