import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

type Params = { params: { id: string; pagamentoId: string } }

// DELETE /api/transacoes/:id/pagamentos/:pagamentoId
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id, pagamentoId } = params
    const supabase = getSupabase()

    const { error } = await supabase
      .from('pagamentos')
      .delete()
      .eq('id', pagamentoId)
      .eq('transacao_id', id)

    if (error) throw error

    // Retorna a transação atualizada (trigger já recalculou valor_recebido)
    const { data: updated, error: fetchErr } = await supabase
      .from('transacoes')
      .select('*, clientes(nome, cidade), pagamentos(*)')
      .eq('id', id)
      .single()

    if (fetchErr) throw fetchErr

    return NextResponse.json(updated)
  } catch (err) {
    console.error('[DELETE /api/transacoes/:id/pagamentos/:pagamentoId]', err)
    return NextResponse.json({ error: 'Erro ao excluir pagamento.' }, { status: 500 })
  }
}
