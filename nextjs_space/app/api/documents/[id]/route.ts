import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { deleteFile, downloadFile } from '@/lib/s3';

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
    console.error('Error fetching document:', error);
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
    console.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Error al eliminar documento' }, { status: 500 });
  }
}