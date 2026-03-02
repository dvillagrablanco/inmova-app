'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatEuro, formatPct } from '@/lib/finanzas/pyg-config';
import type { CuadroMandosResponse, PygLine, PygGroup } from '@/types/finanzas';

interface ExportButtonProps {
  data: CuadroMandosResponse | null;
}

function pygLineToRow(line: PygLine, indent = ''): string[] {
  return [
    `${indent}${line.nombre}`,
    formatEuro(line.importe, true),
    formatPct(line.pctSobreRentas),
    formatPct(line.pctSobreInversion),
  ];
}

function pygGroupToRows(group: PygGroup, label: string): string[][] {
  const rows: string[][] = [];
  rows.push(pygLineToRow(group.subtotal, '  '));
  rows[0][0] = `  ${label}`;
  for (const detail of group.detalle) {
    rows.push(pygLineToRow(detail, '    '));
  }
  return rows;
}

export function ExportButton({ data }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  async function exportToCSV() {
    if (!data) return;
    setExporting(true);

    try {
      const pyg = data.pygTotal;
      const rows: string[][] = [];

      // Header
      rows.push(['Cuadro de Mandos Financiero', `Ejercicio ${data.ejercicio}`]);
      rows.push([]);

      // KPIs
      rows.push(['INDICADORES DE CARTERA']);
      rows.push(['Valor Inversión', formatEuro(data.kpis.valorInversion, true)]);
      rows.push(['Valor de Mercado', formatEuro(data.kpis.valorMercado, true)]);
      rows.push(['Plusvalía Latente', formatEuro(data.kpis.plusvaliaLatente, true)]);
      rows.push(['Tasa Disponibilidad', formatPct(data.kpis.tasaDisponibilidad)]);
      rows.push(['Tasa Ocupación', formatPct(data.kpis.tasaOcupacion)]);
      rows.push([]);

      // PyG Header
      rows.push(['PyG ANALÍTICA', 'Importe €', '% S/ Rentas', '% S/ Inversión']);
      rows.push([]);

      // Ingresos
      rows.push(pygLineToRow(pyg.totalIngresos));
      rows.push(pygLineToRow(pyg.ingresosArrendamientos, '  '));
      rows.push(pygLineToRow(pyg.otrosIngresos, '  '));

      // Gastos
      rows.push(pygLineToRow(pyg.totalGastos));
      rows.push(...pygGroupToRows(pyg.serviciosExteriores, 'Servicios Exteriores'));
      rows.push(...pygGroupToRows(pyg.tributos, 'Tributos'));
      rows.push(...pygGroupToRows(pyg.costesSociales, 'Costes Sociales'));

      // EBITDA
      rows.push(pygLineToRow(pyg.ebitda));
      rows.push(pygLineToRow(pyg.amortizaciones, '  '));
      rows.push(pygLineToRow(pyg.resultadoEnajenaciones, '  '));
      rows.push(pygLineToRow(pyg.resultadoExplotacion));

      // Financiero
      for (const line of pyg.detalleFinanciero) {
        rows.push(pygLineToRow(line, '  '));
      }
      rows.push(pygLineToRow(pyg.resultadoFinanciero));

      // Extraordinario
      rows.push(pygLineToRow(pyg.ingresosGtosExtraordinarios, '  '));
      rows.push(pygLineToRow(pyg.impuestoSociedades, '  '));
      rows.push(pygLineToRow(pyg.resultadoPeriodo));

      // Comparativo
      if (data.ejerciciosComparativos.length > 0) {
        rows.push([]);
        rows.push(['COMPARATIVO MULTI-EJERCICIO']);
        const header = ['Indicador', ...data.ejerciciosComparativos.map((e) => String(e.ejercicio))];
        rows.push(header);
        rows.push([
          'Valor Inversión',
          ...data.ejerciciosComparativos.map((e) => formatEuro(e.valorInversion, true)),
        ]);
        rows.push([
          'Valor de Mercado',
          ...data.ejerciciosComparativos.map((e) => formatEuro(e.valorMercado, true)),
        ]);
        rows.push([
          'Plusvalía Latente',
          ...data.ejerciciosComparativos.map((e) => formatEuro(e.plusvaliaLatente, true)),
        ]);
        rows.push([
          'Tasa Disponibilidad',
          ...data.ejerciciosComparativos.map((e) => formatPct(e.tasaDisponibilidad)),
        ]);
        rows.push([
          'Tasa Ocupación',
          ...data.ejerciciosComparativos.map((e) => formatPct(e.tasaOcupacion)),
        ]);
      }

      // Generate CSV
      const csvContent = rows
        .map((row) => row.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(';'))
        .join('\n');

      // BOM for Excel compatibility
      const bom = '\uFEFF';
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cuadro-mandos-${data.ejercicio}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Exportación completada');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Error al exportar');
    } finally {
      setExporting(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={!data || exporting}>
          {exporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar a CSV (Excel)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
