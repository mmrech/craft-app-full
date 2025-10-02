-- Create table to cache PDF text extractions
CREATE TABLE public.pdf_extractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  text_items JSONB NOT NULL,
  full_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(document_id, page_number)
);

-- Enable RLS
ALTER TABLE public.pdf_extractions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view extractions"
  ON public.pdf_extractions
  FOR SELECT
  USING (true);

CREATE POLICY "Public can insert extractions"
  ON public.pdf_extractions
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_pdf_extractions_document_page ON public.pdf_extractions(document_id, page_number);