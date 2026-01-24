'use client';

/**
 * Página de Administración del Marketplace de Servicios
 *
 * El Marketplace de Servicios es diferente de los Partners:
 * - PARTNERS: Empresas que REFIEREN clientes a Inmova (bancos, aseguradoras)
 * - MARKETPLACE: PROVEEDORES de servicios (limpieza, fontanería) que los usuarios contratan
 *
 * Inmova gana comisión por intermediar servicios a los usuarios de la plataforma.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Star,
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Wrench,
  Sparkles,
  Shield,
  Filter,
  MoreHorizontal,
  Eye,
  Settings,
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
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import logger from '@/lib/logger';

// Estadísticas del marketplace
interface MarketplaceStats {
  totalProveedores: number;
  proveedoresActivos: number;
  totalServicios: number;
  serviciosActivos: number;
  reservasEsteMes: number;
  ingresosTotales: number;
  comisionesGeneradas: number;
  tasaConversion: number;
}

// Proveedor de servicios
interface ServiceProvider {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  tipo: string;
  estado: 'pending' | 'active' | 'suspended';
  verificado: boolean;
  rating: number;
  totalReviews: number;
  serviciosActivos: number;
  reservasCompletadas: number;
  ingresosTotales: number;
  fechaRegistro: string;
  website?: string | null;
  direccion?: string | null;
  descripcion?: string | null;
}

// Servicio del marketplace
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
    id: string;
    nombre: string;
    verificado: boolean;
  } | null;
}

interface MarketplaceReservation {
  id: string;
  servicio: string;
  categoria: string;
  proveedor: string;
  fechaServicio: string;
  precio: number;
  estado: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'disputed';
}

// Categorías de servicios
const CATEGORIAS = [
  { id: 'limpieza', nombre: 'Limpieza', icon: Sparkles, color: 'bg-blue-500' },
  { id: 'mantenimiento', nombre: 'Mantenimiento', icon: Wrench, color: 'bg-orange-500' },
  { id: 'mudanzas', nombre: 'Mudanzas', icon: Building2, color: 'bg-purple-500' },
  { id: 'jardineria', nombre: 'Jardinería', icon: Sparkles, color: 'bg-green-500' },
  { id: 'pintura', nombre: 'Pintura', icon: Sparkles, color: 'bg-yellow-500' },
  { id: 'fontaneria', nombre: 'Fontanería', icon: Wrench, color: 'bg-cyan-500' },
  { id: 'electricidad', nombre: 'Electricidad', icon: Sparkles, color: 'bg-amber-500' },
  { id: 'cerrajeria', nombre: 'Cerrajería', icon: Shield, color: 'bg-red-500' },
  { id: 'seguridad', nombre: 'Seguridad', icon: Shield, color: 'bg-slate-500' },
  { id: 'otros', nombre: 'Otros', icon: ShoppingBag, color: 'bg-gray-500' },
];

const TIPOS_PRECIO = [
  { value: 'fijo', label: 'Precio Fijo' },
  { value: 'hora', label: 'Por Hora' },
  { value: 'dia', label: 'Por Día' },
  { value: 'proyecto', label: 'Por Proyecto' },
  { value: 'personalizado', label: 'Consultar' },
];

export default function MarketplaceAdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [reservations, setReservations] = useState<MarketplaceReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modales
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<MarketplaceService | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<MarketplaceService | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'limpieza',
    subcategoria: '',
    tipoPrecio: 'fijo',
    precio: '',
    unidad: 'servicio',
    comisionPorcentaje: '15',
    disponible: true,
    duracionEstimada: '',
    destacado: false,
    activo: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, servicesRes, providersRes, reservationsRes] = await Promise.all([
        fetch('/api/marketplace/stats'),
        fetch('/api/admin/marketplace/services'),
        fetch('/api/admin/marketplace/providers'),
        fetch('/api/admin/marketplace/reservations'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData);
      }

      if (providersRes.ok) {
        const providersData = await providersRes.json();
        setProviders(providersData.providers || providersData || []);
      }

      if (reservationsRes.ok) {
        const reservationsData = await reservationsRes.json();
        setReservations(reservationsData.reservations || []);
      }
    } catch (error) {
      logger.error('Error loading marketplace data:', error);
      toast.error('Error al cargar datos del marketplace');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar servicios
  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || service.categoria.toLowerCase() === selectedCategory;
    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'activo' && service.activo) ||
      (selectedStatus === 'inactivo' && !service.activo);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleOpenServiceDialog = (service?: MarketplaceService) => {
    if (service) {
      setEditingService(service);
      setFormData({
        nombre: service.nombre,
        descripcion: service.descripcion,
        categoria: service.categoria.toLowerCase(),
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
        categoria: 'limpieza',
        subcategoria: '',
        tipoPrecio: 'fijo',
        precio: '',
        unidad: 'servicio',
        comisionPorcentaje: '15',
        disponible: true,
        duracionEstimada: '',
        destacado: false,
        activo: true,
      });
    }
    setIsServiceDialogOpen(true);
  };

  const handleSubmitService = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        categoria: formData.categoria.charAt(0).toUpperCase() + formData.categoria.slice(1),
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

      const response = await fetch(url, {
        method: editingService ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al guardar servicio');
      }

      toast.success(editingService ? 'Servicio actualizado' : 'Servicio creado');
      setIsServiceDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;

    try {
      const response = await fetch(`/api/admin/marketplace/services/${serviceToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar servicio');

      toast.success('Servicio eliminado');
      setIsDeleteDialogOpen(false);
      setServiceToDelete(null);
      loadData();
    } catch (error) {
      toast.error('Error al eliminar servicio');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const getProviderStatusBadge = (status: ServiceProvider['estado']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Activo</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">Pendiente</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-700">Suspendido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReservationStatusBadge = (status: MarketplaceReservation['estado']) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">Pendiente</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-700">Confirmada</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">Completada</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700">Cancelada</Badge>;
      case 'disputed':
        return <Badge className="bg-orange-100 text-orange-700">Disputa</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando marketplace...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Marketplace de Servicios</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona proveedores y servicios que los usuarios pueden contratar
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/admin/marketplace/comisiones')}>
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </Button>
            <Button onClick={() => handleOpenServiceDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Servicio
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Proveedores Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">{stats?.proveedoresActivos || 0}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                de {stats?.totalProveedores || 0} registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Servicios Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-purple-500" />
                <span className="text-2xl font-bold">
                  {stats?.serviciosActivos || services.filter((s) => s.activo).length}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                en {CATEGORIAS.length} categorías
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Reservas Este Mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">{stats?.reservasEsteMes || 0}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +{stats?.tasaConversion || 0}% vs mes anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Comisiones Generadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-amber-500" />
                <span className="text-2xl font-bold">
                  {formatCurrency(stats?.comisionesGeneradas || 0)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">este mes</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Servicios</TabsTrigger>
            <TabsTrigger value="providers">Proveedores</TabsTrigger>
            <TabsTrigger value="bookings">Reservas</TabsTrigger>
            <TabsTrigger value="categories">Categorías</TabsTrigger>
          </TabsList>

          {/* Tab: Servicios */}
          <TabsContent value="overview" className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
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
                    <SelectTrigger className="w-full md:w-[180px]">
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
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-full md:w-[150px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="activo">Activos</SelectItem>
                      <SelectItem value="inactivo">Inactivos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Grid de servicios */}
            {filteredServices.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay servicios</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchTerm || selectedCategory !== 'all'
                      ? 'No se encontraron servicios con los filtros aplicados'
                      : 'Crea el primer servicio del marketplace'}
                  </p>
                  <Button onClick={() => handleOpenServiceDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Servicio
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map((service) => (
                  <Card key={service.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {service.destacado && (
                              <Badge variant="default" className="bg-yellow-500">
                                <Star className="h-3 w-3 mr-1" />
                                Destacado
                              </Badge>
                            )}
                            <Badge variant={service.activo ? 'outline' : 'secondary'}>
                              {service.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{service.nombre}</CardTitle>
                          <CardDescription className="mt-1">
                            {service.categoria}
                            {service.subcategoria && ` / ${service.subcategoria}`}
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenServiceDialog(service)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
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
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {service.descripcion}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Precio:</span>
                          <p className="font-semibold">
                            {service.precio ? `€${service.precio}` : 'Consultar'}
                            {service.unidad && ` / ${service.unidad}`}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Comisión:</span>
                          <p className="font-semibold">{service.comisionPorcentaje}%</p>
                        </div>
                      </div>
                      {service.rating && (
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{service.rating.toFixed(1)}</span>
                          <span className="text-sm text-muted-foreground">
                            ({service.totalReviews} reviews)
                          </span>
                        </div>
                      )}
                      {service.provider && (
                        <div className="flex items-center gap-2 text-sm pt-2 border-t">
                          <span className="text-muted-foreground">Proveedor:</span>
                          <span className="font-medium">{service.provider.nombre}</span>
                          {service.provider.verificado && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Proveedores */}
          <TabsContent value="providers">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Proveedores de Servicios</CardTitle>
                    <CardDescription>
                      Empresas y profesionales que ofrecen servicios en el marketplace
                    </CardDescription>
                  </div>
                  <Button onClick={() => router.push('/admin/marketplace/proveedores')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir Proveedor
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
              {providers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay proveedores registrados</p>
                  <p className="text-sm mt-2">
                    Los proveedores aparecerán aquí cuando se registren en la plataforma
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {providers.map((provider) => (
                    <div
                      key={provider.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{provider.nombre}</p>
                          {provider.verificado && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{provider.email}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                          <span>{provider.tipo}</span>
                          <span>•</span>
                          <span>{provider.serviciosActivos} servicios</span>
                          <span>•</span>
                          <span>{provider.reservasCompletadas} reservas</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {provider.rating > 0 && (
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{provider.rating.toFixed(1)}</span>
                          </div>
                        )}
                        {getProviderStatusBadge(provider.estado)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Reservas */}
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Reservas de Servicios</CardTitle>
                    <CardDescription>
                      Historial de contrataciones realizadas por los usuarios
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/admin/marketplace/reservas')}
                  >
                    Ver todas
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {reservations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay reservas recientes</p>
                    <p className="text-sm mt-2">
                      Las reservas aparecerán aquí cuando los usuarios contraten servicios
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reservations.slice(0, 5).map((reservation) => (
                      <div
                        key={reservation.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{reservation.servicio}</p>
                          <p className="text-sm text-muted-foreground">
                            {reservation.proveedor}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {reservation.fechaServicio
                              ? new Date(reservation.fechaServicio).toLocaleDateString('es-ES')
                              : 'Fecha por definir'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">
                            {formatCurrency(reservation.precio)}
                          </span>
                          {getReservationStatusBadge(reservation.estado)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Categorías */}
          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>Categorías de Servicios</CardTitle>
                <CardDescription>
                  Organización de los servicios disponibles en el marketplace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {CATEGORIAS.map((cat) => {
                    const Icon = cat.icon;
                    const count = services.filter(
                      (s) => s.categoria.toLowerCase() === cat.id
                    ).length;
                    return (
                      <div
                        key={cat.id}
                        className="flex flex-col items-center p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className={`p-3 rounded-full ${cat.color} text-white mb-2`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <span className="font-medium text-center">{cat.nombre}</span>
                        <span className="text-sm text-muted-foreground">{count} servicios</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog: Crear/Editar Servicio */}
        <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingService ? 'Editar Servicio' : 'Nuevo Servicio'}</DialogTitle>
              <DialogDescription>
                {editingService
                  ? 'Modifica los detalles del servicio'
                  : 'Añade un nuevo servicio al marketplace'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitService}>
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
                    rows={3}
                    placeholder="Describe el servicio en detalle..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                        {CATEGORIAS.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.nombre}
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
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipoPrecio">Tipo de Precio</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="comisionPorcentaje">Comisión Inmova (%)</Label>
                    <Input
                      id="comisionPorcentaje"
                      type="number"
                      step="0.1"
                      min="0"
                      max="50"
                      value={formData.comisionPorcentaje}
                      onChange={(e) =>
                        setFormData({ ...formData, comisionPorcentaje: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="disponible">Disponible para contratar</Label>
                      <p className="text-sm text-muted-foreground">
                        El servicio aparecerá en el marketplace
                      </p>
                    </div>
                    <Switch
                      id="disponible"
                      checked={formData.disponible}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, disponible: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="destacado">Servicio destacado</Label>
                      <p className="text-sm text-muted-foreground">
                        Se mostrará con mayor visibilidad
                      </p>
                    </div>
                    <Switch
                      id="destacado"
                      checked={formData.destacado}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, destacado: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="activo">Estado activo</Label>
                      <p className="text-sm text-muted-foreground">
                        Desactivar para ocultar temporalmente
                      </p>
                    </div>
                    <Switch
                      id="activo"
                      checked={formData.activo}
                      onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsServiceDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">{editingService ? 'Actualizar' : 'Crear'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog: Confirmar eliminación */}
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
              <Button variant="destructive" onClick={handleDeleteService}>
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
