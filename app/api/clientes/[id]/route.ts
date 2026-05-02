import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { NOMES_CIDADES } from '@/lib/cidades'

type Params = { params: { id: string } }

// PUT /api/clientes/:id
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json()

    if (body.nome !== undefined && !body.nome?.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 })
    }
    if (body.cidade && !NOMES_CIDADES.includes(body.cidade)) {
      return NextResponse.json({ error: 'Cidade inválida.' }, { status: 400 })
    }

    const update: Record<string, unknown> = {}
    if (body.nome)    update.nome     = body.nome.trim()
    if (body.cidade)  update.cidade   = body.cidade
    // Permite strings vazias para limpar telefone/email
    if ('telefone' in body) update.telefone = body.telefone?.trim() || null
    if ('email' in body)    update.email    = body.email?.trim()    || null

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('clientes')
      .update(update)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 })

    return NextResponse.json(data)
  } catch (err) {
    console.error('[PUT /api/clientes/:id]', err)
    return NextResponse.json({ error: 'Erro ao atualizar.' }, { status: 500 })
  }
}

// DELETE /api/clientes/:id — soft delete (mantém histórico nas transações)
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const supabase = getSupabase()
    const { error } = await supabase
      .from('clientes')
      .update({ ativo: false })
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/clientes/:id]', err)
    return NextResponse.json({ error: 'Erro ao excluir.' }, { status: 500 })
  }
}
