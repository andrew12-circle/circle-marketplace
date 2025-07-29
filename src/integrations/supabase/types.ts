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
          bio: string | null
          business_name: string | null
          circle_points: number | null
          city: string | null
          created_at: string
          display_name: string | null
          id: string
          is_pro_member: boolean | null
          location: string | null
          phone: string | null
          specialties: string[] | null
          state: string | null
          updated_at: string
          user_id: string
          website_url: string | null
          years_experience: number | null
          zip_code: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          business_name?: string | null
          circle_points?: number | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_pro_member?: boolean | null
          location?: string | null
          phone?: string | null
          specialties?: string[] | null
          state?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
          years_experience?: number | null
          zip_code?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          business_name?: string | null
          circle_points?: number | null
          city?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_pro_member?: boolean | null
          location?: string | null
          phone?: string | null
          specialties?: string[] | null
          state?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
          years_experience?: number | null
          zip_code?: string | null
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
      services: {
        Row: {
          category: string | null
          co_pay_price: string | null
          contribution_amount: string | null
          created_at: string | null
          description: string | null
          discount_percentage: string | null
          duration: string | null
          estimated_roi: number | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_top_pick: boolean | null
          original_price: string | null
          price: string | null
          pro_price: string | null
          rating: number | null
          requires_quote: boolean | null
          retail_price: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          category?: string | null
          co_pay_price?: string | null
          contribution_amount?: string | null
          created_at?: string | null
          description?: string | null
          discount_percentage?: string | null
          duration?: string | null
          estimated_roi?: number | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_top_pick?: boolean | null
          original_price?: string | null
          price?: string | null
          pro_price?: string | null
          rating?: number | null
          requires_quote?: boolean | null
          retail_price?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          category?: string | null
          co_pay_price?: string | null
          contribution_amount?: string | null
          created_at?: string | null
          description?: string | null
          discount_percentage?: string | null
          duration?: string | null
          estimated_roi?: number | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_top_pick?: boolean | null
          original_price?: string | null
          price?: string | null
          pro_price?: string | null
          rating?: number | null
          requires_quote?: boolean | null
          retail_price?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          vendor_id?: string
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
      vendors: {
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
          parent_vendor_id: string | null
          phone: string | null
          rating: number | null
          review_count: number | null
          service_radius_miles: number | null
          service_states: string[] | null
          service_zip_codes: string[] | null
          updated_at: string
          vendor_type: string | null
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
          parent_vendor_id?: string | null
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          service_radius_miles?: number | null
          service_states?: string[] | null
          service_zip_codes?: string[] | null
          updated_at?: string
          vendor_type?: string | null
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
          parent_vendor_id?: string | null
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          service_radius_miles?: number | null
          service_states?: string[] | null
          service_zip_codes?: string[] | null
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
