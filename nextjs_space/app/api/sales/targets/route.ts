import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/sales/targets - Obtener todos los objetivos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const salesRepId = searchParams.get('salesRepId');
    const periodo = searchParams.get('periodo');
    const activo = searchParams.get('activo');

    // Construir filtros
    const where: any = {
      companyId: session.user.companyId,
    };

    // Si es un comercial, solo mostrar sus propios objetivos
    if ((session.user as any).userType === 'sales_representative') {
      const salesRep = await prisma.salesRepresentative.findUnique({
        where: { email: session.user.email },
      });
      if (salesRep) {
        where.salesRepresentativeId = salesRep.id;
      }
    } else if (salesRepId) {
      // Si es admin y especifica un salesRepId, filtrar por ese
      where.salesRepresentativeId = salesRepId;
    }

    if (periodo) {
      where.periodo = periodo;
    }

    if (activo !== null && activo !== undefined) {
      where.activo = activo === 'true';
    }

    const targets = await prisma.salesTarget.findMany({
      where,
      include: {
        salesRepresentative: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        fechaInicio: 'desc',
      },
    });

    return NextResponse.json(targets);
  } catch (error) {
    logError('Error en GET /api/sales/targets', error as Error);
    return NextResponse.json(
      { error: 'Error al obtener objetivos' },
      { status: 500 }
    );
  }
}

// POST /api/sales/targets - Crear nuevo objetivo
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo admins pueden crear objetivos
    if (session.user.role !== 'super_admin' && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Validar campos requeridos
    if (
      !data.salesRepresentativeId ||
      !data.periodo ||
      !data.fechaInicio ||
      !data.fechaFin
    ) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const target = await prisma.salesTarget.create({
      data: {
        companyId: session.user.companyId,
        salesRepresentativeId: data.salesRepresentativeId,
        periodo: data.periodo,
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: new Date(data.fechaFin),
        metaVentas: data.metaVentas || null,
        metaLeads: data.metaLeads || null,
        metaConversiones: data.metaConversiones || null,
        metaRevenue: data.metaRevenue || null,
        ventasActuales: 0,
        leadsActuales: 0,
        conversionesActuales: 0,
        revenueActual: 0,
        descripcion: data.descripcion || null,
        activo: data.activo !== undefined ? data.activo : true,
      },
      include: {
        salesRepresentative: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
          },
        },
      },
    });

    logger.info(`Objetivo creado: ${target.id}`);

    return NextResponse.json(target, { status: 201 });
  } catch (error) {
    logError('Error en POST /api/sales/targets', error as Error);
    return NextResponse.json(
      { error: 'Error al crear objetivo' },
      { status: 500 }
    );
  }
}
