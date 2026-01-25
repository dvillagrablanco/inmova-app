'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { BottomNavigation } from './bottom-navigation';
import { TourAutoStarter } from '@/components/tours/TourAutoStarter';
import { FloatingTourButton } from '@/components/tours/FloatingTourButton';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { SkipLink } from '@/components/accessibility/SkipLink';
import { CommandPalette } from '@/components/navigation/command-palette';
import { GlobalShortcuts } from '@/components/navigation/global-shortcuts';
import { ShortcutsHelpDialog } from '@/components/navigation/shortcuts-help-dialog';
import dynamic from 'next/dynamic';
import { useOnboardingManager } from '@/lib/hooks/useOnboardingManager';

// Cargar componentes de onboarding de forma lazy para mejor rendimiento
// y para evitar que se carguen todos a la vez
const IntelligentSupportChatbot = dynamic(
  () => import('@/components/automation/IntelligentSupportChatbot'),
  { ssr: false }
);

// NOTA: Estos componentes han sido removidos o simplificados para evitar solapamientos
// El sistema ahora usa useOnboardingManager para coordinar qué elemento mostrar
// - ContextualHelp: Removido temporalmente (causa solapamiento)
// - OnboardingChecklist: Se gestiona desde el dashboard
// - FirstTimeSetupWizard: Se gestiona desde el dashboard  
// - NavigationTutorial: Removido temporalmente (causa solapamiento)

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
  // Estado para controlar el montaje y evitar errores de hidratación
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Hook centralizado para gestionar onboarding - evita solapamientos
  const { isOnboardingDisabled, disableOnboarding } = useOnboardingManager();
  
  // Marcar como montado después de la hidratación inicial
  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // Deshabilitar onboarding para super_admin
  useEffect(() => {
    if (session?.user?.role === 'super_admin') {
      disableOnboarding();
    }
  }, [session, disableOnboarding]);

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
            isMounted && isMobile ? 'pb-20' : '', // Espacio para bottom nav en móvil (solo después de montaje)
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

        {/* Bottom Navigation - Solo en móvil y después de montaje */}
        {isMounted && <BottomNavigation />}
      </div>

      {/* 
        SISTEMA DE ONBOARDING CENTRALIZADO
        Solo se muestra UN elemento a la vez, controlado por useOnboardingManager
        Solo renderizar después del montaje para evitar errores de hidratación
      */}
      
      {isMounted && (
        <>
          {/* Tour Auto-Starter - Solo si onboarding no está deshabilitado */}
          {!isOnboardingDisabled && <TourAutoStarter />}

          {/* Floating Tour Button - Controlado por el manager */}
          {!isOnboardingDisabled && <FloatingTourButton />}

          {/* Command Palette - Navegación rápida con Cmd+K */}
          <CommandPalette />

          {/* Global Shortcuts - Atajos de teclado globales */}
          <GlobalShortcuts />

          {/* Shortcuts Help Dialog - Ayuda de atajos con ? */}
          <ShortcutsHelpDialog />

          {/* Chatbot de Soporte Inteligente - Solo si onboarding no está deshabilitado */}
          {!isOnboardingDisabled && <IntelligentSupportChatbot />}
        </>
      )}
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
