/**
 * Loading State para Contratos
 *
 * Se muestra automáticamente mientras Next.js carga la página.
 * Proporciona feedback visual instantáneo al usuario.
 *
 * @since Semana 2, Tarea 2.5
 */

import { SkeletonLoader } from '@/components/ui/skeleton-loader';

export default function Loading() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
      </div>

      {/* Actions bar */}
      <div className="flex gap-3">
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
      </div>

      {/* Table */}
      <SkeletonLoader type="table" rows={8} />
    </div>
  );
}
