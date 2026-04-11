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
      daily_logs: {
        Row: {
          calories_consumed: number
          checked_items: string[]
          created_at: string
          id: string
          log_date: string
          total_score: number
          updated_at: string
          user_id: string
          water_cups: number
        }
        Insert: {
          calories_consumed?: number
          checked_items?: string[]
          created_at?: string
          id?: string
          log_date?: string
          total_score?: number
          updated_at?: string
          user_id: string
          water_cups?: number
        }
        Update: {
          calories_consumed?: number
          checked_items?: string[]
          created_at?: string
          id?: string
          log_date?: string
          total_score?: number
          updated_at?: string
          user_id?: string
          water_cups?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          avatar_url: string | null
          created_at: string
          display_name: string | null
          gender: string | null
          health_conditions: string[] | null
          height: number | null
          id: string
          is_vegetarian: boolean | null
          medications: string[] | null
          onboarding_completed: boolean | null
          target_weight: number | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          gender?: string | null
          health_conditions?: string[] | null
          height?: number | null
          id: string
          is_vegetarian?: boolean | null
          medications?: string[] | null
          onboarding_completed?: boolean | null
          target_weight?: number | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          gender?: string | null
          health_conditions?: string[] | null
          height?: number | null
          id?: string
          is_vegetarian?: boolean | null
          medications?: string[] | null
          onboarding_completed?: boolean | null
          target_weight?: number | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          best_streak: number
          created_at: string
          current_weight: number
          id: string
          meals: Json
          start_weight: number
          streak: number
          success_days: number
          target_calories: number
          target_weight: number
          updated_at: string
          user_id: string
          weight_history: Json
        }
        Insert: {
          best_streak?: number
          created_at?: string
          current_weight?: number
          id?: string
          meals?: Json
          start_weight?: number
          streak?: number
          success_days?: number
          target_calories?: number
          target_weight?: number
          updated_at?: string
          user_id: string
          weight_history?: Json
        }
        Update: {
          best_streak?: number
          created_at?: string
          current_weight?: number
          id?: string
          meals?: Json
          start_weight?: number
          streak?: number
          success_days?: number
          target_calories?: number
          target_weight?: number
          updated_at?: string
          user_id?: string
          weight_history?: Json
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
