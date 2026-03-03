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
      activities: {
        Row: {
          activity_type: string
          constituent_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          metadata: Json | null
          title: string
        }
        Insert: {
          activity_type: string
          constituent_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          title: string
        }
        Update: {
          activity_type?: string
          constituent_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_activity_log: {
        Row: {
          action_type: string
          admin_user_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      board_automations: {
        Row: {
          action_config: Json
          action_type: Database["public"]["Enums"]["board_automation_action"]
          board_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          trigger_config: Json
          trigger_type: Database["public"]["Enums"]["board_automation_trigger"]
        }
        Insert: {
          action_config: Json
          action_type: Database["public"]["Enums"]["board_automation_action"]
          board_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          trigger_config: Json
          trigger_type: Database["public"]["Enums"]["board_automation_trigger"]
        }
        Update: {
          action_config?: Json
          action_type?: Database["public"]["Enums"]["board_automation_action"]
          board_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_config?: Json
          trigger_type?: Database["public"]["Enums"]["board_automation_trigger"]
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
          activity_type: Database["public"]["Enums"]["board_activity_type"]
          card_id: string
          created_at: string | null
          details: Json | null
          id: string
          user_id: string | null
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["board_activity_type"]
          card_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["board_activity_type"]
          card_id?: string
          created_at?: string | null
          details?: Json | null
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
          created_at: string | null
          id: string
          is_ai_generated: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          card_id: string
          content: string
          created_at?: string | null
          id?: string
          is_ai_generated?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          card_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_ai_generated?: boolean | null
          updated_at?: string | null
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
          created_at: string | null
          depends_on_card_id: string
          id: string
        }
        Insert: {
          card_id: string
          created_at?: string | null
          depends_on_card_id: string
          id?: string
        }
        Update: {
          card_id?: string
          created_at?: string | null
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
          created_at: string | null
          id: string
          is_completed: boolean | null
          position: number
          spawned_card_id: string | null
          text: string
        }
        Insert: {
          card_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          position: number
          spawned_card_id?: string | null
          text: string
        }
        Update: {
          card_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
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
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          headline: string
          id: string
          is_blocked: boolean | null
          is_suggested: boolean | null
          linked_board_id: string | null
          linked_contact_id: string | null
          linked_donation_id: string | null
          linked_grant_id: string | null
          parent_subtask_id: string | null
          position: number
          priority: Database["public"]["Enums"]["board_card_priority"] | null
          question_for: string | null
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          blocked_reason?: string | null
          board_id: string
          column_id: string
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          headline: string
          id?: string
          is_blocked?: boolean | null
          is_suggested?: boolean | null
          linked_board_id?: string | null
          linked_contact_id?: string | null
          linked_donation_id?: string | null
          linked_grant_id?: string | null
          parent_subtask_id?: string | null
          position: number
          priority?: Database["public"]["Enums"]["board_card_priority"] | null
          question_for?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          blocked_reason?: string | null
          board_id?: string
          column_id?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          headline?: string
          id?: string
          is_blocked?: boolean | null
          is_suggested?: boolean | null
          linked_board_id?: string | null
          linked_contact_id?: string | null
          linked_donation_id?: string | null
          linked_grant_id?: string | null
          parent_subtask_id?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["board_card_priority"] | null
          question_for?: string | null
          updated_at?: string | null
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
          {
            foreignKeyName: "board_cards_linked_board_id_fkey"
            columns: ["linked_board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_cards_linked_contact_id_fkey"
            columns: ["linked_contact_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_cards_linked_contact_id_fkey"
            columns: ["linked_contact_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_cards_linked_donation_id_fkey"
            columns: ["linked_donation_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_cards_linked_grant_id_fkey"
            columns: ["linked_grant_id"]
            isOneToOne: false
            referencedRelation: "grant_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_cards_parent_subtask_id_fkey"
            columns: ["parent_subtask_id"]
            isOneToOne: false
            referencedRelation: "board_card_subtasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_cards_question_for_fkey"
            columns: ["question_for"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      board_columns: {
        Row: {
          board_id: string
          column_type: Database["public"]["Enums"]["board_column_type"] | null
          created_at: string | null
          id: string
          is_done_column: boolean | null
          position: number
          title: string
          wip_limit: number | null
        }
        Insert: {
          board_id: string
          column_type?: Database["public"]["Enums"]["board_column_type"] | null
          created_at?: string | null
          id?: string
          is_done_column?: boolean | null
          position: number
          title: string
          wip_limit?: number | null
        }
        Update: {
          board_id?: string
          column_type?: Database["public"]["Enums"]["board_column_type"] | null
          created_at?: string | null
          id?: string
          is_done_column?: boolean | null
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
      board_documents: {
        Row: {
          board_id: string
          created_at: string
          description: string | null
          document_type: string
          file_path: string | null
          file_size: number | null
          id: string
          mime_type: string | null
          name: string
          updated_at: string
          uploaded_by: string
          url: string | null
        }
        Insert: {
          board_id: string
          created_at?: string
          description?: string | null
          document_type?: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name: string
          updated_at?: string
          uploaded_by: string
          url?: string | null
        }
        Update: {
          board_id?: string
          created_at?: string
          description?: string | null
          document_type?: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          updated_at?: string
          uploaded_by?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "board_documents_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      board_members: {
        Row: {
          added_at: string | null
          board_id: string
          id: string
          role: Database["public"]["Enums"]["board_member_role"] | null
          user_id: string
        }
        Insert: {
          added_at?: string | null
          board_id: string
          id?: string
          role?: Database["public"]["Enums"]["board_member_role"] | null
          user_id: string
        }
        Update: {
          added_at?: string | null
          board_id?: string
          id?: string
          role?: Database["public"]["Enums"]["board_member_role"] | null
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
      board_templates: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          template_data: Json
          thumbnail_url: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          template_data?: Json
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          template_data?: Json
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      board_time_logs: {
        Row: {
          card_id: string
          created_at: string | null
          duration_minutes: number | null
          ended_at: string | null
          id: string
          notes: string | null
          started_at: string
          user_id: string
        }
        Insert: {
          card_id: string
          created_at?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at: string
          user_id: string
        }
        Update: {
          card_id?: string
          created_at?: string | null
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
          board_type: Database["public"]["Enums"]["board_type"] | null
          column_order: Json | null
          created_at: string | null
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          is_archived: boolean | null
          is_board_initiative: boolean | null
          is_template: boolean | null
          linked_campaign_id: string | null
          linked_grant_id: string | null
          linked_site_id: string | null
          name: string
          organization_id: string | null
          priority: string | null
          settings: Json | null
          template_id: string | null
          theme_color: string | null
          updated_at: string | null
          volunteers_needed: boolean | null
        }
        Insert: {
          archived_at?: string | null
          assigned_to?: string | null
          board_type?: Database["public"]["Enums"]["board_type"] | null
          column_order?: Json | null
          created_at?: string | null
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_archived?: boolean | null
          is_board_initiative?: boolean | null
          is_template?: boolean | null
          linked_campaign_id?: string | null
          linked_grant_id?: string | null
          linked_site_id?: string | null
          name: string
          organization_id?: string | null
          priority?: string | null
          settings?: Json | null
          template_id?: string | null
          theme_color?: string | null
          updated_at?: string | null
          volunteers_needed?: boolean | null
        }
        Update: {
          archived_at?: string | null
          assigned_to?: string | null
          board_type?: Database["public"]["Enums"]["board_type"] | null
          column_order?: Json | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_archived?: boolean | null
          is_board_initiative?: boolean | null
          is_template?: boolean | null
          linked_campaign_id?: string | null
          linked_grant_id?: string | null
          linked_site_id?: string | null
          name?: string
          organization_id?: string | null
          priority?: string | null
          settings?: Json | null
          template_id?: string | null
          theme_color?: string | null
          updated_at?: string | null
          volunteers_needed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "boards_linked_campaign_id_fkey"
            columns: ["linked_campaign_id"]
            isOneToOne: false
            referencedRelation: "donation_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boards_linked_grant_id_fkey"
            columns: ["linked_grant_id"]
            isOneToOne: false
            referencedRelation: "grant_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boards_linked_site_id_fkey"
            columns: ["linked_site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boards_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boards_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "board_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      burndown_cash_snapshots: {
        Row: {
          actual_balance: number
          created_at: string | null
          id: string
          monthly_burn_override: number | null
          notes: string | null
          organization_id: string | null
          snapshot_date: string
        }
        Insert: {
          actual_balance: number
          created_at?: string | null
          id?: string
          monthly_burn_override?: number | null
          notes?: string | null
          organization_id?: string | null
          snapshot_date: string
        }
        Update: {
          actual_balance?: number
          created_at?: string | null
          id?: string
          monthly_burn_override?: number | null
          notes?: string | null
          organization_id?: string | null
          snapshot_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "burndown_cash_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      burndown_expense_categories: {
        Row: {
          category_type: Database["public"]["Enums"]["burndown_expense_category_type"]
          created_at: string | null
          id: string
          is_fixed: boolean | null
          name: string
          organization_id: string | null
        }
        Insert: {
          category_type: Database["public"]["Enums"]["burndown_expense_category_type"]
          created_at?: string | null
          id?: string
          is_fixed?: boolean | null
          name: string
          organization_id?: string | null
        }
        Update: {
          category_type?: Database["public"]["Enums"]["burndown_expense_category_type"]
          created_at?: string | null
          id?: string
          is_fixed?: boolean | null
          name?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "burndown_expense_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      burndown_expense_entries: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          is_recurring: boolean | null
          is_synced: boolean | null
          notes: string | null
          organization_id: string | null
          paid_date: string | null
          quickbooks_expense_id: string | null
          recurrence_end_date: string | null
          status: Database["public"]["Enums"]["burndown_expense_status"] | null
          updated_at: string | null
          vendor_name: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          is_recurring?: boolean | null
          is_synced?: boolean | null
          notes?: string | null
          organization_id?: string | null
          paid_date?: string | null
          quickbooks_expense_id?: string | null
          recurrence_end_date?: string | null
          status?: Database["public"]["Enums"]["burndown_expense_status"] | null
          updated_at?: string | null
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          is_recurring?: boolean | null
          is_synced?: boolean | null
          notes?: string | null
          organization_id?: string | null
          paid_date?: string | null
          quickbooks_expense_id?: string | null
          recurrence_end_date?: string | null
          status?: Database["public"]["Enums"]["burndown_expense_status"] | null
          updated_at?: string | null
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "burndown_expense_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "burndown_expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "burndown_expense_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      burndown_income_categories: {
        Row: {
          category_type: Database["public"]["Enums"]["burndown_income_category_type"]
          created_at: string | null
          id: string
          is_recurring: boolean | null
          name: string
          organization_id: string | null
          recurrence_interval:
            | Database["public"]["Enums"]["burndown_recurrence_interval"]
            | null
        }
        Insert: {
          category_type: Database["public"]["Enums"]["burndown_income_category_type"]
          created_at?: string | null
          id?: string
          is_recurring?: boolean | null
          name: string
          organization_id?: string | null
          recurrence_interval?:
            | Database["public"]["Enums"]["burndown_recurrence_interval"]
            | null
        }
        Update: {
          category_type?: Database["public"]["Enums"]["burndown_income_category_type"]
          created_at?: string | null
          id?: string
          is_recurring?: boolean | null
          name?: string
          organization_id?: string | null
          recurrence_interval?:
            | Database["public"]["Enums"]["burndown_recurrence_interval"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "burndown_income_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      burndown_income_entries: {
        Row: {
          actual_date: string | null
          amount: number
          category_id: string | null
          created_at: string | null
          description: string | null
          donation_id: string | null
          expected_date: string
          id: string
          is_recurring: boolean | null
          is_synced: boolean | null
          notes: string | null
          opportunity_id: string | null
          organization_id: string | null
          probability_percent: number | null
          recurrence_end_date: string | null
          source_name: string | null
          status: Database["public"]["Enums"]["burndown_income_status"] | null
          updated_at: string | null
        }
        Insert: {
          actual_date?: string | null
          amount: number
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          donation_id?: string | null
          expected_date: string
          id?: string
          is_recurring?: boolean | null
          is_synced?: boolean | null
          notes?: string | null
          opportunity_id?: string | null
          organization_id?: string | null
          probability_percent?: number | null
          recurrence_end_date?: string | null
          source_name?: string | null
          status?: Database["public"]["Enums"]["burndown_income_status"] | null
          updated_at?: string | null
        }
        Update: {
          actual_date?: string | null
          amount?: number
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          donation_id?: string | null
          expected_date?: string
          id?: string
          is_recurring?: boolean | null
          is_synced?: boolean | null
          notes?: string | null
          opportunity_id?: string | null
          organization_id?: string | null
          probability_percent?: number | null
          recurrence_end_date?: string | null
          source_name?: string | null
          status?: Database["public"]["Enums"]["burndown_income_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "burndown_income_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "burndown_income_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "burndown_income_entries_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "burndown_income_entries_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "grant_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "burndown_income_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      burndown_scenarios: {
        Row: {
          adjustments: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_baseline: boolean | null
          name: string
          organization_id: string | null
        }
        Insert: {
          adjustments?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_baseline?: boolean | null
          name: string
          organization_id?: string | null
        }
        Update: {
          adjustments?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_baseline?: boolean | null
          name?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "burndown_scenarios_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          attendees: Json | null
          body_html: string | null
          body_preview: string | null
          categories: string[] | null
          created_at: string | null
          end_time: string
          id: string
          importance: string | null
          is_online_meeting: boolean | null
          is_recurring: boolean | null
          location: string | null
          microsoft_event_id: string
          online_meeting_url: string | null
          organizer_email: string | null
          organizer_name: string | null
          prep_task_created: boolean | null
          prep_task_id: string | null
          recurrence_pattern: string | null
          sensitivity: string | null
          start_time: string
          subject: string
          synced_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attendees?: Json | null
          body_html?: string | null
          body_preview?: string | null
          categories?: string[] | null
          created_at?: string | null
          end_time: string
          id?: string
          importance?: string | null
          is_online_meeting?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          microsoft_event_id: string
          online_meeting_url?: string | null
          organizer_email?: string | null
          organizer_name?: string | null
          prep_task_created?: boolean | null
          prep_task_id?: string | null
          recurrence_pattern?: string | null
          sensitivity?: string | null
          start_time: string
          subject: string
          synced_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attendees?: Json | null
          body_html?: string | null
          body_preview?: string | null
          categories?: string[] | null
          created_at?: string | null
          end_time?: string
          id?: string
          importance?: string | null
          is_online_meeting?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          microsoft_event_id?: string
          online_meeting_url?: string | null
          organizer_email?: string | null
          organizer_name?: string | null
          prep_task_created?: boolean | null
          prep_task_id?: string | null
          recurrence_pattern?: string | null
          sensitivity?: string | null
          start_time?: string
          subject?: string
          synced_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_prep_task_id_fkey"
            columns: ["prep_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_sync_settings: {
        Row: {
          auto_create_tasks: boolean | null
          created_at: string | null
          exclude_all_day_events: boolean | null
          exclude_categories: string[] | null
          exclude_recurring: boolean | null
          id: string
          include_only_categories: string[] | null
          is_enabled: boolean | null
          last_sync_at: string | null
          minimum_meeting_duration_minutes: number | null
          sync_days_ahead: number | null
          task_lead_time_hours: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_create_tasks?: boolean | null
          created_at?: string | null
          exclude_all_day_events?: boolean | null
          exclude_categories?: string[] | null
          exclude_recurring?: boolean | null
          id?: string
          include_only_categories?: string[] | null
          is_enabled?: boolean | null
          last_sync_at?: string | null
          minimum_meeting_duration_minutes?: number | null
          sync_days_ahead?: number | null
          task_lead_time_hours?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_create_tasks?: boolean | null
          created_at?: string | null
          exclude_all_day_events?: boolean | null
          exclude_categories?: string[] | null
          exclude_recurring?: boolean | null
          id?: string
          include_only_categories?: string[] | null
          is_enabled?: boolean | null
          last_sync_at?: string | null
          minimum_meeting_duration_minutes?: number | null
          sync_days_ahead?: number | null
          task_lead_time_hours?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      collaborator_activity_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          metadata: Json | null
          project_id: string
          project_type: string
          resource_id: string | null
          resource_type: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          project_id: string
          project_type: string
          resource_id?: string | null
          resource_type?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string
          project_type?: string
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          field_name: string | null
          id: string
          is_resolved: boolean | null
          mentions: string[] | null
          parent_comment_id: string | null
          reactions: Json | null
          record_id: string
          record_type: string
          updated_at: string
          user_avatar: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          content: string
          created_at?: string
          field_name?: string | null
          id?: string
          is_resolved?: boolean | null
          mentions?: string[] | null
          parent_comment_id?: string | null
          reactions?: Json | null
          record_id: string
          record_type: string
          updated_at?: string
          user_avatar?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          content?: string
          created_at?: string
          field_name?: string | null
          id?: string
          is_resolved?: boolean | null
          mentions?: string[] | null
          parent_comment_id?: string | null
          reactions?: Json | null
          record_id?: string
          record_type?: string
          updated_at?: string
          user_avatar?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      constituent_grants: {
        Row: {
          constituent_id: string
          created_at: string | null
          created_by: string | null
          grant_opportunity_id: string
          id: string
          notes: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          constituent_id: string
          created_at?: string | null
          created_by?: string | null
          grant_opportunity_id: string
          id?: string
          notes?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          constituent_id?: string
          created_at?: string | null
          created_by?: string | null
          grant_opportunity_id?: string
          id?: string
          notes?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "constituent_grants_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "constituent_grants_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "constituent_grants_grant_opportunity_id_fkey"
            columns: ["grant_opportunity_id"]
            isOneToOne: false
            referencedRelation: "grant_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      constituent_relationships: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_date: string | null
          from_constituent_id: string
          id: string
          is_primary: boolean | null
          notes: string | null
          relationship_type_id: string
          start_date: string | null
          to_constituent_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          from_constituent_id: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          relationship_type_id: string
          start_date?: string | null
          to_constituent_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          from_constituent_id?: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          relationship_type_id?: string
          start_date?: string | null
          to_constituent_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "constituent_relationships_from_constituent_id_fkey"
            columns: ["from_constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "constituent_relationships_from_constituent_id_fkey"
            columns: ["from_constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "constituent_relationships_relationship_type_id_fkey"
            columns: ["relationship_type_id"]
            isOneToOne: false
            referencedRelation: "relationship_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "constituent_relationships_to_constituent_id_fkey"
            columns: ["to_constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "constituent_relationships_to_constituent_id_fkey"
            columns: ["to_constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
        ]
      }
      constituents: {
        Row: {
          active_pledge_count: number | null
          communication_preference:
            | Database["public"]["Enums"]["communication_preference"]
            | null
          created_at: string
          created_by: string | null
          do_not_call: boolean | null
          do_not_contact: boolean | null
          do_not_email: boolean | null
          do_not_mail: boolean | null
          donor_since: string | null
          donor_type: string | null
          email_engagement_score: number | null
          email_preferences: Json | null
          employer: string | null
          first_gift_date: string | null
          first_name: string | null
          full_legal_name: string
          giving_level: string | null
          home_phone: string | null
          household_id: string | null
          id: string
          last_activity_date: string | null
          last_gift_amount: number | null
          last_gift_date: string | null
          last_name: string | null
          last_soft_credit_date: string | null
          mailchimp_avg_click_rate: number | null
          mailchimp_avg_open_rate: number | null
          mailchimp_last_changed: string | null
          mailchimp_member_rating: number | null
          mailchimp_signup_date: string | null
          mailchimp_status: string | null
          mailchimp_subscriber_id: string | null
          mailchimp_tags: string[] | null
          mailchimp_vip: boolean | null
          mailing_city: string | null
          mailing_country: string | null
          mailing_postal_code: string | null
          mailing_state: string | null
          mailing_street: string | null
          mobile_phone: string | null
          organization_id: string | null
          outstanding_pledge_balance: number | null
          phone: string | null
          preferred_name: string | null
          primary_address: string | null
          primary_email: string | null
          salesforce_id: string | null
          salesforce_last_sync: string | null
          salutation: string | null
          soft_credit_count: number | null
          title: string | null
          total_lifetime_giving: number | null
          total_pledge_amount: number | null
          total_soft_credit_amount: number | null
          unsubscribe_date: string | null
          updated_at: string
        }
        Insert: {
          active_pledge_count?: number | null
          communication_preference?:
            | Database["public"]["Enums"]["communication_preference"]
            | null
          created_at?: string
          created_by?: string | null
          do_not_call?: boolean | null
          do_not_contact?: boolean | null
          do_not_email?: boolean | null
          do_not_mail?: boolean | null
          donor_since?: string | null
          donor_type?: string | null
          email_engagement_score?: number | null
          email_preferences?: Json | null
          employer?: string | null
          first_gift_date?: string | null
          first_name?: string | null
          full_legal_name: string
          giving_level?: string | null
          home_phone?: string | null
          household_id?: string | null
          id?: string
          last_activity_date?: string | null
          last_gift_amount?: number | null
          last_gift_date?: string | null
          last_name?: string | null
          last_soft_credit_date?: string | null
          mailchimp_avg_click_rate?: number | null
          mailchimp_avg_open_rate?: number | null
          mailchimp_last_changed?: string | null
          mailchimp_member_rating?: number | null
          mailchimp_signup_date?: string | null
          mailchimp_status?: string | null
          mailchimp_subscriber_id?: string | null
          mailchimp_tags?: string[] | null
          mailchimp_vip?: boolean | null
          mailing_city?: string | null
          mailing_country?: string | null
          mailing_postal_code?: string | null
          mailing_state?: string | null
          mailing_street?: string | null
          mobile_phone?: string | null
          organization_id?: string | null
          outstanding_pledge_balance?: number | null
          phone?: string | null
          preferred_name?: string | null
          primary_address?: string | null
          primary_email?: string | null
          salesforce_id?: string | null
          salesforce_last_sync?: string | null
          salutation?: string | null
          soft_credit_count?: number | null
          title?: string | null
          total_lifetime_giving?: number | null
          total_pledge_amount?: number | null
          total_soft_credit_amount?: number | null
          unsubscribe_date?: string | null
          updated_at?: string
        }
        Update: {
          active_pledge_count?: number | null
          communication_preference?:
            | Database["public"]["Enums"]["communication_preference"]
            | null
          created_at?: string
          created_by?: string | null
          do_not_call?: boolean | null
          do_not_contact?: boolean | null
          do_not_email?: boolean | null
          do_not_mail?: boolean | null
          donor_since?: string | null
          donor_type?: string | null
          email_engagement_score?: number | null
          email_preferences?: Json | null
          employer?: string | null
          first_gift_date?: string | null
          first_name?: string | null
          full_legal_name?: string
          giving_level?: string | null
          home_phone?: string | null
          household_id?: string | null
          id?: string
          last_activity_date?: string | null
          last_gift_amount?: number | null
          last_gift_date?: string | null
          last_name?: string | null
          last_soft_credit_date?: string | null
          mailchimp_avg_click_rate?: number | null
          mailchimp_avg_open_rate?: number | null
          mailchimp_last_changed?: string | null
          mailchimp_member_rating?: number | null
          mailchimp_signup_date?: string | null
          mailchimp_status?: string | null
          mailchimp_subscriber_id?: string | null
          mailchimp_tags?: string[] | null
          mailchimp_vip?: boolean | null
          mailing_city?: string | null
          mailing_country?: string | null
          mailing_postal_code?: string | null
          mailing_state?: string | null
          mailing_street?: string | null
          mobile_phone?: string | null
          organization_id?: string | null
          outstanding_pledge_balance?: number | null
          phone?: string | null
          preferred_name?: string | null
          primary_address?: string | null
          primary_email?: string | null
          salesforce_id?: string | null
          salesforce_last_sync?: string | null
          salutation?: string | null
          soft_credit_count?: number | null
          title?: string | null
          total_lifetime_giving?: number | null
          total_pledge_amount?: number | null
          total_soft_credit_amount?: number | null
          unsubscribe_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "constituents_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "constituents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_repository: {
        Row: {
          category: string | null
          content: string
          content_type: string
          created_at: string | null
          created_by: string | null
          embedding: string | null
          embedding_model: string | null
          id: string
          is_approved: boolean | null
          is_template: boolean | null
          last_embedded_at: string | null
          last_used_at: string | null
          tags: string[] | null
          title: string
          token_count: number | null
          updated_at: string | null
          use_count: number | null
        }
        Insert: {
          category?: string | null
          content: string
          content_type: string
          created_at?: string | null
          created_by?: string | null
          embedding?: string | null
          embedding_model?: string | null
          id?: string
          is_approved?: boolean | null
          is_template?: boolean | null
          last_embedded_at?: string | null
          last_used_at?: string | null
          tags?: string[] | null
          title: string
          token_count?: number | null
          updated_at?: string | null
          use_count?: number | null
        }
        Update: {
          category?: string | null
          content?: string
          content_type?: string
          created_at?: string | null
          created_by?: string | null
          embedding?: string | null
          embedding_model?: string | null
          id?: string
          is_approved?: boolean | null
          is_template?: boolean | null
          last_embedded_at?: string | null
          last_used_at?: string | null
          tags?: string[] | null
          title?: string
          token_count?: number | null
          updated_at?: string | null
          use_count?: number | null
        }
        Relationships: []
      }
      content_repository_assets: {
        Row: {
          asset_type: Database["public"]["Enums"]["asset_type"]
          content_tags: Database["public"]["Enums"]["content_tag"][] | null
          created_at: string | null
          created_by: string | null
          description: string | null
          file_size: number | null
          file_url: string | null
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          asset_type?: Database["public"]["Enums"]["asset_type"]
          content_tags?: Database["public"]["Enums"]["content_tag"][] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["asset_type"]
          content_tags?: Database["public"]["Enums"]["content_tag"][] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      document_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      document_chunks: {
        Row: {
          chunk_index: number
          chunk_metadata: Json | null
          content: string
          created_at: string | null
          document_id: string
          embedding: string | null
          id: string
          word_count: number | null
        }
        Insert: {
          chunk_index: number
          chunk_metadata?: Json | null
          content: string
          created_at?: string | null
          document_id: string
          embedding?: string | null
          id?: string
          word_count?: number | null
        }
        Update: {
          chunk_index?: number
          chunk_metadata?: Json | null
          content?: string
          created_at?: string | null
          document_id?: string
          embedding?: string | null
          id?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "grant_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_campaigns: {
        Row: {
          allow_anonymous: boolean | null
          campaign_type: string | null
          created_at: string | null
          created_by: string | null
          current_amount: number | null
          description: string | null
          donor_count: number | null
          end_date: string | null
          goal_amount: number | null
          hero_image_url: string | null
          id: string
          name: string
          page_slug: string | null
          show_donor_wall: boolean | null
          show_progress_bar: boolean | null
          start_date: string | null
          status: string | null
          stripe_product_id: string | null
          thank_you_email_template_id: string | null
          thank_you_message: string | null
          updated_at: string | null
        }
        Insert: {
          allow_anonymous?: boolean | null
          campaign_type?: string | null
          created_at?: string | null
          created_by?: string | null
          current_amount?: number | null
          description?: string | null
          donor_count?: number | null
          end_date?: string | null
          goal_amount?: number | null
          hero_image_url?: string | null
          id?: string
          name: string
          page_slug?: string | null
          show_donor_wall?: boolean | null
          show_progress_bar?: boolean | null
          start_date?: string | null
          status?: string | null
          stripe_product_id?: string | null
          thank_you_email_template_id?: string | null
          thank_you_message?: string | null
          updated_at?: string | null
        }
        Update: {
          allow_anonymous?: boolean | null
          campaign_type?: string | null
          created_at?: string | null
          created_by?: string | null
          current_amount?: number | null
          description?: string | null
          donor_count?: number | null
          end_date?: string | null
          goal_amount?: number | null
          hero_image_url?: string | null
          id?: string
          name?: string
          page_slug?: string | null
          show_donor_wall?: boolean | null
          show_progress_bar?: boolean | null
          start_date?: string | null
          status?: string | null
          stripe_product_id?: string | null
          thank_you_email_template_id?: string | null
          thank_you_message?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donation_campaigns_thank_you_email_template_id_fkey"
            columns: ["thank_you_email_template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_forms: {
        Row: {
          allow_cover_fees: boolean | null
          allow_custom_amount: boolean | null
          allow_recurring: boolean | null
          allow_tribute_gifts: boolean | null
          button_color: string | null
          button_text: string | null
          campaign_id: string | null
          created_at: string | null
          custom_fields: Json | null
          fund_designations: Json | null
          id: string
          is_active: boolean | null
          minimum_amount: number | null
          name: string
          processing_fee_percent: number | null
          recurring_frequencies: Json | null
          suggested_amounts: Json | null
          updated_at: string | null
        }
        Insert: {
          allow_cover_fees?: boolean | null
          allow_custom_amount?: boolean | null
          allow_recurring?: boolean | null
          allow_tribute_gifts?: boolean | null
          button_color?: string | null
          button_text?: string | null
          campaign_id?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          fund_designations?: Json | null
          id?: string
          is_active?: boolean | null
          minimum_amount?: number | null
          name: string
          processing_fee_percent?: number | null
          recurring_frequencies?: Json | null
          suggested_amounts?: Json | null
          updated_at?: string | null
        }
        Update: {
          allow_cover_fees?: boolean | null
          allow_custom_amount?: boolean | null
          allow_recurring?: boolean | null
          allow_tribute_gifts?: boolean | null
          button_color?: string | null
          button_text?: string | null
          campaign_id?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          fund_designations?: Json | null
          id?: string
          is_active?: boolean | null
          minimum_amount?: number | null
          name?: string
          processing_fee_percent?: number | null
          recurring_frequencies?: Json | null
          suggested_amounts?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donation_forms_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "donation_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_activities: {
        Row: {
          activity_date: string
          activity_type: string
          campaign_id: string | null
          constituent_id: string
          created_at: string | null
          id: string
          ip_address: string | null
          mailchimp_action_id: string | null
          url: string | null
          user_agent: string | null
        }
        Insert: {
          activity_date: string
          activity_type: string
          campaign_id?: string | null
          constituent_id: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          mailchimp_action_id?: string | null
          url?: string | null
          user_agent?: string | null
        }
        Update: {
          activity_date?: string
          activity_type?: string
          campaign_id?: string | null
          constituent_id?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          mailchimp_action_id?: string | null
          url?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_activities_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mailchimp_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_activities_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_activities_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaign_audiences: {
        Row: {
          audience_type: string
          campaign_id: string
          created_at: string
          custom_query: Json | null
          id: string
          mailchimp_segment_id: string | null
          recipient_count: number | null
          segment_id: string | null
          tag_filter: string[] | null
        }
        Insert: {
          audience_type?: string
          campaign_id: string
          created_at?: string
          custom_query?: Json | null
          id?: string
          mailchimp_segment_id?: string | null
          recipient_count?: number | null
          segment_id?: string | null
          tag_filter?: string[] | null
        }
        Update: {
          audience_type?: string
          campaign_id?: string
          created_at?: string
          custom_query?: Json | null
          id?: string
          mailchimp_segment_id?: string | null
          recipient_count?: number | null
          segment_id?: string | null
          tag_filter?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_audiences_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaign_stats: {
        Row: {
          bounces: number | null
          campaign_id: string
          click_rate: number | null
          clicks: number | null
          created_at: string
          emails_sent: number | null
          id: string
          last_synced_at: string | null
          open_rate: number | null
          opens: number | null
          spam_reports: number | null
          unique_clicks: number | null
          unique_opens: number | null
          unsubscribes: number | null
          updated_at: string
        }
        Insert: {
          bounces?: number | null
          campaign_id: string
          click_rate?: number | null
          clicks?: number | null
          created_at?: string
          emails_sent?: number | null
          id?: string
          last_synced_at?: string | null
          open_rate?: number | null
          opens?: number | null
          spam_reports?: number | null
          unique_clicks?: number | null
          unique_opens?: number | null
          unsubscribes?: number | null
          updated_at?: string
        }
        Update: {
          bounces?: number | null
          campaign_id?: string
          click_rate?: number | null
          clicks?: number | null
          created_at?: string
          emails_sent?: number | null
          id?: string
          last_synced_at?: string | null
          open_rate?: number | null
          opens?: number | null
          spam_reports?: number | null
          unique_clicks?: number | null
          unique_opens?: number | null
          unsubscribes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_stats_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          canva_design_id: string | null
          constituent_list: string[] | null
          content_html: string | null
          content_text: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          from_name: string | null
          id: string
          mailchimp_campaign_id: string | null
          mailchimp_web_id: string | null
          name: string
          preview_text: string | null
          reply_to: string | null
          scheduled_at: string | null
          segment_criteria: Json | null
          segment_type: string | null
          sent_at: string | null
          status: string | null
          subject_line: string
          template_id: string | null
          template_source: string | null
          total_bounced: number | null
          total_clicked: number | null
          total_delivered: number | null
          total_opened: number | null
          total_recipients: number | null
          total_sent: number | null
          total_unsubscribed: number | null
          updated_at: string | null
        }
        Insert: {
          canva_design_id?: string | null
          constituent_list?: string[] | null
          content_html?: string | null
          content_text?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          from_name?: string | null
          id?: string
          mailchimp_campaign_id?: string | null
          mailchimp_web_id?: string | null
          name: string
          preview_text?: string | null
          reply_to?: string | null
          scheduled_at?: string | null
          segment_criteria?: Json | null
          segment_type?: string | null
          sent_at?: string | null
          status?: string | null
          subject_line: string
          template_id?: string | null
          template_source?: string | null
          total_bounced?: number | null
          total_clicked?: number | null
          total_delivered?: number | null
          total_opened?: number | null
          total_recipients?: number | null
          total_sent?: number | null
          total_unsubscribed?: number | null
          updated_at?: string | null
        }
        Update: {
          canva_design_id?: string | null
          constituent_list?: string[] | null
          content_html?: string | null
          content_text?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          from_name?: string | null
          id?: string
          mailchimp_campaign_id?: string | null
          mailchimp_web_id?: string | null
          name?: string
          preview_text?: string | null
          reply_to?: string | null
          scheduled_at?: string | null
          segment_criteria?: Json | null
          segment_type?: string | null
          sent_at?: string | null
          status?: string | null
          subject_line?: string
          template_id?: string | null
          template_source?: string | null
          total_bounced?: number | null
          total_clicked?: number | null
          total_delivered?: number | null
          total_opened?: number | null
          total_recipients?: number | null
          total_sent?: number | null
          total_unsubscribed?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_events: {
        Row: {
          email_send_id: string
          event_at: string | null
          event_data: Json | null
          event_type: string
          id: string
        }
        Insert: {
          email_send_id: string
          event_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
        }
        Update: {
          email_send_id?: string
          event_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_events_email_send_id_fkey"
            columns: ["email_send_id"]
            isOneToOne: false
            referencedRelation: "email_sends"
            referencedColumns: ["id"]
          },
        ]
      }
      email_log: {
        Row: {
          body_html: string | null
          body_preview: string | null
          category: string | null
          constituent_id: string | null
          created_at: string
          error_message: string | null
          id: string
          microsoft_message_id: string | null
          recipient_email: string
          recipient_name: string | null
          related_record_id: string | null
          related_record_type: string | null
          sent_at: string | null
          sent_by_user_id: string | null
          status: string | null
          subject: string
          template_id: string | null
        }
        Insert: {
          body_html?: string | null
          body_preview?: string | null
          category?: string | null
          constituent_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          microsoft_message_id?: string | null
          recipient_email: string
          recipient_name?: string | null
          related_record_id?: string | null
          related_record_type?: string | null
          sent_at?: string | null
          sent_by_user_id?: string | null
          status?: string | null
          subject: string
          template_id?: string | null
        }
        Update: {
          body_html?: string | null
          body_preview?: string | null
          category?: string | null
          constituent_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          microsoft_message_id?: string | null
          recipient_email?: string
          recipient_name?: string | null
          related_record_id?: string | null
          related_record_type?: string | null
          sent_at?: string | null
          sent_by_user_id?: string | null
          status?: string | null
          subject?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_log_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_log_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_log_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_merge_fields: {
        Row: {
          created_at: string | null
          default_value: string | null
          field_category: string | null
          field_label: string
          field_name: string
          id: string
          is_active: boolean | null
          placeholder: string
          source_column: string
          source_table: string
        }
        Insert: {
          created_at?: string | null
          default_value?: string | null
          field_category?: string | null
          field_label: string
          field_name: string
          id?: string
          is_active?: boolean | null
          placeholder: string
          source_column: string
          source_table: string
        }
        Update: {
          created_at?: string | null
          default_value?: string | null
          field_category?: string | null
          field_label?: string
          field_name?: string
          id?: string
          is_active?: boolean | null
          placeholder?: string
          source_column?: string
          source_table?: string
        }
        Relationships: []
      }
      email_queue: {
        Row: {
          attempts: number | null
          body_html: string
          body_text: string | null
          category: string | null
          constituent_id: string | null
          created_at: string
          created_by_user_id: string | null
          id: string
          last_attempt_at: string | null
          last_error: string | null
          max_attempts: number | null
          priority: number | null
          recipient_email: string
          recipient_name: string | null
          related_record_id: string | null
          related_record_type: string | null
          scheduled_for: string | null
          status: string | null
          subject: string
        }
        Insert: {
          attempts?: number | null
          body_html: string
          body_text?: string | null
          category?: string | null
          constituent_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          last_attempt_at?: string | null
          last_error?: string | null
          max_attempts?: number | null
          priority?: number | null
          recipient_email: string
          recipient_name?: string | null
          related_record_id?: string | null
          related_record_type?: string | null
          scheduled_for?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          attempts?: number | null
          body_html?: string
          body_text?: string | null
          category?: string | null
          constituent_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          last_attempt_at?: string | null
          last_error?: string | null
          max_attempts?: number | null
          priority?: number | null
          recipient_email?: string
          recipient_name?: string | null
          related_record_id?: string | null
          related_record_type?: string | null
          scheduled_for?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_queue_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
        ]
      }
      email_reminders_sent: {
        Row: {
          email_log_id: string | null
          id: string
          record_id: string
          record_type: string
          reminder_interval: string
          reminder_type: string
          sent_at: string
        }
        Insert: {
          email_log_id?: string | null
          id?: string
          record_id: string
          record_type: string
          reminder_interval: string
          reminder_type: string
          sent_at?: string
        }
        Update: {
          email_log_id?: string | null
          id?: string
          record_id?: string
          record_type?: string
          reminder_interval?: string
          reminder_type?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_reminders_sent_email_log_id_fkey"
            columns: ["email_log_id"]
            isOneToOne: false
            referencedRelation: "email_log"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sends: {
        Row: {
          bounced_at: string | null
          campaign_id: string | null
          click_token: string | null
          clicked_at: string | null
          constituent_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          open_token: string | null
          opened_at: string | null
          resend_email_id: string | null
          sent_at: string | null
          status: string | null
          subject: string
          to_email: string
        }
        Insert: {
          bounced_at?: string | null
          campaign_id?: string | null
          click_token?: string | null
          clicked_at?: string | null
          constituent_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          open_token?: string | null
          opened_at?: string | null
          resend_email_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          to_email: string
        }
        Update: {
          bounced_at?: string | null
          campaign_id?: string | null
          click_token?: string | null
          clicked_at?: string | null
          constituent_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          open_token?: string | null
          opened_at?: string | null
          resend_email_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sends_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sends_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
        ]
      }
      email_settings: {
        Row: {
          access_token: string | null
          client_id: string | null
          client_secret: string | null
          created_at: string
          id: string
          is_configured: boolean | null
          refresh_token: string | null
          sender_display_name: string | null
          sender_email: string | null
          tenant_id: string | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string
          id?: string
          is_configured?: boolean | null
          refresh_token?: string | null
          sender_display_name?: string | null
          sender_email?: string | null
          tenant_id?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string
          id?: string
          is_configured?: boolean | null
          refresh_token?: string | null
          sender_display_name?: string | null
          sender_email?: string | null
          tenant_id?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_task_suggestions: {
        Row: {
          ai_confidence: number | null
          ai_reasoning: string | null
          created_at: string | null
          created_task_id: string | null
          id: string
          matched_constituent_id: string | null
          matched_grant_opportunity_id: string | null
          processed_email_id: string
          reviewed_at: string | null
          source_snippet: string | null
          status: string | null
          suggested_category: string | null
          suggested_description: string | null
          suggested_due_date: string | null
          suggested_priority: string | null
          suggested_title: string
          user_id: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_reasoning?: string | null
          created_at?: string | null
          created_task_id?: string | null
          id?: string
          matched_constituent_id?: string | null
          matched_grant_opportunity_id?: string | null
          processed_email_id: string
          reviewed_at?: string | null
          source_snippet?: string | null
          status?: string | null
          suggested_category?: string | null
          suggested_description?: string | null
          suggested_due_date?: string | null
          suggested_priority?: string | null
          suggested_title: string
          user_id: string
        }
        Update: {
          ai_confidence?: number | null
          ai_reasoning?: string | null
          created_at?: string | null
          created_task_id?: string | null
          id?: string
          matched_constituent_id?: string | null
          matched_grant_opportunity_id?: string | null
          processed_email_id?: string
          reviewed_at?: string | null
          source_snippet?: string | null
          status?: string | null
          suggested_category?: string | null
          suggested_description?: string | null
          suggested_due_date?: string | null
          suggested_priority?: string | null
          suggested_title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_task_suggestions_created_task_id_fkey"
            columns: ["created_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_task_suggestions_matched_constituent_id_fkey"
            columns: ["matched_constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_task_suggestions_matched_constituent_id_fkey"
            columns: ["matched_constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_task_suggestions_matched_grant_opportunity_id_fkey"
            columns: ["matched_grant_opportunity_id"]
            isOneToOne: false
            referencedRelation: "grant_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_task_suggestions_processed_email_id_fkey"
            columns: ["processed_email_id"]
            isOneToOne: false
            referencedRelation: "processed_emails"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          canva_design_id: string | null
          canva_edit_url: string | null
          canva_view_url: string | null
          category: string | null
          content_text: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          html_content: string | null
          id: string
          is_active: boolean | null
          last_exported_at: string | null
          merge_fields: Json | null
          name: string
          preview_text: string | null
          source: string | null
          subject_line: string | null
          template_type: string
          thumbnail_url: string | null
          updated_at: string | null
        }
        Insert: {
          canva_design_id?: string | null
          canva_edit_url?: string | null
          canva_view_url?: string | null
          category?: string | null
          content_text?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          html_content?: string | null
          id?: string
          is_active?: boolean | null
          last_exported_at?: string | null
          merge_fields?: Json | null
          name: string
          preview_text?: string | null
          source?: string | null
          subject_line?: string | null
          template_type: string
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Update: {
          canva_design_id?: string | null
          canva_edit_url?: string | null
          canva_view_url?: string | null
          category?: string | null
          content_text?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          html_content?: string | null
          id?: string
          is_active?: boolean | null
          last_exported_at?: string | null
          merge_fields?: Json | null
          name?: string
          preview_text?: string | null
          source?: string | null
          subject_line?: string | null
          template_type?: string
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_unsubscribes: {
        Row: {
          campaign_id: string | null
          constituent_id: string | null
          created_at: string | null
          email_address: string
          id: string
          is_global: boolean | null
          list_id: string | null
          unsubscribe_reason: string | null
          unsubscribed_at: string
        }
        Insert: {
          campaign_id?: string | null
          constituent_id?: string | null
          created_at?: string | null
          email_address: string
          id?: string
          is_global?: boolean | null
          list_id?: string | null
          unsubscribe_reason?: string | null
          unsubscribed_at: string
        }
        Update: {
          campaign_id?: string | null
          constituent_id?: string | null
          created_at?: string | null
          email_address?: string
          id?: string
          is_global?: boolean | null
          list_id?: string | null
          unsubscribe_reason?: string | null
          unsubscribed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_unsubscribes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mailchimp_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_unsubscribes_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_unsubscribes_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_feedback: {
        Row: {
          created_at: string | null
          created_by: string | null
          employee_id: string
          evaluator_email: string | null
          evaluator_name: string
          evaluator_type: Database["public"]["Enums"]["evaluator_type"]
          event_date: string
          event_name: string
          feedback_type: Database["public"]["Enums"]["feedback_type"]
          id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          employee_id: string
          evaluator_email?: string | null
          evaluator_name: string
          evaluator_type: Database["public"]["Enums"]["evaluator_type"]
          event_date: string
          event_name: string
          feedback_type: Database["public"]["Enums"]["feedback_type"]
          id?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          employee_id?: string
          evaluator_email?: string | null
          evaluator_name?: string
          evaluator_type?: Database["public"]["Enums"]["evaluator_type"]
          event_date?: string
          event_name?: string
          feedback_type?: Database["public"]["Enums"]["feedback_type"]
          id?: string
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          checked_in_at: string | null
          confirmation_number: string | null
          constituent_id: string | null
          created_at: string | null
          event_id: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_status: string | null
          quantity: number | null
          registrant_email: string
          registrant_name: string | null
          registrant_phone: string | null
          status: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          ticket_type_id: string | null
          total_amount: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          checked_in_at?: string | null
          confirmation_number?: string | null
          constituent_id?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_status?: string | null
          quantity?: number | null
          registrant_email: string
          registrant_name?: string | null
          registrant_phone?: string | null
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          ticket_type_id?: string | null
          total_amount: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          checked_in_at?: string | null
          confirmation_number?: string | null
          constituent_id?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_status?: string | null
          quantity?: number | null
          registrant_email?: string
          registrant_name?: string | null
          registrant_phone?: string | null
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          ticket_type_id?: string | null
          total_amount?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      event_ticket_types: {
        Row: {
          created_at: string | null
          description: string | null
          early_bird_ends_at: string | null
          early_bird_price: number | null
          event_id: string
          id: string
          is_active: boolean | null
          name: string
          price: number
          quantity_available: number | null
          quantity_sold: number | null
          sales_end_at: string | null
          sales_start_at: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          early_bird_ends_at?: string | null
          early_bird_price?: number | null
          event_id: string
          id?: string
          is_active?: boolean | null
          name: string
          price?: number
          quantity_available?: number | null
          quantity_sold?: number | null
          sales_end_at?: string | null
          sales_start_at?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          early_bird_ends_at?: string | null
          early_bird_price?: number | null
          event_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          quantity_available?: number | null
          quantity_sold?: number | null
          sales_end_at?: string | null
          sales_start_at?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          capacity: number | null
          city: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          event_type: string | null
          hero_image_url: string | null
          id: string
          is_virtual: boolean | null
          location: string | null
          name: string
          organizer_id: string | null
          start_date: string | null
          state: string | null
          status: string | null
          updated_at: string | null
          virtual_url: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          hero_image_url?: string | null
          id?: string
          is_virtual?: boolean | null
          location?: string | null
          name: string
          organizer_id?: string | null
          start_date?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          virtual_url?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          capacity?: number | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          hero_image_url?: string | null
          id?: string
          is_virtual?: boolean | null
          location?: string | null
          name?: string
          organizer_id?: string | null
          start_date?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string | null
          virtual_url?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      failed_payments: {
        Row: {
          amount: number | null
          constituent_id: string | null
          created_at: string | null
          error_code: string | null
          error_message: string | null
          id: string
          last_retry_at: string | null
          resolution_notes: string | null
          resolved: boolean | null
          resolved_at: string | null
          retry_count: number | null
          stripe_payment_intent_id: string | null
          stripe_subscription_id: string | null
        }
        Insert: {
          amount?: number | null
          constituent_id?: string | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          last_retry_at?: string | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          retry_count?: number | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          amount?: number | null
          constituent_id?: string | null
          created_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          last_retry_at?: string | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          retry_count?: number | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "failed_payments_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "failed_payments_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_comments: {
        Row: {
          feedback_id: string
          id: string
          question_key: string
          response: string
        }
        Insert: {
          feedback_id: string
          id?: string
          question_key: string
          response: string
        }
        Update: {
          feedback_id?: string
          id?: string
          question_key?: string
          response?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_comments_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "employee_feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_ratings: {
        Row: {
          category: string
          feedback_id: string
          id: string
          score: number
          weight: number | null
        }
        Insert: {
          category: string
          feedback_id: string
          id?: string
          score: number
          weight?: number | null
        }
        Update: {
          category?: string
          feedback_id?: string
          id?: string
          score?: number
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_ratings_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "employee_feedback"
            referencedColumns: ["id"]
          },
        ]
      }
      fireflies_settings: {
        Row: {
          api_key_configured: boolean | null
          api_key_encrypted: string | null
          auto_import_enabled: boolean | null
          connected_email: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          only_host_meetings: boolean | null
          organization_id: string | null
          sync_frequency: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_key_configured?: boolean | null
          api_key_encrypted?: string | null
          auto_import_enabled?: boolean | null
          connected_email?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          only_host_meetings?: boolean | null
          organization_id?: string | null
          sync_frequency?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_key_configured?: boolean | null
          api_key_encrypted?: string | null
          auto_import_enabled?: boolean | null
          connected_email?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          only_host_meetings?: boolean | null
          organization_id?: string | null
          sync_frequency?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fireflies_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_soft_credits: {
        Row: {
          amount: number
          constituent_id: string
          created_at: string | null
          created_by: string | null
          credit_type: string
          gift_id: string
          id: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          constituent_id: string
          created_at?: string | null
          created_by?: string | null
          credit_type: string
          gift_id: string
          id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          constituent_id?: string
          created_at?: string | null
          created_by?: string | null
          credit_type?: string
          gift_id?: string
          id?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_soft_credits_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_soft_credits_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_soft_credits_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
        ]
      }
      gifts: {
        Row: {
          acknowledgment_status: Database["public"]["Enums"]["acknowledgment_status"]
          amount: number
          campaign_source: string | null
          constituent_id: string
          created_at: string
          created_by: string | null
          date_received: string
          fund_designation: Database["public"]["Enums"]["fund_designation"]
          id: string
          is_pledge: boolean | null
          notes: string | null
          pledge_balance: number | null
          pledge_end_date: string | null
          pledge_frequency: string | null
          pledge_next_payment_date: string | null
          pledge_payment_count: number | null
          pledge_reminder_enabled: boolean | null
          pledge_start_date: string | null
          pledge_status: string | null
          pledge_total_amount: number | null
          updated_at: string
        }
        Insert: {
          acknowledgment_status?: Database["public"]["Enums"]["acknowledgment_status"]
          amount: number
          campaign_source?: string | null
          constituent_id: string
          created_at?: string
          created_by?: string | null
          date_received?: string
          fund_designation?: Database["public"]["Enums"]["fund_designation"]
          id?: string
          is_pledge?: boolean | null
          notes?: string | null
          pledge_balance?: number | null
          pledge_end_date?: string | null
          pledge_frequency?: string | null
          pledge_next_payment_date?: string | null
          pledge_payment_count?: number | null
          pledge_reminder_enabled?: boolean | null
          pledge_start_date?: string | null
          pledge_status?: string | null
          pledge_total_amount?: number | null
          updated_at?: string
        }
        Update: {
          acknowledgment_status?: Database["public"]["Enums"]["acknowledgment_status"]
          amount?: number
          campaign_source?: string | null
          constituent_id?: string
          created_at?: string
          created_by?: string | null
          date_received?: string
          fund_designation?: Database["public"]["Enums"]["fund_designation"]
          id?: string
          is_pledge?: boolean | null
          notes?: string | null
          pledge_balance?: number | null
          pledge_end_date?: string | null
          pledge_frequency?: string | null
          pledge_next_payment_date?: string | null
          pledge_payment_count?: number | null
          pledge_reminder_enabled?: boolean | null
          pledge_start_date?: string | null
          pledge_status?: string | null
          pledge_total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gifts_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gifts_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
        ]
      }
      givebutter_campaigns: {
        Row: {
          campaign_code: string | null
          campaign_type: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          fund_designation: string | null
          givebutter_id: number
          goal_amount: number | null
          id: string
          internal_campaign_id: string | null
          raised_amount: number | null
          start_date: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          campaign_code?: string | null
          campaign_type?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          fund_designation?: string | null
          givebutter_id: number
          goal_amount?: number | null
          id?: string
          internal_campaign_id?: string | null
          raised_amount?: number | null
          start_date?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          campaign_code?: string | null
          campaign_type?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          fund_designation?: string | null
          givebutter_id?: number
          goal_amount?: number | null
          id?: string
          internal_campaign_id?: string | null
          raised_amount?: number | null
          start_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "givebutter_campaigns_internal_campaign_id_fkey"
            columns: ["internal_campaign_id"]
            isOneToOne: false
            referencedRelation: "donation_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      givebutter_config: {
        Row: {
          api_key: string
          created_at: string | null
          id: string
          last_sync_at: string | null
          organization_id: string | null
          sync_enabled: boolean | null
          updated_at: string | null
          webhook_secret: string | null
        }
        Insert: {
          api_key: string
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          organization_id?: string | null
          sync_enabled?: boolean | null
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Update: {
          api_key?: string
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          organization_id?: string | null
          sync_enabled?: boolean | null
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "givebutter_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      givebutter_contacts: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          company: string | null
          constituent_id: string | null
          country: string | null
          created_at: string | null
          custom_fields: Json | null
          email: string | null
          external_ids: Json | null
          first_name: string | null
          givebutter_created_at: string | null
          givebutter_id: number
          givebutter_updated_at: string | null
          id: string
          is_address_subscribed: boolean | null
          is_email_subscribed: boolean | null
          is_phone_subscribed: boolean | null
          last_name: string | null
          match_confidence: number | null
          match_status: string | null
          middle_name: string | null
          phone: string | null
          postal_code: string | null
          recurring_contributions: number | null
          state: string | null
          tags: Json | null
          title: string | null
          total_contributions: number | null
          updated_at: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company?: string | null
          constituent_id?: string | null
          country?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          email?: string | null
          external_ids?: Json | null
          first_name?: string | null
          givebutter_created_at?: string | null
          givebutter_id: number
          givebutter_updated_at?: string | null
          id?: string
          is_address_subscribed?: boolean | null
          is_email_subscribed?: boolean | null
          is_phone_subscribed?: boolean | null
          last_name?: string | null
          match_confidence?: number | null
          match_status?: string | null
          middle_name?: string | null
          phone?: string | null
          postal_code?: string | null
          recurring_contributions?: number | null
          state?: string | null
          tags?: Json | null
          title?: string | null
          total_contributions?: number | null
          updated_at?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company?: string | null
          constituent_id?: string | null
          country?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          email?: string | null
          external_ids?: Json | null
          first_name?: string | null
          givebutter_created_at?: string | null
          givebutter_id?: number
          givebutter_updated_at?: string | null
          id?: string
          is_address_subscribed?: boolean | null
          is_email_subscribed?: boolean | null
          is_phone_subscribed?: boolean | null
          last_name?: string | null
          match_confidence?: number | null
          match_status?: string | null
          middle_name?: string | null
          phone?: string | null
          postal_code?: string | null
          recurring_contributions?: number | null
          state?: string | null
          tags?: Json | null
          title?: string | null
          total_contributions?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "givebutter_contacts_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "givebutter_contacts_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
        ]
      }
      givebutter_plans: {
        Row: {
          amount: number
          campaign_code: string | null
          canceled_at: string | null
          cancellation_reason: string | null
          constituent_id: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          frequency: string
          givebutter_campaign_id: number | null
          givebutter_contact_id: number | null
          givebutter_id: number
          id: string
          last_name: string | null
          next_billing_date: string | null
          pause_until: string | null
          paused_at: string | null
          payment_method: string | null
          phone: string | null
          plan_created_at: string | null
          plan_updated_at: string | null
          pledge_gift_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          campaign_code?: string | null
          canceled_at?: string | null
          cancellation_reason?: string | null
          constituent_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          frequency: string
          givebutter_campaign_id?: number | null
          givebutter_contact_id?: number | null
          givebutter_id: number
          id?: string
          last_name?: string | null
          next_billing_date?: string | null
          pause_until?: string | null
          paused_at?: string | null
          payment_method?: string | null
          phone?: string | null
          plan_created_at?: string | null
          plan_updated_at?: string | null
          pledge_gift_id?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          campaign_code?: string | null
          canceled_at?: string | null
          cancellation_reason?: string | null
          constituent_id?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          frequency?: string
          givebutter_campaign_id?: number | null
          givebutter_contact_id?: number | null
          givebutter_id?: number
          id?: string
          last_name?: string | null
          next_billing_date?: string | null
          pause_until?: string | null
          paused_at?: string | null
          payment_method?: string | null
          phone?: string | null
          plan_created_at?: string | null
          plan_updated_at?: string | null
          pledge_gift_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "givebutter_plans_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "givebutter_plans_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "givebutter_plans_pledge_gift_id_fkey"
            columns: ["pledge_gift_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
        ]
      }
      givebutter_tickets: {
        Row: {
          attendee_email: string | null
          attendee_first_name: string | null
          attendee_last_name: string | null
          campaign_code: string | null
          checked_in_at: string | null
          constituent_id: string | null
          created_at: string | null
          event_registration_id: string | null
          givebutter_campaign_id: number | null
          givebutter_id: string
          givebutter_transaction_id: string | null
          id: string
          price: number | null
          quantity: number | null
          status: string | null
          ticket_name: string | null
          ticket_type: string | null
          updated_at: string | null
        }
        Insert: {
          attendee_email?: string | null
          attendee_first_name?: string | null
          attendee_last_name?: string | null
          campaign_code?: string | null
          checked_in_at?: string | null
          constituent_id?: string | null
          created_at?: string | null
          event_registration_id?: string | null
          givebutter_campaign_id?: number | null
          givebutter_id: string
          givebutter_transaction_id?: string | null
          id?: string
          price?: number | null
          quantity?: number | null
          status?: string | null
          ticket_name?: string | null
          ticket_type?: string | null
          updated_at?: string | null
        }
        Update: {
          attendee_email?: string | null
          attendee_first_name?: string | null
          attendee_last_name?: string | null
          campaign_code?: string | null
          checked_in_at?: string | null
          constituent_id?: string | null
          created_at?: string | null
          event_registration_id?: string | null
          givebutter_campaign_id?: number | null
          givebutter_id?: string
          givebutter_transaction_id?: string | null
          id?: string
          price?: number | null
          quantity?: number | null
          status?: string | null
          ticket_name?: string | null
          ticket_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "givebutter_tickets_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "givebutter_tickets_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
        ]
      }
      givebutter_transactions: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          amount: number
          campaign_code: string | null
          city: string | null
          company: string | null
          constituent_id: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          custom_fields: Json | null
          dedication_message: string | null
          dedication_name: string | null
          dedication_type: string | null
          donated: number | null
          email: string | null
          fee: number | null
          fee_covered: number | null
          first_name: string | null
          fund_code: string | null
          fund_id: number | null
          gift_id: string | null
          givebutter_campaign_id: number | null
          givebutter_contact_id: string | null
          givebutter_id: string
          givebutter_plan_id: number | null
          giving_space_message: string | null
          giving_space_name: string | null
          id: string
          last_name: string | null
          member_id: number | null
          payment_method: string | null
          payout: number | null
          phone: string | null
          postal_code: string | null
          processed_at: string | null
          processing_error: string | null
          processing_status: string | null
          state: string | null
          status: string
          team_id: number | null
          transacted_at: string
          transaction_number: string | null
          updated_at: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          webhook_received_at: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          amount: number
          campaign_code?: string | null
          city?: string | null
          company?: string | null
          constituent_id?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          custom_fields?: Json | null
          dedication_message?: string | null
          dedication_name?: string | null
          dedication_type?: string | null
          donated?: number | null
          email?: string | null
          fee?: number | null
          fee_covered?: number | null
          first_name?: string | null
          fund_code?: string | null
          fund_id?: number | null
          gift_id?: string | null
          givebutter_campaign_id?: number | null
          givebutter_contact_id?: string | null
          givebutter_id: string
          givebutter_plan_id?: number | null
          giving_space_message?: string | null
          giving_space_name?: string | null
          id?: string
          last_name?: string | null
          member_id?: number | null
          payment_method?: string | null
          payout?: number | null
          phone?: string | null
          postal_code?: string | null
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: string | null
          state?: string | null
          status: string
          team_id?: number | null
          transacted_at: string
          transaction_number?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          webhook_received_at?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          amount?: number
          campaign_code?: string | null
          city?: string | null
          company?: string | null
          constituent_id?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          custom_fields?: Json | null
          dedication_message?: string | null
          dedication_name?: string | null
          dedication_type?: string | null
          donated?: number | null
          email?: string | null
          fee?: number | null
          fee_covered?: number | null
          first_name?: string | null
          fund_code?: string | null
          fund_id?: number | null
          gift_id?: string | null
          givebutter_campaign_id?: number | null
          givebutter_contact_id?: string | null
          givebutter_id?: string
          givebutter_plan_id?: number | null
          giving_space_message?: string | null
          giving_space_name?: string | null
          id?: string
          last_name?: string | null
          member_id?: number | null
          payment_method?: string | null
          payout?: number | null
          phone?: string | null
          postal_code?: string | null
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: string | null
          state?: string | null
          status?: string
          team_id?: number | null
          transacted_at?: string
          transaction_number?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          webhook_received_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "givebutter_transactions_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "givebutter_transactions_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "givebutter_transactions_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "givebutter_transactions_givebutter_contact_id_fkey"
            columns: ["givebutter_contact_id"]
            isOneToOne: false
            referencedRelation: "givebutter_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      givebutter_webhook_log: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          processing_error: string | null
          processing_status: string | null
          signature: string | null
          signature_valid: boolean | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: string | null
          signature?: string | null
          signature_valid?: boolean | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: string | null
          signature?: string | null
          signature_valid?: boolean | null
        }
        Relationships: []
      }
      gmail_connections: {
        Row: {
          access_token: string | null
          auto_sync_enabled: boolean
          created_at: string
          email: string
          id: string
          is_active: boolean
          last_sync_at: string | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          auto_sync_enabled?: boolean
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          auto_sync_enabled?: boolean
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      google_calendar_connections: {
        Row: {
          access_token: string | null
          auto_sync_enabled: boolean
          created_at: string
          email: string
          id: string
          is_active: boolean
          last_sync_at: string | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          auto_sync_enabled?: boolean
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          auto_sync_enabled?: boolean
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      grant_content_links: {
        Row: {
          content_asset_id: string
          created_at: string | null
          created_by: string | null
          grant_opportunity_id: string
          id: string
          notes: string | null
        }
        Insert: {
          content_asset_id: string
          created_at?: string | null
          created_by?: string | null
          grant_opportunity_id: string
          id?: string
          notes?: string | null
        }
        Update: {
          content_asset_id?: string
          created_at?: string | null
          created_by?: string | null
          grant_opportunity_id?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grant_content_links_content_asset_id_fkey"
            columns: ["content_asset_id"]
            isOneToOne: false
            referencedRelation: "content_repository_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grant_content_links_grant_opportunity_id_fkey"
            columns: ["grant_opportunity_id"]
            isOneToOne: false
            referencedRelation: "grant_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      grant_deliverables: {
        Row: {
          completed_date: string | null
          created_at: string | null
          created_by: string | null
          deliverable_name: string
          deliverable_type: string
          due_date: string
          grant_opportunity_id: string
          id: string
          requirements: string | null
          salesforce_id: string | null
          updated_at: string | null
        }
        Insert: {
          completed_date?: string | null
          created_at?: string | null
          created_by?: string | null
          deliverable_name: string
          deliverable_type: string
          due_date: string
          grant_opportunity_id: string
          id?: string
          requirements?: string | null
          salesforce_id?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_date?: string | null
          created_at?: string | null
          created_by?: string | null
          deliverable_name?: string
          deliverable_type?: string
          due_date?: string
          grant_opportunity_id?: string
          id?: string
          requirements?: string | null
          salesforce_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grant_deliverables_grant_opportunity_id_fkey"
            columns: ["grant_opportunity_id"]
            isOneToOne: false
            referencedRelation: "grant_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      grant_documents: {
        Row: {
          category_id: string | null
          created_at: string | null
          document_metadata: Json | null
          extracted_text: string | null
          file_name: string
          file_size: number
          file_type: string
          grant_id: string
          id: string
          notes: string | null
          replaces_document_id: string | null
          storage_path: string
          text_extraction_error: string | null
          text_extraction_status: string | null
          updated_at: string | null
          uploaded_at: string | null
          uploaded_by: string | null
          version_number: number | null
          word_count: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          document_metadata?: Json | null
          extracted_text?: string | null
          file_name: string
          file_size: number
          file_type: string
          grant_id: string
          id?: string
          notes?: string | null
          replaces_document_id?: string | null
          storage_path: string
          text_extraction_error?: string | null
          text_extraction_status?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          version_number?: number | null
          word_count?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          document_metadata?: Json | null
          extracted_text?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          grant_id?: string
          id?: string
          notes?: string | null
          replaces_document_id?: string | null
          storage_path?: string
          text_extraction_error?: string | null
          text_extraction_status?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          version_number?: number | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "grant_documents_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grant_documents_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "grant_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grant_documents_replaces_document_id_fkey"
            columns: ["replaces_document_id"]
            isOneToOne: false
            referencedRelation: "grant_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      grant_opportunities: {
        Row: {
          application_deadline: string | null
          awarded_amount: number | null
          compliance_reporting_deadline: string | null
          contract_date: string | null
          contract_number: string | null
          created_at: string
          created_by: string | null
          decision_date: string | null
          expected_decision_date: string | null
          funder_profile_id: string | null
          grant_period_end: string | null
          grant_period_start: string | null
          id: string
          is_renewal: boolean | null
          next_deliverable_date: string | null
          notes: string | null
          primary_contact_id: string | null
          priority: string | null
          program_areas: string | null
          project_description: string | null
          requested_amount: number | null
          requirements: string | null
          restrictions: string | null
          salesforce_id: string | null
          salesforce_last_sync: string | null
          status_stage: Database["public"]["Enums"]["grant_status"]
          submission_deadline: string | null
          submitted_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          application_deadline?: string | null
          awarded_amount?: number | null
          compliance_reporting_deadline?: string | null
          contract_date?: string | null
          contract_number?: string | null
          created_at?: string
          created_by?: string | null
          decision_date?: string | null
          expected_decision_date?: string | null
          funder_profile_id?: string | null
          grant_period_end?: string | null
          grant_period_start?: string | null
          id?: string
          is_renewal?: boolean | null
          next_deliverable_date?: string | null
          notes?: string | null
          primary_contact_id?: string | null
          priority?: string | null
          program_areas?: string | null
          project_description?: string | null
          requested_amount?: number | null
          requirements?: string | null
          restrictions?: string | null
          salesforce_id?: string | null
          salesforce_last_sync?: string | null
          status_stage?: Database["public"]["Enums"]["grant_status"]
          submission_deadline?: string | null
          submitted_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          application_deadline?: string | null
          awarded_amount?: number | null
          compliance_reporting_deadline?: string | null
          contract_date?: string | null
          contract_number?: string | null
          created_at?: string
          created_by?: string | null
          decision_date?: string | null
          expected_decision_date?: string | null
          funder_profile_id?: string | null
          grant_period_end?: string | null
          grant_period_start?: string | null
          id?: string
          is_renewal?: boolean | null
          next_deliverable_date?: string | null
          notes?: string | null
          primary_contact_id?: string | null
          priority?: string | null
          program_areas?: string | null
          project_description?: string | null
          requested_amount?: number | null
          requirements?: string | null
          restrictions?: string | null
          salesforce_id?: string | null
          salesforce_last_sync?: string | null
          status_stage?: Database["public"]["Enums"]["grant_status"]
          submission_deadline?: string | null
          submitted_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grant_opportunities_funder_profile_id_fkey"
            columns: ["funder_profile_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grant_opportunities_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grant_opportunities_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
        ]
      }
      help_article_views: {
        Row: {
          article_id: string | null
          id: string
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          article_id?: string | null
          id?: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          article_id?: string | null
          id?: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "help_article_views_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "help_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      help_articles: {
        Row: {
          category: string
          content: string | null
          created_at: string | null
          created_by: string | null
          document_type: string | null
          document_url: string | null
          id: string
          is_published: boolean | null
          order_index: number | null
          slug: string
          subcategory: string | null
          target_roles: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          document_type?: string | null
          document_url?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          slug: string
          subcategory?: string | null
          target_roles?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          document_type?: string | null
          document_url?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          slug?: string
          subcategory?: string | null
          target_roles?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      help_faqs: {
        Row: {
          answer: string
          category: string
          created_at: string | null
          id: string
          is_published: boolean | null
          order_index: number | null
          question: string
          updated_at: string | null
        }
        Insert: {
          answer: string
          category: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          question: string
          updated_at?: string | null
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      households: {
        Row: {
          created_at: string | null
          greeting_format: string | null
          household_name: string
          household_type: string | null
          id: string
          notes: string | null
          primary_address_constituent_id: string | null
          primary_contact_constituent_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          greeting_format?: string | null
          household_name: string
          household_type?: string | null
          id?: string
          notes?: string | null
          primary_address_constituent_id?: string | null
          primary_contact_constituent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          greeting_format?: string | null
          household_name?: string
          household_type?: string | null
          id?: string
          notes?: string | null
          primary_address_constituent_id?: string | null
          primary_contact_constituent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "households_primary_address_constituent_id_fkey"
            columns: ["primary_address_constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "households_primary_address_constituent_id_fkey"
            columns: ["primary_address_constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "households_primary_contact_constituent_id_fkey"
            columns: ["primary_contact_constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "households_primary_contact_constituent_id_fkey"
            columns: ["primary_contact_constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
        ]
      }
      instance_config: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      lms_configurations: {
        Row: {
          api_endpoint: string
          api_key: string
          created_at: string
          created_by: string | null
          field_mappings: Json
          id: string
          is_active: boolean
          last_sync_at: string | null
          lms_name: string
          lms_type: Database["public"]["Enums"]["lms_type"]
          oauth_credentials: Json | null
          sync_frequency: unknown
          sync_settings: Json
          updated_at: string
        }
        Insert: {
          api_endpoint: string
          api_key: string
          created_at?: string
          created_by?: string | null
          field_mappings?: Json
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          lms_name: string
          lms_type: Database["public"]["Enums"]["lms_type"]
          oauth_credentials?: Json | null
          sync_frequency?: unknown
          sync_settings?: Json
          updated_at?: string
        }
        Update: {
          api_endpoint?: string
          api_key?: string
          created_at?: string
          created_by?: string | null
          field_mappings?: Json
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          lms_name?: string
          lms_type?: Database["public"]["Enums"]["lms_type"]
          oauth_credentials?: Json | null
          sync_frequency?: unknown
          sync_settings?: Json
          updated_at?: string
        }
        Relationships: []
      }
      lms_courses: {
        Row: {
          capacity: number | null
          course_code: string | null
          course_name: string
          description: string | null
          end_date: string | null
          id: string
          instructor: string | null
          last_synced_at: string
          lms_config_id: string
          lms_course_id: string
          metadata: Json
          start_date: string | null
          status: string
        }
        Insert: {
          capacity?: number | null
          course_code?: string | null
          course_name: string
          description?: string | null
          end_date?: string | null
          id?: string
          instructor?: string | null
          last_synced_at?: string
          lms_config_id: string
          lms_course_id: string
          metadata?: Json
          start_date?: string | null
          status?: string
        }
        Update: {
          capacity?: number | null
          course_code?: string | null
          course_name?: string
          description?: string | null
          end_date?: string | null
          id?: string
          instructor?: string | null
          last_synced_at?: string
          lms_config_id?: string
          lms_course_id?: string
          metadata?: Json
          start_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lms_courses_lms_config_id_fkey"
            columns: ["lms_config_id"]
            isOneToOne: false
            referencedRelation: "lms_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_enrollments: {
        Row: {
          attendance_percentage: number | null
          certificate_url: string | null
          completion_date: string | null
          enrollment_date: string
          grade: string | null
          id: string
          last_synced_at: string
          lms_config_id: string
          lms_course_id: string
          lms_enrollment_id: string
          lms_student_id: string
          metadata: Json
          score_percentage: number | null
          status: Database["public"]["Enums"]["lms_enrollment_status"]
        }
        Insert: {
          attendance_percentage?: number | null
          certificate_url?: string | null
          completion_date?: string | null
          enrollment_date: string
          grade?: string | null
          id?: string
          last_synced_at?: string
          lms_config_id: string
          lms_course_id: string
          lms_enrollment_id: string
          lms_student_id: string
          metadata?: Json
          score_percentage?: number | null
          status?: Database["public"]["Enums"]["lms_enrollment_status"]
        }
        Update: {
          attendance_percentage?: number | null
          certificate_url?: string | null
          completion_date?: string | null
          enrollment_date?: string
          grade?: string | null
          id?: string
          last_synced_at?: string
          lms_config_id?: string
          lms_course_id?: string
          lms_enrollment_id?: string
          lms_student_id?: string
          metadata?: Json
          score_percentage?: number | null
          status?: Database["public"]["Enums"]["lms_enrollment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "lms_enrollments_lms_config_id_fkey"
            columns: ["lms_config_id"]
            isOneToOne: false
            referencedRelation: "lms_configurations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_enrollments_lms_course_id_fkey"
            columns: ["lms_course_id"]
            isOneToOne: false
            referencedRelation: "lms_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_enrollments_lms_student_id_fkey"
            columns: ["lms_student_id"]
            isOneToOne: false
            referencedRelation: "lms_students"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_students: {
        Row: {
          constituent_id: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          last_synced_at: string
          lms_config_id: string
          lms_student_id: string
          metadata: Json
        }
        Insert: {
          constituent_id: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          last_synced_at?: string
          lms_config_id: string
          lms_student_id: string
          metadata?: Json
        }
        Update: {
          constituent_id?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          last_synced_at?: string
          lms_config_id?: string
          lms_student_id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "lms_students_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_students_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lms_students_lms_config_id_fkey"
            columns: ["lms_config_id"]
            isOneToOne: false
            referencedRelation: "lms_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_sync_log: {
        Row: {
          completed_at: string | null
          direction: Database["public"]["Enums"]["lms_sync_direction"]
          error_details: Json | null
          id: string
          lms_config_id: string
          records_created: number
          records_failed: number
          records_processed: number
          records_updated: number
          started_at: string
          status: Database["public"]["Enums"]["lms_sync_status"]
          sync_type: Database["public"]["Enums"]["lms_sync_type"]
        }
        Insert: {
          completed_at?: string | null
          direction?: Database["public"]["Enums"]["lms_sync_direction"]
          error_details?: Json | null
          id?: string
          lms_config_id: string
          records_created?: number
          records_failed?: number
          records_processed?: number
          records_updated?: number
          started_at?: string
          status: Database["public"]["Enums"]["lms_sync_status"]
          sync_type: Database["public"]["Enums"]["lms_sync_type"]
        }
        Update: {
          completed_at?: string | null
          direction?: Database["public"]["Enums"]["lms_sync_direction"]
          error_details?: Json | null
          id?: string
          lms_config_id?: string
          records_created?: number
          records_failed?: number
          records_processed?: number
          records_updated?: number
          started_at?: string
          status?: Database["public"]["Enums"]["lms_sync_status"]
          sync_type?: Database["public"]["Enums"]["lms_sync_type"]
        }
        Relationships: [
          {
            foreignKeyName: "lms_sync_log_lms_config_id_fkey"
            columns: ["lms_config_id"]
            isOneToOne: false
            referencedRelation: "lms_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      mailchimp_audiences: {
        Row: {
          config_id: string
          created_at: string | null
          id: string
          is_selected: boolean | null
          list_name: string
          mailchimp_list_id: string
          subscriber_count: number | null
        }
        Insert: {
          config_id: string
          created_at?: string | null
          id?: string
          is_selected?: boolean | null
          list_name: string
          mailchimp_list_id: string
          subscriber_count?: number | null
        }
        Update: {
          config_id?: string
          created_at?: string | null
          id?: string
          is_selected?: boolean | null
          list_name?: string
          mailchimp_list_id?: string
          subscriber_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mailchimp_audiences_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "mailchimp_sync_config"
            referencedColumns: ["id"]
          },
        ]
      }
      mailchimp_campaigns: {
        Row: {
          bounces: number | null
          campaign_name: string
          campaign_type: string | null
          click_rate: number | null
          clicks_total: number | null
          created_at: string | null
          emails_sent: number | null
          id: string
          last_synced: string | null
          list_id: string | null
          list_name: string | null
          mailchimp_campaign_id: string
          open_rate: number | null
          opens_total: number | null
          preview_text: string | null
          send_time: string | null
          status: string | null
          subject_line: string | null
          unique_clicks: number | null
          unique_opens: number | null
          unsubscribes: number | null
        }
        Insert: {
          bounces?: number | null
          campaign_name: string
          campaign_type?: string | null
          click_rate?: number | null
          clicks_total?: number | null
          created_at?: string | null
          emails_sent?: number | null
          id?: string
          last_synced?: string | null
          list_id?: string | null
          list_name?: string | null
          mailchimp_campaign_id: string
          open_rate?: number | null
          opens_total?: number | null
          preview_text?: string | null
          send_time?: string | null
          status?: string | null
          subject_line?: string | null
          unique_clicks?: number | null
          unique_opens?: number | null
          unsubscribes?: number | null
        }
        Update: {
          bounces?: number | null
          campaign_name?: string
          campaign_type?: string | null
          click_rate?: number | null
          clicks_total?: number | null
          created_at?: string | null
          emails_sent?: number | null
          id?: string
          last_synced?: string | null
          list_id?: string | null
          list_name?: string | null
          mailchimp_campaign_id?: string
          open_rate?: number | null
          opens_total?: number | null
          preview_text?: string | null
          send_time?: string | null
          status?: string | null
          subject_line?: string | null
          unique_clicks?: number | null
          unique_opens?: number | null
          unsubscribes?: number | null
        }
        Relationships: []
      }
      mailchimp_field_mappings: {
        Row: {
          config_id: string
          created_at: string | null
          crm_field: string | null
          field_type: string | null
          id: string
          is_required: boolean | null
          mailchimp_field: string
          updated_at: string | null
        }
        Insert: {
          config_id: string
          created_at?: string | null
          crm_field?: string | null
          field_type?: string | null
          id?: string
          is_required?: boolean | null
          mailchimp_field: string
          updated_at?: string | null
        }
        Update: {
          config_id?: string
          created_at?: string | null
          crm_field?: string | null
          field_type?: string | null
          id?: string
          is_required?: boolean | null
          mailchimp_field?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mailchimp_field_mappings_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "mailchimp_sync_config"
            referencedColumns: ["id"]
          },
        ]
      }
      mailchimp_list_memberships: {
        Row: {
          constituent_id: string
          created_at: string | null
          id: string
          last_synced: string | null
          list_id: string
          list_name: string | null
          status: string
          subscribed_at: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          constituent_id: string
          created_at?: string | null
          id?: string
          last_synced?: string | null
          list_id: string
          list_name?: string | null
          status: string
          subscribed_at?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          constituent_id?: string
          created_at?: string | null
          id?: string
          last_synced?: string | null
          list_id?: string
          list_name?: string | null
          status?: string
          subscribed_at?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mailchimp_list_memberships_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mailchimp_list_memberships_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
        ]
      }
      mailchimp_oauth_state: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          state_token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          state_token: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          state_token?: string
          user_id?: string
        }
        Relationships: []
      }
      mailchimp_sync_config: {
        Row: {
          access_token: string
          account_name: string | null
          auto_create_constituents: boolean | null
          campaign_history_months: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          refresh_token: string | null
          server_prefix: string
          sync_activities: boolean | null
          sync_campaigns: boolean | null
          sync_direction: string
          sync_frequency: unknown
          sync_lists: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          account_name?: string | null
          auto_create_constituents?: boolean | null
          campaign_history_months?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          refresh_token?: string | null
          server_prefix: string
          sync_activities?: boolean | null
          sync_campaigns?: boolean | null
          sync_direction?: string
          sync_frequency?: unknown
          sync_lists?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          account_name?: string | null
          auto_create_constituents?: boolean | null
          campaign_history_months?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          refresh_token?: string | null
          server_prefix?: string
          sync_activities?: boolean | null
          sync_campaigns?: boolean | null
          sync_direction?: string
          sync_frequency?: unknown
          sync_lists?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mailchimp_sync_errors: {
        Row: {
          created_at: string | null
          email: string | null
          error_message: string | null
          error_type: string | null
          id: string
          mailchimp_id: string | null
          raw_data: Json | null
          sync_log_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          error_message?: string | null
          error_type?: string | null
          id?: string
          mailchimp_id?: string | null
          raw_data?: Json | null
          sync_log_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          error_message?: string | null
          error_type?: string | null
          id?: string
          mailchimp_id?: string | null
          raw_data?: Json | null
          sync_log_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mailchimp_sync_errors_sync_log_id_fkey"
            columns: ["sync_log_id"]
            isOneToOne: false
            referencedRelation: "mailchimp_sync_log"
            referencedColumns: ["id"]
          },
        ]
      }
      mailchimp_sync_log: {
        Row: {
          completed_at: string | null
          config_id: string | null
          error_details: Json | null
          id: string
          records_created: number | null
          records_failed: number | null
          records_processed: number | null
          records_updated: number | null
          started_at: string
          status: string
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          config_id?: string | null
          error_details?: Json | null
          id?: string
          records_created?: number | null
          records_failed?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string
          status: string
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          config_id?: string | null
          error_details?: Json | null
          id?: string
          records_created?: number | null
          records_failed?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string
          status?: string
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "mailchimp_sync_log_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "mailchimp_sync_config"
            referencedColumns: ["id"]
          },
        ]
      }
      major_gift_opportunities: {
        Row: {
          archive_reason: string | null
          archived_at: string | null
          archived_by: string | null
          constituent_id: string
          contact_history: string | null
          created_at: string | null
          created_by: string | null
          donor_interest: string | null
          expected_amount: number | null
          expected_date: string | null
          id: string
          next_steps: string | null
          primary_solicitor: string | null
          probability_percent: number | null
          restriction_type: string | null
          stage: Database["public"]["Enums"]["major_gift_stage"]
          strategy_notes: string | null
          updated_at: string | null
        }
        Insert: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          constituent_id: string
          contact_history?: string | null
          created_at?: string | null
          created_by?: string | null
          donor_interest?: string | null
          expected_amount?: number | null
          expected_date?: string | null
          id?: string
          next_steps?: string | null
          primary_solicitor?: string | null
          probability_percent?: number | null
          restriction_type?: string | null
          stage?: Database["public"]["Enums"]["major_gift_stage"]
          strategy_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          archive_reason?: string | null
          archived_at?: string | null
          archived_by?: string | null
          constituent_id?: string
          contact_history?: string | null
          created_at?: string | null
          created_by?: string | null
          donor_interest?: string | null
          expected_amount?: number | null
          expected_date?: string | null
          id?: string
          next_steps?: string | null
          primary_solicitor?: string | null
          probability_percent?: number | null
          restriction_type?: string | null
          stage?: Database["public"]["Enums"]["major_gift_stage"]
          strategy_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "major_gift_opportunities_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "major_gift_opportunities_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_attendee_matches: {
        Row: {
          attendee_email: string
          attendee_name: string | null
          calendar_event_id: string
          constituent_id: string | null
          created_at: string | null
          id: string
          match_confidence: string
        }
        Insert: {
          attendee_email: string
          attendee_name?: string | null
          calendar_event_id: string
          constituent_id?: string | null
          created_at?: string | null
          id?: string
          match_confidence?: string
        }
        Update: {
          attendee_email?: string
          attendee_name?: string | null
          calendar_event_id?: string
          constituent_id?: string | null
          created_at?: string | null
          id?: string
          match_confidence?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendee_matches_calendar_event_id_fkey"
            columns: ["calendar_event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attendee_matches_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attendee_matches_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_transcript_constituents: {
        Row: {
          constituent_id: string | null
          created_at: string | null
          id: string
          match_type: string | null
          transcript_id: string | null
        }
        Insert: {
          constituent_id?: string | null
          created_at?: string | null
          id?: string
          match_type?: string | null
          transcript_id?: string | null
        }
        Update: {
          constituent_id?: string | null
          created_at?: string | null
          id?: string
          match_type?: string | null
          transcript_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_transcript_constituents_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_transcript_constituents_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_transcript_constituents_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "meeting_transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_transcript_tasks: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          assigned_to: string | null
          board_card_id: string | null
          calendar_event_id: string | null
          created_at: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          task_text: string
          transcript_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          board_card_id?: string | null
          calendar_event_id?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          task_text: string
          transcript_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          board_card_id?: string | null
          calendar_event_id?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          task_text?: string
          transcript_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_transcript_tasks_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_transcript_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_transcript_tasks_board_card_id_fkey"
            columns: ["board_card_id"]
            isOneToOne: false
            referencedRelation: "board_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_transcript_tasks_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "meeting_transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_transcripts: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          fireflies_meeting_id: string | null
          id: string
          meeting_date: string
          original_file_url: string | null
          participants: string[] | null
          processed_at: string | null
          source: string
          summary: string | null
          title: string
          transcript_text: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          fireflies_meeting_id?: string | null
          id?: string
          meeting_date: string
          original_file_url?: string | null
          participants?: string[] | null
          processed_at?: string | null
          source: string
          summary?: string | null
          title: string
          transcript_text: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          fireflies_meeting_id?: string | null
          id?: string
          meeting_date?: string
          original_file_url?: string | null
          participants?: string[] | null
          processed_at?: string | null
          source?: string
          summary?: string | null
          title?: string
          transcript_text?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_transcripts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_email_config: {
        Row: {
          created_at: string
          id: string
          inbound_enabled: boolean | null
          inbound_webhook_secret: string | null
          outbound_webhook_url: string | null
          preferred_provider: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inbound_enabled?: boolean | null
          inbound_webhook_secret?: string | null
          outbound_webhook_url?: string | null
          preferred_provider?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inbound_enabled?: boolean | null
          inbound_webhook_secret?: string | null
          outbound_webhook_url?: string | null
          preferred_provider?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      n8n_workflow_logs: {
        Row: {
          automation_type: string
          created_at: string | null
          error_message: string | null
          execution_id: string | null
          id: string
          metadata: Json | null
          records_affected: number | null
          status: string
          trigger_source: string | null
          workflow_id: string | null
          workflow_name: string | null
        }
        Insert: {
          automation_type: string
          created_at?: string | null
          error_message?: string | null
          execution_id?: string | null
          id?: string
          metadata?: Json | null
          records_affected?: number | null
          status: string
          trigger_source?: string | null
          workflow_id?: string | null
          workflow_name?: string | null
        }
        Update: {
          automation_type?: string
          created_at?: string | null
          error_message?: string | null
          execution_id?: string | null
          id?: string
          metadata?: Json | null
          records_affected?: number | null
          status?: string
          trigger_source?: string | null
          workflow_id?: string | null
          workflow_name?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notion_sync_config: {
        Row: {
          access_token: string
          created_at: string
          id: string
          is_active: boolean
          last_sync_at: string | null
          notion_database_id: string
          notion_database_name: string | null
          notion_workspace_id: string
          notion_workspace_name: string | null
          sync_frequency: unknown
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          notion_database_id: string
          notion_database_name?: string | null
          notion_workspace_id: string
          notion_workspace_name?: string | null
          sync_frequency?: unknown
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          notion_database_id?: string
          notion_database_name?: string | null
          notion_workspace_id?: string
          notion_workspace_name?: string | null
          sync_frequency?: unknown
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notion_sync_log: {
        Row: {
          action: string
          config_id: string
          error_message: string | null
          id: string
          record_id: string | null
          record_type: string
          status: string
          sync_direction: string
          synced_at: string
        }
        Insert: {
          action: string
          config_id: string
          error_message?: string | null
          id?: string
          record_id?: string | null
          record_type: string
          status: string
          sync_direction: string
          synced_at?: string
        }
        Update: {
          action?: string
          config_id?: string
          error_message?: string | null
          id?: string
          record_id?: string | null
          record_type?: string
          status?: string
          sync_direction?: string
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notion_sync_log_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "notion_sync_config"
            referencedColumns: ["id"]
          },
        ]
      }
      notion_task_mapping: {
        Row: {
          config_id: string
          crm_task_id: string
          id: string
          last_synced_at: string
          notion_page_id: string
          sync_enabled: boolean
        }
        Insert: {
          config_id: string
          crm_task_id: string
          id?: string
          last_synced_at?: string
          notion_page_id: string
          sync_enabled?: boolean
        }
        Update: {
          config_id?: string
          crm_task_id?: string
          id?: string
          last_synced_at?: string
          notion_page_id?: string
          sync_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "notion_task_mapping_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "notion_sync_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notion_task_mapping_crm_task_id_fkey"
            columns: ["crm_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          address_city: string | null
          address_country: string | null
          address_postal_code: string | null
          address_state: string | null
          address_street: string | null
          burndown_enabled: boolean | null
          created_at: string
          created_by: string | null
          email: string | null
          fiscal_year_start_month: number | null
          id: string
          name: string
          notes: string | null
          organization_type: string | null
          phone: string | null
          primary_contact: string | null
          priority_algorithm_type:
            | Database["public"]["Enums"]["organization_type"]
            | null
          project_boards_enabled: boolean | null
          salesforce_id: string | null
          salesforce_last_sync: string | null
          updated_at: string
          voice_notes_enabled: boolean | null
          website: string | null
        }
        Insert: {
          address?: string | null
          address_city?: string | null
          address_country?: string | null
          address_postal_code?: string | null
          address_state?: string | null
          address_street?: string | null
          burndown_enabled?: boolean | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          fiscal_year_start_month?: number | null
          id?: string
          name: string
          notes?: string | null
          organization_type?: string | null
          phone?: string | null
          primary_contact?: string | null
          priority_algorithm_type?:
            | Database["public"]["Enums"]["organization_type"]
            | null
          project_boards_enabled?: boolean | null
          salesforce_id?: string | null
          salesforce_last_sync?: string | null
          updated_at?: string
          voice_notes_enabled?: boolean | null
          website?: string | null
        }
        Update: {
          address?: string | null
          address_city?: string | null
          address_country?: string | null
          address_postal_code?: string | null
          address_state?: string | null
          address_street?: string | null
          burndown_enabled?: boolean | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          fiscal_year_start_month?: number | null
          id?: string
          name?: string
          notes?: string | null
          organization_type?: string | null
          phone?: string | null
          primary_contact?: string | null
          priority_algorithm_type?:
            | Database["public"]["Enums"]["organization_type"]
            | null
          project_boards_enabled?: boolean | null
          salesforce_id?: string | null
          salesforce_last_sync?: string | null
          updated_at?: string
          voice_notes_enabled?: boolean | null
          website?: string | null
        }
        Relationships: []
      }
      outcome_measurements: {
        Row: {
          actual_value: number
          created_at: string | null
          id: string
          measurement_date: string
          metric_id: string
          notes: string | null
          recorded_by: string | null
        }
        Insert: {
          actual_value: number
          created_at?: string | null
          id?: string
          measurement_date: string
          metric_id: string
          notes?: string | null
          recorded_by?: string | null
        }
        Update: {
          actual_value?: number
          created_at?: string | null
          id?: string
          measurement_date?: string
          metric_id?: string
          notes?: string | null
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outcome_measurements_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "outcome_metrics"
            referencedColumns: ["id"]
          },
        ]
      }
      outcome_metrics: {
        Row: {
          created_at: string | null
          data_source: string | null
          display_order: number | null
          id: string
          is_key_metric: boolean | null
          measurement_frequency: string | null
          metric_description: string | null
          metric_name: string
          metric_type: string
          program_id: string | null
          target_date: string | null
          target_value: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_source?: string | null
          display_order?: number | null
          id?: string
          is_key_metric?: boolean | null
          measurement_frequency?: string | null
          metric_description?: string | null
          metric_name: string
          metric_type: string
          program_id?: string | null
          target_date?: string | null
          target_value?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_source?: string | null
          display_order?: number | null
          id?: string
          is_key_metric?: boolean | null
          measurement_frequency?: string | null
          metric_description?: string | null
          metric_name?: string
          metric_type?: string
          program_id?: string | null
          target_date?: string | null
          target_value?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outcome_metrics_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          constituent_id: string | null
          created_at: string | null
          currency: string | null
          failure_reason: string | null
          id: string
          metadata: Json | null
          net_amount: number | null
          payer_email: string | null
          payer_name: string | null
          payment_type: string
          reference_id: string | null
          status: string
          stripe_charge_id: string | null
          stripe_checkout_session_id: string | null
          stripe_fee: number | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount: number
          constituent_id?: string | null
          created_at?: string | null
          currency?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          net_amount?: number | null
          payer_email?: string | null
          payer_name?: string | null
          payment_type: string
          reference_id?: string | null
          status: string
          stripe_charge_id?: string | null
          stripe_checkout_session_id?: string | null
          stripe_fee?: number | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount?: number
          constituent_id?: string | null
          created_at?: string | null
          currency?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          net_amount?: number | null
          payer_email?: string | null
          payer_name?: string | null
          payment_type?: string
          reference_id?: string | null
          status?: string
          stripe_charge_id?: string | null
          stripe_checkout_session_id?: string | null
          stripe_fee?: number | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
        ]
      }
      pledge_payments: {
        Row: {
          actual_amount: number | null
          actual_date: string | null
          created_at: string | null
          expected_amount: number
          expected_date: string
          id: string
          notes: string | null
          payment_gift_id: string | null
          payment_number: number
          pledge_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          actual_amount?: number | null
          actual_date?: string | null
          created_at?: string | null
          expected_amount: number
          expected_date: string
          id?: string
          notes?: string | null
          payment_gift_id?: string | null
          payment_number: number
          pledge_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          actual_amount?: number | null
          actual_date?: string | null
          created_at?: string | null
          expected_amount?: number
          expected_date?: string
          id?: string
          notes?: string | null
          payment_gift_id?: string | null
          payment_number?: number
          pledge_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pledge_payments_payment_gift_id_fkey"
            columns: ["payment_gift_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pledge_payments_pledge_id_fkey"
            columns: ["pledge_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
        ]
      }
      pool_applications: {
        Row: {
          application_status: string | null
          audience_sizes_comfortable: string[] | null
          availability_notes: string | null
          available_days: string[] | null
          background_check_consent: boolean | null
          bio: string | null
          city: string | null
          classroom_management_experience: string | null
          created_at: string | null
          current_employer: string | null
          current_title: string | null
          curriculum_development_experience: boolean | null
          email: string
          equipment_needs: string | null
          first_name: string
          grade_levels_comfortable: string[] | null
          headshot_file_path: string | null
          id: string
          last_engagement_date: string | null
          last_name: string
          linkedin_url: string | null
          organization_id: string | null
          overall_rating: number | null
          phone: string | null
          pool_type: string
          preferred_contact_method: string | null
          preferred_time_slots: string[] | null
          presentation_style: string[] | null
          previous_speaking_engagements: string | null
          references_file_path: string | null
          relevant_experience: string | null
          resume_file_path: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          speaker_experience_level: string | null
          speaker_fee_expectations: string | null
          speaker_topics: string[] | null
          state: string | null
          subjects_qualified: string[] | null
          teaching_certifications: string | null
          total_engagements: number | null
          updated_at: string | null
          website_url: string | null
          why_interested: string | null
          willing_to_volunteer: boolean | null
          years_of_experience: number | null
          zip_code: string | null
        }
        Insert: {
          application_status?: string | null
          audience_sizes_comfortable?: string[] | null
          availability_notes?: string | null
          available_days?: string[] | null
          background_check_consent?: boolean | null
          bio?: string | null
          city?: string | null
          classroom_management_experience?: string | null
          created_at?: string | null
          current_employer?: string | null
          current_title?: string | null
          curriculum_development_experience?: boolean | null
          email: string
          equipment_needs?: string | null
          first_name: string
          grade_levels_comfortable?: string[] | null
          headshot_file_path?: string | null
          id?: string
          last_engagement_date?: string | null
          last_name: string
          linkedin_url?: string | null
          organization_id?: string | null
          overall_rating?: number | null
          phone?: string | null
          pool_type: string
          preferred_contact_method?: string | null
          preferred_time_slots?: string[] | null
          presentation_style?: string[] | null
          previous_speaking_engagements?: string | null
          references_file_path?: string | null
          relevant_experience?: string | null
          resume_file_path?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          speaker_experience_level?: string | null
          speaker_fee_expectations?: string | null
          speaker_topics?: string[] | null
          state?: string | null
          subjects_qualified?: string[] | null
          teaching_certifications?: string | null
          total_engagements?: number | null
          updated_at?: string | null
          website_url?: string | null
          why_interested?: string | null
          willing_to_volunteer?: boolean | null
          years_of_experience?: number | null
          zip_code?: string | null
        }
        Update: {
          application_status?: string | null
          audience_sizes_comfortable?: string[] | null
          availability_notes?: string | null
          available_days?: string[] | null
          background_check_consent?: boolean | null
          bio?: string | null
          city?: string | null
          classroom_management_experience?: string | null
          created_at?: string | null
          current_employer?: string | null
          current_title?: string | null
          curriculum_development_experience?: boolean | null
          email?: string
          equipment_needs?: string | null
          first_name?: string
          grade_levels_comfortable?: string[] | null
          headshot_file_path?: string | null
          id?: string
          last_engagement_date?: string | null
          last_name?: string
          linkedin_url?: string | null
          organization_id?: string | null
          overall_rating?: number | null
          phone?: string | null
          pool_type?: string
          preferred_contact_method?: string | null
          preferred_time_slots?: string[] | null
          presentation_style?: string[] | null
          previous_speaking_engagements?: string | null
          references_file_path?: string | null
          relevant_experience?: string | null
          resume_file_path?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          speaker_experience_level?: string | null
          speaker_fee_expectations?: string | null
          speaker_topics?: string[] | null
          state?: string | null
          subjects_qualified?: string[] | null
          teaching_certifications?: string | null
          total_engagements?: number | null
          updated_at?: string | null
          website_url?: string | null
          why_interested?: string | null
          willing_to_volunteer?: boolean | null
          years_of_experience?: number | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pool_applications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pool_engagements: {
        Row: {
          actual_audience_size: number | null
          audience_type: string | null
          compensation_amount: number | null
          compensation_type: string | null
          created_at: string | null
          end_time: string | null
          engagement_type: string | null
          event_date: string
          event_name: string
          expected_audience_size: number | null
          id: string
          is_virtual: boolean | null
          location: string | null
          notes: string | null
          organizer_feedback: string | null
          organizer_rating: number | null
          participant_rating_avg: number | null
          payment_status: string | null
          pool_member_id: string | null
          start_time: string | null
          status: string | null
        }
        Insert: {
          actual_audience_size?: number | null
          audience_type?: string | null
          compensation_amount?: number | null
          compensation_type?: string | null
          created_at?: string | null
          end_time?: string | null
          engagement_type?: string | null
          event_date: string
          event_name: string
          expected_audience_size?: number | null
          id?: string
          is_virtual?: boolean | null
          location?: string | null
          notes?: string | null
          organizer_feedback?: string | null
          organizer_rating?: number | null
          participant_rating_avg?: number | null
          payment_status?: string | null
          pool_member_id?: string | null
          start_time?: string | null
          status?: string | null
        }
        Update: {
          actual_audience_size?: number | null
          audience_type?: string | null
          compensation_amount?: number | null
          compensation_type?: string | null
          created_at?: string | null
          end_time?: string | null
          engagement_type?: string | null
          event_date?: string
          event_name?: string
          expected_audience_size?: number | null
          id?: string
          is_virtual?: boolean | null
          location?: string | null
          notes?: string | null
          organizer_feedback?: string | null
          organizer_rating?: number | null
          participant_rating_avg?: number | null
          payment_status?: string | null
          pool_member_id?: string | null
          start_time?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pool_engagements_pool_member_id_fkey"
            columns: ["pool_member_id"]
            isOneToOne: false
            referencedRelation: "approved_speakers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pool_engagements_pool_member_id_fkey"
            columns: ["pool_member_id"]
            isOneToOne: false
            referencedRelation: "pool_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      pool_references: {
        Row: {
          application_id: string | null
          contacted: boolean | null
          contacted_by: string | null
          contacted_date: string | null
          created_at: string | null
          feedback: string | null
          id: string
          organization: string | null
          recommendation_level: string | null
          reference_email: string | null
          reference_name: string
          reference_phone: string | null
          relationship: string | null
        }
        Insert: {
          application_id?: string | null
          contacted?: boolean | null
          contacted_by?: string | null
          contacted_date?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          organization?: string | null
          recommendation_level?: string | null
          reference_email?: string | null
          reference_name: string
          reference_phone?: string | null
          relationship?: string | null
        }
        Update: {
          application_id?: string | null
          contacted?: boolean | null
          contacted_by?: string | null
          contacted_date?: string | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          organization?: string | null
          recommendation_level?: string | null
          reference_email?: string | null
          reference_name?: string
          reference_phone?: string | null
          relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pool_references_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "approved_speakers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pool_references_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "pool_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_emails: {
        Row: {
          created_at: string | null
          has_actionable_content: boolean | null
          id: string
          microsoft_message_id: string
          processed_at: string | null
          received_at: string | null
          sender_email: string | null
          sender_name: string | null
          snippet: string | null
          subject: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          has_actionable_content?: boolean | null
          id?: string
          microsoft_message_id: string
          processed_at?: string | null
          received_at?: string | null
          sender_email?: string | null
          sender_name?: string | null
          snippet?: string | null
          subject?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          has_actionable_content?: boolean | null
          id?: string
          microsoft_message_id?: string
          processed_at?: string | null
          received_at?: string | null
          sender_email?: string | null
          sender_name?: string | null
          snippet?: string | null
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      program_beneficiaries: {
        Row: {
          created_at: string | null
          demographic_data: Json | null
          id: string
          notes: string | null
          period_end: string
          period_start: string
          program_id: string
          total_served: number
          unique_individuals: number | null
        }
        Insert: {
          created_at?: string | null
          demographic_data?: Json | null
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          program_id: string
          total_served?: number
          unique_individuals?: number | null
        }
        Update: {
          created_at?: string | null
          demographic_data?: Json | null
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          program_id?: string
          total_served?: number
          unique_individuals?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "program_beneficiaries_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_enrollments: {
        Row: {
          amount: number
          confirmation_number: string | null
          constituent_id: string | null
          created_at: string | null
          enrollee_email: string
          enrollee_name: string | null
          enrollee_phone: string | null
          enrollment_date: string | null
          id: string
          paid_at: string | null
          payment_status: string | null
          program_offering_id: string
          status: string | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount: number
          confirmation_number?: string | null
          constituent_id?: string | null
          created_at?: string | null
          enrollee_email: string
          enrollee_name?: string | null
          enrollee_phone?: string | null
          enrollment_date?: string | null
          id?: string
          paid_at?: string | null
          payment_status?: string | null
          program_offering_id: string
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount?: number
          confirmation_number?: string | null
          constituent_id?: string | null
          created_at?: string | null
          enrollee_email?: string
          enrollee_name?: string | null
          enrollee_phone?: string | null
          enrollment_date?: string | null
          id?: string
          paid_at?: string | null
          payment_status?: string | null
          program_offering_id?: string
          status?: string | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_enrollments_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_enrollments_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_enrollments_program_offering_id_fkey"
            columns: ["program_offering_id"]
            isOneToOne: false
            referencedRelation: "program_offerings"
            referencedColumns: ["id"]
          },
        ]
      }
      program_grants: {
        Row: {
          created_at: string | null
          funding_amount: number | null
          funding_percentage: number | null
          grant_id: string
          id: string
          outcome_metrics_required: string[] | null
          program_id: string
          reporting_requirements: string | null
        }
        Insert: {
          created_at?: string | null
          funding_amount?: number | null
          funding_percentage?: number | null
          grant_id: string
          id?: string
          outcome_metrics_required?: string[] | null
          program_id: string
          reporting_requirements?: string | null
        }
        Update: {
          created_at?: string | null
          funding_amount?: number | null
          funding_percentage?: number | null
          grant_id?: string
          id?: string
          outcome_metrics_required?: string[] | null
          program_id?: string
          reporting_requirements?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_grants_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "grant_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_grants_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_offerings: {
        Row: {
          capacity: number | null
          created_at: string | null
          description: string | null
          end_date: string | null
          enrolled_count: number | null
          id: string
          is_active: boolean | null
          location: string | null
          name: string
          price: number
          program_id: string
          registration_deadline: string | null
          start_date: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          enrolled_count?: number | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name: string
          price?: number
          program_id: string
          registration_deadline?: string | null
          start_date?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          enrolled_count?: number | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string
          price?: number
          program_id?: string
          registration_deadline?: string | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_offerings_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          annual_budget: number | null
          created_at: string | null
          description: string | null
          end_date: string | null
          funding_sources: string[] | null
          geographic_area: string | null
          id: string
          name: string
          program_area: string | null
          staff_lead: string | null
          start_date: string | null
          status: string | null
          target_population: string | null
          updated_at: string | null
        }
        Insert: {
          annual_budget?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          funding_sources?: string[] | null
          geographic_area?: string | null
          id?: string
          name: string
          program_area?: string | null
          staff_lead?: string | null
          start_date?: string | null
          status?: string | null
          target_population?: string | null
          updated_at?: string | null
        }
        Update: {
          annual_budget?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          funding_sources?: string[] | null
          geographic_area?: string | null
          id?: string
          name?: string
          program_area?: string | null
          staff_lead?: string | null
          start_date?: string | null
          status?: string | null
          target_population?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_collaborators: {
        Row: {
          access_expires_at: string | null
          can_edit_documents: boolean | null
          can_edit_tasks: boolean | null
          can_upload_documents: boolean | null
          can_view_documents: boolean | null
          can_view_tasks: boolean | null
          created_at: string | null
          id: string
          invitation_message: string | null
          invited_at: string | null
          invited_by: string | null
          last_accessed_at: string | null
          project_id: string
          project_type: string
          role: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_expires_at?: string | null
          can_edit_documents?: boolean | null
          can_edit_tasks?: boolean | null
          can_upload_documents?: boolean | null
          can_view_documents?: boolean | null
          can_view_tasks?: boolean | null
          created_at?: string | null
          id?: string
          invitation_message?: string | null
          invited_at?: string | null
          invited_by?: string | null
          last_accessed_at?: string | null
          project_id: string
          project_type: string
          role?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_expires_at?: string | null
          can_edit_documents?: boolean | null
          can_edit_tasks?: boolean | null
          can_upload_documents?: boolean | null
          can_view_documents?: boolean | null
          can_view_tasks?: boolean | null
          created_at?: string | null
          id?: string
          invitation_message?: string | null
          invited_at?: string | null
          invited_by?: string | null
          last_accessed_at?: string | null
          project_id?: string
          project_type?: string
          role?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      project_volunteer_positions: {
        Row: {
          board_id: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          skills_required: string[] | null
          slots_available: number | null
          slots_filled: number | null
          start_date: string | null
          time_commitment: string | null
          title: string
          updated_at: string
        }
        Insert: {
          board_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          skills_required?: string[] | null
          slots_available?: number | null
          slots_filled?: number | null
          start_date?: string | null
          time_commitment?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          board_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          skills_required?: string[] | null
          slots_available?: number | null
          slots_filled?: number | null
          start_date?: string | null
          time_commitment?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_volunteer_positions_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      project_volunteer_signups: {
        Row: {
          constituent_id: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          message: string | null
          phone: string | null
          position_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          constituent_id?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          message?: string | null
          phone?: string | null
          position_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          constituent_id?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          message?: string | null
          phone?: string | null
          position_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_volunteer_signups_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_volunteer_signups_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_volunteer_signups_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "project_volunteer_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      prospect_leads: {
        Row: {
          ai_insights: string | null
          ai_qualification_score: number | null
          assigned_to: string | null
          constituent_id: string | null
          created_at: string | null
          district: string | null
          email: string | null
          enrichment_data: Json | null
          enrichment_updated_at: string | null
          id: string
          last_contacted_at: string | null
          lead_score: number | null
          n8n_workflow_id: string | null
          next_outreach_scheduled: string | null
          notes: string | null
          phone: string | null
          recommended_action: string | null
          school_name: string | null
          source: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ai_insights?: string | null
          ai_qualification_score?: number | null
          assigned_to?: string | null
          constituent_id?: string | null
          created_at?: string | null
          district?: string | null
          email?: string | null
          enrichment_data?: Json | null
          enrichment_updated_at?: string | null
          id?: string
          last_contacted_at?: string | null
          lead_score?: number | null
          n8n_workflow_id?: string | null
          next_outreach_scheduled?: string | null
          notes?: string | null
          phone?: string | null
          recommended_action?: string | null
          school_name?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_insights?: string | null
          ai_qualification_score?: number | null
          assigned_to?: string | null
          constituent_id?: string | null
          created_at?: string | null
          district?: string | null
          email?: string | null
          enrichment_data?: Json | null
          enrichment_updated_at?: string | null
          id?: string
          last_contacted_at?: string | null
          lead_score?: number | null
          n8n_workflow_id?: string | null
          next_outreach_scheduled?: string | null
          notes?: string | null
          phone?: string | null
          recommended_action?: string | null
          school_name?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospect_leads_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospect_leads_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
        ]
      }
      quickbooks_connections: {
        Row: {
          access_token: string
          company_name: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          realm_id: string
          refresh_token: string
          token_expires_at: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          company_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          realm_id: string
          refresh_token: string
          token_expires_at: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          company_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          realm_id?: string
          refresh_token?: string
          token_expires_at?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quickbooks_entity_mappings: {
        Row: {
          created_at: string | null
          crm_entity_id: string
          entity_type: string
          id: string
          last_synced_at: string | null
          qb_entity_id: string
          qb_entity_type: string
          qb_sync_token: string | null
          sync_error: string | null
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          crm_entity_id: string
          entity_type: string
          id?: string
          last_synced_at?: string | null
          qb_entity_id: string
          qb_entity_type: string
          qb_sync_token?: string | null
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          crm_entity_id?: string
          entity_type?: string
          id?: string
          last_synced_at?: string | null
          qb_entity_id?: string
          qb_entity_type?: string
          qb_sync_token?: string | null
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quickbooks_fund_mappings: {
        Row: {
          created_at: string | null
          fund_designation: string
          id: string
          is_active: boolean | null
          qb_account_id: string | null
          qb_account_name: string | null
          qb_class_id: string | null
          qb_class_name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fund_designation: string
          id?: string
          is_active?: boolean | null
          qb_account_id?: string | null
          qb_account_name?: string | null
          qb_class_id?: string | null
          qb_class_name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fund_designation?: string
          id?: string
          is_active?: boolean | null
          qb_account_id?: string | null
          qb_account_name?: string | null
          qb_class_id?: string | null
          qb_class_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quickbooks_oauth_state: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          state_token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          state_token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          state_token?: string
          user_id?: string
        }
        Relationships: []
      }
      quickbooks_settings: {
        Row: {
          access_token_encrypted: string | null
          auto_sync_new_donations: boolean | null
          company_id: string | null
          company_name: string | null
          created_at: string | null
          default_ar_account_id: string | null
          default_ar_account_name: string | null
          default_income_account_id: string | null
          default_income_account_name: string | null
          id: string
          is_connected: boolean | null
          last_connection_test: string | null
          last_sync_at: string | null
          realm_id: string | null
          refresh_token_encrypted: string | null
          settings: Json | null
          sync_direction: string | null
          sync_enabled: boolean | null
          sync_frequency: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_token_encrypted?: string | null
          auto_sync_new_donations?: boolean | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string | null
          default_ar_account_id?: string | null
          default_ar_account_name?: string | null
          default_income_account_id?: string | null
          default_income_account_name?: string | null
          id?: string
          is_connected?: boolean | null
          last_connection_test?: string | null
          last_sync_at?: string | null
          realm_id?: string | null
          refresh_token_encrypted?: string | null
          settings?: Json | null
          sync_direction?: string | null
          sync_enabled?: boolean | null
          sync_frequency?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_token_encrypted?: string | null
          auto_sync_new_donations?: boolean | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string | null
          default_ar_account_id?: string | null
          default_ar_account_name?: string | null
          default_income_account_id?: string | null
          default_income_account_name?: string | null
          id?: string
          is_connected?: boolean | null
          last_connection_test?: string | null
          last_sync_at?: string | null
          realm_id?: string | null
          refresh_token_encrypted?: string | null
          settings?: Json | null
          sync_direction?: string | null
          sync_enabled?: boolean | null
          sync_frequency?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      quickbooks_sync_log: {
        Row: {
          completed_at: string | null
          direction: string
          entity_id: string | null
          entity_type: string | null
          error_details: Json | null
          id: string
          initiated_by: string | null
          records_created: number | null
          records_failed: number | null
          records_processed: number | null
          records_updated: number | null
          started_at: string | null
          status: string
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          direction: string
          entity_id?: string | null
          entity_type?: string | null
          error_details?: Json | null
          id?: string
          initiated_by?: string | null
          records_created?: number | null
          records_failed?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string | null
          status: string
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          direction?: string
          entity_id?: string | null
          entity_type?: string | null
          error_details?: Json | null
          id?: string
          initiated_by?: string | null
          records_created?: number | null
          records_failed?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string | null
          status?: string
          sync_type?: string
        }
        Relationships: []
      }
      record_activities: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          field_name: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
          record_id: string
          record_type: string
          user_avatar: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          description: string
          field_name?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          record_id: string
          record_type: string
          user_avatar?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          field_name?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          record_id?: string
          record_type?: string
          user_avatar?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      record_locks: {
        Row: {
          expires_at: string
          field_name: string
          id: string
          locked_at: string
          locked_by: string
          record_id: string
          record_type: string
        }
        Insert: {
          expires_at?: string
          field_name: string
          id?: string
          locked_at?: string
          locked_by: string
          record_id: string
          record_type: string
        }
        Update: {
          expires_at?: string
          field_name?: string
          id?: string
          locked_at?: string
          locked_by?: string
          record_id?: string
          record_type?: string
        }
        Relationships: []
      }
      record_versions: {
        Row: {
          changed_at: string
          changed_by: string
          id: string
          record_id: string
          record_type: string
          snapshot: Json
          version_number: number
        }
        Insert: {
          changed_at?: string
          changed_by: string
          id?: string
          record_id: string
          record_type: string
          snapshot: Json
          version_number: number
        }
        Update: {
          changed_at?: string
          changed_by?: string
          id?: string
          record_id?: string
          record_type?: string
          snapshot?: Json
          version_number?: number
        }
        Relationships: []
      }
      recurring_donations: {
        Row: {
          amount: number
          campaign_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          constituent_id: string | null
          created_at: string | null
          currency: string | null
          frequency: string
          fund_designation: string | null
          id: string
          last_payment_amount: number | null
          last_payment_date: string | null
          next_payment_date: string | null
          payment_count: number | null
          start_date: string
          status: string | null
          stripe_customer_id: string
          stripe_subscription_id: string
          total_donated: number | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          campaign_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          constituent_id?: string | null
          created_at?: string | null
          currency?: string | null
          frequency: string
          fund_designation?: string | null
          id?: string
          last_payment_amount?: number | null
          last_payment_date?: string | null
          next_payment_date?: string | null
          payment_count?: number | null
          start_date: string
          status?: string | null
          stripe_customer_id: string
          stripe_subscription_id: string
          total_donated?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          campaign_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          constituent_id?: string | null
          created_at?: string | null
          currency?: string | null
          frequency?: string
          fund_designation?: string | null
          id?: string
          last_payment_amount?: number | null
          last_payment_date?: string | null
          next_payment_date?: string | null
          payment_count?: number | null
          start_date?: string
          status?: string | null
          stripe_customer_id?: string
          stripe_subscription_id?: string
          total_donated?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "donation_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_donations_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_donations_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_types: {
        Row: {
          affects_household_gifts: boolean | null
          category: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          reciprocal_name: string | null
        }
        Insert: {
          affects_household_gifts?: boolean | null
          category: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          reciprocal_name?: string | null
        }
        Update: {
          affects_household_gifts?: boolean | null
          category?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          reciprocal_name?: string | null
        }
        Relationships: []
      }
      saas_admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          organization_id: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          organization_id?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saas_admin_audit_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_admin_audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "saas_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_config_sync_log: {
        Row: {
          config_pushed: Json | null
          created_at: string | null
          error_message: string | null
          id: string
          organization_id: string | null
          status: string
          sync_type: string
        }
        Insert: {
          config_pushed?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          organization_id?: string | null
          status: string
          sync_type: string
        }
        Update: {
          config_pushed?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          organization_id?: string | null
          status?: string
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "saas_config_sync_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "saas_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_feature_definitions: {
        Row: {
          available_enterprise: boolean | null
          available_professional: boolean | null
          available_starter: boolean | null
          category: string
          created_at: string | null
          description: string | null
          display_order: number | null
          icon_name: string | null
          id: string
          key: string
          name: string
          requires_addon: string | null
        }
        Insert: {
          available_enterprise?: boolean | null
          available_professional?: boolean | null
          available_starter?: boolean | null
          category: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          key: string
          name: string
          requires_addon?: string | null
        }
        Update: {
          available_enterprise?: boolean | null
          available_professional?: boolean | null
          available_starter?: boolean | null
          category?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          key?: string
          name?: string
          requires_addon?: string | null
        }
        Relationships: []
      }
      saas_organization_features: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          feature_key: string
          id: string
          is_enabled: boolean
          organization_id: string | null
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          feature_key: string
          id?: string
          is_enabled: boolean
          organization_id?: string | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          feature_key?: string
          id?: string
          is_enabled?: boolean
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saas_organization_features_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saas_organization_features_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "saas_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_organization_pipeline_stages: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          order_index: number
          organization_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          order_index: number
          organization_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          order_index?: number
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saas_organization_pipeline_stages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "saas_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_organization_templates: {
        Row: {
          created_at: string | null
          default_features: Json
          default_pipeline_stages: Json | null
          default_terminology: Json
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          organization_type: string
        }
        Insert: {
          created_at?: string | null
          default_features: Json
          default_pipeline_stages?: Json | null
          default_terminology: Json
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_type: string
        }
        Update: {
          created_at?: string | null
          default_features?: Json
          default_pipeline_stages?: Json | null
          default_terminology?: Json
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_type?: string
        }
        Relationships: []
      }
      saas_organization_terminology: {
        Row: {
          id: string
          organization_id: string | null
          term_key: string
          term_value: string
        }
        Insert: {
          id?: string
          organization_id?: string | null
          term_key: string
          term_value: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          term_key?: string
          term_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "saas_organization_terminology_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "saas_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_organizations: {
        Row: {
          accent_color: string | null
          addon_events: boolean | null
          addon_extra_emails: number | null
          addon_extra_users: number | null
          addon_mailchimp: boolean | null
          addon_quickbooks: boolean | null
          address_line1: string | null
          address_line2: string | null
          city: string | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          country: string | null
          created_at: string | null
          current_constituent_count: number | null
          current_period_end: string | null
          current_period_start: string | null
          current_user_count: number | null
          custom_domain: string | null
          deployment_url: string | null
          emails_sent_this_period: number | null
          id: string
          internal_notes: string | null
          last_config_sync_at: string | null
          logo_url: string | null
          name: string
          organization_type: string
          primary_color: string | null
          provisioned_at: string | null
          secondary_color: string | null
          slug: string
          state: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          subscription_tier: string
          supabase_anon_key: string | null
          supabase_project_ref: string | null
          supabase_service_role_key: string | null
          supabase_url: string | null
          trial_ends_at: string | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          accent_color?: string | null
          addon_events?: boolean | null
          addon_extra_emails?: number | null
          addon_extra_users?: number | null
          addon_mailchimp?: boolean | null
          addon_quickbooks?: boolean | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          current_constituent_count?: number | null
          current_period_end?: string | null
          current_period_start?: string | null
          current_user_count?: number | null
          custom_domain?: string | null
          deployment_url?: string | null
          emails_sent_this_period?: number | null
          id?: string
          internal_notes?: string | null
          last_config_sync_at?: string | null
          logo_url?: string | null
          name: string
          organization_type?: string
          primary_color?: string | null
          provisioned_at?: string | null
          secondary_color?: string | null
          slug: string
          state?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string
          supabase_anon_key?: string | null
          supabase_project_ref?: string | null
          supabase_service_role_key?: string | null
          supabase_url?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          accent_color?: string | null
          addon_events?: boolean | null
          addon_extra_emails?: number | null
          addon_extra_users?: number | null
          addon_mailchimp?: boolean | null
          addon_quickbooks?: boolean | null
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          current_constituent_count?: number | null
          current_period_end?: string | null
          current_period_start?: string | null
          current_user_count?: number | null
          custom_domain?: string | null
          deployment_url?: string | null
          emails_sent_this_period?: number | null
          id?: string
          internal_notes?: string | null
          last_config_sync_at?: string | null
          logo_url?: string | null
          name?: string
          organization_type?: string
          primary_color?: string | null
          provisioned_at?: string | null
          secondary_color?: string | null
          slug?: string
          state?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string
          supabase_anon_key?: string | null
          supabase_project_ref?: string | null
          supabase_service_role_key?: string | null
          supabase_url?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      salesforce_configurations: {
        Row: {
          created_at: string
          field_mappings: Json
          id: string
          instance_url: string
          is_active: boolean
          last_sync_at: string | null
          sync_frequency: unknown
          sync_settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          field_mappings?: Json
          id?: string
          instance_url: string
          is_active?: boolean
          last_sync_at?: string | null
          sync_frequency?: unknown
          sync_settings?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          field_mappings?: Json
          id?: string
          instance_url?: string
          is_active?: boolean
          last_sync_at?: string | null
          sync_frequency?: unknown
          sync_settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      salesforce_field_mappings: {
        Row: {
          config_id: string | null
          created_at: string | null
          crm_field: string
          crm_table: string
          id: string
          is_active: boolean | null
          salesforce_field: string
          salesforce_object: string
          transformation_rule: string | null
        }
        Insert: {
          config_id?: string | null
          created_at?: string | null
          crm_field: string
          crm_table: string
          id?: string
          is_active?: boolean | null
          salesforce_field: string
          salesforce_object: string
          transformation_rule?: string | null
        }
        Update: {
          config_id?: string | null
          created_at?: string | null
          crm_field?: string
          crm_table?: string
          id?: string
          is_active?: boolean | null
          salesforce_field?: string
          salesforce_object?: string
          transformation_rule?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salesforce_field_mappings_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "salesforce_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      salesforce_import_errors: {
        Row: {
          created_at: string | null
          error_message: string
          error_type: string
          id: string
          import_job_id: string | null
          record_data: Json | null
          resolution_action: string | null
          resolution_status: string | null
          resolved_at: string | null
          salesforce_object: string
          salesforce_record_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message: string
          error_type: string
          id?: string
          import_job_id?: string | null
          record_data?: Json | null
          resolution_action?: string | null
          resolution_status?: string | null
          resolved_at?: string | null
          salesforce_object: string
          salesforce_record_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string
          error_type?: string
          id?: string
          import_job_id?: string | null
          record_data?: Json | null
          resolution_action?: string | null
          resolution_status?: string | null
          resolved_at?: string | null
          salesforce_object?: string
          salesforce_record_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salesforce_import_errors_import_job_id_fkey"
            columns: ["import_job_id"]
            isOneToOne: false
            referencedRelation: "salesforce_import_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      salesforce_import_jobs: {
        Row: {
          completed_at: string | null
          config_id: string | null
          created_by: string | null
          created_records: number | null
          error_summary: Json | null
          failed_records: number | null
          filters: Json | null
          id: string
          job_type: string
          objects_to_import: Json
          processed_records: number | null
          started_at: string | null
          status: string
          total_records: number | null
          updated_records: number | null
        }
        Insert: {
          completed_at?: string | null
          config_id?: string | null
          created_by?: string | null
          created_records?: number | null
          error_summary?: Json | null
          failed_records?: number | null
          filters?: Json | null
          id?: string
          job_type: string
          objects_to_import?: Json
          processed_records?: number | null
          started_at?: string | null
          status?: string
          total_records?: number | null
          updated_records?: number | null
        }
        Update: {
          completed_at?: string | null
          config_id?: string | null
          created_by?: string | null
          created_records?: number | null
          error_summary?: Json | null
          failed_records?: number | null
          filters?: Json | null
          id?: string
          job_type?: string
          objects_to_import?: Json
          processed_records?: number | null
          started_at?: string | null
          status?: string
          total_records?: number | null
          updated_records?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "salesforce_import_jobs_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "salesforce_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      salesforce_record_mapping: {
        Row: {
          created_at: string | null
          crm_record_id: string
          crm_table: string
          id: string
          last_synced_at: string | null
          salesforce_id: string
          salesforce_object: string
        }
        Insert: {
          created_at?: string | null
          crm_record_id: string
          crm_table: string
          id?: string
          last_synced_at?: string | null
          salesforce_id: string
          salesforce_object: string
        }
        Update: {
          created_at?: string | null
          crm_record_id?: string
          crm_table?: string
          id?: string
          last_synced_at?: string | null
          salesforce_id?: string
          salesforce_object?: string
        }
        Relationships: []
      }
      salesforce_sync_log: {
        Row: {
          completed_at: string | null
          config_id: string
          direction: string
          error_details: Json | null
          id: string
          records_created: number
          records_failed: number
          records_processed: number
          records_updated: number
          started_at: string
          status: string
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          config_id: string
          direction: string
          error_details?: Json | null
          id?: string
          records_created?: number
          records_failed?: number
          records_processed?: number
          records_updated?: number
          started_at?: string
          status: string
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          config_id?: string
          direction?: string
          error_details?: Json | null
          id?: string
          records_created?: number
          records_failed?: number
          records_processed?: number
          records_updated?: number
          started_at?: string
          status?: string
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "salesforce_sync_log_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "salesforce_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      site_activities: {
        Row: {
          activity_date: string | null
          activity_type: string
          constituent_id: string | null
          created_at: string | null
          description: string | null
          follow_up_date: string | null
          follow_up_task_id: string | null
          id: string
          outcome: string | null
          site_id: string
          subject: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          activity_date?: string | null
          activity_type: string
          constituent_id?: string | null
          created_at?: string | null
          description?: string | null
          follow_up_date?: string | null
          follow_up_task_id?: string | null
          id?: string
          outcome?: string | null
          site_id: string
          subject?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          activity_date?: string | null
          activity_type?: string
          constituent_id?: string | null
          created_at?: string | null
          description?: string | null
          follow_up_date?: string | null
          follow_up_task_id?: string | null
          id?: string
          outcome?: string | null
          site_id?: string
          subject?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_activities_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_activities_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_activities_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_contacts: {
        Row: {
          constituent_id: string
          created_at: string | null
          id: string
          is_decision_maker: boolean | null
          is_primary: boolean | null
          notes: string | null
          role: string | null
          site_id: string
          updated_at: string | null
        }
        Insert: {
          constituent_id: string
          created_at?: string | null
          id?: string
          is_decision_maker?: boolean | null
          is_primary?: boolean | null
          notes?: string | null
          role?: string | null
          site_id: string
          updated_at?: string | null
        }
        Update: {
          constituent_id?: string
          created_at?: string | null
          id?: string
          is_decision_maker?: boolean | null
          is_primary?: boolean | null
          notes?: string | null
          role?: string | null
          site_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_contacts_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_contacts_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_contacts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_media: {
        Row: {
          caption: string | null
          created_at: string
          created_by: string | null
          file_name: string | null
          file_size: number | null
          file_url: string
          id: string
          is_featured: boolean | null
          media_type: Database["public"]["Enums"]["media_type"]
          site_id: string
          tags: string[] | null
          taken_at: string | null
          title: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          is_featured?: boolean | null
          media_type?: Database["public"]["Enums"]["media_type"]
          site_id: string
          tags?: string[] | null
          taken_at?: string | null
          title?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          is_featured?: boolean | null
          media_type?: Database["public"]["Enums"]["media_type"]
          site_id?: string
          tags?: string[] | null
          taken_at?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_media_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_metrics: {
        Row: {
          created_at: string
          created_by: string | null
          current_value: number | null
          id: string
          measurement_date: string
          metric_name: string
          metric_type: string | null
          notes: string | null
          site_id: string
          target_value: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_value?: number | null
          id?: string
          measurement_date?: string
          metric_name: string
          metric_type?: string | null
          notes?: string | null
          site_id: string
          target_value?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_value?: number | null
          id?: string
          measurement_date?: string
          metric_name?: string
          metric_type?: string | null
          notes?: string | null
          site_id?: string
          target_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_metrics_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_opportunities: {
        Row: {
          created_at: string | null
          id: string
          opportunity_id: string
          site_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          opportunity_id: string
          site_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          opportunity_id?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_opportunities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "major_gift_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_opportunities_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_programs: {
        Row: {
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          notes: string | null
          program_id: string
          site_id: string
          start_date: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          program_id: string
          site_id: string
          start_date?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          program_id?: string
          site_id?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_programs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_programs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_stories: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean | null
          person_name: string | null
          person_role: string | null
          published_date: string | null
          site_id: string
          story_content: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          person_name?: string | null
          person_role?: string | null
          published_date?: string | null
          site_id: string
          story_content: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          person_name?: string | null
          person_role?: string | null
          published_date?: string | null
          site_id?: string
          story_content?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_stories_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          address: string | null
          address_city: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          budget_tier: string | null
          city: string | null
          connection_notes: string | null
          connection_source: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          created_by: string | null
          decision_timeline: string | null
          description: string | null
          district_id: string | null
          district_name: string | null
          end_date: string | null
          enrollment: number | null
          grade_levels: string[] | null
          id: string
          instructor_name: string | null
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          meeting_days: string[] | null
          meeting_time: string | null
          name: string
          notes: string | null
          organization_id: string | null
          organization_type: string | null
          phone: string | null
          postal_code: string | null
          primary_contact_id: string | null
          relationship_started_at: string | null
          relationship_status: string | null
          site_type: string | null
          start_date: string | null
          state: string | null
          tags: string[] | null
          tech_readiness: string | null
          updated_at: string
          volunteers_needed: boolean | null
          website: string | null
        }
        Insert: {
          address?: string | null
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          budget_tier?: string | null
          city?: string | null
          connection_notes?: string | null
          connection_source?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          decision_timeline?: string | null
          description?: string | null
          district_id?: string | null
          district_name?: string | null
          end_date?: string | null
          enrollment?: number | null
          grade_levels?: string[] | null
          id?: string
          instructor_name?: string | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          meeting_days?: string[] | null
          meeting_time?: string | null
          name: string
          notes?: string | null
          organization_id?: string | null
          organization_type?: string | null
          phone?: string | null
          postal_code?: string | null
          primary_contact_id?: string | null
          relationship_started_at?: string | null
          relationship_status?: string | null
          site_type?: string | null
          start_date?: string | null
          state?: string | null
          tags?: string[] | null
          tech_readiness?: string | null
          updated_at?: string
          volunteers_needed?: boolean | null
          website?: string | null
        }
        Update: {
          address?: string | null
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          budget_tier?: string | null
          city?: string | null
          connection_notes?: string | null
          connection_source?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          decision_timeline?: string | null
          description?: string | null
          district_id?: string | null
          district_name?: string | null
          end_date?: string | null
          enrollment?: number | null
          grade_levels?: string[] | null
          id?: string
          instructor_name?: string | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          meeting_days?: string[] | null
          meeting_time?: string | null
          name?: string
          notes?: string | null
          organization_id?: string | null
          organization_type?: string | null
          phone?: string | null
          postal_code?: string | null
          primary_contact_id?: string | null
          relationship_started_at?: string | null
          relationship_status?: string | null
          site_type?: string | null
          start_date?: string | null
          state?: string | null
          tags?: string[] | null
          tech_readiness?: string | null
          updated_at?: string
          volunteers_needed?: boolean | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sites_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_config: {
        Row: {
          created_at: string | null
          default_currency: string | null
          id: string
          is_connected: boolean | null
          nonprofit_rate_approved: boolean | null
          publishable_key: string | null
          stripe_account_id: string | null
          updated_at: string | null
          webhook_secret: string | null
        }
        Insert: {
          created_at?: string | null
          default_currency?: string | null
          id?: string
          is_connected?: boolean | null
          nonprofit_rate_approved?: boolean | null
          publishable_key?: string | null
          stripe_account_id?: string | null
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Update: {
          created_at?: string | null
          default_currency?: string | null
          id?: string
          is_connected?: boolean | null
          nonprofit_rate_approved?: boolean | null
          publishable_key?: string | null
          stripe_account_id?: string | null
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Relationships: []
      }
      stripe_donations: {
        Row: {
          amount: number
          campaign_id: string | null
          constituent_id: string | null
          created_at: string | null
          currency: string | null
          donor_address: Json | null
          donor_covered_fee: boolean | null
          donor_email: string
          donor_first_name: string | null
          donor_last_name: string | null
          donor_phone: string | null
          employer_match: boolean | null
          employer_name: string | null
          fee_amount: number | null
          fee_covered_amount: number | null
          form_id: string | null
          fund_designation: string | null
          gift_id: string | null
          id: string
          ip_address: string | null
          is_anonymous: boolean | null
          is_recurring: boolean | null
          is_tribute: boolean | null
          net_amount: number | null
          recurring_frequency: string | null
          source_url: string | null
          status: string | null
          stripe_charge_id: string | null
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          stripe_subscription_id: string | null
          synced_to_crm: boolean | null
          tribute_name: string | null
          tribute_notify_email: string | null
          tribute_notify_name: string | null
          tribute_type: string | null
          updated_at: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          amount: number
          campaign_id?: string | null
          constituent_id?: string | null
          created_at?: string | null
          currency?: string | null
          donor_address?: Json | null
          donor_covered_fee?: boolean | null
          donor_email: string
          donor_first_name?: string | null
          donor_last_name?: string | null
          donor_phone?: string | null
          employer_match?: boolean | null
          employer_name?: string | null
          fee_amount?: number | null
          fee_covered_amount?: number | null
          form_id?: string | null
          fund_designation?: string | null
          gift_id?: string | null
          id?: string
          ip_address?: string | null
          is_anonymous?: boolean | null
          is_recurring?: boolean | null
          is_tribute?: boolean | null
          net_amount?: number | null
          recurring_frequency?: string | null
          source_url?: string | null
          status?: string | null
          stripe_charge_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          synced_to_crm?: boolean | null
          tribute_name?: string | null
          tribute_notify_email?: string | null
          tribute_notify_name?: string | null
          tribute_type?: string | null
          updated_at?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          amount?: number
          campaign_id?: string | null
          constituent_id?: string | null
          created_at?: string | null
          currency?: string | null
          donor_address?: Json | null
          donor_covered_fee?: boolean | null
          donor_email?: string
          donor_first_name?: string | null
          donor_last_name?: string | null
          donor_phone?: string | null
          employer_match?: boolean | null
          employer_name?: string | null
          fee_amount?: number | null
          fee_covered_amount?: number | null
          form_id?: string | null
          fund_designation?: string | null
          gift_id?: string | null
          id?: string
          ip_address?: string | null
          is_anonymous?: boolean | null
          is_recurring?: boolean | null
          is_tribute?: boolean | null
          net_amount?: number | null
          recurring_frequency?: string | null
          source_url?: string | null
          status?: string | null
          stripe_charge_id?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_subscription_id?: string | null
          synced_to_crm?: boolean | null
          tribute_name?: string | null
          tribute_notify_email?: string | null
          tribute_notify_name?: string | null
          tribute_type?: string | null
          updated_at?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "donation_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_donations_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_donations_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_donations_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "donation_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_donations_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admin_access_log: {
        Row: {
          accessed_at: string | null
          action: string
          admin_email: string
          admin_user_id: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          accessed_at?: string | null
          action: string
          admin_email: string
          admin_user_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          accessed_at?: string | null
          action?: string
          admin_email?: string
          admin_user_id?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_notes: string | null
          ai_resolved: boolean | null
          ai_response: string | null
          browser_info: Json | null
          created_at: string | null
          description: string | null
          id: string
          page_url: string | null
          severity: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          ai_resolved?: boolean | null
          ai_response?: string | null
          browser_info?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          page_url?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          ai_resolved?: boolean | null
          ai_response?: string | null
          browser_info?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          page_url?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          blocked_task_id: string
          blocking_task_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_task_id: string
          blocking_task_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_task_id?: string
          blocking_task_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_blocked_task_id_fkey"
            columns: ["blocked_task_id"]
            isOneToOne: false
            referencedRelation: "unified_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_blocking_task_id_fkey"
            columns: ["blocking_task_id"]
            isOneToOne: false
            referencedRelation: "unified_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_time_entries: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          ended_at: string | null
          id: string
          notes: string | null
          started_at: string
          unified_task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at: string
          unified_task_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string
          unified_task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_time_entries_unified_task_id_fkey"
            columns: ["unified_task_id"]
            isOneToOne: false
            referencedRelation: "unified_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          constituent_id: string | null
          created_at: string | null
          created_by: string | null
          depends_on_task_id: string | null
          description: string | null
          due_date: string | null
          id: string
          meeting_attendees: string | null
          meeting_context: string | null
          meeting_time: string | null
          related_gift_id: string | null
          related_grant_opportunity_id: string | null
          source_calendar_event_id: string | null
          source_email_id: string | null
          source_type: string | null
          status: string
          sync_to_notion: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          constituent_id?: string | null
          created_at?: string | null
          created_by?: string | null
          depends_on_task_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          meeting_attendees?: string | null
          meeting_context?: string | null
          meeting_time?: string | null
          related_gift_id?: string | null
          related_grant_opportunity_id?: string | null
          source_calendar_event_id?: string | null
          source_email_id?: string | null
          source_type?: string | null
          status?: string
          sync_to_notion?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          constituent_id?: string | null
          created_at?: string | null
          created_by?: string | null
          depends_on_task_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          meeting_attendees?: string | null
          meeting_context?: string | null
          meeting_time?: string | null
          related_gift_id?: string | null
          related_grant_opportunity_id?: string | null
          source_calendar_event_id?: string | null
          source_email_id?: string | null
          source_type?: string | null
          status?: string
          sync_to_notion?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_gift_id_fkey"
            columns: ["related_gift_id"]
            isOneToOne: false
            referencedRelation: "gifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_related_grant_opportunity_id_fkey"
            columns: ["related_grant_opportunity_id"]
            isOneToOne: false
            referencedRelation: "grant_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_source_calendar_event_id_fkey"
            columns: ["source_calendar_event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_source_email_id_fkey"
            columns: ["source_email_id"]
            isOneToOne: false
            referencedRelation: "processed_emails"
            referencedColumns: ["id"]
          },
        ]
      }
      unified_tasks: {
        Row: {
          actual_time_minutes: number | null
          assigned_to: string | null
          beta_criticality:
            | Database["public"]["Enums"]["beta_criticality"]
            | null
          blocking_tasks_count: number | null
          completed_at: string | null
          confidence_level:
            | Database["public"]["Enums"]["priority_confidence"]
            | null
          constituent_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          estimated_time_minutes: number | null
          external_deadline: boolean | null
          grant_opportunity_id: string | null
          id: string
          organization_id: string | null
          outcome_amount: number | null
          outcome_date: string | null
          outcome_id: string | null
          outcome_notes: string | null
          outcome_type: Database["public"]["Enums"]["task_outcome_type"] | null
          priority: Database["public"]["Enums"]["unified_task_priority"] | null
          priority_reasoning: string | null
          priority_score: number | null
          revenue_potential:
            | Database["public"]["Enums"]["revenue_potential"]
            | null
          source: Database["public"]["Enums"]["task_source"]
          source_id: string | null
          source_url: string | null
          status: string | null
          strategic_value: Database["public"]["Enums"]["strategic_value"] | null
          tags: string[] | null
          task_category:
            | Database["public"]["Enums"]["task_category_type"]
            | null
          technical_complexity:
            | Database["public"]["Enums"]["technical_complexity"]
            | null
          title: string
          updated_at: string | null
          user_impact_scope:
            | Database["public"]["Enums"]["user_impact_scope"]
            | null
        }
        Insert: {
          actual_time_minutes?: number | null
          assigned_to?: string | null
          beta_criticality?:
            | Database["public"]["Enums"]["beta_criticality"]
            | null
          blocking_tasks_count?: number | null
          completed_at?: string | null
          confidence_level?:
            | Database["public"]["Enums"]["priority_confidence"]
            | null
          constituent_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_time_minutes?: number | null
          external_deadline?: boolean | null
          grant_opportunity_id?: string | null
          id?: string
          organization_id?: string | null
          outcome_amount?: number | null
          outcome_date?: string | null
          outcome_id?: string | null
          outcome_notes?: string | null
          outcome_type?: Database["public"]["Enums"]["task_outcome_type"] | null
          priority?: Database["public"]["Enums"]["unified_task_priority"] | null
          priority_reasoning?: string | null
          priority_score?: number | null
          revenue_potential?:
            | Database["public"]["Enums"]["revenue_potential"]
            | null
          source?: Database["public"]["Enums"]["task_source"]
          source_id?: string | null
          source_url?: string | null
          status?: string | null
          strategic_value?:
            | Database["public"]["Enums"]["strategic_value"]
            | null
          tags?: string[] | null
          task_category?:
            | Database["public"]["Enums"]["task_category_type"]
            | null
          technical_complexity?:
            | Database["public"]["Enums"]["technical_complexity"]
            | null
          title: string
          updated_at?: string | null
          user_impact_scope?:
            | Database["public"]["Enums"]["user_impact_scope"]
            | null
        }
        Update: {
          actual_time_minutes?: number | null
          assigned_to?: string | null
          beta_criticality?:
            | Database["public"]["Enums"]["beta_criticality"]
            | null
          blocking_tasks_count?: number | null
          completed_at?: string | null
          confidence_level?:
            | Database["public"]["Enums"]["priority_confidence"]
            | null
          constituent_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_time_minutes?: number | null
          external_deadline?: boolean | null
          grant_opportunity_id?: string | null
          id?: string
          organization_id?: string | null
          outcome_amount?: number | null
          outcome_date?: string | null
          outcome_id?: string | null
          outcome_notes?: string | null
          outcome_type?: Database["public"]["Enums"]["task_outcome_type"] | null
          priority?: Database["public"]["Enums"]["unified_task_priority"] | null
          priority_reasoning?: string | null
          priority_score?: number | null
          revenue_potential?:
            | Database["public"]["Enums"]["revenue_potential"]
            | null
          source?: Database["public"]["Enums"]["task_source"]
          source_id?: string | null
          source_url?: string | null
          status?: string | null
          strategic_value?:
            | Database["public"]["Enums"]["strategic_value"]
            | null
          tags?: string[] | null
          task_category?:
            | Database["public"]["Enums"]["task_category_type"]
            | null
          technical_complexity?:
            | Database["public"]["Enums"]["technical_complexity"]
            | null
          title?: string
          updated_at?: string | null
          user_impact_scope?:
            | Database["public"]["Enums"]["user_impact_scope"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "unified_tasks_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unified_tasks_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unified_tasks_grant_opportunity_id_fkey"
            columns: ["grant_opportunity_id"]
            isOneToOne: false
            referencedRelation: "grant_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unified_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_integration_secrets: {
        Row: {
          created_at: string | null
          encrypted_secret: string
          id: string
          integration_type: string
          key_hint: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          encrypted_secret: string
          id?: string
          integration_type: string
          key_hint?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          encrypted_secret?: string
          id?: string
          integration_type?: string
          key_hint?: string | null
          updated_at?: string | null
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
          role: Database["public"]["Enums"]["app_role"]
          token: string
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
          role: Database["public"]["Enums"]["app_role"]
          token: string
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
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
        }
        Relationships: []
      }
      user_login_history: {
        Row: {
          id: string
          ip_address: string | null
          login_at: string | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          ip_address?: string | null
          login_at?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          ip_address?: string | null
          login_at?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_microsoft_connections: {
        Row: {
          access_token: string | null
          auto_approve_high_confidence: boolean | null
          auto_sync_enabled: boolean | null
          created_at: string | null
          excluded_senders: string[] | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          microsoft_email: string | null
          microsoft_user_id: string | null
          minimum_confidence_threshold: number | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          auto_approve_high_confidence?: boolean | null
          auto_sync_enabled?: boolean | null
          created_at?: string | null
          excluded_senders?: string[] | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          microsoft_email?: string | null
          microsoft_user_id?: string | null
          minimum_confidence_threshold?: number | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          auto_approve_high_confidence?: boolean | null
          auto_sync_enabled?: boolean | null
          created_at?: string | null
          excluded_senders?: string[] | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          microsoft_email?: string | null
          microsoft_user_id?: string | null
          minimum_confidence_threshold?: number | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          department: string | null
          email: string | null
          first_name: string
          id: string
          is_active: boolean | null
          is_super_admin: boolean | null
          job_title: string | null
          last_name: string
          organization_name: string | null
          phone: string | null
          updated_at: string | null
          user_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          first_name: string
          id: string
          is_active?: boolean | null
          is_super_admin?: boolean | null
          job_title?: string | null
          last_name: string
          organization_name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          first_name?: string
          id?: string
          is_active?: boolean | null
          is_super_admin?: boolean | null
          job_title?: string | null
          last_name?: string
          organization_name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      voice_contact_updates: {
        Row: {
          contact_id: string
          created_at: string
          fields_updated: Json | null
          id: string
          note_content: string | null
          recording_id: string
          update_type: Database["public"]["Enums"]["voice_update_type"]
        }
        Insert: {
          contact_id: string
          created_at?: string
          fields_updated?: Json | null
          id?: string
          note_content?: string | null
          recording_id: string
          update_type: Database["public"]["Enums"]["voice_update_type"]
        }
        Update: {
          contact_id?: string
          created_at?: string
          fields_updated?: Json | null
          id?: string
          note_content?: string | null
          recording_id?: string
          update_type?: Database["public"]["Enums"]["voice_update_type"]
        }
        Relationships: [
          {
            foreignKeyName: "voice_contact_updates_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_contact_updates_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_contact_updates_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "voice_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_next_steps: {
        Row: {
          assigned_to: string
          completed_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          organization_id: string | null
          priority: Database["public"]["Enums"]["voice_priority"]
          recording_id: string | null
          status: Database["public"]["Enums"]["voice_step_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string | null
          priority?: Database["public"]["Enums"]["voice_priority"]
          recording_id?: string | null
          status?: Database["public"]["Enums"]["voice_step_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string | null
          priority?: Database["public"]["Enums"]["voice_priority"]
          recording_id?: string | null
          status?: Database["public"]["Enums"]["voice_step_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_next_steps_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_next_steps_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_next_steps_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_next_steps_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "voice_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_notes: {
        Row: {
          audio_duration_seconds: number | null
          audio_url: string | null
          constituent_action: string | null
          constituent_id: string | null
          created_at: string
          created_by: string
          event_context: string | null
          extracted_data: Json | null
          id: string
          location: string | null
          processing_error: string | null
          processing_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          task_id: string | null
          transcription: string | null
          transcription_error: string | null
          transcription_status: string
          updated_at: string
        }
        Insert: {
          audio_duration_seconds?: number | null
          audio_url?: string | null
          constituent_action?: string | null
          constituent_id?: string | null
          created_at?: string
          created_by: string
          event_context?: string | null
          extracted_data?: Json | null
          id?: string
          location?: string | null
          processing_error?: string | null
          processing_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          task_id?: string | null
          transcription?: string | null
          transcription_error?: string | null
          transcription_status?: string
          updated_at?: string
        }
        Update: {
          audio_duration_seconds?: number | null
          audio_url?: string | null
          constituent_action?: string | null
          constituent_id?: string | null
          created_at?: string
          created_by?: string
          event_context?: string | null
          extracted_data?: Json | null
          id?: string
          location?: string | null
          processing_error?: string | null
          processing_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          task_id?: string | null
          transcription?: string | null
          transcription_error?: string | null
          transcription_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_notes_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_notes_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_notes_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_recordings: {
        Row: {
          audio_url: string | null
          created_at: string
          duration_seconds: number | null
          event_date: string | null
          event_name: string | null
          external_meeting_id: string | null
          file_size_bytes: number | null
          file_url: string | null
          id: string
          meeting_attendees: Json | null
          meeting_title: string | null
          organization_id: string | null
          processed_data: Json | null
          processing_status: Database["public"]["Enums"]["voice_processing_status"]
          source: string | null
          transcript: string
          transcript_raw: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          event_date?: string | null
          event_name?: string | null
          external_meeting_id?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          meeting_attendees?: Json | null
          meeting_title?: string | null
          organization_id?: string | null
          processed_data?: Json | null
          processing_status?: Database["public"]["Enums"]["voice_processing_status"]
          source?: string | null
          transcript: string
          transcript_raw?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          duration_seconds?: number | null
          event_date?: string | null
          event_name?: string | null
          external_meeting_id?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          meeting_attendees?: Json | null
          meeting_title?: string | null
          organization_id?: string | null
          processed_data?: Json | null
          processing_status?: Database["public"]["Enums"]["voice_processing_status"]
          source?: string | null
          transcript?: string
          transcript_raw?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_recordings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_event_registrations: {
        Row: {
          attendance_confirmed: boolean | null
          attendance_notes: string | null
          availability_notes: string | null
          company: string | null
          constituent_id: string | null
          created_at: string | null
          custom_responses: Json | null
          dietary_restrictions: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          event_id: string | null
          id: string
          job_title: string | null
          referral_source: string | null
          registration_date: string | null
          registration_source: string | null
          reminder_sent_at: string | null
          shirt_size: string | null
          skills_offered: string[] | null
          special_accommodations: string | null
          status: string | null
          thank_you_sent_at: string | null
          updated_at: string | null
          waiver_signed: boolean | null
          waiver_signed_at: string | null
        }
        Insert: {
          attendance_confirmed?: boolean | null
          attendance_notes?: string | null
          availability_notes?: string | null
          company?: string | null
          constituent_id?: string | null
          created_at?: string | null
          custom_responses?: Json | null
          dietary_restrictions?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          event_id?: string | null
          id?: string
          job_title?: string | null
          referral_source?: string | null
          registration_date?: string | null
          registration_source?: string | null
          reminder_sent_at?: string | null
          shirt_size?: string | null
          skills_offered?: string[] | null
          special_accommodations?: string | null
          status?: string | null
          thank_you_sent_at?: string | null
          updated_at?: string | null
          waiver_signed?: boolean | null
          waiver_signed_at?: string | null
        }
        Update: {
          attendance_confirmed?: boolean | null
          attendance_notes?: string | null
          availability_notes?: string | null
          company?: string | null
          constituent_id?: string | null
          created_at?: string | null
          custom_responses?: Json | null
          dietary_restrictions?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          event_id?: string | null
          id?: string
          job_title?: string | null
          referral_source?: string | null
          registration_date?: string | null
          registration_source?: string | null
          reminder_sent_at?: string | null
          shirt_size?: string | null
          skills_offered?: string[] | null
          special_accommodations?: string | null
          status?: string | null
          thank_you_sent_at?: string | null
          updated_at?: string | null
          waiver_signed?: boolean | null
          waiver_signed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_event_registrations_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_event_registrations_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "volunteer_events"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_events: {
        Row: {
          contact_person_id: string | null
          created_at: string | null
          created_by: string | null
          custom_fields: Json | null
          description: string | null
          end_date: string | null
          event_type: string | null
          form_field_settings: Json | null
          id: string
          image_url: string | null
          is_active: boolean
          location: string | null
          location_type: string | null
          max_volunteers: number | null
          parent_event_id: string | null
          public_signup_enabled: boolean | null
          recurrence_end_date: string | null
          recurrence_rule: string | null
          signup_form_slug: string | null
          site_id: string | null
          skills_needed: string[] | null
          start_date: string
          status: string | null
          title: string
          updated_at: string | null
          virtual_link: string | null
          volunteers_registered: number | null
          waiver_text: string | null
        }
        Insert: {
          contact_person_id?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          form_field_settings?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          location?: string | null
          location_type?: string | null
          max_volunteers?: number | null
          parent_event_id?: string | null
          public_signup_enabled?: boolean | null
          recurrence_end_date?: string | null
          recurrence_rule?: string | null
          signup_form_slug?: string | null
          site_id?: string | null
          skills_needed?: string[] | null
          start_date: string
          status?: string | null
          title: string
          updated_at?: string | null
          virtual_link?: string | null
          volunteers_registered?: number | null
          waiver_text?: string | null
        }
        Update: {
          contact_person_id?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_fields?: Json | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          form_field_settings?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          location?: string | null
          location_type?: string | null
          max_volunteers?: number | null
          parent_event_id?: string | null
          public_signup_enabled?: boolean | null
          recurrence_end_date?: string | null
          recurrence_rule?: string | null
          signup_form_slug?: string | null
          site_id?: string | null
          skills_needed?: string[] | null
          start_date?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          virtual_link?: string | null
          volunteers_registered?: number | null
          waiver_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_events_contact_person_id_fkey"
            columns: ["contact_person_id"]
            isOneToOne: false
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_events_contact_person_id_fkey"
            columns: ["contact_person_id"]
            isOneToOne: false
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "volunteer_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_events_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_profiles: {
        Row: {
          availability: string | null
          background_check_date: string | null
          background_check_status: string | null
          constituent_id: string | null
          created_at: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          id: string
          interests: string[] | null
          notes: string | null
          preferred_roles: string[] | null
          skills: string[] | null
          status: string | null
          t_shirt_size: string | null
          total_events: number | null
          total_hours: number | null
          updated_at: string | null
          volunteer_since: string | null
        }
        Insert: {
          availability?: string | null
          background_check_date?: string | null
          background_check_status?: string | null
          constituent_id?: string | null
          created_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          interests?: string[] | null
          notes?: string | null
          preferred_roles?: string[] | null
          skills?: string[] | null
          status?: string | null
          t_shirt_size?: string | null
          total_events?: number | null
          total_hours?: number | null
          updated_at?: string | null
          volunteer_since?: string | null
        }
        Update: {
          availability?: string | null
          background_check_date?: string | null
          background_check_status?: string | null
          constituent_id?: string | null
          created_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          interests?: string[] | null
          notes?: string | null
          preferred_roles?: string[] | null
          skills?: string[] | null
          status?: string | null
          t_shirt_size?: string | null
          total_events?: number | null
          total_hours?: number | null
          updated_at?: string | null
          volunteer_since?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_profiles_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: true
            referencedRelation: "constituents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_profiles_constituent_id_fkey"
            columns: ["constituent_id"]
            isOneToOne: true
            referencedRelation: "constituents_with_ltv"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      approved_speakers_public: {
        Row: {
          audience_sizes_comfortable: string[] | null
          bio: string | null
          city: string | null
          first_name: string | null
          id: string | null
          last_name_initial: string | null
          pool_type: string | null
          presentation_style: string[] | null
          speaker_topics: string[] | null
          state: string | null
        }
        Insert: {
          audience_sizes_comfortable?: string[] | null
          bio?: string | null
          city?: string | null
          first_name?: string | null
          id?: string | null
          last_name_initial?: never
          pool_type?: string | null
          presentation_style?: string[] | null
          speaker_topics?: string[] | null
          state?: string | null
        }
        Update: {
          audience_sizes_comfortable?: string[] | null
          bio?: string | null
          city?: string | null
          first_name?: string | null
          id?: string | null
          last_name_initial?: never
          pool_type?: string | null
          presentation_style?: string[] | null
          speaker_topics?: string[] | null
          state?: string | null
        }
        Relationships: []
      }
      constituents_with_ltv: {
        Row: {
          active_pledge_count: number | null
          communication_preference:
            | Database["public"]["Enums"]["communication_preference"]
            | null
          created_at: string | null
          created_by: string | null
          do_not_call: boolean | null
          do_not_contact: boolean | null
          do_not_email: boolean | null
          do_not_mail: boolean | null
          donor_since: string | null
          donor_type: string | null
          email_engagement_score: number | null
          email_preferences: Json | null
          employer: string | null
          first_gift_date: string | null
          first_name: string | null
          full_legal_name: string | null
          giving_level: string | null
          home_phone: string | null
          household_id: string | null
          id: string | null
          last_activity_date: string | null
          last_gift_amount: number | null
          last_gift_date: string | null
          last_name: string | null
          last_soft_credit_date: string | null
          mailchimp_avg_click_rate: number | null
          mailchimp_avg_open_rate: number | null
          mailchimp_last_changed: string | null
          mailchimp_member_rating: number | null
          mailchimp_signup_date: string | null
          mailchimp_status: string | null
          mailchimp_subscriber_id: string | null
          mailchimp_tags: string[] | null
          mailchimp_vip: boolean | null
          mailing_city: string | null
          mailing_country: string | null
          mailing_postal_code: string | null
          mailing_state: string | null
          mailing_street: string | null
          mobile_phone: string | null
          organization_id: string | null
          outstanding_pledge_balance: number | null
          phone: string | null
          preferred_name: string | null
          primary_address: string | null
          primary_email: string | null
          salesforce_id: string | null
          salesforce_last_sync: string | null
          salutation: string | null
          soft_credit_count: number | null
          title: string | null
          total_lifetime_giving: number | null
          total_ltv: number | null
          total_pledge_amount: number | null
          total_soft_credit_amount: number | null
          unsubscribe_date: string | null
          updated_at: string | null
        }
        Insert: {
          active_pledge_count?: number | null
          communication_preference?:
            | Database["public"]["Enums"]["communication_preference"]
            | null
          created_at?: string | null
          created_by?: string | null
          do_not_call?: boolean | null
          do_not_contact?: boolean | null
          do_not_email?: boolean | null
          do_not_mail?: boolean | null
          donor_since?: string | null
          donor_type?: string | null
          email_engagement_score?: number | null
          email_preferences?: Json | null
          employer?: string | null
          first_gift_date?: string | null
          first_name?: string | null
          full_legal_name?: string | null
          giving_level?: string | null
          home_phone?: string | null
          household_id?: string | null
          id?: string | null
          last_activity_date?: string | null
          last_gift_amount?: number | null
          last_gift_date?: string | null
          last_name?: string | null
          last_soft_credit_date?: string | null
          mailchimp_avg_click_rate?: number | null
          mailchimp_avg_open_rate?: number | null
          mailchimp_last_changed?: string | null
          mailchimp_member_rating?: number | null
          mailchimp_signup_date?: string | null
          mailchimp_status?: string | null
          mailchimp_subscriber_id?: string | null
          mailchimp_tags?: string[] | null
          mailchimp_vip?: boolean | null
          mailing_city?: string | null
          mailing_country?: string | null
          mailing_postal_code?: string | null
          mailing_state?: string | null
          mailing_street?: string | null
          mobile_phone?: string | null
          organization_id?: string | null
          outstanding_pledge_balance?: number | null
          phone?: string | null
          preferred_name?: string | null
          primary_address?: string | null
          primary_email?: string | null
          salesforce_id?: string | null
          salesforce_last_sync?: string | null
          salutation?: string | null
          soft_credit_count?: number | null
          title?: string | null
          total_lifetime_giving?: number | null
          total_ltv?: never
          total_pledge_amount?: number | null
          total_soft_credit_amount?: number | null
          unsubscribe_date?: string | null
          updated_at?: string | null
        }
        Update: {
          active_pledge_count?: number | null
          communication_preference?:
            | Database["public"]["Enums"]["communication_preference"]
            | null
          created_at?: string | null
          created_by?: string | null
          do_not_call?: boolean | null
          do_not_contact?: boolean | null
          do_not_email?: boolean | null
          do_not_mail?: boolean | null
          donor_since?: string | null
          donor_type?: string | null
          email_engagement_score?: number | null
          email_preferences?: Json | null
          employer?: string | null
          first_gift_date?: string | null
          first_name?: string | null
          full_legal_name?: string | null
          giving_level?: string | null
          home_phone?: string | null
          household_id?: string | null
          id?: string | null
          last_activity_date?: string | null
          last_gift_amount?: number | null
          last_gift_date?: string | null
          last_name?: string | null
          last_soft_credit_date?: string | null
          mailchimp_avg_click_rate?: number | null
          mailchimp_avg_open_rate?: number | null
          mailchimp_last_changed?: string | null
          mailchimp_member_rating?: number | null
          mailchimp_signup_date?: string | null
          mailchimp_status?: string | null
          mailchimp_subscriber_id?: string | null
          mailchimp_tags?: string[] | null
          mailchimp_vip?: boolean | null
          mailing_city?: string | null
          mailing_country?: string | null
          mailing_postal_code?: string | null
          mailing_state?: string | null
          mailing_street?: string | null
          mobile_phone?: string | null
          organization_id?: string | null
          outstanding_pledge_balance?: number | null
          phone?: string | null
          preferred_name?: string | null
          primary_address?: string | null
          primary_email?: string | null
          salesforce_id?: string | null
          salesforce_last_sync?: string | null
          salutation?: string | null
          soft_credit_count?: number | null
          title?: string | null
          total_lifetime_giving?: number | null
          total_ltv?: never
          total_pledge_amount?: number | null
          total_soft_credit_amount?: number | null
          unsubscribe_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "constituents_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "constituents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_metric_progress: {
        Args: { metric_id_param: string }
        Returns: {
          current_value: number
          last_measurement_date: string
          measurements_count: number
          progress_percentage: number
          target_value: number
        }[]
      }
      calculate_pledge_balance: {
        Args: { pledge_id_param: string }
        Returns: number
      }
      can_edit_board_cards: {
        Args: { _board_id: string; _user_id: string }
        Returns: boolean
      }
      can_manage_board: {
        Args: { _board_id: string; _user_id: string }
        Returns: boolean
      }
      cleanup_expired_locks: { Args: never; Returns: undefined }
      cleanup_expired_oauth_states: { Args: never; Returns: undefined }
      cleanup_expired_quickbooks_oauth_states: {
        Args: never
        Returns: undefined
      }
      create_overdue_acknowledgment_tasks: { Args: never; Returns: number }
      decrypt_org_secret: {
        Args: { p_encrypted: string; p_org_id: string }
        Returns: string
      }
      decrypt_user_secret: {
        Args: { p_encrypted: string; p_user_id: string }
        Returns: string
      }
      delete_user_integration_secret: {
        Args: { p_integration_type: string }
        Returns: Json
      }
      encrypt_org_secret: {
        Args: { p_org_id: string; p_secret: string }
        Returns: string
      }
      encrypt_user_secret: {
        Args: { p_secret: string; p_user_id: string }
        Returns: string
      }
      extract_document_text: { Args: { doc_id: string }; Returns: undefined }
      generate_confirmation_number: {
        Args: { prefix?: string }
        Returns: string
      }
      get_board_member_role: {
        Args: { _board_id: string; _user_id: string }
        Returns: string
      }
      get_board_member_user_ids: {
        Args: { _user_id: string }
        Returns: string[]
      }
      get_foreign_keys: {
        Args: never
        Returns: {
          constraint_name: string
          definition: string
        }[]
      }
      get_program_impact_summary: {
        Args: { program_id_param: string }
        Returns: {
          active_grants: number
          metrics_at_risk: number
          metrics_on_track: number
          total_beneficiaries: number
          total_funding: number
        }[]
      }
      get_rls_policies: {
        Args: never
        Returns: {
          definition: string
          policy_name: string
          table_name: string
        }[]
      }
      get_schema_enums: {
        Args: never
        Returns: {
          definition: string
          enum_name: string
        }[]
      }
      get_schema_functions: {
        Args: never
        Returns: {
          definition: string
          function_name: string
        }[]
      }
      get_schema_policies: {
        Args: never
        Returns: {
          definition: string
          policy_name: string
        }[]
      }
      get_schema_tables: {
        Args: never
        Returns: {
          definition: string
          table_name: string
        }[]
      }
      get_schema_triggers: {
        Args: never
        Returns: {
          definition: string
          trigger_name: string
        }[]
      }
      get_subscription_tier: { Args: never; Returns: string }
      get_table_dependencies: {
        Args: never
        Returns: {
          referenced_table: string
          table_name: string
        }[]
      }
      get_unsynced_constituents: {
        Args: { limit_count?: number }
        Returns: {
          constituent_id: string
          email: string
          name: string
          total_giving: number
        }[]
      }
      get_unsynced_gifts: {
        Args: { limit_count?: number }
        Returns: {
          amount: number
          donor_name: string
          fund: string
          gift_date: string
          gift_id: string
          is_pledge: boolean
        }[]
      }
      get_user_board_ids: { Args: { _user_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_user_integration_secret: {
        Args: { p_integration_type: string }
        Returns: Json
      }
      increment_campaign_donation: {
        Args: { p_amount: number; p_campaign_id: string }
        Returns: undefined
      }
      increment_content_use_count: {
        Args: { content_id: string }
        Returns: undefined
      }
      is_board_member: {
        Args: { _board_id: string; _user_id: string }
        Returns: boolean
      }
      is_board_owner: {
        Args: { _board_id: string; _user_id: string }
        Returns: boolean
      }
      is_feedback_admin: { Args: never; Returns: boolean }
      is_project_role: { Args: { _user_id: string }; Returns: boolean }
      is_subscription_active: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      save_user_integration_secret: {
        Args: { p_integration_type: string; p_secret: string }
        Returns: Json
      }
      search_content_repository: {
        Args: {
          content_type_filter?: string
          max_results?: number
          only_approved?: boolean
          query_embedding?: string
          search_mode?: string
          search_query?: string
          tag_filter?: string
        }
        Returns: {
          category: string
          content: string
          content_type: string
          created_at: string
          created_by: string
          id: string
          is_approved: boolean
          is_template: boolean
          last_used_at: string
          similarity: number
          tags: string[]
          title: string
          updated_at: string
          use_count: number
        }[]
      }
      search_documents: {
        Args: {
          category_filter?: string
          grant_id_filter?: string
          match_threshold?: number
          max_results?: number
          search_mode?: string
          search_query?: string
        }
        Returns: {
          category_name: string
          document_id: string
          excerpt: string
          file_name: string
          grant_id: string
          relevance_score: number
        }[]
      }
      user_is_board_member: {
        Args: { _board_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      acknowledgment_status:
        | "not_sent"
        | "sent"
        | "received"
        | "declined"
        | "pending"
      app_role: "admin" | "staff" | "viewer" | "project"
      asset_type:
        | "document"
        | "template"
        | "proposal"
        | "budget"
        | "report"
        | "presentation"
        | "letter"
        | "video"
        | "image"
        | "other"
      beta_criticality:
        | "critical_blocker"
        | "important_for_quality"
        | "nice_to_have"
        | "post_beta"
      board_activity_type:
        | "created"
        | "moved"
        | "assigned"
        | "due_date_changed"
        | "completed"
        | "commented"
        | "time_logged"
      board_automation_action:
        | "assign_user"
        | "set_priority"
        | "add_label"
        | "notify"
        | "move_card"
      board_automation_trigger:
        | "card_moved"
        | "card_created"
        | "due_date_approaching"
        | "card_completed"
      board_card_priority: "low" | "medium" | "high" | "urgent"
      board_column_type:
        | "backlog"
        | "todo"
        | "in_progress"
        | "review"
        | "done"
        | "custom"
      board_member_role: "owner" | "admin" | "member" | "viewer"
      board_type:
        | "general"
        | "grant_application"
        | "event"
        | "campaign"
        | "program"
      burndown_expense_category_type:
        | "payroll"
        | "benefits"
        | "rent"
        | "utilities"
        | "program_costs"
        | "professional_services"
        | "supplies"
        | "other"
      burndown_expense_status: "projected" | "approved" | "paid"
      burndown_income_category_type:
        | "program_fees"
        | "grants"
        | "individual_gifts"
        | "corporate_gifts"
        | "events"
        | "other"
      burndown_income_status: "projected" | "confirmed" | "received"
      burndown_recurrence_interval: "monthly" | "quarterly" | "annually"
      communication_preference:
        | "email"
        | "phone"
        | "mail"
        | "sms"
        | "no_contact"
      content_tag:
        | "education"
        | "healthcare"
        | "environment"
        | "arts_culture"
        | "social_services"
        | "research"
        | "capital_campaign"
        | "operations"
        | "program_specific"
        | "general"
        | "youth"
        | "senior"
        | "community"
        | "innovation"
        | "equity"
        | "sustainability"
      evaluator_type: "site_manager" | "audience" | "student" | "parent"
      feedback_type: "speaker" | "teacher"
      fund_designation:
        | "general_fund"
        | "capital_campaign"
        | "endowment"
        | "program_specific"
        | "scholarship"
        | "research"
        | "unrestricted"
        | "other"
      grant_status:
        | "prospecting"
        | "research"
        | "letter_of_inquiry"
        | "invited_to_apply"
        | "application_in_progress"
        | "submitted"
        | "under_review"
        | "awarded"
        | "declined"
        | "withdrawn"
        | "reporting"
        | "letter_of_inquiry_in_progress"
        | "letter_of_inquiry_submitted"
      lms_enrollment_status:
        | "enrolled"
        | "active"
        | "completed"
        | "dropped"
        | "withdrawn"
      lms_sync_direction: "lms_to_crm" | "crm_to_lms" | "bidirectional"
      lms_sync_status: "started" | "in_progress" | "completed" | "failed"
      lms_sync_type:
        | "students"
        | "courses"
        | "enrollments"
        | "progress"
        | "full"
      lms_type:
        | "moodle"
        | "canvas"
        | "blackboard"
        | "teachable"
        | "thinkific"
        | "custom"
      major_gift_stage:
        | "identification"
        | "qualification"
        | "cultivation"
        | "solicitation"
        | "stewardship"
        | "closed_won"
        | "closed_lost"
      media_type: "photo" | "video"
      organization_type: "nonprofit" | "for_profit"
      priority_confidence: "high" | "medium" | "low"
      revenue_potential:
        | "enables_paying_customers"
        | "validates_willingness_to_pay"
        | "partnership_opportunity"
        | "no_revenue_connection"
      strategic_value:
        | "unique_differentiator"
        | "market_position"
        | "builds_capability"
        | "routine_execution"
      task_category_type:
        | "cultivation"
        | "stewardship"
        | "prospecting"
        | "grant_writing"
        | "admin"
        | "reporting"
        | "events"
        | "communications"
      task_outcome_type:
        | "gift_received"
        | "grant_awarded"
        | "grant_submitted"
        | "relationship_advanced"
        | "meeting_scheduled"
        | "pledge_secured"
        | "event_attendance"
        | "other"
      task_source:
        | "manual"
        | "board_card"
        | "grant_deliverable"
        | "email_suggestion"
        | "voice_note"
        | "calendar_meeting"
      technical_complexity: "low" | "medium" | "high" | "very_high"
      unified_task_priority: "low" | "medium" | "high" | "urgent"
      user_impact_scope:
        | "all_users_core_experience"
        | "majority_users"
        | "specific_segment"
        | "internal_only"
      voice_priority: "low" | "medium" | "high"
      voice_processing_status:
        | "recording"
        | "transcribing"
        | "processing"
        | "completed"
        | "failed"
      voice_step_status: "pending" | "in_progress" | "completed" | "cancelled"
      voice_update_type: "created" | "updated" | "note_added"
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
      acknowledgment_status: [
        "not_sent",
        "sent",
        "received",
        "declined",
        "pending",
      ],
      app_role: ["admin", "staff", "viewer", "project"],
      asset_type: [
        "document",
        "template",
        "proposal",
        "budget",
        "report",
        "presentation",
        "letter",
        "video",
        "image",
        "other",
      ],
      beta_criticality: [
        "critical_blocker",
        "important_for_quality",
        "nice_to_have",
        "post_beta",
      ],
      board_activity_type: [
        "created",
        "moved",
        "assigned",
        "due_date_changed",
        "completed",
        "commented",
        "time_logged",
      ],
      board_automation_action: [
        "assign_user",
        "set_priority",
        "add_label",
        "notify",
        "move_card",
      ],
      board_automation_trigger: [
        "card_moved",
        "card_created",
        "due_date_approaching",
        "card_completed",
      ],
      board_card_priority: ["low", "medium", "high", "urgent"],
      board_column_type: [
        "backlog",
        "todo",
        "in_progress",
        "review",
        "done",
        "custom",
      ],
      board_member_role: ["owner", "admin", "member", "viewer"],
      board_type: [
        "general",
        "grant_application",
        "event",
        "campaign",
        "program",
      ],
      burndown_expense_category_type: [
        "payroll",
        "benefits",
        "rent",
        "utilities",
        "program_costs",
        "professional_services",
        "supplies",
        "other",
      ],
      burndown_expense_status: ["projected", "approved", "paid"],
      burndown_income_category_type: [
        "program_fees",
        "grants",
        "individual_gifts",
        "corporate_gifts",
        "events",
        "other",
      ],
      burndown_income_status: ["projected", "confirmed", "received"],
      burndown_recurrence_interval: ["monthly", "quarterly", "annually"],
      communication_preference: ["email", "phone", "mail", "sms", "no_contact"],
      content_tag: [
        "education",
        "healthcare",
        "environment",
        "arts_culture",
        "social_services",
        "research",
        "capital_campaign",
        "operations",
        "program_specific",
        "general",
        "youth",
        "senior",
        "community",
        "innovation",
        "equity",
        "sustainability",
      ],
      evaluator_type: ["site_manager", "audience", "student", "parent"],
      feedback_type: ["speaker", "teacher"],
      fund_designation: [
        "general_fund",
        "capital_campaign",
        "endowment",
        "program_specific",
        "scholarship",
        "research",
        "unrestricted",
        "other",
      ],
      grant_status: [
        "prospecting",
        "research",
        "letter_of_inquiry",
        "invited_to_apply",
        "application_in_progress",
        "submitted",
        "under_review",
        "awarded",
        "declined",
        "withdrawn",
        "reporting",
        "letter_of_inquiry_in_progress",
        "letter_of_inquiry_submitted",
      ],
      lms_enrollment_status: [
        "enrolled",
        "active",
        "completed",
        "dropped",
        "withdrawn",
      ],
      lms_sync_direction: ["lms_to_crm", "crm_to_lms", "bidirectional"],
      lms_sync_status: ["started", "in_progress", "completed", "failed"],
      lms_sync_type: ["students", "courses", "enrollments", "progress", "full"],
      lms_type: [
        "moodle",
        "canvas",
        "blackboard",
        "teachable",
        "thinkific",
        "custom",
      ],
      major_gift_stage: [
        "identification",
        "qualification",
        "cultivation",
        "solicitation",
        "stewardship",
        "closed_won",
        "closed_lost",
      ],
      media_type: ["photo", "video"],
      organization_type: ["nonprofit", "for_profit"],
      priority_confidence: ["high", "medium", "low"],
      revenue_potential: [
        "enables_paying_customers",
        "validates_willingness_to_pay",
        "partnership_opportunity",
        "no_revenue_connection",
      ],
      strategic_value: [
        "unique_differentiator",
        "market_position",
        "builds_capability",
        "routine_execution",
      ],
      task_category_type: [
        "cultivation",
        "stewardship",
        "prospecting",
        "grant_writing",
        "admin",
        "reporting",
        "events",
        "communications",
      ],
      task_outcome_type: [
        "gift_received",
        "grant_awarded",
        "grant_submitted",
        "relationship_advanced",
        "meeting_scheduled",
        "pledge_secured",
        "event_attendance",
        "other",
      ],
      task_source: [
        "manual",
        "board_card",
        "grant_deliverable",
        "email_suggestion",
        "voice_note",
        "calendar_meeting",
      ],
      technical_complexity: ["low", "medium", "high", "very_high"],
      unified_task_priority: ["low", "medium", "high", "urgent"],
      user_impact_scope: [
        "all_users_core_experience",
        "majority_users",
        "specific_segment",
        "internal_only",
      ],
      voice_priority: ["low", "medium", "high"],
      voice_processing_status: [
        "recording",
        "transcribing",
        "processing",
        "completed",
        "failed",
      ],
      voice_step_status: ["pending", "in_progress", "completed", "cancelled"],
      voice_update_type: ["created", "updated", "note_added"],
    },
  },
} as const
