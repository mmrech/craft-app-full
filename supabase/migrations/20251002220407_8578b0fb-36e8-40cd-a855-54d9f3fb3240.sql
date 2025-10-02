-- Add page_image column to pdf_extractions table to store base64 encoded page images for AI vision processing
ALTER TABLE public.pdf_extractions 
ADD COLUMN page_image TEXT;