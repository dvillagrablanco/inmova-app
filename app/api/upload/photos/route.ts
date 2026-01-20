import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { S3Service } from '@/lib/s3-service';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // 2. Obtener archivo del FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'properties';

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    // 3. Convertir a Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 4. Validar archivo
    const validation = S3Service.validateImageFile(buffer, file.name);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // 5. Upload a S3
    const result = await S3Service.uploadFile(buffer, file.name, folder);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al subir archivo' },
        { status: 500 }
      );
    }

    // 6. Respuesta exitosa
    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
      filename: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error: any) {
    logger.error('[Upload Error]:', error);
    return NextResponse.json(
      { error: 'Error interno al procesar el archivo' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // 2. Obtener key del query
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Key no proporcionada' },
        { status: 400 }
      );
    }

    // 3. Eliminar de S3
    const success = await S3Service.deleteFile(key);

    if (!success) {
      return NextResponse.json(
        { error: 'Error al eliminar archivo' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Archivo eliminado exitosamente',
    });
  } catch (error: any) {
    logger.error('[Delete Error]:', error);
    return NextResponse.json(
      { error: 'Error interno al eliminar archivo' },
      { status: 500 }
    );
  }
}
