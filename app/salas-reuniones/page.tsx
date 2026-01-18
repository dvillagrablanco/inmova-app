'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  DoorOpen,
  Plus,
  Search,
  Calendar,
  Clock,
  Users,
  Monitor,
  Wifi,
  Coffee,
  Projector,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  CalendarDays,
  Building2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface SalaReuniones {
  id: string;
  nombre: string;
  ubicacion: string;
  edificio: string;
  planta: string;
  capacidad: number;
  tarifaHora: number;
  estado: 'disponible' | 'ocupada' | 'mantenimiento' | 'reservada';
  equipamiento: string[];
  servicios: string[];
  descripcion: string;
  horarioApertura: string;
  horarioCierre: string;
  imagenUrl?: string;
}

interface Reserva {
  id: string;
  salaId: string;
  salaNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  organizador: string;
  asistentes: number;
  motivo: string;
  estado: 'confirmada' | 'pendiente' | 'cancelada';
  serviciosAdicionales: string[];
  total: number;
}

const estadoColors: Record<string, string> = {
  disponible: 'bg-green-100 text-green-800',
  ocupada: 'bg-red-100 text-red-800',
  reservada: 'bg-amber-100 text-amber-800',
  mantenimiento: 'bg-gray-100 text-gray-800',
};

const reservaEstadoColors: Record<string, string> = {
  confirmada: 'bg-green-100 text-green-800',
  pendiente: 'bg-amber-100 text-amber-800',
  cancelada: 'bg-red-100 text-red-800',
};

const equipamientoIcons: Record<string, any> = {
  'Proyector': Projector,
  'Pantalla TV': Monitor,
  'Videoconferencia': Monitor,
  'WiFi': Wifi,
  'Pizarra': Monitor,
};

