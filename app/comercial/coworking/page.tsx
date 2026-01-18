'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Laptop,
  Plus,
  Search,
  Filter,
  MapPin,
  Euro,
  Users,
  ChevronRight,
  MoreVertical,
  Eye,
  Edit,
  FileText,
  Calendar,
  Wifi,
  Coffee,
  Clock,
  Printer,
  Phone,
  Video,
  RefreshCw,
  Building2,
  CreditCard,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

interface EspacioCoworking {
  id: string;
  nombre: string;
  direccion: string;
  tipo: 'coworking_hot_desk' | 'coworking_dedicated' | 'coworking_office';
  capacidad: number;
  ocupados: number;
  estado: 'disponible' | 'ocupada' | 'mantenimiento';
  rentaMensual: number;
  arrendatario?: string;
  periodo: 'diario' | 'semanal' | 'mensual' | 'anual';
  servicios: string[];
  horasAcceso: string;
}

const tipoLabels: Record<string, string> = {
  coworking_hot_desk: 'Hot Desk',
  coworking_dedicated: 'Puesto Dedicado',
  coworking_office: 'Oficina Privada',
};

const tipoColors: Record<string, string> = {
  coworking_hot_desk: 'bg-blue-100 text-blue-800',
  coworking_dedicated: 'bg-purple-100 text-purple-800',
  coworking_office: 'bg-green-100 text-green-800',
};

const servicioIcons: Record<string, { icon: any; label: string }> = {
  wifi: { icon: Wifi, label: 'WiFi de alta velocidad' },
  cafe: { icon: Coffee, label: 'Café incluido' },
  impresora: { icon: Printer, label: 'Impresora' },
  salas: { icon: Video, label: 'Salas de reuniones' },
  recepcion: { icon: Phone, label: 'Recepción' },
  eventos: { icon: Users, label: 'Eventos networking' },
};

