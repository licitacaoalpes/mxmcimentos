'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Transacao, TransacaoComStatus } from '@/lib/types'
import { toComStatus, calcularMetrics } from '@/lib/utils'
import MetricCards from './MetricCards'
import TransacaoTable from './TransacaoTable'
import TransacaoForm from './TransacaoForm'

type View = 'dashboard' | 'form'

export default function Dashboard() {
  const router = useRouter()
  const [transacoes, setTransacoes] = useState<TransacaoComStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState<View>('dashboard')
  const [editando, setEditando] = useState<TransacaoComStatus | undefined>(undefined)

  // ------- Fetch -------
  const fetchTransacoes = useCallback(async () => {
    try {
      setError('')
      const res = await fetch('/api/transacoes')
      if (res.status === 401) { router.push('/login'); return }
      if (!res.ok) throw new Error('Falha ao carregar dados')
      const data: Transacao[] = await res.json()
      setTransacoes(data.map(toComStatus))
    } catch {
      setError('Erro ao carregar transações. Verifique sua conexão.')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { fetchTransacoes() }, [fetchTransacoes])

  const metrics = useMemo(() => calcularMetrics(transacoes), [transacoes])

  // ------- Handlers -------
  function handleSuccess(t: Transacao) {
    const updated = toComStatus(t)
    setTransacoes(prev => {
      const exists = prev.some(x => x.id === t.id)
      return exists
        ? prev.map(x => x.id === t.id ? updated : x)
        : [updated, ...prev]
    })
    setView('dashboard')
    setEditando(undefined)
  }

  async function handleDelete(id: string) {
    // Otimista: remove do estado antes da confirmação do servidor
    setTransacoes(prev => prev.filter(t => t.id !== id))

    try {
      const res = await fetch(`/api/transacoes/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        // Reverte se falhou
        await fetchTransacoes()
      }
    } catch {
      await fetchTransacoes()
    }
  }

  async function handleMarcarPago(id: string, dataRetorno: string) {
    try {
      const res = await fetch(`/api/transacoes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data_retorno: dataRetorno }),
      })
      if (!res.ok) throw new Error()
      const data: Transacao = await res.json()
      setTransacoes(prev => prev.map(t => t.id === id ? toComStatus(data) : t))
    } catch {
      await fetchTransacoes()
    }
  }

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/login')
  }

  function handleEdit(t: TransacaoComStatus) {
    setEditando(t)
    setView('form')
  }

  function handleNovaTransacao() {
    setEditando(undefined)
    setView('form')
  }

  // ------- Render -------
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-semibold">M</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-900">MXM Cimentos</span>
              <span className="hidden sm:inline text-xs text-gray-400 ml-2">
                · Parceria Ivo Menezes
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {view === 'dashboard' ? (
              <button
                onClick={handleNovaTransacao}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white
                           text-sm font-medium rounded-lg transition-colors"
              >
                + Nova transação
              </button>
            ) : (
              <button
                onClick={() => { setView('dashboard'); setEditando(undefined) }}
                className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200
                           text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                ← Voltar
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200
                         text-gray-500 text-sm rounded-lg transition-colors"
              title="Sair"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-sm text-gray-400">Carregando transações…</div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}{' '}
            <button onClick={fetchTransacoes} className="underline ml-1">
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Métricas sempre visíveis */}
            <MetricCards metrics={metrics} />

            {/* Alerta de atrasadas */}
            {metrics.qtd_atrasadas > 0 && view === 'dashboard' && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                ⚠️ <strong>{metrics.qtd_atrasadas}</strong> transação(ões) com mais de 30 dias sem
                retorno — hora de cobrar o Ivo!
              </div>
            )}

            {/* View: Formulário */}
            {view === 'form' && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-4">
                  {editando ? 'Editar transação' : 'Nova transação'}
                </h2>
                <TransacaoForm
                  initial={editando}
                  onSuccess={handleSuccess}
                  onCancel={() => { setView('dashboard'); setEditando(undefined) }}
                />
              </div>
            )}

            {/* View: Dashboard */}
            {view === 'dashboard' && (
              <TransacaoTable
                transacoes={transacoes}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onMarcarPago={handleMarcarPago}
              />
            )}

            {view === 'dashboard' && (
              <p className="text-xs text-gray-400 text-right">
                {transacoes.length} transação(ões) · Dados sincronizados com Supabase
              </p>
            )}
          </>
        )}
      </main>
    </div>
  )
}
