'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface MobileTableColumn {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  hideOnMobile?: boolean;
}

interface MobileTableProps {
  data: any[];
  columns: MobileTableColumn[];
  onRowClick?: (row: any) => void;
  titleKey: string; // Key de la columna que se usará como título en mobile
  subtitleKey?: string; // Key opcional para subtítulo
  statusKey?: string; // Key opcional para mostrar badge de estado
  className?: string;
}

export function MobileTable({
  data,
  columns,
  onRowClick,
  titleKey,
  subtitleKey,
  statusKey,
  className
}: MobileTableProps) {
  // En desktop, mostrar tabla tradicional
  const renderDesktopTable = () => (
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left p-3 text-sm font-semibold text-gray-700"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'border-b hover:bg-gray-50 transition-colors',
                onRowClick && 'cursor-pointer'
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className="p-3 text-sm">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // En móvil, mostrar tarjetas
  const renderMobileCards = () => (
    <div className="lg:hidden space-y-3 pb-safe-bottom">
      {data.map((row, idx) => {
        const title = row[titleKey];
        const subtitle = subtitleKey ? row[subtitleKey] : null;
        const status = statusKey ? row[statusKey] : null;

        // Filtrar columnas que no se ocultan en mobile y que no son title/subtitle/status
        const visibleColumns = columns.filter(
          (col) => !col.hideOnMobile && ![titleKey, subtitleKey, statusKey].includes(col.key)
        );

        return (
          <div
            key={idx}
            onClick={() => onRowClick?.(row)}
            className={cn(
              'mobile-table-card',
              onRowClick && 'cursor-pointer active:scale-[0.98] transition-transform'
            )}
          >
            <div className="mobile-table-card-header">
              <div className="flex-1">
                <div className="mobile-table-card-title">{title}</div>
                {subtitle && (
                  <div className="text-sm text-gray-500 mt-1">{subtitle}</div>
                )}
              </div>
              {status && (
                <Badge variant={getStatusVariant(status)}>
                  {status}
                </Badge>
              )}
              {onRowClick && (
                <ChevronRight className="h-5 w-5 text-gray-400 ml-2" />
              )}
            </div>
            <div className="mobile-table-card-body">
              {visibleColumns.map((col) => (
                <div key={col.key} className="mobile-table-card-row">
                  <span className="mobile-table-card-label">{col.label}</span>
                  <span className="mobile-table-card-value">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className={className}>
      {renderDesktopTable()}
      {renderMobileCards()}
    </div>
  );
}

// Helper para determinar variante de badge según estado
function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('activ') || statusLower.includes('vigente')) return 'default';
  if (statusLower.includes('pendiente')) return 'secondary';
  if (statusLower.includes('vencido') || statusLower.includes('inactiv')) return 'destructive';
  return 'outline';
}
