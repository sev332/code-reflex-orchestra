import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Trash2, Eye } from 'lucide-react';
import { useDocumentManagement, type Document } from '@/hooks/useDocumentManagement';
import { DocumentUploader } from './DocumentUploader';
import { DocumentViewer } from './DocumentViewer';

export const DocumentLibrary = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { getDocuments, deleteDocument } = useDocumentManagement();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    const docs = await getDocuments();
    setDocuments(docs);
    setLoading(false);
  };

  const handleDelete = async (docId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      const success = await deleteDocument(docId);
      if (success) {
        loadDocuments();
        if (selectedDocId === docId) setSelectedDocId(null);
      }
    }
  };

  if (selectedDocId) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setSelectedDocId(null)}>
          ← Back to Library
        </Button>
        <DocumentViewer documentId={selectedDocId} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DocumentUploader onUploadComplete={loadDocuments} />

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Your Documents</h3>
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <FileText className="h-5 w-5 text-primary mt-1" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{doc.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                    <Badge variant="outline" className="mt-2">
                      {doc.processing_status}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedDocId(doc.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
};
