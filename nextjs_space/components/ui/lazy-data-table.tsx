/**
 * Lazy-loaded DataTable Component
 * DataTables with large datasets can be heavy
 */
import { lazy, Suspense, ComponentType } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loadingComponent?: React.ReactNode;
  [key: string]: any;
}

// Lazy load DataTable
const DataTableComponent = lazy(() => 
  import('@/components/ui/data-table').then(module => ({
    default: module.DataTable
  }))
);

function TableLoadingSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
}

export function LazyDataTable<TData, TValue>({
  loadingComponent,
  ...props
}: LazyDataTableProps<TData, TValue>) {
  return (
    <Suspense fallback={loadingComponent || <TableLoadingSkeleton />}>
      <DataTableComponent {...props} />
    </Suspense>
  );
}

export default LazyDataTable;
