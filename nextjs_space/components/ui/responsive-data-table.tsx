'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Search, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  mobileLabel?: string; // Etiqueta personalizada para vista móvil
}

interface ResponsiveDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchKeys?: string[];
  itemsPerPage?: number;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  mobileCardRender?: (item: T) => React.ReactNode; // Renderizado personalizado para móvil
}

export function ResponsiveDataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  searchKeys = [],
  itemsPerPage = 10,
  onRowClick,
  isLoading = false,
  emptyMessage = 'No hay datos disponibles',
  mobileCardRender,
}: ResponsiveDataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Filtrado
  const filteredData = searchable
    ? data.filter((item) => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return searchKeys.some((key) => {
          const value = key.split('.').reduce((obj, k) => obj?.[k], item);
          return String(value || '').toLowerCase().includes(searchLower);
        });
      })
    : data;

  // Ordenamiento
  const sortedData = sortConfig
    ? [...filteredData].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      })
    : filteredData;

  // Paginación
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  };

  // Componente de carga
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-sm" />
      <div className="hidden md:block">
        <div className="rounded-md border">
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
      <div className="md:hidden space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Barra de Búsqueda */}
      {searchable && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {filteredData.length} resultado{filteredData.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Vista Desktop - Tabla */}
      <div className="hidden md:block rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    column.sortable ? 'cursor-pointer select-none hover:bg-muted/50' : '',
                    column.className
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && sortConfig?.key === column.key && (
                      <span className="text-xs">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-12">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item, index) => (
                <TableRow
                  key={index}
                  className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.render ? column.render(item) : item[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Vista Móvil - Tarjetas */}
      <div className="md:hidden space-y-3">
        {paginatedData.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 border rounded-md">
            {emptyMessage}
          </div>
        ) : (
          paginatedData.map((item, index) => (
            <Card
              key={index}
              className={cn(
                'transition-all',
                onRowClick && 'cursor-pointer hover:shadow-md active:scale-[0.98]'
              )}
              onClick={() => onRowClick?.(item)}
            >
              <CardContent className="p-4">
                {mobileCardRender ? (
                  mobileCardRender(item)
                ) : (
                  <div className="space-y-2">
                    {columns.map((column) => (
                      <div key={column.key} className="flex justify-between items-start gap-4">
                        <span className="text-sm font-medium text-muted-foreground flex-shrink-0">
                          {column.mobileLabel || column.label}:
                        </span>
                        <span className="text-sm text-right">
                          {column.render ? column.render(item) : item[column.key]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1}-{Math.min(endIndex, sortedData.length)} de {sortedData.length}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="hidden sm:inline-flex"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="hidden sm:inline-flex"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
