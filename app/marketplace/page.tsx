'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingBag,
  Search,
  Star,
  TrendingUp,
  Users,
  Wrench,
  Sparkles,
  Wifi,
  Shield,
  DollarSign,
  Calendar,
  Heart,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import logger from '@/lib/logger';

interface Service {
  id: string;
  name: string;
  category: string;
  provider: {
    id: string;
    name: string;
    verified: boolean;
    rating: number;
    reviews: number;
  };
  description: string;
  price: number;
  priceType: 'fixed' | 'hourly' | 'monthly';
  image: string;
  featured: boolean;
  tags: string[];
}

interface MarketplaceStats {
  totalServices: number;
  totalBookings: number;
  totalRevenue: number;
  commissionRate: number;
}

const CATEGORIES = [
  { id: 'cleaning', name: 'Limpieza', icon: Sparkles },
  { id: 'maintenance', name: 'Reparaciones', icon: Wrench },
  { id: 'internet', name: 'Internet & TV', icon: Wifi },
  { id: 'insurance', name: 'Seguros', icon: Shield },
  { id: 'other', name: 'Otros', icon: ShoppingBag },
];

export default function MarketplacePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadMarketplaceData();
    }
  }, [status, router]);

  const loadMarketplaceData = async () => {
    try {
      setLoading(true);
      const [servicesRes, statsRes] = await Promise.all([
        fetch('/api/marketplace/services'),
        fetch('/api/marketplace/stats'),
      ]);

      if (servicesRes.ok) {
        const data = await servicesRes.json();
        setServices(data);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (error) {
      logger.error('Error loading marketplace data:', error);
      toast.error('Error al cargar marketplace');
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleBookService = async (serviceId: string) => {
    try {
      const response = await fetch('/api/marketplace/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId }),
      });

      if (response.ok) {
        toast.success('Servicio solicitado correctamente');
        router.push('/marketplace/mis-reservas');
      } else {
        toast.error('Error al solicitar servicio');
      }
    } catch (error) {
      logger.error('Error booking service:', error);
      toast.error('Error al solicitar servicio');
    }
  };

  const toggleFavorite = (serviceId: string) => {
    if (favorites.includes(serviceId)) {
      setFavorites(favorites.filter((id) => id !== serviceId));
    } else {
      setFavorites([...favorites, serviceId]);
    }
  };

  const formatPrice = (price: number, type: string) => {
    const formatted = `€${price}`;
    if (type === 'hourly') return `${formatted}/hora`;
    if (type === 'monthly') return `${formatted}/mes`;
    return formatted;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Cargando marketplace...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Marketplace de Servicios
                </h1>
                <p className="text-muted-foreground mt-2">
                  Contrata servicios verificados para tus propiedades e inquilinos
                </p>
              </div>
              <Button onClick={() => router.push('/marketplace/proveedor')}>
                <Users className="h-4 w-4 mr-2" />
                Ser Proveedor
              </Button>
            </div>

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Servicios Disponibles</CardTitle>
                      <ShoppingBag className="h-4 w-4 text-purple-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalServices}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Reservas Totales</CardTitle>
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalBookings}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Facturación</CardTitle>
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">€{stats.totalRevenue.toLocaleString()}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Comisión</CardTitle>
                      <TrendingUp className="h-4 w-4 text-orange-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.commissionRate}%</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Search & Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar servicios..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <Button
                      variant={selectedCategory === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory('all')}
                    >
                      Todos
                    </Button>
                    {CATEGORIES.map((category) => {
                      const Icon = category.icon;
                      return (
                        <Button
                          key={category.id}
                          variant={selectedCategory === category.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedCategory(category.id)}
                        >
                          <Icon className="h-3 w-3 mr-1" />
                          {category.name}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Services Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <Card key={service.id} className="hover:shadow-lg transition-shadow group">
                  <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShoppingBag className="h-16 w-16 text-purple-300" />
                    </div>
                    {service.featured && (
                      <Badge className="absolute top-2 left-2 bg-yellow-500">
                        <Star className="h-3 w-3 mr-1" />
                        Destacado
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                      onClick={() => toggleFavorite(service.id)}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          favorites.includes(service.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'
                        }`}
                      />
                    </Button>
                  </div>

                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{service.name}</CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">
                          {service.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          <span className="font-semibold">{service.provider.rating}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          ({service.provider.reviews} valoraciones)
                        </span>
                      </div>
                      {service.provider.verified && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          ✓ Verificado
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">Proveedor</p>
                        <p className="font-medium">{service.provider.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-600">
                          {formatPrice(service.price, service.priceType)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => router.push(`/marketplace/servicios/${service.id}`)}
                      >
                        Ver Detalles
                      </Button>
                      <Button variant="outline" onClick={() => handleBookService(service.id)}>
                        Contratar
                      </Button>
                    </div>

                    <div className="flex gap-1 flex-wrap">
                      {service.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredServices.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No se encontraron servicios</h3>
                  <p className="text-sm text-muted-foreground">
                    Prueba con otra búsqueda o categoría
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
