'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  Info,
  Calculator,
  PieChart,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  Home,
  Warehouse,
  Package,
  Building
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Tipos de activos
type AssetType = 'piso' | 'local' | 'garaje' | 'trastero' | 'edificio';

interface InvestmentData {
  // Tipo de activo
  assetType: AssetType;
  
  // CAPEX (Inversión Inicial)
  purchasePrice: number;
  notaryAndRegistry: number;
  transferTax: number; // ITP o IVA
  agencyFees: number;
  renovationCosts: number;
  furnitureCosts: number;
  initialLegalFees: number;
  otherInitialCosts: number;
  
  // Financiación
  isFinanced: boolean;
  loanAmount: number;
  interestRate: number;
  loanTerm: number; // años
  downPayment: number;
  
  // OPEX (Gastos Operativos Recurrentes)
  monthlyRent: number;
  communityFees: number; // Comunidad de propietarios
  propertyTax: number; // IBI anual
  insurance: number; // Seguro anual
  maintenanceRate: number; // % del valor para mantenimiento anual
  propertyManagementFee: number; // % de la renta
  vacancyRate: number; // % de vacancia esperada
  
  // Impuestos
  incomeTaxRate: number; // IRPF %
  capitalGainsTaxRate: number; // Plusvalía %
  wealthTaxApplicable: boolean;
  
  // Proyecciones
  appreciationRate: number; // Revalorización anual %
  rentIncreaseRate: number; // Incremento renta anual %
  inflationRate: number; // Inflación anual %
  holdingPeriod: number; // Años de inversión
}

interface InvestmentResults {
  // CAPEX Total
  totalCapex: number;
  ownCapital: number;
  
  // Cash Flow Anual
  grossAnnualIncome: number;
  effectiveAnnualIncome: number;
  totalAnnualOpex: number;
  mortgagePayment: number;
  annualTaxes: number;
  netOperatingIncome: number;
  netCashFlow: number;
  
  // Métricas de Rentabilidad
  grossYield: number; // Rentabilidad bruta
  netYield: number; // Rentabilidad neta
  roi: number;
  cashOnCash: number;
  capRate: number;
  
  // Análisis de Préstamo
  monthlyMortgage: number;
  totalInterestPaid: number;
  loanToValue: number;
  debtServiceCoverageRatio: number;
  
  // Proyecciones
  futurePropertyValue: number;
  totalEquityGain: number;
  cumulativeCashFlow: number;
  totalReturn: number;
  irr: number; // Tasa Interna de Retorno
  paybackPeriod: number;
  breakEvenOccupancy: number;
  
  // Análisis de Riesgos
  recommendation: 'excellent' | 'good' | 'acceptable' | 'risky' | 'not_recommended';
  riskFactors: string[];
  strengths: string[];
}

const assetTypeConfig = {
  piso: { icon: Home, label: 'Piso/Apartamento', color: 'blue' },
  local: { icon: Building2, label: 'Local Comercial', color: 'purple' },
  garaje: { icon: Warehouse, label: 'Plaza de Garaje', color: 'green' },
  trastero: { icon: Package, label: 'Trastero', color: 'orange' },
  edificio: { icon: Building, label: 'Edificio Completo', color: 'red' },
};

