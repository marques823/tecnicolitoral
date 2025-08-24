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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          active: boolean | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          active: boolean
          address: string | null
          company_id: string
          company_name: string | null
          created_at: string
          document: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          company_id: string
          company_name?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          company_id?: string
          company_name?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          active: boolean | null
          created_at: string
          custom_css: string | null
          id: string
          logo_url: string | null
          name: string
          plan_id: string
          primary_color: string | null
          secondary_color: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          custom_css?: string | null
          id?: string
          logo_url?: string | null
          name: string
          plan_id: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          custom_css?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          plan_id?: string
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_values: {
        Row: {
          created_at: string
          custom_field_id: string
          id: string
          ticket_id: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          custom_field_id: string
          id?: string
          ticket_id: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          custom_field_id?: string
          id?: string
          ticket_id?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_values_custom_field_id_fkey"
            columns: ["custom_field_id"]
            isOneToOne: false
            referencedRelation: "custom_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_field_values_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_fields: {
        Row: {
          active: boolean
          company_id: string
          created_at: string
          field_type: Database["public"]["Enums"]["custom_field_type"]
          id: string
          label: string
          name: string
          options: Json | null
          required: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          company_id: string
          created_at?: string
          field_type: Database["public"]["Enums"]["custom_field_type"]
          id?: string
          label: string
          name: string
          options?: Json | null
          required?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          company_id?: string
          created_at?: string
          field_type?: Database["public"]["Enums"]["custom_field_type"]
          id?: string
          label?: string
          name?: string
          options?: Json | null
          required?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_fields_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
          user_id: string | null
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
          user_id?: string | null
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string
          has_custom_fields: boolean | null
          id: string
          max_users: number
          monthly_price: number | null
          name: string
          type: Database["public"]["Enums"]["plan_type"]
        }
        Insert: {
          created_at?: string
          has_custom_fields?: boolean | null
          id?: string
          max_users: number
          monthly_price?: number | null
          name: string
          type: Database["public"]["Enums"]["plan_type"]
        }
        Update: {
          created_at?: string
          has_custom_fields?: boolean | null
          id?: string
          max_users?: number
          monthly_price?: number | null
          name?: string
          type?: Database["public"]["Enums"]["plan_type"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean | null
          company_id: string
          created_at: string
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          company_id: string
          created_at?: string
          id?: string
          name: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      technical_notes: {
        Row: {
          company_id: string
          content: string
          created_at: string
          created_by: string
          devices_info: Json | null
          equipment_models: string[] | null
          id: string
          is_public: boolean
          observations: string | null
          photos: string[] | null
          problem_description: string | null
          services_needed: string[] | null
          services_performed: string[] | null
          solution_description: string | null
          tags: string[] | null
          ticket_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string
          created_by: string
          devices_info?: Json | null
          equipment_models?: string[] | null
          id?: string
          is_public?: boolean
          observations?: string | null
          photos?: string[] | null
          problem_description?: string | null
          services_needed?: string[] | null
          services_performed?: string[] | null
          solution_description?: string | null
          tags?: string[] | null
          ticket_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          created_by?: string
          devices_info?: Json | null
          equipment_models?: string[] | null
          id?: string
          is_public?: boolean
          observations?: string | null
          photos?: string[] | null
          problem_description?: string | null
          services_needed?: string[] | null
          services_performed?: string[] | null
          solution_description?: string | null
          tags?: string[] | null
          ticket_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "technical_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technical_notes_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_history: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
          new_value: string | null
          old_value: string | null
          ticket_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          ticket_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_history_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_shares: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          password_hash: string | null
          share_token: string
          shared_by: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          password_hash?: string | null
          share_token: string
          shared_by: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          password_hash?: string | null
          share_token?: string
          shared_by?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_shares_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          category_id: string
          client_id: string | null
          company_id: string
          created_at: string
          created_by: string
          description: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"] | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"] | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category_id: string
          client_id?: string | null
          company_id: string
          created_at?: string
          created_by: string
          description: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category_id?: string
          client_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_settings: {
        Row: {
          created_at: string
          email_on_assignment: boolean
          email_on_new_ticket: boolean
          email_on_status_change: boolean
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_on_assignment?: boolean
          email_on_new_ticket?: boolean
          email_on_status_change?: boolean
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_on_assignment?: boolean
          email_on_new_ticket?: boolean
          email_on_status_change?: boolean
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_company_and_profile: {
        Args: { company_name: string; plan_id: string }
        Returns: string
      }
      generate_share_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_company_id: {
        Args: { user_uuid: string }
        Returns: string
      }
      promote_to_super_admin: {
        Args: { user_email: string }
        Returns: boolean
      }
      user_has_master_role: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      user_is_super_admin: {
        Args: { user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      custom_field_type:
        | "text"
        | "textarea"
        | "select"
        | "number"
        | "date"
        | "boolean"
      plan_type: "basic" | "premium" | "enterprise"
      ticket_priority: "low" | "medium" | "high"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
      user_role: "system_owner" | "company_admin" | "technician" | "client_user"
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
      custom_field_type: [
        "text",
        "textarea",
        "select",
        "number",
        "date",
        "boolean",
      ],
      plan_type: ["basic", "premium", "enterprise"],
      ticket_priority: ["low", "medium", "high"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
      user_role: ["system_owner", "company_admin", "technician", "client_user"],
    },
  },
} as const
