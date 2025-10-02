import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ExtractionStatistics {
  total_documents: number;
  total_extractions: number;
  ai_extractions: number;
  manual_extractions: number;
  avg_extractions_per_document: number;
  completed_documents: number;
  in_progress_documents: number;
}

interface RecentDocument {
  document_id: string;
  document_name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  total_pages: number;
  completion_percentage: number;
  total_extractions: number;
  steps_completed: number;
  manual_extractions: number;
  ai_extractions: number;
  last_extraction_date: string;
}

export const useDashboardStatistics = (userId?: string) => {
  return useQuery({
    queryKey: ["dashboard-statistics", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_extraction_statistics", {
        p_user_id: userId || null,
        p_start_date: null,
        p_end_date: null,
      });

      if (error) throw error;
      return data[0] as ExtractionStatistics;
    },
    enabled: !!userId,
  });
};

export const useRecentDocuments = (userId?: string, limit: number = 10) => {
  return useQuery({
    queryKey: ["recent-documents", userId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("extraction_summary_view")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as RecentDocument[];
    },
    enabled: !!userId,
  });
};

export const useExtractionTrends = (
  userId?: string,
  period: "daily" | "weekly" | "monthly" = "daily",
  days: number = 30
) => {
  return useQuery({
    queryKey: ["extraction-trends", userId, period, days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_extraction_trends", {
        p_user_id: userId || null,
        p_period: period,
        p_days: days,
      });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};
