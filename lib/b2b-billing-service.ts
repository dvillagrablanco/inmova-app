/**
 * Servicio de Facturación B2B para INMOVA
 * Gestiona la facturación de INMOVA a las empresas clientes
 */

import { prisma } from './db';
import { addMonths, addDays, startOfMonth, endOfMonth, format, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

const IVA_RATE = 0.21; // 21% IVA en España

// ============================================
// TIPOS E INTERFACES
// ============================================

// InvoiceStatus enum (from Prisma schema)
type InvoiceStatus = 'PENDIENTE' | 'PAGADA' | 'VENCIDA' | 'CANCELADA' | 'PARCIALMENTE_PAGADA';

interface InvoiceItem {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

interface InvoiceData {
  companyId: string;
  periodo: string;
  subscriptionPlanId?: string;
  conceptos: InvoiceItem[];
  descuento?: number;
  notas?: string;
}

interface FinancialMetrics {
  periodo: string;
  ingresosBrutos: number;
  descuentosTotal: number;
  impuestosTotal: number;
  ingresosNetos: number;
  empresasActivas: number;
  empresasNuevas: number;
  empresasCanceladas: number;
  tasaRetencion: number;
  facturasEmitidas: number;
  facturasPagadas: number;
  facturasVencidas: number;
  ticketPromedio: number;
  crecimientoMoM?: number;
  crecimientoYoY?: number;
  detallesPorPlan: any[];
}

// ============================================
// GENERACIÓN DE FACTURAS
// ============================================

/**
 * Genera el número de factura automáticamente
 */
export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const month = format(new Date(), 'MM');

  const lastInvoice = await prisma.b2BInvoice.findFirst({
    where: {
      numeroFactura: {
        startsWith: `INV-${year}-${month}`,
      },
    },
    orderBy: {
      numeroFactura: 'desc',
    },
  });

  let sequence = 1;
  if (lastInvoice) {
    const parts = lastInvoice.numeroFactura.split('-');
    sequence = parseInt(parts[3] || '0') + 1;
  }

  return `INV-${year}-${month}-${sequence.toString().padStart(4, '0')}`;
}

/**
 * Crea una factura B2B para una empresa
 */
export async function createB2BInvoice(data: InvoiceData) {
  const numeroFactura = await generateInvoiceNumber();

  // Calcular totales
  const subtotal = data.conceptos.reduce((sum, item) => sum + item.total, 0);
  const descuento = data.descuento || 0;
  const baseImponible = subtotal - descuento;
  const impuestos = baseImponible * IVA_RATE;
  const total = baseImponible + impuestos;

  // Fecha de vencimiento (30 días por defecto)
  const fechaVencimiento = addDays(new Date(), 30);

  const invoice = await prisma.b2BInvoice.create({
    data: {
      companyId: data.companyId,
      numeroFactura,
      periodo: data.periodo,
      subscriptionPlanId: data.subscriptionPlanId,
      subtotal,
      descuento,
      impuestos,
      total,
      estado: 'PENDIENTE',
      fechaVencimiento,
      conceptos: data.conceptos as any,
      notas: data.notas,
    },
    include: {
      company: true,
      subscriptionPlan: true,
    },
  });

  return invoice;
}

/**
 * Genera facturas mensuales automáticas para todas las empresas activas
 */
export async function generateMonthlyInvoices(periodo?: string) {
  const targetPeriodo = periodo || format(new Date(), 'yyyy-MM');

  // Obtener empresas activas con plan de suscripción
  const companies = await prisma.company.findMany({
    where: {
      activo: true,
      estadoCliente: 'activo',
      subscriptionPlanId: {
        not: null,
      },
    },
    include: {
      subscriptionPlan: true,
    },
  });

  const results = {
    success: [] as any[],
    errors: [] as any[],
  };

  for (const company of companies) {
    try {
      // Verificar si ya existe factura para este período
      const existingInvoice = await prisma.b2BInvoice.findFirst({
        where: {
          companyId: company.id,
          periodo: targetPeriodo,
        },
      });

      if (existingInvoice) {
        continue; // Ya existe factura para este período
      }

      if (!company.subscriptionPlan) {
        continue;
      }

      // Crear concepto de factura
      const conceptos: InvoiceItem[] = [
        {
          descripcion: `Suscripción ${company.subscriptionPlan.nombre} - ${format(new Date(targetPeriodo), 'MMMM yyyy', { locale: es })}`,
          cantidad: 1,
          precioUnitario: company.subscriptionPlan.precioMensual,
          total: company.subscriptionPlan.precioMensual,
        },
      ];

      // Aplicar descuento si la empresa tiene cupones activos o descuentos especiales
      // (Esta lógica se puede extender)

      const invoice = await createB2BInvoice({
        companyId: company.id,
        periodo: targetPeriodo,
        subscriptionPlanId: company.subscriptionPlan.id,
        conceptos,
      });

      results.success.push({
        companyId: company.id,
        companyName: company.nombre,
        invoiceId: invoice.id,
        numeroFactura: invoice.numeroFactura,
      });
    } catch (error: any) {
      results.errors.push({
        companyId: company.id,
        companyName: company.nombre,
        error: error.message,
      });
    }
  }

  return results;
}

// ============================================
// GESTIÓN DE PAGOS
// ============================================

/**
 * Registra el pago de una factura
 */
export async function registerInvoicePayment(
  invoiceId: string,
  paymentData: {
    monto: number;
    metodoPago: string;
    referencia?: string;
    stripePaymentId?: string;
    stripeChargeId?: string;
    stripeFee?: number;
  }
) {
  const invoice = await prisma.b2BInvoice.findUnique({
    where: { id: invoiceId },
    include: { company: true },
  });

  if (!invoice) {
    throw new Error('Factura no encontrada');
  }

  // Actualizar estado de la factura
  const nuevoEstado = paymentData.monto >= invoice.total ? 'PAGADA' : 'PARCIALMENTE_PAGADA';

  await prisma.b2BInvoice.update({
    where: { id: invoiceId },
    data: {
      estado: nuevoEstado,
      metodoPago: paymentData.metodoPago,
      fechaPago: nuevoEstado === 'PAGADA' ? new Date() : undefined,
      stripePaymentIntentId: paymentData.stripePaymentId,
    },
  });

  // Registrar en historial de pagos
  const payment = await prisma.b2BPaymentHistory.create({
    data: {
      companyId: invoice.companyId,
      invoiceId: invoice.id,
      monto: paymentData.monto,
      metodoPago: paymentData.metodoPago,
      referencia: paymentData.referencia,
      stripePaymentId: paymentData.stripePaymentId,
      stripeChargeId: paymentData.stripeChargeId,
      stripeFee: paymentData.stripeFee,
      stripeNetAmount: paymentData.monto - (paymentData.stripeFee || 0),
      estado: 'completado',
    },
  });

  return { invoice, payment };
}

/**
 * Marca facturas vencidas automáticamente
 */
export async function markOverdueInvoices() {
  const today = new Date();

  const result = await prisma.b2BInvoice.updateMany({
    where: {
      fechaVencimiento: {
        lt: today,
      },
      estado: 'PENDIENTE',
    },
    data: {
      estado: 'VENCIDA',
    },
  });

  return result.count;
}

// ============================================
// RECORDATORIOS Y NOTIFICACIONES
// ============================================

/**
 * Envía recordatorios de pago para facturas pendientes
 */
export async function sendPaymentReminders() {
  const threeDaysFromNow = addDays(new Date(), 3);

  const invoices = await prisma.b2BInvoice.findMany({
    where: {
      estado: 'PENDIENTE',
      fechaVencimiento: {
        lte: threeDaysFromNow,
      },
      OR: [
        { ultimoRecordatorio: null },
        { ultimoRecordatorio: { lt: subMonths(new Date(), 0.5) } }, // Último recordatorio hace más de 15 días
      ],
    },
    include: {
      company: true,
    },
  });

  const results: Array<{
    invoiceId: string;
    companyName: string;
    sent: boolean;
    error?: string;
  }> = [];

  for (const invoice of invoices) {
    try {
      // Aquí se enviaría el email de recordatorio
      // await sendEmailReminder(invoice);

      await prisma.b2BInvoice.update({
        where: { id: invoice.id },
        data: {
          recordatoriosEnviados: invoice.recordatoriosEnviados + 1,
          ultimoRecordatorio: new Date(),
        },
      });

      results.push({
        invoiceId: invoice.id,
        companyName: invoice.company.nombre,
        sent: true,
      });
    } catch (error: any) {
      results.push({
        invoiceId: invoice.id,
        companyName: invoice.company.nombre,
        sent: false,
        error: error.message,
      });
    }
  }

  return results;
}

// ============================================
// REPORTES FINANCIEROS
// ============================================

/**
 * Calcula métricas financieras para un período
 */
export async function calculateFinancialMetrics(
  periodo: string,
  tipoReporte: 'mensual' | 'trimestral' | 'anual' = 'mensual'
): Promise<FinancialMetrics> {
  const startDate = startOfMonth(new Date(periodo));
  const endDate = endOfMonth(startDate);

  // Facturas del período
  const invoices = await prisma.b2BInvoice.findMany({
    where: {
      fechaEmision: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      company: true,
      subscriptionPlan: true,
    },
  });

  // Calcular totales
  const ingresosBrutos = invoices.reduce((sum, inv) => sum + inv.subtotal, 0);
  const descuentosTotal = invoices.reduce((sum, inv) => sum + inv.descuento, 0);
  const impuestosTotal = invoices.reduce((sum, inv) => sum + inv.impuestos, 0);
  const ingresosNetos = invoices.reduce((sum, inv) => sum + inv.total, 0);

  const facturasEmitidas = invoices.length;
  const facturasPagadas = invoices.filter((inv) => inv.estado === 'PAGADA').length;
  const facturasVencidas = invoices.filter((inv) => inv.estado === 'VENCIDA').length;
  const ticketPromedio = facturasEmitidas > 0 ? ingresosNetos / facturasEmitidas : 0;

  // Métricas de empresas
  const empresasActivas = await prisma.company.count({
    where: {
      activo: true,
      estadoCliente: 'activo',
    },
  });

  const empresasNuevas = await prisma.company.count({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Empresas canceladas (cambiar a estado suspendido/cancelado en el período)
  const subscriptionChanges = await prisma.b2BSubscriptionHistory.findMany({
    where: {
      fechaCambio: {
        gte: startDate,
        lte: endDate,
      },
      accion: 'cancelacion',
    },
  });
  const empresasCanceladas = subscriptionChanges.length;

  const tasaRetencion =
    empresasActivas > 0 ? ((empresasActivas - empresasCanceladas) / empresasActivas) * 100 : 100;

  // Crecimiento MoM (Month over Month)
  const previousMonth = format(subMonths(startDate, 1), 'yyyy-MM');
  const previousReport = await prisma.b2BFinancialReport.findUnique({
    where: { periodo: previousMonth },
  });

  const crecimientoMoM = previousReport
    ? ((ingresosNetos - previousReport.ingresosNetos) / previousReport.ingresosNetos) * 100
    : undefined;

  // Detalles por plan
  const planBreakdown = await prisma.b2BInvoice.groupBy({
    by: ['subscriptionPlanId'],
    where: {
      fechaEmision: {
        gte: startDate,
        lte: endDate,
      },
      subscriptionPlanId: {
        not: null,
      },
    },
    _count: true,
    _sum: {
      total: true,
    },
  });

  const detallesPorPlan = await Promise.all(
    planBreakdown.map(async (item) => {
      const plan = await prisma.subscriptionPlan.findUnique({
        where: { id: item.subscriptionPlanId! },
      });
      return {
        planId: item.subscriptionPlanId,
        planNombre: plan?.nombre || 'Desconocido',
        facturas: item._count,
        ingresos: item._sum.total || 0,
      };
    })
  );

  return {
    periodo,
    ingresosBrutos,
    descuentosTotal,
    impuestosTotal,
    ingresosNetos,
    empresasActivas,
    empresasNuevas,
    empresasCanceladas,
    tasaRetencion,
    facturasEmitidas,
    facturasPagadas,
    facturasVencidas,
    ticketPromedio,
    crecimientoMoM,
    detallesPorPlan,
  };
}

/**
 * Guarda o actualiza un reporte financiero
 */
export async function saveFinancialReport(
  metrics: FinancialMetrics,
  tipoReporte: string = 'mensual'
) {
  const report = await prisma.b2BFinancialReport.upsert({
    where: { periodo: metrics.periodo },
    create: {
      ...metrics,
      tipoReporte,
      detalles: metrics.detallesPorPlan as any,
    },
    update: {
      ...metrics,
      detalles: metrics.detallesPorPlan as any,
      fechaGeneracion: new Date(),
    },
  });

  return report;
}

/**
 * Genera reporte financiero completo para un período
 */
export async function generateFinancialReport(
  periodo: string,
  tipoReporte: 'mensual' | 'trimestral' | 'anual' = 'mensual'
) {
  const metrics = await calculateFinancialMetrics(periodo, tipoReporte);
  const report = await saveFinancialReport(metrics, tipoReporte);
  return report;
}

// ============================================
// GESTIÓN DE SUSCRIPCIONES
// ============================================

/**
 * Registra un cambio en la suscripción de una empresa
 */
export async function recordSubscriptionChange(
  companyId: string,
  accion: 'upgrade' | 'downgrade' | 'cancelacion' | 'reactivacion',
  data: {
    planAnteriorId?: string;
    planNuevoId?: string;
    razon?: string;
    costoAdicional?: number;
    realizadoPor?: string;
  }
) {
  const change = await prisma.b2BSubscriptionHistory.create({
    data: {
      companyId,
      accion,
      ...data,
    },
  });

  return change;
}

/**
 * Procesa un upgrade de plan
 */
export async function upgradeCompanyPlan(companyId: string, newPlanId: string, userId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { subscriptionPlan: true },
  });

  if (!company) {
    throw new Error('Empresa no encontrada');
  }

  const newPlan = await prisma.subscriptionPlan.findUnique({
    where: { id: newPlanId },
  });

  if (!newPlan) {
    throw new Error('Plan no encontrado');
  }

  // Calcular costo adicional si es upgrade en medio del mes
  let costoAdicional = 0;
  if (company.subscriptionPlan) {
    const diff = newPlan.precioMensual - company.subscriptionPlan.precioMensual;
    if (diff > 0) {
      // Prorratear basado en días restantes del mes
      const today = new Date();
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const daysRemaining = daysInMonth - today.getDate();
      costoAdicional = (diff / daysInMonth) * daysRemaining;
    }
  }

  // Actualizar empresa
  await prisma.company.update({
    where: { id: companyId },
    data: {
      subscriptionPlanId: newPlanId,
      maxUsuarios: newPlan.maxUsuarios,
      maxPropiedades: newPlan.maxPropiedades,
    },
  });

  // Registrar cambio
  await recordSubscriptionChange(companyId, 'upgrade', {
    planAnteriorId: company.subscriptionPlanId || undefined,
    planNuevoId: newPlanId,
    costoAdicional: costoAdicional > 0 ? costoAdicional : undefined,
    realizadoPor: userId,
  });

  // Si hay costo adicional, generar factura
  if (costoAdicional > 0) {
    const conceptos: InvoiceItem[] = [
      {
        descripcion: `Upgrade a ${newPlan.nombre} - Prorrateo`,
        cantidad: 1,
        precioUnitario: costoAdicional,
        total: costoAdicional,
      },
    ];

    await createB2BInvoice({
      companyId,
      periodo: format(new Date(), 'yyyy-MM'),
      subscriptionPlanId: newPlanId,
      conceptos,
      notas: 'Factura por cambio de plan (upgrade)',
    });
  }

  return { success: true, costoAdicional };
}

// ============================================
// ESTADÍSTICAS Y DASHBOARDS
// ============================================

/**
 * Obtiene estadísticas generales de facturación
 */
export async function getBillingStats() {
  const today = new Date();
  const startOfCurrentMonth = startOfMonth(today);
  const endOfCurrentMonth = endOfMonth(today);

  const [totalInvoices, paidInvoices, pendingInvoices, overdueInvoices] = await Promise.all([
    prisma.b2BInvoice.count(),
    prisma.b2BInvoice.count({ where: { estado: 'PAGADA' } }),
    prisma.b2BInvoice.count({ where: { estado: 'PENDIENTE' } }),
    prisma.b2BInvoice.count({ where: { estado: 'VENCIDA' } }),
  ]);

  const monthlyRevenue = await prisma.b2BInvoice.aggregate({
    where: {
      fechaEmision: {
        gte: startOfCurrentMonth,
        lte: endOfCurrentMonth,
      },
      estado: 'PAGADA',
    },
    _sum: {
      total: true,
    },
  });

  const pendingAmount = await prisma.b2BInvoice.aggregate({
    where: {
      estado: 'PENDIENTE',
    },
    _sum: {
      total: true,
    },
  });

  return {
    totalInvoices,
    paidInvoices,
    pendingInvoices,
    overdueInvoices,
    monthlyRevenue: monthlyRevenue._sum.total || 0,
    pendingAmount: pendingAmount._sum.total || 0,
  };
}

/**
 * Obtiene el historial de facturación de una empresa
 */
export async function getCompanyInvoiceHistory(companyId: string) {
  const invoices = await prisma.b2BInvoice.findMany({
    where: { companyId },
    include: {
      subscriptionPlan: true,
    },
    orderBy: {
      fechaEmision: 'desc',
    },
  });

  const payments = await prisma.b2BPaymentHistory.findMany({
    where: { companyId },
    orderBy: {
      fechaPago: 'desc',
    },
  });

  return { invoices, payments };
}
