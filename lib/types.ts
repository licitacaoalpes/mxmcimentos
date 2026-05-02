export interface Transacao {
  id: string
  created_at: string
  updated_at: string
  cliente: string
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
  qtd_total: number
}

export interface TransacaoInput {
  cliente: string
  marca_cimento: string
  quantidade_sacos: number
  valor_por_saco: number
  lucro_esperado: number
  data_transferencia: string
  observacoes?: string
}
