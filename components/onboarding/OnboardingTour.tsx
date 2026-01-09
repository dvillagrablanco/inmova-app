'use client';

import { useEffect, useState } from 'react';
import Joyride, { Step, CallBackProps, STATUS, EVENTS } from 'react-joyride';
import { useSession } from 'next-auth/react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { UserRole } from '@/types/prisma-types';

interface OnboardingTourProps {
  role?: UserRole;
}

// Pasos para propietario/gestor
const ownerSteps: Step[] = [
  {
    target: 'body',
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900">¡Bienvenido a Inmova! 🏠</h3>
        <p className="text-gray-600">
          Te guiaremos paso a paso para que saques el máximo provecho de la plataforma.
          Este tour toma menos de 2 minutos.
        </p>
        <p className="text-sm text-gray-500">
          Puedes saltarlo en cualquier momento, y siempre podrás volver a verlo desde tu perfil.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="create-property"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900">Crea tu primera propiedad</h4>
        <p className="text-gray-600">
          Haz clic aquí para añadir tu primera propiedad. Solo necesitas la dirección y algunos datos básicos.
        </p>
      </div>
    ),
    placement: 'bottom',
    spotlightClicks: true,
  },
  {
    target: '[data-tour="properties-list"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900">Gestiona tus propiedades</h4>
        <p className="text-gray-600">
          Aquí aparecerán todas tus propiedades. Puedes ver el estado, editar detalles, subir fotos y más.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="tenants-menu"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900">Inquilinos y contratos</h4>
        <p className="text-gray-600">
          Gestiona tus inquilinos, crea contratos legales y haz seguimiento de pagos desde aquí.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="dashboard-stats"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900">Dashboard en tiempo real</h4>
        <p className="text-gray-600">
          Visualiza tus métricas clave: ingresos, ocupación, pagos pendientes y alertas importantes.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="help-button"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900">¿Necesitas ayuda?</h4>
        <p className="text-gray-600">
          Accede a tutoriales, documentación y soporte desde aquí. ¡Estamos aquí para ayudarte!
        </p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: 'body',
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900">¡Listo para empezar! 🚀</h3>
        <p className="text-gray-600">
          Ya conoces lo básico. Ahora crea tu primera propiedad y explora todas las funcionalidades.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-900">
            <strong>Tip:</strong> Puedes volver a ver este tour en cualquier momento desde{' '}
            <strong>Configuración → Ver Tutorial</strong>
          </p>
        </div>
      </div>
    ),
    placement: 'center',
  },
];

// Pasos para inquilino
const tenantSteps: Step[] = [
  {
    target: 'body',
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900">¡Bienvenido a tu portal de inquilino! 🏡</h3>
        <p className="text-gray-600">
          Desde aquí puedes ver tu contrato, hacer pagos y comunicarte con tu propietario.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="contract-info"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900">Tu contrato</h4>
        <p className="text-gray-600">
          Revisa los detalles de tu contrato de alquiler en cualquier momento.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="payments"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900">Pagos</h4>
        <p className="text-gray-600">
          Registra tus pagos mensuales y mantén un historial completo.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="requests"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900">Incidencias</h4>
        <p className="text-gray-600">
          Crea solicitudes de mantenimiento o reporta problemas directamente al propietario.
        </p>
      </div>
    ),
    placement: 'right',
  },
];

export function OnboardingTour({ role }: OnboardingTourProps) {
  const { data: session } = useSession();
  const { shouldShowOnboarding, markOnboardingAsSeen, isLoading } = useOnboarding();
  const [run, setRun] = useState(false);

  // Determinar qué pasos mostrar según el rol
  const steps = role === 'TENANT' ? tenantSteps : ownerSteps;

  // Obtener el rol del usuario de la sesión
  const userRole = (session?.user as any)?.role;

  useEffect(() => {
    // Solo mostrar si el onboarding debe mostrarse y no estamos cargando
    // NO mostrar para superadministradores
    if (shouldShowOnboarding && !isLoading && userRole !== 'super_admin') {
      // Delay para asegurar que el DOM está listo
      const timer = setTimeout(() => {
        setRun(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [shouldShowOnboarding, isLoading, userRole]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    // Si el tour se completó o se saltó
    if (finishedStatuses.includes(status)) {
      setRun(false);
      markOnboardingAsSeen();
    }

    // Log para debugging (solo en dev)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Onboarding]', { type, status });
    }
  };

  // No renderizar si no hay sesión o es superadmin
  if (!session || isLoading || userRole === 'super_admin') {
    return null;
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableScrolling={false}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#2563eb', // blue-600
          textColor: '#1f2937', // gray-800
          backgroundColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          arrowColor: '#ffffff',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 12,
          padding: 20,
        },
        buttonNext: {
          backgroundColor: '#2563eb',
          borderRadius: 8,
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#6b7280',
          marginRight: 10,
        },
        buttonSkip: {
          color: '#6b7280',
        },
      }}
      locale={{
        back: 'Atrás',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        skip: 'Saltar',
      }}
    />
  );
}
