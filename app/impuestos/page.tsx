'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, ArrowLeft, Receipt, Euro, Calendar, AlertTriangle, CheckCircle2, Download, FileText, Calculator, TrendingUp, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ImpuestosPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState('2025');

  useEffect(() => {
    if (status === 'authenticated') setLoading(false);
    else if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const resumenAnual = {
    ingresosBrutos: 145680,
    gastosDeducibles: 38500,
    baseImponible: 107180,
    impuestoEstimado: 25722,
    retencionesAplicadas: 18500,
    aPagar: 7222,
  };

  const obligaciones = [
    { id: 1, nombre: 'Modelo 303 - IVA', periodo: '4T 2024', vence: '2025-01-30', estado: 'pendiente', importe: 3250 },
    { id: 2, nombre: 'Modelo 115 - Retenciones', periodo: '4T 2024', vence: '2025-01-20', estado: 'presentado', importe: 1850 },
    { id: 3, nombre: 'Modelo 100 - IRPF', periodo: '2024', vence: '2025-06-30', estado: 'pendiente', importe: 7222 },
    { id: 4, nombre: 'IBI Edificio Centro', periodo: '2025', vence: '2025-03-15', estado: 'pendiente', importe: 2400 },
  ];

  const propiedades = [
    { nombre: 'Edificio Centro', valorCatastral: 450000, ibi: 2400, ingresos: 85000, gastos: 18000 },
    { nombre: 'Residencial Playa', valorCatastral: 320000, ibi: 1800, ingresos: 42000, gastos: 12500 },
    { nombre: 'Apartamentos Norte', valorCatastral: 280000, ibi: 1500, ingresos: 18680, gastos: 8000 },
  ];

  const getEstadoBadge = (estado: string) => {
    const config: Record<string, { className: string; label: string }> = {
      pendiente: { className: 'bg-yellow-500', label: 'Pendiente' },
      presentado: { className: 'bg-green-500', label: 'Presentado' },
      pagado: { className: 'bg-blue-500', label: 'Pagado' },
    };
    const { className, label } = config[estado] || config.pendiente;
    return <Badge className={className}>{label}</Badge>;
  };

  if (loading) {
    return <AuthenticatedLayout><div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div></AuthenticatedLayout>;
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}><ArrowLeft className="h-4 w-4 mr-2" />Volver</Button>
          <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>Impuestos</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-xl"><Receipt className="h-8 w-8 text-red-600" /></div>
            <div><h1 className="text-2xl sm:text-3xl font-bold">Gestión de Impuestos</h1><p className="text-muted-foreground">Control fiscal de tus propiedades</p></div>
          </div>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Resumen Fiscal */}
        <Card className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
          <CardHeader><CardTitle className="text-xl">Resumen Fiscal {year}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div><p className="text-white/70 text-sm">Ingresos Brutos</p><p className="text-2xl font-bold">€{resumenAnual.ingresosBrutos.toLocaleString()}</p></div>
              <div><p className="text-white/70 text-sm">Gastos Deducibles</p><p className="text-2xl font-bold">€{resumenAnual.gastosDeducibles.toLocaleString()}</p></div>
              <div><p className="text-white/70 text-sm">Base Imponible</p><p className="text-2xl font-bold">€{resumenAnual.baseImponible.toLocaleString()}</p></div>
              <div><p className="text-white/70 text-sm">Impuesto Estimado</p><p className="text-2xl font-bold">€{resumenAnual.impuestoEstimado.toLocaleString()}</p></div>
              <div><p className="text-white/70 text-sm">Retenciones</p><p className="text-2xl font-bold">€{resumenAnual.retencionesAplicadas.toLocaleString()}</p></div>
              <div><p className="text-white/70 text-sm">A Pagar/Devolver</p><p className="text-2xl font-bold">€{resumenAnual.aPagar.toLocaleString()}</p></div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="obligaciones">
          <TabsList><TabsTrigger value="obligaciones">Obligaciones</TabsTrigger><TabsTrigger value="propiedades">Por Propiedad</TabsTrigger></TabsList>

          <TabsContent value="obligaciones" className="space-y-4 mt-4">
            {obligaciones.map((ob) => (
              <Card key={ob.id} className={ob.estado === 'pendiente' ? 'border-yellow-300' : ''}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">{ob.nombre}{getEstadoBadge(ob.estado)}</CardTitle>
                      <CardDescription>Periodo: {ob.periodo} • Vence: {new Date(ob.vence).toLocaleDateString('es-ES')}</CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">€{ob.importe.toLocaleString()}</p>
                      <div className="flex gap-2 mt-2">
                        {ob.estado === 'pendiente' && <Button size="sm">Presentar</Button>}
                        <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" />Descargar</Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="propiedades" className="space-y-4 mt-4">
            {propiedades.map((prop, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />{prop.nombre}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-muted/50 rounded-lg"><p className="text-sm text-muted-foreground">Valor Catastral</p><p className="text-lg font-bold">€{prop.valorCatastral.toLocaleString()}</p></div>
                    <div className="p-3 bg-muted/50 rounded-lg"><p className="text-sm text-muted-foreground">IBI Anual</p><p className="text-lg font-bold">€{prop.ibi.toLocaleString()}</p></div>
                    <div className="p-3 bg-muted/50 rounded-lg"><p className="text-sm text-muted-foreground">Ingresos</p><p className="text-lg font-bold text-green-600">€{prop.ingresos.toLocaleString()}</p></div>
                    <div className="p-3 bg-muted/50 rounded-lg"><p className="text-sm text-muted-foreground">Gastos Deducibles</p><p className="text-lg font-bold text-red-600">€{prop.gastos.toLocaleString()}</p></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
