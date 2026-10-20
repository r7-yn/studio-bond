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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: number
          metadata: Json
          session_id: string | null
          track_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: number
          metadata?: Json
          session_id?: string | null
          track_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: number
          metadata?: Json
          session_id?: string | null
          track_id?: string | null
        }
        Relationships: []
      }
      app_theme_settings: {
        Row: {
          active_theme: string
          custom_greetings_override: Json | null
          enable_offers_section: boolean
          enable_time_greetings: boolean
          force_theme_override: boolean
          id: string
          updated_at: string
        }
        Insert: {
          active_theme?: string
          custom_greetings_override?: Json | null
          enable_offers_section?: boolean
          enable_time_greetings?: boolean
          force_theme_override?: boolean
          id?: string
          updated_at?: string
        }
        Update: {
          active_theme?: string
          custom_greetings_override?: Json | null
          enable_offers_section?: boolean
          enable_time_greetings?: boolean
          force_theme_override?: boolean
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      artists: {
        Row: {
          avatar: string
          bio: string
          cover_image: string | null
          created_at: string
          genres: Json
          id: string
          is_verified: boolean
          name: string
          role: string
          sort_order: number
          total_streams: number
          tracks_count: number
          updated_at: string
        }
        Insert: {
          avatar?: string
          bio?: string
          cover_image?: string | null
          created_at?: string
          genres?: Json
          id: string
          is_verified?: boolean
          name: string
          role?: string
          sort_order?: number
          total_streams?: number
          tracks_count?: number
          updated_at?: string
        }
        Update: {
          avatar?: string
          bio?: string
          cover_image?: string | null
          created_at?: string
          genres?: Json
          id?: string
          is_verified?: boolean
          name?: string
          role?: string
          sort_order?: number
          total_streams?: number
          tracks_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          description: string
          id: string
          image_url: string | null
          name: string
          slug: string
          sort_order: number
          track_count: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string | null
          description?: string
          id: string
          image_url?: string | null
          name: string
          slug: string
          sort_order?: number
          track_count?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
          track_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      offers_packages: {
        Row: {
          badge: string | null
          banner_url: string | null
          created_at: string
          cta_text: string
          currency: string
          description: string | null
          display_order: number
          end_date: string | null
          features: Json
          id: string
          is_active: boolean
          price_current: number | null
          price_original: number | null
          start_date: string | null
          title: string
          type: string
          updated_at: string
          whatsapp_message_template: string
        }
        Insert: {
          badge?: string | null
          banner_url?: string | null
          created_at?: string
          cta_text?: string
          currency?: string
          description?: string | null
          display_order?: number
          end_date?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          price_current?: number | null
          price_original?: number | null
          start_date?: string | null
          title: string
          type?: string
          updated_at?: string
          whatsapp_message_template: string
        }
        Update: {
          badge?: string | null
          banner_url?: string | null
          created_at?: string
          cta_text?: string
          currency?: string
          description?: string | null
          display_order?: number
          end_date?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          price_current?: number | null
          price_original?: number | null
          start_date?: string | null
          title?: string
          type?: string
          updated_at?: string
          whatsapp_message_template?: string
        }
        Relationships: []
      }
      order_logs: {
        Row: {
          client_names: string
          created_at: string | null
          event_date: string | null
          event_type: string
          id: string
          modification_type: string
          names: string
          notes: string | null
          occasion_date: string | null
          phone: string | null
          status: string
          track_code: string
          track_id: string | null
          track_title: string
        }
        Insert: {
          client_names?: string
          created_at?: string | null
          event_date?: string | null
          event_type: string
          id?: string
          modification_type?: string
          names: string
          notes?: string | null
          occasion_date?: string | null
          phone?: string | null
          status?: string
          track_code: string
          track_id?: string | null
          track_title: string
        }
        Update: {
          client_names?: string
          created_at?: string | null
          event_date?: string | null
          event_type?: string
          id?: string
          modification_type?: string
          names?: string
          notes?: string | null
          occasion_date?: string | null
          phone?: string | null
          status?: string
          track_code?: string
          track_id?: string | null
          track_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_logs_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      tracks: {
        Row: {
          artist: string
          audio_frequency: number | null
          audio_url: string
          category_id: string | null
          code: string
          cover_image: string
          cover_url: string
          created_at: string | null
          description: string
          duration: string
          duration_formatted: string
          duration_sec: number
          duration_seconds: number
          execution_days: string
          has_music: boolean | null
          id: string
          is_exclusive: boolean
          is_featured: boolean | null
          is_trend: boolean
          likes_count: number | null
          lyrics: string | null
          plays_count: number | null
          rhythm: string
          suitable_for: Json
          title: string
          updated_at: string
          vocalist: string
        }
        Insert: {
          artist?: string
          audio_frequency?: number | null
          audio_url: string
          category_id?: string | null
          code: string
          cover_image: string
          cover_url?: string
          created_at?: string | null
          description?: string
          duration: string
          duration_formatted?: string
          duration_sec?: number
          duration_seconds?: number
          execution_days?: string
          has_music?: boolean | null
          id: string
          is_exclusive?: boolean
          is_featured?: boolean | null
          is_trend?: boolean
          likes_count?: number | null
          lyrics?: string | null
          plays_count?: number | null
          rhythm?: string
          suitable_for?: Json
          title: string
          updated_at?: string
          vocalist: string
        }
        Update: {
          artist?: string
          audio_frequency?: number | null
          audio_url?: string
          category_id?: string | null
          code?: string
          cover_image?: string
          cover_url?: string
          created_at?: string | null
          description?: string
          duration?: string
          duration_formatted?: string
          duration_sec?: number
          duration_seconds?: number
          execution_days?: string
          has_music?: boolean | null
          id?: string
          is_exclusive?: boolean
          is_featured?: boolean | null
          is_trend?: boolean
          likes_count?: number | null
          lyrics?: string | null
          plays_count?: number | null
          rhythm?: string
          suitable_for?: Json
          title?: string
          updated_at?: string
          vocalist?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_public_request_slot: {
        Args: {
          p_ip_fingerprint: string
          p_limit: number
          p_request_kind: string
          p_window_seconds: number
        }
        Returns: boolean
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
