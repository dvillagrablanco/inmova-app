'use client';

import { useState, useEffect } from 'react';
import logger from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Eye, Star } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MarketplaceService {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  subcategoria: string | null;
  tipoPrecio: string;
  precio: number | null;
  unidad: string | null;
  comisionPorcentaje: number;
  disponible: boolean;
  duracionEstimada: number | null;
  rating: number | null;
  totalReviews: number;
  destacado: boolean;
  activo: boolean;
  provider: {
    nombre: string;
  } | null;
}

interface ServiceFormData {
  nombre: string;
  descripcion: string;
  categoria: string;
  subcategoria: string;
  tipoPrecio: string;
  precio: string;
  unidad: string;
  comisionPorcentaje: string;
  disponible: boolean;
  duracionEstimada: string;
  destacado: boolean;
  activo: boolean;
}

const categorias = [
  'Limpieza',
  'Mantenimiento',
  'Mudanzas',
  'Jardinería',
  'Pintura',
  'Fontanería',
  'Electricidad',
  'Cerrajería',
  'Seguridad',
  'Otros',
];

const tiposPrecio = [
  { value: 'fijo', label: 'Precio Fijo' },
  { value: 'hora', label: 'Por Hora' },
  { value: 'dia', label: 'Por Día' },
  { value: 'proyecto', label: 'Por Proyecto' },
  { value: 'personalizado', label: 'Personalizado' },
];

