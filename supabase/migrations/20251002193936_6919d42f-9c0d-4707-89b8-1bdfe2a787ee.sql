-- Phase 1: Advanced Query Infrastructure
-- Create views, functions, and indexes for advanced querying

-- ============================================
-- 1. DATABASE VIEWS
-- ============================================

-- View: Extraction Summary per Document
CREATE OR REPLACE VIEW extraction_summary_view AS
SELECT 
  d.id as document_id,
  d.name as document_name,
  d.user_id,
  d.created_at,
  d.updated_at,
  d.total_pages,
  COUNT(DISTINCT ce.id) as total_extractions,
  COUNT(DISTINCT ce.step_number) as steps_completed,
  COUNT(DISTINCT CASE WHEN ce.method = 'ai' THEN ce.id END) as ai_extractions,
  COUNT(DISTINCT CASE WHEN ce.method = 'manual' THEN ce.id END) as manual_extractions,
  MAX(ce.created_at) as last_extraction_date,
  ROUND((COUNT(DISTINCT ce.step_number)::numeric / 8) * 100, 2) as completion_percentage
FROM documents d
LEFT JOIN clinical_extractions ce ON d.id = ce.document_id
GROUP BY d.id, d.name, d.user_id, d.created_at, d.updated_at, d.total_pages;

-- View: User Activity Analytics
CREATE OR REPLACE VIEW user_activity_view AS
SELECT 
  p.id as user_id,
  p.email,
  p.full_name,
  COUNT(DISTINCT d.id) as total_documents,
  COUNT(DISTINCT ce.id) as total_extractions,
  COUNT(DISTINCT CASE WHEN ce.method = 'ai' THEN ce.id END) as ai_extractions,
  COUNT(DISTINCT CASE WHEN ce.method = 'manual' THEN ce.id END) as manual_extractions,
  MAX(d.created_at) as last_document_upload,
  MAX(ce.created_at) as last_extraction_date,
  MIN(d.created_at) as first_activity_date
FROM profiles p
LEFT JOIN documents d ON p.id = d.user_id
LEFT JOIN clinical_extractions ce ON d.id = ce.document_id
GROUP BY p.id, p.email, p.full_name;

-- View: Field Analytics
CREATE OR REPLACE VIEW field_analytics_view AS
SELECT 
  ce.field_name,
  ce.step_number,
  COUNT(DISTINCT ce.id) as extraction_count,
  COUNT(DISTINCT ce.document_id) as document_count,
  COUNT(DISTINCT CASE WHEN ce.method = 'ai' THEN ce.id END) as ai_count,
  COUNT(DISTINCT CASE WHEN ce.method = 'manual' THEN ce.id END) as manual_count,
  AVG(LENGTH(ce.extracted_text)) as avg_text_length,
  MIN(ce.created_at) as first_extracted,
  MAX(ce.created_at) as last_extracted
FROM clinical_extractions ce
GROUP BY ce.field_name, ce.step_number;

-- View: Document Quality Metrics
CREATE OR REPLACE VIEW document_quality_view AS
SELECT 
  d.id as document_id,
  d.name as document_name,
  d.user_id,
  d.total_pages,
  d.file_size,
  COUNT(DISTINCT ce.id) as total_extractions,
  COUNT(DISTINCT ce.field_name) as unique_fields_extracted,
  COUNT(DISTINCT ce.page_number) as pages_with_extractions,
  ROUND((COUNT(DISTINCT ce.page_number)::numeric / NULLIF(d.total_pages, 0)) * 100, 2) as page_coverage_percentage,
  ROUND(COUNT(DISTINCT ce.id)::numeric / NULLIF(d.total_pages, 0), 2) as extraction_density
FROM documents d
LEFT JOIN clinical_extractions ce ON d.id = ce.document_id
GROUP BY d.id, d.name, d.user_id, d.total_pages, d.file_size;

-- ============================================
-- 2. DATABASE FUNCTIONS
-- ============================================

