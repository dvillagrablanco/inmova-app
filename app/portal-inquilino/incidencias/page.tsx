'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Wrench,
  Zap,
  Droplets,
  Flame,
  Key,
  PaintBucket,
  Sparkles,
  Home,
  Star,
  Phone,
  MessageSquare,
  Brain,
  Loader2,
  Camera,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface Incidencia {
  id: string;
  tipo: string;
  descripcion: string;
  urgencia: string;
  estado: string;
  ubicacion: string;
  fechaCreacion: string;
  fechaResolucion?: string;
  proveedor?: { id: string; nombre: string };
  presupuesto?: number;
  fotos: string[];
}

interface ProviderMatch {
  providerId: string;
  providerName: string;
  specialty: string;
  matchScore: number;
  reasoning: string;
  estimatedCost: { min: number; max: number };
  estimatedTime: string;
  rating: number;
  reviews: number;
  available: boolean;
}

interface MatchingResult {
  incidenceType: string;
  requiredSpecialty: string;
  urgencyAnalysis: string;
  topMatches: ProviderMatch[];
  aiRecommendation: string;
}

// Constants
const TIPOS_INCIDENCIA = [
  { value: 'fontaneria', label: 'Fontanería', icon: Droplets, color: 'text-blue-500' },
  { value: 'electricidad', label: 'Electricidad', icon: Zap, color: 'text-yellow-500' },
  { value: 'climatizacion', label: 'Climatización', icon: Flame, color: 'text-orange-500' },
  { value: 'cerrajeria', label: 'Cerrajería', icon: Key, color: 'text-gray-500' },
  { value: 'pintura', label: 'Pintura', icon: PaintBucket, color: 'text-purple-500' },
  { value: 'limpieza', label: 'Limpieza', icon: Sparkles, color: 'text-cyan-500' },
  { value: 'otros', label: 'Otros', icon: Wrench, color: 'text-gray-400' },
];

