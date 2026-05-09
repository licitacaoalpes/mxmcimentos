'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, RadialBarChart, RadialBar,
  LineChart, Line, Area, AreaChart,
} from 'recharts'
import type { Transacao, TransacaoComStatus } from '@/lib/types'
import { toComStatus, brl, DIAS_ATRASADO } from '@/lib/utils'
import { useTheme } from './ThemeProvider'

interface TxEnriquecida extends TransacaoComStatus {
  clientes?: { nome: string; cidade: string } | null
}

const C = {
  indigo:      '#6366F1',
  emerald:     '#10B981',
  amber:       '#F59E0B',
  red:         '#EF4444',
  orange:      '#F97316',
  violet:      '#8B5CF6',
  violetLight: '#A78BFA',
  cyan:        '#22D3EE',
  pink:        '#EC4899',
  teal:        '#14B8A6',
}

const PIE_PALETTE = [C.indigo, C.emerald, C.amber, C.violet, C.cyan, C.orange, C.pink, C.teal]

const STATUS_CFG = [
  { key: 'retornado',       label: 'Retornado',        color: C.emerald },
  { key: 'pendente',        label: 'Pendente',          color: C.amber },
  { key: 'parcial',         label: 'Parcial',           color: C.violet },
  { key: 'parcial_atrasado',label: 'Parcial Atrasado',  color: C.orange },
  { key: 'atrasado',        label: 'Atrasado',          color: C.red },
]

const PERIODOS = [
  { label: 'Mês',  dias: -1    }, // mês corrente (do dia 1 até hoje)
  { label: '30d',  dias: 30    },
  { label: '90d',  dias: 90    },
  { label: '6m',   dias: 180   },
  { label: '1a',   dias: 365   },
  { label: 'Tudo', dias: 99999 },
]

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
function fmtMes(s: string) { const [y, m] = s.split('-'); return `${MESES[+m-1]}/${y.slice(2)}` }
function brk(v: number) { return v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v) }
function nfmt(v: number) { return v.toLocaleString('pt-BR') }
function groupByKey<T>(arr: T[], fn: (t: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, t) => { const k = fn(t); (acc[k] = acc[k] ?? []).push(t); return acc }, {})
}

