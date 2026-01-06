'use client';

/**
 * PÁGINA: LISTA DE CONTRATOS DE MEDIA ESTANCIA
 * 
 * Visualización de todos los contratos de temporada (1-11 meses)
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import {
  Plus,
  Search,
  Calendar,
  Home,
  User,
  Euro,
  Clock,
  Filter,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Contrato {
  id: string;
  unit: {
    direccion: string;
    building: { city: string };
  };
  tenant: {
    nombre: string;
    email: string;
  };
  fechaInicio: string;
  fechaFin: string;
  rentaMensual: number;
  estado: string;
  motivoTemporalidad: string;
  duracionMesesPrevista: number;
}

interface Estadisticas {
  totalContratos: number;
  contratosActivos: number;
  duracionPromedio: number;
  ingresosMensualesEstimados: number;
  motivosMasComunes: Record<string, number>;
}

export default function ContratosMediaEstanciaPage() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroMotivo, setFiltroMotivo] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    fetchContratos();
  }, [filtroEstado, filtroMotivo]);

  const fetchContratos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroEstado !== 'todos') params.append('estado', filtroEstado);
      if (filtroMotivo !== 'todos') params.append('motivo', filtroMotivo);

      const response = await fetch(`/api/contracts/medium-term?${params}`);
      if (response.ok) {
        const data = await response.json();
        setContratos(data.data);
        setEstadisticas(data.estadisticas);
      }
    } catch (error) {
      console.error('Error fetching contratos:', error);
    } finally {
      setLoading(false);
    }
  };

  const contratosFiltrados = contratos.filter(contrato => {
    if (!busqueda) return true;
    const searchLower = busqueda.toLowerCase();
    return (
      contrato.unit.direccion.toLowerCase().includes(searchLower) ||
      contrato.tenant.nombre.toLowerCase().includes(searchLower) ||
      contrato.tenant.email.toLowerCase().includes(searchLower)
    );
  });

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'activo':
        return <Badge className="bg-green-500">Activo</Badge>;
      case 'vencido':
        return <Badge variant="secondary">Vencido</Badge>;
      case 'cancelado':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const getMotivoBadge = (motivo: string) => {
    const colores: Record<string, string> = {
      trabajo: 'bg-blue-100 text-blue-800',
      estudios: 'bg-purple-100 text-purple-800',
      tratamiento_medico: 'bg-red-100 text-red-800',
      proyecto_profesional: 'bg-orange-100 text-orange-800',
      transicion: 'bg-gray-100 text-gray-800',
      turismo_extendido: 'bg-green-100 text-green-800',
    };
    
    const etiquetas: Record<string, string> = {
      trabajo: 'Trabajo',
      estudios: 'Estudios',
      tratamiento_medico: 'Médico',
      proyecto_profesional: 'Proyecto',
      transicion: 'Transición',
      turismo_extendido: 'Turismo',
    };

    return (
      <Badge variant="outline" className={colores[motivo] || ''}>
        {etiquetas[motivo] || motivo}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Contratos de Media Estancia</h1>
          <p className="text-muted-foreground">
            Gestión de alquileres temporales (1-11 meses) - LAU Art. 3.2
          </p>
        </div>
        <Button asChild>
          <Link href="/contratos/media-estancia/nuevo">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Contrato
          </Link>
        </Button>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Contratos</CardDescription>
              <CardTitle className="text-3xl">{estadisticas.totalContratos}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Contratos Activos</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {estadisticas.contratosActivos}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Duración Promedio</CardDescription>
              <CardTitle className="text-3xl">
                {estadisticas.duracionPromedio} <span className="text-lg">meses</span>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Ingresos Mensuales</CardDescription>
              <CardTitle className="text-3xl text-blue-600">
                {estadisticas.ingresosMensualesEstimados.toLocaleString()}€
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por dirección, inquilino..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="activo">Activos</SelectItem>
                <SelectItem value="vencido">Vencidos</SelectItem>
                <SelectItem value="cancelado">Cancelados</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroMotivo} onValueChange={setFiltroMotivo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Motivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los motivos</SelectItem>
                <SelectItem value="trabajo">Trabajo</SelectItem>
                <SelectItem value="estudios">Estudios</SelectItem>
                <SelectItem value="tratamiento_medico">Médico</SelectItem>
                <SelectItem value="proyecto_profesional">Proyecto</SelectItem>
                <SelectItem value="transicion">Transición</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de contratos */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : contratosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay contratos de media estancia</p>
              <Button asChild className="mt-4">
                <Link href="/contratos/media-estancia/nuevo">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear primer contrato
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Inquilino</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Renta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contratosFiltrados.map((contrato) => (
                  <TableRow key={contrato.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{contrato.unit.direccion}</p>
                          <p className="text-sm text-muted-foreground">
                            {contrato.unit.building.city}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{contrato.tenant.nombre}</p>
                          <p className="text-sm text-muted-foreground">
                            {contrato.tenant.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{format(new Date(contrato.fechaInicio), "d MMM yy", { locale: es })}</p>
                        <p className="text-muted-foreground">
                          {format(new Date(contrato.fechaFin), "d MMM yy", { locale: es })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {contrato.duracionMesesPrevista} meses
                      </div>
                    </TableCell>
                    <TableCell>
                      {contrato.motivoTemporalidad && getMotivoBadge(contrato.motivoTemporalidad)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-medium">
                        {contrato.rentaMensual.toLocaleString()}€
                        <span className="text-muted-foreground text-sm">/mes</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getEstadoBadge(contrato.estado)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/contratos/${contrato.id}`}>
                          Ver
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
