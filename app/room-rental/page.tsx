'use client';

import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  BedDouble,
  Users,
  DollarSign,
  Calendar,
  Plus,
  Filter,
  MapPin,
  Wifi,
  Bath,
  Square,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';

// Mock data para habitaciones
const mockRooms = [
  {
    id: '1',
    name: 'Habitación Principal',
    property: 'Piso Compartido Chamberí',
    address: 'Calle Alonso Cano 45, Madrid',
    price: 550,
    status: 'occupied',
    tenant: 'Carlos Ruiz',
    contractEnd: new Date(Date.now() + 30 * 86400000),
    size: 14,
    amenities: ['wifi', 'bathroom', 'furnished'],
  },
  {
    id: '2',
    name: 'Habitación Exterior',
    property: 'Piso Compartido Chamberí',
    address: 'Calle Alonso Cano 45, Madrid',
    price: 480,
    status: 'available',
    tenant: null,
    contractEnd: null,
    size: 12,
    amenities: ['wifi', 'furnished'],
  },
  {
    id: '3',
    name: 'Habitación Suite',
    property: 'Coliving Malasaña',
    address: 'Calle Fuencarral 78, Madrid',
    price: 750,
    status: 'occupied',
    tenant: 'Ana López',
    contractEnd: new Date(Date.now() + 90 * 86400000),
    size: 18,
    amenities: ['wifi', 'bathroom', 'furnished', 'balcony'],
  },
  {
    id: '4',
    name: 'Habitación Interior',
    property: 'Coliving Malasaña',
    address: 'Calle Fuencarral 78, Madrid',
    price: 420,
    status: 'reserved',
    tenant: 'Pedro Martín',
    contractEnd: null,
    size: 10,
    amenities: ['wifi', 'furnished'],
  },
];

const statusConfig = {
  available: { label: 'Disponible', color: 'bg-green-100 text-green-800' },
  occupied: { label: 'Ocupada', color: 'bg-blue-100 text-blue-800' },
  reserved: { label: 'Reservada', color: 'bg-yellow-100 text-yellow-800' },
  maintenance: { label: 'En Mantenimiento', color: 'bg-red-100 text-red-800' },
};

export default function RoomRentalPage() {
  const [activeTab, setActiveTab] = useState('all');

  const stats = {
    totalRooms: 12,
    occupiedRooms: 8,
    availableRooms: 3,
    reservedRooms: 1,
    occupancyRate: 67,
    averageRent: 520,
    monthlyRevenue: 4160,
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Alquiler por Habitaciones</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Alquiler por Habitaciones</h1>
            <p className="text-muted-foreground">
              Gestiona habitaciones en pisos compartidos y colivings
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Habitación
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Habitaciones</CardTitle>
              <BedDouble className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRooms}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{stats.occupiedRooms} ocupadas</Badge>
                <Badge variant="outline">{stats.availableRooms} disponibles</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ocupación</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.occupancyRate}%</div>
              <Progress value={stats.occupancyRate} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Renta Promedio</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRent}€</div>
              <p className="text-xs text-muted-foreground">por habitación/mes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthlyRevenue.toLocaleString()}€</div>
              <p className="text-xs text-muted-foreground">proyectado este mes</p>
            </CardContent>
          </Card>
        </div>

        {/* Rooms List */}
        <Card>
          <CardHeader>
            <CardTitle>Habitaciones</CardTitle>
            <CardDescription>
              Listado de todas las habitaciones en tu cartera
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="available">Disponibles</TabsTrigger>
                <TabsTrigger value="occupied">Ocupadas</TabsTrigger>
              </TabsList>
              <TabsContent value={activeTab} className="mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {mockRooms
                    .filter((room) => activeTab === 'all' || room.status === activeTab)
                    .map((room) => {
                      const statusInfo = statusConfig[room.status as keyof typeof statusConfig];

                      return (
                        <Card key={room.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-semibold">{room.name}</h3>
                                <p className="text-sm text-muted-foreground">{room.property}</p>
                              </div>
                              <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                            </div>

                            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                              <MapPin className="h-3 w-3" />
                              {room.address}
                            </div>

                            <div className="flex items-center gap-4 text-sm mb-3">
                              <span className="flex items-center gap-1">
                                <Square className="h-3 w-3" />
                                {room.size}m²
                              </span>
                              {room.amenities.includes('wifi') && (
                                <span className="flex items-center gap-1">
                                  <Wifi className="h-3 w-3" />
                                  WiFi
                                </span>
                              )}
                              {room.amenities.includes('bathroom') && (
                                <span className="flex items-center gap-1">
                                  <Bath className="h-3 w-3" />
                                  Baño Privado
                                </span>
                              )}
                            </div>

                            <div className="flex justify-between items-center pt-3 border-t">
                              <div>
                                <span className="text-2xl font-bold">{room.price}€</span>
                                <span className="text-sm text-muted-foreground">/mes</span>
                              </div>
                              {room.tenant && (
                                <div className="text-right">
                                  <p className="text-sm font-medium">{room.tenant}</p>
                                  {room.contractEnd && (
                                    <p className="text-xs text-muted-foreground">
                                      Contrato hasta{' '}
                                      {room.contractEnd.toLocaleDateString('es-ES', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                      })}
                                    </p>
                                  )}
                                </div>
                              )}
                              {!room.tenant && (
                                <Button size="sm">Ver Detalles</Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
