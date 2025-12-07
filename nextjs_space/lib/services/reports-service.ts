/**
 * Servicio de Reportes Avanzados
 * 
 * Genera reportes en formato PDF, CSV y gráficas
 * para comisiones, leads, objetivos y más
 */

import { prisma } from '@/lib/db';
import Papa from 'papaparse';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

// ====================================
// REPORTES CSV
// ====================================

/**
 * Generar reporte CSV de comisiones
 */
export async function generateCommissionsCSV(filters?: {
  salesRepId?: string;
  periodo?: string;
  estado?: string;
}) {
  const where: any = {};
  
  if (filters?.salesRepId) where.salesRepId = filters.salesRepId;
  if (filters?.periodo) where.periodo = filters.periodo;
  if (filters?.estado) where.estado = filters.estado;
  
  const comisiones = await prisma.salesCommission.findMany({
    where,
    include: {
      salesRep: {
        select: {
          nombreCompleto: true,
          email: true,
          codigoReferido: true,
        },
      },
      lead: {
        select: {
          nombreEmpresa: true,
          nombreContacto: true,
        },
      },
    },
    orderBy: { fechaGeneracion: 'desc' },
  });
  
  const data = comisiones.map((c) => ({
    ID: c.id,
    Comercial: c.salesRep.nombreCompleto,
    Email: c.salesRep.email,
    'Código Referido': c.salesRep.codigoReferido,
    Tipo: c.tipo,
    Descripción: c.descripcion,
    Periodo: c.periodo || '-',
    'Monto Base': c.montoBase.toFixed(2),
    Porcentaje: c.porcentaje?.toFixed(2) || '-',
    'Monto Comisión': c.montoComision.toFixed(2),
    'Retención IRPF': c.retencionIRPF.toFixed(2),
    'Monto Neto': c.montoNeto.toFixed(2),
    Estado: c.estado,
    'Fecha Generación': format(new Date(c.fechaGeneracion), 'dd/MM/yyyy HH:mm'),
    'Fecha Aprobación': c.fechaAprobacion ? format(new Date(c.fechaAprobacion), 'dd/MM/yyyy HH:mm') : '-',
    'Fecha Pago': c.fechaPago ? format(new Date(c.fechaPago), 'dd/MM/yyyy HH:mm') : '-',
    'Aprobado Por': c.aprobadoPor || '-',
    'Referencia Pago': c.referenciaPago || '-',
    'Método Pago': c.metodoPago || '-',
    'Empresa Lead': c.lead?.nombreEmpresa || '-',
    'Contacto Lead': c.lead?.nombreContacto || '-',
  }));
  
  const csv = Papa.unparse(data, {
    delimiter: ',',
    header: true,
  });
  
  return csv;
}

/**
 * Generar reporte CSV de leads
 */
