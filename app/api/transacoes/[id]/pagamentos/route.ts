import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import type { PagamentoInput } from '@/lib/types'

type Params = { params: { id: string } }

// POST /api/transacoes/:id/pagamentos — registra um pagamento parcial ou total
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = params
    const body: PagamentoInput = await req.json()

    if (!body.valor || body.valor <= 0) {
      return NextResponse.json({ error: 'Valor inválido.' }, { status: 400 })
    }
    if (!body.data_pagamento) {
      return NextResponse.json({ error: 'Data do pagamento obrigatória.' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Verifica se a transação existe e não está retornada
    const { data: tx, error: txErr } = await supabase
      .from('transacoes')
      .select('id, valor_transferido, lucro_esperado, valor_recebido, data_retorno')
      .eq('id', id)
      .single()

    if (txErr || !tx) {
      return NextResponse.json({ error: 'Transação não encontrada.' }, { status: 404 })
    }

    const valorTotal = tx.valor_transferido + tx.lucro_esperado
    const saldoRestante = valorTotal - (tx.valor_recebido ?? 0)

    if (saldoRestante <= 0) {
      return NextResponse.json({ error: 'Transação já está totalmente quitada.' }, { status: 400 })
    }

    if (body.valor > saldoRestante + 0.01) {
      return NextResponse.json(
        { error: `Valor excede o saldo em aberto de R$ ${saldoRestante.toFixed(2)}.` },
        { status: 400 },
      )
    }

    const { error: insertErr } = await supabase.from('pagamentos').insert({
      transacao_id: id,
      valor: body.valor,
      data_pagamento: body.data_pagamento,
      observacoes: body.observacoes?.trim() ?? '',
    })

    if (insertErr) throw insertErr

    // Retorna a transação atualizada pelo trigger (com valor_recebido e data_retorno atualizados)
    const { data: updated, error: fetchErr } = await supabase
      .from('transacoes')
      .select('*, clientes(nome, cidade), pagamentos(*)')
      .eq('id', id)
      .single()

    if (fetchErr) throw fetchErr

    return NextResponse.json(updated, { status: 201 })
  } catch (err) {
    console.error('[POST /api/transacoes/:id/pagamentos]', err)
    return NextResponse.json({ error: 'Erro ao registrar pagamento.' }, { status: 500 })
  }
}