export function InvestmentAnalyzer() {
  const [data, setData] = useState<InvestmentData>({
    assetType: 'piso',
    purchasePrice: 200000,
    notaryAndRegistry: 2000,
    transferTax: 20000, // 10% ITP típico
    agencyFees: 4000,
    renovationCosts: 15000,
    furnitureCosts: 5000,
    initialLegalFees: 1000,
    otherInitialCosts: 2000,
    
    isFinanced: true,
    loanAmount: 160000, // 80% LTV
    interestRate: 3.5,
    loanTerm: 25,
    downPayment: 40000,
    
    monthlyRent: 1200,
    communityFees: 80,
    propertyTax: 500,
    insurance: 300,
    maintenanceRate: 1, // 1% anual
    propertyManagementFee: 0, // Si gestionas tú
    vacancyRate: 5,
    
    incomeTaxRate: 21, // IRPF sobre rentas
    capitalGainsTaxRate: 19,
    wealthTaxApplicable: false,
    
    appreciationRate: 3,
    rentIncreaseRate: 2,
    inflationRate: 2.5,
    holdingPeriod: 10,
  });

  const [results, setResults] = useState<InvestmentResults | null>(null);

  useEffect(() => {
    calculateInvestment();
  }, [data]);

  const calculateInvestment = () => {
    // CAPEX TOTAL
    const totalCapex = 
      data.purchasePrice +
      data.notaryAndRegistry +
      data.transferTax +
      data.agencyFees +
      data.renovationCosts +
      data.furnitureCosts +
      data.initialLegalFees +
      data.otherInitialCosts;

    const ownCapital = data.isFinanced ? data.downPayment + (totalCapex - data.purchasePrice) : totalCapex;

    // FINANCIACIÓN
    const monthlyInterestRate = data.interestRate / 100 / 12;
    const numberOfPayments = data.loanTerm * 12;
    const monthlyMortgage = data.isFinanced
      ? (data.loanAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
        (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1)
      : 0;
    const annualMortgage = monthlyMortgage * 12;
    const totalInterestPaid = data.isFinanced ? (monthlyMortgage * numberOfPayments - data.loanAmount) : 0;
    const loanToValue = data.isFinanced ? (data.loanAmount / data.purchasePrice) * 100 : 0;

    // INGRESOS
    const grossAnnualIncome = data.monthlyRent * 12;
    const effectiveAnnualIncome = grossAnnualIncome * (1 - data.vacancyRate / 100);

    // OPEX
    const annualCommunityFees = data.communityFees * 12;
    const annualMaintenance = data.purchasePrice * (data.maintenanceRate / 100);
    const propertyManagement = effectiveAnnualIncome * (data.propertyManagementFee / 100);
    const totalAnnualOpex = 
      annualCommunityFees +
      data.propertyTax +
      data.insurance +
      annualMaintenance +
      propertyManagement;

    // NOI (Net Operating Income)
    const netOperatingIncome = effectiveAnnualIncome - totalAnnualOpex;

    // IMPUESTOS
    const taxableIncome = netOperatingIncome - (monthlyMortgage * 12 * 0.5); // Simplificación: 50% de intereses deducibles
    const annualTaxes = Math.max(0, taxableIncome * (data.incomeTaxRate / 100));

    // CASH FLOW NETO
    const netCashFlow = netOperatingIncome - annualMortgage - annualTaxes;

    // MÉTRICAS DE RENTABILIDAD
    const grossYield = (grossAnnualIncome / data.purchasePrice) * 100;
    const netYield = (netCashFlow / ownCapital) * 100;
    const roi = (netOperatingIncome / totalCapex) * 100;
    const cashOnCash = (netCashFlow / ownCapital) * 100;
    const capRate = (netOperatingIncome / data.purchasePrice) * 100;

    // DSCR (Debt Service Coverage Ratio)
    const debtServiceCoverageRatio = data.isFinanced ? netOperatingIncome / annualMortgage : 0;

    // PROYECCIONES A LARGO PLAZO
    let cumulativeCashFlow = 0;
    let projectedRent = effectiveAnnualIncome;
    let projectedOpex = totalAnnualOpex;
    
    for (let year = 1; year <= data.holdingPeriod; year++) {
      const yearlyNOI = projectedRent - projectedOpex;
      const yearlyTaxes = Math.max(0, (yearlyNOI - annualMortgage * 0.5) * (data.incomeTaxRate / 100));
      const yearlyCashFlow = yearlyNOI - annualMortgage - yearlyTaxes;
      cumulativeCashFlow += yearlyCashFlow;
      
      // Incrementar para próximo año
      projectedRent *= (1 + data.rentIncreaseRate / 100);
      projectedOpex *= (1 + data.inflationRate / 100);
    }

    const futurePropertyValue = data.purchasePrice * Math.pow(1 + data.appreciationRate / 100, data.holdingPeriod);
    const remainingLoan = data.isFinanced 
      ? data.loanAmount * Math.pow(1 + monthlyInterestRate, numberOfPayments) - 
        monthlyMortgage * ((Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1) / monthlyInterestRate)
      : 0;
    const totalEquityGain = futurePropertyValue - data.purchasePrice - remainingLoan;
    
    // Capital gains tax on sale
    const capitalGainsTax = Math.max(0, (futurePropertyValue - data.purchasePrice) * (data.capitalGainsTaxRate / 100));
    const netEquityGain = totalEquityGain - capitalGainsTax;
    
    const totalReturn = ((netEquityGain + cumulativeCashFlow) / ownCapital) * 100;
    const irr = calculateIRR(ownCapital, netCashFlow, data.holdingPeriod, futurePropertyValue - remainingLoan - capitalGainsTax);
    const paybackPeriod = netCashFlow > 0 ? ownCapital / netCashFlow : Infinity;
    
    // Break-even occupancy
    const breakEvenOccupancy = ((totalAnnualOpex + annualMortgage) / grossAnnualIncome) * 100;

    // ANÁLISIS DE RIESGOS Y RECOMENDACIÓN
    const riskFactors: string[] = [];
    const strengths: string[] = [];
    
    if (capRate < 4) riskFactors.push('Cap Rate bajo (<4%)');
    if (capRate >= 6) strengths.push('Cap Rate atractivo (≥6%)');
    
    if (cashOnCash < 5) riskFactors.push('Cash-on-Cash bajo (<5%)');
    if (cashOnCash >= 10) strengths.push('Excelente Cash-on-Cash (≥10%)');
    
    if (debtServiceCoverageRatio < 1.25 && data.isFinanced) riskFactors.push('DSCR bajo - riesgo de impago');
    if (debtServiceCoverageRatio >= 1.5 && data.isFinanced) strengths.push('DSCR saludable (≥1.5)');
    
    if (loanToValue > 80) riskFactors.push('LTV alto (>80%)');
    if (loanToValue <= 70 && data.isFinanced) strengths.push('LTV conservador (≤70%)');
    
    if (breakEvenOccupancy > 70) riskFactors.push('Break-even alto - poco margen de error');
    if (breakEvenOccupancy < 60) strengths.push('Buen margen de seguridad en ocupación');
    
    if (netCashFlow < 0) riskFactors.push('Cash Flow negativo');
    if (netCashFlow > ownCapital * 0.08) strengths.push('Cash Flow positivo y saludable');

    let recommendation: InvestmentResults['recommendation'];
    if (riskFactors.length === 0 && strengths.length >= 3 && cashOnCash >= 10) {
      recommendation = 'excellent';
    } else if (riskFactors.length <= 1 && cashOnCash >= 7) {
      recommendation = 'good';
    } else if (riskFactors.length <= 2 && netCashFlow > 0) {
      recommendation = 'acceptable';
    } else if (riskFactors.length <= 3 && netCashFlow > 0) {
      recommendation = 'risky';
    } else {
      recommendation = 'not_recommended';
    }

    setResults({
      totalCapex,
      ownCapital,
      grossAnnualIncome,
      effectiveAnnualIncome,
      totalAnnualOpex,
      mortgagePayment: annualMortgage,
      annualTaxes,
      netOperatingIncome,
      netCashFlow,
      grossYield,
      netYield,
      roi,
      cashOnCash,
      capRate,
      monthlyMortgage,
      totalInterestPaid,
      loanToValue,
      debtServiceCoverageRatio,
      futurePropertyValue,
      totalEquityGain: netEquityGain,
      cumulativeCashFlow,
      totalReturn,
      irr,
      paybackPeriod,
      breakEvenOccupancy,
      recommendation,
      riskFactors,
      strengths,
    });
  };

  // Cálculo simplificado de TIR (IRR)
  const calculateIRR = (
    initialInvestment: number,
    annualCashFlow: number,
    years: number,
    finalValue: number
  ): number => {
    // Método simplificado de aproximación
    let rate = 0.1; // Estimación inicial 10%
    const tolerance = 0.0001;
    let iteration = 0;
    const maxIterations = 100;

    while (iteration < maxIterations) {
      let npv = -initialInvestment;
      for (let year = 1; year <= years; year++) {
        npv += annualCashFlow / Math.pow(1 + rate, year);
      }
      npv += finalValue / Math.pow(1 + rate, years);

      if (Math.abs(npv) < tolerance) break;

      const derivative = years * finalValue / Math.pow(1 + rate, years + 1);
      rate = rate - npv / derivative;
      iteration++;
    }

    return rate * 100;
  };

  const updateData = <K extends keyof InvestmentData>(field: K, value: InvestmentData[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const AssetIcon = assetTypeConfig[data.assetType].icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-t-4 border-t-indigo-600">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <AssetIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-2xl">Análisis de Inversión Inmobiliaria</CardTitle>
                <CardDescription className="text-base">
                  Evaluación completa de CAPEX, OPEX, Financiación y Rentabilidad
                </CardDescription>
              </div>
            </div>
            {results && (
              <Badge 
                variant={
                  results.recommendation === 'excellent' ? 'default' :
                  results.recommendation === 'good' ? 'secondary' :
                  results.recommendation === 'acceptable' ? 'outline' :
                  'destructive'
                }
                className="text-lg px-4 py-2"
              >
                {results.recommendation === 'excellent' && '⭐ Excelente'}
                {results.recommendation === 'good' && '✓ Buena'}
                {results.recommendation === 'acceptable' && '~ Aceptable'}
                {results.recommendation === 'risky' && '⚠ Riesgosa'}
                {results.recommendation === 'not_recommended' && '✗ No Recomendada'}
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Básico</TabsTrigger>
          <TabsTrigger value="capex">CAPEX</TabsTrigger>
          <TabsTrigger value="opex">OPEX</TabsTrigger>
          <TabsTrigger value="financing">Financiación</TabsTrigger>
          <TabsTrigger value="taxes">Impuestos</TabsTrigger>
        </TabsList>

        {/* TAB 1: BÁSICO */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo de Activo</Label>
                  <Select 
                    value={data.assetType} 
                    onValueChange={(value: AssetType) => updateData('assetType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(assetTypeConfig).map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {config.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchase-price">Precio de Compra (€)</Label>
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
                  <Label htmlFor="monthly-rent">Renta Mensual Esperada (€)</Label>
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
                  <Label htmlFor="holding-period">Período de Inversión (años)</Label>
                  <Input
                    id="holding-period"
                    type="number"
                    min="1"
                    max="50"
                    value={data.holdingPeriod}
                    onChange={(e) => updateData('holdingPeriod', parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: CAPEX */}
        <TabsContent value="capex" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                CAPEX - Inversión Inicial
              </CardTitle>
              <CardDescription>
                Todos los costos iniciales de adquisición y puesta en marcha
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Notaría y Registro (€)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={data.notaryAndRegistry}
                    onChange={(e) => updateData('notaryAndRegistry', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Impuesto de Transmisión (ITP/IVA) (€)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="inline h-4 w-4 ml-1" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>ITP: 6-10% (segunda mano)</p>
                          <p>IVA: 10% + AJD 1.5% (obra nueva)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={data.transferTax}
                    onChange={(e) => updateData('transferTax', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Comisión de Agencia (€)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={data.agencyFees}
                    onChange={(e) => updateData('agencyFees', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Costos de Renovación (€)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={data.renovationCosts}
                    onChange={(e) => updateData('renovationCosts', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mobiliario y Equipamiento (€)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={data.furnitureCosts}
                    onChange={(e) => updateData('furnitureCosts', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Asesoría Legal Inicial (€)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={data.initialLegalFees}
                    onChange={(e) => updateData('initialLegalFees', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Otros Costos Iniciales (€)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={data.otherInitialCosts}
                    onChange={(e) => updateData('otherInitialCosts', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {results && (
                <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">CAPEX Total:</span>
                    <span className="text-2xl font-bold text-indigo-600">
                      €{results.totalCapex.toLocaleString()}
                    </span>
                  </div>
                  <Progress 
                    value={(results.totalCapex / (results.totalCapex * 1.2)) * 100} 
                    className="h-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: OPEX */}
        <TabsContent value="opex" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                OPEX - Gastos Operativos Recurrentes
              </CardTitle>
              <CardDescription>
                Gastos mensuales y anuales de operación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Gastos de Comunidad (€/mes)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={data.communityFees}
                    onChange={(e) => updateData('communityFees', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>IBI - Impuesto sobre Bienes Inmuebles (€/año)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={data.propertyTax}
                    onChange={(e) => updateData('propertyTax', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Seguro de Hogar/Local (€/año)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={data.insurance}
                    onChange={(e) => updateData('insurance', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mantenimiento (% valor anual)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={data.maintenanceRate}
                    onChange={(e) => updateData('maintenanceRate', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Gestión de Propiedad (% de renta)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={data.propertyManagementFee}
                    onChange={(e) => updateData('propertyManagementFee', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tasa de Vacancia (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={data.vacancyRate}
                    onChange={(e) => updateData('vacancyRate', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {results && (
                <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">OPEX Total Anual:</span>
                    <span className="text-xl font-bold text-orange-600">
                      €{results.totalAnnualOpex.toLocaleString()}/año
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: FINANCIACIÓN */}
        <TabsContent value="financing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Financiación Hipotecaria
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
                <input
                  type="checkbox"
                  id="is-financed"
                  checked={data.isFinanced}
                  onChange={(e) => updateData('isFinanced', e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="is-financed" className="font-medium cursor-pointer">
                  ¿Financiar con Hipoteca?
                </Label>
              </div>

              {data.isFinanced && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Capital Propio / Entrada (€)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={data.downPayment}
                      onChange={(e) => {
                        const down = parseFloat(e.target.value) || 0;
                        updateData('downPayment', down);
                        updateData('loanAmount', data.purchasePrice - down);
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Monto del Préstamo (€)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={data.loanAmount}
                      onChange={(e) => {
                        const loan = parseFloat(e.target.value) || 0;
                        updateData('loanAmount', loan);
                        updateData('downPayment', data.purchasePrice - loan);
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tasa de Interés Anual (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="20"
                      step="0.1"
                      value={data.interestRate}
                      onChange={(e) => updateData('interestRate', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Plazo del Préstamo (años)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="40"
                      value={data.loanTerm}
                      onChange={(e) => updateData('loanTerm', parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>
              )}

              {results && data.isFinanced && (
                <div className="mt-6 space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Cuota Mensual:</span>
                      <span className="font-bold text-blue-600">
                        €{results.monthlyMortgage.toFixed(2)}/mes
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">LTV (Loan-to-Value):</span>
                      <span className="font-semibold">{results.loanToValue.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Intereses Totales:</span>
                      <span className="font-semibold text-red-600">
                        €{results.totalInterestPaid.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">DSCR (Debt Service Coverage):</span>
                      <span className={`font-bold ${
                        results.debtServiceCoverageRatio >= 1.5 ? 'text-green-600' :
                        results.debtServiceCoverageRatio >= 1.25 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {results.debtServiceCoverageRatio.toFixed(2)}x
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: IMPUESTOS */}
        <TabsContent value="taxes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Impuestos y Proyecciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    IRPF sobre Rentas (%)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="inline h-4 w-4 ml-1" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Típicamente 19-23% según tramo</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    step="1"
                    value={data.incomeTaxRate}
                    onChange={(e) => updateData('incomeTaxRate', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Plusvalía/Ganancia de Capital (%)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="inline h-4 w-4 ml-1" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Típicamente 19-23% según ganancia</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    step="1"
                    value={data.capitalGainsTaxRate}
                    onChange={(e) => updateData('capitalGainsTaxRate', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Apreciación Anual del Inmueble (%)</Label>
                  <Input
                    type="number"
                    min="-10"
                    max="20"
                    step="0.5"
                    value={data.appreciationRate}
                    onChange={(e) => updateData('appreciationRate', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Incremento Anual de Renta (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={data.rentIncreaseRate}
                    onChange={(e) => updateData('rentIncreaseRate', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Inflación Esperada (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={data.inflationRate}
                    onChange={(e) => updateData('inflationRate', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* RESULTADOS */}
      {results && (
        <>
          {/* Métricas Principales */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* ROI */}
            <Card className="border-t-4 border-t-indigo-500">
              <CardHeader>
                <CardTitle className="text-lg">ROI Anual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-indigo-600">
                  {results.roi.toFixed(2)}%
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Retorno sobre Inversión Total
                </p>
              </CardContent>
            </Card>

            {/* Cash-on-Cash */}
            <Card className="border-t-4 border-t-green-500">
              <CardHeader>
                <CardTitle className="text-lg">Cash-on-Cash</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-600">
                  {results.cashOnCash.toFixed(2)}%
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Retorno sobre Capital Propio
                </p>
              </CardContent>
            </Card>

            {/* Cap Rate */}
            <Card className="border-t-4 border-t-blue-500">
              <CardHeader>
                <CardTitle className="text-lg">Cap Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-blue-600">
                  {results.capRate.toFixed(2)}%
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Tasa de Capitalización
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Análisis Detallado */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Cash Flow Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Análisis de Cash Flow Anual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Ingresos Brutos:</span>
                  <span className="font-semibold text-green-600">
                    +€{results.grossAnnualIncome.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Ingresos Efectivos:</span>
                  <span className="font-semibold text-green-500">
                    +€{results.effectiveAnnualIncome.toLocaleString()}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm">OPEX:</span>
                  <span className="font-semibold text-orange-600">
                    -€{results.totalAnnualOpex.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pago Hipoteca:</span>
                  <span className="font-semibold text-red-600">
                    -€{results.mortgagePayment.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Impuestos:</span>
                  <span className="font-semibold text-red-500">
                    -€{results.annualTaxes.toLocaleString()}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold">NOI:</span>
                  <span className="font-bold text-lg text-blue-600">
                    €{results.netOperatingIncome.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t-2">
                  <span className="font-bold">Cash Flow Neto:</span>
                  <span className={`font-bold text-xl ${
                    results.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    €{results.netCashFlow.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  €{(results.netCashFlow / 12).toFixed(2)}/mes
                </p>
              </CardContent>
            </Card>

            {/* Proyección a Largo Plazo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Proyección a {data.holdingPeriod} años
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Valor Futuro Inmueble:</span>
                  <span className="font-semibold">
                    €{results.futurePropertyValue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Ganancia de Capital (neta):</span>
                  <span className="font-semibold text-green-600">
                    +€{results.totalEquityGain.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Cash Flow Acumulado:</span>
                  <span className="font-semibold text-blue-600">
                    +€{results.cumulativeCashFlow.toLocaleString()}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center pt-2 border-t-2">
                  <span className="font-bold">Retorno Total:</span>
                  <span className="font-bold text-xl text-green-600">
                    {results.totalReturn.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">TIR (IRR):</span>
                  <span className="font-semibold">{results.irr.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Payback Period:</span>
                  <span className="font-semibold">
                    {results.paybackPeriod === Infinity ? 'N/A' : `${results.paybackPeriod.toFixed(1)} años`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Break-Even Ocupación:</span>
                  <span className={`font-semibold ${
                    results.breakEvenOccupancy > 80 ? 'text-red-600' :
                    results.breakEvenOccupancy > 70 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {results.breakEvenOccupancy.toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Análisis de Riesgo */}
          <Card className={`border-t-4 ${
            results.recommendation === 'excellent' ? 'border-t-green-500' :
            results.recommendation === 'good' ? 'border-t-blue-500' :
            results.recommendation === 'acceptable' ? 'border-t-yellow-500' :
            'border-t-red-500'
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Análisis de Riesgo y Recomendación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Fortalezas */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Fortalezas ({results.strengths.length})
                  </h4>
                  {results.strengths.length > 0 ? (
                    <ul className="space-y-1">
                      {results.strengths.map((strength, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No se identificaron fortalezas destacables</p>
                  )}
                </div>

                {/* Factores de Riesgo */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Factores de Riesgo ({results.riskFactors.length})
                  </h4>
                  {results.riskFactors.length > 0 ? (
                    <ul className="space-y-1">
                      {results.riskFactors.map((risk, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-red-600">⚠</span>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No se identificaron riesgos significativos</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Recomendación Final */}
              <div className={`p-4 rounded-lg ${
                results.recommendation === 'excellent' ? 'bg-green-50 dark:bg-green-950' :
                results.recommendation === 'good' ? 'bg-blue-50 dark:bg-blue-950' :
                results.recommendation === 'acceptable' ? 'bg-yellow-50 dark:bg-yellow-950' :
                'bg-red-50 dark:bg-red-950'
              }`}>
                <h4 className={`font-bold text-lg mb-2 ${
                  results.recommendation === 'excellent' ? 'text-green-700 dark:text-green-400' :
                  results.recommendation === 'good' ? 'text-blue-700 dark:text-blue-400' :
                  results.recommendation === 'acceptable' ? 'text-yellow-700 dark:text-yellow-400' :
                  'text-red-700 dark:text-red-400'
                }`}>
                  Recomendación Final:
                </h4>
                <p className="text-sm">
                  {results.recommendation === 'excellent' && (
                    '⭐ Esta es una excelente inversión con métricas sólidas, bajo riesgo y alto potencial de retorno. Se recomienda proceder con la adquisición.'
                  )}
                  {results.recommendation === 'good' && (
                    '✓ Esta es una buena inversión con métricas positivas y riesgo controlado. Se recomienda proceder, considerando los factores de riesgo identificados.'
                  )}
                  {results.recommendation === 'acceptable' && (
                    '~ Esta inversión es aceptable pero presenta algunos riesgos. Se recomienda revisar y optimizar los números antes de proceder.'
                  )}
                  {results.recommendation === 'risky' && (
                    '⚠ Esta inversión presenta riesgos significativos. Se recomienda precaución y análisis adicional antes de proceder.'
                  )}
                  {results.recommendation === 'not_recommended' && (
                    '✗ Esta inversión NO es recomendable en las condiciones actuales. Los números no son favorables y el riesgo es alto.'
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <Button className="flex-1" onClick={() => window.print()}>
                  <FileText className="h-4 w-4 mr-2" />
                  Generar Reporte PDF
                </Button>
                <Button variant="outline" className="flex-1">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Comparar con Otras Inversiones
                </Button>
                <Button variant="outline" className="flex-1">
                  💾 Guardar Análisis
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default InvestmentAnalyzer;
