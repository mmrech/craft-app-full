-- Create pdf_annotations table for storing Fabric.js annotations
CREATE TABLE IF NOT EXISTS public.pdf_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  annotation_type TEXT NOT NULL CHECK (annotation_type IN ('highlight', 'pen', 'shape', 'text', 'ai-extraction')),
  fabric_data JSONB NOT NULL,
  extraction_id UUID REFERENCES public.clinical_extractions(id) ON DELETE SET NULL,
  color TEXT DEFAULT '#FFEB3B',
  notes TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_pdf_annotations_document_page ON public.pdf_annotations(document_id, page_number);
CREATE INDEX IF NOT EXISTS idx_pdf_annotations_user ON public.pdf_annotations(user_id);

-- Enable RLS
ALTER TABLE public.pdf_annotations ENABLE ROW LEVEL SECURITY;

-- Users can view annotations for their documents
CREATE POLICY "Users can view annotations for their documents"
  ON public.pdf_annotations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = pdf_annotations.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- Users can insert annotations for their documents
CREATE POLICY "Users can insert annotations for their documents"
  ON public.pdf_annotations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents
      WHERE documents.id = pdf_annotations.document_id
      AND documents.user_id = auth.uid()
    )
    AND auth.uid() = user_id
  );

-- Users can update their own annotations
CREATE POLICY "Users can update their own annotations"
  ON public.pdf_annotations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own annotations
CREATE POLICY "Users can delete their own annotations"
  ON public.pdf_annotations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_pdf_annotations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_pdf_annotations_updated_at
  BEFORE UPDATE ON public.pdf_annotations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pdf_annotations_updated_at();