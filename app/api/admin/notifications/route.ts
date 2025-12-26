import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { subDays, subHours } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  priority: 'high' | 'normal';
  title: string;
  message: string;
  details: string;
  timestamp: Date | null;
  portal: string;
  actionUrl: string;
  icon: string;
}

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const companyId = searchParams.get('companyId');
    const companyFilter = companyId ? { companyId } : {};
    const last24Hours = subHours(new Date(), 24);
    const last7Days = subDays(new Date(), 7);
    const notifications: Notification[] = [];
    // INQUILINOS - Chats
    const tenantChats = await prisma.chatConversation.findMany({
      where: {
        ...companyFilter,
        tenantId: { not: null },
        ultimoMensajeFecha: { gte: last24Hours },
      },
      orderBy: { ultimoMensajeFecha: 'desc' },
      take: 10,
    });
    const chatTenantIds = tenantChats.map((c) => c.tenantId).filter(Boolean) as string[];
    const chatTenants =
      chatTenantIds.length > 0
        ? await prisma.tenant.findMany({
            where: { id: { in: chatTenantIds } },
            select: { id: true, nombreCompleto: true },
          })
        : [];
    const tenantMap = new Map(chatTenants.map((t) => [t.id, t.nombreCompleto]));
    notifications.push(
      ...tenantChats.map((c) => ({
        id: `tenant_chat_${c.id}`,
        type: 'tenant_chat',
        priority: 'normal' as const,
        title: 'Nuevo mensaje de inquilino',
        message: `${c.tenantId ? tenantMap.get(c.tenantId) || 'Inquilino' : 'Inquilino'} ha enviado un mensaje`,
        details: c.ultimoMensaje || '',
        timestamp: c.ultimoMensajeFecha,
        portal: 'Inquilinos',
        actionUrl: '/chat',
        icon: 'message',
      }))
    );
    // INQUILINOS - Pagos (simplificado sin joins complejos)
    const recentPayments = await prisma.payment.findMany({
      where: {
        fechaPago: { gte: last24Hours },
        metodoPago: { contains: 'Stripe' },
      },
      orderBy: { fechaPago: 'desc' },
      take: 20,
    });

    // Obtener contracts para los pagos
    const contractIds = recentPayments.map((p) => p.contractId);
    const contracts = await prisma.contract.findMany({
      where: { id: { in: contractIds } },
      select: { id: true, tenantId: true, unitId: true },
    });
    type ContractData = { id: string; tenantId: string | null; unitId: string };
    const contractMap = new Map<string, ContractData>(contracts.map((c) => [c.id, c]));
    // Si hay filtro de companyId, obtener units con buildings y filtrar
    let filteredPayments = recentPayments;
    if (companyId) {
      const unitIds = contracts.map((c) => c.unitId);
      const units = await prisma.unit.findMany({
        where: {
          id: { in: unitIds },
          building: { companyId },
        },
        select: { id: true },
      });
      const validUnitIds = new Set(units.map((u) => u.id));
      filteredPayments = recentPayments.filter((p) => {
        const contract = contractMap.get(p.contractId);
        return contract !== undefined && validUnitIds.has(contract.unitId);
      });
    }
    // Obtener nombres de inquilinos
    const paymentTenantIds = filteredPayments
      .map((p) => contractMap.get(p.contractId)?.tenantId)
      .filter(Boolean) as string[];
    const paymentTenants =
      paymentTenantIds.length > 0
        ? await prisma.tenant.findMany({
            where: { id: { in: paymentTenantIds } },
          })
        : [];
    const paymentTenantMap = new Map(paymentTenants.map((t) => [t.id, t.nombreCompleto]));
    notifications.push(
      ...filteredPayments.slice(0, 10).map((p) => {
        const contract = contractMap.get(p.contractId);
        const tenantId = contract?.tenantId;
        return {
          id: `tenant_payment_${p.id}`,
          type: 'tenant_payment',
          priority: 'high' as const,
          title: 'Pago recibido',
          message: `${tenantId ? paymentTenantMap.get(tenantId) || 'Inquilino' : 'Inquilino'} ha realizado un pago de ${p.monto}€`,
          details: `Período: ${p.periodo}`,
          timestamp: p.fechaPago,
          portal: 'Inquilinos',
          actionUrl: '/pagos',
          icon: 'dollar',
        };
      })
    );
    // PROVEEDORES - Órdenes completadas
    const completedOrders = await prisma.providerWorkOrder.findMany({
      where: { ...companyFilter, estado: 'completada', fechaCompletado: { gte: last24Hours } },
      include: { provider: { select: { nombre: true } }, building: { select: { nombre: true } } },
      orderBy: { fechaCompletado: 'desc' },
    });
    notifications.push(
      ...completedOrders.map((o) => ({
        id: `provider_completed_${o.id}`,
        type: 'provider_order_completed',
        priority: 'high' as const,
        title: 'Orden completada',
        message: `${o.provider?.nombre || 'Proveedor'} completó: ${o.titulo}`,
        details: o.building?.nombre || '',
        timestamp: o.fechaCompletado,
        portal: 'Proveedores',
        actionUrl: `/ordenes-trabajo/${o.id}`,
        icon: 'check',
      }))
    );
    // PROVEEDORES - Órdenes pendientes de firma
    const pendingOrders = await prisma.providerWorkOrder.findMany({
      where: {
        ...companyFilter,
        estado: 'completada',
        firmadoPor: null,
        fechaCompletado: { gte: last7Days },
      },
      include: {
        provider: { select: { nombre: true } },
        building: { select: { nombre: true } },
      },
    });
    notifications.push(
      ...pendingOrders.map((o) => ({
        id: `provider_signature_${o.id}`,
        type: 'provider_order_signature',
        priority: 'normal' as const,
        title: 'Orden pendiente de firma',
        message: `"${o.titulo}" requiere firma`,
        details: `${o.provider?.nombre || ''} - ${o.building?.nombre || ''}`,
        portal: 'Proveedores',
        actionUrl: `/ordenes-trabajo/${o.id}`,
        timestamp: o.fechaCompletado,
        icon: 'signature',
      }))
    );
    // PROPIETARIOS - Notificaciones
    const ownerNotifs = await prisma.ownerNotification.findMany({
      where: { ...companyFilter, leida: false, createdAt: { gte: last7Days } },
      include: { owner: { select: { nombreCompleto: true } } },
      orderBy: { createdAt: 'desc' },
    });
    notifications.push(
      ...ownerNotifs.map((n) => ({
        id: `owner_${n.id}`,
        type: 'owner_notification',
        priority: 'normal' as const,
        title: n.titulo,
        message: n.mensaje,
        details: n.owner?.nombreCompleto || '',
        timestamp: n.createdAt,
        portal: 'Propietarios',
        actionUrl: '/admin/propietarios',
        icon: 'bell',
      }))
    );
    // COMERCIALES - Nuevos leads
    const newLeads = await prisma.salesLead.findMany({
      where: { ...(companyId ? companyFilter : {}), fechaCaptura: { gte: last24Hours } },
      include: { salesRep: { select: { nombre: true } } },
      orderBy: { fechaCaptura: 'desc' },
    });
    notifications.push(
      ...newLeads.map((l) => ({
        id: `lead_new_${l.id}`,
        type: 'sales_lead_new',
        priority: 'normal' as const,
        title: 'Nuevo lead',
        message: `${l.salesRep?.nombre || 'Comercial'} capturó: ${l.nombreContacto} - ${l.nombreEmpresa}`,
        details: `${l.emailContacto || ''} - ${l.telefonoContacto || ''}`,
        timestamp: l.fechaCaptura,
        portal: 'Comerciales',
        actionUrl: '/crm',
        icon: 'target',
      }))
    );
    // COMERCIALES - Leads convertidos
    const converted = await prisma.salesLead.findMany({
      where: {
        ...(companyId ? companyFilter : {}),
        convertido: true,
        fechaConversion: { gte: last24Hours },
      },
      include: {
        salesRep: { select: { nombre: true } },
      },
      orderBy: { fechaConversion: 'desc' },
    });
    notifications.push(
      ...converted.map((l) => ({
        id: `lead_converted_${l.id}`,
        type: 'sales_lead_converted',
        priority: 'high' as const,
        title: '¡Lead convertido!',
        message: `${l.salesRep?.nombre || 'Comercial'} convirtió: ${l.nombreContacto} - ${l.nombreEmpresa}`,
        details: `Valor: ${l.presupuestoMensual || 0}€/mes`,
        timestamp: l.fechaConversion,
        portal: 'Comerciales',
        actionUrl: '/crm',
        icon: 'trophy',
      }))
    );
    // COMERCIALES - Comisiones pendientes
    const commissions = await prisma.salesCommission.findMany({
      where: {
        ...(companyId ? companyFilter : {}),
        estado: 'PENDIENTE',
        createdAt: { gte: last7Days },
      },
      include: {
        salesRep: { select: { nombre: true } },
        lead: { select: { nombreContacto: true, nombreEmpresa: true } },
      },
    });
    notifications.push(
      ...commissions.map((c) => ({
        id: `commission_${c.id}`,
        type: 'sales_commission_pending',
        priority: 'normal' as const,
        title: 'Comisión pendiente',
        message: `${c.salesRep?.nombre || 'Comercial'} - ${c.montoComision}€`,
        details: c.lead ? `${c.lead.nombreContacto} - ${c.lead.nombreEmpresa}` : '',
        timestamp: c.createdAt,
        portal: 'Comerciales',
        actionUrl: '/admin/sales-team',
        icon: 'dollar',
      }))
    );
    // Ordenar y limitar
    notifications.sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return dateB - dateA;
    });
    const limitedNotifications = notifications.slice(0, limit);
    const counts = {
      total: notifications.length,
      high: notifications.filter((n) => n.priority === 'high').length,
      normal: notifications.filter((n) => n.priority === 'normal').length,
      byPortal: {
        inquilinos: notifications.filter((n) => n.portal === 'Inquilinos').length,
        proveedores: notifications.filter((n) => n.portal === 'Proveedores').length,
        propietarios: notifications.filter((n) => n.portal === 'Propietarios').length,
        comerciales: notifications.filter((n) => n.portal === 'Comerciales').length,
      },
    };
    return NextResponse.json({ notifications: limitedNotifications, counts });
  } catch (error) {
    logger.error('Error en /api/admin/notifications:', error);
    return NextResponse.json({ error: 'Error al obtener notificaciones' }, { status: 500 });
  }
}
