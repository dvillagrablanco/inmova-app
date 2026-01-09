'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Laptop,
  Plus,
  Search,
  Filter,
  MapPin,
  Euro,
  Users,
  Ruler,
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
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Datos de ejemplo
const mockCoworking = [
  {
    id: '1',
    nombre: 'Oficina Privada 4P - Hub Innovation',
    direccion: 'Calle Alcalá 250, Madrid',
    tipo: 'coworking_office',
    capacidad: 4,
    estado: 'ocupada',
    rentaMensual: 1200,
    arrendatario: 'StartupX SL',
    periodo: 'mensual',
    servicios: ['wifi', 'cafe', 'impresora', 'salas'],
    horasAcceso: '24/7',
  },
  {
    id: '2',
    nombre: 'Puestos Hot Desk - Zona Premium',
    direccion: 'Paseo de la Castellana 95, Madrid',
    tipo: 'coworking_hot_desk',
    capacidad: 20,
    ocupados: 15,
    estado: 'disponible',
    rentaMensual: 250,
    periodo: 'mensual',
    servicios: ['wifi', 'cafe', 'impresora', 'eventos'],
    horasAcceso: 'L-V 8:00-22:00',
  },
  {
    id: '3',
    nombre: 'Oficina 6P - Creative Space',
    direccion: 'Calle Fuencarral 123, Madrid',
    tipo: 'coworking_office',
    capacidad: 6,
    estado: 'disponible',
    rentaMensual: 1800,
    periodo: 'mensual',
    servicios: ['wifi', 'cafe', 'impresora', 'salas', 'terraza'],
    horasAcceso: '24/7',
  },
  {
    id: '4',
    nombre: 'Puesto Dedicado - Business Center',
    direccion: 'Gran Vía 32, Madrid',
    tipo: 'coworking_dedicated',
    capacidad: 10,
    ocupados: 8,
    estado: 'disponible',
    rentaMensual: 350,
    periodo: 'mensual',
    servicios: ['wifi', 'cafe', 'impresora', 'salas', 'recepcion'],
    horasAcceso: '24/7',
  },
];

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

const servicioIcons: Record<string, any> = {
  wifi: { icon: Wifi, label: 'WiFi de alta velocidad' },
  cafe: { icon: Coffee, label: 'Café incluido' },
  impresora: { icon: Printer, label: 'Impresora' },
  salas: { icon: Video, label: 'Salas de reuniones' },
  recepcion: { icon: Phone, label: 'Recepción' },
  eventos: { icon: Users, label: 'Eventos networking' },
};

export default function CoworkingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');

  const filteredCoworking = mockCoworking.filter((espacio) => {
    const matchesSearch = espacio.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      espacio.direccion.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTipo = tipoFilter === 'todos' || espacio.tipo === tipoFilter;
    return matchesSearch && matchesTipo;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link href="/comercial" className="hover:text-blue-600">Alquiler Comercial</Link>
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
        <Button asChild>
          <Link href="/comercial/espacios/nuevo?tipo=coworking">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Espacio
          </Link>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Espacios Totales</div>
            <div className="text-2xl font-bold">4</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Puestos Totales</div>
            <div className="text-2xl font-bold">40</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Ocupación</div>
            <div className="text-2xl font-bold text-green-600">75%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Ingresos/mes</div>
            <div className="text-2xl font-bold">11.950€</div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCoworking.map((espacio) => (
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
                <Badge className={tipoColors[espacio.tipo]}>
                  {tipoLabels[espacio.tipo]}
                </Badge>
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
                <Button variant="outline" className="flex-1" asChild>
                  <Link href={`/comercial/espacios/${espacio.id}`}>
                    Ver detalles
                  </Link>
                </Button>
                {espacio.estado === 'disponible' && (
                  <Button className="flex-1">
                    Reservar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
  );
}
