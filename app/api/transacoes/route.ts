import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import type { TransacaoInput } from '@/lib/types'

// GET /api/transacoes — retorna todas as transações ordenadas por data desc
export async function GET() {
  try {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('transacoes')
      .select('*, clientes(nome, cidade)')
      .order('data_transferencia', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (err) {
    console.error('[GET /api/transacoes]', err)
    return NextResponse.json({ error: 'Erro ao buscar transações.' }, { status: 500 })
  }
}

// POST /api/transacoes — cria uma nova transação
export async function POST(req: NextRequest) {
  try {
    const body: TransacaoInput = await req.json()

    // Validações básicas
    if (!body.cliente?.trim()) {
      return NextResponse.json({ error: 'Cliente é obrigatório.' }, { status: 400 })
    }
    if (!body.quantidade_sacos || body.quantidade_sacos <= 0) {
      return NextResponse.json({ error: 'Quantidade inválida.' }, { status: 400 })
    }
    if (!body.valor_por_saco || body.valor_por_saco <= 0) {
      return NextResponse.json({ error: 'Valor por saco inválido.' }, { status: 400 })
    }
    if (body.lucro_esperado == null || body.lucro_esperado < 0) {
      return NextResponse.json({ error: 'Lucro esperado inválido.' }, { status: 400 })
    }
    if (!body.data_transferencia) {
      return NextResponse.json({ error: 'Data de transferência obrigatória.' }, { status: 400 })
    }

    const valor_transferido = body.quantidade_sacos * body.valor_por_saco

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('transacoes')
      .insert({
        cliente: body.cliente.trim(),
        marca_cimento: body.marca_cimento,
        quantidade_sacos: body.quantidade_sacos,
        valor_por_saco: body.valor_por_saco,
        valor_transferido,
        lucro_esperado: body.lucro_esperado,
        data_transferencia: body.data_transferencia,
        data_retorno: null,
        observacoes: body.observacoes?.trim() ?? '',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('[POST /api/transacoes]', err)
    return NextResponse.json({ error: 'Erro ao criar transação.' }, { status: 500 })
  }
}
