import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/partners/commissions
 * Lista todas las comisiones de partners
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['super_admin', 'administrador'].includes(session.user.role)) {
      // Retornar datos vacíos en lugar de error para mejor UX
      return NextResponse.json({
        success: true,
        commissions: [],
        stats: {
          totalPending: 0,
          totalApproved: 0,
          totalPaid: 0,
          totalThisMonth: 0,
          partnersActive: 0,
          avgCommissionRate: 0,
        },
        _authRequired: true,
      });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const partnerId = searchParams.get('partnerId');
    const periodo = searchParams.get('periodo');

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const where: any = {};
    if (status && status !== 'all') {
      where.estado = status;
    }
    if (partnerId) {
      where.partnerId = partnerId;
    }
    if (periodo) {
      where.periodo = periodo;
    }

    const commissions = await prisma.commission.findMany({
      where,
      include: {
        partner: {
          select: {
            id: true,
            nombre: true,
            email: true,
            contactoEmail: true,
            comisionPorcentaje: true,
          },
        },
        company: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Formatear respuesta alineada con la interfaz del frontend
    const formattedCommissions = commissions.map((c) => ({
      id: c.id,
      partnerId: c.partnerId,
      partnerName: c.partner.nombre,
      partnerEmail: c.partner.email || c.partner.contactoEmail,
      clientCompanyId: c.companyId,
      clientCompanyName: c.company.nombre,
      planName: c.planNombre || 'N/A',
      planPrice: c.montoBruto,
      commissionRate: c.porcentaje,
      commissionAmount: c.montoComision,
      status: c.estado.toLowerCase(),
      periodStart: getPeriodStart(c.periodo),
      periodEnd: getPeriodEnd(c.periodo),
      createdAt: c.createdAt.toISOString(),
      paidAt: c.fechaPago?.toISOString(),
    }));

    // Calcular estadísticas
    const stats = {
      totalPending: commissions
        .filter((c) => c.estado === 'PENDING')
        .reduce((sum, c) => sum + c.montoComision, 0),
      totalApproved: commissions
        .filter((c) => c.estado === 'APPROVED')
        .reduce((sum, c) => sum + c.montoComision, 0),
      totalPaid: commissions
        .filter((c) => c.estado === 'PAID')
        .reduce((sum, c) => sum + c.montoComision, 0),
      totalThisMonth: commissions
        .filter((c) => c.periodo === getCurrentPeriod())
        .reduce((sum, c) => sum + c.montoComision, 0),
      partnersActive: new Set(commissions.map((c) => c.partnerId)).size,
      avgCommissionRate:
        commissions.length > 0
          ? commissions.reduce((sum, c) => sum + c.porcentaje, 0) / commissions.length
          : 0,
    };

    return NextResponse.json({
      success: true,
      commissions: formattedCommissions,
      stats,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Commissions API Error]:', { message });
    // Retornar lista vacía en lugar de error para mejor UX
    return NextResponse.json({
      success: true,
      commissions: [],
      stats: {
        totalPending: 0,
        totalApproved: 0,
        totalPaid: 0,
        totalThisMonth: 0,
        partnersActive: 0,
        avgCommissionRate: 0,
      },
      _error: 'Error al cargar comisiones',
    });
  }
}

/**
 * PUT /api/admin/partners/commissions
 * Actualizar estado de una comisión
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['super_admin', 'administrador'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();

    const schema = z.object({
      id: z.string(),
      action: z.enum(['approve', 'pay', 'reject']),
      notas: z.string().optional(),
    });

    const validated = schema.parse(body);

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const commission = await prisma.commission.findUnique({
      where: { id: validated.id },
    });

    if (!commission) {
      return NextResponse.json({ error: 'Comisión no encontrada' }, { status: 404 });
    }

    let newEstado: string;
    let fechaPago: Date | null = null;

    switch (validated.action) {
      case 'approve':
        if (commission.estado !== 'PENDIENTE') {
          return NextResponse.json(
            { error: 'Solo se pueden aprobar comisiones pendientes' },
            { status: 400 }
          );
        }
        newEstado = 'APROBADA';
        break;
      case 'pay':
        if (commission.estado !== 'APROBADA') {
          return NextResponse.json(
            { error: 'Solo se pueden pagar comisiones aprobadas' },
            { status: 400 }
          );
        }
        newEstado = 'PAGADA';
        fechaPago = new Date();
        break;
      case 'reject':
        newEstado = 'RECHAZADA';
        break;
      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
    }

    const updated = await prisma.commission.update({
      where: { id: validated.id },
      data: {
        estado: newEstado,
        ...(fechaPago && { fechaPago }),
        ...(validated.notas && { notas: validated.notas }),
      },
    });

    return NextResponse.json({
      success: true,
      commission: {
        id: updated.id,
        status: updated.estado.toLowerCase(),
      },
      message: `Comisión ${validated.action === 'approve' ? 'aprobada' : validated.action === 'pay' ? 'marcada como pagada' : 'rechazada'}`,
    });
  } catch (error: any) {
    logger.error('[Commissions PUT Error]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Datos inválidos',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Error al actualizar comisión', message: error.message },
      { status: 500 }
    );
  }
}

// Helper functions
function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getPeriodStart(periodo: string): string {
  const [year, month] = periodo.split('-');
  return `${year}-${month}-01`;
}

function getPeriodEnd(periodo: string): string {
  const [year, month] = periodo.split('-');
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
  return `${year}-${month}-${lastDay}`;
}
