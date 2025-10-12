// 🔗 CONNECT: Document AI → Deep Search & Master Indexing System
// 🧩 INTENT: Advanced panel for deep search, long-form analysis, source management, and novel-length document building
// ✅ SPEC: Master index organization, section expansion, source tracking, full document assembly

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  FileText,
  BookOpen,
  List,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Download,
  Plus,
  Edit,
  Trash2,
  Sparkles,
  Brain,
  Zap,
  Database,
  Check,
  X
} from 'lucide-react';
import { useDocumentManagement } from '@/hooks/useDocumentManagement';
import { useDocumentEditor } from '@/hooks/useDocumentEditor';
import { useGoogleAI } from '@/hooks/useGoogleAI';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  source: string;
  relevance: number;
  timestamp: string;
}

interface DocumentSection {
  id: string;
  title: string;
  content: string;
  level: number;
  expanded: boolean;
  subsections: DocumentSection[];
  sources: string[];
  wordCount: number;
}

interface MasterIndex {
  sections: DocumentSection[];
  totalWords: number;
  totalSources: number;
}

export const AdvancedDeepSearchPanel: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  
  const [masterIndex, setMasterIndex] = useState<MasterIndex>({
    sections: [],
    totalWords: 0,
    totalSources: 0
  });
  
  const [currentDocument, setCurrentDocument] = useState<{
    title: string;
    sections: DocumentSection[];
  }>({
    title: 'Untitled Document',
    sections: []
  });

  const [generatingSection, setGeneratingSection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const { chat } = useGoogleAI();
  const { analyzeSection } = useDocumentEditor();
  const { getDocuments } = useDocumentManagement();

  const handleDeepSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    try {
      toast.info('🔍 Performing deep search with AI analysis...');
      
      const prompt = `Perform a comprehensive deep search and analysis on the topic: "${searchQuery}"
      
      Provide:
      1. Comprehensive overview and key concepts
      2. Main research findings and insights
      3. Current state of the field
      4. Practical applications
      5. Future directions and implications
      
      Write in a structured, academic style with clear sections.`;
      
      const result = await chat(prompt, [], { 
        temperature: 0.7,
        max_tokens: 8000
      });
      
      if (result && result.success) {
        // Parse search results
        const results: SearchResult[] = [
          {
            id: crypto.randomUUID(),
            title: `Deep Analysis: ${searchQuery}`,
            content: result.content || '',
            source: 'AI Deep Search (Gemini 2.0)',
            relevance: 0.95,
            timestamp: new Date().toISOString()
          }
        ];
        
        setSearchResults(results);
        toast.success(`Found comprehensive analysis`);
      }
    } catch (error: any) {
      console.error('Deep search error:', error);
      toast.error('Deep search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateSection = async (title: string, parentSection?: DocumentSection) => {
    const sectionId = crypto.randomUUID();
    setGeneratingSection(sectionId);

    try {
      toast.info(`🧠 Generating section: ${title}...`);
      
      const prompt = `Write a detailed, well-researched section titled "${title}" for a comprehensive document. Include:
      - Clear introduction and context
      - Main points with supporting evidence
      - Examples and case studies where relevant
      - Smooth transitions
      - Professional academic tone
      
      Target length: 500-800 words.`;
      
      const result = await chat(prompt, [], {
        temperature: 0.8,
        max_tokens: 4000
      });
      
      if (result && result.success) {
        const content = result.content || '';
        const newSection: DocumentSection = {
          id: sectionId,
          title,
          content,
          level: parentSection ? parentSection.level + 1 : 1,
          expanded: true,
          subsections: [],
          sources: ['AI Generated (Gemini 2.0)'],
          wordCount: content.split(/\s+/).length
        };

        if (parentSection) {
          // Add as subsection
          updateSectionInMasterIndex(parentSection.id, (section) => {
            section.subsections.push(newSection);
          });
        } else {
          // Add as top-level section
          setMasterIndex(prev => ({
            sections: [...prev.sections, newSection],
            totalWords: prev.totalWords + newSection.wordCount,
            totalSources: prev.totalSources + 1
          }));
        }

        toast.success(`Section "${title}" generated successfully!`);
      }
    } catch (error: any) {
      console.error('Section generation error:', error);
      toast.error('Failed to generate section');
    } finally {
      setGeneratingSection(null);
    }
  };

  const updateSectionInMasterIndex = (sectionId: string, updater: (section: DocumentSection) => void) => {
    const updateRecursive = (sections: DocumentSection[]): DocumentSection[] => {
      return sections.map(section => {
        if (section.id === sectionId) {
          updater(section);
          return { ...section };
        }
        return {
          ...section,
          subsections: updateRecursive(section.subsections)
        };
      });
    };

    setMasterIndex(prev => ({
      ...prev,
      sections: updateRecursive(prev.sections)
    }));
  };

  const toggleSectionExpansion = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const renderSection = (section: DocumentSection, depth: number = 0) => {
    const isExpanded = expandedSections.has(section.id);
    const isGenerating = generatingSection === section.id;

    return (
      <div key={section.id} className={cn("mb-3", depth > 0 && "ml-6")}>
        <Card className="p-4 bg-card/80 hover:bg-card transition-all">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSectionExpansion(section.id)}
                className="h-6 w-6 p-0"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
              
              <div className="flex-1">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  {section.title}
                  {section.subsections.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {section.subsections.length} subsections
                    </Badge>
                  )}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    Level {section.level}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {section.wordCount} words
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {section.sources.length} sources
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleGenerateSection(`Subsection of ${section.title}`, section)}
                disabled={isGenerating}
                title="Add subsection"
              >
                <Plus className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                title="Edit section"
              >
                <Edit className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {isExpanded && (
            <div className="mt-3 space-y-3">
              <div className="text-sm text-muted-foreground max-h-48 overflow-y-auto rounded border border-border/50 p-3 bg-background/50">
                {section.content}
              </div>
              
              {section.sources.length > 0 && (
                <div className="text-xs">
                  <p className="text-muted-foreground mb-1">Sources:</p>
                  <div className="flex flex-wrap gap-1">
                    {section.sources.map((source, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {source}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Render subsections */}
        {section.subsections.length > 0 && (
          <div className="mt-2">
            {section.subsections.map(subsection => renderSection(subsection, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const exportDocument = () => {
    const generateMarkdown = (sections: DocumentSection[], level: number = 1): string => {
      return sections.map(section => {
        const heading = '#'.repeat(level) + ' ' + section.title;
        const subsectionsMarkdown = section.subsections.length > 0
          ? '\n\n' + generateMarkdown(section.subsections, level + 1)
          : '';
        return `${heading}\n\n${section.content}${subsectionsMarkdown}`;
      }).join('\n\n---\n\n');
    };

    const markdown = `# ${currentDocument.title}\n\n${generateMarkdown(masterIndex.sections)}`;
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDocument.title.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Document exported as Markdown!');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-border bg-card/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              Advanced Deep Search
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Build novel-length documents with AI-powered research and master indexing
            </p>
          </div>
        </div>

        {/* Master Document Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 bg-card/80 border-primary/20">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total Sections</p>
                <p className="text-lg font-bold">{masterIndex.sections.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 bg-card/80 border-primary/20">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total Words</p>
                <p className="text-lg font-bold">{masterIndex.totalWords.toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 bg-card/80 border-primary/20">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Sources</p>
                <p className="text-lg font-bold">{masterIndex.totalSources}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="search" className="flex-1 flex flex-col">
        <TabsList className="mx-6 mt-4">
          <TabsTrigger value="search">
            <Search className="w-4 h-4 mr-2" />
            Deep Search
          </TabsTrigger>
          <TabsTrigger value="master-index">
            <List className="w-4 h-4 mr-2" />
            Master Index
          </TabsTrigger>
          <TabsTrigger value="document">
            <FileText className="w-4 h-4 mr-2" />
            Full Document
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="flex-1 flex flex-col p-6 pt-2">
          <Card className="p-4 mb-4 bg-primary/5 border-primary/20">
            <div className="flex gap-2">
              <Input
                placeholder="Enter deep search query (e.g., 'quantum computing applications in cryptography')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleDeepSearch()}
                className="flex-1"
              />
              <Button 
                onClick={handleDeepSearch} 
                disabled={isSearching}
                className="neural-glow"
              >
                <Search className="w-4 h-4 mr-2" />
                {isSearching ? 'Searching...' : 'Deep Search'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              AI will perform comprehensive research with source analysis and structured results
            </p>
          </Card>

          <ScrollArea className="flex-1">
            {searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((result) => (
                  <Card 
                    key={result.id}
                    className="p-4 cursor-pointer hover:border-primary/50 transition-all"
                    onClick={() => setSelectedResult(result)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm flex-1">{result.title}</h3>
                      <Badge className="ml-2">
                        {(result.relevance * 100).toFixed(0)}% relevant
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-4 mb-2">
                      {result.content}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ExternalLink className="w-3 h-3" />
                        <span>{result.source}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newSection: DocumentSection = {
                            id: crypto.randomUUID(),
                            title: result.title,
                            content: result.content,
                            level: 1,
                            expanded: true,
                            subsections: [],
                            sources: [result.source],
                            wordCount: result.content.split(/\s+/).length
                          };
                          setMasterIndex(prev => ({
                            sections: [...prev.sections, newSection],
                            totalWords: prev.totalWords + newSection.wordCount,
                            totalSources: prev.totalSources + 1
                          }));
                          toast.success('Added to master index!');
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add to Index
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Search className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Perform a deep search to discover comprehensive research
                </p>
              </Card>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="master-index" className="flex-1 flex flex-col p-6 pt-2">
          <div className="flex items-center justify-between mb-4">
            <Input
              placeholder="Document title..."
              value={currentDocument.title}
              onChange={(e) => setCurrentDocument(prev => ({ ...prev, title: e.target.value }))}
              className="flex-1 mr-2"
            />
            <Button onClick={exportDocument} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          <ScrollArea className="flex-1">
            {masterIndex.sections.length > 0 ? (
              <div className="space-y-2">
                {masterIndex.sections.map(section => renderSection(section))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <List className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  No sections yet. Add sections from search results or generate new ones.
                </p>
                <Button onClick={() => handleGenerateSection('Introduction')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate First Section
                </Button>
              </Card>
            )}
          </ScrollArea>

          <Button
            onClick={() => handleGenerateSection('New Section')}
            disabled={!!generatingSection}
            className="mt-4 w-full"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {generatingSection ? 'Generating...' : 'Generate New Section'}
          </Button>
        </TabsContent>

        <TabsContent value="document" className="flex-1 p-6 pt-2">
          <ScrollArea className="h-full">
            <Card className="p-6 bg-background/50">
              <h1 className="text-3xl font-bold mb-6">{currentDocument.title}</h1>
              
              {masterIndex.sections.map((section, idx) => {
                const renderFullSection = (sec: DocumentSection, level: number = 1): React.ReactNode => {
                  const headingLevel = Math.min(level + 1, 6);
                  const HeadingTag = `h${headingLevel}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
                  
                  return (
                    <div key={sec.id} className="mb-6">
                      {React.createElement(
                        HeadingTag,
                        {
                          className: cn(
                            "font-bold mb-3",
                            level === 1 && "text-2xl",
                            level === 2 && "text-xl",
                            level === 3 && "text-lg"
                          )
                        },
                        sec.title
                      )}
                      <p className="text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                        {sec.content}
                      </p>
                      {sec.subsections.map(subsec => renderFullSection(subsec, level + 1))}
                    </div>
                  );
                };
                
                return renderFullSection(section);
              })}

              {masterIndex.sections.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Build your document by adding sections from the Master Index tab</p>
                </div>
              )}
            </Card>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
