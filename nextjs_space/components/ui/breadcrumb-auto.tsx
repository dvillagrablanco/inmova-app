'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Fragment } from 'react';

// Mapa de traducciones de rutas
const routeNames: Record<string, string> = {
  dashboard: 'Dashboard',
  edificios: 'Edificios',
  unidades: 'Unidades',
  inquilinos: 'Inquilinos',
  contratos: 'Contratos',
  pagos: 'Pagos',
  mantenimiento: 'Mantenimiento',
  documentos: 'Documentos',
  reportes: 'Reportes',
  configuracion: 'Configuración',
  perfil: 'Perfil',
  notificaciones: 'Notificaciones',
  calendario: 'Calendario',
  tareas: 'Tareas',
  proveedores: 'Proveedores',
  gastos: 'Gastos',
  facturacion: 'Facturación',
  analytics: 'Análisis',
  nuevo: 'Nuevo',
  editar: 'Editar',
};

interface BreadcrumbAutoProps {
  maxItems?: number;
  homeLabel?: string;
  className?: string;
}

export function BreadcrumbAuto({
  maxItems = 5,
  homeLabel = 'Inicio',
  className,
}: BreadcrumbAutoProps) {
  const pathname = usePathname();
  
  // Dividir el pathname en segmentos
  if (!pathname) return null;
  
  const segments = pathname.split('/').filter(Boolean);
  
  // Si estamos en la raíz, no mostrar breadcrumbs
  if (segments.length === 0) {
    return null;
  }

  // Construir los items del breadcrumb
  const items = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label = routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === segments.length - 1;

    return {
      href,
      label,
      isLast,
    };
  });

  // Limitar el número de items si es necesario
  const displayItems = items.length > maxItems
    ? [
        ...items.slice(0, 1),
        { href: '#', label: '...', isLast: false },
        ...items.slice(-2),
      ]
    : items;

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              <span className="sr-only">{homeLabel}</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {displayItems.map((item, index) => (
          <Fragment key={item.href}>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}