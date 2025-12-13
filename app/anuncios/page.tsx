'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/lazy-dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { FilterChips } from '@/components/ui/filter-chips';
import {
  Home,
  ArrowLeft,
  Megaphone,
  Plus,
  AlertTriangle,
  Info,
  Calendar as CalendarIcon,
  Users,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  FileText,
  Bell,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import logger, { logError } from '@/lib/logger';

interface Anuncio {
  id: string;
  titulo: string;
  contenido: string;
  tipo: 'informativo' | 'aviso' | 'evento' | 'urgente';
  prioridad: 'normal' | 'alta' | 'urgente';
  fechaPublicacion: string;
  fechaExpiracion: string | null;
  adjuntos: any[];
  visiblePara: string;
  vistas: number;
  activo: boolean;
  building: {
    id: string;
    nombre: string;
  };
  publicadoPor: string;
  createdAt: string;
}

function AnunciosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAnuncio, setEditingAnuncio] = useState<Anuncio | null>(null);
  const [filterActivo, setFilterActivo] = useState<string>('activos');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    buildingId: '',
    titulo: '',
    contenido: '',
    tipo: 'informativo' as 'informativo' | 'aviso' | 'evento' | 'urgente',
    prioridad: 'normal' as 'normal' | 'alta' | 'urgente',
    fechaExpiracion: '',
    visiblePara: 'todos',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadAnuncios();
      loadBuildings();
    }
  }, [status]);

  const loadAnuncios = async () => {
    try {
      const res = await fetch('/api/anuncios');
      if (res.ok) {
        const data = await res.json();
        setAnuncios(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      logger.error('Error al cargar anuncios:', error);
      toast.error('Error al cargar anuncios');
    } finally {
      setLoading(false);
    }
  };

  const loadBuildings = async () => {
    try {
      const res = await fetch('/api/buildings');
      if (res.ok) {
        const data = await res.json();
        setBuildings(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      logger.error('Error al cargar edificios:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.buildingId || !formData.titulo || !formData.contenido) {
        toast.error('Por favor completa los campos requeridos');
        return;
      }

      const url = editingAnuncio ? `/api/anuncios/${editingAnuncio.id}` : '/api/anuncios';
      const method = editingAnuncio ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fechaExpiracion: formData.fechaExpiracion || null,
        }),
      });

      if (res.ok) {
        toast.success(
          editingAnuncio ? 'Anuncio actualizado correctamente' : 'Anuncio publicado correctamente'
        );
        setOpenDialog(false);
        setEditingAnuncio(null);
        loadAnuncios();
        resetForm();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al guardar anuncio');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al guardar anuncio');
    }
  };

  const handleEdit = (anuncio: Anuncio) => {
    setEditingAnuncio(anuncio);
    setFormData({
      buildingId: anuncio.building.id,
      titulo: anuncio.titulo,
      contenido: anuncio.contenido,
      tipo: anuncio.tipo,
      prioridad: anuncio.prioridad,
      fechaExpiracion: anuncio.fechaExpiracion
        ? format(new Date(anuncio.fechaExpiracion), "yyyy-MM-dd'T'HH:mm")
        : '',
      visiblePara: anuncio.visiblePara,
    });
    setOpenDialog(true);
  };

  const handleDelete = async (anuncioId: string) => {
    if (!confirm('¿Estás seguro de desactivar este anuncio?')) return;

    try {
      const res = await fetch(`/api/anuncios/${anuncioId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Anuncio desactivado');
        loadAnuncios();
      } else {
        toast.error('Error al desactivar anuncio');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al desactivar anuncio');
    }
  };

  const resetForm = () => {
    setFormData({
      buildingId: '',
      titulo: '',
      contenido: '',
      tipo: 'informativo',
      prioridad: 'normal',
      fechaExpiracion: '',
      visiblePara: 'todos',
    });
  };

  const anunciosFiltrados = useMemo(() => {
    let filtered = anuncios;

    // Filtrar por estado activo
    if (filterActivo === 'activos') {
      filtered = filtered.filter((a) => a.activo);
    } else if (filterActivo === 'inactivos') {
      filtered = filtered.filter((a) => !a.activo);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (a) =>
          a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.contenido.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.building.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort(
      (a, b) => new Date(b.fechaPublicacion).getTime() - new Date(a.fechaPublicacion).getTime()
    );
  }, [anuncios, filterActivo, searchTerm]);

  // KPIs
  const totalAnuncios = anuncios.length;
  const anunciosActivos = anuncios.filter((a) => a.activo).length;
  const anunciosUrgentes = anuncios.filter((a) => a.activo && a.prioridad === 'urgente').length;
  const totalVistas = anuncios.reduce((sum, a) => sum + (a.vistas || 0), 0);

  const isAdmin = session?.user?.role === 'administrador' || session?.user?.role === 'gestor';

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              <SkeletonCard />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver al Dashboard
                </Button>
              </div>

              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">
                      <Home className="h-4 w-4" />
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Anuncios y Tablón Digital</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">Anuncios y Tablón Digital</h1>
                  <p className="text-muted-foreground mt-1">
                    Comunicaciones oficiales de la comunidad
                  </p>
                </div>
                {isAdmin && (
                  <Dialog
                    open={openDialog}
                    onOpenChange={(open: boolean) => {
                      setOpenDialog(open);
                      if (!open) {
                        setEditingAnuncio(null);
                        resetForm();
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Publicar Anuncio
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingAnuncio ? 'Editar Anuncio' : 'Publicar Nuevo Anuncio'}
                        </DialogTitle>
                        <DialogDescription>
                          Completa la información del anuncio para la comunidad
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="building">Edificio *</Label>
                          <Select
                            value={formData.buildingId}
                            onValueChange={(value) =>
                              setFormData({ ...formData, buildingId: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar edificio" />
                            </SelectTrigger>
                            <SelectContent>
                              {buildings.map((building) => (
                                <SelectItem key={building.id} value={building.id}>
                                  {building.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="titulo">Título *</Label>
                          <Input
                            id="titulo"
                            value={formData.titulo}
                            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                            placeholder="Ej: Mantenimiento programado del ascensor"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="contenido">Contenido *</Label>
                          <Textarea
                            id="contenido"
                            value={formData.contenido}
                            onChange={(e) =>
                              setFormData({ ...formData, contenido: e.target.value })
                            }
                            placeholder="Describe el anuncio en detalle..."
                            rows={6}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="tipo">Tipo de Anuncio</Label>
                            <Select
                              value={formData.tipo}
                              onValueChange={(value: any) =>
                                setFormData({ ...formData, tipo: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="informativo">Informativo</SelectItem>
                                <SelectItem value="aviso">Aviso</SelectItem>
                                <SelectItem value="evento">Evento</SelectItem>
                                <SelectItem value="urgente">Urgente</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="prioridad">Prioridad</Label>
                            <Select
                              value={formData.prioridad}
                              onValueChange={(value: any) =>
                                setFormData({ ...formData, prioridad: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="alta">Alta</SelectItem>
                                <SelectItem value="urgente">Urgente</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="fechaExpiracion">Fecha de Expiración (opcional)</Label>
                            <Input
                              id="fechaExpiracion"
                              type="datetime-local"
                              value={formData.fechaExpiracion}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  fechaExpiracion: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="visiblePara">Visible Para</Label>
                            <Select
                              value={formData.visiblePara}
                              onValueChange={(value) =>
                                setFormData({ ...formData, visiblePara: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="todos">Todos</SelectItem>
                                <SelectItem value="propietarios">Propietarios</SelectItem>
                                <SelectItem value="inquilinos">Inquilinos</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setOpenDialog(false);
                            setEditingAnuncio(null);
                            resetForm();
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleSubmit}>
                          {editingAnuncio ? 'Actualizar' : 'Publicar'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Anuncios</CardTitle>
                  <Megaphone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalAnuncios}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Activos</CardTitle>
                  <Eye className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{anunciosActivos}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{anunciosUrgentes}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Vistas</CardTitle>
                  <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalVistas}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filtros */}
            <div className="space-y-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar anuncios..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={filterActivo} onValueChange={setFilterActivo}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="activos">Activos</SelectItem>
                    <SelectItem value="inactivos">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <FilterChips
                filters={[
                  ...(searchTerm
                    ? [
                        {
                          id: 'search',
                          label: 'Búsqueda',
                          value: searchTerm,
                        },
                      ]
                    : []),
                  ...(filterActivo !== 'todos'
                    ? [
                        {
                          id: 'status',
                          label: 'Estado',
                          value: filterActivo,
                        },
                      ]
                    : []),
                ]}
                onRemove={(id) => {
                  if (id === 'search') setSearchTerm('');
                  if (id === 'status') setFilterActivo('todos');
                }}
                onClearAll={() => {
                  setSearchTerm('');
                  setFilterActivo('todos');
                }}
              />
            </div>

            {/* Lista de anuncios */}
            <div className="grid gap-4">
              {anunciosFiltrados.length === 0 ? (
                <EmptyState
                  icon={<Megaphone className="h-12 w-12" />}
                  title="No hay anuncios disponibles"
                  description={
                    searchTerm || filterActivo !== 'todos'
                      ? 'Intenta ajustar los filtros de búsqueda'
                      : 'Comienza publicando tu primer anuncio a la comunidad'
                  }
                  action={
                    isAdmin && !searchTerm && filterActivo === 'todos'
                      ? {
                          label: 'Publicar Primer Anuncio',
                          onClick: () => setOpenDialog(true),
                          icon: <Plus className="h-4 w-4" />,
                        }
                      : undefined
                  }
                />
              ) : (
                anunciosFiltrados.map((anuncio) => {
                  const isExpirado =
                    anuncio.fechaExpiracion && new Date(anuncio.fechaExpiracion) < new Date();

                  return (
                    <Card
                      key={anuncio.id}
                      className={`hover:shadow-lg transition-shadow ${
                        anuncio.prioridad === 'urgente'
                          ? 'border-red-500 border-2'
                          : anuncio.prioridad === 'alta'
                            ? 'border-amber-500'
                            : ''
                      }`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {anuncio.tipo === 'urgente' && (
                                <Bell className="h-5 w-5 text-red-500 animate-pulse" />
                              )}
                              {anuncio.tipo === 'evento' && (
                                <CalendarIcon className="h-5 w-5 text-blue-500" />
                              )}
                              {anuncio.tipo === 'aviso' && (
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                              )}
                              {anuncio.tipo === 'informativo' && (
                                <Info className="h-5 w-5 text-green-500" />
                              )}
                              <CardTitle className="text-lg">{anuncio.titulo}</CardTitle>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <Badge
                                variant={
                                  anuncio.tipo === 'urgente'
                                    ? 'destructive'
                                    : anuncio.tipo === 'aviso'
                                      ? 'default'
                                      : 'secondary'
                                }
                              >
                                {anuncio.tipo.charAt(0).toUpperCase() + anuncio.tipo.slice(1)}
                              </Badge>
                              {anuncio.prioridad !== 'normal' && (
                                <Badge variant="outline">Prioridad: {anuncio.prioridad}</Badge>
                              )}
                              {!anuncio.activo && (
                                <Badge variant="secondary">
                                  <EyeOff className="h-3 w-3 mr-1" />
                                  Inactivo
                                </Badge>
                              )}
                              {isExpirado && <Badge variant="destructive">Expirado</Badge>}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {anuncio.contenido}
                          </p>

                          <Separator />

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Edificio:</span>
                              <p className="font-medium">{anuncio.building.nombre}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Publicado:</span>
                              <p className="font-medium">
                                {format(new Date(anuncio.fechaPublicacion), 'dd/MM/yyyy HH:mm', {
                                  locale: es,
                                })}
                              </p>
                            </div>
                            {anuncio.fechaExpiracion && (
                              <div>
                                <span className="text-muted-foreground">Expira:</span>
                                <p className="font-medium">
                                  {format(new Date(anuncio.fechaExpiracion), 'dd/MM/yyyy HH:mm', {
                                    locale: es,
                                  })}
                                </p>
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground">Vistas:</span>
                              <p className="font-medium">{anuncio.vistas || 0}</p>
                            </div>
                          </div>

                          {isAdmin && (
                            <div className="flex items-center gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(anuncio)}
                                className="gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                Editar
                              </Button>
                              {anuncio.activo && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(anuncio.id)}
                                  className="gap-2"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Desactivar
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AnunciosPageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <AnunciosPage />
    </ErrorBoundary>
  );
}
