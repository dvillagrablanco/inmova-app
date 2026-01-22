'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Search,
  Filter,
  Wrench,
  Home,
  Calendar,
  User,
} from 'lucide-react';

interface Incidencia {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  estado: 'abierta' | 'en_progreso' | 'resuelta' | 'cerrada';
  propiedad: string;
  inquilino: string;
  fechaCreacion: string;
  fechaResolucion?: string;
}

export default function GestionIncidenciasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [filtro, setFiltro] = useState('all');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      fetchIncidencias();
    }
  }, [status, router]);

  const fetchIncidencias = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/maintenance');
      if (res.ok) {
        const data = await res.json();
        const formattedData = (Array.isArray(data) ? data : data.requests || []).map((item: any) => ({
          id: item.id,
          titulo: item.titulo || item.title || 'Sin título',
          descripcion: item.descripcion || item.description || '',
          tipo: item.tipo || item.type || 'general',
          prioridad: item.prioridad || item.priority || 'media',
          estado: item.estado || item.status || 'abierta',
          propiedad: item.propiedad?.nombre || item.unit?.building?.nombre || 'Sin asignar',
          inquilino: item.inquilino?.nombreCompleto || item.tenant?.nombreCompleto || 'Sin asignar',
          fechaCreacion: item.createdAt || item.fechaCreacion,
          fechaResolucion: item.fechaResolucion,
        }));
        setIncidencias(formattedData);
      }
    } catch (error) {
      console.error('Error al cargar incidencias:', error);
      toast.error('Error al cargar incidencias');
    } finally {
      setLoading(false);
    }
  };

  const incidenciasFiltradas = incidencias.filter(inc => {
    if (filtro !== 'all' && inc.estado !== filtro) return false;
    if (busqueda && !inc.titulo.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  const estadisticas = {
    total: incidencias.length,
    abiertas: incidencias.filter(i => i.estado === 'abierta').length,
    enProgreso: incidencias.filter(i => i.estado === 'en_progreso').length,
    resueltas: incidencias.filter(i => i.estado === 'resuelta' || i.estado === 'cerrada').length,
    urgentes: incidencias.filter(i => i.prioridad === 'urgente').length,
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'urgente': return 'bg-red-100 text-red-800';
      case 'alta': return 'bg-orange-100 text-orange-800';
      case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'baja': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'abierta': return 'bg-blue-100 text-blue-800';
      case 'en_progreso': return 'bg-yellow-100 text-yellow-800';
      case 'resuelta': return 'bg-green-100 text-green-800';
      case 'cerrada': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Incidencias</h1>
            <p className="text-muted-foreground">Control y seguimiento de incidencias y mantenimientos</p>
          </div>
          <Button onClick={() => router.push('/maintenance/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Incidencia
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-2xl font-bold">{estadisticas.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{estadisticas.abiertas}</p>
                  <p className="text-sm text-muted-foreground">Abiertas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{estadisticas.enProgreso}</p>
                  <p className="text-sm text-muted-foreground">En Progreso</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{estadisticas.resueltas}</p>
                  <p className="text-sm text-muted-foreground">Resueltas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{estadisticas.urgentes}</p>
                  <p className="text-sm text-muted-foreground">Urgentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar incidencias..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={filtro} onValueChange={setFiltro}>
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="abierta">Abiertas</TabsTrigger>
              <TabsTrigger value="en_progreso">En Progreso</TabsTrigger>
              <TabsTrigger value="resuelta">Resueltas</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tabla */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Incidencia</TableHead>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Inquilino</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidenciasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">No hay incidencias que mostrar</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  incidenciasFiltradas.map((incidencia) => (
                    <TableRow key={incidencia.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{incidencia.titulo}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {incidencia.descripcion}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Home className="h-4 w-4 text-gray-400" />
                          {incidencia.propiedad}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          {incidencia.inquilino}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPrioridadColor(incidencia.prioridad)}>
                          {incidencia.prioridad}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getEstadoColor(incidencia.estado)}>
                          {incidencia.estado.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {incidencia.fechaCreacion
                            ? new Date(incidencia.fechaCreacion).toLocaleDateString('es-ES')
                            : '-'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
