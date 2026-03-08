import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/portal-inquilino/notifications?tenantId=xxx
 * Returns notifications for a tenant (payments, incidents, contract)
 * 
 * POST /api/portal-inquilino/notifications
 * Send notification to tenant (email + in-app)
 */
export async function GET(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    if (!tenantId) return NextResponse.json({ error: 'tenantId required' }, { status: 400 });

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, nombreCompleto: true, companyId: true },
    });
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    // Generate notifications from real data
    const notifications: any[] = [];
    const now = new Date();

    // 1. Upcoming payments
    const upcomingPayments = await prisma.payment.findMany({
      where: {
        estado: 'pendiente',
        fechaVencimiento: { gte: now, lte: new Date(now.getTime() + 15 * 86400000) },
        contract: { tenantId },
      },
      select: { id: true, monto: true, periodo: true, fechaVencimiento: true },
    });
    for (const p of upcomingPayments) {
      const days = Math.ceil((p.fechaVencimiento.getTime() - now.getTime()) / 86400000);
      notifications.push({
        id: `pay-${p.id}`,
        tipo: 'pago',
        titulo: `Recibo pendiente: ${p.monto}€`,
        mensaje: `Tu recibo de ${p.periodo} vence en ${days} días`,
        fecha: p.fechaVencimiento.toISOString(),
        prioridad: days <= 5 ? 'alta' : 'media',
        accion: '/portal-inquilino/pagos',
      });
    }

    // 2. Overdue payments
    const overduePayments = await prisma.payment.findMany({
      where: {
        estado: 'pendiente',
        fechaVencimiento: { lt: now },
        contract: { tenantId },
      },
      select: { id: true, monto: true, periodo: true },
    });
    for (const p of overduePayments) {
      notifications.push({
        id: `overdue-${p.id}`,
        tipo: 'pago_vencido',
        titulo: `⚠️ Pago vencido: ${p.monto}€`,
        mensaje: `El recibo de ${p.periodo} está vencido`,
        fecha: now.toISOString(),
        prioridad: 'alta',
        accion: '/portal-inquilino/pagos',
      });
    }

    // 3. Contract expiry
    const contracts = await prisma.contract.findMany({
      where: { tenantId, estado: 'activo', fechaFin: { lte: new Date(now.getTime() + 90 * 86400000) } },
      select: { id: true, fechaFin: true },
    });
    for (const c of contracts) {
      const days = Math.ceil((c.fechaFin.getTime() - now.getTime()) / 86400000);
      if (days > 0 && days <= 90) {
        notifications.push({
          id: `contract-${c.id}`,
          tipo: 'contrato',
          titulo: 'Tu contrato vence pronto',
          mensaje: `Tu contrato vence en ${days} días. Revisa la propuesta de renovación.`,
          fecha: c.fechaFin.toISOString(),
          prioridad: days <= 30 ? 'alta' : 'media',
          accion: '/portal-inquilino/renovacion',
        });
      }
    }

    // 4. Recent maintenance updates
    const incidents = await prisma.maintenanceRequest.findMany({
      where: {
        unit: { contracts: { some: { tenantId } } },
        updatedAt: { gte: new Date(now.getTime() - 7 * 86400000) },
      },
      select: { id: true, titulo: true, estado: true, updatedAt: true },
      take: 5,
    });
    for (const inc of incidents) {
      notifications.push({
        id: `maint-${inc.id}`,
        tipo: 'mantenimiento',
        titulo: inc.estado === 'completado' ? '✅ Incidencia resuelta' : 'Actualización de incidencia',
        mensaje: inc.titulo,
        fecha: inc.updatedAt.toISOString(),
        prioridad: 'baja',
        accion: '/portal-inquilino/incidencias',
      });
    }

    // Sort by priority then date
    const prioOrder: Record<string, number> = { alta: 0, media: 1, baja: 2 };
    notifications.sort((a, b) => (prioOrder[a.prioridad] || 2) - (prioOrder[b.prioridad] || 2));

    return NextResponse.json({
      success: true,
      notifications,
      summary: {
        total: notifications.length,
        alta: notifications.filter(n => n.prioridad === 'alta').length,
        media: notifications.filter(n => n.prioridad === 'media').length,
      },
    });
  } catch (error: any) {
    logger.error('[Tenant Notifications]:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const { tenantId, titulo, mensaje, tipo } = await request.json();
    if (!tenantId || !titulo) {
      return NextResponse.json({ error: 'tenantId y titulo requeridos' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { email: true, nombreCompleto: true },
    });
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

    // Send email notification
    try {
      const { sendEmail } = await import('@/lib/email-service');
      await sendEmail({
        to: tenant.email,
        subject: titulo,
        html: `<h3>${titulo}</h3><p>${mensaje || ''}</p><p><a href="${process.env.NEXTAUTH_URL}/portal-inquilino/dashboard">Acceder al portal</a></p>`,
      });
    } catch {}

    return NextResponse.json({ success: true, message: 'Notificación enviada' });
  } catch (error: any) {
    logger.error('[Tenant Notify POST]:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
