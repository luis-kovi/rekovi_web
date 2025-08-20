// app/api/pipefy/add-comment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { pipefyService } from '@/lib/services/pipefy';
import { logger } from '@/utils/logger';

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticação
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // 2. Obter dados do request
    const body = await request.json();
    const { cardId, text, includeUserInfo = true } = body;

    // 3. Validar dados obrigatórios
    if (!cardId || !text) {
      return NextResponse.json(
        { error: 'Card ID e texto são obrigatórios' },
        { status: 400 }
      );
    }

    // 4. Validar comprimento do texto
    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Comentário muito longo. Máximo: 5000 caracteres' },
        { status: 400 }
      );
    }

    // 5. Preparar texto do comentário
    let commentText = text.trim();
    
    if (includeUserInfo) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const userEmail = user?.email || 'Usuário desconhecido';
        commentText = `${userEmail}: ${commentText}`;
      } catch (userError) {
        logger.warn('Erro ao obter dados do usuário:', userError);
        // Continuar sem info do usuário
      }
    }

    // 6. Adicionar comentário no Pipefy
    const success = await pipefyService.addComment(cardId, commentText);

    if (!success) {
      return NextResponse.json(
        { error: 'Falha ao adicionar comentário no Pipefy' },
        { status: 500 }
      );
    }

    // 7. Retornar sucesso
    return NextResponse.json({
      success: true,
      message: 'Comentário adicionado com sucesso'
    });

  } catch (error) {
    logger.error('Erro na API add-comment:', error);
    
    // Retornar erro específico se disponível
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Métodos permitidos
export async function GET() {
  return NextResponse.json(
    { error: 'Método não permitido' },
    { status: 405 }
  );
}
