'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell,
} from 'recharts'
import type { Transacao, TransacaoComStatus } from '@/lib/types'
import { toComStatus, brl, DIAS_ATRASADO } from '@/lib/utils'
import { useTheme } from './ThemeProvider'

interface TxEnriquecida extends TransacaoComStatus {
  clientes?: { nome: string; cidade: string } | null
}

const CHART_COLORS = {
  indigo:  '#6366F1',
  emerald: '#10B981',
  amber:   '#F59E0B',
  red:     '#F87171',
  cyan:    '#22D3EE',
  violet:  '#A78BFA',
}

const PERIODOS = [
  { label: '30d',   dias: 30    },
  { label: '90d',   dias: 90    },
  { label: '6 m',   dias: 180   },
  { label: '1 ano', dias: 365   },
  { label: 'Tudo',  dias: 99999 },
]

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function fmtMes(s: string) {
  const [y, m] = s.split('-')
  return `${MESES[+m - 1]}/${y.slice(2)}`
}

function groupByKey<T>(arr: T[], fn: (t: T) => string): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, t) => {
    const k = fn(t)
    ;(acc[k] = acc[k] ?? []).push(t)
    return acc
  }, {})
}

function brk(v: number) {
  return v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
}

function BrlTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; fill: string }[]; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-4 py-3 text-sm min-w-[160px]"
      style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border-2)', boxShadow: 'var(--c-modal-shadow)' }}>
      {label && (
        <p className="font-bold mb-2 text-[10px] uppercase tracking-widest" style={{ color: 'var(--c-text-4)' }}>
          {label}
        </p>
      )}
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.fill }} />
            <span className="text-xs" style={{ color: 'var(--c-text-2)' }}>{p.name}</span>
          </div>
          <span className="font-extrabold tabular-nums" style={{ color: 'var(--c-text)' }}>
            {p.value > 999 ? brl(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

function KpiCard({
  label, value, sub, accent, textColor,
}: {
  label: string; value: string; sub?: string; accent?: string; textColor?: string
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 transition-transform duration-200 hover:-translate-y-0.5"
      style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
      {accent && (
        <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background: accent }} />
      )}
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-10 pointer-events-none"
        style={{ background: accent }} />
      <p className="text-[10px] font-bold uppercase tracking-widest mb-3 pl-1" style={{ color: 'var(--c-text-4)' }}>
        {label}
      </p>
      <p className="text-[24px] font-extrabold leading-none tracking-tight pl-1"
        style={{ color: textColor ?? 'var(--c-text)' }}>
        {value}
      </p>
      {sub && (
        <p className="text-[11px] mt-2 pl-1 font-medium" style={{ color: 'var(--c-text-4)' }}>{sub}</p>
      )}
    </div>
  )
}

