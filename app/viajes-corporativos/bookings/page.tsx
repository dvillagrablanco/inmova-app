'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Calendar,
  Search,
  Plus,
  Building,
  User,
  Hotel,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

// Mock data para reservas
const RESERVAS_MOCK = [
  {
    id: 'RES001',
    empleado: 'Carlos Martínez',
    email: 'carlos.martinez@empresa.com',
    departamento: 'Ventas',
    destino: 'Barcelona',
    hotel: 'Hotel Arts Barcelona',
    direccion: 'Carrer de la Marina, 19-21',
    fechaEntrada: '2026-01-25',
    fechaSalida: '2026-01-28',
    noches: 3,
    habitacion: 'Superior Doble',
    costeNoche: 180,
    costeTotal: 540,
    estado: 'confirmada',
    aprobadoPor: 'María López',
    fechaReserva: '2026-01-15',
    motivoViaje: 'Visita cliente importante',
    serviciosAdicionales: ['Desayuno', 'WiFi Premium'],
  },
  {
    id: 'RES002',
    empleado: 'Laura García',
    email: 'laura.garcia@empresa.com',
    departamento: 'Marketing',
    destino: 'Madrid',
    hotel: 'NH Collection Madrid',
    direccion: 'Gran Vía, 21',
    fechaEntrada: '2026-01-26',
    fechaSalida: '2026-01-28',
    noches: 2,
    habitacion: 'Standard',
    costeNoche: 145,
    costeTotal: 290,
    estado: 'pendiente',
    aprobadoPor: null,
    fechaReserva: '2026-01-18',
    motivoViaje: 'Evento marketing digital',
    serviciosAdicionales: ['Desayuno'],
  },
  {
    id: 'RES003',
    empleado: 'Miguel Torres',
    email: 'miguel.torres@empresa.com',
    departamento: 'Dirección',
    destino: 'Valencia',
    hotel: 'The Westin Valencia',
    direccion: 'Amadeo de Saboya, 16',
    fechaEntrada: '2026-01-28',
    fechaSalida: '2026-02-01',
    noches: 4,
    habitacion: 'Suite Junior',
    costeNoche: 250,
    costeTotal: 1000,
    estado: 'confirmada',
    aprobadoPor: 'CEO',
    fechaReserva: '2026-01-12',
    motivoViaje: 'Congreso internacional',
    serviciosAdicionales: ['Desayuno', 'Parking', 'Late checkout'],
  },
  {
    id: 'RES004',
    empleado: 'Ana Sánchez',
    email: 'ana.sanchez@empresa.com',
    departamento: 'Operaciones',
    destino: 'Sevilla',
    hotel: 'Hotel Alfonso XIII',
    direccion: 'San Fernando, 2',
    fechaEntrada: '2026-01-30',
    fechaSalida: '2026-02-01',
    noches: 2,
    habitacion: 'Deluxe',
    costeNoche: 220,
    costeTotal: 440,
    estado: 'pendiente',
    aprobadoPor: null,
    fechaReserva: '2026-01-19',
    motivoViaje: 'Formación equipo',
    serviciosAdicionales: ['Desayuno', 'Sala reuniones'],
  },
  {
    id: 'RES005',
    empleado: 'Pedro López',
    email: 'pedro.lopez@empresa.com',
    departamento: 'IT',
    destino: 'Bilbao',
    hotel: 'Gran Hotel Domine',
    direccion: 'Alameda Mazarredo, 61',
    fechaEntrada: '2026-02-03',
    fechaSalida: '2026-02-05',
    noches: 2,
    habitacion: 'Standard',
    costeNoche: 160,
    costeTotal: 320,
    estado: 'rechazada',
    aprobadoPor: null,
    fechaReserva: '2026-01-10',
    motivoViaje: 'Instalación sistemas',
    serviciosAdicionales: [],
    motivoRechazo: 'Presupuesto excedido para el departamento',
  },
];

// Empleados disponibles para reserva
const EMPLEADOS = [
  { id: 'emp1', nombre: 'Carlos Martínez', departamento: 'Ventas' },
  { id: 'emp2', nombre: 'Laura García', departamento: 'Marketing' },
  { id: 'emp3', nombre: 'Miguel Torres', departamento: 'Dirección' },
  { id: 'emp4', nombre: 'Ana Sánchez', departamento: 'Operaciones' },
  { id: 'emp5', nombre: 'Pedro López', departamento: 'IT' },
];