export default function MarketplacePage() {
  const { data: session } = useSession() || {};
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [filteredServices, setFilteredServices] = useState<MarketplaceService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<MarketplaceService | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<MarketplaceService | null>(null);

  const [formData, setFormData] = useState<ServiceFormData>({
    nombre: '',
    descripcion: '',
    categoria: 'Limpieza',
    subcategoria: '',
    tipoPrecio: 'fijo',
    precio: '',
    unidad: 'servicio',
    comisionPorcentaje: '10',
    disponible: true,
    duracionEstimada: '',
    destacado: false,
    activo: true,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [services, searchTerm, selectedCategory]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/marketplace/services');
      if (!response.ok) throw new Error('Error al cargar servicios');
      const data = await response.json();
      setServices(data);
    } catch (error) {
      toast.error('Error al cargar los servicios');
      logger.error(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  const filterServices = () => {
    let filtered = services;

    if (searchTerm) {
      filtered = filtered.filter(
        (service) =>
          service.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.categoria.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter((service) => service.categoria === selectedCategory);
    }

    setFilteredServices(filtered);
  };

  const handleOpenDialog = (service?: MarketplaceService) => {
    if (service) {
      setEditingService(service);
      setFormData({
        nombre: service.nombre,
        descripcion: service.descripcion,
        categoria: service.categoria,
        subcategoria: service.subcategoria || '',
        tipoPrecio: service.tipoPrecio,
        precio: service.precio?.toString() || '',
        unidad: service.unidad || 'servicio',
        comisionPorcentaje: service.comisionPorcentaje.toString(),
        disponible: service.disponible,
        duracionEstimada: service.duracionEstimada?.toString() || '',
        destacado: service.destacado,
        activo: service.activo,
      });
    } else {
      setEditingService(null);
      setFormData({
        nombre: '',
        descripcion: '',
        categoria: 'Limpieza',
        subcategoria: '',
        tipoPrecio: 'fijo',
        precio: '',
        unidad: 'servicio',
        comisionPorcentaje: '10',
        disponible: true,
        duracionEstimada: '',
        destacado: false,
        activo: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingService(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        categoria: formData.categoria,
        subcategoria: formData.subcategoria || null,
        tipoPrecio: formData.tipoPrecio,
        precio: formData.precio ? parseFloat(formData.precio) : null,
        unidad: formData.unidad || null,
        comisionPorcentaje: parseFloat(formData.comisionPorcentaje),
        disponible: formData.disponible,
        duracionEstimada: formData.duracionEstimada ? parseInt(formData.duracionEstimada) : null,
        destacado: formData.destacado,
        activo: formData.activo,
      };

      const url = editingService
        ? `/api/admin/marketplace/services/${editingService.id}`
        : '/api/admin/marketplace/services';

      const method = editingService ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al guardar el servicio');
      }

      toast.success(editingService ? 'Servicio actualizado' : 'Servicio creado');
      handleCloseDialog();
      fetchServices();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar el servicio');
      logger.error(error instanceof Error ? error.message : String(error));
    }
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;

    try {
      const response = await fetch(`/api/admin/marketplace/services/${serviceToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar el servicio');

      toast.success('Servicio eliminado');
      setIsDeleteDialogOpen(false);
      setServiceToDelete(null);
      fetchServices();
    } catch (error) {
      toast.error('Error al eliminar el servicio');
      logger.error(error instanceof Error ? error.message : String(error));
    }
  };

  const openDeleteDialog = (service: MarketplaceService) => {
    setServiceToDelete(service);
    setIsDeleteDialogOpen(true);
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Marketplace de Servicios</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona los servicios disponibles en el marketplace
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Servicio
          </Button>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar servicios..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de servicios */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredServices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <p className="text-muted-foreground">No se encontraron servicios</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{service.nombre}</CardTitle>
                      <CardDescription className="mt-1">
                        {service.categoria}
                        {service.subcategoria && ` / ${service.subcategoria}`}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(service)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(service)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {service.descripcion}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Precio:</span>
                      <span className="font-semibold">
                        {service.precio ? `€${service.precio}` : 'Consultar'}
                        {service.unidad && ` / ${service.unidad}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Comisión:</span>
                      <span className="font-semibold">{service.comisionPorcentaje}%</span>
                    </div>
                    {service.rating && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Rating:</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">
                            {service.rating.toFixed(1)} ({service.totalReviews})
                          </span>
                        </div>
                      </div>
                    )}
                    {service.provider && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Proveedor:</span>
                        <span className="text-sm">{service.provider.nombre}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {service.destacado && <Badge variant="default">Destacado</Badge>}
                      {service.disponible ? (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          Disponible
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          No disponible
                        </Badge>
                      )}
                      {!service.activo && (
                        <Badge
                          variant="outline"
                          className="bg-gray-50 text-gray-700 border-gray-200"
                        >
                          Inactivo
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog de creación/edición */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingService ? 'Editar Servicio' : 'Nuevo Servicio'}</DialogTitle>
              <DialogDescription>
                {editingService
                  ? 'Modifica los detalles del servicio'
                  : 'Completa la información del nuevo servicio'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción *</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoría *</Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subcategoria">Subcategoría</Label>
                    <Input
                      id="subcategoria"
                      value={formData.subcategoria}
                      onChange={(e) => setFormData({ ...formData, subcategoria: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipoPrecio">Tipo de Precio *</Label>
                    <Select
                      value={formData.tipoPrecio}
                      onValueChange={(value) => setFormData({ ...formData, tipoPrecio: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposPrecio.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="precio">Precio (€)</Label>
                    <Input
                      id="precio"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.precio}
                      onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unidad">Unidad</Label>
                    <Input
                      id="unidad"
                      value={formData.unidad}
                      onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                      placeholder="ej: hora, día, servicio"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="comisionPorcentaje">Comisión (%) *</Label>
                    <Input
                      id="comisionPorcentaje"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.comisionPorcentaje}
                      onChange={(e) =>
                        setFormData({ ...formData, comisionPorcentaje: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duracionEstimada">Duración Estimada (min)</Label>
                    <Input
                      id="duracionEstimada"
                      type="number"
                      min="0"
                      value={formData.duracionEstimada}
                      onChange={(e) =>
                        setFormData({ ...formData, duracionEstimada: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="disponible">Disponible</Label>
                    <Switch
                      id="disponible"
                      checked={formData.disponible}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, disponible: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="destacado">Servicio Destacado</Label>
                    <Switch
                      id="destacado"
                      checked={formData.destacado}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, destacado: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="activo">Activo</Label>
                    <Switch
                      id="activo"
                      checked={formData.activo}
                      onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit">{editingService ? 'Actualizar' : 'Crear'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmación de eliminación */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
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
    </AuthenticatedLayout>
  );
}
