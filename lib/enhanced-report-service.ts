/**
 * Servicio Mejorado de Reportes Programados
 * Incluye más tipos de reportes y opciones avanzadas
 */

import { prisma } from './db';
import { generateReportPDF } from './report-service';
import { sendEmail } from './email-config';
import { uploadFile } from './s3';
import logger from './logger';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { generateRenewalReport } from './contract-renewal-service';
import { generateOverduePaymentsReport } from './payment-reminder-service';

interface EnhancedReportConfig {
  tipo: string;
  frecuencia: string;
  destinatarios: string[];
  includeCharts: boolean;
  includeSummary: boolean;
  filters?: {
    buildingIds?: string[];
    unitIds?: string[];
    dateRange?: { start: Date; end: Date };
  };
}

/**
 * Genera reporte de renovaciones de contratos
 */
export async function generateContractRenewalsReport(companyId: string): Promise<any> {
  const reportData = await generateRenewalReport(companyId);

  const pdfData = {
    tipo: 'Renovaciones de Contratos',
    periodo: format(new Date(), 'MMMM yyyy', { locale: es }),
    fechaGeneracion: new Date(),
    datos: reportData,
    companyInfo: await getCompanyInfo(companyId),
  };

  return { data: reportData, pdf: await generateReportPDF(pdfData) };
}

/**
 * Genera reporte de pagos atrasados
 */
export async function generateOverduePaymentsReportPDF(companyId: string): Promise<any> {
  const reportData = await generateOverduePaymentsReport(companyId);

  const pdfData = {
    tipo: 'Pagos Atrasados',
    periodo: format(new Date(), 'MMMM yyyy', { locale: es }),
    fechaGeneracion: new Date(),
    datos: reportData,
    companyInfo: await getCompanyInfo(companyId),
  };

  return { data: reportData, pdf: await generateReportPDF(pdfData) };
}

/**
 * Genera reporte de ocupación
 */
export async function generateOccupancyReport(companyId: string): Promise<any> {
  const buildings = await prisma.building.findMany({
    where: { companyId },
    include: {
      units: true,
    },
  });

  const reportData = {
    totalBuildings: buildings.length,
    totalUnits: buildings.reduce((sum, b) => sum + b.units.length, 0),
    occupiedUnits: buildings.reduce(
      (sum, b) => sum + b.units.filter((u) => u.estado === 'ocupada').length,
      0
    ),
    vacantUnits: buildings.reduce(
      (sum, b) => sum + b.units.filter((u) => u.estado === 'disponible').length,
      0
    ),
    maintenanceUnits: buildings.reduce(
      (sum, b) => sum + b.units.filter((u) => u.estado === 'en_mantenimiento').length,
      0
    ),
    buildings: buildings.map((b) => ({
      nombre: b.nombre,
      totalUnits: b.units.length,
      occupiedUnits: b.units.filter((u) => u.estado === 'ocupada').length,
      vacantUnits: b.units.filter((u) => u.estado === 'disponible').length,
      occupancyRate:
        b.units.length > 0
          ? ((b.units.filter((u) => u.estado === 'ocupada').length / b.units.length) * 100).toFixed(
              1
            )
          : '0',
    })),
  };

  const occupancyRate =
    reportData.totalUnits > 0
      ? ((reportData.occupiedUnits / reportData.totalUnits) * 100).toFixed(1)
      : '0';

  const pdfData = {
    tipo: 'Ocupación',
    periodo: format(new Date(), 'MMMM yyyy', { locale: es }),
    fechaGeneracion: new Date(),
    datos: { ...reportData, occupancyRate },
    companyInfo: await getCompanyInfo(companyId),
  };

  return { data: reportData, pdf: await generateReportPDF(pdfData) };
}

/**
 * Genera reporte de ingresos
 */
export async function generateIncomeReport(
  companyId: string,
  startDate?: Date,
  endDate?: Date
): Promise<any> {
  const start = startDate || startOfMonth(new Date());
  const end = endDate || endOfMonth(new Date());

  const payments = await prisma.payment.findMany({
    where: {
      contract: {
        tenant: {
          companyId,
        },
      },
      fechaPago: {
        gte: start,
        lte: end,
      },
      estado: 'pagado',
    },
    include: {
      contract: {
        include: {
          tenant: true,
          unit: {
            include: {
              building: true,
            },
          },
        },
      },
    },
  });

  const totalIncome = payments.reduce((sum, p) => sum + parseFloat(p.monto.toString()), 0);

  const byBuilding: { [key: string]: number } = {};
  payments.forEach((p) => {
    const buildingName = p.contract?.unit?.building?.nombre || 'Sin edificio';
    byBuilding[buildingName] = (byBuilding[buildingName] || 0) + parseFloat(p.monto.toString());
  });

  const reportData = {
    periodo: `${format(start, 'dd/MM/yyyy', { locale: es })} - ${format(end, 'dd/MM/yyyy', { locale: es })}`,
    totalPayments: payments.length,
    totalIncome,
    averagePayment: payments.length > 0 ? totalIncome / payments.length : 0,
    byBuilding: Object.entries(byBuilding).map(([name, amount]) => ({ name, amount })),
    payments: payments.map((p) => ({
      tenant: p.contract?.tenant?.nombreCompleto,
      unit: `${p.contract?.unit?.building?.nombre} ${p.contract?.unit?.numero}`,
      amount: parseFloat(p.monto.toString()),
      date: p.fechaPago,
      period: p.periodo,
    })),
  };

  const pdfData = {
    tipo: 'Ingresos',
    periodo: reportData.periodo,
    fechaGeneracion: new Date(),
    datos: reportData,
    companyInfo: await getCompanyInfo(companyId),
  };

  return { data: reportData, pdf: await generateReportPDF(pdfData) };
}

