-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'application/msword', 'text/plain', 'text/markdown', 'image/jpeg', 'image/png', 
        'image/webp', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
);

-- RLS policies for documents bucket
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create documents metadata table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_type TEXT NOT NULL DEFAULT 'supabase', -- 'supabase' or 'google_cloud'
  google_cloud_path TEXT,
  processing_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  processing_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents metadata"
ON public.documents FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents metadata"
ON public.documents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents metadata"
ON public.documents FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents metadata"
ON public.documents FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create document chunks table for hierarchical storage
CREATE TABLE public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  chunk_type TEXT NOT NULL DEFAULT 'content', -- 'content', 'summary_l1', 'summary_l2', 'summary_l3', 'master_index'
  parent_chunk_id UUID REFERENCES public.document_chunks(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}'::jsonb,
  start_position INTEGER,
  end_position INTEGER,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chunks of their documents"
ON public.document_chunks FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.documents
  WHERE documents.id = document_chunks.document_id
  AND documents.user_id = auth.uid()
));

CREATE POLICY "System can insert chunks"
ON public.document_chunks FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.documents
  WHERE documents.id = document_chunks.document_id
  AND documents.user_id = auth.uid()
));

-- Create document analysis table
CREATE TABLE public.document_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL UNIQUE,
  master_summary TEXT,
  key_topics TEXT[] DEFAULT '{}',
  entities JSONB DEFAULT '[]'::jsonb,
  structure JSONB DEFAULT '{}'::jsonb,
  complexity_score NUMERIC,
  readability_score NUMERIC,
  total_chunks INTEGER NOT NULL DEFAULT 0,
  hierarchy_levels INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.document_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analysis of their documents"
ON public.document_analysis FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.documents
  WHERE documents.id = document_analysis.document_id
  AND documents.user_id = auth.uid()
));

-- Create document edit history table for traceability
CREATE TABLE public.document_edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  chunk_id UUID REFERENCES public.document_chunks(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  edit_type TEXT NOT NULL, -- 'manual', 'ai_assisted', 'ai_generated'
  original_content TEXT,
  new_content TEXT NOT NULL,
  edit_prompt TEXT,
  ai_reasoning TEXT,
  start_position INTEGER,
  end_position INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.document_edit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view edit history of their documents"
ON public.document_edit_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert edit history"
ON public.document_edit_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_processing_status ON public.documents(processing_status);
CREATE INDEX idx_document_chunks_document_id ON public.document_chunks(document_id);
CREATE INDEX idx_document_chunks_type ON public.document_chunks(chunk_type);
CREATE INDEX idx_document_chunks_parent ON public.document_chunks(parent_chunk_id);
CREATE INDEX idx_document_analysis_document_id ON public.document_analysis(document_id);
CREATE INDEX idx_document_edit_history_document_id ON public.document_edit_history(document_id);
CREATE INDEX idx_document_edit_history_user_id ON public.document_edit_history(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_analysis_updated_at
BEFORE UPDATE ON public.document_analysis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();