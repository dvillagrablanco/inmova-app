'use client';

import { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { BottomNavigation } from './bottom-navigation';
import { TourAutoStarter } from '@/components/tours/TourAutoStarter';
import { FloatingTourButton } from '@/components/tours/FloatingTourButton';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { SkipLink } from '@/components/accessibility/SkipLink';

/**
 * Layout autenticado con navegación optimizada para mobile-first
 * Incluye:
 * - Sidebar (desktop)
 * - Header (todas las pantallas)
 * - Bottom Navigation (solo móvil)
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

  const maxWidthClasses = {
    full: 'max-w-none',
    '7xl': 'max-w-7xl',
    '6xl': 'max-w-6xl',
    '5xl': 'max-w-5xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Skip Link para accesibilidad */}
      <SkipLink />

      {/* Sidebar - Solo en desktop */}
      <Sidebar />

      {/* Contenido principal con padding para compensar sidebar fija */}
      <div className={cn(
        "flex flex-1 flex-col overflow-hidden",
        "lg:pl-64" // Padding left en desktop para compensar sidebar de 256px (w-64)
      )}>
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

      {/* Tour Auto-Starter - Sistema de tours virtuales */}
      <TourAutoStarter />

      {/* Floating Tour Button - Acceso rápido a tours */}
      <FloatingTourButton />
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
