import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { deleteFile, downloadFile } from '@/lib/s3';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: {
        tenant: { select: { nombreCompleto: true } },
        unit: { select: { numero: true } },
        building: { select: { nombre: true } },
        contract: { select: { id: true } },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error) {
    logger.error('Error fetching document:', error);
    return NextResponse.json({ error: 'Error al obtener documento' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const document = await prisma.document.findUnique({
      where: { id: params.id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    // Delete from S3
    await deleteFile(document.cloudStoragePath);

    // Delete from database
    await prisma.document.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Documento eliminado exitosamente' });
  } catch (error) {
    logger.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Error al eliminar documento' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const normalize = (value?: string | null) => {
      if (value === undefined || value === null) return undefined;
      const trimmed = String(value).trim();
      return trimmed.length === 0 ? null : trimmed;
    };

    const data: any = {};
    if ('tenantId' in body) data.tenantId = normalize(body.tenantId);
    if ('unitId' in body) data.unitId = normalize(body.unitId);
    if ('buildingId' in body) data.buildingId = normalize(body.buildingId);
    if ('contractId' in body) data.contractId = normalize(body.contractId);
    if ('folderId' in body) data.folderId = normalize(body.folderId);
    if ('descripcion' in body) data.descripcion = normalize(body.descripcion);
    if ('nombre' in body) data.nombre = normalize(body.nombre);
    if ('tipo' in body && body.tipo) data.tipo = body.tipo;
    if ('fechaVencimiento' in body) {
      data.fechaVencimiento = body.fechaVencimiento ? new Date(body.fechaVencimiento) : null;
    }
    if ('tags' in body && Array.isArray(body.tags)) {
      data.tags = body.tags;
    }

    const document = await prisma.document.update({
      where: { id: params.id },
      data,
      include: {
        tenant: { select: { nombreCompleto: true } },
        unit: { select: { numero: true } },
        building: { select: { nombre: true } },
        contract: { select: { id: true } },
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    logger.error('Error updating document:', error);
    return NextResponse.json({ error: 'Error al actualizar documento' }, { status: 500 });
  }
}