function Panel({ title, children, className = '' }: {
  title: string; children: React.ReactNode; className?: string
}) {
  return (
    <div className={`rounded-2xl p-5 sm:p-6 ${className}`}
      style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
      <h3 className="text-[10px] font-bold uppercase tracking-widest mb-5" style={{ color: 'var(--c-text-4)' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[160px]">
      <p className="text-sm" style={{ color: 'var(--c-text-4)' }}>Sem dados no período</p>
    </div>
  )
}

export default function Analytics() {
  const { theme } = useTheme()
  const [txs, setTxs] = useState<TxEnriquecida[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState(365)

  const grid = theme === 'dark' ? 'rgba(59,130,246,0.07)' : 'rgba(59,130,246,0.08)'
  const tickFill = theme === 'dark' ? '#3D5C80' : '#7090A8'
  const cursorFill = theme === 'dark' ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.04)'

  useEffect(() => {
    fetch('/api/transacoes')
      .then(r => r.json())
      .then((data: unknown[]) => {
        if (Array.isArray(data)) {
          setTxs(data.map(t => toComStatus(t as Transacao)) as TxEnriquecida[])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const filtradas = useMemo(() => {
    if (periodo >= 99999) return txs
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - periodo)
    const cutStr = cutoff.toISOString().slice(0, 10)
    return txs.filter(t => t.data_transferencia >= cutStr)
  }, [txs, periodo])

  const calc = useMemo(() => {
    if (!filtradas.length) return null

    const retornadas = filtradas.filter(t => t.status === 'retornado')
    const pendentes = filtradas.filter(t => t.status !== 'retornado')
    const totalInvestido = filtradas.reduce((s, t) => s + t.valor_transferido, 0)
    const lucroRealizado = retornadas.reduce((s, t) => s + t.lucro_esperado, 0)
    const ticketMedio = totalInvestido / filtradas.length
    const totalAReceber = pendentes.reduce((s, t) => s + t.valor_transferido + t.lucro_esperado, 0)

    const comRetorno = filtradas.filter(t => t.data_retorno)
    const tempoMedio =
      comRetorno.length > 0
        ? comRetorno.reduce((s, t) => {
            return s + Math.floor(
              (new Date(t.data_retorno!).getTime() - new Date(t.data_transferencia).getTime()) / 86400000
            )
          }, 0) / comRetorno.length
        : null

    const statusData = [
      { name: 'Retornado', value: retornadas.length, color: CHART_COLORS.emerald },
      { name: 'Pendente',  value: filtradas.filter(t => t.status === 'pendente').length, color: CHART_COLORS.amber },
      { name: 'Atrasado',  value: filtradas.filter(t => t.status === 'atrasado').length, color: CHART_COLORS.red },
    ].filter(s => s.value > 0)

    const byMes = groupByKey(filtradas, t => t.data_transferencia.slice(0, 7))
    const mesData = Object.entries(byMes)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, list]) => ({
        mes: fmtMes(mes),
        Investido: list.reduce((s, t) => s + t.valor_transferido, 0),
        Lucro: list.filter(t => t.status === 'retornado').reduce((s, t) => s + t.lucro_esperado, 0),
      }))

    const byCliente = groupByKey(filtradas, t => t.cliente)
    const clienteData = Object.entries(byCliente)
      .map(([nome, list]) => ({
        nome: nome.length > 20 ? nome.slice(0, 18) + '…' : nome,
        Investido: list.reduce((s, t) => s + t.valor_transferido, 0),
        Qtd: list.length,
      }))
      .sort((a, b) => b.Investido - a.Investido)
      .slice(0, 7)

    const byMarca = groupByKey(filtradas, t => t.marca_cimento)
    const marcaData = Object.entries(byMarca)
      .map(([marca, list]) => ({
        marca,
        Investido: list.reduce((s, t) => s + t.valor_transferido, 0),
        Sacos: list.reduce((s, t) => s + t.quantidade_sacos, 0),
      }))
      .sort((a, b) => b.Investido - a.Investido)

    const cidadeMap = filtradas.reduce<Record<string, number>>((acc, t) => {
      const c = (t as TxEnriquecida).clientes?.cidade ?? 'Sem vínculo'
      acc[c] = (acc[c] ?? 0) + t.valor_transferido
      return acc
    }, {})
    const hasLinked = Object.keys(cidadeMap).some(k => k !== 'Sem vínculo')
    const cidadeData = Object.entries(cidadeMap)
      .map(([cidade, Investido]) => ({ cidade, Investido }))
      .sort((a, b) => b.Investido - a.Investido)
      .filter(c => c.cidade !== 'Sem vínculo' || hasLinked)

    return {
      kpis: {
        totalInvestido, lucroRealizado, totalAReceber, ticketMedio, tempoMedio,
        total: filtradas.length,
        roi: totalInvestido > 0 ? (lucroRealizado / totalInvestido) * 100 : 0,
      },
      statusData, mesData, clienteData, marcaData, cidadeData,
    }
  }, [filtradas])

  const pieTooltipStyle = {
    borderRadius: 12,
    border: '1px solid var(--c-border-2)',
    background: 'var(--c-elevated)',
    fontSize: 12,
    boxShadow: 'var(--c-modal-shadow)',
    color: 'var(--c-text)',
  }

  return (
    <div className="space-y-5">

      {/* Cabeçalho + seletor de período */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--c-text)' }}>Análises</h2>
          <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--c-text-4)' }}>
            {filtradas.length} transação(ões) no período selecionado
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl p-1"
          style={{ background: 'var(--c-accent)', border: '1px solid var(--c-border)' }}>
          {PERIODOS.map(({ label, dias }) => (
            <button key={label} onClick={() => setPeriodo(dias)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
              style={
                periodo === dias
                  ? { background: 'var(--c-blue-d)', color: '#fff', boxShadow: '0 0 12px rgba(59,130,246,0.3)' }
                  : { color: 'var(--c-text-3)' }
              }>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl h-28 animate-pulse"
              style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }} />
          ))}
        </div>
      )}

      {!loading && !calc && (
        <div className="rounded-2xl p-16 text-center"
          style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
          <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'var(--c-accent)' }}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              style={{ color: 'var(--c-text-3)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="font-bold text-base" style={{ color: 'var(--c-text)' }}>Nenhuma transação no período</p>
          <p className="text-sm mt-1" style={{ color: 'var(--c-text-4)' }}>Ajuste o filtro acima ou cadastre transações.</p>
        </div>
      )}

      {!loading && calc && (
        <>
          {/* KPIs — 5 cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <KpiCard
              label="Total transacionado"
              value={brl(calc.kpis.totalInvestido)}
              sub={`${calc.kpis.total} operação(ões)`}
              accent={CHART_COLORS.indigo}
            />
            <KpiCard
              label="Lucro realizado"
              value={brl(calc.kpis.lucroRealizado)}
              sub={calc.kpis.roi > 0 ? `${calc.kpis.roi.toFixed(1)}% ROI` : 'nenhuma concluída'}
              accent={CHART_COLORS.emerald}
              textColor={CHART_COLORS.emerald}
            />
            <KpiCard
              label="A receber (c/ lucro)"
              value={brl(calc.kpis.totalAReceber)}
              sub="saldo pendente + lucro"
              accent={CHART_COLORS.cyan}
              textColor={CHART_COLORS.cyan}
            />
            <KpiCard
              label="Ticket médio"
              value={brl(calc.kpis.ticketMedio)}
              sub="por transação"
              accent={CHART_COLORS.violet}
            />
            <KpiCard
              label="Tempo médio retorno"
              value={calc.kpis.tempoMedio != null ? `${Math.round(calc.kpis.tempoMedio)}d` : '—'}
              sub={calc.kpis.tempoMedio != null ? `limite: ${DIAS_ATRASADO} dias` : 'nenhuma concluída'}
              accent={CHART_COLORS.amber}
              textColor={
                calc.kpis.tempoMedio != null && calc.kpis.tempoMedio > DIAS_ATRASADO
                  ? CHART_COLORS.red
                  : undefined
              }
            />
          </div>

          {/* Mensal + Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Panel title="Investimento por mês" className="lg:col-span-2">
              {calc.mesData.length === 0 ? <EmptyChart /> : (
                <>
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={calc.mesData} barCategoryGap="32%" barGap={3}>
                      <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                      <XAxis dataKey="mes"
                        tick={{ fontSize: 11, fill: tickFill }}
                        axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={brk}
                        tick={{ fontSize: 10, fill: tickFill }}
                        axisLine={false} tickLine={false} width={38} />
                      <Tooltip content={<BrlTooltip />} cursor={{ fill: cursorFill }} />
                      <Bar dataKey="Investido" name="Investido" fill={CHART_COLORS.indigo} radius={[4,4,0,0]} />
                      <Bar dataKey="Lucro"     name="Lucro"     fill={CHART_COLORS.emerald} radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-5 justify-center mt-1">
                    {[{ c: CHART_COLORS.indigo, l: 'Investido' }, { c: CHART_COLORS.emerald, l: 'Lucro' }].map(x => (
                      <div key={x.l} className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm" style={{ background: x.c }} />
                        <span className="text-[11px] font-medium" style={{ color: 'var(--c-text-3)' }}>{x.l}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Panel>

            <Panel title="Status das operações">
              {calc.statusData.length === 0 ? <EmptyChart /> : (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={calc.statusData} cx="50%" cy="50%"
                        innerRadius={48} outerRadius={72}
                        paddingAngle={3} dataKey="value" strokeWidth={0}>
                        {calc.statusData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => [v, 'transações']}
                        contentStyle={pieTooltipStyle}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2.5 w-full mt-2">
                    {calc.statusData.map(s => (
                      <div key={s.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: s.color, boxShadow: `0 0 6px ${s.color}80` }} />
                          <span className="text-sm font-medium" style={{ color: 'var(--c-text-2)' }}>{s.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold" style={{ color: 'var(--c-text)' }}>{s.value}</span>
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
          </div>

          {/* Clientes + Marcas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Volume por cliente">
              {calc.clienteData.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={Math.max(calc.clienteData.length * 46, 120)}>
                  <BarChart layout="vertical" data={calc.clienteData}
                    margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
                    <XAxis type="number" tickFormatter={brk}
                      tick={{ fontSize: 10, fill: tickFill }}
                      axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="nome" width={96}
                      tick={{ fontSize: 11, fill: tickFill }}
                      axisLine={false} tickLine={false} />
                    <Tooltip content={<BrlTooltip />} cursor={{ fill: cursorFill }} />
                    <Bar dataKey="Investido" name="Investido" fill={CHART_COLORS.indigo}
                      radius={[0,4,4,0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Panel>

            <Panel title="Por marca de cimento">
              {calc.marcaData.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={Math.max(calc.marcaData.length * 46, 120)}>
                  <BarChart layout="vertical" data={calc.marcaData}
                    margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
                    <XAxis type="number" tickFormatter={brk}
                      tick={{ fontSize: 10, fill: tickFill }}
                      axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="marca" width={80}
                      tick={{ fontSize: 12, fill: tickFill }}
                      axisLine={false} tickLine={false} />
                    <Tooltip content={<BrlTooltip />} cursor={{ fill: cursorFill }} />
                    <Bar dataKey="Investido" name="Investido" fill={CHART_COLORS.violet}
                      radius={[0,4,4,0]} barSize={16} />
                    <Bar dataKey="Sacos" name="Sacos" fill="#7C3AED"
                      radius={[0,4,4,0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Panel>
          </div>

          {/* Por cidade */}
          {calc.cidadeData.some(c => c.cidade !== 'Sem vínculo') && (
            <Panel title="Volume por cidade / região">
              <ResponsiveContainer width="100%" height={Math.max(calc.cidadeData.length * 46, 80)}>
                <BarChart layout="vertical" data={calc.cidadeData}
                  margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
                  <XAxis type="number" tickFormatter={brk}
                    tick={{ fontSize: 10, fill: tickFill }}
                    axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="cidade" width={120}
                    tick={{ fontSize: 12, fill: tickFill }}
                    axisLine={false} tickLine={false} />
                  <Tooltip content={<BrlTooltip />} cursor={{ fill: cursorFill }} />
                  <Bar dataKey="Investido" name="Investido" fill={CHART_COLORS.cyan}
                    radius={[0,4,4,0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[10px] font-medium mt-3" style={{ color: 'var(--c-text-4)' }}>
                * Apenas transações com cliente vinculado ao cadastro são computadas por cidade.
              </p>
            </Panel>
          )}

          <p className="text-[11px] font-medium text-right pb-2" style={{ color: 'var(--c-text-4)' }}>
            {filtradas.length} transação(ões) ·{' '}
            {periodo < 99999 ? `últimos ${periodo} dias` : 'todo o histórico'}
          </p>
        </>
      )}
    </div>
  )
}
