"use client";

import React, { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  getVisibleModules,
  MODULES_BY_VERTICAL,
  UserProfile,
} from '@/lib/ui-mode-service';
import {
  Building2,
  FileText,
  Users,
  CreditCard,
  Wrench,
  BarChart3,
  FileStack,
  MessageSquare,
  Home,
  Calculator,
  Sparkles,
  Calendar,
  TrendingUp,
  Star,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const MODULE_ICONS: Record<string, any> = {
  edificios: Building2,
  contratos: FileText,
  inquilinos: Users,
  pagos: CreditCard,
  mantenimiento: Wrench,
  analytics: BarChart3,
  documentos: FileStack,
  comunicacion: MessageSquare,
  'room-rental': Home,
  proration: Calculator,
  limpieza: Sparkles,
  normas: FileText,
  str: TrendingUp,
  reservas: Calendar,
  pricing: TrendingUp,
  reviews: Star,
  flipping: Building2,
  presupuesto: Calculator,
  contratistas: Users,
  timeline: Calendar,
  'roi-calculator': Calculator,
};

interface AdaptiveSidebarProps {
  /**
   * Vertical de negocio del usuario
   */
  vertical: keyof typeof MODULES_BY_VERTICAL;
  
  /**
   * Perfil del usuario con preferencias
   */
  userProfile: UserProfile;
  
  /**
   * Si el sidebar está colapsado (versión mobile)
   */
  collapsed?: boolean;
  
  /**
   * Clase CSS adicional
   */
  className?: string;
}

/**
 * ADAPTIVE SIDEBAR - Sidebar contextual que muestra solo módulos relevantes
 * 
 * Características:
 * - Filtra módulos según vertical de negocio
 * - Adapta visibilidad según experienceLevel y uiMode
 * - Destaca módulos preferidos del usuario
 * - Tooltips explicativos para principiantes
 * - Badges de "Nuevo" o "Featured"
 */
export function AdaptiveSidebar({
  vertical,
  userProfile,
  collapsed = false,
  className,
}: AdaptiveSidebarProps) {
  const pathname = usePathname();
  
  // Obtener módulos visibles según el perfil
  const visibleModules = useMemo(
    () => getVisibleModules(vertical, userProfile),
    [vertical, userProfile]
  );

  // Separar módulos featured del resto
  const featuredModules = visibleModules.filter((m) => m.visible && m.featured);
  const regularModules = visibleModules.filter((m) => m.visible && !m.featured);

  const renderModuleLink = (module: any) => {
    const Icon = MODULE_ICONS[module.id] || Building2;
    const isActive = pathname.startsWith(`/${module.id}`);
    const url = `/${module.id}`;

    const linkContent = (
      <Link
        href={url}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 transition-all',
          'hover:bg-accent hover:text-accent-foreground',
          isActive && 'bg-accent text-accent-foreground font-medium',
          collapsed && 'justify-center'
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {!collapsed && (
          <span className="flex-1 truncate">{module.name}</span>
        )}
        {!collapsed && module.featured && (
          <Badge variant="secondary" className="ml-auto text-xs">
            ⭐
          </Badge>
        )}
      </Link>
    );

    // Si está colapsado o el usuario es principiante, mostrar tooltip
    if (collapsed || userProfile.experienceLevel === 'principiante') {
      return (
        <TooltipProvider key={module.id}>
          <Tooltip>
            <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-medium">{module.name}</p>
              {module.featured && (
                <p className="text-xs text-muted-foreground mt-1">
                  Módulo destacado para ti
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return <div key={module.id}>{linkContent}</div>;
  };

  return (
    <aside
      className={cn(
        'flex flex-col gap-4 border-r bg-background',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Header del Sidebar */}
      {!collapsed && (
        <div className="px-3 py-4">
          <h2 className="text-lg font-semibold tracking-tight">
            Tus Módulos
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {userProfile.uiMode === 'simple' && 'Vista simplificada'}
            {userProfile.uiMode === 'standard' && 'Vista estándar'}
            {userProfile.uiMode === 'advanced' && 'Vista avanzada'}
          </p>
        </div>
      )}

      {/* Módulos Destacados */}
      {featuredModules.length > 0 && (
        <div className="px-3">
          {!collapsed && (
            <p className="text-xs font-medium text-muted-foreground mb-2 px-3">
              DESTACADOS
            </p>
          )}
          <nav className="space-y-1">
            {featuredModules.map(renderModuleLink)}
          </nav>
        </div>
      )}

      {/* Separador */}
      {featuredModules.length > 0 && regularModules.length > 0 && (
        <Separator className="mx-3" />
      )}

      {/* Módulos Regulares */}
      {regularModules.length > 0 && (
        <div className="px-3">
          {!collapsed && featuredModules.length > 0 && (
            <p className="text-xs font-medium text-muted-foreground mb-2 px-3">
              TODOS LOS MÓDULOS
            </p>
          )}
          <nav className="space-y-1">
            {regularModules.map(renderModuleLink)}
          </nav>
        </div>
      )}

      {/* Mensaje si no hay módulos visibles */}
      {visibleModules.filter((m) => m.visible).length === 0 && !collapsed && (
        <div className="px-6 py-8 text-center text-sm text-muted-foreground">
          <p>No hay módulos disponibles</p>
          <p className="mt-2 text-xs">
            Contacta con soporte para activar módulos
          </p>
        </div>
      )}

      {/* Botón para ver todos los módulos (si está en modo Simple) */}
      {userProfile.uiMode === 'simple' && !collapsed && (
        <div className="mt-auto px-3 pb-4">
          <Link
            href="/configuracion?tab=modules"
            className="text-xs text-primary hover:underline flex items-center gap-2"
          >
            <span>Ver todos los módulos disponibles</span>
          </Link>
        </div>
      )}
    </aside>
  );
}
