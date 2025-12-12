"use client";

import { ReactNode, useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Columns3, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import logger from '@/lib/logger';

export interface ResponsiveColumn<T> {
  key: string;
  header: string;
  render: (item: T, index: number) => ReactNode;
  className?: string;
  sortable?: boolean;
  /** Prioridad de la columna para móvil (1 = más importante, se muestra siempre) */
  mobilePriority?: number;
  /** Si es true, la columna estará fija al hacer scroll horizontal */
  sticky?: 'left' | 'right';
  /** Ancho mínimo de la columna */
  minWidth?: string;
}

interface ResponsiveDataTableProps<T> {
  data: T[];
  columns: ResponsiveColumn<T>[];
  caption?: string;
  onRowClick?: (item: T, index: number) => void;
  emptyMessage?: string;
  className?: string;
  ariaLabel?: string;
  rowClassName?: (item: T, index: number) => string;
  /** Número de columnas a mostrar en móvil (basado en mobilePriority) */
  mobileColumnsCount?: number;
  /** Permitir selección de columnas visibles */
  allowColumnSelection?: boolean;
  /** Persistir la selección de columnas en localStorage */
  persistColumnSelection?: boolean;
  /** Key para localStorage (requerido si persistColumnSelection es true) */
  storageKey?: string;
}

function getInitialVisibleColumns<T>(
  columns: ResponsiveColumn<T>[],
  storageKey?: string
): Set<string> {
  if (storageKey && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`${storageKey}-visible-columns`);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (e) {
      logger.error('Error loading column preferences:', e);
    }
  }
  return new Set(columns.map((c) => c.key));
}

