import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Singleton para reutilizar conexão entre requests no mesmo worker
let _client: SupabaseClient | null = null

/**
 * Cliente server-side usando service_role key.
 * Bypassa RLS — NUNCA usar no cliente/browser.
 */
export function getSupabase(): SupabaseClient {
  if (_client) return _client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não configuradas.'
    )
  }

  _client = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return _client
}