export default function SalasReunionesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [salas, setSalas] = useState<SalaReuniones[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [capacidadFilter, setCapacidadFilter] = useState('todas');
  const [showCreateSala, setShowCreateSala] = useState(false);
  const [showCreateReserva, setShowCreateReserva] = useState(false);
  const [activeTab, setActiveTab] = useState('salas');
  
  // Form states para nueva sala
  const [newSala, setNewSala] = useState({
    nombre: '',
    ubicacion: '',
    edificio: '',
    planta: '',
    capacidad: 0,
    tarifaHora: 0,
    descripcion: '',
    horarioApertura: '08:00',
    horarioCierre: '20:00',
    equipamiento: [] as string[],
    servicios: [] as string[],
  });
  
  // Form states para nueva reserva
  const [newReserva, setNewReserva] = useState({
    salaId: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    organizador: '',
    asistentes: 0,
    motivo: '',
    serviciosAdicionales: [] as string[],
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    }
  }, [status]);

  const loadData = async () => {
    try {
      setLoading(true);
      // TODO: Integrar con API real
      // const response = await fetch('/api/salas-reuniones');
      // const data = await response.json();
      // setSalas(data.salas);
      // setReservas(data.reservas);
      
      // Estado vacío inicial
      setSalas([]);
      setReservas([]);
    } catch (error) {
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSala = async () => {
    try {
      // TODO: Integrar con API real
      // const response = await fetch('/api/salas-reuniones', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newSala),
      // });
      
      toast.success('Sala de reuniones creada correctamente');
      setShowCreateSala(false);
      setNewSala({
        nombre: '',
        ubicacion: '',
        edificio: '',
        planta: '',
        capacidad: 0,
        tarifaHora: 0,
        descripcion: '',
        horarioApertura: '08:00',
        horarioCierre: '20:00',
        equipamiento: [],
        servicios: [],
      });
      loadData();
    } catch (error) {
      toast.error('Error al crear la sala');
    }
  };

  const handleCreateReserva = async () => {
    try {
      // TODO: Integrar con API real
      // const response = await fetch('/api/salas-reuniones/reservas', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newReserva),
      // });
      
      toast.success('Reserva creada correctamente');
      setShowCreateReserva(false);
      setNewReserva({
        salaId: '',
        fecha: '',
        horaInicio: '',
        horaFin: '',
        organizador: '',
        asistentes: 0,
        motivo: '',
        serviciosAdicionales: [],
      });
      loadData();
    } catch (error) {
      toast.error('Error al crear la reserva');
    }
  };

  const filteredSalas = salas.filter((sala) => {
    const matchesSearch = sala.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sala.ubicacion.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEstado = estadoFilter === 'todos' || sala.estado === estadoFilter;
    const matchesCapacidad = capacidadFilter === 'todas' ||
      (capacidadFilter === 'pequena' && sala.capacidad <= 6) ||
      (capacidadFilter === 'mediana' && sala.capacidad > 6 && sala.capacidad <= 12) ||
      (capacidadFilter === 'grande' && sala.capacidad > 12);
    return matchesSearch && matchesEstado && matchesCapacidad;
  });

  // KPIs
  const totalSalas = salas.length;
  const salasDisponibles = salas.filter(s => s.estado === 'disponible').length;
  const salasOcupadas = salas.filter(s => s.estado === 'ocupada').length;
  const reservasHoy = reservas.filter(r => {
    const hoy = new Date().toISOString().split('T')[0];
    return r.fecha === hoy && r.estado === 'confirmada';
  }).length;

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <DoorOpen className="h-8 w-8 text-blue-600" />
                Salas de Reuniones
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestión y reserva de salas de reuniones
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={showCreateReserva} onOpenChange={setShowCreateReserva}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Nueva Reserva
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nueva Reserva</DialogTitle>
                  <DialogDescription>
                    Reserva una sala de reuniones
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Sala</Label>
                    <Select value={newReserva.salaId} onValueChange={(v) => setNewReserva({...newReserva, salaId: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar sala" />
                      </SelectTrigger>
                      <SelectContent>
                        {salas.filter(s => s.estado === 'disponible').map(sala => (
                          <SelectItem key={sala.id} value={sala.id}>
                            {sala.nombre} ({sala.capacidad} personas)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Fecha</Label>
                      <Input
                        type="date"
                        value={newReserva.fecha}
                        onChange={(e) => setNewReserva({...newReserva, fecha: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Asistentes</Label>
                      <Input
                        type="number"
                        value={newReserva.asistentes || ''}
                        onChange={(e) => setNewReserva({...newReserva, asistentes: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Hora Inicio</Label>
                      <Input
                        type="time"
                        value={newReserva.horaInicio}
                        onChange={(e) => setNewReserva({...newReserva, horaInicio: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Hora Fin</Label>
                      <Input
                        type="time"
                        value={newReserva.horaFin}
                        onChange={(e) => setNewReserva({...newReserva, horaFin: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Organizador</Label>
                    <Input
                      value={newReserva.organizador}
                      onChange={(e) => setNewReserva({...newReserva, organizador: e.target.value})}
                      placeholder="Nombre del organizador"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Motivo de la reunión</Label>
                    <Textarea
                      value={newReserva.motivo}
                      onChange={(e) => setNewReserva({...newReserva, motivo: e.target.value})}
                      placeholder="Descripción de la reunión..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateReserva(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateReserva}>
                    Crear Reserva
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog open={showCreateSala} onOpenChange={setShowCreateSala}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Sala
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nueva Sala de Reuniones</DialogTitle>
                  <DialogDescription>
                    Añade una nueva sala de reuniones al sistema
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Nombre de la Sala</Label>
                      <Input
                        value={newSala.nombre}
                        onChange={(e) => setNewSala({...newSala, nombre: e.target.value})}
                        placeholder="Ej: Sala Ejecutiva A"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Edificio</Label>
                      <Input
                        value={newSala.edificio}
                        onChange={(e) => setNewSala({...newSala, edificio: e.target.value})}
                        placeholder="Ej: Torre Norte"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Ubicación/Dirección</Label>
                      <Input
                        value={newSala.ubicacion}
                        onChange={(e) => setNewSala({...newSala, ubicacion: e.target.value})}
                        placeholder="Ej: Av. Principal 123"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Planta</Label>
                      <Input
                        value={newSala.planta}
                        onChange={(e) => setNewSala({...newSala, planta: e.target.value})}
                        placeholder="Ej: Planta 5"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Capacidad (personas)</Label>
                      <Input
                        type="number"
                        value={newSala.capacidad || ''}
                        onChange={(e) => setNewSala({...newSala, capacidad: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Tarifa por Hora (€)</Label>
                      <Input
                        type="number"
                        value={newSala.tarifaHora || ''}
                        onChange={(e) => setNewSala({...newSala, tarifaHora: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Horario Apertura</Label>
                      <Input
                        type="time"
                        value={newSala.horarioApertura}
                        onChange={(e) => setNewSala({...newSala, horarioApertura: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Horario Cierre</Label>
                      <Input
                        type="time"
                        value={newSala.horarioCierre}
                        onChange={(e) => setNewSala({...newSala, horarioCierre: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Descripción</Label>
                    <Textarea
                      value={newSala.descripcion}
                      onChange={(e) => setNewSala({...newSala, descripcion: e.target.value})}
                      placeholder="Descripción de la sala y sus características..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Equipamiento</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Proyector', 'Pantalla TV', 'Videoconferencia', 'WiFi', 'Pizarra', 'Sistema Audio'].map((equip) => (
                        <Badge
                          key={equip}
                          variant={newSala.equipamiento.includes(equip) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            if (newSala.equipamiento.includes(equip)) {
                              setNewSala({...newSala, equipamiento: newSala.equipamiento.filter(e => e !== equip)});
                            } else {
                              setNewSala({...newSala, equipamiento: [...newSala.equipamiento, equip]});
                            }
                          }}
                        >
                          {equip}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Servicios Adicionales</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Catering', 'Café y bebidas', 'Material papelería', 'Recepcionista', 'Parking'].map((serv) => (
                        <Badge
                          key={serv}
                          variant={newSala.servicios.includes(serv) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            if (newSala.servicios.includes(serv)) {
                              setNewSala({...newSala, servicios: newSala.servicios.filter(s => s !== serv)});
                            } else {
                              setNewSala({...newSala, servicios: [...newSala.servicios, serv]});
                            }
                          }}
                        >
                          {serv}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateSala(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateSala}>
                    Crear Sala
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Salas</p>
                  <p className="text-2xl font-bold">{totalSalas}</p>
                </div>
                <DoorOpen className="h-8 w-8 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Disponibles</p>
                  <p className="text-2xl font-bold text-green-600">{salasDisponibles}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ocupadas</p>
                  <p className="text-2xl font-bold text-red-600">{salasOcupadas}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reservas Hoy</p>
                  <p className="text-2xl font-bold text-amber-600">{reservasHoy}</p>
                </div>
                <Calendar className="h-8 w-8 text-amber-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="salas">Salas</TabsTrigger>
            <TabsTrigger value="reservas">Reservas</TabsTrigger>
            <TabsTrigger value="calendario">Calendario</TabsTrigger>
          </TabsList>

          <TabsContent value="salas" className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar sala..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los estados</SelectItem>
                      <SelectItem value="disponible">Disponibles</SelectItem>
                      <SelectItem value="ocupada">Ocupadas</SelectItem>
                      <SelectItem value="reservada">Reservadas</SelectItem>
                      <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={capacidadFilter} onValueChange={setCapacidadFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Capacidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas las capacidades</SelectItem>
                      <SelectItem value="pequena">Pequeña (1-6)</SelectItem>
                      <SelectItem value="mediana">Mediana (7-12)</SelectItem>
                      <SelectItem value="grande">Grande (13+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Salas */}
            {filteredSalas.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <DoorOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay salas de reuniones</h3>
                  <p className="text-muted-foreground mb-4">
                    Crea tu primera sala de reuniones para empezar
                  </p>
                  <Button onClick={() => setShowCreateSala(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Sala
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSalas.map((sala) => (
                  <Card key={sala.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="h-40 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                      <DoorOpen className="h-16 w-16 text-blue-300" />
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{sala.nombre}</h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            {sala.edificio} - {sala.planta}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="h-4 w-4 mr-2" />
                              Ver calendario
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <Badge className={estadoColors[sala.estado]}>
                        {sala.estado.charAt(0).toUpperCase() + sala.estado.slice(1)}
                      </Badge>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {sala.capacidad} personas
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {sala.tarifaHora}€/hora
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {sala.equipamiento.slice(0, 3).map((equip) => (
                          <Badge key={equip} variant="outline" className="text-xs">
                            {equip}
                          </Badge>
                        ))}
                        {sala.equipamiento.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{sala.equipamiento.length - 3}
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="flex-1" size="sm">
                          Ver disponibilidad
                        </Button>
                        <Button className="flex-1" size="sm" onClick={() => setShowCreateReserva(true)}>
                          Reservar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reservas" className="space-y-4">
            {reservas.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay reservas</h3>
                  <p className="text-muted-foreground mb-4">
                    Las reservas de salas aparecerán aquí
                  </p>
                  <Button onClick={() => setShowCreateReserva(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Reserva
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-4 font-medium">Sala</th>
                          <th className="text-left p-4 font-medium">Fecha</th>
                          <th className="text-left p-4 font-medium">Horario</th>
                          <th className="text-left p-4 font-medium">Organizador</th>
                          <th className="text-left p-4 font-medium">Asistentes</th>
                          <th className="text-left p-4 font-medium">Estado</th>
                          <th className="text-left p-4 font-medium">Total</th>
                          <th className="text-right p-4 font-medium">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservas.map((reserva) => (
                          <tr key={reserva.id} className="border-b hover:bg-gray-50">
                            <td className="p-4 font-medium">{reserva.salaNombre}</td>
                            <td className="p-4">{reserva.fecha}</td>
                            <td className="p-4">{reserva.horaInicio} - {reserva.horaFin}</td>
                            <td className="p-4">{reserva.organizador}</td>
                            <td className="p-4">{reserva.asistentes}</td>
                            <td className="p-4">
                              <Badge className={reservaEstadoColors[reserva.estado]}>
                                {reserva.estado}
                              </Badge>
                            </td>
                            <td className="p-4">{reserva.total}€</td>
                            <td className="p-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver detalles
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Modificar
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600">
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancelar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="calendario" className="space-y-4">
            <Card>
              <CardContent className="text-center py-12">
                <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Calendario de Reservas</h3>
                <p className="text-muted-foreground mb-4">
                  Vista de calendario disponible próximamente
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
