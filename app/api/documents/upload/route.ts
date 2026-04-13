import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { uploadFile } from '@/lib/s3';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_BYTES = 50 * 1024 * 1024;

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * POST /api/documents/upload
 * Multipart: file (required), nombre (optional), entityType + entityId (building), or folder=certificaciones
 */
export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
  const session = await getServerSession(authOptions);
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const companyId = session.user.companyId as string;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const nombre = (formData.get('nombre') as string) || file?.name;
    const entityType = formData.get('entityType') as string | null;
    const entityId = formData.get('entityId') as string | null;
    const folderTag = formData.get('folder') as string | null;

    if (!file || !nombre) {
      return NextResponse.json({ error: 'Archivo y nombre requeridos' }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'El archivo supera 50MB' }, { status: 400 });
    }

    let buildingId: string | undefined;
    let tipo: 'certificado_energetico' | 'otro' = 'otro';

    if (entityType === 'building' && entityId) {
      const building = await prisma.building.findFirst({
        where: { id: entityId, companyId },
        select: { id: true },
      });
      if (!building) {
        return NextResponse.json({ error: 'Edificio no encontrado' }, { status: 404 });
      }
      buildingId = entityId;
      tipo = 'otro';
    } else if (folderTag === 'certificaciones') {
      tipo = 'certificado_energetico';
    } else {
      return NextResponse.json(
        { error: 'Usa entityType=building con entityId, o folder=certificaciones' },
        { status: 400 }
      );
    }

    const defaultFolder =
      (await prisma.documentFolder.findFirst({
        where: { companyId, nombre: 'General', parentFolderId: null },
      })) ||
      (await prisma.documentFolder.create({
        data: {
          companyId,
          nombre: 'General',
          descripcion: 'Documentos generales',
          color: '#111827',
          icono: 'Folder',
        },
      }));

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `documents/${Date.now()}-${file.name.replace(/[^\w.\-]/g, '_')}`;
    const cloudStoragePath = await uploadFile(buffer, fileName);

    const document = await prisma.document.create({
      data: {
        nombre,
        tipo,
        cloudStoragePath,
        buildingId: buildingId || undefined,
        folderId: defaultFolder.id,
      },
      include: {
        building: { select: { nombre: true } },
        folder: { select: { nombre: true, color: true } },
      },
    });

    await prisma.documentVersion.create({
      data: {
        documentId: document.id,
        versionNumero: 1,
        cloud_storage_path: cloudStoragePath,
        tamano: file.size,
        uploadedBy: session.user.id,
        comentario: 'Versión inicial',
      },
    });

    return NextResponse.json(
      {
        success: true,
        document,
        url: document.cloudStoragePath,
        path: document.cloudStoragePath,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error in documents/upload:', error);
    return NextResponse.json({ error: 'Error al subir documento' }, { status: 500 });
  }
}
