import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { uploadFile } from '@/lib/s3';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const versions = await prisma.documentVersion.findMany({
      where: { documentId: params.id },
      orderBy: { versionNumero: 'desc' },
    });

    return NextResponse.json({ versions });
  } catch (error: any) {
    logger.error('Error fetching versions:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cargar versiones' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const comentario = formData.get('comentario') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Archivo requerido' },
        { status: 400 }
      );
    }

    // Get current document
    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: {
        versions: {
          orderBy: { versionNumero: 'desc' },
          take: 1,
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    // Upload new version to S3
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-v${document.versionActual + 1}-${file.name}`;
    const cloud_storage_path = await uploadFile(buffer, fileName);

    // Create new version
    const newVersionNumber = document.versionActual + 1;
    const version = await prisma.documentVersion.create({
      data: {
        documentId: params.id,
        versionNumero: newVersionNumber,
        cloud_storage_path,
        tamano: file.size,
        uploadedBy: session.user.id,
        comentario,
      },
    });

    // Update document version
    await prisma.document.update({
      where: { id: params.id },
      data: {
        versionActual: newVersionNumber,
        cloudStoragePath: cloud_storage_path,
      },
    });

    return NextResponse.json({ version }, { status: 201 });
  } catch (error: any) {
    logger.error('Error creating version:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear versión' },
      { status: 500 }
    );
  }
}
