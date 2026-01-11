'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calculator,
  Building,
  Euro,
  Calendar,
  TrendingDown,
  PiggyBank,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { calculateMortgage, MortgageInput, MortgageOutput } from '@/lib/calculators/mortgage-calculator';

export function MortgageCalculator() {
  const [result, setResult] = useState<MortgageOutput | null>(null);
  const [showAmortization, setShowAmortization] = useState(false);
  
  const [formData, setFormData] = useState({
    propertyPrice: 200000,
    downPaymentPercent: 20,
    interestRate: 3.5,
    termYears: 25,
    type: 'FIXED' as const,
    euribor: 3.0,
    differential: 0.8,
    fixedPeriodYears: 10,
    openingFee: 0.5,
    appraisalCost: 350,
    notaryCost: 800,
    agencyCost: 400,
  });

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? (parseFloat(value) || 0) : value,
    }));
  };

  const calculate = () => {
    const input: MortgageInput = {
      ...formData,
    };
    
    const output = calculateMortgage(input);
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
            <Building className="h-5 w-5 text-primary" />
            Calculadora de Hipoteca
          </CardTitle>
          <CardDescription>
            Simula tu hipoteca: cuotas, TAE y tabla de amortización completa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Datos Básicos</TabsTrigger>
              <TabsTrigger value="costs">Gastos Iniciales</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Precio del inmueble (€)</Label>
                  <Input
                    type="number"
                    value={formData.propertyPrice}
                    onChange={(e) => handleChange('propertyPrice', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Entrada (%)</Label>
                  <Input
                    type="number"
                    value={formData.downPaymentPercent}
                    onChange={(e) => handleChange('downPaymentPercent', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Entrada: {formatCurrency(formData.propertyPrice * formData.downPaymentPercent / 100)}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Tipo de hipoteca</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v: any) => handleChange('type', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Tipo Fijo</SelectItem>
                    <SelectItem value="VARIABLE">Tipo Variable</SelectItem>
                    <SelectItem value="MIXED">Tipo Mixto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.type === 'FIXED' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de interés fijo (%)</Label>
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
              
              {formData.type === 'VARIABLE' && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Euribor actual (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.euribor}
                      onChange={(e) => handleChange('euribor', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Diferencial (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.differential}
                      onChange={(e) => handleChange('differential', e.target.value)}
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
              
              {formData.type === 'MIXED' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo fijo inicial (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.interestRate}
                      onChange={(e) => handleChange('interestRate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Años a tipo fijo</Label>
                    <Input
                      type="number"
                      value={formData.fixedPeriodYears}
                      onChange={(e) => handleChange('fixedPeriodYears', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Diferencial posterior (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.differential}
                      onChange={(e) => handleChange('differential', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Plazo total (años)</Label>
                    <Input
                      type="number"
                      value={formData.termYears}
                      onChange={(e) => handleChange('termYears', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="costs" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Comisión apertura (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.openingFee}
                    onChange={(e) => handleChange('openingFee', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tasación (€)</Label>
                  <Input
                    type="number"
                    value={formData.appraisalCost}
                    onChange={(e) => handleChange('appraisalCost', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notaría (€)</Label>
                  <Input
                    type="number"
                    value={formData.notaryCost}
                    onChange={(e) => handleChange('notaryCost', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gestoría (€)</Label>
                  <Input
                    type="number"
                    value={formData.agencyCost}
                    onChange={(e) => handleChange('agencyCost', e.target.value)}
                  />
                </div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                <p className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  Desde 2019, el banco paga el AJD de la hipoteca
                </p>
              </div>
            </TabsContent>
          </Tabs>
          
          <Button onClick={calculate} className="w-full mt-6" size="lg">
            <Calculator className="h-4 w-4 mr-2" />
            Calcular Hipoteca
          </Button>
        </CardContent>
      </Card>
      
      {result && (
        <Card className="border-primary">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5 text-primary" />
              Resultado de la Simulación
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Cuota mensual destacada */}
            <div className="text-center p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl mb-6">
              <p className="text-sm text-muted-foreground mb-1">Cuota mensual</p>
              <p className="text-4xl font-bold text-primary">{formatCurrency(result.monthlyPayment)}</p>
              <p className="text-sm text-muted-foreground mt-2">
                LTV: {result.ltv}% • Préstamo: {formatCurrency(result.loanAmount)}
              </p>
            </div>
            
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Entrada</p>
                <p className="text-lg font-semibold">{formatCurrency(result.downPayment)}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Préstamo</p>
                <p className="text-lg font-semibold">{formatCurrency(result.loanAmount)}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Total Intereses</p>
                <p className="text-lg font-semibold text-amber-600">{formatCurrency(result.totalInterest)}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground">TAE</p>
                <p className="text-lg font-semibold">{result.tae}%</p>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            {/* Resumen de costes */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gastos iniciales</span>
                  <span>{formatCurrency(result.initialCosts)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pago total préstamo</span>
                  <span>{formatCurrency(result.totalPayment)}</span>
                </div>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
                <p className="text-sm text-muted-foreground">Coste total real</p>
                <p className="text-xl font-bold text-amber-600">{formatCurrency(result.totalRealCost)}</p>
              </div>
            </div>
            
            {/* Tabla de amortización */}
            <div className="border rounded-lg">
              <Button
                variant="ghost"
                className="w-full flex items-center justify-between p-4"
                onClick={() => setShowAmortization(!showAmortization)}
              >
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Tabla de Amortización por Años
                </span>
                {showAmortization ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              
              {showAmortization && (
                <ScrollArea className="h-[300px]">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="text-left p-2">Año</th>
                        <th className="text-right p-2">Capital</th>
                        <th className="text-right p-2">Intereses</th>
                        <th className="text-right p-2">Pendiente</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.yearlyBreakdown.map((year) => (
                        <tr key={year.year} className="border-t">
                          <td className="p-2">{year.year}</td>
                          <td className="text-right p-2">{formatCurrency(year.principal)}</td>
                          <td className="text-right p-2 text-amber-600">{formatCurrency(year.interest)}</td>
                          <td className="text-right p-2">{formatCurrency(year.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              )}
            </div>
            
            {/* Gráfico visual de progreso */}
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Capital vs Intereses</span>
                <span>{Math.round((result.loanAmount / result.totalPayment) * 100)}% / {Math.round((result.totalInterest / result.totalPayment) * 100)}%</span>
              </div>
              <div className="flex h-4 rounded-full overflow-hidden">
                <div 
                  className="bg-primary"
                  style={{ width: `${(result.loanAmount / result.totalPayment) * 100}%` }}
                />
                <div 
                  className="bg-amber-500"
                  style={{ width: `${(result.totalInterest / result.totalPayment) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  Capital: {formatCurrency(result.loanAmount)}
                </span>
                <span className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  Intereses: {formatCurrency(result.totalInterest)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
