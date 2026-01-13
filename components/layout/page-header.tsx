'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';

/**
 * PageHeader - Componente de header estandarizado para páginas de la plataforma
 * 
 * Diseñado mobile-first para mantener consistencia visual entre:
 * - Páginas de verticales (STR, Alquiler, Construcción, etc.)
 * - Páginas globales (Configuración, Soporte, Perfil, etc.)
 */

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  /** Título principal de la página */
  title: string;
  /** Descripción breve debajo del título */
  description?: string;
  /** Icono de Lucide para mostrar junto al título */
  icon?: LucideIcon;
  /** Items del breadcrumb (sin incluir Home que se añade automáticamente) */
  breadcrumbs?: BreadcrumbItem[];
  /** Mostrar botón de volver */
  showBackButton?: boolean;
  /** Acciones adicionales (botones) a mostrar en el header */
  actions?: ReactNode;
  /** Usar gradiente en el título (estilo verticales) */
  gradient?: boolean;
  /** Clases adicionales para el contenedor */
  className?: string;
  /** Centrar el header (para páginas de soporte, etc.) */
  centered?: boolean;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  breadcrumbs = [],
  showBackButton = false,
  actions,
  gradient = false,
  className,
  centered = false,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className={cn('space-y-4 mb-6', className)}>
      {/* Breadcrumbs - Siempre visibles */}
      {breadcrumbs.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList className="flex-wrap">
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" className="flex items-center gap-1.5">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Inicio</span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbs.map((item, index) => (
              <span key={index} className="contents">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {item.href ? (
                    <BreadcrumbLink href={item.href} className="max-w-[150px] truncate">
                      {item.label}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className="max-w-[150px] truncate">{item.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {/* Header principal */}
      <div
        className={cn(
          'flex flex-col gap-4',
          centered ? 'items-center text-center' : 'sm:flex-row sm:items-start sm:justify-between'
        )}
      >
        <div className={cn('space-y-1', centered && 'max-w-2xl')}>
          {/* Título con icono */}
          <div className={cn('flex items-center gap-3', centered && 'justify-center')}>
            {Icon && (
              <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
            )}
            <h1
              className={cn(
                'text-2xl sm:text-3xl font-bold tracking-tight',
                gradient
                  ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent'
                  : 'text-foreground'
              )}
            >
              {title}
            </h1>
          </div>

          {/* Descripción */}
          {description && (
            <p className={cn('text-sm sm:text-base text-muted-foreground', centered && 'mt-2')}>
              {description}
            </p>
          )}
        </div>

        {/* Acciones y botón volver */}
        <div className={cn('flex flex-wrap items-center gap-2', centered && 'mt-4')}>
          {actions}
          {showBackButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Volver</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * PageContainer - Contenedor estándar para páginas
 * Proporciona márgenes y anchos consistentes
 */
interface PageContainerProps {
  children: ReactNode;
  /** Ancho máximo del contenedor */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '7xl' | 'full';
  className?: string;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-none',
};

export function PageContainer({ children, maxWidth = '7xl', className }: PageContainerProps) {
  return (
    <div className={cn('mx-auto w-full space-y-6', maxWidthClasses[maxWidth], className)}>
      {children}
    </div>
  );
}
