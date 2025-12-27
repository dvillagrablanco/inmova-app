/**
 * 📊 CRM Service - Gestión Completa de Leads y Deals
 *
 * Funcionalidades:
 * - CRUD de leads con validación
 * - Lead scoring automático
 * - Gestión de pipeline y deals
 * - Activity tracking
 * - Task management
 * - Email templates
 */

import { PrismaClient } from '@prisma/client';
import type {
  CRMLeadStatus,
  CRMLeadSource,
  CRMLeadPriority,
  DealStage,
  CompanySize,
} from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// TIPOS
// ============================================================================

export interface CreateLeadInput {
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  companyName: string;
  companyWebsite?: string;
  companySize?: CompanySize;
  industry?: string;
  companyLinkedIn?: string;
  city?: string;
  region?: string;
  country?: string;
  source: CRMLeadSource;
  ownerId?: string;
  notes?: string;
  tags?: string[];
  linkedInUrl?: string;
  linkedInProfile?: any;
  priority?: CRMLeadPriority;
}

export interface UpdateLeadInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  companyName?: string;
  companyWebsite?: string;
  companySize?: CompanySize;
  industry?: string;
  status?: CRMLeadStatus;
  priority?: CRMLeadPriority;
  ownerId?: string;
  notes?: string;
  tags?: string[];
  budget?: number;
  authority?: boolean;
  need?: string;
  timeline?: string;
  nextFollowUpDate?: Date;
}

export interface CreateDealInput {
  companyId: string;
  leadId?: string;
  title: string;
  description?: string;
  value: number;
  currency?: string;
  stage?: DealStage;
  probability?: number;
  expectedCloseDate?: Date;
  ownerId?: string;
  notes?: string;
}

export interface LeadFilters {
  status?: CRMLeadStatus[];
  source?: CRMLeadSource[];
  priority?: CRMLeadPriority[];
  ownerId?: string;
  tags?: string[];
  minScore?: number;
  maxScore?: number;
  hasOpenDeals?: boolean;
  city?: string[];
  industry?: string[];
  companySize?: CompanySize[];
}

// ============================================================================
// LEAD SCORING - Sistema Automático de Puntuación
// ============================================================================

export interface LeadScoringFactors {
  // Datos de la empresa (40 puntos)
  hasCompanyWebsite: boolean; // +5
  hasCompanyLinkedIn: boolean; // +5
  hasIndustry: boolean; // +5
  companySize?: CompanySize; // +10-25

  // Datos del contacto (30 puntos)
  hasPhone: boolean; // +5
  hasJobTitle: boolean; // +5
  isDecisionMaker: boolean; // +20

  // Engagement (20 puntos)
  emailsOpened: number; // +1 por email
  emailsClicked: number; // +2 por click
  callsMade: number; // +5 por llamada
  meetingsHeld: number; // +10 por reunión (max 20)

  // Calificación BANT (10 puntos)
  hasBudget: boolean; // +3
  hasAuthority: boolean; // +3
  hasNeed: boolean; // +2
  hasTimeline: boolean; // +2
}

