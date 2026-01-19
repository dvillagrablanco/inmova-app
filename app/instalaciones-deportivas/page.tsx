'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Dumbbell,
  Plus,
  Home,
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Users,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SportsFacility {
  id: string;
  nombre: string;
  tipo: string; // PISTA_PADEL, PISCINA, GIMNASIO, PISTA_TENIS, SALA_MULTIUSOS
  ubicacion: string;
  capacidad: number;
  horarioApertura: string;
  horarioCierre: string;
  precioHora: number;
  estado: string; // DISPONIBLE, OCUPADO, MANTENIMIENTO
  buildingId?: string;
  buildingName?: string;
  equipamiento?: string;
  notas?: string;
}

interface Reservation {
  id: string;
  facilityId: string;
  facilityName: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  usuario: string;
  estado: string; // CONFIRMADA, PENDIENTE, CANCELADA
}

export default function InstalacionesDeportivasPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [facilities, setFacilities] = useState<SportsFacility[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createFacilityOpen, setCreateFacilityOpen] = useState(false);
  const [editFacilityOpen, setEditFacilityOpen] = useState(false);
  const [deleteFacilityOpen, setDeleteFacilityOpen] = useState(false);
  const [createReservationOpen, setCreateReservationOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<SportsFacility | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [buildings, setBuildings] = useState<{ id: string; nombre: string }[]>([]);

  const emptyFacilityForm = {
    nombre: '',
    tipo: 'PISTA_PADEL',
    ubicacion: '',
    capacidad: '',
    horarioApertura: '08:00',
    horarioCierre: '22:00',
    precioHora: '',
    estado: 'DISPONIBLE',
    buildingId: '',
    equipamiento: '',
    notas: '',
  };

  const emptyReservationForm = {
    facilityId: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    horaInicio: '10:00',
    horaFin: '11:00',
  };

  const [facilityForm, setFacilityForm] = useState(emptyFacilityForm);
  const [reservationForm, setReservationForm] = useState(emptyReservationForm);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [buildingsRes, facilitiesRes, reservationsRes] = await Promise.all([
        fetch('/api/buildings'),
        fetch('/api/sports/facilities'),
        fetch('/api/sports/reservations'),
      ]);

      if (buildingsRes.ok) {
        const data = await buildingsRes.json();
        setBuildings(Array.isArray(data) ? data : []);
      }

      if (facilitiesRes.ok) {
        const data = await facilitiesRes.json();
        setFacilities(Array.isArray(data) ? data : []);
      }

      if (reservationsRes.ok) {
        const data = await reservationsRes.json();
        setReservations(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/sports/facilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...facilityForm,
          capacidad: parseInt(facilityForm.capacidad),
          precioHora: parseFloat(facilityForm.precioHora),
        }),
      });

      if (res.ok) {
        toast.success('Instalación creada correctamente');
        setCreateFacilityOpen(false);
        setFacilityForm(emptyFacilityForm);
        fetchData();
      } else {
        throw new Error('Error al crear instalación');
      }
    } catch (error) {
      toast.error('Error al crear la instalación');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacility) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/sports/facilities/${selectedFacility.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...facilityForm,
          capacidad: parseInt(facilityForm.capacidad),
          precioHora: parseFloat(facilityForm.precioHora),
        }),
      });

      if (res.ok) {
        toast.success('Instalación actualizada');
        setEditFacilityOpen(false);
        setSelectedFacility(null);
        setFacilityForm(emptyFacilityForm);
        fetchData();
      } else {
        throw new Error('Error al actualizar');
      }
    } catch (error) {
      toast.error('Error al actualizar la instalación');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFacility = async () => {
    if (!selectedFacility) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/sports/facilities/${selectedFacility.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Instalación eliminada');
        setDeleteFacilityOpen(false);
        setSelectedFacility(null);
        fetchData();
      } else {
        throw new Error('Error al eliminar');
      }
    } catch (error) {
      toast.error('Error al eliminar la instalación');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/sports/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationForm),
      });

      if (res.ok) {
        toast.success('Reserva creada correctamente');
        setCreateReservationOpen(false);
        setReservationForm(emptyReservationForm);
        fetchData();
      } else {
        throw new Error('Error al crear reserva');
      }
    } catch (error) {
      toast.error('Error al crear la reserva');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditFacility = (facility: SportsFacility) => {
    setSelectedFacility(facility);
    setFacilityForm({
      nombre: facility.nombre,
      tipo: facility.tipo,
      ubicacion: facility.ubicacion,
      capacidad: facility.capacidad.toString(),
      horarioApertura: facility.horarioApertura,
      horarioCierre: facility.horarioCierre,
      precioHora: facility.precioHora.toString(),
      estado: facility.estado,
      buildingId: facility.buildingId || '',
      equipamiento: facility.equipamiento || '',
      notas: facility.notas || '',
    });
    setEditFacilityOpen(true);
  };

  const openDeleteFacility = (facility: SportsFacility) => {
    setSelectedFacility(facility);
    setDeleteFacilityOpen(true);
  };

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      PISTA_PADEL: 'Pista de Pádel',
      PISTA_TENIS: 'Pista de Tenis',
      PISCINA: 'Piscina',
      GIMNASIO: 'Gimnasio',
      SALA_MULTIUSOS: 'Sala Multiusos',
      PISTA_BALONCESTO: 'Pista Baloncesto',
      CAMPO_FUTBOL: 'Campo de Fútbol',
    };
    return tipos[tipo] || tipo;
  };

  const getTipoIcon = (tipo: string) => {
    // Simplified - would have different icons per type
    return <Dumbbell className="h-4 w-4" />;
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'DISPONIBLE':
        return (
          <Badge className="bg-green-500 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Disponible
          </Badge>
        );
      case 'OCUPADO':
        return (
          <Badge className="bg-blue-500 gap-1">
            <Users className="h-3 w-3" />
            Ocupado
          </Badge>
        );
      case 'MANTENIMIENTO':
        return (
          <Badge className="bg-yellow-500 gap-1">
            <AlertCircle className="h-3 w-3" />
            Mantenimiento
          </Badge>
        );
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const getReservationStatusBadge = (estado: string) => {
    switch (estado) {
      case 'CONFIRMADA':
        return <Badge className="bg-green-500">Confirmada</Badge>;
      case 'PENDIENTE':
        return <Badge className="bg-yellow-500">Pendiente</Badge>;
      case 'CANCELADA':
        return <Badge variant="outline">Cancelada</Badge>;
      default:
        return <Badge>{estado}</Badge>;
    }
  };

  // Stats
  const stats = {
    total: facilities.length,
    disponibles: facilities.filter((f) => f.estado === 'DISPONIBLE').length,
    ocupadas: facilities.filter((f) => f.estado === 'OCUPADO').length,
    reservasHoy: reservations.filter(
      (r) => r.fecha === format(new Date(), 'yyyy-MM-dd') && r.estado === 'CONFIRMADA'
    ).length,
  };

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-sm text-muted-foreground">Cargando instalaciones...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Instalaciones Deportivas</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-3">
              <Dumbbell className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Instalaciones Deportivas</h1>
                <p className="text-sm text-muted-foreground">
                  Gestión de espacios deportivos y reservas
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCreateReservationOpen(true)}>
              <Calendar className="mr-2 h-4 w-4" />
              Nueva Reserva
            </Button>
            <Button onClick={() => setCreateFacilityOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Instalación
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Instalaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.disponibles}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ocupadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.ocupadas}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Reservas Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.reservasHoy}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="facilities" className="space-y-4">
          <TabsList>
            <TabsTrigger value="facilities">
              <Dumbbell className="h-4 w-4 mr-2" />
              Instalaciones
            </TabsTrigger>
            <TabsTrigger value="reservations">
              <Calendar className="h-4 w-4 mr-2" />
              Reservas
            </TabsTrigger>
          </TabsList>

          {/* Facilities Tab */}
          <TabsContent value="facilities">
            <Card>
              <CardHeader>
                <CardTitle>Instalaciones Registradas</CardTitle>
                <CardDescription>
                  Gestiona todas las instalaciones deportivas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {facilities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay instalaciones</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Registra tu primera instalación deportiva
                    </p>
                    <Button onClick={() => setCreateFacilityOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nueva Instalación
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Instalación</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Ubicación</TableHead>
                        <TableHead>Capacidad</TableHead>
                        <TableHead>Horario</TableHead>
                        <TableHead>Precio/h</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {facilities.map((facility) => (
                        <TableRow key={facility.id}>
                          <TableCell className="font-medium">{facility.nombre}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getTipoLabel(facility.tipo)}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {facility.ubicacion}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              {facility.capacidad}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {facility.horarioApertura} - {facility.horarioCierre}
                            </div>
                          </TableCell>
                          <TableCell>€{facility.precioHora}/h</TableCell>
                          <TableCell>{getEstadoBadge(facility.estado)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditFacility(facility)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openDeleteFacility(facility)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reservations Tab */}
          <TabsContent value="reservations">
            <Card>
              <CardHeader>
                <CardTitle>Reservas</CardTitle>
                <CardDescription>Historial de reservas de instalaciones</CardDescription>
              </CardHeader>
              <CardContent>
                {reservations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay reservas</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Crea una reserva para las instalaciones
                    </p>
                    <Button onClick={() => setCreateReservationOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nueva Reserva
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Instalación</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Horario</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reservations.map((reservation) => (
                        <TableRow key={reservation.id}>
                          <TableCell className="font-medium">{reservation.facilityName}</TableCell>
                          <TableCell>{format(new Date(reservation.fecha), 'dd/MM/yyyy', { locale: es })}</TableCell>
                          <TableCell>
                            {reservation.horaInicio} - {reservation.horaFin}
                          </TableCell>
                          <TableCell>{reservation.usuario}</TableCell>
                          <TableCell>{getReservationStatusBadge(reservation.estado)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Facility Dialog */}
        <Dialog open={createFacilityOpen} onOpenChange={setCreateFacilityOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nueva Instalación Deportiva</DialogTitle>
              <DialogDescription>Registra una nueva instalación</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateFacility}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre *</Label>
                    <Input
                      value={facilityForm.nombre}
                      onChange={(e) => setFacilityForm({ ...facilityForm, nombre: e.target.value })}
                      placeholder="Pista de Pádel 1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo *</Label>
                    <Select
                      value={facilityForm.tipo}
                      onValueChange={(value) => setFacilityForm({ ...facilityForm, tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PISTA_PADEL">Pista de Pádel</SelectItem>
                        <SelectItem value="PISTA_TENIS">Pista de Tenis</SelectItem>
                        <SelectItem value="PISCINA">Piscina</SelectItem>
                        <SelectItem value="GIMNASIO">Gimnasio</SelectItem>
                        <SelectItem value="SALA_MULTIUSOS">Sala Multiusos</SelectItem>
                        <SelectItem value="PISTA_BALONCESTO">Pista Baloncesto</SelectItem>
                        <SelectItem value="CAMPO_FUTBOL">Campo de Fútbol</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ubicación *</Label>
                    <Input
                      value={facilityForm.ubicacion}
                      onChange={(e) => setFacilityForm({ ...facilityForm, ubicacion: e.target.value })}
                      placeholder="Planta baja, zona exterior"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Edificio (opcional)</Label>
                    <Select
                      value={facilityForm.buildingId}
                      onValueChange={(value) => setFacilityForm({ ...facilityForm, buildingId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Ninguno</SelectItem>
                        {buildings.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Capacidad *</Label>
                    <Input
                      type="number"
                      value={facilityForm.capacidad}
                      onChange={(e) => setFacilityForm({ ...facilityForm, capacidad: e.target.value })}
                      placeholder="4"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora Apertura</Label>
                    <Input
                      type="time"
                      value={facilityForm.horarioApertura}
                      onChange={(e) => setFacilityForm({ ...facilityForm, horarioApertura: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora Cierre</Label>
                    <Input
                      type="time"
                      value={facilityForm.horarioCierre}
                      onChange={(e) => setFacilityForm({ ...facilityForm, horarioCierre: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Precio/hora (€)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={facilityForm.precioHora}
                      onChange={(e) => setFacilityForm({ ...facilityForm, precioHora: e.target.value })}
                      placeholder="15"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Equipamiento</Label>
                  <Textarea
                    value={facilityForm.equipamiento}
                    onChange={(e) => setFacilityForm({ ...facilityForm, equipamiento: e.target.value })}
                    placeholder="Redes, iluminación LED, vestuarios..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Textarea
                    value={facilityForm.notas}
                    onChange={(e) => setFacilityForm({ ...facilityForm, notas: e.target.value })}
                    placeholder="Información adicional..."
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateFacilityOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Creando...' : 'Crear Instalación'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Facility Dialog */}
        <Dialog open={editFacilityOpen} onOpenChange={setEditFacilityOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Instalación</DialogTitle>
              <DialogDescription>Modifica los datos de la instalación</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditFacility}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre *</Label>
                    <Input
                      value={facilityForm.nombre}
                      onChange={(e) => setFacilityForm({ ...facilityForm, nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo *</Label>
                    <Select
                      value={facilityForm.tipo}
                      onValueChange={(value) => setFacilityForm({ ...facilityForm, tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PISTA_PADEL">Pista de Pádel</SelectItem>
                        <SelectItem value="PISTA_TENIS">Pista de Tenis</SelectItem>
                        <SelectItem value="PISCINA">Piscina</SelectItem>
                        <SelectItem value="GIMNASIO">Gimnasio</SelectItem>
                        <SelectItem value="SALA_MULTIUSOS">Sala Multiusos</SelectItem>
                        <SelectItem value="PISTA_BALONCESTO">Pista Baloncesto</SelectItem>
                        <SelectItem value="CAMPO_FUTBOL">Campo de Fútbol</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ubicación *</Label>
                    <Input
                      value={facilityForm.ubicacion}
                      onChange={(e) => setFacilityForm({ ...facilityForm, ubicacion: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select
                      value={facilityForm.estado}
                      onValueChange={(value) => setFacilityForm({ ...facilityForm, estado: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DISPONIBLE">Disponible</SelectItem>
                        <SelectItem value="OCUPADO">Ocupado</SelectItem>
                        <SelectItem value="MANTENIMIENTO">Mantenimiento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Capacidad *</Label>
                    <Input
                      type="number"
                      value={facilityForm.capacidad}
                      onChange={(e) => setFacilityForm({ ...facilityForm, capacidad: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora Apertura</Label>
                    <Input
                      type="time"
                      value={facilityForm.horarioApertura}
                      onChange={(e) => setFacilityForm({ ...facilityForm, horarioApertura: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora Cierre</Label>
                    <Input
                      type="time"
                      value={facilityForm.horarioCierre}
                      onChange={(e) => setFacilityForm({ ...facilityForm, horarioCierre: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Precio/hora (€)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={facilityForm.precioHora}
                      onChange={(e) => setFacilityForm({ ...facilityForm, precioHora: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Textarea
                    value={facilityForm.notas}
                    onChange={(e) => setFacilityForm({ ...facilityForm, notas: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditFacilityOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Facility Dialog */}
        <Dialog open={deleteFacilityOpen} onOpenChange={setDeleteFacilityOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar instalación?</DialogTitle>
              <DialogDescription>
                Esta acción eliminará la instalación &quot;{selectedFacility?.nombre}&quot; y todas sus reservas.
                Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteFacilityOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteFacility} disabled={isSaving}>
                {isSaving ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Reservation Dialog */}
        <Dialog open={createReservationOpen} onOpenChange={setCreateReservationOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Reserva</DialogTitle>
              <DialogDescription>Reserva una instalación deportiva</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateReservation}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Instalación *</Label>
                  <Select
                    value={reservationForm.facilityId}
                    onValueChange={(value) => setReservationForm({ ...reservationForm, facilityId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar instalación" />
                    </SelectTrigger>
                    <SelectContent>
                      {facilities
                        .filter((f) => f.estado === 'DISPONIBLE')
                        .map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.nombre} - {getTipoLabel(f.tipo)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fecha *</Label>
                  <Input
                    type="date"
                    value={reservationForm.fecha}
                    onChange={(e) => setReservationForm({ ...reservationForm, fecha: e.target.value })}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hora Inicio *</Label>
                    <Input
                      type="time"
                      value={reservationForm.horaInicio}
                      onChange={(e) => setReservationForm({ ...reservationForm, horaInicio: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora Fin *</Label>
                    <Input
                      type="time"
                      value={reservationForm.horaFin}
                      onChange={(e) => setReservationForm({ ...reservationForm, horaFin: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateReservationOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving || !reservationForm.facilityId}>
                  {isSaving ? 'Reservando...' : 'Confirmar Reserva'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
