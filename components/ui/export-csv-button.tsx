'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface ExportCSVButtonProps {
  data: Record<string, any>[];
  filename?: string;
  columns?: { key: string; label: string }[];
  className?: string;
}

/**
 * Botón reutilizable para exportar cualquier tabla a CSV.
 * 
 * Uso:
 * <ExportCSVButton data={payments} filename="pagos" columns={[
 *   { key: 'periodo', label: 'Periodo' },
 *   { key: 'monto', label: 'Importe' },
 * ]} />
 */
export function ExportCSVButton({ data, filename = 'export', columns, className }: ExportCSVButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) return;

    // Determine columns: use provided or auto-detect from first row
    const cols = columns || Object.keys(data[0]).map(key => ({ key, label: key }));

    // Build CSV
    const header = cols.map(c => `"${c.label}"`).join(';');
    const rows = data.map(row =>
      cols.map(c => {
        const value = getNestedValue(row, c.key);
        if (value === null || value === undefined) return '""';
        if (typeof value === 'number') return value.toString().replace('.', ',');
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(';')
    );

    const csv = '\uFEFF' + [header, ...rows].join('\n'); // BOM for Excel UTF-8
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className={className} disabled={!data?.length}>
      <Download className="h-4 w-4 mr-2" />
      Exportar CSV
    </Button>
  );
}

// Helper to access nested keys like "contract.tenant.nombre"
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);
}
