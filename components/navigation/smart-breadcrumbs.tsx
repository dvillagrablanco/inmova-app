'use client';

/**
 * SMART BREADCRUMBS
 * Breadcrumbs inteligentes con contexto, badges y navegación mejorada
 */

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Home,
  Building2,
  Users,
  FileText,
  DollarSign,
  Wrench,
  Calendar,
  Settings,
  BarChart2,
  MessageSquare,
  Package,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BreadcrumbSegment {
  label: string;
  href: string;
  icon?: React.ElementType;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

interface SmartBreadcrumbsProps {
  // Props opcionales para contexto adicional
  propertyName?: string;
  propertyStatus?: string;
  tenantName?: string;
  tenantStatus?: string;
  contractId?: string;
  contractStatus?: string;
  buildingName?: string;
  totalCount?: number;
  pendingCount?: number;
  showBackButton?: boolean;
  customSegments?: BreadcrumbSegment[];
}

export function SmartBreadcrumbs(props: SmartBreadcrumbsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [segments, setSegments] = useState<BreadcrumbSegment[]>([]);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);

  // Cargar historial de navegación desde localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('navigation-history');
      if (stored) {
        setNavigationHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading navigation history:', error);
    }
  }, []);

  // Guardar historial
  useEffect(() => {
    try {
      const updated = [pathname, ...navigationHistory.filter((p) => p !== pathname)].slice(0, 10);
      localStorage.setItem('navigation-history', JSON.stringify(updated));
      setNavigationHistory(updated);
    } catch (error) {
      console.error('Error saving navigation history:', error);
    }
  }, [pathname]);

  useEffect(() => {
    const generatedSegments = generateBreadcrumbs(pathname, props);
    setSegments(generatedSegments);
  }, [pathname, props]);

  if (segments.length === 0) return null;

  const previousPage = navigationHistory[1]; // [0] es la actual

  return (
    <div className="flex items-center gap-4">
      {/* Botón Volver con historial */}
      {(props.showBackButton || segments.length > 1) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Volver</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {previousPage ? `Volver a ${getPageTitle(previousPage)}` : 'Volver'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Historial Reciente
            </div>
            {navigationHistory.slice(1, 6).map((page, index) => (
              <DropdownMenuItem key={index} onClick={() => router.push(page)}>
                {getPageTitle(page)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          {segments.map((segment, index) => {
            const isLast = index === segments.length - 1;
            const Icon = segment.icon;

            return (
              <div key={segment.href} className="flex items-center gap-2">
                {index > 0 && <BreadcrumbSeparator />}
                
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="flex items-center gap-2">
                      {Icon && <Icon className="h-4 w-4" />}
                      <span className="font-semibold">{segment.label}</span>
                      {segment.badge && (
                        <Badge variant={segment.badgeVariant || 'default'} className="ml-1">
                          {segment.badge}
                        </Badge>
                      )}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={segment.href} className="flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4" />}
                        <span>{segment.label}</span>
                        {segment.badge && (
                          <Badge variant={segment.badgeVariant || 'secondary'} className="ml-1">
                            {segment.badge}
                          </Badge>
                        )}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

function generateBreadcrumbs(
  pathname: string,
  props: SmartBreadcrumbsProps
): BreadcrumbSegment[] {
  // Si hay segmentos custom, usarlos
  if (props.customSegments) {
    return [
      { label: 'Inicio', href: '/dashboard', icon: Home },
      ...props.customSegments,
    ];
  }

  const segments: BreadcrumbSegment[] = [
    { label: 'Inicio', href: '/dashboard', icon: Home },
  ];

  // Split pathname
  const parts = pathname.split('/').filter(Boolean);

  // Dashboard
  if (pathname === '/dashboard') {
    return segments;
  }

  // Propiedades
  if (parts[0] === 'propiedades') {
    segments.push({
      label: 'Propiedades',
      href: '/propiedades',
      icon: Building2,
      badge: props.totalCount ? `${props.totalCount}` : undefined,
    });

    if (parts.length > 1 && parts[1] === 'crear') {
      segments.push({
        label: 'Nueva Propiedad',
        href: '/propiedades/crear',
      });
    } else if (parts.length > 1 && parts[1] !== 'crear') {
      // Detalles de propiedad
      segments.push({
        label: props.propertyName || 'Detalles',
        href: `/propiedades/${parts[1]}`,
        badge: props.propertyStatus,
        badgeVariant: getStatusVariant(props.propertyStatus),
      });

      if (parts[2] === 'editar') {
        segments.push({
          label: 'Editar',
          href: `/propiedades/${parts[1]}/editar`,
        });
      }
    }
  }

  // Inquilinos
  if (parts[0] === 'inquilinos') {
    segments.push({
      label: 'Inquilinos',
      href: '/inquilinos',
      icon: Users,
      badge: props.totalCount ? `${props.totalCount}` : undefined,
    });

    if (parts.length > 1 && parts[1] === 'nuevo') {
      segments.push({
        label: 'Nuevo Inquilino',
        href: '/inquilinos/nuevo',
      });
    } else if (parts.length > 1 && parts[1] !== 'nuevo') {
      segments.push({
        label: props.tenantName || 'Detalles',
        href: `/inquilinos/${parts[1]}`,
        badge: props.tenantStatus,
        badgeVariant: getTenantStatusVariant(props.tenantStatus),
      });

      if (parts[2] === 'editar') {
        segments.push({
          label: 'Editar',
          href: `/inquilinos/${parts[1]}/editar`,
        });
      }
    }
  }

  // Contratos
  if (parts[0] === 'contratos') {
    segments.push({
      label: 'Contratos',
      href: '/contratos',
      icon: FileText,
      badge: props.totalCount ? `${props.totalCount}` : undefined,
    });

    if (parts.length > 1 && parts[1] === 'nuevo') {
      segments.push({
        label: 'Nuevo Contrato',
        href: '/contratos/nuevo',
      });
    } else if (parts.length > 1 && parts[1] !== 'nuevo') {
      segments.push({
        label: props.contractId ? `Contrato #${props.contractId}` : 'Detalles',
        href: `/contratos/${parts[1]}`,
        badge: props.contractStatus,
        badgeVariant: getContractStatusVariant(props.contractStatus),
      });
    }
  }

  // Pagos
  if (parts[0] === 'pagos') {
    segments.push({
      label: 'Pagos',
      href: '/pagos',
      icon: DollarSign,
      badge: props.pendingCount ? `${props.pendingCount} pendientes` : undefined,
      badgeVariant: props.pendingCount ? 'destructive' : undefined,
    });

    if (parts.length > 1 && parts[1] === 'nuevo') {
      segments.push({
        label: 'Registrar Pago',
        href: '/pagos/nuevo',
      });
    } else if (parts.length > 1) {
      segments.push({
        label: 'Detalles',
        href: `/pagos/${parts[1]}`,
      });
    }
  }

  // Mantenimiento
  if (parts[0] === 'mantenimiento') {
    segments.push({
      label: 'Mantenimiento',
      href: '/mantenimiento',
      icon: Wrench,
      badge: props.pendingCount ? `${props.pendingCount}` : undefined,
    });
  }

  // Calendario
  if (parts[0] === 'calendario') {
    segments.push({
      label: 'Calendario',
      href: '/calendario',
      icon: Calendar,
    });
  }

  // Mensajes
  if (parts[0] === 'mensajes' || parts[0] === 'chat') {
    segments.push({
      label: 'Mensajes',
      href: '/mensajes',
      icon: MessageSquare,
    });
  }

  // Analytics
  if (parts[0] === 'analytics') {
    segments.push({
      label: 'Analytics',
      href: '/analytics',
      icon: BarChart2,
    });
  }

  // Configuración
  if (parts[0] === 'configuracion') {
    segments.push({
      label: 'Configuración',
      href: '/configuracion',
      icon: Settings,
    });
  }

  // Edificios (si viene desde propiedad)
  if (parts[0] === 'edificios') {
    segments.push({
      label: 'Edificios',
      href: '/edificios',
      icon: Building2,
    });

    if (parts.length > 1) {
      segments.push({
        label: props.buildingName || 'Detalles',
        href: `/edificios/${parts[1]}`,
      });
    }
  }

  return segments;
}

function getStatusVariant(status?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'ocupada':
    case 'activo':
      return 'default';
    case 'disponible':
      return 'secondary';
    case 'en_mantenimiento':
    case 'moroso':
      return 'destructive';
    default:
      return 'outline';
  }
}

function getTenantStatusVariant(status?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'activo':
      return 'default';
    case 'inactivo':
      return 'secondary';
    case 'moroso':
      return 'destructive';
    default:
      return 'outline';
  }
}

function getContractStatusVariant(status?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'activo':
      return 'default';
    case 'borrador':
      return 'secondary';
    case 'vencido':
      return 'destructive';
    default:
      return 'outline';
  }
}

function getPageTitle(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  
  const titles: Record<string, string> = {
    dashboard: 'Dashboard',
    propiedades: 'Propiedades',
    inquilinos: 'Inquilinos',
    contratos: 'Contratos',
    pagos: 'Pagos',
    mantenimiento: 'Mantenimiento',
    calendario: 'Calendario',
    mensajes: 'Mensajes',
    analytics: 'Analytics',
    configuracion: 'Configuración',
  };

  return titles[parts[0]] || 'Página anterior';
}
