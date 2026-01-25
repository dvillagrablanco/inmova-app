'use client';

import { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import Link from 'next/link';
import { 
  Palmtree, Calendar, Euro, Star, Home, TrendingUp,
  Users, Bed, MapPin, ExternalLink, BarChart3
} from 'lucide-react';

interface Listing {
  id: string;
  titulo: string;
  direccion: string;
  tipoPropiedad: string;
  numHuespedes: number;
  habitaciones: number;
  banos: number;
  precioBase: number;
  imagenPrincipal?: string;
  estadoPublicacion: string;
  rating?: number;
  numReviews?: number;
}

interface Stats {
  totalListings: number;
  listingsActivos: number;
  reservasProximas: number;
  ingresosMes: number;
  tasaOcupacion: number;
}

export default function TurismoAlquilerPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      // Cargar listings
      const listingsRes = await fetch('/api/str/listings');
      if (listingsRes.ok) {
        const data = await listingsRes.json();
        setListings(data.data || []);
      }

      // Cargar dashboard stats
      const dashboardRes = await fetch('/api/str/dashboard');
      if (dashboardRes.ok) {
        const data = await dashboardRes.json();
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar datos de alquiler turístico');
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getEstadoBadge = (estado: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      publicado: { label: 'Publicado', variant: 'default' },
      pausado: { label: 'Pausado', variant: 'secondary' },
      borrador: { label: 'Borrador', variant: 'outline' },
    };
    const c = config[estado] || config.borrador;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64" />)}
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Alquiler Turístico</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Palmtree className="h-6 w-6 text-green-500" />
              Alquiler Turístico (STR)
            </h1>
            <p className="text-muted-foreground">
              Gestión de propiedades de alquiler vacacional
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/str/listings/nuevo">
              <Button>
                <Home className="h-4 w-4 mr-2" />
                Nuevo Listing
              </Button>
            </Link>
            <Link href="/str/channels">
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Canales
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{stats.totalListings || listings.length}</div>
                <div className="text-sm text-muted-foreground">Total Propiedades</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-600">{stats.listingsActivos || 0}</div>
                <div className="text-sm text-muted-foreground">Activos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-blue-600">{stats.reservasProximas || 0}</div>
                <div className="text-sm text-muted-foreground">Reservas Próximas</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{formatCurrency(stats.ingresosMes || 0)}</div>
                <div className="text-sm text-muted-foreground">Ingresos Este Mes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-purple-600">{stats.tasaOcupacion || 0}%</div>
                <div className="text-sm text-muted-foreground">Tasa Ocupación</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/str/bookings">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4 flex items-center gap-3">
                <Calendar className="h-8 w-8 text-blue-500" />
                <div>
                  <div className="font-medium">Reservas</div>
                  <div className="text-sm text-muted-foreground">Ver calendario</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/str/pricing">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4 flex items-center gap-3">
                <Euro className="h-8 w-8 text-green-500" />
                <div>
                  <div className="font-medium">Precios</div>
                  <div className="text-sm text-muted-foreground">Pricing dinámico</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/str/reviews">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4 flex items-center gap-3">
                <Star className="h-8 w-8 text-yellow-500" />
                <div>
                  <div className="font-medium">Reseñas</div>
                  <div className="text-sm text-muted-foreground">Valoraciones</div>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/str-housekeeping">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4 flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-purple-500" />
                <div>
                  <div className="font-medium">Limpieza</div>
                  <div className="text-sm text-muted-foreground">Gestión turnover</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Listings Grid */}
        {listings.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Palmtree className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg">No hay propiedades turísticas</h3>
                <p className="text-muted-foreground mb-4">
                  Crea tu primer listing para empezar
                </p>
                <Link href="/str/listings/nuevo">
                  <Button>
                    <Home className="h-4 w-4 mr-2" />
                    Crear Listing
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Card key={listing.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div 
                  className="h-40 bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center"
                  style={listing.imagenPrincipal ? {
                    backgroundImage: `url(${listing.imagenPrincipal})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  } : {}}
                >
                  {!listing.imagenPrincipal && (
                    <Home className="h-16 w-16 text-white/50" />
                  )}
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{listing.titulo}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {listing.direccion}
                      </CardDescription>
                    </div>
                    {getEstadoBadge(listing.estadoPublicacion)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {listing.numHuespedes} huéspedes
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Bed className="h-4 w-4" />
                      {listing.habitaciones} hab.
                    </span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(listing.precioBase)}/noche
                    </span>
                  </div>
                  
                  {listing.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{listing.rating.toFixed(1)}</span>
                      {listing.numReviews && (
                        <span className="text-muted-foreground text-sm">
                          ({listing.numReviews} reseñas)
                        </span>
                      )}
                    </div>
                  )}

                  <Link href={`/str/listings/${listing.id}`}>
                    <Button variant="outline" className="w-full">
                      Ver Detalles
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
