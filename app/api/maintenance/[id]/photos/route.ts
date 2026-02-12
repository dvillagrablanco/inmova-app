/**
 * API para subir fotos de mantenimiento
 * Permite subir hasta 5 fotos por solicitud
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { deleteFile, uploadFile } from '@/lib/s3';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// POST /api/maintenance/[id]/photos - Subir fotos de mantenimiento
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const maintenanceId = params.id;

    // Verificar que la solicitud existe
    const maintenance = await prisma.maintenanceRequest.findUnique({
      where: { id: maintenanceId },
    });

    if (!maintenance) {
      return NextResponse.json(
        { error: 'Solicitud de mantenimiento no encontrada' },
        { status: 404 }
      );
    }

    // Obtener FormData
    const formData = await req.formData();
    const files = formData.getAll('photos') as File[];
    const type = formData.get('type') as string; // 'problem' o 'completed'

    if (!type || !['problem', 'completed'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de foto inválido. Use "problem" o "completed"' },
        { status: 400 }
      );
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron archivos' },
        { status: 400 }
      );
    }

    if (files.length > 5) {
      return NextResponse.json(
        { error: 'Máximo 5 fotos por solicitud' },
        { status: 400 }
      );
    }

    // Validar que sean imágenes
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: `El archivo ${file.name} no es una imagen válida` },
          { status: 400 }
        );
      }
    }

    // Subir archivos a S3
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const timestamp = Date.now();
      const filename = `${timestamp}_${file.name.replace(/\s+/g, '_')}`;
      const s3Key = await uploadFile(
        buffer,
        `maintenance/${maintenanceId}/${type}/${filename}`
      );
      uploadedUrls.push(s3Key);
    }

    // Actualizar la solicitud de mantenimiento
    const fieldToUpdate = type === 'problem' ? 'fotosProblem' : 'fotosCompletado';
    const currentPhotos = type === 'problem' ? maintenance.fotosProblem : maintenance.fotosCompletado;

    const updatedMaintenance = await prisma.maintenanceRequest.update({
      where: { id: maintenanceId },
      data: {
        [fieldToUpdate]: [...currentPhotos, ...uploadedUrls],
      },
    });

    return NextResponse.json({
      success: true,
      uploadedCount: uploadedUrls.length,
      photos: uploadedUrls,
      maintenance: updatedMaintenance,
    });
  } catch (error) {
    logger.error('Error subiendo fotos de mantenimiento:', error);
    return NextResponse.json(
      { error: 'Error al subir fotos' },
      { status: 500 }
    );
  }
}

// DELETE /api/maintenance/[id]/photos - Eliminar una foto específica
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const maintenanceId = params.id;
    const { searchParams } = new URL(req.url);
    const photoUrl = searchParams.get('url');
    const type = searchParams.get('type'); // 'problem' o 'completed'

    if (!photoUrl || !type) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    const maintenance = await prisma.maintenanceRequest.findUnique({
      where: { id: maintenanceId },
    });

    if (!maintenance) {
      return NextResponse.json(
        { error: 'Solicitud de mantenimiento no encontrada' },
        { status: 404 }
      );
    }

    // Remover la URL del array correspondiente
    const fieldToUpdate = type === 'problem' ? 'fotosProblem' : 'fotosCompletado';
    const currentPhotos = type === 'problem' ? maintenance.fotosProblem : maintenance.fotosCompletado;
    const updatedPhotos = currentPhotos.filter((url) => url !== photoUrl);

    const updatedMaintenance = await prisma.maintenanceRequest.update({
      where: { id: maintenanceId },
      data: {
        [fieldToUpdate]: updatedPhotos,
      },
    });

    try {
      await deleteFile(photoUrl);
    } catch (error) {
      logger.error('Error eliminando archivo de S3:', error);
    }

    return NextResponse.json({
      success: true,
      maintenance: updatedMaintenance,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('Error eliminando foto de mantenimiento:', error);
    return NextResponse.json(
      { error: 'Error al eliminar foto', details: message },
      { status: 500 }
    );
  }
}
