import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Document {
  id: string;
  title: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  storage_type: 'supabase' | 'google_cloud';
  google_cloud_path?: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_error?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  chunk_type: 'content' | 'summary_l1' | 'summary_l2' | 'summary_l3' | 'master_index';
  parent_chunk_id?: string;
  metadata: any;
  start_position?: number;
  end_position?: number;
  tags: string[];
  created_at: string;
}

export interface DocumentAnalysis {
  id: string;
  document_id: string;
  master_summary: string;
  key_topics: string[];
  entities: any[];
  structure: any;
  complexity_score: number;
  readability_score: number;
  total_chunks: number;
  hierarchy_levels: number;
  created_at: string;
  updated_at: string;
}

export const useDocumentManagement = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadDocument = async (
    file: File,
    storageType: 'supabase' | 'google_cloud' = 'supabase'
  ): Promise<string | null> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${user.id}/${fileName}`;

      let documentPath = filePath;
      let googleCloudPath: string | undefined;

      if (storageType === 'google_cloud') {
        // Upload to Google Cloud Storage
        try {
          // Note: This requires Google Cloud credentials to be configured
          // For now, we'll fall back to Supabase storage
          console.log('Google Cloud Storage not yet configured, using Supabase');
          storageType = 'supabase';
        } catch (error) {
          console.error('Google Cloud upload failed, falling back to Supabase:', error);
          storageType = 'supabase';
        }
      }

      if (storageType === 'supabase') {
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        setUploadProgress(100);
      }

      // Create document metadata record
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          title: file.name,
          file_name: file.name,
          file_path: documentPath,
          file_size: file.size,
          mime_type: file.type,
          storage_type: storageType,
          google_cloud_path: googleCloudPath,
          processing_status: 'pending',
        })
        .select()
        .single();

      if (docError) throw docError;

      toast.success('Document uploaded successfully!');
      
      // Trigger processing
      processDocument(docData.id);

      return docData.id;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message}`);
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const processDocument = async (documentId: string) => {
    setIsProcessing(true);
    try {
      toast.info('Processing document... This may take a few minutes.');

      const { error } = await supabase.functions.invoke('document-processor', {
        body: { documentId },
      });

      if (error) throw error;

      toast.success('Document processed successfully!');
    } catch (error: any) {
      console.error('Processing error:', error);
      toast.error(`Processing failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getDocument = async (documentId: string): Promise<Document | null> => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) throw error;
      return data as any;
    } catch (error: any) {
      console.error('Get document error:', error);
      return null;
    }
  };

  const getDocuments = async (): Promise<Document[]> => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as any;
    } catch (error: any) {
      console.error('Get documents error:', error);
      return [];
    }
  };

  const getDocumentChunks = async (
    documentId: string,
    chunkType?: string
  ): Promise<DocumentChunk[]> => {
    try {
      let query = supabase
        .from('document_chunks')
        .select('*')
        .eq('document_id', documentId);

      if (chunkType) {
        query = query.eq('chunk_type', chunkType);
      }

      const { data, error } = await query.order('chunk_index');

      if (error) throw error;
      return (data || []) as any;
    } catch (error: any) {
      console.error('Get chunks error:', error);
      return [];
    }
  };

  const getDocumentAnalysis = async (
    documentId: string
  ): Promise<DocumentAnalysis | null> => {
    try {
      const { data, error } = await supabase
        .from('document_analysis')
        .select('*')
        .eq('document_id', documentId)
        .single();

      if (error) throw error;
      return data as any;
    } catch (error: any) {
      console.error('Get analysis error:', error);
      return null;
    }
  };

  const getMasterIndex = async (documentId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('document_chunks')
        .select('content')
        .eq('document_id', documentId)
        .eq('chunk_type', 'master_index')
        .single();

      if (error) throw error;
      return data?.content || null;
    } catch (error: any) {
      console.error('Get master index error:', error);
      return null;
    }
  };

  const deleteDocument = async (documentId: string): Promise<boolean> => {
    try {
      // Get document info
      const doc = await getDocument(documentId);
      if (!doc) throw new Error('Document not found');

      // Delete from storage
      if (doc.storage_type === 'supabase') {
        await supabase.storage
          .from('documents')
          .remove([doc.file_path]);
      }

      // Delete from database (cascades to chunks, analysis, history)
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      toast.success('Document deleted successfully');
      return true;
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(`Delete failed: ${error.message}`);
      return false;
    }
  };

  return {
    isUploading,
    isProcessing,
    uploadProgress,
    uploadDocument,
    processDocument,
    getDocument,
    getDocuments,
    getDocumentChunks,
    getDocumentAnalysis,
    getMasterIndex,
    deleteDocument,
  };
};
