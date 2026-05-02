const PREFIX = 'mxmcimentos:'

/**
 * Gera SHA-256 hex da senha.
 * Usa Web Crypto API — funciona no Edge Runtime (middleware).
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(PREFIX + password)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export const COOKIE_NAME = 'mxm_token'
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 dias
