import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import type { ClienteInput } from '@/lib/types'
import { NOMES_CIDADES } from '@/lib/cidades'

// GET /api/clientes
export async function GET() {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('ativo', true)
      .order('nome', { ascending: true })

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error('[GET /api/clientes]', err)
    return NextResponse.json({ error: 'Erro ao buscar clientes.' }, { status: 500 })
  }
}

// POST /api/clientes
export async function POST(req: NextRequest) {
  try {
    const body: ClienteInput = await req.json()

    if (!body.nome?.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 })
    }
    if (!body.cidade) {
      return NextResponse.json({ error: 'Cidade é obrigatória.' }, { status: 400 })
    }
    if (!NOMES_CIDADES.includes(body.cidade)) {
      return NextResponse.json({ error: 'Cidade inválida.' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('clientes')
      .insert({
        nome: body.nome.trim(),
        telefone: body.telefone?.trim() || null,
        email: body.email?.trim() || null,
        cidade: body.cidade,
        ativo: true,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('[POST /api/clientes]', err)
    return NextResponse.json({ error: 'Erro ao criar cliente.' }, { status: 500 })
  }
}
