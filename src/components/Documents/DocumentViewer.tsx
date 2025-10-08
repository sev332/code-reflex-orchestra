import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, FileText, Brain, History, Tag } from 'lucide-react';
import { useDocumentManagement, type Document, type DocumentChunk, type DocumentAnalysis } from '@/hooks/useDocumentManagement';
import { DocumentEditor } from './DocumentEditor';

interface DocumentViewerProps {
  documentId: string;
}

export const DocumentViewer = ({ documentId }: DocumentViewerProps) => {
  const [document, setDocument] = useState<Document | null>(null);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [masterIndex, setMasterIndex] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content');

  const { getDocument, getDocumentChunks, getDocumentAnalysis, getMasterIndex } = useDocumentManagement();

  useEffect(() => {
    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    setLoading(true);
    try {
      const [doc, contentChunks, analysisData, masterIndexData] = await Promise.all([
        getDocument(documentId),
        getDocumentChunks(documentId, 'content'),
        getDocumentAnalysis(documentId),
        getMasterIndex(documentId),
      ]);

      setDocument(doc);
      setChunks(contentChunks);
      setAnalysis(analysisData);
      setMasterIndex(masterIndexData);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'processing': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </Card>
    );
  }

  if (!document) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Document not found</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">{document.title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor(document.processing_status)}>
                {document.processing_status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {new Date(document.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {document.processing_status === 'failed' && document.processing_error && (
          <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
            <p className="text-sm text-destructive">{document.processing_error}</p>
          </div>
        )}
      </Card>

      {document.processing_status === 'completed' && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="content">
              <FileText className="h-4 w-4 mr-2" />
              Content
            </TabsTrigger>
            <TabsTrigger value="analysis">
              <Brain className="h-4 w-4 mr-2" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="editor">
              <History className="h-4 w-4 mr-2" />
              AI Editor
            </TabsTrigger>
            <TabsTrigger value="master">
              <Tag className="h-4 w-4 mr-2" />
              Master Index
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content">
            <Card className="p-6">
              <ScrollArea className="h-[600px]">
                <div className="space-y-6">
                  {chunks.map((chunk, index) => (
                    <div key={chunk.id} className="pb-6 border-b last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">Chunk {index + 1}</Badge>
                        {chunk.tags && chunk.tags.length > 0 && (
                          <div className="flex gap-1">
                            {chunk.tags.slice(0, 3).map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{chunk.content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="analysis">
            <Card className="p-6">
              {analysis ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Master Summary</h3>
                    <p className="text-sm whitespace-pre-wrap">{analysis.master_summary}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Key Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.key_topics.map((topic, i) => (
                        <Badge key={i} variant="secondary">{topic}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-accent rounded-lg">
                      <p className="text-sm font-medium mb-1">Total Chunks</p>
                      <p className="text-2xl font-bold">{analysis.total_chunks}</p>
                    </div>
                    <div className="p-4 bg-accent rounded-lg">
                      <p className="text-sm font-medium mb-1">Hierarchy Levels</p>
                      <p className="text-2xl font-bold">{analysis.hierarchy_levels}</p>
                    </div>
                    <div className="p-4 bg-accent rounded-lg">
                      <p className="text-sm font-medium mb-1">Complexity Score</p>
                      <p className="text-2xl font-bold">{(analysis.complexity_score * 100).toFixed(0)}%</p>
                    </div>
                    <div className="p-4 bg-accent rounded-lg">
                      <p className="text-sm font-medium mb-1">Readability Score</p>
                      <p className="text-2xl font-bold">{(analysis.readability_score * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Analysis not available</p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="editor">
            <DocumentEditor documentId={documentId} chunks={chunks} masterIndex={masterIndex} />
          </TabsContent>

          <TabsContent value="master">
            <Card className="p-6">
              <ScrollArea className="h-[600px]">
                {masterIndex ? (
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap">{masterIndex}</pre>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Master index not available</p>
                )}
              </ScrollArea>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
