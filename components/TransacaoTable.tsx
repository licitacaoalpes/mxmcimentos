'use client'

import { useState } from 'react'
import type { TransacaoComStatus, Status } from '@/lib/types'
import { brl, fmtDate, todayIso } from '@/lib/utils'
import StatusBadge from './StatusBadge'

type Filtro = 'todos' | Status

interface Props {
  transacoes: TransacaoComStatus[]
  onEdit: (t: TransacaoComStatus) => void
  onDelete: (id: string) => void
  onMarcarPago: (id: string, dataRetorno: string) => void
}

const FILTROS: { key: Filtro; label: string }[] = [
  { key: 'todos', label: 'Todas' },
  { key: 'pendente', label: 'Pendente' },
  { key: 'atrasado', label: 'Atrasado' },
  { key: 'retornado', label: 'Retornado' },
]

const FILTRO_ACTIVE: Record<Filtro, React.CSSProperties> = {
  todos:     { background: 'var(--c-accent-2)', color: 'var(--c-blue-text)', border: '1px solid var(--c-border-2)' },
  pendente:  { background: 'rgba(245,158,11,0.15)', color: 'var(--c-amber-text)', border: '1px solid rgba(245,158,11,0.25)' },
  atrasado:  { background: 'rgba(239,68,68,0.15)', color: 'var(--c-red-text)', border: '1px solid rgba(239,68,68,0.25)' },
  retornado: { background: 'rgba(16,185,129,0.15)', color: 'var(--c-green-text)', border: '1px solid rgba(16,185,129,0.25)' },
}

