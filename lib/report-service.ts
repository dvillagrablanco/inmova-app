/**
 * Servicio de Reportes Programados
 * Genera y envía reportes automáticamente por email
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email-config';
import { uploadFile } from '@/lib/s3';
import logger, { logError } from '@/lib/logger';

interface ReportData {
  tipo: string;
  periodo: string;
  fechaGeneracion: Date;
  datos: any;
  companyInfo: {
    nombre: string;
    cif?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
  };
}

/**
 * Genera un reporte en formato PDF
 */
export const generateReportPDF = async (reportData: ReportData): Promise<Buffer> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Colores corporativos
  const primaryColor: [number, number, number] = [0, 0, 0];
  const secondaryColor: [number, number, number] = [100, 100, 100];

  // ============================================
  // ENCABEZADO
  // ============================================
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(reportData.companyInfo.nombre || 'INMOVA', 15, 25);

  // Título del reporte
  doc.setFontSize(18);
  doc.text(`REPORTE DE ${reportData.tipo.toUpperCase()}`, pageWidth / 2, 40, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...secondaryColor);
  doc.text(`Periodo: ${reportData.periodo}`, pageWidth / 2, 48, { align: 'center' });
  doc.text(
    `Fecha de generación: ${format(reportData.fechaGeneracion, 'dd/MM/yyyy HH:mm', { locale: es })}`,
    pageWidth / 2,
    54,
    { align: 'center' }
  );

  let yPos = 65;

  // ============================================
  // CONTENIDO BASADO EN TIPO DE REPORTE
  // ============================================

  if (reportData.tipo === 'morosidad') {
    const { pagosPendientes, totalMorosidad, inquilinos } = reportData.datos;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('RESUMEN DE MOROSIDAD', 15, yPos);
    yPos += 10;

    // KPIs
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de pagos pendientes: ${pagosPendientes}`, 15, yPos);
    yPos += 8;
    doc.text(`Importe total adeudado: ${totalMorosidad.toFixed(2)} €`, 15, yPos);
    yPos += 12;

    // Tabla de inquilinos morosos
    if (inquilinos && inquilinos.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Inquilino', 'Unidad', 'Importe', 'Días atraso']],
        body: inquilinos.map((inq: any) => [
          inq.nombreCompleto,
          inq.unidad,
          `${inq.importe.toFixed(2)} €`,
          inq.diasAtraso.toString(),
        ]),
        theme: 'striped',
        headStyles: {
          fillColor: [0, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        margin: { left: 15, right: 15 },
      });
    }
  } else if (reportData.tipo === 'ocupacion') {
    const totalUnidades = reportData.datos.totalUnidades ?? 0;
    const unidadesOcupadas = reportData.datos.unidadesOcupadas ?? 0;
    const unidadesDisponibles =
      reportData.datos.unidadesDisponibles ?? Math.max(totalUnidades - unidadesOcupadas, 0);
    const tasaOcupacion =
      reportData.datos.tasaOcupacion ??
      reportData.datos.porcentajeOcupacion ??
      (totalUnidades > 0 ? (unidadesOcupadas / totalUnidades) * 100 : 0);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('REPORTE DE OCUPACIÓN', 15, yPos);
    yPos += 10;

    // KPIs
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de unidades: ${totalUnidades}`, 15, yPos);
    yPos += 8;
    doc.text(`Unidades ocupadas: ${unidadesOcupadas}`, 15, yPos);
    yPos += 8;
    doc.text(`Unidades disponibles: ${unidadesDisponibles}`, 15, yPos);
    yPos += 8;
    doc.text(`Tasa de ocupación: ${tasaOcupacion.toFixed(1)}%`, 15, yPos);
    yPos += 12;

    // Tabla de edificios
    if (reportData.datos.edificios && reportData.datos.edificios.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Edificio', 'Total', 'Ocupadas', 'Disponibles', 'Ocupación']],
        body: reportData.datos.edificios.map((ed: any) => {
          const total = ed.total ?? 0;
          const ocupadas = ed.ocupadas ?? ed.unidadesOcupadas ?? 0;
          const disponibles = ed.disponibles ?? ed.unidadesDisponibles ?? 0;
          const ocupacion = ed.tasaOcupacion ?? ed.ocupacion ?? 0;

          return [
            ed.nombre,
            total.toString(),
            ocupadas.toString(),
            disponibles.toString(),
            `${Number(ocupacion).toFixed(1)}%`,
          ];
        }),
        theme: 'striped',
        headStyles: {
          fillColor: [0, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        margin: { left: 15, right: 15 },
      });
    }
  } else if (reportData.tipo === 'ingresos') {
    const ingresosBrutos = reportData.datos?.ingresosBrutos ?? 0;
    const gastos = reportData.datos?.gastos ?? 0;
    const ingresosNetos = reportData.datos?.ingresosNetos ?? 0;
    const rentabilidad = reportData.datos?.rentabilidad ?? 0;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('REPORTE DE INGRESOS', 15, yPos);
    yPos += 10;

    // KPIs
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ingresos brutos: ${Number(ingresosBrutos).toFixed(2)} €`, 15, yPos);
    yPos += 8;
    doc.text(`Gastos: ${Number(gastos).toFixed(2)} €`, 15, yPos);
    yPos += 8;
    doc.text(`Ingresos netos: ${Number(ingresosNetos).toFixed(2)} €`, 15, yPos);
    yPos += 8;
    doc.text(`Rentabilidad: ${Number(rentabilidad).toFixed(1)}%`, 15, yPos);
    yPos += 12;

    // Desglose mensual si existe
    if (reportData.datos?.desgloseMensual && reportData.datos.desgloseMensual.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Mes', 'Ingresos', 'Gastos', 'Neto']],
        body: reportData.datos.desgloseMensual.map((mes: any) => [
          mes.mes,
          `${Number(mes.ingresos ?? 0).toFixed(2)} €`,
          `${Number(mes.gastos ?? 0).toFixed(2)} €`,
          `${Number(mes.neto ?? 0).toFixed(2)} €`,
        ]),
        theme: 'striped',
        headStyles: {
          fillColor: [0, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        margin: { left: 15, right: 15 },
      });
    }
  } else if (reportData.tipo === 'mantenimiento') {
    const { totalSolicitudes, pendientes, enProgreso, completadas, costoTotal } = reportData.datos;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('REPORTE DE MANTENIMIENTO', 15, yPos);
    yPos += 10;

    // KPIs
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de solicitudes: ${totalSolicitudes}`, 15, yPos);
    yPos += 8;
    doc.text(`Pendientes: ${pendientes}`, 15, yPos);
    yPos += 8;
    doc.text(`En progreso: ${enProgreso}`, 15, yPos);
    yPos += 8;
    doc.text(`Completadas: ${completadas}`, 15, yPos);
    yPos += 8;
    doc.text(`Costo total: ${costoTotal.toFixed(2)} €`, 15, yPos);
    yPos += 12;

    // Tabla de solicitudes recientes
    if (reportData.datos.solicitudesRecientes && reportData.datos.solicitudesRecientes.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Título', 'Unidad', 'Estado', 'Prioridad', 'Costo']],
        body: reportData.datos.solicitudesRecientes.map((sol: any) => [
          sol.titulo,
          sol.unidad,
          sol.estado,
          sol.prioridad,
          sol.costo ? `${sol.costo.toFixed(2)} €` : 'N/A',
        ]),
        theme: 'striped',
        headStyles: {
          fillColor: [0, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        margin: { left: 15, right: 15 },
      });
    }
  }

  // ============================================
  // PIE DE PÁGINA
  // ============================================
  const footerY = doc.internal.pageSize.height - 20;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text(
    'Este reporte ha sido generado automáticamente por el sistema INMOVA.',
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  // Convertir a buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
};

