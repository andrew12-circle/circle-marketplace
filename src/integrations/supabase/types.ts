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
      action_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown
          route: string
          token_hash: string
          used: boolean
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address: unknown
          route: string
          token_hash: string
          used?: boolean
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          route?: string
          token_hash?: string
          used?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      admin_notes: {
        Row: {
          created_at: string
          created_by: string
          id: string
          note_text: string
          service_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          note_text: string
          service_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          note_text?: string
          service_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notes_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          message: string
          priority: string
          read: boolean
          read_at: string | null
          read_by: string | null
          title: string
          type: string
          vendor_id: string
          vendor_name: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          message: string
          priority?: string
          read?: boolean
          read_at?: string | null
          read_by?: string | null
          title: string
          type: string
          vendor_id: string
          vendor_name?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          message?: string
          priority?: string
          read?: boolean
          read_at?: string | null
          read_by?: string | null
          title?: string
          type?: string
          vendor_id?: string
          vendor_name?: string | null
        }
        Relationships: []
      }
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
      advisor_responses: {
        Row: {
          created_at: string | null
          id: number
          question_id: string
          updated_at: string | null
          user_id: string
          value: Json
        }
        Insert: {
          created_at?: string | null
          id?: number
          question_id: string
          updated_at?: string | null
          user_id: string
          value: Json
        }
        Update: {
          created_at?: string | null
          id?: number
          question_id?: string
          updated_at?: string | null
          user_id?: string
          value?: Json
        }
        Relationships: []
      }
      advisor_signals: {
        Row: {
          created_at: string | null
          id: number
          signal: string
          user_id: string
          value: string
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          signal: string
          user_id: string
          value: string
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          signal?: string
          user_id?: string
          value?: string
          weight?: number | null
        }
        Relationships: []
      }
      affiliate_approval_workflow: {
        Row: {
          affiliate_id: string
          approval_criteria_met: Json
          auto_approval_score: number
          created_at: string
          current_stage: string
          id: string
          manual_review_required: boolean
          stage_history: Json
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          approval_criteria_met?: Json
          auto_approval_score?: number
          created_at?: string
          current_stage?: string
          id?: string
          manual_review_required?: boolean
          stage_history?: Json
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          approval_criteria_met?: Json
          auto_approval_score?: number
          created_at?: string
          current_stage?: string
          id?: string
          manual_review_required?: boolean
          stage_history?: Json
          updated_at?: string
        }
        Relationships: []
      }
      affiliate_attributions: {
        Row: {
          affiliate_id: string
          attribution_model: string
          cookie_expires_at: string
          created_at: string
          id: string
          link_id: string
          prospect_user_id: string | null
          session_id: string | null
        }
        Insert: {
          affiliate_id: string
          attribution_model?: string
          cookie_expires_at?: string
          created_at?: string
          id?: string
          link_id: string
          prospect_user_id?: string | null
          session_id?: string | null
        }
        Update: {
          affiliate_id?: string
          attribution_model?: string
          cookie_expires_at?: string
          created_at?: string
          id?: string
          link_id?: string
          prospect_user_id?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_attributions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_attributions_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_attributions_prospect_user_id_fkey"
            columns: ["prospect_user_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
      }
      affiliate_clicks: {
        Row: {
          affiliate_id: string
          clicked_at: string
          id: string
          ip: unknown | null
          link_id: string
          referrer: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          affiliate_id: string
          clicked_at?: string
          id?: string
          ip?: unknown | null
          link_id: string
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          affiliate_id?: string
          clicked_at?: string
          id?: string
          ip?: unknown | null
          link_id?: string
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_conversions: {
        Row: {
          affiliate_id: string
          amount_gross: number
          approval_timestamp: string | null
          commission_amount: number
          commission_flat: number | null
          commission_rate: number
          conversion_type: Database["public"]["Enums"]["affiliate_conversion_type"]
          created_at: string
          eligible_amount: number
          event_timestamp: string
          id: string
          link_id: string | null
          notes: string | null
          order_id: string | null
          status: Database["public"]["Enums"]["affiliate_conversion_status"]
          subscription_id: string | null
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          amount_gross: number
          approval_timestamp?: string | null
          commission_amount: number
          commission_flat?: number | null
          commission_rate: number
          conversion_type: Database["public"]["Enums"]["affiliate_conversion_type"]
          created_at?: string
          eligible_amount: number
          event_timestamp: string
          id?: string
          link_id?: string | null
          notes?: string | null
          order_id?: string | null
          status?: Database["public"]["Enums"]["affiliate_conversion_status"]
          subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          amount_gross?: number
          approval_timestamp?: string | null
          commission_amount?: number
          commission_flat?: number | null
          commission_rate?: number
          conversion_type?: Database["public"]["Enums"]["affiliate_conversion_type"]
          created_at?: string
          eligible_amount?: number
          event_timestamp?: string
          id?: string
          link_id?: string | null
          notes?: string | null
          order_id?: string | null
          status?: Database["public"]["Enums"]["affiliate_conversion_status"]
          subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_conversions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_conversions_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_documents: {
        Row: {
          affiliate_id: string
          created_at: string
          doc_type: Database["public"]["Enums"]["affiliate_doc_type"]
          file_url: string
          id: string
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          doc_type: Database["public"]["Enums"]["affiliate_doc_type"]
          file_url: string
          id?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          doc_type?: Database["public"]["Enums"]["affiliate_doc_type"]
          file_url?: string
          id?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_documents_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
      }
      affiliate_email_logs: {
        Row: {
          affiliate_id: string | null
          created_at: string
          email_address: string
          email_id: string | null
          id: string
          notification_type: string
          sent_at: string
        }
        Insert: {
          affiliate_id?: string | null
          created_at?: string
          email_address: string
          email_id?: string | null
          id?: string
          notification_type: string
          sent_at?: string
        }
        Update: {
          affiliate_id?: string | null
          created_at?: string
          email_address?: string
          email_id?: string | null
          id?: string
          notification_type?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_email_logs_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_fraud_checks: {
        Row: {
          affiliate_id: string
          check_type: string
          created_at: string
          details: Json
          flagged: boolean
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          risk_score: number
        }
        Insert: {
          affiliate_id: string
          check_type: string
          created_at?: string
          details?: Json
          flagged?: boolean
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_score?: number
        }
        Update: {
          affiliate_id?: string
          check_type?: string
          created_at?: string
          details?: Json
          flagged?: boolean
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_score?: number
        }
        Relationships: []
      }
      affiliate_links: {
        Row: {
          affiliate_id: string
          code: string
          created_at: string
          destination_type: Database["public"]["Enums"]["affiliate_destination_type"]
          destination_url: string
          id: string
          status: Database["public"]["Enums"]["affiliate_status"]
        }
        Insert: {
          affiliate_id: string
          code: string
          created_at?: string
          destination_type: Database["public"]["Enums"]["affiliate_destination_type"]
          destination_url: string
          id?: string
          status?: Database["public"]["Enums"]["affiliate_status"]
        }
        Update: {
          affiliate_id?: string
          code?: string
          created_at?: string
          destination_type?: Database["public"]["Enums"]["affiliate_destination_type"]
          destination_url?: string
          id?: string
          status?: Database["public"]["Enums"]["affiliate_status"]
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_payouts: {
        Row: {
          adjustments: number
          affiliate_id: string
          created_at: string
          id: string
          payout_amount: number
          payout_fee: number
          payout_method: Database["public"]["Enums"]["affiliate_payout_method"]
          payout_reference: string | null
          payout_status: Database["public"]["Enums"]["affiliate_payout_status"]
          period_end: string
          period_start: string
          total_commission: number
          updated_at: string
        }
        Insert: {
          adjustments?: number
          affiliate_id: string
          created_at?: string
          id?: string
          payout_amount: number
          payout_fee?: number
          payout_method: Database["public"]["Enums"]["affiliate_payout_method"]
          payout_reference?: string | null
          payout_status?: Database["public"]["Enums"]["affiliate_payout_status"]
          period_end: string
          period_start: string
          total_commission: number
          updated_at?: string
        }
        Update: {
          adjustments?: number
          affiliate_id?: string
          created_at?: string
          id?: string
          payout_amount?: number
          payout_fee?: number
          payout_method?: Database["public"]["Enums"]["affiliate_payout_method"]
          payout_reference?: string | null
          payout_status?: Database["public"]["Enums"]["affiliate_payout_status"]
          period_end?: string
          period_start?: string
          total_commission?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_social_shares: {
        Row: {
          affiliate_id: string
          clicks_tracked: number
          content_type: string
          conversions_tracked: number
          created_at: string
          id: string
          platform: string
          share_url: string
          tracking_parameters: Json
        }
        Insert: {
          affiliate_id: string
          clicks_tracked?: number
          content_type: string
          conversions_tracked?: number
          created_at?: string
          id?: string
          platform: string
          share_url: string
          tracking_parameters?: Json
        }
        Update: {
          affiliate_id?: string
          clicks_tracked?: number
          content_type?: string
          conversions_tracked?: number
          created_at?: string
          id?: string
          platform?: string
          share_url?: string
          tracking_parameters?: Json
        }
        Relationships: []
      }
      affiliate_terms_acceptance: {
        Row: {
          acceptance_method: string
          accepted_at: string
          affiliate_id: string
          id: string
          ip_address: unknown | null
          terms_version: string
          user_agent: string | null
        }
        Insert: {
          acceptance_method?: string
          accepted_at?: string
          affiliate_id: string
          id?: string
          ip_address?: unknown | null
          terms_version: string
          user_agent?: string | null
        }
        Update: {
          acceptance_method?: string
          accepted_at?: string
          affiliate_id?: string
          id?: string
          ip_address?: unknown | null
          terms_version?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          agreement_signed_at: string | null
          agreement_version: string | null
          business_name: string | null
          country: string
          created_at: string
          email: string
          id: string
          legal_name: string
          marketing_channels: string | null
          notes: string | null
          onboarding_status: Database["public"]["Enums"]["affiliate_onboarding_status"]
          payout_method:
            | Database["public"]["Enums"]["affiliate_payout_method"]
            | null
          status: Database["public"]["Enums"]["affiliate_status"]
          tax_id: string | null
          tax_status: Database["public"]["Enums"]["affiliate_tax_status"] | null
          updated_at: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          agreement_signed_at?: string | null
          agreement_version?: string | null
          business_name?: string | null
          country: string
          created_at?: string
          email: string
          id?: string
          legal_name: string
          marketing_channels?: string | null
          notes?: string | null
          onboarding_status?: Database["public"]["Enums"]["affiliate_onboarding_status"]
          payout_method?:
            | Database["public"]["Enums"]["affiliate_payout_method"]
            | null
          status?: Database["public"]["Enums"]["affiliate_status"]
          tax_id?: string | null
          tax_status?:
            | Database["public"]["Enums"]["affiliate_tax_status"]
            | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          agreement_signed_at?: string | null
          agreement_version?: string | null
          business_name?: string | null
          country?: string
          created_at?: string
          email?: string
          id?: string
          legal_name?: string
          marketing_channels?: string | null
          notes?: string | null
          onboarding_status?: Database["public"]["Enums"]["affiliate_onboarding_status"]
          payout_method?:
            | Database["public"]["Enums"]["affiliate_payout_method"]
            | null
          status?: Database["public"]["Enums"]["affiliate_status"]
          tax_id?: string | null
          tax_status?:
            | Database["public"]["Enums"]["affiliate_tax_status"]
            | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
      }
      agent_archetypes: {
        Row: {
          archetype_name: string
          created_at: string
          description: string
          id: string
          pain_points: string[]
          preferred_focus: string[]
          production_range_max: number
          production_range_min: number
          recommended_tools: Json
          success_metrics: Json
          team_size_categories: string[]
          updated_at: string
        }
        Insert: {
          archetype_name: string
          created_at?: string
          description: string
          id?: string
          pain_points?: string[]
          preferred_focus?: string[]
          production_range_max?: number
          production_range_min?: number
          recommended_tools?: Json
          success_metrics?: Json
          team_size_categories?: string[]
          updated_at?: string
        }
        Update: {
          archetype_name?: string
          created_at?: string
          description?: string
          id?: string
          pain_points?: string[]
          preferred_focus?: string[]
          production_range_max?: number
          production_range_min?: number
          recommended_tools?: Json
          success_metrics?: Json
          team_size_categories?: string[]
          updated_at?: string
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
        Relationships: [
          {
            foreignKeyName: "agent_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "agent_performance_tracking_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
      }
      agent_playbook_templates: {
        Row: {
          ai_draft_prompt: string | null
          auto_prefill_fields: Json | null
          created_at: string
          difficulty_level: string | null
          estimated_completion_time: string | null
          id: string
          is_quick_template: boolean | null
          sections: Json
          template_description: string | null
          template_name: string
          updated_at: string
        }
        Insert: {
          ai_draft_prompt?: string | null
          auto_prefill_fields?: Json | null
          created_at?: string
          difficulty_level?: string | null
          estimated_completion_time?: string | null
          id?: string
          is_quick_template?: boolean | null
          sections?: Json
          template_description?: string | null
          template_name: string
          updated_at?: string
        }
        Update: {
          ai_draft_prompt?: string | null
          auto_prefill_fields?: Json | null
          created_at?: string
          difficulty_level?: string | null
          estimated_completion_time?: string | null
          id?: string
          is_quick_template?: boolean | null
          sections?: Json
          template_description?: string | null
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_profile_stats: {
        Row: {
          agent_id: string
          avg_sale_price: number | null
          buyers_12m: number | null
          capacity_hours_per_week: number | null
          channels: string[] | null
          cities: string[] | null
          closings_12m: number | null
          constraints: string[] | null
          created_at: string
          crm: string | null
          gci_12m: number | null
          goal_closings_12m: number | null
          goal_closings_90d: number | null
          id: string
          listings_12m: number | null
          monthly_marketing_budget: number | null
          niche: string[] | null
          pipeline_hot_buyers: number | null
          pipeline_listings: number | null
          pipeline_pendings: number | null
          price_band: Json | null
          priority_outcome: string | null
          source_map: Json | null
          updated_at: string
          vendors_current: string[] | null
          website_platform: string | null
          zips: string[] | null
        }
        Insert: {
          agent_id: string
          avg_sale_price?: number | null
          buyers_12m?: number | null
          capacity_hours_per_week?: number | null
          channels?: string[] | null
          cities?: string[] | null
          closings_12m?: number | null
          constraints?: string[] | null
          created_at?: string
          crm?: string | null
          gci_12m?: number | null
          goal_closings_12m?: number | null
          goal_closings_90d?: number | null
          id?: string
          listings_12m?: number | null
          monthly_marketing_budget?: number | null
          niche?: string[] | null
          pipeline_hot_buyers?: number | null
          pipeline_listings?: number | null
          pipeline_pendings?: number | null
          price_band?: Json | null
          priority_outcome?: string | null
          source_map?: Json | null
          updated_at?: string
          vendors_current?: string[] | null
          website_platform?: string | null
          zips?: string[] | null
        }
        Update: {
          agent_id?: string
          avg_sale_price?: number | null
          buyers_12m?: number | null
          capacity_hours_per_week?: number | null
          channels?: string[] | null
          cities?: string[] | null
          closings_12m?: number | null
          constraints?: string[] | null
          created_at?: string
          crm?: string | null
          gci_12m?: number | null
          goal_closings_12m?: number | null
          goal_closings_90d?: number | null
          id?: string
          listings_12m?: number | null
          monthly_marketing_budget?: number | null
          niche?: string[] | null
          pipeline_hot_buyers?: number | null
          pipeline_listings?: number | null
          pipeline_pendings?: number | null
          price_band?: Json | null
          priority_outcome?: string | null
          source_map?: Json | null
          updated_at?: string
          vendors_current?: string[] | null
          website_platform?: string | null
          zips?: string[] | null
        }
        Relationships: []
      }
      agent_questionnaires: {
        Row: {
          completed: boolean
          created_at: string
          data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_questionnaires_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
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
      agent_success_path_scores: {
        Row: {
          archetype_id: string | null
          created_at: string
          growth_score: number
          id: string
          last_updated: string
          next_recommendations: Json
          overall_score: number
          peer_comparison_percentile: number
          performance_score: number
          score_breakdown: Json
          tool_adoption_score: number
          user_id: string
        }
        Insert: {
          archetype_id?: string | null
          created_at?: string
          growth_score?: number
          id?: string
          last_updated?: string
          next_recommendations?: Json
          overall_score?: number
          peer_comparison_percentile?: number
          performance_score?: number
          score_breakdown?: Json
          tool_adoption_score?: number
          user_id: string
        }
        Update: {
          archetype_id?: string | null
          created_at?: string
          growth_score?: number
          id?: string
          last_updated?: string
          next_recommendations?: Json
          overall_score?: number
          peer_comparison_percentile?: number
          performance_score?: number
          score_breakdown?: Json
          tool_adoption_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_success_path_scores_archetype_id_fkey"
            columns: ["archetype_id"]
            isOneToOne: false
            referencedRelation: "agent_archetypes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_success_path_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
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
        Relationships: [
          {
            foreignKeyName: "agents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
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
      ai_batch_status: {
        Row: {
          batch_id: string
          completed_at: string | null
          completed_count: number
          created_at: string
          current_service: string | null
          error_count: number
          errors: Json | null
          id: string
          last_updated: string
          started_at: string | null
          status: string
          total_count: number
        }
        Insert: {
          batch_id: string
          completed_at?: string | null
          completed_count?: number
          created_at?: string
          current_service?: string | null
          error_count?: number
          errors?: Json | null
          id?: string
          last_updated?: string
          started_at?: string | null
          status?: string
          total_count?: number
        }
        Update: {
          batch_id?: string
          completed_at?: string | null
          completed_count?: number
          created_at?: string
          current_service?: string | null
          error_count?: number
          errors?: Json | null
          id?: string
          last_updated?: string
          started_at?: string | null
          status?: string
          total_count?: number
        }
        Relationships: []
      }
      ai_growth_plans: {
        Row: {
          confidence_score: number
          created_at: string
          id: string
          plan_data: Json
          recommended_service_ids: string[]
          session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number
          created_at?: string
          id?: string
          plan_data: Json
          recommended_service_ids?: string[]
          session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number
          created_at?: string
          id?: string
          plan_data?: Json
          recommended_service_ids?: string[]
          session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_growth_plans_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "concierge_sessions"
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
        Relationships: [
          {
            foreignKeyName: "ai_interaction_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
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
          auto_heal_enabled: boolean | null
          created_at: string
          facilitator_checkout_enabled: boolean | null
          force_cache_bust_after: string | null
          id: string
          maintenance_message: string | null
          maintenance_mode: boolean | null
          marketplace_enabled: boolean | null
          max_concurrent_sessions: number | null
          min_build_version: string | null
          security_monitoring_global: boolean | null
          session_enforcement_mode: string | null
          top_deals_enabled: boolean | null
          track_ip_changes: boolean | null
          updated_at: string
        }
        Insert: {
          auto_heal_enabled?: boolean | null
          created_at?: string
          facilitator_checkout_enabled?: boolean | null
          force_cache_bust_after?: string | null
          id?: string
          maintenance_message?: string | null
          maintenance_mode?: boolean | null
          marketplace_enabled?: boolean | null
          max_concurrent_sessions?: number | null
          min_build_version?: string | null
          security_monitoring_global?: boolean | null
          session_enforcement_mode?: string | null
          top_deals_enabled?: boolean | null
          track_ip_changes?: boolean | null
          updated_at?: string
        }
        Update: {
          auto_heal_enabled?: boolean | null
          created_at?: string
          facilitator_checkout_enabled?: boolean | null
          force_cache_bust_after?: string | null
          id?: string
          maintenance_message?: string | null
          maintenance_mode?: boolean | null
          marketplace_enabled?: boolean | null
          max_concurrent_sessions?: number | null
          min_build_version?: string | null
          security_monitoring_global?: boolean | null
          session_enforcement_mode?: string | null
          top_deals_enabled?: boolean | null
          track_ip_changes?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      app_events: {
        Row: {
          created_at: string | null
          id: number
          name: string
          payload: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          payload?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          payload?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      attack_logs: {
        Row: {
          attack_type: string
          blocked: boolean
          created_at: string
          details: Json
          endpoint: string | null
          id: string
          ip_address: unknown
          risk_score: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          attack_type: string
          blocked?: boolean
          created_at?: string
          details?: Json
          endpoint?: string | null
          id?: string
          ip_address: unknown
          risk_score?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          attack_type?: string
          blocked?: boolean
          created_at?: string
          details?: Json
          endpoint?: string | null
          id?: string
          ip_address?: unknown
          risk_score?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      attribution_events: {
        Row: {
          created_at: string
          event_type: Database["public"]["Enums"]["attribution_event_type"]
          external_order_id: string | null
          id: string
          listing_id: string
          offer_code: string | null
          payload: Json | null
          user_id: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string
          event_type: Database["public"]["Enums"]["attribution_event_type"]
          external_order_id?: string | null
          id?: string
          listing_id: string
          offer_code?: string | null
          payload?: Json | null
          user_id?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string
          event_type?: Database["public"]["Enums"]["attribution_event_type"]
          external_order_id?: string | null
          id?: string
          listing_id?: string
          offer_code?: string | null
          payload?: Json | null
          user_id?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attribution_events_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attribution_events_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attribution_events_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_directory_authenticated"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attribution_events_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "blocked_ips_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
      }
      booking_action_tokens: {
        Row: {
          action_type: string
          booking_id: string
          created_at: string
          expires_at: string
          id: string
          token_hash: string
          used_at: string | null
        }
        Insert: {
          action_type: string
          booking_id: string
          created_at?: string
          expires_at?: string
          id?: string
          token_hash: string
          used_at?: string | null
        }
        Update: {
          action_type?: string
          booking_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          token_hash?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_action_tokens_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "consultation_bookings"
            referencedColumns: ["id"]
          },
        ]
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
      click_events: {
        Row: {
          anon_id: string
          click_x: number | null
          click_y: number | null
          created_at: string
          element_selector: string | null
          element_text: string | null
          id: string
          metadata: Json | null
          page_url: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          anon_id: string
          click_x?: number | null
          click_y?: number | null
          created_at?: string
          element_selector?: string | null
          element_text?: string | null
          id?: string
          metadata?: Json | null
          page_url: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          anon_id?: string
          click_x?: number | null
          click_y?: number | null
          created_at?: string
          element_selector?: string | null
          element_text?: string | null
          id?: string
          metadata?: Json | null
          page_url?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
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
          {
            foreignKeyName: "co_pay_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
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
            foreignKeyName: "co_pay_requests_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "co_pay_requests_compliance_reviewed_by_fkey"
            columns: ["compliance_reviewed_by"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
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
            referencedRelation: "vendor_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_co_pay_requests_vendor"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_directory_authenticated"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_co_pay_requests_vendor"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
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
          {
            foreignKeyName: "compliance_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
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
        Relationships: [
          {
            foreignKeyName: "compliance_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
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
          {
            foreignKeyName: "compliance_workflow_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
      }
      concierge_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          thread_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: []
      }
      concierge_feedback: {
        Row: {
          answer_id: string
          created_at: string
          helpful: boolean
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          answer_id: string
          created_at?: string
          helpful: boolean
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          answer_id?: string
          created_at?: string
          helpful?: boolean
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      concierge_market_pulse: {
        Row: {
          cohort_key: string | null
          generated_at: string
          id: string
          insights: Json
        }
        Insert: {
          cohort_key?: string | null
          generated_at?: string
          id?: string
          insights?: Json
        }
        Update: {
          cohort_key?: string | null
          generated_at?: string
          id?: string
          insights?: Json
        }
        Relationships: []
      }
      concierge_memory: {
        Row: {
          data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      concierge_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
          step_name: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
          step_name?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
          step_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "concierge_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "concierge_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      concierge_runs: {
        Row: {
          agent_id: string
          ai_response: string | null
          created_at: string
          estimated_roi: Json | null
          generated_assets: Json | null
          id: string
          prompt: string
          recommended_vendors: Json | null
          status: string | null
          workflow_type: string | null
        }
        Insert: {
          agent_id: string
          ai_response?: string | null
          created_at?: string
          estimated_roi?: Json | null
          generated_assets?: Json | null
          id?: string
          prompt: string
          recommended_vendors?: Json | null
          status?: string | null
          workflow_type?: string | null
        }
        Update: {
          agent_id?: string
          ai_response?: string | null
          created_at?: string
          estimated_roi?: Json | null
          generated_assets?: Json | null
          id?: string
          prompt?: string
          recommended_vendors?: Json | null
          status?: string | null
          workflow_type?: string | null
        }
        Relationships: []
      }
      concierge_sessions: {
        Row: {
          completed: boolean
          created_at: string
          current_step: string
          id: string
          session_data: Json
          updated_at: string
          user_id: string | null
        }
        Insert: {
          completed?: boolean
          created_at?: string
          current_step?: string
          id?: string
          session_data?: Json
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          completed?: boolean
          created_at?: string
          current_step?: string
          id?: string
          session_data?: Json
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      consultation_booking_notes: {
        Row: {
          booking_id: string
          created_at: string
          created_by: string | null
          id: string
          note_text: string
          note_type: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          note_text: string
          note_type: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note_text?: string
          note_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_booking_notes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "consultation_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_bookings: {
        Row: {
          assigned_to: string | null
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
          internal_notes: string | null
          is_external: boolean | null
          project_details: string | null
          scheduled_at: string | null
          scheduled_date: string
          scheduled_time: string
          service_id: string
          source: string | null
          status: string
          status_updated_at: string | null
          updated_at: string
          user_id: string | null
          vendor_notified_at: string | null
          vendor_response: string | null
        }
        Insert: {
          assigned_to?: string | null
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
          internal_notes?: string | null
          is_external?: boolean | null
          project_details?: string | null
          scheduled_at?: string | null
          scheduled_date: string
          scheduled_time: string
          service_id: string
          source?: string | null
          status?: string
          status_updated_at?: string | null
          updated_at?: string
          user_id?: string | null
          vendor_notified_at?: string | null
          vendor_response?: string | null
        }
        Update: {
          assigned_to?: string | null
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
          internal_notes?: string | null
          is_external?: boolean | null
          project_details?: string | null
          scheduled_at?: string | null
          scheduled_date?: string
          scheduled_time?: string
          service_id?: string
          source?: string | null
          status?: string
          status_updated_at?: string | null
          updated_at?: string
          user_id?: string | null
          vendor_notified_at?: string | null
          vendor_response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultation_bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
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
      consults: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          order_id: string
          pm_id: string | null
          scheduled_at: string | null
          setup_intent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id: string
          pm_id?: string | null
          scheduled_at?: string | null
          setup_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string
          pm_id?: string | null
          scheduled_at?: string | null
          setup_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consults_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
      conversion_events: {
        Row: {
          anon_id: string
          conversion_value: number | null
          created_at: string
          event_name: string
          event_type: string
          id: string
          metadata: Json | null
          page_url: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          anon_id: string
          conversion_value?: number | null
          created_at?: string
          event_name: string
          event_type: string
          id?: string
          metadata?: Json | null
          page_url: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          anon_id?: string
          conversion_value?: number | null
          created_at?: string
          event_name?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          page_url?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversion_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "funnel_sessions"
            referencedColumns: ["id"]
          },
        ]
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
      copay_orders: {
        Row: {
          agent_acknowledged_primary_payer: boolean | null
          agent_amount: number
          agent_id: string
          agent_payment_status: string | null
          agent_stripe_payment_intent_id: string | null
          created_at: string
          facilitator_fee_amount: number | null
          id: string
          order_metadata: Json | null
          order_number: string
          partner_contact_info: Json | null
          partner_contribution_amount: number | null
          partner_email: string | null
          partner_payment_status: string | null
          partner_stripe_payment_intent_id: string | null
          partner_type: string | null
          service_id: string
          total_service_amount: number
          updated_at: string
          vendor_id: string
          vendor_payout_status: string | null
        }
        Insert: {
          agent_acknowledged_primary_payer?: boolean | null
          agent_amount: number
          agent_id: string
          agent_payment_status?: string | null
          agent_stripe_payment_intent_id?: string | null
          created_at?: string
          facilitator_fee_amount?: number | null
          id?: string
          order_metadata?: Json | null
          order_number: string
          partner_contact_info?: Json | null
          partner_contribution_amount?: number | null
          partner_email?: string | null
          partner_payment_status?: string | null
          partner_stripe_payment_intent_id?: string | null
          partner_type?: string | null
          service_id: string
          total_service_amount: number
          updated_at?: string
          vendor_id: string
          vendor_payout_status?: string | null
        }
        Update: {
          agent_acknowledged_primary_payer?: boolean | null
          agent_amount?: number
          agent_id?: string
          agent_payment_status?: string | null
          agent_stripe_payment_intent_id?: string | null
          created_at?: string
          facilitator_fee_amount?: number | null
          id?: string
          order_metadata?: Json | null
          order_number?: string
          partner_contact_info?: Json | null
          partner_contribution_amount?: number | null
          partner_email?: string | null
          partner_payment_status?: string | null
          partner_stripe_payment_intent_id?: string | null
          partner_type?: string | null
          service_id?: string
          total_service_amount?: number
          updated_at?: string
          vendor_id?: string
          vendor_payout_status?: string | null
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
          {
            foreignKeyName: "course_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
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
      creator_earnings: {
        Row: {
          created_at: string | null
          creator_earnings: number
          creator_id: string
          gross_amount: number
          id: string
          platform_fee: number
          playbook_id: string | null
          purchase_id: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          created_at?: string | null
          creator_earnings: number
          creator_id: string
          gross_amount: number
          id?: string
          platform_fee: number
          playbook_id?: string | null
          purchase_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          created_at?: string | null
          creator_earnings?: number
          creator_id?: string
          gross_amount?: number
          id?: string
          platform_fee?: number
          playbook_id?: string | null
          purchase_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_earnings_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_earnings_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "playbook_purchases"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "creator_onboarding_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "creator_verification_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "creator_verification_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "deals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
      }
      disc_results: {
        Row: {
          created_at: string
          disc_type: string | null
          method: string | null
          scores: Json | null
          status: string | null
          token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          disc_type?: string | null
          method?: string | null
          scores?: Json | null
          status?: string | null
          token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          disc_type?: string | null
          method?: string | null
          scores?: Json | null
          status?: string | null
          token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disc_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
      }
      exit_events: {
        Row: {
          anon_id: string
          created_at: string
          destination_url: string | null
          exit_page_title: string | null
          exit_page_url: string
          exit_type: string | null
          id: string
          scroll_depth_percentage: number | null
          session_id: string | null
          time_on_page_seconds: number | null
          user_id: string | null
        }
        Insert: {
          anon_id: string
          created_at?: string
          destination_url?: string | null
          exit_page_title?: string | null
          exit_page_url: string
          exit_type?: string | null
          id?: string
          scroll_depth_percentage?: number | null
          session_id?: string | null
          time_on_page_seconds?: number | null
          user_id?: string | null
        }
        Update: {
          anon_id?: string
          created_at?: string
          destination_url?: string | null
          exit_page_title?: string | null
          exit_page_url?: string
          exit_type?: string | null
          id?: string
          scroll_depth_percentage?: number | null
          session_id?: string | null
          time_on_page_seconds?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exit_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "funnel_sessions"
            referencedColumns: ["id"]
          },
        ]
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
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          flag_name: string
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          flag_name: string
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          flag_name?: string
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
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
          browser_name: string | null
          browser_version: string | null
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
          device: string | null
          device_type: string | null
          ended_at: string | null
          id: string
          ip_address: unknown | null
          is_returning_visitor: boolean | null
          landing_page: string | null
          last_activity_at: string | null
          os_name: string | null
          referrer: string | null
          referrer_url: string | null
          region: string | null
          screen_resolution: string | null
          session_metadata: Json | null
          started_at: string
          updated_at: string
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          viewport_size: string | null
        }
        Insert: {
          anon_id: string
          browser_name?: string | null
          browser_version?: string | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          device?: string | null
          device_type?: string | null
          ended_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_returning_visitor?: boolean | null
          landing_page?: string | null
          last_activity_at?: string | null
          os_name?: string | null
          referrer?: string | null
          referrer_url?: string | null
          region?: string | null
          screen_resolution?: string | null
          session_metadata?: Json | null
          started_at?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          viewport_size?: string | null
        }
        Update: {
          anon_id?: string
          browser_name?: string | null
          browser_version?: string | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          device?: string | null
          device_type?: string | null
          ended_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_returning_visitor?: boolean | null
          landing_page?: string | null
          last_activity_at?: string | null
          os_name?: string | null
          referrer?: string | null
          referrer_url?: string | null
          region?: string | null
          screen_resolution?: string | null
          session_metadata?: Json | null
          started_at?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          viewport_size?: string | null
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
          accepted_at: string | null
          agent_id: string
          bundle_id: string | null
          confidence_score: number | null
          created_at: string
          dismiss_reason: string | null
          dismissed_at: string | null
          estimated_roi_percentage: number | null
          id: string
          is_accepted: boolean | null
          is_dismissed: boolean | null
          is_viewed: boolean | null
          playbook_key: string | null
          priority_rank: number | null
          reasons: Json | null
          rec_skus: Json | null
          recommendation_text: string
          recommendation_type: string
          roi: Json | null
          service_id: string | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          agent_id: string
          bundle_id?: string | null
          confidence_score?: number | null
          created_at?: string
          dismiss_reason?: string | null
          dismissed_at?: string | null
          estimated_roi_percentage?: number | null
          id?: string
          is_accepted?: boolean | null
          is_dismissed?: boolean | null
          is_viewed?: boolean | null
          playbook_key?: string | null
          priority_rank?: number | null
          reasons?: Json | null
          rec_skus?: Json | null
          recommendation_text: string
          recommendation_type: string
          roi?: Json | null
          service_id?: string | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          agent_id?: string
          bundle_id?: string | null
          confidence_score?: number | null
          created_at?: string
          dismiss_reason?: string | null
          dismissed_at?: string | null
          estimated_roi_percentage?: number | null
          id?: string
          is_accepted?: boolean | null
          is_dismissed?: boolean | null
          is_viewed?: boolean | null
          playbook_key?: string | null
          priority_rank?: number | null
          reasons?: Json | null
          rec_skus?: Json | null
          recommendation_text?: string
          recommendation_type?: string
          roi?: Json | null
          service_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_based_recommendations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
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
        Relationships: [
          {
            foreignKeyName: "help_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "help_issues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "help_proactive_triggers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
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
      industry_benchmarks: {
        Row: {
          benchmark_type: string
          category: string
          created_at: string
          data_date: string
          id: string
          is_active: boolean
          percentile_25: number | null
          percentile_50: number | null
          percentile_75: number | null
          percentile_90: number | null
          sample_size: number | null
          source: string
          subcategory: string | null
          updated_at: string
          value_numeric: number | null
          value_text: string | null
        }
        Insert: {
          benchmark_type: string
          category: string
          created_at?: string
          data_date?: string
          id?: string
          is_active?: boolean
          percentile_25?: number | null
          percentile_50?: number | null
          percentile_75?: number | null
          percentile_90?: number | null
          sample_size?: number | null
          source: string
          subcategory?: string | null
          updated_at?: string
          value_numeric?: number | null
          value_text?: string | null
        }
        Update: {
          benchmark_type?: string
          category?: string
          created_at?: string
          data_date?: string
          id?: string
          is_active?: boolean
          percentile_25?: number | null
          percentile_50?: number | null
          percentile_75?: number | null
          percentile_90?: number | null
          sample_size?: number | null
          source?: string
          subcategory?: string | null
          updated_at?: string
          value_numeric?: number | null
          value_text?: string | null
        }
        Relationships: []
      }
      kb_chunks: {
        Row: {
          content: string
          created_at: string
          document_id: string
          embedding: string
          id: string
          metadata: Json
        }
        Insert: {
          content: string
          created_at?: string
          document_id: string
          embedding: string
          id?: string
          metadata?: Json
        }
        Update: {
          content?: string
          created_at?: string
          document_id?: string
          embedding?: string
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "kb_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "kb_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_documents: {
        Row: {
          created_at: string
          id: string
          source: string
          tags: string[]
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          source: string
          tags?: string[]
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          source?: string
          tags?: string[]
          title?: string
          updated_at?: string
          url?: string | null
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
          last_attempt_at: string | null
          locked_until: string | null
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          attempt_type?: string
          created_at?: string
          id?: string
          identifier: string
          last_attempt_at?: string | null
          locked_until?: string | null
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          attempt_type?: string
          created_at?: string
          id?: string
          identifier?: string
          last_attempt_at?: string | null
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
      mobile_tracking_events: {
        Row: {
          affiliate_id: string | null
          app_version: string | null
          created_at: string
          device_info: Json
          event_type: string
          id: string
          platform: string
          session_id: string
        }
        Insert: {
          affiliate_id?: string | null
          app_version?: string | null
          created_at?: string
          device_info?: Json
          event_type: string
          id?: string
          platform: string
          session_id: string
        }
        Update: {
          affiliate_id?: string | null
          app_version?: string | null
          created_at?: string
          device_info?: Json
          event_type?: string
          id?: string
          platform?: string
          session_id?: string
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
            referencedRelation: "vendor_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_directory_authenticated"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
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
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
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
      page_views: {
        Row: {
          anon_id: string
          created_at: string
          entered_at: string
          exited_at: string | null
          id: string
          metadata: Json | null
          page_title: string | null
          page_url: string
          referrer_url: string | null
          session_id: string
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          anon_id: string
          created_at?: string
          entered_at?: string
          exited_at?: string | null
          id?: string
          metadata?: Json | null
          page_title?: string | null
          page_url: string
          referrer_url?: string | null
          session_id: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          anon_id?: string
          created_at?: string
          entered_at?: string
          exited_at?: string | null
          id?: string
          metadata?: Json | null
          page_title?: string | null
          page_url?: string
          referrer_url?: string | null
          session_id?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      partner_contributions: {
        Row: {
          contribution_amount: number
          copay_order_id: string
          created_at: string
          expires_at: string | null
          id: string
          invitation_accepted_at: string | null
          invitation_sent_at: string | null
          invitation_token: string | null
          metadata: Json | null
          partner_email: string
          partner_type: string
          payment_completed_at: string | null
          payment_status: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          contribution_amount: number
          copay_order_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          invitation_accepted_at?: string | null
          invitation_sent_at?: string | null
          invitation_token?: string | null
          metadata?: Json | null
          partner_email: string
          partner_type: string
          payment_completed_at?: string | null
          payment_status?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          contribution_amount?: number
          copay_order_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          invitation_accepted_at?: string | null
          invitation_sent_at?: string | null
          invitation_token?: string | null
          metadata?: Json | null
          partner_email?: string
          partner_type?: string
          payment_completed_at?: string | null
          payment_status?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_contributions_copay_order_id_fkey"
            columns: ["copay_order_id"]
            isOneToOne: false
            referencedRelation: "copay_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_access: {
        Row: {
          access_granted_at: string | null
          id: string
          playbook_id: string | null
          purchase_id: string | null
          user_id: string
        }
        Insert: {
          access_granted_at?: string | null
          id?: string
          playbook_id?: string | null
          purchase_id?: string | null
          user_id: string
        }
        Update: {
          access_granted_at?: string | null
          id?: string
          playbook_id?: string | null
          purchase_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbook_access_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_access_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "playbook_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_ai_assistance: {
        Row: {
          ai_suggestion: string
          assistance_type: string
          content_id: string | null
          created_at: string | null
          creator_id: string
          id: string
          original_content: string | null
          section_index: number
          user_accepted: boolean | null
        }
        Insert: {
          ai_suggestion: string
          assistance_type: string
          content_id?: string | null
          created_at?: string | null
          creator_id: string
          id?: string
          original_content?: string | null
          section_index: number
          user_accepted?: boolean | null
        }
        Update: {
          ai_suggestion?: string
          assistance_type?: string
          content_id?: string | null
          created_at?: string | null
          creator_id?: string
          id?: string
          original_content?: string | null
          section_index?: number
          user_accepted?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "playbook_ai_assistance_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_creation_progress: {
        Row: {
          auto_save_enabled: boolean | null
          completed_sections: Json | null
          content_id: string | null
          created_at: string
          creator_id: string
          current_section: number | null
          draft_data: Json | null
          id: string
          last_auto_save: string | null
          status: string | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          auto_save_enabled?: boolean | null
          completed_sections?: Json | null
          content_id?: string | null
          created_at?: string
          creator_id: string
          current_section?: number | null
          draft_data?: Json | null
          id?: string
          last_auto_save?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          auto_save_enabled?: boolean | null
          completed_sections?: Json | null
          content_id?: string | null
          created_at?: string
          creator_id?: string
          current_section?: number | null
          draft_data?: Json | null
          id?: string
          last_auto_save?: string | null
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
            foreignKeyName: "playbook_creation_progress_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
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
      playbook_purchases: {
        Row: {
          amount: number
          buyer_id: string
          completed_at: string | null
          created_at: string | null
          creator_id: string
          id: string
          playbook_id: string | null
          revenue_share_percentage: number
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
        }
        Insert: {
          amount: number
          buyer_id: string
          completed_at?: string | null
          created_at?: string | null
          creator_id: string
          id?: string
          playbook_id?: string | null
          revenue_share_percentage?: number
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string
          completed_at?: string | null
          created_at?: string | null
          creator_id?: string
          id?: string
          playbook_id?: string | null
          revenue_share_percentage?: number
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playbook_purchases_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "content"
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
      pow_challenges: {
        Row: {
          challenge_id: string
          created_at: string
          difficulty: number
          expires_at: string
          id: string
          ip_address: unknown
          solution_nonce: string | null
          solved: boolean
          target_hash: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          difficulty: number
          expires_at?: string
          id?: string
          ip_address: unknown
          solution_nonce?: string | null
          solved?: boolean
          target_hash: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          difficulty?: number
          expires_at?: string
          id?: string
          ip_address?: unknown
          solution_nonce?: string | null
          solved?: boolean
          target_hash?: string
        }
        Relationships: []
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
          agent_archetype_id: string | null
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
          is_respa_regulated: boolean | null
          is_settlement_service_provider: boolean | null
          last_assessment_date: string | null
          latitude: number | null
          lead_source_preferences: string[] | null
          location: string | null
          longitude: number | null
          marketing_time_per_week: number | null
          onboarding_completed: boolean | null
          peer_rank_percentile: number | null
          performance_data_complete: boolean | null
          personality_data: Json | null
          phone: string | null
          preferred_focus: string[] | null
          primary_challenge: string | null
          respa_max_copay_percentage: number | null
          respa_notes: string | null
          respa_risk_level: string | null
          respa_service_categories: string[] | null
          revenue_share_percentage: number | null
          specialties: string[] | null
          state: string | null
          success_path_score: number | null
          team_size: string | null
          tier: string
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
          agent_archetype_id?: string | null
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
          is_respa_regulated?: boolean | null
          is_settlement_service_provider?: boolean | null
          last_assessment_date?: string | null
          latitude?: number | null
          lead_source_preferences?: string[] | null
          location?: string | null
          longitude?: number | null
          marketing_time_per_week?: number | null
          onboarding_completed?: boolean | null
          peer_rank_percentile?: number | null
          performance_data_complete?: boolean | null
          personality_data?: Json | null
          phone?: string | null
          preferred_focus?: string[] | null
          primary_challenge?: string | null
          respa_max_copay_percentage?: number | null
          respa_notes?: string | null
          respa_risk_level?: string | null
          respa_service_categories?: string[] | null
          revenue_share_percentage?: number | null
          specialties?: string[] | null
          state?: string | null
          success_path_score?: number | null
          team_size?: string | null
          tier?: string
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
          agent_archetype_id?: string | null
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
          is_respa_regulated?: boolean | null
          is_settlement_service_provider?: boolean | null
          last_assessment_date?: string | null
          latitude?: number | null
          lead_source_preferences?: string[] | null
          location?: string | null
          longitude?: number | null
          marketing_time_per_week?: number | null
          onboarding_completed?: boolean | null
          peer_rank_percentile?: number | null
          performance_data_complete?: boolean | null
          personality_data?: Json | null
          phone?: string | null
          preferred_focus?: string[] | null
          primary_challenge?: string | null
          respa_max_copay_percentage?: number | null
          respa_notes?: string | null
          respa_risk_level?: string | null
          respa_service_categories?: string[] | null
          revenue_share_percentage?: number | null
          specialties?: string[] | null
          state?: string | null
          success_path_score?: number | null
          team_size?: string | null
          tier?: string
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
        Relationships: [
          {
            foreignKeyName: "profiles_agent_archetype_id_fkey"
            columns: ["agent_archetype_id"]
            isOneToOne: false
            referencedRelation: "agent_archetypes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
      }
      purchase_events: {
        Row: {
          created_at: string
          id: string
          price: number
          sku: string
          source: string
          user_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          price?: number
          sku: string
          source: string
          user_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          price?: number
          sku?: string
          source?: string
          user_id?: string
          vendor_id?: string
        }
        Relationships: []
      }
      qbo_connections: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string
          id: string
          org_id: string
          realm_id: string
          refresh_token: string
          scope: string | null
          updated_at: string | null
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at: string
          id?: string
          org_id: string
          realm_id: string
          refresh_token: string
          scope?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          org_id?: string
          realm_id?: string
          refresh_token?: string
          scope?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quotes: {
        Row: {
          amount_cents: number
          attachment_urls: Json | null
          created_at: string
          id: string
          line_items: Json | null
          order_id: string
          status: Database["public"]["Enums"]["quote_status"]
          updated_at: string
        }
        Insert: {
          amount_cents: number
          attachment_urls?: Json | null
          created_at?: string
          id?: string
          line_items?: Json | null
          order_id: string
          status?: Database["public"]["Enums"]["quote_status"]
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          attachment_urls?: Json | null
          created_at?: string
          id?: string
          line_items?: Json | null
          order_id?: string
          status?: Database["public"]["Enums"]["quote_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_tracking: {
        Row: {
          endpoint: string
          id: string
          identifier: string
          last_request: string
          request_count: number
          window_start: string
        }
        Insert: {
          endpoint: string
          id?: string
          identifier: string
          last_request?: string
          request_count?: number
          window_start?: string
        }
        Update: {
          endpoint?: string
          id?: string
          identifier?: string
          last_request?: string
          request_count?: number
          window_start?: string
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
        Relationships: [
          {
            foreignKeyName: "request_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "retention_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
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
          {
            foreignKeyName: "saved_services_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
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
        Relationships: [
          {
            foreignKeyName: "scraping_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
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
      scroll_depth_events: {
        Row: {
          anon_id: string
          created_at: string
          id: string
          page_height: number | null
          page_title: string | null
          page_url: string
          scroll_depth_percentage: number
          session_id: string | null
          time_to_depth_seconds: number | null
          user_id: string | null
          viewport_height: number | null
        }
        Insert: {
          anon_id: string
          created_at?: string
          id?: string
          page_height?: number | null
          page_title?: string | null
          page_url: string
          scroll_depth_percentage: number
          session_id?: string | null
          time_to_depth_seconds?: number | null
          user_id?: string | null
          viewport_height?: number | null
        }
        Update: {
          anon_id?: string
          created_at?: string
          id?: string
          page_height?: number | null
          page_title?: string | null
          page_url?: string
          scroll_depth_percentage?: number
          session_id?: string | null
          time_to_depth_seconds?: number | null
          user_id?: string | null
          viewport_height?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scroll_depth_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "funnel_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      security_config: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_config_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "security_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "security_monitoring_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
      }
      security_risk_scores: {
        Row: {
          expires_at: string
          id: string
          ip_address: unknown
          last_updated: string
          risk_factors: Json
          risk_score: number
          user_id: string | null
        }
        Insert: {
          expires_at?: string
          id?: string
          ip_address: unknown
          last_updated?: string
          risk_factors?: Json
          risk_score?: number
          user_id?: string | null
        }
        Update: {
          expires_at?: string
          id?: string
          ip_address?: unknown
          last_updated?: string
          risk_factors?: Json
          risk_score?: number
          user_id?: string | null
        }
        Relationships: []
      }
      service_ai_knowledge: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          knowledge_type: string
          priority: number | null
          service_id: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          knowledge_type?: string
          priority?: number | null
          service_id: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          knowledge_type?: string
          priority?: number | null
          service_id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
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
      service_discount_interest: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          ip_address: unknown | null
          service_id: string
          source: string
          user_agent: string | null
          vendor_id: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          service_id: string
          source?: string
          user_agent?: string | null
          vendor_id?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          service_id?: string
          source?: string
          user_agent?: string | null
          vendor_id?: string | null
        }
        Relationships: []
      }
      service_drafts: {
        Row: {
          change_summary: string | null
          change_type: string
          created_at: string
          draft_data: Json
          funnel_data: Json
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          service_id: string
          status: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          change_summary?: string | null
          change_type?: string
          created_at?: string
          draft_data?: Json
          funnel_data?: Json
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_id: string
          status?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          change_summary?: string | null
          change_type?: string
          created_at?: string
          draft_data?: Json
          funnel_data?: Json
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_id?: string
          status?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_drafts_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          display_order: number
          id: string
          question: string
          service_id: string
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          display_order?: number
          id?: string
          question: string
          service_id: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          display_order?: number
          id?: string
          question?: string
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
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
      service_interest_counters: {
        Row: {
          service_id: string
          total_likes: number
          updated_at: string
        }
        Insert: {
          service_id: string
          total_likes?: number
          updated_at?: string
        }
        Update: {
          service_id?: string
          total_likes?: number
          updated_at?: string
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
            foreignKeyName: "service_outcome_tracking_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
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
            referencedRelation: "vendor_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_representatives_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_directory_authenticated"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_representatives_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
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
        Relationships: [
          {
            foreignKeyName: "service_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
      }
      service_tracking_events: {
        Row: {
          context: Json
          created_at: string
          event_data: Json | null
          event_name: string | null
          event_type: string
          id: string
          page: string | null
          revenue_attributed: number | null
          service_id: string | null
          user_id: string | null
          vendor_id: string | null
        }
        Insert: {
          context?: Json
          created_at?: string
          event_data?: Json | null
          event_name?: string | null
          event_type: string
          id?: string
          page?: string | null
          revenue_attributed?: number | null
          service_id?: string | null
          user_id?: string | null
          vendor_id?: string | null
        }
        Update: {
          context?: Json
          created_at?: string
          event_data?: Json | null
          event_name?: string | null
          event_type?: string
          id?: string
          page?: string | null
          revenue_attributed?: number | null
          service_id?: string | null
          user_id?: string | null
          vendor_id?: string | null
        }
        Relationships: []
      }
      service_update_tracking: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          section_name: string
          service_id: string
          update_type: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          section_name: string
          service_id: string
          update_type?: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          section_name?: string
          service_id?: string
          update_type?: string
          updated_at?: string
          updated_by?: string
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
          allowed_split_percentage: number | null
          average_rating: number | null
          booking_time_rules: Json | null
          booking_type: string | null
          calendar_link: string | null
          category: string | null
          co_pay_price: string | null
          compliance_checklist: Json | null
          consultation_email: string | null
          consultation_emails: string[]
          consultation_phone: string | null
          copay_allowed: boolean | null
          created_at: string | null
          description: string | null
          description_es: string | null
          description_fr: string | null
          direct_purchase_enabled: boolean | null
          disclaimer_content: Json | null
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
          is_affiliate: boolean | null
          is_booking_link: boolean | null
          is_featured: boolean | null
          is_published: boolean | null
          is_respa_regulated: boolean | null
          is_sponsored: boolean | null
          is_top_pick: boolean | null
          is_verified: boolean | null
          max_split_percentage_non_ssp: number | null
          price_duration: string | null
          pricing_cta_label: string | null
          pricing_cta_type: string
          pricing_external_url: string | null
          pricing_mode: string
          pricing_note: string | null
          pricing_page_url: string | null
          pricing_screenshot_captured_at: string | null
          pricing_screenshot_url: string | null
          pricing_tiers: Json | null
          pro_price: string | null
          profile_image_url: string | null
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
          title_es: string | null
          title_fr: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          allowed_split_percentage?: number | null
          average_rating?: number | null
          booking_time_rules?: Json | null
          booking_type?: string | null
          calendar_link?: string | null
          category?: string | null
          co_pay_price?: string | null
          compliance_checklist?: Json | null
          consultation_email?: string | null
          consultation_emails?: string[]
          consultation_phone?: string | null
          copay_allowed?: boolean | null
          created_at?: string | null
          description?: string | null
          description_es?: string | null
          description_fr?: string | null
          direct_purchase_enabled?: boolean | null
          disclaimer_content?: Json | null
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
          is_affiliate?: boolean | null
          is_booking_link?: boolean | null
          is_featured?: boolean | null
          is_published?: boolean | null
          is_respa_regulated?: boolean | null
          is_sponsored?: boolean | null
          is_top_pick?: boolean | null
          is_verified?: boolean | null
          max_split_percentage_non_ssp?: number | null
          price_duration?: string | null
          pricing_cta_label?: string | null
          pricing_cta_type?: string
          pricing_external_url?: string | null
          pricing_mode?: string
          pricing_note?: string | null
          pricing_page_url?: string | null
          pricing_screenshot_captured_at?: string | null
          pricing_screenshot_url?: string | null
          pricing_tiers?: Json | null
          pro_price?: string | null
          profile_image_url?: string | null
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
          title_es?: string | null
          title_fr?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          allowed_split_percentage?: number | null
          average_rating?: number | null
          booking_time_rules?: Json | null
          booking_type?: string | null
          calendar_link?: string | null
          category?: string | null
          co_pay_price?: string | null
          compliance_checklist?: Json | null
          consultation_email?: string | null
          consultation_emails?: string[]
          consultation_phone?: string | null
          copay_allowed?: boolean | null
          created_at?: string | null
          description?: string | null
          description_es?: string | null
          description_fr?: string | null
          direct_purchase_enabled?: boolean | null
          disclaimer_content?: Json | null
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
          is_affiliate?: boolean | null
          is_booking_link?: boolean | null
          is_featured?: boolean | null
          is_published?: boolean | null
          is_respa_regulated?: boolean | null
          is_sponsored?: boolean | null
          is_top_pick?: boolean | null
          is_verified?: boolean | null
          max_split_percentage_non_ssp?: number | null
          price_duration?: string | null
          pricing_cta_label?: string | null
          pricing_cta_type?: string
          pricing_external_url?: string | null
          pricing_mode?: string
          pricing_note?: string | null
          pricing_page_url?: string | null
          pricing_screenshot_captured_at?: string | null
          pricing_screenshot_url?: string | null
          pricing_tiers?: Json | null
          pro_price?: string | null
          profile_image_url?: string | null
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
          title_es?: string | null
          title_fr?: string | null
          updated_at?: string | null
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
        ]
      }
      settings_affiliate: {
        Row: {
          auto_approve_affiliates: boolean
          blocked_products: string[] | null
          cookie_window_days: number
          created_at: string
          default_commission_rate: number
          id: string
          minimum_payout_threshold: number
          payout_schedule_day: number
          program_enabled: boolean
          refund_clawback_window_days: number
          subscription_recurring_commission_months: number
          updated_at: string
        }
        Insert: {
          auto_approve_affiliates?: boolean
          blocked_products?: string[] | null
          cookie_window_days?: number
          created_at?: string
          default_commission_rate?: number
          id?: string
          minimum_payout_threshold?: number
          payout_schedule_day?: number
          program_enabled?: boolean
          refund_clawback_window_days?: number
          subscription_recurring_commission_months?: number
          updated_at?: string
        }
        Update: {
          auto_approve_affiliates?: boolean
          blocked_products?: string[] | null
          cookie_window_days?: number
          created_at?: string
          default_commission_rate?: number
          id?: string
          minimum_payout_threshold?: number
          payout_schedule_day?: number
          program_enabled?: boolean
          refund_clawback_window_days?: number
          subscription_recurring_commission_months?: number
          updated_at?: string
        }
        Relationships: []
      }
      sponsored_positions: {
        Row: {
          amount_paid: number
          created_at: string
          expires_at: string
          id: string
          service_id: string | null
          starts_at: string
          status: Database["public"]["Enums"]["sponsored_status"]
          stripe_payment_intent_id: string | null
          tier: Database["public"]["Enums"]["sponsored_tier"]
          updated_at: string
          vendor_id: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          expires_at: string
          id?: string
          service_id?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["sponsored_status"]
          stripe_payment_intent_id?: string | null
          tier: Database["public"]["Enums"]["sponsored_tier"]
          updated_at?: string
          vendor_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          expires_at?: string
          id?: string
          service_id?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["sponsored_status"]
          stripe_payment_intent_id?: string | null
          tier?: Database["public"]["Enums"]["sponsored_tier"]
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      sponsored_pricing: {
        Row: {
          created_at: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          max_positions: number
          name: string
          price_monthly: number
          price_quarterly: number
          price_yearly: number
          tier: Database["public"]["Enums"]["sponsored_tier"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          max_positions?: number
          name: string
          price_monthly: number
          price_quarterly: number
          price_yearly: number
          tier: Database["public"]["Enums"]["sponsored_tier"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          max_positions?: number
          name?: string
          price_monthly?: number
          price_quarterly?: number
          price_yearly?: number
          tier?: Database["public"]["Enums"]["sponsored_tier"]
          updated_at?: string
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "subscribers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          price_id: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          price_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          price_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
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
        Relationships: [
          {
            foreignKeyName: "support_agents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "support_conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "support_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
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
          {
            foreignKeyName: "support_escalations_escalated_by_fkey"
            columns: ["escalated_by"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
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
        Relationships: [
          {
            foreignKeyName: "support_knowledge_base_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
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
          {
            foreignKeyName: "support_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
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
      traffic_sources: {
        Row: {
          anon_id: string
          campaign_name: string | null
          content: string | null
          created_at: string
          id: string
          landing_page: string
          medium: string | null
          referrer_domain: string | null
          referrer_path: string | null
          session_id: string | null
          source_name: string | null
          source_type: string
          term: string | null
        }
        Insert: {
          anon_id: string
          campaign_name?: string | null
          content?: string | null
          created_at?: string
          id?: string
          landing_page: string
          medium?: string | null
          referrer_domain?: string | null
          referrer_path?: string | null
          session_id?: string | null
          source_name?: string | null
          source_type: string
          term?: string | null
        }
        Update: {
          anon_id?: string
          campaign_name?: string | null
          content?: string | null
          created_at?: string
          id?: string
          landing_page?: string
          medium?: string | null
          referrer_domain?: string | null
          referrer_path?: string | null
          session_id?: string | null
          source_name?: string | null
          source_type?: string
          term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "traffic_sources_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "funnel_sessions"
            referencedColumns: ["id"]
          },
        ]
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
      transfers: {
        Row: {
          amount_cents: number
          created_at: string
          destination_connect_id: string
          id: string
          order_id: string
          stripe_transfer_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          destination_connect_id: string
          id?: string
          order_id: string
          stripe_transfer_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          destination_connect_id?: string
          id?: string
          order_id?: string
          stripe_transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
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
        Relationships: [
          {
            foreignKeyName: "user_ai_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
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
      user_sessions: {
        Row: {
          created_at: string
          device_fingerprint: string | null
          expires_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean
          last_activity: string
          location_data: Json | null
          session_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string
          location_data?: Json | null
          session_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string
          location_data?: Json | null
          session_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
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
            foreignKeyName: "vendor_agent_activities_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vendor_agent_activities_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_agent_activities_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_directory_authenticated"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_agent_activities_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
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
            referencedRelation: "vendor_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_agent_criteria_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "vendor_directory_authenticated"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_agent_criteria_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "vendors"
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
            referencedRelation: "vendor_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_commissions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_directory_authenticated"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_commissions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
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
      vendor_demand_signals: {
        Row: {
          avg_agent_budget: number | null
          created_at: string
          demand_count: number | null
          id: string
          market_segments: string[] | null
          service_id: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          avg_agent_budget?: number | null
          created_at?: string
          demand_count?: number | null
          id?: string
          market_segments?: string[] | null
          service_id?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          avg_agent_budget?: number | null
          created_at?: string
          demand_count?: number | null
          id?: string
          market_segments?: string[] | null
          service_id?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      vendor_drafts: {
        Row: {
          change_summary: string | null
          change_type: string
          created_at: string
          draft_data: Json
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          change_summary?: string | null
          change_type?: string
          created_at?: string
          draft_data?: Json
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          change_summary?: string | null
          change_type?: string
          created_at?: string
          draft_data?: Json
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_drafts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_drafts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_directory_authenticated"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_drafts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "vendor_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
      }
      vendor_payouts: {
        Row: {
          copay_order_id: string
          created_at: string
          id: string
          payout_amount: number
          payout_completed_at: string | null
          payout_method: string | null
          payout_notes: string | null
          payout_reference: string | null
          payout_status: string | null
          stripe_transfer_id: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          copay_order_id: string
          created_at?: string
          id?: string
          payout_amount: number
          payout_completed_at?: string | null
          payout_method?: string | null
          payout_notes?: string | null
          payout_reference?: string | null
          payout_status?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          copay_order_id?: string
          created_at?: string
          id?: string
          payout_amount?: number
          payout_completed_at?: string | null
          payout_method?: string | null
          payout_notes?: string | null
          payout_reference?: string | null
          payout_status?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_payouts_copay_order_id_fkey"
            columns: ["copay_order_id"]
            isOneToOne: false
            referencedRelation: "copay_orders"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "vendor_qa_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vendor_qa_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_qa_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_directory_authenticated"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_qa_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
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
      vendor_referrals: {
        Row: {
          agent_id: string
          contact_status: string
          contacted_at: string | null
          created_at: string
          id: string
          referral_notes: string | null
          relationship: string | null
          scheduled_call_at: string | null
          service_interest: string | null
          status_notes: string | null
          updated_at: string
          vendor_company: string | null
          vendor_email: string
          vendor_name: string
          vendor_phone: string | null
          vendor_type: string | null
        }
        Insert: {
          agent_id: string
          contact_status?: string
          contacted_at?: string | null
          created_at?: string
          id?: string
          referral_notes?: string | null
          relationship?: string | null
          scheduled_call_at?: string | null
          service_interest?: string | null
          status_notes?: string | null
          updated_at?: string
          vendor_company?: string | null
          vendor_email: string
          vendor_name: string
          vendor_phone?: string | null
          vendor_type?: string | null
        }
        Update: {
          agent_id?: string
          contact_status?: string
          contacted_at?: string | null
          created_at?: string
          id?: string
          referral_notes?: string | null
          relationship?: string | null
          scheduled_call_at?: string | null
          service_interest?: string | null
          status_notes?: string | null
          updated_at?: string
          vendor_company?: string | null
          vendor_email?: string
          vendor_name?: string
          vendor_phone?: string | null
          vendor_type?: string | null
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
            foreignKeyName: "vendor_user_associations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "vendor_user_associations_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_user_associations_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_directory_authenticated"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_user_associations_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          accepts_split_payments: boolean | null
          ad_budget_max: number | null
          ad_budget_min: number | null
          agreement_documents: Json | null
          agreement_notes: string | null
          agreement_reminders_enabled: boolean | null
          agreement_renewal_date: string | null
          agreement_start_date: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          auto_score: number | null
          automated_checks: Json | null
          booking_notifications_enabled: boolean | null
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
          description_es: string | null
          description_fr: string | null
          email_notifications_enabled: boolean | null
          facilitator_fee_percentage: number | null
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
          name_es: string | null
          name_fr: string | null
          nmls_id: string | null
          parent_vendor_id: string | null
          payment_terms: string | null
          phone: string | null
          pricing_screenshot_captured_at: string | null
          pricing_screenshot_url: string | null
          pricing_url: string | null
          rating: number | null
          requires_circle_payout: boolean | null
          respa_risk_level: string | null
          review_count: number | null
          review_notifications_enabled: boolean | null
          seed_active: boolean | null
          seed_expires_at: string | null
          seed_notes: string | null
          seeded_co_marketing_agents: number | null
          service_radius_miles: number | null
          service_states: string[] | null
          service_zip_codes: string[] | null
          sort_order: number | null
          stats_include_bookings: boolean | null
          stats_include_conversions: boolean | null
          stats_include_revenue: boolean | null
          stats_include_views: boolean | null
          support_hours: string | null
          updated_at: string
          value_statement: string | null
          vendor_type: string | null
          verification_notes: string | null
          website_url: string | null
          weekly_stats_enabled: boolean | null
          weekly_stats_frequency: string | null
        }
        Insert: {
          accepts_split_payments?: boolean | null
          ad_budget_max?: number | null
          ad_budget_min?: number | null
          agreement_documents?: Json | null
          agreement_notes?: string | null
          agreement_reminders_enabled?: boolean | null
          agreement_renewal_date?: string | null
          agreement_start_date?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auto_score?: number | null
          automated_checks?: Json | null
          booking_notifications_enabled?: boolean | null
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
          description_es?: string | null
          description_fr?: string | null
          email_notifications_enabled?: boolean | null
          facilitator_fee_percentage?: number | null
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
          name_es?: string | null
          name_fr?: string | null
          nmls_id?: string | null
          parent_vendor_id?: string | null
          payment_terms?: string | null
          phone?: string | null
          pricing_screenshot_captured_at?: string | null
          pricing_screenshot_url?: string | null
          pricing_url?: string | null
          rating?: number | null
          requires_circle_payout?: boolean | null
          respa_risk_level?: string | null
          review_count?: number | null
          review_notifications_enabled?: boolean | null
          seed_active?: boolean | null
          seed_expires_at?: string | null
          seed_notes?: string | null
          seeded_co_marketing_agents?: number | null
          service_radius_miles?: number | null
          service_states?: string[] | null
          service_zip_codes?: string[] | null
          sort_order?: number | null
          stats_include_bookings?: boolean | null
          stats_include_conversions?: boolean | null
          stats_include_revenue?: boolean | null
          stats_include_views?: boolean | null
          support_hours?: string | null
          updated_at?: string
          value_statement?: string | null
          vendor_type?: string | null
          verification_notes?: string | null
          website_url?: string | null
          weekly_stats_enabled?: boolean | null
          weekly_stats_frequency?: string | null
        }
        Update: {
          accepts_split_payments?: boolean | null
          ad_budget_max?: number | null
          ad_budget_min?: number | null
          agreement_documents?: Json | null
          agreement_notes?: string | null
          agreement_reminders_enabled?: boolean | null
          agreement_renewal_date?: string | null
          agreement_start_date?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auto_score?: number | null
          automated_checks?: Json | null
          booking_notifications_enabled?: boolean | null
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
          description_es?: string | null
          description_fr?: string | null
          email_notifications_enabled?: boolean | null
          facilitator_fee_percentage?: number | null
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
          name_es?: string | null
          name_fr?: string | null
          nmls_id?: string | null
          parent_vendor_id?: string | null
          payment_terms?: string | null
          phone?: string | null
          pricing_screenshot_captured_at?: string | null
          pricing_screenshot_url?: string | null
          pricing_url?: string | null
          rating?: number | null
          requires_circle_payout?: boolean | null
          respa_risk_level?: string | null
          review_count?: number | null
          review_notifications_enabled?: boolean | null
          seed_active?: boolean | null
          seed_expires_at?: string | null
          seed_notes?: string | null
          seeded_co_marketing_agents?: number | null
          service_radius_miles?: number | null
          service_states?: string[] | null
          service_zip_codes?: string[] | null
          sort_order?: number | null
          stats_include_bookings?: boolean | null
          stats_include_conversions?: boolean | null
          stats_include_revenue?: boolean | null
          stats_include_views?: boolean | null
          support_hours?: string | null
          updated_at?: string
          value_statement?: string | null
          vendor_type?: string | null
          verification_notes?: string | null
          website_url?: string | null
          weekly_stats_enabled?: boolean | null
          weekly_stats_frequency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_parent_vendor_id_fkey"
            columns: ["parent_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_parent_vendor_id_fkey"
            columns: ["parent_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_directory_authenticated"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_parent_vendor_id_fkey"
            columns: ["parent_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
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
      web_analytics_click_events: {
        Row: {
          click_x: number | null
          click_y: number | null
          created_at: string | null
          element_selector: string | null
          element_text: string | null
          id: string
          page_view_id: string | null
          session_id: string
          updated_at: string | null
        }
        Insert: {
          click_x?: number | null
          click_y?: number | null
          created_at?: string | null
          element_selector?: string | null
          element_text?: string | null
          id?: string
          page_view_id?: string | null
          session_id: string
          updated_at?: string | null
        }
        Update: {
          click_x?: number | null
          click_y?: number | null
          created_at?: string | null
          element_selector?: string | null
          element_text?: string | null
          id?: string
          page_view_id?: string | null
          session_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "web_analytics_click_events_page_view_id_fkey"
            columns: ["page_view_id"]
            isOneToOne: false
            referencedRelation: "web_analytics_page_views"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_analytics_click_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "web_analytics_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      web_analytics_conversions: {
        Row: {
          created_at: string | null
          event_name: string
          event_type: string
          id: string
          metadata: Json | null
          session_id: string
          updated_at: string | null
          value: number | null
        }
        Insert: {
          created_at?: string | null
          event_name: string
          event_type: string
          id?: string
          metadata?: Json | null
          session_id: string
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          created_at?: string | null
          event_name?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          session_id?: string
          updated_at?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "web_analytics_conversions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "web_analytics_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      web_analytics_page_views: {
        Row: {
          created_at: string | null
          ended_at: string | null
          id: string
          is_exit: boolean | null
          page_title: string | null
          page_url: string
          session_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          is_exit?: boolean | null
          page_title?: string | null
          page_url: string
          session_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          ended_at?: string | null
          id?: string
          is_exit?: boolean | null
          page_title?: string | null
          page_url?: string
          session_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "web_analytics_page_views_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "web_analytics_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      web_analytics_scroll_events: {
        Row: {
          created_at: string | null
          id: string
          page_view_id: string | null
          scroll_depth: number | null
          session_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          page_view_id?: string | null
          scroll_depth?: number | null
          session_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          page_view_id?: string | null
          scroll_depth?: number | null
          session_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "web_analytics_scroll_events_page_view_id_fkey"
            columns: ["page_view_id"]
            isOneToOne: false
            referencedRelation: "web_analytics_page_views"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_analytics_scroll_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "web_analytics_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      web_analytics_sessions: {
        Row: {
          anonymous_id: string
          browser_name: string | null
          browser_version: string | null
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          ended_at: string | null
          id: string
          is_new_visitor: boolean | null
          operating_system: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          anonymous_id: string
          browser_name?: string | null
          browser_version?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          ended_at?: string | null
          id?: string
          is_new_visitor?: boolean | null
          operating_system?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string
          browser_name?: string | null
          browser_version?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          ended_at?: string | null
          id?: string
          is_new_visitor?: boolean | null
          operating_system?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      web_analytics_traffic_sources: {
        Row: {
          created_at: string | null
          id: string
          referrer_domain: string | null
          session_id: string
          source_type: string | null
          updated_at: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          referrer_domain?: string | null
          session_id: string
          source_type?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referrer_domain?: string | null
          session_id?: string
          source_type?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "web_analytics_traffic_sources_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "web_analytics_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      web_vitals: {
        Row: {
          created_at: string
          device_info: Json | null
          id: string
          metric_name: string
          path: string
          rating: string | null
          session_id: string
          value: number
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          id?: string
          metric_name: string
          path: string
          rating?: string | null
          session_id: string
          value: number
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          id?: string
          metric_name?: string
          path?: string
          rating?: string | null
          session_id?: string
          value?: number
        }
        Relationships: []
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
            foreignKeyName: "zoom_integrations_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "zoom_integrations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zoom_integrations_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "session_sharing_alerts"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      service_representatives_public: {
        Row: {
          bio: string | null
          created_at: string | null
          id: string | null
          is_primary: boolean | null
          location: string | null
          name: string | null
          profile_picture_url: string | null
          rating: number | null
          reviews_count: number | null
          sort_order: number | null
          specialties: string[] | null
          title: string | null
          updated_at: string | null
          vendor_id: string | null
          website: string | null
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          id?: string | null
          is_primary?: boolean | null
          location?: string | null
          name?: string | null
          profile_picture_url?: string | null
          rating?: number | null
          reviews_count?: number | null
          sort_order?: number | null
          specialties?: string[] | null
          title?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          website?: string | null
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          id?: string | null
          is_primary?: boolean | null
          location?: string | null
          name?: string | null
          profile_picture_url?: string | null
          rating?: number | null
          reviews_count?: number | null
          sort_order?: number | null
          specialties?: string[] | null
          title?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          website?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_representatives_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_representatives_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_directory_authenticated"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_representatives_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      session_sharing_alerts: {
        Row: {
          active_sessions: number | null
          email: string | null
          ip_addresses: string[] | null
          latest_activity: string | null
          unique_devices: number | null
          unique_ips: number | null
          user_id: string | null
        }
        Relationships: []
      }
      vendor_directory: {
        Row: {
          created_at: string | null
          id: string | null
          is_premium_provider: boolean | null
          is_verified: boolean | null
          logo_url: string | null
          name: string | null
          rating: number | null
          review_count: number | null
          updated_at: string | null
          vendor_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_premium_provider?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          name?: string | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string | null
          vendor_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_premium_provider?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          name?: string | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string | null
          vendor_type?: string | null
        }
        Relationships: []
      }
      vendor_directory_authenticated: {
        Row: {
          created_at: string | null
          description: string | null
          id: string | null
          is_premium_provider: boolean | null
          is_verified: boolean | null
          location: string | null
          logo_url: string | null
          name: string | null
          rating: number | null
          review_count: number | null
          service_radius_miles: number | null
          service_states: string[] | null
          support_hours: string | null
          updated_at: string | null
          value_statement: string | null
          vendor_type: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_premium_provider?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          logo_url?: string | null
          name?: string | null
          rating?: number | null
          review_count?: number | null
          service_radius_miles?: number | null
          service_states?: string[] | null
          support_hours?: string | null
          updated_at?: string | null
          value_statement?: string | null
          vendor_type?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_premium_provider?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          logo_url?: string | null
          name?: string | null
          rating?: number | null
          review_count?: number | null
          service_radius_miles?: number | null
          service_states?: string[] | null
          support_hours?: string | null
          updated_at?: string | null
          value_statement?: string | null
          vendor_type?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      web_vitals_summary: {
        Row: {
          avg_value: number | null
          date_collected: string | null
          good_percentage: number | null
          metric_name: string | null
          p50_value: number | null
          p75_value: number | null
          p95_value: number | null
          path: string | null
          sample_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_review_draft: {
        Args: {
          action: string
          draft_id: string
          draft_table: string
          rejection_reason?: string
        }
        Returns: Json
      }
      admin_self_check: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_self_check_enhanced: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      admin_set_pro_status: {
        Args:
          | { actor?: string; pro: boolean; target_user: string }
          | { pro: boolean; target_user: string }
        Returns: undefined
      }
      admin_toggle_admin_status: {
        Args: { new_status: boolean; target_user: string }
        Returns: undefined
      }
      audit_security_definer_functions: {
        Args: Record<PropertyKey, never>
        Returns: {
          function_name: string
          recommendation: string
          return_type: string
          risk_assessment: string
        }[]
      }
      auto_block_suspicious_ips: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      backup_financial_data: {
        Args: { backup_type_param: string }
        Returns: string
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
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
      calculate_nba_score: {
        Args: {
          p_agent_id: string
          p_service_id: string
          p_workflow_type: string
        }
        Returns: Json
      }
      calculate_respa_compliant_usage: {
        Args: {
          p_agent_id: string
          p_service_id: string
          p_total_amount: number
        }
        Returns: Json
      }
      calculate_success_path_score: {
        Args: { p_user_id: string }
        Returns: number
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
      can_view_agent_sensitive_data: {
        Args: { agent_user_id: string }
        Returns: boolean
      }
      can_view_vendor_sensitive_data: {
        Args: { vendor_id: string }
        Returns: boolean
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
      check_admin_operation_rate_limit_safe: {
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
        Args: { p_attempt_type?: string; p_identifier: string }
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
      cleanup_expired_security_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_user_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_marketplace_cache: {
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
        Args: { data_input: Json }
        Returns: string
      }
      current_jwt: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      current_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      current_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      debug_get_profiles_keyset: {
        Args: { cursor_date?: string; page_size?: number; search_term?: string }
        Returns: {
          auth_uid: string
          created_at: string
          display_name: string
          is_admin: boolean
          is_pro: boolean
          updated_at: string
          user_id: string
        }[]
      }
      detect_affiliate_fraud: {
        Args: { p_affiliate_id: string }
        Returns: Json
      }
      detect_suspicious_activity: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      end_session: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      ensure_profile_exists: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      expire_co_pay_requests: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      expire_sponsored_positions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_admin_analytics_summary: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_admin_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
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
      get_business_agent_info: {
        Args: { target_agent_user_id: string }
        Returns: Json
      }
      get_concierge_context: {
        Args: { p_agent_id: string }
        Returns: Json
      }
      get_creator_earnings_summary: {
        Args: { creator_user_id: string }
        Returns: Json
      }
      get_current_uid: {
        Args: Record<PropertyKey, never>
        Returns: string
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
      get_marketplace_cache: {
        Args: { p_cache_key: string }
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
      get_profiles_keyset: {
        Args: { cursor_date?: string; page_size?: number; search_term?: string }
        Returns: {
          created_at: string
          display_name: string
          is_admin: boolean
          is_pro: boolean
          updated_at: string
          user_id: string
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
      get_service_metrics_summary: {
        Args: { days_back?: number }
        Returns: {
          conversion_rate: number
          revenue_attributed: number
          service_id: string
          total_clicks: number
          total_purchases: number
          total_views: number
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
      get_top_agent_purchases: {
        Args: { p_market?: string; p_price_band?: Json }
        Returns: {
          avg_roi: number
          category: string
          purchase_frequency: number
          service_id: string
          service_title: string
        }[]
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
      get_user_profile_safe: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          display_name: string
          is_admin: boolean
          is_creator: boolean
          is_pro: boolean
          is_verified: boolean
          updated_at: string
          user_id: string
        }[]
      }
      get_vendor_dashboard_stats: {
        Args: { p_vendor_id: string }
        Returns: Json
      }
      get_vendor_public_profile: {
        Args: { vendor_id: string }
        Returns: {
          approval_status: string
          description: string
          id: string
          is_active: boolean
          is_premium_provider: boolean
          is_verified: boolean
          location: string
          logo_url: string
          name: string
          rating: number
          review_count: number
          service_radius_miles: number
          service_states: string[]
          support_hours: string
          value_statement: string
          vendor_type: string
          website_url: string
        }[]
      }
      get_vendor_service_analytics: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_rating: number
          conversion_rate: number
          total_bookings: number
          total_reviews: number
          total_services: number
          total_views: number
          vendor_id: string
        }[]
      }
      get_vendors_with_local_reps: {
        Args: Record<PropertyKey, never>
        Returns: {
          campaigns_funded: number
          co_marketing_agents: number
          contact_email: string
          created_at: string
          description: string
          id: string
          individual_email: string
          individual_license_number: string
          individual_name: string
          individual_phone: string
          individual_title: string
          is_active: boolean
          is_verified: boolean
          latitude: number
          license_states: string[]
          local_representatives: Json
          location: string
          logo_url: string
          longitude: number
          mls_areas: string[]
          name: string
          nmls_id: string
          parent_vendor_id: string
          phone: string
          rating: number
          review_count: number
          service_radius_miles: number
          service_states: string[]
          service_zip_codes: string[]
          updated_at: string
          vendor_type: string
          website_url: string
        }[]
      }
      get_web_analytics: {
        Args: { p_period?: string }
        Returns: Json
      }
      get_web_analytics_enhanced: {
        Args: { p_period?: string }
        Returns: Json
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      identify_security_definer_views: {
        Args: Record<PropertyKey, never>
        Returns: {
          definition: string
          recommendation: string
          risk_level: string
          schema_name: string
          security_type: string
          view_name: string
        }[]
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
      is_ip_blocked_safe: {
        Args: { p_ip_address: unknown; p_user_id?: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
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
      playbook_ai_draft_section: {
        Args: {
          p_section_data: Json
          p_template_prompt: string
          p_user_context?: Json
        }
        Returns: string
      }
      process_affiliate_approval: {
        Args: { p_affiliate_id: string }
        Returns: Json
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
      should_bypass_ip_restrictions: {
        Args: { p_user_id?: string }
        Returns: boolean
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      start_admin_session: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      touch_session: {
        Args: { p_session_id: string }
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
      update_qbo_tokens: {
        Args: {
          p_access_token: string
          p_expires_at: string
          p_org_id: string
          p_realm_id: string
          p_refresh_token: string
        }
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
        Returns: Json
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
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
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
      warm_marketplace_cache: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      affiliate_conversion_status:
        | "pending"
        | "approved"
        | "rejected"
        | "clawed_back"
      affiliate_conversion_type: "marketplace_purchase" | "circle_pro_signup"
      affiliate_destination_type:
        | "marketplace"
        | "academy"
        | "pro_membership"
        | "funnel"
      affiliate_doc_type:
        | "w9"
        | "w8ben"
        | "id_verification"
        | "ach_authorization"
        | "business_certificate"
        | "other"
      affiliate_onboarding_status:
        | "not_started"
        | "pending_kyc"
        | "approved"
        | "rejected"
      affiliate_payout_method: "stripe_connect" | "ach_manual"
      affiliate_payout_status: "pending" | "processing" | "paid" | "failed"
      affiliate_status: "active" | "paused" | "banned"
      affiliate_tax_status: "individual" | "business"
      attribution_event_type:
        | "click"
        | "trial_started"
        | "trial_converted"
        | "purchase"
      content_type:
        | "video"
        | "podcast"
        | "book"
        | "course"
        | "playbook"
        | "channel"
      quote_status: "submitted" | "approved" | "rejected"
      sponsored_status: "active" | "pending" | "expired" | "cancelled"
      sponsored_tier: "featured" | "premium" | "top_ranked"
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
      affiliate_conversion_status: [
        "pending",
        "approved",
        "rejected",
        "clawed_back",
      ],
      affiliate_conversion_type: ["marketplace_purchase", "circle_pro_signup"],
      affiliate_destination_type: [
        "marketplace",
        "academy",
        "pro_membership",
        "funnel",
      ],
      affiliate_doc_type: [
        "w9",
        "w8ben",
        "id_verification",
        "ach_authorization",
        "business_certificate",
        "other",
      ],
      affiliate_onboarding_status: [
        "not_started",
        "pending_kyc",
        "approved",
        "rejected",
      ],
      affiliate_payout_method: ["stripe_connect", "ach_manual"],
      affiliate_payout_status: ["pending", "processing", "paid", "failed"],
      affiliate_status: ["active", "paused", "banned"],
      affiliate_tax_status: ["individual", "business"],
      attribution_event_type: [
        "click",
        "trial_started",
        "trial_converted",
        "purchase",
      ],
      content_type: [
        "video",
        "podcast",
        "book",
        "course",
        "playbook",
        "channel",
      ],
      quote_status: ["submitted", "approved", "rejected"],
      sponsored_status: ["active", "pending", "expired", "cancelled"],
      sponsored_tier: ["featured", "premium", "top_ranked"],
    },
  },
} as const