export async function generateLeadsCSV(filters?: {
  salesRepId?: string;
  estado?: string;
  convertido?: boolean;
}) {
  const where: any = {};
  
  if (filters?.salesRepId) where.salesRepId = filters.salesRepId;
  if (filters?.estado) where.estado = filters.estado;
  if (filters?.convertido !== undefined) where.convertido = filters.convertido;
  
  const leads = await prisma.salesLead.findMany({
    where,
    include: {
      salesRep: {
        select: {
          nombreCompleto: true,
          email: true,
          codigoReferido: true,
        },
      },
    },
    orderBy: { fechaCaptura: 'desc' },
  });
  
  const data = leads.map((l) => ({
    ID: l.id,
    Comercial: l.salesRep.nombreCompleto,
    'Contacto Nombre': l.nombreContacto,
    'Contacto Email': l.emailContacto,
    'Contacto Teléfono': l.telefonoContacto || '-',
    Empresa: l.nombreEmpresa,
    Sector: l.sector || '-',
    'Tipo Cliente': l.tipoCliente || '-',
    'Propiedades Estimadas': l.propiedadesEstimadas || '-',
    'Presupuesto Mensual': l.presupuestoMensual ? `€${l.presupuestoMensual.toFixed(2)}` : '-',
    Estado: l.estado,
    Prioridad: l.prioridad || '-',
    'Origen Captura': l.origenCaptura || '-',
    'Fecha Captura': format(new Date(l.fechaCaptura), 'dd/MM/yyyy HH:mm'),
    'Primer Contacto': l.fechaPrimerContacto ? format(new Date(l.fechaPrimerContacto), 'dd/MM/yyyy') : '-',
    'Último Contacto': l.fechaUltimoContacto ? format(new Date(l.fechaUltimoContacto), 'dd/MM/yyyy') : '-',
    'Nº Llamadas': l.numeroLlamadas,
    'Nº Emails': l.numeroEmails,
    'Nº Reuniones': l.numeroReuniones,
    'Probabilidad Cierre': l.probabilidadCierre ? `${l.probabilidadCierre}%` : '-',
    Convertido: l.convertido ? 'SÍ' : 'NO',
    'Fecha Conversión': l.fechaConversion ? format(new Date(l.fechaConversion), 'dd/MM/yyyy') : '-',
    'Plan Suscrito': l.planSuscrito || '-',
    'Valor Mensual': l.valorMensual ? `€${l.valorMensual.toFixed(2)}` : '-',
    'Motivo Rechazo': l.motivoRechazo || '-',
  }));
  
  const csv = Papa.unparse(data, {
    delimiter: ',',
    header: true,
  });
  
  return csv;
}

/**
 * Generar reporte CSV de objetivos
 */
export async function generateTargetsCSV(filters?: {
  salesRepId?: string;
  periodo?: string;
}) {
  const where: any = {};
  
  if (filters?.salesRepId) where.salesRepId = filters.salesRepId;
  if (filters?.periodo) where.periodo = filters.periodo;
  
  const targets = await prisma.salesTarget.findMany({
    where,
    include: {
      salesRep: {
        select: {
          nombreCompleto: true,
          email: true,
        },
      },
    },
    orderBy: { fechaInicio: 'desc' },
  });
  
  const data = targets.map((t) => ({
    ID: t.id,
    Comercial: t.salesRep.nombreCompleto,
    Periodo: t.periodo,
    'Tipo Objetivo': t.tipoObjetivo,
    'Objetivo Leads': t.objetivoLeads,
    'Leads Generados': t.leadsGenerados,
    '% Leads': `${t.porcentajeLeads.toFixed(1)}%`,
    'Objetivo Conversiones': t.objetivoConversiones,
    'Conversiones Logradas': t.conversionesLogradas,
    '% Conversiones': `${t.porcentajeConversiones.toFixed(1)}%`,
    'Objetivo MRR': `€${t.objetivoMRR.toFixed(2)}`,
    'MRR Generado': `€${t.mrrGenerado.toFixed(2)}`,
    '% MRR': `${t.porcentajeMRR.toFixed(1)}%`,
    Cumplido: t.cumplido ? 'SÍ' : 'NO',
    'Bonificación Pagada': t.bonificacionPagada ? 'SÍ' : 'NO',
    'Monto Bonificación': t.montoBonificacion ? `€${t.montoBonificacion.toFixed(2)}` : '-',
    'Fecha Inicio': format(new Date(t.fechaInicio), 'dd/MM/yyyy'),
    'Fecha Fin': format(new Date(t.fechaFin), 'dd/MM/yyyy'),
  }));
  
  const csv = Papa.unparse(data, {
    delimiter: ',',
    header: true,
  });
  
  return csv;
}

/**
 * Generar reporte CSV de comerciales
 */
