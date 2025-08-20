// app/api/pipefy/upload-file/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server';
import { pipefyService } from '@/lib/services/pipefy';
import { logger } from '@/utils/logger';

export async function POST(request: NextRequest) {
  try {
    console.warn('🚀 [API] upload-file iniciado');
    
    // 1. Verificar autenticação
    const supabase = await createClient();
    console.warn('✅ [API] Supabase client criado');
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.warn('🔐 [API] Session check:', { hasSession: !!session, error: sessionError?.message });
    
    if (sessionError || !session) {
      console.warn('❌ [API] Usuário não autenticado');
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // 2. Obter dados do FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fieldId = formData.get('fieldId') as string;
    const cardId = formData.get('cardId') as string;
    
    console.warn('📥 [API] FormData recebido:', { 
      cardId, 
      fieldId, 
      fileName: file?.name, 
      fileSize: file?.size,
      contentType: file?.type 
    });

    // 3. Validar dados obrigatórios
    if (!cardId || !fieldId || !file) {
      return NextResponse.json(
        { error: 'Card ID, Field ID e arquivo são obrigatórios' },
        { status: 400 }
      );
    }

    // 4. Gerar presigned URL via Pipefy service
    const fileName = `${cardId}_${fieldId}_${Date.now()}.${file.type.split('/')[1] || 'jpg'}`;
    console.warn('🔄 [API] Criando presigned URL:', { fileName, contentType: file.type });
    const { url, downloadUrl } = await pipefyService.createPresignedUrl(fileName, file.type);
    console.warn('📝 [API] Presigned URL criado:', { hasUrl: !!url, hasDownloadUrl: !!downloadUrl });

    // 5. Extrair path e atualizar campo
    const urlParts = downloadUrl.split('/uploads/');
    const filePath = urlParts[1] ? urlParts[1].split('?')[0] : '';
    const organizationUuid = pipefyService.getConfig().ORG_UUID;
    const fullPath = `orgs/${organizationUuid}/uploads/${filePath}`;
    
    console.warn('🔧 [API] Preparando update campo:', { 
      urlParts: urlParts.length, 
      filePath, 
      organizationUuid, 
      fullPath 
    });

    // 6. Atualizar campo de arquivo no card
    console.warn('📝 [API] Iniciando updateFileField:', { cardId, fieldId, fullPath });
    const updateSuccess = await pipefyService.updateFileField(cardId, fieldId, fullPath);
    console.warn('📋 [API] Resultado updateFileField:', updateSuccess);

    if (!updateSuccess) {
      return NextResponse.json(
        { error: 'Falha ao atualizar campo do card' },
        { status: 500 }
      );
    }

    // 7. Fazer upload do arquivo e retornar sucesso
    console.warn('📤 [API] Fazendo upload do arquivo');
    const uploadResponse = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      }
    });

    if (!uploadResponse.ok) {
      console.warn('❌ [API] Falha no upload:', uploadResponse.status);
      throw new Error(`Erro no upload do arquivo: ${uploadResponse.status}`);
    }

    console.warn('✅ [API] Upload concluído com sucesso');
    return NextResponse.json({
      success: true,
      downloadUrl,
      message: 'Arquivo enviado e campo atualizado com sucesso'
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