export default function CoworkingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [espacios, setEspacios] = useState<EspacioCoworking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [newEspacio, setNewEspacio] = useState({
    nombre: '',
    direccion: '',
    tipo: 'coworking_office' as const,
    capacidad: 1,
    rentaMensual: 0,
    horasAcceso: '24/7',
    servicios: [] as string[],
  });

  useEffect(() => {
    if (status === 'authenticated') {
      loadEspacios();
    }
  }, [status]);

  const loadEspacios = async () => {
    try {
      setLoading(true);
      // TODO: Integrar con API real
      // const response = await fetch('/api/comercial/coworking');
      // const data = await response.json();
      // setEspacios(data.espacios);
      
      // Estado vacío inicial
      setEspacios([]);
    } catch (error) {
      toast.error('Error al cargar los espacios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEspacio = async () => {
    if (!newEspacio.nombre || !newEspacio.direccion || !newEspacio.rentaMensual) {
      toast.error('Complete los campos obligatorios');
      return;
    }

    try {
      // TODO: Integrar con API real
      toast.success('Espacio de coworking creado correctamente');
      setShowCreateDialog(false);
      loadEspacios();
    } catch (error) {
      toast.error('Error al crear el espacio');
    }
  };

  const filteredEspacios = espacios.filter((espacio) => {
    const matchesSearch =
      espacio.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      espacio.direccion.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTipo = tipoFilter === 'todos' || espacio.tipo === tipoFilter;
    return matchesSearch && matchesTipo;
  });

  // Estadísticas
  const stats = {
    totalEspacios: espacios.length,
    puestosTotales: espacios.reduce((sum, e) => sum + e.capacidad, 0),
    puestosOcupados: espacios.reduce((sum, e) => sum + (e.ocupados || 0), 0),
    ingresosMensuales: espacios
      .filter((e) => e.estado === 'ocupada' || (e.ocupados && e.ocupados > 0))
      .reduce((sum, e) => {
        if (e.tipo === 'coworking_office') {
          return sum + (e.estado === 'ocupada' ? e.rentaMensual : 0);
        }
        return sum + (e.ocupados || 0) * e.rentaMensual;
      }, 0),
  };

  const ocupacion =
    stats.puestosTotales > 0
      ? Math.round((stats.puestosOcupados / stats.puestosTotales) * 100)
      : 0;

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/comercial" className="hover:text-blue-600">
            Alquiler Comercial
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-gray-900">Coworking</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Laptop className="h-8 w-8 text-purple-600" />
              Espacios Coworking
            </h1>
            <p className="text-gray-600 mt-1">
              Gestiona membresías de coworking, hot desks y oficinas flexibles
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadEspacios}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Espacio
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Crear Espacio de Coworking</DialogTitle>
                  <DialogDescription>
                    Añade un nuevo espacio de trabajo flexible
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Nombre del Espacio *</Label>
                    <Input
                      value={newEspacio.nombre}
                      onChange={(e) => setNewEspacio({ ...newEspacio, nombre: e.target.value })}
                      placeholder="Ej: Oficina Privada 4P - Hub Innovation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dirección *</Label>
                    <Input
                      value={newEspacio.direccion}
                      onChange={(e) => setNewEspacio({ ...newEspacio, direccion: e.target.value })}
                      placeholder="Calle Alcalá 250, Madrid"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Espacio *</Label>
                      <Select
                        value={newEspacio.tipo}
                        onValueChange={(value: any) =>
                          setNewEspacio({ ...newEspacio, tipo: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="coworking_hot_desk">Hot Desk</SelectItem>
                          <SelectItem value="coworking_dedicated">Puesto Dedicado</SelectItem>
                          <SelectItem value="coworking_office">Oficina Privada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Capacidad (personas) *</Label>
                      <Input
                        type="number"
                        value={newEspacio.capacidad}
                        onChange={(e) =>
                          setNewEspacio({ ...newEspacio, capacidad: parseInt(e.target.value) || 1 })
                        }
                        min={1}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Precio Mensual (€) *</Label>
                      <Input
                        type="number"
                        value={newEspacio.rentaMensual}
                        onChange={(e) =>
                          setNewEspacio({
                            ...newEspacio,
                            rentaMensual: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="250"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Horario de Acceso</Label>
                      <Select
                        value={newEspacio.horasAcceso}
                        onValueChange={(value) =>
                          setNewEspacio({ ...newEspacio, horasAcceso: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="24/7">24/7</SelectItem>
                          <SelectItem value="L-V 8:00-22:00">L-V 8:00-22:00</SelectItem>
                          <SelectItem value="L-V 9:00-20:00">L-V 9:00-20:00</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateEspacio}>Crear Espacio</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Laptop className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Espacios Totales</div>
                  <div className="text-2xl font-bold">{stats.totalEspacios}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Puestos Totales</div>
                  <div className="text-2xl font-bold">{stats.puestosTotales}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Ocupación</div>
                  <div className="text-2xl font-bold text-green-600">{ocupacion}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Euro className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Ingresos/mes</div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {stats.ingresosMensuales.toLocaleString('es-ES')}€
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nombre o dirección..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Tipo de espacio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  <SelectItem value="coworking_hot_desk">Hot Desk</SelectItem>
                  <SelectItem value="coworking_dedicated">Puesto Dedicado</SelectItem>
                  <SelectItem value="coworking_office">Oficina Privada</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Más filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de espacios */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredEspacios.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Laptop className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay espacios de coworking
              </h3>
              <p className="text-gray-600 mb-4">
                Comienza añadiendo tu primer espacio de trabajo flexible
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Espacio
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEspacios.map((espacio) => (
              <Card key={espacio.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-40 bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                  <Laptop className="h-16 w-16 text-purple-300" />
                </div>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{espacio.nombre}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                        <MapPin className="h-3 w-3" />
                        {espacio.direccion}
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Users className="h-4 w-4 mr-2" />
                          Ver miembros
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Calendar className="h-4 w-4 mr-2" />
                          Programar tour
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={tipoColors[espacio.tipo]}>{tipoLabels[espacio.tipo]}</Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {espacio.horasAcceso}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-500">Capacidad</div>
                      <div className="font-semibold flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {espacio.tipo === 'coworking_office'
                          ? `${espacio.capacidad} personas`
                          : `${espacio.ocupados || 0}/${espacio.capacidad} puestos`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Desde</div>
                      <div className="text-xl font-bold text-purple-600">
                        {espacio.rentaMensual}€<span className="text-sm font-normal">/mes</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {espacio.servicios.map((servicio) => {
                      const ServicioIcon = servicioIcons[servicio]?.icon || Wifi;
                      return (
                        <div
                          key={servicio}
                          className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
                          title={servicioIcons[servicio]?.label}
                        >
                          <ServicioIcon className="h-3 w-3" />
                          {servicioIcons[servicio]?.label || servicio}
                        </div>
                      );
                    })}
                  </div>

                  {espacio.arrendatario && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{espacio.arrendatario}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      Ver detalles
                    </Button>
                    {espacio.estado === 'disponible' && <Button className="flex-1">Reservar</Button>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Información adicional */}
        <Card>
          <CardHeader>
            <CardTitle>Servicios Incluidos</CardTitle>
            <CardDescription>Todos nuestros espacios de coworking incluyen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Wifi className="h-6 w-6 text-purple-600" />
                <div>
                  <div className="font-medium">WiFi Premium</div>
                  <div className="text-sm text-gray-500">1Gbps simétrico</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Coffee className="h-6 w-6 text-purple-600" />
                <div>
                  <div className="font-medium">Café & Snacks</div>
                  <div className="text-sm text-gray-500">Ilimitado</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Video className="h-6 w-6 text-purple-600" />
                <div>
                  <div className="font-medium">Salas de Reuniones</div>
                  <div className="text-sm text-gray-500">Reserva incluida</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
                <div>
                  <div className="font-medium">Comunidad</div>
                  <div className="text-sm text-gray-500">Eventos networking</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
