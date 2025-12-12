import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Configuración de pasos por vertical
const ONBOARDING_STEPS_BY_VERTICAL: Record<string, any[]> = {
  'alquiler_tradicional': [
    {
      id: 'create_building',
      title: 'Crear tu primer edificio',
      description: 'Registra la ubicación y características de tu propiedad',
      action: 'navigate:/edificios/nuevo',
      required: true,
      order: 1,
      videoUrl: 'https://www.youtube.com/embed/zm55Gdl5G1Q',
      estimatedTime: 3
    },
    {
      id: 'create_unit',
      title: 'Añadir unidades',
      description: 'Define apartamentos, pisos o locales dentro del edificio',
      action: 'navigate:/unidades/nuevo',
      required: true,
      order: 2,
      estimatedTime: 2
    },
    {
      id: 'create_tenant',
      title: 'Registrar inquilinos',
      description: 'Añade tus inquilinos actuales o prospectos',
      action: 'navigate:/inquilinos/nuevo',
      required: false,
      order: 3,
      estimatedTime: 2
    },
    {
      id: 'create_contract',
      title: 'Crear contratos',
      description: 'Genera contratos de alquiler automáticamente',
      action: 'navigate:/contratos/nuevo',
      required: false,
      order: 4,
      estimatedTime: 4
    },
    {
      id: 'explore_dashboard',
      title: 'Explorar el dashboard',
      description: 'Descubre todas las métricas y análisis disponibles',
      action: 'navigate:/dashboard',
      required: true,
      order: 5,
      estimatedTime: 2
    }
  ],
  'coliving': [
    {
      id: 'create_building',
      title: 'Crear edificio coliving',
      description: 'Registra tu espacio de co-living',
      action: 'navigate:/edificios/nuevo',
      required: true,
      order: 1,
      videoUrl: 'https://www.youtube.com/embed/zm55Gdl5G1Q',
      estimatedTime: 3
    },
    {
      id: 'setup_rooms',
      title: 'Configurar habitaciones',
      description: 'Define habitaciones individuales y espacios comunes',
      action: 'navigate:/room-rental',
      required: true,
      order: 2,
      estimatedTime: 4
    },
    {
      id: 'setup_amenities',
      title: 'Configurar amenidades',
      description: 'Añade servicios incluidos y reglas de convivencia',
      action: 'acknowledge',
      required: false,
      order: 3,
      estimatedTime: 3
    },
    {
      id: 'create_residents',
      title: 'Registrar residentes',
      description: 'Añade inquilinos de las habitaciones',
      action: 'navigate:/inquilinos/nuevo',
      required: false,
      order: 4,
      estimatedTime: 2
    },
    {
      id: 'explore_community',
      title: 'Plataforma social',
      description: 'Activa la red social interna para tus residentes',
      action: 'navigate:/comunidad-social',
      required: false,
      order: 5,
      estimatedTime: 2
    }
  ],
  'str_vacacional': [
    {
      id: 'create_listing',
      title: 'Crear anuncio STR',
      description: 'Publica tu propiedad de alquiler vacacional',
      action: 'navigate:/str/listings',
      required: true,
      order: 1,
      videoUrl: 'https://www.youtube.com/embed/zm55Gdl5G1Q',
      estimatedTime: 4
    },
    {
      id: 'connect_channels',
      title: 'Conectar canales',
      description: 'Sincroniza con Airbnb, Booking.com y más',
      action: 'navigate:/str/channels',
      required: true,
      order: 2,
      estimatedTime: 5
    },
    {
      id: 'setup_pricing',
      title: 'Configurar precios',
      description: 'Define tarifas dinámicas por temporada',
      action: 'acknowledge',
      required: false,
      order: 3,
      estimatedTime: 3
    },
    {
      id: 'calendar_sync',
      title: 'Sincronizar calendarios',
      description: 'Evita dobles reservas con sincronización automática',
      action: 'navigate:/calendario',
      required: false,
      order: 4,
      estimatedTime: 2
    },
    {
      id: 'automation_rules',
      title: 'Reglas de automatización',
      description: 'Mensajes automáticos y check-in/out',
      action: 'acknowledge',
      required: false,
      order: 5,
      estimatedTime: 3
    }
  ],
  'build_to_rent': [
    {
      id: 'create_project',
      title: 'Crear proyecto BTR',
      description: 'Registra tu proyecto Build-to-Rent',
      action: 'navigate:/edificios/nuevo',
      required: true,
      order: 1,
      estimatedTime: 3
    },
    {
      id: 'setup_units',
      title: 'Configurar unidades',
      description: 'Define tipologías y precios por fase',
      action: 'navigate:/unidades/nuevo',
      required: true,
      order: 2,
      estimatedTime: 4
    },
    {
      id: 'setup_amenities',
      title: 'Amenidades BTR',
      description: 'Gimnasio, coworking, zonas comunes',
      action: 'navigate:/espacios-comunes',
      required: false,
      order: 3,
      estimatedTime: 3
    },
    {
      id: 'candidate_flow',
      title: 'Flujo de candidatos',
      description: 'Sistema de screening y aprobación',
      action: 'navigate:/candidatos',
      required: false,
      order: 4,
      estimatedTime: 2
    },
    {
      id: 'analytics',
      title: 'Analytics BTR',
      description: 'Métricas de ocupación y retorno',
      action: 'navigate:/analytics',
      required: false,
      order: 5,
      estimatedTime: 2
    }
  ],
  'prop_tech': [
    {
      id: 'create_portfolio',
      title: 'Crear portafolio',
      description: 'Registra todas tus propiedades',
      action: 'navigate:/edificios',
      required: true,
      order: 1,
      estimatedTime: 4
    },
    {
      id: 'setup_automation',
      title: 'Automatizaciones',
      description: 'IoT, energía, mantenimiento predictivo',
      action: 'navigate:/iot',
      required: false,
      order: 2,
      estimatedTime: 5
    },
    {
      id: 'analytics_bi',
      title: 'Business Intelligence',
      description: 'Dashboards y reportes avanzados',
      action: 'navigate:/bi',
      required: false,
      order: 3,
      estimatedTime: 3
    },
    {
      id: 'esg_reporting',
      title: 'Reportes ESG',
      description: 'Sostenibilidad y certificaciones',
      action: 'navigate:/esg',
      required: false,
      order: 4,
      estimatedTime: 3
    },
    {
      id: 'integrations',
      title: 'Integraciones',
      description: 'Conecta con tu stack tecnológico',
      action: 'acknowledge',
      required: false,
      order: 5,
      estimatedTime: 4
    }
  ],
  'residencial': [
    {
      id: 'create_building',
      title: 'Registrar edificio residencial',
      description: 'Añade tu complejo residencial',
      action: 'navigate:/edificios/nuevo',
      required: true,
      order: 1,
      estimatedTime: 3
    },
    {
      id: 'create_units',
      title: 'Crear unidades',
      description: 'Apartamentos, casas o townhouses',
      action: 'navigate:/unidades/nuevo',
      required: true,
      order: 2,
      estimatedTime: 2
    },
    {
      id: 'community_mgmt',
      title: 'Gestión comunitaria',
      description: 'Juntas, votaciones, anuncios',
      action: 'navigate:/anuncios',
      required: false,
      order: 3,
      estimatedTime: 3
    },
    {
      id: 'maintenance',
      title: 'Mantenimiento',
      description: 'Solicitudes y mantenimiento preventivo',
      action: 'navigate:/mantenimiento',
      required: false,
      order: 4,
      estimatedTime: 2
    },
    {
      id: 'financial',
      title: 'Gestión financiera',
      description: 'Cuotas, gastos comunes, presupuestos',
      action: 'navigate:/contabilidad',
      required: false,
      order: 5,
      estimatedTime: 3
    }
  ],
  'default': [
    {
      id: 'welcome',
      title: 'Bienvenida',
      description: 'Conoce las funcionalidades principales de INMOVA',
      action: 'acknowledge',
      required: true,
      order: 1,
      estimatedTime: 1
    },
    {
      id: 'create_building',
      title: 'Crear edificio',
      description: 'Registra tu primera propiedad',
      action: 'navigate:/edificios/nuevo',
      required: true,
      order: 2,
      estimatedTime: 3
    },
    {
      id: 'create_unit',
      title: 'Añadir unidades',
      description: 'Define las unidades dentro del edificio',
      action: 'navigate:/unidades/nuevo',
      required: false,
      order: 3,
      estimatedTime: 2
    },
    {
      id: 'explore',
      title: 'Explorar módulos',
      description: 'Descubre todos los módulos disponibles',
      action: 'navigate:/admin/modulos',
      required: false,
      order: 4,
      estimatedTime: 3
    }
  ]
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userId = session?.user?.id
    const companyId = session?.user?.companyId;

    // Obtener o crear progreso de onboarding
    let onboarding = await prisma.onboardingProgress.findFirst({
      where: { 
        userId,
        companyId
      }
    });

    // Si no existe, crear uno nuevo detectando el vertical del usuario
    if (!onboarding) {
      const user = await prisma.user.findUnique({
        where: { email: session?.user?.email},
        select: { businessVertical: true, id: true }
      });

      const vertical = user?.businessVertical || 'default';
      const steps = ONBOARDING_STEPS_BY_VERTICAL[vertical] || ONBOARDING_STEPS_BY_VERTICAL['default'];

      onboarding = await prisma.onboardingProgress.create({
        data: {
          userId: user!.id,
          companyId,
          vertical,
          currentStep: 0,
          totalSteps: steps.length,
          completedSteps: [] // Array vacío inicialmente
        }
      });

      // Devolver con los steps del vertical
      return NextResponse.json({
        currentStep: 0,
        totalSteps: steps.length,
        completedSteps: 0,
        percentageComplete: 0,
        steps: steps.map(s => ({ ...s, completed: false })),
        vertical
      });
    }

    // Calcular progreso
    const vertical = onboarding.vertical;
    const steps = ONBOARDING_STEPS_BY_VERTICAL[vertical] || ONBOARDING_STEPS_BY_VERTICAL['default'];
    const completedStepIds = Array.isArray(onboarding.completedSteps) 
      ? onboarding.completedSteps as string[] 
      : [];
    const completedCount = completedStepIds.length;
    const percentageComplete = Math.round((completedCount / steps.length) * 100);

    // Marcar steps como completados
    const stepsWithCompletion = steps.map(s => ({
      ...s,
      completed: completedStepIds.includes(s.id)
    }));

    return NextResponse.json({
      currentStep: onboarding.currentStep,
      totalSteps: onboarding.totalSteps,
      completedSteps: completedCount,
      percentageComplete,
      steps: stepsWithCompletion,
      vertical: onboarding.vertical
    });
  } catch (error) {
    logger.error('Error fetching onboarding progress:', error);
    return NextResponse.json({ error: 'Error al cargar progreso' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userId = session?.user?.id
    const companyId = session?.user?.companyId;
    const body = await request.json();
    const { action, stepId } = body;

    const onboarding = await prisma.onboardingProgress.findFirst({
      where: { 
        userId,
        companyId
      }
    });

    if (!onboarding) {
      return NextResponse.json({ error: 'Onboarding no encontrado' }, { status: 404 });
    }

    const vertical = onboarding.vertical;
    const steps = ONBOARDING_STEPS_BY_VERTICAL[vertical] || ONBOARDING_STEPS_BY_VERTICAL['default'];
    let completedStepIds = Array.isArray(onboarding.completedSteps) 
      ? onboarding.completedSteps as string[] 
      : [];

    if (action === 'complete_step' && stepId) {
      // Marcar paso como completado si no lo está ya
      if (!completedStepIds.includes(stepId)) {
        completedStepIds.push(stepId);
      }

      const completedCount = completedStepIds.length;
      const allCompleted = completedCount === steps.length;
      const stepIndex = steps.findIndex(s => s.id === stepId);

      // Actualizar onboarding
      const updated = await prisma.onboardingProgress.update({
        where: { 
          id: onboarding.id
        },
        data: {
          completedSteps: completedStepIds,
          currentStep: allCompleted ? steps.length - 1 : Math.min(stepIndex + 1, steps.length - 1),
          completedAt: allCompleted ? new Date() : null,
          lastActivityAt: new Date()
        }
      });

      // Marcar steps como completados
      const stepsWithCompletion = steps.map(s => ({
        ...s,
        completed: completedStepIds.includes(s.id)
      }));

      return NextResponse.json({
        currentStep: updated.currentStep,
        totalSteps: updated.totalSteps,
        completedSteps: completedCount,
        percentageComplete: Math.round((completedCount / steps.length) * 100),
        steps: stepsWithCompletion,
        vertical: updated.vertical
      });
    } else if (action === 'skip') {
      // Marcar onboarding como completado (saltado)
      await prisma.onboardingProgress.update({
        where: { id: onboarding.id },
        data: {
          completedAt: new Date(),
          lastActivityAt: new Date()
        }
      });

      return NextResponse.json({ success: true });
    } else if (action === 'restart') {
      // Reiniciar onboarding
      const updated = await prisma.onboardingProgress.update({
        where: { id: onboarding.id },
        data: {
          completedSteps: [],
          currentStep: 0,
          completedAt: null,
          lastActivityAt: new Date()
        }
      });

      const stepsWithCompletion = steps.map(s => ({
        ...s,
        completed: false
      }));

      return NextResponse.json({
        currentStep: updated.currentStep,
        totalSteps: updated.totalSteps,
        completedSteps: 0,
        percentageComplete: 0,
        steps: stepsWithCompletion,
        vertical: updated.vertical
      });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    logger.error('Error updating onboarding progress:', error);
    return NextResponse.json({ error: 'Error al actualizar progreso' }, { status: 500 });
  }
}
