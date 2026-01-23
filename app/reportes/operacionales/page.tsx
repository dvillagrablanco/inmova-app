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
import { Progress } from '@/components/ui/progress';
import { Settings, Home, ArrowLeft, Download, Users, FileText, Clock, CheckCircle2, AlertTriangle, Building2, Wrench, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportesOperacionalesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') setLoading(false);
    else if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const stats = {
    propiedades: 12, unidades: 48, inquilinosActivos: 42, contratosActivos: 42,
    contratosPorVencer: 5, incidenciasAbiertas: 8, incidenciasResueltas: 156,
    tiempoMedioResolucion: '2.3 días', ocupacionMedia: 87.5,
  };

  const contratosPorVencer = [
    { inquilino: 'María García', propiedad: 'Edificio Centro 3A', vence: '2025-02-15', diasRestantes: 23 },
    { inquilino: 'Juan Martínez', propiedad: 'Residencial Playa 2B', vence: '2025-02-28', diasRestantes: 36 },
    { inquilino: 'Ana López', propiedad: 'Apartamentos Norte 1C', vence: '2025-03-10', diasRestantes: 46 },
  ];

  if (loading) {
    return <AuthenticatedLayout><div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div></AuthenticatedLayout>;
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}><ArrowLeft className="h-4 w-4 mr-2" />Volver</Button>
          <Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbLink href="/reportes">Reportes</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>Operacionales</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl"><Settings className="h-8 w-8 text-blue-600" /></div>
            <div><h1 className="text-2xl sm:text-3xl font-bold">Reportes Operacionales</h1><p className="text-muted-foreground">Estado de propiedades, contratos e incidencias</p></div>
          </div>
          <Button variant="outline"><Download className="h-4 w-4 mr-2" />Exportar</Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Propiedades</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{stats.propiedades}</div><p className="text-xs text-muted-foreground">{stats.unidades} unidades</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Inquilinos Activos</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-green-600">{stats.inquilinosActivos}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Contratos por Vencer</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-orange-600">{stats.contratosPorVencer}</div><p className="text-xs text-muted-foreground">Próximos 90 días</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Incidencias Abiertas</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-red-600">{stats.incidenciasAbiertas}</div></CardContent></Card>
        </div>

        {/* Ocupación */}
        <Card>
          <CardHeader><CardTitle>Tasa de Ocupación</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Progress value={stats.ocupacionMedia} className="flex-1 h-4" />
              <span className="text-2xl font-bold">{stats.ocupacionMedia}%</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{stats.inquilinosActivos} de {stats.unidades} unidades ocupadas</p>
          </CardContent>
        </Card>

        {/* Contratos por Vencer */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-orange-500" />Contratos por Vencer</CardTitle><CardDescription>Próximos 90 días - requieren atención</CardDescription></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {contratosPorVencer.map((contrato, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium">{contrato.inquilino}</p>
                      <p className="text-sm text-muted-foreground">{contrato.propiedad}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-orange-100 text-orange-800">{contrato.diasRestantes} días</Badge>
                    <p className="text-xs text-muted-foreground mt-1">Vence: {new Date(contrato.vence).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Métricas de Mantenimiento */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" />Métricas de Mantenimiento</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-600">{stats.incidenciasResueltas}</p>
                <p className="text-sm text-muted-foreground">Resueltas (año)</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-red-600">{stats.incidenciasAbiertas}</p>
                <p className="text-sm text-muted-foreground">Abiertas</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-blue-600">{stats.tiempoMedioResolucion}</p>
                <p className="text-sm text-muted-foreground">Tiempo medio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
