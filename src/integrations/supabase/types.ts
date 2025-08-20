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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown | null
          last_activity: string
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          last_activity?: string
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          last_activity?: string
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      agent_copay_spending: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          month_year: string
          total_requests: number | null
          total_spent: number | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          month_year: string
          total_requests?: number | null
          total_spent?: number | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          month_year?: string
          total_requests?: number | null
          total_spent?: number | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      agent_invitations: {
        Row: {
          agent_company: string | null
          agent_email: string
          agent_name: string | null
          created_at: string
          id: string
          invitation_message: string | null
          invitation_type: string
          invited_at: string
          invited_by: string | null
          responded_at: string | null
          response_data: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          agent_company?: string | null
          agent_email: string
          agent_name?: string | null
          created_at?: string
          id?: string
          invitation_message?: string | null
          invitation_type?: string
          invited_at?: string
          invited_by?: string | null
          responded_at?: string | null
          response_data?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          agent_company?: string | null
          agent_email?: string
          agent_name?: string | null
          created_at?: string
          id?: string
          invitation_message?: string | null
          invitation_type?: string
          invited_at?: string
          invited_by?: string | null
          responded_at?: string | null
          response_data?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_performance_tracking: {
        Row: {
          agent_id: string
          average_commission: number | null
          conversion_rate: number | null
          created_at: string
          data_source: string | null
          id: string
          lead_generation_score: number | null
          month_year: string
          transactions_closed: number | null
          updated_at: string
          volume_closed: number | null
        }
        Insert: {
          agent_id: string
          average_commission?: number | null
          conversion_rate?: number | null
          created_at?: string
          data_source?: string | null
          id?: string
          lead_generation_score?: number | null
          month_year: string
          transactions_closed?: number | null
          updated_at?: string
          volume_closed?: number | null
        }
        Update: {
          agent_id?: string
          average_commission?: number | null
          conversion_rate?: number | null
          created_at?: string
          data_source?: string | null
          id?: string
          lead_generation_score?: number | null
          month_year?: string
          transactions_closed?: number | null
          updated_at?: string
          volume_closed?: number | null
        }
        Relationships: []
      }
      agent_playbook_templates: {
        Row: {
          created_at: string
          difficulty_level: string | null
          estimated_completion_time: string | null
          id: string
          sections: Json
          template_description: string | null
          template_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          difficulty_level?: string | null
          estimated_completion_time?: string | null
          id?: string
          sections?: Json
          template_description?: string | null
          template_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          difficulty_level?: string | null
          estimated_completion_time?: string | null
          id?: string
          sections?: Json
          template_description?: string | null
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_quiz_responses: {
        Row: {
          agent_id: string
          avg_price: number
          buyers_count: number
          created_at: string
          id: string
          notes: string | null
          period_months: number
          sellers_count: number
        }
        Insert: {
          agent_id: string
          avg_price?: number
          buyers_count?: number
          created_at?: string
          id?: string
          notes?: string | null
          period_months?: number
          sellers_count?: number
        }
        Update: {
          agent_id?: string
          avg_price?: number
          buyers_count?: number
          created_at?: string
          id?: string
          notes?: string | null
          period_months?: number
          sellers_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "agent_quiz_responses_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_relationships: {
        Row: {
          agent_a_id: string
          agent_b_id: string
          created_at: string
          id: string
          relationship_type: string
          transaction_id: string | null
        }
        Insert: {
          agent_a_id: string
          agent_b_id: string
          created_at?: string
          id?: string
          relationship_type: string
          transaction_id?: string | null
        }
        Update: {
          agent_a_id?: string
          agent_b_id?: string
          created_at?: string
          id?: string
          relationship_type?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_relationships_agent_a_id_fkey"
            columns: ["agent_a_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_relationships_agent_b_id_fkey"
            columns: ["agent_b_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_relationships_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_transactions: {
        Row: {
          agent_id: string
          close_date: string | null
          created_at: string
          external_id: string | null
          id: string
          lender: string | null
          property_city: string | null
          property_state: string | null
          role: string
          sale_price: number
          source: string
          title_company: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          close_date?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          lender?: string | null
          property_city?: string | null
          property_state?: string | null
          role: string
          sale_price?: number
          source?: string
          title_company?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          close_date?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          lender?: string | null
          property_city?: string | null
          property_state?: string | null
          role?: string
          sale_price?: number
          source?: string
          title_company?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_transactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          address: string | null
          bio: string | null
          brokerage: string | null
          city: string | null
          created_at: string
          data_feed_active: boolean | null
          data_feed_last_sync: string | null
          email: string
          feed_provider: string | null
          first_name: string
          id: string
          is_active: boolean | null
          last_name: string
          nmls_id: string | null
          phone: string | null
          photo_url: string | null
          social_facebook: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_youtube: string | null
          social_zillow: string | null
          state: string | null
          updated_at: string
          user_id: string | null
          years_active: number | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          bio?: string | null
          brokerage?: string | null
          city?: string | null
          created_at?: string
          data_feed_active?: boolean | null
          data_feed_last_sync?: string | null
          email: string
          feed_provider?: string | null
          first_name: string
          id?: string
          is_active?: boolean | null
          last_name: string
          nmls_id?: string | null
          phone?: string | null
          photo_url?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_youtube?: string | null
          social_zillow?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
          years_active?: number | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          bio?: string | null
          brokerage?: string | null
          city?: string | null
          created_at?: string
          data_feed_active?: boolean | null
          data_feed_last_sync?: string | null
          email?: string
          feed_provider?: string | null
          first_name?: string
          id?: string
          is_active?: boolean | null
          last_name?: string
          nmls_id?: string | null
          phone?: string | null
          photo_url?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_youtube?: string | null
          social_zillow?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string | null
          years_active?: number | null
          zip_code?: string | null
        }
        Relationships: []
      }
      agreement_signatures: {
        Row: {
          agreement_template_id: string | null
          co_pay_request_id: string
          created_at: string
          id: string
          ip_address: unknown | null
          signature_data: string | null
          signed_at: string
          signer_id: string
          signer_type: string
          user_agent: string | null
        }
        Insert: {
          agreement_template_id?: string | null
          co_pay_request_id: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          signature_data?: string | null
          signed_at?: string
          signer_id: string
          signer_type: string
          user_agent?: string | null
        }
        Update: {
          agreement_template_id?: string | null
          co_pay_request_id?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          signature_data?: string | null
          signed_at?: string
          signer_id?: string
          signer_type?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_agreement_signatures_co_pay_request"
            columns: ["co_pay_request_id"]
            isOneToOne: false
            referencedRelation: "co_pay_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_agreement_signatures_template"
            columns: ["agreement_template_id"]
            isOneToOne: false
            referencedRelation: "comarketing_agreement_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_interaction_logs: {
        Row: {
          created_at: string | null
          id: string
          intent_type: string
          interaction_timestamp: string
          query_text: string
          recommendation_text: string | null
          result_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          intent_type: string
          interaction_timestamp: string
          query_text: string
          recommendation_text?: string | null
          result_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          intent_type?: string
          interaction_timestamp?: string
          query_text?: string
          recommendation_text?: string | null
          result_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_query_patterns: {
        Row: {
          created_at: string | null
          frequency: number | null
          id: string
          intent_type: string
          keywords: string[]
          last_seen: string | null
        }
        Insert: {
          created_at?: string | null
          frequency?: number | null
          id?: string
          intent_type: string
          keywords: string[]
          last_seen?: string | null
        }
        Update: {
          created_at?: string | null
          frequency?: number | null
          id?: string
          intent_type?: string
          keywords?: string[]
          last_seen?: string | null
        }
        Relationships: []
      }
      ai_recommendation_log: {
        Row: {
          context_data: Json | null
          created_at: string
          id: string
          question: string
          recommendation: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          context_data?: Json | null
          created_at?: string
          id?: string
          question: string
          recommendation: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          context_data?: Json | null
          created_at?: string
          id?: string
          question?: string
          recommendation?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendation_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ai_service_bundles: {
        Row: {
          bundle_name: string
          bundle_type: string
          created_at: string
          description: string | null
          estimated_roi_percentage: number | null
          id: string
          implementation_timeline_weeks: number | null
          is_active: boolean | null
          service_ids: string[] | null
          target_challenges: string[] | null
          total_price: number | null
          updated_at: string
        }
        Insert: {
          bundle_name: string
          bundle_type: string
          created_at?: string
          description?: string | null
          estimated_roi_percentage?: number | null
          id?: string
          implementation_timeline_weeks?: number | null
          is_active?: boolean | null
          service_ids?: string[] | null
          target_challenges?: string[] | null
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          bundle_name?: string
          bundle_type?: string
          created_at?: string
          description?: string | null
          estimated_roi_percentage?: number | null
          id?: string
          implementation_timeline_weeks?: number | null
          is_active?: boolean | null
          service_ids?: string[] | null
          target_challenges?: string[] | null
          total_price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      app_config: {
        Row: {
          created_at: string
          force_cache_bust_after: string | null
          id: string
          maintenance_message: string | null
          maintenance_mode: boolean | null
          min_build_version: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          force_cache_bust_after?: string | null
          id?: string
          maintenance_message?: string | null
          maintenance_mode?: boolean | null
          min_build_version?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          force_cache_bust_after?: string | null
          id?: string
          maintenance_message?: string | null
          maintenance_mode?: boolean | null
          min_build_version?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          id: string
          new_data: Json | null
          old_data: Json | null
          operation: string
          table_name: string
          timestamp: string
          user_id: string | null
        }
        Insert: {
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          table_name: string
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          table_name?: string
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      audit_log_checksums: {
        Row: {
          audit_log_id: string
          checksum: string
          created_at: string
          id: string
        }
        Insert: {
          audit_log_id: string
          checksum: string
          created_at?: string
          id?: string
        }
        Update: {
          audit_log_id?: string
          checksum?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      background_jobs: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          job_data: Json
          job_type: string
          max_attempts: number
          priority: number
          scheduled_at: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_data?: Json
          job_type: string
          max_attempts?: number
          priority?: number
          scheduled_at?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_data?: Json
          job_type?: string
          max_attempts?: number
          priority?: number
          scheduled_at?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      backup_monitoring: {
        Row: {
          backup_id: string | null
          check_details: Json | null
          check_result: boolean
          check_type: string
          checked_at: string
          id: string
        }
        Insert: {
          backup_id?: string | null
          check_details?: Json | null
          check_result: boolean
          check_type: string
          checked_at?: string
          id?: string
        }
        Update: {
          backup_id?: string | null
          check_details?: Json | null
          check_result?: boolean
          check_type?: string
          checked_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "backup_monitoring_backup_id_fkey"
            columns: ["backup_id"]
            isOneToOne: false
            referencedRelation: "financial_data_backups"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_ips: {
        Row: {
          blocked_at: string
          blocked_by: string | null
          created_at: string
          expires_at: string | null
          id: string
          ip_address: unknown
          is_permanent: boolean
          reason: string
          requests_count: number
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          blocked_at?: string
          blocked_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address: unknown
          is_permanent?: boolean
          reason: string
          requests_count?: number
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          blocked_at?: string
          blocked_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          is_permanent?: boolean
          reason?: string
          requests_count?: number
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      channel_subscriptions: {
        Row: {
          channel_id: string
          id: string
          subscribed_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          subscribed_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          subscribed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_channel_subscriptions_channel"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          auto_imported: boolean | null
          cover_image_url: string | null
          created_at: string | null
          creator_id: string
          description: string | null
          id: string
          is_verified: boolean | null
          name: string
          subscriber_count: number | null
          updated_at: string | null
          youtube_channel_id: string | null
          youtube_channel_url: string | null
        }
        Insert: {
          auto_imported?: boolean | null
          cover_image_url?: string | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          id?: string
          is_verified?: boolean | null
          name: string
          subscriber_count?: number | null
          updated_at?: string | null
          youtube_channel_id?: string | null
          youtube_channel_url?: string | null
        }
        Update: {
          auto_imported?: boolean | null
          cover_image_url?: string | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          id?: string
          is_verified?: boolean | null
          name?: string
          subscriber_count?: number | null
          updated_at?: string | null
          youtube_channel_id?: string | null
          youtube_channel_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "channels_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      client_errors: {
        Row: {
          component: string | null
          created_at: string
          error_type: string
          id: string
          message: string | null
          metadata: Json
          section: string | null
          stack: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          component?: string | null
          created_at?: string
          error_type?: string
          id?: string
          message?: string | null
          metadata?: Json
          section?: string | null
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          component?: string | null
          created_at?: string
          error_type?: string
          id?: string
          message?: string | null
          metadata?: Json
          section?: string | null
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      co_pay_audit_log: {
        Row: {
          action_details: Json | null
          action_type: string
          co_pay_request_id: string | null
          created_at: string
          id: string
          ip_address: unknown | null
          performed_by: string | null
          user_agent: string | null
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          co_pay_request_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          performed_by?: string | null
          user_agent?: string | null
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          co_pay_request_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          performed_by?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "co_pay_audit_log_co_pay_request_id_fkey"
            columns: ["co_pay_request_id"]
            isOneToOne: false
            referencedRelation: "co_pay_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      co_pay_requests: {
        Row: {
          agent_id: string | null
          agent_notes: string | null
          agent_signature_date: string | null
          agreement_template_version: string | null
          auto_renewal: boolean | null
          comarketing_agreement_url: string | null
          compliance_notes: string | null
          compliance_reviewed_at: string | null
          compliance_reviewed_by: string | null
          compliance_status: string | null
          contract_terms: Json | null
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown | null
          marketing_campaign_details: Json | null
          payment_duration_months: number | null
          payment_end_date: string | null
          payment_start_date: string | null
          renewal_notification_sent: boolean | null
          requested_split_percentage: number
          requires_documentation: boolean | null
          service_id: string | null
          status: string
          updated_at: string
          user_agent: string | null
          vendor_duration_limit_months: number | null
          vendor_id: string | null
          vendor_max_percentage: number | null
          vendor_notes: string | null
          vendor_signature_date: string | null
        }
        Insert: {
          agent_id?: string | null
          agent_notes?: string | null
          agent_signature_date?: string | null
          agreement_template_version?: string | null
          auto_renewal?: boolean | null
          comarketing_agreement_url?: string | null
          compliance_notes?: string | null
          compliance_reviewed_at?: string | null
          compliance_reviewed_by?: string | null
          compliance_status?: string | null
          contract_terms?: Json | null
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          marketing_campaign_details?: Json | null
          payment_duration_months?: number | null
          payment_end_date?: string | null
          payment_start_date?: string | null
          renewal_notification_sent?: boolean | null
          requested_split_percentage: number
          requires_documentation?: boolean | null
          service_id?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          vendor_duration_limit_months?: number | null
          vendor_id?: string | null
          vendor_max_percentage?: number | null
          vendor_notes?: string | null
          vendor_signature_date?: string | null
        }
        Update: {
          agent_id?: string | null
          agent_notes?: string | null
          agent_signature_date?: string | null
          agreement_template_version?: string | null
          auto_renewal?: boolean | null
          comarketing_agreement_url?: string | null
          compliance_notes?: string | null
          compliance_reviewed_at?: string | null
          compliance_reviewed_by?: string | null
          compliance_status?: string | null
          contract_terms?: Json | null
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          marketing_campaign_details?: Json | null
          payment_duration_months?: number | null
          payment_end_date?: string | null
          payment_start_date?: string | null
          renewal_notification_sent?: boolean | null
          requested_split_percentage?: number
          requires_documentation?: boolean | null
          service_id?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          vendor_duration_limit_months?: number | null
          vendor_id?: string | null
          vendor_max_percentage?: number | null
          vendor_notes?: string | null
          vendor_signature_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "co_pay_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_co_pay_requests_vendor"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_co_pay_requests_vendor"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_with_local_reps"
            referencedColumns: ["id"]
          },
        ]
      }
      comarketing_agreement_templates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          template_content: string
          template_name: string
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          template_content: string
          template_name: string
          updated_at?: string
          version: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          template_content?: string
          template_name?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_comment_likes_comment"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "content_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_documents: {
        Row: {
          co_pay_request_id: string
          compliance_approved: boolean | null
          compliance_notes: string | null
          created_at: string
          description: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_required: boolean | null
          mime_type: string | null
          updated_at: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          co_pay_request_id: string
          compliance_approved?: boolean | null
          compliance_notes?: string | null
          created_at?: string
          description?: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_required?: boolean | null
          mime_type?: string | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          co_pay_request_id?: string
          compliance_approved?: boolean | null
          compliance_notes?: string | null
          created_at?: string
          description?: string | null
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_required?: boolean | null
          mime_type?: string | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_documents_co_pay_request_id_fkey"
            columns: ["co_pay_request_id"]
            isOneToOne: false
            referencedRelation: "co_pay_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_team_members: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          role: string
          specialties: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          role: string
          specialties?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          role?: string
          specialties?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      compliance_workflow_log: {
        Row: {
          action_type: string
          attachments: Json | null
          co_pay_request_id: string
          created_at: string
          id: string
          ip_address: unknown | null
          new_status: string | null
          notes: string | null
          performed_by: string | null
          previous_status: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          attachments?: Json | null
          co_pay_request_id: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_status?: string | null
          notes?: string | null
          performed_by?: string | null
          previous_status?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          attachments?: Json | null
          co_pay_request_id?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_status?: string | null
          notes?: string | null
          performed_by?: string | null
          previous_status?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_workflow_log_co_pay_request_id_fkey"
            columns: ["co_pay_request_id"]
            isOneToOne: false
            referencedRelation: "co_pay_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_bookings: {
        Row: {
          budget_range: string | null
          client_email: string
          client_name: string
          client_phone: string | null
          consultation_notes: string | null
          created_at: string
          external_event_id: string | null
          external_link: string | null
          external_provider: string | null
          external_status: string | null
          id: string
          is_external: boolean | null
          project_details: string | null
          scheduled_at: string | null
          scheduled_date: string
          scheduled_time: string
          service_id: string
          source: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          budget_range?: string | null
          client_email: string
          client_name: string
          client_phone?: string | null
          consultation_notes?: string | null
          created_at?: string
          external_event_id?: string | null
          external_link?: string | null
          external_provider?: string | null
          external_status?: string | null
          id?: string
          is_external?: boolean | null
          project_details?: string | null
          scheduled_at?: string | null
          scheduled_date: string
          scheduled_time: string
          service_id: string
          source?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          budget_range?: string | null
          client_email?: string
          client_name?: string
          client_phone?: string | null
          consultation_notes?: string | null
          created_at?: string
          external_event_id?: string | null
          external_link?: string | null
          external_provider?: string | null
          external_status?: string | null
          id?: string
          is_external?: boolean | null
          project_details?: string | null
          scheduled_at?: string | null
          scheduled_date?: string
          scheduled_time?: string
          service_id?: string
          source?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultation_bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_notifications: {
        Row: {
          consultation_booking_id: string
          created_at: string
          error_message: string | null
          id: string
          notification_data: Json | null
          notification_type: string
          sent_at: string | null
          status: string
          vendor_id: string
        }
        Insert: {
          consultation_booking_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          notification_data?: Json | null
          notification_type: string
          sent_at?: string | null
          status?: string
          vendor_id: string
        }
        Update: {
          consultation_booking_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          notification_data?: Json | null
          notification_type?: string
          sent_at?: string | null
          status?: string
          vendor_id?: string
        }
        Relationships: []
      }
      content: {
        Row: {
          agent_annual_volume: number | null
          agent_location: string | null
          agent_tier: string | null
          agent_years_experience: number | null
          category: string
          content_type: Database["public"]["Enums"]["content_type"]
          content_url: string | null
          cover_image_url: string | null
          created_at: string | null
          creator_id: string
          description: string | null
          duration: string | null
          id: string
          is_agent_playbook: boolean | null
          is_featured: boolean | null
          is_pro: boolean | null
          is_published: boolean | null
          lesson_count: number | null
          metadata: Json | null
          page_count: number | null
          playbook_price: number | null
          preview_url: string | null
          price: number | null
          published_at: string | null
          rating: number | null
          revenue_share_percentage: number | null
          success_metrics: Json | null
          tags: string[] | null
          target_audience: string | null
          title: string
          tools_mentioned: Json | null
          total_plays: number | null
          total_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          agent_annual_volume?: number | null
          agent_location?: string | null
          agent_tier?: string | null
          agent_years_experience?: number | null
          category: string
          content_type: Database["public"]["Enums"]["content_type"]
          content_url?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          duration?: string | null
          id?: string
          is_agent_playbook?: boolean | null
          is_featured?: boolean | null
          is_pro?: boolean | null
          is_published?: boolean | null
          lesson_count?: number | null
          metadata?: Json | null
          page_count?: number | null
          playbook_price?: number | null
          preview_url?: string | null
          price?: number | null
          published_at?: string | null
          rating?: number | null
          revenue_share_percentage?: number | null
          success_metrics?: Json | null
          tags?: string[] | null
          target_audience?: string | null
          title: string
          tools_mentioned?: Json | null
          total_plays?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          agent_annual_volume?: number | null
          agent_location?: string | null
          agent_tier?: string | null
          agent_years_experience?: number | null
          category?: string
          content_type?: Database["public"]["Enums"]["content_type"]
          content_url?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          duration?: string | null
          id?: string
          is_agent_playbook?: boolean | null
          is_featured?: boolean | null
          is_pro?: boolean | null
          is_published?: boolean | null
          lesson_count?: number | null
          metadata?: Json | null
          page_count?: number | null
          playbook_price?: number | null
          preview_url?: string | null
          price?: number | null
          published_at?: string | null
          rating?: number | null
          revenue_share_percentage?: number | null
          success_metrics?: Json | null
          tags?: string[] | null
          target_audience?: string | null
          title?: string
          tools_mentioned?: Json | null
          total_plays?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      content_comments: {
        Row: {
          content: string
          content_id: string
          created_at: string
          id: string
          likes_count: number
          parent_comment_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          content_id: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_comment_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          content_id?: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_comment_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_content_comments_content"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_content_comments_parent"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "content_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      content_engagement_events: {
        Row: {
          completion_percentage: number | null
          content_id: string
          content_weight_percentage: number | null
          created_at: string | null
          creator_id: string
          device_type: string | null
          engagement_quality_score: number | null
          event_type: string
          id: string
          ip_address: unknown | null
          referrer: string | null
          revenue_attributed: number | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
          watch_time_seconds: number | null
          weighted_score: number | null
        }
        Insert: {
          completion_percentage?: number | null
          content_id: string
          content_weight_percentage?: number | null
          created_at?: string | null
          creator_id: string
          device_type?: string | null
          engagement_quality_score?: number | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          referrer?: string | null
          revenue_attributed?: number | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          watch_time_seconds?: number | null
          weighted_score?: number | null
        }
        Update: {
          completion_percentage?: number | null
          content_id?: string
          content_weight_percentage?: number | null
          created_at?: string | null
          creator_id?: string
          device_type?: string | null
          engagement_quality_score?: number | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          referrer?: string | null
          revenue_attributed?: number | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          watch_time_seconds?: number | null
          weighted_score?: number | null
        }
        Relationships: []
      }
      content_interactions: {
        Row: {
          content_id: string
          created_at: string
          id: string
          interaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          interaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          interaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_content_interactions_content"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      content_plays: {
        Row: {
          completion_percentage: number | null
          content_id: string
          device_type: string | null
          id: string
          location: string | null
          play_duration: number | null
          played_at: string | null
          user_id: string | null
        }
        Insert: {
          completion_percentage?: number | null
          content_id: string
          device_type?: string | null
          id?: string
          location?: string | null
          play_duration?: number | null
          played_at?: string | null
          user_id?: string | null
        }
        Update: {
          completion_percentage?: number | null
          content_id?: string
          device_type?: string | null
          id?: string
          location?: string | null
          play_duration?: number | null
          played_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_plays_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_plays_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      content_ratings: {
        Row: {
          content_id: string
          created_at: string | null
          id: string
          rating: number
          review: string | null
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string | null
          id?: string
          rating: number
          review?: string | null
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string | null
          id?: string
          rating?: number
          review?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_ratings_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      content_type_weightings: {
        Row: {
          base_weight_percentage: number
          content_type: string
          created_at: string
          engagement_multiplier: number
          id: string
          updated_at: string
        }
        Insert: {
          base_weight_percentage?: number
          content_type: string
          created_at?: string
          engagement_multiplier?: number
          id?: string
          updated_at?: string
        }
        Update: {
          base_weight_percentage?: number
          content_type?: string
          created_at?: string
          engagement_multiplier?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      copay_notification_preferences: {
        Row: {
          created_at: string
          email_notifications: boolean | null
          id: string
          payment_processed: boolean | null
          push_notifications: boolean | null
          request_approved: boolean | null
          request_created: boolean | null
          request_declined: boolean | null
          updated_at: string
          user_id: string
          weekly_summary: boolean | null
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          payment_processed?: boolean | null
          push_notifications?: boolean | null
          request_approved?: boolean | null
          request_created?: boolean | null
          request_declined?: boolean | null
          updated_at?: string
          user_id: string
          weekly_summary?: boolean | null
        }
        Update: {
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          payment_processed?: boolean | null
          push_notifications?: boolean | null
          request_approved?: boolean | null
          request_created?: boolean | null
          request_declined?: boolean | null
          updated_at?: string
          user_id?: string
          weekly_summary?: boolean | null
        }
        Relationships: []
      }
      copay_payment_schedules: {
        Row: {
          agent_id: string
          auto_renewal: boolean | null
          co_pay_request_id: string
          created_at: string | null
          end_date: string
          id: string
          next_renewal_date: string | null
          payment_percentage: number
          renewal_notice_days: number | null
          start_date: string
          status: string
          total_amount_covered: number | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          agent_id: string
          auto_renewal?: boolean | null
          co_pay_request_id: string
          created_at?: string | null
          end_date: string
          id?: string
          next_renewal_date?: string | null
          payment_percentage: number
          renewal_notice_days?: number | null
          start_date: string
          status?: string
          total_amount_covered?: number | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          agent_id?: string
          auto_renewal?: boolean | null
          co_pay_request_id?: string
          created_at?: string | null
          end_date?: string
          id?: string
          next_renewal_date?: string | null
          payment_percentage?: number
          renewal_notice_days?: number | null
          start_date?: string
          status?: string
          total_amount_covered?: number | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "copay_payment_schedules_co_pay_request_id_fkey"
            columns: ["co_pay_request_id"]
            isOneToOne: false
            referencedRelation: "co_pay_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      copay_payments: {
        Row: {
          agent_amount: number
          copay_request_id: string
          created_at: string
          error_message: string | null
          id: string
          order_id: string | null
          payment_status: string | null
          processed_at: string | null
          stripe_payment_intent_id: string | null
          total_service_amount: number
          updated_at: string
          vendor_reimbursement: number
        }
        Insert: {
          agent_amount: number
          copay_request_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          order_id?: string | null
          payment_status?: string | null
          processed_at?: string | null
          stripe_payment_intent_id?: string | null
          total_service_amount: number
          updated_at?: string
          vendor_reimbursement: number
        }
        Update: {
          agent_amount?: number
          copay_request_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          order_id?: string | null
          payment_status?: string | null
          processed_at?: string | null
          stripe_payment_intent_id?: string | null
          total_service_amount?: number
          updated_at?: string
          vendor_reimbursement?: number
        }
        Relationships: [
          {
            foreignKeyName: "copay_payments_copay_request_id_fkey"
            columns: ["copay_request_id"]
            isOneToOne: false
            referencedRelation: "co_pay_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      course_progress: {
        Row: {
          completed_modules: string[] | null
          consultation_id: string
          created_at: string
          id: string
          progress_percentage: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          completed_modules?: string[] | null
          consultation_id: string
          created_at?: string
          id?: string
          progress_percentage?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          completed_modules?: string[] | null
          consultation_id?: string
          created_at?: string
          id?: string
          progress_percentage?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultation_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_analytics: {
        Row: {
          completion_rate: number | null
          content_id: string | null
          content_type_breakdown: Json | null
          created_at: string | null
          creator_earnings: number | null
          creator_id: string
          creator_revenue_percentage: number | null
          creator_share_percentage: number | null
          id: string
          month_year: string
          platform_total_revenue: number | null
          quality_adjusted_earnings: number | null
          revenue_generated: number | null
          total_downloads: number | null
          total_plays: number | null
          total_watch_time_minutes: number | null
          unique_viewers: number | null
          updated_at: string | null
          weighted_engagement_score: number | null
        }
        Insert: {
          completion_rate?: number | null
          content_id?: string | null
          content_type_breakdown?: Json | null
          created_at?: string | null
          creator_earnings?: number | null
          creator_id: string
          creator_revenue_percentage?: number | null
          creator_share_percentage?: number | null
          id?: string
          month_year: string
          platform_total_revenue?: number | null
          quality_adjusted_earnings?: number | null
          revenue_generated?: number | null
          total_downloads?: number | null
          total_plays?: number | null
          total_watch_time_minutes?: number | null
          unique_viewers?: number | null
          updated_at?: string | null
          weighted_engagement_score?: number | null
        }
        Update: {
          completion_rate?: number | null
          content_id?: string | null
          content_type_breakdown?: Json | null
          created_at?: string | null
          creator_earnings?: number | null
          creator_id?: string
          creator_revenue_percentage?: number | null
          creator_share_percentage?: number | null
          id?: string
          month_year?: string
          platform_total_revenue?: number | null
          quality_adjusted_earnings?: number | null
          revenue_generated?: number | null
          total_downloads?: number | null
          total_plays?: number | null
          total_watch_time_minutes?: number | null
          unique_viewers?: number | null
          updated_at?: string | null
          weighted_engagement_score?: number | null
        }
        Relationships: []
      }
      creator_api_configs: {
        Row: {
          created_at: string
          id: string
          mailchimp_api_key: string | null
          updated_at: string
          user_id: string
          youtube_api_key: string | null
          zapier_webhook: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          mailchimp_api_key?: string | null
          updated_at?: string
          user_id: string
          youtube_api_key?: string | null
          zapier_webhook?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          mailchimp_api_key?: string | null
          updated_at?: string
          user_id?: string
          youtube_api_key?: string | null
          zapier_webhook?: string | null
        }
        Relationships: []
      }
      creator_onboarding: {
        Row: {
          completed_at: string | null
          completed_steps: Json | null
          created_at: string
          id: string
          onboarding_data: Json | null
          step: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_steps?: Json | null
          created_at?: string
          id?: string
          onboarding_data?: Json | null
          step?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_steps?: Json | null
          created_at?: string
          id?: string
          onboarding_data?: Json | null
          step?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      creator_payment_info: {
        Row: {
          auto_payout_enabled: boolean | null
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_name: string | null
          bank_routing_number: string | null
          created_at: string | null
          creator_id: string
          id: string
          minimum_payout_amount: number | null
          payment_method: string
          paypal_email: string | null
          stripe_account_id: string | null
          stripe_onboarding_completed: boolean | null
          tax_form_completed: boolean | null
          tax_id: string | null
          updated_at: string | null
          verification_documents: Json | null
          verified: boolean | null
        }
        Insert: {
          auto_payout_enabled?: boolean | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bank_routing_number?: string | null
          created_at?: string | null
          creator_id: string
          id?: string
          minimum_payout_amount?: number | null
          payment_method?: string
          paypal_email?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_completed?: boolean | null
          tax_form_completed?: boolean | null
          tax_id?: string | null
          updated_at?: string | null
          verification_documents?: Json | null
          verified?: boolean | null
        }
        Update: {
          auto_payout_enabled?: boolean | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bank_routing_number?: string | null
          created_at?: string | null
          creator_id?: string
          id?: string
          minimum_payout_amount?: number | null
          payment_method?: string
          paypal_email?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_completed?: boolean | null
          tax_form_completed?: boolean | null
          tax_id?: string | null
          updated_at?: string | null
          verification_documents?: Json | null
          verified?: boolean | null
        }
        Relationships: []
      }
      creator_payouts: {
        Row: {
          breakdown: Json | null
          created_at: string | null
          creator_id: string
          error_message: string | null
          final_amount: number
          id: string
          net_payout: number
          payment_date: string | null
          payment_method: string
          payment_processor_fee: number | null
          payment_processor_id: string | null
          payout_month: string
          platform_fee: number | null
          retry_count: number | null
          status: string
          total_earnings: number
          updated_at: string | null
        }
        Insert: {
          breakdown?: Json | null
          created_at?: string | null
          creator_id: string
          error_message?: string | null
          final_amount?: number
          id?: string
          net_payout?: number
          payment_date?: string | null
          payment_method: string
          payment_processor_fee?: number | null
          payment_processor_id?: string | null
          payout_month: string
          platform_fee?: number | null
          retry_count?: number | null
          status?: string
          total_earnings?: number
          updated_at?: string | null
        }
        Update: {
          breakdown?: Json | null
          created_at?: string | null
          creator_id?: string
          error_message?: string | null
          final_amount?: number
          id?: string
          net_payout?: number
          payment_date?: string | null
          payment_method?: string
          payment_processor_fee?: number | null
          payment_processor_id?: string | null
          payout_month?: string
          platform_fee?: number | null
          retry_count?: number | null
          status?: string
          total_earnings?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      creator_verification_requests: {
        Row: {
          admin_notes: string | null
          bio: string | null
          created_at: string
          experience_years: number | null
          id: string
          portfolio_links: string[] | null
          reviewed_at: string | null
          reviewed_by: string | null
          sample_content_urls: string[] | null
          social_links: Json | null
          specialties: string[] | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          bio?: string | null
          created_at?: string
          experience_years?: number | null
          id?: string
          portfolio_links?: string[] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sample_content_urls?: string[] | null
          social_links?: Json | null
          specialties?: string[] | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          bio?: string | null
          created_at?: string
          experience_years?: number | null
          id?: string
          portfolio_links?: string[] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sample_content_urls?: string[] | null
          social_links?: Json | null
          specialties?: string[] | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      creator_webhooks: {
        Row: {
          content_type: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
          webhook_url: string
        }
        Insert: {
          content_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
          webhook_url: string
        }
        Update: {
          content_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
          webhook_url?: string
        }
        Relationships: []
      }
      deals: {
        Row: {
          address: string
          close_date: string | null
          created_at: string
          id: string
          lender_name: string | null
          role: string
          sale_price: number | null
          status: string
          title_company: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          close_date?: string | null
          created_at?: string
          id?: string
          lender_name?: string | null
          role: string
          sale_price?: number | null
          status?: string
          title_company?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          close_date?: string | null
          created_at?: string
          id?: string
          lender_name?: string | null
          role?: string
          sale_price?: number | null
          status?: string
          title_company?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      failed_login_attempts: {
        Row: {
          attempt_type: string
          attempts_count: number | null
          created_at: string | null
          id: string
          identifier: string
          last_attempt_at: string | null
          locked_until: string | null
        }
        Insert: {
          attempt_type?: string
          attempts_count?: number | null
          created_at?: string | null
          id?: string
          identifier: string
          last_attempt_at?: string | null
          locked_until?: string | null
        }
        Update: {
          attempt_type?: string
          attempts_count?: number | null
          created_at?: string | null
          id?: string
          identifier?: string
          last_attempt_at?: string | null
          locked_until?: string | null
        }
        Relationships: []
      }
      financial_data_backups: {
        Row: {
          backup_data: Json
          backup_date: string
          backup_size: number
          backup_type: string
          created_at: string
          data_hash: string
          error_message: string | null
          id: string
          status: string
        }
        Insert: {
          backup_data: Json
          backup_date?: string
          backup_size: number
          backup_type: string
          created_at?: string
          data_hash: string
          error_message?: string | null
          id?: string
          status?: string
        }
        Update: {
          backup_data?: Json
          backup_date?: string
          backup_size?: number
          backup_type?: string
          created_at?: string
          data_hash?: string
          error_message?: string | null
          id?: string
          status?: string
        }
        Relationships: []
      }
      fraud_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_data: Json | null
          alert_message: string
          alert_type: string
          created_at: string
          fraud_log_id: string | null
          id: string
          severity: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_data?: Json | null
          alert_message: string
          alert_type: string
          created_at?: string
          fraud_log_id?: string | null
          id?: string
          severity: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_data?: Json | null
          alert_message?: string
          alert_type?: string
          created_at?: string
          fraud_log_id?: string | null
          id?: string
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "fraud_alerts_fraud_log_id_fkey"
            columns: ["fraud_log_id"]
            isOneToOne: false
            referencedRelation: "fraud_monitoring_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      fraud_monitoring_logs: {
        Row: {
          amount_cents: number | null
          billing_details: Json | null
          created_at: string
          currency: string | null
          customer_email: string | null
          fraud_details: Json | null
          id: string
          metadata: Json | null
          outcome_reason: string | null
          outcome_type: string | null
          payment_method_details: Json | null
          radar_rules_triggered: Json | null
          requires_action: boolean | null
          risk_level: string | null
          risk_score: number | null
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents?: number | null
          billing_details?: Json | null
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          fraud_details?: Json | null
          id?: string
          metadata?: Json | null
          outcome_reason?: string | null
          outcome_type?: string | null
          payment_method_details?: Json | null
          radar_rules_triggered?: Json | null
          requires_action?: boolean | null
          risk_level?: string | null
          risk_score?: number | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number | null
          billing_details?: Json | null
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          fraud_details?: Json | null
          id?: string
          metadata?: Json | null
          outcome_reason?: string | null
          outcome_type?: string | null
          payment_method_details?: Json | null
          radar_rules_triggered?: Json | null
          requires_action?: boolean | null
          risk_level?: string | null
          risk_score?: number | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      funnel_events: {
        Row: {
          anon_id: string
          created_at: string
          event_name: string
          id: string
          metadata: Json
          page_url: string | null
          referrer_url: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          anon_id: string
          created_at?: string
          event_name: string
          id?: string
          metadata?: Json
          page_url?: string | null
          referrer_url?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          anon_id?: string
          created_at?: string
          event_name?: string
          id?: string
          metadata?: Json
          page_url?: string | null
          referrer_url?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funnel_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "funnel_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_sessions: {
        Row: {
          anon_id: string
          country: string | null
          created_at: string
          device: string | null
          id: string
          landing_page: string | null
          referrer: string | null
          started_at: string
          updated_at: string
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          anon_id: string
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          landing_page?: string | null
          referrer?: string | null
          started_at?: string
          updated_at?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          anon_id?: string
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          landing_page?: string | null
          referrer?: string | null
          started_at?: string
          updated_at?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      funnel_templates: {
        Row: {
          created_at: string | null
          id: string
          industry_type: string | null
          is_active: boolean | null
          layout_config: Json | null
          template_description: string | null
          template_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          industry_type?: string | null
          is_active?: boolean | null
          layout_config?: Json | null
          template_description?: string | null
          template_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          industry_type?: string | null
          is_active?: boolean | null
          layout_config?: Json | null
          template_description?: string | null
          template_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      goal_based_recommendations: {
        Row: {
          agent_id: string
          bundle_id: string | null
          confidence_score: number | null
          created_at: string
          estimated_roi_percentage: number | null
          id: string
          is_accepted: boolean | null
          is_dismissed: boolean | null
          is_viewed: boolean | null
          priority_rank: number | null
          recommendation_text: string
          recommendation_type: string
          service_id: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          bundle_id?: string | null
          confidence_score?: number | null
          created_at?: string
          estimated_roi_percentage?: number | null
          id?: string
          is_accepted?: boolean | null
          is_dismissed?: boolean | null
          is_viewed?: boolean | null
          priority_rank?: number | null
          recommendation_text: string
          recommendation_type: string
          service_id?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          bundle_id?: string | null
          confidence_score?: number | null
          created_at?: string
          estimated_roi_percentage?: number | null
          id?: string
          is_accepted?: boolean | null
          is_dismissed?: boolean | null
          is_viewed?: boolean | null
          priority_rank?: number | null
          recommendation_text?: string
          recommendation_type?: string
          service_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_based_recommendations_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "ai_service_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_plans: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          confidence: number | null
          created_at: string
          goal_description: string | null
          goal_title: string
          id: string
          kpis: Json
          model_used: string | null
          plan: Json
          recommended_service_ids: string[]
          status: string
          timeframe_weeks: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          confidence?: number | null
          created_at?: string
          goal_description?: string | null
          goal_title: string
          id?: string
          kpis?: Json
          model_used?: string | null
          plan: Json
          recommended_service_ids?: string[]
          status?: string
          timeframe_weeks?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          confidence?: number | null
          created_at?: string
          goal_description?: string | null
          goal_title?: string
          id?: string
          kpis?: Json
          model_used?: string | null
          plan?: Json
          recommended_service_ids?: string[]
          status?: string
          timeframe_weeks?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      help_ai_learning: {
        Row: {
          ai_response: string
          context_data: Json | null
          created_at: string
          follow_up_questions: string[] | null
          id: string
          learning_points: Json | null
          resolution_achieved: boolean | null
          user_feedback: string | null
          user_query: string
        }
        Insert: {
          ai_response: string
          context_data?: Json | null
          created_at?: string
          follow_up_questions?: string[] | null
          id?: string
          learning_points?: Json | null
          resolution_achieved?: boolean | null
          user_feedback?: string | null
          user_query: string
        }
        Update: {
          ai_response?: string
          context_data?: Json | null
          created_at?: string
          follow_up_questions?: string[] | null
          id?: string
          learning_points?: Json | null
          resolution_achieved?: boolean | null
          user_feedback?: string | null
          user_query?: string
        }
        Relationships: []
      }
      help_analytics: {
        Row: {
          context_data: Json | null
          created_at: string
          event_type: string
          guide_id: string | null
          id: string
          route: string
          user_id: string
        }
        Insert: {
          context_data?: Json | null
          created_at?: string
          event_type: string
          guide_id?: string | null
          id?: string
          route: string
          user_id: string
        }
        Update: {
          context_data?: Json | null
          created_at?: string
          event_type?: string
          guide_id?: string | null
          id?: string
          route?: string
          user_id?: string
        }
        Relationships: []
      }
      help_issues: {
        Row: {
          ai_confidence_score: number | null
          auto_resolved: boolean | null
          context_data: Json | null
          created_at: string
          description: string | null
          escalated_to_human: boolean | null
          id: string
          issue_type: string
          resolution: string | null
          resolution_steps: Json | null
          resolved_at: string | null
          severity: string
          status: string
          title: string
          updated_at: string
          user_id: string
          user_satisfaction: number | null
        }
        Insert: {
          ai_confidence_score?: number | null
          auto_resolved?: boolean | null
          context_data?: Json | null
          created_at?: string
          description?: string | null
          escalated_to_human?: boolean | null
          id?: string
          issue_type: string
          resolution?: string | null
          resolution_steps?: Json | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
          user_satisfaction?: number | null
        }
        Update: {
          ai_confidence_score?: number | null
          auto_resolved?: boolean | null
          context_data?: Json | null
          created_at?: string
          description?: string | null
          escalated_to_human?: boolean | null
          id?: string
          issue_type?: string
          resolution?: string | null
          resolution_steps?: Json | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          user_satisfaction?: number | null
        }
        Relationships: []
      }
      help_knowledge_base: {
        Row: {
          category: string
          content: string
          created_at: string
          effectiveness_score: number | null
          id: string
          last_updated: string
          search_vectors: unknown | null
          subcategory: string | null
          tags: string[] | null
          title: string
          usage_count: number | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          effectiveness_score?: number | null
          id?: string
          last_updated?: string
          search_vectors?: unknown | null
          subcategory?: string | null
          tags?: string[] | null
          title: string
          usage_count?: number | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          effectiveness_score?: number | null
          id?: string
          last_updated?: string
          search_vectors?: unknown | null
          subcategory?: string | null
          tags?: string[] | null
          title?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      help_proactive_triggers: {
        Row: {
          created_at: string
          help_accepted: boolean | null
          help_offered: boolean | null
          id: string
          resolution_successful: boolean | null
          trigger_data: Json
          trigger_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          help_accepted?: boolean | null
          help_offered?: boolean | null
          id?: string
          resolution_successful?: boolean | null
          trigger_data: Json
          trigger_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          help_accepted?: boolean | null
          help_offered?: boolean | null
          id?: string
          resolution_successful?: boolean | null
          trigger_data?: Json
          trigger_type?: string
          user_id?: string
        }
        Relationships: []
      }
      image_cache: {
        Row: {
          cached_url: string
          content_id: string | null
          created_at: string | null
          file_size: number | null
          format: string | null
          height: number | null
          id: string
          image_type: string
          last_accessed: string | null
          original_url: string
          width: number | null
        }
        Insert: {
          cached_url: string
          content_id?: string | null
          created_at?: string | null
          file_size?: number | null
          format?: string | null
          height?: number | null
          id?: string
          image_type: string
          last_accessed?: string | null
          original_url: string
          width?: number | null
        }
        Update: {
          cached_url?: string
          content_id?: string | null
          created_at?: string | null
          file_size?: number | null
          format?: string | null
          height?: number | null
          id?: string
          image_type?: string
          last_accessed?: string | null
          original_url?: string
          width?: number | null
        }
        Relationships: []
      }
      image_processing_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          original_url: string | null
          processed_at: string
          service_id: string | null
          status: string
          vectorized_url: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          original_url?: string | null
          processed_at?: string
          service_id?: string | null
          status: string
          vectorized_url?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          original_url?: string | null
          processed_at?: string
          service_id?: string | null
          status?: string
          vectorized_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "image_processing_log_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          created_at: string
          created_by: string | null
          details: Json | null
          id: string
          resolved_at: string | null
          severity: string
          started_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          details?: Json | null
          id?: string
          resolved_at?: string | null
          severity?: string
          started_at?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          details?: Json | null
          id?: string
          resolved_at?: string | null
          severity?: string
          started_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lenders: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempt_time: string
          email: string
          id: string
          ip_address: unknown | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          attempt_time?: string
          email: string
          id?: string
          ip_address?: unknown | null
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          attempt_time?: string
          email?: string
          id?: string
          ip_address?: unknown | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      login_lockouts: {
        Row: {
          attempt_count: number
          attempt_type: string
          created_at: string
          id: string
          identifier: string
          locked_until: string | null
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          attempt_type?: string
          created_at?: string
          id?: string
          identifier: string
          locked_until?: string | null
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          attempt_type?: string
          created_at?: string
          id?: string
          identifier?: string
          locked_until?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      market_benchmarks: {
        Row: {
          agent_tier: string
          avg_commission_per_deal: number | null
          avg_transactions_per_year: number | null
          avg_volume_per_year: number | null
          benchmark_year: number
          created_at: string
          data_source: string | null
          id: string
          market_area: string
          state: string
          updated_at: string
        }
        Insert: {
          agent_tier: string
          avg_commission_per_deal?: number | null
          avg_transactions_per_year?: number | null
          avg_volume_per_year?: number | null
          benchmark_year: number
          created_at?: string
          data_source?: string | null
          id?: string
          market_area: string
          state: string
          updated_at?: string
        }
        Update: {
          agent_tier?: string
          avg_commission_per_deal?: number | null
          avg_transactions_per_year?: number | null
          avg_volume_per_year?: number | null
          benchmark_year?: number
          created_at?: string
          data_source?: string | null
          id?: string
          market_area?: string
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_cache: {
        Row: {
          cache_data: Json
          cache_key: string
          created_at: string
          expires_at: string
          id: string
          updated_at: string
        }
        Insert: {
          cache_data: Json
          cache_key: string
          created_at?: string
          expires_at: string
          id?: string
          updated_at?: string
        }
        Update: {
          cache_data?: Json
          cache_key?: string
          created_at?: string
          expires_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      monthly_platform_revenue: {
        Row: {
          average_creator_payout: number | null
          churned_subscribers: number | null
          created_at: string | null
          creator_share_percentage: number | null
          id: string
          month_year: string
          new_subscribers: number | null
          platform_net_revenue: number | null
          revenue_per_subscriber: number | null
          total_content_plays: number | null
          total_creator_earnings: number | null
          total_one_time_payments: number | null
          total_platform_revenue: number | null
          total_subscribers: number | null
          total_subscription_revenue: number | null
          total_watch_time_hours: number | null
          updated_at: string | null
        }
        Insert: {
          average_creator_payout?: number | null
          churned_subscribers?: number | null
          created_at?: string | null
          creator_share_percentage?: number | null
          id?: string
          month_year: string
          new_subscribers?: number | null
          platform_net_revenue?: number | null
          revenue_per_subscriber?: number | null
          total_content_plays?: number | null
          total_creator_earnings?: number | null
          total_one_time_payments?: number | null
          total_platform_revenue?: number | null
          total_subscribers?: number | null
          total_subscription_revenue?: number | null
          total_watch_time_hours?: number | null
          updated_at?: string | null
        }
        Update: {
          average_creator_payout?: number | null
          churned_subscribers?: number | null
          created_at?: string | null
          creator_share_percentage?: number | null
          id?: string
          month_year?: string
          new_subscribers?: number | null
          platform_net_revenue?: number | null
          revenue_per_subscriber?: number | null
          total_content_plays?: number | null
          total_creator_earnings?: number | null
          total_one_time_payments?: number | null
          total_platform_revenue?: number | null
          total_subscribers?: number | null
          total_subscription_revenue?: number | null
          total_watch_time_hours?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          item_price: number
          item_title: string
          item_type: string
          order_id: string | null
          quantity: number
          service_id: string | null
          updated_at: string
          vendor_commission_percentage: number | null
          vendor_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          item_price?: number
          item_title: string
          item_type?: string
          order_id?: string | null
          quantity?: number
          service_id?: string | null
          updated_at?: string
          vendor_commission_percentage?: number | null
          vendor_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          item_price?: number
          item_title?: string
          item_type?: string
          order_id?: string | null
          quantity?: number
          service_id?: string | null
          updated_at?: string
          vendor_commission_percentage?: number | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_with_local_reps"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          id: string
          status: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      outbound_clicks: {
        Row: {
          agent_cookie: string | null
          created_at: string
          destination_url: string
          final_url: string | null
          id: string
          ip_address: unknown | null
          metadata: Json
          referral_token: string | null
          referrer: string | null
          service_id: string | null
          user_agent: string | null
          user_id: string | null
          vendor_id: string | null
        }
        Insert: {
          agent_cookie?: string | null
          created_at?: string
          destination_url: string
          final_url?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json
          referral_token?: string | null
          referrer?: string | null
          service_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          vendor_id?: string | null
        }
        Update: {
          agent_cookie?: string | null
          created_at?: string
          destination_url?: string
          final_url?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json
          referral_token?: string | null
          referrer?: string | null
          service_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          vendor_id?: string | null
        }
        Relationships: []
      }
      playbook_creation_progress: {
        Row: {
          completed_sections: Json | null
          content_id: string | null
          created_at: string
          creator_id: string
          current_section: number | null
          draft_data: Json | null
          id: string
          status: string | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          completed_sections?: Json | null
          content_id?: string | null
          created_at?: string
          creator_id: string
          current_section?: number | null
          draft_data?: Json | null
          id?: string
          status?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          completed_sections?: Json | null
          content_id?: string | null
          created_at?: string
          creator_id?: string
          current_section?: number | null
          draft_data?: Json | null
          id?: string
          status?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbook_creation_progress_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_creation_progress_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "agent_playbook_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      point_allocations: {
        Row: {
          agent_id: string
          allocated_points: number
          allocation_period: string
          charge_on_use: boolean | null
          created_at: string
          created_by: string | null
          end_date: string
          id: string
          notes: string | null
          pre_authorized: boolean | null
          remaining_points: number | null
          respa_compliance_notes: string | null
          start_date: string
          status: string | null
          stripe_customer_id: string | null
          stripe_payment_method_id: string | null
          updated_at: string
          used_points: number | null
          vendor_id: string
          vendor_respa_category: string | null
          vendor_respa_status: boolean | null
        }
        Insert: {
          agent_id: string
          allocated_points: number
          allocation_period: string
          charge_on_use?: boolean | null
          created_at?: string
          created_by?: string | null
          end_date: string
          id?: string
          notes?: string | null
          pre_authorized?: boolean | null
          remaining_points?: number | null
          respa_compliance_notes?: string | null
          start_date: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          updated_at?: string
          used_points?: number | null
          vendor_id: string
          vendor_respa_category?: string | null
          vendor_respa_status?: boolean | null
        }
        Update: {
          agent_id?: string
          allocated_points?: number
          allocation_period?: string
          charge_on_use?: boolean | null
          created_at?: string
          created_by?: string | null
          end_date?: string
          id?: string
          notes?: string | null
          pre_authorized?: boolean | null
          remaining_points?: number | null
          respa_compliance_notes?: string | null
          start_date?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          updated_at?: string
          used_points?: number | null
          vendor_id?: string
          vendor_respa_category?: string | null
          vendor_respa_status?: boolean | null
        }
        Relationships: []
      }
      point_charges: {
        Row: {
          agent_id: string
          allocation_id: string | null
          amount_charged: number
          charge_status: string | null
          created_at: string
          error_message: string | null
          id: string
          points_charged: number
          processed_at: string | null
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          transaction_id: string | null
          vendor_id: string
        }
        Insert: {
          agent_id: string
          allocation_id?: string | null
          amount_charged: number
          charge_status?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          points_charged: number
          processed_at?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          transaction_id?: string | null
          vendor_id: string
        }
        Update: {
          agent_id?: string
          allocation_id?: string | null
          amount_charged?: number
          charge_status?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          points_charged?: number
          processed_at?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          transaction_id?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_charges_allocation_id_fkey"
            columns: ["allocation_id"]
            isOneToOne: false
            referencedRelation: "point_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_charges_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "point_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      point_transactions: {
        Row: {
          agent_id: string
          allocation_id: string
          amount_covered: number
          coverage_percentage: number
          created_at: string
          description: string | null
          id: string
          order_id: string | null
          points_used: number
          processed_by: string | null
          service_id: string | null
          total_service_amount: number | null
          transaction_type: string
          vendor_id: string
        }
        Insert: {
          agent_id: string
          allocation_id: string
          amount_covered: number
          coverage_percentage: number
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          points_used: number
          processed_by?: string | null
          service_id?: string | null
          total_service_amount?: number | null
          transaction_type: string
          vendor_id: string
        }
        Update: {
          agent_id?: string
          allocation_id?: string
          amount_covered?: number
          coverage_percentage?: number
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          points_used?: number
          processed_by?: string | null
          service_id?: string | null
          total_service_amount?: number | null
          transaction_type?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_transactions_allocation_id_fkey"
            columns: ["allocation_id"]
            isOneToOne: false
            referencedRelation: "point_allocations"
            referencedColumns: ["id"]
          },
        ]
      }
      prayers: {
        Row: {
          body: string
          created_at: string | null
          id: string
          kind: string
          meta: Json | null
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          kind: string
          meta?: Json | null
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          kind?: string
          meta?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          annual_goal_transactions: number | null
          annual_goal_volume: number | null
          avatar_url: string | null
          average_commission_per_deal: number | null
          bank_details: Json | null
          bio: string | null
          budget_preference: string | null
          business_name: string | null
          circle_points: number | null
          city: string | null
          commission_contact_email: string | null
          commission_rate: number | null
          copay_allowed: boolean | null
          created_at: string
          creator_bio: string | null
          creator_joined_at: string | null
          creator_social_links: Json | null
          creator_verified: boolean | null
          creator_website: string | null
          current_tools: Json | null
          display_name: string | null
          goal_assessment_completed: boolean | null
          id: string
          invitation_source: string | null
          invited_as_creator: boolean | null
          is_admin: boolean | null
          is_creator: boolean | null
          is_pro: boolean | null
          is_pro_member: boolean | null
          is_settlement_service_provider: boolean | null
          last_assessment_date: string | null
          latitude: number | null
          location: string | null
          longitude: number | null
          marketing_time_per_week: number | null
          onboarding_completed: boolean | null
          performance_data_complete: boolean | null
          personality_data: Json | null
          phone: string | null
          primary_challenge: string | null
          respa_max_copay_percentage: number | null
          respa_notes: string | null
          respa_service_categories: string[] | null
          revenue_share_percentage: number | null
          specialties: string[] | null
          state: string | null
          total_earnings: number | null
          updated_at: string
          user_id: string
          vendor_company_name: string | null
          vendor_description: string | null
          vendor_enabled: boolean | null
          vendor_type: string | null
          website_url: string | null
          work_style_preferences: Json | null
          years_experience: number | null
          zip_code: string | null
        }
        Insert: {
          annual_goal_transactions?: number | null
          annual_goal_volume?: number | null
          avatar_url?: string | null
          average_commission_per_deal?: number | null
          bank_details?: Json | null
          bio?: string | null
          budget_preference?: string | null
          business_name?: string | null
          circle_points?: number | null
          city?: string | null
          commission_contact_email?: string | null
          commission_rate?: number | null
          copay_allowed?: boolean | null
          created_at?: string
          creator_bio?: string | null
          creator_joined_at?: string | null
          creator_social_links?: Json | null
          creator_verified?: boolean | null
          creator_website?: string | null
          current_tools?: Json | null
          display_name?: string | null
          goal_assessment_completed?: boolean | null
          id?: string
          invitation_source?: string | null
          invited_as_creator?: boolean | null
          is_admin?: boolean | null
          is_creator?: boolean | null
          is_pro?: boolean | null
          is_pro_member?: boolean | null
          is_settlement_service_provider?: boolean | null
          last_assessment_date?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          marketing_time_per_week?: number | null
          onboarding_completed?: boolean | null
          performance_data_complete?: boolean | null
          personality_data?: Json | null
          phone?: string | null
          primary_challenge?: string | null
          respa_max_copay_percentage?: number | null
          respa_notes?: string | null
          respa_service_categories?: string[] | null
          revenue_share_percentage?: number | null
          specialties?: string[] | null
          state?: string | null
          total_earnings?: number | null
          updated_at?: string
          user_id: string
          vendor_company_name?: string | null
          vendor_description?: string | null
          vendor_enabled?: boolean | null
          vendor_type?: string | null
          website_url?: string | null
          work_style_preferences?: Json | null
          years_experience?: number | null
          zip_code?: string | null
        }
        Update: {
          annual_goal_transactions?: number | null
          annual_goal_volume?: number | null
          avatar_url?: string | null
          average_commission_per_deal?: number | null
          bank_details?: Json | null
          bio?: string | null
          budget_preference?: string | null
          business_name?: string | null
          circle_points?: number | null
          city?: string | null
          commission_contact_email?: string | null
          commission_rate?: number | null
          copay_allowed?: boolean | null
          created_at?: string
          creator_bio?: string | null
          creator_joined_at?: string | null
          creator_social_links?: Json | null
          creator_verified?: boolean | null
          creator_website?: string | null
          current_tools?: Json | null
          display_name?: string | null
          goal_assessment_completed?: boolean | null
          id?: string
          invitation_source?: string | null
          invited_as_creator?: boolean | null
          is_admin?: boolean | null
          is_creator?: boolean | null
          is_pro?: boolean | null
          is_pro_member?: boolean | null
          is_settlement_service_provider?: boolean | null
          last_assessment_date?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          marketing_time_per_week?: number | null
          onboarding_completed?: boolean | null
          performance_data_complete?: boolean | null
          personality_data?: Json | null
          phone?: string | null
          primary_challenge?: string | null
          respa_max_copay_percentage?: number | null
          respa_notes?: string | null
          respa_service_categories?: string[] | null
          revenue_share_percentage?: number | null
          specialties?: string[] | null
          state?: string | null
          total_earnings?: number | null
          updated_at?: string
          user_id?: string
          vendor_company_name?: string | null
          vendor_description?: string | null
          vendor_enabled?: boolean | null
          vendor_type?: string | null
          website_url?: string | null
          work_style_preferences?: Json | null
          years_experience?: number | null
          zip_code?: string | null
        }
        Relationships: []
      }
      referral_tokens: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          metadata: Json
          service_id: string | null
          token: string
          user_id: string | null
          vendor_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json
          service_id?: string | null
          token: string
          user_id?: string | null
          vendor_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json
          service_id?: string | null
          token?: string
          user_id?: string | null
          vendor_id?: string | null
        }
        Relationships: []
      }
      request_logs: {
        Row: {
          endpoint: string
          id: string
          ip_address: unknown
          method: string
          referer: string | null
          request_size: number | null
          response_status: number | null
          response_time_ms: number | null
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          endpoint: string
          id?: string
          ip_address: unknown
          method: string
          referer?: string | null
          request_size?: number | null
          response_status?: number | null
          response_time_ms?: number | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          endpoint?: string
          id?: string
          ip_address?: unknown
          method?: string
          referer?: string | null
          request_size?: number | null
          response_status?: number | null
          response_time_ms?: number | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      respa_disclaimers: {
        Row: {
          button_text: string | null
          button_url: string | null
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          button_text?: string | null
          button_url?: string | null
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          button_text?: string | null
          button_url?: string | null
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      retention_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      revenue_tracking: {
        Row: {
          content_id: string | null
          created_at: string | null
          creator_id: string
          id: string
          month_year: string
          paid_out: boolean | null
          payout_date: string | null
          revenue_earned: number | null
          revenue_share_percentage: number | null
          total_plays: number | null
        }
        Insert: {
          content_id?: string | null
          created_at?: string | null
          creator_id: string
          id?: string
          month_year: string
          paid_out?: boolean | null
          payout_date?: string | null
          revenue_earned?: number | null
          revenue_share_percentage?: number | null
          total_plays?: number | null
        }
        Update: {
          content_id?: string | null
          created_at?: string | null
          creator_id?: string
          id?: string
          month_year?: string
          paid_out?: boolean | null
          payout_date?: string | null
          revenue_earned?: number | null
          revenue_share_percentage?: number | null
          total_plays?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_tracking_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_tracking_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      rss_import_feeds: {
        Row: {
          created_at: string
          feed_title: string | null
          feed_url: string
          id: string
          is_active: boolean
          last_imported_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feed_title?: string | null
          feed_url: string
          id?: string
          is_active?: boolean
          last_imported_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feed_title?: string | null
          feed_url?: string
          id?: string
          is_active?: boolean
          last_imported_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_services: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          service_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          service_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          service_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      scraping_settings: {
        Row: {
          auto_block_threshold: number
          enabled: boolean
          id: string
          rate_limit_per_minute: number
          time_window_seconds: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          auto_block_threshold?: number
          enabled?: boolean
          id?: string
          rate_limit_per_minute?: number
          time_window_seconds?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          auto_block_threshold?: number
          enabled?: boolean
          id?: string
          rate_limit_per_minute?: number
          time_window_seconds?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      scriptures: {
        Row: {
          created_at: string | null
          id: string
          ref: string
          tags: string[] | null
          text: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ref: string
          tags?: string[] | null
          text: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ref?: string
          tags?: string[] | null
          text?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_monitoring: {
        Row: {
          created_at: string | null
          description: string | null
          event_type: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_customizations: {
        Row: {
          created_at: string
          custom_description: string | null
          custom_features: Json | null
          custom_images: Json | null
          custom_pricing: Json | null
          custom_title: string | null
          id: string
          is_active: boolean
          service_id: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          custom_description?: string | null
          custom_features?: Json | null
          custom_images?: Json | null
          custom_pricing?: Json | null
          custom_title?: string | null
          id?: string
          is_active?: boolean
          service_id: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          custom_description?: string | null
          custom_features?: Json | null
          custom_images?: Json | null
          custom_pricing?: Json | null
          custom_title?: string | null
          id?: string
          is_active?: boolean
          service_id?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      service_integrations: {
        Row: {
          api_connected: boolean
          booking_system: string
          created_at: string
          id: string
          integration_config: Json | null
          last_sync: string | null
          payment_integration: string
          service_id: string
          tracking_active: boolean
          updated_at: string
          webhook_configured: boolean
        }
        Insert: {
          api_connected?: boolean
          booking_system?: string
          created_at?: string
          id?: string
          integration_config?: Json | null
          last_sync?: string | null
          payment_integration?: string
          service_id: string
          tracking_active?: boolean
          updated_at?: string
          webhook_configured?: boolean
        }
        Update: {
          api_connected?: boolean
          booking_system?: string
          created_at?: string
          id?: string
          integration_config?: Json | null
          last_sync?: string | null
          payment_integration?: string
          service_id?: string
          tracking_active?: boolean
          updated_at?: string
          webhook_configured?: boolean
        }
        Relationships: []
      }
      service_outcome_tracking: {
        Row: {
          agent_id: string | null
          created_at: string | null
          id: string
          outcome_type: string
          outcome_value: number | null
          roi_percentage: number | null
          service_id: string | null
          tracked_at: string | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          id?: string
          outcome_type: string
          outcome_value?: number | null
          roi_percentage?: number | null
          service_id?: string | null
          tracked_at?: string | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          id?: string
          outcome_type?: string
          outcome_value?: number | null
          roi_percentage?: number | null
          service_id?: string | null
          tracked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_outcome_tracking_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_provider_availability: {
        Row: {
          availability_message: string | null
          calendar_link: string | null
          created_at: string
          id: string
          is_available_now: boolean
          next_available_slot: string | null
          service_provider_id: string
          updated_at: string
        }
        Insert: {
          availability_message?: string | null
          calendar_link?: string | null
          created_at?: string
          id?: string
          is_available_now?: boolean
          next_available_slot?: string | null
          service_provider_id: string
          updated_at?: string
        }
        Update: {
          availability_message?: string | null
          calendar_link?: string | null
          created_at?: string
          id?: string
          is_available_now?: boolean
          next_available_slot?: string | null
          service_provider_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_provider_availability_service_provider_id_fkey"
            columns: ["service_provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_provider_credentials: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          last_login: string | null
          password_hash: string
          service_provider_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          password_hash: string
          service_provider_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          password_hash?: string
          service_provider_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_provider_credentials_service_provider_id_fkey"
            columns: ["service_provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_providers: {
        Row: {
          campaigns_funded: number | null
          co_marketing_agents: number | null
          contact_email: string | null
          created_at: string
          description: string | null
          id: string
          individual_email: string | null
          individual_license_number: string | null
          individual_name: string | null
          individual_phone: string | null
          individual_title: string | null
          is_active: boolean | null
          is_respa_regulated: boolean | null
          is_verified: boolean | null
          latitude: number | null
          license_states: string[] | null
          location: string | null
          logo_url: string | null
          longitude: number | null
          mls_areas: string[] | null
          name: string
          nmls_id: string | null
          parent_provider_id: string | null
          phone: string | null
          provider_type: string | null
          rating: number | null
          respa_risk_level: string | null
          review_count: number | null
          service_radius_miles: number | null
          service_states: string[] | null
          service_zip_codes: string[] | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          campaigns_funded?: number | null
          co_marketing_agents?: number | null
          contact_email?: string | null
          created_at?: string
          description?: string | null
          id?: string
          individual_email?: string | null
          individual_license_number?: string | null
          individual_name?: string | null
          individual_phone?: string | null
          individual_title?: string | null
          is_active?: boolean | null
          is_respa_regulated?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          license_states?: string[] | null
          location?: string | null
          logo_url?: string | null
          longitude?: number | null
          mls_areas?: string[] | null
          name: string
          nmls_id?: string | null
          parent_provider_id?: string | null
          phone?: string | null
          provider_type?: string | null
          rating?: number | null
          respa_risk_level?: string | null
          review_count?: number | null
          service_radius_miles?: number | null
          service_states?: string[] | null
          service_zip_codes?: string[] | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          campaigns_funded?: number | null
          co_marketing_agents?: number | null
          contact_email?: string | null
          created_at?: string
          description?: string | null
          id?: string
          individual_email?: string | null
          individual_license_number?: string | null
          individual_name?: string | null
          individual_phone?: string | null
          individual_title?: string | null
          is_active?: boolean | null
          is_respa_regulated?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          license_states?: string[] | null
          location?: string | null
          logo_url?: string | null
          longitude?: number | null
          mls_areas?: string[] | null
          name?: string
          nmls_id?: string | null
          parent_provider_id?: string | null
          phone?: string | null
          provider_type?: string | null
          rating?: number | null
          respa_risk_level?: string | null
          review_count?: number | null
          service_radius_miles?: number | null
          service_states?: string[] | null
          service_zip_codes?: string[] | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_providers_parent_provider_id_fkey"
            columns: ["parent_provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_representatives: {
        Row: {
          bio: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          license_number: string | null
          location: string | null
          name: string
          phone: string | null
          profile_picture_url: string | null
          rating: number | null
          reviews_count: number | null
          sort_order: number | null
          specialties: string[] | null
          title: string | null
          updated_at: string | null
          vendor_id: string
          website: string | null
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          license_number?: string | null
          location?: string | null
          name: string
          phone?: string | null
          profile_picture_url?: string | null
          rating?: number | null
          reviews_count?: number | null
          sort_order?: number | null
          specialties?: string[] | null
          title?: string | null
          updated_at?: string | null
          vendor_id: string
          website?: string | null
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          license_number?: string | null
          location?: string | null
          name?: string
          phone?: string | null
          profile_picture_url?: string | null
          rating?: number | null
          reviews_count?: number | null
          sort_order?: number | null
          specialties?: string[] | null
          title?: string | null
          updated_at?: string | null
          vendor_id?: string
          website?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_representatives_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_representatives_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_with_local_reps"
            referencedColumns: ["id"]
          },
        ]
      }
      service_reviews: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          rating: number
          review: string | null
          review_source: string
          service_id: string
          source_url: string | null
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          rating: number
          review?: string | null
          review_source?: string
          service_id: string
          source_url?: string | null
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          rating?: number
          review?: string | null
          review_source?: string
          service_id?: string
          source_url?: string | null
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      service_tracking_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          revenue_attributed: number | null
          service_id: string
          user_id: string | null
          vendor_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          revenue_attributed?: number | null
          service_id: string
          user_id?: string | null
          vendor_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          revenue_attributed?: number | null
          service_id?: string
          user_id?: string | null
          vendor_id?: string | null
        }
        Relationships: []
      }
      service_views: {
        Row: {
          id: string
          ip_address: unknown | null
          referrer_url: string | null
          service_id: string
          user_agent: string | null
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          ip_address?: unknown | null
          referrer_url?: string | null
          service_id: string
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          ip_address?: unknown | null
          referrer_url?: string | null
          service_id?: string
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_service_views_service_id"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          average_rating: number | null
          booking_time_rules: Json | null
          booking_type: string | null
          calendar_link: string | null
          category: string | null
          co_pay_price: string | null
          compliance_checklist: Json | null
          consultation_email: string | null
          consultation_phone: string | null
          copay_allowed: boolean | null
          created_at: string | null
          description: string | null
          direct_purchase_enabled: boolean | null
          disclaimer_id: string | null
          discount_percentage: string | null
          duration: string | null
          estimated_roi: number | null
          external_booking_provider: string | null
          external_booking_url: string | null
          funnel_content: Json | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          is_published: boolean | null
          is_respa_regulated: boolean | null
          is_sponsored: boolean | null
          is_top_pick: boolean | null
          is_verified: boolean | null
          max_split_percentage_non_ssp: number | null
          price_duration: string | null
          pricing_tiers: Json | null
          pro_price: string | null
          rating: number | null
          regulatory_findings: string | null
          request_pricing: boolean | null
          requires_quote: boolean | null
          respa_compliance_notes: string | null
          respa_risk_level: string | null
          respa_split_limit: number | null
          retail_price: string | null
          service_provider_id: string | null
          setup_time: string | null
          sort_order: number | null
          sponsored_rank_boost: number | null
          supporting_documents: Json | null
          sync_to_ghl: boolean | null
          tags: string[] | null
          title: string
          updated_at: string | null
          vendor_id: string | null
          website_url: string | null
        }
        Insert: {
          average_rating?: number | null
          booking_time_rules?: Json | null
          booking_type?: string | null
          calendar_link?: string | null
          category?: string | null
          co_pay_price?: string | null
          compliance_checklist?: Json | null
          consultation_email?: string | null
          consultation_phone?: string | null
          copay_allowed?: boolean | null
          created_at?: string | null
          description?: string | null
          direct_purchase_enabled?: boolean | null
          disclaimer_id?: string | null
          discount_percentage?: string | null
          duration?: string | null
          estimated_roi?: number | null
          external_booking_provider?: string | null
          external_booking_url?: string | null
          funnel_content?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_published?: boolean | null
          is_respa_regulated?: boolean | null
          is_sponsored?: boolean | null
          is_top_pick?: boolean | null
          is_verified?: boolean | null
          max_split_percentage_non_ssp?: number | null
          price_duration?: string | null
          pricing_tiers?: Json | null
          pro_price?: string | null
          rating?: number | null
          regulatory_findings?: string | null
          request_pricing?: boolean | null
          requires_quote?: boolean | null
          respa_compliance_notes?: string | null
          respa_risk_level?: string | null
          respa_split_limit?: number | null
          retail_price?: string | null
          service_provider_id?: string | null
          setup_time?: string | null
          sort_order?: number | null
          sponsored_rank_boost?: number | null
          supporting_documents?: Json | null
          sync_to_ghl?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          vendor_id?: string | null
          website_url?: string | null
        }
        Update: {
          average_rating?: number | null
          booking_time_rules?: Json | null
          booking_type?: string | null
          calendar_link?: string | null
          category?: string | null
          co_pay_price?: string | null
          compliance_checklist?: Json | null
          consultation_email?: string | null
          consultation_phone?: string | null
          copay_allowed?: boolean | null
          created_at?: string | null
          description?: string | null
          direct_purchase_enabled?: boolean | null
          disclaimer_id?: string | null
          discount_percentage?: string | null
          duration?: string | null
          estimated_roi?: number | null
          external_booking_provider?: string | null
          external_booking_url?: string | null
          funnel_content?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_published?: boolean | null
          is_respa_regulated?: boolean | null
          is_sponsored?: boolean | null
          is_top_pick?: boolean | null
          is_verified?: boolean | null
          max_split_percentage_non_ssp?: number | null
          price_duration?: string | null
          pricing_tiers?: Json | null
          pro_price?: string | null
          rating?: number | null
          regulatory_findings?: string | null
          request_pricing?: boolean | null
          requires_quote?: boolean | null
          respa_compliance_notes?: string | null
          respa_risk_level?: string | null
          respa_split_limit?: number | null
          retail_price?: string | null
          service_provider_id?: string | null
          setup_time?: string | null
          sort_order?: number | null
          sponsored_rank_boost?: number | null
          supporting_documents?: Json | null
          sync_to_ghl?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          vendor_id?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_disclaimer_id_fkey"
            columns: ["disclaimer_id"]
            isOneToOne: false
            referencedRelation: "respa_disclaimers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_service_provider_id_fkey"
            columns: ["service_provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_with_local_reps"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_radar_events: {
        Row: {
          charge_id: string | null
          created_at: string
          customer_id: string | null
          event_data: Json
          event_type: string
          id: string
          payment_intent_id: string | null
          processed: boolean | null
          processed_at: string | null
          stripe_event_id: string
        }
        Insert: {
          charge_id?: string | null
          created_at?: string
          customer_id?: string | null
          event_data?: Json
          event_type: string
          id?: string
          payment_intent_id?: string | null
          processed?: boolean | null
          processed_at?: string | null
          stripe_event_id: string
        }
        Update: {
          charge_id?: string | null
          created_at?: string
          customer_id?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          payment_intent_id?: string | null
          processed?: boolean | null
          processed_at?: string | null
          stripe_event_id?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      support_agents: {
        Row: {
          agent_name: string
          availability_status: string
          average_rating: number | null
          created_at: string
          current_conversations: number | null
          id: string
          languages: string[] | null
          last_active_at: string | null
          max_conversations: number | null
          specialties: string[] | null
          timezone: string | null
          total_conversations: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_name: string
          availability_status?: string
          average_rating?: number | null
          created_at?: string
          current_conversations?: number | null
          id?: string
          languages?: string[] | null
          last_active_at?: string | null
          max_conversations?: number | null
          specialties?: string[] | null
          timezone?: string | null
          total_conversations?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_name?: string
          availability_status?: string
          average_rating?: number | null
          created_at?: string
          current_conversations?: number | null
          id?: string
          languages?: string[] | null
          last_active_at?: string | null
          max_conversations?: number | null
          specialties?: string[] | null
          timezone?: string | null
          total_conversations?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_analytics: {
        Row: {
          ai_resolved_conversations: number | null
          average_resolution_time_seconds: number | null
          average_response_time_seconds: number | null
          created_at: string
          date: string
          escalation_rate: number | null
          human_resolved_conversations: number | null
          id: string
          satisfaction_average: number | null
          total_conversations: number | null
          total_zoom_meetings: number | null
        }
        Insert: {
          ai_resolved_conversations?: number | null
          average_resolution_time_seconds?: number | null
          average_response_time_seconds?: number | null
          created_at?: string
          date: string
          escalation_rate?: number | null
          human_resolved_conversations?: number | null
          id?: string
          satisfaction_average?: number | null
          total_conversations?: number | null
          total_zoom_meetings?: number | null
        }
        Update: {
          ai_resolved_conversations?: number | null
          average_resolution_time_seconds?: number | null
          average_response_time_seconds?: number | null
          created_at?: string
          date?: string
          escalation_rate?: number | null
          human_resolved_conversations?: number | null
          id?: string
          satisfaction_average?: number | null
          total_conversations?: number | null
          total_zoom_meetings?: number | null
        }
        Relationships: []
      }
      support_conversations: {
        Row: {
          agent_id: string | null
          category: string | null
          conversation_type: string
          created_at: string
          escalated_at: string | null
          escalation_reason: string | null
          id: string
          metadata: Json | null
          priority: string
          resolution_summary: string | null
          resolved_at: string | null
          satisfaction_rating: number | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          agent_id?: string | null
          category?: string | null
          conversation_type?: string
          created_at?: string
          escalated_at?: string | null
          escalation_reason?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          resolution_summary?: string | null
          resolved_at?: string | null
          satisfaction_rating?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          agent_id?: string | null
          category?: string | null
          conversation_type?: string
          created_at?: string
          escalated_at?: string | null
          escalation_reason?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          resolution_summary?: string | null
          resolved_at?: string | null
          satisfaction_rating?: number | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      support_escalations: {
        Row: {
          assigned_to: string | null
          context_data: Json | null
          conversation_id: string
          created_at: string
          escalated_by: string | null
          escalated_from: string
          escalation_priority: string
          escalation_reason: string
          id: string
          resolution_notes: string | null
          resolved_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          context_data?: Json | null
          conversation_id: string
          created_at?: string
          escalated_by?: string | null
          escalated_from: string
          escalation_priority?: string
          escalation_reason: string
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          context_data?: Json | null
          conversation_id?: string
          created_at?: string
          escalated_by?: string | null
          escalated_from?: string
          escalation_priority?: string
          escalation_reason?: string
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_escalations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "support_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_escalations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      support_knowledge_base: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string | null
          helpful_count: number | null
          id: string
          is_public: boolean | null
          search_keywords: string[] | null
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          created_by?: string | null
          helpful_count?: number | null
          id?: string
          is_public?: boolean | null
          search_keywords?: string[] | null
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          helpful_count?: number | null
          id?: string
          is_public?: boolean | null
          search_keywords?: string[] | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          ai_confidence_score: number | null
          attachments: Json | null
          conversation_id: string
          created_at: string
          edited_at: string | null
          id: string
          is_escalation_trigger: boolean | null
          message_content: string
          message_type: string
          metadata: Json | null
          read_at: string | null
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          ai_confidence_score?: number | null
          attachments?: Json | null
          conversation_id: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_escalation_trigger?: boolean | null
          message_content: string
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          sender_id?: string | null
          sender_type: string
        }
        Update: {
          ai_confidence_score?: number | null
          attachments?: Json | null
          conversation_id?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_escalation_trigger?: boolean | null
          message_content?: string
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      title_companies: {
        Row: {
          address: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          agent_id: string
          city: string | null
          close_date: string
          commission_amount: number | null
          commission_percentage: number | null
          created_at: string
          id: string
          latitude: number | null
          lender_id: string | null
          listing_id: string | null
          loan_type: string | null
          longitude: number | null
          mls_number: string | null
          notes: string | null
          price: number
          property_address: string
          property_type: string
          side: string
          state: string | null
          title_company_id: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          agent_id: string
          city?: string | null
          close_date: string
          commission_amount?: number | null
          commission_percentage?: number | null
          created_at?: string
          id?: string
          latitude?: number | null
          lender_id?: string | null
          listing_id?: string | null
          loan_type?: string | null
          longitude?: number | null
          mls_number?: string | null
          notes?: string | null
          price: number
          property_address: string
          property_type: string
          side: string
          state?: string | null
          title_company_id?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          agent_id?: string
          city?: string | null
          close_date?: string
          commission_amount?: number | null
          commission_percentage?: number | null
          created_at?: string
          id?: string
          latitude?: number | null
          lender_id?: string | null
          listing_id?: string | null
          loan_type?: string | null
          longitude?: number | null
          mls_number?: string | null
          notes?: string | null
          price?: number
          property_address?: string
          property_type?: string
          side?: string
          state?: string | null
          title_company_id?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_lender_id_fkey"
            columns: ["lender_id"]
            isOneToOne: false
            referencedRelation: "lenders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_title_company_id_fkey"
            columns: ["title_company_id"]
            isOneToOne: false
            referencedRelation: "title_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ai_preferences: {
        Row: {
          created_at: string | null
          frequency: number | null
          id: string
          intent_type: string
          last_query: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          frequency?: number | null
          id?: string
          intent_type: string
          last_query?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          frequency?: number | null
          id?: string
          intent_type?: string
          last_query?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_onboarding_states: {
        Row: {
          created_at: string
          current_step: string
          dismissed: boolean
          id: string
          is_completed: boolean
          last_seen_at: string
          steps: Json
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          current_step?: string
          dismissed?: boolean
          id?: string
          is_completed?: boolean
          last_seen_at?: string
          steps?: Json
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          current_step?: string
          dismissed?: boolean
          id?: string
          is_completed?: boolean
          last_seen_at?: string
          steps?: Json
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      vendor_agent_activities: {
        Row: {
          activity_data: Json | null
          activity_type: string
          agent_id: string
          created_at: string
          id: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          agent_id: string
          created_at?: string
          id?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          agent_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_agent_activities_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_agent_activities_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_with_local_reps"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_agent_criteria: {
        Row: {
          allowed_agent_tiers: string[] | null
          created_at: string | null
          id: string
          is_active: boolean | null
          max_annual_volume: number | null
          max_years_experience: number | null
          min_annual_volume: number | null
          min_average_commission: number | null
          min_conversion_rate: number | null
          min_transactions_closed: number | null
          min_years_experience: number | null
          requires_nmls: boolean | null
          target_markets: string[] | null
          target_states: string[] | null
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          allowed_agent_tiers?: string[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_annual_volume?: number | null
          max_years_experience?: number | null
          min_annual_volume?: number | null
          min_average_commission?: number | null
          min_conversion_rate?: number | null
          min_transactions_closed?: number | null
          min_years_experience?: number | null
          requires_nmls?: boolean | null
          target_markets?: string[] | null
          target_states?: string[] | null
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          allowed_agent_tiers?: string[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_annual_volume?: number | null
          max_years_experience?: number | null
          min_annual_volume?: number | null
          min_average_commission?: number | null
          min_conversion_rate?: number | null
          min_transactions_closed?: number | null
          min_years_experience?: number | null
          requires_nmls?: boolean | null
          target_markets?: string[] | null
          target_states?: string[] | null
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_agent_criteria_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_agent_criteria_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "vendors_with_local_reps"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_analytics_cache: {
        Row: {
          avg_rating: number
          conversion_rate: number
          last_updated: string
          total_bookings: number
          total_reviews: number
          total_services: number
          total_views: number
          vendor_id: string
          vendor_name: string
        }
        Insert: {
          avg_rating?: number
          conversion_rate?: number
          last_updated?: string
          total_bookings?: number
          total_reviews?: number
          total_services?: number
          total_views?: number
          vendor_id: string
          vendor_name: string
        }
        Update: {
          avg_rating?: number
          conversion_rate?: number
          last_updated?: string
          total_bookings?: number
          total_reviews?: number
          total_services?: number
          total_views?: number
          vendor_id?: string
          vendor_name?: string
        }
        Relationships: []
      }
      vendor_availability: {
        Row: {
          availability_message: string | null
          calendar_link: string | null
          created_at: string
          id: string
          is_available_now: boolean
          next_available_slot: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          availability_message?: string | null
          calendar_link?: string | null
          created_at?: string
          id?: string
          is_available_now?: boolean
          next_available_slot?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          availability_message?: string | null
          calendar_link?: string | null
          created_at?: string
          id?: string
          is_available_now?: boolean
          next_available_slot?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      vendor_commission_tracking: {
        Row: {
          actual_commission: number | null
          commission_paid: boolean
          commission_rate: number
          created_at: string
          estimated_commission: number
          id: string
          notes: string | null
          payment_date: string | null
          report_email_id: string | null
          report_month: string
          report_sent_at: string | null
          total_clicks: number
          unique_agents: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          actual_commission?: number | null
          commission_paid?: boolean
          commission_rate?: number
          created_at?: string
          estimated_commission?: number
          id?: string
          notes?: string | null
          payment_date?: string | null
          report_email_id?: string | null
          report_month: string
          report_sent_at?: string | null
          total_clicks?: number
          unique_agents?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          actual_commission?: number | null
          commission_paid?: boolean
          commission_rate?: number
          created_at?: string
          estimated_commission?: number
          id?: string
          notes?: string | null
          payment_date?: string | null
          report_email_id?: string | null
          report_month?: string
          report_sent_at?: string | null
          total_clicks?: number
          unique_agents?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      vendor_commissions: {
        Row: {
          commission_amount: number
          commission_percentage: number | null
          created_at: string
          id: string
          notes: string | null
          payment_date: string | null
          payment_reference: string | null
          payment_status: string | null
          sale_amount: number | null
          transaction_id: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          commission_amount: number
          commission_percentage?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          sale_amount?: number | null
          transaction_id?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          commission_amount?: number
          commission_percentage?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          sale_amount?: number | null
          transaction_id?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_commissions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_commissions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_with_local_reps"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_content: {
        Row: {
          content_type: string
          content_url: string
          created_at: string
          description: string | null
          display_order: number | null
          file_size: number | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          metadata: Json | null
          mime_type: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          content_type: string
          content_url: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          content_type?: string
          content_url?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          file_size?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      vendor_copay_rules: {
        Row: {
          auto_approve_threshold: number | null
          created_at: string
          id: string
          is_active: boolean | null
          max_split_percentage: number | null
          monthly_limit_per_agent: number | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          auto_approve_threshold?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_split_percentage?: number | null
          monthly_limit_per_agent?: number | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          auto_approve_threshold?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_split_percentage?: number | null
          monthly_limit_per_agent?: number | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      vendor_credentials: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          last_login: string | null
          password_hash: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          password_hash: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          password_hash?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      vendor_invitations: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          invitation_token: string | null
          invited_by: string | null
          status: string
          vendor_company: string | null
          vendor_email: string
          vendor_name: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          invitation_token?: string | null
          invited_by?: string | null
          status?: string
          vendor_company?: string | null
          vendor_email: string
          vendor_name: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          invitation_token?: string | null
          invited_by?: string | null
          status?: string
          vendor_company?: string | null
          vendor_email?: string
          vendor_name?: string
        }
        Relationships: []
      }
      vendor_qa: {
        Row: {
          agent_id: string | null
          answer: string | null
          created_at: string | null
          id: string
          is_answered: boolean | null
          is_featured: boolean | null
          question: string
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          agent_id?: string | null
          answer?: string | null
          created_at?: string | null
          id?: string
          is_answered?: boolean | null
          is_featured?: boolean | null
          question: string
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          agent_id?: string | null
          answer?: string | null
          created_at?: string | null
          id?: string
          is_answered?: boolean | null
          is_featured?: boolean | null
          question?: string
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_qa_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_qa_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_with_local_reps"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_questions: {
        Row: {
          ai_generated: boolean | null
          answer_text: string | null
          created_at: string
          id: string
          manually_updated: boolean | null
          question_number: number
          question_text: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          ai_generated?: boolean | null
          answer_text?: string | null
          created_at?: string
          id?: string
          manually_updated?: boolean | null
          question_number: number
          question_text: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          ai_generated?: boolean | null
          answer_text?: string | null
          created_at?: string
          id?: string
          manually_updated?: boolean | null
          question_number?: number
          question_text?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      vendor_user_associations: {
        Row: {
          created_at: string | null
          id: string
          is_primary_contact: boolean | null
          role: string
          updated_at: string | null
          user_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary_contact?: boolean | null
          role?: string
          updated_at?: string | null
          user_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary_contact?: boolean | null
          role?: string
          updated_at?: string | null
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_user_associations_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_user_associations_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_with_local_reps"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          ad_budget_max: number | null
          ad_budget_min: number | null
          agreement_documents: Json | null
          agreement_notes: string | null
          agreement_renewal_date: string | null
          agreement_start_date: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          auto_score: number | null
          automated_checks: Json | null
          brand_colors: Json | null
          budget_currency: string | null
          campaigns_funded: number | null
          circle_commission_percentage: number | null
          co_marketing_agents: number | null
          commission_notes: string | null
          commission_type: string | null
          computed_co_marketing_agents: number | null
          contact_email: string | null
          created_at: string
          custom_cta_text: string | null
          description: string | null
          funnel_enabled: boolean | null
          funnel_template_id: string | null
          hero_banner_url: string | null
          id: string
          individual_email: string | null
          individual_license_number: string | null
          individual_name: string | null
          individual_phone: string | null
          individual_profile_picture_url: string | null
          individual_title: string | null
          is_active: boolean | null
          is_open_to_partner: boolean | null
          is_premium_provider: boolean | null
          is_respa_regulated: boolean | null
          is_verified: boolean | null
          latitude: number | null
          license_states: string[] | null
          location: string | null
          logo_url: string | null
          longitude: number | null
          minimum_commission_amount: number | null
          mls_areas: string[] | null
          name: string
          nmls_id: string | null
          parent_vendor_id: string | null
          payment_terms: string | null
          phone: string | null
          rating: number | null
          respa_risk_level: string | null
          review_count: number | null
          seed_active: boolean | null
          seed_expires_at: string | null
          seed_notes: string | null
          seeded_co_marketing_agents: number | null
          service_radius_miles: number | null
          service_states: string[] | null
          service_zip_codes: string[] | null
          sort_order: number | null
          support_hours: string | null
          updated_at: string
          value_statement: string | null
          vendor_type: string | null
          verification_notes: string | null
          website_url: string | null
        }
        Insert: {
          ad_budget_max?: number | null
          ad_budget_min?: number | null
          agreement_documents?: Json | null
          agreement_notes?: string | null
          agreement_renewal_date?: string | null
          agreement_start_date?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auto_score?: number | null
          automated_checks?: Json | null
          brand_colors?: Json | null
          budget_currency?: string | null
          campaigns_funded?: number | null
          circle_commission_percentage?: number | null
          co_marketing_agents?: number | null
          commission_notes?: string | null
          commission_type?: string | null
          computed_co_marketing_agents?: number | null
          contact_email?: string | null
          created_at?: string
          custom_cta_text?: string | null
          description?: string | null
          funnel_enabled?: boolean | null
          funnel_template_id?: string | null
          hero_banner_url?: string | null
          id?: string
          individual_email?: string | null
          individual_license_number?: string | null
          individual_name?: string | null
          individual_phone?: string | null
          individual_profile_picture_url?: string | null
          individual_title?: string | null
          is_active?: boolean | null
          is_open_to_partner?: boolean | null
          is_premium_provider?: boolean | null
          is_respa_regulated?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          license_states?: string[] | null
          location?: string | null
          logo_url?: string | null
          longitude?: number | null
          minimum_commission_amount?: number | null
          mls_areas?: string[] | null
          name: string
          nmls_id?: string | null
          parent_vendor_id?: string | null
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          respa_risk_level?: string | null
          review_count?: number | null
          seed_active?: boolean | null
          seed_expires_at?: string | null
          seed_notes?: string | null
          seeded_co_marketing_agents?: number | null
          service_radius_miles?: number | null
          service_states?: string[] | null
          service_zip_codes?: string[] | null
          sort_order?: number | null
          support_hours?: string | null
          updated_at?: string
          value_statement?: string | null
          vendor_type?: string | null
          verification_notes?: string | null
          website_url?: string | null
        }
        Update: {
          ad_budget_max?: number | null
          ad_budget_min?: number | null
          agreement_documents?: Json | null
          agreement_notes?: string | null
          agreement_renewal_date?: string | null
          agreement_start_date?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auto_score?: number | null
          automated_checks?: Json | null
          brand_colors?: Json | null
          budget_currency?: string | null
          campaigns_funded?: number | null
          circle_commission_percentage?: number | null
          co_marketing_agents?: number | null
          commission_notes?: string | null
          commission_type?: string | null
          computed_co_marketing_agents?: number | null
          contact_email?: string | null
          created_at?: string
          custom_cta_text?: string | null
          description?: string | null
          funnel_enabled?: boolean | null
          funnel_template_id?: string | null
          hero_banner_url?: string | null
          id?: string
          individual_email?: string | null
          individual_license_number?: string | null
          individual_name?: string | null
          individual_phone?: string | null
          individual_profile_picture_url?: string | null
          individual_title?: string | null
          is_active?: boolean | null
          is_open_to_partner?: boolean | null
          is_premium_provider?: boolean | null
          is_respa_regulated?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          license_states?: string[] | null
          location?: string | null
          logo_url?: string | null
          longitude?: number | null
          minimum_commission_amount?: number | null
          mls_areas?: string[] | null
          name?: string
          nmls_id?: string | null
          parent_vendor_id?: string | null
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          respa_risk_level?: string | null
          review_count?: number | null
          seed_active?: boolean | null
          seed_expires_at?: string | null
          seed_notes?: string | null
          seeded_co_marketing_agents?: number | null
          service_radius_miles?: number | null
          service_states?: string[] | null
          service_zip_codes?: string[] | null
          sort_order?: number | null
          support_hours?: string | null
          updated_at?: string
          value_statement?: string | null
          vendor_type?: string | null
          verification_notes?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_parent_vendor_id_fkey"
            columns: ["parent_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_parent_vendor_id_fkey"
            columns: ["parent_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_with_local_reps"
            referencedColumns: ["id"]
          },
        ]
      }
      video_ratings: {
        Row: {
          created_at: string | null
          id: string
          rating: number
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          rating: number
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          rating?: number
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "video_ratings_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_views: {
        Row: {
          completed: boolean | null
          id: string
          user_id: string | null
          video_id: string
          viewed_at: string | null
          watch_duration: number | null
        }
        Insert: {
          completed?: boolean | null
          id?: string
          user_id?: string | null
          video_id: string
          viewed_at?: string | null
          watch_duration?: number | null
        }
        Update: {
          completed?: boolean | null
          id?: string
          user_id?: string | null
          video_id?: string
          viewed_at?: string | null
          watch_duration?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "video_views_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          category: string
          created_at: string | null
          creator_id: string | null
          creator_name: string
          description: string | null
          duration: string
          id: string
          is_featured: boolean | null
          is_pro: boolean | null
          rating: number | null
          status: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          upload_date: string | null
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          creator_id?: string | null
          creator_name: string
          description?: string | null
          duration: string
          id?: string
          is_featured?: boolean | null
          is_pro?: boolean | null
          rating?: number | null
          status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          upload_date?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          creator_id?: string | null
          creator_name?: string
          description?: string | null
          duration?: string
          id?: string
          is_featured?: boolean | null
          is_pro?: boolean | null
          rating?: number | null
          status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          upload_date?: string | null
          video_url?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          consultation_booking_id: string | null
          created_at: string | null
          error_message: string | null
          event_type: string
          external_event_id: string | null
          id: string
          payload: Json
          processed: boolean | null
          processed_at: string | null
          provider: string
        }
        Insert: {
          consultation_booking_id?: string | null
          created_at?: string | null
          error_message?: string | null
          event_type: string
          external_event_id?: string | null
          id?: string
          payload?: Json
          processed?: boolean | null
          processed_at?: string | null
          provider: string
        }
        Update: {
          consultation_booking_id?: string | null
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          external_event_id?: string | null
          id?: string
          payload?: Json
          processed?: boolean | null
          processed_at?: string | null
          provider?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_consultation_booking_id_fkey"
            columns: ["consultation_booking_id"]
            isOneToOne: false
            referencedRelation: "consultation_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      zoom_integrations: {
        Row: {
          attendee_id: string | null
          conversation_id: string
          created_at: string
          duration_minutes: number | null
          host_id: string | null
          id: string
          meeting_id: string
          meeting_notes: string | null
          meeting_status: string
          meeting_url: string
          passcode: string | null
          recording_url: string | null
          scheduled_at: string
          updated_at: string
        }
        Insert: {
          attendee_id?: string | null
          conversation_id: string
          created_at?: string
          duration_minutes?: number | null
          host_id?: string | null
          id?: string
          meeting_id: string
          meeting_notes?: string | null
          meeting_status?: string
          meeting_url: string
          passcode?: string | null
          recording_url?: string | null
          scheduled_at: string
          updated_at?: string
        }
        Update: {
          attendee_id?: string | null
          conversation_id?: string
          created_at?: string
          duration_minutes?: number | null
          host_id?: string | null
          id?: string
          meeting_id?: string
          meeting_notes?: string | null
          meeting_status?: string
          meeting_url?: string
          passcode?: string | null
          recording_url?: string | null
          scheduled_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "zoom_integrations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vendor_service_analytics: {
        Row: {
          avg_rating: number | null
          conversion_rate: number | null
          total_bookings: number | null
          total_reviews: number | null
          total_services: number | null
          total_views: number | null
          vendor_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_with_local_reps"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors_with_local_reps: {
        Row: {
          campaigns_funded: number | null
          co_marketing_agents: number | null
          contact_email: string | null
          created_at: string | null
          description: string | null
          id: string | null
          individual_email: string | null
          individual_license_number: string | null
          individual_name: string | null
          individual_phone: string | null
          individual_title: string | null
          is_active: boolean | null
          is_verified: boolean | null
          latitude: number | null
          license_states: string[] | null
          local_representatives: Json | null
          location: string | null
          logo_url: string | null
          longitude: number | null
          mls_areas: string[] | null
          name: string | null
          nmls_id: string | null
          parent_vendor_id: string | null
          phone: string | null
          rating: number | null
          review_count: number | null
          service_radius_miles: number | null
          service_states: string[] | null
          service_zip_codes: string[] | null
          updated_at: string | null
          vendor_type: string | null
          website_url: string | null
        }
        Insert: {
          campaigns_funded?: number | null
          co_marketing_agents?: number | null
          contact_email?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          individual_email?: string | null
          individual_license_number?: string | null
          individual_name?: string | null
          individual_phone?: string | null
          individual_title?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          license_states?: string[] | null
          local_representatives?: never
          location?: string | null
          logo_url?: string | null
          longitude?: number | null
          mls_areas?: string[] | null
          name?: string | null
          nmls_id?: string | null
          parent_vendor_id?: string | null
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          service_radius_miles?: number | null
          service_states?: string[] | null
          service_zip_codes?: string[] | null
          updated_at?: string | null
          vendor_type?: string | null
          website_url?: string | null
        }
        Update: {
          campaigns_funded?: number | null
          co_marketing_agents?: number | null
          contact_email?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          individual_email?: string | null
          individual_license_number?: string | null
          individual_name?: string | null
          individual_phone?: string | null
          individual_title?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          license_states?: string[] | null
          local_representatives?: never
          location?: string | null
          logo_url?: string | null
          longitude?: number | null
          mls_areas?: string[] | null
          name?: string | null
          nmls_id?: string | null
          parent_vendor_id?: string | null
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          service_radius_miles?: number | null
          service_states?: string[] | null
          service_zip_codes?: string[] | null
          updated_at?: string | null
          vendor_type?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_parent_vendor_id_fkey"
            columns: ["parent_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_parent_vendor_id_fkey"
            columns: ["parent_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_with_local_reps"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      auto_block_suspicious_ips: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      backup_financial_data: {
        Args: { backup_type_param: string }
        Returns: string
      }
      calculate_agent_playbook_earnings: {
        Args: { p_content_id: string; p_total_revenue: number }
        Returns: number
      }
      calculate_distance: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      calculate_distance_miles: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      calculate_engagement_quality_score: {
        Args: {
          p_completion_percentage: number
          p_content_type: string
          p_total_content_duration?: number
          p_watch_time_seconds: number
        }
        Returns: number
      }
      calculate_monthly_payouts: {
        Args: { target_month?: string }
        Returns: undefined
      }
      calculate_monthly_revenue: {
        Args: { target_month: string }
        Returns: undefined
      }
      calculate_respa_compliant_usage: {
        Args: {
          p_agent_id: string
          p_service_id: string
          p_total_amount: number
        }
        Returns: Json
      }
      calculate_vendor_active_agents: {
        Args: { vendor_uuid: string }
        Returns: number
      }
      calculate_vendor_stats: {
        Args: { vendor_uuid: string }
        Returns: Json
      }
      calculate_weighted_engagement_score: {
        Args: {
          p_content_type: string
          p_engagement_quality_score: number
          p_revenue_attributed?: number
        }
        Returns: number
      }
      check_account_lockout: {
        Args: { client_ip?: unknown; user_email: string }
        Returns: Json
      }
      check_admin_operation_rate_limit: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_admin_operation_rate_limit_enhanced: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_admin_operation_rate_limit_strict: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_agent_vendor_match: {
        Args: { p_agent_id: string; p_vendor_id: string }
        Returns: boolean
      }
      check_and_update_lockout: {
        Args: { p_attempt_type: string; p_identifier: string }
        Returns: Json
      }
      check_expiring_payment_schedules: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_security_operation_rate_limit: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      clean_ip_address: {
        Args: { input_ip: string }
        Returns: unknown
      }
      cleanup_expired_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_security_events: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      clear_failed_attempts: {
        Args: { p_attempt_type?: string; p_identifier: string }
        Returns: undefined
      }
      create_data_checksum: {
        Args: { data_json: Json }
        Returns: string
      }
      detect_suspicious_activity: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      expire_co_pay_requests: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_agent_points_summary: {
        Args: { p_agent_id: string }
        Returns: Json
      }
      get_bestseller_services: {
        Args: {
          p_max_count?: number
          p_min_count?: number
          p_period?: string
          p_top_pct?: number
        }
        Returns: {
          avg_purchase_value: number
          conversion_rate: number
          purchase_velocity: number
          rank: number
          sales_score: number
          service_id: string
          total_purchases: number
          total_revenue: number
        }[]
      }
      get_creator_earnings_summary: {
        Args: { creator_user_id: string }
        Returns: Json
      }
      get_enhanced_creator_info: {
        Args: { p_content_id: string }
        Returns: {
          creator_type: string
          display_avatar: string
          display_name: string
          display_subscribers: number
          display_verified: boolean
          platform_bio: string
          youtube_channel_id: string
        }[]
      }
      get_funnel_metrics: {
        Args: { p_period?: string }
        Returns: Json
      }
      get_optimized_marketplace_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          service_category: string
          service_co_pay_price: string
          service_copay_allowed: boolean
          service_description: string
          service_discount_percentage: string
          service_duration: string
          service_estimated_roi: number
          service_id: string
          service_image_url: string
          service_is_featured: boolean
          service_is_top_pick: boolean
          service_pro_price: string
          service_requires_quote: boolean
          service_retail_price: string
          service_sort_order: number
          service_tags: string[]
          service_title: string
          vendor_campaigns_funded: number
          vendor_co_marketing_agents: number
          vendor_description: string
          vendor_id: string
          vendor_is_verified: boolean
          vendor_latitude: number
          vendor_license_states: string[]
          vendor_local_representatives: Json
          vendor_location: string
          vendor_logo_url: string
          vendor_longitude: number
          vendor_mls_areas: string[]
          vendor_name: string
          vendor_rating: number
          vendor_review_count: number
          vendor_service_radius_miles: number
          vendor_service_states: string[]
          vendor_type: string
          vendor_website_url: string
        }[]
      }
      get_public_profile: {
        Args: { profile_id: string }
        Returns: {
          avatar_url: string
          business_name: string
          display_name: string
          id: string
          location: string
          specialties: string[]
          website_url: string
          years_experience: number
        }[]
      }
      get_service_rating_stats: {
        Args: { service_id: string }
        Returns: {
          average_rating: number
          total_reviews: number
        }[]
      }
      get_service_ratings_bulk: {
        Args: { p_service_ids: string[] }
        Returns: {
          average_rating: number
          service_id: string
          total_reviews: number
        }[]
      }
      get_service_tracking_metrics: {
        Args: { p_service_id: string; p_time_period?: string }
        Returns: Json
      }
      get_trending_services: {
        Args: {
          p_max_count?: number
          p_min_count?: number
          p_period?: string
          p_top_pct?: number
        }
        Returns: {
          bookings_now: number
          conv_now: number
          conv_prev: number
          purchases_now: number
          rank: number
          revenue_now: number
          score: number
          service_id: string
          views_now: number
          views_prev: number
        }[]
      }
      get_user_admin_status: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_vendor_dashboard_stats: {
        Args: { p_vendor_id: string }
        Returns: Json
      }
      increment_content_plays: {
        Args: { content_uuid: string }
        Returns: undefined
      }
      increment_failed_attempts: {
        Args: { p_attempt_type?: string; p_identifier: string }
        Returns: undefined
      }
      increment_video_views: {
        Args: { video_uuid: string }
        Returns: undefined
      }
      link_funnel_events: {
        Args: { p_anon_id: string }
        Returns: Json
      }
      link_youtube_channel_to_user: {
        Args: {
          p_user_id: string
          p_youtube_channel_id: string
          p_youtube_channel_url?: string
        }
        Returns: string
      }
      log_admin_operation_secure: {
        Args: {
          operation_data?: Json
          operation_type: string
          target_user_id: string
        }
        Returns: boolean
      }
      log_login_attempt: {
        Args: {
          client_ip?: unknown
          client_user_agent?: string
          success: boolean
          user_email: string
        }
        Returns: undefined
      }
      mint_referral_token: {
        Args: {
          p_service_id: string
          p_ttl_minutes?: number
          p_user_id: string
          p_vendor_id: string
        }
        Returns: string
      }
      process_automatic_copay: {
        Args: {
          p_agent_id: string
          p_coverage_percentage: number
          p_order_id?: string
          p_service_id: string
          p_total_amount: number
          p_vendor_id: string
        }
        Returns: Json
      }
      process_background_job: {
        Args: { job_id: string }
        Returns: Json
      }
      process_real_time_charge: {
        Args: {
          p_agent_id: string
          p_allocation_id: string
          p_amount_to_charge: number
          p_points_used: number
          p_transaction_id: string
          p_vendor_id: string
        }
        Returns: Json
      }
      process_respa_compliant_transaction: {
        Args: {
          p_agent_id: string
          p_order_id?: string
          p_service_id: string
          p_total_amount: number
          p_vendor_id: string
        }
        Returns: Json
      }
      refresh_vendor_analytics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_vendor_analytics_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      secure_profile_update: {
        Args: { target_user_id: string; update_data: Json }
        Returns: Json
      }
      seed_standardized_vendor_questions: {
        Args: { p_vendor_id: string }
        Returns: undefined
      }
      seed_vendor_questions: {
        Args: { p_vendor_id: string }
        Returns: undefined
      }
      track_vendor_activity: {
        Args: {
          p_activity_data?: Json
          p_activity_type: string
          p_vendor_id: string
        }
        Returns: string
      }
      trigger_trending_import: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_all_vendor_stats: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_creator_analytics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_creator_analytics_weighted: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_playbook_creator_analytics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      user_has_specialty: {
        Args: { specialty_name: string }
        Returns: boolean
      }
      validate_admin_session: {
        Args: { session_token: string }
        Returns: boolean
      }
      validate_admin_session_context: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      validate_and_sanitize_text_input: {
        Args: { input_text: string }
        Returns: string
      }
      validate_password_strength: {
        Args: { password: string }
        Returns: Json
      }
      validate_secure_admin_operation: {
        Args: { operation_type: string; target_data?: Json }
        Returns: boolean
      }
      validate_session_context: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      validate_uuid_field: {
        Args: { input_text: string }
        Returns: boolean
      }
      verify_admin_operation_request: {
        Args: {
          operation_type: string
          target_user_id: string
          verification_token?: string
        }
        Returns: Json
      }
      verify_backup_integrity: {
        Args: { backup_id_param: string }
        Returns: boolean
      }
      verify_critical_data_integrity: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      content_type:
        | "video"
        | "podcast"
        | "book"
        | "course"
        | "playbook"
        | "channel"
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
      content_type: [
        "video",
        "podcast",
        "book",
        "course",
        "playbook",
        "channel",
      ],
    },
  },
} as const
