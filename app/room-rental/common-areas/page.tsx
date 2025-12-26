'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Home,
  Coffee,
  Dumbbell,
  Wifi,
  Tv,
  UtensilsCrossed,
  Sofa,
  Calendar,
  Users,
  Clock,
  Plus,
  Settings,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface CommonArea {
  id: string;
  name: string;
  type: 'kitchen' | 'living_room' | 'gym' | 'coworking' | 'terrace' | 'laundry';
  capacity: number;
  amenities: string[];
  availability: 'available' | 'occupied' | 'maintenance';
  rules: string[];
  bookable: boolean;
  currentOccupancy: number;
  maintenanceSchedule?: string;
  lastCleaning: string;
  nextCleaning: string;
}

interface Booking {
  id: string;
  areaId: string;
  areaName: string;
  tenantName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export default function CommonAreasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [areas, setAreas] = useState<CommonArea[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    }
  }, [status]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Mock data
      setAreas([
        {
          id: 'a1',
          name: 'Cocina Compartida',
          type: 'kitchen',
          capacity: 8,
          amenities: ['Horno', 'Microondas', 'Nevera Grande', 'Lavavajillas', 'Cafetera'],
          availability: 'available',
          rules: [
            'Limpia después de usar',
            'No dejes alimentos en la nevera sin etiquetar',
            'Respeta los turnos de cocina',
          ],
          bookable: false,
          currentOccupancy: 2,
          lastCleaning: '2025-12-26 08:00',
          nextCleaning: '2025-12-27 08:00',
        },
        {
          id: 'a2',
          name: 'Sala de Estar',
          type: 'living_room',
          capacity: 15,
          amenities: ['TV 65"', 'Netflix', 'PlayStation 5', 'Sofás', 'Biblioteca'],
          availability: 'available',
          rules: [
            'Volumen moderado después de las 22:00',
            'No consumir alimentos fuertes',
          ],
          bookable: false,
          currentOccupancy: 5,
          lastCleaning: '2025-12-26 14:00',
          nextCleaning: '2025-12-26 18:00',
        },
        {
          id: 'a3',
          name: 'Gimnasio',
          type: 'gym',
          capacity: 6,
          amenities: ['Pesas', 'Cinta de Correr', 'Bicicleta Estática', 'Esterillas'],
          availability: 'available',
          rules: [
            'Reserva máxima 1 hora',
            'Limpia equipos después de usar',
            'Usa toalla propia',
          ],
          bookable: true,
          currentOccupancy: 3,
          lastCleaning: '2025-12-26 06:00',
          nextCleaning: '2025-12-27 06:00',
        },
        {
          id: 'a4',
          name: 'Espacio Coworking',
          type: 'coworking',
          capacity: 12,
          amenities: ['WiFi 1Gbps', 'Mesas Amplias', 'Enchufes', 'Impresora', 'Pizarra'],
          availability: 'available',
          rules: [
            'Silencio absoluto',
            'Videollamadas en cabinas',
            'No reservar más de 4 horas seguidas',
          ],
          bookable: true,
          currentOccupancy: 7,
          lastCleaning: '2025-12-26 07:00',
          nextCleaning: '2025-12-27 07:00',
        },
        {
          id: 'a5',
          name: 'Terraza',
          type: 'terrace',
          capacity: 20,
          amenities: ['BBQ', 'Mesas', 'Sillas', 'Luces Ambiente', 'Plantas'],
          availability: 'maintenance',
          rules: [
            'Reserva para eventos con 48h anticipación',
            'Limpieza obligatoria después de BBQ',
            'Música hasta las 23:00',
          ],
          bookable: true,
          currentOccupancy: 0,
          maintenanceSchedule: 'Reparación impermeabilización - hasta 28/12',
          lastCleaning: '2025-12-20 10:00',
          nextCleaning: '2025-12-28 10:00',
        },
        {
          id: 'a6',
          name: 'Lavandería',
          type: 'laundry',
          capacity: 4,
          amenities: ['3 Lavadoras', '2 Secadoras', 'Tabla de Planchar'],
          availability: 'available',
          rules: [
            'Máximo 2 horas por uso',
            'Retira ropa inmediatamente al terminar',
            'Reporta averías',
          ],
          bookable: true,
          currentOccupancy: 1,
          lastCleaning: '2025-12-26 12:00',
          nextCleaning: '2025-12-27 12:00',
        },
      ]);

      setBookings([
        {
          id: 'b1',
          areaId: 'a3',
          areaName: 'Gimnasio',
          tenantName: 'Laura Martínez',
          date: '2025-12-26',
          startTime: '18:00',
          endTime: '19:00',
          status: 'confirmed',
        },
        {
          id: 'b2',
          areaId: 'a4',
          areaName: 'Espacio Coworking',
          tenantName: 'David González',
          date: '2025-12-26',
          startTime: '14:00',
          endTime: '18:00',
          status: 'confirmed',
        },
        {
          id: 'b3',
          areaId: 'a5',
          areaName: 'Terraza',
          tenantName: 'Ana Rodríguez',
          date: '2025-12-31',
          startTime: '20:00',
          endTime: '02:00',
          status: 'pending',
        },
      ]);

    } catch (error) {
      toast.error('Error al cargar espacios comunes');
    } finally {
      setLoading(false);
    }
  };

  const getAreaIcon = (type: string) => {
    const icons = {
      kitchen: UtensilsCrossed,
      living_room: Sofa,
      gym: Dumbbell,
      coworking: Wifi,
      terrace: Home,
      laundry: Settings,
    };
    return icons[type as keyof typeof icons] || Home;
  };

  const getAvailabilityBadge = (availability: string) => {
    const config = {
      available: { color: 'bg-green-500', label: 'Disponible', icon: CheckCircle },
      occupied: { color: 'bg-yellow-500', label: 'Ocupado', icon: Users },
      maintenance: { color: 'bg-red-500', label: 'Mantenimiento', icon: AlertCircle },
    };
    const { color, label, icon: Icon } = config[availability as keyof typeof config] || config.available;
    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getBookingStatusBadge = (status: string) => {
    const config = {
      confirmed: { color: 'bg-green-500', label: 'Confirmada' },
      pending: { color: 'bg-yellow-500', label: 'Pendiente' },
      cancelled: { color: 'bg-red-500', label: 'Cancelada' },
    };
    const { color, label } = config[status as keyof typeof config] || config.pending;
    return <Badge className={color}>{label}</Badge>;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Cargando espacios comunes...</p>
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
                <h1 className="text-3xl font-bold">Espacios Comunes</h1>
                <p className="text-muted-foreground mt-2">
                  Gestión y reservas de áreas compartidas
                </p>
              </div>
              <Button onClick={() => router.push('/room-rental/common-areas/reservar')}>
                <Calendar className="h-4 w-4 mr-2" />
                Nueva Reserva
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Espacios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{areas.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {areas.filter(a => a.availability === 'available').length} disponibles
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Ocupación Actual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {areas.reduce((sum, a) => sum + a.currentOccupancy, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Personas ahora</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Reservas Hoy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {bookings.filter(b => b.date === '2025-12-26').length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Activas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">En Mantenimiento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {areas.filter(a => a.availability === 'maintenance').length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Espacios</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="areas" className="space-y-4">
              <TabsList>
                <TabsTrigger value="areas">Espacios</TabsTrigger>
                <TabsTrigger value="bookings">Reservas</TabsTrigger>
                <TabsTrigger value="rules">Normas</TabsTrigger>
              </TabsList>

              <TabsContent value="areas" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {areas.map((area) => {
                    const Icon = getAreaIcon(area.type);
                    const occupancyPercentage = (area.currentOccupancy / area.capacity) * 100;

                    return (
                      <Card key={area.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-3 bg-blue-100 rounded-lg">
                                <Icon className="h-6 w-6 text-blue-600" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{area.name}</CardTitle>
                                <CardDescription>
                                  Capacidad: {area.capacity} personas
                                </CardDescription>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            {getAvailabilityBadge(area.availability)}
                            {area.bookable && (
                              <Badge variant="outline" className="text-xs">
                                <Calendar className="h-3 w-3 mr-1" />
                                Reservable
                              </Badge>
                            )}
                          </div>

                          {area.availability !== 'maintenance' && (
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-muted-foreground">Ocupación actual</span>
                                <span className="font-medium">
                                  {area.currentOccupancy}/{area.capacity}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    occupancyPercentage >= 80 ? 'bg-red-500' :
                                    occupancyPercentage >= 50 ? 'bg-yellow-500' :
                                    'bg-green-500'
                                  }`}
                                  style={{ width: `${occupancyPercentage}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {area.maintenanceSchedule && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-xs text-red-900">{area.maintenanceSchedule}</p>
                            </div>
                          )}

                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">Amenidades:</p>
                            <div className="flex flex-wrap gap-1">
                              {area.amenities.map((amenity, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {amenity}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="pt-3 border-t text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Última limpieza:</span>
                              <span className="font-medium">{formatDateTime(area.lastCleaning)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Próxima limpieza:</span>
                              <span className="font-medium">{formatDateTime(area.nextCleaning)}</span>
                            </div>
                          </div>

                          {area.bookable && area.availability !== 'maintenance' && (
                            <Button
                              className="w-full"
                              onClick={() => toast.info('Abriendo calendario de reservas...')}
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              Reservar
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="bookings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Próximas Reservas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {bookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold">{booking.areaName}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Inquilino: <span className="font-medium">{booking.tenantName}</span>
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(booking.date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {booking.startTime} - {booking.endTime}
                              </span>
                            </div>
                          </div>
                          {getBookingStatusBadge(booking.status)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rules" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {areas.map((area) => (
                    <Card key={area.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{area.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {area.rules.map((rule, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <span>{rule}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </AuthenticatedLayout>
  );
}
