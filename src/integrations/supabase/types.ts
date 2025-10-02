export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      clinical_extractions: {
        Row: {
          coordinates: Json
          created_at: string
          document_id: string
          extracted_text: string
          field_name: string
          id: string
          method: string
          page_number: number
          step_number: number
          user_id: string | null
        }
        Insert: {
          coordinates: Json
          created_at?: string
          document_id: string
          extracted_text: string
          field_name: string
          id?: string
          method?: string
          page_number: number
          step_number: number
          user_id?: string | null
        }
        Update: {
          coordinates?: Json
          created_at?: string
          document_id?: string
          extracted_text?: string
          field_name?: string
          id?: string
          method?: string
          page_number?: number
          step_number?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_extractions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_quality_view"
            referencedColumns: ["document_id"]
          },
          {
            foreignKeyName: "clinical_extractions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_extractions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "extraction_summary_view"
            referencedColumns: ["document_id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          file_size: number | null
          id: string
          name: string
          storage_path: string
          total_pages: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_size?: number | null
          id?: string
          name: string
          storage_path: string
          total_pages?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_size?: number | null
          id?: string
          name?: string
          storage_path?: string
          total_pages?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pdf_extractions: {
        Row: {
          created_at: string
          document_id: string
          full_text: string
          id: string
          page_number: number
          text_items: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          document_id: string
          full_text: string
          id?: string
          page_number: number
          text_items: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string
          full_text?: string
          id?: string
          page_number?: number
          text_items?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdf_extractions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_quality_view"
            referencedColumns: ["document_id"]
          },
          {
            foreignKeyName: "pdf_extractions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdf_extractions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "extraction_summary_view"
            referencedColumns: ["document_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      document_quality_view: {
        Row: {
          document_id: string | null
          document_name: string | null
          extraction_density: number | null
          file_size: number | null
          page_coverage_percentage: number | null
          pages_with_extractions: number | null
          total_extractions: number | null
          total_pages: number | null
          unique_fields_extracted: number | null
          user_id: string | null
        }
        Relationships: []
      }
      extraction_summary_view: {
        Row: {
          ai_extractions: number | null
          completion_percentage: number | null
          created_at: string | null
          document_id: string | null
          document_name: string | null
          last_extraction_date: string | null
          manual_extractions: number | null
          steps_completed: number | null
          total_extractions: number | null
          total_pages: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      field_analytics_view: {
        Row: {
          ai_count: number | null
          avg_text_length: number | null
          document_count: number | null
          extraction_count: number | null
          field_name: string | null
          first_extracted: string | null
          last_extracted: string | null
          manual_count: number | null
          step_number: number | null
        }
        Relationships: []
      }
      user_activity_view: {
        Row: {
          ai_extractions: number | null
          email: string | null
          first_activity_date: string | null
          full_name: string | null
          last_document_upload: string | null
          last_extraction_date: string | null
          manual_extractions: number | null
          total_documents: number | null
          total_extractions: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_document_progress: {
        Args: { p_document_id: string }
        Returns: {
          completed_steps: number
          completion_percentage: number
          document_id: string
          document_name: string
          step_details: Json
          total_steps: number
        }[]
      }
      get_extraction_statistics: {
        Args: { p_end_date?: string; p_start_date?: string; p_user_id?: string }
        Returns: {
          ai_extractions: number
          avg_extractions_per_document: number
          completed_documents: number
          in_progress_documents: number
          manual_extractions: number
          total_documents: number
          total_extractions: number
        }[]
      }
      get_extraction_trends: {
        Args: { p_days?: number; p_period?: string; p_user_id?: string }
        Returns: {
          ai_extraction_count: number
          document_count: number
          extraction_count: number
          manual_extraction_count: number
          period_date: string
        }[]
      }
      get_user_dashboard_data: {
        Args: { p_user_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      search_extractions: {
        Args: {
          p_limit?: number
          p_method?: string
          p_search_term: string
          p_step_number?: number
          p_user_id?: string
        }
        Returns: {
          created_at: string
          document_id: string
          document_name: string
          extracted_text: string
          extraction_id: string
          field_name: string
          method: string
          page_number: number
          relevance: number
          step_number: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