const URGENCIAS = [
  { value: 'baja', label: 'Baja', color: 'bg-green-100 text-green-800' },
  { value: 'media', label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'alta', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgente', label: 'Urgente', color: 'bg-red-100 text-red-800' },
];

const ESTADOS = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  en_progreso: { label: 'En Progreso', color: 'bg-blue-100 text-blue-800', icon: Wrench },
  resuelto: { label: 'Resuelto', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelado: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800', icon: XCircle },
};

export default function IncidenciasPage() {
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('todas');

  // Form state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formStep, setFormStep] = useState<'form' | 'matching'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [matchingResult, setMatchingResult] = useState<MatchingResult | null>(null);

  const [newIncidencia, setNewIncidencia] = useState({
    tipo: '',
    descripcion: '',
    urgencia: 'media',
    ubicacion: '',
    autoClassify: true,
  });

  useEffect(() => {
    fetchIncidencias();
  }, []);

  const fetchIncidencias = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/portal-inquilino/incidencias');
      const data = await res.json();

      if (data.success) {
        setIncidencias(data.data);
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Error cargando incidencias');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newIncidencia.tipo || !newIncidencia.descripcion) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch('/api/portal-inquilino/incidencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIncidencia),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      // Si hay matching, mostrarlo
      if (data.data.matching) {
        setMatchingResult(data.data.matching);
        setFormStep('matching');
      } else {
        toast.success('¡Incidencia reportada con éxito!');
        handleClose();
        fetchIncidencias();
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al crear incidencia');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    setFormStep('form');
    setMatchingResult(null);
    setNewIncidencia({
      tipo: '',
      descripcion: '',
      urgencia: 'media',
      ubicacion: '',
      autoClassify: true,
    });
  };

  const handleSelectProvider = async (providerId: string) => {
    toast.success('Proveedor seleccionado. Te contactaremos pronto.');
    handleClose();
    fetchIncidencias();
  };

  // Filter incidencias
  const filteredIncidencias = incidencias.filter((inc) => {
    if (activeTab === 'todas') return true;
    if (activeTab === 'activas') return ['pendiente', 'en_progreso'].includes(inc.estado);
    if (activeTab === 'resueltas') return inc.estado === 'resuelto';
    return true;
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            Mis Incidencias
          </h1>
          <p className="text-muted-foreground mt-1">
            Reporta problemas y encuentra el mejor profesional con IA
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Nueva Incidencia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {formStep === 'form' ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Reportar Nueva Incidencia
                  </DialogTitle>
                  <DialogDescription>
                    Describe el problema y nuestra IA encontrará el mejor profesional
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Tipo de Incidencia */}
                  <div className="space-y-3">
                    <Label>Tipo de problema *</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {TIPOS_INCIDENCIA.map((tipo) => {
                        const Icon = tipo.icon;
                        return (
                          <button
                            key={tipo.value}
                            type="button"
                            onClick={() => setNewIncidencia({ ...newIncidencia, tipo: tipo.value })}
                            className={cn(
                              'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all',
                              newIncidencia.tipo === tipo.value
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-200 hover:border-gray-300'
                            )}
                          >
                            <Icon className={cn('h-6 w-6', tipo.color)} />
                            <span className="text-xs font-medium">{tipo.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Descripción */}
                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción detallada *</Label>
                    <Textarea
                      id="descripcion"
                      placeholder="Describe el problema con el mayor detalle posible..."
                      rows={4}
                      value={newIncidencia.descripcion}
                      onChange={(e) =>
                        setNewIncidencia({ ...newIncidencia, descripcion: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 Cuanto más detallado, mejor será la recomendación de profesionales
                    </p>
                  </div>

                  {/* Urgencia */}
                  <div className="space-y-2">
                    <Label>Nivel de urgencia</Label>
                    <Select
                      value={newIncidencia.urgencia}
                      onValueChange={(value) =>
                        setNewIncidencia({ ...newIncidencia, urgencia: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona urgencia" />
                      </SelectTrigger>
                      <SelectContent>
                        {URGENCIAS.map((urg) => (
                          <SelectItem key={urg.value} value={urg.value}>
                            <div className="flex items-center gap-2">
                              <Badge className={urg.color}>{urg.label}</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Ubicación */}
                  <div className="space-y-2">
                    <Label htmlFor="ubicacion">Ubicación exacta (opcional)</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="ubicacion"
                        placeholder="Ej: Baño principal, cocina..."
                        className="pl-10"
                        value={newIncidencia.ubicacion}
                        onChange={(e) =>
                          setNewIncidencia({ ...newIncidencia, ubicacion: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* AI Badge */}
                  <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
                    <Brain className="h-5 w-5 text-purple-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Matching con IA activado</p>
                      <p className="text-xs text-muted-foreground">
                        Encontraremos el mejor profesional para tu problema
                      </p>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analizando...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Buscar Profesionales
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-500" />
                    Profesionales Recomendados por IA
                  </DialogTitle>
                  <DialogDescription>{matchingResult?.aiRecommendation}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Urgency Analysis */}
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <p className="text-sm">{matchingResult?.urgencyAnalysis}</p>
                  </div>

                  {/* Provider Matches */}
                  <div className="space-y-3">
                    {matchingResult?.topMatches.map((provider, index) => (
                      <div
                        key={provider.providerId}
                        className={cn(
                          'p-4 rounded-lg border-2 transition-all hover:shadow-md',
                          index === 0
                            ? 'border-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50'
                            : 'border-gray-200'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {index === 0 && (
                                <Badge className="bg-purple-500">⭐ Mejor Match</Badge>
                              )}
                              <h4 className="font-semibold">{provider.providerName}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {provider.specialty}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {provider.reasoning}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-medium">{provider.rating.toFixed(1)}</span>
                              <span className="text-xs text-muted-foreground">
                                ({provider.reviews})
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Match: {provider.matchScore}%
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-3 border-t">
                          <div className="flex gap-4 text-sm">
                            <span className="text-muted-foreground">
                              💰 €{provider.estimatedCost.min}-{provider.estimatedCost.max}
                            </span>
                            <span className="text-muted-foreground">
                              ⏱️ {provider.estimatedTime}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleSelectProvider(provider.providerId)}
                          >
                            Seleccionar
                          </Button>
                        </div>
                      </div>
                    ))}

                    {(!matchingResult?.topMatches || matchingResult.topMatches.length === 0) && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Wrench className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No encontramos proveedores para este tipo de servicio.</p>
                        <p className="text-sm mt-1">
                          Puedes continuar y te asignaremos uno manualmente.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setFormStep('form')}>
                    Volver
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      toast.success('Incidencia creada. Te asignaremos un profesional pronto.');
                      handleClose();
                      fetchIncidencias();
                    }}
                  >
                    Continuar sin seleccionar
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{incidencias.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 text-yellow-600 p-2 rounded-lg">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {incidencias.filter((i) => i.estado === 'pendiente').length}
                </p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {incidencias.filter((i) => i.estado === 'en_progreso').length}
                </p>
                <p className="text-xs text-muted-foreground">En Progreso</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 text-green-600 p-2 rounded-lg">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {incidencias.filter((i) => i.estado === 'resuelto').length}
                </p>
                <p className="text-xs text-muted-foreground">Resueltas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & List */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="activas">Activas</TabsTrigger>
              <TabsTrigger value="resueltas">Resueltas</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {filteredIncidencias.length === 0 ? (
            <div className="text-center py-12">
              <Home className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium">No hay incidencias</h3>
              <p className="text-muted-foreground mt-1">¡Genial! No tienes problemas pendientes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIncidencias.map((incidencia) => {
                const tipoInfo = TIPOS_INCIDENCIA.find((t) => t.value === incidencia.tipo);
                const Icon = tipoInfo?.icon || Wrench;
                const estadoInfo =
                  ESTADOS[incidencia.estado as keyof typeof ESTADOS] || ESTADOS.pendiente;
                const EstadoIcon = estadoInfo.icon;
                const urgenciaInfo = URGENCIAS.find((u) => u.value === incidencia.urgencia);

                return (
                  <div
                    key={incidencia.id}
                    className="flex items-start gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={cn(
                        'p-3 rounded-lg',
                        tipoInfo?.color || 'text-gray-500',
                        'bg-gray-100'
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium capitalize">
                          {tipoInfo?.label || incidencia.tipo}
                        </h4>
                        <Badge className={estadoInfo.color}>
                          <EstadoIcon className="h-3 w-3 mr-1" />
                          {estadoInfo.label}
                        </Badge>
                        {urgenciaInfo && (
                          <Badge variant="outline" className={urgenciaInfo.color}>
                            {urgenciaInfo.label}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {incidencia.descripcion}
                      </p>

                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {incidencia.ubicacion}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(incidencia.fechaCreacion).toLocaleDateString('es-ES')}
                        </span>
                        {incidencia.proveedor && (
                          <span className="flex items-center gap-1">
                            <Wrench className="h-3 w-3" />
                            {incidencia.proveedor.nombre}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {incidencia.estado === 'resuelto' && (
                        <Button variant="outline" size="sm">
                          <Star className="h-4 w-4 mr-1" />
                          Valorar
                        </Button>
                      )}
                      {incidencia.proveedor && (
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
