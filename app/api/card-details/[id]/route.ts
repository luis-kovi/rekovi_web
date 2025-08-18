// app/api/card-details/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const supabase = await createClient()
    
    // Buscar detalhes completos do card na view
    const { data, error } = await supabase
      .from('card_details')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Erro ao buscar detalhes do card:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar detalhes do card' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Card não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro na API de detalhes do card:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}