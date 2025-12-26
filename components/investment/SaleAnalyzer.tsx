'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Download,
  Save,
} from 'lucide-react';

interface SaleAnalyzerProps {
  unitId?: string;
  investmentAnalysisId?: string; // Para comparar con análisis de compra original
}

export function SaleAnalyzer({ unitId, investmentAnalysisId }: SaleAnalyzerProps) {
  const [activeTab, setActiveTab] = useState('basico');
  
  // Datos de inversión original
  const [originalPurchasePrice, setOriginalPurchasePrice] = useState(200000);
  const [originalPurchaseDate, setOriginalPurchaseDate] = useState('2020-01-01');
  const [totalCapexInvested, setTotalCapexInvested] = useState(235000);
  
  // Situación actual
  const [currentMarketValue, setCurrentMarketValue] = useState(280000);
  const [currentMonthlyRent, setCurrentMonthlyRent] = useState(1200);
  const [yearsHeld, setYearsHeld] = useState(5);
  
  // Proyección de venta
  const [proposedSalePrice, setProposedSalePrice] = useState(280000);
  const [expectedSaleDate, setExpectedSaleDate] = useState('2025-06-01');
  
  // Costos de venta
  const [agencyCommission, setAgencyCommission] = useState(3); // %
  const [notaryCosts, setNotaryCosts] = useState(2000);
  const [capitalGainsTax, setCapitalGainsTax] = useState(19); // %
  const [mortgagePayoff, setMortgagePayoff] = useState(80000);
  const [otherSaleCosts, setOtherSaleCosts] = useState(1000);
  
  // Históricos
  const [totalRentCollected, setTotalRentCollected] = useState(72000); // 5 años × €1,200/mes × 12
  const [totalExpensesIncurred, setTotalExpensesIncurred] = useState(18000);
  const [mortgagePayments, setMortgagePayments] = useState(48000);
  const [improvementsInvested, setImprovementsInvested] = useState(10000);
  
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculateSaleAnalysis = () => {
    setLoading(true);
    
    // Calcular en el cliente (mismo código que el servicio)
    const agencyFee = 
      agencyCommission > 1
        ? agencyCommission
        : proposedSalePrice * (agencyCommission / 100);
    
    const totalSaleCosts = agencyFee + notaryCosts + otherSaleCosts;
    const grossProceeds = proposedSalePrice;
    
    const capitalGain = proposedSalePrice - originalPurchasePrice;
    const capitalGainsTaxAmount = capitalGain * (capitalGainsTax / 100);
    
    const netProceeds = grossProceeds - totalSaleCosts - capitalGainsTaxAmount - mortgagePayoff;
    
    const totalInvestment = totalCapexInvested + improvementsInvested;
    const totalCashIn = totalRentCollected + netProceeds;
    const totalCashOut = totalInvestment + totalExpensesIncurred;
    const totalReturn = totalCashIn - totalCashOut;
    
    const totalROI = (totalReturn / totalInvestment) * 100;
    const annualizedROI = totalROI / yearsHeld;
    
    const breakEvenSalePrice = 
      originalPurchasePrice +
      totalSaleCosts +
      capitalGainsTaxAmount +
      improvementsInvested -
      totalRentCollected +
      totalExpensesIncurred;
    
    const priceAboveBreakEven = proposedSalePrice - breakEvenSalePrice;
    
    // Recomendación
    const reasonsToSell: string[] = [];
    const reasonsToHold: string[] = [];
    
    if (annualizedROI > 10) {
      reasonsToSell.push(`ROI anualizado excelente (${annualizedROI.toFixed(1)}%)`);
    }
    
    if (capitalGain > totalInvestment * 0.5) {
      reasonsToSell.push(`Plusvalía significativa (${((capitalGain / totalInvestment) * 100).toFixed(1)}%)`);
    }
    
    if (yearsHeld >= 10) {
      reasonsToSell.push(`Inversión madura (${yearsHeld} años)`);
    }
    
    const currentCapRate = (currentMonthlyRent * 12) / currentMarketValue * 100;
    if (currentCapRate < 4) {
      reasonsToSell.push(`Cap Rate bajo (${currentCapRate.toFixed(1)}%) - mercado sobrevalorado`);
    }
    
    if (currentCapRate > 6) {
      reasonsToHold.push(`Cap Rate alto (${currentCapRate.toFixed(1)}%) - buen flujo de caja`);
    }
    
    if (yearsHeld < 3) {
      reasonsToHold.push(`Inversión reciente (${yearsHeld} años) - costos de transacción altos`);
    }
    
    let recommendation = 'consider_market';
    if (reasonsToSell.length >= 3 && annualizedROI > 10) {
      recommendation = 'sell_now';
    } else if (reasonsToHold.length > reasonsToSell.length) {
      recommendation = 'hold_continue_renting';
    }
    
    setResults({
      grossProceeds,
      totalSaleCosts,
      netProceeds,
      capitalGain,
      capitalGainsTaxAmount,
      netCapitalGain: capitalGain - capitalGainsTaxAmount,
      totalInvestment,
      totalReturn,
      totalROI,
      annualizedROI,
      totalCashIn,
      totalCashOut,
      breakEvenSalePrice,
      priceAboveBreakEven,
      recommendation,
      reasonsToSell,
      reasonsToHold,
      currentCapRate,
    });
    
    setLoading(false);
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'sell_now':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'hold_continue_renting':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'renovate_then_sell':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getRecommendationText = (rec: string) => {
    const map: any = {
      sell_now: 'Vender Ahora',
      hold_continue_renting: 'Mantener y Rentar',
      renovate_then_sell: 'Renovar y Vender',
      consider_market: 'Evaluar Mercado',
    };
    return map[rec] || rec;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Análisis de Venta de Activo
          </CardTitle>
          <CardDescription>
            Determina el momento óptimo para vender y calcula el ROI total de tu inversión
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basico">Básico</TabsTrigger>
          <TabsTrigger value="costos">Costos Venta</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="resultados">Resultados</TabsTrigger>
        </TabsList>

        {/* Tab Básico */}
        <TabsContent value="basico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Inversión Original</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Precio Compra Original</Label>
                  <Input
                    id="originalPrice"
                    type="number"
                    value={originalPurchasePrice}
                    onChange={(e) => setOriginalPurchasePrice(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Fecha de Compra</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={originalPurchaseDate}
                    onChange={(e) => setOriginalPurchaseDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="capex">CAPEX Total Invertido</Label>
                <Input
                  id="capex"
                  type="number"
                  value={totalCapexInvested}
                  onChange={(e) => setTotalCapexInvested(Number(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  Incluye precio compra + notaría + impuestos + reformas iniciales
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Situación Actual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="marketValue">Valor Mercado Actual</Label>
                  <Input
                    id="marketValue"
                    type="number"
                    value={currentMarketValue}
                    onChange={(e) => setCurrentMarketValue(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentRent">Renta Mensual Actual</Label>
                  <Input
                    id="currentRent"
                    type="number"
                    value={currentMonthlyRent}
                    onChange={(e) => setCurrentMonthlyRent(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearsHeld">Años en Propiedad</Label>
                  <Input
                    id="yearsHeld"
                    type="number"
                    value={yearsHeld}
                    onChange={(e) => setYearsHeld(Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Proyección de Venta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="salePrice">Precio de Venta Propuesto</Label>
                  <Input
                    id="salePrice"
                    type="number"
                    value={proposedSalePrice}
                    onChange={(e) => setProposedSalePrice(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saleDate">Fecha Estimada de Venta</Label>
                  <Input
                    id="saleDate"
                    type="date"
                    value={expectedSaleDate}
                    onChange={(e) => setExpectedSaleDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Costos */}
        <TabsContent value="costos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Costos de Venta</CardTitle>
              <CardDescription>
                Gastos asociados a la transacción de venta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="commission">Comisión Agencia (%)</Label>
                  <Input
                    id="commission"
                    type="number"
                    step="0.1"
                    value={agencyCommission}
                    onChange={(e) => setAgencyCommission(Number(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Típico: 3-5% del precio de venta
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notary">Gastos Notariales</Label>
                  <Input
                    id="notary"
                    type="number"
                    value={notaryCosts}
                    onChange={(e) => setNotaryCosts(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Impuesto Plusvalía (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.1"
                    value={capitalGainsTax}
                    onChange={(e) => setCapitalGainsTax(Number(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Típico: 19-23% según tramos IRPF
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mortgage">Cancelación Hipoteca</Label>
                  <Input
                    id="mortgage"
                    type="number"
                    value={mortgagePayoff}
                    onChange={(e) => setMortgagePayoff(Number(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Deuda pendiente a pagar
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otherCosts">Otros Costos</Label>
                <Input
                  id="otherCosts"
                  type="number"
                  value={otherSaleCosts}
                  onChange={(e) => setOtherSaleCosts(Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Histórico */}
        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Datos Históricos</CardTitle>
              <CardDescription>
                Información de rendimiento durante el período de tenencia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rentCollected">Rentas Totales Cobradas</Label>
                  <Input
                    id="rentCollected"
                    type="number"
                    value={totalRentCollected}
                    onChange={(e) => setTotalRentCollected(Number(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Total de rentas recibidas desde compra
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expenses">Gastos Totales</Label>
                  <Input
                    id="expenses"
                    type="number"
                    value={totalExpensesIncurred}
                    onChange={(e) => setTotalExpensesIncurred(Number(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Mantenimiento, impuestos, seguros, etc.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mortgagePayments">Pagos de Hipoteca</Label>
                  <Input
                    id="mortgagePayments"
                    type="number"
                    value={mortgagePayments}
                    onChange={(e) => setMortgagePayments(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="improvements">Mejoras Realizadas</Label>
                  <Input
                    id="improvements"
                    type="number"
                    value={improvementsInvested}
                    onChange={(e) => setImprovementsInvested(Number(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Reformas y mejoras durante tenencia
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Resultados */}
        <TabsContent value="resultados" className="space-y-4">
          {!results ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Configura los datos en las pestañas anteriores y calcula el análisis
                  </p>
                  <Button onClick={calculateSaleAnalysis} size="lg" disabled={loading}>
                    {loading ? 'Calculando...' : 'Calcular Análisis de Venta'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Recomendación Principal */}
              <Card className={`border-2 ${getRecommendationColor(results.recommendation)}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {results.recommendation === 'sell_now' ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : results.recommendation === 'hold_continue_renting' ? (
                      <AlertTriangle className="h-6 w-6" />
                    ) : (
                      <Calendar className="h-6 w-6" />
                    )}
                    Recomendación: {getRecommendationText(results.recommendation)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-semibold text-green-700 mb-2">Razones para Vender:</h4>
                      {results.reasonsToSell.length > 0 ? (
                        <ul className="space-y-1">
                          {results.reasonsToSell.map((reason: string, i: number) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No se identificaron razones fuertes</p>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-700 mb-2">Razones para Mantener:</h4>
                      {results.reasonsToHold.length > 0 ? (
                        <ul className="space-y-1">
                          {results.reasonsToHold.map((reason: string, i: number) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <TrendingUp className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No se identificaron razones fuertes</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Métricas Principales */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      ROI Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {results.totalROI.toFixed(2)}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Anualizado: {results.annualizedROI.toFixed(2)}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Plusvalía Neta
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      €{results.netCapitalGain.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Bruta: €{results.capitalGain.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Ingresos Netos Venta
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      €{results.netProceeds.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Bruto: €{results.grossProceeds.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Detalles Financieros */}
              <Card>
                <CardHeader>
                  <CardTitle>Análisis Financiero Detallado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Inversión vs Retorno */}
                    <div>
                      <h4 className="font-semibold mb-3">Inversión vs Retorno</h4>
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="p-4 bg-red-50 rounded-lg">
                          <p className="text-sm text-muted-foreground">Total Invertido</p>
                          <p className="text-2xl font-bold text-red-600">
                            €{results.totalCashOut.toLocaleString()}
                          </p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <p className="text-sm text-muted-foreground">Total Recibido</p>
                          <p className="text-2xl font-bold text-green-600">
                            €{results.totalCashIn.toLocaleString()}
                          </p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-muted-foreground">Beneficio Neto</p>
                          <p className="text-2xl font-bold text-blue-600">
                            €{results.totalReturn.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Break-Even */}
                    <div>
                      <h4 className="font-semibold mb-3">Análisis Break-Even</h4>
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-muted-foreground">Precio Break-Even</p>
                            <p className="text-xl font-bold">
                              €{results.breakEvenSalePrice.toLocaleString()}
                            </p>
                          </div>
                          <ArrowRight className="h-6 w-6 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Precio Propuesto</p>
                            <p className="text-xl font-bold">
                              €{proposedSalePrice.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm">
                            <span className="font-semibold">Por encima del break-even:</span>{' '}
                            <span className={results.priceAboveBreakEven > 0 ? 'text-green-600' : 'text-red-600'}>
                              €{results.priceAboveBreakEven.toLocaleString()}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Cap Rate Actual */}
                    <div>
                      <h4 className="font-semibold mb-3">Situación de Mercado</h4>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="p-4 border rounded-lg">
                          <p className="text-sm text-muted-foreground">Cap Rate Actual</p>
                          <p className="text-2xl font-bold">
                            {results.currentCapRate.toFixed(2)}%
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Renta anual / Valor mercado
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <p className="text-sm text-muted-foreground">Apreciación Total</p>
                          <p className="text-2xl font-bold text-green-600">
                            {((currentMarketValue - originalPurchasePrice) / originalPurchasePrice * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            En {yearsHeld} años
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Acciones */}
              <div className="flex gap-4">
                <Button onClick={calculateSaleAnalysis} variant="outline">
                  Recalcular
                </Button>
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Análisis
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SaleAnalyzer;
