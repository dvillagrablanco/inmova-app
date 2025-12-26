/**
 * Servicio de Equipo Comercial Externo
 *
 * Gestiona comerciales autónomos, leads, comisiones y objetivos de ventas
 */

import bcrypt from 'bcryptjs';
import { prisma } from '../db';

// Definiciones de tipos inline (reemplaza imports de @prisma/client)
type SalesRepStatus = 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'CANCELADO';
type LeadStatus =
  | 'NUEVO'
  | 'CONTACTADO'
  | 'CALIFICADO'
  | 'DEMO'
  | 'PROPUESTA'
  | 'CERRADO'
  | 'PERDIDO';
type SalesCommissionType = 'CAPTACION' | 'RECURRENTE' | 'REACTIVACION' | 'BONIFICACION' | 'NIVEL2';
type SalesCommissionStatus = 'PENDIENTE' | 'APROBADA' | 'PAGADA' | 'CANCELADA' | 'RETENIDA';
type SalesCommission = any; // Tipo del modelo Prisma, se mantiene como any para compatibilidad

// ====================================
// GESTIÓN DE COMERCIALES
// ====================================

/**
 * Crear un nuevo comercial externo
 */
export async function createSalesRepresentative(data: {
  nombre: string;
  apellidos: string;
  dni: string;
  email: string;
  telefono: string;
  password: string;
  telefonoSecundario?: string;
  numeroAutonomo?: string;
  iban?: string;
  direccion?: string;
  ciudad?: string;
  codigoPostal?: string;
  comisionCaptacion?: number;
  comisionRecurrente?: number;
  bonificacionObjetivo?: number;
  objetivoLeadsMes?: number;
  objetivoConversionesMes?: number;
  notas?: string;
}) {
  // Generar código de referido único
  const nombreLimpio = data.nombre.toUpperCase().replace(/[^A-Z]/g, '');
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, '0');
  const codigoReferido = `COM-${nombreLimpio}-${year}-${random}`;

  // Hashear password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const salesRep = await prisma.salesRepresentative.create({
    data: {
      ...data,
      nombreCompleto: `${data.nombre} ${data.apellidos}`,
      password: hashedPassword,
      codigoReferido,
      comisionCaptacion: data.comisionCaptacion ?? 150.0,
      comisionRecurrente: data.comisionRecurrente ?? 10.0,
      bonificacionObjetivo: data.bonificacionObjetivo ?? 500.0,
      objetivoLeadsMes: data.objetivoLeadsMes ?? 10,
      objetivoConversionesMes: data.objetivoConversionesMes ?? 2,
    },
  });

  // Crear objetivos mensuales automáticos para los próximos 3 meses
  const today = new Date();
  for (let i = 0; i < 3; i++) {
    const targetMonth = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const periodo = `${targetMonth.getFullYear()}-${(targetMonth.getMonth() + 1).toString().padStart(2, '0')}`;

    await createSalesTarget({
      salesRepId: salesRep.id,
      periodo,
      tipoObjetivo: 'mensual',
      objetivoLeads: salesRep.objetivoLeadsMes,
      objetivoConversiones: salesRep.objetivoConversionesMes,
      objetivoMRR: salesRep.objetivoConversionesMes * 200, // Estimación
      fechaInicio: new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1),
      fechaFin: new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0),
    });
  }

  return salesRep;
}

/**
 * Actualizar información de un comercial
 */
