'use client'

import { useState, useRef, useEffect } from 'react'
import { CIDADES, buscarCidades, type Regiao } from '@/lib/cidades'

interface Props {
  value: string
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
}

const REGIAO_LABEL: Record<Regiao, string> = {
  Salvador: 'Salvador',
  RMS: 'Região Metropolitana de Salvador',
}

export default function CidadeSelect({ value, onChange, required, placeholder = 'Pesquisar cidade…' }: Props) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        if (!CIDADES.find(c => c.nome === query)) setQuery(value)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [query, value])

  const resultados = buscarCidades(query)
  const grupos = ['Salvador', 'RMS'] as Regiao[]
  const porRegiao = grupos.reduce<Record<Regiao, typeof resultados>>(
    (acc, r) => ({ ...acc, [r]: resultados.filter(c => c.regiao === r) }),
    { Salvador: [], RMS: [] }
  )

  function selecionar(nome: string) { onChange(nome); setQuery(nome); setOpen(false) }

  return (
    <div ref={ref} className="relative">
      <input
        type="text" value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder} required={required} autoComplete="off"
        className="w-full pr-8"
      />

      {value && CIDADES.find(c => c.nome === value) && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none font-bold"
          style={{ color: 'var(--c-green-text)' }}>✓</span>
      )}

      {open && (
        <div className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden max-h-60 overflow-y-auto"
          style={{ background: 'var(--c-elevated)', border: '1px solid var(--c-border-2)', boxShadow: 'var(--c-modal-shadow)' }}>
          {resultados.length === 0 && (
            <div className="px-4 py-3 text-sm" style={{ color: 'var(--c-text-4)' }}>Nenhuma cidade encontrada.</div>
          )}
          {grupos.map(regiao => {
            const cidades = porRegiao[regiao]
            if (cidades.length === 0) return null
            return (
              <div key={regiao}>
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--c-text-4)', background: 'var(--c-accent)', borderBottom: '1px solid var(--c-border)' }}>
                  {REGIAO_LABEL[regiao]}
                </div>
                {cidades.map(c => (
                  <button key={c.nome} type="button" onMouseDown={() => selecionar(c.nome)}
                    className="w-full text-left px-4 py-2 text-sm transition-all cursor-pointer"
                    style={value === c.nome ? { background: 'var(--c-accent-2)', color: 'var(--c-blue-text)' } : { color: 'var(--c-text)' }}
                    onMouseEnter={e => { if (value !== c.nome) (e.currentTarget as HTMLElement).style.background = 'var(--c-accent)' }}
                    onMouseLeave={e => { if (value !== c.nome) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                    {c.nome}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
