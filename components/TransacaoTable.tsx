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

export default function TransacaoTable({
  transacoes,
  onEdit,
  onDelete,
  onMarcarPago,
}: Props) {
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [pagoModal, setPagoModal] = useState<string | null>(null) // id da transação
  const [dataRetorno, setDataRetorno] = useState(todayIso())

  const contagem: Record<Filtro, number> = {
    todos: transacoes.length,
    pendente: transacoes.filter(t => t.status === 'pendente').length,
    atrasado: transacoes.filter(t => t.status === 'atrasado').length,
    retornado: transacoes.filter(t => t.status === 'retornado').length,
  }

  const filtradas =
    filtro === 'todos' ? transacoes : transacoes.filter(t => t.status === filtro)

  const txPago = pagoModal ? transacoes.find(t => t.id === pagoModal) : null

  function confirmarPago() {
    if (!pagoModal) return
    onMarcarPago(pagoModal, dataRetorno)
    setPagoModal(null)
  }

  const FILTROS: { key: Filtro; label: string }[] = [
    { key: 'todos', label: 'Todas' },
    { key: 'pendente', label: 'Pendente' },
    { key: 'atrasado', label: 'Atrasado' },
    { key: 'retornado', label: 'Retornado' },
  ]

  return (
    <>
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-3">
        {FILTROS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFiltro(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${filtro === key
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            {label}
            <span className="ml-1.5 text-xs opacity-70">({contagem[key]})</span>
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  'Cliente', 'Cimento', 'Sacos',
                  'Transferido', 'A receber', 'Lucro',
                  'Data transf.', 'Dias', 'Status', 'Ações'
                ].map(h => (
                  <th
                    key={h}
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-gray-400">
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              )}
              {filtradas.map(t => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-3 font-medium text-gray-900 max-w-[140px] truncate">
                    {t.cliente}
                  </td>
                  <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{t.marca_cimento}</td>
                  <td className="px-3 py-3 text-gray-900">{t.quantidade_sacos}</td>
                  <td className="px-3 py-3 text-gray-900 whitespace-nowrap">{brl(t.valor_transferido)}</td>
                  <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">
                    {brl(t.valor_transferido + t.lucro_esperado)}
                  </td>
                  <td className="px-3 py-3 text-green-700 font-medium whitespace-nowrap">
                    {brl(t.lucro_esperado)}
                  </td>
                  <td className="px-3 py-3 text-gray-500 whitespace-nowrap">
                    {fmtDate(t.data_transferencia)}
                  </td>
                  <td
                    className={`px-3 py-3 whitespace-nowrap font-medium
                      ${t.status === 'atrasado' ? 'text-red-600' : 'text-gray-500'}`}
                  >
                    {t.dias_em_aberto}d
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      {t.status !== 'retornado' && (
                        <button
                          onClick={() => {
                            setPagoModal(t.id)
                            setDataRetorno(todayIso())
                          }}
                          className="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-700
                                     border border-green-200 rounded-md text-xs font-medium transition-colors"
                        >
                          ✓ Pago
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(t)}
                        className="px-2 py-1 bg-white hover:bg-gray-100 text-gray-600
                                   border border-gray-200 rounded-md text-xs transition-colors"
                        title="Editar"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Excluir transação de ${t.cliente}?`)) {
                            onDelete(t.id)
                          }
                        }}
                        className="px-2 py-1 bg-white hover:bg-red-50 text-red-500
                                   border border-gray-200 hover:border-red-200 rounded-md text-xs transition-colors"
                        title="Excluir"
                      >
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

      {/* Modal — Confirmar recebimento */}
      {pagoModal && txPago && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Registrar recebimento
            </h3>

            <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3 mb-4 text-sm space-y-1">
              <p className="font-medium text-gray-900">{txPago.cliente}</p>
              <p className="text-gray-600">
                {txPago.quantidade_sacos} sacos de {txPago.marca_cimento}
              </p>
              <p className="text-gray-600">
                Capital: <span className="font-medium">{brl(txPago.valor_transferido)}</span>
              </p>
              <p className="text-gray-600">
                + Lucro:{' '}
                <span className="font-medium text-green-700">{brl(txPago.lucro_esperado)}</span>
              </p>
              <div className="pt-2 mt-1 border-t border-gray-200">
                <p className="font-semibold text-gray-900 text-base">
                  Total recebido: {brl(txPago.valor_transferido + txPago.lucro_esperado)}
                </p>
              </div>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Data do recebimento
            </label>
            <input
              type="date"
              value={dataRetorno}
              onChange={e => setDataRetorno(e.target.value)}
              className="mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={confirmarPago}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white
                           text-sm font-medium rounded-lg transition-colors"
              >
                Confirmar recebimento
              </button>
              <button
                onClick={() => setPagoModal(null)}
                className="px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200
                           text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
