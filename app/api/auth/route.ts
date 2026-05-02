import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/auth'

// POST /api/auth — login
export async function POST(req: NextRequest) {
  const { password } = await req.json()

  const appPassword = process.env.APP_PASSWORD
  if (!appPassword) {
    return NextResponse.json(
      { error: 'APP_PASSWORD não configurado no servidor.' },
      { status: 500 }
    )
  }

  if (!password || password !== appPassword) {
    return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 })
  }

  const token = await hashPassword(appPassword)

  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })

  return res
}

// DELETE /api/auth — logout
export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(COOKIE_NAME)
  return res
}
