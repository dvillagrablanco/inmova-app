'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Calculator,
  TrendingUp,
  Euro,
  Home,
  PiggyBank,
  Clock,
  ArrowRight,
  Info,
  Building2,
} from 'lucide-react';
import { calculateRentalYield, RentalYieldInput, RentalYieldOutput } from '@/lib/calculators/rental-yield-calculator';

export function RentalYieldCalculator() {
  const [hasFinancing, setHasFinancing] = useState(false);
  const [result, setResult] = useState<RentalYieldOutput | null>(null);
  
  const [formData, setFormData] = useState({
    purchasePrice: 150000,
    renovationCost: 10000,
    closingCosts: 15000,
    monthlyRent: 900,
    ibi: 600,
    communityFees: 50,
    insurance: 200,
    maintenanceReserve: 5,
    managementFee: 0,
    vacancyRate: 5,
    loanAmount: 100000,
    interestRate: 3.5,
    termYears: 25,
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const calculate = () => {
    const input: RentalYieldInput = {
      purchasePrice: formData.purchasePrice,
      renovationCost: formData.renovationCost,
      closingCosts: formData.closingCosts,
      monthlyRent: formData.monthlyRent,
      annualExpenses: {
        ibi: formData.ibi,
        communityFees: formData.communityFees,
        insurance: formData.insurance,
        maintenanceReserve: formData.maintenanceReserve,
        managementFee: formData.managementFee,
        vacancyRate: formData.vacancyRate,
      },
      financing: hasFinancing ? {
        loanAmount: formData.loanAmount,
        interestRate: formData.interestRate,
        termYears: formData.termYears,
      } : undefined,
    };
    
    const output = calculateRentalYield(input);
    setResult(output);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Calculadora de Rentabilidad de Alquiler
          </CardTitle>
          <CardDescription>
            Calcula la rentabilidad bruta, neta, cashflow y ROI de tu inversión inmobiliaria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="property">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="property">Inmueble</TabsTrigger>
              <TabsTrigger value="expenses">Gastos</TabsTrigger>
              <TabsTrigger value="financing">Financiación</TabsTrigger>
            </TabsList>
            
            <TabsContent value="property" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Precio de compra (€)</Label>
                  <Input
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) => handleChange('purchasePrice', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Coste reforma (€)</Label>
                  <Input
                    type="number"
                    value={formData.renovationCost}
                    onChange={(e) => handleChange('renovationCost', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gastos de compra (€)</Label>
                  <Input
                    type="number"
                    value={formData.closingCosts}
                    onChange={(e) => handleChange('closingCosts', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">ITP/IVA, notaría, registro, gestoría</p>
                </div>
                <div className="space-y-2">
                  <Label>Alquiler mensual (€)</Label>
                  <Input
                    type="number"
                    value={formData.monthlyRent}
                    onChange={(e) => handleChange('monthlyRent', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="expenses" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>IBI anual (€)</Label>
                  <Input
                    type="number"
                    value={formData.ibi}
                    onChange={(e) => handleChange('ibi', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Comunidad mensual (€)</Label>
                  <Input
                    type="number"
                    value={formData.communityFees}
                    onChange={(e) => handleChange('communityFees', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Seguro hogar anual (€)</Label>
                  <Input
                    type="number"
                    value={formData.insurance}
                    onChange={(e) => handleChange('insurance', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reserva mantenimiento (%)</Label>
                  <Input
                    type="number"
                    value={formData.maintenanceReserve}
                    onChange={(e) => handleChange('maintenanceReserve', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gestión/Administración (%)</Label>
                  <Input
                    type="number"
                    value={formData.managementFee}
                    onChange={(e) => handleChange('managementFee', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">0 si gestionas tú mismo</p>
                </div>
                <div className="space-y-2">
                  <Label>Tasa de vacío (%)</Label>
                  <Input
                    type="number"
                    value={formData.vacancyRate}
                    onChange={(e) => handleChange('vacancyRate', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">5% ≈ 18 días/año</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="financing" className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <PiggyBank className="h-5 w-5" />
                  <Label>¿Usas financiación?</Label>
                </div>
                <Switch checked={hasFinancing} onCheckedChange={setHasFinancing} />
              </div>
              
              {hasFinancing && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Importe préstamo (€)</Label>
                    <Input
                      type="number"
                      value={formData.loanAmount}
                      onChange={(e) => handleChange('loanAmount', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo interés (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.interestRate}
                      onChange={(e) => handleChange('interestRate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Plazo (años)</Label>
                    <Input
                      type="number"
                      value={formData.termYears}
                      onChange={(e) => handleChange('termYears', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <Button onClick={calculate} className="w-full mt-6" size="lg">
            <Calculator className="h-4 w-4 mr-2" />
            Calcular Rentabilidad
          </Button>
        </CardContent>
      </Card>
      
      {result && (
        <Card className="border-primary">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Resultados del Análisis
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {/* KPIs principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Rent. Bruta</p>
                <p className="text-2xl font-bold text-green-600">{result.grossYield}%</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Rent. Neta</p>
                <p className="text-2xl font-bold text-blue-600">{result.netYield}%</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Cash on Cash</p>
                <p className="text-2xl font-bold text-purple-600">{result.cashOnCashReturn}%</p>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Cap Rate</p>
                <p className="text-2xl font-bold text-amber-600">{result.capRate}%</p>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            {/* Cashflow */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  Flujo de Caja
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cashflow mensual</span>
                    <span className={`font-semibold ${result.monthlyCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(result.monthlyCashflow)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cashflow anual</span>
                    <span className={`font-semibold ${result.annualCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(result.annualCashflow)}
                    </span>
                  </div>
                  {result.monthlyMortgage && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cuota hipoteca</span>
                      <span className="font-semibold text-amber-600">
                        {formatCurrency(result.monthlyMortgage)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recuperación
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Capital invertido</span>
                    <span className="font-semibold">{formatCurrency(result.cashInvested)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Años para recuperar</span>
                    <span className="font-semibold">
                      {result.paybackYears === Infinity ? '∞' : `${result.paybackYears} años`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            {/* Desglose de gastos */}
            <div>
              <h4 className="font-semibold mb-4">Desglose de Gastos Anuales</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span>IBI</span>
                  <span>{formatCurrency(result.expenseBreakdown.ibi)}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span>Comunidad</span>
                  <span>{formatCurrency(result.expenseBreakdown.community)}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span>Seguro</span>
                  <span>{formatCurrency(result.expenseBreakdown.insurance)}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span>Mantenimiento</span>
                  <span>{formatCurrency(result.expenseBreakdown.maintenance)}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span>Gestión</span>
                  <span>{formatCurrency(result.expenseBreakdown.management)}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span>Vacío</span>
                  <span>{formatCurrency(result.expenseBreakdown.vacancy)}</span>
                </div>
              </div>
              <div className="flex justify-between p-3 bg-primary/10 rounded mt-2 font-semibold">
                <span>Total Gastos Anuales</span>
                <span>{formatCurrency(result.expenseBreakdown.total)}</span>
              </div>
            </div>
            
            {/* Indicador visual */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Calidad de la inversión</span>
                <Badge variant={result.netYield >= 5 ? 'default' : result.netYield >= 3 ? 'secondary' : 'destructive'}>
                  {result.netYield >= 5 ? 'Excelente' : result.netYield >= 3 ? 'Buena' : 'Revisar'}
                </Badge>
              </div>
              <Progress 
                value={Math.min(result.netYield * 10, 100)} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Una rentabilidad neta superior al 5% se considera excelente para alquiler tradicional
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
