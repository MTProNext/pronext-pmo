
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
    },{
      foreignKeyName: "clientes_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "v_capacidade_colaborador_semana"
      referencedColumns: ["colaborador_id"]
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
    },{
      foreignKeyName: "colaboradores_lider_id_fkey"
      columns: ["lider_id"]
isOneToOne: false
      referencedRelation: "v_capacidade_colaborador_semana"
      referencedColumns: ["colaborador_id"]
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
    },{
      foreignKeyName: "configuracoes_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "v_capacidade_colaborador_semana"
      referencedColumns: ["colaborador_id"]
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
    },{
      foreignKeyName: "contratos_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "v_capacidade_colaborador_semana"
      referencedColumns: ["colaborador_id"]
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
                },"demandas": {
                  Row: {
                    "cliente_id": string | null,"codigo": number,"concluida_em": string | null,"contrato_id": string | null,"created_at": string,"created_by": string | null,"data_entrada": string,"descricao": string | null,"estimativa_horas": number | null,"id": string,"lider_id": string,"prioridade": Database["public"]['Enums']["prioridade"],"projeto_id": string | null,"solicitante": string | null,"status": Database["public"]['Enums']["status_demanda"],"tipo": Database["public"]['Enums']["tipo_demanda"],"titulo": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cliente_id"?: string | null,"codigo"?: never,"concluida_em"?: string | null,"contrato_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"data_entrada"?: string,"descricao"?: string | null,"estimativa_horas"?: number | null,"id"?: string,"lider_id": string,"prioridade"?: Database["public"]['Enums']["prioridade"],"projeto_id"?: string | null,"solicitante"?: string | null,"status"?: Database["public"]['Enums']["status_demanda"],"tipo"?: Database["public"]['Enums']["tipo_demanda"],"titulo": string,"updated_at"?: string
                  }
                  Update: {
                    "cliente_id"?: string | null,"codigo"?: never,"concluida_em"?: string | null,"contrato_id"?: string | null,"created_at"?: string,"created_by"?: string | null,"data_entrada"?: string,"descricao"?: string | null,"estimativa_horas"?: number | null,"id"?: string,"lider_id"?: string,"prioridade"?: Database["public"]['Enums']["prioridade"],"projeto_id"?: string | null,"solicitante"?: string | null,"status"?: Database["public"]['Enums']["status_demanda"],"tipo"?: Database["public"]['Enums']["tipo_demanda"],"titulo"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "demandas_cliente_id_fkey"
      columns: ["cliente_id"]
isOneToOne: false
      referencedRelation: "clientes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "demandas_contrato_id_fkey"
      columns: ["contrato_id"]
isOneToOne: false
      referencedRelation: "contratos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "demandas_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "colaboradores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "demandas_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "v_capacidade_colaborador_semana"
      referencedColumns: ["colaborador_id"]
    },{
      foreignKeyName: "demandas_lider_id_fkey"
      columns: ["lider_id"]
isOneToOne: false
      referencedRelation: "colaboradores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "demandas_lider_id_fkey"
      columns: ["lider_id"]
isOneToOne: false
      referencedRelation: "v_capacidade_colaborador_semana"
      referencedColumns: ["colaborador_id"]
    },{
      foreignKeyName: "demandas_projeto_id_fkey"
      columns: ["projeto_id"]
isOneToOne: false
      referencedRelation: "projetos"
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
      foreignKeyName: "indisponibilidades_colaborador_id_fkey"
      columns: ["colaborador_id"]
isOneToOne: false
      referencedRelation: "v_capacidade_colaborador_semana"
      referencedColumns: ["colaborador_id"]
    },{
      foreignKeyName: "indisponibilidades_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "colaboradores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "indisponibilidades_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "v_capacidade_colaborador_semana"
      referencedColumns: ["colaborador_id"]
    }
                  ]
                },"planejamento_itens": {
                  Row: {
                    "colaborador_id": string,"created_at": string,"created_by": string | null,"demanda_id": string,"faixa": Database["public"]['Enums']["faixa_capacidade"],"horas_planejadas": number,"id": string,"observacao": string | null,"semana_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "colaborador_id": string,"created_at"?: string,"created_by"?: string | null,"demanda_id": string,"faixa"?: Database["public"]['Enums']["faixa_capacidade"],"horas_planejadas": number,"id"?: string,"observacao"?: string | null,"semana_id": string,"updated_at"?: string
                  }
                  Update: {
                    "colaborador_id"?: string,"created_at"?: string,"created_by"?: string | null,"demanda_id"?: string,"faixa"?: Database["public"]['Enums']["faixa_capacidade"],"horas_planejadas"?: number,"id"?: string,"observacao"?: string | null,"semana_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "planejamento_itens_colaborador_id_fkey"
      columns: ["colaborador_id"]
isOneToOne: false
      referencedRelation: "colaboradores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "planejamento_itens_colaborador_id_fkey"
      columns: ["colaborador_id"]
isOneToOne: false
      referencedRelation: "v_capacidade_colaborador_semana"
      referencedColumns: ["colaborador_id"]
    },{
      foreignKeyName: "planejamento_itens_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "colaboradores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "planejamento_itens_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "v_capacidade_colaborador_semana"
      referencedColumns: ["colaborador_id"]
    },{
      foreignKeyName: "planejamento_itens_demanda_id_fkey"
      columns: ["demanda_id"]
isOneToOne: false
      referencedRelation: "demandas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "planejamento_itens_semana_id_fkey"
      columns: ["semana_id"]
isOneToOne: false
      referencedRelation: "semanas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "planejamento_itens_semana_id_fkey"
      columns: ["semana_id"]
isOneToOne: false
      referencedRelation: "v_capacidade_colaborador_semana"
      referencedColumns: ["semana_id"]
    },{
      foreignKeyName: "planejamento_itens_semana_id_fkey"
      columns: ["semana_id"]
isOneToOne: false
      referencedRelation: "v_resumo_semana"
      referencedColumns: ["semana_id"]
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
      foreignKeyName: "projetos_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "v_capacidade_colaborador_semana"
      referencedColumns: ["colaborador_id"]
    },{
      foreignKeyName: "projetos_lider_id_fkey"
      columns: ["lider_id"]
isOneToOne: false
      referencedRelation: "colaboradores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projetos_lider_id_fkey"
      columns: ["lider_id"]
isOneToOne: false
      referencedRelation: "v_capacidade_colaborador_semana"
      referencedColumns: ["colaborador_id"]
    }
                  ]
                },"replanejamentos": {
                  Row: {
                    "colaborador_afetado_id": string | null,"completado_em": string | null,"completado_por": string | null,"created_at": string,"created_by": string | null,"demanda_id": string | null,"descricao_auto": string | null,"horas_antes": number | null,"horas_depois": number | null,"id": string,"impacto": string | null,"motivo": string | null,"pendente": boolean,"planejamento_item_id": string | null,"responsavel_id": string,"semana_id": string,"tipo": Database["public"]['Enums']["tipo_replanejamento"]
                  }
                  ComputedFields: never
                  Insert: {
                    "colaborador_afetado_id"?: string | null,"completado_em"?: string | null,"completado_por"?: string | null,"created_at"?: string,"created_by"?: string | null,"demanda_id"?: string | null,"descricao_auto"?: string | null,"horas_antes"?: number | null,"horas_depois"?: number | null,"id"?: string,"impacto"?: string | null,"motivo"?: string | null,"pendente"?: boolean,"planejamento_item_id"?: string | null,"responsavel_id": string,"semana_id": string,"tipo": Database["public"]['Enums']["tipo_replanejamento"]
                  }
                  Update: {
                    "colaborador_afetado_id"?: string | null,"completado_em"?: string | null,"completado_por"?: string | null,"created_at"?: string,"created_by"?: string | null,"demanda_id"?: string | null,"descricao_auto"?: string | null,"horas_antes"?: number | null,"horas_depois"?: number | null,"id"?: string,"impacto"?: string | null,"motivo"?: string | null,"pendente"?: boolean,"planejamento_item_id"?: string | null,"responsavel_id"?: string,"semana_id"?: string,"tipo"?: Database["public"]['Enums']["tipo_replanejamento"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "replanejamentos_colaborador_afetado_id_fkey"
      columns: ["colaborador_afetado_id"]
isOneToOne: false
      referencedRelation: "colaboradores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "replanejamentos_colaborador_afetado_id_fkey"
      columns: ["colaborador_afetado_id"]
isOneToOne: false
      referencedRelation: "v_capacidade_colaborador_semana"
      referencedColumns: ["colaborador_id"]
    },{
      foreignKeyName: "replanejamentos_completado_por_fkey"
      columns: ["completado_por"]
isOneToOne: false
      referencedRelation: "colaboradores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "replanejamentos_completado_por_fkey"
      columns: ["completado_por"]
isOneToOne: false
      referencedRelation: "v_capacidade_colaborador_semana"
      referencedColumns: ["colaborador_id"]
    },{
      foreignKeyName: "replanejamentos_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "colaboradores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "replanejamentos_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "v_capacidade_colaborador_semana"
      referencedColumns: ["colaborador_id"]
    },{
      foreignKeyName: "replanejamentos_demanda_id_fkey"
      columns: ["demanda_id"]
isOneToOne: false
      referencedRelation: "demandas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "replanejamentos_planejamento_item_id_fkey"
      columns: ["planejamento_item_id"]
isOneToOne: false
      referencedRelation: "planejamento_itens"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "replanejamentos_responsavel_id_fkey"
      columns: ["responsavel_id"]
isOneToOne: false
      referencedRelation: "colaboradores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "replanejamentos_responsavel_id_fkey"
      columns: ["responsavel_id"]
isOneToOne: false
      referencedRelation: "v_capacidade_colaborador_semana"
      referencedColumns: ["colaborador_id"]
    },{
      foreignKeyName: "replanejamentos_semana_id_fkey"
      columns: ["semana_id"]
isOneToOne: false
      referencedRelation: "semanas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "replanejamentos_semana_id_fkey"
      columns: ["semana_id"]
isOneToOne: false
      referencedRelation: "v_capacidade_colaborador_semana"
      referencedColumns: ["semana_id"]
    },{
      foreignKeyName: "replanejamentos_semana_id_fkey"
      columns: ["semana_id"]
isOneToOne: false
      referencedRelation: "v_resumo_semana"
      referencedColumns: ["semana_id"]
    }
                  ]
                },"semanas": {
                  Row: {
                    "confirmada_em": string | null,"confirmada_por": string | null,"created_at": string,"created_by": string | null,"fim": string | null,"id": string,"iniciada_em": string | null,"iniciada_por": string | null,"inicio": string,"observacoes": string | null,"publicada_em": string | null,"publicada_por": string | null,"revisada_em": string | null,"revisada_por": string | null,"status": Database["public"]['Enums']["status_semana"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "confirmada_em"?: string | null,"confirmada_por"?: string | null,"created_at"?: string,"created_by"?: string | null,"fim"?: never,"id"?: string,"iniciada_em"?: string | null,"iniciada_por"?: string | null,"inicio": string,"observacoes"?: string | null,"publicada_em"?: string | null,"publicada_por"?: string | null,"revisada_em"?: string | null,"revisada_por"?: string | null,"status"?: Database["public"]['Enums']["status_semana"],"updated_at"?: string
                  }
                  Update: {
                    "confirmada_em"?: string | null,"confirmada_por"?: string | null,"created_at"?: string,"created_by"?: string | null,"fim"?: never,"id"?: string,"iniciada_em"?: string | null,"iniciada_por"?: string | null,"inicio"?: string,"observacoes"?: string | null,"publicada_em"?: string | null,"publicada_por"?: string | null,"revisada_em"?: string | null,"revisada_por"?: string | null,"status"?: Database["public"]['Enums']["status_semana"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "semanas_confirmada_por_fkey"
      columns: ["confirmada_por"]
isOneToOne: false
      referencedRelation: "colaboradores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "semanas_confirmada_por_fkey"
      columns: ["confirmada_por"]
isOneToOne: false
      referencedRelation: "v_capacidade_colaborador_semana"
      referencedColumns: ["colaborador_id"]
    },{
      foreignKeyName: "semanas_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "colaboradores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "semanas_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "v_capacidade_colaborador_semana"
      referencedColumns: ["colaborador_id"]
    },{
      foreignKeyName: "semanas_iniciada_por_fkey"
      columns: ["iniciada_por"]
isOneToOne: false
      referencedRelation: "colaboradores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "semanas_iniciada_por_fkey"
      columns: ["iniciada_por"]
isOneToOne: false
      referencedRelation: "v_capacidade_colaborador_semana"
      referencedColumns: ["colaborador_id"]
    },{
      foreignKeyName: "semanas_publicada_por_fkey"
      columns: ["publicada_por"]
isOneToOne: false
      referencedRelation: "colaboradores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "semanas_publicada_por_fkey"
      columns: ["publicada_por"]
isOneToOne: false
      referencedRelation: "v_capacidade_colaborador_semana"
      referencedColumns: ["colaborador_id"]
    },{
      foreignKeyName: "semanas_revisada_por_fkey"
      columns: ["revisada_por"]
isOneToOne: false
      referencedRelation: "colaboradores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "semanas_revisada_por_fkey"
      columns: ["revisada_por"]
isOneToOne: false
      referencedRelation: "v_capacidade_colaborador_semana"
      referencedColumns: ["colaborador_id"]
    }
                  ]
                }
          }
          Views: {
            "v_capacidade_colaborador_semana": {
                  Row: {
                    "capacidade_efetiva": number | null,"colaborador_id": string,"colaborador_nome": string,"excede_capacidade": boolean | null,"horas_dev_semanais": number,"horas_indisponiveis": number | null,"horas_interno": number | null,"horas_planejadas": number | null,"horas_planejado": number | null,"horas_reserva": number | null,"lider_id": string | null,"ocupacao_pct": number | null,"papel": Database["public"]['Enums']["papel"],"semana_id": string,"semana_inicio": string,"semana_status": Database["public"]['Enums']["status_semana"]
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "colaboradores_lider_id_fkey"
      columns: ["lider_id"]
isOneToOne: false
      referencedRelation: "colaboradores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "colaboradores_lider_id_fkey"
      columns: ["lider_id"]
isOneToOne: false
      referencedRelation: "v_capacidade_colaborador_semana"
      referencedColumns: ["colaborador_id"]
    }
                  ]
                },"v_resumo_semana": {
                  Row: {
                    "alerta_interno": boolean | null,"alerta_planejado": boolean | null,"alerta_reserva": boolean | null,"capacidade_total": number | null,"colaboradores_acima_capacidade": number | null,"fim": string | null,"horas_interno": number | null,"horas_planejadas": number | null,"horas_planejado": number | null,"horas_reserva": number | null,"inicio": string,"limite_interno": number | null,"limite_planejado": number | null,"limite_reserva": number | null,"ocupacao_pct": number | null,"pct_interno": number,"pct_planejado": number,"pct_reserva": number,"replanejamentos": number | null,"replanejamentos_pendentes": number | null,"semana_id": string,"status": Database["public"]['Enums']["status_semana"]
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                }
          }
          Functions: {
            "alocado_na_demanda":
{ Args: { "p_demanda_id": string }; Returns: boolean
                           },
"alterando_planejamento":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"avancar_semana":
{ Args: { "p_semana_id": string }; Returns: Database["public"]['Enums']["status_semana"]
                           },
"capacidade_efetiva":
{ Args: { "p_colaborador_id": string,"p_semana_inicio": string }; Returns: number
                           },
"colaborador_atual_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"completar_replanejamento":
{ Args: { "p_id": string,"p_impacto": string,"p_motivo": string }; Returns: undefined
                           },
"eh_lider_tecnico_ativo":
{ Args: { "p_colaborador_id": string }; Returns: boolean
                           },
"hoje_brasil":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"horas_indisponiveis":
{ Args: { "p_colaborador_id": string,"p_inicio": string }; Returns: number
                           },
"lidera":
{ Args: { "p_colaborador_id": string }; Returns: boolean
                           },
"papel_atual":
{ Args: Record<PropertyKey, never>; Returns: Database["public"]['Enums']["papel"]
                           },
"replanejar_item":
{ Args: { "p_colaborador_id": string,"p_demanda_id": string,"p_faixa"?: Database["public"]['Enums']["faixa_capacidade"],"p_horas": number,"p_impacto": string,"p_motivo": string,"p_semana_id": string }; Returns: string
                           },
"semana_visivel":
{ Args: { "p_semana_id": string }; Returns: boolean
                           },
"tem_papel":
{ Args: { "papeis": (Database["public"]['Enums']["papel"])[] }; Returns: boolean
                           }
          }
          Enums: {
            "faixa_capacidade": "planejado"|"reserva"|"interno","papel": "proprietario"|"lider_tecnico"|"desenvolvedor"|"administrativo","periodicidade_horas": "total"|"mensal","prioridade": "p1"|"p2"|"p3"|"p4","senioridade": "junior"|"pleno"|"senior"|"especialista","status_contrato": "ativo"|"suspenso"|"encerrado","status_demanda": "nova"|"priorizada"|"planejada"|"em_execucao"|"bloqueada"|"concluida"|"cancelada","status_projeto": "nao_iniciado"|"em_descoberta"|"planejamento"|"em_execucao"|"em_homologacao"|"bloqueado"|"concluido"|"cancelado","status_semana": "rascunho"|"publicada"|"confirmada"|"em_execucao"|"revisada","tipo_contrato": "banco_horas"|"escopo_fechado"|"sustentacao"|"outro","tipo_demanda": "demanda"|"urgencia"|"correcao"|"atividade_interna","tipo_indisponibilidade": "ferias"|"feriado"|"ausencia"|"treinamento"|"outra","tipo_replanejamento": "inclusao"|"alteracao_horas"|"remocao"|"entrada_p1_p2"|"outro"
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
            "faixa_capacidade": ["planejado", "reserva", "interno"],"papel": ["proprietario", "lider_tecnico", "desenvolvedor", "administrativo"],"periodicidade_horas": ["total", "mensal"],"prioridade": ["p1", "p2", "p3", "p4"],"senioridade": ["junior", "pleno", "senior", "especialista"],"status_contrato": ["ativo", "suspenso", "encerrado"],"status_demanda": ["nova", "priorizada", "planejada", "em_execucao", "bloqueada", "concluida", "cancelada"],"status_projeto": ["nao_iniciado", "em_descoberta", "planejamento", "em_execucao", "em_homologacao", "bloqueado", "concluido", "cancelado"],"status_semana": ["rascunho", "publicada", "confirmada", "em_execucao", "revisada"],"tipo_contrato": ["banco_horas", "escopo_fechado", "sustentacao", "outro"],"tipo_demanda": ["demanda", "urgencia", "correcao", "atividade_interna"],"tipo_indisponibilidade": ["ferias", "feriado", "ausencia", "treinamento", "outra"],"tipo_replanejamento": ["inclusao", "alteracao_horas", "remocao", "entrada_p1_p2", "outro"]
          }
        }
} as const
