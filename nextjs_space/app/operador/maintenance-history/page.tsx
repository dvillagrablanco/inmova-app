'use client';

import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Search,
  Filter,
  Calendar,
  MapPin,
  AlertCircle,
  Wrench,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/components/ui/use-toast';

interface MaintenanceRequest {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  tipo: string;
  fechaSolicitud: string;
  fechaResolucion?: string;
  building?: {
    id: string;
    nombre: string;
    direccion: string;
  };
  unit?: {
    id: string;
    numero: string;
  };
}

export default function MaintenanceHistory() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [prioridadFilter, setPrioridadFilter] = useState('todos');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (session?.user && (session.user as any).role !== 'operador') {
      router.push('/unauthorized');
      return;
    }

    if (session) {
      loadHistory();
    }
  }, [session, status, router]);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, estadoFilter, prioridadFilter]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/operador/maintenance-history');

      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else {
        toast({
          title: 'Error',
          description: 'Error al cargar historial de mantenimiento',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar historial de mantenimiento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (req) =>
          req.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.building?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de estado
    if (estadoFilter !== 'todos') {
      filtered = filtered.filter((req) => req.estado === estadoFilter);
    }

    // Filtro de prioridad
    if (prioridadFilter !== 'todos') {
      filtered = filtered.filter((req) => req.prioridad === prioridadFilter);
    }

    setFilteredRequests(filtered);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'alta':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'media':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'baja':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-700">Pendiente</Badge>;
      case 'en_progreso':
        return <Badge className="bg-blue-100 text-blue-700">En Progreso</Badge>;
      case 'completada':
        return <Badge className="bg-green-100 text-green-700">Completada</Badge>;
      case 'cancelada':
        return <Badge className="bg-gray-100 text-gray-700">Cancelada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeIcon = (tipo: string) => {
    return <Wrench className="h-4 w-4 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Historial de Mantenimiento
        </h1>
        <p className="text-muted-foreground">
          {filteredRequests.length} de {requests.length} solicitudes
        </p>
      </div>

      {/* Búsqueda y filtros */}
      <Card className="p-4 mb-6">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, descripción o edificio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
          </Button>

          {showFilters && (
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label>Estado</Label>
                <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en_progreso">En Progreso</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Prioridad</Label>
                <Select
                  value={prioridadFilter}
                  onValueChange={setPrioridadFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="baja">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Lista de solicitudes */}
      {filteredRequests.length === 0 ? (
        <Card className="p-8 text-center">
          <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">
            No se encontraron solicitudes
          </p>
          <p className="text-muted-foreground">
            {searchTerm || estadoFilter !== 'todos' || prioridadFilter !== 'todos'
              ? 'Intenta ajustar tus filtros'
              : 'Aún no hay solicitudes de mantenimiento'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request) => (
            <Card
              key={request.id}
              className="p-4 hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getTypeIcon(request.tipo)}
                      <h3 className="font-semibold text-lg truncate">
                        {request.titulo}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {request.descripcion}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 items-end flex-shrink-0">
                    {getStatusBadge(request.estado)}
                    <Badge className={getPriorityColor(request.prioridad)}>
                      {request.prioridad}
                    </Badge>
                  </div>
                </div>

                {/* Ubicación */}
                {request.building && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">
                      {request.building.nombre}
                      {request.unit && ` - Unidad ${request.unit.numero}`}
                    </span>
                  </div>
                )}

                {/* Fechas */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Solicitada:{' '}
                      {format(
                        new Date(request.fechaSolicitud),
                        "d 'de' MMM 'de' yyyy",
                        { locale: es }
                      )}
                    </span>
                  </div>
                  {request.fechaResolucion && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-green-500" />
                      <span>
                        Resuelta:{' '}
                        {format(
                          new Date(request.fechaResolucion),
                          "d 'de' MMM",
                          { locale: es }
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Botón de ver detalle */}
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/mantenimiento/${request.id}`)}
                    className="w-full"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Ver Detalle
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
      </div>
        </main>
      </div>
    </div>
  );
}
