'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Lightbulb,
  Home,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Euro,
  Users,
  Building2,
  Wrench,
  Clock,
  Sparkles,
  Brain,
  Target,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// TIPOS
// ============================================================================

interface Recommendation {
  id: string;
  tipo: string;
  categoria: string;
  titulo: string;
  descripcion: string;
  prioridad: number;
  impactoEstimado?: number;
  accionRecomendada?: string;
  datosRelacionados?: any;
  aplicada: boolean;
  fechaAplicacion?: string;
  createdAt: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function RecomendacionesPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();

  // Estados
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  // Cargar datos
  useEffect(() => {
    if (status === 'authenticated') {
      loadRecommendations();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/recommendations');
      if (response.ok) {
        const result = await response.json();
        setRecommendations(result.recommendations || []);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
      toast.error('Error al cargar recomendaciones');
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    try {
      setGenerating(true);
      const response = await fetch('/api/recommendations', {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Nuevas recomendaciones generadas');
        loadRecommendations();
      } else {
        throw new Error('Error generando recomendaciones');
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast.error('Error al generar recomendaciones');
    } finally {
      setGenerating(false);
    }
  };

  const markAsApplied = async (id: string) => {
    try {
      const response = await fetch(`/api/recommendations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aplicada: true }),
      });

      if (response.ok) {
        toast.success('Recomendación marcada como aplicada');
        setRecommendations(prev =>
          prev.filter(r => r.id !== id)
        );
      }
    } catch (error) {
      toast.error('Error al actualizar recomendación');
    }
  };

  const dismissRecommendation = async (id: string) => {
    try {
      const response = await fetch(`/api/recommendations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Recomendación descartada');
        setRecommendations(prev =>
          prev.filter(r => r.id !== id)
        );
      }
    } catch (error) {
      toast.error('Error al descartar recomendación');
    }
  };

  const getCategoryIcon = (categoria: string) => {
    const icons: Record<string, any> = {
      ingresos: Euro,
      gastos: TrendingDown,
      ocupacion: Users,
      mantenimiento: Wrench,
      propiedades: Building2,
      eficiencia: Zap,
    };
    const Icon = icons[categoria?.toLowerCase()] || Lightbulb;
    return <Icon className="h-5 w-5" />;
  };

  const getCategoryColor = (categoria: string) => {
    const colors: Record<string, string> = {
      ingresos: 'bg-green-100 text-green-600',
      gastos: 'bg-red-100 text-red-600',
      ocupacion: 'bg-blue-100 text-blue-600',
      mantenimiento: 'bg-orange-100 text-orange-600',
      propiedades: 'bg-purple-100 text-purple-600',
      eficiencia: 'bg-yellow-100 text-yellow-600',
    };
    return colors[categoria?.toLowerCase()] || 'bg-gray-100 text-gray-600';
  };

  const getPriorityBadge = (prioridad: number) => {
    if (prioridad >= 8) {
      return <Badge variant="destructive">Alta</Badge>;
    }
    if (prioridad >= 5) {
      return <Badge variant="default">Media</Badge>;
    }
    return <Badge variant="secondary">Baja</Badge>;
  };

  // Stats
  const stats = {
    total: recommendations.length,
    highPriority: recommendations.filter(r => r.prioridad >= 8).length,
    potentialImpact: recommendations.reduce((sum, r) => sum + (r.impactoEstimado || 0), 0),
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-[400px]" />
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
                <BreadcrumbPage>Recomendaciones</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Lightbulb className="h-8 w-8 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Recomendaciones IA</h1>
              <p className="text-muted-foreground">
                Sugerencias inteligentes para optimizar tu gestión inmobiliaria
              </p>
            </div>
          </div>
          <Button onClick={generateRecommendations} disabled={generating} className="gap-2">
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4" />
                Generar Nuevas
              </>
            )}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Recomendaciones Activas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.highPriority}</p>
                  <p className="text-xs text-muted-foreground">Alta Prioridad</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.potentialImpact.toLocaleString('es-ES')}€</p>
                  <p className="text-xs text-muted-foreground">Impacto Potencial</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Recomendaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Recomendaciones Pendientes
            </CardTitle>
            <CardDescription>
              Ordenadas por prioridad y potencial impacto
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recommendations.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Todo optimizado</h3>
                <p className="text-muted-foreground mb-4">
                  No hay recomendaciones pendientes en este momento
                </p>
                <Button onClick={generateRecommendations} variant="outline">
                  <Brain className="h-4 w-4 mr-2" />
                  Analizar de Nuevo
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Icono Categoría */}
                      <div className={`p-3 rounded-lg self-start ${getCategoryColor(rec.categoria)}`}>
                        {getCategoryIcon(rec.categoria)}
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-semibold">{rec.titulo}</h4>
                            <p className="text-sm text-muted-foreground">{rec.descripcion}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getPriorityBadge(rec.prioridad)}
                          </div>
                        </div>

                        {rec.accionRecomendada && (
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800 flex items-start gap-2">
                              <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span><strong>Acción:</strong> {rec.accionRecomendada}</span>
                            </p>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <Badge variant="outline" className="capitalize">
                            {rec.categoria}
                          </Badge>
                          {rec.impactoEstimado && rec.impactoEstimado > 0 && (
                            <span className="text-green-600 font-medium flex items-center gap-1">
                              <TrendingUp className="h-4 w-4" />
                              +{rec.impactoEstimado.toLocaleString('es-ES')}€ potencial
                            </span>
                          )}
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(rec.createdAt).toLocaleDateString('es-ES')}
                          </span>
                        </div>

                        {/* Acciones */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => markAsApplied(rec.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aplicada
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => dismissRecommendation(rec.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Descartar
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
    </AuthenticatedLayout>
  );
}
