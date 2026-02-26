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
  codigo: z.string().optional().nullable(),
  tipoSeguro: z.string().min(1).optional(),
  primaAnual: z.number().positive().optional(),
  primaMensual: z.number().positive().optional().nullable(),
  sumaAsegurada: z.number().positive().optional(),
  franquicia: z.number().optional().nullable(),
  coberturas: z.array(z.string()).optional(),
  exclusiones: z.array(z.string()).optional(),
  condicionesEspeciales: z.string().optional().nullable(),
  validaHasta: z.string().optional().nullable(),
  documentoUrl: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
  estado: z.string().optional(),
});

// GET - Single quotation by ID
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const prisma = await getPrisma();

    const quotation = await prisma.insuranceQuotation.findUnique({
      where: { id },
      include: {
        provider: true,
        request: {
          include: {
            proveedores: {
              include: { provider: true },
            },
          },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    if (quotation.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    return NextResponse.json(quotation);
  } catch (error) {
    logger.error('[Cotización GET by ID]:', error);
    return NextResponse.json({ error: 'Error al obtener cotización' }, { status: 500 });
  }
}

// PUT - Update quotation
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const prisma = await getPrisma();

    const existing = await prisma.insuranceQuotation.findUnique({
      where: { id },
      select: { companyId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    if (existing.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateSchema.parse(body);

    const dataToUpdate: Record<string, any> = { ...validated };
    if (validated.validaHasta !== undefined) {
      dataToUpdate.validaHasta = validated.validaHasta ? new Date(validated.validaHasta) : null;
    }
    if (validated.tipoSeguro) {
      dataToUpdate.tipoSeguro = validated.tipoSeguro as any;
    }
    if (validated.estado) {
      dataToUpdate.estado = validated.estado as any;
    }

    const updated = await prisma.insuranceQuotation.update({
      where: { id },
      data: dataToUpdate,
      include: {
        provider: true,
        request: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('[Cotización PUT]:', error);
    return NextResponse.json({ error: 'Error al actualizar cotización' }, { status: 500 });
  }
}

// DELETE - Remove quotation
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const prisma = await getPrisma();

    const existing = await prisma.insuranceQuotation.findUnique({
      where: { id },
      select: { companyId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    if (existing.companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    await prisma.insuranceQuotation.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Cotización eliminada' });
  } catch (error) {
    logger.error('[Cotización DELETE]:', error);
    return NextResponse.json({ error: 'Error al eliminar cotización' }, { status: 500 });
  }
}
