'use client';
export const dynamic = 'force-dynamic';


import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Home,
  ArrowLeft,
  Hotel,
  TrendingUp,
  Star,
  Calendar,
  Plus,
  Search,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import logger, { logError } from '@/lib/logger';


interface STRListing {
  id: string;
  titulo: string;
  descripcion: string;
  tipoPropiedad: string;
  capacidadMaxima: number;
  numDormitorios: number;
  numCamas: number;
  numBanos: number;
  precioPorNoche: number;
  precioSemana?: number;
  precioMes?: number;
  tarifaLimpieza: number;
  amenities: string[];
  checkInTime: string;
  checkOutTime: string;
  totalReservas: number;
  ratingPromedio?: number;
  totalReviews: number;
  tasaOcupacion?: number;
  activo: boolean;
  unit: {
    numero: string;
    building: {
      nombre: string;
    };
  };
  bookings: any[];
  channels: any[];
}

export default function STRListingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [listings, setListings] = useState<STRListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActivo, setFilterActivo] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchListings();
    }
  }, [session]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/str/listings');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setListings(data);
    } catch (error) {
      logger.error('Error fetching listings:', error);
      toast.error('Error al cargar los anuncios');
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      listing.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.unit.building.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.tipoPropiedad.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesActivo =
      filterActivo === 'all' || (filterActivo === 'true' ? listing.activo : !listing.activo);

    return matchesSearch && matchesActivo;
  });

  const totalActivos = listings.filter((l) => l.activo).length;
  const avgOccupancy =
    listings.length > 0
      ? listings.reduce((sum, l) => sum + (l.tasaOcupacion || 0), 0) / listings.length
      : 0;
  const totalReservas = listings.reduce((sum, l) => sum + l.totalReservas, 0);
  const avgRating =
    listings.length > 0
      ? listings.reduce((sum, l) => sum + (l.ratingPromedio || 0), 0) / listings.length
      : 0;

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando anuncios turísticos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumbs y Botón Volver */}
            <div className="mb-6 flex items-center justify-between">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/" className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Inicio
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Anuncios Turísticos</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Dashboard
              </Button>
            </div>

            {/* Header con Título */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Hotel className="h-8 w-8" />
                Anuncios Turísticos (STR)
              </h1>
              <p className="text-muted-foreground mt-2">
                Gestiona tus propiedades en plataformas como Airbnb, Booking, VRBO
              </p>
            </div>

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
                  <Hotel className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{listings.length}</div>
                  <p className="text-xs text-muted-foreground">{totalActivos} activos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ocupación Media</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{avgOccupancy.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">Últimos 30 días</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalReservas}</div>
                  <p className="text-xs text-muted-foreground">Desde el inicio</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rating Medio</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{avgRating.toFixed(1)} ⭐</div>
                  <p className="text-xs text-muted-foreground">Promedio general</p>
                </CardContent>
              </Card>
            </div>

            {/* Filtros y Búsqueda */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título, edificio, tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterActivo} onValueChange={setFilterActivo}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Activos</SelectItem>
                  <SelectItem value="false">Inactivos</SelectItem>
                </SelectContent>
              </Select>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Anuncio
              </Button>
            </div>

            {/* Lista de Listings */}
            {filteredListings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Hotel className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay anuncios turísticos</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm || filterActivo !== 'all'
                      ? 'No se encontraron resultados con los filtros aplicados'
                      : 'Comienza creando tu primer anuncio para plataformas como Airbnb o Booking'}
                  </p>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Crear Primer Anuncio
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredListings.map((listing) => (
                  <Card key={listing.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-1">{listing.titulo}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {listing.unit.building.nombre} - Unidad {listing.unit.numero}
                          </p>
                        </div>
                        <Badge variant={listing.activo ? 'default' : 'secondary'}>
                          {listing.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Tipo:</span>
                          <span className="font-medium">{listing.tipoPropiedad}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Capacidad:</span>
                          <span className="font-medium">{listing.capacidadMaxima} personas</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">🛏️</span>
                            <span>{listing.numDormitorios}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">🛋️</span>
                            <span>{listing.numCamas}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">🚿</span>
                            <span>{listing.numBanos}</span>
                          </div>
                        </div>
                        <div className="border-t pt-3">
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold">€{listing.precioPorNoche}</span>
                            <span className="text-sm text-muted-foreground">/noche</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Ocupación</p>
                            <p className="font-semibold">
                              {listing.tasaOcupacion?.toFixed(0) || 0}%
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Rating</p>
                            <p className="font-semibold">
                              {listing.ratingPromedio?.toFixed(1) || '-'} ⭐
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{listing.totalReservas} reservas</span>
                          <span>{listing.totalReviews} reviews</span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button size="sm" className="flex-1">
                            Ver Detalles
                          </Button>
                          <Button size="sm" variant="outline">
                            Editar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
