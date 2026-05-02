'use client'

import { useState, useEffect, FormEvent } from 'react'
import type { Transacao, TransacaoInput } from '@/lib/types'
import { MARCAS_CIMENTO, brl, todayIso } from '@/lib/utils'

interface Props {
  initial?: Transacao          // se fornecido, modo edição
  onSuccess: (t: Transacao) => void
  onCancel: () => void
}

const EMPTY: TransacaoInput = {
  cliente: '',
  marca_cimento: 'Votoran',
  quantidade_sacos: 0,
  valor_por_saco: 0,
  lucro_esperado: 500,
  data_transferencia: todayIso(),
  observacoes: '',
}

export default function TransacaoForm({ initial, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState<TransacaoInput>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Preenche formulário ao editar
  useEffect(() => {
    if (initial) {
      setForm({
        cliente: initial.cliente,
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

      if (!res.ok) {
        setError(data.error || 'Erro ao salvar.')
        return
      }

      onSuccess(data)
    } catch {
      setError('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Cliente */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
          <input
            type="text"
            value={form.cliente}
            onChange={e => set('cliente', e.target.value)}
            placeholder="Nome do cliente"
            required
          />
        </div>

        {/* Marca */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Marca do cimento *</label>
          <select
            value={form.marca_cimento}
            onChange={e => set('marca_cimento', e.target.value)}
            required
          >
            {MARCAS_CIMENTO.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Quantidade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Qtd. de sacos *</label>
          <input
            type="number"
            min={1}
            value={form.quantidade_sacos || ''}
            onChange={e => set('quantidade_sacos', Number(e.target.value))}
            placeholder="Ex: 100"
            required
          />
        </div>

        {/* Valor por saco */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valor por saco (R$) *</label>
          <input
            type="number"
            min={0.01}
            step={0.01}
            value={form.valor_por_saco || ''}
            onChange={e => set('valor_por_saco', Number(e.target.value))}
            placeholder="Ex: 36.00"
            required
          />
        </div>

        {/* Lucro esperado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lucro combinado (R$) *</label>
          <input
            type="number"
            min={0}
            step={50}
            value={form.lucro_esperado || ''}
            onChange={e => set('lucro_esperado', Number(e.target.value))}
            placeholder="Ex: 500"
            required
          />
        </div>

        {/* Data */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Data da transferência *</label>
          <input
            type="date"
            value={form.data_transferencia}
            onChange={e => set('data_transferencia', e.target.value)}
            required
          />
        </div>

        {/* Observações */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
          <textarea
            rows={2}
            value={form.observacoes}
            onChange={e => set('observacoes', e.target.value)}
            placeholder="Ex: cliente combinou retorno em 3 semanas, pagamento via PIX..."
          />
        </div>
      </div>

      {/* Preview de valores */}
      {valorTransferido > 0 && (
        <div className="flex flex-wrap gap-5 bg-gray-50 rounded-xl border border-gray-200 px-4 py-3">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Você transfere</p>
            <p className="text-lg font-semibold text-gray-900">{brl(valorTransferido)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Retorno esperado</p>
            <p className="text-lg font-semibold text-green-700">{brl(valorRetorno)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Lucro</p>
            <p className="text-lg font-semibold text-blue-700">{brl(form.lucro_esperado)}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 sm:flex-none px-5 py-2.5 bg-blue-600 hover:bg-blue-700
                     disabled:bg-blue-300 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? 'Salvando…' : initial ? 'Salvar alterações' : 'Registrar transação'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 bg-white hover:bg-gray-50 border border-gray-200
                     text-gray-700 text-sm font-medium rounded-lg transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
