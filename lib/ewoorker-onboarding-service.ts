/**
 * Servicio de Onboarding Guiado para eWoorker
 *
 * Wizard paso a paso para:
 * 1. Completar perfil de empresa
 * 2. Subir documentos obligatorios
 * 3. Añadir especialidades
 * 4. Publicar primera obra o hacer primera oferta
 *
 * Objetivo: Usuario activo en < 5 minutos
 *
 * @module EwoorkerOnboardingService
 */

import { prisma } from './db';
import logger from './logger';

// ============================================================================
// TIPOS
// ============================================================================

export interface OnboardingStep {
  id: string;
  order: number;
  title: string;
  description: string;
  icon: string;
  required: boolean;
  estimatedMinutes: number;
  completed: boolean;
  skipped: boolean;
  completedAt?: Date;
  data?: Record<string, any>;
}

export interface OnboardingProgress {
  currentStep: number;
  totalSteps: number;
  percentage: number;
  steps: OnboardingStep[];
  canPublishObras: boolean;
  canMakeOfertas: boolean;
  profileCompleteness: number;
  nextAction: {
    step: string;
    url: string;
    cta: string;
  } | null;
}

export type EwoorkerUserType = 'CONTRATISTA' | 'SUBCONTRATISTA' | 'AMBOS';

// ============================================================================
// PASOS DE ONBOARDING
// ============================================================================

const ONBOARDING_STEPS: Omit<OnboardingStep, 'completed' | 'skipped' | 'completedAt' | 'data'>[] = [
  {
    id: 'WELCOME',
    order: 1,
    title: 'Bienvenida',
    description: 'Conoce cómo funciona eWoorker',
    icon: '👋',
    required: true,
    estimatedMinutes: 1,
  },
  {
    id: 'USER_TYPE',
    order: 2,
    title: 'Tipo de Usuario',
    description: '¿Publicas obras o buscas trabajo?',
    icon: '🎯',
    required: true,
    estimatedMinutes: 1,
  },
  {
    id: 'COMPANY_PROFILE',
    order: 3,
    title: 'Perfil de Empresa',
    description: 'Datos básicos de tu empresa',
    icon: '🏢',
    required: true,
    estimatedMinutes: 2,
  },
  {
    id: 'SPECIALTIES',
    order: 4,
    title: 'Especialidades',
    description: 'Selecciona tus áreas de trabajo',
    icon: '🔧',
    required: true,
    estimatedMinutes: 1,
  },
  {
    id: 'DOCUMENTS_REA',
    order: 5,
    title: 'Documento REA',
    description: 'Registro de Empresas Acreditadas',
    icon: '📋',
    required: true,
    estimatedMinutes: 2,
  },
  {
    id: 'DOCUMENTS_INSURANCE',
    order: 6,
    title: 'Seguro RC',
    description: 'Seguro de Responsabilidad Civil',
    icon: '🛡️',
    required: true,
    estimatedMinutes: 2,
  },
  {
    id: 'ZONES',
    order: 7,
    title: 'Zonas de Operación',
    description: 'Dónde trabajas habitualmente',
    icon: '📍',
    required: true,
    estimatedMinutes: 1,
  },
  {
    id: 'PLAN_SELECTION',
    order: 8,
    title: 'Plan de Suscripción',
    description: 'Elige tu plan (puedes empezar gratis)',
    icon: '💳',
    required: false,
    estimatedMinutes: 1,
  },
  {
    id: 'FIRST_ACTION',
    order: 9,
    title: 'Primera Acción',
    description: 'Publica tu primera obra o haz tu primera oferta',
    icon: '🚀',
    required: false,
    estimatedMinutes: 3,
  },
  {
    id: 'NOTIFICATIONS',
    order: 10,
    title: 'Notificaciones',
    description: 'Activa alertas de nuevas oportunidades',
    icon: '🔔',
    required: false,
    estimatedMinutes: 1,
  },
];

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