/**
 * Genera reporte de mantenimiento
 */
export async function generateMaintenanceReport(
  companyId: string,
  startDate?: Date,
  endDate?: Date
): Promise<any> {
  const start = startDate || subDays(new Date(), 30);
  const end = endDate || new Date();

  const maintenanceRequests = await prisma.maintenanceRequest.findMany({
    where: {
      unit: {
        building: {
          companyId,
        },
      },
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    include: {
      unit: {
        include: {
          building: true,
        },
      },
      provider: true,
    },
  });

  const totalCost = maintenanceRequests.reduce(
    (sum, m) => sum + (m.costoEstimado ? parseFloat(m.costoEstimado.toString()) : 0),
    0
  );

  const byStatus = {
    pendiente: maintenanceRequests.filter((m) => m.estado === 'pendiente').length,
    en_progreso: maintenanceRequests.filter((m) => m.estado === 'en_progreso').length,
    programado: maintenanceRequests.filter((m) => m.estado === 'programado').length,
    completado: maintenanceRequests.filter((m) => m.estado === 'completado').length,
  };

  const byPriority = {
    baja: maintenanceRequests.filter((m) => m.prioridad === 'baja').length,
    media: maintenanceRequests.filter((m) => m.prioridad === 'media').length,
    alta: maintenanceRequests.filter((m) => m.prioridad === 'alta').length,
  };

  const reportData = {
    periodo: `${format(start, 'dd/MM/yyyy', { locale: es })} - ${format(end, 'dd/MM/yyyy', { locale: es })}`,
    totalRequests: maintenanceRequests.length,
    totalCost,
    averageCost: maintenanceRequests.length > 0 ? totalCost / maintenanceRequests.length : 0,
    byStatus,
    byPriority,
    requests: maintenanceRequests.map((m) => ({
      unit: `${m.unit?.building?.nombre} ${m.unit?.numero}`,
      description: m.descripcion,
      status: m.estado,
      priority: m.prioridad,
      cost: m.costoEstimado ? parseFloat(m.costoEstimado.toString()) : 0,
      provider: m.provider?.nombre || 'Sin asignar',
      createdAt: m.createdAt,
    })),
  };

  const pdfData = {
    tipo: 'Mantenimiento',
    periodo: reportData.periodo,
    fechaGeneracion: new Date(),
    datos: reportData,
    companyInfo: await getCompanyInfo(companyId),
  };

  return { data: reportData, pdf: await generateReportPDF(pdfData) };
}

/**
 * Genera reporte ejecutivo completo
 */
export async function generateExecutiveReport(companyId: string): Promise<any> {
  const [renewals, overduePayments, occupancy, income, maintenance] = await Promise.all([
    generateRenewalReport(companyId),
    generateOverduePaymentsReport(companyId),
    generateOccupancyReport(companyId),
    generateIncomeReport(companyId),
    generateMaintenanceReport(companyId),
  ]);

  const reportData = {
    renewals,
    overduePayments,
    occupancy: occupancy.data,
    income: income.data,
    maintenance: maintenance.data,
    summary: {
      criticalItems: [
        ...renewals.contracts
          .filter((c: any) => c.stage === 'critical')
          .map((c: any) => ({
            type: 'contrato',
            description: `Contrato vence en ${c.daysUntilExpiry} días - ${c.unit}`,
            priority: 'alto',
          })),
        ...overduePayments.payments
          .filter((p: any) => p.stage === 'legal')
          .map((p: any) => ({
            type: 'pago',
            description: `Pago atrasado ${p.daysOverdue} días - ${p.tenant}`,
            priority: 'alto',
          })),
      ],
    },
  };

  const pdfData = {
    tipo: 'Ejecutivo',
    periodo: format(new Date(), 'MMMM yyyy', { locale: es }),
    fechaGeneracion: new Date(),
    datos: reportData,
    companyInfo: await getCompanyInfo(companyId),
  };

  return { data: reportData, pdf: await generateReportPDF(pdfData) };
}

/**
 * Obtiene información de la empresa
 */
async function getCompanyInfo(companyId: string): Promise<any> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  return {
    nombre: company?.nombre || 'INMOVA',
    cif: company?.cif,
    direccion: company?.direccion,
    telefono: company?.telefono,
    email: company?.email,
  };
}

/**
 * Envía reporte por email
 */
export async function sendReportByEmail(
  recipients: string[],
  reportType: string,
  pdfBuffer: Buffer,
  reportData: any
): Promise<void> {
  const fileName = `reporte-${reportType.toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;

  // Subir PDF a S3
  const pdfKey = await uploadFile(pdfBuffer, `reports/${fileName}`);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; }
        .summary { background-color: white; padding: 15px; margin: 15px 0; border-radius: 4px; }
        .button { background-color: #2563eb; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 4px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📈 Reporte de ${reportType}</h1>
        </div>
        <div class="content">
          <div class="summary">
            <h2>Resumen del Reporte</h2>
            <p>Se adjunta el reporte completo de ${reportType} generado automáticamente.</p>
            <p><strong>Fecha de generación:</strong> ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <p>El reporte en formato PDF está adjunto a este correo.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  for (const recipient of recipients) {
    try {
      await sendEmail({
        to: recipient,
        subject: `Reporte de ${reportType} - ${format(new Date(), 'dd/MM/yyyy', { locale: es })}`,
        html: htmlContent,
        attachments: [
          {
            filename: fileName,
            content: pdfBuffer,
          },
        ],
      });
      logger.info(`Reporte enviado a ${recipient}`);
    } catch (error) {
      logger.error(`Error enviando reporte a ${recipient}:`, error);
    }
  }
}
