/**
 * Loading State para Edificios
 *
 * @since Semana 2, Tarea 2.5
 */

import { SkeletonLoader } from '@/components/ui/skeleton-loader';

export default function Loading() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-44 bg-muted animate-pulse rounded" />
        <div className="h-4 w-72 bg-muted animate-pulse rounded" />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <div className="h-10 w-40 bg-muted animate-pulse rounded" />
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
      </div>

      {/* Cards grid */}
      <SkeletonLoader type="card" count={6} />
    </div>
  );
}
