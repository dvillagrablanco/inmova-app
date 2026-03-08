'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { BottomNavigation } from './bottom-navigation';
import { OnboardingChecklist } from '@/components/tutorials/OnboardingChecklist';
import { FirstTimeSetupWizard } from '@/components/tutorials/FirstTimeSetupWizard';
import { AIOnboardingChat } from '@/components/onboarding/AIOnboardingChat';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { SkipLink } from '@/components/accessibility/SkipLink';
import { CommandPalette } from '@/components/navigation/command-palette';
import { GlobalShortcuts } from '@/components/navigation/global-shortcuts';
import { ShortcutsHelpDialog } from '@/components/navigation/shortcuts-help-dialog';
import { NavigationTutorial } from '@/components/navigation/navigation-tutorial';
import dynamic from 'next/dynamic';

// Cargar el chatbot de soporte de forma lazy para mejor rendimiento
const IntelligentSupportChatbot = dynamic(
  () => import('@/components/automation/IntelligentSupportChatbot'),
  { ssr: false }
);

// Tour auto-starter - detecta la página actual y lanza tours correspondientes
const TourAutoStarter = dynamic(
  () => import('@/components/tours/TourAutoStarter').then(m => ({ default: m.TourAutoStarter })),
  { ssr: false }
);

// Chatbot de onboarding - widget flotante durante el onboarding
const OnboardingChatbotWidget = dynamic(
  () => import('@/components/onboarding/OnboardingChatbot'),
  { ssr: false }
);

// Demo Showcase Tour - tour de presentación para usuario demo Vidaro
const DemoShowcaseTour = dynamic(
  () => import('@/components/onboarding/DemoShowcaseTour').then(m => ({ default: m.DemoShowcaseTour })),
  { ssr: false }
);

// Email del usuario demo — se excluye de onboarding estándar
const DEMO_USER_EMAIL = 'demo@vidaroinversiones.com';

/**
 * Layout autenticado con navegación optimizada para mobile-first
 * Incluye:
 * - Sidebar (desktop)
 * - Header (todas las pantallas)
 * - Bottom Navigation (solo móvil)
 * - Command Palette (Cmd+K navegación rápida)
 * - Global Shortcuts (G+P, G+T, N, F, etc.)
 * - Shortcuts Help (? para ayuda)
 */

interface AuthenticatedLayoutProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  maxWidth?: 'full' | '7xl' | '6xl' | '5xl' | '4xl';
}

