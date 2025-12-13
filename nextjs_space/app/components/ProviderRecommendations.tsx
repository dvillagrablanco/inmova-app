'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Phone,
  Mail,
  Sparkles,
  Award,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ProviderRecommendation {
  provider: {
    id: string;
    nombre: string;
    tipo: string;
    telefono: string;
    email: string | null;
    rating: number | null;
  };
  score: {
    total: number;
    breakdown: {
      rating: number;
      availability: number;
      specialization: number;
      workload: number;
      performance: number;
      responseTime: number;
    };
  };
  reasoning: string[];
  recommendation: string;
}

interface ProviderRecommendationsProps {
  buildingId: string;
  tipo: string;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  presupuestoMax?: number;
  fechaRequerida?: Date;
  onSelectProvider?: (providerId: string, provider: any) => void;
  selectedProviderId?: string | null;
}

export default function ProviderRecommendations({
  buildingId,
  tipo,
  prioridad,
  presupuestoMax,
  fechaRequerida,
  onSelectProvider,
  selectedProviderId,
}: ProviderRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<ProviderRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, [buildingId, tipo, prioridad]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/providers/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          buildingId,
          tipo,
          prioridad,
          presupuestoMax,
          fechaRequerida: fechaRequerida?.toISOString(),
          limit: 5,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al obtener recomendaciones');
      }

      const data = await response.json();

      if (data.success) {
        setRecommendations(data.recommendations || []);
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (err: any) {
      setError(err.message);
      toast.error('No se pudieron obtener recomendaciones de proveedores');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    if (recommendation.includes('Altamente')) return 'bg-green-500';
    if (recommendation === 'Recomendado') return 'bg-blue-500';
    if (recommendation === 'Aceptable') return 'bg-yellow-500';
    if (recommendation.includes('Cautela')) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 55) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const renderReasoningIcon = (reason: string) => {
    if (reason.includes('✅')) return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (reason.includes('⚠️')) return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    if (reason.includes('❌')) return <AlertCircle className="w-4 h-4 text-red-600" />;
    if (reason.includes('📈')) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (reason.includes('📉')) return <TrendingDown className="w-4 h-4 text-red-600" />;
    if (reason.includes('⚡')) return <Sparkles className="w-4 h-4 text-blue-600" />;
    if (reason.includes('⭐')) return <Star className="w-4 h-4 text-yellow-600" />;
    if (reason.includes('🚨')) return <AlertCircle className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Recomendaciones Inteligentes</h3>
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button variant="outline" size="sm" className="mt-2" onClick={fetchRecommendations}>
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No se encontraron proveedores disponibles para este tipo de trabajo.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Recomendaciones Inteligentes</h3>
        <Badge variant="outline" className="ml-auto">
          {recommendations.length} proveedor{recommendations.length !== 1 ? 'es' : ''}
        </Badge>
      </div>

      <div className="text-sm text-muted-foreground mb-4">
        Basado en rating, disponibilidad, especialización, carga de trabajo, rendimiento y tiempo de
        respuesta.
      </div>

      {recommendations.map((rec, index) => (
        <Card
          key={rec.provider.id}
          className={`transition-all hover:shadow-md ${
            selectedProviderId === rec.provider.id ? 'ring-2 ring-blue-500 border-blue-500' : ''
          }`}
        >
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {index === 0 && <Award className="w-5 h-5 text-yellow-600" />}
                  <CardTitle className="text-xl">{rec.provider.nombre}</CardTitle>
                </div>
                <CardDescription className="flex items-center gap-2">
                  <span>{rec.provider.tipo}</span>
                  {rec.provider.rating && (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {rec.provider.rating.toFixed(1)}
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${getScoreColor(rec.score.total)}`}>
                  {rec.score.total}
                </div>
                <div className="text-xs text-muted-foreground">Score</div>
              </div>
            </div>
            <Badge className={`${getRecommendationColor(rec.recommendation)} text-white mt-2`}>
              {rec.recommendation}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Desglose de Score */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Desglose de Evaluación:</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rating:</span>
                  <span className="font-medium">{rec.score.breakdown.rating.toFixed(1)}/25</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Disponibilidad:</span>
                  <span className="font-medium">
                    {rec.score.breakdown.availability.toFixed(1)}/20
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Especialización:</span>
                  <span className="font-medium">
                    {rec.score.breakdown.specialization.toFixed(1)}/15
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Carga:</span>
                  <span className="font-medium">{rec.score.breakdown.workload.toFixed(1)}/15</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rendimiento:</span>
                  <span className="font-medium">
                    {rec.score.breakdown.performance.toFixed(1)}/15
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Respuesta:</span>
                  <span className="font-medium">
                    {rec.score.breakdown.responseTime.toFixed(1)}/10
                  </span>
                </div>
              </div>
            </div>

            {/* Análisis y Razonamiento */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Análisis:</div>
              <ul className="space-y-1">
                {rec.reasoning.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    {renderReasoningIcon(reason)}
                    <span className="text-muted-foreground">
                      {reason.replace(/[✅⚠️❌📈📉⚡⭐🚨]/g, '').trim()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Información de Contacto */}
            <div className="flex flex-wrap gap-3 pt-2 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{rec.provider.telefono}</span>
              </div>
              {rec.provider.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{rec.provider.email}</span>
                </div>
              )}
            </div>

            {/* Botón de Selección */}
            {onSelectProvider && (
              <Button
                className="w-full"
                variant={selectedProviderId === rec.provider.id ? 'default' : 'outline'}
                onClick={() => onSelectProvider(rec.provider.id, rec.provider)}
              >
                {selectedProviderId === rec.provider.id ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Seleccionado
                  </>
                ) : (
                  'Seleccionar este Proveedor'
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
