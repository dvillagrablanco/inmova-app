'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

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
import { ArrowLeft, Search, Filter, Calendar, MapPin, Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/components/ui/use-toast';

interface WorkOrder {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  fechaInicio: string;
  fechaCompletado?: string;
  timeSpent?: number;
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

export default function WorkOrderHistory() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
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
    filterOrders();
  }, [workOrders, searchTerm, estadoFilter]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/operador/work-orders/history');

      if (response.ok) {
        const data = await response.json();
        setWorkOrders(data);
      } else {
        toast({
          title: 'Error',
          description: 'Error al cargar historial',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar historial',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = workOrders;

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.building?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de estado
    if (estadoFilter !== 'todos') {
      filtered = filtered.filter((order) => order.estado === estadoFilter);
    }

    setFilteredOrders(filtered);
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
      case 'asignada':
        return <Badge className="bg-blue-100 text-blue-700">Asignada</Badge>;
      case 'en_progreso':
        return <Badge className="bg-yellow-100 text-yellow-700">En Progreso</Badge>;
      case 'completada':
        return <Badge className="bg-green-100 text-green-700">Completada</Badge>;
      case 'pausada':
        return <Badge className="bg-gray-100 text-gray-700">Pausada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
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
              <Button variant="ghost" onClick={() => router.back()} className="mb-4 -ml-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Historial de Trabajos</h1>
              <p className="text-muted-foreground">
                {filteredOrders.length} de {workOrders.length} trabajos
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
                  <div className="space-y-3">
                    <div>
                      <Label>Estado</Label>
                      <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          <SelectItem value="completada">Completada</SelectItem>
                          <SelectItem value="en_progreso">En Progreso</SelectItem>
                          <SelectItem value="pausada">Pausada</SelectItem>
                          <SelectItem value="asignada">Asignada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Lista de trabajos */}
            {filteredOrders.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">No se encontraron trabajos</p>
                <p className="text-muted-foreground">
                  {searchTerm || estadoFilter !== 'todos'
                    ? 'Intenta ajustar tus filtros'
                    : 'Aún no tienes trabajos en tu historial'}
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <Card
                    key={order.id}
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/operador/work-orders/${order.id}`)}
                  >
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">{order.titulo}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {order.descripcion}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          {getStatusBadge(order.estado)}
                          <Badge className={getPriorityColor(order.prioridad)}>
                            {order.prioridad}
                          </Badge>
                        </div>
                      </div>

                      {/* Ubicación */}
                      {order.building && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">
                            {order.building.nombre}
                            {order.unit && ` - Unidad ${order.unit.numero}`}
                          </span>
                        </div>
                      )}

                      {/* Fecha */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {format(new Date(order.fechaInicio), "d 'de' MMMM 'de' yyyy", {
                              locale: es,
                            })}
                          </span>
                        </div>
                        {order.timeSpent && order.timeSpent > 0 && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {Math.floor(order.timeSpent / 60)}h {order.timeSpent % 60}m
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
