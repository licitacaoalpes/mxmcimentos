import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

type Params = { params: { id: string } }

// GET /api/transacoes/:id — busca transação com pagamentos
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('transacoes')
      .select('*, clientes(nome, cidade), pagamentos(*)')
      .eq('id', params.id)
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 })

    return NextResponse.json(data)
  } catch (err) {
    console.error('[GET /api/transacoes/:id]', err)
    return NextResponse.json({ error: 'Erro ao buscar transação.' }, { status: 500 })
  }
}

// PUT /api/transacoes/:id — atualiza dados da transação
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json()
    const { id } = params

    if (body.quantidade_sacos && body.valor_por_saco) {
      body.valor_transferido = body.quantidade_sacos * body.valor_por_saco
    }

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('transacoes')
      .update(body)
      .eq('id', id)
      .select('*, clientes(nome, cidade), pagamentos(*)')
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
