// app/api/pipefy/update-card/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { pipefyService } from '@/lib/services/pipefy';
import { logger } from '@/utils/logger';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [API] update-card iniciado');
    
    // 1. Verificar autenticação
    const supabase = await createClient();
    console.log('✅ [API] Supabase client criado');
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('🔐 [API] Session check:', { hasSession: !!session, error: sessionError?.message });
    
    if (sessionError || !session) {
      console.log('❌ [API] Usuário não autenticado');
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // 2. Obter dados do request
    const body = await request.json();
    console.log('📥 [API] Body recebido:', { cardId: body.cardId, fieldsCount: body.fields?.length, hasComment: !!body.comment });
    const { cardId, fields, comment } = body;

    // 3. Validar dados obrigatórios
    if (!cardId) {
      return NextResponse.json(
        { error: 'Card ID é obrigatório' },
        { status: 400 }
      );
    }

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json(
        { error: 'Campos para atualização são obrigatórios' },
        { status: 400 }
      );
    }

    // 4. Validar estrutura dos campos
    const validFields = fields.every(field => 
      field && 
      typeof field.fieldId === 'string' && 
      field.fieldId.trim() !== '' &&
      field.value !== undefined
    );

    if (!validFields) {
      return NextResponse.json(
        { error: 'Estrutura de campos inválida' },
        { status: 400 }
      );
    }

    // 5. Atualizar campos no Pipefy
    console.log('🔄 [API] Iniciando updateCardFields:', { cardId, fieldsCount: fields.length });
    const updateSuccess = await pipefyService.updateCardFields(cardId, fields);
    console.log('📝 [API] UpdateCardFields resultado:', updateSuccess);

    if (!updateSuccess) {
      return NextResponse.json(
        { error: 'Falha ao atualizar card no Pipefy' },
        { status: 500 }
      );
    }

    // 6. Adicionar comentário se fornecido
    let commentSuccess = true;
    if (comment && comment.trim() !== '') {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const userEmail = user?.email || 'Usuário desconhecido';
        const commentText = `${userEmail}: ${comment}`;
        
        commentSuccess = await pipefyService.addComment(cardId, commentText);
      } catch (commentError) {
        logger.error('Erro ao adicionar comentário:', commentError);
        // Não falhar a operação por causa do comentário
        commentSuccess = false;
      }
    }

    // 7. Retornar sucesso
    return NextResponse.json({
      success: true,
      updateSuccess,
      commentSuccess,
      message: 'Card atualizado com sucesso'
    });

  } catch (error: any) {
    console.error('❌ [API] Erro na update-card:', error);
    logger.error('Erro na API update-card:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
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
