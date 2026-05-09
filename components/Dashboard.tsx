'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Transacao, TransacaoComStatus } from '@/lib/types'
import { toComStatus, calcularMetrics } from '@/lib/utils'
import { useTheme } from './ThemeProvider'
import MetricCards from './MetricCards'
import TransacaoTable from './TransacaoTable'
import TransacaoForm from './TransacaoForm'
import ClienteList from './ClienteList'
import Analytics from './Analytics'

type Tab = 'transacoes' | 'clientes' | 'analises'
type View = 'list' | 'form'

const NAV = [
  {
    key: 'transacoes' as Tab,
    label: 'Transações',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    key: 'clientes' as Tab,
    label: 'Clientes',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: 'analises' as Tab,
    label: 'Análises',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
]

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer"
      style={{ color: 'var(--c-sidebar-text)', border: '1px solid transparent' }}
      title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
    >
      {theme === 'dark' ? (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Tema claro
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          Tema escuro
        </>
      )}
    </button>
  )
}

function ThemeToggleIcon() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      className="w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer"
      style={{ color: 'var(--c-text-3)', border: '1px solid var(--c-border)' }}
      title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
    >
      {theme === 'dark' ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('transacoes')
  const [transacoes, setTransacoes] = useState<TransacaoComStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState<View>('list')
  const [editando, setEditando] = useState<TransacaoComStatus | undefined>(undefined)

  const fetchTransacoes = useCallback(async () => {
    try {
      setError('')
      const res = await fetch('/api/transacoes')
      if (res.status === 401) { router.push('/login'); return }
      if (!res.ok) throw new Error()
      const data: Transacao[] = await res.json()
      setTransacoes(data.map(toComStatus))
    } catch {
      setError('Erro ao carregar transações.')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { fetchTransacoes() }, [fetchTransacoes])

  const metrics = useMemo(() => calcularMetrics(transacoes), [transacoes])

  function handleSuccess(t: Transacao) {
    const updated = toComStatus(t)
    setTransacoes(prev => {
      const exists = prev.some(x => x.id === t.id)
      return exists ? prev.map(x => x.id === t.id ? updated : x) : [updated, ...prev]
    })
    setView('list')
    setEditando(undefined)
  }

  async function handleDelete(id: string) {
    setTransacoes(prev => prev.filter(t => t.id !== id))
    try {
      const res = await fetch(`/api/transacoes/${id}`, { method: 'DELETE' })
      if (!res.ok) await fetchTransacoes()
    } catch { await fetchTransacoes() }
  }

  async function handleRegistrarPagamento(id: string, valor: number, data: string, obs: string) {
    const res = await fetch(`/api/transacoes/${id}/pagamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valor, data_pagamento: data, observacoes: obs }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error ?? 'Erro ao registrar pagamento.')
    }
    const updated: Transacao = await res.json()
    setTransacoes(prev => prev.map(t => t.id === id ? toComStatus(updated) : t))
  }

  async function handleDeletePagamento(transacaoId: string, pagamentoId: string) {
    try {
      const res = await fetch(`/api/transacoes/${transacaoId}/pagamentos/${pagamentoId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()
      const updated: Transacao = await res.json()
      setTransacoes(prev => prev.map(t => t.id === transacaoId ? toComStatus(updated) : t))
    } catch { await fetchTransacoes() }
  }

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/login')
  }

  function changeTab(t: Tab) {
    setTab(t)
    setView('list')
    setEditando(undefined)
  }

  const isTransacoes = tab === 'transacoes'

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--c-bg)' }}>

      {/* ── Sidebar desktop ─────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-56 z-30"
        style={{ background: 'var(--c-sidebar)', borderRight: '1px solid var(--c-sidebar-border)' }}
      >
        <div className="p-5 pb-4" style={{ borderBottom: '1px solid var(--c-sidebar-border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--c-blue), var(--c-blue-d))', boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}
            >
              <span className="text-white font-extrabold text-base">M</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-tight truncate">MXM Cimentos</p>
              <p className="text-[10px] font-medium" style={{ color: 'var(--c-sidebar-text)' }}>Gestão financeira</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(item => (
            <button
              key={item.key}
              onClick={() => changeTab(item.key)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer text-left"
              style={
                tab === item.key
                  ? { background: 'var(--c-sidebar-active-bg)', color: 'var(--c-sidebar-active)', border: '1px solid var(--c-sidebar-active-border)' }
                  : { color: 'var(--c-sidebar-text)', border: '1px solid transparent' }
              }
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 space-y-1" style={{ borderTop: '1px solid var(--c-sidebar-border)' }}>
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer"
            style={{ color: 'var(--c-sidebar-text)', border: '1px solid transparent' }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#F87171'; el.style.background = 'rgba(239,68,68,0.08)' }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--c-sidebar-text)'; el.style.background = 'transparent' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        </div>
      </aside>

      {/* ── Header mobile ───────────────────────────────────── */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 h-14 z-30 flex items-center justify-between px-4"
        style={{ background: 'rgba(10,21,36,0.96)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--c-border)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--c-blue), var(--c-blue-d))' }}
          >
            <span className="text-white font-extrabold text-sm">M</span>
          </div>
          <span className="text-sm font-bold text-white">MXM Cimentos</span>
        </div>
        <div className="flex items-center gap-2">
          {isTransacoes && view === 'list' && (
            <button
              onClick={() => { setEditando(undefined); setView('form') }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all cursor-pointer"
              style={{ background: 'var(--c-accent-2)', border: '1px solid var(--c-border-2)' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Nova
            </button>
          )}
          {view === 'form' && (
            <button
              onClick={() => { setView('list'); setEditando(undefined) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
              style={{ color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }}
            >
              ← Voltar
            </button>
          )}
          <ThemeToggleIcon />
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer"
            style={{ color: 'var(--c-text-3)', border: '1px solid var(--c-border)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────── */}
      <main className="flex-1 lg:ml-56 min-h-screen pt-14 lg:pt-0 pb-20 lg:pb-0 overflow-x-hidden">

        <div
          className="hidden lg:flex items-center justify-between px-6 py-4 sticky top-0 z-20"
          style={{ background: 'color-mix(in srgb, var(--c-bg) 90%, transparent)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--c-border)' }}
        >
          <div>
            <h1 className="text-lg font-extrabold" style={{ color: 'var(--c-text)' }}>
              {tab === 'transacoes' && (view === 'form' ? (editando ? 'Editar transação' : 'Nova transação') : 'Transações')}
              {tab === 'clientes' && 'Clientes'}
              {tab === 'analises' && 'Análises'}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--c-text-4)' }}>
              {tab === 'transacoes' && `${transacoes.length} registros`}
              {tab === 'clientes' && 'Cadastro de clientes'}
              {tab === 'analises' && 'Relatórios e gráficos'}
            </p>
          </div>
          {isTransacoes && view === 'list' && (
            <button
              onClick={() => { setEditando(undefined); setView('form') }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all duration-200 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, var(--c-blue), var(--c-blue-d))', boxShadow: '0 0 20px rgba(59,130,246,0.25)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Nova transação
            </button>
          )}
          {view === 'form' && (
            <button
              onClick={() => { setView('list'); setEditando(undefined) }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer"
              style={{ color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }}
            >
              ← Voltar à lista
            </button>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-4 py-5 space-y-4">

          {isTransacoes && (
            <>
              {loading && (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: 'var(--c-border-2)', borderTopColor: 'var(--c-blue)' }} />
                  <p className="text-sm" style={{ color: 'var(--c-text-4)' }}>Carregando transações…</p>
                </div>
              )}

              {error && !loading && (
                <div className="rounded-2xl px-4 py-3 text-sm font-medium flex items-center gap-2"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--c-red-text)' }}>
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {error}{' '}
                  <button onClick={fetchTransacoes} className="underline ml-1">Tentar novamente</button>
                </div>
              )}

              {!loading && !error && (
                <>
                  <MetricCards metrics={metrics} />

                  {metrics.qtd_atrasadas > 0 && view === 'list' && (
                    <div className="rounded-2xl px-4 py-3 text-sm font-medium flex items-center gap-2"
                      style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', color: 'var(--c-red-text)' }}>
                      <svg className="w-4 h-4 shrink-0 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <strong>{metrics.qtd_atrasadas}</strong> transação(ões) atrasada(s) — hora de cobrar!
                    </div>
                  )}

                  {view === 'form' && (
                    <div className="rounded-2xl p-5" style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
                      <TransacaoForm
                        initial={editando}
                        onSuccess={handleSuccess}
                        onCancel={() => { setView('list'); setEditando(undefined) }}
                      />
                    </div>
                  )}

                  {view === 'list' && (
                    <>
                      <TransacaoTable
                        transacoes={transacoes}
                        onEdit={t => { setEditando(t); setView('form') }}
                        onDelete={handleDelete}
                        onRegistrarPagamento={handleRegistrarPagamento}
                        onDeletePagamento={handleDeletePagamento}
                      />
                      <p className="text-xs text-right pb-1" style={{ color: 'var(--c-text-4)' }}>
                        {transacoes.length} transação(ões) · Sincronizado com Supabase
                      </p>
                    </>
                  )}
                </>
              )}
            </>
          )}

          {tab === 'clientes' && <ClienteList />}
          {tab === 'analises' && <Analytics />}
        </div>
      </main>

      {/* ── FAB mobile ──────────────────────────────────────── */}
      {isTransacoes && view === 'list' && !loading && (
        <button
          onClick={() => { setEditando(undefined); setView('form') }}
          className="lg:hidden fixed bottom-[4.5rem] right-4 z-40 w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          style={{ background: 'linear-gradient(135deg, var(--c-blue), var(--c-blue-d))', boxShadow: '0 4px 24px rgba(59,130,246,0.45)' }}
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* ── Bottom nav mobile ───────────────────────────────── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around"
        style={{ height: '64px', background: 'var(--c-sidebar)', backdropFilter: 'blur(16px)', borderTop: '1px solid var(--c-sidebar-border)' }}
      >
        {NAV.map(item => (
          <button
            key={item.key}
            onClick={() => changeTab(item.key)}
            className="flex flex-col items-center gap-1 px-4 py-1 transition-all cursor-pointer"
            style={{ color: tab === item.key ? 'var(--c-sidebar-active)' : 'var(--c-sidebar-text)' }}
          >
            {item.icon}
            <span className="text-[10px] font-semibold">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
