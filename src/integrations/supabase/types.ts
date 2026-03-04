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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      crm_activities: {
        Row: {
          activity_type: string
          body: string | null
          company_id: string | null
          completed: boolean
          completed_at: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          crelate_id: string | null
          direction: string | null
          duration_minutes: number | null
          email_conversation_id: string | null
          id: string
          is_pinned: boolean
          job_id: string | null
          location: string | null
          parent_activity_id: string | null
          pipeline_item_id: string | null
          scheduled_at: string | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          activity_type: string
          body?: string | null
          company_id?: string | null
          completed?: boolean
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          crelate_id?: string | null
          direction?: string | null
          duration_minutes?: number | null
          email_conversation_id?: string | null
          id?: string
          is_pinned?: boolean
          job_id?: string | null
          location?: string | null
          parent_activity_id?: string | null
          pipeline_item_id?: string | null
          scheduled_at?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          activity_type?: string
          body?: string | null
          company_id?: string | null
          completed?: boolean
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          crelate_id?: string | null
          direction?: string | null
          duration_minutes?: number | null
          email_conversation_id?: string | null
          id?: string
          is_pinned?: boolean
          job_id?: string | null
          location?: string | null
          parent_activity_id?: string | null
          pipeline_item_id?: string | null
          scheduled_at?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "crm_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_parent_activity_id_fkey"
            columns: ["parent_activity_id"]
            isOneToOne: false
            referencedRelation: "crm_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_pipeline_item_id_fkey"
            columns: ["pipeline_item_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_items"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_addresses: {
        Row: {
          category: string
          city: string | null
          company_id: string | null
          contact_id: string | null
          country: string | null
          created_at: string | null
          crelate_id: string | null
          id: string
          is_primary: boolean
          line1: string | null
          line2: string | null
          location: string | null
          state: string | null
          zip_code: string | null
        }
        Insert: {
          category?: string
          city?: string | null
          company_id?: string | null
          contact_id?: string | null
          country?: string | null
          created_at?: string | null
          crelate_id?: string | null
          id?: string
          is_primary?: boolean
          line1?: string | null
          line2?: string | null
          location?: string | null
          state?: string | null
          zip_code?: string | null
        }
        Update: {
          category?: string
          city?: string | null
          company_id?: string | null
          contact_id?: string | null
          country?: string | null
          created_at?: string | null
          crelate_id?: string | null
          id?: string
          is_primary?: boolean
          line1?: string | null
          line2?: string | null
          location?: string | null
          state?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_addresses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_addresses_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_career_history: {
        Row: {
          company_id: string | null
          company_name: string | null
          contact_id: string
          created_at: string | null
          crelate_id: string | null
          degree: string | null
          description: string | null
          ended_at: string | null
          entry_type: string
          id: string
          institution: string | null
          is_current: boolean
          job_title: string | null
          started_at: string | null
        }
        Insert: {
          company_id?: string | null
          company_name?: string | null
          contact_id: string
          created_at?: string | null
          crelate_id?: string | null
          degree?: string | null
          description?: string | null
          ended_at?: string | null
          entry_type?: string
          id?: string
          institution?: string | null
          is_current?: boolean
          job_title?: string | null
          started_at?: string | null
        }
        Update: {
          company_id?: string | null
          company_name?: string | null
          contact_id?: string
          created_at?: string | null
          crelate_id?: string | null
          degree?: string | null
          description?: string | null
          ended_at?: string | null
          entry_type?: string
          id?: string
          institution?: string | null
          is_current?: boolean
          job_title?: string | null
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_career_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_career_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_companies: {
        Row: {
          company_type: string
          created_at: string | null
          created_by: string | null
          crelate_id: string | null
          description: string | null
          domain: string | null
          icon_attachment_url: string | null
          id: string
          last_activity_date: string | null
          last_engagement_date: string | null
          name: string
          parent_company_id: string | null
          primary_owner_id: string | null
          revenue: number | null
          source_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          company_type?: string
          created_at?: string | null
          created_by?: string | null
          crelate_id?: string | null
          description?: string | null
          domain?: string | null
          icon_attachment_url?: string | null
          id?: string
          last_activity_date?: string | null
          last_engagement_date?: string | null
          name: string
          parent_company_id?: string | null
          primary_owner_id?: string | null
          revenue?: number | null
          source_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          company_type?: string
          created_at?: string | null
          created_by?: string | null
          crelate_id?: string | null
          description?: string | null
          domain?: string | null
          icon_attachment_url?: string | null
          id?: string
          last_activity_date?: string | null
          last_engagement_date?: string | null
          name?: string
          parent_company_id?: string | null
          primary_owner_id?: string | null
          revenue?: number | null
          source_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_companies_parent_company_id_fkey"
            columns: ["parent_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_companies_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "crm_contact_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contact_emails: {
        Row: {
          category: string
          contact_id: string
          created_at: string | null
          crelate_id: string | null
          id: string
          is_invalid: boolean
          is_primary: boolean
          value: string
        }
        Insert: {
          category?: string
          contact_id: string
          created_at?: string | null
          crelate_id?: string | null
          id?: string
          is_invalid?: boolean
          is_primary?: boolean
          value: string
        }
        Update: {
          category?: string
          contact_id?: string
          created_at?: string | null
          crelate_id?: string | null
          id?: string
          is_invalid?: boolean
          is_primary?: boolean
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contact_emails_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contact_phones: {
        Row: {
          category: string
          contact_id: string
          created_at: string | null
          crelate_id: string | null
          extension: string | null
          id: string
          is_primary: boolean
          value: string
        }
        Insert: {
          category?: string
          contact_id: string
          created_at?: string | null
          crelate_id?: string | null
          extension?: string | null
          id?: string
          is_primary?: boolean
          value: string
        }
        Update: {
          category?: string
          contact_id?: string
          created_at?: string | null
          crelate_id?: string | null
          extension?: string | null
          id?: string
          is_primary?: boolean
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contact_phones_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contact_sources: {
        Row: {
          created_at: string | null
          crelate_id: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          crelate_id?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          crelate_id?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      crm_contact_tags: {
        Row: {
          contact_id: string
          created_at: string | null
          crelate_id: string | null
          id: string
          tag_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          crelate_id?: string | null
          id?: string
          tag_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          crelate_id?: string | null
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contact_tags_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contact_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "crm_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contact_urls: {
        Row: {
          category: string
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          crelate_id: string | null
          id: string
          is_primary: boolean
          value: string
        }
        Insert: {
          category?: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          crelate_id?: string | null
          id?: string
          is_primary?: boolean
          value: string
        }
        Update: {
          category?: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          crelate_id?: string | null
          id?: string
          is_primary?: boolean
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contact_urls_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contact_urls_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          average_rating: number | null
          contact_type: string
          created_at: string | null
          created_by: string | null
          crelate_id: string | null
          description: string | null
          desired_salary_max: number | null
          desired_salary_min: number | null
          first_name: string | null
          icon_attachment_url: string | null
          id: string
          job_title: string | null
          last_activity_date: string | null
          last_engagement_date: string | null
          last_name: string
          last_reach_out_date: string | null
          latest_pinned_note: string | null
          middle_name: string | null
          nick_name: string | null
          primary_company_id: string | null
          primary_owner_id: string | null
          salary: number | null
          salary_details: string | null
          salutation: string | null
          source_id: string | null
          status: string
          suffix: string | null
          updated_at: string | null
        }
        Insert: {
          average_rating?: number | null
          contact_type?: string
          created_at?: string | null
          created_by?: string | null
          crelate_id?: string | null
          description?: string | null
          desired_salary_max?: number | null
          desired_salary_min?: number | null
          first_name?: string | null
          icon_attachment_url?: string | null
          id?: string
          job_title?: string | null
          last_activity_date?: string | null
          last_engagement_date?: string | null
          last_name: string
          last_reach_out_date?: string | null
          latest_pinned_note?: string | null
          middle_name?: string | null
          nick_name?: string | null
          primary_company_id?: string | null
          primary_owner_id?: string | null
          salary?: number | null
          salary_details?: string | null
          salutation?: string | null
          source_id?: string | null
          status?: string
          suffix?: string | null
          updated_at?: string | null
        }
        Update: {
          average_rating?: number | null
          contact_type?: string
          created_at?: string | null
          created_by?: string | null
          crelate_id?: string | null
          description?: string | null
          desired_salary_max?: number | null
          desired_salary_min?: number | null
          first_name?: string | null
          icon_attachment_url?: string | null
          id?: string
          job_title?: string | null
          last_activity_date?: string | null
          last_engagement_date?: string | null
          last_name?: string
          last_reach_out_date?: string | null
          latest_pinned_note?: string | null
          middle_name?: string | null
          nick_name?: string | null
          primary_company_id?: string | null
          primary_owner_id?: string | null
          salary?: number | null
          salary_details?: string | null
          salutation?: string | null
          source_id?: string | null
          status?: string
          suffix?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_primary_company_id_fkey"
            columns: ["primary_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "crm_contact_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_jobs: {
        Row: {
          account_manager_id: string | null
          board_id: string | null
          closed_on: string | null
          company_id: string | null
          compensation_details: string | null
          created_at: string | null
          created_by: string | null
          crelate_id: string | null
          description: string | null
          estimated_close_date: string | null
          hourly_rate_max: number | null
          hourly_rate_min: number | null
          id: string
          job_title: string | null
          job_type: string | null
          location: string | null
          name: string
          number_of_openings: number
          number_of_placements: number
          priority: string | null
          recruiter_id: string | null
          remote_type: string | null
          salary_max: number | null
          salary_min: number | null
          secondary_recruiter_id: string | null
          start_date: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          account_manager_id?: string | null
          board_id?: string | null
          closed_on?: string | null
          company_id?: string | null
          compensation_details?: string | null
          created_at?: string | null
          created_by?: string | null
          crelate_id?: string | null
          description?: string | null
          estimated_close_date?: string | null
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string
          job_title?: string | null
          job_type?: string | null
          location?: string | null
          name: string
          number_of_openings?: number
          number_of_placements?: number
          priority?: string | null
          recruiter_id?: string | null
          remote_type?: string | null
          salary_max?: number | null
          salary_min?: number | null
          secondary_recruiter_id?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          account_manager_id?: string | null
          board_id?: string | null
          closed_on?: string | null
          company_id?: string | null
          compensation_details?: string | null
          created_at?: string | null
          created_by?: string | null
          crelate_id?: string | null
          description?: string | null
          estimated_close_date?: string | null
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string
          job_title?: string | null
          job_type?: string | null
          location?: string | null
          name?: string
          number_of_openings?: number
          number_of_placements?: number
          priority?: string | null
          recruiter_id?: string | null
          remote_type?: string | null
          salary_max?: number | null
          salary_min?: number | null
          secondary_recruiter_id?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_migration_log: {
        Row: {
          error_message: string | null
          id: string
          migrated_at: string | null
          source_id: string
          source_table: string
          status: string
          target_id: string | null
          target_table: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          migrated_at?: string | null
          source_id: string
          source_table: string
          status?: string
          target_id?: string | null
          target_table: string
        }
        Update: {
          error_message?: string | null
          id?: string
          migrated_at?: string | null
          source_id?: string
          source_table?: string
          status?: string
          target_id?: string | null
          target_table?: string
        }
        Relationships: []
      }
      crm_pipeline_items: {
        Row: {
          added_by: string | null
          average_rating: number | null
          contact_id: string
          created_at: string | null
          created_by: string | null
          crelate_id: string | null
          executive_summary: string | null
          id: string
          job_id: string
          last_activity_date: string | null
          last_stage_change: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          added_by?: string | null
          average_rating?: number | null
          contact_id: string
          created_at?: string | null
          created_by?: string | null
          crelate_id?: string | null
          executive_summary?: string | null
          id?: string
          job_id: string
          last_activity_date?: string | null
          last_stage_change?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          added_by?: string | null
          average_rating?: number | null
          contact_id?: string
          created_at?: string | null
          created_by?: string | null
          crelate_id?: string | null
          executive_summary?: string | null
          id?: string
          job_id?: string
          last_activity_date?: string | null
          last_stage_change?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_pipeline_items_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_pipeline_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "crm_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_placements: {
        Row: {
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          crelate_id: string | null
          fee_amount: number | null
          fee_percent: number | null
          id: string
          job_id: string
          notes: string | null
          pipeline_item_id: string | null
          placement_date: string | null
          salary: number | null
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          crelate_id?: string | null
          fee_amount?: number | null
          fee_percent?: number | null
          id?: string
          job_id: string
          notes?: string | null
          pipeline_item_id?: string | null
          placement_date?: string | null
          salary?: number | null
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          crelate_id?: string | null
          fee_amount?: number | null
          fee_percent?: number | null
          id?: string
          job_id?: string
          notes?: string | null
          pipeline_item_id?: string | null
          placement_date?: string | null
          salary?: number | null
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_placements_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_placements_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "crm_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_placements_pipeline_item_id_fkey"
            columns: ["pipeline_item_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_items"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_sync_log: {
        Row: {
          completed_at: string | null
          created_by: string | null
          entity_type: string
          error_message: string | null
          id: string
          metadata: Json | null
          records_created: number | null
          records_failed: number | null
          records_synced: number | null
          records_updated: number | null
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_by?: string | null
          entity_type: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          records_created?: number | null
          records_failed?: number | null
          records_synced?: number | null
          records_updated?: number | null
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_by?: string | null
          entity_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          records_created?: number | null
          records_failed?: number | null
          records_synced?: number | null
          records_updated?: number | null
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      crm_tags: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          crelate_id: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          crelate_id?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          crelate_id?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
