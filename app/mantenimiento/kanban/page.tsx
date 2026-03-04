'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { GripVertical, ChevronRight, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MaintenanceRequest {
  id: string;
  titulo: string;
  descripcion: string;
  prioridad: string;
  estado: string;
  fechaSolicitud: string;
  unit?: {
    numero: string;
    building?: { nombre?: string };
  };
}

const COLUMNS = [
  { id: 'pendiente', label: 'Pendiente', estados: ['pendiente'] },
  { id: 'en_progreso', label: 'En Progreso', estados: ['en_progreso', 'programado'] },
  { id: 'resuelto', label: 'Resuelto', estados: ['completado'] },
] as const;

function getNextEstado(current: string): string | null {
  if (current === 'pendiente') return 'en_progreso';
  if (current === 'en_progreso' || current === 'programado') return 'completado';
  return null;
}

export default function MantenimientoKanbanPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        const res = await fetch('/api/maintenance');
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.data ?? [];
        setRequests(list);
      } catch {
        toast.error('Error al cargar solicitudes');
      } finally {
        setLoading(false);
      }
    })();
  }, [session]);

  const handleStatusChange = async (id: string, newEstado: string) => {
    setUpdating((s) => new Set(s).add(id));
    try {
      const res = await fetch(`/api/maintenance/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newEstado }),
      });
      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, estado: newEstado } : r))
        );
        toast.success('Estado actualizado');
      } else {
        toast.error('Error al actualizar');
      }
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setUpdating((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }
  };

  const getPrioridadBadge = (prioridad: string) => {
    const config: Record<string, string> = {
      alta: 'bg-red-500/15 text-red-600 border-red-200',
      media: 'bg-amber-500/15 text-amber-600 border-amber-200',
      baja: 'bg-green-500/15 text-green-600 border-green-200',
    };
    return config[prioridad] ?? 'bg-gray-500/15 text-gray-600 border-gray-200';
  };

  const getRequestsForColumn = (estados: readonly string[]) =>
    requests.filter((r) => estados.includes(r.estado));

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/mantenimiento">Mantenimiento</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Vista Kanban</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-2">
          <LayoutGrid className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Vista Kanban</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const colRequests = getRequestsForColumn(col.estados);
            return (
              <div
                key={col.id}
                className="rounded-lg border bg-muted/30 p-4 min-h-[400px]"
              >
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <span>{col.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {colRequests.length}
                  </Badge>
                </h3>
                <div className="space-y-3">
                  {colRequests.map((req) => {
                    const nextEstado = getNextEstado(req.estado);
                    const isUpdating = updating.has(req.id);
                    const unidad =
                      req.unit?.building?.nombre && req.unit?.numero
                        ? `${req.unit.building.nombre} - ${req.unit.numero}`
                        : req.unit?.numero ?? '-';

                    return (
                      <Card
                        key={req.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => router.push(`/mantenimiento/${req.id}`)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <div className="flex items-center text-muted-foreground mt-0.5 cursor-grab">
                              <GripVertical className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {req.titulo}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {unidad}
                              </p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getPrioridadBadge(req.prioridad)}`}
                                >
                                  {req.prioridad}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(
                                    new Date(req.fechaSolicitud),
                                    'd MMM yyyy',
                                    { locale: es }
                                  )}
                                </span>
                              </div>
                              {nextEstado && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mt-2 h-7 text-xs"
                                  disabled={isUpdating}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(req.id, nextEstado);
                                  }}
                                >
                                  {isUpdating ? (
                                    '...'
                                  ) : (
                                    <>
                                      {req.estado === 'pendiente'
                                        ? 'En progreso'
                                        : 'Resolver'}
                                      <ChevronRight className="h-3 w-3 ml-1" />
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {colRequests.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Sin solicitudes
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
