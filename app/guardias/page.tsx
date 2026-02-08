'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Shield,
  Plus,
  Calendar,
  User,
  Home,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Phone,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Guardia {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tipo: string;
  responsable: string;
  telefono?: string;
  observaciones?: string;
  building?: {
    nombre: string;
  };
}

export default function GuardiasPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isDemoMode = process.env.NODE_ENV !== 'production';
  const [guardias, setGuardias] = useState<Guardia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [guardiaToDelete, setGuardiaToDelete] = useState<Guardia | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    fecha: '',
    horaInicio: '00:00',
    horaFin: '08:00',
    tipo: 'NOCTURNA',
    responsable: '',
    telefono: '',
    observaciones: '',
  });

  useEffect(() => {
    if (session) {
      if (!isDemoMode) {
        setIsLoading(false);
        setGuardias([]);
        return;
      }
      // Simular carga - en producción conectar con API
      setIsLoading(false);
      setGuardias([]);
    }
  }, [session, isDemoMode]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDemoMode) {
      toast.error('Funcionalidad no disponible en producción');
      return;
    }
    setIsSaving(true);
    try {
      // En producción: POST /api/guardias
      await new Promise((resolve) => setTimeout(resolve, 500));

      const nuevaGuardia = {
        id: Date.now().toString(),
        ...formData,
      };

      setGuardias([...guardias, nuevaGuardia]);
      toast.success('Guardia creada correctamente');
      setCreateDialogOpen(false);
      setFormData({
        fecha: '',
        horaInicio: '00:00',
        horaFin: '08:00',
        tipo: 'NOCTURNA',
        responsable: '',
        telefono: '',
        observaciones: '',
      });
    } catch (error) {
      toast.error('Error al crear guardia');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!guardiaToDelete) return;
    if (!isDemoMode) {
      toast.error('Funcionalidad no disponible en producción');
      setDeleteDialogOpen(false);
      setGuardiaToDelete(null);
      return;
    }
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setGuardias((prev) => prev.filter((g) => g.id !== guardiaToDelete.id));
      toast.success('Guardia eliminada');
      setDeleteDialogOpen(false);
      setGuardiaToDelete(null);
    } catch (error) {
      toast.error('Error al eliminar guardia');
    } finally {
      setIsSaving(false);
    }
  };

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
                  <BreadcrumbPage>Guardias</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Guardias</h1>
                <p className="text-sm text-muted-foreground">Gestión de turnos de guardias</p>
                {!isDemoMode && (
                  <Badge variant="secondary" className="mt-2">
                    Funcionalidad no disponible en producción
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Button onClick={() => setCreateDialogOpen(true)} disabled={!isDemoMode}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Guardia
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Calendario de Guardias</CardTitle>
          </CardHeader>
          <CardContent>
            {guardias.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay guardias programadas</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Comienza programando la primera guardia
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Guardia
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guardias.map((guardia) => (
                    <TableRow key={guardia.id}>
                      <TableCell>
                        {format(new Date(guardia.fecha), 'dd/MM/yyyy', {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell>
                        {guardia.horaInicio} - {guardia.horaFin}
                      </TableCell>
                      <TableCell>
                        <Badge>{guardia.tipo}</Badge>
                      </TableCell>
                      <TableCell>{guardia.responsable}</TableCell>
                      <TableCell>{guardia.telefono}</TableCell>
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
                                setGuardiaToDelete(guardia);
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
              <DialogTitle>Nueva Guardia</DialogTitle>
              <DialogDescription>Programa un turno de guardia</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Fecha *</Label>
                  <Input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hora Inicio</Label>
                    <Input
                      type="time"
                      value={formData.horaInicio}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          horaInicio: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora Fin</Label>
                    <Input
                      type="time"
                      value={formData.horaFin}
                      onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DIURNA">Diurna</SelectItem>
                      <SelectItem value="NOCTURNA">Nocturna</SelectItem>
                      <SelectItem value="FESTIVO">Festivo</SelectItem>
                      <SelectItem value="EMERGENCIA">Emergencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Responsable *</Label>
                  <Input
                    value={formData.responsable}
                    onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                    placeholder="Nombre del responsable"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="+34 600 000 000"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Creando...' : 'Crear Guardia'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar guardia?</DialogTitle>
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
