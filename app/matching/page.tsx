'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Search,
  Home,
  ArrowLeft,
  Building2,
  Euro,
  MapPin,
  Sparkles,
  Target,
  ThumbsUp,
  ThumbsDown,
  Eye,
  MessageSquare,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  User,
  Bed,
  Bath,
  Maximize2,
  Car,
  Train,
  PawPrint,
  Sofa,
  ChevronRight,
  Zap,
  Brain,
  BarChart3,
  Star,
  Phone,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// TIPOS
// ============================================================================

interface Tenant {
  id: string;
  nombreCompleto: string;
  email: string;
  telefono?: string;
  presupuestoMin?: number;
  presupuestoMax?: number;
  ciudadesPreferidas?: string[];
  habitacionesMin?: number;
  scoring?: number;
}

interface PropertyMatch {
  unitId: string;
  matchScore: number;
  scores: {
    location: number;
    price: number;
    features: number;
    size: number;
    availability: number;
  };
  recommendation?: string;
  pros: string[];
  cons: string[];
  unit?: {
    id: string;
    numero: string;
    superficie: number;
    habitaciones: number;
    banos: number;
    rentaMensual: number;
    amueblado: boolean;
    imagenes?: string[];
    building?: {
      id: string;
      nombre: string;
      direccion: string;
      ciudad?: string;
    };
  };
}

