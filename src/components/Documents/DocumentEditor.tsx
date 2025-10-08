import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Wand2, Search, CheckCircle, X, Loader2, FileText } from 'lucide-react';
import { useDocumentEditor, type EditSuggestion } from '@/hooks/useDocumentEditor';
import { type DocumentChunk } from '@/hooks/useDocumentManagement';
import { toast } from 'sonner';

interface DocumentEditorProps {
  documentId: string;
  chunks: DocumentChunk[];
  masterIndex: string | null;
}

export const DocumentEditor = ({ documentId, chunks, masterIndex }: DocumentEditorProps) => {
  const [selectedChunk, setSelectedChunk] = useState<DocumentChunk | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [suggestion, setSuggestion] = useState<EditSuggestion | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [research, setResearch] = useState<string | null>(null);

  const { 
    isAnalyzing, 
    isEditing, 
    isResearching,
    analyzeSection, 
    suggestEdit, 
    deepResearch 
  } = useDocumentEditor();

  const handleSelectText = (chunk: DocumentChunk) => {
    setSelectedChunk(chunk);
    setSelectedText(chunk.content);
    setSuggestion(null);
    setAnalysis(null);
    setResearch(null);
  };

  const handleAnalyze = async () => {
    if (!selectedText) {
      toast.error('Please select a text section first');
      return;
    }

    const result = await analyzeSection(documentId, selectedChunk?.id || null, selectedText);
    if (result) {
      setAnalysis(result);
    }
  };

  const handleSuggestEdit = async () => {
    if (!selectedText || !editPrompt) {
      toast.error('Please select text and provide editing instructions');
      return;
    }

    const result = await suggestEdit(
      documentId,
      selectedChunk?.id || null,
      selectedText,
      selectedChunk?.start_position || 0,
      selectedChunk?.end_position || 0,
      editPrompt
    );

    if (result) {
      setSuggestion(result);
    }
  };

  const handleResearch = async () => {
    if (!selectedText || !editPrompt) {
      toast.error('Please select text and provide research focus');
      return;
    }

    const result = await deepResearch(
      documentId,
      selectedChunk?.id || null,
      selectedText,
      editPrompt
    );

    if (result) {
      setResearch(result);
    }
  };

  const handleAcceptEdit = () => {
    if (suggestion) {
      setSelectedText(suggestion.edited_text);
      toast.success('Edit applied! Remember to save the document.');
      setSuggestion(null);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Document Sections</h3>
        <ScrollArea className="h-[600px]">
          <div className="space-y-2">
            {chunks.map((chunk, index) => (
              <Card
                key={chunk.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedChunk?.id === chunk.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleSelectText(chunk)}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">Chunk {index + 1}</Badge>
                  {chunk.tags && chunk.tags.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {chunk.tags[0]}
                    </Badge>
                  )}
                </div>
                <p className="text-sm line-clamp-3">{chunk.content}</p>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">AI Editor</h3>
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {selectedText ? (
              <>
                <div className="p-4 bg-accent rounded-lg">
                  <p className="text-sm font-medium mb-2">Selected Text</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedText}</p>
                </div>

                <Textarea
                  placeholder="What would you like to do with this section? (e.g., 'Make it more concise', 'Add more detail about X', 'Improve clarity')"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  className="min-h-[100px]"
                />

                <div className="flex gap-2">
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    variant="outline"
                    className="flex-1"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Analyze
                  </Button>
                  <Button
                    onClick={handleSuggestEdit}
                    disabled={isEditing || !editPrompt}
                    className="flex-1"
                  >
                    {isEditing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4 mr-2" />
                    )}
                    Suggest Edit
                  </Button>
                </div>

                <Button
                  onClick={handleResearch}
                  disabled={isResearching || !editPrompt}
                  variant="secondary"
                  className="w-full"
                >
                  {isResearching ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Deep Research
                </Button>

                <Separator />

                {analysis && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Analysis</h4>
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{analysis}</p>
                    </div>
                  </div>
                )}

                {suggestion && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">AI Suggestion</h4>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleAcceptEdit}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setSuggestion(null)}>
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg space-y-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Edited Text:</p>
                        <p className="text-sm whitespace-pre-wrap">{suggestion.edited_text}</p>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Reasoning:</p>
                        <p className="text-xs whitespace-pre-wrap">{suggestion.reasoning}</p>
                      </div>
                      
                      {suggestion.alternatives && suggestion.alternatives.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Alternatives:</p>
                          {suggestion.alternatives.map((alt, i) => (
                            <Badge key={i} variant="outline" className="mr-1 mb-1">
                              {alt}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {research && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Research Findings</h4>
                    <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{research}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Select a document section from the left to start editing with AI assistance
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};