export function ResponsiveDataTable<T extends { id?: string | number }>({
  data,
  columns,
  caption,
  onRowClick,
  emptyMessage = 'No hay datos disponibles',
  className,
  ariaLabel,
  rowClassName,
  mobileColumnsCount = 3,
  allowColumnSelection = true,
  persistColumnSelection = false,
  storageKey,
}: ResponsiveDataTableProps<T>) {
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() =>
    getInitialVisibleColumns(columns, persistColumnSelection ? storageKey : undefined)
  );

  // Ordenar columnas por mobilePriority para móvil
  const sortedColumns = useMemo(() => {
    return [...columns].sort((a, b) => {
      const priorityA = a.mobilePriority ?? 999;
      const priorityB = b.mobilePriority ?? 999;
      return priorityA - priorityB;
    });
  }, [columns]);

  // Columnas a mostrar en móvil (basadas en mobilePriority)
  const mobileColumns = useMemo(() => {
    return sortedColumns.slice(0, mobileColumnsCount);
  }, [sortedColumns, mobileColumnsCount]);

  // Columnas finales a renderizar (respetando visibleColumns)
  const displayColumns = useMemo(() => {
    return columns.filter((col) => visibleColumns.has(col.key));
  }, [columns, visibleColumns]);

  const toggleColumn = (columnKey: string) => {
    const newVisibleColumns = new Set(visibleColumns);
    if (newVisibleColumns.has(columnKey)) {
      // Prevent hiding all columns
      if (newVisibleColumns.size > 1) {
        newVisibleColumns.delete(columnKey);
      }
    } else {
      newVisibleColumns.add(columnKey);
    }
    setVisibleColumns(newVisibleColumns);

    // Persist to localStorage
    if (persistColumnSelection && storageKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          `${storageKey}-visible-columns`,
          JSON.stringify(Array.from(newVisibleColumns))
        );
      } catch (e) {
        logger.error('Error saving column preferences:', e);
      }
    }
  };

  const resetColumns = () => {
    const allColumns = new Set(columns.map((c) => c.key));
    setVisibleColumns(allColumns);
    if (persistColumnSelection && storageKey && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`${storageKey}-visible-columns`);
      } catch (e) {
        logger.error('Error resetting column preferences:', e);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Column Selection Toolbar */}
      {allowColumnSelection && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Mostrando {displayColumns.length} de {columns.length} columnas
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto">
                <Columns3 className="mr-2 h-4 w-4" />
                Columnas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Columnas Visibles</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.key}
                  checked={visibleColumns.has(column.key)}
                  onCheckedChange={() => toggleColumn(column.key)}
                >
                  {column.header}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm"
                onClick={resetColumns}
              >
                Restablecer
              </Button>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Desktop Table - Full columns with horizontal scroll */}
      <div className="hidden md:block">
        <div className={cn('relative w-full overflow-x-auto', className)}>
          <Table aria-label={ariaLabel}>
            {caption && <TableCaption>{caption}</TableCaption>}
            <TableHeader>
              <TableRow>
                {displayColumns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(
                      column.className,
                      column.sticky === 'left' && 'sticky left-0 z-10 bg-background',
                      column.sticky === 'right' && 'sticky right-0 z-10 bg-background'
                    )}
                    scope="col"
                    style={{ minWidth: column.minWidth }}
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
                    colSpan={displayColumns.length}
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
                    {displayColumns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={cn(
                          column.className,
                          column.sticky === 'left' && 'sticky left-0 z-10 bg-background',
                          column.sticky === 'right' && 'sticky right-0 z-10 bg-background'
                        )}
                        style={{ minWidth: column.minWidth }}
                      >
                        {column.render(item, index)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Table - Compact view with priority columns */}
      <div className="md:hidden">
        <div className={cn('relative w-full overflow-x-auto', className)}>
          <Table aria-label={ariaLabel} className="text-sm">
            {caption && <TableCaption>{caption}</TableCaption>}
            <TableHeader>
              <TableRow>
                {mobileColumns
                  .filter((col) => visibleColumns.has(col.key))
                  .map((column) => (
                    <TableHead
                      key={column.key}
                      className={cn(
                        'text-xs px-2 py-2',
                        column.className,
                        column.sticky === 'left' && 'sticky left-0 z-10 bg-background',
                        column.sticky === 'right' && 'sticky right-0 z-10 bg-background'
                      )}
                      scope="col"
                      style={{ minWidth: column.minWidth }}
                    >
                      {column.header}
                    </TableHead>
                  ))}
                {onRowClick && (
                  <TableHead className="text-xs px-2 py-2 sticky right-0 z-10 bg-background">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={mobileColumns.length + (onRowClick ? 1 : 0)}
                    className="text-center py-8 text-muted-foreground text-sm"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow
                    key={item.id ?? index}
                    className={cn(
                      onRowClick && 'cursor-pointer hover:bg-muted/50',
                      rowClassName?.(item, index)
                    )}
                    tabIndex={onRowClick ? 0 : undefined}
                  >
                    {mobileColumns
                      .filter((col) => visibleColumns.has(col.key))
                      .map((column) => (
                        <TableCell
                          key={column.key}
                          className={cn(
                            'text-xs px-2 py-2',
                            column.className,
                            column.sticky === 'left' && 'sticky left-0 z-10 bg-background',
                            column.sticky === 'right' && 'sticky right-0 z-10 bg-background'
                          )}
                          style={{ minWidth: column.minWidth }}
                        >
                          {column.render(item, index)}
                        </TableCell>
                      ))}
                    {onRowClick && (
                      <TableCell className="text-xs px-2 py-2 sticky right-0 z-10 bg-background">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRowClick(item, index);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronRight className="h-4 w-4" />
                          <span className="sr-only">Ver detalles</span>
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {data.length > 0 && (
          <div className="mt-2 px-2 text-xs text-muted-foreground flex items-center gap-1">
            <ChevronLeft className="h-3 w-3" />
            Desliza horizontalmente para ver más columnas
            <ChevronRight className="h-3 w-3" />
          </div>
        )}
      </div>
    </div>
  );
}
