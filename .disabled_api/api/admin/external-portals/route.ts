import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
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
    const totalTenants = await prisma.tenant.count({
      where: companyFilter,
    });
    
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
        ...companyFilter,
        fechaPago: {
          gte: last30Days,
        },
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
    const totalOwners = await prisma.owner.count({
      where: companyFilter,
    });
    
    const activeOwners = await prisma.owner.count({
      where: companyFilter,
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
    const totalSalesReps = await prisma.salesRepresentative.count({
      where: companyFilter,
    });
    
    const activeSalesReps = await prisma.salesRepresentative.count({
      where: {
        ...companyFilter,
        activo: true,
      },
    });
    
    const salesLeads = await prisma.salesLead.count({
      where: {
        ...companyFilter,
        createdAt: {
          gte: last30Days,
        },
      },
    });
    
    const salesLeadsConverted = await prisma.salesLead.count({
      where: {
        ...companyFilter,
        estado: 'CERRADO_GANADO',
      },
    });
    
    const salesCommissionsPending = await prisma.salesCommission.count({
      where: {
        ...companyFilter,
        estado: 'PENDIENTE',
      },
    });
    
    const salesRecentActivity = await prisma.salesLead.count({
      where: {
        ...companyFilter,
        updatedAt: {
          gte: last7Days,
        },
      },
    });
    
    // ============================================
    // RESPUESTA CONSOLIDADA
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
                type: 'warning',
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
    logger.error('Error en /api/admin/external-portals:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas de portales externos' },
      { status: 500 }
    );
  }
}
