'use client';

/**
 * Sistema de Reservas - Inmova App
 * 
 * Gestión completa de reservas de espacios y servicios:
 * - Calendario de disponibilidad
 * - Reservas online
 * - Confirmaciones automáticas
 * - Gestión de cancelaciones
 * - Reportes de ocupación
 */

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  CalendarDays,
  Clock,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  MapPin,
  Euro,
  CalendarRange,
  CalendarCheck,
  CalendarX,
  Timer,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Building2,
  DoorOpen,
  Wifi,
  Coffee,
  Monitor,
  Car,
  Bell,
} from 'lucide-react';
import { format, addDays, isSameDay, parseISO, isAfter, isBefore, startOfDay, endOfDay, addHours, setHours, setMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Types
interface Espacio {
  id: string;
  nombre: string;
  tipo: 'sala_reuniones' | 'coworking' | 'piscina' | 'gimnasio' | 'salon_eventos' | 'terraza' | 'parking' | 'otros';
  capacidad: number;
  ubicacion: string;
  descripcion?: string;
  precio?: number;
  amenities: string[];
  imagenUrl?: string;
  disponible: boolean;
  horarioApertura: string;
  horarioCierre: string;
}

interface Reserva {
  id: string;
  espacioId: string;
  espacio: Espacio;
  usuarioId: string;
  usuarioNombre: string;
  fechaInicio: string;
  fechaFin: string;
  horaInicio: string;
  horaFin: string;
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
  motivo?: string;
  numAsistentes?: number;
  notas?: string;
  createdAt: string;
}

interface ReservaStats {
  total: number;
  pendientes: number;
  confirmadas: number;
  canceladas: number;
  completadas: number;
  ocupacionMes: number;
}

// Constantes
const TIPOS_ESPACIO = [
  { value: 'sala_reuniones', label: 'Sala de Reuniones', icon: Users },
  { value: 'coworking', label: 'Coworking', icon: Monitor },
  { value: 'piscina', label: 'Piscina', icon: DoorOpen },
  { value: 'gimnasio', label: 'Gimnasio', icon: DoorOpen },
  { value: 'salon_eventos', label: 'Salón de Eventos', icon: Building2 },
  { value: 'terraza', label: 'Terraza', icon: DoorOpen },
  { value: 'parking', label: 'Parking', icon: Car },
  { value: 'otros', label: 'Otros', icon: DoorOpen },
];

const ESTADOS_RESERVA = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmada: { label: 'Confirmada', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-800', icon: XCircle },
  completada: { label: 'Completada', color: 'bg-blue-100 text-blue-800', icon: CalendarCheck },
};

const AMENITIES_ICONS: Record<string, any> = {
  wifi: Wifi,
  cafe: Coffee,
  pantalla: Monitor,
  parking: Car,
};

const HORARIOS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

// Mock data - En producción esto vendría de la API
const mockEspacios: Espacio[] = [
  {
    id: '1',
    nombre: 'Sala Ejecutiva A',
    tipo: 'sala_reuniones',
    capacidad: 12,
    ubicacion: 'Planta 1, Ala Norte',
    descripcion: 'Sala de reuniones ejecutiva con equipamiento completo para videoconferencias.',
    precio: 25,
    amenities: ['wifi', 'pantalla', 'cafe'],
    disponible: true,
    horarioApertura: '08:00',
    horarioCierre: '20:00',
  },
  {
    id: '2',
    nombre: 'Sala de Juntas',
    tipo: 'sala_reuniones',
    capacidad: 20,
    ubicacion: 'Planta 2',
    descripcion: 'Sala grande para juntas directivas y presentaciones.',
    precio: 40,
    amenities: ['wifi', 'pantalla', 'cafe', 'parking'],
    disponible: true,
    horarioApertura: '08:00',
    horarioCierre: '20:00',
  },
  {
    id: '3',
    nombre: 'Coworking Abierto',
    tipo: 'coworking',
    capacidad: 50,
    ubicacion: 'Planta Baja',
    descripcion: 'Espacio abierto de coworking con escritorios compartidos.',
    precio: 15,
    amenities: ['wifi', 'cafe'],
    disponible: true,
    horarioApertura: '07:00',
    horarioCierre: '22:00',
  },
  {
    id: '4',
    nombre: 'Piscina Comunitaria',
    tipo: 'piscina',
    capacidad: 30,
    ubicacion: 'Azotea',
    descripcion: 'Piscina climatizada con zona de tumbonas.',
    precio: 0,
    amenities: [],
    disponible: true,
    horarioApertura: '10:00',
    horarioCierre: '21:00',
  },
  {
    id: '5',
    nombre: 'Gimnasio',
    tipo: 'gimnasio',
    capacidad: 20,
    ubicacion: 'Sótano 1',
    descripcion: 'Gimnasio completamente equipado.',
    precio: 0,
    amenities: [],
    disponible: true,
    horarioApertura: '06:00',
    horarioCierre: '23:00',
  },
  {
    id: '6',
    nombre: 'Salón de Eventos',
    tipo: 'salon_eventos',
    capacidad: 100,
    ubicacion: 'Planta Baja',
    descripcion: 'Salón polivalente para eventos, fiestas y celebraciones.',
    precio: 200,
    amenities: ['wifi', 'pantalla', 'parking'],
    disponible: true,
    horarioApertura: '09:00',
    horarioCierre: '02:00',
  },
];

const mockReservas: Reserva[] = [
  {
    id: 'r1',
    espacioId: '1',
    espacio: mockEspacios[0],
    usuarioId: 'u1',
    usuarioNombre: 'Juan García',
    fechaInicio: format(new Date(), 'yyyy-MM-dd'),
    fechaFin: format(new Date(), 'yyyy-MM-dd'),
    horaInicio: '09:00',
    horaFin: '11:00',
    estado: 'confirmada',
    motivo: 'Reunión de equipo',
    numAsistentes: 8,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'r2',
    espacioId: '2',
    espacio: mockEspacios[1],
    usuarioId: 'u2',
    usuarioNombre: 'María López',
    fechaInicio: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    fechaFin: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    horaInicio: '14:00',
    horaFin: '16:00',
    estado: 'pendiente',
    motivo: 'Presentación a clientes',
    numAsistentes: 15,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'r3',
    espacioId: '6',
    espacio: mockEspacios[5],
    usuarioId: 'u3',
    usuarioNombre: 'Carlos Martínez',
    fechaInicio: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
    fechaFin: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
    horaInicio: '19:00',
    horaFin: '23:00',
    estado: 'confirmada',
    motivo: 'Celebración cumpleaños',
    numAsistentes: 50,
    createdAt: new Date().toISOString(),
  },
];

export default function ReservasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('calendario');
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [stats, setStats] = useState<ReservaStats | null>(null);
  
  // Filtros
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterEspacio, setFilterEspacio] = useState<string>('all');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEspacio, setSelectedEspacio] = useState<Espacio | null>(null);
  const [reservaDetalle, setReservaDetalle] = useState<Reserva | null>(null);
  
  // Form state para nueva reserva
  const [formData, setFormData] = useState({
    espacioId: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    horaInicio: '09:00',
    horaFin: '10:00',
    motivo: '',
    numAsistentes: 1,
    notas: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Cargar datos
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      loadData();
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      // En producción, cargar desde API
      // const [espaciosRes, reservasRes] = await Promise.all([
      //   fetch('/api/reservas/espacios'),
      //   fetch('/api/reservas'),
      // ]);
      
      // Usar mock data
      setEspacios(mockEspacios);
      setReservas(mockReservas);
      
      // Calcular stats
      const total = mockReservas.length;
      const pendientes = mockReservas.filter(r => r.estado === 'pendiente').length;
      const confirmadas = mockReservas.filter(r => r.estado === 'confirmada').length;
      const canceladas = mockReservas.filter(r => r.estado === 'cancelada').length;
      const completadas = mockReservas.filter(r => r.estado === 'completada').length;
      
      setStats({
        total,
        pendientes,
        confirmadas,
        canceladas,
        completadas,
        ocupacionMes: 45, // Porcentaje mock
      });
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Reservas filtradas
  const reservasFiltradas = useMemo(() => {
    return reservas.filter(reserva => {
      // Filtro por espacio
      if (filterEspacio !== 'all' && reserva.espacioId !== filterEspacio) return false;
      
      // Filtro por estado
      if (filterEstado !== 'all' && reserva.estado !== filterEstado) return false;
      
      // Filtro por búsqueda
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchNombre = reserva.usuarioNombre.toLowerCase().includes(term);
        const matchEspacio = reserva.espacio.nombre.toLowerCase().includes(term);
        const matchMotivo = reserva.motivo?.toLowerCase().includes(term);
        if (!matchNombre && !matchEspacio && !matchMotivo) return false;
      }
      
      return true;
    });
  }, [reservas, filterEspacio, filterEstado, searchTerm]);

  // Reservas del día seleccionado
  const reservasDelDia = useMemo(() => {
    return reservas.filter(r => r.fechaInicio === format(selectedDate, 'yyyy-MM-dd'));
  }, [reservas, selectedDate]);

  // Días con reservas para el calendario
  const diasConReservas = useMemo(() => {
    return reservas.map(r => parseISO(r.fechaInicio));
  }, [reservas]);

  // Handlers
  const handleNuevaReserva = (espacio?: Espacio) => {
    if (espacio) {
      setSelectedEspacio(espacio);
      setFormData(prev => ({ ...prev, espacioId: espacio.id }));
    }
    setDialogOpen(true);
  };

  const handleSubmitReserva = async () => {
    if (!formData.espacioId || !formData.fecha || !formData.horaInicio || !formData.horaFin) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    if (formData.horaInicio >= formData.horaFin) {
      toast.error('La hora de fin debe ser posterior a la hora de inicio');
      return;
    }

    try {
      setSubmitting(true);
      
      // En producción, enviar a API
      // await fetch('/api/reservas', { method: 'POST', body: JSON.stringify(formData) });
      
      // Mock: agregar a lista local
      const espacio = espacios.find(e => e.id === formData.espacioId);
      if (espacio) {
        const nuevaReserva: Reserva = {
          id: `r${Date.now()}`,
          espacioId: formData.espacioId,
          espacio,
          usuarioId: session?.user?.email || 'user',
          usuarioNombre: (session?.user as any)?.name || 'Usuario',
          fechaInicio: formData.fecha,
          fechaFin: formData.fecha,
          horaInicio: formData.horaInicio,
          horaFin: formData.horaFin,
          estado: 'pendiente',
          motivo: formData.motivo,
          numAsistentes: formData.numAsistentes,
          notas: formData.notas,
          createdAt: new Date().toISOString(),
        };
        
        setReservas(prev => [...prev, nuevaReserva]);
        if (stats) {
          setStats({ ...stats, total: stats.total + 1, pendientes: stats.pendientes + 1 });
        }
      }
      
      toast.success('Reserva creada correctamente. Pendiente de confirmación.');
      setDialogOpen(false);
      resetForm();
      
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast.error('Error al crear la reserva');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelarReserva = async (reservaId: string) => {
    try {
      // En producción: await fetch(`/api/reservas/${reservaId}/cancelar`, { method: 'POST' });
      
      setReservas(prev => prev.map(r => 
        r.id === reservaId ? { ...r, estado: 'cancelada' as const } : r
      ));
      
      if (stats) {
        const reserva = reservas.find(r => r.id === reservaId);
        if (reserva?.estado === 'pendiente') {
          setStats({ ...stats, pendientes: stats.pendientes - 1, canceladas: stats.canceladas + 1 });
        } else if (reserva?.estado === 'confirmada') {
          setStats({ ...stats, confirmadas: stats.confirmadas - 1, canceladas: stats.canceladas + 1 });
        }
      }
      
      toast.success('Reserva cancelada');
    } catch (error) {
      toast.error('Error al cancelar la reserva');
    }
  };

  const handleConfirmarReserva = async (reservaId: string) => {
    try {
      setReservas(prev => prev.map(r => 
        r.id === reservaId ? { ...r, estado: 'confirmada' as const } : r
      ));
      
      if (stats) {
        setStats({ ...stats, pendientes: stats.pendientes - 1, confirmadas: stats.confirmadas + 1 });
      }
      
      toast.success('Reserva confirmada');
    } catch (error) {
      toast.error('Error al confirmar la reserva');
    }
  };

  const resetForm = () => {
    setFormData({
      espacioId: '',
      fecha: format(new Date(), 'yyyy-MM-dd'),
      horaInicio: '09:00',
      horaFin: '10:00',
      motivo: '',
      numAsistentes: 1,
      notas: '',
    });
    setSelectedEspacio(null);
  };

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarDays className="h-8 w-8 text-primary" />
            Sistema de Reservas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona reservas de espacios y servicios comunitarios
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleNuevaReserva()}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Reserva
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Nueva Reserva
                </DialogTitle>
                <DialogDescription>
                  Reserva un espacio o servicio
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Selección de espacio */}
                <div className="space-y-2">
                  <Label>Espacio *</Label>
                  <Select
                    value={formData.espacioId}
                    onValueChange={(value) => {
                      setFormData({ ...formData, espacioId: value });
                      setSelectedEspacio(espacios.find(e => e.id === value) || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un espacio" />
                    </SelectTrigger>
                    <SelectContent>
                      {espacios.filter(e => e.disponible).map((espacio) => (
                        <SelectItem key={espacio.id} value={espacio.id}>
                          <div className="flex items-center gap-2">
                            <span>{espacio.nombre}</span>
                            <Badge variant="outline" className="text-xs">
                              {espacio.capacidad} personas
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Info del espacio seleccionado */}
                {selectedEspacio && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedEspacio.ubicacion}</span>
                    </div>
                    {selectedEspacio.precio !== undefined && selectedEspacio.precio > 0 && (
                      <div className="flex items-center gap-2">
                        <Euro className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{selectedEspacio.precio}€/hora</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedEspacio.horarioApertura} - {selectedEspacio.horarioCierre}</span>
                    </div>
                  </div>
                )}

                {/* Fecha */}
                <div className="space-y-2">
                  <Label>Fecha *</Label>
                  <Input
                    type="date"
                    value={formData.fecha}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  />
                </div>

                {/* Horarios */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hora inicio *</Label>
                    <Select
                      value={formData.horaInicio}
                      onValueChange={(value) => setFormData({ ...formData, horaInicio: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HORARIOS.map((hora) => (
                          <SelectItem key={hora} value={hora}>{hora}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Hora fin *</Label>
                    <Select
                      value={formData.horaFin}
                      onValueChange={(value) => setFormData({ ...formData, horaFin: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HORARIOS.map((hora) => (
                          <SelectItem key={hora} value={hora}>{hora}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Motivo */}
                <div className="space-y-2">
                  <Label>Motivo de la reserva</Label>
                  <Input
                    placeholder="Ej: Reunión de equipo, evento..."
                    value={formData.motivo}
                    onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  />
                </div>

                {/* Número de asistentes */}
                <div className="space-y-2">
                  <Label>Número de asistentes</Label>
                  <Input
                    type="number"
                    min={1}
                    max={selectedEspacio?.capacidad || 100}
                    value={formData.numAsistentes}
                    onChange={(e) => setFormData({ ...formData, numAsistentes: parseInt(e.target.value) || 1 })}
                  />
                  {selectedEspacio && (
                    <p className="text-xs text-muted-foreground">
                      Capacidad máxima: {selectedEspacio.capacidad} personas
                    </p>
                  )}
                </div>

                {/* Notas */}
                <div className="space-y-2">
                  <Label>Notas adicionales</Label>
                  <Textarea
                    placeholder="Información adicional..."
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmitReserva} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <CalendarCheck className="h-4 w-4 mr-2" />
                      Crear Reserva
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Reservas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 text-yellow-600 p-2 rounded-lg">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendientes}</p>
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 text-green-600 p-2 rounded-lg">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.confirmadas}</p>
                  <p className="text-xs text-muted-foreground">Confirmadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 text-red-600 p-2 rounded-lg">
                  <XCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.canceladas}</p>
                  <p className="text-xs text-muted-foreground">Canceladas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 text-purple-600 p-2 rounded-lg">
                  <Timer className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.ocupacionMes}%</p>
                  <p className="text-xs text-muted-foreground">Ocupación</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="calendario">
            <CalendarDays className="h-4 w-4 mr-2" />
            Calendario
          </TabsTrigger>
          <TabsTrigger value="espacios">
            <Building2 className="h-4 w-4 mr-2" />
            Espacios
          </TabsTrigger>
          <TabsTrigger value="reservas">
            <CalendarRange className="h-4 w-4 mr-2" />
            Mis Reservas
          </TabsTrigger>
        </TabsList>

        {/* Tab: Calendario */}
        <TabsContent value="calendario">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Calendario */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Calendario</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={es}
                  className="rounded-md border"
                  modifiers={{
                    hasReservation: diasConReservas,
                  }}
                  modifiersStyles={{
                    hasReservation: {
                      fontWeight: 'bold',
                      backgroundColor: 'rgb(var(--primary) / 0.1)',
                    },
                  }}
                />
              </CardContent>
            </Card>

            {/* Reservas del día */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    Reservas del {format(selectedDate, "d 'de' MMMM", { locale: es })}
                  </span>
                  <Badge variant="outline">
                    {reservasDelDia.length} reserva{reservasDelDia.length !== 1 ? 's' : ''}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reservasDelDia.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarX className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">No hay reservas para este día</p>
                    <Button className="mt-4" variant="outline" onClick={() => handleNuevaReserva()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Reserva
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reservasDelDia.map((reserva) => {
                      const estadoInfo = ESTADOS_RESERVA[reserva.estado];
                      const EstadoIcon = estadoInfo.icon;
                      
                      return (
                        <div
                          key={reserva.id}
                          className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex flex-col items-center text-center min-w-[60px]">
                            <p className="text-lg font-bold">{reserva.horaInicio}</p>
                            <p className="text-xs text-muted-foreground">-</p>
                            <p className="text-sm text-muted-foreground">{reserva.horaFin}</p>
                          </div>
                          
                          <Separator orientation="vertical" className="h-16" />
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{reserva.espacio.nombre}</h4>
                              <Badge className={estadoInfo.color}>
                                <EstadoIcon className="h-3 w-3 mr-1" />
                                {estadoInfo.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              {reserva.motivo || 'Sin descripción'}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {reserva.numAsistentes} personas
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {reserva.usuarioNombre}
                              </span>
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setReservaDetalle(reserva)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalles
                              </DropdownMenuItem>
                              {reserva.estado === 'pendiente' && (
                                <DropdownMenuItem onClick={() => handleConfirmarReserva(reserva.id)}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Confirmar
                                </DropdownMenuItem>
                              )}
                              {(reserva.estado === 'pendiente' || reserva.estado === 'confirmada') && (
                                <DropdownMenuItem 
                                  onClick={() => handleCancelarReserva(reserva.id)}
                                  className="text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancelar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Espacios */}
        <TabsContent value="espacios">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {espacios.map((espacio) => {
              const tipoInfo = TIPOS_ESPACIO.find(t => t.value === espacio.tipo);
              const Icon = tipoInfo?.icon || DoorOpen;
              
              return (
                <Card key={espacio.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {espacio.imagenUrl && (
                    <div className="aspect-video bg-muted">
                      <img src={espacio.imagenUrl} alt={espacio.nombre} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{espacio.nombre}</CardTitle>
                        <CardDescription>{tipoInfo?.label || espacio.tipo}</CardDescription>
                      </div>
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {espacio.descripcion}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        {espacio.capacidad} personas
                      </Badge>
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        {espacio.horarioApertura} - {espacio.horarioCierre}
                      </Badge>
                      {espacio.precio !== undefined && espacio.precio > 0 && (
                        <Badge variant="secondary">
                          <Euro className="h-3 w-3 mr-1" />
                          {espacio.precio}€/h
                        </Badge>
                      )}
                    </div>
                    
                    {espacio.amenities.length > 0 && (
                      <div className="flex gap-1">
                        {espacio.amenities.map((amenity) => {
                          const AmenityIcon = AMENITIES_ICONS[amenity] || DoorOpen;
                          return (
                            <div 
                              key={amenity}
                              className="p-1.5 rounded bg-muted"
                              title={amenity}
                            >
                              <AmenityIcon className="h-3 w-3" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {espacio.ubicacion}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button 
                      className="w-full" 
                      onClick={() => handleNuevaReserva(espacio)}
                      disabled={!espacio.disponible}
                    >
                      <CalendarCheck className="h-4 w-4 mr-2" />
                      {espacio.disponible ? 'Reservar' : 'No Disponible'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab: Mis Reservas */}
        <TabsContent value="reservas">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle>Mis Reservas</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      className="pl-9 w-[200px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={filterEspacio} onValueChange={setFilterEspacio}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Espacio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {espacios.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterEstado} onValueChange={setFilterEstado}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {Object.entries(ESTADOS_RESERVA).map(([key, val]) => (
                        <SelectItem key={key} value={key}>{val.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {reservasFiltradas.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarX className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No se encontraron reservas</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Espacio</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Horario</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservasFiltradas.map((reserva) => {
                      const estadoInfo = ESTADOS_RESERVA[reserva.estado];
                      const EstadoIcon = estadoInfo.icon;
                      
                      return (
                        <TableRow key={reserva.id}>
                          <TableCell>
                            <div className="font-medium">{reserva.espacio.nombre}</div>
                            <div className="text-xs text-muted-foreground">{reserva.espacio.ubicacion}</div>
                          </TableCell>
                          <TableCell>
                            {format(parseISO(reserva.fechaInicio), "d MMM yyyy", { locale: es })}
                          </TableCell>
                          <TableCell>
                            {reserva.horaInicio} - {reserva.horaFin}
                          </TableCell>
                          <TableCell>
                            <span className="line-clamp-1">{reserva.motivo || '-'}</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={estadoInfo.color}>
                              <EstadoIcon className="h-3 w-3 mr-1" />
                              {estadoInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setReservaDetalle(reserva)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Detalles
                                </DropdownMenuItem>
                                {reserva.estado === 'pendiente' && (
                                  <DropdownMenuItem onClick={() => handleConfirmarReserva(reserva.id)}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Confirmar
                                  </DropdownMenuItem>
                                )}
                                {(reserva.estado === 'pendiente' || reserva.estado === 'confirmada') && (
                                  <DropdownMenuItem 
                                    onClick={() => handleCancelarReserva(reserva.id)}
                                    className="text-red-600"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancelar
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Detalle de Reserva */}
      <Dialog open={!!reservaDetalle} onOpenChange={() => setReservaDetalle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de Reserva</DialogTitle>
          </DialogHeader>
          {reservaDetalle && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Espacio</Label>
                  <p className="font-medium">{reservaDetalle.espacio.nombre}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Estado</Label>
                  <Badge className={ESTADOS_RESERVA[reservaDetalle.estado].color}>
                    {ESTADOS_RESERVA[reservaDetalle.estado].label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha</Label>
                  <p className="font-medium">
                    {format(parseISO(reservaDetalle.fechaInicio), "d 'de' MMMM 'de' yyyy", { locale: es })}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Horario</Label>
                  <p className="font-medium">{reservaDetalle.horaInicio} - {reservaDetalle.horaFin}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Reservado por</Label>
                  <p className="font-medium">{reservaDetalle.usuarioNombre}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Asistentes</Label>
                  <p className="font-medium">{reservaDetalle.numAsistentes} personas</p>
                </div>
              </div>
              
              {reservaDetalle.motivo && (
                <div>
                  <Label className="text-muted-foreground">Motivo</Label>
                  <p>{reservaDetalle.motivo}</p>
                </div>
              )}
              
              {reservaDetalle.notas && (
                <div>
                  <Label className="text-muted-foreground">Notas</Label>
                  <p className="text-sm">{reservaDetalle.notas}</p>
                </div>
              )}
              
              <Separator />
              
              <div className="text-xs text-muted-foreground">
                Creada el {format(parseISO(reservaDetalle.createdAt), "d/MM/yyyy 'a las' HH:mm", { locale: es })}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReservaDetalle(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Import missing component
function User(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
