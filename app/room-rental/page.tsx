'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Euro,
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
import { toast } from 'sonner';

interface Room {
  id: string;
  name: string;
  property: string;
  address: string;
  price: number;
  status: string;
  tenant: string | null;
  contractEnd: string | null;
  size: number;
  amenities: string[];
}

const statusConfig = {
  available: { label: 'Disponible', color: 'bg-green-100 text-green-800' },
  occupied: { label: 'Ocupada', color: 'bg-blue-100 text-blue-800' },
  reserved: { label: 'Reservada', color: 'bg-yellow-100 text-yellow-800' },
  maintenance: { label: 'En Mantenimiento', color: 'bg-red-100 text-red-800' },
};

export default function RoomRentalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: '',
    unitId: '',
    price: 0,
    size: 0,
    hasPrivateBathroom: false,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchRooms();
      fetchProperties();
    }
  }, [status]);

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/units');
      if (response.ok) {
        const data = await response.json();
        setProperties(data);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.unitId || !form.price) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        toast.success('Habitación creada exitosamente');
        setOpenDialog(false);
        setForm({ name: '', unitId: '', price: 0, size: 0, hasPrivateBathroom: false });
        fetchRooms();
      } else {
        toast.error('Error al crear habitación');
      }
    } catch (error) {
      toast.error('Error al crear habitación');
    }
  };

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === 'occupied').length;
  const availableRooms = rooms.filter((r) => r.status === 'available').length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const averageRent =
    totalRooms > 0 ? Math.round(rooms.reduce((sum, r) => sum + r.price, 0) / totalRooms) : 0;
  const monthlyRevenue = rooms
    .filter((r) => r.status === 'occupied')
    .reduce((sum, r) => sum + r.price, 0);

  const stats = {
    totalRooms,
    occupiedRooms,
    availableRooms,
    reservedRooms: rooms.filter((r) => r.status === 'reserved').length,
    occupancyRate,
    averageRent,
    monthlyRevenue,
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

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
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Habitación
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nueva Habitación</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Nombre de la Habitación *</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Ej: Habitación Principal"
                    />
                  </div>
                  <div>
                    <Label>Propiedad *</Label>
                    <Select
                      value={form.unitId}
                      onValueChange={(v) => setForm({ ...form, unitId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona propiedad" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.building?.nombre} - {p.numero}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Precio Mensual (€) *</Label>
                      <Input
                        type="number"
                        min="0"
                        value={form.price}
                        onChange={(e) =>
                          setForm({ ...form, price: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div>
                      <Label>Tamaño (m²)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={form.size}
                        onChange={(e) =>
                          setForm({ ...form, size: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="privateBath"
                      checked={form.hasPrivateBathroom}
                      onChange={(e) => setForm({ ...form, hasPrivateBathroom: e.target.checked })}
                    />
                    <Label htmlFor="privateBath">Baño privado</Label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Crear Habitación</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
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
              <Euro className="h-4 w-4 text-yellow-500" />
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
            <CardDescription>Listado de todas las habitaciones en tu cartera</CardDescription>
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
                  {rooms.length === 0 ? (
                    <div className="col-span-2 text-center py-12">
                      <BedDouble className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No hay habitaciones registradas</p>
                      <Button className="mt-4" onClick={() => setOpenDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Crear Primera Habitación
                      </Button>
                    </div>
                  ) : (
                    rooms
                      .filter((room) => activeTab === 'all' || room.status === activeTab)
                      .map((room) => {
                        const statusInfo =
                          statusConfig[room.status as keyof typeof statusConfig] ||
                          statusConfig.available;

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
                                {room.amenities?.includes('wifi') && (
                                  <span className="flex items-center gap-1">
                                    <Wifi className="h-3 w-3" />
                                    WiFi
                                  </span>
                                )}
                                {room.amenities?.includes('bathroom') && (
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
                                {room.tenant ? (
                                  <div className="text-right">
                                    <p className="text-sm font-medium">{room.tenant}</p>
                                    {room.contractEnd && (
                                      <p className="text-xs text-muted-foreground">
                                        Contrato hasta{' '}
                                        {new Date(room.contractEnd).toLocaleDateString('es-ES', {
                                          day: '2-digit',
                                          month: 'short',
                                          year: 'numeric',
                                        })}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <Button size="sm">Ver Detalles</Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
