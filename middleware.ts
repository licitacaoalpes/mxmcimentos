import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { hashPassword, COOKIE_NAME } from './lib/auth'

export const config = {
  matcher: [
    /*
     * Protege tudo exceto:
     * - /login e sub-rotas
     * - /api/auth (login/logout sem proteção)
     * - arquivos estáticos do Next.js
     */
    '/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}

export async function middleware(request: NextRequest) {
  const appPassword = process.env.APP_PASSWORD
  if (!appPassword) {
    // App mal configurado — deixa passar para mostrar erro claro
    return NextResponse.next()
  }

  const token = request.cookies.get(COOKIE_NAME)?.value
  const expectedToken = await hashPassword(appPassword)

  if (!token || token !== expectedToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}