/**
 * Genera un reporte en formato CSV
 */
export const generateReportCSV = (reportData: ReportData): string => {
  let csv = '';
  csv += `Reporte de ${reportData.tipo}\n`;
  csv += `Periodo: ${reportData.periodo}\n`;
  csv += `Fecha de generación: ${format(reportData.fechaGeneracion, 'dd/MM/yyyy HH:mm', { locale: es })}\n\n`;

  if (reportData.tipo === 'morosidad') {
    csv += 'Inquilino,Unidad,Importe,Días atraso\n';
    if (reportData.datos.inquilinos) {
      reportData.datos.inquilinos.forEach((inq: any) => {
        csv += `${inq.nombreCompleto},${inq.unidad},${inq.importe.toFixed(2)},${inq.diasAtraso}\n`;
      });
    }
  } else if (reportData.tipo === 'ocupacion') {
    csv += 'Edificio,Total,Ocupadas,Disponibles,Ocupación (%)\n';
    if (reportData.datos.edificios) {
      reportData.datos.edificios.forEach((ed: any) => {
        csv += `${ed.nombre},${ed.total},${ed.ocupadas},${ed.disponibles},${ed.tasaOcupacion.toFixed(1)}\n`;
      });
    }
  } else if (reportData.tipo === 'ingresos') {
    csv += 'Mes,Ingresos,Gastos,Neto\n';
    if (reportData.datos?.desgloseMensual) {
      reportData.datos.desgloseMensual.forEach((mes: any) => {
        csv += `${mes.mes},${Number(mes.ingresos ?? 0).toFixed(2)},${Number(mes.gastos ?? 0).toFixed(2)},${Number(mes.neto ?? 0).toFixed(2)}\n`;
      });
    }
  } else if (reportData.tipo === 'mantenimiento') {
    csv += 'Título,Unidad,Estado,Prioridad,Costo\n';
    if (reportData.datos.solicitudesRecientes) {
      reportData.datos.solicitudesRecientes.forEach((sol: any) => {
        csv += `${sol.titulo},${sol.unidad},${sol.estado},${sol.prioridad},${sol.costo ? sol.costo.toFixed(2) : 'N/A'}\n`;
      });
    }
  }

  return csv;
};

