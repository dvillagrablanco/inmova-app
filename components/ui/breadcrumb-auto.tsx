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
  // General
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

  // Admin / Super Admin
  admin: 'Administración',
  clientes: 'Clientes',
  comparar: 'Comparar',
  planes: 'Planes',
  addons: 'Add-ons',
  'facturacion-b2b': 'Facturación B2B',
  cupones: 'Cupones',
  partners: 'Partners',
  marketplace: 'Marketplace',
  integraciones: 'Integraciones',
  contasimple: 'Contasimple',
  'integraciones-contables': 'Integraciones Contables',
  activity: 'Actividad',
  alertas: 'Alertas',
  'salud-sistema': 'Salud del Sistema',
  'metricas-uso': 'Métricas de Uso',
  'system-logs': 'Logs del Sistema',
  seguridad: 'Seguridad',
  usuarios: 'Usuarios',
  'backup-restore': 'Backup y Restauración',
  modulos: 'Módulos',
  personalizacion: 'Personalización',
  'portales-externos': 'Portales Externos',
  'plantillas-email': 'Plantillas Email',
  'plantillas-sms': 'Plantillas SMS',
  'notificaciones-masivas': 'Notificaciones Masivas',
  'reportes-programados': 'Reportes Programados',
  importar: 'Importar Datos',
  'ocr-import': 'OCR Import',
  'firma-digital': 'Firma Digital',
  legal: 'Plantillas Legales',
  limpieza: 'Limpieza de Datos',
  sugerencias: 'Sugerencias',
  aprobaciones: 'Aprobaciones',
  onboarding: 'Onboarding',
  'recuperar-contrasena': 'Recuperar Contraseña',
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
  const displayItems =
    items.length > maxItems
      ? [...items.slice(0, 1), { href: '#', label: '...', isLast: false }, ...items.slice(-2)]
      : items;

  // Determinar el home link según la ruta actual
  const isAdminRoute = segments[0] === 'admin';
  const homeHref = isAdminRoute ? '/admin/dashboard' : '/dashboard';
  const homeDisplay = isAdminRoute ? 'Admin' : homeLabel;

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={homeHref} prefetch={!isAdminRoute} className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">{homeDisplay}</span>
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
