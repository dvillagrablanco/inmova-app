'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Euro, TrendingUp, TrendingDown, Home, ArrowLeft, Download, Building2, Calendar, PieChart, BarChart3, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportesFinancierosPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    if (status === 'authenticated') setLoading(false);
    else if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const stats = {
    ingresos: 45680,
    gastos: 12340,
    beneficio: 33340,
    ocupacion: 92,
    morosidad: 3.2,
    rentabilidad: 7.8,
    ingresosChange: 12.5,
    gastosChange: -5.2,
  };

  const propiedades = [
    { nombre: 'Edificio Centro', ingresos: 18500, gastos: 4200, ocupacion: 95, rentabilidad: 8.2 },
    { nombre: 'Residencial Playa', ingresos: 12400, gastos: 3100, ocupacion: 88, rentabilidad: 7.1 },
    { nombre: 'Apartamentos Norte', ingresos: 14780, gastos: 5040, ocupacion: 94, rentabilidad: 7.6 },
  ];

  if (loading) {
    return <AuthenticatedLayout><div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div></AuthenticatedLayout>;
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}><ArrowLeft className="h-4 w-4 mr-2" />Volver</Button>
          <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbLink href="/reportes">Reportes</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>Financieros</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl"><Euro className="h-8 w-8 text-green-600" /></div>
            <div><h1 className="text-2xl sm:text-3xl font-bold">Reportes Financieros</h1><p className="text-muted-foreground">Análisis de ingresos, gastos y rentabilidad</p></div>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Este Mes</SelectItem>
                <SelectItem value="quarter">Trimestre</SelectItem>
                <SelectItem value="year">Año</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline"><Download className="h-4 w-4 mr-2" />Exportar</Button>
          </div>
        </div>

        {/* KPIs Principales */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Ingresos</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">€{stats.ingresos.toLocaleString()}</div>
              <p className="text-xs text-green-600 flex items-center"><ArrowUpRight className="h-3 w-3" />+{stats.ingresosChange}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Gastos</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">€{stats.gastos.toLocaleString()}</div>
              <p className="text-xs text-green-600 flex items-center"><ArrowDownRight className="h-3 w-3" />{stats.gastosChange}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Beneficio Neto</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">€{stats.beneficio.toLocaleString()}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Ocupación</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-blue-600">{stats.ocupacion}%</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Morosidad</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-orange-600">{stats.morosidad}%</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Rentabilidad</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-purple-600">{stats.rentabilidad}%</div></CardContent>
          </Card>
        </div>

        {/* Detalle por Propiedad */}
        <Card>
          <CardHeader><CardTitle>Rendimiento por Propiedad</CardTitle><CardDescription>Comparativa de ingresos y rentabilidad</CardDescription></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {propiedades.map((prop, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{prop.nombre}</p>
                      <p className="text-sm text-muted-foreground">Ocupación: {prop.ocupacion}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Ingresos</p>
                      <p className="font-bold text-green-600">€{prop.ingresos.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Gastos</p>
                      <p className="font-bold text-red-600">€{prop.gastos.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Rentabilidad</p>
                      <p className="font-bold text-purple-600">{prop.rentabilidad}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
