'use client';

import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';

import { useEffect, useState } from 'react';
import logger from '@/lib/logger';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Edit,
  Wifi,
  Calendar,
  Star,
  DollarSign,
  Users,
  Home,
  MapPin,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Listing {
  id: string;
  titulo: string;
  descripcion: string;
  tipoPropiedad: string;
  capacidadMaxima: number;
  numDormitorios: number;
  numCamas: number;
  numBanos: number;
  amenities: string[];
  reglasHospedaje: string[];
  precioPorNoche: number;
  precioSemana?: number;
  precioMes?: number;
  tarifaLimpieza: number;
  depositoSeguridad: number;
  comisionPlataforma: number;
  checkInTime: string;
  checkOutTime: string;
  cancelacionFlexible: boolean;
  reservaInstantanea: boolean;
  sincronizarCanales: boolean;
  canalPrincipal?: string;
  totalReservas: number;
  ratingPromedio?: number;
  totalReviews: number;
  tasaOcupacion?: number;
  activo: boolean;
  unit: {
    referencia: string;
    direccion: string;
    building: {
      nombre: string;
      direccion: string;
    };
  };
  channels: any[];
  bookings: any[];
  reviews: any[];
  seasonPricing: any[];
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params?.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!listingId) return;
    loadListing();
  }, [listingId]);

  const loadListing = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/str/listings/${listingId}`);
      if (!res.ok) throw new Error('Error al cargar listing');
      const data = await res.json();
      setListing(data);
    } catch (error) {
      logger.error('Error cargando listing:', error);
      toast.error('Error al cargar el listing');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Listing no encontrado</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const connectedChannels = listing.channels.filter((c) => c.activo).length;

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/str/listings')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Listings
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-bold">{listing.titulo}</h1>
                {listing.activo ? (
                <Badge className="bg-green-500">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Activo
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Clock className="mr-1 h-3 w-3" />
                  Inactivo
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              <MapPin className="mr-1 inline-block h-4 w-4" />
              {listing.unit.direccion} - {listing.unit.building.nombre}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/str/listings/${listingId}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button
              onClick={() =>
                router.push(`/str/listings/${listingId}/channels`)
              }
            >
              <Wifi className="mr-2 h-4 w-4" />
              Gestionar Canales
            </Button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="mb-6 grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Precio por Noche
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{listing.precioPorNoche}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reservas Totales
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listing.totalReservas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {listing.ratingPromedio ? listing.ratingPromedio.toFixed(1) : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {listing.totalReviews} reseñas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tasa de Ocupación
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {listing.tasaOcupacion ? `${listing.tasaOcupacion.toFixed(1)}%` : '--'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Canales Conectados
            </CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedChannels}</div>
              <p className="text-xs text-muted-foreground">
              de {listing.channels.length} configurados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de contenido */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">
            <Home className="mr-2 h-4 w-4" />
            Información
          </TabsTrigger>
          <TabsTrigger value="bookings">
            <Calendar className="mr-2 h-4 w-4" />
            Reservas
          </TabsTrigger>
          <TabsTrigger value="reviews">
            <Star className="mr-2 h-4 w-4" />
            Reseñas
          </TabsTrigger>
          <TabsTrigger value="pricing">
            <DollarSign className="mr-2 h-4 w-4" />
            Precios
          </TabsTrigger>
        </TabsList>

        {/* Tab: Información */}
        <TabsContent value="info">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Descripción
                  </p>
                  <p className="text-sm">{listing.descripcion}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Tipo de Propiedad
                    </p>
                    <p className="text-sm">{listing.tipoPropiedad}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Capacidad Máxima
                    </p>
                    <p className="text-sm">
                      {listing.capacidadMaxima} personas
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Dormitorios
                    </p>
                    <p className="text-sm">{listing.numDormitorios}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Camas
                    </p>
                    <p className="text-sm">{listing.numCamas}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Baños
                    </p>
                    <p className="text-sm">{listing.numBanos}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Amenities
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {listing.amenities.map((amenity, index) => (
                      <Badge key={index} variant="secondary">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuración de Reservas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Check-in
                    </p>
                    <p className="text-sm">{listing.checkInTime}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Check-out
                    </p>
                    <p className="text-sm">{listing.checkOutTime}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      Cancelación Flexible
                    </p>
                    {listing.cancelacionFlexible ? (
                      <Badge className="bg-green-500">Sí</Badge>
                        ) : (
                      <Badge variant="secondary">No</Badge>
                        )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      Reserva Instantánea
                    </p>
                    {listing.reservaInstantanea ? (
                      <Badge className="bg-green-500">Sí</Badge>
                        ) : (
                      <Badge variant="secondary">No</Badge>
                        )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      Sincronizar Canales
                    </p>
                    {listing.sincronizarCanales ? (
                      <Badge className="bg-green-500">Sí</Badge>
                        ) : (
                      <Badge variant="secondary">No</Badge>
                        )}
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Reglas del Hospedaje
                  </p>
                  <ul className="mt-2 space-y-1">
                    {listing.reglasHospedaje.map((regla, index) => (
                      <li key={index} className="text-sm">
                        • {regla}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Reservas */}
        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Últimas Reservas</CardTitle>
                <CardDescription>
                {listing.bookings.length} reservas recientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {listing.bookings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay reservas recientes
                </p>
              ) : (
                <div className="space-y-4">
                  {listing.bookings.slice(0, 5).map((booking: any) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium">{booking.guestNombre}</p>
                          <p className="text-sm text-muted-foreground">
                          {format(new Date(booking.checkInDate), "d MMM 'al' ", {
                            locale: es,
                          })}
                          {format(new Date(booking.checkOutDate), 'd MMM yyyy', {
                            locale: es,
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          €{booking.precioTotal.toFixed(2)}
                        </p>
                        <Badge
                          className={
                            booking.estado === 'CONFIRMADA'
                              ? 'bg-green-500'
                              : 'bg-blue-500'
                          }
                        >
                          {booking.estado}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Reseñas */}
        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Reseñas</CardTitle>
                <CardDescription>
                {listing.reviews.length} reseñas recientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {listing.reviews.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay reseñas aún
                </p>
              ) : (
                <div className="space-y-4">
                  {listing.reviews.slice(0, 5).map((review: any) => (
                    <div
                      key={review.id}
                      className="rounded-lg border p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{review.guestNombre}</p>
                            <p className="text-sm text-muted-foreground">
                            {format(new Date(review.fecha), "d 'de' MMMM yyyy", {
                              locale: es,
                            })}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="ml-1 font-medium">
                            {review.rating}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm">{review.comentario}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Precios */}
        <TabsContent value="pricing">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tarifas Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Precio por noche</p>
                    <p className="text-lg font-bold">
                    €{listing.precioPorNoche}
                  </p>
                </div>
                {listing.precioSemana && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Precio por semana</p>
                      <p className="text-lg font-bold">
                      €{listing.precioSemana}
                    </p>
                  </div>
                )}
                {listing.precioMes && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Precio por mes</p>
                      <p className="text-lg font-bold">€{listing.precioMes}</p>
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Tarifa de limpieza</p>
                    <p className="text-lg font-bold">
                    €{listing.tarifaLimpieza}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Depósito de seguridad</p>
                    <p className="text-lg font-bold">
                    €{listing.depositoSeguridad}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Comisión plataforma</p>
                    <p className="text-lg font-bold">
                    {listing.comisionPlataforma}%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Precios por Temporada</CardTitle>
              </CardHeader>
              <CardContent>
                {listing.seasonPricing.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay precios por temporada configurados
                  </p>
                ) : (
                  <div className="space-y-4">
                    {listing.seasonPricing.map((season: any) => (
                      <div
                        key={season.id}
                        className="rounded-lg border p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{season.nombre}</p>
                              <p className="text-sm text-muted-foreground">
                              {format(new Date(season.fechaInicio), "d MMM", {
                                locale: es,
                              })}
                              {' - '}
                              {format(new Date(season.fechaFin), "d MMM yyyy", {
                                locale: es,
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">
                              €{season.precioPorNoche}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              por noche
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
