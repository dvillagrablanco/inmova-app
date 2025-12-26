import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const inspection = await prisma.legalInspection.findUnique({
      where: { id: params.id },
    });

    if (!inspection) {
      return NextResponse.json({ error: 'Inspección no encontrada' }, { status: 404 });
    }

    return NextResponse.json(inspection);
  } catch (error) {
    logger.error('Error fetching inspection:', error);
    return NextResponse.json({ error: 'Error al obtener inspección' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.estado) updateData.estado = body.estado;
    if (body.fechaRealizada) updateData.fechaRealizada = new Date(body.fechaRealizada);
    if (body.observaciones !== undefined) updateData.observaciones = body.observaciones;
    if (body.checklist) updateData.checklist = body.checklist;
    if (body.daniosEncontrados !== undefined) updateData.daniosEncontrados = body.daniosEncontrados;
    if (body.costoEstimadoDanos !== undefined)
      updateData.costoEstimadoDanos = parseFloat(body.costoEstimadoDanos);
    if (body.fotosAntes) updateData.fotosAntes = body.fotosAntes;
    if (body.fotosDespues) updateData.fotosDespues = body.fotosDespues;
    if (body.reportePdfPath) updateData.reportePdfPath = body.reportePdfPath;

    const inspection = await prisma.legalInspection.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(inspection);
  } catch (error) {
    logger.error('Error updating inspection:', error);
    return NextResponse.json({ error: 'Error al actualizar inspección' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Verificar que la inspección existe y pertenece a la compañía
    const existingInspection = await prisma.legalInspection.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!existingInspection) {
      return NextResponse.json({ error: 'Inspección no encontrada' }, { status: 404 });
    }

    await prisma.legalInspection.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Inspección eliminada correctamente' });
  } catch (error) {
    logger.error('Error deleting inspection:', error);
    return NextResponse.json({ error: 'Error al eliminar inspección' }, { status: 500 });
  }
}
