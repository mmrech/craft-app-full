-- Fix security definer views by enabling security_invoker mode
-- This ensures views respect RLS policies of the querying user

ALTER VIEW extraction_summary_view SET (security_invoker = on);
ALTER VIEW user_activity_view SET (security_invoker = on);
ALTER VIEW field_analytics_view SET (security_invoker = on);
ALTER VIEW document_quality_view SET (security_invoker = on);