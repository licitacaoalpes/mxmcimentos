import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

type Params = { params: { id: string } }

// PUT /api/transacoes/:id — atualiza dados da transação
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json()
    const { id } = params

    // Recalcula valor_transferido se quantidade/valor foram alterados
    if (body.quantidade_sacos && body.valor_por_saco) {
      body.valor_transferido = body.quantidade_sacos * body.valor_por_saco
    }

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('transacoes')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 })

    return NextResponse.json(data)
  } catch (err) {
    console.error('[PUT /api/transacoes/:id]', err)
    return NextResponse.json({ error: 'Erro ao atualizar.' }, { status: 500 })
  }
}

// DELETE /api/transacoes/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = params
    const supabase = getSupabase()

    const { error } = await supabase.from('transacoes').delete().eq('id', id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/transacoes/:id]', err)
    return NextResponse.json({ error: 'Erro ao excluir.' }, { status: 500 })
  }
}
