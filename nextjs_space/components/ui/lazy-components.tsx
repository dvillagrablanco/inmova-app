"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Lazy loading para componentes pesados no relacionados con gráficos
 */

/**
 * Skeleton para editor de texto enriquecido
 */
function EditorSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-8" />
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton para mapa
 */
function MapSkeleton() {
  return (
    <div className="w-full h-full min-h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-32 mx-auto" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    </div>
  );
}

/**
 * Skeleton para tabla de datos compleja
 */
function DataTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="border rounded-lg">
        <div className="grid grid-cols-5 gap-4 p-4 border-b bg-gray-50">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4" />
          ))}
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="grid grid-cols-5 gap-4 p-4 border-b">
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={j} className="h-4" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Lazy loading para editor de texto enriquecido (ej: Tiptap, Quill)
 * Nota: Implementar el componente en @/components/editor/RichTextEditor cuando sea necesario
 */
export const LazyRichTextEditor = () => <EditorSkeleton />;

/**
 * Lazy loading para Mapbox GL
 * Nota: Implementar el componente en @/components/maps/MapComponent cuando sea necesario
 */
export const LazyMap = () => <MapSkeleton />;

/**
 * Lazy loading para DataTable complejo con filtros avanzados
 */
export const LazyAdvancedDataTable = dynamic(
  () => import('@/components/ui/data-table').then((mod) => ({
    default: mod.DataTable
  })),
  {
    loading: () => <DataTableSkeleton />,
    ssr: false,
  }
);

/**
 * Lazy loading para componentes de PDF
 * Nota: Implementar el componente en @/components/pdf/PDFViewer cuando sea necesario
 */
export const LazyPDFViewer = () => (
  <div className="w-full h-full min-h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
    <Skeleton className="w-3/4 h-3/4" />
  </div>
);

/**
 * Lazy loading para galería de imágenes con lightbox
 * Nota: Implementar el componente en @/components/gallery/ImageGallery cuando sea necesario
 */
export const LazyImageGallery = () => (
  <div className="grid grid-cols-3 gap-4">
    {Array.from({ length: 9 }).map((_, i) => (
      <Skeleton key={i} className="aspect-square" />
    ))}
  </div>
);
