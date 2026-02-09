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
      calendar_events: {
        Row: {
          completed: boolean | null
          created_at: string
          crop_name: string
          event_date: string
          event_type: string
          id: string
          notes: string | null
          notification_sent: boolean | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          crop_name: string
          event_date: string
          event_type: string
          id?: string
          notes?: string | null
          notification_sent?: boolean | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          crop_name?: string
          event_date?: string
          event_type?: string
          id?: string
          notes?: string | null
          notification_sent?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      crop_history: {
        Row: {
          created_at: string | null
          crop_category: string | null
          crop_name: string
          expected_harvest_date: string | null
          field_name: string | null
          id: string
          soil_profile_id: string | null
          source: string | null
          sowing_date: string | null
          suitability_score: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          crop_category?: string | null
          crop_name: string
          expected_harvest_date?: string | null
          field_name?: string | null
          id?: string
          soil_profile_id?: string | null
          source?: string | null
          sowing_date?: string | null
          suitability_score?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          crop_category?: string | null
          crop_name?: string
          expected_harvest_date?: string | null
          field_name?: string | null
          id?: string
          soil_profile_id?: string | null
          source?: string | null
          sowing_date?: string | null
          suitability_score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      crops: {
        Row: {
          category: string
          cost_per_acre: number | null
          created_at: string | null
          duration_days: number | null
          expected_yield_per_acre: string | null
          expert_tips: string[] | null
          growing_guide: Json | null
          id: string
          ideal_temperature_max: number | null
          ideal_temperature_min: number | null
          image_url: string | null
          market_price_range: string | null
          max_nitrogen: number | null
          max_ph: number | null
          max_phosphorus: number | null
          max_potassium: number | null
          min_nitrogen: number | null
          min_ph: number | null
          min_phosphorus: number | null
          min_potassium: number | null
          name: string
          name_hi: string | null
          name_mr: string | null
          profit_potential: string | null
          season: string
          soil_types: string[] | null
          updated_at: string | null
          water_needs: string | null
        }
        Insert: {
          category: string
          cost_per_acre?: number | null
          created_at?: string | null
          duration_days?: number | null
          expected_yield_per_acre?: string | null
          expert_tips?: string[] | null
          growing_guide?: Json | null
          id?: string
          ideal_temperature_max?: number | null
          ideal_temperature_min?: number | null
          image_url?: string | null
          market_price_range?: string | null
          max_nitrogen?: number | null
          max_ph?: number | null
          max_phosphorus?: number | null
          max_potassium?: number | null
          min_nitrogen?: number | null
          min_ph?: number | null
          min_phosphorus?: number | null
          min_potassium?: number | null
          name: string
          name_hi?: string | null
          name_mr?: string | null
          profit_potential?: string | null
          season: string
          soil_types?: string[] | null
          updated_at?: string | null
          water_needs?: string | null
        }
        Update: {
          category?: string
          cost_per_acre?: number | null
          created_at?: string | null
          duration_days?: number | null
          expected_yield_per_acre?: string | null
          expert_tips?: string[] | null
          growing_guide?: Json | null
          id?: string
          ideal_temperature_max?: number | null
          ideal_temperature_min?: number | null
          image_url?: string | null
          market_price_range?: string | null
          max_nitrogen?: number | null
          max_ph?: number | null
          max_phosphorus?: number | null
          max_potassium?: number | null
          min_nitrogen?: number | null
          min_ph?: number | null
          min_phosphorus?: number | null
          min_potassium?: number | null
          name?: string
          name_hi?: string | null
          name_mr?: string | null
          profit_potential?: string | null
          season?: string
          soil_types?: string[] | null
          updated_at?: string | null
          water_needs?: string | null
        }
        Relationships: []
      }
      estimated_soil_profiles: {
        Row: {
          created_at: string | null
          district: string
          estimated_nitrogen: number | null
          estimated_organic_carbon: number | null
          estimated_ph: number | null
          estimated_phosphorus: number | null
          estimated_potassium: number | null
          estimated_soil_type: string | null
          fertilizer_usage: string | null
          id: string
          irrigation_available: boolean | null
          previous_crop: string | null
          soil_color: string | null
          soil_texture: string | null
          state: string
          updated_at: string | null
          user_id: string
          village: string | null
          water_retention: string | null
        }
        Insert: {
          created_at?: string | null
          district: string
          estimated_nitrogen?: number | null
          estimated_organic_carbon?: number | null
          estimated_ph?: number | null
          estimated_phosphorus?: number | null
          estimated_potassium?: number | null
          estimated_soil_type?: string | null
          fertilizer_usage?: string | null
          id?: string
          irrigation_available?: boolean | null
          previous_crop?: string | null
          soil_color?: string | null
          soil_texture?: string | null
          state: string
          updated_at?: string | null
          user_id: string
          village?: string | null
          water_retention?: string | null
        }
        Update: {
          created_at?: string | null
          district?: string
          estimated_nitrogen?: number | null
          estimated_organic_carbon?: number | null
          estimated_ph?: number | null
          estimated_phosphorus?: number | null
          estimated_potassium?: number | null
          estimated_soil_type?: string | null
          fertilizer_usage?: string | null
          id?: string
          irrigation_available?: boolean | null
          previous_crop?: string | null
          soil_color?: string | null
          soil_texture?: string | null
          state?: string
          updated_at?: string | null
          user_id?: string
          village?: string | null
          water_retention?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean | null
          reference_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          reference_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          reference_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string | null
          avatar_url: string | null
          created_at: string
          id: string
          land_owned: string | null
          language: string | null
          location: string | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          account_type?: string | null
          avatar_url?: string | null
          created_at?: string
          id?: string
          land_owned?: string | null
          language?: string | null
          location?: string | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          account_type?: string | null
          avatar_url?: string | null
          created_at?: string
          id?: string
          land_owned?: string | null
          language?: string | null
          location?: string | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      saved_posts: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_soil_analyses: {
        Row: {
          analysis_data: Json
          created_at: string
          field_name: string | null
          id: string
          is_estimated: boolean | null
          language: string | null
          soil_params: Json
          user_id: string
        }
        Insert: {
          analysis_data: Json
          created_at?: string
          field_name?: string | null
          id?: string
          is_estimated?: boolean | null
          language?: string | null
          soil_params: Json
          user_id: string
        }
        Update: {
          analysis_data?: Json
          created_at?: string
          field_name?: string | null
          id?: string
          is_estimated?: boolean | null
          language?: string | null
          soil_params?: Json
          user_id?: string
        }
        Relationships: []
      }
      smart_notifications: {
        Row: {
          action_data: Json | null
          action_type: string | null
          created_at: string
          dismissed: boolean | null
          expires_at: string | null
          id: string
          message: string
          priority: string | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_data?: Json | null
          action_type?: string | null
          created_at?: string
          dismissed?: boolean | null
          expires_at?: string | null
          id?: string
          message: string
          priority?: string | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_data?: Json | null
          action_type?: string | null
          created_at?: string
          dismissed?: boolean | null
          expires_at?: string | null
          id?: string
          message?: string
          priority?: string | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_conversation_member: { Args: { conv_id: string }; Returns: boolean }
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
