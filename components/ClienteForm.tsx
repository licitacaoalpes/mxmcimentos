'use client'

import { useState, useEffect, FormEvent } from 'react'
import type { Cliente, ClienteInput } from '@/lib/types'
import CidadeSelect from './CidadeSelect'

interface Props {
  initial?: Cliente
  onSuccess: (c: Cliente) => void
  onCancel: () => void
}

const EMPTY: ClienteInput = { nome: '', telefone: '', email: '', cidade: '' }

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--c-text-3)' }}>
      {children}
    </label>
  )
}

export default function ClienteForm({ initial, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState<ClienteInput>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initial) {
      setForm({ nome: initial.nome, telefone: initial.telefone ?? '', email: initial.email ?? '', cidade: initial.cidade })
    } else {
      setForm(EMPTY)
    }
  }, [initial])

  function set<K extends keyof ClienteInput>(key: K, value: ClienteInput[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const url = initial ? `/api/clientes/${initial.id}` : '/api/clientes'
      const method = initial ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao salvar.'); return }
      onSuccess(data)
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label>Nome <span style={{ color: 'var(--c-red)' }}>*</span></Label>
          <input type="text" value={form.nome} onChange={e => set('nome', e.target.value)}
            placeholder="Nome completo ou razão social" required />
        </div>
        <div>
          <Label>Telefone <span className="normal-case tracking-normal font-normal" style={{ color: 'var(--c-text-4)' }}>(opcional)</span></Label>
          <input type="tel" value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(71) 9 9999-9999" />
        </div>
        <div>
          <Label>E-mail <span className="normal-case tracking-normal font-normal" style={{ color: 'var(--c-text-4)' }}>(opcional)</span></Label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="cliente@email.com" />
        </div>
        <div className="sm:col-span-2">
          <Label>Cidade <span style={{ color: 'var(--c-red)' }}>*</span></Label>
          <CidadeSelect value={form.cidade} onChange={v => set('cidade', v)} required />
          <p className="text-xs mt-1.5" style={{ color: 'var(--c-text-4)' }}>
            Salvador e Região Metropolitana (RMS)
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl px-3.5 py-2.5 text-sm font-medium"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--c-red-text)' }}>
          {error}
        </div>
      )}

      <div className="flex gap-2.5 pt-1">
        <button type="submit" disabled={loading}
          className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-50"
          style={{ background: `linear-gradient(135deg, var(--c-blue), var(--c-blue-d))`, boxShadow: loading ? 'none' : '0 0 20px rgba(59,130,246,0.25)' }}>
          {loading ? 'Salvando…' : initial ? 'Salvar alterações' : 'Cadastrar cliente'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
          style={{ color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
