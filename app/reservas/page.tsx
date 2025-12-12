'use client';
export const dynamic = 'force-dynamic';


import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Home,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Building2,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  MapPin,
  Users,
  Euro,
  Edit,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger, { logError } from '@/lib/logger';


export default function ReservasPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  const [espacios, setEspacios] = useState<any[]>([]);
  const [reservas, setReservas] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [openNewSpace, setOpenNewSpace] = useState(false);
  const [openNewReservation, setOpenNewReservation] = useState(false);
  const [openEditReservation, setOpenEditReservation] = useState(false);
  const [editingReservation, setEditingReservation] = useState<any>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('all');

  const [newSpace, setNewSpace] = useState({
    buildingId: '',
    nombre: '',
    descripcion: '',
    tipo: 'salon_fiestas',
    capacidadMaxima: '',
    requierePago: false,
    costoPorHora: '',
    horaApertura: '08:00',
    horaCierre: '22:00',
    duracionMaximaHoras: '4',
    anticipacionDias: '30',
    reglas: '',
    activo: true,
  });

  const [newReservation, setNewReservation] = useState({
    spaceId: '',
    tenantId: '',
    fechaReserva: '',
    horaInicio: '',
    horaFin: '',
    numeroPersonas: '',
    proposito: '',
    observaciones: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [espaciosRes, reservasRes, tenantsRes, buildingsRes] = await Promise.all([
        fetch('/api/espacios-comunes'),
        fetch('/api/reservas'),
        fetch('/api/tenants'),
        fetch('/api/buildings'),
      ]);
      if (espaciosRes.ok) setEspacios(await espaciosRes.json());
      if (reservasRes.ok) setReservas(await reservasRes.json());
      if (tenantsRes.ok) setTenants(await tenantsRes.json());
      if (buildingsRes.ok) setBuildings(await buildingsRes.json());
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSpace = async () => {
    try {
      const response = await fetch('/api/espacios-comunes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSpace,
          capacidadMaxima: newSpace.capacidadMaxima ? parseInt(newSpace.capacidadMaxima) : null,
          costoPorHora: newSpace.costoPorHora ? parseFloat(newSpace.costoPorHora) : null,
          duracionMaximaHoras: parseInt(newSpace.duracionMaximaHoras),
          anticipacionDias: parseInt(newSpace.anticipacionDias),
        }),
      });
      if (response.ok) {
        toast.success('Espacio creado exitosamente');
        setOpenNewSpace(false);
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear espacio');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al crear espacio');
    }
  };

  const handleCreateReservation = async () => {
    try {
      const response = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newReservation,
          numeroPersonas: newReservation.numeroPersonas
            ? parseInt(newReservation.numeroPersonas)
            : null,
        }),
      });
      if (response.ok) {
        toast.success('Reserva creada exitosamente');
        setOpenNewReservation(false);
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear reserva');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al crear reserva');
    }
  };

  const handleCancelarReserva = async (id: string) => {
    try {
      const response = await fetch(`/api/reservas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: 'cancelada',
          motivoCancelacion: 'Cancelado por administrador',
        }),
      });
      if (response.ok) {
        toast.success('Reserva cancelada');
        fetchData();
      } else {
        toast.error('Error al cancelar reserva');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al cancelar reserva');
    }
  };

  const handleEditReservation = (reserva: any) => {
    setEditingReservation(reserva);
    setNewReservation({
      spaceId: reserva.space.id,
      tenantId: reserva.tenant?.id || '',
      fechaReserva: format(new Date(reserva.fechaReserva), 'yyyy-MM-dd'),
      horaInicio: reserva.horaInicio || '',
      horaFin: reserva.horaFin || '',
      numeroPersonas: reserva.numeroPersonas?.toString() || '',
      proposito: reserva.proposito || '',
      observaciones: reserva.observaciones || '',
    });
    setOpenEditReservation(true);
  };

  const handleUpdateReservation = async () => {
    if (!editingReservation) return;
    try {
      const response = await fetch(`/api/reservas/${editingReservation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newReservation,
          numeroPersonas: newReservation.numeroPersonas
            ? parseInt(newReservation.numeroPersonas)
            : null,
        }),
      });
      if (response.ok) {
        toast.success('Reserva actualizada exitosamente');
        setOpenEditReservation(false);
        setEditingReservation(null);
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al actualizar reserva');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al actualizar reserva');
    }
  };

  const handleDeleteReservation = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta reserva?')) return;
    try {
      const response = await fetch(`/api/reservas/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast.success('Reserva eliminada exitosamente');
        fetchData();
      } else {
        toast.error('Error al eliminar reserva');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al eliminar reserva');
    }
  };

  const totalEspacios = espacios.length;
  const espaciosActivos = espacios.filter((e) => e.activo).length;
  const totalReservas = reservas.length;
  const reservasPendientes = reservas.filter(
    (r) => r.estado === 'pendiente' || r.estado === 'confirmada'
  ).length;

  const filteredReservas = reservas.filter((reserva) => {
    const matchSearch =
      reserva.space?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reserva.tenant?.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstado = estadoFilter === 'all' || reserva.estado === estadoFilter;
    return matchSearch && matchEstado;
  });

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">
                      <Home className="h-4 w-4" />
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Reservas</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Reservas de Espacios Comunes</h1>
              <p className="text-muted-foreground">Gestiona espacios y reservas</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Espacios</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalEspacios}</div>
                  <p className="text-xs text-muted-foreground">{espaciosActivos} activos</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalReservas}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Activas</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reservasPendientes}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tasa Uso</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalReservas > 0 ? Math.round((reservasPendientes / totalReservas) * 100) : 0}
                    %
                  </div>
                </CardContent>
              </Card>
            </div>
            <Tabs defaultValue="reservas" className="w-full">
              <TabsList>
                <TabsTrigger value="reservas">Reservas</TabsTrigger>
                <TabsTrigger value="espacios">Espacios</TabsTrigger>
              </TabsList>
              <TabsContent value="reservas" className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="confirmada">Confirmada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                      <SelectItem value="completada">Completada</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => setOpenNewReservation(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {filteredReservas.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No hay reservas</p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredReservas.map((reserva) => (
                      <Card key={reserva.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{reserva.space?.nombre}</CardTitle>
                              <CardDescription>
                                <div className="flex items-center gap-2 text-sm">
                                  <Building2 className="h-3 w-3" />
                                  {reserva.space?.building?.nombre}
                                </div>
                              </CardDescription>
                            </div>
                            <Badge
                              variant={
                                reserva.estado === 'confirmada'
                                  ? 'default'
                                  : reserva.estado === 'completada'
                                    ? 'secondary'
                                    : reserva.estado === 'cancelada'
                                      ? 'destructive'
                                      : 'outline'
                              }
                            >
                              {reserva.estado}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Fecha</p>
                                <p className="text-sm font-medium">
                                  {format(new Date(reserva.fechaReserva), 'dd/MM/yyyy', {
                                    locale: es,
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Horario</p>
                                <p className="text-sm font-medium">
                                  {reserva.horaInicio} - {reserva.horaFin}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Inquilino</p>
                                <p className="text-sm font-medium">
                                  {reserva.tenant?.nombreCompleto}
                                </p>
                              </div>
                            </div>
                            {reserva.monto && reserva.monto > 0 && (
                              <div className="flex items-center gap-2">
                                <Euro className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Monto</p>
                                  <p className="text-sm font-medium">
                                    €{reserva.monto.toFixed(2)}
                                    {reserva.pagado && (
                                      <Badge variant="secondary" className="ml-2">
                                        Pagado
                                      </Badge>
                                    )}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                          {reserva.estado !== 'cancelada' && reserva.estado !== 'completada' && (
                            <div className="mt-4 flex gap-2">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleCancelarReserva(reserva.id)}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancelar
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
              <TabsContent value="espacios" className="space-y-4">
                <div className="flex justify-end">
                  <Button onClick={() => setOpenNewSpace(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {espacios.map((espacio) => (
                    <Card key={espacio.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{espacio.nombre}</CardTitle>
                            <CardDescription>
                              <div className="flex items-center gap-2 mt-1">
                                <MapPin className="h-3 w-3" />
                                {espacio.building?.nombre}
                              </div>
                            </CardDescription>
                          </div>
                          <Badge variant={espacio.activo ? 'default' : 'secondary'}>
                            {espacio.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline">{espacio.tipo.replace('_', ' ')}</Badge>
                            {espacio.capacidadMaxima && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  {espacio.capacidadMaxima} pers.
                                </span>
                              </div>
                            )}
                          </div>
                          {espacio.horaApertura && espacio.horaCierre && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {espacio.horaApertura} - {espacio.horaCierre}
                              </span>
                            </div>
                          )}
                          {espacio.requierePago && espacio.costoPorHora && (
                            <div className="flex items-center gap-2 text-sm">
                              <Euro className="h-4 w-4 text-muted-foreground" />
                              <span>€{espacio.costoPorHora}/hora</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      <Dialog open={openNewSpace} onOpenChange={setOpenNewSpace}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Espacio</DialogTitle>
            <DialogDescription>Crea un espacio común</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Edificio</Label>
                <Select
                  value={newSpace.buildingId}
                  onValueChange={(v) => setNewSpace({ ...newSpace, buildingId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo</Label>
                <Select
                  value={newSpace.tipo}
                  onValueChange={(v) => setNewSpace({ ...newSpace, tipo: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salon_fiestas">Salón de Fiestas</SelectItem>
                    <SelectItem value="gimnasio">Gimnasio</SelectItem>
                    <SelectItem value="piscina">Piscina</SelectItem>
                    <SelectItem value="sala_reuniones">Sala Reuniones</SelectItem>
                    <SelectItem value="zona_bbq">Zona BBQ</SelectItem>
                    <SelectItem value="cancha_deportiva">Cancha</SelectItem>
                    <SelectItem value="lavanderia">Lavandería</SelectItem>
                    <SelectItem value="terraza">Terraza</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Nombre</Label>
              <Input
                value={newSpace.nombre}
                onChange={(e) => setNewSpace({ ...newSpace, nombre: e.target.value })}
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={newSpace.descripcion}
                onChange={(e) => setNewSpace({ ...newSpace, descripcion: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Capacidad</Label>
                <Input
                  type="number"
                  value={newSpace.capacidadMaxima}
                  onChange={(e) => setNewSpace({ ...newSpace, capacidadMaxima: e.target.value })}
                />
              </div>
              <div>
                <Label>Duración Máx. (h)</Label>
                <Input
                  type="number"
                  value={newSpace.duracionMaximaHoras}
                  onChange={(e) =>
                    setNewSpace({ ...newSpace, duracionMaximaHoras: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Anticipación (días)</Label>
                <Input
                  type="number"
                  value={newSpace.anticipacionDias}
                  onChange={(e) => setNewSpace({ ...newSpace, anticipacionDias: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Apertura</Label>
                <Input
                  type="time"
                  value={newSpace.horaApertura}
                  onChange={(e) => setNewSpace({ ...newSpace, horaApertura: e.target.value })}
                />
              </div>
              <div>
                <Label>Cierre</Label>
                <Input
                  type="time"
                  value={newSpace.horaCierre}
                  onChange={(e) => setNewSpace({ ...newSpace, horaCierre: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="req-pago"
                checked={newSpace.requierePago}
                onChange={(e) => setNewSpace({ ...newSpace, requierePago: e.target.checked })}
              />
              <Label htmlFor="req-pago" className="cursor-pointer">
                Requiere pago
              </Label>
            </div>
            {newSpace.requierePago && (
              <div>
                <Label>Costo/Hora (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newSpace.costoPorHora}
                  onChange={(e) => setNewSpace({ ...newSpace, costoPorHora: e.target.value })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNewSpace(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateSpace} disabled={!newSpace.buildingId || !newSpace.nombre}>
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={openNewReservation} onOpenChange={setOpenNewReservation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Reserva</DialogTitle>
            <DialogDescription>Crea una reserva</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Espacio</Label>
              <Select
                value={newReservation.spaceId}
                onValueChange={(v) => setNewReservation({ ...newReservation, spaceId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {espacios
                    .filter((e) => e.activo)
                    .map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nombre} - {e.building?.nombre}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Inquilino</Label>
              <Select
                value={newReservation.tenantId}
                onValueChange={(v) => setNewReservation({ ...newReservation, tenantId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nombreCompleto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha</Label>
              <Input
                type="date"
                value={newReservation.fechaReserva}
                onChange={(e) =>
                  setNewReservation({ ...newReservation, fechaReserva: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Hora Inicio</Label>
                <Input
                  type="time"
                  value={newReservation.horaInicio}
                  onChange={(e) =>
                    setNewReservation({ ...newReservation, horaInicio: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Hora Fin</Label>
                <Input
                  type="time"
                  value={newReservation.horaFin}
                  onChange={(e) =>
                    setNewReservation({ ...newReservation, horaFin: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Personas</Label>
              <Input
                type="number"
                value={newReservation.numeroPersonas}
                onChange={(e) =>
                  setNewReservation({ ...newReservation, numeroPersonas: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Propósito</Label>
              <Input
                value={newReservation.proposito}
                onChange={(e) =>
                  setNewReservation({ ...newReservation, proposito: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNewReservation(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateReservation}
              disabled={
                !newReservation.spaceId ||
                !newReservation.tenantId ||
                !newReservation.fechaReserva ||
                !newReservation.horaInicio ||
                !newReservation.horaFin
              }
            >
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