export async function generateSalesRepsCSV(filters?: {
  estado?: string;
  activo?: boolean;
}) {
  const where: any = {};
  
  if (filters?.estado) where.estado = filters.estado;
  if (filters?.activo !== undefined) where.activo = filters.activo;
  
  const salesReps = await prisma.salesRepresentative.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
  
  const data = salesReps.map((s) => ({
    ID: s.id,
    'Nombre Completo': s.nombreCompleto,
    DNI: s.dni,
    Email: s.email,
    Teléfono: s.telefono,
    'Teléfono Secundario': s.telefonoSecundario || '-',
    'Número Autónomo': s.numeroAutonomo || '-',
    IBAN: s.iban || '-',
    Dirección: s.direccion || '-',
    Ciudad: s.ciudad || '-',
    'Código Postal': s.codigoPostal || '-',
    'Código Referido': s.codigoReferido,
    Estado: s.estado,
    Activo: s.activo ? 'SÍ' : 'NO',
    'Comisión Captación': `€${s.comisionCaptacion.toFixed(2)}`,
    'Comisión Recurrente': `${s.comisionRecurrente.toFixed(2)}%`,
    'Bonificación Objetivo': `€${s.bonificacionObjetivo.toFixed(2)}`,
    'Objetivo Leads/Mes': s.objetivoLeadsMes,
    'Objetivo Conversiones/Mes': s.objetivoConversionesMes,
    'Total Leads Generados': s.totalLeadsGenerados,
    'Total Conversiones': s.totalConversiones,
    'Tasa Conversión': `${s.tasaConversion.toFixed(1)}%`,
    'Total Comisión Generada': `€${s.totalComisionGenerada.toFixed(2)}`,
    'Fecha Alta': format(new Date(s.createdAt), 'dd/MM/yyyy'),
    'Fecha Baja': s.fechaBaja ? format(new Date(s.fechaBaja), 'dd/MM/yyyy') : '-',
    'Motivo Baja': s.motivoBaja || '-',
  }));
  
  const csv = Papa.unparse(data, {
    delimiter: ',',
    header: true,
  });
  
  return csv;
}

// ====================================
// DATOS PARA GRÁFICAS
// ====================================

/**
 * Obtener datos para gráfica de evolución de comisiones
 */
export async function getCommissionsChartData(salesRepId?: string, months = 12) {
  const monthsArray: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    monthsArray.push(format(date, 'yyyy-MM'));
  }
  
  const where: any = { periodo: { in: monthsArray } };
  if (salesRepId) where.salesRepId = salesRepId;
  
  const comisiones = await prisma.salesCommission.findMany({
    where,
    select: {
      periodo: true,
      tipo: true,
      montoNeto: true,
    },
  });
  
  const chartData = monthsArray.map((periodo) => {
    const comisionesMes = comisiones.filter((c) => c.periodo === periodo);
    const recurrentes = comisionesMes
      .filter((c) => c.tipo === 'RECURRENTE')
      .reduce((sum, c) => sum + c.montoNeto, 0);
    const captacion = comisionesMes
      .filter((c) => c.tipo === 'CAPTACION')
      .reduce((sum, c) => sum + c.montoNeto, 0);
    const bonificaciones = comisionesMes
      .filter((c) => c.tipo === 'BONIFICACION')
      .reduce((sum, c) => sum + c.montoNeto, 0);
    
    return {
      periodo,
      recurrentes,
      captacion,
      bonificaciones,
      total: recurrentes + captacion + bonificaciones,
    };
  });
  
  return chartData;
}

/**
 * Obtener datos para gráfica de evolución de leads
 */
