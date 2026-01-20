'use client';

/**
 * Página de Gestión de Servicios del Proveedor
 *
 * Permite al proveedor ver, crear, editar y gestionar sus servicios
 * en el marketplace de Inmova.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Star,
  MoreHorizontal,
  Package,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface ProviderService {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precio: number;
  tipoPrecio: string;
  activo: boolean;
  destacado: boolean;
  reservas: number;
  valoracion: number;
  totalReviews: number;
}

const CATEGORIAS = [
  { id: 'limpieza', nombre: 'Limpieza' },
  { id: 'mantenimiento', nombre: 'Mantenimiento' },
  { id: 'fontaneria', nombre: 'Fontanería' },
  { id: 'electricidad', nombre: 'Electricidad' },
  { id: 'pintura', nombre: 'Pintura' },
  { id: 'mudanzas', nombre: 'Mudanzas' },
  { id: 'jardineria', nombre: 'Jardinería' },
  { id: 'otros', nombre: 'Otros' },
];

const TIPOS_PRECIO = [
  { value: 'fijo', label: 'Precio Fijo' },
  { value: 'hora', label: 'Por Hora' },
  { value: 'presupuesto', label: 'Por Presupuesto' },
];

export default function ProveedorServiciosPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ProviderService[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ProviderService | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<ProviderService | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'limpieza',
    precio: '',
    tipoPrecio: 'fijo',
    activo: true,
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/portal-proveedor/servicios');
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
          return;
        }
        throw new Error('Error al cargar servicios');
      }

      const data = await response.json();
      setServices(data);
    } catch (error) {
      toast.error('Error al cargar servicios');
      // Fallback a array vacío si hay error
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || service.categoria.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenDialog = (service?: ProviderService) => {
    if (service) {
      setEditingService(service);
      setFormData({
        nombre: service.nombre,
        descripcion: service.descripcion,
        categoria: service.categoria.toLowerCase(),
        precio: service.precio.toString(),
        tipoPrecio: service.tipoPrecio,
        activo: service.activo,
      });
    } else {
      setEditingService(null);
      setFormData({
        nombre: '',
        descripcion: '',
        categoria: 'limpieza',
        precio: '',
        tipoPrecio: 'fijo',
        activo: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        categoria: formData.categoria,
        precio: formData.precio ? parseFloat(formData.precio) : null,
        tipoPrecio: formData.tipoPrecio,
        activo: formData.activo,
      };

      const url = editingService 
        ? `/api/portal-proveedor/servicios/${editingService.id}`
        : '/api/portal-proveedor/servicios';
      
      const method = editingService ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar servicio');
      }

      toast.success(editingService ? 'Servicio actualizado' : 'Servicio creado');
      setIsDialogOpen(false);
      loadServices();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar servicio');
    }
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;

    try {
      const response = await fetch(`/api/portal-proveedor/servicios/${serviceToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar servicio');
      }

      const result = await response.json();
      
      if (result.desactivado) {
        toast.info('Servicio desactivado (tiene reservas asociadas)');
      } else {
        toast.success('Servicio eliminado');
      }
      
      setIsDeleteDialogOpen(false);
      setServiceToDelete(null);
      loadServices();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar servicio');
    }
  };

  const handleToggleActive = async (service: ProviderService) => {
    try {
      const response = await fetch(`/api/portal-proveedor/servicios/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !service.activo }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar servicio');
      }

      setServices(services.map((s) => (s.id === service.id ? { ...s, activo: !s.activo } : s)));
      toast.success(service.activo ? 'Servicio desactivado' : 'Servicio activado');
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar servicio');
    }
  };

  const formatPrice = (precio: number, tipo: string) => {
    if (tipo === 'presupuesto') return 'Según presupuesto';
    if (precio === 0) return 'Consultar';
    const formatted = `€${precio}`;
    if (tipo === 'hora') return `${formatted}/hora`;
    return formatted;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando servicios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mis Servicios</h1>
          <p className="text-muted-foreground">
            Gestiona los servicios que ofreces en el marketplace
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Servicio
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Servicios</p>
                <p className="text-2xl font-bold">{services.length}</p>
              </div>
              <Package className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Activos</p>
                <p className="text-2xl font-bold">{services.filter((s) => s.activo).length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reservas Totales</p>
                <p className="text-2xl font-bold">
                  {services.reduce((acc, s) => acc + s.reservas, 0)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valoración Media</p>
                <p className="text-2xl font-bold">
                  {(
                    services.reduce((acc, s) => acc + s.valoracion, 0) / services.length || 0
                  ).toFixed(1)}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar servicios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {CATEGORIAS.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Services List */}
      {filteredServices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes servicios</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crea tu primer servicio para empezar a recibir reservas
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Servicio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredServices.map((service) => (
            <Card key={service.id} className={!service.activo ? 'opacity-60' : ''}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{service.nombre}</h3>
                      {service.destacado && (
                        <Badge className="bg-yellow-500">
                          <Star className="h-3 w-3 mr-1" />
                          Destacado
                        </Badge>
                      )}
                      <Badge variant={service.activo ? 'outline' : 'secondary'}>
                        {service.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <Badge variant="outline">{service.categoria}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {service.descripcion}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-semibold text-green-600">
                        {formatPrice(service.precio, service.tipoPrecio)}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">{service.reservas} reservas</span>
                      <span className="text-muted-foreground">•</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{service.valoracion}</span>
                        <span className="text-muted-foreground">({service.totalReviews})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 mr-4">
                      <span className="text-sm text-muted-foreground">Activo</span>
                      <Switch
                        checked={service.activo}
                        onCheckedChange={() => handleToggleActive(service)}
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(service)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/proveedor/servicios/${service.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setServiceToDelete(service);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Editar Servicio' : 'Nuevo Servicio'}</DialogTitle>
            <DialogDescription>
              {editingService
                ? 'Modifica los detalles de tu servicio'
                : 'Añade un nuevo servicio al marketplace'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del servicio *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Limpieza profunda de vivienda"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción *</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Describe tu servicio en detalle..."
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoría</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipoPrecio">Tipo de precio</Label>
                  <Select
                    value={formData.tipoPrecio}
                    onValueChange={(value) => setFormData({ ...formData, tipoPrecio: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_PRECIO.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.tipoPrecio !== 'presupuesto' && (
                <div className="space-y-2">
                  <Label htmlFor="precio">Precio (€)</Label>
                  <Input
                    id="precio"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                    placeholder="Ej: 50"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <Label htmlFor="activo">Estado activo</Label>
                  <p className="text-sm text-muted-foreground">
                    El servicio será visible en el marketplace
                  </p>
                </div>
                <Switch
                  id="activo"
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editingService ? 'Actualizar' : 'Crear'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el servicio "{serviceToDelete?.nombre}"? Esta
              acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setServiceToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