-- Function: Get Extraction Statistics
CREATE OR REPLACE FUNCTION get_extraction_statistics(
  p_user_id uuid DEFAULT NULL,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE (
  total_documents bigint,
  total_extractions bigint,
  ai_extractions bigint,
  manual_extractions bigint,
  avg_extractions_per_document numeric,
  completed_documents bigint,
  in_progress_documents bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT d.id)::bigint as total_documents,
    COUNT(DISTINCT ce.id)::bigint as total_extractions,
    COUNT(DISTINCT CASE WHEN ce.method = 'ai' THEN ce.id END)::bigint as ai_extractions,
    COUNT(DISTINCT CASE WHEN ce.method = 'manual' THEN ce.id END)::bigint as manual_extractions,
    ROUND(COUNT(DISTINCT ce.id)::numeric / NULLIF(COUNT(DISTINCT d.id), 0), 2) as avg_extractions_per_document,
    COUNT(DISTINCT CASE WHEN esv.completion_percentage = 100 THEN d.id END)::bigint as completed_documents,
    COUNT(DISTINCT CASE WHEN esv.completion_percentage > 0 AND esv.completion_percentage < 100 THEN d.id END)::bigint as in_progress_documents
  FROM documents d
  LEFT JOIN clinical_extractions ce ON d.id = ce.document_id
  LEFT JOIN extraction_summary_view esv ON d.id = esv.document_id
  WHERE 
    (p_user_id IS NULL OR d.user_id = p_user_id)
    AND (p_start_date IS NULL OR d.created_at >= p_start_date)
    AND (p_end_date IS NULL OR d.created_at <= p_end_date);
END;
$$;

-- Function: Get Document Progress
CREATE OR REPLACE FUNCTION get_document_progress(p_document_id uuid)
RETURNS TABLE (
  document_id uuid,
  document_name text,
  total_steps integer,
  completed_steps bigint,
  completion_percentage numeric,
  step_details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id as document_id,
    d.name as document_name,
    8 as total_steps,
    COUNT(DISTINCT ce.step_number) as completed_steps,
    ROUND((COUNT(DISTINCT ce.step_number)::numeric / 8) * 100, 2) as completion_percentage,
    jsonb_agg(
      jsonb_build_object(
        'step', ce.step_number,
        'field_count', COUNT(ce.id),
        'last_updated', MAX(ce.created_at)
      ) ORDER BY ce.step_number
    ) as step_details
  FROM documents d
  LEFT JOIN clinical_extractions ce ON d.id = ce.document_id
  WHERE d.id = p_document_id
  GROUP BY d.id, d.name;
END;
$$;

-- Function: Search Extractions with Full-Text
CREATE OR REPLACE FUNCTION search_extractions(
  p_search_term text,
  p_user_id uuid DEFAULT NULL,
  p_step_number integer DEFAULT NULL,
  p_method text DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  extraction_id uuid,
  document_id uuid,
  document_name text,
  field_name text,
  extracted_text text,
  page_number integer,
  step_number integer,
  method text,
  created_at timestamptz,
  relevance real
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ce.id as extraction_id,
    d.id as document_id,
    d.name as document_name,
    ce.field_name,
    ce.extracted_text,
    ce.page_number,
    ce.step_number,
    ce.method,
    ce.created_at,
    similarity(ce.extracted_text, p_search_term) as relevance
  FROM clinical_extractions ce
  JOIN documents d ON ce.document_id = d.id
  WHERE 
    (p_search_term IS NULL OR ce.extracted_text ILIKE '%' || p_search_term || '%')
    AND (p_user_id IS NULL OR d.user_id = p_user_id)
    AND (p_step_number IS NULL OR ce.step_number = p_step_number)
    AND (p_method IS NULL OR ce.method = p_method)
  ORDER BY 
    CASE WHEN p_search_term IS NOT NULL 
      THEN similarity(ce.extracted_text, p_search_term) 
      ELSE 0 
    END DESC,
    ce.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Function: Get User Dashboard Data
CREATE OR REPLACE FUNCTION get_user_dashboard_data(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'user_info', (
      SELECT jsonb_build_object(
        'email', email,
        'full_name', full_name,
        'created_at', created_at
      )
      FROM profiles WHERE id = p_user_id
    ),
    'statistics', (
      SELECT jsonb_build_object(
        'total_documents', total_documents,
        'total_extractions', total_extractions,
        'ai_extractions', ai_extractions,
        'manual_extractions', manual_extractions,
        'avg_extractions_per_document', avg_extractions_per_document,
        'completed_documents', completed_documents,
        'in_progress_documents', in_progress_documents
      )
      FROM get_extraction_statistics(p_user_id, NULL, NULL)
    ),
    'recent_documents', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'name', name,
          'created_at', created_at,
          'total_pages', total_pages,
          'completion_percentage', completion_percentage
        ) ORDER BY created_at DESC
      )
      FROM extraction_summary_view
      WHERE user_id = p_user_id
      LIMIT 10
    ),
    'field_analytics', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'field_name', field_name,
          'step_number', step_number,
          'extraction_count', extraction_count
        ) ORDER BY extraction_count DESC
      )
      FROM field_analytics_view
      LIMIT 20
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Function: Get Extraction Trends
CREATE OR REPLACE FUNCTION get_extraction_trends(
  p_user_id uuid DEFAULT NULL,
  p_period text DEFAULT 'daily',
  p_days integer DEFAULT 30
)
RETURNS TABLE (
  period_date date,
  document_count bigint,
  extraction_count bigint,
  ai_extraction_count bigint,
  manual_extraction_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(ce.created_at) as period_date,
    COUNT(DISTINCT ce.document_id) as document_count,
    COUNT(ce.id) as extraction_count,
    COUNT(CASE WHEN ce.method = 'ai' THEN 1 END) as ai_extraction_count,
    COUNT(CASE WHEN ce.method = 'manual' THEN 1 END) as manual_extraction_count
  FROM clinical_extractions ce
  JOIN documents d ON ce.document_id = d.id
  WHERE 
    (p_user_id IS NULL OR d.user_id = p_user_id)
    AND ce.created_at >= CURRENT_DATE - (p_days || ' days')::interval
  GROUP BY DATE(ce.created_at)
  ORDER BY period_date DESC;
END;
$$;

-- ============================================
-- 3. PERFORMANCE INDEXES
-- ============================================

-- Composite index for document extractions lookup
CREATE INDEX IF NOT EXISTS idx_clinical_extractions_document_step_field 
ON clinical_extractions(document_id, step_number, field_name);

-- Index for user document listing with sorting
CREATE INDEX IF NOT EXISTS idx_documents_user_created 
ON documents(user_id, created_at DESC);

-- Index for time-based extraction queries
CREATE INDEX IF NOT EXISTS idx_clinical_extractions_created 
ON clinical_extractions(created_at DESC);

-- Index for extraction method filtering
CREATE INDEX IF NOT EXISTS idx_clinical_extractions_method 
ON clinical_extractions(method);

-- Index for page-based queries
CREATE INDEX IF NOT EXISTS idx_clinical_extractions_page 
ON clinical_extractions(document_id, page_number);

-- Index for step-based queries
CREATE INDEX IF NOT EXISTS idx_clinical_extractions_step 
ON clinical_extractions(step_number);

-- Index for PDF extractions lookup
CREATE INDEX IF NOT EXISTS idx_pdf_extractions_document_page 
ON pdf_extractions(document_id, page_number);

-- Partial index for AI extractions
CREATE INDEX IF NOT EXISTS idx_clinical_extractions_ai 
ON clinical_extractions(document_id, created_at) 
WHERE method = 'ai';

-- GIN index for JSONB coordinates (for spatial queries if needed)
CREATE INDEX IF NOT EXISTS idx_clinical_extractions_coordinates 
ON clinical_extractions USING GIN(coordinates);

-- Text search optimization (preparing for full-text search)
CREATE INDEX IF NOT EXISTS idx_clinical_extractions_text_search 
ON clinical_extractions USING GIN(to_tsvector('english', extracted_text));