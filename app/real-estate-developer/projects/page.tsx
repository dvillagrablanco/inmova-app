'use client';

/**
 * Real Estate Developer - Proyectos
 * 
 * Gestión de proyectos de desarrollo inmobiliario
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Building2,
  Search,
  Plus,
  MapPin,
  Calendar,
  Euro,
  Home,
  Eye,
  TrendingUp,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Proyecto {
  id: string;
  nombre: string;
  ubicacion: string;
  tipo: 'residencial' | 'comercial' | 'mixto';
  estado: 'planificacion' | 'construccion' | 'comercializacion' | 'entrega' | 'completado';
  unidadesTotales: number;
  unidadesVendidas: number;
  unidadesReservadas: number;
  precioMedio: number;
  inversionTotal: number;
  fechaInicio: string;
  fechaEntrega: string;
  avanceObra: number;
  imagen?: string;
}

const PROYECTOS_MOCK: Proyecto[] = [
  {
    id: '1',
    nombre: 'Residencial Aurora',
    ubicacion: 'Madrid Norte - Valdebebas',
    tipo: 'residencial',
    estado: 'comercializacion',
    unidadesTotales: 120,
    unidadesVendidas: 98,
    unidadesReservadas: 8,
    precioMedio: 285000,
    inversionTotal: 28000000,
    fechaInicio: '2024-03-01',
    fechaEntrega: '2026-06-30',
    avanceObra: 85,
  },
  {
    id: '2',
    nombre: 'Torre Skyline',
    ubicacion: 'Barcelona - Diagonal Mar',
    tipo: 'residencial',
    estado: 'construccion',
    unidadesTotales: 80,
    unidadesVendidas: 65,
    unidadesReservadas: 5,
    precioMedio: 420000,
    inversionTotal: 32000000,
    fechaInicio: '2024-06-15',
    fechaEntrega: '2026-09-30',
    avanceObra: 62,
  },
  {
    id: '3',
    nombre: 'Jardines del Sur',
    ubicacion: 'Sevilla - Los Remedios',
    tipo: 'residencial',
    estado: 'comercializacion',
    unidadesTotales: 60,
    unidadesVendidas: 35,
    unidadesReservadas: 10,
    precioMedio: 195000,
    inversionTotal: 12000000,
    fechaInicio: '2025-01-10',
    fechaEntrega: '2027-03-31',
    avanceObra: 35,
  },
  {
    id: '4',
    nombre: 'Mirador Costa',
    ubicacion: 'Valencia - Playa de la Malvarrosa',
    tipo: 'residencial',
    estado: 'construccion',
    unidadesTotales: 45,
    unidadesVendidas: 12,
    unidadesReservadas: 8,
    precioMedio: 350000,
    inversionTotal: 15000000,
    fechaInicio: '2025-06-01',
    fechaEntrega: '2027-09-30',
    avanceObra: 15,
  },
  {
    id: '5',
    nombre: 'Urban Living',
    ubicacion: 'Bilbao - Abandoibarra',
    tipo: 'mixto',
    estado: 'planificacion',
    unidadesTotales: 37,
    unidadesVendidas: 8,
    unidadesReservadas: 5,
    precioMedio: 380000,
    inversionTotal: 14000000,
    fechaInicio: '2025-09-01',
    fechaEntrega: '2028-01-31',
    avanceObra: 0,
  },
];

export default function RealEstateDeveloperProjectsPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');

  useEffect(() => {
    const fetchProyectos = async () => {
      try {
        const response = await fetch('/api/real-estate-developer/projects');
        if (response.ok) {
          const data = await response.json();
          setProyectos(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProyectos();
  }, []);
  const [selectedProyecto, setSelectedProyecto] = useState<Proyecto | null>(null);

  const filteredProyectos = proyectos.filter((p) => {
    const matchSearch =
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ubicacion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstado = filterEstado === 'all' || p.estado === filterEstado;
    return matchSearch && matchEstado;
  });

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'planificacion':
        return <Badge className="bg-blue-100 text-blue-700">Planificación</Badge>;
      case 'construccion':
        return <Badge className="bg-yellow-100 text-yellow-700">En Construcción</Badge>;
      case 'comercializacion':
        return <Badge className="bg-purple-100 text-purple-700">Comercialización</Badge>;
      case 'entrega':
        return <Badge className="bg-orange-100 text-orange-700">En Entrega</Badge>;
      case 'completado':
        return <Badge className="bg-green-100 text-green-700">Completado</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  // Stats
  const stats = {
    total: proyectos.length,
    enConstruccion: proyectos.filter((p) => p.estado === 'construccion').length,
    totalUnidades: proyectos.reduce((acc, p) => acc + p.unidadesTotales, 0),
    inversionTotal: proyectos.reduce((acc, p) => acc + p.inversionTotal, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Proyectos
          </h1>
          <p className="text-muted-foreground">
            Gestión de proyectos de desarrollo inmobiliario
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Proyecto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Proyectos</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">En Construcción</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.enConstruccion}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Unidades</p>
            <p className="text-2xl font-bold">{stats.totalUnidades}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Inversión Total</p>
            <p className="text-2xl font-bold text-green-600">
              €{(stats.inversionTotal / 1000000).toFixed(0)}M
            </p>
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
                placeholder="Buscar por nombre o ubicación..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="planificacion">Planificación</SelectItem>
                <SelectItem value="construccion">En Construcción</SelectItem>
                <SelectItem value="comercializacion">Comercialización</SelectItem>
                <SelectItem value="entrega">En Entrega</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Proyectos Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredProyectos.map((proyecto) => {
          const porcentajeVendido = Math.round(
            (proyecto.unidadesVendidas / proyecto.unidadesTotales) * 100
          );
          const porcentajeReservado = Math.round(
            ((proyecto.unidadesVendidas + proyecto.unidadesReservadas) / proyecto.unidadesTotales) * 100
          );
          
          return (
            <Card key={proyecto.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{proyecto.nombre}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {proyecto.ubicacion}
                    </CardDescription>
                  </div>
                  {getEstadoBadge(proyecto.estado)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress de ventas */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ventas</span>
                    <span className="font-medium">
                      {proyecto.unidadesVendidas}/{proyecto.unidadesTotales} ({porcentajeVendido}%)
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={porcentajeReservado} className="h-3" />
                    <div
                      className="absolute top-0 left-0 h-3 bg-green-500 rounded-full"
                      style={{ width: `${porcentajeVendido}%` }}
                    />
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      Vendidas: {proyecto.unidadesVendidas}
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full" />
                      Reservadas: {proyecto.unidadesReservadas}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Precio medio</p>
                    <p className="font-medium">€{proyecto.precioMedio.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Entrega</p>
                    <p className="font-medium">{proyecto.fechaEntrega}</p>
                  </div>
                </div>

                {/* Avance de obra */}
                {proyecto.avanceObra > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avance de obra</span>
                      <span className="font-medium">{proyecto.avanceObra}%</span>
                    </div>
                    <Progress value={proyecto.avanceObra} className="h-2" />
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setSelectedProyecto(proyecto)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalle
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>{proyecto.nombre}</DialogTitle>
                        <DialogDescription>{proyecto.ubicacion}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="flex gap-2">
                          {getEstadoBadge(proyecto.estado)}
                          <Badge variant="outline" className="capitalize">
                            {proyecto.tipo}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Unidades Totales</p>
                            <p className="font-medium">{proyecto.unidadesTotales}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Vendidas</p>
                            <p className="font-medium text-green-600">
                              {proyecto.unidadesVendidas}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Reservadas</p>
                            <p className="font-medium text-blue-600">
                              {proyecto.unidadesReservadas}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Disponibles</p>
                            <p className="font-medium">
                              {proyecto.unidadesTotales -
                                proyecto.unidadesVendidas -
                                proyecto.unidadesReservadas}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Precio Medio</p>
                            <p className="font-medium">€{proyecto.precioMedio.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Inversión Total</p>
                            <p className="font-medium">
                              €{(proyecto.inversionTotal / 1000000).toFixed(1)}M
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fecha Inicio</p>
                            <p className="font-medium">{proyecto.fechaInicio}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fecha Entrega</p>
                            <p className="font-medium">{proyecto.fechaEntrega}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Avance de Obra</span>
                            <span className="font-medium">{proyecto.avanceObra}%</span>
                          </div>
                          <Progress value={proyecto.avanceObra} />
                        </div>
                        <div className="flex gap-2">
                          <Button className="flex-1" asChild>
                            <Link href="/real-estate-developer/sales">
                              <Euro className="h-4 w-4 mr-2" />
                              Ver Ventas
                            </Link>
                          </Button>
                          <Button variant="outline">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Analytics
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button className="flex-1" asChild>
                    <Link href="/real-estate-developer/sales">Ventas</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProyectos.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No se encontraron proyectos
          </CardContent>
        </Card>
      )}
    </div>
  );
}
