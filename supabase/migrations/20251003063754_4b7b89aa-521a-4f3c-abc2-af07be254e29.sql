-- Phase 1: Critical Security Fixes (Revised)

-- 1. LOCK DOWN STORAGE BUCKET: Remove public policies and add user-scoped policies
-- Drop any existing public policies on pdf_documents bucket
DROP POLICY IF EXISTS "Public access to pdf_documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to pdf_documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete from pdf_documents" ON storage.objects;

-- Create secure storage policies for pdf_documents bucket
-- Users can only view their own documents (files stored in user_id/ folder)
CREATE POLICY "Users can view their own PDF documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'pdf_documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can only upload to their own folder
CREATE POLICY "Users can upload their own PDF documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pdf_documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can only delete their own documents
CREATE POLICY "Users can delete their own PDF documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'pdf_documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can view all documents
CREATE POLICY "Admins can view all PDF documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'pdf_documents' 
  AND has_role(auth.uid(), 'admin')
);

-- Admins can delete all documents
CREATE POLICY "Admins can delete all PDF documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'pdf_documents' 
  AND has_role(auth.uid(), 'admin')
);

-- 2. PROTECT USER PII VIEW: Create security definer function for user_activity_view access
-- Drop and recreate the view with security_invoker option
DROP VIEW IF EXISTS user_activity_view;

CREATE OR REPLACE VIEW user_activity_view
WITH (security_invoker = on)
AS
SELECT 
  p.id as user_id,
  p.email,
  p.full_name,
  COUNT(DISTINCT d.id) as total_documents,
  COUNT(DISTINCT ce.id) as total_extractions,
  COUNT(DISTINCT CASE WHEN ce.method = 'ai' THEN ce.id END) as ai_extractions,
  COUNT(DISTINCT CASE WHEN ce.method = 'manual' THEN ce.id END) as manual_extractions,
  MIN(d.created_at) as first_activity_date,
  MAX(ce.created_at) as last_extraction_date,
  MAX(d.created_at) as last_document_upload
FROM profiles p
LEFT JOIN documents d ON p.id = d.user_id
LEFT JOIN clinical_extractions ce ON d.id = ce.document_id
WHERE p.id = auth.uid() OR has_role(auth.uid(), 'admin')
GROUP BY p.id, p.email, p.full_name;