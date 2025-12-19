'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react';
import { exportToCSV, exportToExcel, exportToPDF } from '@/lib/export-utils';
import { toast } from 'sonner';

interface ExportColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

interface ExportButtonProps {
  data: any[];
  columns: ExportColumn[];
  filename: string;
  title?: string;
  subtitle?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ExportButton({
  data,
  columns,
  filename,
  title,
  subtitle,
  disabled = false,
  variant = 'outline',
  size = 'default',
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (data.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    setIsExporting(true);

    try {
      const options = {
        filename,
        columns,
        data,
        title,
        subtitle,
      };

      switch (format) {
        case 'csv':
          exportToCSV(options);
          toast.success('Archivo CSV descargado correctamente');
          break;
        case 'excel':
          exportToExcel(options);
          toast.success('Archivo Excel descargado correctamente');
          break;
        case 'pdf':
          exportToPDF(options);
          // No mostrar toast para PDF porque se abre una ventana nueva
          break;
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Error al exportar los datos');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={disabled || isExporting}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Exportando...' : 'Exportar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Seleccionar formato</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('csv')} className="cursor-pointer">
          <File className="h-4 w-4 mr-2" />
          Exportar a CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')} className="cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar a Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')} className="cursor-pointer">
          <FileText className="h-4 w-4 mr-2" />
          Exportar a PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
