/**
 * Skeleton Loader Component
 *
 * Skeletons para diferentes tipos de contenido durante la carga.
 * Proporciona feedback visual de la estructura de la página.
 *
 * @module skeleton-loader
 * @since Semana 2, Tarea 2.5
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonLoaderProps {
  /** Tipo de skeleton */
  type?: 'table' | 'card' | 'list' | 'form' | 'text';
  /** Número de filas (para table) o items (para list) */
  rows?: number;
  /** Número de cards */
  count?: number;
  /** Clase CSS adicional */
  className?: string;
}

/**
 * Componente base de skeleton (pulso animado)
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}

/**
 * Skeleton para tabla
 */
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-20" />
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 w-20" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton para cards
 */
function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6 space-y-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton para lista
 */
function ListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton para formulario
 */
function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

/**
 * Skeleton para texto
 */
function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')} />
      ))}
    </div>
  );
}

/**
 * Componente principal SkeletonLoader
 *
 * @example
 * ```tsx
 * // Tabla
 * <SkeletonLoader type="table" rows={10} />
 *
 * // Cards
 * <SkeletonLoader type="card" count={6} />
 *
 * // Lista
 * <SkeletonLoader type="list" rows={5} />
 *
 * // Formulario
 * <SkeletonLoader type="form" />
 * ```
 */
export function SkeletonLoader({ type = 'table', rows, count, className }: SkeletonLoaderProps) {
  const content = (() => {
    switch (type) {
      case 'table':
        return <TableSkeleton rows={rows} />;
      case 'card':
        return <CardSkeleton count={count} />;
      case 'list':
        return <ListSkeleton rows={rows} />;
      case 'form':
        return <FormSkeleton />;
      case 'text':
        return <TextSkeleton lines={rows} />;
      default:
        return <TableSkeleton rows={rows} />;
    }
  })();

  return <div className={cn('w-full', className)}>{content}</div>;
}

export { Skeleton };
export default SkeletonLoader;
