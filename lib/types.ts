export interface Transacao {
  id: string
  created_at: string
  updated_at: string
  cliente: string
  cliente_id?: string | null
  // Campo populado via JOIN com a tabela clientes (quando cliente_id está preenchido)
  clientes?: { nome: string; cidade: string } | null
  marca_cimento: string
  quantidade_sacos: number
  valor_por_saco: number
  valor_transferido: number
  lucro_esperado: number
  data_transferencia: string   // YYYY-MM-DD
  data_retorno: string | null  // YYYY-MM-DD ou null
  observacoes: string
}

export type Status = 'pendente' | 'atrasado' | 'retornado'

export interface TransacaoComStatus extends Transacao {
  status: Status
  dias_em_aberto: number
}

export interface Metrics {
  total_investido_pendente: number
  total_a_receber: number
  lucro_recebido: number
  qtd_atrasadas: number
  qtd_nao_pagos: number
  qtd_total: number
}

export interface TransacaoInput {
  cliente: string
  cliente_id?: string | null
  marca_cimento: string
  quantidade_sacos: number
  valor_por_saco: number
  lucro_esperado: number
  data_transferencia: string
  observacoes?: string
}

// ---- Clientes ----

export interface Cliente {
  id: string
  created_at: string
  updated_at: string
  nome: string
  telefone: string | null
  email: string | null
  cidade: string
  ativo: boolean
}

export interface ClienteInput {
  nome: string
  telefone?: string
  email?: string
  cidade: string
}
