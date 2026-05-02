'use client'

import { useState, useEffect, FormEvent } from 'react'
import type { Transacao, TransacaoInput, Cliente } from '@/lib/types'
import { brl, todayIso } from '@/lib/utils'
import ClienteCombobox from './ClienteCombobox'

interface Props {
  initial?: Transacao
  onSuccess: (t: Transacao) => void
  onCancel: () => void
}

const EMPTY: TransacaoInput = {
  cliente: '',
  cliente_id: null,
  marca_cimento: '',
  quantidade_sacos: 0,
  valor_por_saco: 0,
  lucro_esperado: 500,
  data_transferencia: todayIso(),
  observacoes: '',
}

interface Marca { id: string; nome: string }

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--c-text-3)' }}>
      {children}
    </label>
  )
}

export default function TransacaoForm({ initial, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState<TransacaoInput>(EMPTY)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/clientes').then(r => r.json()),
      fetch('/api/marcas').then(r => r.json()),
    ]).then(([cls, mks]) => {
      if (Array.isArray(cls)) setClientes(cls)
      if (Array.isArray(mks) && mks.length > 0) {
        setMarcas(mks)
        setForm(prev => prev.marca_cimento ? prev : { ...prev, marca_cimento: mks[0].nome })
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (initial) {
      setForm({
        cliente: initial.cliente,
        cliente_id: (initial as { cliente_id?: string | null }).cliente_id ?? null,
        marca_cimento: initial.marca_cimento,
        quantidade_sacos: initial.quantidade_sacos,
        valor_por_saco: initial.valor_por_saco,
        lucro_esperado: initial.lucro_esperado,
        data_transferencia: initial.data_transferencia,
        observacoes: initial.observacoes,
      })
    } else {
      setForm(EMPTY)
    }
  }, [initial])

  const valorTransferido = form.quantidade_sacos * form.valor_por_saco
  const valorRetorno = valorTransferido + (form.lucro_esperado || 0)

  function set<K extends keyof TransacaoInput>(key: K, value: TransacaoInput[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const url = initial ? `/api/transacoes/${initial.id}` : '/api/transacoes'
      const method = initial ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
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
          <Label>Cliente <span style={{ color: 'var(--c-red)' }}>*</span></Label>
          <ClienteCombobox
            clientes={clientes}
            value={form.cliente}
            clienteId={form.cliente_id ?? null}
            onChange={(nome, id) => setForm(p => ({ ...p, cliente: nome, cliente_id: id }))}
            required
          />
          {form.cliente_id ? (
            <p className="text-xs mt-1.5 font-medium" style={{ color: 'var(--c-green-text)' }}>✓ Cliente cadastrado vinculado</p>
          ) : form.cliente ? (
            <p className="text-xs mt-1.5" style={{ color: 'var(--c-text-4)' }}>Nome livre — selecione da lista para vincular</p>
          ) : null}
        </div>

        <div>
          <Label>Marca do cimento <span style={{ color: 'var(--c-red)' }}>*</span></Label>
          <select value={form.marca_cimento} onChange={e => set('marca_cimento', e.target.value)} required>
            {marcas.length === 0 && <option value="">Carregando…</option>}
            {marcas.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
          </select>
        </div>

        <div>
          <Label>Qtd. de sacos <span style={{ color: 'var(--c-red)' }}>*</span></Label>
          <input type="number" min={1} value={form.quantidade_sacos || ''}
            onChange={e => set('quantidade_sacos', Number(e.target.value))} placeholder="Ex: 100" required />
        </div>

        <div>
          <Label>Valor por saco (R$) <span style={{ color: 'var(--c-red)' }}>*</span></Label>
          <input type="number" min={0.01} step={0.01} value={form.valor_por_saco || ''}
            onChange={e => set('valor_por_saco', Number(e.target.value))} placeholder="Ex: 36,00" required />
        </div>

        <div>
          <Label>Lucro combinado (R$) <span style={{ color: 'var(--c-red)' }}>*</span></Label>
          <input type="number" min={0} step={50} value={form.lucro_esperado || ''}
            onChange={e => set('lucro_esperado', Number(e.target.value))} placeholder="Ex: 500" required />
        </div>

        <div className="sm:col-span-2">
          <Label>Data da transferência <span style={{ color: 'var(--c-red)' }}>*</span></Label>
          <input type="date" value={form.data_transferencia}
            onChange={e => set('data_transferencia', e.target.value)} required />
        </div>

        <div className="sm:col-span-2">
          <Label>Observações</Label>
          <textarea rows={2} value={form.observacoes}
            onChange={e => set('observacoes', e.target.value)}
            placeholder="Ex: combinou retorno em 3 semanas, pagamento via PIX…" />
        </div>
      </div>

      {valorTransferido > 0 && (
        <div className="rounded-2xl p-4 grid grid-cols-3 gap-3"
          style={{ background: 'var(--c-accent)', border: '1px solid var(--c-border)' }}>
          <div className="text-center">
            <p className="text-[9px] uppercase font-bold mb-1" style={{ color: 'var(--c-text-4)' }}>Você investe</p>
            <p className="text-base font-extrabold" style={{ color: 'var(--c-text)' }}>{brl(valorTransferido)}</p>
          </div>
          <div className="text-center" style={{ borderLeft: '1px solid var(--c-border)', borderRight: '1px solid var(--c-border)' }}>
            <p className="text-[9px] uppercase font-bold mb-1" style={{ color: 'var(--c-text-4)' }}>+ Lucro</p>
            <p className="text-base font-extrabold" style={{ color: 'var(--c-green-text)' }}>{brl(form.lucro_esperado)}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] uppercase font-bold mb-1" style={{ color: 'var(--c-text-4)' }}>Retorno total</p>
            <p className="text-base font-extrabold" style={{ color: 'var(--c-blue-text)' }}>{brl(valorRetorno)}</p>
          </div>
        </div>
      )}

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
          {loading ? 'Salvando…' : initial ? 'Salvar alterações' : 'Registrar transação'}
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