// Hoteles disponibles
const HOTELES = [
  { id: 'h1', nombre: 'Hotel Arts Barcelona', ciudad: 'Barcelona', precioBase: 180 },
  { id: 'h2', nombre: 'NH Collection Madrid', ciudad: 'Madrid', precioBase: 145 },
  { id: 'h3', nombre: 'The Westin Valencia', ciudad: 'Valencia', precioBase: 250 },
  { id: 'h4', nombre: 'Hotel Alfonso XIII', ciudad: 'Sevilla', precioBase: 220 },
  { id: 'h5', nombre: 'Gran Hotel Domine', ciudad: 'Bilbao', precioBase: 160 },
];

export default function ViajesCorporativosBookingsPage() {
  const [reservas, setReservas] = useState(RESERVAS_MOCK);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    empleado: '',
    hotel: '',
    fechaEntrada: '',
    fechaSalida: '',
    motivoViaje: '',
    servicios: [] as string[],
  });

  const reservasFiltradas = reservas.filter((reserva) => {
    const matchEstado = filtroEstado === 'todos' || reserva.estado === filtroEstado;
    const matchBusqueda = 
      reserva.empleado.toLowerCase().includes(busqueda.toLowerCase()) ||
      reserva.destino.toLowerCase().includes(busqueda.toLowerCase()) ||
      reserva.hotel.toLowerCase().includes(busqueda.toLowerCase()) ||
      reserva.id.toLowerCase().includes(busqueda.toLowerCase());
    return matchEstado && matchBusqueda;
  });

  const stats = {
    total: reservas.length,
    confirmadas: reservas.filter(r => r.estado === 'confirmada').length,
    pendientes: reservas.filter(r => r.estado === 'pendiente').length,
    rechazadas: reservas.filter(r => r.estado === 'rechazada').length,
    costeTotal: reservas.filter(r => r.estado === 'confirmada').reduce((sum, r) => sum + r.costeTotal, 0),
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'confirmada':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Confirmada</Badge>;
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case 'rechazada':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Rechazada</Badge>;
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  const handleCrearReserva = () => {
    if (!formData.empleado || !formData.hotel || !formData.fechaEntrada || !formData.fechaSalida) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }
    toast.success('Reserva creada y enviada para aprobación');
    setIsDialogOpen(false);
    setFormData({ empleado: '', hotel: '', fechaEntrada: '', fechaSalida: '', motivoViaje: '', servicios: [] });
  };

  const handleAprobar = (id: string) => {
    setReservas(prev => prev.map(r => 
      r.id === id ? { ...r, estado: 'confirmada', aprobadoPor: 'Usuario Actual' } : r
    ));
    toast.success('Reserva aprobada correctamente');
  };

  const handleRechazar = (id: string) => {
    setReservas(prev => prev.map(r => 
      r.id === id ? { ...r, estado: 'rechazada', motivoRechazo: 'Rechazada por administrador' } : r
    ));
    toast.success('Reserva rechazada');
  };

  const handleDescargarVoucher = (reserva: typeof RESERVAS_MOCK[0]) => {
    toast.success(`Descargando voucher para ${reserva.hotel}`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reservas Corporativas</h1>
          <p className="text-muted-foreground">Gestión de reservas de alojamiento para viajes de empresa</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Reserva
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nueva Reserva Corporativa</DialogTitle>
              <DialogDescription>
                Crea una nueva solicitud de reserva para un empleado
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Empleado *</Label>
                <Select value={formData.empleado} onValueChange={(v) => setFormData({...formData, empleado: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLEADOS.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.nombre} - {emp.departamento}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hotel *</Label>
                <Select value={formData.hotel} onValueChange={(v) => setFormData({...formData, hotel: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOTELES.map(hotel => (
                      <SelectItem key={hotel.id} value={hotel.id}>
                        {hotel.nombre} ({hotel.ciudad}) - {hotel.precioBase}€/noche
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha entrada *</Label>
                  <Input
                    type="date"
                    value={formData.fechaEntrada}
                    onChange={(e) => setFormData({...formData, fechaEntrada: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Fecha salida *</Label>
                  <Input
                    type="date"
                    value={formData.fechaSalida}
                    onChange={(e) => setFormData({...formData, fechaSalida: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label>Motivo del viaje *</Label>
                <Textarea
                  value={formData.motivoViaje}
                  onChange={(e) => setFormData({...formData, motivoViaje: e.target.value})}
                  placeholder="Describe el propósito del viaje..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCrearReserva}>Solicitar Reserva</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Reservas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.confirmadas}</p>
              <p className="text-sm text-muted-foreground">Confirmadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p>
              <p className="text-sm text-muted-foreground">Pendientes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.rechazadas}</p>
              <p className="text-sm text-muted-foreground">Rechazadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.costeTotal.toLocaleString()}€</p>
              <p className="text-sm text-muted-foreground">Coste Confirmado</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por empleado, destino, hotel o ID..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="confirmada">Confirmadas</SelectItem>
                <SelectItem value="pendiente">Pendientes</SelectItem>
                <SelectItem value="rechazada">Rechazadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de reservas */}
      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Empleado</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Hotel</TableHead>
                <TableHead>Fechas</TableHead>
                <TableHead className="text-right">Coste</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservasFiltradas.map((reserva) => (
                <TableRow key={reserva.id}>
                  <TableCell className="font-mono text-sm">{reserva.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{reserva.empleado}</p>
                      <p className="text-xs text-muted-foreground">{reserva.departamento}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {reserva.destino}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{reserva.hotel}</p>
                      <p className="text-xs text-muted-foreground">{reserva.habitacion}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{new Date(reserva.fechaEntrada).toLocaleDateString('es-ES')}</p>
                      <p className="text-xs text-muted-foreground">{reserva.noches} noches</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{reserva.costeTotal}€</TableCell>
                  <TableCell>{getEstadoBadge(reserva.estado)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Detalles de Reserva {reserva.id}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Empleado</p>
                                <p className="font-medium">{reserva.empleado}</p>
                                <p className="text-xs text-muted-foreground">{reserva.email}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Departamento</p>
                                <p className="font-medium">{reserva.departamento}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Hotel</p>
                                <p className="font-medium">{reserva.hotel}</p>
                                <p className="text-xs text-muted-foreground">{reserva.direccion}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Habitación</p>
                                <p className="font-medium">{reserva.habitacion}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Entrada</p>
                                <p className="font-medium">{new Date(reserva.fechaEntrada).toLocaleDateString('es-ES')}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Salida</p>
                                <p className="font-medium">{new Date(reserva.fechaSalida).toLocaleDateString('es-ES')}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Noches</p>
                                <p className="font-medium">{reserva.noches}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Motivo del viaje</p>
                              <p className="font-medium">{reserva.motivoViaje}</p>
                            </div>
                            {reserva.serviciosAdicionales.length > 0 && (
                              <div>
                                <p className="text-sm text-muted-foreground">Servicios adicionales</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {reserva.serviciosAdicionales.map((s, i) => (
                                    <Badge key={i} variant="outline">{s}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="pt-4 border-t">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-sm text-muted-foreground">Coste total</p>
                                  <p className="text-2xl font-bold">{reserva.costeTotal}€</p>
                                </div>
                                {getEstadoBadge(reserva.estado)}
                              </div>
                              {reserva.aprobadoPor && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Aprobado por: {reserva.aprobadoPor}
                                </p>
                              )}
                              {reserva.motivoRechazo && (
                                <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                                  {reserva.motivoRechazo}
                                </div>
                              )}
                            </div>
                          </div>
                          <DialogFooter className="flex-col sm:flex-row gap-2">
                            {reserva.estado === 'pendiente' && (
                              <>
                                <Button variant="destructive" onClick={() => handleRechazar(reserva.id)}>
                                  Rechazar
                                </Button>
                                <Button onClick={() => handleAprobar(reserva.id)}>
                                  Aprobar
                                </Button>
                              </>
                            )}
                            {reserva.estado === 'confirmada' && (
                              <Button onClick={() => handleDescargarVoucher(reserva)}>
                                <Download className="h-4 w-4 mr-2" />
                                Descargar Voucher
                              </Button>
                            )}
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      {reserva.estado === 'pendiente' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600"
                            onClick={() => handleAprobar(reserva.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => handleRechazar(reserva.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {reservasFiltradas.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron reservas con los filtros aplicados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
