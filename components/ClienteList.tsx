'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Cliente } from '@/lib/types'
import ClienteForm from './ClienteForm'

export default function ClienteList() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState<'list' | 'form'>('list')
  const [editando, setEditando] = useState<Cliente | undefined>(undefined)
  const [busca, setBusca] = useState('')

  const fetchClientes = useCallback(async () => {
    try {
      setError('')
      const res = await fetch('/api/clientes')
      if (!res.ok) throw new Error()
      const data: Cliente[] = await res.json()
      setClientes(data)
    } catch {
      setError('Erro ao carregar clientes.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchClientes() }, [fetchClientes])

  async function handleDelete(id: string, nome: string) {
    if (!confirm(`Desativar o cliente "${nome}"?\n\nAs transações existentes serão mantidas.`)) return
    setClientes(prev => prev.filter(c => c.id !== id))
    try {
      const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' })
      if (!res.ok) await fetchClientes()
    } catch { await fetchClientes() }
  }

  function handleSuccess(c: Cliente) {
    setClientes(prev => {
      const exists = prev.some(x => x.id === c.id)
      return exists ? prev.map(x => x.id === c.id ? c : x) : [c, ...prev]
    })
    setView('list')
    setEditando(undefined)
  }

  const filtrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.cidade.toLowerCase().includes(busca.toLowerCase()) ||
    (c.telefone ?? '').includes(busca) ||
    (c.email ?? '').toLowerCase().includes(busca.toLowerCase())
  )

  const regionStyle = (cidade: string): React.CSSProperties =>
    cidade === 'Salvador'
      ? { background: 'rgba(59,130,246,0.12)', color: 'var(--c-blue-text)', border: '1px solid var(--c-border-2)' }
      : { background: 'rgba(124,58,237,0.12)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.2)' }

  if (view === 'form') {
    return (
      <div className="rounded-2xl p-5" style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
        <h2 className="text-base font-extrabold mb-5" style={{ color: 'var(--c-text)' }}>
          {editando ? 'Editar cliente' : 'Novo cliente'}
        </h2>
        <ClienteForm
          initial={editando}
          onSuccess={handleSuccess}
          onCancel={() => { setView('list'); setEditando(undefined) }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome, cidade, telefone…" className="flex-1 min-w-[200px] max-w-sm" />
        <button
          onClick={() => { setEditando(undefined); setView('form') }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all cursor-pointer whitespace-nowrap"
          style={{ background: `linear-gradient(135deg, var(--c-blue), var(--c-blue-d))`, boxShadow: '0 0 20px rgba(59,130,246,0.2)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Novo cliente
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 gap-3">
          <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--c-border-2)', borderTopColor: 'var(--c-blue)' }} />
          <p className="text-sm" style={{ color: 'var(--c-text-4)' }}>Carregando clientes…</p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl px-4 py-3 text-sm font-medium"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--c-red-text)' }}>
          {error} <button onClick={fetchClientes} className="underline ml-2">Tentar novamente</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Mobile: cards */}
          <div className="lg:hidden space-y-3">
            {filtrados.length === 0 && (
              <div className="rounded-2xl px-4 py-12 text-center"
                style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
                <p className="text-sm" style={{ color: 'var(--c-text-4)' }}>
                  {busca ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}
                </p>
              </div>
            )}
            {filtrados.map(c => (
              <div key={c.id} className="rounded-2xl p-4"
                style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold" style={{ color: 'var(--c-text)' }}>{c.nome}</p>
                    <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--c-text-3)' }}>{c.cidade}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={regionStyle(c.cidade)}>
                    {c.cidade === 'Salvador' ? 'SSA' : 'RMS'}
                  </span>
                </div>
                {(c.telefone || c.email) && (
                  <p className="text-xs mb-3" style={{ color: 'var(--c-text-4)' }}>
                    {c.telefone}{c.telefone && c.email && <span className="mx-1.5">·</span>}{c.email}
                  </p>
                )}
                <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid var(--c-border)' }}>
                  <button onClick={() => { setEditando(c); setView('form') }}
                    className="flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    style={{ background: 'var(--c-accent)', border: '1px solid var(--c-border-2)', color: 'var(--c-blue-text)' }}>
                    Editar
                  </button>
                  <button onClick={() => handleDelete(c.id, c.nome)}
                    className="py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--c-red-text)' }}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: tabela */}
          <div className="hidden lg:block rounded-2xl overflow-hidden"
            style={{ background: 'var(--c-card)', border: '1px solid var(--c-border)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--c-border)', background: 'var(--c-thead)' }}>
                    {['Nome', 'Cidade', 'Região', 'Telefone', 'E-mail', 'Ações'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                        style={{ color: 'var(--c-text-4)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--c-text-4)' }}>
                      {busca ? 'Nenhum cliente encontrado para essa busca.' : 'Nenhum cliente cadastrado ainda.'}
                    </td></tr>
                  )}
                  {filtrados.map(c => (
                    <tr key={c.id} className="transition-colors"
                      style={{ borderBottom: '1px solid var(--c-border)' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--c-row-hover)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                      <td className="px-4 py-3 font-bold" style={{ color: 'var(--c-text)' }}>{c.nome}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--c-text-2)' }}>{c.cidade}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={regionStyle(c.cidade)}>
                          {c.cidade === 'Salvador' ? 'Salvador' : 'RMS'}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--c-text-2)' }}>{c.telefone || '—'}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--c-text-2)' }}>{c.email || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => { setEditando(c); setView('form') }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            style={{ background: 'var(--c-accent)', border: '1px solid var(--c-border-2)', color: 'var(--c-blue-text)' }}>
                            Editar
                          </button>
                          <button onClick={() => handleDelete(c.id, c.nome)}
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
            <div className="px-4 py-2.5" style={{ borderTop: '1px solid var(--c-border)', background: 'var(--c-thead)' }}>
              <p className="text-xs font-medium" style={{ color: 'var(--c-text-4)' }}>
                {filtrados.length} cliente(s) · Excluir mantém histórico nas transações
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
