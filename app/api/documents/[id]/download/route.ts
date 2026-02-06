/**
 * API Route: Descargar documento privado con Signed URL
 * GET /api/documents/[id]/download
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getBucketConfig } from '@/lib/aws-config';
import { getSignedDownloadUrl } from '@/lib/s3';
import { getFileUrl, isLocalStorageAvailable } from '@/lib/local-storage';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // 2. Obtener documento de BD
    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: {
        tenant: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    // 3. Verificar permisos (por ahora permitir acceso con autenticación)
    // TODO: Implementar lógica de permisos más granular
    const canAccess = session.user.role === 'super_admin' || session.user.role === 'administrador';

    if (!canAccess && document.tenantId !== session.user.id) {
      // Verificar si tiene acceso por contrato o propiedad
      // Por ahora, permitir si está autenticado
    }

    const storagePath = document.cloudStoragePath;
    if (!storagePath) {
      return NextResponse.json(
        { error: 'Documento sin ruta de almacenamiento' },
        { status: 400 }
      );
    }

    // 4. Si ya es una URL pública, devolverla directamente
    if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
      return NextResponse.json({
        success: true,
        url: storagePath,
        expiresIn: 0,
        fileName: document.nombre,
        bucket: 'external',
        key: storagePath,
      });
    }

    // 5. Intentar descarga desde S3 si hay configuración válida
    const { bucketName } = getBucketConfig();
    const hasS3Config = Boolean(
      bucketName &&
        process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY &&
        process.env.AWS_REGION
    );

    if (hasS3Config) {
      const signedUrl = await getSignedDownloadUrl(storagePath);
      return NextResponse.json({
        success: true,
        url: signedUrl,
        expiresIn: 3600,
        fileName: document.nombre,
        bucket: bucketName,
        key: storagePath,
      });
    }

    // 6. Fallback a almacenamiento local si está disponible
    if (isLocalStorageAvailable()) {
      const localUrl = getFileUrl(storagePath);
      return NextResponse.json({
        success: true,
        url: localUrl,
        expiresIn: 0,
        fileName: document.nombre,
        bucket: 'local',
        key: storagePath,
      });
    }

    // 7. Log de acceso (auditoría) - Skip si la tabla no existe
    // await prisma.documentAccess.create(...) // TODO: Implementar cuando exista la tabla

    return NextResponse.json(
      { error: 'No hay almacenamiento configurado para descargar' },
      { status: 500 }
    );

  } catch (error: any) {
    logger.error('[Document Download Error]:', error);
    
    return NextResponse.json(
      {
        error: 'Error generando URL de descarga',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
