'use client';

/**
 * Workspace - Reservas
 * 
 * Sistema de reservas de espacios de coworking
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Calendar,
  Clock,
  Plus,
  Search,
  Users,
  MapPin,
  XCircle,
  CheckCircle,
  Edit,
  Euro,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface Reserva {
  id: string;
  espacio: string;
  tipoEspacio: string;
  miembro: string;
  empresa: string | null;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: 'confirmada' | 'pendiente' | 'cancelada' | 'completada';
  precio: number;
  notas: string;
}

const RESERVAS_MOCK: Reserva[] = [
  {
    id: '1',
    espacio: 'Sala de Reuniones Principal',
    tipoEspacio: 'sala_reuniones',
    miembro: 'María García',
    empresa: 'Tech Startup SL',
    fecha: '2026-01-20',
    horaInicio: '09:00',
    horaFin: '11:00',
    estado: 'confirmada',
    precio: 60,
    notas: 'Reunión con clientes',
  },
  {
    id: '2',
    espacio: 'Hot Desk Zona A',
    tipoEspacio: 'hot_desk',
    miembro: 'Carlos López',
    empresa: null,
    fecha: '2026-01-20',
    horaInicio: '08:00',
    horaFin: '18:00',
    estado: 'confirmada',
    precio: 15,
    notas: '',
  },
  {
    id: '3',
    espacio: 'Sala de Reuniones Pequeña',
    tipoEspacio: 'sala_reuniones',
    miembro: 'Ana Martínez',
    empresa: 'Consulting Group',
    fecha: '2026-01-20',
    horaInicio: '14:00',
    horaFin: '16:00',
    estado: 'confirmada',
    precio: 40,
    notas: 'Entrevistas de trabajo',
  },
  {
    id: '4',
    espacio: 'Hot Desk Zona B',
    tipoEspacio: 'hot_desk',
    miembro: 'David Ruiz',
    empresa: null,
    fecha: '2026-01-21',
    horaInicio: '08:00',
    horaFin: '14:00',
    estado: 'pendiente',
    precio: 10,
    notas: '',
  },
  {
    id: '5',
    espacio: 'Oficina Privada B',
    tipoEspacio: 'oficina_privada',
    miembro: 'Laura Sánchez',
    empresa: 'Design Studio',
    fecha: '2026-01-19',
    horaInicio: '09:00',
    horaFin: '18:00',
    estado: 'completada',
    precio: 50,
    notas: 'Día de trabajo intensivo',
  },
];

const ESPACIOS_DISPONIBLES = [
  { id: '1', nombre: 'Hot Desk Zona A', tipo: 'hot_desk', precioHora: 5, precioDia: 15 },
  { id: '2', nombre: 'Hot Desk Zona B', tipo: 'hot_desk', precioHora: 5, precioDia: 15 },
  { id: '3', nombre: 'Sala de Reuniones Principal', tipo: 'sala_reuniones', precioHora: 30, precioDia: 200 },
  { id: '4', nombre: 'Sala de Reuniones Pequeña', tipo: 'sala_reuniones', precioHora: 20, precioDia: 150 },
  { id: '5', nombre: 'Oficina Privada B', tipo: 'oficina_privada', precioHora: 15, precioDia: 80 },
];

const HORAS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
];

export default function WorkspaceBookingPage() {
  const [reservas, setReservas] = useState<Reserva[]>(RESERVAS_MOCK);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    espacio: '',
    miembro: '',
    empresa: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    horaInicio: '09:00',
    horaFin: '10:00',
    notas: '',
  });

  const filteredReservas = reservas.filter((r) => {
    const matchSearch =
      r.espacio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.miembro.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstado = filterEstado === 'all' || r.estado === filterEstado;
    return matchSearch && matchEstado;
  });

  const reservasDelDia = reservas.filter((r) => r.fecha === format(selectedDate, 'yyyy-MM-dd'));

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'confirmada':
        return <Badge className="bg-green-100 text-green-700">Confirmada</Badge>;
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-700">Pendiente</Badge>;
      case 'cancelada':
        return <Badge className="bg-red-100 text-red-700">Cancelada</Badge>;
      case 'completada':
        return <Badge variant="secondary">Completada</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const handleCrearReserva = () => {
    if (!formData.espacio || !formData.miembro || !formData.fecha) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    const espacioSeleccionado = ESPACIOS_DISPONIBLES.find((e) => e.nombre === formData.espacio);
    const horasDuracion =
      HORAS.indexOf(formData.horaFin) - HORAS.indexOf(formData.horaInicio);
    const precio = espacioSeleccionado
      ? espacioSeleccionado.precioHora * horasDuracion
      : 0;

    const nuevaReserva: Reserva = {
      id: Date.now().toString(),
      espacio: formData.espacio,
      tipoEspacio: espacioSeleccionado?.tipo || 'hot_desk',
      miembro: formData.miembro,
      empresa: formData.empresa || null,
      fecha: formData.fecha,
      horaInicio: formData.horaInicio,
      horaFin: formData.horaFin,
      estado: 'confirmada',
      precio,
      notas: formData.notas,
    };

    setReservas([nuevaReserva, ...reservas]);
    setIsDialogOpen(false);
    setFormData({
      espacio: '',
      miembro: '',
      empresa: '',
      fecha: format(new Date(), 'yyyy-MM-dd'),
      horaInicio: '09:00',
      horaFin: '10:00',
      notas: '',
    });
    toast.success('Reserva creada correctamente');
  };

  const handleCancelarReserva = (id: string) => {
    setReservas(
      reservas.map((r) => (r.id === id ? { ...r, estado: 'cancelada' as const } : r))
    );
    toast.info('Reserva cancelada');
  };

  const handleConfirmarReserva = (id: string) => {
    setReservas(
      reservas.map((r) => (r.id === id ? { ...r, estado: 'confirmada' as const } : r))
    );
    toast.success('Reserva confirmada');
  };

  // Stats
  const stats = {
    hoy: reservas.filter(
      (r) => r.fecha === format(new Date(), 'yyyy-MM-dd') && r.estado === 'confirmada'
    ).length,
    pendientes: reservas.filter((r) => r.estado === 'pendiente').length,
    ingresosSemana: reservas
      .filter((r) => {
        const fechaReserva = new Date(r.fecha);
        const hoy = new Date();
        const diffDays = Math.ceil((hoy.getTime() - fechaReserva.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 7 && r.estado !== 'cancelada';
      })
      .reduce((acc, r) => acc + r.precio, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Reservas
          </h1>
          <p className="text-muted-foreground">
            Sistema de reservas de espacios
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Reserva
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nueva Reserva</DialogTitle>
              <DialogDescription>
                Reserva un espacio de trabajo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Espacio *</Label>
                <Select
                  value={formData.espacio}
                  onValueChange={(value) => setFormData({ ...formData, espacio: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar espacio" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESPACIOS_DISPONIBLES.map((e) => (
                      <SelectItem key={e.id} value={e.nombre}>
                        {e.nombre} (€{e.precioHora}/h)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Miembro/Cliente *</Label>
                <Input
                  value={formData.miembro}
                  onChange={(e) => setFormData({ ...formData, miembro: e.target.value })}
                  placeholder="Nombre del miembro"
                />
              </div>
              <div>
                <Label>Empresa (opcional)</Label>
                <Input
                  value={formData.empresa}
                  onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                  placeholder="Nombre de la empresa"
                />
              </div>
              <div>
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hora Inicio</Label>
                  <Select
                    value={formData.horaInicio}
                    onValueChange={(value) => setFormData({ ...formData, horaInicio: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HORAS.slice(0, -1).map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Hora Fin</Label>
                  <Select
                    value={formData.horaFin}
                    onValueChange={(value) => setFormData({ ...formData, horaFin: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HORAS.slice(1).map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Notas</Label>
                <Textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCrearReserva}>Crear Reserva</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reservas Hoy</p>
                <p className="text-2xl font-bold">{stats.hoy}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos (7d)</p>
                <p className="text-2xl font-bold text-green-600">€{stats.ingresosSemana}</p>
              </div>
              <Euro className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendario */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Calendario</CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={es}
              className="rounded-md border"
            />
            <div className="mt-4">
              <h4 className="font-medium mb-2">
                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
              </h4>
              {reservasDelDia.length > 0 ? (
                <div className="space-y-2">
                  {reservasDelDia.map((r) => (
                    <div
                      key={r.id}
                      className="p-2 border rounded text-sm flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">{r.espacio}</p>
                        <p className="text-muted-foreground">
                          {r.horaInicio} - {r.horaFin}
                        </p>
                      </div>
                      {getEstadoBadge(r.estado)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay reservas para este día
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Reservas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Todas las Reservas</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="confirmada">Confirmada</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredReservas.map((reserva) => (
                <div
                  key={reserva.id}
                  className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{reserva.espacio}</p>
                      {getEstadoBadge(reserva.estado)}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {reserva.miembro}
                        {reserva.empresa && ` (${reserva.empresa})`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {reserva.fecha}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {reserva.horaInicio} - {reserva.horaFin}
                      </span>
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <Euro className="h-3 w-3" />
                        {reserva.precio}
                      </span>
                    </div>
                    {reserva.notas && (
                      <p className="text-sm text-muted-foreground mt-1 italic">
                        "{reserva.notas}"
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {reserva.estado === 'pendiente' && (
                      <Button
                        size="sm"
                        onClick={() => handleConfirmarReserva(reserva.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Confirmar
                      </Button>
                    )}
                    {(reserva.estado === 'confirmada' || reserva.estado === 'pendiente') && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancelarReserva(reserva.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {filteredReservas.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">
                  No se encontraron reservas
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
