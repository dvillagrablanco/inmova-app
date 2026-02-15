'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Progress } from '@/components/ui/progress';
import { Settings, Home, ArrowLeft, Download, Users, Clock, CheckCircle2, AlertTriangle, Wrench, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface OperationalStats {
  propiedades: number;
  unidades: number;
  unidadesOcupadas: number;
  inquilinosActivos: number;
  contratosActivos: number;
  contratosPorVencer: number;
  incidenciasAbiertas: number;
  incidenciasEnProgreso: number;
  incidenciasResueltas: number;
  tiempoMedioResolucion: string;
  ocupacionMedia: number;
}

interface ContratoPorVencer {
  id: string;
  inquilino: string;
  propiedad: string;
  unidad: string;
  vence: string;
  diasRestantes: number;
}

export default function ReportesOperacionalesPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OperationalStats | null>(null);
  const [contratosPorVencer, setContratosPorVencer] = useState<ContratoPorVencer[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reportes/operacionales');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setContratosPorVencer(data.contratosPorVencer || []);
      } else {
        toast.error('Error al cargar datos operacionales');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') fetchData();
    else if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const s = stats || {
    propiedades: 0, unidades: 0, unidadesOcupadas: 0, inquilinosActivos: 0,
    contratosActivos: 0, contratosPorVencer: 0, incidenciasAbiertas: 0,
    incidenciasEnProgreso: 0, incidenciasResueltas: 0,
    tiempoMedioResolucion: '-', ocupacionMedia: 0,
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />Volver
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink href="/reportes">Reportes</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Operacionales</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl"><Settings className="h-8 w-8 text-blue-600" /></div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Reportes Operacionales</h1>
              <p className="text-muted-foreground">Estado de propiedades, contratos e incidencias</p>
            </div>
          </div>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />Actualizar
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Propiedades</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{s.propiedades}</div>
              <p className="text-xs text-muted-foreground">{s.unidades} unidades</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Inquilinos Activos</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-green-600">{s.inquilinosActivos}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Contratos por Vencer</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{s.contratosPorVencer}</div>
              <p className="text-xs text-muted-foreground">Proximos 90 dias</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Incidencias Abiertas</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-red-600">{s.incidenciasAbiertas}</div></CardContent>
          </Card>
        </div>

        {/* Ocupacion */}
        <Card>
          <CardHeader><CardTitle>Tasa de Ocupacion</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Progress value={s.ocupacionMedia} className="flex-1 h-4" />
              <span className="text-2xl font-bold">{s.ocupacionMedia.toFixed(1)}%</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {s.unidadesOcupadas} de {s.unidades} unidades ocupadas
            </p>
          </CardContent>
        </Card>

        {/* Contratos por Vencer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Contratos por Vencer
            </CardTitle>
            <CardDescription>Proximos 90 dias - requieren atencion</CardDescription>
          </CardHeader>
          <CardContent>
            {contratosPorVencer.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500" />
                <p>No hay contratos por vencer en los proximos 90 dias</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contratosPorVencer.map((contrato) => (
                  <div key={contrato.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium">{contrato.inquilino}</p>
                        <p className="text-sm text-muted-foreground">{contrato.propiedad} - {contrato.unidad}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="bg-orange-100 text-orange-800">
                        {contrato.diasRestantes} dias
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Vence: {new Date(contrato.vence).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metricas de Mantenimiento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />Metricas de Mantenimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-600">{s.incidenciasResueltas}</p>
                <p className="text-sm text-muted-foreground">Resueltas</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-red-600">{s.incidenciasAbiertas + s.incidenciasEnProgreso}</p>
                <p className="text-sm text-muted-foreground">Abiertas</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-blue-600">{s.tiempoMedioResolucion}</p>
                <p className="text-sm text-muted-foreground">Tiempo medio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
