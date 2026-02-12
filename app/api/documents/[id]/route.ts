import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';
import { deleteFile } from '@/lib/s3';

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
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const queryCompanyId = searchParams.get('companyId');
    const userRole = (session.user as any).role;
    const sessionCompanyId = session.user.companyId;
    const companyId =
      queryCompanyId && (userRole === 'super_admin' || userRole === 'soporte')
        ? queryCompanyId
        : sessionCompanyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Empresa no válida' }, { status: 400 });
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

    const document = await prisma.document.findFirst({
      where: { AND: [{ id: params.id }, companyScope] },
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
  const prisma = await getPrisma();
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const queryCompanyId = searchParams.get('companyId');
    const userRole = (session.user as any).role;
    const sessionCompanyId = session.user.companyId;
    const companyId =
      queryCompanyId && (userRole === 'super_admin' || userRole === 'soporte')
        ? queryCompanyId
        : sessionCompanyId;
    if (!companyId) {
      return NextResponse.json({ error: 'Empresa no válida' }, { status: 400 });
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

    const document = await prisma.document.findFirst({
      where: { AND: [{ id: params.id }, companyScope] },
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
