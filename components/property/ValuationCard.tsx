'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Euro,
  BarChart3,
  Lightbulb,
} from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

interface ValuationCardProps {
  propertyId: string;
}

interface ValuationData {
  estimatedValue: number;
  minValue: number;
  maxValue: number;
  confidenceScore: number;
  pricePerM2: number;
  reasoning: string;
  keyFactors: string[];
  marketComparison: string;
  investmentPotential: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendations: string[];
  alquilerEstimado?: number;
  rentabilidadAlquiler?: number;
  capRate?: number;
  alquilerMediaEstancia?: number;
  alquilerMediaEstanciaMin?: number;
  alquilerMediaEstanciaMax?: number;
  rentabilidadMediaEstancia?: number;
  ocupacionEstimadaMediaEstancia?: number;
  perfilInquilinoMediaEstancia?: string;
  metodologiaUsada?: string;
  tendenciaMercado?: string;
}

export function ValuationCard({ propertyId }: ValuationCardProps) {
  const [loading, setLoading] = useState(false);
  const [valuation, setValuation] = useState<ValuationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleValuate = async () => {
    setLoading(true);
    setError(null);

    try {
      // Cache: 'no-store' para evitar que el Service Worker intercepte
      // (la valoración puede tardar 30-60s con scraping + IA).
      const response = await fetch(`/api/properties/${propertyId}/valuation`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Detectar respuesta sintética del Service Worker
        if (errorData.offline || errorData.error === 'Offline') {
          throw new Error(
            'La valoración tarda más de lo habitual. Intenta de nuevo en unos segundos (los servicios externos como Idealista pueden estar lentos).'
          );
        }

        throw new Error(errorData.error || errorData.details || 'Error al valorar');
      }

      const result = await response.json();
      setValuation(result.data);
      toast.success('Valoración completada exitosamente');
    } catch (err: any) {
      console.error('Valuation error:', err);
      setError(err.message);
      toast.error('Error al generar valoración');
    } finally {
      setLoading(false);
    }
  };

  const getInvestmentBadge = (potential: string) => {
    const badges = {
      HIGH: { label: 'Alto Potencial', variant: 'default' as const, icon: TrendingUp },
      MEDIUM: { label: 'Potencial Moderado', variant: 'secondary' as const, icon: Minus },
      LOW: { label: 'Bajo Potencial', variant: 'outline' as const, icon: TrendingDown },
    };
    return badges[potential as keyof typeof badges] || badges.MEDIUM;
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Error en Valoración
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleValuate} variant="outline">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!valuation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Valoración con IA
          </CardTitle>
          <CardDescription>
            Obtén una valoración profesional de esta propiedad usando inteligencia artificial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleValuate} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analizando propiedad...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generar Valoración
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            La valoración se basa en características de la propiedad, datos del mercado y comparables
          </p>
        </CardContent>
      </Card>
    );
  }

  const investmentBadge = getInvestmentBadge(valuation.investmentPotential);
  const InvestmentIcon = investmentBadge.icon;

  return (
    <div className="space-y-4">
      {/* Valoración Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Valoración con IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Valor Estimado + Alquileres */}
          <div className="p-6 bg-primary/5 rounded-lg space-y-5">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Valor Estimado de Venta</p>
              <p className="text-4xl font-bold text-primary">
                €{valuation.estimatedValue?.toLocaleString('es-ES') || 0}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Rango: €{valuation.minValue?.toLocaleString('es-ES') || 0} - €
                {valuation.maxValue?.toLocaleString('es-ES') || 0}
              </p>
              <p className="text-sm font-medium mt-1">€{valuation.pricePerM2?.toLocaleString('es-ES') || 0}/m²</p>
            </div>

            {/* Alquileres integrados en la misma card */}
            {Number(valuation.alquilerEstimado || 0) > 0 || Number(valuation.alquilerMediaEstancia || 0) > 0 ? (
              <>
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-center mb-3 flex items-center justify-center gap-2">
                    <Euro className="h-4 w-4" />
                    Alquiler Estimado
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {Number(valuation.alquilerEstimado || 0) > 0 && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                        <p className="text-[10px] text-green-600 font-semibold uppercase tracking-wider">Larga estancia</p>
                        <p className="text-[10px] text-green-500 mb-1">12+ meses</p>
                        <p className="text-2xl font-bold text-green-800">
                          {valuation.alquilerEstimado?.toLocaleString('es-ES')}€
                        </p>
                        <p className="text-xs text-green-600">/mes</p>
                        {Number(valuation.rentabilidadAlquiler || 0) > 0 && (
                          <p className="text-xs text-green-600 mt-1 font-medium">
                            Rent. {valuation.rentabilidadAlquiler?.toFixed(1)}%
                          </p>
                        )}
                      </div>
                    )}
                    {Number(valuation.alquilerMediaEstancia || 0) > 0 && (
                      <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 text-center">
                        <p className="text-[10px] text-orange-600 font-semibold uppercase tracking-wider">Media estancia</p>
                        <p className="text-[10px] text-orange-500 mb-1">1-11 meses</p>
                        <p className="text-2xl font-bold text-orange-800">
                          {valuation.alquilerMediaEstancia?.toLocaleString('es-ES')}€
                        </p>
                        <p className="text-xs text-orange-600">/mes</p>
                        {Number(valuation.alquilerEstimado || 0) > 0 && (
                          <p className="text-xs text-orange-600 mt-1 font-medium">
                            +{Math.round(((Number(valuation.alquilerMediaEstancia) - Number(valuation.alquilerEstimado)) / Number(valuation.alquilerEstimado)) * 100)}% vs larga
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {valuation.perfilInquilinoMediaEstancia && (
                  <p className="text-xs text-muted-foreground text-center">
                    <span className="font-medium">Perfil media estancia:</span> {valuation.perfilInquilinoMediaEstancia}
                  </p>
                )}
              </>
            ) : null}
          </div>

          <Separator />

          {/* Confianza y Potencial */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Confianza</p>
              <p className={`text-2xl font-bold ${getConfidenceColor(valuation.confidenceScore)}`}>
                {valuation.confidenceScore}%
              </p>
              <div className="w-full bg-muted h-2 rounded-full mt-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${valuation.confidenceScore}%` }}
                />
              </div>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Potencial</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <InvestmentIcon className="h-5 w-5" />
                <Badge variant={investmentBadge.variant}>{investmentBadge.label}</Badge>
              </div>
            </div>
          </div>

          {/* Razonamiento */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Análisis
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {valuation.reasoning}
            </p>
          </div>

          <Separator />

          {/* Factores Clave */}
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Factores Clave
            </h4>
            <ul className="space-y-2">
              {valuation.keyFactors.map((factor, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          {/* Comparación de Mercado */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Comparación de Mercado
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {valuation.marketComparison}
            </p>
          </div>

          <Separator />

          {/* Recomendaciones */}
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Recomendaciones para Incrementar Valor
            </h4>
            <ul className="space-y-2">
              {valuation.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Lightbulb className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Botón para re-valorar */}
          <Button
            onClick={handleValuate}
            variant="outline"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando nueva valoración...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Actualizar Valoración
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Última valoración generada con IA Avanzada
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
