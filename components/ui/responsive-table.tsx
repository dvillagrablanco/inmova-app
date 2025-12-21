'use client';

import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

/**
 * Componente de tabla responsive que se convierte en cards en móvil
 * Optimizado para mobile-first UI
 */

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  mobileLabel?: string; // Label personalizado para móvil
  className?: string;
  hideOnMobile?: boolean; // Ocultar esta columna en móvil
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  loading?: boolean;
  mobileCardClassName?: string;
  tableClassName?: string;
}

export function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  emptyMessage = 'No hay datos para mostrar',
  loading = false,
  mobileCardClassName,
  tableClassName,
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Vista móvil: Cards
  if (isMobile) {
    const visibleColumns = columns.filter((col) => !col.hideOnMobile);

    return (
      <div className="space-y-3">
        {data.map((item) => (
          <Card
            key={keyExtractor(item)}
            className={cn(
              'transition-shadow hover:shadow-md',
              onRowClick && 'cursor-pointer active:scale-[0.98]',
              mobileCardClassName
            )}
            onClick={() => onRowClick?.(item)}
          >
            <CardContent className="p-4">
              <div className="space-y-2">
                {visibleColumns.map((column) => (
                  <div key={column.key} className="flex justify-between gap-4">
                    <span className="text-sm font-medium text-muted-foreground">
                      {column.mobileLabel || column.header}:
                    </span>
                    <span className={cn('text-sm font-medium', column.className)}>
                      {column.render ? column.render(item) : item[column.key]}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Vista desktop: Tabla tradicional
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full', tableClassName)}>
        <thead>
          <tr className="border-b bg-muted/50">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-4 py-3 text-left text-sm font-semibold',
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              className={cn(
                'border-b transition-colors hover:bg-muted/50',
                onRowClick && 'cursor-pointer'
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn('px-4 py-3 text-sm', column.className)}
                >
                  {column.render ? column.render(item) : item[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Ejemplo de uso:
 * 
 * <ResponsiveTable
 *   data={buildings}
 *   columns={[
 *     { key: 'name', header: 'Nombre', mobileLabel: 'Edificio' },
 *     { key: 'address', header: 'Dirección', hideOnMobile: true },
 *     { key: 'units', header: 'Unidades', render: (b) => b.units.length },
 *   ]}
 *   keyExtractor={(b) => b.id}
 *   onRowClick={(b) => router.push(`/edificios/${b.id}`)}
 * />
 */
