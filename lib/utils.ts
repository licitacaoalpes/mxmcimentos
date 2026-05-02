import type { Transacao, TransacaoComStatus, Status, Metrics } from './types'

// Dias sem retorno para considerar uma transação como "atrasada"
// Para alterar: mude este valor e faça redeploy
export const DIAS_ATRASADO = 7

export const MARCAS_CIMENTO = [
  'Votoran', 'Itambé', 'Cauê', 'Nassau',
  'CP II', 'CP III', 'CP IV', 'Votorantim', 'Outro',
]

export function diasDesde(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / 86_400_000)
}

export function getStatus(t: Transacao): Status {
  if (t.data_retorno) return 'retornado'
  if (diasDesde(t.data_transferencia) >= DIAS_ATRASADO) return 'atrasado'
  return 'pendente'
}

export function toComStatus(t: Transacao): TransacaoComStatus {
  return {
    ...t,
    status: getStatus(t),
    dias_em_aberto: diasDesde(t.data_transferencia),
  }
}

export function calcularMetrics(txs: TransacaoComStatus[]): Metrics {
  const pendentes = txs.filter(t => t.status !== 'retornado')
  const retornadas = txs.filter(t => t.status === 'retornado')
  return {
    total_investido_pendente: pendentes.reduce((s, t) => s + t.valor_transferido, 0),
    total_a_receber: pendentes.reduce((s, t) => s + t.valor_transferido + t.lucro_esperado, 0),
    lucro_recebido: retornadas.reduce((s, t) => s + t.lucro_esperado, 0),
    qtd_atrasadas: txs.filter(t => t.status === 'atrasado').length,
    qtd_nao_pagos: pendentes.length,
    qtd_total: txs.length,
  }
}

export function brl(v: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v)
}

export function fmtDate(s: string | null | undefined): string {
  if (!s) return '—'
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}
