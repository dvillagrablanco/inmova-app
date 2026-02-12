import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// GET /api/legal/insurance/[id] - Obtener póliza específica
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
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

    const insurance = await prisma.insurance.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
      include: {
        building: true,
      },
    });

    if (!insurance) {
      return NextResponse.json(
        { error: 'Póliza no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(insurance);
  } catch (error) {
    logger.error('Error fetching insurance:', error);
    return NextResponse.json(
      { error: 'Error al obtener póliza' },
      { status: 500 }
    );
  }
}

// PATCH /api/legal/insurance/[id] - Actualizar póliza
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
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

    const body = await req.json();

    // Verificar que la póliza existe y pertenece a la compañía
    const existingInsurance = await prisma.insurance.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!existingInsurance) {
      return NextResponse.json(
        { error: 'Póliza no encontrada' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // Solo actualizar campos proporcionados
    if (body.tipoSeguro !== undefined) updateData.tipoSeguro = body.tipoSeguro;
    if (body.numeroPoliza !== undefined) updateData.numeroPoliza = body.numeroPoliza;
    if (body.aseguradora !== undefined) updateData.aseguradora = body.aseguradora;
    if (body.fechaInicio !== undefined) updateData.fechaInicio = new Date(body.fechaInicio);
    if (body.fechaVencimiento !== undefined) updateData.fechaVencimiento = new Date(body.fechaVencimiento);
    if (body.primaAnual !== undefined) updateData.primaAnual = parseFloat(body.primaAnual);
    if (body.cobertura !== undefined) updateData.cobertura = body.cobertura;
    if (body.estado !== undefined) updateData.estado = body.estado;
    if (body.buildingId !== undefined) updateData.buildingId = body.buildingId || null;
    if (body.contactoAgente !== undefined) updateData.contactoAgente = body.contactoAgente;
    if (body.notas !== undefined) updateData.notas = body.notas;

    const insurance = await prisma.insurance.update({
      where: { id: params.id },
      data: updateData,
      include: {
        building: true,
      },
    });

    return NextResponse.json(insurance);
  } catch (error) {
    logger.error('Error updating insurance:', error);
    return NextResponse.json(
      { error: 'Error al actualizar póliza' },
      { status: 500 }
    );
  }
}

// DELETE /api/legal/insurance/[id] - Eliminar póliza
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
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

    // Verificar que la póliza existe y pertenece a la compañía
    const existingInsurance = await prisma.insurance.findFirst({
      where: {
        id: params.id,
        companyId: user.companyId,
      },
    });

    if (!existingInsurance) {
      return NextResponse.json(
        { error: 'Póliza no encontrada' },
        { status: 404 }
      );
    }

    await prisma.insurance.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Póliza eliminada correctamente' });
  } catch (error) {
    logger.error('Error deleting insurance:', error);
    return NextResponse.json(
      { error: 'Error al eliminar póliza' },
      { status: 500 }
    );
  }
}
