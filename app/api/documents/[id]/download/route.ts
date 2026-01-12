/**
 * API Route: Descargar documento privado con Signed URL
 * GET /api/documents/[id]/download
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Configurar S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

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

    // 4. Generar Signed URL (válida 1 hora)
    // Bucket privado por defecto
    const bucket = document.cloudStoragePath.includes('/') ? 'inmova-private' : 'inmova';
    
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: document.cloudStoragePath, // S3 key
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hora
    });

    // 5. Log de acceso (auditoría) - Skip si la tabla no existe
    // await prisma.documentAccess.create(...) // TODO: Implementar cuando exista la tabla

    // 6. Respuesta
    return NextResponse.json({
      success: true,
      url: signedUrl,
      expiresIn: 3600,
      fileName: document.nombre,
      bucket,
      key: document.cloudStoragePath,
    });

  } catch (error: any) {
    console.error('[Document Download Error]:', error);
    
    return NextResponse.json(
      {
        error: 'Error generando URL de descarga',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
