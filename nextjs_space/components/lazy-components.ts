/**
 * Componentes con lazy loading para reducir el bundle inicial
 */
import dynamic from 'next/dynamic';

// Componentes de formularios pesados
export const RichTextEditor = dynamic(
  () => import('@/components/ui/rich-text-editor'),
  { ssr: false, loading: () => <div className="h-32 animate-pulse bg-gray-100 rounded" /> }
);

// Componente de calendario (usado en varias páginas)
export const FullCalendar = dynamic(
  () => import('@/components/ui/calendar-full'),
  { ssr: false, loading: () => <div className="h-96 animate-pulse bg-gray-100 rounded" /> }
);

// Componente de mapa (usado en edificios y ubicaciones)
export const MapViewer = dynamic(
  () => import('@/components/ui/map-viewer'),
  { ssr: false, loading: () => <div className="h-64 animate-pulse bg-gray-100 rounded" /> }
);

// Componente de chat (usado en asistente IA y soporte)
export const ChatInterface = dynamic(
  () => import('@/components/chat/ChatInterface'),
  { ssr: false, loading: () => <div className="h-full animate-pulse bg-gray-100 rounded" /> }
);

// Componente de firma digital
export const SignaturePad = dynamic(
  () => import('@/components/ui/signature-pad'),
  { ssr: false, loading: () => <div className="h-48 animate-pulse bg-gray-100 rounded" /> }
);

// Visor de PDF
export const PDFViewer = dynamic(
  () => import('@/components/ui/pdf-viewer'),
  { ssr: false, loading: () => <div className="h-96 animate-pulse bg-gray-100 rounded flex items-center justify-center"><span>Cargando PDF...</span></div> }
);

// Editor de imágenes
export const ImageEditor = dynamic(
  () => import('@/components/ui/image-editor'),
  { ssr: false, loading: () => <div className="h-96 animate-pulse bg-gray-100 rounded" /> }
);