export function AuthenticatedLayout({
  children,
  className,
  containerClassName,
  maxWidth = 'full',
}: AuthenticatedLayoutProps) {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Estados para tutoriales y onboarding
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  // Redirección para socios de eWoorker: solo pueden acceder a rutas de eWoorker
  useEffect(() => {
    if (status === 'loading') return;
    
    if (session?.user?.role === 'socio_ewoorker') {
      // Rutas permitidas para socios de eWoorker
      const allowedPaths = [
        '/ewoorker',
        '/api/ewoorker',
      ];
      
      const isAllowedPath = allowedPaths.some(path => pathname?.startsWith(path));
      
      if (!isAllowedPath && pathname) {
        // Redirigir al panel del socio
        router.replace('/ewoorker/admin-socio');
      }
    }
  }, [session, pathname, router, status]);

  const maxWidthClasses = {
    full: 'max-w-none',
    '7xl': 'max-w-7xl',
    '6xl': 'max-w-6xl',
    '5xl': 'max-w-5xl',
    '4xl': 'max-w-4xl',
  };

  // Ocultar Crisp Chat en páginas autenticadas (usamos IntelligentSupportChatbot propio)
  useEffect(() => {
    const hideCrisp = () => {
      try {
        const w = window as any;
        if (w.$crisp) {
          w.$crisp.push(['do', 'chat:hide']);
        }
        // También ocultar via CSS por si el JS de Crisp carga después
        const crispEl = document.getElementById('crisp-chatbox');
        if (crispEl) {
          crispEl.style.display = 'none';
        }
      } catch {
        // Ignorar si Crisp no está cargado
      }
    };

    // Ejecutar inmediatamente y también con delay (Crisp puede cargar async)
    hideCrisp();
    const timer = setTimeout(hideCrisp, 2000);
    const timer2 = setTimeout(hideCrisp, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, []);

  // Verificar estado de onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!session?.user?.id) return;

      // OCULTAR TOURS Y ONBOARDING PARA SUPERADMIN
      if (session.user.role === 'super_admin') {
        setShowSetupWizard(false);
        setShowChecklist(false);
        setIsNewUser(false);
        return;
      }

      // Verificar localStorage primero (más rápido, evita flash)
      const hasSkippedWizard = localStorage.getItem('skipped-setup-wizard');
      const hasDismissedChecklist = localStorage.getItem('dismissed-onboarding-checklist');
      const hasCompletedSetup = localStorage.getItem('completed-setup-wizard');

      // Si ya se completó o descartó localmente, no mostrar
      if (hasCompletedSetup || hasSkippedWizard) {
        setShowSetupWizard(false);
      }
      if (hasDismissedChecklist || hasCompletedSetup) {
        setShowChecklist(false);
      }

      try {
        const response = await fetch('/api/user/onboarding-status');
        if (!response.ok) return;

        const data = await response.json();
        setIsNewUser(data.isNewUser);

        // Si ya completó en BD, no mostrar nada
        if (data.hasCompletedOnboarding) {
          setShowSetupWizard(false);
          setShowChecklist(false);
          return;
        }

        // Si es usuario nuevo Y nunca completó onboarding Y no descartó
        if (!data.hasCompletedOnboarding && data.isNewUser) {
          if (!hasSkippedWizard && !hasCompletedSetup) {
            setShowSetupWizard(true);
          }
        }

        // Checklist visible solo si no se ha descartado ni completado
        if (!hasDismissedChecklist && !hasCompletedSetup) {
          setShowChecklist(!data.hasCompletedOnboarding);
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
      }
    };

    checkOnboarding();
  }, [session]);

  // Handlers para wizard — persistir en localStorage Y en BD
  const markOnboardingComplete = async () => {
    try {
      await fetch('/api/user/onboarding-status', { method: 'POST' });
    } catch (error) {
      console.error('Error marking onboarding complete:', error);
    }
  };

  const handleCompleteSetup = () => {
    setShowSetupWizard(false);
    setShowChecklist(false);
    localStorage.setItem('completed-setup-wizard', 'true');
    markOnboardingComplete();
  };

  const handleSkipSetup = () => {
    setShowSetupWizard(false);
    setShowChecklist(false);
    localStorage.setItem('skipped-setup-wizard', 'true');
    markOnboardingComplete();
  };

  const handleDismissChecklist = () => {
    setShowChecklist(false);
    localStorage.setItem('dismissed-onboarding-checklist', 'true');
    markOnboardingComplete();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Skip Link para accesibilidad */}
      <SkipLink />

      {/* Sidebar - Solo en desktop */}
      <Sidebar />

      {/* Contenido principal con padding para compensar sidebar fija */}
      <div
        className={cn(
          'flex flex-1 flex-col overflow-hidden',
          'lg:pl-64' // Padding left en desktop para compensar sidebar de 256px (w-64)
        )}
      >
        {/* Header */}
        <Header />

        {/* Área de contenido con scroll */}
        <main
          id="main-content"
          className={cn(
            'flex-1 overflow-y-auto overflow-x-hidden',
            isMobile ? 'pb-24' : '', // Espacio para bottom nav + safe area en móvil
            className
          )}
        >
          <div
            className={cn(
              'mx-auto h-full w-full px-4 py-6 md:px-6 md:py-8',
              maxWidthClasses[maxWidth],
              containerClassName
            )}
          >
            {children}
          </div>
        </main>

        {/* Bottom Navigation - Solo en móvil */}
        <BottomNavigation />
      </div>

      {/* AI Onboarding Chat - Primera vez (NO para superadmin ni demo user) */}
      {showSetupWizard && session?.user?.role !== 'super_admin' && session?.user?.email !== DEMO_USER_EMAIL && (
        <AIOnboardingChat onComplete={handleCompleteSetup} onSkip={handleSkipSetup} />
      )}

      {/* Onboarding Checklist - Hasta completar (NO para superadmin ni demo user) */}
      {showChecklist && session?.user?.id && session?.user?.role !== 'super_admin' && session?.user?.email !== DEMO_USER_EMAIL && (
        <OnboardingChecklist
          userId={session.user.id}
          isNewUser={isNewUser}
          onDismiss={handleDismissChecklist}
        />
      )}

      {/* Command Palette - Navegación rápida con Cmd+K */}
      <CommandPalette />

      {/* Global Shortcuts - Atajos de teclado globales */}
      <GlobalShortcuts />

      {/* Shortcuts Help Dialog - Ayuda de atajos con ? */}
      <ShortcutsHelpDialog />

      {/* Navigation Tutorial - Tutorial interactivo (NO para superadmin ni demo) */}
      {session?.user?.role !== 'super_admin' && session?.user?.email !== DEMO_USER_EMAIL && <NavigationTutorial />}

      {/* Tour Auto-Starter - Detecta la página y lanza tours contextuales (NO para demo) */}
      {session?.user?.role !== 'super_admin' && session?.user?.email !== DEMO_USER_EMAIL && <TourAutoStarter />}

      {/* Demo Showcase Tour - Tour de presentación para demo@vidaroinversiones.com */}
      <DemoShowcaseTour />

      {/* Chatbot de Onboarding - Widget flotante durante onboarding activo (NO para demo) */}
      {showChecklist && !showSetupWizard && session?.user?.role !== 'super_admin' && session?.user?.email !== DEMO_USER_EMAIL && (
        <OnboardingChatbotWidget />
      )}

      {/* Chatbot de Soporte Inteligente - Disponible en todas las páginas */}
      <IntelligentSupportChatbot />
    </div>
  );
}

/**
 * Ejemplo de uso en una página:
 *
 * export default function EdificiosPage() {
 *   return (
 *     <AuthenticatedLayout maxWidth="7xl">
 *       <h1>Mis Edificios</h1>
 *       {/* ... contenido ... *\/}
 *     </AuthenticatedLayout>
 *   );
 * }
 */
