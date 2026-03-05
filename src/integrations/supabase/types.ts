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
      alerts: {
        Row: {
          created_at: string
          id: string
          message: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["alert_status"]
          student_id: string
          type: Database["public"]["Enums"]["alert_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["alert_status"]
          student_id: string
          type: Database["public"]["Enums"]["alert_type"]
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["alert_status"]
          student_id?: string
          type?: Database["public"]["Enums"]["alert_type"]
        }
        Relationships: [
          {
            foreignKeyName: "alerts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          callmebot_api_key: string | null
          created_at: string
          id: string
          name: string
          parent_access_token: string | null
          phone: string
          relation: string | null
          student_id: string
          whatsapp_enabled: boolean | null
        }
        Insert: {
          callmebot_api_key?: string | null
          created_at?: string
          id?: string
          name: string
          parent_access_token?: string | null
          phone: string
          relation?: string | null
          student_id: string
          whatsapp_enabled?: boolean | null
        }
        Update: {
          callmebot_api_key?: string | null
          created_at?: string
          id?: string
          name?: string
          parent_access_token?: string | null
          phone?: string
          relation?: string | null
          student_id?: string
          whatsapp_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      movements: {
        Row: {
          id: string
          registered_at: string
          registered_by: string | null
          student_id: string
          type: Database["public"]["Enums"]["movement_type"]
        }
        Insert: {
          id?: string
          registered_at?: string
          registered_by?: string | null
          student_id: string
          type: Database["public"]["Enums"]["movement_type"]
        }
        Update: {
          id?: string
          registered_at?: string
          registered_by?: string | null
          student_id?: string
          type?: Database["public"]["Enums"]["movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "movements_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      occurrences: {
        Row: {
          created_at: string
          description: string | null
          id: string
          registered_by: string | null
          student_id: string
          type: Database["public"]["Enums"]["occurrence_type"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          registered_by?: string | null
          student_id: string
          type: Database["public"]["Enums"]["occurrence_type"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          registered_by?: string | null
          student_id?: string
          type?: Database["public"]["Enums"]["occurrence_type"]
        }
        Relationships: [
          {
            foreignKeyName: "occurrences_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          role_label: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id?: string
          role_label?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          role_label?: string | null
          user_id?: string
        }
        Relationships: []
      }
      schedules: {
        Row: {
          created_at: string
          end_time: string
          id: string
          name: string
          notify_whatsapp: boolean | null
          start_time: string
          tolerance_minutes: number | null
          type: Database["public"]["Enums"]["schedule_type"]
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          name: string
          notify_whatsapp?: boolean | null
          start_time: string
          tolerance_minutes?: number | null
          type: Database["public"]["Enums"]["schedule_type"]
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          name?: string
          notify_whatsapp?: boolean | null
          start_time?: string
          tolerance_minutes?: number | null
          type?: Database["public"]["Enums"]["schedule_type"]
        }
        Relationships: []
      }
      settings: {
        Row: {
          callmebot_api_key_global: string | null
          exit_limit_default: number | null
          id: string
          school_name: string
          school_phone: string | null
          updated_at: string
          whatsapp_enabled: boolean | null
        }
        Insert: {
          callmebot_api_key_global?: string | null
          exit_limit_default?: number | null
          id?: string
          school_name?: string
          school_phone?: string | null
          updated_at?: string
          whatsapp_enabled?: boolean | null
        }
        Update: {
          callmebot_api_key_global?: string | null
          exit_limit_default?: number | null
          id?: string
          school_name?: string
          school_phone?: string | null
          updated_at?: string
          whatsapp_enabled?: boolean | null
        }
        Relationships: []
      }
      students: {
        Row: {
          active: boolean
          class: string
          created_at: string
          enrollment: string
          exit_limit: number | null
          id: string
          name: string
          photo_url: string | null
          qr_code: string
          series: string
          updated_at: string
          modality: string | null
        }
        Insert: {
          active?: boolean
          class: string
          created_at?: string
          enrollment: string
          exit_limit?: number | null
          id?: string
          name: string
          photo_url?: string | null
          qr_code?: string
          series: string
          updated_at?: string
          modality?: string | null
        }
        Update: {
          active?: boolean
          class?: string
          created_at?: string
          enrollment?: string
          exit_limit?: number | null
          id?: string
          name?: string
          photo_url?: string | null
          qr_code?: string
          series?: string
          updated_at?: string
          modality?: string | null
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
          role?: Database["public"]["Enums"]["app_role"]
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
      alert_status: "pending" | "resolved"
      alert_type:
      | "absent"
      | "not_returned"
      | "irregular_time"
      | "excessive_exits"
      app_role: "admin" | "user"
      movement_type: "entry" | "exit"
      occurrence_type:
      | "unauthorized_exit"
      | "guardian_pickup"
      | "student_sick"
      | "behavior"
      | "late"
      | "other"
      schedule_type: "entry" | "exit"
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
      alert_status: ["pending", "resolved"],
      alert_type: [
        "absent",
        "not_returned",
        "irregular_time",
        "excessive_exits",
      ],
      app_role: ["admin", "user"],
      movement_type: ["entry", "exit"],
      occurrence_type: [
        "unauthorized_exit",
        "guardian_pickup",
        "student_sick",
        "behavior",
        "late",
        "other",
      ],
      schedule_type: ["entry", "exit"],
    },
  },
} as const