// Tooltip genérico — detecta por nome se é saco, R$/saco ou valor monetário
function ChartTip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; fill: string }[]; label?: string
}) {
  if (!active || !payload?.length) return null
  function fmt(name: string, v: number) {
    if (/saco|sc/i.test(name)) return `${nfmt(v)} sc`
    if (/R\$\/sc/i.test(name)) return `R$ ${v.toFixed(2)}/sc`
    return v > 999 ? brl(v) : String(v)
  }
  return (
    <div className="rounded-xl px-3.5 py-3 text-sm min-w-[150px]"
      style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border-2)', boxShadow: 'var(--c-modal-shadow)' }}>
      {label && <p className="font-bold mb-2 text-[10px] uppercase tracking-widest" style={{ color: 'var(--c-text-4)' }}>{label}</p>}
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.fill }} />
            <span className="text-[11px]" style={{ color: 'var(--c-text-2)' }}>{p.name}</span>
          </div>
          <span className="font-extrabold tabular-nums text-xs" style={{ color: 'var(--c-text)' }}>
            {fmt(p.name, p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

function EmptyChart({ h = 120 }: { h?: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2" style={{ height: h }}>
      <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-xs" style={{ color: 'var(--c-text-4)' }}>Sem dados no período</p>
    </div>
  )
}

function Kpi({ label, value, sub, accent, dim, small }: {
  label: string; value: string; sub?: string; accent: string; dim?: boolean; small?: boolean
}) {
  return (
    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl"
      style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
      <div className="absolute top-0 left-0 w-0.5 h-full rounded-l-xl sm:rounded-l-2xl" style={{ background: accent }} />
      {/* Mobile: layout horizontal (label esquerda, valor direita) */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 sm:hidden">
        <div className="min-w-0 flex-1 pl-1.5">
          <p className="text-[9px] font-bold uppercase tracking-wider leading-tight" style={{ color: 'var(--c-text-4)' }}>{label}</p>
          {sub && <p className="text-[9px] mt-0.5 font-medium leading-tight" style={{ color: 'var(--c-text-4)' }}>{sub}</p>}
        </div>
        <p className="text-sm font-extrabold tabular-nums shrink-0" style={{ color: dim ? 'var(--c-text-3)' : 'var(--c-text)' }}>
          {value}
        </p>
      </div>
      {/* Desktop: layout vertical (original) */}
      <div className="hidden sm:block p-4">
        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-[0.12] pointer-events-none"
          style={{ background: accent }} />
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2 pl-2 leading-tight" style={{ color: 'var(--c-text-4)' }}>
          {label}
        </p>
        <p className={`${small ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'} font-extrabold leading-none tracking-tight pl-2`}
          style={{ color: dim ? 'var(--c-text-3)' : 'var(--c-text)' }}>
          {value}
        </p>
        {sub && (
          <p className="text-[10px] mt-1.5 pl-2 font-medium leading-tight" style={{ color: 'var(--c-text-4)' }}>{sub}</p>
        )}
      </div>
    </div>
  )
}

function Panel({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-4 sm:p-5 ${className}`}
      style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
      {title && (
        <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--c-text-4)' }}>
          {title}
        </p>
      )}
      {children}
    </div>
  )
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <div className="h-px flex-1" style={{ background: 'var(--c-border)' }} />
      <span className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--c-text-4)' }}>
        {label}
      </span>
      <div className="h-px flex-1" style={{ background: 'var(--c-border)' }} />
    </div>
  )
}

export default function Analytics() {
  const { theme } = useTheme()
  const [txs, setTxs]         = useState<TxEnriquecida[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState(365)

  const grid    = theme === 'dark' ? 'rgba(59,130,246,0.07)' : 'rgba(59,130,246,0.08)'
  const tickFill = theme === 'dark' ? '#3D5C80' : '#7090A8'
  const cursor  = theme === 'dark' ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.04)'

  useEffect(() => {
    fetch('/api/transacoes')
      .then(r => r.json())
      .then((data: unknown[]) => {
        if (Array.isArray(data)) setTxs(data.map(t => toComStatus(t as Transacao)) as TxEnriquecida[])
      })
      .finally(() => setLoading(false))
  }, [])

  const filtradas = useMemo(() => {
    if (periodo >= 99999) return txs
    if (periodo === -1) {
      const now = new Date()
      const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
      return txs.filter(t => t.data_transferencia >= inicioMes)
    }
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - periodo)
    return txs.filter(t => t.data_transferencia >= cutoff.toISOString().slice(0, 10))
  }, [txs, periodo])

  const calc = useMemo(() => {
    if (!filtradas.length) return null

    const retornadas = filtradas.filter(t => t.status === 'retornado')
    const pendentes  = filtradas.filter(t => t.status !== 'retornado')
    const atrasadas  = filtradas.filter(t => t.status === 'atrasado' || t.status === 'parcial_atrasado')

    // ── Financeiro ────────────────────────────────────────────
    const totalInvestido = filtradas.reduce((s, t) => s + t.valor_transferido, 0)
    const lucroRealizado = retornadas.reduce((s, t) => s + t.lucro_esperado, 0)
    const totalAReceber  = pendentes.reduce((s, t) => s + (t.valor_transferido + t.lucro_esperado) - (t.valor_recebido ?? 0), 0)
    const ticketMedio    = totalInvestido / filtradas.length
    const totalEmRisco   = atrasadas.reduce((s, t) => s + (t.valor_transferido + t.lucro_esperado) - (t.valor_recebido ?? 0), 0)
    const roi            = totalInvestido > 0 ? (lucroRealizado / totalInvestido) * 100 : 0
    const taxaRetorno    = filtradas.length > 0 ? (retornadas.length / filtradas.length) * 100 : 0

    const comRetorno = filtradas.filter(t => t.data_retorno)
    const tempoMedio = comRetorno.length > 0
      ? comRetorno.reduce((s, t) =>
          s + Math.floor((new Date(t.data_retorno!).getTime() - new Date(t.data_transferencia).getTime()) / 86400000)
        , 0) / comRetorno.length
      : null

    // ── Saúde ─────────────────────────────────────────────────
    const saudeScore = totalInvestido > 0
      ? Math.max(0, Math.round(100 - (totalEmRisco / totalInvestido) * 100)) : 100
    const saudeCor   = saudeScore >= 80 ? C.emerald : saudeScore >= 50 ? C.amber : C.red
    const saudeLabel = saudeScore >= 80 ? 'Boa' : saudeScore >= 50 ? 'Atenção' : 'Crítica'

    // ── Status donut ──────────────────────────────────────────
    const statusData = STATUS_CFG
      .map(s => ({ ...s, value: filtradas.filter(t => t.status === s.key).length }))
      .filter(s => s.value > 0)

    // ── Por mês ───────────────────────────────────────────────
    const byMes = groupByKey(filtradas, t => t.data_transferencia.slice(0, 7))
    const mesData = Object.entries(byMes).sort(([a], [b]) => a.localeCompare(b)).map(([mes, list]) => ({
      mes: fmtMes(mes),
      Investido: list.reduce((s, t) => s + t.valor_transferido, 0),
      Lucro:     list.filter(t => t.status === 'retornado').reduce((s, t) => s + t.lucro_esperado, 0),
    }))

    // ── SACOS: por mês ────────────────────────────────────────
    const sacosMesData = Object.entries(byMes).sort(([a], [b]) => a.localeCompare(b)).map(([mes, list]) => ({
      mes: fmtMes(mes),
      Sacos: list.reduce((s, t) => s + t.quantidade_sacos, 0),
    }))

    // ── SACOS: totais e médias ────────────────────────────────
    const sacosTotal     = filtradas.reduce((s, t) => s + t.quantidade_sacos, 0)
    const mediaSacos     = sacosTotal / filtradas.length
    const sacosRetornados = retornadas.reduce((s, t) => s + t.quantidade_sacos, 0)

    // Crescimento MoM (últimos 2 meses com dados)
    const mesesOrdenados = Object.entries(byMes).sort(([a], [b]) => a.localeCompare(b))
    let crescimentoMoM: number | null = null
    if (mesesOrdenados.length >= 2) {
      const [, prev] = mesesOrdenados[mesesOrdenados.length - 2]
      const [, curr] = mesesOrdenados[mesesOrdenados.length - 1]
      const sPrev = prev.reduce((s, t) => s + t.quantidade_sacos, 0)
      const sCurr = curr.reduce((s, t) => s + t.quantidade_sacos, 0)
      if (sPrev > 0) crescimentoMoM = ((sCurr - sPrev) / sPrev) * 100
    }

    // ── SACOS: por marca (distribuição) ──────────────────────
    const byMarca = groupByKey(filtradas, t => t.marca_cimento)
    const marcaSacosDistrib = Object.entries(byMarca)
      .map(([marca, list], i) => ({
        marca: marca.length > 16 ? marca.slice(0, 14) + '…' : marca,
        Sacos: list.reduce((s, t) => s + t.quantidade_sacos, 0),
        color: PIE_PALETTE[i % PIE_PALETTE.length],
      }))
      .sort((a, b) => b.Sacos - a.Sacos)

    const melhorMarca = marcaSacosDistrib[0]?.marca ?? '—'

    // ── SACOS: rentabilidade por marca (lucro/saco) ───────────
    const marcaRentabilidade = Object.entries(byMarca)
      .map(([marca, list]) => {
        const sacos = list.reduce((s, t) => s + t.quantidade_sacos, 0)
        const lucro = list.filter(t => t.status === 'retornado').reduce((s, t) => s + t.lucro_esperado, 0)
        const ops   = list.length
        return {
          marca: marca.length > 14 ? marca.slice(0, 12) + '…' : marca,
          'R$/sc': sacos > 0 && lucro > 0 ? parseFloat((lucro / sacos).toFixed(2)) : 0,
          Sacos: sacos,
          Ops: ops,
          Lucro: lucro,
        }
      })
      .filter(m => m['R$/sc'] > 0)
      .sort((a, b) => b['R$/sc'] - a['R$/sc'])

    const melhorMargemMarca = marcaRentabilidade[0]

    // ── SACOS: por cliente ────────────────────────────────────
    const byCliente = groupByKey(filtradas, t => t.cliente)
    const clienteSacosData = Object.entries(byCliente)
      .map(([nome, list]) => ({
        nome: nome.length > 16 ? nome.slice(0, 14) + '…' : nome,
        Sacos: list.reduce((s, t) => s + t.quantidade_sacos, 0),
        Ops:   list.length,
      }))
      .sort((a, b) => b.Sacos - a.Sacos)
      .slice(0, 6)

    // ── Volume financeiro por cliente / marca ─────────────────
    const clienteFinanData = Object.entries(byCliente)
      .map(([nome, list]) => ({
        nome: nome.length > 16 ? nome.slice(0, 14) + '…' : nome,
        Investido: list.reduce((s, t) => s + t.valor_transferido, 0),
      }))
      .sort((a, b) => b.Investido - a.Investido).slice(0, 6)

    const marcaFinanData = Object.entries(byMarca)
      .map(([marca, list]) => ({
        marca: marca.length > 14 ? marca.slice(0, 12) + '…' : marca,
        Sacos:    list.reduce((s, t) => s + t.quantidade_sacos, 0),
        Investido: list.reduce((s, t) => s + t.valor_transferido, 0),
      }))
      .sort((a, b) => b.Sacos - a.Sacos)

    return {
      kpis: { totalInvestido, lucroRealizado, totalAReceber, ticketMedio, tempoMedio, roi,
               total: filtradas.length, taxaRetorno, totalEmRisco },
      sacos: { sacosTotal, mediaSacos, melhorMarca, melhorMargemMarca, crescimentoMoM, sacosRetornados },
      saude: { score: saudeScore, cor: saudeCor, label: saudeLabel },
      statusData, mesData, sacosMesData,
      marcaSacosDistrib, marcaRentabilidade,
      clienteSacosData, clienteFinanData, marcaFinanData,
      qtdAtrasadas: atrasadas.length,
    }
  }, [filtradas])

  if (loading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl sm:rounded-2xl h-12 sm:h-24 animate-pulse"
            style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }} />
        ))}
      </div>
    </div>
  )

  if (!calc) return (
    <div className="rounded-2xl p-12 text-center"
      style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
      <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
        style={{ background: 'var(--c-accent)' }}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--c-text-3)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <p className="font-bold" style={{ color: 'var(--c-text)' }}>Nenhuma transação no período</p>
      <p className="text-sm mt-1" style={{ color: 'var(--c-text-4)' }}>Ajuste o filtro ou cadastre transações.</p>
    </div>
  )

  const pieStyle = {
    borderRadius: 10, border: '1px solid var(--c-border-2)',
    background: 'var(--c-elevated)', fontSize: 12,
    boxShadow: 'var(--c-modal-shadow)', color: 'var(--c-text)',
  }

  const chartH = { sm: 150, md: 170, bar: 36 }

  return (
    <div className="space-y-4 pb-4">

      {/* ── Header + período ──────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--c-text)' }}>Análises</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-4)' }}>
            {filtradas.length} operações · {periodo === -1 ? 'mês atual' : periodo < 99999 ? `últimos ${periodo}d` : 'todo o histórico'}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl p-1"
          style={{ background: 'var(--c-accent)', border: '1px solid var(--c-border)' }}>
          {PERIODOS.map(({ label, dias }) => (
            <button key={label} onClick={() => setPeriodo(dias)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
              style={periodo === dias
                ? { background: 'var(--c-blue-d)', color: '#fff', boxShadow: '0 0 12px rgba(59,130,246,0.3)' }
                : { color: 'var(--c-text-3)' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPIs financeiros — 1 col mobile, 3 col sm+ ────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <Kpi label="Total transacionado" value={brl(calc.kpis.totalInvestido)} sub={`${calc.kpis.total} operações`} accent={C.indigo} />
        <Kpi label="Lucro realizado"     value={brl(calc.kpis.lucroRealizado)} sub={`ROI ${calc.kpis.roi.toFixed(1)}%`} accent={C.emerald} />
        <Kpi label="A receber (líquido)" value={brl(calc.kpis.totalAReceber)}  sub="saldo real em aberto" accent={C.cyan} />
        <Kpi label="Ticket médio"        value={brl(calc.kpis.ticketMedio)}    sub="por operação" accent={C.violet} />
        <Kpi
          label="Tempo médio retorno"
          value={calc.kpis.tempoMedio != null ? `${Math.round(calc.kpis.tempoMedio)}d` : '—'}
          sub={calc.kpis.tempoMedio != null ? `limite ${DIAS_ATRASADO}d` : 'nenhuma concluída'}
          accent={calc.kpis.tempoMedio != null && calc.kpis.tempoMedio > DIAS_ATRASADO ? C.red : C.amber}
          dim={calc.kpis.tempoMedio == null}
        />
        <Kpi
          label="Taxa de retorno"
          value={`${calc.kpis.taxaRetorno.toFixed(0)}%`}
          sub={`${filtradas.filter(t => t.status === 'retornado').length} concluídas`}
          accent={calc.kpis.taxaRetorno >= 70 ? C.emerald : calc.kpis.taxaRetorno >= 40 ? C.amber : C.red}
        />
      </div>

      {/* ── Saúde + atrasos ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 sm:p-5 flex items-center gap-4"
          style={{ background: 'var(--c-card)', border: `1px solid ${calc.saude.cor}30` }}>
          <div className="relative shrink-0">
            <ResponsiveContainer width={72} height={72}>
              <RadialBarChart innerRadius={24} outerRadius={36} startAngle={90} endAngle={-270}
                data={[{ value: calc.saude.score, fill: calc.saude.cor }]}>
                <RadialBar dataKey="value" cornerRadius={6} background={{ fill: 'var(--c-border)' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-extrabold" style={{ color: calc.saude.cor }}>{calc.saude.score}</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest mb-1" style={{ color: 'var(--c-text-4)' }}>Saúde da carteira</p>
            <p className="text-xl font-extrabold" style={{ color: calc.saude.cor }}>{calc.saude.label}</p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--c-text-4)' }}>
              {calc.saude.score >= 80 ? 'Carteira equilibrada.' : `${brl(calc.kpis.totalEmRisco)} em risco.`}
            </p>
          </div>
        </div>

        <div className="rounded-2xl p-4 sm:p-5"
          style={{ background: 'var(--c-card)', border: `1px solid ${calc.qtdAtrasadas > 0 ? C.orange + '40' : 'var(--c-border)'}` }}>
          <p className="text-[10px] uppercase font-bold tracking-widest mb-3" style={{ color: 'var(--c-text-4)' }}>Situação dos atrasos</p>
          {calc.qtdAtrasadas === 0 ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: C.emerald + '15' }}>
                <svg className="w-4 h-4" fill="none" stroke={C.emerald} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-bold text-sm" style={{ color: C.emerald }}>Nenhum atraso no período</p>
            </div>
          ) : (
            <div className="space-y-2">
              {STATUS_CFG.filter(s => s.key === 'atrasado' || s.key === 'parcial_atrasado').map(s => {
                const qtd   = filtradas.filter(t => t.status === s.key).length
                if (qtd === 0) return null
                const valor = filtradas.filter(t => t.status === s.key)
                  .reduce((sum, t) => sum + (t.valor_transferido + t.lucro_esperado) - (t.valor_recebido ?? 0), 0)
                return (
                  <div key={s.key} className="flex items-center justify-between rounded-xl px-3 py-2.5"
                    style={{ background: s.color + '10', border: `1px solid ${s.color}25` }}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="text-xs font-semibold" style={{ color: 'var(--c-text-2)' }}>{s.label}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold" style={{ color: s.color }}>{qtd} op.</p>
                      <p className="text-[10px]" style={{ color: 'var(--c-text-4)' }}>{brl(valor)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Status donut + Mensal financeiro ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Panel title="Status das operações">
          {calc.statusData.length === 0 ? <EmptyChart /> : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={calc.statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={60}
                    paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {calc.statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v, 'operações']} contentStyle={pieStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full space-y-2 mt-1">
                {calc.statusData.map(s => (
                  <div key={s.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: s.color, boxShadow: `0 0 5px ${s.color}80` }} />
                      <span className="text-xs font-medium" style={{ color: 'var(--c-text-2)' }}>{s.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold" style={{ color: 'var(--c-text)' }}>{s.value}</span>
                      <span className="text-[10px] w-8 text-right font-bold" style={{ color: 'var(--c-text-4)' }}>
                        {Math.round((s.value / filtradas.length) * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>

        <Panel title="Investimento por mês" className="lg:col-span-2">
          {calc.mesData.length === 0 ? <EmptyChart h={chartH.md} /> : (
            <>
              <ResponsiveContainer width="100%" height={chartH.md}>
                <BarChart data={calc.mesData} barCategoryGap="35%" barGap={3} margin={{ left: -8, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={brk} tick={{ fontSize: 9, fill: tickFill }} axisLine={false} tickLine={false} width={34} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: cursor }} />
                  <Bar dataKey="Investido" name="Investido" fill={C.indigo}  radius={[3,3,0,0]} />
                  <Bar dataKey="Lucro"     name="Lucro"     fill={C.emerald} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 justify-center mt-2">
                {[{ c: C.indigo, l: 'Investido' }, { c: C.emerald, l: 'Lucro realizado' }].map(x => (
                  <div key={x.l} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: x.c }} />
                    <span className="text-[10px] font-medium" style={{ color: 'var(--c-text-3)' }}>{x.l}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Panel>
      </div>

      {/* ════════════════════════════════════════════════════ */}
      <SectionDivider label="Volume de Sacos" />

      {/* ── KPIs de sacos — 2x2 ──────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <Kpi
          label="Total de sacos"
          value={nfmt(calc.sacos.sacosTotal)}
          sub={`${nfmt(calc.sacos.sacosRetornados)} entregues`}
          accent={C.amber}
        />
        <Kpi
          label="Média por operação"
          value={`${Math.round(calc.sacos.mediaSacos)} sc`}
          sub="sacos/transação"
          accent={C.cyan}
        />
        <Kpi
          label="Marca líder"
          value={calc.sacos.melhorMarca}
          sub="maior volume de sacos"
          accent={C.violet}
          small
        />
        <Kpi
          label="Melhor margem/saco"
          value={calc.sacos.melhorMargemMarca ? `R$ ${calc.sacos.melhorMargemMarca['R$/sc'].toFixed(2)}` : '—'}
          sub={calc.sacos.melhorMargemMarca?.marca ?? 'sem retornos ainda'}
          accent={C.emerald}
          dim={!calc.sacos.melhorMargemMarca}
          small
        />
      </div>

      {/* ── Sacos por mês + distribuição por tipo ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* Sacos por mês — área */}
        <Panel title="Sacos transferidos por mês" className="lg:col-span-2">
          {calc.sacosMesData.length === 0 ? <EmptyChart h={chartH.md} /> : (
            <>
              <ResponsiveContainer width="100%" height={chartH.md}>
                <AreaChart data={calc.sacosMesData} margin={{ left: -8, right: 4 }}>
                  <defs>
                    <linearGradient id="sacosGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.amber} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={C.amber} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={brk} tick={{ fontSize: 9, fill: tickFill }} axisLine={false} tickLine={false} width={34} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: cursor }} />
                  <Area dataKey="Sacos" name="Sacos" stroke={C.amber} fill="url(#sacosGrad)"
                    strokeWidth={2} dot={{ r: 3, fill: C.amber, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
              {calc.sacos.crescimentoMoM !== null && (
                <p className="text-[10px] text-right mt-1.5 font-semibold"
                  style={{ color: calc.sacos.crescimentoMoM >= 0 ? C.emerald : C.red }}>
                  {calc.sacos.crescimentoMoM >= 0 ? '↑' : '↓'} {Math.abs(calc.sacos.crescimentoMoM).toFixed(1)}% vs mês anterior
                </p>
              )}
            </>
          )}
        </Panel>

        {/* Distribuição por tipo de cimento */}
        <Panel title="Distribuição por tipo de cimento">
          {calc.marcaSacosDistrib.length === 0 ? <EmptyChart /> : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={calc.marcaSacosDistrib} cx="50%" cy="50%"
                    innerRadius={38} outerRadius={58}
                    paddingAngle={3} dataKey="Sacos" nameKey="marca" strokeWidth={0}>
                    {calc.marcaSacosDistrib.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip
                    formatter={(v: number, name: string) => [`${nfmt(v)} sc`, name]}
                    contentStyle={pieStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full space-y-1.5 mt-2">
                {calc.marcaSacosDistrib.map(m => {
                  const pct = Math.round((m.Sacos / calc.sacos.sacosTotal) * 100)
                  return (
                    <div key={m.marca} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: m.color }} />
                      <span className="text-xs font-medium flex-1 truncate" style={{ color: 'var(--c-text-2)' }}>{m.marca}</span>
                      <span className="text-xs font-extrabold tabular-nums" style={{ color: 'var(--c-text)' }}>
                        {nfmt(m.Sacos)}
                      </span>
                      <span className="text-[10px] w-7 text-right font-bold" style={{ color: 'var(--c-text-4)' }}>{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </Panel>
      </div>

      {/* ── Sacos por cliente + Margem por marca ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        {/* Top clientes por sacos */}
        <Panel title="Top clientes por volume de sacos">
          {calc.clienteSacosData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={Math.min(calc.clienteSacosData.length * chartH.bar + 20, 220)}>
              <BarChart layout="vertical" data={calc.clienteSacosData} margin={{ left: 0, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
                <XAxis type="number" tickFormatter={brk} tick={{ fontSize: 9, fill: tickFill }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="nome" width={84}
                  tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} cursor={{ fill: cursor }} />
                <Bar dataKey="Sacos" name="Sacos" fill={C.amber} radius={[0,3,3,0]} barSize={14}
                  label={{ position: 'right', fontSize: 10, fill: tickFill, formatter: (v: number) => nfmt(v) }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        {/* Lucro por saco por marca (rentabilidade) */}
        <Panel title="Rentabilidade por tipo de cimento (R$/saco)">
          {calc.marcaRentabilidade.length === 0 ? (
            <EmptyChart />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={Math.min(calc.marcaRentabilidade.length * chartH.bar + 20, 220)}>
                <BarChart layout="vertical" data={calc.marcaRentabilidade} margin={{ left: 0, right: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: tickFill }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="marca" width={72}
                    tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: cursor }} />
                  <Bar dataKey="R$/sc" name="R$/sc" fill={C.emerald} radius={[0,3,3,0]} barSize={14}
                    label={{ position: 'right', fontSize: 10, fill: tickFill, formatter: (v: number) => `R$${v.toFixed(2)}` }} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[10px] mt-2 font-medium" style={{ color: 'var(--c-text-4)' }}>
                * Considera apenas operações já retornadas no período.
              </p>
            </>
          )}
        </Panel>
      </div>

      {/* ════════════════════════════════════════════════════ */}
      <SectionDivider label="Por Cliente e Marca" />

      {/* ── Volume financeiro por cliente + por marca ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        <Panel title="Volume financeiro por cliente">
          {calc.clienteFinanData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={Math.min(calc.clienteFinanData.length * chartH.bar + 20, 220)}>
              <BarChart layout="vertical" data={calc.clienteFinanData} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
                <XAxis type="number" tickFormatter={brk} tick={{ fontSize: 9, fill: tickFill }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="nome" width={84}
                  tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} cursor={{ fill: cursor }} />
                <Bar dataKey="Investido" name="Investido" fill={C.indigo} radius={[0,3,3,0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Sacos e investimento por marca">
          {calc.marcaFinanData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={Math.min(calc.marcaFinanData.length * chartH.bar + 20, 220)}>
              <BarChart layout="vertical" data={calc.marcaFinanData} margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
                <XAxis type="number" tickFormatter={brk} tick={{ fontSize: 9, fill: tickFill }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="marca" width={72}
                  tick={{ fontSize: 10, fill: tickFill }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} cursor={{ fill: cursor }} />
                <Bar dataKey="Sacos"     name="Sacos"     fill={C.violet}      radius={[0,3,3,0]} barSize={14} />
                <Bar dataKey="Investido" name="Investido" fill={C.violetLight} radius={[0,3,3,0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </div>

    </div>
  )
}
