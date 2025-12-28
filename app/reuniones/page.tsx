'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import {
  Home,
  ArrowLeft,
  Calendar as CalendarIcon,
  Plus,
  FileText,
  Users,
  Edit,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Reunion {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  lugar: string;
  ordenDia: any[];
  asistentes: any[];
  actaGenerada: boolean;
  building: { id: string; nombre: string };
}

export default function ReunionesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reuniones, setReuniones] = useState<Reunion[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingReunion, setEditingReunion] = useState<Reunion | null>(null);
  const [formData, setFormData] = useState({
    buildingId: '',
    titulo: '',
    descripcion: '',
    fecha: '',
    lugar: '',
    ordenDia: [{ titulo: '' }],
    asistentes: [{ nombre: '' }],
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') {
      loadData();
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      const [reunionesRes, buildingsRes] = await Promise.all([
        fetch('/api/reuniones'),
        fetch('/api/buildings'),
      ]);
      if (reunionesRes.ok) setReuniones(await reunionesRes.json());
      if (buildingsRes.ok) setBuildings(await buildingsRes.json());
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.buildingId || !formData.titulo || !formData.fecha) {
      toast.error('Completa los campos requeridos');
      return;
    }
    try {
      const res = await fetch('/api/reuniones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success('Reunión creada');
        setOpenDialog(false);
        loadData();
      }
    } catch (error) {
      toast.error('Error al crear reunión');
    }
  };

  const handleGenerarActa = async (id: string) => {
    try {
      const res = await fetch(`/api/reuniones/${id}/generar-acta`, { method: 'POST' });
      if (res.ok) {
        toast.success('Acta generada');
        loadData();
      }
    } catch (error) {
      toast.error('Error al generar acta');
    }
  };

  const handleEdit = (reunion: Reunion) => {
    setEditingReunion(reunion);
    setFormData({
      buildingId: reunion.building.id,
      titulo: reunion.titulo,
      descripcion: reunion.descripcion,
      fecha: format(new Date(reunion.fecha), "yyyy-MM-dd'T'HH:mm"),
      lugar: reunion.lugar,
      ordenDia: reunion.ordenDia.length > 0 ? reunion.ordenDia : [{ titulo: '' }],
      asistentes: reunion.asistentes.length > 0 ? reunion.asistentes : [{ nombre: '' }],
    });
    setOpenEditDialog(true);
  };

  const handleUpdate = async () => {
    if (!editingReunion) return;
    try {
      if (!formData.buildingId || !formData.titulo || !formData.fecha) {
        toast.error('Por favor completa los campos requeridos');
        return;
      }

      const res = await fetch(`/api/reuniones/${editingReunion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Reunión actualizada correctamente');
        setOpenEditDialog(false);
        setEditingReunion(null);
        resetForm();
        loadData();
      } else {
        toast.error('Error al actualizar reunión');
      }
    } catch (error) {
      toast.error('Error al actualizar reunión');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta reunión?')) return;
    try {
      const res = await fetch(`/api/reuniones/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Reunión eliminada correctamente');
        loadData();
      } else {
        toast.error('Error al eliminar reunión');
      }
    } catch (error) {
      toast.error('Error al eliminar reunión');
    }
  };

  const resetForm = () => {
    setFormData({
      buildingId: '',
      titulo: '',
      descripcion: '',
      fecha: '',
      lugar: '',
      ordenDia: [{ titulo: '' }],
      asistentes: [{ nombre: '' }],
    });
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <SkeletonCard />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="gap-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Dashboard
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Actas de Reuniones</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold">Actas de Reuniones y Juntas</h1>
              <p className="text-muted-foreground">Gestión de reuniones y generación de actas</p>
            </div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Convocar Reunión
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nueva Reunión</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Edificio *</Label>
                    <Select
                      value={formData.buildingId}
                      onValueChange={(v) => setFormData({ ...formData, buildingId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {buildings.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Título *</Label>
                    <Input
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha y Hora *</Label>
                    <Input
                      type="datetime-local"
                      value={formData.fecha}
                      onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lugar *</Label>
                    <Input
                      value={formData.lugar}
                      onChange={(e) => setFormData({ ...formData, lugar: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpenDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit}>Crear</Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Dialog de Edición */}
            <Dialog
              open={openEditDialog}
              onOpenChange={(open) => {
                setOpenEditDialog(open);
                if (!open) {
                  setEditingReunion(null);
                  resetForm();
                }
              }}
            >
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Editar Reunión</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Edificio *</Label>
                    <Select
                      value={formData.buildingId}
                      onValueChange={(value) => setFormData({ ...formData, buildingId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar edificio" />
                      </SelectTrigger>
                      <SelectContent>
                        {buildings.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Título *</Label>
                    <Input
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción *</Label>
                    <Textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha y Hora *</Label>
                    <Input
                      type="datetime-local"
                      value={formData.fecha}
                      onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lugar *</Label>
                    <Input
                      value={formData.lugar}
                      onChange={(e) => setFormData({ ...formData, lugar: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setOpenEditDialog(false);
                      setEditingReunion(null);
                      resetForm();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleUpdate}>Actualizar Reunión</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Reuniones</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reuniones.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Próximas</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reuniones.filter((r) => new Date(r.fecha) > new Date()).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Actas Generadas</CardTitle>
              <FileText className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reuniones.filter((r) => r.actaGenerada).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4">
          {reuniones.length === 0 ? (
            <EmptyState
              icon={CalendarIcon}
              title="No hay reuniones programadas"
              description="Convoca reuniones de comunidad y genera actas automáticamente"
            />
          ) : (
            reuniones.map((reunion) => (
              <Card key={reunion.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{reunion.titulo}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{reunion.descripcion}</p>
                    </div>
                    {reunion.actaGenerada && <Badge>Acta Generada</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(new Date(reunion.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{reunion.asistentes.length} asistentes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{reunion.ordenDia.length} puntos</span>
                      </div>
                      <div className="text-muted-foreground">{reunion.building.nombre}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!reunion.actaGenerada && new Date(reunion.fecha) < new Date() && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleGenerarActa(reunion.id)}
                          className="gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          Generar Acta
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(reunion)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(reunion.id)}
                        className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
