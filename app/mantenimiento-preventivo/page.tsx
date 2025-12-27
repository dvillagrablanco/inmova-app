'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Calendar,
  Clock,
  Plus,
  Check,
  X,
  Building2,
  Home as HomeIcon,
  AlertCircle,
  Edit,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import logger, { logError } from '@/lib/logger';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MaintenanceSchedule {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  building?: any;
  unit?: any;
  frecuencia: string;
  proximaFecha: string;
  ultimaFecha?: string;
  diasAnticipacion: number;
  activo: boolean;
  provider?: any;
  costoEstimado?: number;
  notas?: string;
  createdAt: string;
}

export default function MantenimientoPreventivoPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (status !== 'authenticated') return;

      setIsLoading(true);
      try {
        const res = await fetch('/api/maintenance-schedule');
        if (res.ok) {
          const data = await res.json();
          setSchedules(data);
        }
      } catch (error) {
        logError(error instanceof Error ? error : new Error('Error loading schedules'), {
          context: 'fetchData',
        });
        toast.error('Error al cargar programaciones');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [status]);

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
      </AuthenticatedLayout>
    );
  }

  if (!session) return null;

  return (
    <AuthenticatedLayout>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">
                    <HomeIcon className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Mantenimiento Preventivo</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Mantenimiento Preventivo</h1>
              <p className="text-muted-foreground">Programa y gestiona tareas de mantenimiento</p>
            </div>
            <Button onClick={() => router.push('/mantenimiento-preventivo/nuevo')}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Programación
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{schedules.length}</div>
                <p className="text-xs text-muted-foreground">programaciones</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Activas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {schedules.filter((s) => s.activo).length}
                </div>
                <p className="text-xs text-muted-foreground">en ejecución</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Próximas 30 días</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {
                    schedules.filter((s) => {
                      const nextDate = new Date(s.proximaFecha);
                      const today = new Date();
                      const diffDays = Math.ceil(
                        (nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                      );
                      return diffDays >= 0 && diffDays <= 30;
                    }).length
                  }
                </div>
                <p className="text-xs text-muted-foreground">tareas pendientes</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Costo Est. Mensual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  €
                  {schedules
                    .filter((s) => s.activo)
                    .reduce((acc, s) => acc + (s.costoEstimado || 0), 0)
                    .toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">promedio</p>
              </CardContent>
            </Card>
          </div>

          {/* Schedules List */}
          {schedules.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay programaciones</h3>
                <p className="text-muted-foreground mb-4">
                  Crea tu primera programación de mantenimiento
                </p>
                <Button onClick={() => router.push('/mantenimiento-preventivo/nuevo')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Programación
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {schedules.map((schedule) => (
                <Card key={schedule.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{schedule.titulo}</CardTitle>
                        <p className="text-sm text-muted-foreground">{schedule.descripcion}</p>
                      </div>
                      <Badge variant={schedule.activo ? 'default' : 'secondary'}>
                        {schedule.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Tipo</p>
                        <p className="font-medium">{schedule.tipo}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Frecuencia</p>
                        <p className="font-medium">{schedule.frecuencia}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Próxima Fecha</p>
                        <p className="font-medium">
                          {format(new Date(schedule.proximaFecha), 'dd MMM yyyy', { locale: es })}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Costo Estimado</p>
                        <p className="font-medium">
                          {schedule.costoEstimado ? `€${schedule.costoEstimado}` : 'N/A'}
                        </p>
                      </div>
                    </div>
                    {schedule.building && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{schedule.building.nombre}</span>
                        {schedule.unit && <span>- Unidad {schedule.unit.numero}</span>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </AuthenticatedLayout>
  );
}
