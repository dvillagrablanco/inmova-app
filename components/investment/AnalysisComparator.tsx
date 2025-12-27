'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BarChart3,
  Download,
} from 'lucide-react';

interface AnalysisSummary {
  id: string;
  name: string;
  assetType: string;
  propertyName?: string;
  metrics: {
    roi: number;
    cashOnCash: number;
    capRate: number;
    irr: number;
    totalReturn: number;
    paybackPeriod: number;
  };
  investment: {
    totalCapex: number;
    ownCapital: number;
    netCashFlow: number;
  };
  recommendation: string;
  strengths: string[];
  riskFactors: string[];
}

export function AnalysisComparator({
  analyses,
}: {
  analyses: AnalysisSummary[];
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparison, setComparison] = useState<AnalysisSummary[] | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2) return;

    setLoading(true);
    try {
      const response = await fetch('/api/investment-analysis/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisIds: selectedIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Error comparando análisis');
      }

      const data = await response.json();
      setComparison(data);
    } catch (error) {
      console.error('Error comparing analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'excellent':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'good':
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      case 'acceptable':
        return <Minus className="h-4 w-4 text-yellow-600" />;
      case 'risky':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'not_recommended':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getRecommendationText = (recommendation: string) => {
    const map: any = {
      excellent: 'Excelente',
      good: 'Buena',
      acceptable: 'Aceptable',
      risky: 'Riesgosa',
      not_recommended: 'No Recomendada',
    };
    return map[recommendation] || recommendation;
  };

  const getBestMetric = (metric: keyof AnalysisSummary['metrics']) => {
    if (!comparison) return null;
    
    const values = comparison.map((a) => a.metrics[metric]);
    const best = metric === 'paybackPeriod' ? Math.min(...values) : Math.max(...values);
    
    return best;
  };

  const isMetricBest = (value: number, metric: keyof AnalysisSummary['metrics']) => {
    const best = getBestMetric(metric);
    return best !== null && value === best;
  };

  return (
    <div className="space-y-6">
      {/* Selección de Análisis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Comparador de Análisis
          </CardTitle>
          <CardDescription>
            Selecciona al menos 2 análisis para comparar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {analyses.map((analysis) => (
              <div
                key={analysis.id}
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={selectedIds.includes(analysis.id)}
                  onCheckedChange={() => toggleSelection(analysis.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{analysis.name}</span>
                    <Badge variant="outline">{analysis.assetType}</Badge>
                    {getRecommendationIcon(analysis.recommendation)}
                  </div>
                  {analysis.propertyName && (
                    <p className="text-sm text-muted-foreground">{analysis.propertyName}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">ROI: {analysis.metrics.roi.toFixed(2)}%</p>
                  <p className="text-xs text-muted-foreground">
                    C-on-C: {analysis.metrics.cashOnCash.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleCompare}
            disabled={selectedIds.length < 2 || loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Comparando...' : `Comparar ${selectedIds.length} Análisis`}
          </Button>
        </CardContent>
      </Card>

      {/* Tabla Comparativa */}
      {comparison && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Comparación de Métricas</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Métrica</th>
                      {comparison.map((analysis) => (
                        <th key={analysis.id} className="text-center p-3 font-semibold">
                          <div className="space-y-1">
                            <div>{analysis.name}</div>
                            <div className="text-xs font-normal text-muted-foreground">
                              {analysis.assetType}
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Recomendación */}
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">Recomendación</td>
                      {comparison.map((analysis) => (
                        <td key={analysis.id} className="text-center p-3">
                          <div className="flex items-center justify-center gap-2">
                            {getRecommendationIcon(analysis.recommendation)}
                            <span>{getRecommendationText(analysis.recommendation)}</span>
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* ROI */}
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">ROI Anual</td>
                      {comparison.map((analysis) => (
                        <td
                          key={analysis.id}
                          className={`text-center p-3 ${
                            isMetricBest(analysis.metrics.roi, 'roi')
                              ? 'bg-green-100 dark:bg-green-950 font-bold'
                              : ''
                          }`}
                        >
                          {analysis.metrics.roi.toFixed(2)}%
                          {isMetricBest(analysis.metrics.roi, 'roi') && (
                            <TrendingUp className="inline h-4 w-4 ml-1 text-green-600" />
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Cash-on-Cash */}
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">Cash-on-Cash</td>
                      {comparison.map((analysis) => (
                        <td
                          key={analysis.id}
                          className={`text-center p-3 ${
                            isMetricBest(analysis.metrics.cashOnCash, 'cashOnCash')
                              ? 'bg-green-100 dark:bg-green-950 font-bold'
                              : ''
                          }`}
                        >
                          {analysis.metrics.cashOnCash.toFixed(2)}%
                          {isMetricBest(analysis.metrics.cashOnCash, 'cashOnCash') && (
                            <TrendingUp className="inline h-4 w-4 ml-1 text-green-600" />
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Cap Rate */}
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">Cap Rate</td>
                      {comparison.map((analysis) => (
                        <td
                          key={analysis.id}
                          className={`text-center p-3 ${
                            isMetricBest(analysis.metrics.capRate, 'capRate')
                              ? 'bg-green-100 dark:bg-green-950 font-bold'
                              : ''
                          }`}
                        >
                          {analysis.metrics.capRate.toFixed(2)}%
                          {isMetricBest(analysis.metrics.capRate, 'capRate') && (
                            <TrendingUp className="inline h-4 w-4 ml-1 text-green-600" />
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* TIR */}
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">TIR (IRR)</td>
                      {comparison.map((analysis) => (
                        <td
                          key={analysis.id}
                          className={`text-center p-3 ${
                            isMetricBest(analysis.metrics.irr, 'irr')
                              ? 'bg-green-100 dark:bg-green-950 font-bold'
                              : ''
                          }`}
                        >
                          {analysis.metrics.irr.toFixed(2)}%
                        </td>
                      ))}
                    </tr>

                    {/* Payback Period */}
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">Período de Recuperación</td>
                      {comparison.map((analysis) => (
                        <td
                          key={analysis.id}
                          className={`text-center p-3 ${
                            isMetricBest(analysis.metrics.paybackPeriod, 'paybackPeriod')
                              ? 'bg-green-100 dark:bg-green-950 font-bold'
                              : ''
                          }`}
                        >
                          {analysis.metrics.paybackPeriod.toFixed(1)} años
                          {isMetricBest(analysis.metrics.paybackPeriod, 'paybackPeriod') && (
                            <TrendingDown className="inline h-4 w-4 ml-1 text-green-600" />
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Inversión Total */}
                    <tr className="border-b hover:bg-muted/50 bg-muted/30">
                      <td className="p-3 font-bold">CAPEX Total</td>
                      {comparison.map((analysis) => (
                        <td key={analysis.id} className="text-center p-3 font-semibold">
                          €{analysis.investment.totalCapex.toLocaleString()}
                        </td>
                      ))}
                    </tr>

                    {/* Capital Propio */}
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">Capital Propio</td>
                      {comparison.map((analysis) => (
                        <td key={analysis.id} className="text-center p-3">
                          €{analysis.investment.ownCapital.toLocaleString()}
                        </td>
                      ))}
                    </tr>

                    {/* Cash Flow Neto */}
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">Cash Flow Neto (anual)</td>
                      {comparison.map((analysis) => (
                        <td
                          key={analysis.id}
                          className={`text-center p-3 font-semibold ${
                            analysis.investment.netCashFlow >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {analysis.investment.netCashFlow >= 0 ? '+' : ''}€
                          {analysis.investment.netCashFlow.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Resumen de Fortalezas y Riesgos */}
          <div className="grid gap-6 md:grid-cols-2">
            {comparison.map((analysis) => (
              <Card key={analysis.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{analysis.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-green-600 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Fortalezas ({analysis.strengths.length})
                    </h4>
                    {analysis.strengths.length > 0 ? (
                      <ul className="space-y-1">
                        {analysis.strengths.slice(0, 3).map((s, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-green-600">✓</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No se identificaron fortalezas
                      </p>
                    )}
                  </div>

                  <div>
                    <h4 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Riesgos ({analysis.riskFactors.length})
                    </h4>
                    {analysis.riskFactors.length > 0 ? (
                      <ul className="space-y-1">
                        {analysis.riskFactors.slice(0, 3).map((r, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-red-600">⚠</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No se identificaron riesgos significativos
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default AnalysisComparator;