interface MatchResult {
  tenantId: string;
  tenantName: string;
  matches: PropertyMatch[];
  totalMatches: number;
  avgScore: number;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function MatchingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Estados
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [savedMatches, setSavedMatches] = useState<PropertyMatch[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<PropertyMatch | null>(null);
  const [useAI, setUseAI] = useState(true);

  // Cargar datos iniciales
  useEffect(() => {
    if (status === 'authenticated') {
      loadTenants();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Cargar inquilinos
  const loadTenants = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tenants?limit=100');
      if (response.ok) {
        const result = await response.json();
        const tenantsData = result.data || result || [];
        setTenants(Array.isArray(tenantsData) ? tenantsData : []);
      }
    } catch (error) {
      console.error('Error loading tenants:', error);
      toast.error('Error al cargar inquilinos');
    } finally {
      setLoading(false);
    }
  };

  // Cargar matches guardados de un inquilino
  const loadSavedMatches = async (tenantId: string) => {
    try {
      const response = await fetch(`/api/matching?tenantId=${tenantId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setSavedMatches(result.data);
        }
      }
    } catch (error) {
      console.error('Error loading saved matches:', error);
    }
  };

  // Buscar matches para un inquilino
  const searchMatches = async () => {
    if (!selectedTenant) {
      toast.error('Selecciona un inquilino primero');
      return;
    }

    try {
      setSearching(true);
      setMatchResult(null);

      const response = await fetch('/api/matching/find', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: selectedTenant.id,
          limit: 10,
          useAI,
          saveResults: true,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al buscar matches');
      }

      if (result.success && result.data) {
        // Enriquecer matches con datos de unidades
        const enrichedMatches = await enrichMatchesWithUnitData(result.data.matches);
        
        setMatchResult({
          ...result.data,
          matches: enrichedMatches,
        });

        toast.success(`${result.data.totalMatches} propiedades encontradas`);
      } else {
        setMatchResult({
          tenantId: selectedTenant.id,
          tenantName: selectedTenant.nombreCompleto,
          matches: [],
          totalMatches: 0,
          avgScore: 0,
        });
        toast.info('No se encontraron propiedades compatibles');
      }
    } catch (error: any) {
      console.error('Error searching matches:', error);
      toast.error(error.message || 'Error al buscar matches');
    } finally {
      setSearching(false);
    }
  };

  // Enriquecer matches con datos de unidades
  const enrichMatchesWithUnitData = async (matches: any[]): Promise<PropertyMatch[]> => {
    try {
      const unitIds = matches.map(m => m.unitId);
      if (unitIds.length === 0) return [];

      // Obtener datos de unidades
      const response = await fetch('/api/units/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: unitIds }),
      });

      let unitsMap: Record<string, any> = {};
      
      if (response.ok) {
        const result = await response.json();
        const units = result.data || result || [];
        unitsMap = units.reduce((acc: any, unit: any) => {
          acc[unit.id] = unit;
          return acc;
        }, {});
      }

      return matches.map(match => ({
        ...match,
        unit: unitsMap[match.unitId] || null,
      }));
    } catch (error) {
      console.error('Error enriching matches:', error);
      return matches;
    }
  };

  // Seleccionar inquilino
  const handleSelectTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setMatchResult(null);
    loadSavedMatches(tenant.id);
  };

  // Ver detalle de match
  const handleViewMatch = (match: PropertyMatch) => {
    setSelectedMatch(match);
    setShowDetailDialog(true);
  };

  // Actualizar estado de match
  const handleUpdateMatchStatus = async (matchId: string, status: string) => {
    try {
      // TODO: Implementar actualización de estado en API
      toast.success(`Estado actualizado a: ${status}`);
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  // Filtrar inquilinos
  const filteredTenants = tenants.filter(t =>
    t.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obtener color de score
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };

  // Loading state
  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[600px]" />
            <div className="lg:col-span-2">
              <Skeleton className="h-[600px]" />
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Matching Inquilino-Propiedad</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Target className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Matching Inteligente</h1>
              <p className="text-muted-foreground">
                Encuentra las mejores propiedades para cada inquilino con IA
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={useAI ? 'default' : 'outline'} className="gap-1">
              <Brain className="h-3 w-3" />
              {useAI ? 'IA Activada' : 'IA Desactivada'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUseAI(!useAI)}
            >
              {useAI ? 'Desactivar IA' : 'Activar IA'}
            </Button>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel Izquierdo - Lista de Inquilinos */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Seleccionar Inquilino
              </CardTitle>
              <CardDescription>
                Elige un inquilino para buscar propiedades compatibles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Buscador */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar inquilino..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Lista de Inquilinos */}
              <ScrollArea className="h-[450px] pr-4">
                <div className="space-y-2">
                  {filteredTenants.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No se encontraron inquilinos</p>
                    </div>
                  ) : (
                    filteredTenants.map((tenant) => (
                      <div
                        key={tenant.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                          selectedTenant?.id === tenant.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'hover:border-gray-300'
                        }`}
                        onClick={() => handleSelectTenant(tenant)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <span className="text-purple-700 font-semibold">
                                {tenant.nombreCompleto?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{tenant.nombreCompleto}</p>
                              <p className="text-xs text-muted-foreground">{tenant.email}</p>
                            </div>
                          </div>
                          {selectedTenant?.id === tenant.id && (
                            <CheckCircle className="h-5 w-5 text-purple-600" />
                          )}
                        </div>
                        {(tenant.presupuestoMin || tenant.presupuestoMax) && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <Euro className="h-3 w-3" />
                            <span>
                              {tenant.presupuestoMin || 0}€ - {tenant.presupuestoMax || '∞'}€
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Panel Derecho - Resultados */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info del Inquilino Seleccionado */}
            {selectedTenant && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
                        <User className="h-8 w-8 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{selectedTenant.nombreCompleto}</h3>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {selectedTenant.email}
                          </span>
                          {selectedTenant.telefono && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {selectedTenant.telefono}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedTenant.presupuestoMax && (
                            <Badge variant="outline">
                              <Euro className="h-3 w-3 mr-1" />
                              Hasta {selectedTenant.presupuestoMax}€/mes
                            </Badge>
                          )}
                          {selectedTenant.habitacionesMin && (
                            <Badge variant="outline">
                              <Bed className="h-3 w-3 mr-1" />
                              Mín. {selectedTenant.habitacionesMin} hab
                            </Badge>
                          )}
                          {selectedTenant.ciudadesPreferidas?.length > 0 && (
                            <Badge variant="outline">
                              <MapPin className="h-3 w-3 mr-1" />
                              {selectedTenant.ciudadesPreferidas.join(', ')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={searchMatches}
                      disabled={searching}
                      className="gap-2"
                    >
                      {searching ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Buscando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Buscar Matches
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Estado Inicial */}
            {!selectedTenant && (
              <Card>
                <CardContent className="py-16 text-center">
                  <Target className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">Selecciona un Inquilino</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Elige un inquilino de la lista para encontrar las propiedades más compatibles
                    usando nuestro algoritmo de matching inteligente.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Resultados de Matching */}
            {matchResult && (
              <div className="space-y-4">
                {/* Resumen */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-2xl font-bold">{matchResult.totalMatches}</p>
                          <p className="text-xs text-muted-foreground">Propiedades</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        <div>
                          <p className="text-2xl font-bold">{matchResult.avgScore}%</p>
                          <p className="text-xs text-muted-foreground">Score Promedio</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-2">
                        <ThumbsUp className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-2xl font-bold">
                            {matchResult.matches.filter(m => m.matchScore >= 70).length}
                          </p>
                          <p className="text-xs text-muted-foreground">Muy Compatibles</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="text-2xl font-bold">
                            {matchResult.matches.filter(m => m.recommendation).length}
                          </p>
                          <p className="text-xs text-muted-foreground">Con Análisis IA</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Lista de Matches */}
                <Card>
                  <CardHeader>
                    <CardTitle>Propiedades Compatibles</CardTitle>
                    <CardDescription>
                      Ordenadas por compatibilidad de mayor a menor
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {matchResult.matches.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <XCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No se encontraron propiedades compatibles</p>
                        <p className="text-sm">
                          Intenta ajustar los criterios de búsqueda o añadir más propiedades
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {matchResult.matches.map((match, index) => (
                          <div
                            key={match.unitId}
                            className="border rounded-lg p-4 hover:shadow-md transition-all"
                          >
                            <div className="flex flex-col md:flex-row gap-4">
                              {/* Score Badge */}
                              <div className="flex flex-col items-center justify-center">
                                <div className={`w-20 h-20 rounded-full ${getScoreBgColor(match.matchScore)} flex flex-col items-center justify-center`}>
                                  <span className={`text-2xl font-bold ${getScoreColor(match.matchScore)}`}>
                                    {match.matchScore}
                                  </span>
                                  <span className="text-xs text-muted-foreground">score</span>
                                </div>
                                <Badge variant="outline" className="mt-2">
                                  #{index + 1}
                                </Badge>
                              </div>

                              {/* Propiedad Info */}
                              <div className="flex-1 space-y-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-semibold text-lg">
                                      {match.unit?.building?.nombre || 'Propiedad'} - {match.unit?.numero || 'Unidad'}
                                    </h4>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {match.unit?.building?.direccion || 'Dirección no disponible'}
                                    </p>
                                  </div>
                                  <p className="text-xl font-bold text-green-600">
                                    {match.unit?.rentaMensual?.toLocaleString('es-ES') || '—'}€/mes
                                  </p>
                                </div>

                                {/* Características */}
                                <div className="flex flex-wrap gap-2">
                                  {match.unit?.habitaciones && (
                                    <Badge variant="secondary">
                                      <Bed className="h-3 w-3 mr-1" />
                                      {match.unit.habitaciones} hab
                                    </Badge>
                                  )}
                                  {match.unit?.banos && (
                                    <Badge variant="secondary">
                                      <Bath className="h-3 w-3 mr-1" />
                                      {match.unit.banos} baños
                                    </Badge>
                                  )}
                                  {match.unit?.superficie && (
                                    <Badge variant="secondary">
                                      <Maximize2 className="h-3 w-3 mr-1" />
                                      {match.unit.superficie}m²
                                    </Badge>
                                  )}
                                  {match.unit?.amueblado && (
                                    <Badge variant="secondary">
                                      <Sofa className="h-3 w-3 mr-1" />
                                      Amueblado
                                    </Badge>
                                  )}
                                </div>

                                {/* Scores Detallados */}
                                <div className="grid grid-cols-5 gap-2 text-xs">
                                  <div className="text-center">
                                    <Progress value={match.scores.price} className="h-1" />
                                    <p className="mt-1 text-muted-foreground">Precio</p>
                                  </div>
                                  <div className="text-center">
                                    <Progress value={match.scores.location} className="h-1" />
                                    <p className="mt-1 text-muted-foreground">Ubicación</p>
                                  </div>
                                  <div className="text-center">
                                    <Progress value={match.scores.features} className="h-1" />
                                    <p className="mt-1 text-muted-foreground">Características</p>
                                  </div>
                                  <div className="text-center">
                                    <Progress value={match.scores.size} className="h-1" />
                                    <p className="mt-1 text-muted-foreground">Tamaño</p>
                                  </div>
                                  <div className="text-center">
                                    <Progress value={match.scores.availability} className="h-1" />
                                    <p className="mt-1 text-muted-foreground">Disponibilidad</p>
                                  </div>
                                </div>

                                {/* Pros y Cons */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {match.pros.length > 0 && (
                                    <div className="space-y-1">
                                      {match.pros.slice(0, 2).map((pro, i) => (
                                        <p key={i} className="text-xs text-green-600 flex items-start gap-1">
                                          <ThumbsUp className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                          {pro}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                  {match.cons.length > 0 && (
                                    <div className="space-y-1">
                                      {match.cons.slice(0, 2).map((con, i) => (
                                        <p key={i} className="text-xs text-red-600 flex items-start gap-1">
                                          <ThumbsDown className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                          {con}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Recomendación IA */}
                                {match.recommendation && (
                                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                                    <p className="text-xs font-medium text-purple-700 flex items-center gap-1 mb-1">
                                      <Brain className="h-3 w-3" />
                                      Análisis IA
                                    </p>
                                    <p className="text-sm text-purple-900">{match.recommendation}</p>
                                  </div>
                                )}

                                {/* Acciones */}
                                <div className="flex gap-2 pt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewMatch(match)}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Ver Detalle
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`/propiedades/${match.unitId}`)}
                                  >
                                    <Building2 className="h-4 w-4 mr-1" />
                                    Ver Propiedad
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      toast.success('Contacto registrado');
                                      handleUpdateMatchStatus(match.unitId, 'CONTACTED');
                                    }}
                                  >
                                    <MessageSquare className="h-4 w-4 mr-1" />
                                    Contactar
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Searching State */}
            {searching && (
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="animate-pulse space-y-4">
                    <RefreshCw className="h-16 w-16 mx-auto text-purple-600 animate-spin" />
                    <div>
                      <h3 className="text-xl font-semibold">Analizando compatibilidad...</h3>
                      <p className="text-muted-foreground">
                        {useAI
                          ? 'Usando IA para encontrar las mejores opciones'
                          : 'Calculando scores de compatibilidad'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Dialog Detalle de Match */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de Compatibilidad</DialogTitle>
            <DialogDescription>
              Análisis completo del match entre inquilino y propiedad
            </DialogDescription>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-4">
              {/* Score Principal */}
              <div className="text-center p-6 bg-muted rounded-lg">
                <p className={`text-5xl font-bold ${getScoreColor(selectedMatch.matchScore)}`}>
                  {selectedMatch.matchScore}%
                </p>
                <p className="text-muted-foreground">Compatibilidad Total</p>
              </div>

              {/* Desglose de Scores */}
              <div className="space-y-3">
                <h4 className="font-semibold">Desglose de Puntuación</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Euro className="h-4 w-4" /> Precio
                    </span>
                    <div className="flex items-center gap-2">
                      <Progress value={selectedMatch.scores.price} className="w-32 h-2" />
                      <span className="text-sm font-medium w-8">{selectedMatch.scores.price}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> Ubicación
                    </span>
                    <div className="flex items-center gap-2">
                      <Progress value={selectedMatch.scores.location} className="w-32 h-2" />
                      <span className="text-sm font-medium w-8">{selectedMatch.scores.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Sofa className="h-4 w-4" /> Características
                    </span>
                    <div className="flex items-center gap-2">
                      <Progress value={selectedMatch.scores.features} className="w-32 h-2" />
                      <span className="text-sm font-medium w-8">{selectedMatch.scores.features}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Maximize2 className="h-4 w-4" /> Tamaño
                    </span>
                    <div className="flex items-center gap-2">
                      <Progress value={selectedMatch.scores.size} className="w-32 h-2" />
                      <span className="text-sm font-medium w-8">{selectedMatch.scores.size}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Disponibilidad
                    </span>
                    <div className="flex items-center gap-2">
                      <Progress value={selectedMatch.scores.availability} className="w-32 h-2" />
                      <span className="text-sm font-medium w-8">{selectedMatch.scores.availability}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pros y Cons */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-600 flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4" /> Ventajas
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {selectedMatch.pros.map((pro, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-red-600 flex items-center gap-1">
                    <ThumbsDown className="h-4 w-4" /> Desventajas
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {selectedMatch.cons.map((con, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recomendación IA */}
              {selectedMatch.recommendation && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-700 flex items-center gap-1 mb-2">
                    <Brain className="h-4 w-4" /> Recomendación de IA
                  </h4>
                  <p className="text-sm text-purple-900">{selectedMatch.recommendation}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Cerrar
            </Button>
            <Button onClick={() => {
              if (selectedMatch) {
                router.push(`/propiedades/${selectedMatch.unitId}`);
              }
            }}>
              Ver Propiedad Completa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
