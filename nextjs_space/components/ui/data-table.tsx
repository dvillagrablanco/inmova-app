/**
 * Accessible data table component with proper ARIA attributes
 * Provides better experience for screen readers and keyboard navigation
 */

import { ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  header: string;
  render: (item: T, index: number) => ReactNode;
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  caption?: string;
  onRowClick?: (item: T, index: number) => void;
  emptyMessage?: string;
  className?: string;
  ariaLabel?: string;
  rowClassName?: (item: T, index: number) => string;
}

export function DataTable<T extends { id?: string | number }>({
  data,
  columns,
  caption,
  onRowClick,
  emptyMessage = 'No hay datos disponibles',
  className,
  ariaLabel,
  rowClassName,
}: DataTableProps<T>) {
  return (
    <div className={cn('relative w-full overflow-auto', className)}>
      <Table aria-label={ariaLabel}>
        {caption && <TableCaption>{caption}</TableCaption>}
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={column.className}
                scope="col"
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center py-8 text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, index) => (
              <TableRow
                key={item.id ?? index}
                onClick={() => onRowClick?.(item, index)}
                className={cn(
                  onRowClick && 'cursor-pointer hover:bg-muted/50',
                  rowClassName?.(item, index)
                )}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick(item, index);
                        }
                      }
                    : undefined
                }
                role={onRowClick ? 'button' : undefined}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.render(item, index)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
