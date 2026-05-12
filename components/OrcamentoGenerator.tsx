'use client'

import { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react'
import Link from 'next/link'

// ─── Logo MXM em base64 ──────────────────────────────────────────────────────
const LOGO_B64 =
  'data:image/png;base64,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zjjt5AP3Hz92tzHdzQYzSwzMbYB4JAl86l0qjrMxXMUNl+DPlysQYRAIsyZ3CkQctyrDIUZm1L332uuE4467YMZ5V19+0ZQzTjns+/uOGUGLct+DPkg94wACRk/puEENoiAgll61O8P4cSNOOmbSD84790eXX3jW5OMP/t7eu/Rkrmz52M60SGPh8v4ur3vvvsvxRx46/ezTLz7/vAtnTjnxmEP32WNkiqBFy2uRSPAIiSglCiwNUEHRoGWuZejKZO89Rp147JGzZ5538ezzzz5z8qSJh+yx+25ZkoBBwLWlqcu6XNpwLoUpLp9vky+H4mscBIAInHPee8ddrFoWJR8B3rldRo8+/PDDp02beu7Zx48bm/V2Oc91RKXvvVkyhlCSVKHeW0eMocjzdrvlHF8FhF0a0NP0++6924nHHvbXv/rZr3561VmnHr/37qMbzM5962Nr4+ju7OiJEy77wcz/87/+7Y+uuPjUE47ce4+RXQkjjM4uy3a/Mp6cc0kK50XEQSjZg/x5WKFUlRi9YEQPxo1tnHLixF//4uczp087fOKhu4weJc6IhVOYowo+jvKivwWLdAxLccMidTuFqmqMkcTC4sR7n2apCDZv3vzastceeujBBx5csvytjzZt3qyIzktelO08Z6w4571PACFeloE8RJxzntxKXgrnwQRstWDPsSPp46suueDnP7yUb30nHnXYycdMuvLCWT+6/OJZ0845aL+9xo7J+EzPHBCVGz3xrmlZXQpyLpnYHZQeB0DVRJQADyQCTz8rzxVo96Nv04bNmzb0920q2i3lrKicpRGsId4UgmCYihsmudslNkYNIdQ7hBYSgX0hSDz39Buvv37//ffffsftC+6+85nnnl7xwXutdn/UqGpXCETA85aqEATOVWEhQjZK85MnIYJVaCTYb+zIU46bNHv6ORfOmDJ7+pQLp0+9aOa0c0875fAJu49oIoUdKmkpp6Ug8N0+TRPn2SERjhFmDiXTqDFEZiHEyK3O4VCE9Ws3vf/e+88/98x9i+595qkl77y9fPOmjdTCe55vvDIICIwWYcwIhqlQ1SFLVojC7FjXW/Op18N6EAZHB3u2RZTNQZoBphpZOEJDlVGLoOKTJGtIkm3c1Pf6m+8senDxP/722utvnvfAY8++8+H6UjJpNKJrbOrPN7eMPM0aSZo671gS71OC89yg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'

// ─── Dados fixos da empresa ──────────────────────────────────────────────────
const EMPRESA = {
  razao:    'Mxm Distribuidora de Cimento LTDA',
  nome:     'MXM CONSTRUÇÕES',
  slogan:   'Reformas e Materiais para Construção',
  cnpj:     '43.693.107/0002-56',
  end1:     'Periférica II 0157, Antigo 1005 Anexo 01',
  end2:     'Simões Filho - BA, 43721-310',
  tel1:     '(71) 98106-0146',
  tel2:     '(71) 92003-5652',
  email:    'mxmcimentos@gmail.com',
  insta:    '@mxmconstrucoes',
} as const

// ─── Types ───────────────────────────────────────────────────────────────────
interface Cliente {
  nome:  string
  cpf:   string
  tel:   string
  email: string
  end:   string
  obra:  string
}

interface Item {
  desc:  string
  qtd:   string
  un:    string
  preco: string
}

interface Condicoes {
  validade:  string
  pagamento: string
  entrega:   string
  obs:       string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const UNIDADES = ['un', 'sc', 'm²', 'm³', 'm', 'kg', 'lt', 'cx', 'rolo', 'vb', 'saco', 'par']

function brl(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function hoje(): string {
  return new Date().toLocaleDateString('pt-BR')
}

function gerarNumero(): string {
  const d = new Date()
  const rand = String(Math.floor(Math.random() * 99) + 1).padStart(3, '0')
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${rand}`
}

function itemVazio(): Item {
  return { desc: '', qtd: '', un: 'un', preco: '' }
}

// ─── Textarea que cresce automaticamente com o conteúdo ──────────────────────
function AutoTextarea({
  value,
  onChange,
  placeholder,
  className = '',
  autoComplete,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
  autoComplete?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      className={className}
      autoComplete={autoComplete}
      style={{ resize: 'none', overflow: 'hidden', minHeight: '42px' }}
    />
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function OrcamentoGenerator() {
  const [numero]    = useState<string>(gerarNumero)
  const [dataEmis]  = useState<string>(hoje)
  const [view, setView] = useState<'form' | 'preview'>('form')

  const [cli, setCli] = useState<Cliente>({
    nome: '', cpf: '', tel: '', email: '', end: '', obra: '',
  })

  const [cond, setCond] = useState<Condicoes>({
    validade:  '10 dias a partir desta data',
    pagamento: 'PIX, Transferência ou Cartão',
    entrega:   'Até 2 dias úteis após confirmação',
    obs:       '• Preços sujeitos a alteração conforme disponibilidade de estoque.\n• Para pedidos maiores, consulte condições especiais de atacado.',
  })

  const [itens, setItens]       = useState<Item[]>([itemVazio()])
  const [desconto, setDesconto] = useState<string>('')
  const [previewScale, setPreviewScale] = useState(1)

  useEffect(() => {
    function calcScale() {
      const padding = 32
      const available = window.innerWidth - padding
      setPreviewScale(available < 794 ? available / 794 : 1)
    }
    calcScale()
    window.addEventListener('resize', calcScale)
    return () => window.removeEventListener('resize', calcScale)
  }, [])

  // Totais
  const subtotal = itens.reduce((s, it) =>
    s + (parseFloat(it.qtd) || 0) * (parseFloat(it.preco) || 0), 0)
  const total = subtotal - (parseFloat(desconto) || 0)

  // Item handlers
  const setItem = useCallback((i: number, k: keyof Item, v: string) => {
    setItens(arr => arr.map((it, idx) => idx === i ? { ...it, [k]: v } : it))
  }, [])

  const addItem    = () => setItens(a => [...a, itemVazio()])
  const removeItem = (i: number) => setItens(a => a.length > 1 ? a.filter((_, idx) => idx !== i) : a)

  const handlePrint = () => window.print()

  return (
    <>
      {/* Estilos de impressão — injeta uma vez no <head> */}
      <style>{`
        @media print {
          .orcamento-form   { display: none !important; }
          .orcamento-print  { display: block !important; }
          body              { background: white !important; margin: 0; }
          @page             { margin: 12mm 14mm; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
        .orcamento-print { display: none; }
      `}</style>

      {/* ══════════════ FORMULÁRIO (tela) ══════════════ */}
      <div className="orcamento-form min-h-screen bg-gray-50" data-theme="light">

        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <img src={LOGO_B64} alt="MXM" className="w-8 h-8 rounded-lg object-cover shrink-0" />
              <div className="min-w-0">
                <span className="text-sm font-semibold text-gray-900 truncate block">MXM Construções</span>
                <span className="hidden sm:block text-xs text-gray-400 truncate">Gerador de Orçamento</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Dashboard — ícone no mobile, texto no desktop */}
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-1.5 h-9 px-2 sm:px-3 text-gray-500
                           hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50
                           transition-colors min-w-[36px]"
                title="Voltar ao Dashboard"
                aria-label="Voltar ao Dashboard"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline text-sm">Dashboard</span>
              </Link>

              {/* Preview/Editar */}
              <button
                onClick={() => setView(v => v === 'form' ? 'preview' : 'form')}
                className="flex items-center justify-center gap-1.5 h-9 px-2 sm:px-3 text-gray-700
                           border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-w-[36px]"
                title={view === 'form' ? 'Pré-visualizar' : 'Editar'}
                aria-label={view === 'form' ? 'Pré-visualizar orçamento' : 'Voltar a editar'}
              >
                {view === 'form' ? (
                  <>
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="hidden sm:inline text-sm font-medium">Prévia</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="hidden sm:inline text-sm font-medium">Editar</span>
                  </>
                )}
              </button>

              {/* Imprimir */}
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-1.5 h-9 px-2 sm:px-3
                           bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors min-w-[36px]"
                title="Imprimir / PDF"
                aria-label="Imprimir ou salvar como PDF"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span className="hidden sm:inline text-sm font-medium">Imprimir / PDF</span>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4">

          {/* ── Formulário de edição ── */}
          {view === 'form' && (
            <>
              {/* Identificação */}
              <Section title="Identificação do Orçamento">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <Field label="Nº do Orçamento">
                    <input value={numero} readOnly className="bg-gray-50 font-bold" />
                  </Field>
                  <Field label="Data de Emissão">
                    <input value={dataEmis} readOnly className="bg-gray-50" />
                  </Field>
                  <Field label="Validade">
                    <AutoTextarea
                      value={cond.validade}
                      onChange={v => setCond({ ...cond, validade: v })}
                    />
                  </Field>
                </div>
              </Section>

              {/* Dados do cliente */}
              <Section title="Dados do Cliente">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <Field label="Nome / Empresa" className="col-span-2">
                    <AutoTextarea
                      value={cli.nome}
                      onChange={v => setCli({ ...cli, nome: v })}
                      placeholder="Ex: João da Silva"
                      autoComplete="name"
                    />
                  </Field>
                  <Field label="CPF / CNPJ">
                    <AutoTextarea
                      value={cli.cpf}
                      onChange={v => setCli({ ...cli, cpf: v })}
                      placeholder="000.000.000-00"
                      autoComplete="off"
                    />
                  </Field>
                  <Field label="Telefone">
                    <AutoTextarea
                      value={cli.tel}
                      onChange={v => setCli({ ...cli, tel: v })}
                      placeholder="(71) 99999-9999"
                      autoComplete="tel"
                    />
                  </Field>
                  <Field label="E-mail" className="col-span-2">
                    <AutoTextarea
                      value={cli.email}
                      onChange={v => setCli({ ...cli, email: v })}
                      placeholder="email@email.com"
                      autoComplete="email"
                    />
                  </Field>
                  <Field label="Endereço de entrega" className="col-span-2">
                    <AutoTextarea
                      value={cli.end}
                      onChange={v => setCli({ ...cli, end: v })}
                      placeholder="Rua, número, bairro, cidade"
                      autoComplete="street-address"
                    />
                  </Field>
                  <Field label="Descrição da obra / projeto" className="col-span-2 sm:col-span-4">
                    <AutoTextarea
                      value={cli.obra}
                      onChange={v => setCli({ ...cli, obra: v })}
                      placeholder="Ex: Reforma residencial — sala e 2 quartos"
                      autoComplete="off"
                    />
                  </Field>
                </div>
              </Section>

              {/* Itens */}
              <Section
                title="Itens do Orçamento"
                action={
                  <button
                    onClick={addItem}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700
                               text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Adicionar
                  </button>
                }
              >
                {/* ── DESKTOP: cabeçalho da tabela (hidden no mobile) ── */}
                <div className="hidden md:grid gap-2 mb-2 px-1"
                  style={{ gridTemplateColumns: '3fr 72px 72px 90px 88px 28px' }}>
                  {['Descrição do produto', 'Qtde', 'Un.', 'Vl. Unit. (R$)', 'Total', ''].map((h, i) => (
                    <span key={i} className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                      {h}
                    </span>
                  ))}
                </div>

                {itens.map((it, i) => {
                  const tot = (parseFloat(it.qtd) || 0) * (parseFloat(it.preco) || 0)
                  return (
                    <div key={i} className={`mb-2 rounded-xl border ${i % 2 === 0 ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-100'}`}>

                      {/* ── MOBILE: card layout ── */}
                      <div className="md:hidden p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-bold text-gray-400 mt-2.5 w-5 shrink-0 text-center">
                            {i + 1}
                          </span>
                          <div className="flex-1">
                            <AutoTextarea
                              value={it.desc}
                              onChange={v => setItem(i, 'desc', v)}
                              placeholder="Ex: Cimento Holcim CP II-E saco 50kg"
                            />
                          </div>
                          <button
                            onClick={() => removeItem(i)}
                            className="mt-2 w-8 h-8 flex items-center justify-center rounded-lg
                                       text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                            title="Remover item"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="flex gap-2 pl-7">
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Qtde</label>
                            <input
                              value={it.qtd}
                              onChange={e => setItem(i, 'qtd', e.target.value)}
                              type="number" min="0"
                              inputMode="numeric"
                              className="text-center"
                              placeholder="0"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Unidade</label>
                            <select value={it.un} onChange={e => setItem(i, 'un', e.target.value)}>
                              {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Vl. Unit.</label>
                            <input
                              value={it.preco}
                              onChange={e => setItem(i, 'preco', e.target.value)}
                              type="number" min="0" step="0.01"
                              inputMode="decimal"
                              className="text-right"
                              placeholder="0,00"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Total</label>
                            <div className="flex items-center justify-end h-[42px] text-sm font-bold text-blue-700">
                              {tot > 0 ? brl(tot) : '—'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ── DESKTOP: grid layout ── */}
                      <div
                        className="hidden md:grid gap-2 p-1.5 items-center"
                        style={{ gridTemplateColumns: '3fr 72px 72px 90px 88px 28px' }}
                      >
                        <AutoTextarea
                          value={it.desc}
                          onChange={v => setItem(i, 'desc', v)}
                          placeholder="Ex: Cimento Holcim CP II-E saco 50kg"
                        />
                        <input
                          value={it.qtd}
                          onChange={e => setItem(i, 'qtd', e.target.value)}
                          type="number" min="0"
                          inputMode="numeric"
                          className="text-center"
                          placeholder="50"
                        />
                        <select value={it.un} onChange={e => setItem(i, 'un', e.target.value)}>
                          {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                        <input
                          value={it.preco}
                          onChange={e => setItem(i, 'preco', e.target.value)}
                          type="number" min="0" step="0.01"
                          inputMode="decimal"
                          className="text-right"
                          placeholder="42,00"
                        />
                        <div className="text-right text-sm font-bold text-blue-700 pr-1">
                          {tot > 0 ? brl(tot) : '—'}
                        </div>
                        <button
                          onClick={() => removeItem(i)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg
                                     text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Remover item"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )
                })}

                {/* Totais */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
                    <div className="flex items-center gap-2 sm:justify-end">
                      <span className="text-xs text-gray-500">Desconto (R$):</span>
                      <input
                        type="number" min="0" step="0.01"
                        value={desconto}
                        onChange={e => setDesconto(e.target.value)}
                        className="w-28 text-right"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-end mt-3 gap-1">
                    <p className="text-xs text-gray-500">
                      Subtotal: <span className="font-semibold text-gray-800">{brl(subtotal)}</span>
                    </p>
                    {parseFloat(desconto) > 0 && (
                      <p className="text-xs text-green-600">
                        Desconto: − {brl(parseFloat(desconto))}
                      </p>
                    )}
                    <div className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold mt-1 w-full sm:w-auto text-center">
                      TOTAL: {brl(total)}
                    </div>
                  </div>
                </div>
              </Section>

              {/* Condições comerciais */}
              <Section title="Condições Comerciais">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Field label="Forma de pagamento">
                    <AutoTextarea
                      value={cond.pagamento}
                      onChange={v => setCond({ ...cond, pagamento: v })}
                    />
                  </Field>
                  <Field label="Prazo de entrega">
                    <AutoTextarea
                      value={cond.entrega}
                      onChange={v => setCond({ ...cond, entrega: v })}
                    />
                  </Field>
                  <Field label="Observações" className="sm:col-span-2">
                    <textarea
                      value={cond.obs}
                      onChange={e => setCond({ ...cond, obs: e.target.value })}
                      rows={3}
                    />
                  </Field>
                </div>
              </Section>
            </>
          )}

          {/* ── Pré-visualização ── */}
          {view === 'preview' && (
            <div className="flex justify-center">
              {/* Wrapper que segura a altura real após o scale */}
              <div style={{ width: 794 * previewScale, height: 'auto' }}>
                <div style={{
                  width: 794,
                  background: '#fff',
                  boxShadow: '0 2px 24px rgba(0,0,0,0.13)',
                  borderRadius: 4,
                  padding: '45px 53px',
                  transformOrigin: 'top left',
                  transform: `scale(${previewScale})`,
                }}>
                  <PrintDocument
                    numero={numero}
                    dataEmis={dataEmis}
                    cli={cli}
                    cond={cond}
                    itens={itens}
                    subtotal={subtotal}
                    total={total}
                    desconto={parseFloat(desconto) || 0}
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ══════════════ DOCUMENTO PARA IMPRESSÃO ══════════════ */}
      <div className="orcamento-print">
        <PrintDocument
          numero={numero}
          dataEmis={dataEmis}
          cli={cli}
          cond={cond}
          itens={itens}
          subtotal={subtotal}
          total={total}
          desconto={parseFloat(desconto) || 0}
        />
      </div>
    </>
  )
}

// ─── Sub-componentes de UI do formulário ─────────────────────────────────────

function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Barra superior de acento */}
      <div className="h-0.5 bg-gradient-to-r from-blue-600 to-blue-400" />
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-600 rounded-full shrink-0" aria-hidden="true" />
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest">{title}</h3>
          </div>
          {action}
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({
  label,
  className = '',
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

// ─── Documento imprimível ─────────────────────────────────────────────────────

interface PrintDocProps {
  numero:   string
  dataEmis: string
  cli:      Cliente
  cond:     Condicoes
  itens:    Item[]
  subtotal: number
  total:    number
  desconto: number
}

function PrintDocument({ numero, dataEmis, cli, cond, itens, subtotal, total, desconto }: PrintDocProps) {
  const N  = '#1A3158'   // navy
  const LG = '#F4F6F9'  // light gray
  const MG = '#CBD5E1'  // mid gray
  const GT = '#64748B'  // gray text
  const DT = '#1E293B'  // dark text
  const CY = '#00AACC'  // cyan accent

  const cellStyle = (bg = '#fff'): React.CSSProperties => ({
    padding: '5px 8px',
    borderRight: `0.5px solid ${MG}`,
    borderBottom: `0.5px solid ${MG}`,
    background: bg,
  })

  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 10, color: DT, background: '#fff' }}>

      {/* Cabeçalho */}
      <div style={{ background: N, color: '#fff', padding: '13px 18px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <img src={LOGO_B64} alt="MXM" style={{ width: 52, height: 52, borderRadius: 7, objectFit: 'cover' }} />
          <div>
            <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '0.05em', lineHeight: 1.1 }}>
              MXM CONSTRUÇÕES
            </div>
            <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 3 }}>{EMPRESA.slogan}</div>
            <div style={{ width: 72, height: 2, background: CY, marginTop: 5, borderRadius: 2 }} />
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 8.5, lineHeight: 1.9 }}>
          <div style={{ fontWeight: 700, fontSize: 11 }}>{EMPRESA.tel1}</div>
          <div style={{ color: '#94a3b8' }}>{EMPRESA.tel2}</div>
          <div style={{ color: '#94a3b8' }}>{EMPRESA.insta}</div>
          <div style={{ color: '#94a3b8' }}>{EMPRESA.end1}</div>
          <div style={{ color: '#94a3b8' }}>{EMPRESA.end2}</div>
        </div>
      </div>

      {/* Barra CNPJ */}
      <div style={{ background: '#243e6e', padding: '4px 18px', fontSize: 8, color: '#94a3b8' }}>
        CNPJ: {EMPRESA.cnpj} &nbsp;|&nbsp; {EMPRESA.email} &nbsp;|&nbsp; {EMPRESA.razao}
      </div>

      {/* Nº / Data / Validade */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: `0.5px solid ${MG}` }}>
        {[
          ['Nº DO ORÇAMENTO',  <b key="n" style={{ fontSize: 13, color: N }}>{numero}</b>],
          ['DATA DE EMISSÃO',  <b key="d" style={{ fontSize: 12, color: DT }}>{dataEmis}</b>],
          ['VALIDADE',         <span key="v" style={{ color: GT, fontSize: 9 }}>{cond.validade}</span>],
        ].map(([label, value], i) => (
          <div key={i} style={{ padding: '8px 12px', borderRight: i < 2 ? `0.5px solid ${MG}` : 'none', background: i % 2 === 0 ? '#fff' : LG }}>
            <div style={{ fontSize: 7.5, fontWeight: 700, color: GT, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label as string}</div>
            <div style={{ marginTop: 3 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Dados do cliente */}
      <SecHeader>📋 DADOS DO CLIENTE</SecHeader>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: `0.5px solid ${MG}` }}>
        <div style={cellStyle()}><InfoLabel>Cliente / Empresa</InfoLabel><InfoVal>{cli.nome || '—'}</InfoVal></div>
        <div style={cellStyle(LG)}><InfoLabel>CPF / CNPJ</InfoLabel><InfoVal>{cli.cpf || '—'}</InfoVal></div>
        <div style={cellStyle()}><InfoLabel>Telefone</InfoLabel><InfoVal>{cli.tel || '—'}</InfoVal></div>
        <div style={cellStyle(LG)}><InfoLabel>E-mail</InfoLabel><InfoVal>{cli.email || '—'}</InfoVal></div>
        <div style={{ ...cellStyle(), gridColumn: '1 / -1', borderBottom: 'none' }}>
          <InfoLabel>Endereço de Entrega</InfoLabel><InfoVal>{cli.end || '—'}</InfoVal>
        </div>
        {cli.obra && (
          <div style={{ ...cellStyle(LG), gridColumn: '1 / -1', borderBottom: 'none', borderTop: `0.5px solid ${MG}` }}>
            <InfoLabel>Obra / Projeto</InfoLabel><InfoVal>{cli.obra}</InfoVal>
          </div>
        )}
      </div>

      {/* Itens */}
      <SecHeader style={{ marginTop: 10 }}>🧱 ITENS DO ORÇAMENTO</SecHeader>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {[['#', 22, 'center'], ['Descrição', undefined, 'left'], ['Qtde', 40, 'center'], ['Un.', 32, 'center'], ['Vl. Unit.', 68, 'right'], ['Total', 72, 'right']].map(([h, w, align], i) => (
              <th key={i} style={{ background: N, color: '#fff', padding: '6px 7px', textAlign: align as 'left' | 'center' | 'right', fontSize: 8, width: w ? `${w}px` : undefined }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {itens.filter(it => it.desc || it.qtd).map((it, i) => {
            const t = (parseFloat(it.qtd) || 0) * (parseFloat(it.preco) || 0)
            return (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : LG }}>
                <td style={{ padding: '5px 7px', fontSize: 9, textAlign: 'center', color: GT, borderBottom: `0.5px solid #e2e8f0` }}>{i + 1}</td>
                <td style={{ padding: '5px 7px', fontSize: 9, borderBottom: `0.5px solid #e2e8f0` }}>{it.desc || '—'}</td>
                <td style={{ padding: '5px 7px', fontSize: 9, textAlign: 'center', borderBottom: `0.5px solid #e2e8f0` }}>{it.qtd || '—'}</td>
                <td style={{ padding: '5px 7px', fontSize: 9, textAlign: 'center', color: GT, borderBottom: `0.5px solid #e2e8f0` }}>{it.un}</td>
                <td style={{ padding: '5px 7px', fontSize: 9, textAlign: 'right', borderBottom: `0.5px solid #e2e8f0` }}>
                  {it.preco ? brl(parseFloat(it.preco)) : '—'}
                </td>
                <td style={{ padding: '5px 7px', fontSize: 9, textAlign: 'right', fontWeight: 700, color: N, background: '#EFF6FF', borderBottom: `0.5px solid #e2e8f0` }}>
                  {t > 0 ? brl(t) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Totais */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '6px 0' }}>
        <div style={{ width: 190 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 8px', fontSize: 9, color: GT }}>
            <span>Subtotal</span>
            <span style={{ fontWeight: 600, color: DT }}>{brl(subtotal)}</span>
          </div>
          {desconto > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 8px', fontSize: 9, color: '#16a34a' }}>
              <span>(-) Desconto</span>
              <span style={{ fontWeight: 600 }}>- {brl(desconto)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: N, color: '#fff', fontWeight: 700, fontSize: 11 }}>
            <span>TOTAL GERAL</span>
            <span style={{ fontSize: 13 }}>{brl(total)}</span>
          </div>
        </div>
      </div>

      {/* Condições */}
      <SecHeader style={{ marginTop: 10 }}>💳 CONDIÇÕES COMERCIAIS</SecHeader>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', border: `0.5px solid ${MG}` }}>
        {[['Forma de Pagamento', cond.pagamento, '#fff'], ['Prazo de Entrega', cond.entrega, LG], ['Validade do Orçamento', cond.validade, '#fff']].map(([l, v, bg], i) => (
          <div key={i} style={{ padding: '6px 8px', borderRight: i < 2 ? `0.5px solid ${MG}` : 'none', background: bg as string }}>
            <div style={{ fontSize: 7.5, fontWeight: 700, color: GT, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{l}</div>
            <div style={{ fontSize: 9 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Observações */}
      {cond.obs && (
        <>
          <SecHeader style={{ marginTop: 10, background: '#92400e' }}>📝 OBSERVAÇÕES</SecHeader>
          <div style={{ background: '#fffbeb', border: `0.5px solid #fbbf24`, padding: '8px 10px', fontSize: 8.5, color: '#78350f', whiteSpace: 'pre-line' }}>
            {cond.obs}
          </div>
        </>
      )}

      {/* Rodapé */}
      <div style={{ textAlign: 'center', fontSize: 7.5, color: GT, marginTop: 8, paddingTop: 5, borderTop: `0.5px solid ${MG}` }}>
        MXM Construções &nbsp;|&nbsp; {EMPRESA.email} &nbsp;|&nbsp; {EMPRESA.tel1} &nbsp;|&nbsp;
        Este documento é um orçamento e não possui valor fiscal.
      </div>
    </div>
  )
}

// ─── Helpers de estilo do documento ──────────────────────────────────────────

function SecHeader({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#1A3158', color: '#fff', fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', padding: '5px 10px', ...style }}>
      {children}
    </div>
  )
}

function InfoLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 7.5, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>{children}</div>
}

function InfoVal({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 9.5, color: '#1E293B', marginTop: 1 }}>{children}</div>
}