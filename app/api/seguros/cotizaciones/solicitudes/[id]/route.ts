import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

const updateSchema = z.object({
  tipoSeguro: z.string().min(1).optional(),
  descripcion: z.string().min(1).optional(),
  sumaAsegurada: z.number().positive().optional().nullable(),
  coberturasSolicitadas: z.array(z.string()).optional(),
  direccionInmueble: z.string().optional().nullable(),
  superficieM2: z.number().positive().optional().nullable(),
  anoConstruccion: z.number().int().optional().nullable(),
  usoPrincipal: z.string().optional().nullable(),
  buildingId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  fechaLimiteRespuesta: z.string().optional().nullable(),
  estado: z.string().optional(),
});

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = await getPrisma();

    const solicitud = await prisma.insuranceQuoteRequest.findUnique({
      where: { id: params.id },
      include: {
        company: true,
        building: true,
        proveedores: {
          include: { provider: true },
        },
        quotations: {
          include: { provider: true },
        },
      },
    });

    if (!solicitud) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    if (solicitud.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    return NextResponse.json(solicitud);
  } catch (error) {
    logger.error('[API] Error fetching quote request:', error);
    return NextResponse.json(
      { error: 'Error al obtener solicitud de cotización' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const prisma = await getPrisma();

    const existing = await prisma.insuranceQuoteRequest.findUnique({
      where: { id: params.id },
      select: { companyId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    if (existing.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { fechaLimiteRespuesta, tipoSeguro, estado, ...rest } = parsed.data;

    const solicitud = await prisma.insuranceQuoteRequest.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(tipoSeguro !== undefined && { tipoSeguro: tipoSeguro as any }),
        ...(estado !== undefined && { estado: estado as any }),
        ...(fechaLimiteRespuesta !== undefined && {
          fechaLimiteRespuesta: fechaLimiteRespuesta ? new Date(fechaLimiteRespuesta) : null,
        }),
      },
      include: {
        company: true,
        building: true,
        proveedores: {
          include: { provider: true },
        },
        _count: { select: { quotations: true } },
      },
    });

    return NextResponse.json(solicitud);
  } catch (error) {
    logger.error('[API] Error updating quote request:', error);
    return NextResponse.json(
      { error: 'Error al actualizar solicitud de cotización' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = await getPrisma();

    const existing = await prisma.insuranceQuoteRequest.findUnique({
      where: { id: params.id },
      select: { companyId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 });
    }

    if (existing.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    await prisma.insuranceQuoteRequest.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[API] Error deleting quote request:', error);
    return NextResponse.json(
      { error: 'Error al eliminar solicitud de cotización' },
      { status: 500 }
    );
  }
}
