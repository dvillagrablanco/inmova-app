'use client';

/**
 * Marketplace de Servicios para Usuarios
 *
 * Pagina donde los usuarios de Inmova (inquilinos, propietarios, gestores)
 * pueden explorar y contratar servicios de mantenimiento y otros servicios
 * ofrecidos por proveedores del marketplace.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Star,
  Clock,
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
  RefreshCw,
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
  name: string;
  description: string;
  category: string;
  price: number;
  priceType: string;
  provider: {
    id: string;
    name: string;
    verified: boolean;
    rating: number;
    reviews: number;
  } | null;
  image?: string;
  featured: boolean;
  tags: string[];
}

const CATEGORIAS = [
  { id: 'all', nombre: 'Todas', icon: Home },
  { id: 'limpieza', nombre: 'Limpieza', icon: Sparkles },
  { id: 'fontaneria', nombre: 'Fontaneria', icon: Droplets },
  { id: 'electricidad', nombre: 'Electricidad', icon: Zap },
  { id: 'mantenimiento', nombre: 'Mantenimiento', icon: Wrench },
  { id: 'pintura', nombre: 'Pintura', icon: Paintbrush },
  { id: 'mudanzas', nombre: 'Mudanzas', icon: Truck },
  { id: 'jardineria', nombre: 'Jardineria', icon: TreeDeciduous },
];

const getCategoryIcon = (categoria: string) => {
  const cat = CATEGORIAS.find((c) => c.id === categoria.toLowerCase());
  if (cat) {
    const IconComponent = cat.icon;
    return <IconComponent className="h-5 w-5" />;
  }
  return <Wrench className="h-5 w-5" />;
};

function ServiceCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <Skeleton className="h-6 w-3/4 mt-2" />
        <Skeleton className="h-4 w-full mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

export default function UserServicesMarketplacePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      const response = await fetch('/api/marketplace/services');
      
      if (response.ok) {
        const data = await response.json();
        setServices(data || []);
      } else {
        console.error('Error fetching services');
        setServices([]);
      }
    } catch (error) {
      console.error('Error loading services:', error);
      toast.error('Error al cargar servicios');
      setServices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadServices();
  };

  const loadFavorites = () => {
    const stored = localStorage.getItem('marketplace_favorites');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Asegurar que siempre sea un array
      setFavorites(Array.isArray(parsed) ? parsed : []);
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
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.provider?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || service.category.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedServices = [...filteredServices].sort((a, b) => {
    switch (sortBy) {
      case 'precio_asc':
        return a.price - b.price;
      case 'precio_desc':
        return b.price - a.price;
      case 'valoracion':
        return (b.provider?.rating || 0) - (a.provider?.rating || 0);
      default:
        // Relevancia: destacados primero, luego por valoracion
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return (b.provider?.rating || 0) - (a.provider?.rating || 0);
    }
  });

  const formatPrice = (precio: number, tipo: string) => {
    if (tipo === 'quote' || tipo === 'presupuesto') return 'Solicitar presupuesto';
    if (precio === 0) return 'Consultar';
    const formatted = `€${precio}`;
    if (tipo === 'hour' || tipo === 'hora') return `${formatted}/hora`;
    return formatted;
  };

  const openRequestDialog = (service: MarketplaceService) => {
    setSelectedService(service);
    setIsRequestDialogOpen(true);
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/marketplace/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService?.id,
          ...requestForm,
        }),
      });

      if (response.ok) {
        toast.success('Solicitud enviada. El proveedor te contactara pronto.');
        setIsRequestDialogOpen(false);
        setRequestForm({ direccion: '', fecha: '', hora: '', notas: '' });
      } else {
        toast.error('Error al enviar solicitud');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Error al enviar solicitud');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Marketplace de Servicios</h1>
          <p className="text-muted-foreground">
            Encuentra profesionales de confianza para el mantenimiento de tu vivienda
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS.slice(0, 5).map((cat) => (
            <Skeleton key={cat.id} className="h-9 w-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Marketplace de Servicios</h1>
          <p className="text-muted-foreground">
            Encuentra profesionales de confianza para el mantenimiento de tu vivienda
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
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
      {sortedServices.some((s) => s.featured) && selectedCategory === 'all' && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            Servicios Destacados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedServices
              .filter((s) => s.featured)
              .map((service) => (
                <Card
                  key={service.id}
                  className="hover:shadow-lg transition-shadow border-yellow-200 bg-yellow-50/30"
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {getCategoryIcon(service.category)}
                        </div>
                        <Badge variant="secondary" className="capitalize">{service.category}</Badge>
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
                    <CardTitle className="text-lg mt-2">{service.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      {service.provider && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{service.provider.rating.toFixed(1)}</span>
                          <span className="text-sm text-muted-foreground">
                            ({service.provider.reviews})
                          </span>
                        </div>
                      )}
                      <span className="font-bold text-green-600">
                        {formatPrice(service.price, service.priceType)}
                      </span>
                    </div>

                    {service.provider && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium text-gray-700">{service.provider.name}</span>
                        {service.provider.verified && (
                          <Badge variant="outline" className="text-blue-600 border-blue-200">
                            ✓ Verificado
                          </Badge>
                        )}
                      </div>
                    )}

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
            ({sortedServices.filter((s) => !s.featured || selectedCategory !== 'all').length}{' '}
            disponibles)
          </span>
        </h2>

        {sortedServices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron servicios</h3>
              <p className="text-sm text-muted-foreground text-center">
                {services.length === 0
                  ? 'Aun no hay servicios disponibles en el marketplace. Los proveedores pueden publicar sus servicios desde el panel de proveedor.'
                  : 'Intenta con otros terminos de busqueda o categoria'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedServices
              .filter((s) => !s.featured || selectedCategory !== 'all')
              .map((service) => (
                <Card key={service.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {getCategoryIcon(service.category)}
                        </div>
                        <Badge variant="outline" className="capitalize">{service.category}</Badge>
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
                    <CardTitle className="text-lg mt-2">{service.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      {service.provider && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{service.provider.rating.toFixed(1)}</span>
                          <span className="text-sm text-muted-foreground">
                            ({service.provider.reviews})
                          </span>
                        </div>
                      )}
                      <span className="font-bold text-green-600">
                        {formatPrice(service.price, service.priceType)}
                      </span>
                    </div>

                    {service.provider && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-gray-700">{service.provider.name}</span>
                        {service.provider.verified && (
                          <Badge
                            variant="outline"
                            className="ml-2 text-xs text-blue-600 border-blue-200"
                          >
                            ✓ Verificado
                          </Badge>
                        )}
                      </div>
                    )}

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
              {selectedService?.name} - {selectedService?.provider?.name || 'Proveedor'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRequestSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="direccion">Direccion del servicio *</Label>
              <Input
                id="direccion"
                value={requestForm.direccion}
                onChange={(e) => setRequestForm({ ...requestForm, direccion: e.target.value })}
                placeholder="Calle, numero, piso..."
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

            {selectedService && selectedService.price > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Precio estimado:</span>
                  <span className="font-bold text-lg text-green-600">
                    {formatPrice(selectedService.price, selectedService.priceType)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  El precio final puede variar segun el trabajo especifico.
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
