import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { subDays, startOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

/**
 * API para obtener estadísticas consolidadas de todos los portales externos
 * Accesible solo para super_admin
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Solo super_admin puede acceder
    if (session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    // Fechas de referencia
    const today = startOfDay(new Date());
    const last7Days = subDays(today, 7);
    const last30Days = subDays(today, 30);

    // Construir filtro de empresa si se proporciona
    const companyFilter = companyId ? { companyId } : {};

    // ============================================
    // PORTAL DE INQUILINOS
    // ============================================
    const totalTenants = await prisma.tenant.count({
      where: companyFilter,
    });

    // Contar inquilinos con contratos activos
    const activeContracts = await prisma.contract.count({
      where: {
        ...companyFilter,
        estado: 'activo',
      },
    });

    const tenantChatConversations = await prisma.chatConversation.count({
      where: {
        ...companyFilter,
        tenantId: { not: null },
      },
    });

    const tenantPaymentsLast30Days = await prisma.payment.count({
      where: {
        contract: companyId ? {
          unit: {
            building: {
              companyId
            }
          }
        } : {},
        fechaPago: {
          gte: last30Days,
        },
        metodoPago: { contains: 'Stripe' },
      },
    });

    const tenantRecentActivity = await prisma.chatConversation.count({
      where: {
        ...companyFilter,
        tenantId: { not: null },
        ultimoMensajeFecha: {
          gte: last7Days,
        },
      },
    });

    // ============================================
    // PORTAL DE PROVEEDORES
    // ============================================
    const totalProviders = await prisma.provider.count({
      where: companyFilter,
    });

    const activeProviders = await prisma.provider.count({
      where: {
        ...companyFilter,
        activo: true,
      },
    });

    const providerWorkOrders = await prisma.providerWorkOrder.count({
      where: {
        ...companyFilter,
        fechaAsignacion: {
          gte: last30Days,
        },
      },
    });

    const providerWorkOrdersCompleted = await prisma.providerWorkOrder.count({
      where: {
        ...companyFilter,
        estado: 'completada',
        fechaCompletado: {
          gte: last30Days,
        },
      },
    });

    const providersPendingInvoices = await prisma.providerWorkOrder.count({
      where: {
        ...companyFilter,
        estado: 'completada',
        firmadoPor: { not: null },
      },
    });

    // ============================================
    // PORTAL DE PROPIETARIOS
    // ============================================
    const totalOwners = await prisma.owner.count({
      where: companyFilter,
    });

    const activeOwners = await prisma.owner.count({
      where: {
        ...companyFilter,
        activo: true,
      },
    });

    const ownerBuildings = await prisma.ownerBuilding.count({
      where: companyFilter,
    });

    const ownerNotifications = await prisma.ownerNotification.count({
      where: {
        ...companyFilter,
        leida: false,
      },
    });

    const ownerRecentActivity = await prisma.owner.count({
      where: {
        ...companyFilter,
        updatedAt: {
          gte: last7Days,
        },
      },
    });

    // ============================================
    // EQUIPO COMERCIAL EXTERNO (SALES TEAM)
    // ============================================
    const totalSalesReps = await prisma.salesRepresentative.count({
      where: companyFilter,
    });

    const activeSalesReps = await prisma.salesRepresentative.count({
      where: {
        ...companyFilter,
        estado: 'ACTIVO',
      },
    });

    const salesLeads = await prisma.salesLead.count({
      where: {
        salesRep: companyFilter.companyId ? { companyId: companyFilter.companyId } : {},
        fechaCaptura: {
          gte: last30Days,
        },
      },
    });

    const salesLeadsConverted = await prisma.salesLead.count({
      where: {
        salesRep: companyFilter.companyId ? { companyId: companyFilter.companyId } : {},
        convertido: true,
        fechaConversion: {
          gte: last30Days,
        },
      },
    });

    const salesCommissionsPending = await prisma.salesCommission.count({
      where: {
        salesRep: companyFilter.companyId ? { companyId: companyFilter.companyId } : {},
        estado: 'PENDIENTE',
      },
    });

    const salesRecentActivity = await prisma.salesLead.count({
      where: {
        salesRep: companyFilter.companyId ? { companyId: companyFilter.companyId } : {},
        updatedAt: {
          gte: last7Days,
        },
      },
    });

    // ============================================
    // ACTIVIDAD RECIENTE CONSOLIDADA
    // ============================================
    const recentActivity = [];

    // Actividad de inquilinos (conversaciones de chat)
    const recentTenantChats = await prisma.chatConversation.findMany({
      where: {
        ...companyFilter,
        tenantId: { not: null },
      },
      orderBy: {
        ultimoMensajeFecha: 'desc',
      },
      take: 5,
    });

    // Obtener nombres de inquilinos
    const tenantIds = recentTenantChats.map(chat => chat.tenantId).filter(Boolean) as string[];
    const tenants = tenantIds.length > 0 ? await prisma.tenant.findMany({
      where: { id: { in: tenantIds } },
      select: { id: true, nombreCompleto: true }
    }) : [];
    const tenantsMap = new Map(tenants.map(t => [t.id, t.nombreCompleto]));

    recentActivity.push(
      ...recentTenantChats.map((chat) => ({
        type: 'tenant_chat',
        title: `Mensaje de inquilino: ${chat.tenantId ? tenantsMap.get(chat.tenantId) || 'Desconocido' : 'Desconocido'}`,
        description: chat.ultimoMensaje || 'Sin mensaje',
        timestamp: chat.ultimoMensajeFecha,
        portal: 'Portal de Inquilinos',
      }))
    );

    // Actividad de proveedores
    const recentProviderOrders = await prisma.providerWorkOrder.findMany({
      where: companyFilter,
      include: {
        provider: {
          select: { nombre: true }
        },
        building: {
          select: { nombre: true }
        },
      },
      orderBy: {
        fechaAsignacion: 'desc',
      },
      take: 5,
    });

    recentActivity.push(
      ...recentProviderOrders.map((order) => ({
        type: 'provider_order',
        title: `Orden de trabajo: ${order.titulo}`,
        description: `Proveedor: ${order.provider?.nombre || 'N/A'} - ${order.building?.nombre || 'N/A'}`,
        timestamp: order.fechaAsignacion,
        portal: 'Portal de Proveedores',
      }))
    );

    // Actividad de comerciales
    const recentSalesLeads = await prisma.salesLead.findMany({
      where: {
        salesRep: companyFilter.companyId ? { companyId: companyFilter.companyId } : {},
      },
      include: {
        salesRep: {
          select: { nombre: true }
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 5,
    });

    recentActivity.push(
      ...recentSalesLeads.map((lead) => ({
        type: 'sales_lead',
        title: `Nuevo lead: ${lead.nombreContacto} - ${lead.nombreEmpresa}`,
        description: `Comercial: ${lead.salesRep?.nombre || 'N/A'} - Estado: ${lead.estado}`,
        timestamp: lead.updatedAt,
        portal: 'Equipo Comercial',
      }))
    );

    // Ordenar toda la actividad reciente por fecha
    recentActivity.sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return dateB - dateA;
    });

    // ============================================
    // RESPUESTA CONSOLIDADA
    // ============================================
    const response = {
      summary: {
        totalTenants,
        totalProviders,
        totalOwners,
        totalSalesReps,
        totalActiveUsers: activeContracts + activeProviders + activeOwners + activeSalesReps,
      },
      tenantPortal: {
        total: totalTenants,
        active: activeContracts,
        conversations: tenantChatConversations,
        paymentsLast30Days: tenantPaymentsLast30Days,
        recentActivity: tenantRecentActivity,
        conversionRate: totalTenants > 0 ? ((activeContracts / totalTenants) * 100).toFixed(1) : '0',
      },
      providerPortal: {
        total: totalProviders,
        active: activeProviders,
        workOrders: providerWorkOrders,
        workOrdersCompleted: providerWorkOrdersCompleted,
        pendingInvoices: providersPendingInvoices,
        completionRate:
          providerWorkOrders > 0
            ? ((providerWorkOrdersCompleted / providerWorkOrders) * 100).toFixed(1)
            : '0',
      },
      ownerPortal: {
        total: totalOwners,
        active: activeOwners,
        buildings: ownerBuildings,
        unreadNotifications: ownerNotifications,
        recentActivity: ownerRecentActivity,
        avgBuildingsPerOwner: totalOwners > 0 ? (ownerBuildings / totalOwners).toFixed(1) : '0',
      },
      salesTeam: {
        total: totalSalesReps,
        active: activeSalesReps,
        leadsLast30Days: salesLeads,
        conversions: salesLeadsConverted,
        pendingCommissions: salesCommissionsPending,
        conversionRate:
          salesLeads > 0 ? ((salesLeadsConverted / salesLeads) * 100).toFixed(1) : '0',
        recentActivity: salesRecentActivity,
      },
      recentActivity: recentActivity.slice(0, 20),
      alerts: [
        ...(providersPendingInvoices > 5
          ? [
              {
                type: 'warning',
                portal: 'Proveedores',
                message: `${providersPendingInvoices} facturas pendientes de procesar`,
              },
            ]
          : []),
        ...(salesCommissionsPending > 10
          ? [
              {
                type: 'info',
                portal: 'Comerciales',
                message: `${salesCommissionsPending} comisiones pendientes de aprobación`,
              },
            ]
          : []),
        ...(ownerNotifications > 15
          ? [
              {
                type: 'info',
                portal: 'Propietarios',
                message: `${ownerNotifications} notificaciones no leídas`,
              },
            ]
          : []),
        ...(tenantChatConversations > 50 && tenantRecentActivity < 5
          ? [
              {
                type: 'warning',
                portal: 'Inquilinos',
                message: 'Baja actividad en conversaciones de inquilinos en los últimos 7 días',
              },
            ]
          : []),
      ],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error en /api/admin/external-portals:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas de portales externos' },
      { status: 500 }
    );
  }
}