export async function updateSalesRepresentative(
  id: string,
  data: Partial<{
    nombre: string;
    apellidos: string;
    email: string;
    telefono: string;
    telefonoSecundario: string;
    numeroAutonomo: string;
    iban: string;
    direccion: string;
    ciudad: string;
    codigoPostal: string;
    comisionCaptacion: number;
    comisionRecurrente: number;
    bonificacionObjetivo: number;
    objetivoLeadsMes: number;
    objetivoConversionesMes: number;
    estado: SalesRepStatus;
    notas: string;
  }>
) {
  const updateData: any = { ...data };

  if (data.nombre || data.apellidos) {
    const current = await prisma.salesRepresentative.findUnique({ where: { id } });
    if (current) {
      updateData.nombreCompleto = `${data.nombre ?? current.nombre} ${data.apellidos ?? current.apellidos}`;
    }
  }

  return await prisma.salesRepresentative.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Cambiar contraseña de un comercial
 */
export async function changeSalesRepPassword(id: string, newPassword: string) {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  return await prisma.salesRepresentative.update({
    where: { id },
    data: { password: hashedPassword },
  });
}

/**
 * Suspender o reactivar un comercial
 */
export async function updateSalesRepStatus(
  id: string,
  estado: SalesRepStatus,
  motivoBaja?: string
) {
  return await prisma.salesRepresentative.update({
    where: { id },
    data: {
      estado,
      activo: estado === 'ACTIVO',
      fechaBaja: estado === 'CANCELADO' ? new Date() : undefined,
      motivoBaja: motivoBaja || undefined,
    },
  });
}

/**
 * Obtener lista de comerciales con filtros
 */
export async function getSalesRepresentatives(filters?: {
  estado?: SalesRepStatus;
  activo?: boolean;
  search?: string;
}) {
  const where: any = {};

  if (filters?.estado) where.estado = filters.estado;
  if (filters?.activo !== undefined) where.activo = filters.activo;
  if (filters?.search) {
    where.OR = [
      { nombreCompleto: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { dni: { contains: filters.search, mode: 'insensitive' } },
      { codigoReferido: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return await prisma.salesRepresentative.findMany({
    where,
    include: {
      _count: {
        select: {
          leads: true,
          comisiones: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Obtener un comercial por ID
 */
export async function getSalesRepresentativeById(id: string) {
  return await prisma.salesRepresentative.findUnique({
    where: { id },
    include: {
      leads: {
        orderBy: { fechaCaptura: 'desc' },
        take: 10,
      },
      comisiones: {
        orderBy: { fechaGeneracion: 'desc' },
        take: 10,
      },
      objetivos: {
        orderBy: { fechaInicio: 'desc' },
        take: 6,
      },
    },
  });
}

/**
 * Actualizar métricas de un comercial
 */
export async function updateSalesRepMetrics(id: string) {
  const salesRep = await prisma.salesRepresentative.findUnique({
    where: { id },
    include: {
      leads: true,
      comisiones: { where: { estado: 'PAGADA' } },
    },
  });

  if (!salesRep) throw new Error('Comercial no encontrado');

  const totalLeadsGenerados = salesRep.leads.length;
  const totalConversiones = salesRep.leads.filter((l) => l.convertido).length;
  const totalComisionGenerada = salesRep.comisiones.reduce((sum, c) => sum + c.montoNeto, 0);
  const tasaConversion =
    totalLeadsGenerados > 0 ? (totalConversiones / totalLeadsGenerados) * 100 : 0;

  return await prisma.salesRepresentative.update({
    where: { id },
    data: {
      totalLeadsGenerados,
      totalConversiones,
      totalComisionGenerada,
      tasaConversion,
    },
  });
}

// ====================================
// GESTIÓN DE LEADS
// ====================================

/**
 * Crear un nuevo lead
 */
export async function createLead(data: {
  salesRepId: string;
  nombreContacto: string;
  emailContacto: string;
  telefonoContacto?: string;
  nombreEmpresa: string;
  sector?: string;
  tipoCliente?: string;
  propiedadesEstimadas?: number;
  presupuestoMensual?: number;
  origenCaptura?: string;
  prioridad?: string;
  notas?: string;
}) {
  const lead = await prisma.salesLead.create({
    data: {
      ...data,
      estado: 'NUEVO',
    },
  });

  // Actualizar métricas del comercial
  await updateSalesRepMetrics(data.salesRepId);

  return lead;
}

/**
 * Actualizar estado de un lead
 */
export async function updateLeadStatus(
  id: string,
  estado: LeadStatus,
  notas?: string,
  motivoRechazo?: string
) {
  const updateData: any = { estado };

  if (notas) updateData.notas = notas;
  if (motivoRechazo) updateData.motivoRechazo = motivoRechazo;

  if (estado === 'CONTACTADO' && !updateData.fechaPrimerContacto) {
    updateData.fechaPrimerContacto = new Date();
  }

  updateData.fechaUltimoContacto = new Date();

  return await prisma.salesLead.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Actualizar información de un lead
 */
export async function updateLead(
  id: string,
  data: Partial<{
    nombreContacto: string;
    emailContacto: string;
    telefonoContacto: string;
    nombreEmpresa: string;
    sector: string;
    tipoCliente: string;
    propiedadesEstimadas: number;
    presupuestoMensual: number;
    prioridad: string;
    probabilidadCierre: number;
    proximoSeguimiento: Date;
    notas: string;
  }>
) {
  return await prisma.salesLead.update({
    where: { id },
    data,
  });
}

/**
 * Registrar interacción con un lead
 */
export async function registerLeadInteraction(id: string, tipo: 'llamada' | 'email' | 'reunion') {
  const lead = await prisma.salesLead.findUnique({ where: { id } });
  if (!lead) throw new Error('Lead no encontrado');

  const updateData: any = {
    fechaUltimoContacto: new Date(),
  };

  if (tipo === 'llamada') updateData.numeroLlamadas = lead.numeroLlamadas + 1;
  if (tipo === 'email') updateData.numeroEmails = lead.numeroEmails + 1;
  if (tipo === 'reunion') updateData.numeroReuniones = lead.numeroReuniones + 1;

  return await prisma.salesLead.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Convertir lead en cliente
 */
export async function convertLead(data: {
  leadId: string;
  companyId: string;
  planSuscrito: string;
  valorMensual: number;
}) {
  const lead = await prisma.salesLead.update({
    where: { id: data.leadId },
    data: {
      convertido: true,
      fechaConversion: new Date(),
      companyId: data.companyId,
      planSuscrito: data.planSuscrito,
      valorMensual: data.valorMensual,
      estado: 'CERRADO_GANADO',
    },
    include: { salesRep: true },
  });

  // Generar comisión de captación
  await createCommission({
    salesRepId: lead.salesRepId,
    leadId: lead.id,
    companyId: data.companyId,
    tipo: 'CAPTACION',
    descripcion: `Comisión por captación de ${lead.nombreEmpresa}`,
    montoBase: data.valorMensual,
    montoComision: lead.salesRep.comisionCaptacion,
  });

  // Actualizar métricas del comercial
  await updateSalesRepMetrics(lead.salesRepId);

  // Actualizar objetivos del periodo actual
  await updateTargetProgress(lead.salesRepId);

  return lead;
}

/**
 * Obtener leads con filtros
 */
export async function getLeads(filters?: {
  salesRepId?: string;
  estado?: LeadStatus;
  convertido?: boolean;
  prioridad?: string;
  search?: string;
}) {
  const where: any = {};

  if (filters?.salesRepId) where.salesRepId = filters.salesRepId;
  if (filters?.estado) where.estado = filters.estado;
  if (filters?.convertido !== undefined) where.convertido = filters.convertido;
  if (filters?.prioridad) where.prioridad = filters.prioridad;
  if (filters?.search) {
    where.OR = [
      { nombreContacto: { contains: filters.search, mode: 'insensitive' } },
      { emailContacto: { contains: filters.search, mode: 'insensitive' } },
      { nombreEmpresa: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return await prisma.salesLead.findMany({
    where,
    include: {
      salesRep: {
        select: {
          id: true,
          nombreCompleto: true,
          email: true,
          codigoReferido: true,
        },
      },
    },
    orderBy: { fechaCaptura: 'desc' },
  });
}

/**
 * Obtener un lead por ID
 */
export async function getLeadById(id: string) {
  return await prisma.salesLead.findUnique({
    where: { id },
    include: {
      salesRep: true,
      company: true,
      comisiones: true,
    },
  });
}

// ====================================
// GESTIÓN DE COMISIONES
// ====================================

/**
 * Crear una comisión
 */
export async function createCommission(data: {
  salesRepId: string;
  leadId?: string;
  companyId?: string;
  tipo: SalesCommissionType;
  descripcion: string;
  periodo?: string;
  montoBase: number;
  porcentaje?: number;
  montoComision: number;
  retencionIRPF?: number;
}) {
  const retencionIRPF = data.retencionIRPF ?? 0;
  const montoNeto = data.montoComision - retencionIRPF;

  return await prisma.salesCommission.create({
    data: {
      ...data,
      retencionIRPF,
      montoNeto,
      estado: 'PENDIENTE',
    },
  });
}

/**
 * Aprobar una comisión
 */
export async function approveCommission(id: string, aprobadoPor: string, notaAprobacion?: string) {
  return await prisma.salesCommission.update({
    where: { id },
    data: {
      estado: 'APROBADA',
      fechaAprobacion: new Date(),
      aprobadoPor,
      notaAprobacion,
    },
  });
}

/**
 * Marcar comisión como pagada
 */
export async function markCommissionPaid(
  id: string,
  data: {
    referenciaPago: string;
    metodoPago: string;
    comprobantePago?: string;
  }
) {
  const commission = await prisma.salesCommission.update({
    where: { id },
    data: {
      estado: 'PAGADA',
      fechaPago: new Date(),
      ...data,
    },
  });

  // Actualizar métricas del comercial
  await updateSalesRepMetrics(commission.salesRepId);

  return commission;
}

/**
 * Cancelar una comisión
 */
export async function cancelCommission(id: string, motivo: string) {
  return await prisma.salesCommission.update({
    where: { id },
    data: {
      estado: 'CANCELADA',
      notaAprobacion: motivo,
    },
  });
}

/**
 * Obtener comisiones con filtros
 */
export async function getCommissions(filters?: {
  salesRepId?: string;
  estado?: SalesCommissionStatus;
  tipo?: SalesCommissionType;
  periodo?: string;
}) {
  const where: any = {};

  if (filters?.salesRepId) where.salesRepId = filters.salesRepId;
  if (filters?.estado) where.estado = filters.estado;
  if (filters?.tipo) where.tipo = filters.tipo;
  if (filters?.periodo) where.periodo = filters.periodo;

  return await prisma.salesCommission.findMany({
    where,
    include: {
      salesRep: {
        select: {
          id: true,
          nombreCompleto: true,
          email: true,
        },
      },
      lead: {
        select: {
          id: true,
          nombreEmpresa: true,
          nombreContacto: true,
        },
      },
    },
    orderBy: { fechaGeneracion: 'desc' },
  });
}

/**
 * Generar comisiones recurrentes mensuales
 * (Esta función debe ejecutarse automáticamente cada mes)
 */
export async function generateRecurrentCommissions(periodo: string) {
  // Obtener todos los leads convertidos con company activa
  const convertedLeads = await prisma.salesLead.findMany({
    where: {
      convertido: true,
      companyId: { not: null },
    },
    include: {
      salesRep: true,
      company: true,
    },
  });

  const comisiones: SalesCommission[] = [];

  for (const lead of convertedLeads) {
    if (!lead.company || !lead.company.activo) continue;
    if (!lead.valorMensual || lead.valorMensual <= 0) continue;

    const comisionRecurrente = (lead.valorMensual * lead.salesRep.comisionRecurrente) / 100;

    const comision = await createCommission({
      salesRepId: lead.salesRepId,
      leadId: lead.id,
      companyId: lead.companyId!,
      tipo: 'RECURRENTE',
      descripcion: `Comisión recurrente ${periodo} - ${lead.nombreEmpresa}`,
      periodo,
      montoBase: lead.valorMensual,
      porcentaje: lead.salesRep.comisionRecurrente,
      montoComision: comisionRecurrente,
      retencionIRPF: comisionRecurrente * 0.15, // 15% IRPF
    });

    comisiones.push(comision);
  }

  return comisiones;
}

// ====================================
// GESTIÓN DE OBJETIVOS
// ====================================

/**
 * Crear objetivo de ventas
 */
export async function createSalesTarget(data: {
  salesRepId: string;
  periodo: string;
  tipoObjetivo: string;
  objetivoLeads: number;
  objetivoConversiones: number;
  objetivoMRR: number;
  fechaInicio: Date;
  fechaFin: Date;
}) {
  return await prisma.salesTarget.create({
    data,
  });
}

/**
 * Actualizar progreso de objetivos del periodo actual
 */
export async function updateTargetProgress(salesRepId: string) {
  const today = new Date();
  const periodoActual = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;

  const target = await prisma.salesTarget.findUnique({
    where: {
      salesRepId_periodo: {
        salesRepId,
        periodo: periodoActual,
      },
    },
  });

  if (!target) return null;

  // Contar leads del periodo
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const leads = await prisma.salesLead.findMany({
    where: {
      salesRepId,
      fechaCaptura: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  const leadsGenerados = leads.length;
  const conversionesLogradas = leads.filter((l) => l.convertido).length;
  const mrrGenerado = leads
    .filter((l) => l.convertido && l.valorMensual)
    .reduce((sum, l) => sum + (l.valorMensual || 0), 0);

  const porcentajeLeads =
    target.objetivoLeads > 0 ? (leadsGenerados / target.objetivoLeads) * 100 : 0;
  const porcentajeConversiones =
    target.objetivoConversiones > 0
      ? (conversionesLogradas / target.objetivoConversiones) * 100
      : 0;
  const porcentajeMRR = target.objetivoMRR > 0 ? (mrrGenerado / target.objetivoMRR) * 100 : 0;

  const cumplido = porcentajeLeads >= 100 && porcentajeConversiones >= 100 && porcentajeMRR >= 100;

  return await prisma.salesTarget.update({
    where: { id: target.id },
    data: {
      leadsGenerados,
      conversionesLogradas,
      mrrGenerado,
      porcentajeLeads,
      porcentajeConversiones,
      porcentajeMRR,
      cumplido,
    },
  });
}

/**
 * Procesar bonificaciones por objetivos cumplidos
 */
export async function processBonifications(periodo: string) {
  const targets = await prisma.salesTarget.findMany({
    where: {
      periodo,
      cumplido: true,
      bonificacionPagada: false,
    },
    include: { salesRep: true },
  });

  const bonificaciones: SalesCommission[] = [];

  for (const target of targets) {
    const bonificacion = await createCommission({
      salesRepId: target.salesRepId,
      tipo: 'BONIFICACION',
      descripcion: `Bonificación por cumplimiento de objetivos ${periodo}`,
      periodo,
      montoBase: target.salesRep.bonificacionObjetivo,
      montoComision: target.salesRep.bonificacionObjetivo,
      retencionIRPF: target.salesRep.bonificacionObjetivo * 0.15,
    });

    await prisma.salesTarget.update({
      where: { id: target.id },
      data: {
        montoBonificacion: target.salesRep.bonificacionObjetivo,
      },
    });

    bonificaciones.push(bonificacion);
  }

  return bonificaciones;
}

/**
 * Obtener objetivos con filtros
 */
export async function getSalesTargets(filters?: {
  salesRepId?: string;
  periodo?: string;
  cumplido?: boolean;
}) {
  const where: any = {};

  if (filters?.salesRepId) where.salesRepId = filters.salesRepId;
  if (filters?.periodo) where.periodo = filters.periodo;
  if (filters?.cumplido !== undefined) where.cumplido = filters.cumplido;

  return await prisma.salesTarget.findMany({
    where,
    include: {
      salesRep: {
        select: {
          id: true,
          nombreCompleto: true,
          email: true,
        },
      },
    },
    orderBy: { fechaInicio: 'desc' },
  });
}

// ====================================
// ESTADÍSTICAS Y REPORTES
// ====================================

/**
 * Obtener dashboard del comercial
 */
export async function getSalesRepDashboard(salesRepId: string) {
  const salesRep = await getSalesRepresentativeById(salesRepId);
  if (!salesRep) throw new Error('Comercial no encontrado');

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const periodoActual = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;

  // Leads del mes actual
  const leadsEsteMes = await prisma.salesLead.count({
    where: {
      salesRepId,
      fechaCaptura: { gte: startOfMonth },
    },
  });

  const conversionesEsteMes = await prisma.salesLead.count({
    where: {
      salesRepId,
      convertido: true,
      fechaConversion: { gte: startOfMonth },
    },
  });

  // Comisiones pendientes
  const comisionesPendientes = await prisma.salesCommission.aggregate({
    where: {
      salesRepId,
      estado: { in: ['PENDIENTE', 'APROBADA'] },
    },
    _sum: { montoNeto: true },
  });

  // Comisiones pagadas este mes
  const comisionesPagadasMes = await prisma.salesCommission.aggregate({
    where: {
      salesRepId,
      estado: 'PAGADA',
      fechaPago: { gte: startOfMonth },
    },
    _sum: { montoNeto: true },
  });

  // Objetivo actual
  const objetivoActual = await prisma.salesTarget.findUnique({
    where: {
      salesRepId_periodo: { salesRepId, periodo: periodoActual },
    },
  });

  // Leads próximos a seguimiento
  const leadsSeguimiento = await prisma.salesLead.count({
    where: {
      salesRepId,
      proximoSeguimiento: {
        gte: today,
        lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // próximos 7 días
      },
    },
  });

  return {
    salesRep,
    estadisticas: {
      leadsEsteMes,
      conversionesEsteMes,
      comisionesPendientes: comisionesPendientes._sum.montoNeto || 0,
      comisionesPagadasMes: comisionesPagadasMes._sum.montoNeto || 0,
      leadsSeguimiento,
    },
    objetivoActual,
  };
}

/**
 * Obtener dashboard administrativo (vista general)
 */
export async function getAdminDashboard() {
  const comercialesActivos = await prisma.salesRepresentative.count({
    where: { activo: true },
  });

  const totalLeads = await prisma.salesLead.count();
  const leadsConvertidos = await prisma.salesLead.count({
    where: { convertido: true },
  });

  const comisionesPendientes = await prisma.salesCommission.aggregate({
    where: { estado: { in: ['PENDIENTE', 'APROBADA'] } },
    _sum: { montoNeto: true },
    _count: true,
  });

  const comisionesPagadas = await prisma.salesCommission.aggregate({
    where: { estado: 'PAGADA' },
    _sum: { montoNeto: true },
  });

  const topComerciales = await prisma.salesRepresentative.findMany({
    where: { activo: true },
    orderBy: { totalConversiones: 'desc' },
    take: 10,
    select: {
      id: true,
      nombreCompleto: true,
      totalLeadsGenerados: true,
      totalConversiones: true,
      tasaConversion: true,
      totalComisionGenerada: true,
    },
  });

  return {
    resumen: {
      comercialesActivos,
      totalLeads,
      leadsConvertidos,
      tasaConversionGlobal: totalLeads > 0 ? (leadsConvertidos / totalLeads) * 100 : 0,
      comisionesPendientes: {
        cantidad: comisionesPendientes._count,
        monto: comisionesPendientes._sum.montoNeto || 0,
      },
      comisionesPagadas: comisionesPagadas._sum.montoNeto || 0,
    },
    topComerciales,
  };
}

export default {
  // Comerciales
  createSalesRepresentative,
  updateSalesRepresentative,
  changeSalesRepPassword,
  updateSalesRepStatus,
  getSalesRepresentatives,
  getSalesRepresentativeById,
  updateSalesRepMetrics,

  // Leads
  createLead,
  updateLeadStatus,
  updateLead,
  registerLeadInteraction,
  convertLead,
  getLeads,
  getLeadById,

  // Comisiones
  createCommission,
  approveCommission,
  markCommissionPaid,
  cancelCommission,
  getCommissions,
  generateRecurrentCommissions,

  // Objetivos
  createSalesTarget,
  updateTargetProgress,
  processBonifications,
  getSalesTargets,

  // Dashboards
  getSalesRepDashboard,
  getAdminDashboard,
};
