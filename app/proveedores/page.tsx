'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Users,
  Plus,
  Phone,
  Mail,
  Star,
  ArrowLeft,
  Home,
  Search,
  Briefcase,
  TrendingUp,
  Edit,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import logger, { logError } from '@/lib/logger';

interface Provider {
  id: string;
  nombre: string;
  tipo: string;
  telefono: string;
  email?: string;
  rating?: number;
  _count?: {
    maintenanceRequests: number;
    expenses: number;
  };
}

export default function ProveedoresPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { canCreate } = usePermissions();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({
    nombre: '',
    tipo: '',
    telefono: '',
    email: '',
    direccion: '',
    rating: '',
    notas: '',
  });
  const [editForm, setEditForm] = useState({
    nombre: '',
    tipo: '',
    telefono: '',
    email: '',
    direccion: '',
    rating: '',
    notas: '',
    activo: true,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchProviders();
    }
  }, [session]);

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/providers');
      if (res.ok) {
        const data = await res.json();
        setProviders(data);
      }
    } catch (error) {
      logger.error('Error fetching providers:', error);
      toast.error('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.tipo || !form.telefono) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          rating: form.rating ? parseFloat(form.rating) : null,
        }),
      });

      if (res.ok) {
        toast.success('Proveedor creado exitosamente');
        setOpenDialog(false);
        setForm({
          nombre: '',
          tipo: '',
          telefono: '',
          email: '',
          direccion: '',
          rating: '',
          notas: '',
        });
        fetchProviders();
      } else {
        toast.error('Error al crear proveedor');
      }
    } catch (error) {
      logger.error('Error creating provider:', error);
      toast.error('Error al crear proveedor');
    }
  };

  const handleOpenEdit = (provider: Provider) => {
    setEditingProvider(provider);
    setEditForm({
      nombre: provider.nombre || '',
      tipo: provider.tipo || '',
      telefono: provider.telefono || '',
      email: provider.email || '',
      direccion: (provider as any).direccion || '',
      rating: provider.rating?.toString() || '',
      notas: (provider as any).notas || '',
      activo: (provider as any).activo !== false,
    });
    setOpenEditDialog(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider || !editForm.nombre || !editForm.tipo || !editForm.telefono) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const res = await fetch(`/api/providers/${editingProvider.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          rating: editForm.rating ? parseFloat(editForm.rating) : null,
        }),
      });

      if (res.ok) {
        toast.success('Proveedor actualizado exitosamente');
        setOpenEditDialog(false);
        setEditingProvider(null);
        fetchProviders();
      } else {
        toast.error('Error al actualizar proveedor');
      }
    } catch (error) {
      logger.error('Error updating provider:', error);
      toast.error('Error al actualizar proveedor');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este proveedor?')) {
      return;
    }

    try {
      const res = await fetch(`/api/providers/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Proveedor eliminado exitosamente');
        fetchProviders();
      } else {
        toast.error('Error al eliminar proveedor');
      }
    } catch (error) {
      logger.error('Error deleting provider:', error);
      toast.error('Error al eliminar proveedor');
    }
  };

  // Filtrado de proveedores
  const filteredProviders = useMemo(() => {
    return providers.filter(
      (provider) =>
        searchTerm === '' ||
        provider.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [providers, searchTerm]);

  // Estadísticas
  const stats = useMemo(() => {
    return {
      total: providers.length,
      conTrabajos: providers.filter((p) => (p._count?.maintenanceRequests || 0) > 0).length,
      rating5: providers.filter((p) => p.rating === 5).length,
      totalTrabajos: providers.reduce((sum, p) => sum + (p._count?.maintenanceRequests || 0), 0),
    };
  }, [providers]);

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <LoadingState message="Cargando proveedores..." />
      </AuthenticatedLayout>
    );
  }

  if (!session) return null;

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Botón Volver y Breadcrumbs */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="gap-2"
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
                <BreadcrumbPage>Proveedores</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
            <p className="text-muted-foreground">Gestiona los proveedores de servicios</p>
          </div>
          {canCreate && (
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Proveedor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuevo Proveedor</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="tipo">Tipo de servicio *</Label>
                    <Input
                      id="tipo"
                      value={form.tipo}
                      onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                      placeholder="Ej: Fontanería, Electricidad, Limpieza..."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefono">Teléfono *</Label>
                    <Input
                      id="telefono"
                      type="tel"
                      value={form.telefono}
                      onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="direccion">Dirección</Label>
                    <Input
                      id="direccion"
                      value={form.direccion}
                      onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rating">Valoración (1-5)</Label>
                    <Input
                      id="rating"
                      type="number"
                      min="1"
                      max="5"
                      step="0.5"
                      value={form.rating}
                      onChange={(e) => setForm({ ...form, rating: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notas">Notas</Label>
                    <Input
                      id="notas"
                      value={form.notas}
                      onChange={(e) => setForm({ ...form, notas: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Crear Proveedor</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Diálogo de Edición */}
        <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Proveedor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <Label htmlFor="edit-nombre">Nombre *</Label>
                <Input
                  id="edit-nombre"
                  value={editForm.nombre}
                  onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-tipo">Tipo de servicio *</Label>
                <Input
                  id="edit-tipo"
                  value={editForm.tipo}
                  onChange={(e) => setEditForm({ ...editForm, tipo: e.target.value })}
                  placeholder="Ej: Fontanería, Electricidad, Limpieza..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-telefono">Teléfono *</Label>
                <Input
                  id="edit-telefono"
                  type="tel"
                  value={editForm.telefono}
                  onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-direccion">Dirección</Label>
                <Input
                  id="edit-direccion"
                  value={editForm.direccion}
                  onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-rating">Valoración (1-5)</Label>
                <Input
                  id="edit-rating"
                  type="number"
                  min="1"
                  max="5"
                  step="0.5"
                  value={editForm.rating}
                  onChange={(e) => setEditForm({ ...editForm, rating: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-notas">Notas</Label>
                <Input
                  id="edit-notas"
                  value={editForm.notas}
                  onChange={(e) => setEditForm({ ...editForm, notas: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpenEditDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Guardar Cambios</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Con Trabajos
              </CardTitle>
              <Briefcase className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conTrabajos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rating 5⭐
              </CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rating5}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Trabajos
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTrabajos}</div>
            </CardContent>
          </Card>
        </div>

        {/* Búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle>Buscar Proveedores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, tipo o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de Proveedores */}
        <div className="space-y-4">
          {filteredProviders.length === 0 ? (
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title={
                searchTerm ? 'No se encontraron proveedores' : 'No hay proveedores registrados'
              }
              description={
                searchTerm
                  ? 'No se encontraron proveedores con los filtros aplicados. Intenta ajustar tu búsqueda.'
                  : 'Comienza registrando tu primer proveedor de servicios para gestionar el mantenimiento.'
              }
              action={
                canCreate && !searchTerm
                  ? {
                      label: 'Registrar Primer Proveedor',
                      onClick: () => setOpenDialog(true),
                      icon: <Plus className="h-4 w-4" />,
                    }
                  : undefined
              }
            />
          ) : (
            filteredProviders.map((provider) => (
              <Card key={provider.id} className="hover:shadow-lg transition-all duration-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Icono */}
                    <div className="flex-shrink-0">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Briefcase className="h-6 w-6 text-primary" />
                      </div>
                    </div>

                    {/* Información Principal */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <h3 className="text-lg font-semibold break-words flex-1">
                          {provider.nombre}
                        </h3>
                        <Badge variant="outline">{provider.tipo}</Badge>
                      </div>

                      {/* Contacto */}
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-primary" />
                          <a
                            href={`tel:${provider.telefono}`}
                            className="font-medium hover:underline"
                          >
                            {provider.telefono}
                          </a>
                        </div>
                        {provider.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-primary" />
                            <a
                              href={`mailto:${provider.email}`}
                              className="font-medium hover:underline"
                            >
                              {provider.email}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Estadísticas */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {provider.rating && (
                          <div className="space-y-1">
                            <div className="text-muted-foreground flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                              Valoración
                            </div>
                            <div className="font-bold text-lg">{provider.rating}/5</div>
                          </div>
                        )}
                        {provider._count && (
                          <div className="space-y-1">
                            <div className="text-muted-foreground">Trabajos Realizados</div>
                            <div className="font-bold text-lg">
                              {provider._count.maintenanceRequests || 0}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="flex gap-2 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(provider)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(provider.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
