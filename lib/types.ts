export interface Pagamento {
  id: string
  created_at: string
  transacao_id: string
  valor: number
  data_pagamento: string  // YYYY-MM-DD
  observacoes: string
}

export interface Transacao {
  id: string
  created_at: string
  updated_at: string
  cliente: string
  cliente_id?: string | null
  clientes?: { nome: string; cidade: string } | null
  marca_cimento: string
  quantidade_sacos: number
  valor_por_saco: number
  valor_transferido: number
  lucro_esperado: number
  valor_recebido: number     // soma dos pagamentos (gerenciado por trigger)
  data_transferencia: string // YYYY-MM-DD
  data_retorno: string | null
  observacoes: string
  pagamentos?: Pagamento[]
}

export type Status = 'pendente' | 'parcial' | 'parcial_atrasado' | 'atrasado' | 'retornado'

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
  valor_em_aberto: number
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

export interface PagamentoInput {
  valor: number
  data_pagamento: string
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
