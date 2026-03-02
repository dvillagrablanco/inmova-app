'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { FileText, Download, FileSpreadsheet, Receipt, Building2, Euro, Home } from 'lucide-react';
import { toast } from 'sonner';

export default function ExportGestoriaPage() {
  const { status } = useSession();
  const router = useRouter();
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [exporting, setExporting] = useState<string | null>(null);

  if (status === 'unauthenticated') { router.push('/login'); }

  const exports = [
    {
      id: 'facturas-emitidas',
      name: 'Libro de Facturas Emitidas',
      description: 'Alquileres facturados por sociedad (para Modelo 303/390)',
      icon: Receipt,
      format: 'CSV',
    },
    {
      id: 'facturas-recibidas',
      name: 'Libro de Facturas Recibidas',
      description: 'Gastos con factura por sociedad (IBI, comunidad, proveedores)',
      icon: FileText,
      format: 'CSV',
    },
    {
      id: 'amortizaciones',
      name: 'Cuadro de Amortizaciones',
      description: 'Amortización anual por inmueble (3% construcción para IS)',
      icon: Building2,
      format: 'CSV',
    },
    {
      id: 'intereses-hipoteca',
      name: 'Intereses Hipotecarios',
      description: 'Desglose intereses/capital por hipoteca (gasto deducible IS)',
      icon: Euro,
      format: 'CSV',
    },
    {
      id: 'resumen-fiscal',
      name: 'Resumen Fiscal Anual',
      description: 'Base imponible, deducciones y cuota IS por sociedad',
      icon: FileSpreadsheet,
      format: 'PDF',
    },
    {
      id: 'modelo-347',
      name: 'Datos Modelo 347',
      description: 'Operaciones con terceros > 3.005,06 EUR',
      icon: FileText,
      format: 'CSV',
    },
  ];

  const handleExport = async (exportId: string) => {
    setExporting(exportId);
    try {
      // Mapear IDs de export a tipos de la API contable
      const apiTypeMap: Record<string, { endpoint: string; tipo?: string; formato?: string }> = {
        'facturas-emitidas': { endpoint: '/api/investment/export/contable', tipo: 'facturas-emitidas', formato: 'csv' },
        'facturas-recibidas': { endpoint: '/api/investment/export/contable', tipo: 'facturas-recibidas', formato: 'csv' },
        'amortizaciones': { endpoint: '/api/investment/depreciation', formato: 'json' },
        'intereses-hipoteca': { endpoint: '/api/investment/mortgages', formato: 'json' },
        'resumen-fiscal': { endpoint: '/api/investment/fiscal/modelo-200', formato: 'json' },
        'modelo-347': { endpoint: '/api/investment/fiscal/modelo-347', formato: 'json' },
      };

      const config = apiTypeMap[exportId];
      if (!config) throw new Error('Export no configurado');

      const params = new URLSearchParams({ ejercicio: year });
      if (config.tipo) params.set('tipo', config.tipo);
      if (config.formato) params.set('formato', config.formato);

      const res = await fetch(`${config.endpoint}?${params.toString()}`);
      if (!res.ok) throw new Error('Error del servidor');

      // Si es CSV, descargar como archivo
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/csv')) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${exportId}_${year}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(`${exportId} descargado correctamente`);
      } else {
        // JSON: mostrar datos o generar descarga JSON
        const data = await res.json();
        if (data.success || data.data) {
          const blob = new Blob([JSON.stringify(data.data || data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${exportId}_${year}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success(`${exportId} descargado correctamente`);
        } else {
          throw new Error(data.error || 'Error generando export');
        }
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message || 'Error generando export'}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-6">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard"><Home className="h-3.5 w-3.5" /></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/inversiones">Inversiones</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Exportar</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Export para Gestoría</h1>
            <p className="text-gray-500">Datos contables y fiscales para tu asesor</p>
          </div>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {exports.map((exp) => {
            const Icon = exp.icon;
            return (
              <Card key={exp.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{exp.name}</CardTitle>
                      <CardDescription className="text-xs">{exp.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={exporting === exp.id}
                    onClick={() => handleExport(exp.id)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {exporting === exp.id ? 'Generando...' : `Descargar ${exp.format}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
