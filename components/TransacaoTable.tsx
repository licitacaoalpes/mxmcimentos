'use client'

import { useState } from 'react'
import type { TransacaoComStatus, Pagamento } from '@/lib/types'
import { brl, fmtDate, todayIso } from '@/lib/utils'
import StatusBadge from './StatusBadge'

type Filtro = 'todos' | 'pendente' | 'parcial' | 'atrasado' | 'retornado'

interface Props {
  transacoes: TransacaoComStatus[]
  onEdit: (t: TransacaoComStatus) => void
  onDelete: (id: string) => void
  onRegistrarPagamento: (id: string, valor: number, data: string, obs: string) => Promise<void>
  onDeletePagamento: (transacaoId: string, pagamentoId: string) => Promise<void>
  onEditarPagamento: (
    transacaoId: string,
    pagamentoId: string,
    dados: { valor: number; data_pagamento: string; observacoes: string }
  ) => Promise<void>
}

interface EditandoPagamento {
  id: string
  valor: string
  data: string
  obs: string
}

const FILTROS: { key: Filtro; label: string }[] = [
  { key: 'todos', label: 'Todas' },
  { key: 'pendente', label: 'Pendente' },
  { key: 'parcial', label: 'Parcial' },
  { key: 'atrasado', label: 'Atrasado' },
  { key: 'retornado', label: 'Retornado' },
]

const FILTRO_ACTIVE: Record<Filtro, React.CSSProperties> = {
  todos:     { background: 'var(--c-accent-2)', color: 'var(--c-blue-text)', border: '1px solid var(--c-border-2)' },
  pendente:  { background: 'rgba(245,158,11,0.15)', color: 'var(--c-amber-text)', border: '1px solid rgba(245,158,11,0.25)' },
  parcial:   { background: 'rgba(139,92,246,0.15)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.25)' },
  atrasado:  { background: 'rgba(239,68,68,0.15)', color: 'var(--c-red-text)', border: '1px solid rgba(239,68,68,0.25)' },
  retornado: { background: 'rgba(16,185,129,0.15)', color: 'var(--c-green-text)', border: '1px solid rgba(16,185,129,0.25)' },
}

function MiniProgress({ recebido, total }: { recebido: number; total: number }) {
  const pct = total > 0 ? Math.min((recebido / total) * 100, 100) : 0
  return (
    <div className="w-full mt-1.5">
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#8B5CF6,#A78BFA)' }}
        />
      </div>
      <p className="text-[9px] mt-0.5 font-semibold" style={{ color: '#A78BFA' }}>
        {brl(recebido)} · {pct.toFixed(0)}%
      </p>
    </div>
  )
}

function ProgressBar({ recebido, total }: { recebido: number; total: number }) {
  const pct = total > 0 ? Math.min((recebido / total) * 100, 100) : 0
  return (
    <div className="mt-2">
      <div className="flex justify-between text-[10px] font-semibold mb-1" style={{ color: 'var(--c-text-4)' }}>
        <span>{brl(recebido)} recebido</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--c-border)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#8B5CF6,#A78BFA)' }}
        />
      </div>
    </div>
  )
}

