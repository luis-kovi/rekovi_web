// app/api/pipefy/upload-file/route.ts
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

    // 2. Obter dados do FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fieldId = formData.get('fieldId') as string;
    const cardId = formData.get('cardId') as string;

    // 3. Validar dados obrigatórios
    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo é obrigatório' },
        { status: 400 }
      );
    }

    if (!fieldId || !cardId) {
      return NextResponse.json(
        { error: 'Field ID e Card ID são obrigatórios' },
        { status: 400 }
      );
    }

    // 4. Validar tipo e tamanho do arquivo
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'application/pdf'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use: JPEG, PNG, WebP ou PDF' },
        { status: 400 }
      );
    }

    // Limite de 10MB
    const maxSize = 10 * 1024 * 1024; // 10MB em bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo permitido: 10MB' },
        { status: 400 }
      );
    }

    // 5. Upload do arquivo via Pipefy service
    const downloadUrl = await pipefyService.uploadFile(file, fieldId, cardId);

    // 6. Retornar sucesso
    return NextResponse.json({
      success: true,
      downloadUrl,
      message: 'Arquivo enviado com sucesso'
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