/**
 * Genera datos de reporte de morosidad
 */
const generateMorosidadData = async (companyId: string, periodo: number) => {
  const now = new Date();
  const fechaInicio = new Date(now);
  fechaInicio.setMonth(fechaInicio.getMonth() - periodo);

  const pagosPendientes = await prisma.payment.findMany({
    where: {
      contract: {
        unit: {
          building: {
            companyId,
          },
        },
      },
      estado: {
        in: ['pendiente', 'atrasado'],
      },
      fechaVencimiento: {
        gte: fechaInicio,
        lte: now,
      },
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

  const totalMorosidad = pagosPendientes.reduce((sum, p) => sum + p.monto, 0);

  const inquilinos = pagosPendientes.map((pago) => {
    const diasAtraso = Math.floor(
      (now.getTime() - new Date(pago.fechaVencimiento).getTime()) / (1000 * 60 * 60 * 24)
    );
    return {
      nombreCompleto: pago.contract.tenant.nombreCompleto,
      unidad: `${pago.contract.unit.building.nombre} - ${pago.contract.unit.numero}`,
      importe: pago.monto,
      diasAtraso: Math.max(0, diasAtraso),
    };
  });

  return {
    pagosPendientes: pagosPendientes.length,
    totalMorosidad,
    inquilinos,
  };
};

/**
 * Genera datos de reporte de ocupación
 */
const generateOcupacionData = async (companyId: string) => {
  const buildings = await prisma.building.findMany({
    where: { companyId },
    include: {
      units: true,
    },
  });

  const totalUnidades = buildings.reduce((sum, b) => sum + b.units.length, 0);
  const unidadesOcupadas = buildings.reduce(
    (sum, b) => sum + b.units.filter((u) => u.estado === 'ocupada').length,
    0
  );
  const unidadesDisponibles = totalUnidades - unidadesOcupadas;
  const tasaOcupacion = totalUnidades > 0 ? (unidadesOcupadas / totalUnidades) * 100 : 0;

  const edificios = buildings.map((b) => {
    const total = b.units.length;
    const ocupadas = b.units.filter((u) => u.estado === 'ocupada').length;
    const disponibles = total - ocupadas;
    const tasaOcupacion = total > 0 ? (ocupadas / total) * 100 : 0;

    return {
      nombre: b.nombre,
      total,
      ocupadas,
      disponibles,
      tasaOcupacion,
    };
  });

  return {
    totalUnidades,
    unidadesOcupadas,
    unidadesDisponibles,
    tasaOcupacion,
    edificios,
  };
};

/**
 * Genera datos de reporte de ingresos
 */
const generateIngresosData = async (companyId: string, periodo: number) => {
  const now = new Date();
  const fechaInicio = new Date(now);
  fechaInicio.setMonth(fechaInicio.getMonth() - periodo);

  const buildings = await prisma.building.findMany({
    where: { companyId },
    include: {
      units: {
        include: {
          contracts: {
            include: {
              payments: {
                where: {
                  fechaVencimiento: {
                    gte: fechaInicio,
                    lte: now,
                  },
                  estado: 'pagado',
                },
              },
            },
          },
        },
      },
      expenses: {
        where: {
          fecha: {
            gte: fechaInicio,
            lte: now,
          },
        },
      },
    },
  });

  let ingresosBrutos = 0;
  buildings.forEach((building) => {
    building.units.forEach((unit) => {
      unit.contracts.forEach((contract) => {
        contract.payments.forEach((payment) => {
          ingresosBrutos += payment.monto;
        });
      });
    });
  });

  const gastos = buildings.reduce((sum, b) => sum + b.expenses.reduce((s, e) => s + e.monto, 0), 0);
  const ingresosNetos = ingresosBrutos - gastos;
  const rentabilidad = ingresosBrutos > 0 ? (ingresosNetos / ingresosBrutos) * 100 : 0;

  // Desglose mensual
  const desgloseMensual: Array<{ mes: string; ingresos: number; gastos: number; neto: number }> =
    [];
  for (let i = periodo - 1; i >= 0; i--) {
    const mes = new Date(now);
    mes.setMonth(mes.getMonth() - i);
    const mesInicio = new Date(mes.getFullYear(), mes.getMonth(), 1);
    const mesFin = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);

    let ingresos = 0;
    buildings.forEach((building) => {
      building.units.forEach((unit) => {
        unit.contracts.forEach((contract) => {
          contract.payments.forEach((payment) => {
            const paymentDate = new Date(payment.fechaVencimiento);
            if (paymentDate >= mesInicio && paymentDate <= mesFin) {
              ingresos += payment.monto;
            }
          });
        });
      });
    });

    let gastosMes = 0;
    buildings.forEach((building) => {
      building.expenses.forEach((expense) => {
        const expenseDate = new Date(expense.fecha);
        if (expenseDate >= mesInicio && expenseDate <= mesFin) {
          gastosMes += expense.monto;
        }
      });
    });

    desgloseMensual.push({
      mes: mes.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
      ingresos,
      gastos: gastosMes,
      neto: ingresos - gastosMes,
    });
  }

  return {
    ingresosBrutos,
    gastos,
    ingresosNetos,
    rentabilidad,
    desgloseMensual,
  };
};

/**
 * Genera datos de reporte de mantenimiento
 */
const generateMantenimientoData = async (companyId: string, periodo: number) => {
  const now = new Date();
  const fechaInicio = new Date(now);
  fechaInicio.setMonth(fechaInicio.getMonth() - periodo);

  const solicitudes = await prisma.maintenanceRequest.findMany({
    where: {
      unit: {
        building: {
          companyId,
        },
      },
      fechaSolicitud: {
        gte: fechaInicio,
        lte: now,
      },
    },
    include: {
      unit: {
        include: {
          building: true,
        },
      },
    },
    orderBy: {
      fechaSolicitud: 'desc',
    },
    take: 50,
  });

  const totalSolicitudes = solicitudes.length;
  const pendientes = solicitudes.filter((s) => s.estado === 'pendiente').length;
  const enProgreso = solicitudes.filter((s) => s.estado === 'en_progreso').length;
  const completadas = solicitudes.filter((s) => s.estado === 'completado').length;
  const costoTotal = solicitudes.reduce((sum, s) => sum + (s.costoReal || s.costoEstimado || 0), 0);

  const solicitudesRecientes = solicitudes.slice(0, 20).map((sol) => ({
    titulo: sol.titulo,
    unidad: `${sol.unit.building.nombre} - ${sol.unit.numero}`,
    estado: sol.estado,
    prioridad: sol.prioridad,
    costo: sol.costoReal || sol.costoEstimado,
  }));

  return {
    totalSolicitudes,
    pendientes,
    enProgreso,
    completadas,
    costoTotal,
    solicitudesRecientes,
  };
};

/**
 * Procesa todos los reportes programados que están listos para enviar
 */
export const processScheduledReports = async () => {
  try {
    const now = new Date();

    // Obtener reportes que deben enviarse
    const reports = await prisma.scheduledReport.findMany({
      where: {
        activo: true,
        proximoEnvio: {
          lte: now,
        },
      },
    });

    logger.info(`Procesando ${reports.length} reportes programados...`);

    for (const report of reports) {
      try {
        await sendScheduledReport(report.id);
      } catch (error) {
        logger.error(`Error al procesar reporte ${report.id}:`, error);
      }
    }

    logger.info('Reportes programados procesados correctamente');
  } catch (error) {
    logger.error('Error al procesar reportes programados:', error);
    throw error;
  }
};

/**
 * Envía un reporte programado específico
 */
export const sendScheduledReport = async (reportId: string) => {
  const report = await prisma.scheduledReport.findUnique({
    where: { id: reportId },
  });

  if (!report) {
    throw new Error('Reporte no encontrado');
  }

  // Obtener información de la empresa
  const company = await prisma.company.findUnique({
    where: { id: report.companyId },
  });

  if (!company) {
    throw new Error('Empresa no encontrada');
  }

  // Determinar periodo en meses basado en frecuencia
  let periodoMeses = 1;
  switch (report.frecuencia) {
    case 'diario':
      periodoMeses = 1;
      break;
    case 'semanal':
      periodoMeses = 1;
      break;
    case 'quincenal':
      periodoMeses = 1;
      break;
    case 'mensual':
      periodoMeses = 1;
      break;
  }

  // Generar datos del reporte según el tipo
  let datos: any;
  switch (report.tipo) {
    case 'morosidad':
      datos = await generateMorosidadData(report.companyId, periodoMeses);
      break;
    case 'ocupacion':
      datos = await generateOcupacionData(report.companyId);
      break;
    case 'ingresos':
      datos = await generateIngresosData(report.companyId, periodoMeses);
      break;
    case 'mantenimiento':
      datos = await generateMantenimientoData(report.companyId, periodoMeses);
      break;
    default:
      throw new Error(`Tipo de reporte no soportado: ${report.tipo}`);
  }

  const reportData: ReportData = {
    tipo: report.tipo,
    periodo: `Últimos ${periodoMeses} mes(es)`,
    fechaGeneracion: new Date(),
    datos,
    companyInfo: {
      nombre: company.nombre,
      cif: company.cif || undefined,
      direccion: company.direccion || undefined,
      telefono: company.telefono || undefined,
      email: company.email || undefined,
    },
  };

  // Generar archivos
  const attachments: any[] = [];

  if (report.incluirPdf) {
    const pdfBuffer = await generateReportPDF(reportData);
    const pdfFilename = `reporte_${report.tipo}_${format(new Date(), 'yyyyMMdd', { locale: es })}.pdf`;
    attachments.push({
      filename: pdfFilename,
      content: pdfBuffer,
      contentType: 'application/pdf',
    });
  }

  if (report.incluirCsv) {
    const csvContent = generateReportCSV(reportData);
    const csvFilename = `reporte_${report.tipo}_${format(new Date(), 'yyyyMMdd', { locale: es })}.csv`;
    attachments.push({
      filename: csvFilename,
      content: Buffer.from(csvContent, 'utf-8'),
      contentType: 'text/csv',
    });
  }

  // Enviar emails a todos los destinatarios
  const emailPromises = report.destinatarios.map((email) =>
    sendEmail({
      to: email,
      subject: `Reporte Programado: ${report.nombre}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #000000;">${company.nombre}</h2>
          <h3>Reporte Programado: ${report.nombre}</h3>
          <p>Adjunto encontrará el reporte de <strong>${report.tipo}</strong> generado automáticamente.</p>
          <hr style="border: 1px solid #e0e0e0; margin: 20px 0;">
          <p><strong>Tipo de reporte:</strong> ${report.tipo.charAt(0).toUpperCase() + report.tipo.slice(1)}</p>
          <p><strong>Frecuencia:</strong> ${report.frecuencia.charAt(0).toUpperCase() + report.frecuencia.slice(1)}</p>
          <p><strong>Fecha de generación:</strong> ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
          <hr style="border: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">Este es un email automático generado por INMOVA. Por favor, no responder a este mensaje.</p>
        </div>
      `,
      attachments,
    })
  );

  await Promise.all(emailPromises);

  // Calcular próximo envío
  const now = new Date();
  let proximoEnvio = new Date(now);

  switch (report.frecuencia) {
    case 'diario':
      proximoEnvio.setDate(proximoEnvio.getDate() + 1);
      break;
    case 'semanal':
      proximoEnvio.setDate(proximoEnvio.getDate() + 7);
      break;
    case 'quincenal':
      proximoEnvio.setDate(proximoEnvio.getDate() + 15);
      break;
    case 'mensual':
      proximoEnvio.setMonth(proximoEnvio.getMonth() + 1);
      break;
  }

  // Actualizar reporte con último envío y próximo envío
  await prisma.scheduledReport.update({
    where: { id: reportId },
    data: {
      ultimoEnvio: now,
      proximoEnvio,
    },
  });

  logger.info(
    `Reporte ${report.nombre} enviado correctamente a ${report.destinatarios.length} destinatarios`
  );
};
