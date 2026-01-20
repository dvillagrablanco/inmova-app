'use client';

/**
 * Portal Inquilino - Solicitudes de Mantenimiento
 * 
 * Permite al inquilino crear y gestionar solicitudes de mantenimiento
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Wrench,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Search,
  MessageSquare,
  Camera,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface MaintenanceRequest {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  estado: string;
  prioridad: string;
  fechaSolicitud: string;
  fechaProgramada?: string;
  fechaResolucion?: string;
  comentariosResolucion?: string;
  tecnicoAsignado?: string;
}

const CATEGORIAS = [
  { id: 'fontaneria', nombre: 'Fontanería', icon: '🔧' },
  { id: 'electricidad', nombre: 'Electricidad', icon: '⚡' },
  { id: 'cerrajeria', nombre: 'Cerrajería', icon: '🔑' },
  { id: 'climatizacion', nombre: 'Climatización', icon: '❄️' },
  { id: 'electrodomesticos', nombre: 'Electrodomésticos', icon: '🔌' },
  { id: 'pintura', nombre: 'Pintura', icon: '🎨' },
  { id: 'carpinteria', nombre: 'Carpintería', icon: '🪚' },
  { id: 'limpieza', nombre: 'Limpieza', icon: '🧹' },
  { id: 'otro', nombre: 'Otro', icon: '📝' },
];

const PRIORIDADES = [
  { id: 'baja', nombre: 'Baja', color: 'bg-gray-500' },
  { id: 'media', nombre: 'Media', color: 'bg-yellow-500' },
  { id: 'alta', nombre: 'Alta', color: 'bg-orange-500' },
  { id: 'urgente', nombre: 'Urgente', color: 'bg-red-500' },
];

export default function PortalInquilinoMantenimientoPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    categoria: 'fontaneria',
    prioridad: 'media',
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/portal-inquilino/maintenance');
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Sesión expirada');
          return;
        }
        throw new Error('Error al cargar solicitudes');
      }

      const data = await response.json();
      setRequests(data);
    } catch (error) {
      toast.error('Error al cargar solicitudes');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo.trim() || !formData.descripcion.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/portal-inquilino/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear solicitud');
      }

      toast.success('Solicitud de mantenimiento creada');
      setIsDialogOpen(false);
      setFormData({
        titulo: '',
        descripcion: '',
        categoria: 'fontaneria',
        prioridad: 'media',
      });
      loadRequests();
    } catch (error: any) {
      toast.error(error.message || 'Error al crear solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch = 
      req.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || req.estado === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (estado: string) => {
    const statuses: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pendiente: { label: 'Pendiente', variant: 'outline' },
      asignada: { label: 'Asignada', variant: 'secondary' },
      en_progreso: { label: 'En Progreso', variant: 'default' },
      completada: { label: 'Completada', variant: 'default' },
      cancelada: { label: 'Cancelada', variant: 'destructive' },
    };
    const status = statuses[estado] || { label: estado, variant: 'outline' };
    return <Badge variant={status.variant}>{status.label}</Badge>;
  };

  const getPriorityBadge = (prioridad: string) => {
    const priority = PRIORIDADES.find(p => p.id === prioridad);
    return (
      <Badge variant="outline" className={`${priority?.color} text-white border-0`}>
        {priority?.nombre || prioridad}
      </Badge>
    );
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'pendiente': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'asignada': return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'en_progreso': return <Wrench className="h-5 w-5 text-orange-500" />;
      case 'completada': return <CheckCircle className="h-5 w-5 text-green-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const stats = {
    total: requests.length,
    pendientes: requests.filter(r => r.estado === 'pendiente').length,
    enProgreso: requests.filter(r => ['asignada', 'en_progreso'].includes(r.estado)).length,
    completadas: requests.filter(r => r.estado === 'completada').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Solicitudes de Mantenimiento</h1>
          <p className="text-muted-foreground">
            Reporta incidencias y solicita reparaciones
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Solicitud
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Wrench className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">{stats.pendientes}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Progreso</p>
                <p className="text-2xl font-bold">{stats.enProgreso}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completadas</p>
                <p className="text-2xl font-bold">{stats.completadas}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar solicitudes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="asignada">Asignada</SelectItem>
                <SelectItem value="en_progreso">En Progreso</SelectItem>
                <SelectItem value="completada">Completada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin Solicitudes</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              No tienes solicitudes de mantenimiento. Si tienes algún problema
              en tu vivienda, crea una nueva solicitud.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Solicitud
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {getStatusIcon(request.estado)}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{request.titulo}</h3>
                        {getStatusBadge(request.estado)}
                        {getPriorityBadge(request.prioridad)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {request.descripcion}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(parseISO(request.fechaSolicitud), "d MMM yyyy", { locale: es })}
                        </span>
                        <span>
                          {CATEGORIAS.find(c => c.id === request.categoria)?.icon}{' '}
                          {CATEGORIAS.find(c => c.id === request.categoria)?.nombre || request.categoria}
                        </span>
                        {request.tecnicoAsignado && (
                          <span>Técnico: {request.tecnicoAsignado}</span>
                        )}
                      </div>
                      {request.fechaProgramada && (
                        <p className="text-sm text-blue-600">
                          📅 Programada: {format(parseISO(request.fechaProgramada), "d MMM yyyy HH:mm", { locale: es })}
                        </p>
                      )}
                      {request.comentariosResolucion && (
                        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                          <p className="font-medium text-green-800 dark:text-green-200">Resolución:</p>
                          <p className="text-green-700 dark:text-green-300">{request.comentariosResolucion}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Request Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Solicitud de Mantenimiento</DialogTitle>
            <DialogDescription>
              Describe el problema que necesitas resolver
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ej: Fuga de agua en el baño"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoría</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.icon} {cat.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prioridad">Prioridad</Label>
                  <Select
                    value={formData.prioridad}
                    onValueChange={(value) => setFormData({ ...formData, prioridad: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORIDADES.map((pri) => (
                        <SelectItem key={pri.id} value={pri.id}>
                          {pri.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción *</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Describe el problema con el mayor detalle posible..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Adjuntar fotos (opcional)</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                  <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Arrastra fotos aquí o haz clic para seleccionar
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    (Funcionalidad próximamente)
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Enviando...' : 'Enviar Solicitud'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
