"use client";

import { useEffect, useState } from 'react';
import Joyride, { Step, CallBackProps, STATUS, EVENTS } from 'react-joyride';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

const TOUR_STORAGE_KEY = 'inmova_admin_tour_completed';

const adminTourSteps: Step[] = [
  {
    target: 'body',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900">¡Bienvenido a INMOVA! 🎉</h3>
        <p className="text-sm text-gray-700">
          Te guiaremos por las funcionalidades principales de la plataforma de administración.
          Este tour solo tomará 2 minutos.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="sidebar-admin"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900">Panel de Administración</h4>
        <p className="text-sm text-gray-700">
          Aquí encontrarás todas las opciones de administración de la plataforma. Las secciones
          admin están destacadas con badges para fácil identificación.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="user-panel"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900">Panel de Usuario</h4>
        <p className="text-sm text-gray-700">
          Tu rol y permisos se muestran claramente aquí. Puedes ver tu información y cerrar
          sesión desde este menú.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="command-palette"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900">Paleta de Comandos</h4>
        <p className="text-sm text-gray-700">
          Presiona <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+K</kbd> en
          cualquier momento para abrir la paleta de comandos y navegar rápidamente.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="navigation-history"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900">Historial de Navegación</h4>
        <p className="text-sm text-gray-700">
          Accede rápidamente a las páginas que has visitado recientemente. Tu historial se
          guarda automáticamente.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="theme-selector"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900">Temas Personalizados</h4>
        <p className="text-sm text-gray-700">
          Cambia la apariencia de la plataforma según tus preferencias. Disponemos de temas de
          alto contraste y modo nocturno.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: 'body',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900">¡Listo para empezar! ✅</h3>
        <p className="text-sm text-gray-700">
          Ya conoces las funcionalidades principales. Recuerda:
        </p>
        <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
          <li>
            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+K</kbd> - Paleta de
            comandos
          </li>
          <li>
            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+/</kbd> - Ver todos los
            atajos
          </li>
          <li>
            <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+H</kbd> - Ir al dashboard
          </li>
        </ul>
      </div>
    ),
    placement: 'center',
  },
];

const gestorTourSteps: Step[] = [
  {
    target: 'body',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900">¡Bienvenido a INMOVA! 🎉</h3>
        <p className="text-sm text-gray-700">
          Te guiaremos por las funcionalidades principales para gestores. Este tour solo tomará
          2 minutos.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="sidebar-main"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900">Menú Principal</h4>
        <p className="text-sm text-gray-700">
          Aquí encontrarás todas las funcionalidades para gestionar edificios, inquilinos,
          contratos y más.
        </p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="dashboard-kpis"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900">Indicadores Clave</h4>
        <p className="text-sm text-gray-700">
          Monitorea el rendimiento de tu negocio con KPIs en tiempo real. Puedes personalizar
          este dashboard.
        </p>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour="command-palette"]',
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900">Navegación Rápida</h4>
        <p className="text-sm text-gray-700">
          Usa <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl+K</kbd> para buscar y
          navegar rápidamente a cualquier sección.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
];

export function AdminTour() {
  const { data: session } = useSession() || {};
  const pathname = usePathname();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    if (!session?.user) return;

    const role = session.user.role;
    const tourCompleted = localStorage.getItem(`${TOUR_STORAGE_KEY}_${role}`);

    // Only show tour if not completed and user is on dashboard
    if (!tourCompleted && pathname === '/dashboard') {
      // Select appropriate steps based on role
      if (role === 'super_admin' || role === 'administrador') {
        setSteps(adminTourSteps);
      } else if (role === 'gestor' || role === 'operador') {
        setSteps(gestorTourSteps);
      }

      // Small delay to ensure DOM elements are ready
      setTimeout(() => setRun(true), 1000);
    }
  }, [session, pathname]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      // Mark tour as completed
      const role = session?.user?.role;
      if (role) {
        localStorage.setItem(`${TOUR_STORAGE_KEY}_${role}`, 'true');
      }
      setRun(false);
    }
  };

  if (!run || steps.length === 0) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#0ea5e9',
          textColor: '#1f2937',
          backgroundColor: '#ffffff',
          arrowColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 8,
          fontSize: 14,
        },
        tooltipContent: {
          padding: '16px 20px',
        },
        buttonNext: {
          backgroundColor: '#0ea5e9',
          borderRadius: 6,
          fontSize: 14,
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#6b7280',
          marginRight: 8,
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
        skip: 'Omitir tour',
      }}
    />
  );
}