export default function TransacaoTable({
  transacoes, onEdit, onDelete, onRegistrarPagamento, onDeletePagamento, onEditarPagamento,
}: Props) {
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [pagModal, setPagModal] = useState<string | null>(null)
  const [valorPag, setValorPag] = useState('')
  const [dataPag, setDataPag] = useState(todayIso())
  const [obsPag, setObsPag] = useState('')
  const [loadingPag, setLoadingPag] = useState(false)
  const [erroPag, setErroPag] = useState('')
  const [editandoPagamento, setEditandoPagamento] = useState<EditandoPagamento | null>(null)
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [erroEdit, setErroEdit] = useState('')

  const txModal = pagModal ? transacoes.find(t => t.id === pagModal) : null
  const valorTotal = txModal ? txModal.valor_transferido + txModal.lucro_esperado : 0
  const saldoRestante = txModal ? valorTotal - (txModal.valor_recebido ?? 0) : 0
  const pagamentosOrdenados: Pagamento[] = txModal?.pagamentos
    ? [...txModal.pagamentos].sort((a, b) => b.data_pagamento.localeCompare(a.data_pagamento))
    : []

  function abrirModal(id: string) {
    const tx = transacoes.find(t => t.id === id)
    if (!tx) return
    const saldo = (tx.valor_transferido + tx.lucro_esperado) - (tx.valor_recebido ?? 0)
    setPagModal(id)
    setValorPag(saldo.toFixed(2))
    setDataPag(todayIso())
    setObsPag('')
    setErroPag('')
  }

  function fecharModal() { setPagModal(null); setErroPag(''); setEditandoPagamento(null); setErroEdit('') }

  async function confirmarPagamento() {
    if (!pagModal) return
    const valor = parseFloat(valorPag.replace(',', '.'))
    if (isNaN(valor) || valor <= 0) { setErroPag('Informe um valor válido.'); return }
    if (valor > saldoRestante + 0.01) { setErroPag(`Valor excede o saldo de ${brl(saldoRestante)}.`); return }
    setLoadingPag(true)
    setErroPag('')
    try {
      await onRegistrarPagamento(pagModal, valor, dataPag, obsPag)
      fecharModal()
    } catch (e: unknown) {
      setErroPag(e instanceof Error ? e.message : 'Erro ao registrar pagamento.')
    } finally {
      setLoadingPag(false)
    }
  }

  async function removerPagamento(transacaoId: string, pagamentoId: string) {
    if (!confirm('Remover este pagamento?')) return
    try { await onDeletePagamento(transacaoId, pagamentoId); fecharModal() } catch { /* atualizado pelo parent */ }
  }

  async function salvarEdicaoPagamento() {
    if (!pagModal || !editandoPagamento) return
    const valor = parseFloat(editandoPagamento.valor.replace(',', '.'))
    if (isNaN(valor) || valor <= 0) { setErroEdit('Informe um valor válido.'); return }
    if (!editandoPagamento.data) { setErroEdit('Informe a data.'); return }
    setLoadingEdit(true)
    setErroEdit('')
    try {
      await onEditarPagamento(pagModal, editandoPagamento.id, {
        valor,
        data_pagamento: editandoPagamento.data,
        observacoes: editandoPagamento.obs,
      })
      fecharModal()
    } catch (e: unknown) {
      setErroEdit(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally {
      setLoadingEdit(false)
    }
  }

  const contagem: Record<Filtro, number> = {
    todos: transacoes.length,
    pendente: transacoes.filter(t => t.status === 'pendente').length,
    parcial: transacoes.filter(t => t.status === 'parcial' || t.status === 'parcial_atrasado').length,
    atrasado: transacoes.filter(t => t.status === 'atrasado').length,
    retornado: transacoes.filter(t => t.status === 'retornado').length,
  }

  const filtradas = filtro === 'todos'
    ? transacoes
    : filtro === 'parcial'
      ? transacoes.filter(t => t.status === 'parcial' || t.status === 'parcial_atrasado')
      : filtro === 'atrasado'
        ? transacoes.filter(t => t.status === 'atrasado')
        : transacoes.filter(t => t.status === filtro)

  const inactiveStyle: React.CSSProperties = { color: 'var(--c-text-3)', border: '1px solid var(--c-border)' }
  const isAtrasado = (s: string) => s === 'atrasado' || s === 'parcial_atrasado'

  return (
    <>
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
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
        {filtradas.map(t => {
          const total = t.valor_transferido + t.lucro_esperado
          const recebido = t.valor_recebido ?? 0
          const temParcial = recebido > 0 && t.status !== 'retornado'
          return (
            <div key={t.id} className="rounded-2xl p-4"
              style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}>

              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1 pr-3">
                  <p className="font-bold text-base leading-tight truncate" style={{ color: 'var(--c-text)' }}>
                    {t.cliente}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-4)' }}>
                    {t.marca_cimento} · {t.quantidade_sacos} sacos · {fmtDate(t.data_transferencia)}
                    <span className="ml-2 font-semibold" style={{ color: isAtrasado(t.status) ? 'var(--c-red-text)' : 'var(--c-text-3)' }}>
                      {t.dias_em_aberto}d
                    </span>
                  </p>
                </div>
                <StatusBadge status={t.status} />
              </div>

              {/* Valores — grid 2x2 */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-xl p-3" style={{ background: 'var(--c-accent)', border: '1px solid var(--c-border)' }}>
                  <p className="text-[9px] uppercase font-bold mb-1" style={{ color: 'var(--c-text-4)' }}>Transferido</p>
                  <p className="text-sm font-bold" style={{ color: 'var(--c-text)' }}>{brl(t.valor_transferido)}</p>
                </div>
                <div className="rounded-xl p-3" style={{
                  background: t.status === 'retornado' ? 'rgba(16,185,129,0.06)' : temParcial ? 'rgba(139,92,246,0.06)' : 'var(--c-accent)',
                  border: `1px solid ${t.status === 'retornado' ? 'rgba(16,185,129,0.15)' : temParcial ? 'rgba(139,92,246,0.15)' : 'var(--c-border)'}`,
                }}>
                  <p className="text-[9px] uppercase font-bold mb-1" style={{ color: 'var(--c-text-4)' }}>
                    {t.status === 'retornado' ? 'Situação' : 'Falta receber'}
                  </p>
                  {t.status === 'retornado' ? (
                    <p className="text-sm font-bold" style={{ color: 'var(--c-green-text)' }}>✓ Recebido</p>
                  ) : temParcial ? (
                    <>
                      <p className="text-sm font-bold" style={{ color: '#A78BFA' }}>{brl(total - recebido)}</p>
                      <p className="text-[9px] mt-0.5 font-medium" style={{ color: 'var(--c-text-4)' }}>de {brl(total)}</p>
                    </>
                  ) : (
                    <p className="text-sm font-bold" style={{ color: 'var(--c-text)' }}>{brl(total)}</p>
                  )}
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}>
                  <p className="text-[9px] uppercase font-bold mb-1" style={{ color: 'var(--c-text-4)' }}>Lucro</p>
                  <p className="text-sm font-bold" style={{ color: 'var(--c-green-text)' }}>{brl(t.lucro_esperado)}</p>
                </div>
                <div className="rounded-xl p-3" style={{
                  background: (temParcial || t.status === 'retornado') ? 'rgba(16,185,129,0.06)' : 'var(--c-accent)',
                  border: `1px solid ${(temParcial || t.status === 'retornado') ? 'rgba(16,185,129,0.12)' : 'var(--c-border)'}`,
                }}>
                  <p className="text-[9px] uppercase font-bold mb-1" style={{ color: 'var(--c-text-4)' }}>Já recebido</p>
                  {(temParcial || t.status === 'retornado')
                    ? <p className="text-sm font-bold" style={{ color: 'var(--c-green-text)' }}>{brl(recebido > 0 ? recebido : total)}</p>
                    : <p className="text-sm font-bold" style={{ color: 'var(--c-text-3)' }}>—</p>
                  }
                </div>
              </div>

              {temParcial && <ProgressBar recebido={recebido} total={total} />}

              {t.observacoes && (
                <p className="text-xs mt-2 italic" style={{ color: 'var(--c-text-4)' }}>"{t.observacoes}"</p>
              )}

              {/* Ações */}
              <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--c-border)' }}>
                <button onClick={() => abrirModal(t.id)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
                  style={t.status === 'retornado'
                    ? { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--c-green-text)' }
                    : { background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#A78BFA' }}>
                  {t.status === 'retornado' ? 'Pagamentos' : '+ Pagamento'}
                </button>
                <button onClick={() => onEdit(t)}
                  className="py-2 px-4 rounded-xl text-xs font-bold cursor-pointer transition-all"
                  style={{ background: 'var(--c-accent)', border: '1px solid var(--c-border-2)', color: 'var(--c-blue-text)' }}>
                  Editar
                </button>
                <button onClick={() => { if (confirm(`Excluir transação de ${t.cliente}?`)) onDelete(t.id) }}
                  className="py-2 px-3 rounded-xl text-xs font-bold cursor-pointer"
                  style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--c-red-text)' }}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Desktop: tabela 7 colunas ─────────────────────── */}
      <div className="hidden lg:block rounded-2xl overflow-hidden"
        style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
        <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '22%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '17%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '14%' }} />
          </colgroup>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--c-border)', background: 'var(--c-thead)' }}>
              {[
                'Cliente',
                'Transferido',
                'Falta receber',
                'Recebido',
                'Lucro',
                'Data · Dias',
                'Status / Ações',
              ].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--c-text-4)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-14 text-center text-sm" style={{ color: 'var(--c-text-4)' }}>
                  Nenhuma transação encontrada.
                </td>
              </tr>
            )}
            {filtradas.map(t => {
              const total = t.valor_transferido + t.lucro_esperado
              const recebido = t.valor_recebido ?? 0
              const temParcial = recebido > 0 && t.status !== 'retornado'
              return (
                <tr key={t.id}
                  style={{ borderBottom: '1px solid var(--c-border)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--c-row-hover)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>

                  {/* Cliente + sub */}
                  <td className="px-4 py-3">
                    <p className="font-bold truncate leading-tight" style={{ color: 'var(--c-text)' }}>{t.cliente}</p>
                    <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--c-text-4)' }}>
                      {t.marca_cimento} · {t.quantidade_sacos} sacos
                    </p>
                  </td>

                  {/* Transferido */}
                  <td className="px-4 py-3">
                    <p className="font-semibold" style={{ color: 'var(--c-text)' }}>{brl(t.valor_transferido)}</p>
                  </td>

                  {/* A receber */}
                  <td className="px-4 py-3">
                    {t.status === 'retornado' ? (
                      <p className="font-semibold" style={{ color: 'var(--c-green-text)' }}>✓ Recebido</p>
                    ) : temParcial ? (
                      <>
                        <p className="font-semibold" style={{ color: '#A78BFA' }}>{brl(total - recebido)}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'var(--c-text-4)' }}>de {brl(total)}</p>
                      </>
                    ) : (
                      <p className="font-semibold" style={{ color: 'var(--c-text)' }}>{brl(total)}</p>
                    )}
                  </td>

                  {/* Recebido / progresso */}
                  <td className="px-4 py-3">
                    {temParcial ? (
                      <div>
                        <MiniProgress recebido={recebido} total={total} />
                      </div>
                    ) : t.status === 'retornado' ? (
                      <p className="text-xs font-bold" style={{ color: 'var(--c-green-text)' }}>
                        {brl(recebido > 0 ? recebido : total)}
                      </p>
                    ) : (
                      <p className="text-xs" style={{ color: 'var(--c-text-4)' }}>—</p>
                    )}
                  </td>

                  {/* Lucro */}
                  <td className="px-4 py-3">
                    <p className="font-bold text-sm" style={{ color: 'var(--c-green-text)' }}>{brl(t.lucro_esperado)}</p>
                  </td>

                  {/* Data · Dias */}
                  <td className="px-4 py-3">
                    <p className="text-sm" style={{ color: 'var(--c-text-2)' }}>{fmtDate(t.data_transferencia)}</p>
                    <p className="text-[11px] mt-0.5 font-semibold"
                      style={{ color: isAtrasado(t.status) ? 'var(--c-red-text)' : 'var(--c-text-4)' }}>
                      {t.dias_em_aberto}d
                    </p>
                  </td>

                  {/* Status + Ações */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2">
                      <StatusBadge status={t.status} />
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => abrirModal(t.id)}
                          className="flex-1 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all text-center"
                          style={t.status === 'retornado'
                            ? { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--c-green-text)' }
                            : { background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)', color: '#A78BFA' }}>
                          {t.status === 'retornado' ? 'Pgtos' : '+ Pgto'}
                        </button>
                        <button onClick={() => onEdit(t)}
                          className="py-1 px-2 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                          style={{ background: 'var(--c-accent)', border: '1px solid var(--c-border-2)', color: 'var(--c-blue-text)' }}>
                          Editar
                        </button>
                        <button onClick={() => { if (confirm(`Excluir transação de ${t.cliente}?`)) onDelete(t.id) }}
                          className="p-1 rounded-lg cursor-pointer transition-all"
                          style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--c-red-text)' }}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Modal: registrar pagamento ─────────────────────── */}
      {pagModal && txModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
          <div className="absolute inset-0"
            style={{ background: 'var(--c-modal-backdrop)', backdropFilter: 'blur(4px)' }}
            onClick={fecharModal} />
          <div className="relative w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border-2)', boxShadow: 'var(--c-modal-shadow)' }}>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold" style={{ color: 'var(--c-text)' }}>
                {txModal.status === 'retornado' ? 'Pagamentos registrados' : 'Registrar pagamento'}
              </h3>
              <button onClick={fecharModal}
                className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer"
                style={{ color: 'var(--c-text-3)', border: '1px solid var(--c-border)' }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Resumo */}
            <div className="rounded-xl p-4 mb-4"
              style={{ background: 'var(--c-accent)', border: '1px solid var(--c-border)' }}>
              <p className="font-bold mb-0.5" style={{ color: 'var(--c-text)' }}>{txModal.cliente}</p>
              <p className="text-xs mb-3" style={{ color: 'var(--c-text-3)' }}>
                {txModal.quantidade_sacos} sacos de {txModal.marca_cimento} · {fmtDate(txModal.data_transferencia)}
              </p>
              <div className="flex items-center gap-4 pb-3" style={{ borderBottom: '1px solid var(--c-border)' }}>
                <div>
                  <p className="text-[10px] uppercase font-bold mb-0.5" style={{ color: 'var(--c-text-4)' }}>Total</p>
                  <p className="text-sm font-extrabold" style={{ color: 'var(--c-text)' }}>{brl(valorTotal)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold mb-0.5" style={{ color: 'var(--c-text-4)' }}>Recebido</p>
                  <p className="text-sm font-bold" style={{ color: '#A78BFA' }}>{brl(txModal.valor_recebido ?? 0)}</p>
                </div>
                <div className="ml-auto">
                  <p className="text-[10px] uppercase font-bold mb-0.5" style={{ color: 'var(--c-text-4)' }}>Faltam</p>
                  <p className="text-base font-extrabold"
                    style={{ color: saldoRestante > 0 ? 'var(--c-amber-text)' : 'var(--c-green-text)' }}>
                    {brl(saldoRestante)}
                  </p>
                </div>
              </div>
              <ProgressBar recebido={txModal.valor_recebido ?? 0} total={valorTotal} />
            </div>

            {/* Histórico */}
            {pagamentosOrdenados.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] uppercase font-bold mb-2" style={{ color: 'var(--c-text-4)' }}>
                  Histórico ({pagamentosOrdenados.length})
                </p>
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {pagamentosOrdenados.map(p => {
                    const isEditing = editandoPagamento?.id === p.id
                    if (isEditing) {
                      return (
                        <div key={p.id} className="rounded-lg px-3 py-2.5 space-y-2"
                          style={{ background: 'var(--c-accent)', border: '1px solid rgba(139,92,246,0.3)' }}>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] uppercase font-bold block mb-1" style={{ color: 'var(--c-text-4)' }}>Valor (R$)</label>
                              <input
                                type="number" step="0.01" min="0.01"
                                value={editandoPagamento.valor}
                                onChange={e => setEditandoPagamento(prev => prev ? { ...prev, valor: e.target.value } : null)}
                              />
                            </div>
                            <div>
                              <label className="text-[9px] uppercase font-bold block mb-1" style={{ color: 'var(--c-text-4)' }}>Data</label>
                              <input
                                type="date"
                                value={editandoPagamento.data}
                                onChange={e => setEditandoPagamento(prev => prev ? { ...prev, data: e.target.value } : null)}
                              />
                            </div>
                          </div>
                          <input
                            type="text"
                            value={editandoPagamento.obs}
                            placeholder="Observação (opcional)..."
                            onChange={e => setEditandoPagamento(prev => prev ? { ...prev, obs: e.target.value } : null)}
                          />
                          {erroEdit && (
                            <p className="text-xs font-medium" style={{ color: 'var(--c-red-text)' }}>{erroEdit}</p>
                          )}
                          <div className="flex gap-1.5">
                            <button onClick={salvarEdicaoPagamento} disabled={loadingEdit}
                              className="flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-60"
                              style={{ background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)', color: '#fff' }}>
                              {loadingEdit ? 'Salvando…' : 'Salvar'}
                            </button>
                            <button onClick={() => { setEditandoPagamento(null); setErroEdit('') }}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                              style={{ border: '1px solid var(--c-border)', color: 'var(--c-text-3)' }}>
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )
                    }
                    return (
                      <div key={p.id} className="flex items-center justify-between rounded-lg px-3 py-2"
                        style={{ background: 'var(--c-accent)', border: '1px solid var(--c-border)' }}>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold" style={{ color: 'var(--c-green-text)' }}>{brl(p.valor)}</span>
                          <span className="text-xs ml-2" style={{ color: 'var(--c-text-3)' }}>{fmtDate(p.data_pagamento)}</span>
                          {p.observacoes && (
                            <span className="text-xs ml-1.5 italic truncate block" style={{ color: 'var(--c-text-4)' }}>
                              {p.observacoes}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            onClick={() => {
                              setErroEdit('')
                              setEditandoPagamento({ id: p.id, valor: p.valor.toString(), data: p.data_pagamento, obs: p.observacoes ?? '' })
                            }}
                            className="w-6 h-6 rounded flex items-center justify-center cursor-pointer"
                            style={{ color: 'var(--c-blue-text)', border: '1px solid rgba(59,130,246,0.2)' }}
                            title="Editar">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => removerPagamento(txModal.id, p.id)}
                            className="w-6 h-6 rounded flex items-center justify-center cursor-pointer"
                            style={{ color: 'var(--c-red-text)', border: '1px solid rgba(239,68,68,0.2)' }}
                            title="Remover">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Formulário — escondido quando já quitado */}
            {saldoRestante <= 0 && (
              <div className="rounded-xl px-4 py-3 mb-4 text-center"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <p className="text-xs font-semibold" style={{ color: 'var(--c-green-text)' }}>
                  ✓ Transação totalmente quitada
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--c-text-4)' }}>
                  Exclua um pagamento acima para corrigir o valor.
                </p>
              </div>
            )}
            <div className="space-y-3" style={{ display: saldoRestante > 0 ? undefined : 'none' }}>
              <p className="text-[10px] uppercase font-bold" style={{ color: 'var(--c-text-4)' }}>Novo pagamento</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--c-text-2)' }}>
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={saldoRestante}
                    value={valorPag}
                    onChange={e => setValorPag(e.target.value)}
                    placeholder={saldoRestante.toFixed(2)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--c-text-2)' }}>
                    Data
                  </label>
                  <input type="date" value={dataPag} onChange={e => setDataPag(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--c-text-2)' }}>
                  Observação <span style={{ color: 'var(--c-text-4)' }}>(opcional)</span>
                </label>
                <input
                  type="text"
                  value={obsPag}
                  onChange={e => setObsPag(e.target.value)}
                  placeholder="PIX, dinheiro, parcela..."
                />
              </div>
              {erroPag && (
                <p className="text-xs font-medium" style={{ color: 'var(--c-red-text)' }}>{erroPag}</p>
              )}
            </div>

            <div className="flex gap-2 mt-5">
              {saldoRestante > 0 && (
                <button onClick={confirmarPagamento} disabled={loadingPag}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer disabled:opacity-60 transition-all"
                  style={{ background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)', boxShadow: '0 0 20px rgba(139,92,246,0.2)' }}>
                  {loadingPag ? 'Registrando…' : 'Registrar pagamento'}
                </button>
              )}
              <button onClick={fecharModal}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all"
                style={{ color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
