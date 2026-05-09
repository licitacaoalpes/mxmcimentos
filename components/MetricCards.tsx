import type { Metrics } from '@/lib/types'
import { brl } from '@/lib/utils'


interface Props {
  metrics: Metrics
}

interface CardProps {
  label: string
  value: string | number
  sub?: string
  accent: string
  icon: React.ReactNode
}

function Card({ label, value, sub, accent, icon }: CardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 transition-transform duration-200 hover:-translate-y-0.5"
      style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}
    >
      <div
        className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-15 pointer-events-none"
        style={{ background: accent }}
      />
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--c-text-4)' }}>
          {label}
        </p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: accent + '18' }}>
          {icon}
        </div>
      </div>
      <p className="text-[22px] font-extrabold tracking-tight leading-none" style={{ color: 'var(--c-text)' }}>
        {value}
      </p>
      {sub && (
        <p className="text-[11px] mt-1.5 font-medium" style={{ color: 'var(--c-text-4)' }}>{sub}</p>
      )}
    </div>
  )
}

export default function MetricCards({ metrics }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card
        label="Investido pendente"
        value={brl(metrics.total_investido_pendente)}
        sub="capital em aberto"
        accent="#F59E0B"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="#F59E0B" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <Card
        label="Lucro recebido"
        value={brl(metrics.lucro_recebido)}
        sub="ganho confirmado"
        accent="#10B981"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="#10B981" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <Card
        label="A receber ainda"
        value={brl(metrics.valor_em_aberto)}
        sub={`${metrics.qtd_nao_pagos} de ${metrics.qtd_total} em aberto`}
        accent="#8B5CF6"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="#8B5CF6" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        }
      />
      <Card
        label="Atrasos"
        value={metrics.qtd_atrasadas}
        sub={
          metrics.qtd_atrasadas === 0
            ? 'tudo em dia'
            : metrics.qtd_parcial_atrasado > 0
              ? `${metrics.qtd_atrasadas - metrics.qtd_parcial_atrasado} atrasada(s) · ${metrics.qtd_parcial_atrasado} parcial(is)`
              : 'cobrar agora!'
        }
        accent={metrics.qtd_atrasadas > 0 ? '#EF4444' : '#10B981'}
        icon={
          metrics.qtd_atrasadas > 0 ? (
            <svg className="w-4 h-4" fill="none" stroke="#EF4444" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="#10B981" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )
        }
      />
    </div>
  )
}
