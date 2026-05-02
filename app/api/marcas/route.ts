import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

// GET /api/marcas — retorna marcas ativas ordenadas por `ordem`
export async function GET() {
  try {
    const { data, error } = await getSupabase()
      .from('marcas_cimento')
      .select('id, nome')
      .eq('ativo', true)
      .order('ordem', { ascending: true })

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error('[GET /api/marcas]', err)
    return NextResponse.json({ error: 'Erro ao buscar marcas.' }, { status: 500 })
  }
}
