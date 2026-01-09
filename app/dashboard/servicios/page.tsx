'use client';

/**
 * Marketplace de Servicios para Usuarios
 *
 * Página donde los usuarios de Inmova (inquilinos, propietarios, gestores)
 * pueden explorar y contratar servicios de mantenimiento y otros servicios
 * ofrecidos por proveedores del marketplace.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Star,
  MapPin,
  Clock,
  Phone,
  ArrowRight,
  Filter,
  Sparkles,
  Wrench,
  Droplets,
  Zap,
  Paintbrush,
  Truck,
  TreeDeciduous,
  Home,
  Heart,
  ShoppingCart,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface MarketplaceService {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  categoriaIcon: React.ReactNode;
  precio: number;
  tipoPrecio: string;
  proveedor: {
    nombre: string;
    valoracion: number;
    totalReviews: number;
    verificado: boolean;
  };
  disponibilidad: string;
  tiempoRespuesta: string;
  imagenUrl?: string;
  destacado: boolean;
}

const CATEGORIAS = [
  { id: 'all', nombre: 'Todas', icon: Home },
  { id: 'limpieza', nombre: 'Limpieza', icon: Sparkles },
  { id: 'fontaneria', nombre: 'Fontanería', icon: Droplets },
  { id: 'electricidad', nombre: 'Electricidad', icon: Zap },
  { id: 'mantenimiento', nombre: 'Mantenimiento', icon: Wrench },
  { id: 'pintura', nombre: 'Pintura', icon: Paintbrush },
  { id: 'mudanzas', nombre: 'Mudanzas', icon: Truck },
  { id: 'jardineria', nombre: 'Jardinería', icon: TreeDeciduous },
];

const getCategoryIcon = (categoria: string) => {
  const cat = CATEGORIAS.find((c) => c.id === categoria.toLowerCase());
  if (cat) {
    const IconComponent = cat.icon;
    return <IconComponent className="h-5 w-5" />;
  }
  return <Wrench className="h-5 w-5" />;
};

export default function UserServicesMarketplacePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('relevancia');
  const [favorites, setFavorites] = useState<string[]>([]);

  // Modal de solicitud
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<MarketplaceService | null>(null);
  const [requestForm, setRequestForm] = useState({
    direccion: '',
    fecha: '',
    hora: '',
    notas: '',
  });

  useEffect(() => {
    loadServices();
    loadFavorites();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      // TODO: Cargar servicios del API real
      // const response = await fetch('/api/marketplace/services');

      // Mock data
      const mockServices: MarketplaceService[] = [
        {
          id: '1',
          nombre: 'Limpieza profunda de vivienda',
          descripcion:
            'Limpieza completa incluyendo cocina, baños, ventanas y todas las habitaciones. Incluye productos.',
          categoria: 'Limpieza',
          categoriaIcon: getCategoryIcon('limpieza'),
          precio: 80,
          tipoPrecio: 'fijo',
          proveedor: {
            nombre: 'CleanPro Madrid',
            valoracion: 4.9,
            totalReviews: 156,
            verificado: true,
          },
          disponibilidad: 'Disponible mañana',
          tiempoRespuesta: '< 2 horas',
          destacado: true,
        },
        {
          id: '2',
          nombre: 'Reparación de fontanería urgente',
          descripcion:
            'Servicio de fontanería urgente: fugas, atascos, reparación de grifos y tuberías.',
          categoria: 'Fontanería',
          categoriaIcon: getCategoryIcon('fontaneria'),
          precio: 45,
          tipoPrecio: 'hora',
          proveedor: {
            nombre: 'FontaneríaExpress',
            valoracion: 4.7,
            totalReviews: 89,
            verificado: true,
          },
          disponibilidad: 'Disponible hoy',
          tiempoRespuesta: '< 1 hora',
          destacado: true,
        },
        {
          id: '3',
          nombre: 'Electricista certificado',
          descripcion:
            'Instalación, reparación y mantenimiento eléctrico. Boletín incluido en reformas.',
          categoria: 'Electricidad',
          categoriaIcon: getCategoryIcon('electricidad'),
          precio: 35,
          tipoPrecio: 'hora',
          proveedor: {
            nombre: 'ElectroMadrid',
            valoracion: 4.8,
            totalReviews: 67,
            verificado: true,
          },
          disponibilidad: 'Próximos 2 días',
          tiempoRespuesta: '< 4 horas',
          destacado: false,
        },
        {
          id: '4',
          nombre: 'Pintado de habitación',
          descripcion: 'Pintado profesional de paredes y techos. Incluye preparación y materiales.',
          categoria: 'Pintura',
          categoriaIcon: getCategoryIcon('pintura'),
          precio: 0,
          tipoPrecio: 'presupuesto',
          proveedor: {
            nombre: 'Pinturas Artesanas',
            valoracion: 4.6,
            totalReviews: 34,
            verificado: false,
          },
          disponibilidad: 'Bajo demanda',
          tiempoRespuesta: '< 24 horas',
          destacado: false,
        },
        {
          id: '5',
          nombre: 'Limpieza regular semanal',
          descripcion:
            'Servicio de limpieza semanal de mantenimiento. Ideal para hogares y oficinas.',
          categoria: 'Limpieza',
          categoriaIcon: getCategoryIcon('limpieza'),
          precio: 45,
          tipoPrecio: 'fijo',
          proveedor: {
            nombre: 'CleanPro Madrid',
            valoracion: 4.9,
            totalReviews: 156,
            verificado: true,
          },
          disponibilidad: 'Disponible',
          tiempoRespuesta: '< 2 horas',
          destacado: false,
        },
        {
          id: '6',
          nombre: 'Servicio de mudanzas',
          descripcion: 'Mudanzas locales y nacionales. Embalaje, transporte y montaje de muebles.',
          categoria: 'Mudanzas',
          categoriaIcon: getCategoryIcon('mudanzas'),
          precio: 0,
          tipoPrecio: 'presupuesto',
          proveedor: {
            nombre: 'MudanzasTop',
            valoracion: 4.5,
            totalReviews: 45,
            verificado: true,
          },
          disponibilidad: 'Con cita previa',
          tiempoRespuesta: '< 12 horas',
          destacado: false,
        },
      ];

      setServices(mockServices);
    } catch (error) {
      toast.error('Error al cargar servicios');
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = () => {
    const stored = localStorage.getItem('marketplace_favorites');
    if (stored) {
      setFavorites(JSON.parse(stored));
    }
  };

  const toggleFavorite = (serviceId: string) => {
    const newFavorites = favorites.includes(serviceId)
      ? favorites.filter((id) => id !== serviceId)
      : [...favorites, serviceId];
    setFavorites(newFavorites);
    localStorage.setItem('marketplace_favorites', JSON.stringify(newFavorites));
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.proveedor.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || service.categoria.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedServices = [...filteredServices].sort((a, b) => {
    switch (sortBy) {
      case 'precio_asc':
        return a.precio - b.precio;
      case 'precio_desc':
        return b.precio - a.precio;
      case 'valoracion':
        return b.proveedor.valoracion - a.proveedor.valoracion;
      default:
        // Relevancia: destacados primero, luego por valoración
        if (a.destacado !== b.destacado) return a.destacado ? -1 : 1;
        return b.proveedor.valoracion - a.proveedor.valoracion;
    }
  });

  const formatPrice = (precio: number, tipo: string) => {
    if (tipo === 'presupuesto') return 'Solicitar presupuesto';
    if (precio === 0) return 'Consultar';
    const formatted = `€${precio}`;
    if (tipo === 'hora') return `${formatted}/hora`;
    return formatted;
  };

  const openRequestDialog = (service: MarketplaceService) => {
    setSelectedService(service);
    setIsRequestDialogOpen(true);
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Enviar solicitud al API
      toast.success('Solicitud enviada. El proveedor te contactará pronto.');
      setIsRequestDialogOpen(false);
      setRequestForm({ direccion: '', fecha: '', hora: '', notas: '' });
    } catch (error) {
      toast.error('Error al enviar solicitud');
    }
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
      <div>
        <h1 className="text-2xl font-bold">Marketplace de Servicios</h1>
        <p className="text-muted-foreground">
          Encuentra profesionales de confianza para el mantenimiento de tu vivienda
        </p>
      </div>

      {/* Categories quick filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIAS.map((cat) => {
          const IconComponent = cat.icon;
          return (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className="gap-2"
            >
              <IconComponent className="h-4 w-4" />
              {cat.nombre}
            </Button>
          );
        })}
      </div>

      {/* Search and filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar servicios, profesionales..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevancia">Relevancia</SelectItem>
                <SelectItem value="valoracion">Mejor valorados</SelectItem>
                <SelectItem value="precio_asc">Precio: menor a mayor</SelectItem>
                <SelectItem value="precio_desc">Precio: mayor a menor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Featured services */}
      {sortedServices.some((s) => s.destacado) && selectedCategory === 'all' && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            Servicios Destacados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedServices
              .filter((s) => s.destacado)
              .map((service) => (
                <Card
                  key={service.id}
                  className="hover:shadow-lg transition-shadow border-yellow-200 bg-yellow-50/30"
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {getCategoryIcon(service.categoria)}
                        </div>
                        <Badge variant="secondary">{service.categoria}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavorite(service.id)}
                        className={favorites.includes(service.id) ? 'text-red-500' : ''}
                      >
                        <Heart
                          className={`h-5 w-5 ${favorites.includes(service.id) ? 'fill-current' : ''}`}
                        />
                      </Button>
                    </div>
                    <CardTitle className="text-lg mt-2">{service.nombre}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {service.descripcion}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{service.proveedor.valoracion}</span>
                        <span className="text-sm text-muted-foreground">
                          ({service.proveedor.totalReviews})
                        </span>
                      </div>
                      <span className="font-bold text-green-600">
                        {formatPrice(service.precio, service.tipoPrecio)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {service.proveedor.verificado && (
                          <Badge variant="outline" className="text-blue-600 border-blue-200">
                            ✓ Verificado
                          </Badge>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {service.tiempoRespuesta}
                      </span>
                      <span className="text-green-600 font-medium">{service.disponibilidad}</span>
                    </div>

                    <Button className="w-full" onClick={() => openRequestDialog(service)}>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Solicitar Servicio
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* All services */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          {selectedCategory === 'all'
            ? 'Todos los Servicios'
            : CATEGORIAS.find((c) => c.id === selectedCategory)?.nombre}
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({sortedServices.filter((s) => !s.destacado || selectedCategory !== 'all').length}{' '}
            disponibles)
          </span>
        </h2>

        {sortedServices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron servicios</h3>
              <p className="text-sm text-muted-foreground">
                Intenta con otros términos de búsqueda o categoría
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedServices
              .filter((s) => !s.destacado || selectedCategory !== 'all')
              .map((service) => (
                <Card key={service.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {getCategoryIcon(service.categoria)}
                        </div>
                        <Badge variant="outline">{service.categoria}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavorite(service.id)}
                        className={favorites.includes(service.id) ? 'text-red-500' : ''}
                      >
                        <Heart
                          className={`h-5 w-5 ${favorites.includes(service.id) ? 'fill-current' : ''}`}
                        />
                      </Button>
                    </div>
                    <CardTitle className="text-lg mt-2">{service.nombre}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {service.descripcion}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{service.proveedor.valoracion}</span>
                        <span className="text-sm text-muted-foreground">
                          ({service.proveedor.totalReviews})
                        </span>
                      </div>
                      <span className="font-bold text-green-600">
                        {formatPrice(service.precio, service.tipoPrecio)}
                      </span>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-gray-700">{service.proveedor.nombre}</span>
                      {service.proveedor.verificado && (
                        <Badge
                          variant="outline"
                          className="ml-2 text-xs text-blue-600 border-blue-200"
                        >
                          ✓ Verificado
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {service.tiempoRespuesta}
                      </span>
                      <span className="text-green-600">{service.disponibilidad}</span>
                    </div>

                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => openRequestDialog(service)}
                    >
                      Solicitar Servicio
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>

      {/* Request Service Dialog */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Servicio</DialogTitle>
            <DialogDescription>
              {selectedService?.nombre} - {selectedService?.proveedor.nombre}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRequestSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección del servicio *</Label>
              <Input
                id="direccion"
                value={requestForm.direccion}
                onChange={(e) => setRequestForm({ ...requestForm, direccion: e.target.value })}
                placeholder="Calle, número, piso..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha preferida</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={requestForm.fecha}
                  onChange={(e) => setRequestForm({ ...requestForm, fecha: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hora">Hora preferida</Label>
                <Input
                  id="hora"
                  type="time"
                  value={requestForm.hora}
                  onChange={(e) => setRequestForm({ ...requestForm, hora: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas">Notas adicionales</Label>
              <Textarea
                id="notas"
                value={requestForm.notas}
                onChange={(e) => setRequestForm({ ...requestForm, notas: e.target.value })}
                placeholder="Describe lo que necesitas..."
                rows={3}
              />
            </div>

            {selectedService && selectedService.precio > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Precio estimado:</span>
                  <span className="font-bold text-lg text-green-600">
                    {formatPrice(selectedService.precio, selectedService.tipoPrecio)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  El precio final puede variar según el trabajo específico.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Enviar Solicitud</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
