/**
 * API para gestión de suscripciones B2B
 * POST: Upgrade/downgrade de plan
 * GET: Historial de cambios
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { upgradeCompanyPlan, recordSubscriptionChange } from '@/lib/b2b-billing-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    // Solo super-admins pueden modificar suscripciones
    if (user?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Permiso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const { companyId, action, planId, razon } = body;

    if (!companyId || !action) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    if (action === 'upgrade' || action === 'downgrade') {
      if (!planId) {
        return NextResponse.json(
          { error: 'Plan ID requerido' },
          { status: 400 }
        );
      }

      const result = await upgradeCompanyPlan(companyId, planId, session.user.id);
      return NextResponse.json(result);
    }

    if (action === 'cancelacion') {
      const company = await prisma.company.findUnique({
        where: { id: companyId }
      });

      await prisma.company.update({
        where: { id: companyId },
        data: {
          estadoCliente: 'suspendido',
          subscriptionPlanId: null,
        }
      });

      await recordSubscriptionChange(companyId, 'cancelacion', {
        planAnteriorId: company?.subscriptionPlanId || undefined,
        razon,
        realizadoPor: session.user.id,
      });

      return NextResponse.json({ message: 'Suscripción cancelada' });
    }

    if (action === 'reactivacion') {
      if (!planId) {
        return NextResponse.json(
          { error: 'Plan ID requerido' },
          { status: 400 }
        );
      }

      await prisma.company.update({
        where: { id: companyId },
        data: {
          estadoCliente: 'activo',
          subscriptionPlanId: planId,
        }
      });

      await recordSubscriptionChange(companyId, 'reactivacion', {
        planNuevoId: planId,
        razon,
        realizadoPor: session.user.id,
      });

      return NextResponse.json({ message: 'Suscripción reactivada' });
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error al gestionar suscripción:', error);
    return NextResponse.json(
      { error: 'Error al gestionar suscripción', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    const isSuperAdmin = user?.role === 'super_admin';
    
    if (!isSuperAdmin && companyId !== user?.companyId) {
      return NextResponse.json({ error: 'Permiso denegado' }, { status: 403 });
    }

    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }

    const history = await prisma.b2BSubscriptionHistory.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            nombre: true,
          }
        },
      },
      orderBy: {
        fechaCambio: 'desc',
      },
      take: 50,
    });

    return NextResponse.json(history);
  } catch (error: any) {
    console.error('Error al obtener historial:', error);
    return NextResponse.json(
      { error: 'Error al obtener historial', details: error.message },
      { status: 500 }
    );
  }
}
