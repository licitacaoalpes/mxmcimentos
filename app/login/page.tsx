'use client'

import { useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        const next = params.get('next') || '/dashboard'
        router.push(next)
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || 'Senha incorreta.')
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(160deg, #F0F6FF 0%, #FFFFFF 60%, #F5F0FF 100%)' }}
    >
      {/* Decoração sutil */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full blur-3xl opacity-[0.12]"
          style={{ background: '#3B82F6' }} />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-[0.08]"
          style={{ background: '#8B5CF6' }} />
      </div>

      <div className="relative w-full max-w-[360px]">

        {/* Logo + título */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              boxShadow: '0 8px 30px rgba(37,99,235,0.3)',
            }}
          >
            <span className="text-white text-xl font-extrabold tracking-tight">M</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#0A1525' }}>
            MXM Cimentos
          </h1>
          <p className="text-sm mt-1.5 font-medium" style={{ color: '#7090A8' }}>
            Gestão de transações · Parceria Ivo Menezes
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-7"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(59,130,246,0.1)',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 20px 60px rgba(37,99,235,0.08)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-xs font-bold uppercase tracking-wider mb-1.5"
                style={{ color: '#4A6080' }}
              >
                Senha de acesso
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Digite a senha compartilhada"
                autoFocus
                required
                style={{
                  background: '#F8FBFF',
                  border: '1px solid rgba(59,130,246,0.15)',
                  color: '#0A1525',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  fontSize: '14px',
                  width: '100%',
                  outline: 'none',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = '#2563EB'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)'
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'rgba(59,130,246,0.15)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            </div>

            {error && (
              <div
                className="rounded-xl px-3.5 py-2.5 text-sm font-medium"
                style={{
                  background: 'rgba(220,38,38,0.05)',
                  border: '1px solid rgba(220,38,38,0.15)',
                  color: '#DC2626',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                boxShadow: loading || !password ? 'none' : '0 4px 20px rgba(37,99,235,0.35)',
              }}
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#9AB0C0' }}>
          Acesso restrito · MXM Cimentos 2026
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
