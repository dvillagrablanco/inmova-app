export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

import logger from '@/lib/logger';
/**
 * GET /api/professional/clients
 * Lista los clientes (inquilinos y propietarios) del profesional
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener companyId del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { companyId: true },
    });

    if (!user?.companyId) {
      return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Obtener inquilinos como clientes
    const whereClause: { companyId: string } = {
      companyId: user.companyId,
    };

    // Construir lista de clientes a partir de inquilinos con contratos
    const tenants = await prisma.tenant.findMany({
      where: whereClause,
      include: {
        contracts: {
          include: {
            unit: {
              include: {
                building: true,
              },
            },
          },
          orderBy: { fechaInicio: 'desc' },
          take: 1,
        },
      },
      orderBy: { nombreCompleto: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const contractIds = tenants.flatMap((tenant) =>
      tenant.contracts.map((contract) => contract.id)
    );

    const payments = contractIds.length
      ? await prisma.payment.findMany({
          where: {
            contractId: { in: contractIds },
          },
          select: {
            contractId: true,
            estado: true,
            fechaVencimiento: true,
          },
          orderBy: { fechaVencimiento: 'asc' },
        })
      : [];

    const paymentsByContract = new Map<string, typeof payments>();
    payments.forEach((payment) => {
      const existing = paymentsByContract.get(payment.contractId) || [];
      existing.push(payment);
      paymentsByContract.set(payment.contractId, existing);
    });

    const total = await prisma.tenant.count({ where: whereClause });

    // Calcular estadísticas
    const activeContracts = await prisma.contract.count({
      where: {
        companyId: user.companyId,
        estado: 'activo',
      },
    });

    const totalRevenue = await prisma.contract.aggregate({
      where: {
        companyId: user.companyId,
        estado: 'activo',
      },
      _sum: {
        rentaMensual: true,
      },
    });

    // Obtener propiedades gestionadas
    const totalProperties = await prisma.unit.count({
      where: {
        building: {
          companyId: user.companyId,
        },
      },
    });

    // Pagos pendientes
    const pendingPayments = await prisma.payment.count({
      where: {
        contract: {
          companyId: user.companyId,
        },
        estado: 'pendiente',
      },
    });

    // Formatear clientes
    const clients = tenants.map((tenant) => {
      const activeContract = tenant.contracts.find((c) => c.estado === 'activo');
      const latestContract = tenant.contracts[0];
      const tenantPayments = tenant.contracts.flatMap(
        (contract) => paymentsByContract.get(contract.id) || []
      );
      const now = new Date();
      const pendingPayments = tenantPayments.filter((payment) =>
        ['pendiente', 'vencido'].includes(payment.estado)
      );
      const overduePayment = pendingPayments.find(
        (payment) => payment.estado === 'vencido' || payment.fechaVencimiento < now
      );
      const nextPayment = pendingPayments[0];

      return {
        id: tenant.id,
        name: tenant.nombreCompleto,
        email: tenant.email,
        phone: tenant.telefono || '',
        type: 'individual' as const,
        status: activeContract ? 'active' : latestContract ? 'inactive' : 'pending',
        propertiesCount: tenant.contracts.length,
        monthlyRevenue: activeContract ? Number(activeContract.rentaMensual) : 0,
        contractStart: latestContract?.fechaInicio?.toISOString() || null,
        contractEnd: latestContract?.fechaFin?.toISOString() || null,
        nextBilling: nextPayment?.fechaVencimiento?.toISOString() || null,
        paymentStatus: overduePayment
          ? 'overdue'
          : nextPayment
            ? 'pending'
            : 'paid',
        lastContact: tenant.updatedAt?.toISOString() || tenant.createdAt.toISOString(),
        tags: activeContract ? [latestContract?.unit?.building?.nombre || 'Sin edificio'] : [],
        unit: latestContract?.unit
          ? {
              id: latestContract.unit.id,
              numero: latestContract.unit.numero,
              building: {
                id: latestContract.unit.building.id,
                nombre: latestContract.unit.building.nombre,
              },
            }
          : null,
      };
    });

    // Filtrar por status si se especifica
    let filteredClients = clients;
    if (status && status !== 'all') {
      filteredClients = clients.filter((c) => c.status === status);
    }

    const stats = {
      totalClients: total,
      activeClients: clients.filter((c) => c.status === 'active').length,
      totalProperties,
      monthlyRevenue: Number(totalRevenue._sum.rentaMensual) || 0,
      pendingPayments,
      avgPropertiesPerClient: total > 0 ? Math.round(totalProperties / total * 10) / 10 : 0,
    };

    return NextResponse.json({
      clients: filteredClients,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    logger.error('[PROFESSIONAL_CLIENTS_GET]', error);
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 });
  }
}
