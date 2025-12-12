"use client";

import { ComponentType, Suspense } from 'react';
import { Skeleton } from './skeleton';
import { Card, CardContent, CardHeader } from './card';

/**
 * Note: Lazy loading components commented out due to export compatibility issues
 * These can be re-enabled once proper default exports are added to the source components
 */

/**
 * Generic lazy component wrapper with custom loading state
 */
interface LazyWrapperProps {
  loading?: React.ReactNode;
  children: React.ReactNode;
}

export function LazyWrapper({ loading, children }: LazyWrapperProps) {
  return (
    <Suspense
      fallback={
        loading || (
          <div className="flex items-center justify-center p-8">
            <Skeleton className="h-[200px] w-full" />
          </div>
        )
      }
    >
      {children}
    </Suspense>
  );
}

/**
 * Loading skeleton for charts
 */
export function ChartSkeleton() {
  return <Skeleton className="h-[300px] w-full" />;
}

/**
 * Loading skeleton for photo gallery
 */
export function GallerySkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-[200px] w-full" />
      ))}
    </div>
  );
}

/**
 * Loading skeleton for data tables
 */
export function TableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[400px] w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-10 w-[150px]" />
        <Skeleton className="h-10 w-[200px]" />
      </div>
    </div>
  );
}

/**
 * Loading skeleton for dashboard analytics
 */
export function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-[100px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Loading skeleton for notification center
 */
export function NotificationsSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