export default function TransacaoTable({ transacoes, onEdit, onDelete, onMarcarPago }: Props) {
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [pagoModal, setPagoModal] = useState<string | null>(null)
  const [dataRetorno, setDataRetorno] = useState(todayIso())

  const contagem: Record<Filtro, number> = {
    todos: transacoes.length,
    pendente: transacoes.filter(t => t.status === 'pendente').length,
    atrasado: transacoes.filter(t => t.status === 'atrasado').length,
    retornado: transacoes.filter(t => t.status === 'retornado').length,
  }

  const filtradas = filtro === 'todos' ? transacoes : transacoes.filter(t => t.status === filtro)
  const txPago = pagoModal ? transacoes.find(t => t.id === pagoModal) : null

  function confirmarPago() {
    if (!pagoModal) return
    onMarcarPago(pagoModal, dataRetorno)
    setPagoModal(null)
  }

  const inactiveStyle: React.CSSProperties = { color: 'var(--c-text-3)', border: '1px solid var(--c-border)' }

  return (
    <>
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-3">
        {FILTROS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFiltro(key)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer"
            style={filtro === key ? FILTRO_ACTIVE[key] : inactiveStyle}
          >
            {label}
            <span className="ml-1.5 opacity-60">({contagem[key]})</span>
          </button>
        ))}
      </div>

      {/* ── Mobile: cards ─────────────────────────────────── */}
      <div className="lg:hidden space-y-3">
        {filtradas.length === 0 && (
          <div className="rounded-2xl px-4 py-12 text-center"
            style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
            <p className="text-sm" style={{ color: 'var(--c-text-4)' }}>Nenhuma transação encontrada.</p>
          </div>
        )}
        {filtradas.map(t => (
          <div key={t.id} className="rounded-2xl p-4 transition-all"
            style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0 flex-1 pr-2">
                <p className="font-bold text-base truncate" style={{ color: 'var(--c-text)' }}>{t.cliente}</p>
                <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--c-text-3)' }}>
                  {t.marca_cimento} · {t.quantidade_sacos} sacos · {fmtDate(t.data_transferencia)}
                </p>
              </div>
              <StatusBadge status={t.status} />
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: 'Transferido', value: brl(t.valor_transferido), accent: 'var(--c-accent)', border: 'var(--c-border)', color: 'var(--c-text)' },
                { label: 'Lucro', value: brl(t.lucro_esperado), accent: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.12)', color: 'var(--c-green-text)' },
                {
                  label: 'Dias',
                  value: `${t.dias_em_aberto}d`,
                  accent: t.status === 'atrasado' ? 'rgba(239,68,68,0.06)' : 'var(--c-accent)',
                  border: t.status === 'atrasado' ? 'rgba(239,68,68,0.15)' : 'var(--c-border)',
                  color: t.status === 'atrasado' ? 'var(--c-red-text)' : 'var(--c-text)',
                },
              ].map(c => (
                <div key={c.label} className="rounded-xl p-2.5 text-center"
                  style={{ background: c.accent, border: `1px solid ${c.border}` }}>
                  <p className="text-[9px] uppercase font-bold mb-1" style={{ color: 'var(--c-text-4)' }}>{c.label}</p>
                  <p className="text-sm font-extrabold" style={{ color: c.color }}>{c.value}</p>
                </div>
              ))}
            </div>

            {t.observacoes && (
              <p className="text-xs mb-3 italic" style={{ color: 'var(--c-text-4)' }}>"{t.observacoes}"</p>
            )}

            <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid var(--c-border)' }}>
              {t.status !== 'retornado' && (
                <button
                  onClick={() => { setPagoModal(t.id); setDataRetorno(todayIso()) }}
                  className="flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--c-green-text)' }}
                >
                  ✓ Marcar pago
                </button>
              )}
              <button onClick={() => onEdit(t)}
                className="py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                style={{ background: 'var(--c-accent)', border: '1px solid var(--c-border-2)', color: 'var(--c-blue-text)' }}>
                Editar
              </button>
              <button
                onClick={() => { if (confirm(`Excluir transação de ${t.cliente}?`)) onDelete(t.id) }}
                className="py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--c-red-text)' }}>
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Desktop: tabela ───────────────────────────────── */}
      <div className="hidden lg:block rounded-2xl overflow-hidden"
        style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--c-border)', background: 'var(--c-thead)' }}>
                {['Cliente', 'Cimento', 'Sacos', 'Transferido', 'A receber', 'Lucro', 'Data', 'Dias', 'Status', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                    style={{ color: 'var(--c-text-4)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--c-text-4)' }}>
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              )}
              {filtradas.map(t => (
                <tr key={t.id} className="transition-colors"
                  style={{ borderBottom: '1px solid var(--c-border)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--c-row-hover)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                  <td className="px-4 py-3 font-bold max-w-[140px] truncate" style={{ color: 'var(--c-text)' }}>{t.cliente}</td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--c-text-2)' }}>{t.marca_cimento}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--c-text)' }}>{t.quantidade_sacos}</td>
                  <td className="px-4 py-3 font-semibold whitespace-nowrap" style={{ color: 'var(--c-text)' }}>{brl(t.valor_transferido)}</td>
                  <td className="px-4 py-3 font-semibold whitespace-nowrap" style={{ color: 'var(--c-text)' }}>
                    {brl(t.valor_transferido + t.lucro_esperado)}
                  </td>
                  <td className="px-4 py-3 font-bold whitespace-nowrap" style={{ color: 'var(--c-green-text)' }}>{brl(t.lucro_esperado)}</td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--c-text-2)' }}>{fmtDate(t.data_transferencia)}</td>
                  <td className="px-4 py-3 font-bold whitespace-nowrap"
                    style={{ color: t.status === 'atrasado' ? 'var(--c-red-text)' : 'var(--c-text-2)' }}>
                    {t.dias_em_aberto}d
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {t.status !== 'retornado' && (
                        <button onClick={() => { setPagoModal(t.id); setDataRetorno(todayIso()) }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--c-green-text)' }}>
                          ✓ Pago
                        </button>
                      )}
                      <button onClick={() => onEdit(t)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        style={{ background: 'var(--c-accent)', border: '1px solid var(--c-border-2)', color: 'var(--c-blue-text)' }}>
                        Editar
                      </button>
                      <button onClick={() => { if (confirm(`Excluir transação de ${t.cliente}?`)) onDelete(t.id) }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--c-red-text)' }}>
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal: confirmar recebimento ──────────────────── */}
      {pagoModal && txPago && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
          <div className="absolute inset-0"
            style={{ background: 'var(--c-modal-backdrop)', backdropFilter: 'blur(4px)' }}
            onClick={() => setPagoModal(null)} />
          <div className="relative w-full max-w-sm rounded-2xl p-6"
            style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border-2)', boxShadow: 'var(--c-modal-shadow)' }}>
            <h3 className="text-base font-extrabold mb-4" style={{ color: 'var(--c-text)' }}>Registrar recebimento</h3>

            <div className="rounded-xl p-4 mb-4 space-y-1.5"
              style={{ background: 'var(--c-accent)', border: '1px solid var(--c-border)' }}>
              <p className="font-bold" style={{ color: 'var(--c-text)' }}>{txPago.cliente}</p>
              <p className="text-sm" style={{ color: 'var(--c-text-2)' }}>
                {txPago.quantidade_sacos} sacos de {txPago.marca_cimento}
              </p>
              <div className="flex items-center gap-4 pt-1.5" style={{ borderTop: '1px solid var(--c-border)' }}>
                <div>
                  <p className="text-[10px] uppercase font-bold mb-0.5" style={{ color: 'var(--c-text-4)' }}>Capital</p>
                  <p className="text-sm font-bold" style={{ color: 'var(--c-text)' }}>{brl(txPago.valor_transferido)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold mb-0.5" style={{ color: 'var(--c-text-4)' }}>+ Lucro</p>
                  <p className="text-sm font-bold" style={{ color: 'var(--c-green-text)' }}>{brl(txPago.lucro_esperado)}</p>
                </div>
                <div className="ml-auto">
                  <p className="text-[10px] uppercase font-bold mb-0.5" style={{ color: 'var(--c-text-4)' }}>Total</p>
                  <p className="text-base font-extrabold" style={{ color: 'var(--c-text)' }}>
                    {brl(txPago.valor_transferido + txPago.lucro_esperado)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--c-text-2)' }}>
                Data do recebimento
              </label>
              <input type="date" value={dataRetorno} onChange={e => setDataRetorno(e.target.value)} />
            </div>

            <div className="flex gap-2">
              <button onClick={confirmarPago}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}>
                Confirmar recebimento
              </button>
              <button onClick={() => setPagoModal(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                style={{ color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