class EwoorkerOnboardingService {
  /**
   * Obtiene el progreso de onboarding de un usuario
   */
  async getProgress(userId: string): Promise<OnboardingProgress | null> {
    try {
      // Obtener perfil ewoorker del usuario
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          company: {
            include: {
              ewoorkerPerfil: {
                include: {
                  documentos: true,
                  obras: { take: 1 },
                  ofertas: { take: 1 },
                },
              },
            },
          },
        },
      });

      if (!user?.company) {
        return null;
      }

      const perfil = user.company.ewoorkerPerfil;

      // Calcular estado de cada paso
      const steps: OnboardingStep[] = ONBOARDING_STEPS.map((step) => ({
        ...step,
        completed: this.isStepCompleted(step.id, user, perfil),
        skipped: this.isStepSkipped(step.id, user, perfil),
        completedAt: this.getStepCompletedAt(step.id, perfil),
        data: this.getStepData(step.id, perfil),
      }));

      // Calcular progreso
      const completedSteps = steps.filter((s) => s.completed || s.skipped).length;
      const requiredSteps = steps.filter((s) => s.required);
      const requiredCompleted = requiredSteps.filter((s) => s.completed).length;

      // Determinar capacidades
      const canPublishObras = requiredCompleted >= 6; // Necesita REA + Seguro
      const canMakeOfertas = requiredCompleted >= 6;

      // Siguiente acción recomendada
      const nextStep =
        steps.find((s) => !s.completed && !s.skipped && s.required) ||
        steps.find((s) => !s.completed && !s.skipped);

      const nextAction = nextStep
        ? {
            step: nextStep.id,
            url: this.getStepUrl(nextStep.id),
            cta: this.getStepCTA(nextStep.id),
          }
        : null;

      // Calcular completitud del perfil
      const profileCompleteness = this.calculateProfileCompleteness(perfil);

      return {
        currentStep: completedSteps + 1,
        totalSteps: steps.length,
        percentage: Math.round((completedSteps / steps.length) * 100),
        steps,
        canPublishObras,
        canMakeOfertas,
        profileCompleteness,
        nextAction,
      };
    } catch (error: any) {
      logger.error('[EwoorkerOnboarding] Error obteniendo progreso:', error);
      return null;
    }
  }

  /**
   * Marca un paso como completado
   */
  async completeStep(
    userId: string,
    stepId: string,
    data?: Record<string, any>
  ): Promise<{ success: boolean; nextStep?: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          company: {
            include: { ewoorkerPerfil: true },
          },
        },
      });

      if (!user?.company?.ewoorkerPerfil) {
        return { success: false };
      }

      const perfil = user.company.ewoorkerPerfil;

      // Actualizar según el paso
      switch (stepId) {
        case 'WELCOME':
          await prisma.ewoorkerPerfilEmpresa.update({
            where: { id: perfil.id },
            data: {
              onboardingWelcomeCompletedAt: new Date(),
            },
          });
          break;

        case 'USER_TYPE':
          if (data?.userType) {
            await prisma.ewoorkerPerfilEmpresa.update({
              where: { id: perfil.id },
              data: {
                tipoUsuario: data.userType,
                onboardingUserTypeCompletedAt: new Date(),
              },
            });
          }
          break;

        case 'COMPANY_PROFILE':
          if (data) {
            await prisma.ewoorkerPerfilEmpresa.update({
              where: { id: perfil.id },
              data: {
                descripcion: data.descripcion,
                telefono: data.telefono,
                web: data.web,
                onboardingProfileCompletedAt: new Date(),
              },
            });
          }
          break;

        case 'SPECIALTIES':
          if (data?.especialidades) {
            await prisma.ewoorkerPerfilEmpresa.update({
              where: { id: perfil.id },
              data: {
                especialidadPrincipal: data.especialidades[0],
                especialidadesSecundarias: data.especialidades.slice(1),
                onboardingSpecialtiesCompletedAt: new Date(),
              },
            });
          }
          break;

        case 'ZONES':
          if (data?.zonas) {
            await prisma.ewoorkerPerfilEmpresa.update({
              where: { id: perfil.id },
              data: {
                zonasOperacion: data.zonas,
                onboardingZonesCompletedAt: new Date(),
              },
            });
          }
          break;

        case 'PLAN_SELECTION':
          await prisma.ewoorkerPerfilEmpresa.update({
            where: { id: perfil.id },
            data: {
              onboardingPlanCompletedAt: new Date(),
            },
          });
          break;

        case 'NOTIFICATIONS':
          await prisma.ewoorkerPerfilEmpresa.update({
            where: { id: perfil.id },
            data: {
              notificacionesActivas: true,
              onboardingNotificationsCompletedAt: new Date(),
            },
          });
          break;

        case 'FIRST_ACTION':
          await prisma.ewoorkerPerfilEmpresa.update({
            where: { id: perfil.id },
            data: {
              onboardingFirstActionCompletedAt: new Date(),
            },
          });
          break;
      }

      // Obtener siguiente paso
      const progress = await this.getProgress(userId);
      const nextStep = progress?.nextAction?.step;

      // Verificar si completó onboarding
      if (progress && progress.percentage >= 80) {
        await prisma.ewoorkerPerfilEmpresa.update({
          where: { id: perfil.id },
          data: {
            onboardingCompletedAt: new Date(),
          },
        });
      }

      return { success: true, nextStep };
    } catch (error: any) {
      logger.error('[EwoorkerOnboarding] Error completando paso:', error);
      return { success: false };
    }
  }

  /**
   * Salta un paso opcional
   */
  async skipStep(userId: string, stepId: string): Promise<boolean> {
    try {
      const step = ONBOARDING_STEPS.find((s) => s.id === stepId);
      if (!step || step.required) {
        return false; // No se pueden saltar pasos obligatorios
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { company: { include: { ewoorkerPerfil: true } } },
      });

      if (!user?.company?.ewoorkerPerfil) {
        return false;
      }

      // Marcar como saltado
      await prisma.ewoorkerPerfilEmpresa.update({
        where: { id: user.company.ewoorkerPerfil.id },
        data: {
          [`onboarding${stepId.charAt(0) + stepId.slice(1).toLowerCase()}SkippedAt`]: new Date(),
        },
      });

      return true;
    } catch (error: any) {
      logger.error('[EwoorkerOnboarding] Error saltando paso:', error);
      return false;
    }
  }

  /**
   * Reinicia el onboarding (para testing o reset)
   */
  async resetOnboarding(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { company: { include: { ewoorkerPerfil: true } } },
      });

      if (!user?.company?.ewoorkerPerfil) {
        return false;
      }

      await prisma.ewoorkerPerfilEmpresa.update({
        where: { id: user.company.ewoorkerPerfil.id },
        data: {
          onboardingWelcomeCompletedAt: null,
          onboardingUserTypeCompletedAt: null,
          onboardingProfileCompletedAt: null,
          onboardingSpecialtiesCompletedAt: null,
          onboardingZonesCompletedAt: null,
          onboardingPlanCompletedAt: null,
          onboardingNotificationsCompletedAt: null,
          onboardingFirstActionCompletedAt: null,
          onboardingCompletedAt: null,
        },
      });

      return true;
    } catch (error: any) {
      logger.error('[EwoorkerOnboarding] Error reseteando onboarding:', error);
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // HELPERS PRIVADOS
  // --------------------------------------------------------------------------

  private isStepCompleted(stepId: string, user: any, perfil: any): boolean {
    if (!perfil) return false;

    switch (stepId) {
      case 'WELCOME':
        return !!perfil.onboardingWelcomeCompletedAt;
      case 'USER_TYPE':
        return !!perfil.tipoUsuario || !!perfil.onboardingUserTypeCompletedAt;
      case 'COMPANY_PROFILE':
        return !!perfil.descripcion && !!perfil.telefono;
      case 'SPECIALTIES':
        return !!perfil.especialidadPrincipal;
      case 'DOCUMENTS_REA':
        return perfil.documentos?.some(
          (d: any) => d.tipoDocumento === 'REA' && d.estado === 'aprobado'
        );
      case 'DOCUMENTS_INSURANCE':
        return perfil.documentos?.some(
          (d: any) => d.tipoDocumento === 'SEGURO_RC' && d.estado === 'aprobado'
        );
      case 'ZONES':
        return perfil.zonasOperacion?.length > 0;
      case 'PLAN_SELECTION':
        return !!perfil.planActual || !!perfil.onboardingPlanCompletedAt;
      case 'FIRST_ACTION':
        return perfil.obras?.length > 0 || perfil.ofertas?.length > 0;
      case 'NOTIFICATIONS':
        return perfil.notificacionesActivas === true;
      default:
        return false;
    }
  }

  private isStepSkipped(stepId: string, user: any, perfil: any): boolean {
    // Solo los pasos opcionales pueden ser saltados
    const step = ONBOARDING_STEPS.find((s) => s.id === stepId);
    if (!step || step.required) return false;
    return false; // Por ahora no guardamos estado de "skipped"
  }

  private getStepCompletedAt(stepId: string, perfil: any): Date | undefined {
    if (!perfil) return undefined;

    const fieldMap: Record<string, string> = {
      WELCOME: 'onboardingWelcomeCompletedAt',
      USER_TYPE: 'onboardingUserTypeCompletedAt',
      COMPANY_PROFILE: 'onboardingProfileCompletedAt',
      SPECIALTIES: 'onboardingSpecialtiesCompletedAt',
      ZONES: 'onboardingZonesCompletedAt',
      PLAN_SELECTION: 'onboardingPlanCompletedAt',
      NOTIFICATIONS: 'onboardingNotificationsCompletedAt',
      FIRST_ACTION: 'onboardingFirstActionCompletedAt',
    };

    return perfil[fieldMap[stepId]];
  }

  private getStepData(stepId: string, perfil: any): Record<string, any> | undefined {
    if (!perfil) return undefined;

    switch (stepId) {
      case 'USER_TYPE':
        return { userType: perfil.tipoUsuario };
      case 'COMPANY_PROFILE':
        return {
          descripcion: perfil.descripcion,
          telefono: perfil.telefono,
          web: perfil.web,
        };
      case 'SPECIALTIES':
        return {
          principal: perfil.especialidadPrincipal,
          secundarias: perfil.especialidadesSecundarias,
        };
      case 'ZONES':
        return { zonas: perfil.zonasOperacion };
      default:
        return undefined;
    }
  }

  private getStepUrl(stepId: string): string {
    const urlMap: Record<string, string> = {
      WELCOME: '/ewoorker/onboarding/welcome',
      USER_TYPE: '/ewoorker/onboarding/user-type',
      COMPANY_PROFILE: '/ewoorker/perfil?onboarding=true',
      SPECIALTIES: '/ewoorker/onboarding/specialties',
      DOCUMENTS_REA: '/ewoorker/compliance?doc=REA',
      DOCUMENTS_INSURANCE: '/ewoorker/compliance?doc=SEGURO_RC',
      ZONES: '/ewoorker/onboarding/zones',
      PLAN_SELECTION: '/ewoorker/pagos/planes',
      FIRST_ACTION: '/ewoorker/obras/nueva',
      NOTIFICATIONS: '/ewoorker/configuracion/notificaciones',
    };
    return urlMap[stepId] || '/ewoorker/dashboard';
  }

  private getStepCTA(stepId: string): string {
    const ctaMap: Record<string, string> = {
      WELCOME: 'Comenzar',
      USER_TYPE: 'Seleccionar',
      COMPANY_PROFILE: 'Completar Perfil',
      SPECIALTIES: 'Elegir Especialidades',
      DOCUMENTS_REA: 'Subir REA',
      DOCUMENTS_INSURANCE: 'Subir Seguro',
      ZONES: 'Definir Zonas',
      PLAN_SELECTION: 'Ver Planes',
      FIRST_ACTION: 'Publicar Primera Obra',
      NOTIFICATIONS: 'Activar Alertas',
    };
    return ctaMap[stepId] || 'Continuar';
  }

  private calculateProfileCompleteness(perfil: any): number {
    if (!perfil) return 0;

    const fields = [
      { field: 'descripcion', weight: 10 },
      { field: 'telefono', weight: 10 },
      { field: 'web', weight: 5 },
      { field: 'especialidadPrincipal', weight: 15 },
      { field: 'cif', weight: 10 },
      { field: 'direccion', weight: 5 },
      { field: 'codigoPostal', weight: 5 },
      { field: 'zonasOperacion', weight: 10, isArray: true },
      { field: 'logoUrl', weight: 5 },
      { field: 'numeroREA', weight: 10 },
      { field: 'documentos', weight: 15, isArray: true },
    ];

    let score = 0;
    for (const { field, weight, isArray } of fields) {
      if (isArray) {
        if (perfil[field]?.length > 0) score += weight;
      } else {
        if (perfil[field]) score += weight;
      }
    }

    return Math.min(score, 100);
  }
}

// Exportar instancia singleton
export const ewoorkerOnboarding = new EwoorkerOnboardingService();

export default ewoorkerOnboarding;
