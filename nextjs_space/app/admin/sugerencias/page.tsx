'use client';

import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Lightbulb,
  Bug,
  Plus,
  AlertTriangle,
  Filter,
  BarChart3,
  CheckCircle2,
  Clock,
  Eye,
  MessageSquare,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger, { logError } from '@/lib/logger';

type Suggestion = {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  prioridad: string;
  estado: string;
  createdAt: string;
  respuesta?: string;
  fechaRespuesta?: string;
  company: {
    id: string;
    nombre: string;
    logoUrl?: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

export default function SugerenciasAdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [respuesta, setRespuesta] = useState('');
  const [sending, setSending] = useState(false);

  // Filtros
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [prioridadFilter, setPrioridadFilter] = useState<string>('all');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all');

  useEffect(() => {
    if (status === 'authenticated') {
      const user = session?.user as any;
      if (user?.role !== 'super_admin' && user?.role !== 'soporte') {
        router.push('/dashboard');
        return;
      }
      fetchSuggestions();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, estadoFilter, prioridadFilter, categoriaFilter]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (estadoFilter !== 'all') params.append('estado', estadoFilter);
      if (prioridadFilter !== 'all') params.append('prioridad', prioridadFilter);
      if (categoriaFilter !== 'all') params.append('categoria', categoriaFilter);

      const response = await fetch(`/api/suggestions?${params.toString()}`);
      if (!response.ok) throw new Error('Error al cargar sugerencias');

      const data = await response.json();
      setSuggestions(data.suggestions);
    } catch (error: any) {
      logger.error('Error:', error);
      toast.error('Error al cargar sugerencias', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setRespuesta(suggestion.respuesta || '');
    setDialogOpen(true);
  };

  const handleUpdateSuggestion = async (estado?: string) => {
    if (!selectedSuggestion) return;

    setSending(true);
    try {
      const updateData: any = {};
      if (estado) updateData.estado = estado;
      if (respuesta.trim()) updateData.respuesta = respuesta;

      const response = await fetch(`/api/suggestions/${selectedSuggestion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) throw new Error('Error al actualizar sugerencia');

      toast.success('Sugerencia actualizada correctamente');
      setDialogOpen(false);
      fetchSuggestions();
    } catch (error: any) {
      logger.error('Error:', error);
      toast.error('Error al actualizar', {
        description: error.message,
      });
    } finally {
      setSending(false);
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    const colors: Record<string, string> = {
      baja: 'bg-gray-100 text-gray-800',
      media: 'bg-blue-100 text-blue-800',
      alta: 'bg-orange-100 text-orange-800',
      critica: 'bg-red-100 text-red-800',
    };
    return colors[prioridad] || colors.media;
  };

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      en_revision: 'bg-blue-100 text-blue-800',
      resuelta: 'bg-green-100 text-green-800',
      rechazada: 'bg-red-100 text-red-800',
    };
    return colors[estado] || colors.pendiente;
  };

  const getCategoriaIcon = (categoria: string) => {
    const icons: Record<string, any> = {
      mejora_producto: Lightbulb,
      reporte_bug: Bug,
      nueva_funcionalidad: Plus,
      otro: AlertTriangle,
    };
    const Icon = icons[categoria] || AlertTriangle;
    return <Icon className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando sugerencias...</p>
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
            <PageHeader
              title="💡 Gestión de Sugerencias"
              description="Administra y responde las sugerencias de los clientes"
            />

            {/* Filtros */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Estado</Label>
                    <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pendiente">Pendientes</SelectItem>
                        <SelectItem value="en_revision">En Revisión</SelectItem>
                        <SelectItem value="resuelta">Resueltas</SelectItem>
                        <SelectItem value="rechazada">Rechazadas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Prioridad</Label>
                    <Select value={prioridadFilter} onValueChange={setPrioridadFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="critica">Crítica</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="baja">Baja</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Categoría</Label>
                    <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="mejora_producto">Mejora Producto</SelectItem>
                        <SelectItem value="reporte_bug">Reporte Bug</SelectItem>
                        <SelectItem value="nueva_funcionalidad">Nueva Funcionalidad</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Sugerencias */}
            <div className="mt-6 space-y-4">
              {suggestions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Lightbulb className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">
                      No hay sugerencias con los filtros seleccionados
                    </p>
                  </CardContent>
                </Card>
              ) : (
                suggestions.map((suggestion) => (
                  <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getCategoriaIcon(suggestion.categoria)}
                            <h3 className="font-semibold text-lg">{suggestion.titulo}</h3>
                            <Badge className={getPrioridadColor(suggestion.prioridad)}>
                              {suggestion.prioridad}
                            </Badge>
                            <Badge className={getEstadoColor(suggestion.estado)}>
                              {suggestion.estado.replace('_', ' ')}
                            </Badge>
                          </div>

                          <p className="text-gray-600 line-clamp-2 mb-3">
                            {suggestion.descripcion}
                          </p>

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="font-medium">{suggestion.company.nombre}</span>
                            <span>•</span>
                            <span>{suggestion.user?.name}</span>
                            <span>•</span>
                            <span>
                              {format(new Date(suggestion.createdAt), 'dd MMM yyyy', {
                                locale: es,
                              })}
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(suggestion)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalles
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Dialog de Detalles */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {selectedSuggestion && getCategoriaIcon(selectedSuggestion.categoria)}
                    {selectedSuggestion?.titulo}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedSuggestion?.company.nombre} • {selectedSuggestion?.user?.name}
                  </DialogDescription>
                </DialogHeader>

                {selectedSuggestion && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Badge className={getPrioridadColor(selectedSuggestion.prioridad)}>
                        {selectedSuggestion.prioridad}
                      </Badge>
                      <Badge className={getEstadoColor(selectedSuggestion.estado)}>
                        {selectedSuggestion.estado.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline">
                        {selectedSuggestion.categoria.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div>
                      <Label>Descripción</Label>
                      <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                        {selectedSuggestion.descripcion}
                      </p>
                    </div>

                    <div>
                      <Label>Fecha de Envío</Label>
                      <p className="text-sm text-gray-700 mt-1">
                        {format(
                          new Date(selectedSuggestion.createdAt),
                          "dd 'de' MMMM 'de' yyyy 'a las' HH:mm",
                          { locale: es }
                        )}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="respuesta">Respuesta</Label>
                      <Textarea
                        id="respuesta"
                        placeholder="Escribe tu respuesta aquí..."
                        value={respuesta}
                        onChange={(e) => setRespuesta(e.target.value)}
                        rows={4}
                        className="mt-1"
                      />
                    </div>

                    {selectedSuggestion.respuesta && selectedSuggestion.fechaRespuesta && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <Label className="text-green-900">Respuesta Anterior</Label>
                        <p className="text-sm text-green-800 mt-1">
                          {selectedSuggestion.respuesta}
                        </p>
                        <p className="text-xs text-green-600 mt-2">
                          {format(
                            new Date(selectedSuggestion.fechaRespuesta),
                            "dd/MM/yyyy 'a las' HH:mm",
                            { locale: es }
                          )}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between gap-2 pt-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateSuggestion('pendiente')}
                          disabled={sending}
                        >
                          Pendiente
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateSuggestion('en_revision')}
                          disabled={sending}
                        >
                          En Revisión
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateSuggestion('rechazada')}
                          disabled={sending}
                        >
                          Rechazar
                        </Button>
                      </div>

                      <Button
                        onClick={() => handleUpdateSuggestion('resuelta')}
                        disabled={sending || !respuesta.trim()}
                      >
                        {sending ? (
                          'Guardando...'
                        ) : (
                          <>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Responder y Resolver
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}
