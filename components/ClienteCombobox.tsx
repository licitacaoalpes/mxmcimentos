'use client'

import { useState, useRef, useEffect } from 'react'
import type { Cliente } from '@/lib/types'

interface Props {
  clientes: Cliente[]
  value: string
  clienteId: string | null
  onChange: (nome: string, id: string | null) => void
  required?: boolean
}

export default function ClienteCombobox({ clientes, value, clienteId, onChange, required }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtrados = value
    ? clientes.filter(c =>
        c.nome.toLowerCase().includes(value.toLowerCase()) ||
        c.cidade.toLowerCase().includes(value.toLowerCase())
      )
    : clientes

  const clienteSelecionado = clienteId ? clientes.find(c => c.id === clienteId) : null

  function selecionar(c: Cliente) { onChange(c.nome, c.id); setOpen(false) }
  function handleInput(v: string) { onChange(v, null); setOpen(true) }

  return (
    <div ref={ref} className="relative">
      <input
        type="text" value={value}
        onChange={e => handleInput(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Nome do cliente ou pesquisar cadastrado…"
        required={required} autoComplete="off"
        className="w-full pr-24"
      />

      {clienteSelecionado && (
        <span
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full pointer-events-none max-w-[110px] truncate"
          style={{ background: 'var(--c-accent-2)', border: '1px solid var(--c-border-2)', color: 'var(--c-blue-text)' }}
        >
          {clienteSelecionado.cidade}
        </span>
      )}

      {open && (
        <div
          className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden max-h-52 overflow-y-auto"
          style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border-2)', boxShadow: 'var(--c-modal-shadow)' }}
        >
          {filtrados.length === 0 ? (
            <div className="px-4 py-3 text-sm" style={{ color: 'var(--c-text-4)' }}>
              Nenhum cliente cadastrado com esse nome.
              <br /><span style={{ color: 'var(--c-text-3)' }}>O nome digitado será usado como está.</span>
            </div>
          ) : (
            <>
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--c-text-4)', borderBottom: '1px solid var(--c-border)' }}>
                Clientes cadastrados
              </div>
              {filtrados.map(c => (
                <button key={c.id} type="button" onMouseDown={() => selecionar(c)}
                  className="w-full text-left px-4 py-2.5 text-sm transition-all cursor-pointer"
                  style={clienteId === c.id ? { background: 'var(--c-accent-2)', color: 'var(--c-blue-text)' } : { color: 'var(--c-text)' }}
                  onMouseEnter={e => { if (clienteId !== c.id) (e.currentTarget as HTMLElement).style.background = 'var(--c-accent)' }}
                  onMouseLeave={e => { if (clienteId !== c.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                  <span className="font-semibold">{c.nome}</span>
                  <span className="text-xs ml-2" style={{ color: 'var(--c-text-3)' }}>{c.cidade}</span>
                  {c.telefone && <span className="text-xs ml-2" style={{ color: 'var(--c-text-4)' }}>{c.telefone}</span>}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
