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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agent_goals: {
        Row: {
          agente: string
          created_at: string
          id: string
          mes: string
          meta: number
          meta_inv: number | null
        }
        Insert: {
          agente: string
          created_at?: string
          id?: string
          mes: string
          meta?: number
          meta_inv?: number | null
        }
        Update: {
          agente?: string
          created_at?: string
          id?: string
          mes?: string
          meta?: number
          meta_inv?: number | null
        }
        Relationships: []
      }
      agent_investments: {
        Row: {
          agente: string
          created_at: string
          id: string
          inv_60_second: number
          inv_fj_call: number
          inv_leads_propios: number
          leads_cerrados: number
          leads_cerrados_60_second: number
          leads_cerrados_fj_call: number
          leads_cerrados_leads_propios: number
          leads_recibidos: number
          leads_recibidos_60_second: number
          leads_recibidos_fj_call: number
          leads_recibidos_leads_propios: number
          pct_cierre_60_second: number
          pct_cierre_fj_call: number
          pct_cierre_leads_propios: number
          semana: string
        }
        Insert: {
          agente: string
          created_at?: string
          id?: string
          inv_60_second?: number
          inv_fj_call?: number
          inv_leads_propios?: number
          leads_cerrados?: number
          leads_cerrados_60_second?: number
          leads_cerrados_fj_call?: number
          leads_cerrados_leads_propios?: number
          leads_recibidos?: number
          leads_recibidos_60_second?: number
          leads_recibidos_fj_call?: number
          leads_recibidos_leads_propios?: number
          pct_cierre_60_second?: number
          pct_cierre_fj_call?: number
          pct_cierre_leads_propios?: number
          semana: string
        }
        Update: {
          agente?: string
          created_at?: string
          id?: string
          inv_60_second?: number
          inv_fj_call?: number
          inv_leads_propios?: number
          leads_cerrados?: number
          leads_cerrados_60_second?: number
          leads_cerrados_fj_call?: number
          leads_cerrados_leads_propios?: number
          leads_recibidos?: number
          leads_recibidos_60_second?: number
          leads_recibidos_fj_call?: number
          leads_recibidos_leads_propios?: number
          pct_cierre_60_second?: number
          pct_cierre_fj_call?: number
          pct_cierre_leads_propios?: number
          semana?: string
        }
        Relationships: []
      }
      agent_profiles: {
        Row: {
          agente: string
          avatar_url: string | null
          created_at: string
          id: string
        }
        Insert: {
          agente: string
          avatar_url?: string | null
          created_at?: string
          id?: string
        }
        Update: {
          agente?: string
          avatar_url?: string | null
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      agent_teams: {
        Row: {
          agente: string
          created_at: string
          equipo_id: string
          id: string
        }
        Insert: {
          agente: string
          created_at?: string
          equipo_id: string
          id?: string
        }
        Update: {
          agente?: string
          created_at?: string
          equipo_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_teams_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
        ]
      }
      agentes: {
        Row: {
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      discord_sync_state: {
        Row: {
          channel_id: string
          id: string
          last_message_id: string | null
          updated_at: string
        }
        Insert: {
          channel_id: string
          id?: string
          last_message_id?: string | null
          updated_at?: string
        }
        Update: {
          channel_id?: string
          id?: string
          last_message_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      equipos: {
        Row: {
          color: string | null
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      investment_goals: {
        Row: {
          created_at: string
          id: string
          mes: string
          meta: number
        }
        Insert: {
          created_at?: string
          id?: string
          mes: string
          meta?: number
        }
        Update: {
          created_at?: string
          id?: string
          mes?: string
          meta?: number
        }
        Relationships: []
      }
      polizas: {
        Row: {
          agente: string
          cliente: string | null
          created_at: string
          empresa: string | null
          forma_pago: string | null
          id: string
          monto: number
          tipo_poliza: string | null
        }
        Insert: {
          agente: string
          cliente?: string | null
          created_at?: string
          empresa?: string | null
          forma_pago?: string | null
          id?: string
          monto: number
          tipo_poliza?: string | null
        }
        Update: {
          agente?: string
          cliente?: string | null
          created_at?: string
          empresa?: string | null
          forma_pago?: string | null
          id?: string
          monto?: number
          tipo_poliza?: string | null
        }
        Relationships: []
      }
      team_goals: {
        Row: {
          created_at: string
          id: string
          mes: string
          meta: number
        }
        Insert: {
          created_at?: string
          id?: string
          mes: string
          meta?: number
        }
        Update: {
          created_at?: string
          id?: string
          mes?: string
          meta?: number
        }
        Relationships: []
      }
      team_metas: {
        Row: {
          created_at: string
          equipo_id: string
          id: string
          mes: string
          meta: number
        }
        Insert: {
          created_at?: string
          equipo_id: string
          id?: string
          mes: string
          meta?: number
        }
        Update: {
          created_at?: string
          equipo_id?: string
          id?: string
          mes?: string
          meta?: number
        }
        Relationships: [
          {
            foreignKeyName: "team_metas_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
        ]
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
