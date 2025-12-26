/**
 * Loading State para Pagos
 *
 * @since Semana 2, Tarea 2.5
 */

import { SkeletonLoader } from '@/components/ui/skeleton-loader';

export default function Loading() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-40 bg-muted animate-pulse rounded" />
        <div className="h-4 w-80 bg-muted animate-pulse rounded" />
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="h-10 w-48 bg-muted animate-pulse rounded" />
        <div className="h-10 w-48 bg-muted animate-pulse rounded" />
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6 space-y-3">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>

      {/* Table */}
      <SkeletonLoader type="table" rows={10} />
    </div>
  );
}
