/**
 * Sistema de Lazy Loading para Componentes Pesados
 * Mejora el rendimiento inicial dividiendo el bundle en chunks más pequeños
 */

import dynamic from 'next/dynamic';
import { LoadingState } from '@/components/ui/loading-state';
import { ComponentType } from 'react';

// Helper para crear componentes lazy con loading state personalizado
export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  loadingMessage?: string
) {
  return dynamic(importFn, {
    loading: () => <LoadingState message={loadingMessage || 'Cargando componente...'} />,
    ssr: false, // Desactivar SSR para componentes pesados que no necesitan SEO
  });
}

// Lazy Components para Modales y Diálogos
export const LazyConfirmDialog = createLazyComponent(
  () => import('@/components/ui/confirm-dialog').then(mod => ({ default: mod.ConfirmDialog })),
  'Cargando diálogo...'
);

// Lazy Components para Formularios Complejos
export const LazyPropertyForm = createLazyComponent(
  () => import('@/components/forms/property-form').then(mod => ({ default: mod.PropertyForm })),
  'Cargando formulario...'
);

// Lazy Components para Dashboards
export const LazyAnalyticsDashboard = createLazyComponent(
  () => import('@/app/analytics/components/analytics-dashboard'),
  'Cargando análisis...'
);

export const LazyBIDashboard = createLazyComponent(
  () => import('@/app/bi/components/bi-dashboard'),
  'Cargando Business Intelligence...'
);

// Lazy Components para Calendarios y Planificadores
export const LazyCalendarView = createLazyComponent(
  () => import('@/components/calendar/calendar-view'),
  'Cargando calendario...'
);

// Lazy Components para Editores Ricos
export const LazyRichTextEditor = createLazyComponent(
  () => import('@/components/editors/rich-text-editor'),
  'Cargando editor...'
);

// Lazy Components para Visualizaciones Complejas
export const LazyDataVisualization = createLazyComponent(
  () => import('@/components/visualizations/data-visualization'),
  'Cargando visualización...'
);

// Lazy Components para Chat/Mensajería
export const LazyChatInterface = createLazyComponent(
  () => import('@/components/chat/chat-interface'),
  'Cargando chat...'
);

// Lazy Components para Gestión de Archivos
export const LazyFileManager = createLazyComponent(
  () => import('@/components/files/file-manager'),
  'Cargando gestor de archivos...'
);

// Lazy Components para Reportes
export const LazyReportGenerator = createLazyComponent(
  () => import('@/components/reports/report-generator'),
  'Cargando generador de reportes...'
);

export default {
  LazyConfirmDialog,
  LazyPropertyForm,
  LazyAnalyticsDashboard,
  LazyBIDashboard,
  LazyCalendarView,
  LazyRichTextEditor,
  LazyDataVisualization,
  LazyChatInterface,
  LazyFileManager,
  LazyReportGenerator,
  createLazyComponent,
};
