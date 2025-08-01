export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
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
      channels: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          creator_id: string
          description: string | null
          id: string
          is_verified: boolean | null
          name: string
          subscriber_count: number | null
          updated_at: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          id?: string
          is_verified?: boolean | null
          name: string
          subscriber_count?: number | null
          updated_at?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          id?: string
          is_verified?: boolean | null
          name?: string
          subscriber_count?: number | null
          updated_at?: string | null
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
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown | null
          requested_split_percentage: number
          service_id: string | null
          status: string
          updated_at: string
          user_agent: string | null
          vendor_id: string | null
          vendor_notes: string | null
        }
        Insert: {
          agent_id?: string | null
          agent_notes?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          requested_split_percentage: number
          service_id?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          vendor_id?: string | null
          vendor_notes?: string | null
        }
        Update: {
          agent_id?: string | null
          agent_notes?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          requested_split_percentage?: number
          service_id?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          vendor_id?: string | null
          vendor_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "co_pay_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
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
          id: string
          project_details: string | null
          scheduled_date: string
          scheduled_time: string
          service_id: string
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
          id?: string
          project_details?: string | null
          scheduled_date: string
          scheduled_time: string
          service_id: string
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
          id?: string
          project_details?: string | null
          scheduled_date?: string
          scheduled_time?: string
          service_id?: string
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
          category: string
          content_type: Database["public"]["Enums"]["content_type"]
          content_url: string | null
          cover_image_url: string | null
          created_at: string | null
          creator_id: string
          description: string | null
          duration: string | null
          id: string
          is_featured: boolean | null
          is_pro: boolean | null
          is_published: boolean | null
          lesson_count: number | null
          metadata: Json | null
          page_count: number | null
          preview_url: string | null
          price: number | null
          published_at: string | null
          rating: number | null
          tags: string[] | null
          title: string
          total_plays: number | null
          total_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          content_type: Database["public"]["Enums"]["content_type"]
          content_url?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          duration?: string | null
          id?: string
          is_featured?: boolean | null
          is_pro?: boolean | null
          is_published?: boolean | null
          lesson_count?: number | null
          metadata?: Json | null
          page_count?: number | null
          preview_url?: string | null
          price?: number | null
          published_at?: string | null
          rating?: number | null
          tags?: string[] | null
          title: string
          total_plays?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          content_type?: Database["public"]["Enums"]["content_type"]
          content_url?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          duration?: string | null
          id?: string
          is_featured?: boolean | null
          is_pro?: boolean | null
          is_published?: boolean | null
          lesson_count?: number | null
          metadata?: Json | null
          page_count?: number | null
          preview_url?: string | null
          price?: number | null
          published_at?: string | null
          rating?: number | null
          tags?: string[] | null
          title?: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          bank_details: Json | null
          bio: string | null
          business_name: string | null
          circle_points: number | null
          city: string | null
          created_at: string
          creator_bio: string | null
          creator_joined_at: string | null
          creator_social_links: Json | null
          creator_verified: boolean | null
          creator_website: string | null
          display_name: string | null
          id: string
          is_admin: boolean | null
          is_creator: boolean | null
          is_pro_member: boolean | null
          location: string | null
          phone: string | null
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
          years_experience: number | null
          zip_code: string | null
        }
        Insert: {
          avatar_url?: string | null
          bank_details?: Json | null
          bio?: string | null
          business_name?: string | null
          circle_points?: number | null
          city?: string | null
          created_at?: string
          creator_bio?: string | null
          creator_joined_at?: string | null
          creator_social_links?: Json | null
          creator_verified?: boolean | null
          creator_website?: string | null
          display_name?: string | null
          id?: string
          is_admin?: boolean | null
          is_creator?: boolean | null
          is_pro_member?: boolean | null
          location?: string | null
          phone?: string | null
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
          years_experience?: number | null
          zip_code?: string | null
        }
        Update: {
          avatar_url?: string | null
          bank_details?: Json | null
          bio?: string | null
          business_name?: string | null
          circle_points?: number | null
          city?: string | null
          created_at?: string
          creator_bio?: string | null
          creator_joined_at?: string | null
          creator_social_links?: Json | null
          creator_verified?: boolean | null
          creator_website?: string | null
          display_name?: string | null
          id?: string
          is_admin?: boolean | null
          is_creator?: boolean | null
          is_pro_member?: boolean | null
          location?: string | null
          phone?: string | null
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
          years_experience?: number | null
          zip_code?: string | null
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
          category: string | null
          co_pay_allowed: boolean | null
          co_pay_price: string | null
          created_at: string | null
          description: string | null
          discount_percentage: string | null
          duration: string | null
          estimated_agent_split_percentage: number | null
          estimated_roi: number | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_top_pick: boolean | null
          max_vendor_split_percentage: number | null
          original_image_url: string | null
          price_duration: string | null
          pro_price: string | null
          rating: number | null
          requires_quote: boolean | null
          respa_category: string | null
          respa_notes: string | null
          retail_price: string | null
          service_provider_id: string | null
          sort_order: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
          vectorized_image_url: string | null
          vendor_id: string | null
          website_url: string | null
        }
        Insert: {
          category?: string | null
          co_pay_allowed?: boolean | null
          co_pay_price?: string | null
          created_at?: string | null
          description?: string | null
          discount_percentage?: string | null
          duration?: string | null
          estimated_agent_split_percentage?: number | null
          estimated_roi?: number | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_top_pick?: boolean | null
          max_vendor_split_percentage?: number | null
          original_image_url?: string | null
          price_duration?: string | null
          pro_price?: string | null
          rating?: number | null
          requires_quote?: boolean | null
          respa_category?: string | null
          respa_notes?: string | null
          retail_price?: string | null
          service_provider_id?: string | null
          sort_order?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          vectorized_image_url?: string | null
          vendor_id?: string | null
          website_url?: string | null
        }
        Update: {
          category?: string | null
          co_pay_allowed?: boolean | null
          co_pay_price?: string | null
          created_at?: string | null
          description?: string | null
          discount_percentage?: string | null
          duration?: string | null
          estimated_agent_split_percentage?: number | null
          estimated_roi?: number | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_top_pick?: boolean | null
          max_vendor_split_percentage?: number | null
          original_image_url?: string | null
          price_duration?: string | null
          pro_price?: string | null
          rating?: number | null
          requires_quote?: boolean | null
          respa_category?: string | null
          respa_notes?: string | null
          retail_price?: string | null
          service_provider_id?: string | null
          sort_order?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          vectorized_image_url?: string | null
          vendor_id?: string | null
          website_url?: string | null
        }
        Relationships: [
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
          budget_currency: string | null
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
          parent_vendor_id: string | null
          phone: string | null
          rating: number | null
          respa_risk_level: string | null
          review_count: number | null
          service_radius_miles: number | null
          service_states: string[] | null
          service_zip_codes: string[] | null
          sort_order: number | null
          updated_at: string
          vendor_type: string | null
          website_url: string | null
        }
        Insert: {
          ad_budget_max?: number | null
          ad_budget_min?: number | null
          budget_currency?: string | null
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
          parent_vendor_id?: string | null
          phone?: string | null
          rating?: number | null
          respa_risk_level?: string | null
          review_count?: number | null
          service_radius_miles?: number | null
          service_states?: string[] | null
          service_zip_codes?: string[] | null
          sort_order?: number | null
          updated_at?: string
          vendor_type?: string | null
          website_url?: string | null
        }
        Update: {
          ad_budget_max?: number | null
          ad_budget_min?: number | null
          budget_currency?: string | null
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
          parent_vendor_id?: string | null
          phone?: string | null
          rating?: number | null
          respa_risk_level?: string | null
          review_count?: number | null
          service_radius_miles?: number | null
          service_states?: string[] | null
          service_zip_codes?: string[] | null
          sort_order?: number | null
          updated_at?: string
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
    }
    Views: {
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
      calculate_distance: {
        Args: { lat1: number; lon1: number; lat2: number; lon2: number }
        Returns: number
      }
      calculate_monthly_revenue: {
        Args: { target_month: string }
        Returns: undefined
      }
      check_account_lockout: {
        Args: { user_email: string; client_ip?: unknown }
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
      check_and_update_lockout: {
        Args: { p_identifier: string; p_attempt_type: string }
        Returns: Json
      }
      cleanup_old_security_events: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      clear_failed_attempts: {
        Args: { p_identifier: string; p_attempt_type?: string }
        Returns: undefined
      }
      expire_co_pay_requests: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_public_profile: {
        Args: { profile_id: string }
        Returns: {
          id: string
          display_name: string
          business_name: string
          location: string
          specialties: string[]
          years_experience: number
          website_url: string
          avatar_url: string
        }[]
      }
      get_user_admin_status: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      increment_content_plays: {
        Args: { content_uuid: string }
        Returns: undefined
      }
      increment_video_views: {
        Args: { video_uuid: string }
        Returns: undefined
      }
      log_login_attempt: {
        Args: {
          user_email: string
          success: boolean
          client_ip?: unknown
          client_user_agent?: string
        }
        Returns: undefined
      }
      trigger_trending_import: {
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
      validate_password_strength: {
        Args: { password: string }
        Returns: Json
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