export async function getLeadsChartData(salesRepId?: string, months = 12) {
  const monthsArray: Array<{ periodo: string; start: Date; end: Date }> = [];
  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    monthsArray.push({ periodo: format(date, 'yyyy-MM'), start, end });
  }
  
  const chartData: Array<{
    periodo: string;
    totalLeads: number;
    convertidos: number;
    enProceso: number;
    perdidos: number;
    tasaConversion: string;
  }> = [];
  
  for (const { periodo, start, end } of monthsArray) {
    const where: any = {
      fechaCaptura: {
        gte: start,
        lte: end,
      },
    };
    if (salesRepId) where.salesRepId = salesRepId;
    
    const totalLeads = await prisma.salesLead.count({ where });
    const convertidos = await prisma.salesLead.count({
      where: { ...where, convertido: true },
    });
    const enProceso = await prisma.salesLead.count({
      where: { ...where, estado: { in: ['CONTACTADO', 'EN_NEGOCIACION', 'PROPUESTA_ENVIADA'] } },
    });
    const perdidos = await prisma.salesLead.count({
      where: { ...where, estado: 'CERRADO_PERDIDO' },
    });
    
    chartData.push({
      periodo,
      totalLeads,
      convertidos,
      enProceso,
      perdidos,
      tasaConversion: totalLeads > 0 ? ((convertidos / totalLeads) * 100).toFixed(1) : '0',
    });
  }
  
  return chartData;
}

/**
 * Obtener datos para gráfica de cumplimiento de objetivos
 */
export async function getTargetsChartData(salesRepId?: string, months = 6) {
  const monthsArray: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    monthsArray.push(format(date, 'yyyy-MM'));
  }
  
  const where: any = { periodo: { in: monthsArray } };
  if (salesRepId) where.salesRepId = salesRepId;
  
  const targets = await prisma.salesTarget.findMany({
    where,
    orderBy: { fechaInicio: 'asc' },
  });
  
  const chartData = monthsArray.map((periodo) => {
    const target = targets.find((t) => t.periodo === periodo);
    if (!target) {
      return {
        periodo,
        porcentajeLeads: 0,
        porcentajeConversiones: 0,
        porcentajeMRR: 0,
        cumplido: false,
      };
    }
    return {
      periodo,
      porcentajeLeads: target.porcentajeLeads,
      porcentajeConversiones: target.porcentajeConversiones,
      porcentajeMRR: target.porcentajeMRR,
      cumplido: target.cumplido,
    };
  });
  
  return chartData;
}

/**
 * Obtener ranking de comerciales
 */
export async function getSalesRepsRanking(periodo?: string) {
  const where: any = { activo: true };
  
  const salesReps = await prisma.salesRepresentative.findMany({
    where,
    select: {
      id: true,
      nombreCompleto: true,
      totalLeadsGenerados: true,
      totalConversiones: true,
      tasaConversion: true,
      totalComisionGenerada: true,
    },
    orderBy: { totalComisionGenerada: 'desc' },
    take: 20,
  });
  
  return salesReps;
}

/**
 * Estadísticas generales
 */
export async function getGeneralStats(periodo?: string) {
  const where: any = {};
  if (periodo) where.periodo = periodo;
  
  const totalComerciales = await prisma.salesRepresentative.count();
  const comercialesActivos = await prisma.salesRepresentative.count({
    where: { activo: true },
  });
  
  const totalLeads = await prisma.salesLead.count();
  const leadsConvertidos = await prisma.salesLead.count({ where: { convertido: true } });
  
  const comisionesTotales = await prisma.salesCommission.aggregate({
    where,
    _sum: { montoNeto: true },
  });
  
  const comisionesPendientes = await prisma.salesCommission.aggregate({
    where: { ...where, estado: 'PENDIENTE' },
    _sum: { montoNeto: true },
    _count: true,
  });
  
  return {
    totalComerciales,
    comercialesActivos,
    totalLeads,
    leadsConvertidos,
    tasaConversionGlobal: totalLeads > 0 ? ((leadsConvertidos / totalLeads) * 100).toFixed(1) : '0',
    comisionesTotales: comisionesTotales._sum.montoNeto || 0,
    comisionesPendientes: {
      cantidad: comisionesPendientes._count,
      monto: comisionesPendientes._sum.montoNeto || 0,
    },
  };
}

export default {
  // CSV
  generateCommissionsCSV,
  generateLeadsCSV,
  generateTargetsCSV,
  generateSalesRepsCSV,
  
  // Gráficas
  getCommissionsChartData,
  getLeadsChartData,
  getTargetsChartData,
  getSalesRepsRanking,
  getGeneralStats,
};
