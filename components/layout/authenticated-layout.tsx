'use client';

import { ReactNode, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { BottomNavigation } from './bottom-navigation';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { SkipLink } from '@/components/accessibility/SkipLink';
import { CommandPalette } from '@/components/navigation/command-palette';
import { GlobalShortcuts } from '@/components/navigation/global-shortcuts';
import { ShortcutsHelpDialog } from '@/components/navigation/shortcuts-help-dialog';

// Dynamic imports for client-side only components to avoid hydration mismatch and build errors
const TourAutoStarter = dynamic(
  () => import('@/components/tours/TourAutoStarter').then((mod) => mod.TourAutoStarter),
  { ssr: false }
);
const FloatingTourButton = dynamic(
  () => import('@/components/tours/FloatingTourButton').then((mod) => mod.FloatingTourButton),
  { ssr: false }
);
const ContextualHelp = dynamic(
  () => import('@/components/help/ContextualHelp').then((mod) => mod.ContextualHelp),
  { ssr: false }
);
const OnboardingChecklist = dynamic(
  () => import('@/components/tutorials/OnboardingChecklist').then((mod) => mod.OnboardingChecklist),
  { ssr: false }
);
const FirstTimeSetupWizard = dynamic(
  () =>
    import('@/components/tutorials/FirstTimeSetupWizard').then((mod) => mod.FirstTimeSetupWizard),
  { ssr: false }
);
const NavigationTutorial = dynamic(
  () => import('@/components/navigation/navigation-tutorial').then((mod) => mod.NavigationTutorial),
  { ssr: false }
);

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
      const allowedPaths = ['/ewoorker', '/api/ewoorker'];

      const isAllowedPath = allowedPaths.some((path) => pathname?.startsWith(path));

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

      try {
        const response = await fetch('/api/user/onboarding-status');
        if (!response.ok) return;

        const data = await response.json();
        setIsNewUser(data.isNewUser);

        // Si es usuario nuevo Y nunca completó onboarding
        if (!data.hasCompletedOnboarding && data.isNewUser) {
          // Mostrar wizard si nunca lo saltó
          const hasSkippedWizard = localStorage.getItem('skipped-setup-wizard');
          if (!hasSkippedWizard) {
            setShowSetupWizard(true);
          }
        }

        // Checklist visible hasta completar todo
        setShowChecklist(!data.hasCompletedOnboarding);
      } catch (error) {
        console.error('Error checking onboarding:', error);
      }
    };

    checkOnboarding();
  }, [session]);

  // Handlers para wizard
  const handleCompleteSetup = () => {
    setShowSetupWizard(false);
    setShowChecklist(true);
  };

  const handleSkipSetup = () => {
    setShowSetupWizard(false);
    setShowChecklist(true);
    localStorage.setItem('skipped-setup-wizard', 'true');
  };

  const handleDismissChecklist = () => {
    setShowChecklist(false);
  };

  // Determinar página para ayuda contextual
  const getPageForHelp = () => {
    if (pathname?.includes('/edificios')) return 'edificios';
    if (pathname?.includes('/inquilinos')) return 'inquilinos';
    if (pathname?.includes('/contratos')) return 'contratos';
    if (pathname?.includes('/configuracion')) return 'configuracion';
    return 'dashboard';
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
            'flex-1 overflow-y-auto',
            isMobile ? 'pb-20' : '', // Espacio para bottom nav en móvil
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

      {/* Tour Auto-Starter - Sistema de tours virtuales (NO para superadmin) */}
      {session?.user?.role !== 'super_admin' && <TourAutoStarter />}

      {/* Floating Tour Button - Acceso rápido a tours (NO para superadmin) */}
      {session?.user?.role !== 'super_admin' && <FloatingTourButton />}

      {/* Contextual Help - Ayuda específica según página (NO para superadmin) */}
      {session?.user?.role !== 'super_admin' && <ContextualHelp page={getPageForHelp()} />}

      {/* Setup Wizard - Primera vez (NO para superadmin) */}
      {showSetupWizard && session?.user?.role !== 'super_admin' && (
        <FirstTimeSetupWizard onComplete={handleCompleteSetup} onSkip={handleSkipSetup} />
      )}

      {/* Onboarding Checklist - Hasta completar (NO para superadmin) */}
      {showChecklist && session?.user?.id && session?.user?.role !== 'super_admin' && (
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

      {/* Navigation Tutorial - Tutorial interactivo (NO para superadmin) */}
      {session?.user?.role !== 'super_admin' && <NavigationTutorial />}
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