export function calculateLeadScore(factors: LeadScoringFactors): number {
  let score = 0;

  // Datos de la empresa (40 puntos)
  if (factors.hasCompanyWebsite) score += 5;
  if (factors.hasCompanyLinkedIn) score += 5;
  if (factors.hasIndustry) score += 5;

  // Tamaño de empresa
  switch (factors.companySize) {
    case 'solopreneur':
      score += 5;
      break;
    case 'micro':
      score += 10;
      break;
    case 'small':
      score += 15;
      break;
    case 'medium':
      score += 20;
      break;
    case 'large':
    case 'enterprise':
      score += 25;
      break;
  }

  // Datos del contacto (30 puntos)
  if (factors.hasPhone) score += 5;
  if (factors.hasJobTitle) score += 5;
  if (factors.isDecisionMaker) score += 20;

  // Engagement (20 puntos)
  score += Math.min(factors.emailsOpened, 5); // Max 5
  score += Math.min(factors.emailsClicked * 2, 10); // Max 10
  score += Math.min(factors.callsMade * 5, 5); // Max 5 (1 llamada)
  score += Math.min(factors.meetingsHeld * 10, 20); // Max 20 (2 reuniones)

  // Calificación BANT (10 puntos)
  if (factors.hasBudget) score += 3;
  if (factors.hasAuthority) score += 3;
  if (factors.hasNeed) score += 2;
  if (factors.hasTimeline) score += 2;

  return Math.min(score, 100); // Cap at 100
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
    const existing = await prisma.cRMLead.findFirst({
      where: {
        companyId: input.companyId,
        email: input.email,
      },
    });

    if (existing) {
      throw new Error(`Ya existe un lead con el email ${input.email}`);
    }

    // Calcular score inicial
    const score = calculateLeadScore({
      hasCompanyWebsite: !!input.companyWebsite,
      hasCompanyLinkedIn: !!input.companyLinkedIn,
      hasIndustry: !!input.industry,
      companySize: input.companySize,
      hasPhone: !!input.phone,
      hasJobTitle: !!input.jobTitle,
      isDecisionMaker: false, // Se actualiza manualmente
      emailsOpened: 0,
      emailsClicked: 0,
      callsMade: 0,
      meetingsHeld: 0,
      hasBudget: false,
      hasAuthority: false,
      hasNeed: false,
      hasTimeline: false,
    });

    const lead = await prisma.cRMLead.create({
      data: {
        ...input,
        country: input.country || 'ES',
        score,
        status: 'new',
        priority: input.priority || 'medium',
      },
      include: {
        owner: {
          select: {
            id: true,
            nombre: true,
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
    const lead = await prisma.cRMLead.findFirst({
      where: {
        id: leadId,
        companyId,
      },
      include: {
        owner: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        activities: {
          orderBy: {
            activityDate: 'desc',
          },
          take: 50,
          include: {
            user: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
        deals: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        tasks: {
          where: {
            completed: false,
          },
          orderBy: {
            dueDate: 'asc',
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

    if (filters.status?.length) {
      where.status = { in: filters.status };
    }

    if (filters.source?.length) {
      where.source = { in: filters.source };
    }

    if (filters.priority?.length) {
      where.priority = { in: filters.priority };
    }

    if (filters.ownerId) {
      where.ownerId = filters.ownerId;
    }

    if (filters.tags?.length) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    if (filters.minScore !== undefined || filters.maxScore !== undefined) {
      where.score = {};
      if (filters.minScore !== undefined) where.score.gte = filters.minScore;
      if (filters.maxScore !== undefined) where.score.lte = filters.maxScore;
    }

    if (filters.city?.length) {
      where.city = { in: filters.city };
    }

    if (filters.industry?.length) {
      where.industry = { in: filters.industry };
    }

    if (filters.companySize?.length) {
      where.companySize = { in: filters.companySize };
    }

    const [leads, total] = await Promise.all([
      prisma.cRMLead.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              nombre: true,
            },
          },
          deals: {
            where: {
              stage: {
                notIn: ['closed_won', 'closed_lost'],
              },
            },
          },
        },
        orderBy: [{ priority: 'desc' }, { score: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.cRMLead.count({ where }),
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
    // Verificar que existe
    const existing = await prisma.cRMLead.findFirst({
      where: {
        id: leadId,
        companyId,
      },
    });

    if (!existing) {
      throw new Error('Lead no encontrado');
    }

    // Recalcular score si cambió algo relevante
    let newScore = existing.score;
    if (
      input.companyWebsite !== undefined ||
      input.companySize !== undefined ||
      input.phone !== undefined ||
      input.jobTitle !== undefined ||
      input.authority !== undefined ||
      input.budget !== undefined ||
      input.need !== undefined ||
      input.timeline !== undefined
    ) {
      const updated = { ...existing, ...input };
      newScore = calculateLeadScore({
        hasCompanyWebsite: !!updated.companyWebsite,
        hasCompanyLinkedIn: !!updated.companyLinkedIn,
        hasIndustry: !!updated.industry,
        companySize: updated.companySize,
        hasPhone: !!updated.phone,
        hasJobTitle: !!updated.jobTitle,
        isDecisionMaker: !!updated.authority,
        emailsOpened: updated.emailsOpened,
        emailsClicked: updated.emailsClicked,
        callsMade: updated.callsMade,
        meetingsHeld: updated.meetingsHeld,
        hasBudget: !!updated.budget,
        hasAuthority: !!updated.authority,
        hasNeed: !!updated.need,
        hasTimeline: !!updated.timeline,
      });
    }

    const lead = await prisma.cRMLead.update({
      where: {
        id: leadId,
      },
      data: {
        ...input,
        score: newScore,
        updatedAt: new Date(),
      },
      include: {
        owner: {
          select: {
            id: true,
            nombre: true,
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
  static async updateLeadStatus(leadId: string, companyId: string, status: CRMLeadStatus) {
    const lead = await prisma.cRMLead.findFirst({
      where: {
        id: leadId,
        companyId,
      },
    });

    if (!lead) {
      throw new Error('Lead no encontrado');
    }

    const updates: any = { status };

    // Auto-actualizar fechas
    if (status === 'contacted' && !lead.firstContactDate) {
      updates.firstContactDate = new Date();
    }

    if (['contacted', 'qualified', 'negotiation'].includes(status)) {
      updates.lastContactDate = new Date();
    }

    if (status === 'won') {
      updates.convertedAt = new Date();
    }

    return await prisma.cRMLead.update({
      where: { id: leadId },
      data: updates,
    });
  }

  /**
   * Eliminar lead
   */
  static async deleteLead(leadId: string, companyId: string) {
    const lead = await prisma.cRMLead.findFirst({
      where: {
        id: leadId,
        companyId,
      },
    });

    if (!lead) {
      throw new Error('Lead no encontrado');
    }

    await prisma.cRMLead.delete({
      where: { id: leadId },
    });

    return { success: true };
  }

  // ============================================================================
  // DEAL MANAGEMENT
  // ============================================================================

  /**
   * Crear nuevo deal
   */
  static async createDeal(input: CreateDealInput) {
    const deal = await prisma.deal.create({
      data: {
        ...input,
        currency: input.currency || 'EUR',
        stage: input.stage || 'prospecting',
        probability: input.probability || 10,
      },
      include: {
        lead: true,
        owner: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    // Si hay lead asociado, actualizar su estado
    if (input.leadId) {
      await prisma.cRMLead.update({
        where: { id: input.leadId },
        data: {
          status: 'qualified',
        },
      });
    }

    return deal;
  }

  /**
   * Actualizar stage del deal
   */
  static async updateDealStage(dealId: string, companyId: string, stage: DealStage) {
    const deal = await prisma.deal.findFirst({
      where: {
        id: dealId,
        companyId,
      },
    });

    if (!deal) {
      throw new Error('Deal no encontrado');
    }

    const updates: any = { stage };

    // Auto-ajustar probabilidad según stage
    const probabilityByStage: Record<DealStage, number> = {
      prospecting: 10,
      qualification: 25,
      proposal: 50,
      negotiation: 75,
      closed_won: 100,
      closed_lost: 0,
    };

    updates.probability = probabilityByStage[stage];

    // Si se cierra, guardar fecha
    if (stage === 'closed_won' || stage === 'closed_lost') {
      updates.closedDate = new Date();

      // Actualizar lead si existe
      if (deal.leadId) {
        await prisma.cRMLead.update({
          where: { id: deal.leadId },
          data: {
            status: stage === 'closed_won' ? 'won' : 'lost',
            convertedAt: stage === 'closed_won' ? new Date() : undefined,
          },
        });
      }
    }

    return await prisma.deal.update({
      where: { id: dealId },
      data: updates,
    });
  }

  /**
   * Listar deals
   */
  static async listDeals(companyId: string, stage?: DealStage, page = 1, limit = 50) {
    const where: any = { companyId };
    if (stage) {
      where.stage = stage;
    }

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        include: {
          lead: true,
          owner: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
        orderBy: [{ expectedCloseDate: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.deal.count({ where }),
    ]);

    return {
      deals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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
    dealId: string | null,
    type: string,
    subject: string,
    description?: string,
    outcome?: string,
    duration?: number,
    performedBy?: string,
    metadata?: any
  ) {
    const activity = await prisma.cRMActivity.create({
      data: {
        companyId,
        leadId,
        dealId,
        type,
        subject,
        description,
        outcome,
        duration,
        performedBy,
        metadata,
        activityDate: new Date(),
      },
    });

    // Actualizar engagement metrics si es un lead
    if (leadId) {
      const updates: any = {};

      switch (type) {
        case 'email':
          updates.emailsSent = { increment: 1 };
          if (outcome === 'opened') {
            updates.emailsOpened = { increment: 1 };
          }
          if (outcome === 'clicked') {
            updates.emailsClicked = { increment: 1 };
          }
          break;
        case 'call':
          updates.callsMade = { increment: 1 };
          break;
        case 'meeting':
          updates.meetingsHeld = { increment: 1 };
          break;
      }

      if (Object.keys(updates).length > 0) {
        updates.lastContactDate = new Date();

        const lead = await prisma.cRMLead.update({
          where: { id: leadId },
          data: updates,
        });

        // Recalcular score
        const newScore = calculateLeadScore({
          hasCompanyWebsite: !!lead.companyWebsite,
          hasCompanyLinkedIn: !!lead.companyLinkedIn,
          hasIndustry: !!lead.industry,
          companySize: lead.companySize,
          hasPhone: !!lead.phone,
          hasJobTitle: !!lead.jobTitle,
          isDecisionMaker: !!lead.authority,
          emailsOpened: lead.emailsOpened,
          emailsClicked: lead.emailsClicked,
          callsMade: lead.callsMade,
          meetingsHeld: lead.meetingsHeld,
          hasBudget: !!lead.budget,
          hasAuthority: !!lead.authority,
          hasNeed: !!lead.need,
          hasTimeline: !!lead.timeline,
        });

        await prisma.cRMLead.update({
          where: { id: leadId },
          data: { score: newScore },
        });
      }
    }

    return activity;
  }

  // ============================================================================
  // TASK MANAGEMENT
  // ============================================================================

  /**
   * Crear tarea
   */
  static async createTask(
    companyId: string,
    leadId: string | null,
    title: string,
    type: string,
    dueDate: Date,
    assignedTo?: string,
    description?: string,
    priority: CRMLeadPriority = 'medium'
  ) {
    return await prisma.cRMTask.create({
      data: {
        companyId,
        leadId,
        title,
        description,
        type,
        priority,
        dueDate,
        assignedTo,
      },
      include: {
        lead: true,
        user: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });
  }

  /**
   * Marcar tarea como completada
   */
  static async completeTask(taskId: string, companyId: string) {
    const task = await prisma.cRMTask.findFirst({
      where: {
        id: taskId,
        companyId,
      },
    });

    if (!task) {
      throw new Error('Tarea no encontrada');
    }

    return await prisma.cRMTask.update({
      where: { id: taskId },
      data: {
        completed: true,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Listar tareas pendientes
   */
  static async listTasks(companyId: string, assignedTo?: string, completed = false) {
    const where: any = {
      companyId,
      completed,
    };

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    return await prisma.cRMTask.findMany({
      where,
      include: {
        lead: true,
        user: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    });
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  /**
   * Obtener estadísticas del CRM
   */
  static async getStats(companyId: string, userId?: string) {
    const where: any = { companyId };
    if (userId) {
      where.ownerId = userId;
    }

    const [
      totalLeads,
      newLeads,
      qualifiedLeads,
      wonLeads,
      totalDeals,
      openDeals,
      wonDeals,
      totalDealValue,
      wonDealValue,
      activitiesThisMonth,
      tasksOverdue,
    ] = await Promise.all([
      prisma.cRMLead.count({ where }),
      prisma.cRMLead.count({ where: { ...where, status: 'new' } }),
      prisma.cRMLead.count({ where: { ...where, status: 'qualified' } }),
      prisma.cRMLead.count({ where: { ...where, status: 'won' } }),
      prisma.deal.count({ where }),
      prisma.deal.count({
        where: {
          ...where,
          stage: { notIn: ['closed_won', 'closed_lost'] },
        },
      }),
      prisma.deal.count({ where: { ...where, stage: 'closed_won' } }),
      prisma.deal.aggregate({
        where,
        _sum: { value: true },
      }),
      prisma.deal.aggregate({
        where: { ...where, stage: 'closed_won' },
        _sum: { value: true },
      }),
      prisma.cRMActivity.count({
        where: {
          companyId,
          activityDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.cRMTask.count({
        where: {
          companyId,
          completed: false,
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    const winRate = wonLeads + (totalLeads - wonLeads) > 0 ? (wonLeads / totalLeads) * 100 : 0;

    return {
      leads: {
        total: totalLeads,
        new: newLeads,
        qualified: qualifiedLeads,
        won: wonLeads,
        winRate: Math.round(winRate),
      },
      deals: {
        total: totalDeals,
        open: openDeals,
        won: wonDeals,
        totalValue: totalDealValue._sum.value || 0,
        wonValue: wonDealValue._sum.value || 0,
      },
      activities: {
        thisMonth: activitiesThisMonth,
      },
      tasks: {
        overdue: tasksOverdue,
      },
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calcula el scoring de un lead basado en varios factores
 */
export function calculateLeadScoring(lead: any): number {
  let score = 0;

  // Puntos por fuente (más confiable = más puntos)
  const sourceScores: Record<string, number> = {
    website: 20,
    referral: 30,
    linkedin: 25,
    cold_call: 10,
    email: 15,
    social_media: 15,
    event: 25,
    partner: 30,
    organic: 20,
    paid: 15,
    other: 10,
  };
  score += sourceScores[lead.source] || 10;

  // Puntos por tamaño de empresa
  const sizeScores: Record<string, number> = {
    enterprise: 40,
    medium: 30,
    small: 20,
    startup: 15,
    freelance: 10,
  };
  score += sizeScores[lead.companySize] || 15;

  // Puntos por información completa
  if (lead.phone) score += 5;
  if (lead.companyWebsite) score += 10;
  if (lead.linkedInUrl) score += 10;
  if (lead.city && lead.country) score += 5;
  if (lead.jobTitle) score += 5;

  // Puntos por engagement (actividades)
  if (lead.actividades && lead.actividades.length > 0) {
    score += Math.min(lead.actividades.length * 5, 25); // Max 25 puntos
  }

  return Math.min(score, 100); // Máximo 100 puntos
}

/**
 * Calcula la probabilidad de cierre de un lead
 */
export function calculateProbabilidadCierre(lead: any): number {
  const baseScore = calculateLeadScoring(lead);

  // Ajustar según el estado del lead
  const statusMultipliers: Record<string, number> = {
    new: 0.3,
    contacted: 0.4,
    qualified: 0.6,
    proposal: 0.75,
    negotiation: 0.85,
    won: 1.0,
    lost: 0,
    nurturing: 0.2,
  };

  const multiplier = statusMultipliers[lead.status] || 0.5;
  return Math.round(baseScore * multiplier);
}

/**
 * Determina la temperatura de un lead (hot, warm, cold)
 */
export function determinarTemperatura(score: number): 'hot' | 'warm' | 'cold' {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}

export default CRMService;
