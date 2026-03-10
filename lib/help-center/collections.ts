import type { HelpCollection } from './types';

export const collections: HelpCollection[] = [
  {
    id: 'col-como-empezar',
    slug: 'como-empezar',
    title: 'Cómo empezar',
    description:
      'Primeros pasos con Inmova según tu modelo de gestión: alquiler propio, gestión integral, habitaciones, coliving o inversión.',
    icon: 'Rocket',
    color: 'bg-blue-500',
    order: 1,
  },
  {
    id: 'col-gestionar-cuenta',
    slug: 'gestionar-cuenta',
    title: 'Gestionar tu cuenta',
    description:
      'Configura y administra inmuebles, contratos, pagos, facturación, contabilidad y equipos.',
    icon: 'Settings',
    color: 'bg-indigo-500',
    order: 2,
    subcollections: [
      {
        id: 'sub-equipos',
        slug: 'equipos-y-usuarios',
        title: 'Equipos y usuarios',
        description: 'Gestión de equipos, roles y permisos',
        icon: 'Users',
        order: 1,
      },
      {
        id: 'sub-inmuebles',
        slug: 'inmuebles',
        title: 'Inmuebles',
        description: 'Añadir, configurar y gestionar propiedades',
        icon: 'Building2',
        order: 2,
      },
      {
        id: 'sub-contratos',
        slug: 'contratos',
        title: 'Contratos',
        description: 'Creación, plantillas y firma digital de contratos',
        icon: 'FileText',
        order: 3,
      },
      {
        id: 'sub-pagos',
        slug: 'pagos-y-cobros',
        title: 'Pagos y cobros',
        description: 'Pasarela de pagos, recibos e impagos',
        icon: 'CreditCard',
        order: 4,
      },
      {
        id: 'sub-liquidaciones',
        slug: 'liquidaciones',
        title: 'Liquidaciones',
        description: 'Liquidaciones a propietarios',
        icon: 'Receipt',
        order: 5,
      },
      {
        id: 'sub-facturacion',
        slug: 'facturacion',
        title: 'Facturación',
        description: 'Facturas, impuestos y retenciones',
        icon: 'FileSpreadsheet',
        order: 6,
      },
      {
        id: 'sub-contabilidad',
        slug: 'contabilidad',
        title: 'Contabilidad',
        description: 'Automatización contable e informes fiscales',
        icon: 'Calculator',
        order: 7,
      },
      {
        id: 'sub-comunicacion',
        slug: 'comunicacion',
        title: 'Comunicación',
        description: 'Mensajería, notificaciones y calendario',
        icon: 'MessageSquare',
        order: 8,
      },
    ],
  },
  {
    id: 'col-incidencias',
    slug: 'incidencias',
    title: 'Gestión de incidencias',
    description:
      'Reporta, gestiona y resuelve incidencias de mantenimiento con proveedores y clasificación IA.',
    icon: 'Wrench',
    color: 'bg-orange-500',
    order: 3,
  },
  {
    id: 'col-portales',
    slug: 'portales',
    title: 'Portales',
    description:
      'Portales de autoservicio para inquilinos, propietarios y proveedores.',
    icon: 'LayoutDashboard',
    color: 'bg-green-500',
    order: 4,
  },
  {
    id: 'col-academy',
    slug: 'academy',
    title: 'Academy',
    description:
      'Videos tutoriales, webinars y formaciones sobre todas las funcionalidades de Inmova.',
    icon: 'GraduationCap',
    color: 'bg-purple-500',
    order: 5,
  },
];

export function getCollectionBySlug(slug: string): HelpCollection | undefined {
  return collections.find((c) => c.slug === slug);
}

export function getSubcollectionBySlug(
  collectionSlug: string,
  subSlug: string
): { collection: HelpCollection; subcollection: NonNullable<HelpCollection['subcollections']>[number] } | undefined {
  const col = collections.find((c) => c.slug === collectionSlug);
  if (!col?.subcollections) return undefined;
  const sub = col.subcollections.find((s) => s.slug === subSlug);
  if (!sub) return undefined;
  return { collection: col, subcollection: sub };
}
