'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Info, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

interface ROIData {
  purchasePrice: number;
  renovationCosts: number;
  closingCosts: number;
  monthlyRent: number;
  monthlyExpenses: number;
  occupancyRate: number;
  appreciationRate: number;
  holdingPeriod: number;
}

interface ROIResults {
  totalInvestment: number;
  annualRent: number;
  annualExpenses: number;
  annualNetIncome: number;
  roi: number;
  cashOnCash: number;
  capRate: number;
  paybackPeriod: number;
  totalReturn: number;
  futureValue: number;
  breakEvenMonths: number;
}

export function ROICalculator() {
  const [data, setData] = useState<ROIData>({
    purchasePrice: 200000,
    renovationCosts: 20000,
    closingCosts: 8000,
    monthlyRent: 1500,
    monthlyExpenses: 600,
    occupancyRate: 95,
    appreciationRate: 3,
    holdingPeriod: 10,
  });

  const [results, setResults] = useState<ROIResults | null>(null);

  useEffect(() => {
    calculateROI();
  }, [data]);

  const calculateROI = () => {
    // Total Investment
    const totalInvestment = data.purchasePrice + data.renovationCosts + data.closingCosts;

    // Annual Income
    const effectiveMonthlyRent = data.monthlyRent * (data.occupancyRate / 100);
    const annualRent = effectiveMonthlyRent * 12;

    // Annual Expenses
    const annualExpenses = data.monthlyExpenses * 12;

    // Net Operating Income
    const annualNetIncome = annualRent - annualExpenses;

    // ROI (Return on Investment)
    const roi = (annualNetIncome / totalInvestment) * 100;

    // Cash-on-Cash Return (sin considerar financiamiento por simplicidad)
    const cashOnCash = (annualNetIncome / totalInvestment) * 100;

    // Cap Rate (Capitalization Rate)
    const capRate = (annualNetIncome / data.purchasePrice) * 100;

    // Payback Period (años)
    const paybackPeriod = totalInvestment / annualNetIncome;

    // Break Even (meses)
    const monthlyNetIncome = annualNetIncome / 12;
    const breakEvenMonths = totalInvestment / monthlyNetIncome;

    // Future Value con apreciación
    const futureValue =
      data.purchasePrice * Math.pow(1 + data.appreciationRate / 100, data.holdingPeriod);

    // Total Return después del período de tenencia
    const totalEquityGain = futureValue - data.purchasePrice;
    const totalCashFlow = annualNetIncome * data.holdingPeriod;
    const totalReturn = ((totalEquityGain + totalCashFlow) / totalInvestment) * 100;

    setResults({
      totalInvestment,
      annualRent,
      annualExpenses,
      annualNetIncome,
      roi,
      cashOnCash,
      capRate,
      paybackPeriod,
      totalReturn,
      futureValue,
      breakEvenMonths,
    });
  };

  const updateData = (field: keyof ROIData, value: number) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const getROIQuality = (roi: number): { label: string; color: string; icon: any } => {
    if (roi >= 15) return { label: 'Excelente', color: 'text-green-600', icon: TrendingUp };
    if (roi >= 10) return { label: 'Bueno', color: 'text-blue-600', icon: TrendingUp };
    if (roi >= 5) return { label: 'Aceptable', color: 'text-yellow-600', icon: DollarSign };
    if (roi > 0) return { label: 'Bajo', color: 'text-orange-600', icon: AlertTriangle };
    return { label: 'Negativo', color: 'text-red-600', icon: TrendingDown };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Calculadora de ROI (Return on Investment)
          </CardTitle>
          <CardDescription>Analiza la rentabilidad de tu inversión inmobiliaria</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Inversión Inicial */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Inversión Inicial</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="purchase-price">
                  Precio de Compra (€)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="inline h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Precio de adquisición de la propiedad</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="purchase-price"
                  type="number"
                  min="0"
                  step="1000"
                  value={data.purchasePrice}
                  onChange={(e) => updateData('purchasePrice', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="renovation">
                  Costos de Renovación (€)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="inline h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Gastos en mejoras, reparaciones y reformas</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="renovation"
                  type="number"
                  min="0"
                  step="1000"
                  value={data.renovationCosts}
                  onChange={(e) => updateData('renovationCosts', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="closing">
                  Gastos de Cierre (€)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="inline h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Notaría, registro, impuestos, comisiones</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="closing"
                  type="number"
                  min="0"
                  step="1000"
                  value={data.closingCosts}
                  onChange={(e) => updateData('closingCosts', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Ingresos y Gastos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Ingresos y Gastos Mensuales</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="monthly-rent">
                  Renta Mensual (€)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="inline h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Renta mensual esperada</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="monthly-rent"
                  type="number"
                  min="0"
                  step="50"
                  value={data.monthlyRent}
                  onChange={(e) => updateData('monthlyRent', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthly-expenses">
                  Gastos Mensuales (€)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="inline h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Comunidad, IBI, seguros, mantenimiento, etc.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="monthly-expenses"
                  type="number"
                  min="0"
                  step="50"
                  value={data.monthlyExpenses}
                  onChange={(e) => updateData('monthlyExpenses', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Parámetros Adicionales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Parámetros Adicionales</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="occupancy">
                  Tasa de Ocupación (%)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="inline h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Porcentaje del año que la propiedad estará alquilada</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="occupancy"
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={data.occupancyRate}
                  onChange={(e) => updateData('occupancyRate', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="appreciation">
                  Apreciación Anual (%)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="inline h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Tasa de apreciación anual esperada del valor de la propiedad</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="appreciation"
                  type="number"
                  min="-10"
                  max="20"
                  step="0.5"
                  value={data.appreciationRate}
                  onChange={(e) => updateData('appreciationRate', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="holding">
                  Período de Tenencia (años)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="inline h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Años que planeas mantener la inversión</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="holding"
                  type="number"
                  min="1"
                  max="50"
                  step="1"
                  value={data.holdingPeriod}
                  onChange={(e) => updateData('holdingPeriod', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {results && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Métricas Principales */}
          <Card className="border-t-4 border-t-indigo-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-indigo-600" />
                Métricas Principales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">ROI Anual</span>
                  {(() => {
                    const quality = getROIQuality(results.roi);
                    const Icon = quality.icon;
                    return (
                      <span className={`font-bold flex items-center gap-1 ${quality.color}`}>
                        <Icon className="h-4 w-4" />
                        {quality.label}
                      </span>
                    );
                  })()}
                </div>
                <div className="text-3xl font-bold text-indigo-600">{results.roi.toFixed(2)}%</div>
                <Progress value={Math.min(results.roi * 5, 100)} className="h-2 mt-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="text-sm text-muted-foreground">Cap Rate</div>
                  <div className="text-xl font-bold">{results.capRate.toFixed(2)}%</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Cash-on-Cash</div>
                  <div className="text-xl font-bold">{results.cashOnCash.toFixed(2)}%</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Break Even
                  </div>
                  <div className="text-lg font-bold">
                    {results.breakEvenMonths.toFixed(1)} meses
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Payback Period</div>
                  <div className="text-lg font-bold">{results.paybackPeriod.toFixed(1)} años</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Análisis Financiero */}
          <Card className="border-t-4 border-t-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Análisis Financiero
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Inversión Total</span>
                  <span className="font-semibold">€{results.totalInvestment.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ingresos Anuales</span>
                  <span className="font-semibold text-green-600">
                    +€{results.annualRent.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Gastos Anuales</span>
                  <span className="font-semibold text-red-600">
                    -€{results.annualExpenses.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t-2">
                  <span className="font-semibold">NOI Anual</span>
                  <span className="font-bold text-lg text-green-600">
                    €{results.annualNetIncome.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Valor Futuro ({data.holdingPeriod} años)
                  </span>
                  <span className="font-semibold">€{results.futureValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ganancia de Capital</span>
                  <span className="font-semibold text-green-600">
                    +€{(results.futureValue - data.purchasePrice).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t-2">
                  <span className="font-semibold">Retorno Total</span>
                  <span className="font-bold text-lg text-green-600">
                    {results.totalReturn.toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Interpretación */}
      {results && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">
              💡 Interpretación de Resultados
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-blue-800 dark:text-blue-200">
            <p>
              <strong>ROI de {results.roi.toFixed(2)}%:</strong>{' '}
              {results.roi >= 15 && 'Excelente inversión con retornos muy por encima del mercado.'}
              {results.roi >= 10 && results.roi < 15 && 'Buena inversión con retornos sólidos.'}
              {results.roi >= 5 &&
                results.roi < 10 &&
                'Inversión aceptable, considera optimizar gastos.'}
              {results.roi > 0 && results.roi < 5 && 'Retornos bajos, revisa tus números.'}
              {results.roi <= 0 && 'Esta inversión genera pérdidas, no es recomendable.'}
            </p>
            <p>
              <strong>Break Even en {results.breakEvenMonths.toFixed(1)} meses:</strong> Recuperarás
              tu inversión inicial en {(results.breakEvenMonths / 12).toFixed(1)} años.
            </p>
            <p>
              <strong>Cash Flow anual de €{results.annualNetIncome.toLocaleString()}:</strong> Flujo
              de caja positivo mensual de €{(results.annualNetIncome / 12).toFixed(2)}.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ROICalculator;
