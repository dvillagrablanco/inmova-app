/**
 * API Route: Upload de archivos
 * POST /api/upload
 * 
 * Soporta:
 * - Imágenes (propiedades, avatars)
 * - Documentos PDF (contratos, facturas)
 * - Upload múltiple
 * - Validación de tipos y tamaños
 * 
 * Auth: Requiere sesión activa
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import * as S3Service from '@/lib/aws-s3-service';
import { FileType } from '@/lib/aws-s3-service';
import { checkStorageLimit, createLimitExceededResponse, logUsageWarning } from '@/lib/usage-limits';
import { trackUsage } from '@/lib/usage-tracking-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/upload
 * 
 * Body (multipart/form-data):
 * - files: File | File[] (archivos a subir)
 * - folder: string (carpeta destino: 'properties', 'documents', 'avatars')
 * - fileType: 'image' | 'document'
 * 
 * Response:
 * {
 *   success: true,
 *   uploads: [{ url: string, key: string }]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado. Inicia sesión para subir archivos.' },
        { status: 401 }
      );
    }

    // 2. Verificar que S3 esté configurado
    if (!S3Service.isS3Configured()) {
      return NextResponse.json(
        { 
          error: 'AWS S3 no configurado',
          message: 'El almacenamiento en la nube no está disponible. Contacta al administrador para configurar AWS S3.',
        },
        { status: 503 }
      );
    }

    // 3. Parsear FormData
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const folder = (formData.get('folder') as string) || 'uploads';
    const fileType = (formData.get('fileType') as FileType) || 'image';

    // Validar que haya archivos
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No se enviaron archivos' },
        { status: 400 }
      );
    }

    // 4. Convertir Files a Buffers
    const fileBuffers = await Promise.all(
      files.map(async (file) => ({
        buffer: Buffer.from(await file.arrayBuffer()),
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
      }))
    );

    // 5. Verificar límite de storage
    const totalSize = fileBuffers.reduce((sum, f) => sum + f.size, 0);
    const limitCheck = await checkStorageLimit(session.user.companyId, totalSize);
    
    if (!limitCheck.allowed) {
      return createLimitExceededResponse(limitCheck);
    }
    
    // Log warning si está cerca del límite (80%)
    logUsageWarning(session.user.companyId, limitCheck);

    // 6. Upload a S3
    const results = await S3Service.uploadMultipleToS3(fileBuffers, folder, fileType);

    // 6. Verificar si hubo errores
    const errors = results.filter((r) => !r.success);
    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Algunos archivos no se pudieron subir',
          details: errors,
          successful: results.filter((r) => r.success),
        },
        { status: 207 } // Multi-status
      );
    }

    // 7. Tracking de uso (Control de costos)
    const totalSizeGB = totalSize / (1024 * 1024 * 1024);
    await trackUsage({
      companyId: session.user.companyId,
      service: 's3',
      metric: 'storage_gb',
      value: totalSizeGB,
      metadata: {
        fileCount: files.length,
        folder,
        fileType,
        keys: results.map(r => r.key),
      },
    });

    // 8. Respuesta exitosa
    const uploads = results.map((r) => ({
      url: r.url,
      key: r.key,
    }));

    return NextResponse.json({
      success: true,
      uploads,
      count: uploads.length,
    });
  } catch (error: any) {
    console.error('[API Upload] Error:', error);

    // Error específico de AWS
    if (error.message?.includes('AWS')) {
      return NextResponse.json(
        {
          error: 'Error de almacenamiento',
          message: 'No se pudo conectar con el servicio de almacenamiento. Intenta de nuevo.',
        },
        { status: 503 }
      );
    }

    // Error genérico
    return NextResponse.json(
      {
        error: 'Error subiendo archivos',
        message: error.message || 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload?key=xxx
 * Genera una URL pre-firmada para acceso temporal
 * 
 * Query params:
 * - key: Key del objeto en S3
 * - expiresIn: Tiempo de expiración en segundos (default: 3600)
 * 
 * Response:
 * { url: string }
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // 2. Verificar que S3 esté configurado
    if (!S3Service.isS3Configured()) {
      return NextResponse.json(
        { error: 'AWS S3 no configurado' },
        { status: 503 }
      );
    }

    // 3. Parsear query params
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const expiresIn = parseInt(searchParams.get('expiresIn') || '3600');

    if (!key) {
      return NextResponse.json(
        { error: 'Key requerido' },
        { status: 400 }
      );
    }

    // 4. Generar URL pre-firmada
    const url = await S3Service.getSignedUrlForObject(key, expiresIn);

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('[API Upload GET] Error:', error);
    return NextResponse.json(
      { error: 'Error generando URL' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload?key=xxx
 * Elimina un archivo de S3
 * 
 * Query params:
 * - key: Key del objeto a eliminar
 * 
 * Response:
 * { success: true }
 */
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

    // 2. Verificar que S3 esté configurado
    if (!S3Service.isS3Configured()) {
      return NextResponse.json(
        { error: 'AWS S3 no configurado' },
        { status: 503 }
      );
    }

    // 3. Parsear query params
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Key requerido' },
        { status: 400 }
      );
    }

    // 4. Eliminar de S3
    const deleted = await S3Service.deleteFromS3(key);

    if (!deleted) {
      return NextResponse.json(
        { error: 'No se pudo eliminar el archivo' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API Upload DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Error eliminando archivo' },
      { status: 500 }
    );
  }
}
