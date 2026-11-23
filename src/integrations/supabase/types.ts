
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "clientes": {
                  Row: {
                    "ativo": boolean,"contato": string | null,"created_at": string,"created_by": string | null,"documento": string | null,"id": string,"nome": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ativo"?: boolean,"contato"?: string | null,"created_at"?: string,"created_by"?: string | null,"documento"?: string | null,"id"?: string,"nome": string,"updated_at"?: string
                  }
                  Update: {
                    "ativo"?: boolean,"contato"?: string | null,"created_at"?: string,"created_by"?: string | null,"documento"?: string | null,"id"?: string,"nome"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "clientes_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "colaboradores"
      referencedColumns: ["id"]
    }
                  ]
                },"colaboradores": {
                  Row: {
                    "ativo": boolean,"competencias": (string)[],"created_at": string,"email": string,"horas_dev_semanais": number,"id": string,"jornada_semanal": number,"lider_id": string | null,"nome": string,"papel": Database["public"]['Enums']["papel"],"senioridade": Database["public"]['Enums']["senioridade"] | null,"updated_at": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "ativo"?: boolean,"competencias"?: (string)[],"created_at"?: string,"email": string,"horas_dev_semanais"?: number,"id"?: string,"jornada_semanal"?: number,"lider_id"?: string | null,"nome": string,"papel": Database["public"]['Enums']["papel"],"senioridade"?: Database["public"]['Enums']["senioridade"] | null,"updated_at"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "ativo"?: boolean,"competencias"?: (string)[],"created_at"?: string,"email"?: string,"horas_dev_semanais"?: number,"id"?: string,"jornada_semanal"?: number,"lider_id"?: string | null,"nome"?: string,"papel"?: Database["public"]['Enums']["papel"],"senioridade"?: Database["public"]['Enums']["senioridade"] | null,"updated_at"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "colaboradores_lider_id_fkey"
      columns: ["lider_id"]
isOneToOne: false
      referencedRelation: "colaboradores"
      referencedColumns: ["id"]
    }
                  ]
                },"configuracoes": {
                  Row: {
                    "dia_limite_fechamento": number,"dias_alerta_projeto_sem_atualizacao": number,"id": boolean,"pct_alerta_contrato": number,"pct_interno": number,"pct_planejado": number,"pct_reserva": number,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "dia_limite_fechamento"?: number,"dias_alerta_projeto_sem_atualizacao"?: number,"id"?: boolean,"pct_alerta_contrato"?: number,"pct_interno"?: number,"pct_planejado"?: number,"pct_reserva"?: number,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "dia_limite_fechamento"?: number,"dias_alerta_projeto_sem_atualizacao"?: number,"id"?: boolean,"pct_alerta_contrato"?: number,"pct_interno"?: number,"pct_planejado"?: number,"pct_reserva"?: number,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "configuracoes_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "colaboradores"
      referencedColumns: ["id"]
    }
                  ]
                },"contratos": {
                  Row: {
                    "cliente_id": string,"created_at": string,"created_by": string | null,"horas_contratadas": number | null,"id": string,"nome": string,"observacoes": string | null,"periodicidade_horas": Database["public"]['Enums']["periodicidade_horas"],"status": Database["public"]['Enums']["status_contrato"],"tipo": Database["public"]['Enums']["tipo_contrato"],"updated_at": string,"vigencia_fim": string | null,"vigencia_inicio": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cliente_id": string,"created_at"?: string,"created_by"?: string | null,"horas_contratadas"?: number | null,"id"?: string,"nome": string,"observacoes"?: string | null,"periodicidade_horas"?: Database["public"]['Enums']["periodicidade_horas"],"status"?: Database["public"]['Enums']["status_contrato"],"tipo": Database["public"]['Enums']["tipo_contrato"],"updated_at"?: string,"vigencia_fim"?: string | null,"vigencia_inicio": string
                  }
                  Update: {
                    "cliente_id"?: string,"created_at"?: string,"created_by"?: string | null,"horas_contratadas"?: number | null,"id"?: string,"nome"?: string,"observacoes"?: string | null,"periodicidade_horas"?: Database["public"]['Enums']["periodicidade_horas"],"status"?: Database["public"]['Enums']["status_contrato"],"tipo"?: Database["public"]['Enums']["tipo_contrato"],"updated_at"?: string,"vigencia_fim"?: string | null,"vigencia_inicio"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "contratos_cliente_id_fkey"
      columns: ["cliente_id"]
isOneToOne: false
      referencedRelation: "clientes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "contratos_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "colaboradores"
      referencedColumns: ["id"]
    }
                  ]
                },"contratos_valores": {
                  Row: {
                    "contrato_id": string,"updated_at": string,"valor_hora": number
                  }
                  ComputedFields: never
                  Insert: {
                    "contrato_id": string,"updated_at"?: string,"valor_hora": number
                  }
                  Update: {
                    "contrato_id"?: string,"updated_at"?: string,"valor_hora"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "contratos_valores_contrato_id_fkey"
      columns: ["contrato_id"]
isOneToOne: true
      referencedRelation: "contratos"
      referencedColumns: ["id"]
    }
                  ]
                },"indisponibilidades": {
                  Row: {
                    "colaborador_id": string | null,"created_at": string,"created_by": string | null,"data_fim": string,"data_inicio": string,"descricao": string | null,"horas_por_dia": number | null,"id": string,"localidade": string | null,"tipo": Database["public"]['Enums']["tipo_indisponibilidade"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "colaborador_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"data_fim": string,"data_inicio": string,"descricao"?: string | null,"horas_por_dia"?: number | null,"id"?: string,"localidade"?: string | null,"tipo": Database["public"]['Enums']["tipo_indisponibilidade"],"updated_at"?: string
                  }
                  Update: {
                    "colaborador_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"data_fim"?: string,"data_inicio"?: string,"descricao"?: string | null,"horas_por_dia"?: number | null,"id"?: string,"localidade"?: string | null,"tipo"?: Database["public"]['Enums']["tipo_indisponibilidade"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "indisponibilidades_colaborador_id_fkey"
      columns: ["colaborador_id"]
isOneToOne: false
      referencedRelation: "colaboradores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "indisponibilidades_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "colaboradores"
      referencedColumns: ["id"]
    }
                  ]
                },"projetos": {
                  Row: {
                    "cliente_id": string,"contrato_id": string | null,"created_at": string,"created_by": string | null,"data_fim_prevista": string | null,"data_inicio_prevista": string | null,"id": string,"lider_id": string,"nome": string,"status": Database["public"]['Enums']["status_projeto"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cliente_id": string,"contrato_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"data_fim_prevista"?: string | null,"data_inicio_prevista"?: string | null,"id"?: string,"lider_id": string,"nome": string,"status"?: Database["public"]['Enums']["status_projeto"],"updated_at"?: string
                  }
                  Update: {
                    "cliente_id"?: string,"contrato_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"data_fim_prevista"?: string | null,"data_inicio_prevista"?: string | null,"id"?: string,"lider_id"?: string,"nome"?: string,"status"?: Database["public"]['Enums']["status_projeto"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "projetos_cliente_id_fkey"
      columns: ["cliente_id"]
isOneToOne: false
      referencedRelation: "clientes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projetos_contrato_id_fkey"
      columns: ["contrato_id"]
isOneToOne: false
      referencedRelation: "contratos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projetos_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "colaboradores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projetos_lider_id_fkey"
      columns: ["lider_id"]
isOneToOne: false
      referencedRelation: "colaboradores"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "colaborador_atual_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"eh_lider_tecnico_ativo":
{ Args: { "p_colaborador_id": string }; Returns: boolean
                           },
"lidera":
{ Args: { "p_colaborador_id": string }; Returns: boolean
                           },
"papel_atual":
{ Args: Record<PropertyKey, never>; Returns: Database["public"]['Enums']["papel"]
                           },
"tem_papel":
{ Args: { "papeis": (Database["public"]['Enums']["papel"])[] }; Returns: boolean
                           }
          }
          Enums: {
            "papel": "proprietario"|"lider_tecnico"|"desenvolvedor"|"administrativo","periodicidade_horas": "total"|"mensal","senioridade": "junior"|"pleno"|"senior"|"especialista","status_contrato": "ativo"|"suspenso"|"encerrado","status_projeto": "nao_iniciado"|"em_descoberta"|"planejamento"|"em_execucao"|"em_homologacao"|"bloqueado"|"concluido"|"cancelado","tipo_contrato": "banco_horas"|"escopo_fechado"|"sustentacao"|"outro","tipo_indisponibilidade": "ferias"|"feriado"|"ausencia"|"treinamento"|"outra"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "papel": ["proprietario", "lider_tecnico", "desenvolvedor", "administrativo"],"periodicidade_horas": ["total", "mensal"],"senioridade": ["junior", "pleno", "senior", "especialista"],"status_contrato": ["ativo", "suspenso", "encerrado"],"status_projeto": ["nao_iniciado", "em_descoberta", "planejamento", "em_execucao", "em_homologacao", "bloqueado", "concluido", "cancelado"],"tipo_contrato": ["banco_horas", "escopo_fechado", "sustentacao", "outro"],"tipo_indisponibilidade": ["ferias", "feriado", "ausencia", "treinamento", "outra"]
          }
        }
} as const
