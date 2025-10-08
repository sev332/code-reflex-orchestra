import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Image, X } from 'lucide-react';
import { useDocumentManagement } from '@/hooks/useDocumentManagement';
import { toast } from 'sonner';

export const DocumentUploader = ({ onUploadComplete }: { onUploadComplete?: (documentId: string) => void }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isUploading, uploadProgress, uploadDocument } = useDocumentManagement();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    for (const file of selectedFiles) {
      const documentId = await uploadDocument(file, 'supabase');
      if (documentId && onUploadComplete) {
        onUploadComplete(documentId);
      }
    }

    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Upload Documents</h3>
        <p className="text-sm text-muted-foreground">
          Upload PDFs, Word documents, images, or text files for AI-powered analysis
        </p>
      </div>

      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.md,.jpg,.jpeg,.png,.webp,.xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
          <p className="text-xs text-muted-foreground">
            PDF, DOC, DOCX, TXT, MD, JPG, PNG, WEBP, XLSX (max 50MB)
          </p>
        </label>
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Files</h4>
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-accent rounded-lg">
              {getFileIcon(file.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
              <Badge variant="outline">{file.type.split('/')[1]?.toUpperCase() || 'FILE'}</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} />
          <p className="text-xs text-center text-muted-foreground">
            Uploading... {uploadProgress.toFixed(0)}%
          </p>
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={selectedFiles.length === 0 || isUploading}
        className="w-full"
      >
        {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`}
      </Button>
    </Card>
  );
};
