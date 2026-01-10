/**
 * 📊 CRM Service - Gestión Completa de Leads y Deals
 *
 * CORREGIDO: Usa los campos correctos del modelo Lead en español
 * según prisma/schema.prisma
 *
 * Campos del modelo Lead:
 * - nombre, apellidos, email, telefono, empresa, cargo
 * - ciudad, pais, fuente, estado, puntuacion, temperatura
 * - presupuestoMensual, notas, urgencia
 * - asignadoA, ultimoContacto, proximoSeguimiento
 */

import { prisma } from '@/lib/db';

// ============================================================================
// TIPOS - Adaptados al modelo Lead real
// ============================================================================

export interface CreateLeadInput {
  companyId: string;
  nombre: string;
  apellidos?: string;
  email: string;
  telefono?: string;
  empresa?: string;
  cargo?: string;
  ciudad?: string;
  pais?: string;
  fuente: string;
  asignadoA?: string;
  notas?: string;
  urgencia?: string;
  presupuestoMensual?: number;
}

export interface UpdateLeadInput {
  nombre?: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  empresa?: string;
  cargo?: string;
  ciudad?: string;
  estado?: string;
  urgencia?: string;
  asignadoA?: string;
  notas?: string;
  presupuestoMensual?: number;
  proximoSeguimiento?: Date;
  temperatura?: string;
}

export interface LeadFilters {
  estado?: string[];
  fuente?: string[];
  urgencia?: string[];
  asignadoA?: string;
  minPuntuacion?: number;
  maxPuntuacion?: number;
  ciudad?: string[];
  temperatura?: string[];
}

// ============================================================================
// LEAD SCORING - Sistema Automático de Puntuación
// ============================================================================

export interface LeadScoringFactors {
  hasEmail: boolean;
  hasTelefono: boolean;
  hasEmpresa: boolean;
  hasCargo: boolean;
  hasCiudad: boolean;
  hasPresupuesto: boolean;
  contactosRealizados: number;
  urgencia?: string;
}

export function calculateLeadScore(factors: LeadScoringFactors): number {
  let score = 0;

  // Datos de contacto (40 puntos)
  if (factors.hasEmail) score += 15;
  if (factors.hasTelefono) score += 15;
  if (factors.hasCiudad) score += 10;

  // Datos de empresa (30 puntos)
  if (factors.hasEmpresa) score += 15;
  if (factors.hasCargo) score += 15;

  // Engagement (20 puntos)
  score += Math.min(factors.contactosRealizados * 5, 20);

  // Urgencia (10 puntos)
  if (factors.urgencia === 'alta') score += 10;
  else if (factors.urgencia === 'media') score += 5;

  // Presupuesto (10 puntos adicionales si tiene)
  if (factors.hasPresupuesto) score += 10;

  return Math.min(score, 100);
}

/**
 * Determina la temperatura del lead basado en su puntuación
 */
export function determinarTemperatura(puntuacion: number): 'caliente' | 'tibio' | 'frio' {
  if (puntuacion >= 70) return 'caliente';
  if (puntuacion >= 40) return 'tibio';
  return 'frio';
}

// ============================================================================
// LEAD MANAGEMENT
// ============================================================================

