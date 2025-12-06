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
        { error: 'No autorizado' },
        { status: 403 }
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
    // Contar inquilinos con contratos activos
    const activeContracts = await prisma.contract.count({
      where: {
        ...companyFilter,
        estado: 'activo',
      },
    const tenantChatConversations = await prisma.chatConversation.count({
        tenantId: { not: null },
    const tenantPaymentsLast30Days = await prisma.payment.count({
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
    const tenantRecentActivity = await prisma.chatConversation.count({
        ultimoMensajeFecha: {
          gte: last7Days,
    // PORTAL DE PROVEEDORES
    const totalProviders = await prisma.provider.count({
    const activeProviders = await prisma.provider.count({
        activo: true,
    const providerWorkOrders = await prisma.providerWorkOrder.count({
        fechaAsignacion: {
    const providerWorkOrdersCompleted = await prisma.providerWorkOrder.count({
        estado: 'completada',
        fechaCompletado: {
    const providersPendingInvoices = await prisma.providerWorkOrder.count({
        firmadoPor: { not: null },
    // PORTAL DE PROPIETARIOS
    const totalOwners = await prisma.owner.count({
    const activeOwners = await prisma.owner.count({
    const ownerBuildings = await prisma.ownerBuilding.count({
    const ownerNotifications = await prisma.ownerNotification.count({
        leida: false,
    const ownerRecentActivity = await prisma.owner.count({
        updatedAt: {
    // EQUIPO COMERCIAL EXTERNO (SALES TEAM)
    const totalSalesReps = await prisma.salesRepresentative.count({
    const activeSalesReps = await prisma.salesRepresentative.count({
        estado: 'ACTIVO',
    const salesLeads = await prisma.salesLead.count({
        salesRep: companyFilter.companyId ? { companyId: companyFilter.companyId } : {},
        fechaCaptura: {
    const salesLeadsConverted = await prisma.salesLead.count({
        convertido: true,
        fechaConversion: {
    const salesCommissionsPending = await prisma.salesCommission.count({
        estado: 'PENDIENTE',
    const salesRecentActivity = await prisma.salesLead.count({
    // ACTIVIDAD RECIENTE CONSOLIDADA
    const recentActivity = [];
    // Actividad de inquilinos (conversaciones de chat)
    const recentTenantChats = await prisma.chatConversation.findMany({
      orderBy: {
        ultimoMensajeFecha: 'desc',
      take: 5,
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
      include: {
        provider: {
          select: { nombre: true }
        building: {
        fechaAsignacion: 'desc',
      ...recentProviderOrders.map((order) => ({
        type: 'provider_order',
        title: `Orden de trabajo: ${order.titulo}`,
        description: `Proveedor: ${order.provider?.nombre || 'N/A'} - ${order.building?.nombre || 'N/A'}`,
        timestamp: order.fechaAsignacion,
        portal: 'Portal de Proveedores',
    // Actividad de comerciales
    const recentSalesLeads = await prisma.salesLead.findMany({
        salesRep: {
        updatedAt: 'desc',
      ...recentSalesLeads.map((lead) => ({
        type: 'sales_lead',
        title: `Nuevo lead: ${lead.nombreContacto} - ${lead.nombreEmpresa}`,
        description: `Comercial: ${lead.salesRep?.nombre || 'N/A'} - Estado: ${lead.estado}`,
        timestamp: lead.updatedAt,
        portal: 'Equipo Comercial',
    // Ordenar toda la actividad reciente por fecha
    recentActivity.sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return dateB - dateA;
    // RESPUESTA CONSOLIDADA
    const response = {
      summary: {
        totalTenants,
        totalProviders,
        totalOwners,
        totalSalesReps,
        totalActiveUsers: activeContracts + activeProviders + activeOwners + activeSalesReps,
      tenantPortal: {
        total: totalTenants,
        active: activeContracts,
        conversations: tenantChatConversations,
        paymentsLast30Days: tenantPaymentsLast30Days,
        recentActivity: tenantRecentActivity,
        conversionRate: totalTenants > 0 ? ((activeContracts / totalTenants) * 100).toFixed(1) : '0',
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
      ownerPortal: {
        total: totalOwners,
        active: activeOwners,
        buildings: ownerBuildings,
        unreadNotifications: ownerNotifications,
        recentActivity: ownerRecentActivity,
        avgBuildingsPerOwner: totalOwners > 0 ? (ownerBuildings / totalOwners).toFixed(1) : '0',
      salesTeam: {
        total: totalSalesReps,
        active: activeSalesReps,
        leadsLast30Days: salesLeads,
        conversions: salesLeadsConverted,
        pendingCommissions: salesCommissionsPending,
        conversionRate:
          salesLeads > 0 ? ((salesLeadsConverted / salesLeads) * 100).toFixed(1) : '0',
        recentActivity: salesRecentActivity,
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
                type: 'info',
                portal: 'Comerciales',
                message: `${salesCommissionsPending} comisiones pendientes de aprobación`,
        ...(ownerNotifications > 15
                portal: 'Propietarios',
                message: `${ownerNotifications} notificaciones no leídas`,
        ...(tenantChatConversations > 50 && tenantRecentActivity < 5
                portal: 'Inquilinos',
                message: 'Baja actividad en conversaciones de inquilinos en los últimos 7 días',
      ],
    };
    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error en /api/admin/external-portals:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas de portales externos' },
      { status: 500 }
  }
}
