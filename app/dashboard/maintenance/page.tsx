'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Wrench, 
  Plus, 
  Search, 
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  Clock,
  Home,
  User,
  Calendar,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface MaintenanceRequest {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  categoria?: string;
  unitId?: string;
  unit?: {
    id: string;
    numero: string;
    building?: {
      nombre: string;
    };
  };
  reportadoPor?: string;
  asignadoA?: string;
  fechaReporte: string;
  fechaResolucion?: string;
  costoEstimado?: number;
  costoReal?: number;
  createdAt: string;
}

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [filterPrioridad, setFilterPrioridad] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newRequest, setNewRequest] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'media',
    categoria: 'general',
  });

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/maintenance');
      if (response.ok) {
        const data = await response.json();
        setRequests(Array.isArray(data) ? data : data.data || []);
      }
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
      toast.error('Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRequest,
          estado: 'pendiente',
          fechaReporte: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast.success('Solicitud creada correctamente');
        setIsDialogOpen(false);
        setNewRequest({ titulo: '', descripcion: '', prioridad: 'media', categoria: 'general' });
        fetchRequests();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear solicitud');
      }
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error('Error al crear solicitud');
    } finally {
      setSaving(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.unit?.building?.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEstado = filterEstado === 'all' || req.estado === filterEstado;
    const matchesPrioridad = filterPrioridad === 'all' || req.prioridad === filterPrioridad;
    
    return matchesSearch && matchesEstado && matchesPrioridad;
  });

  const pendingCount = requests.filter(r => r.estado === 'pendiente').length;
  const inProgressCount = requests.filter(r => r.estado === 'en_progreso').length;
  const completedCount = requests.filter(r => r.estado === 'completado').length;
  const urgentCount = requests.filter(r => r.prioridad === 'urgente' && r.estado !== 'completado').length;

  const handleViewRequest = (req: MaintenanceRequest) => {
    toast.info(`Detalle de la solicitud: ${req.titulo}`);
  };

  const handleEditRequest = (req: MaintenanceRequest) => {
    toast.info(`Editar solicitud: ${req.titulo}`);
  };

  const handleAssignTechnician = (req: MaintenanceRequest) => {
    toast.success(`Técnico asignado a: ${req.titulo}`);
  };

  const handleCompleteRequest = (reqId: string) => {
    setRequests((prev) =>
      prev.map((request) =>
        request.id === reqId ? { ...request, estado: 'completado' } : request
      )
    );
    toast.success('Solicitud marcada como completada');
  };

  const estadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'en_progreso': return 'bg-blue-100 text-blue-800';
      case 'completado': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const prioridadBadge = (prioridad: string) => {
    switch (prioridad) {
      case 'urgente': return 'bg-red-100 text-red-800';
      case 'alta': return 'bg-orange-100 text-orange-800';
      case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'baja': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mantenimiento</h1>
          <p className="text-gray-600 mt-1">Gestiona las solicitudes de mantenimiento</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={fetchRequests}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Solicitud
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Solicitud de Mantenimiento</DialogTitle>
                <DialogDescription>Reporta un problema o solicita mantenimiento</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateRequest}>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="titulo">Título</Label>
                    <Input
                      id="titulo"
                      value={newRequest.titulo}
                      onChange={(e) => setNewRequest({ ...newRequest, titulo: e.target.value })}
                      placeholder="Ej: Fuga de agua en baño"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={newRequest.descripcion}
                      onChange={(e) => setNewRequest({ ...newRequest, descripcion: e.target.value })}
                      placeholder="Describe el problema en detalle..."
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="prioridad">Prioridad</Label>
                      <Select
                        value={newRequest.prioridad}
                        onValueChange={(v) => setNewRequest({ ...newRequest, prioridad: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baja">Baja</SelectItem>
                          <SelectItem value="media">Media</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="urgente">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="categoria">Categoría</Label>
                      <Select
                        value={newRequest.categoria}
                        onValueChange={(v) => setNewRequest({ ...newRequest, categoria: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="fontaneria">Fontanería</SelectItem>
                          <SelectItem value="electricidad">Electricidad</SelectItem>
                          <SelectItem value="climatizacion">Climatización</SelectItem>
                          <SelectItem value="cerrajeria">Cerrajería</SelectItem>
                          <SelectItem value="limpieza">Limpieza</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Creando...' : 'Crear Solicitud'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">En Progreso</p>
                <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
              </div>
              <Wrench className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completados</p>
                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Urgentes</p>
                <p className="text-2xl font-bold text-red-600">{urgentCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar solicitudes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en_progreso">En Progreso</SelectItem>
            <SelectItem value="completado">Completado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPrioridad} onValueChange={setFilterPrioridad}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="urgente">Urgente</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="media">Media</SelectItem>
            <SelectItem value="baja">Baja</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay solicitudes</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterEstado !== 'all' || filterPrioridad !== 'all'
                ? 'No se encontraron solicitudes con ese criterio'
                : 'No hay solicitudes de mantenimiento pendientes'}
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Solicitud
            </Button>
          </div>
        ) : (
          filteredRequests.map((req) => (
            <Card key={req.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{req.titulo}</h3>
                      <Badge className={estadoBadge(req.estado)}>{req.estado}</Badge>
                      <Badge className={prioridadBadge(req.prioridad)}>{req.prioridad}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{req.descripcion}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {req.unit && (
                        <span className="flex items-center">
                          <Home className="h-3 w-3 mr-1" />
                          {req.unit.building?.nombre} - {req.unit.numero}
                        </span>
                      )}
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(req.fechaReporte || req.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => undefined}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewRequest(req)}>
                        Ver detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditRequest(req)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAssignTechnician(req)}>
                        Asignar técnico
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCompleteRequest(req.id)}>
                        Marcar como completado
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
