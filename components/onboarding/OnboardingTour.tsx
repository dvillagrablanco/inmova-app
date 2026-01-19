'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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

// Roles que NO deben ver el tour (administradores ya conocen la plataforma)
const EXCLUDED_ROLES = ['super_admin', 'administrador', 'admin', 'gestor'];

// Clave para sessionStorage (persiste solo durante la sesión del navegador)
const SESSION_TOUR_KEY = 'inmova-tour-shown';

export function OnboardingTour({ role }: OnboardingTourProps) {
  const { data: session, status: sessionStatus } = useSession();
  const { shouldShowOnboarding, markOnboardingAsSeen, isLoading } = useOnboarding();
  const [run, setRun] = useState(false);
  
  // Ref para evitar el bucle infinito - rastrea si el tour ya fue cerrado en esta sesión
  const tourClosedRef = useRef(false);
  // Ref para evitar múltiples llamadas al callback
  const isProcessingRef = useRef(false);
  // Ref para saber si ya se inicializó
  const initializedRef = useRef(false);

  // Determinar qué pasos mostrar según el rol
  const steps = role === 'TENANT' ? tenantSteps : ownerSteps;

  // Obtener el rol del usuario de la sesión
  const userRole = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;

  // Verificar sessionStorage al montar
  useEffect(() => {
    if (initializedRef.current) return;
    
    try {
      // Verificar si el tour ya fue mostrado en esta sesión del navegador
      const sessionKey = userId ? `${SESSION_TOUR_KEY}-${userId}` : SESSION_TOUR_KEY;
      const alreadyShown = sessionStorage.getItem(sessionKey);
      if (alreadyShown === 'true') {
        tourClosedRef.current = true;
      }
      initializedRef.current = true;
    } catch (e) {
      // sessionStorage no disponible
      initializedRef.current = true;
    }
  }, [userId]);

  useEffect(() => {
    // No hacer nada si el tour ya fue cerrado en esta sesión
    if (tourClosedRef.current) {
      return;
    }

    // Esperar a que la sesión esté lista
    if (sessionStatus === 'loading') {
      return;
    }

    // No mostrar para roles excluidos (administradores, etc.)
    if (userRole && EXCLUDED_ROLES.includes(userRole.toLowerCase())) {
      return;
    }

    // Solo mostrar si el onboarding debe mostrarse y no estamos cargando
    if (shouldShowOnboarding && !isLoading) {
      // Delay para asegurar que el DOM está listo
      const timer = setTimeout(() => {
        // Verificar de nuevo antes de iniciar (por si cambió durante el timeout)
        if (!tourClosedRef.current) {
          setRun(true);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [shouldShowOnboarding, isLoading, userRole, sessionStatus]);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    // Si el tour se completó o se saltó
    if (finishedStatuses.includes(status)) {
      // Evitar procesamiento múltiple
      if (isProcessingRef.current || tourClosedRef.current) {
        return;
      }
      
      isProcessingRef.current = true;
      tourClosedRef.current = true; // Marcar como cerrado ANTES de actualizar el estado
      
      // Guardar en sessionStorage para evitar que reaparezca en esta sesión
      try {
        const sessionKey = userId ? `${SESSION_TOUR_KEY}-${userId}` : SESSION_TOUR_KEY;
        sessionStorage.setItem(sessionKey, 'true');
      } catch (e) {
        // Ignorar errores de sessionStorage
      }
      
      setRun(false);
      markOnboardingAsSeen();
      
      // Reset del flag de procesamiento después de un breve delay
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 100);
    }
  }, [markOnboardingAsSeen, userId]);

  // No renderizar si:
  // - No hay sesión
  // - Sesión cargando
  // - Rol excluido
  // - Tour ya cerrado
  if (
    !session || 
    sessionStatus === 'loading' || 
    isLoading || 
    tourClosedRef.current ||
    (userRole && EXCLUDED_ROLES.includes(userRole.toLowerCase()))
  ) {
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
