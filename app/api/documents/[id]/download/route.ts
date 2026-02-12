/**
 * API Route: Descargar documento privado con Signed URL
 * GET /api/documents/[id]/download
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getBucketConfig } from '@/lib/aws-config';
import { getSignedDownloadUrl } from '@/lib/s3';
import { getFileUrl, isLocalStorageAvailable } from '@/lib/local-storage';
import type { AuditAction } from '@/types/prisma-types';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    // 1. Autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const queryCompanyId = searchParams.get('companyId');
    const sessionUser = session.user as { role?: string | null; companyId?: string | null };
    const userRole = sessionUser.role;
    const sessionCompanyId = sessionUser.companyId;
    const companyId =
      queryCompanyId && (userRole === 'super_admin' || userRole === 'soporte')
        ? queryCompanyId
        : sessionCompanyId;
    if (!companyId) {
      return NextResponse.json(
        { error: 'Empresa no válida' },
        { status: 400 }
      );
    }

    const companyScope = {
      OR: [
        { building: { companyId } },
        { unit: { building: { companyId } } },
        { tenant: { companyId } },
        { contract: { unit: { building: { companyId } } } },
        { folder: { companyId } },
      ],
    };

    // 2. Obtener documento de BD
    const document = await prisma.document.findFirst({
      where: { AND: [{ id: params.id }, companyScope] },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      );
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

    if (companyId && session.user?.id) {
      try {
        await prisma.auditLog.create({
          data: {
            companyId,
            userId: session.user.id,
            action: 'EXPORT' as AuditAction,
            entityType: 'DOCUMENT',
            entityId: document.id,
            entityName: document.nombre,
            ipAddress: req.headers.get('x-forwarded-for') || undefined,
            userAgent: req.headers.get('user-agent') || undefined,
          },
        });
      } catch (auditError) {
        logger.warn('No se pudo registrar auditoría de descarga', {
          documentId: document.id,
        });
      }
    }

    return NextResponse.json(
      { error: 'No hay almacenamiento configurado para descargar' },
      { status: 500 }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Document Download Error]:', error);

    return NextResponse.json(
      {
        error: 'Error generando URL de descarga',
        message,
      },
      { status: 500 }
    );
  }
}