export class CRMService {
  /**
   * Crear nuevo lead
   */
  static async createLead(input: CreateLeadInput) {
    // Validar si ya existe
    const existing = await prisma.lead.findFirst({
      where: {
        companyId: input.companyId,
        email: input.email,
      },
    });

    if (existing) {
      throw new Error(`Ya existe un lead con el email ${input.email}`);
    }

    // Calcular puntuación inicial
    const puntuacion = calculateLeadScore({
      hasEmail: !!input.email,
      hasTelefono: !!input.telefono,
      hasEmpresa: !!input.empresa,
      hasCargo: !!input.cargo,
      hasCiudad: !!input.ciudad,
      hasPresupuesto: !!input.presupuestoMensual,
      contactosRealizados: 0,
      urgencia: input.urgencia,
    });

    const temperatura = determinarTemperatura(puntuacion);

    const lead = await prisma.lead.create({
      data: {
        companyId: input.companyId,
        nombre: input.nombre,
        apellidos: input.apellidos,
        email: input.email,
        telefono: input.telefono,
        empresa: input.empresa,
        cargo: input.cargo,
        ciudad: input.ciudad,
        pais: input.pais || 'España',
        fuente: input.fuente,
        asignadoA: input.asignadoA,
        notas: input.notas,
        urgencia: input.urgencia || 'media',
        presupuestoMensual: input.presupuestoMensual,
        puntuacion,
        temperatura,
        estado: 'nuevo',
      },
      include: {
        asignadoUsuario: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return lead;
  }

  /**
   * Obtener lead por ID
   */
  static async getLead(leadId: string, companyId: string) {
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        companyId,
      },
      include: {
        asignadoUsuario: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        actividades: {
          orderBy: {
            fecha: 'desc',
          },
          take: 50,
          include: {
            usuario: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!lead) {
      throw new Error('Lead no encontrado');
    }

    return lead;
  }

  /**
   * Listar leads con filtros
   */
  static async listLeads(companyId: string, filters: LeadFilters = {}, page = 1, limit = 50) {
    const where: any = {
      companyId,
    };

    if (filters.estado?.length) {
      where.estado = { in: filters.estado };
    }

    if (filters.fuente?.length) {
      where.fuente = { in: filters.fuente };
    }

    if (filters.urgencia?.length) {
      where.urgencia = { in: filters.urgencia };
    }

    if (filters.asignadoA) {
      where.asignadoA = filters.asignadoA;
    }

    if (filters.minPuntuacion !== undefined || filters.maxPuntuacion !== undefined) {
      where.puntuacion = {};
      if (filters.minPuntuacion !== undefined) where.puntuacion.gte = filters.minPuntuacion;
      if (filters.maxPuntuacion !== undefined) where.puntuacion.lte = filters.maxPuntuacion;
    }

    if (filters.ciudad?.length) {
      where.ciudad = { in: filters.ciudad };
    }

    if (filters.temperatura?.length) {
      where.temperatura = { in: filters.temperatura };
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          asignadoUsuario: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ urgencia: 'desc' }, { puntuacion: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    return {
      leads,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Actualizar lead
   */
  static async updateLead(leadId: string, companyId: string, input: UpdateLeadInput) {
    const existing = await prisma.lead.findFirst({
      where: {
        id: leadId,
        companyId,
      },
    });

    if (!existing) {
      throw new Error('Lead no encontrado');
    }

    // Recalcular puntuación si cambió algo relevante
    const updated = { ...existing, ...input };
    const newPuntuacion = calculateLeadScore({
      hasEmail: !!updated.email,
      hasTelefono: !!updated.telefono,
      hasEmpresa: !!updated.empresa,
      hasCargo: !!updated.cargo,
      hasCiudad: !!updated.ciudad,
      hasPresupuesto: !!updated.presupuestoMensual,
      contactosRealizados: updated.numeroContactos,
      urgencia: updated.urgencia ?? undefined,
    });

    const newTemperatura = determinarTemperatura(newPuntuacion);

    const lead = await prisma.lead.update({
      where: {
        id: leadId,
      },
      data: {
        ...input,
        puntuacion: newPuntuacion,
        temperatura: newTemperatura,
        updatedAt: new Date(),
      },
      include: {
        asignadoUsuario: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return lead;
  }

  /**
   * Cambiar estado del lead
   */
  static async updateLeadStatus(leadId: string, companyId: string, estado: string) {
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        companyId,
      },
    });

    if (!lead) {
      throw new Error('Lead no encontrado');
    }

    const updates: any = { estado };

    // Auto-actualizar fechas
    if (['contactado', 'calificado', 'propuesta', 'negociacion'].includes(estado)) {
      updates.ultimoContacto = new Date();
    }

    return await prisma.lead.update({
      where: { id: leadId },
      data: updates,
    });
  }

  /**
   * Eliminar lead
   */
  static async deleteLead(leadId: string, companyId: string) {
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        companyId,
      },
    });

    if (!lead) {
      throw new Error('Lead no encontrado');
    }

    await prisma.lead.delete({
      where: { id: leadId },
    });

    return { success: true };
  }

  // ============================================================================
  // ACTIVITY TRACKING
  // ============================================================================

  /**
   * Registrar actividad
   */
  static async logActivity(
    companyId: string,
    leadId: string | null,
    _dealId: string | null,
    tipo: string,
    titulo: string,
    descripcion?: string,
    resultado?: string,
    duracion?: number,
    creadoPor?: string,
    _metadata?: any
  ) {
    if (!leadId || !creadoPor) {
      throw new Error('Se requiere leadId y creadoPor');
    }

    const activity = await prisma.leadActivity.create({
      data: {
        leadId,
        tipo,
        titulo,
        descripcion,
        resultado,
        duracion,
        creadoPor,
        fecha: new Date(),
      },
    });

    // Actualizar contador de contactos y última fecha
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        numeroContactos: { increment: 1 },
        ultimoContacto: new Date(),
      },
    });

    return activity;
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  /**
   * Obtener estadísticas del CRM
   */
  static async getStats(companyId: string, userId?: string) {
    try {
      const where: any = { companyId };
      if (userId) {
        where.asignadoA = userId;
      }

      const [
        totalLeads,
        nuevos,
        contactados,
        calificados,
        ganados,
        perdidos,
      ] = await Promise.all([
        prisma.lead.count({ where }).catch(() => 0),
        prisma.lead.count({ where: { ...where, estado: 'nuevo' } }).catch(() => 0),
        prisma.lead.count({ where: { ...where, estado: 'contactado' } }).catch(() => 0),
        prisma.lead.count({ where: { ...where, estado: 'calificado' } }).catch(() => 0),
        prisma.lead.count({ where: { ...where, estado: 'ganado' } }).catch(() => 0),
        prisma.lead.count({ where: { ...where, estado: 'perdido' } }).catch(() => 0),
      ]);

      const winRate = totalLeads > 0 ? (ganados / totalLeads) * 100 : 0;

      return {
        leads: {
          total: totalLeads,
          nuevos,
          contactados,
          calificados,
          ganados,
          perdidos,
          winRate: Math.round(winRate),
        },
        deals: {
          total: 0,
          open: 0,
          won: 0,
          totalValue: 0,
          wonValue: 0,
        },
        activities: {
          thisMonth: 0,
        },
        tasks: {
          overdue: 0,
        },
      };
    } catch (error: any) {
      console.error('Error getting CRM stats:', error);
      return {
        leads: { total: 0, nuevos: 0, contactados: 0, calificados: 0, ganados: 0, perdidos: 0, winRate: 0 },
        deals: { total: 0, open: 0, won: 0, totalValue: 0, wonValue: 0 },
        activities: { thisMonth: 0 },
        tasks: { overdue: 0 },
      };
    }
  }
}

export default CRMService;

// ============================================================================
// ALIASES Y FUNCIONES HELPER PARA COMPATIBILIDAD
// ============================================================================

export const calculateLeadScoring = calculateLeadScore;

/**
 * Calcula la probabilidad de cierre basado en la puntuación
 */
export function calculateProbabilidadCierre(puntuacion: number, estado?: string): number {
  let probability = puntuacion;

  if (estado) {
    switch (estado) {
      case 'nuevo':
        probability *= 0.3;
        break;
      case 'contactado':
        probability *= 0.5;
        break;
      case 'calificado':
        probability *= 0.7;
        break;
      case 'propuesta':
        probability *= 0.8;
        break;
      case 'negociacion':
        probability *= 0.9;
        break;
      case 'ganado':
        probability = 100;
        break;
      case 'perdido':
        probability = 0;
        break;
      default:
        probability *= 0.5;
    }
  }

  return Math.min(100, Math.max(0, probability));
}
