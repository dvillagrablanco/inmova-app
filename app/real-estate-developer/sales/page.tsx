'use client';

/**
 * Real Estate Developer - Ventas
 * 
 * Gestión de ventas de unidades inmobiliarias
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import {
  Euro,
  Search,
  TrendingUp,
  Home,
  Users,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Venta {
  id: string;
  proyecto: string;
  unidad: string;
  tipoUnidad: string;
  comprador: string;
  precio: number;
  fechaReserva: string;
  fechaContrato: string | null;
  estado: 'reserva' | 'arras' | 'contrato' | 'escritura' | 'entregada' | 'cancelada';
  entradaPagada: number;
  pagosRestantes: number;
  comercial: string;
}

const VENTAS_MOCK: Venta[] = [
  {
    id: '1',
    proyecto: 'Residencial Aurora',
    unidad: '3B - 2ºA',
    tipoUnidad: '3 hab + 2 baños',
    comprador: 'García Martínez, Juan',
    precio: 295000,
    fechaReserva: '2025-11-15',
    fechaContrato: '2025-12-20',
    estado: 'contrato',
    entradaPagada: 59000,
    pagosRestantes: 3,
    comercial: 'María López',
  },
  {
    id: '2',
    proyecto: 'Residencial Aurora',
    unidad: '2A - 1ºB',
    tipoUnidad: '2 hab + 1 baño',
    comprador: 'López Fernández, María',
    precio: 245000,
    fechaReserva: '2025-12-01',
    fechaContrato: null,
    estado: 'arras',
    entradaPagada: 24500,
    pagosRestantes: 6,
    comercial: 'Carlos Ruiz',
  },
  {
    id: '3',
    proyecto: 'Torre Skyline',
    unidad: '15A',
    tipoUnidad: 'Ático 4 hab',
    comprador: 'Sánchez Torres, Pedro',
    precio: 580000,
    fechaReserva: '2025-10-20',
    fechaContrato: '2025-11-15',
    estado: 'escritura',
    entradaPagada: 174000,
    pagosRestantes: 1,
    comercial: 'María López',
  },
  {
    id: '4',
    proyecto: 'Jardines del Sur',
    unidad: '4C - Bajo B',
    tipoUnidad: '3 hab + jardín',
    comprador: 'Ruiz González, Ana',
    precio: 210000,
    fechaReserva: '2026-01-10',
    fechaContrato: null,
    estado: 'reserva',
    entradaPagada: 5000,
    pagosRestantes: 8,
    comercial: 'Carlos Ruiz',
  },
  {
    id: '5',
    proyecto: 'Residencial Aurora',
    unidad: '1B - 3ºA',
    tipoUnidad: '1 hab',
    comprador: 'Martín Díaz, Carlos',
    precio: 175000,
    fechaReserva: '2025-09-05',
    fechaContrato: '2025-10-01',
    estado: 'entregada',
    entradaPagada: 175000,
    pagosRestantes: 0,
    comercial: 'María López',
  },
];

export default function RealEstateDeveloperSalesPage() {
  const [ventas] = useState<Venta[]>(VENTAS_MOCK);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [filterProyecto, setFilterProyecto] = useState<string>('all');

  const filteredVentas = ventas.filter((v) => {
    const matchSearch =
      v.comprador.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.unidad.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstado = filterEstado === 'all' || v.estado === filterEstado;
    const matchProyecto = filterProyecto === 'all' || v.proyecto === filterProyecto;
    return matchSearch && matchEstado && matchProyecto;
  });

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'reserva':
        return <Badge className="bg-blue-100 text-blue-700">Reserva</Badge>;
      case 'arras':
        return <Badge className="bg-yellow-100 text-yellow-700">Arras</Badge>;
      case 'contrato':
        return <Badge className="bg-purple-100 text-purple-700">Contrato</Badge>;
      case 'escritura':
        return <Badge className="bg-orange-100 text-orange-700">Escritura</Badge>;
      case 'entregada':
        return <Badge className="bg-green-100 text-green-700">Entregada</Badge>;
      case 'cancelada':
        return <Badge className="bg-red-100 text-red-700">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const handleAvanzarEstado = (venta: Venta) => {
    const estados = ['reserva', 'arras', 'contrato', 'escritura', 'entregada'];
    const currentIndex = estados.indexOf(venta.estado);
    if (currentIndex < estados.length - 1) {
      toast.success(`Venta avanzada a: ${estados[currentIndex + 1]}`);
    }
  };

  // Stats
  const stats = {
    totalVentas: ventas.filter((v) => v.estado !== 'cancelada').length,
    volumenTotal: ventas
      .filter((v) => v.estado !== 'cancelada')
      .reduce((acc, v) => acc + v.precio, 0),
    entregadas: ventas.filter((v) => v.estado === 'entregada').length,
    enProceso: ventas.filter(
      (v) => !['entregada', 'cancelada'].includes(v.estado)
    ).length,
  };

  const proyectos = [...new Set(ventas.map((v) => v.proyecto))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Euro className="h-6 w-6" />
            Ventas
          </h1>
          <p className="text-muted-foreground">
            Gestión de ventas y reservas
          </p>
        </div>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Nueva Reserva
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Ventas</p>
                <p className="text-2xl font-bold">{stats.totalVentas}</p>
              </div>
              <Home className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Volumen Total</p>
                <p className="text-2xl font-bold text-green-600">
                  €{(stats.volumenTotal / 1000000).toFixed(1)}M
                </p>
              </div>
              <Euro className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Entregadas</p>
                <p className="text-2xl font-bold text-green-600">{stats.entregadas}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Proceso</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.enProceso}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por comprador o unidad..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterProyecto} onValueChange={setFilterProyecto}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Proyecto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los proyectos</SelectItem>
                {proyectos.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="reserva">Reserva</SelectItem>
                <SelectItem value="arras">Arras</SelectItem>
                <SelectItem value="contrato">Contrato</SelectItem>
                <SelectItem value="escritura">Escritura</SelectItem>
                <SelectItem value="entregada">Entregada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Ventas List */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Ventas ({filteredVentas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredVentas.map((venta) => (
              <div
                key={venta.id}
                className="flex flex-col lg:flex-row items-start lg:items-center justify-between p-4 border rounded-lg gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{venta.unidad}</p>
                    <Badge variant="outline" className="text-xs">
                      {venta.proyecto}
                    </Badge>
                    {getEstadoBadge(venta.estado)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {venta.tipoUnidad}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {venta.comprador}
                    </span>
                    <span className="flex items-center gap-1">
                      <Euro className="h-3 w-3" />
                      {venta.precio.toLocaleString()}€
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Reserva: {venta.fechaReserva}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span>
                      Entrada: <span className="font-medium text-green-600">
                        €{venta.entradaPagada.toLocaleString()}
                      </span>
                    </span>
                    <span>
                      Pendiente: <span className="font-medium">
                        €{(venta.precio - venta.entradaPagada).toLocaleString()}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 w-full lg:w-auto">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Ver Detalle
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {venta.unidad} - {venta.proyecto}
                        </DialogTitle>
                        <DialogDescription>{venta.tipoUnidad}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        {getEstadoBadge(venta.estado)}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Comprador</p>
                            <p className="font-medium">{venta.comprador}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Comercial</p>
                            <p className="font-medium">{venta.comercial}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Precio</p>
                            <p className="font-medium">€{venta.precio.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Entrada Pagada</p>
                            <p className="font-medium text-green-600">
                              €{venta.entradaPagada.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fecha Reserva</p>
                            <p className="font-medium">{venta.fechaReserva}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fecha Contrato</p>
                            <p className="font-medium">
                              {venta.fechaContrato || 'Pendiente'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Pagos Restantes</p>
                            <p className="font-medium">{venta.pagosRestantes}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Importe Pendiente</p>
                            <p className="font-medium">
                              €{(venta.precio - venta.entradaPagada).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {venta.estado !== 'entregada' && venta.estado !== 'cancelada' && (
                          <Button
                            className="w-full"
                            onClick={() => handleAvanzarEstado(venta)}
                          >
                            Avanzar Estado
                          </Button>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  {venta.estado !== 'entregada' && venta.estado !== 'cancelada' && (
                    <Button size="sm" onClick={() => handleAvanzarEstado(venta)}>
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {filteredVentas.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron ventas
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
