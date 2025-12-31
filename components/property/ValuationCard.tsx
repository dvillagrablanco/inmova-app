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
}

export function ValuationCard({ propertyId }: ValuationCardProps) {
  const [loading, setLoading] = useState(false);
  const [valuation, setValuation] = useState<ValuationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleValuate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/properties/${propertyId}/valuation`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al valorar');
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
          {/* Valor Estimado */}
          <div className="text-center p-6 bg-primary/5 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Valor Estimado</p>
            <p className="text-4xl font-bold text-primary">
              €{valuation.estimatedValue.toLocaleString('es-ES')}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Rango: €{valuation.minValue.toLocaleString('es-ES')} - €
              {valuation.maxValue.toLocaleString('es-ES')}
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <p className="text-sm font-medium">€{valuation.pricePerM2.toLocaleString('es-ES')}/m²</p>
            </div>
          </div>

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
            Última valoración generada con Claude 3.5 Sonnet
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
