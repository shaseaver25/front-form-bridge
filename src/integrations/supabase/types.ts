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
      board_automations: {
        Row: {
          action_config: Json
          action_type: string
          board_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          trigger_config: Json
          trigger_type: string
        }
        Insert: {
          action_config?: Json
          action_type: string
          board_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          trigger_config?: Json
          trigger_type: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          board_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          trigger_config?: Json
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_automations_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      board_card_activity: {
        Row: {
          activity_type: string
          card_id: string
          created_at: string
          details: Json
          id: string
          user_id: string | null
        }
        Insert: {
          activity_type: string
          card_id: string
          created_at?: string
          details?: Json
          id?: string
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          card_id?: string
          created_at?: string
          details?: Json
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "board_card_activity_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "board_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      board_card_comments: {
        Row: {
          card_id: string
          content: string
          created_at: string
          id: string
          is_ai_generated: boolean
          user_id: string
        }
        Insert: {
          card_id: string
          content: string
          created_at?: string
          id?: string
          is_ai_generated?: boolean
          user_id: string
        }
        Update: {
          card_id?: string
          content?: string
          created_at?: string
          id?: string
          is_ai_generated?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_card_comments_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "board_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      board_card_dependencies: {
        Row: {
          card_id: string
          created_at: string
          depends_on_card_id: string
          id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          depends_on_card_id: string
          id?: string
        }
        Update: {
          card_id?: string
          created_at?: string
          depends_on_card_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_card_dependencies_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "board_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_card_dependencies_depends_on_card_id_fkey"
            columns: ["depends_on_card_id"]
            isOneToOne: false
            referencedRelation: "board_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      board_card_subtasks: {
        Row: {
          card_id: string
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          position: number
          spawned_card_id: string | null
          text: string
        }
        Insert: {
          card_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          position?: number
          spawned_card_id?: string | null
          text: string
        }
        Update: {
          card_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          position?: number
          spawned_card_id?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_card_subtasks_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "board_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_card_subtasks_spawned_card_id_fkey"
            columns: ["spawned_card_id"]
            isOneToOne: false
            referencedRelation: "board_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      board_cards: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          blocked_reason: string | null
          board_id: string
          column_id: string
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          headline: string
          id: string
          is_blocked: boolean
          is_suggested: boolean
          linked_board_id: string | null
          linked_contact_id: string | null
          linked_donation_id: string | null
          linked_grant_id: string | null
          parent_subtask_id: string | null
          position: number
          priority: string
          question_for: string | null
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          blocked_reason?: string | null
          board_id: string
          column_id: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          headline: string
          id?: string
          is_blocked?: boolean
          is_suggested?: boolean
          linked_board_id?: string | null
          linked_contact_id?: string | null
          linked_donation_id?: string | null
          linked_grant_id?: string | null
          parent_subtask_id?: string | null
          position?: number
          priority?: string
          question_for?: string | null
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          blocked_reason?: string | null
          board_id?: string
          column_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          headline?: string
          id?: string
          is_blocked?: boolean
          is_suggested?: boolean
          linked_board_id?: string | null
          linked_contact_id?: string | null
          linked_donation_id?: string | null
          linked_grant_id?: string | null
          parent_subtask_id?: string | null
          position?: number
          priority?: string
          question_for?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_cards_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_cards_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "board_columns"
            referencedColumns: ["id"]
          },
        ]
      }
      board_columns: {
        Row: {
          board_id: string
          column_type: string
          created_at: string
          id: string
          is_done_column: boolean
          position: number
          title: string
          wip_limit: number | null
        }
        Insert: {
          board_id: string
          column_type?: string
          created_at?: string
          id?: string
          is_done_column?: boolean
          position?: number
          title: string
          wip_limit?: number | null
        }
        Update: {
          board_id?: string
          column_type?: string
          created_at?: string
          id?: string
          is_done_column?: boolean
          position?: number
          title?: string
          wip_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "board_columns_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      board_members: {
        Row: {
          added_at: string
          board_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          added_at?: string
          board_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          added_at?: string
          board_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_members_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      board_time_logs: {
        Row: {
          card_id: string
          created_at: string
          duration_minutes: number | null
          ended_at: string | null
          id: string
          notes: string | null
          started_at: string
          user_id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          user_id: string
        }
        Update: {
          card_id?: string
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_time_logs_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "board_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      boards: {
        Row: {
          archived_at: string | null
          assigned_to: string | null
          board_type: string
          column_order: Json
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_archived: boolean
          is_board_initiative: boolean | null
          linked_campaign_id: string | null
          linked_grant_id: string | null
          linked_site_id: string | null
          name: string
          organization_id: string | null
          settings: Json
          theme_color: string
          updated_at: string
          volunteers_needed: boolean | null
        }
        Insert: {
          archived_at?: string | null
          assigned_to?: string | null
          board_type?: string
          column_order?: Json
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_archived?: boolean
          is_board_initiative?: boolean | null
          linked_campaign_id?: string | null
          linked_grant_id?: string | null
          linked_site_id?: string | null
          name: string
          organization_id?: string | null
          settings?: Json
          theme_color?: string
          updated_at?: string
          volunteers_needed?: boolean | null
        }
        Update: {
          archived_at?: string | null
          assigned_to?: string | null
          board_type?: string
          column_order?: Json
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          is_board_initiative?: boolean | null
          linked_campaign_id?: string | null
          linked_grant_id?: string | null
          linked_site_id?: string | null
          name?: string
          organization_id?: string | null
          settings?: Json
          theme_color?: string
          updated_at?: string
          volunteers_needed?: boolean | null
        }
        Relationships: []
      }
      briefing_room_clients: {
        Row: {
          client_email: string
          client_logo_url: string | null
          client_name: string
          client_title: string | null
          created_at: string | null
          crm_company_id: string | null
          crm_search_id: string
          id: string
          is_active: boolean | null
          last_login: string | null
        }
        Insert: {
          client_email: string
          client_logo_url?: string | null
          client_name: string
          client_title?: string | null
          created_at?: string | null
          crm_company_id?: string | null
          crm_search_id: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
        }
        Update: {
          client_email?: string
          client_logo_url?: string | null
          client_name?: string
          client_title?: string | null
          created_at?: string | null
          crm_company_id?: string | null
          crm_search_id?: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
        }
        Relationships: []
      }
      candidate_feedback: {
        Row: {
          client_id: string | null
          comment: string | null
          created_at: string | null
          id: string
          presentation_id: string | null
          reaction: string | null
        }
        Insert: {
          client_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          presentation_id?: string | null
          reaction?: string | null
        }
        Update: {
          client_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string
          presentation_id?: string | null
          reaction?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_feedback_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "briefing_room_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_feedback_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "portal_presentations"
            referencedColumns: ["id"]
          },
        ]
      }
      company_profiles: {
        Row: {
          board_structure: string | null
          bonus_structure: string | null
          comp_range_max: number | null
          comp_range_min: number | null
          company_id: string | null
          company_story: string | null
          competitive_landscape: string | null
          created_at: string | null
          culture_summary: string | null
          decision_making_style: string | null
          geographic_locations: Json | null
          id: string
          key_decision_makers: string | null
          last_updated_by: string | null
          off_limits_reason: string | null
          off_limits_source: boolean | null
          office_preference: string | null
          pe_firm_context: string | null
          pe_firm_name: string | null
          preferred_candidate_geography: string | null
          strategic_goals: string[] | null
          strategic_posture: string | null
          tech_stack: Json | null
          updated_at: string | null
          where_they_are: string | null
          where_they_are_going: string | null
        }
        Insert: {
          board_structure?: string | null
          bonus_structure?: string | null
          comp_range_max?: number | null
          comp_range_min?: number | null
          company_id?: string | null
          company_story?: string | null
          competitive_landscape?: string | null
          created_at?: string | null
          culture_summary?: string | null
          decision_making_style?: string | null
          geographic_locations?: Json | null
          id?: string
          key_decision_makers?: string | null
          last_updated_by?: string | null
          off_limits_reason?: string | null
          off_limits_source?: boolean | null
          office_preference?: string | null
          pe_firm_context?: string | null
          pe_firm_name?: string | null
          preferred_candidate_geography?: string | null
          strategic_goals?: string[] | null
          strategic_posture?: string | null
          tech_stack?: Json | null
          updated_at?: string | null
          where_they_are?: string | null
          where_they_are_going?: string | null
        }
        Update: {
          board_structure?: string | null
          bonus_structure?: string | null
          comp_range_max?: number | null
          comp_range_min?: number | null
          company_id?: string | null
          company_story?: string | null
          competitive_landscape?: string | null
          created_at?: string | null
          culture_summary?: string | null
          decision_making_style?: string | null
          geographic_locations?: Json | null
          id?: string
          key_decision_makers?: string | null
          last_updated_by?: string | null
          off_limits_reason?: string | null
          off_limits_source?: boolean | null
          office_preference?: string | null
          pe_firm_context?: string | null
          pe_firm_name?: string | null
          preferred_candidate_geography?: string | null
          strategic_goals?: string[] | null
          strategic_posture?: string | null
          tech_stack?: Json | null
          updated_at?: string | null
          where_they_are?: string | null
          where_they_are_going?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
        ]
      }
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
      crm_attachments: {
        Row: {
          attachment_type: string | null
          company_id: string | null
          contact_id: string | null
          content_length: number | null
          content_type: string | null
          created_at: string | null
          created_by: string | null
          crelate_id: string | null
          file_name: string
          id: string
          is_document: boolean | null
          is_image: boolean | null
          is_primary_doc: boolean | null
          is_profile_photo: boolean | null
          job_id: string | null
          storage_path: string | null
          updated_at: string | null
        }
        Insert: {
          attachment_type?: string | null
          company_id?: string | null
          contact_id?: string | null
          content_length?: number | null
          content_type?: string | null
          created_at?: string | null
          created_by?: string | null
          crelate_id?: string | null
          file_name: string
          id?: string
          is_document?: boolean | null
          is_image?: boolean | null
          is_primary_doc?: boolean | null
          is_profile_photo?: boolean | null
          job_id?: string | null
          storage_path?: string | null
          updated_at?: string | null
        }
        Update: {
          attachment_type?: string | null
          company_id?: string | null
          contact_id?: string | null
          content_length?: number | null
          content_type?: string | null
          created_at?: string | null
          created_by?: string | null
          crelate_id?: string | null
          file_name?: string
          id?: string
          is_document?: boolean | null
          is_image?: boolean | null
          is_primary_doc?: boolean | null
          is_profile_photo?: boolean | null
          job_id?: string | null
          storage_path?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_attachments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_attachments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_attachments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "crm_jobs"
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
      crm_company_tags: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          tag_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          tag_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_company_tags_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_company_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "crm_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_connections: {
        Row: {
          created_at: string | null
          crm_base_url: string
          crm_name: string
          id: string
        }
        Insert: {
          created_at?: string | null
          crm_base_url: string
          crm_name?: string
          id?: string
        }
        Update: {
          created_at?: string | null
          crm_base_url?: string
          crm_name?: string
          id?: string
        }
        Relationships: []
      }
      crm_contact_documents: {
        Row: {
          contact_id: string
          created_at: string | null
          crelate_id: string | null
          file_name: string
          file_size_bytes: number | null
          file_type: string | null
          file_url: string
          id: string
          uploaded_by: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          crelate_id?: string | null
          file_name: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          crelate_id?: string | null
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contact_documents_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
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
      crm_contact_notes: {
        Row: {
          contact_id: string
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_pinned: boolean
          updated_at: string | null
        }
        Insert: {
          contact_id: string
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_pinned?: boolean
          updated_at?: string | null
        }
        Update: {
          contact_id?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_pinned?: boolean
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contact_notes_contact_id_fkey"
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
          connections_count: number | null
          contact_type: string
          created_at: string | null
          created_by: string | null
          crelate_id: string | null
          description: string | null
          desired_salary_max: number | null
          desired_salary_min: number | null
          enrichment_data: Json | null
          enrichment_source: string | null
          enrichment_status: string | null
          enrichment_updated_at: string | null
          first_name: string | null
          follower_count: number | null
          icon_attachment_url: string | null
          id: string
          is_unsubscribed: boolean | null
          job_title: string | null
          last_activity_date: string | null
          last_engagement_date: string | null
          last_name: string
          last_reach_out_date: string | null
          latest_pinned_note: string | null
          linkedin_url: string | null
          middle_name: string | null
          nick_name: string | null
          primary_company_id: string | null
          primary_owner_id: string | null
          profile_image_url: string | null
          salary: number | null
          salary_details: string | null
          salutation: string | null
          source: string | null
          source_detail: string | null
          source_id: string | null
          status: string
          suffix: string | null
          summary: string | null
          unsubscribed_at: string | null
          updated_at: string | null
        }
        Insert: {
          average_rating?: number | null
          connections_count?: number | null
          contact_type?: string
          created_at?: string | null
          created_by?: string | null
          crelate_id?: string | null
          description?: string | null
          desired_salary_max?: number | null
          desired_salary_min?: number | null
          enrichment_data?: Json | null
          enrichment_source?: string | null
          enrichment_status?: string | null
          enrichment_updated_at?: string | null
          first_name?: string | null
          follower_count?: number | null
          icon_attachment_url?: string | null
          id?: string
          is_unsubscribed?: boolean | null
          job_title?: string | null
          last_activity_date?: string | null
          last_engagement_date?: string | null
          last_name: string
          last_reach_out_date?: string | null
          latest_pinned_note?: string | null
          linkedin_url?: string | null
          middle_name?: string | null
          nick_name?: string | null
          primary_company_id?: string | null
          primary_owner_id?: string | null
          profile_image_url?: string | null
          salary?: number | null
          salary_details?: string | null
          salutation?: string | null
          source?: string | null
          source_detail?: string | null
          source_id?: string | null
          status?: string
          suffix?: string | null
          summary?: string | null
          unsubscribed_at?: string | null
          updated_at?: string | null
        }
        Update: {
          average_rating?: number | null
          connections_count?: number | null
          contact_type?: string
          created_at?: string | null
          created_by?: string | null
          crelate_id?: string | null
          description?: string | null
          desired_salary_max?: number | null
          desired_salary_min?: number | null
          enrichment_data?: Json | null
          enrichment_source?: string | null
          enrichment_status?: string | null
          enrichment_updated_at?: string | null
          first_name?: string | null
          follower_count?: number | null
          icon_attachment_url?: string | null
          id?: string
          is_unsubscribed?: boolean | null
          job_title?: string | null
          last_activity_date?: string | null
          last_engagement_date?: string | null
          last_name?: string
          last_reach_out_date?: string | null
          latest_pinned_note?: string | null
          linkedin_url?: string | null
          middle_name?: string | null
          nick_name?: string | null
          primary_company_id?: string | null
          primary_owner_id?: string | null
          profile_image_url?: string | null
          salary?: number | null
          salary_details?: string | null
          salutation?: string | null
          source?: string | null
          source_detail?: string | null
          source_id?: string | null
          status?: string
          suffix?: string | null
          summary?: string | null
          unsubscribed_at?: string | null
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
      crm_job_tags: {
        Row: {
          created_at: string | null
          id: string
          job_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_job_tags_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "crm_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_job_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "crm_tags"
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
      discovery_context: {
        Row: {
          client_reaction_insights: string | null
          crm_search_id: string
          cultural_context: string | null
          generated_at: string | null
          id: string
          version: number | null
          what_i_heard: string | null
        }
        Insert: {
          client_reaction_insights?: string | null
          crm_search_id: string
          cultural_context?: string | null
          generated_at?: string | null
          id?: string
          version?: number | null
          what_i_heard?: string | null
        }
        Update: {
          client_reaction_insights?: string | null
          crm_search_id?: string
          cultural_context?: string | null
          generated_at?: string | null
          id?: string
          version?: number | null
          what_i_heard?: string | null
        }
        Relationships: []
      }
      discovery_stakeholders: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          interview_date: string | null
          notes: string | null
          search_id: string | null
          stakeholder_name: string
          stakeholder_role: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          interview_date?: string | null
          notes?: string | null
          search_id?: string | null
          stakeholder_name: string
          stakeholder_role?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          interview_date?: string | null
          notes?: string | null
          search_id?: string | null
          stakeholder_name?: string
          stakeholder_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discovery_stakeholders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovery_stakeholders_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "crm_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_transcripts: {
        Row: {
          company_id: string | null
          created_at: string | null
          created_by: string | null
          extracted_themes: Json | null
          granola_note_id: string | null
          id: string
          included_in_synthesis: boolean | null
          interview_date: string | null
          key_quotes: string[] | null
          raw_transcript: string
          search_id: string | null
          source_type: string | null
          stakeholder_name: string | null
          stakeholder_role: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          extracted_themes?: Json | null
          granola_note_id?: string | null
          id?: string
          included_in_synthesis?: boolean | null
          interview_date?: string | null
          key_quotes?: string[] | null
          raw_transcript: string
          search_id?: string | null
          source_type?: string | null
          stakeholder_name?: string | null
          stakeholder_role?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          extracted_themes?: Json | null
          granola_note_id?: string | null
          id?: string
          included_in_synthesis?: boolean | null
          interview_date?: string | null
          key_quotes?: string[] | null
          raw_transcript?: string
          search_id?: string | null
          source_type?: string | null
          stakeholder_name?: string | null
          stakeholder_role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discovery_transcripts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovery_transcripts_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "crm_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          body_html: string | null
          body_text: string | null
          brevo_campaign_id: number | null
          click_count: number | null
          created_at: string | null
          created_by: string | null
          from_email: string
          from_name: string
          id: string
          name: string
          open_count: number | null
          reply_to: string | null
          scheduled_at: string | null
          segment_id: string | null
          sent_at: string | null
          sent_count: number | null
          status: string | null
          subject: string
          unsub_count: number | null
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          brevo_campaign_id?: number | null
          click_count?: number | null
          created_at?: string | null
          created_by?: string | null
          from_email?: string
          from_name?: string
          id?: string
          name: string
          open_count?: number | null
          reply_to?: string | null
          scheduled_at?: string | null
          segment_id?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          subject: string
          unsub_count?: number | null
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          brevo_campaign_id?: number | null
          click_count?: number | null
          created_at?: string | null
          created_by?: string | null
          from_email?: string
          from_name?: string
          id?: string
          name?: string
          open_count?: number | null
          reply_to?: string | null
          scheduled_at?: string | null
          segment_id?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          subject?: string
          unsub_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "email_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      email_contacts: {
        Row: {
          contact_id: string | null
          created_at: string | null
          email: string
          id: string
          source: string | null
          status: string
          unsub_reason: string | null
          unsubscribed_at: string | null
          updated_at: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          source?: string | null
          status?: string
          unsub_reason?: string | null
          unsubscribed_at?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          source?: string | null
          status?: string
          unsub_reason?: string | null
          unsubscribed_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_segments: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          filter_json: Json
          id: string
          member_count: number | null
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          filter_json: Json
          id?: string
          member_count?: number | null
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          filter_json?: Json
          id?: string
          member_count?: number | null
          name?: string
        }
        Relationships: []
      }
      email_sequence_enrollments: {
        Row: {
          contact_id: string | null
          current_step: number | null
          enrolled_at: string | null
          id: string
          next_send_at: string | null
          sequence_id: string | null
          status: string | null
        }
        Insert: {
          contact_id?: string | null
          current_step?: number | null
          enrolled_at?: string | null
          id?: string
          next_send_at?: string | null
          sequence_id?: string | null
          status?: string | null
        }
        Update: {
          contact_id?: string | null
          current_step?: number | null
          enrolled_at?: string | null
          id?: string
          next_send_at?: string | null
          sequence_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sequence_enrollments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sequence_enrollments_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequences: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          name: string
          steps: Json
          trigger_type: string
          trigger_value: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name: string
          steps: Json
          trigger_type: string
          trigger_value?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
          steps?: Json
          trigger_type?: string
          trigger_value?: string | null
        }
        Relationships: []
      }
      escalation_queue: {
        Row: {
          affected_area: string | null
          assigned_to: string | null
          created_at: string
          customer_user_id: string | null
          details: Json | null
          id: string
          issue_summary: string
          page_url: string | null
          proposed_fix: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          status: string
          support_ticket_id: string | null
          updated_at: string
          webhook_response_code: number | null
          webhook_sent: boolean | null
        }
        Insert: {
          affected_area?: string | null
          assigned_to?: string | null
          created_at?: string
          customer_user_id?: string | null
          details?: Json | null
          id?: string
          issue_summary: string
          page_url?: string | null
          proposed_fix?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: string
          support_ticket_id?: string | null
          updated_at?: string
          webhook_response_code?: number | null
          webhook_sent?: boolean | null
        }
        Update: {
          affected_area?: string | null
          assigned_to?: string | null
          created_at?: string
          customer_user_id?: string | null
          details?: Json | null
          id?: string
          issue_summary?: string
          page_url?: string | null
          proposed_fix?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: string
          support_ticket_id?: string | null
          updated_at?: string
          webhook_response_code?: number | null
          webhook_sent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "escalation_queue_support_ticket_id_fkey"
            columns: ["support_ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      gmail_connections: {
        Row: {
          access_token: string | null
          auto_sync_enabled: boolean | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          auto_sync_enabled?: boolean | null
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          auto_sync_enabled?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gmail_messages: {
        Row: {
          cc_emails: Json | null
          connection_id: string | null
          created_at: string | null
          from_email: string | null
          from_name: string | null
          gmail_message_id: string
          id: string
          internal_date: string | null
          is_read: boolean | null
          label_ids: Json | null
          matched_contact_id: string | null
          snippet: string | null
          subject: string | null
          thread_id: string | null
          to_emails: Json | null
          user_id: string
        }
        Insert: {
          cc_emails?: Json | null
          connection_id?: string | null
          created_at?: string | null
          from_email?: string | null
          from_name?: string | null
          gmail_message_id: string
          id?: string
          internal_date?: string | null
          is_read?: boolean | null
          label_ids?: Json | null
          matched_contact_id?: string | null
          snippet?: string | null
          subject?: string | null
          thread_id?: string | null
          to_emails?: Json | null
          user_id: string
        }
        Update: {
          cc_emails?: Json | null
          connection_id?: string | null
          created_at?: string | null
          from_email?: string | null
          from_name?: string | null
          gmail_message_id?: string
          id?: string
          internal_date?: string | null
          is_read?: boolean | null
          label_ids?: Json | null
          matched_contact_id?: string | null
          snippet?: string | null
          subject?: string | null
          thread_id?: string | null
          to_emails?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gmail_messages_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "gmail_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_connections: {
        Row: {
          access_token: string | null
          auto_sync_enabled: boolean | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          auto_sync_enabled?: boolean | null
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          auto_sync_enabled?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      google_calendar_events: {
        Row: {
          attendees: Json | null
          connection_id: string | null
          created_at: string | null
          description: string | null
          end_time: string | null
          google_event_id: string
          html_link: string | null
          id: string
          location: string | null
          start_time: string | null
          status: string | null
          summary: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attendees?: Json | null
          connection_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          google_event_id: string
          html_link?: string | null
          id?: string
          location?: string | null
          start_time?: string | null
          status?: string | null
          summary?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attendees?: Json | null
          connection_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          google_event_id?: string
          html_link?: string | null
          id?: string
          location?: string | null
          start_time?: string | null
          status?: string | null
          summary?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_events_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "google_calendar_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      job_profiles: {
        Row: {
          approved_at: string | null
          approved_by_client_id: string | null
          change_notes: string[] | null
          company_story: string | null
          created_at: string | null
          crm_search_id: string
          culture_summary: string | null
          id: string
          pe_context: string | null
          status: string | null
          strategic_goals: string | null
          strategic_posture: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by_client_id?: string | null
          change_notes?: string[] | null
          company_story?: string | null
          created_at?: string | null
          crm_search_id: string
          culture_summary?: string | null
          id?: string
          pe_context?: string | null
          status?: string | null
          strategic_goals?: string | null
          strategic_posture?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by_client_id?: string | null
          change_notes?: string[] | null
          company_story?: string | null
          created_at?: string | null
          crm_search_id?: string
          culture_summary?: string | null
          id?: string
          pe_context?: string | null
          status?: string | null
          strategic_goals?: string | null
          strategic_posture?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_profiles_approved_by_client_id_fkey"
            columns: ["approved_by_client_id"]
            isOneToOne: false
            referencedRelation: "briefing_room_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_presentations: {
        Row: {
          created_at: string | null
          crm_candidate_id: string
          crm_search_id: string
          id: string
          presentation_json: Json | null
          published_at: string | null
          shannons_take: string | null
          skill_ratings: Json | null
          status: string | null
          support_framing: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          crm_candidate_id: string
          crm_search_id: string
          id?: string
          presentation_json?: Json | null
          published_at?: string | null
          shannons_take?: string | null
          skill_ratings?: Json | null
          status?: string | null
          support_framing?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          crm_candidate_id?: string
          crm_search_id?: string
          id?: string
          presentation_json?: Json | null
          published_at?: string | null
          shannons_take?: string | null
          skill_ratings?: Json | null
          status?: string | null
          support_framing?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      profile_synthesis_log: {
        Row: {
          company_id: string | null
          fields_updated: string[] | null
          id: string
          model_used: string | null
          stakeholder_count: number | null
          synthesized_at: string | null
        }
        Insert: {
          company_id?: string | null
          fields_updated?: string[] | null
          id?: string
          model_used?: string | null
          stakeholder_count?: number | null
          synthesized_at?: string | null
        }
        Update: {
          company_id?: string | null
          fields_updated?: string[] | null
          id?: string
          model_used?: string | null
          stakeholder_count?: number | null
          synthesized_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_synthesis_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      project_collaborators: {
        Row: {
          access_expires_at: string | null
          id: string
          invited_at: string | null
          project_id: string
          project_type: string
          role: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          access_expires_at?: string | null
          id?: string
          invited_at?: string | null
          project_id: string
          project_type?: string
          role?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          access_expires_at?: string | null
          id?: string
          invited_at?: string | null
          project_id?: string
          project_type?: string
          role?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rebrand_coach_notes: {
        Row: {
          chapter_id: string
          coach_id: string
          created_at: string
          id: string
          note_text: string
          user_id: string
        }
        Insert: {
          chapter_id: string
          coach_id: string
          created_at?: string
          id?: string
          note_text: string
          user_id: string
        }
        Update: {
          chapter_id?: string
          coach_id?: string
          created_at?: string
          id?: string
          note_text?: string
          user_id?: string
        }
        Relationships: []
      }
      rebrand_gap_analysis: {
        Row: {
          created_at: string
          current_term: string
          harvest_id: string
          id: string
          status: string
          target_term: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_term: string
          harvest_id: string
          id?: string
          status?: string
          target_term: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_term?: string
          harvest_id?: string
          id?: string
          status?: string
          target_term?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rebrand_gap_analysis_harvest_id_fkey"
            columns: ["harvest_id"]
            isOneToOne: false
            referencedRelation: "rebrand_harvests"
            referencedColumns: ["id"]
          },
        ]
      }
      rebrand_harvests: {
        Row: {
          company_name: string
          created_at: string
          id: string
          job_title: string
          job_url: string | null
          keywords: Json
          nomenclature: Json
          problem_language: Json
          qualifications: Json
          raw_description: string
          responsibilities: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name: string
          created_at?: string
          id?: string
          job_title: string
          job_url?: string | null
          keywords?: Json
          nomenclature?: Json
          problem_language?: Json
          qualifications?: Json
          raw_description: string
          responsibilities?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string
          id?: string
          job_title?: string
          job_url?: string | null
          keywords?: Json
          nomenclature?: Json
          problem_language?: Json
          qualifications?: Json
          raw_description?: string
          responsibilities?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rebrand_progress: {
        Row: {
          chapter_id: string
          completed_at: string | null
          id: string
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          chapter_id: string
          completed_at?: string | null
          id?: string
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          chapter_id?: string
          completed_at?: string | null
          id?: string
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      rebrand_reflections: {
        Row: {
          chapter_id: string
          created_at: string
          id: string
          question_key: string
          response_html: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id: string
          created_at?: string
          id?: string
          question_key: string
          response_html?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string
          created_at?: string
          id?: string
          question_key?: string
          response_html?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      search_milestones: {
        Row: {
          actual_date: string | null
          created_at: string | null
          crm_search_id: string
          id: string
          is_estimated: boolean | null
          milestone_key: string
          milestone_label: string
          sort_order: number | null
          target_date: string | null
        }
        Insert: {
          actual_date?: string | null
          created_at?: string | null
          crm_search_id: string
          id?: string
          is_estimated?: boolean | null
          milestone_key: string
          milestone_label: string
          sort_order?: number | null
          target_date?: string | null
        }
        Update: {
          actual_date?: string | null
          created_at?: string | null
          crm_search_id?: string
          id?: string
          is_estimated?: boolean | null
          milestone_key?: string
          milestone_label?: string
          sort_order?: number | null
          target_date?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_notes: string | null
          ai_resolved: boolean
          ai_response: string | null
          created_at: string
          description: string
          id: string
          page_url: string | null
          severity: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          ai_resolved?: boolean
          ai_response?: string | null
          created_at?: string
          description: string
          id?: string
          page_url?: string | null
          severity?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          ai_resolved?: boolean
          ai_response?: string | null
          created_at?: string
          description?: string
          id?: string
          page_url?: string | null
          severity?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          department: string | null
          email: string
          expires_at: string
          first_name: string
          id: string
          invited_by: string | null
          job_title: string | null
          last_name: string
          organization_name: string | null
          phone: string | null
          role: string
          status: string
          token: string
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          expires_at: string
          first_name: string
          id?: string
          invited_by?: string | null
          job_title?: string | null
          last_name: string
          organization_name?: string | null
          phone?: string | null
          role?: string
          status?: string
          token: string
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          expires_at?: string
          first_name?: string
          id?: string
          invited_by?: string | null
          job_title?: string | null
          last_name?: string
          organization_name?: string | null
          phone?: string | null
          role?: string
          status?: string
          token?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string | null
          department: string | null
          email: string | null
          first_name: string | null
          id: string
          is_active: boolean
          job_title: string | null
          last_name: string | null
          organization_name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          is_active?: boolean
          job_title?: string | null
          last_name?: string | null
          organization_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean
          job_title?: string | null
          last_name?: string | null
          organization_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      portal_crm_search_id: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "client"
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
      app_role: ["admin", "moderator", "user", "client"],
    },
  },
} as const
