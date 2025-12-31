'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Plane,
  Plus,
  Calendar,
  User,
  Home,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface Vacacion {
  id: string;
  empleado: string;
  fechaInicio: string;
  fechaFin: string;
  diasSolicitados: number;
  estado: string;
  observaciones?: string;
}

export default function VacacionesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [vacaciones, setVacaciones] = useState<Vacacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vacacionToDelete, setVacacionToDelete] = useState<Vacacion | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    empleado: '',
    fechaInicio: '',
    fechaFin: '',
    observaciones: '',
  });

  useEffect(() => {
    if (session) {
      setIsLoading(false);
      setVacaciones([]);
    }
  }, [session]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const diasSolicitados =
      differenceInDays(new Date(formData.fechaFin), new Date(formData.fechaInicio)) + 1;

    setIsSaving(true);
    try {
      const nuevaVacacion = {
        id: Date.now().toString(),
        ...formData,
        diasSolicitados,
        estado: 'PENDIENTE',
      };

      setVacaciones([...vacaciones, nuevaVacacion]);
      toast.success('Solicitud de vacaciones creada');
      setCreateDialogOpen(false);
      setFormData({
        empleado: '',
        fechaInicio: '',
        fechaFin: '',
        observaciones: '',
      });
    } catch (error) {
      toast.error('Error al crear solicitud');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!vacacionToDelete) return;
    setIsSaving(true);
    try {
      setVacaciones((prev) => prev.filter((v) => v.id !== vacacionToDelete.id));
      toast.success('Vacación eliminada');
      setDeleteDialogOpen(false);
      setVacacionToDelete(null);
    } catch (error) {
      toast.error('Error al eliminar');
    } finally {
      setIsSaving(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'APROBADA':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Aprobada
          </Badge>
        );
      case 'RECHAZADA':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rechazada
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Pendiente
          </Badge>
        );
    }
  };

  const stats = {
    total: vacaciones.length,
    pendientes: vacaciones.filter((v) => v.estado === 'PENDIENTE').length,
    aprobadas: vacaciones.filter((v) => v.estado === 'APROBADA').length,
    totalDias: vacaciones.reduce((sum, v) => sum + v.diasSolicitados, 0),
  };

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <Skeleton className="h-96" />
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Vacaciones</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-3">
              <Plane className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Vacaciones</h1>
                <p className="text-sm text-muted-foreground">
                  Gestión de solicitudes de vacaciones
                </p>
              </div>
            </div>
          </div>

          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Solicitud
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendientes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.aprobadas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Días Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDias}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Solicitudes de Vacaciones</CardTitle>
          </CardHeader>
          <CardContent>
            {vacaciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Plane className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay solicitudes</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Crea la primera solicitud de vacaciones
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Solicitud
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Inicio</TableHead>
                    <TableHead>Fin</TableHead>
                    <TableHead>Días</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vacaciones.map((vacacion) => (
                    <TableRow key={vacacion.id}>
                      <TableCell className="font-medium">{vacacion.empleado}</TableCell>
                      <TableCell>{format(new Date(vacacion.fechaInicio), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{format(new Date(vacacion.fechaFin), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{vacacion.diasSolicitados}</TableCell>
                      <TableCell>{getEstadoBadge(vacacion.estado)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setVacacionToDelete(vacacion);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Solicitud de Vacaciones</DialogTitle>
              <DialogDescription>Solicita días de vacaciones</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Empleado *</Label>
                  <Input
                    value={formData.empleado}
                    onChange={(e) => setFormData({ ...formData, empleado: e.target.value })}
                    placeholder="Nombre del empleado"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha Inicio *</Label>
                    <Input
                      type="date"
                      value={formData.fechaInicio}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fechaInicio: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha Fin *</Label>
                    <Input
                      type="date"
                      value={formData.fechaFin}
                      onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {formData.fechaInicio && formData.fechaFin && (
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    <strong>Días solicitados:</strong>{' '}
                    {differenceInDays(new Date(formData.fechaFin), new Date(formData.fechaInicio)) +
                      1}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Creando...' : 'Crear Solicitud'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar solicitud?</DialogTitle>
              <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
                {isSaving ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
