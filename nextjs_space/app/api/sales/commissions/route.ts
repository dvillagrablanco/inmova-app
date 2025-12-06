import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/sales/commissions - Obtener todas las comisiones
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const salesRepId = searchParams.get('salesRepId');
    const estado = searchParams.get('estado');
    const periodo = searchParams.get('periodo');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    // Construir filtros
    const where: any = {
      companyId: session.user.companyId,
    };

    // Si es un comercial, solo mostrar sus propias comisiones
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

    if (estado) {
      where.estado = estado;
    }

    if (periodo) {
      where.periodo = periodo;
    }

    // Filtrar por año y mes si se proporcionan
    if (year || month) {
      const startDate = new Date(
        parseInt(year || new Date().getFullYear().toString()),
        month ? parseInt(month) - 1 : 0,
        1
      );
      const endDate = new Date(
        parseInt(year || new Date().getFullYear().toString()),
        month ? parseInt(month) : 12,
        0
      );
      where.fechaCalculo = {
        gte: startDate,
        lte: endDate,
      };
    }

    const commissions = await prisma.salesCommission.findMany({
      where,
      include: {
        salesRep: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            email: true,
          },
        },
        },
      },
      orderBy: {
        fechaCalculo: 'desc',
      },
    });

    return NextResponse.json(commissions);
  } catch (error) {
    logError('Error en GET /api/sales/commissions', error as Error);
    return NextResponse.json(
      { error: 'Error al obtener comisiones' },
      { status: 500 }
    );
  }
}

// POST /api/sales/commissions - Crear nueva comisión
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Solo admins pueden crear comisiones
    if (session.user.role !== 'super_admin' && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const data = await request.json();

    // Validar campos requeridos
    if (!data.salesRepresentativeId || !data.monto || !data.periodo) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const commission = await prisma.salesCommission.create({
      data: {
        companyId: session.user.companyId,
        salesRepresentativeId: data.salesRepresentativeId,
        monto: parseFloat(data.monto),
        periodo: data.periodo,
        estado: data.estado || 'PENDIENTE',
        concepto: data.concepto || null,
        detalles: data.detalles || null,
        porcentaje: data.porcentaje || null,
        baseCalculo: data.baseCalculo || null,
      },
      include: {
        salesRep: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
          },
        },
      },
    });

    logger.info(`Comisión creada: ${commission.id}`);

    return NextResponse.json(commission, { status: 201 });
  } catch (error) {
    logError('Error en POST /api/sales/commissions', error as Error);
    return NextResponse.json(
      { error: 'Error al crear comisión' },
      { status: 500 }
    );
  }
}
