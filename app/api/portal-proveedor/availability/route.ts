import { NextRequest, NextResponse } from 'next/server';
import { requireProviderAuth } from '@/lib/provider-auth';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// GET /api/portal-proveedor/availability - Obtener disponibilidad del proveedor
export async function GET(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const auth = await requireProviderAuth(req);
    if (!auth.authenticated || !auth.provider) {
      return NextResponse.json(
        { error: auth.error || 'No autenticado' },
        { status: auth.status || 401 }
      );
    }

    const availability = await prisma.providerAvailability.findMany({
      where: {
        providerId: auth.provider.id,
      },
      orderBy: {
        fechaInicio: 'desc',
      },
    });

    return NextResponse.json(availability);
  } catch (error) {
    logger.error('Error al obtener disponibilidad:', error);
    return NextResponse.json(
      { error: 'Error al obtener disponibilidad' },
      { status: 500 }
    );
  }
}

// POST /api/portal-proveedor/availability - Crear período de disponibilidad
export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const auth = await requireProviderAuth(req);
    if (!auth.authenticated || !auth.provider) {
      return NextResponse.json(
        { error: auth.error || 'No autenticado' },
        { status: auth.status || 401 }
      );
    }

    const body = await req.json();
    const { estado, fechaInicio, fechaFin, motivo, notas } = body;

    // Validaciones
    if (!estado || !fechaInicio) {
      return NextResponse.json(
        { error: 'Estado y fecha de inicio son requeridos' },
        { status: 400 }
      );
    }

    // Crear registro de disponibilidad
    const availability = await prisma.providerAvailability.create({
      data: {
        providerId: auth.provider.id,
        companyId: auth.provider.companyId,
        estado,
        fechaInicio: new Date(fechaInicio),
        fechaFin: fechaFin ? new Date(fechaFin) : null,
        motivo,
        notas,
      },
    });

    logger.info(
      `Disponibilidad registrada para proveedor ${auth.provider.nombre}: ${estado}`
    );

    return NextResponse.json({
      success: true,
      message: 'Disponibilidad registrada exitosamente',
      availability,
    });
  } catch (error) {
    logger.error('Error al registrar disponibilidad:', error);
    return NextResponse.json(
      { error: 'Error al registrar disponibilidad' },
      { status: 500 }
    );
  }
}
