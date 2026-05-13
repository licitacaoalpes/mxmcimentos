import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

type Params = { params: { id: string; pagamentoId: string } }

// PUT /api/transacoes/:id/pagamentos/:pagamentoId
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id, pagamentoId } = params
    const body = await req.json()
    const { valor, data_pagamento, observacoes } = body

    if (!valor || isNaN(Number(valor)) || Number(valor) <= 0) {
      return NextResponse.json({ error: 'Valor inválido.' }, { status: 400 })
    }
    if (!data_pagamento) {
      return NextResponse.json({ error: 'Data obrigatória.' }, { status: 400 })
    }

    const supabase = getSupabase()

    // 1. Atualiza o pagamento
    const { error: updateErr } = await supabase
      .from('pagamentos')
      .update({ valor: Number(valor), data_pagamento, observacoes: observacoes || null })
      .eq('id', pagamentoId)
      .eq('transacao_id', id)

    if (updateErr) throw updateErr

    // 2. Busca o total da transação
    const { data: tx, error: txErr } = await supabase
      .from('transacoes')
      .select('valor_transferido, lucro_esperado')
      .eq('id', id)
      .single()

    if (txErr) throw txErr

    // 3. Soma todos os pagamentos (trigger não cobre UPDATE)
    const { data: pags, error: pagsErr } = await supabase
      .from('pagamentos')
      .select('valor')
      .eq('transacao_id', id)

    if (pagsErr) throw pagsErr

    const totalPago = (pags ?? []).reduce((acc, p) => acc + Number(p.valor), 0)
    const totalTx = Number(tx.valor_transferido) + Number(tx.lucro_esperado)
    const novaDataRetorno = totalPago >= totalTx ? new Date().toISOString().slice(0, 10) : null

    // 4. Recalcula valor_recebido e data_retorno manualmente
    const { error: txUpdateErr } = await supabase
      .from('transacoes')
      .update({ valor_recebido: totalPago, data_retorno: novaDataRetorno })
      .eq('id', id)

    if (txUpdateErr) throw txUpdateErr

    // 5. Retorna a transação completa atualizada
    const { data: updated, error: fetchErr } = await supabase
      .from('transacoes')
      .select('*, clientes(nome, cidade), pagamentos(*)')
      .eq('id', id)
      .single()

    if (fetchErr) throw fetchErr

    return NextResponse.json(updated)
  } catch (err) {
    console.error('[PUT /api/transacoes/:id/pagamentos/:pagamentoId]', err)
    return NextResponse.json({ error: 'Erro ao editar pagamento.' }, { status: 500 })
  }
}

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
