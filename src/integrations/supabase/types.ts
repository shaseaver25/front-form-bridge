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
          icon_attachment_url: string | null
          id: string
          is_unsubscribed: boolean | null
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
          unsubscribed_at: string | null
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
          enrichment_data?: Json | null
          enrichment_source?: string | null
          enrichment_status?: string | null
          enrichment_updated_at?: string | null
          first_name?: string | null
          icon_attachment_url?: string | null
          id?: string
          is_unsubscribed?: boolean | null
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
          unsubscribed_at?: string | null
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
          enrichment_data?: Json | null
          enrichment_source?: string | null
          enrichment_status?: string | null
          enrichment_updated_at?: string | null
          first_name?: string | null
          icon_attachment_url?: string | null
          id?: string
          is_unsubscribed?: boolean | null
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
