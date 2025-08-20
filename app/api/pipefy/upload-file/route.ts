// app/api/pipefy/upload-file/route.ts
import { NextRequest, NextResponse } from 'next/server'
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

    // 2. Obter dados do body JSON
    const { cardId, fieldId, fileName, contentType } = await request.json();

    // 3. Validar dados obrigatórios
    if (!cardId || !fieldId || !fileName || !contentType) {
      return NextResponse.json(
        { error: 'Card ID, Field ID, fileName e contentType são obrigatórios' },
        { status: 400 }
      );
    }

    // 4. Gerar presigned URL via Pipefy service
    const { url, downloadUrl } = await pipefyService.createPresignedUrl(fileName, contentType);

    // 5. Extrair path e atualizar campo
    const urlParts = downloadUrl.split('/uploads/');
    const filePath = urlParts[1] ? urlParts[1].split('?')[0] : '';
    const organizationUuid = pipefyService.getConfig().ORG_UUID;
    const fullPath = `orgs/${organizationUuid}/uploads/${filePath}`;

    // 6. Atualizar campo no card
    const updateSuccess = await pipefyService.updateCardFields(cardId, [
      { fieldId: fieldId, value: [fullPath] }
    ]);

    if (!updateSuccess) {
      return NextResponse.json(
        { error: 'Falha ao atualizar campo do card' },
        { status: 500 }
      );
    }

    // 7. Retornar URLs para upload
    return NextResponse.json({
      success: true,
      uploadUrl: url,
      downloadUrl
    });

  } catch (error) {
    logger.error('Erro na API upload-file:', error);
    
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
