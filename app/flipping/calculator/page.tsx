'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Calculator,
  DollarSign,
  Home,
  Hammer,
  Calendar,
  AlertCircle,
  CheckCircle,
  Info,
  Trash2,
  History,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from '@/components/ui/lazy-charts-extended';

interface CalculatorData {
  // Compra
  purchasePrice: number;
  closingCosts: number;
  inspectionCosts: number;
  
  // Renovación
  structuralWork: number;
  electrical: number;
  plumbing: number;
  flooring: number;
  painting: number;
  kitchen: number;
  bathrooms: number;
  exterior: number;
  landscaping: number;
  contingency: number;
  
  // Venta
  estimatedSalePrice: number;
  sellingCosts: number;
  agentCommission: number;
  
  // Financiación
  downPayment: number;
  loanAmount: number;
  interestRate: number;
  loanTerm: number; // meses
  
  // Tiempo
  renovationTime: number; // meses
  holdingTime: number; // meses
}

interface CalculatorResults {
  totalInvestment: number;
  totalRenovation: number;
  totalCosts: number;
  netProfit: number;
  roi: number;
  irr: number;
  cashOnCash: number;
  holdingCosts: number;
  monthlyMortgage: number;
  breakEvenPrice: number;
}

const COLORS = ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#6366F1'];

interface HistoryEntry {
  id: string;
  date: string;
  purchasePrice: number;
  salePrice: number;
  roi: number;
  netProfit: number;
}

const DEFAULT_DATA: CalculatorData = {
  purchasePrice: 150000,
  closingCosts: 3000,
  inspectionCosts: 500,
  structuralWork: 5000,
  electrical: 3000,
  plumbing: 2500,
  flooring: 4000,
  painting: 2000,
  kitchen: 8000,
  bathrooms: 6000,
  exterior: 3000,
  landscaping: 1500,
  contingency: 3000,
  estimatedSalePrice: 220000,
  sellingCosts: 2000,
  agentCommission: 6,
  downPayment: 30000,
  loanAmount: 120000,
  interestRate: 6.5,
  loanTerm: 12,
  renovationTime: 4,
  holdingTime: 6,
};

export default function FlippingCalculatorPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const [data, setData] = useState<CalculatorData>({
    purchasePrice: 150000,
    closingCosts: 3000,
    inspectionCosts: 500,
    structuralWork: 5000,
    electrical: 3000,
    plumbing: 2500,
    flooring: 4000,
    painting: 2000,
    kitchen: 8000,
    bathrooms: 6000,
    exterior: 3000,
    landscaping: 1500,
    contingency: 3000,
    estimatedSalePrice: 220000,
    sellingCosts: 2000,
    agentCommission: 6, // %
    downPayment: 30000,
    loanAmount: 120000,
    interestRate: 6.5,
    loanTerm: 12,
    renovationTime: 4,
    holdingTime: 6,
  });

  const calculateResults = (): CalculatorResults => {
    const totalAcquisition = data.purchasePrice + data.closingCosts + data.inspectionCosts;
    
    const totalRenovation = 
      data.structuralWork + data.electrical + data.plumbing + 
      data.flooring + data.painting + data.kitchen + 
      data.bathrooms + data.exterior + data.landscaping + data.contingency;
    
    const monthlyInterest = (data.interestRate / 100) / 12;
    const monthlyMortgage = data.loanAmount > 0 
      ? (data.loanAmount * monthlyInterest * Math.pow(1 + monthlyInterest, data.loanTerm)) / 
        (Math.pow(1 + monthlyInterest, data.loanTerm) - 1)
      : 0;
    
    const holdingCosts = monthlyMortgage * data.holdingTime;
    
    const agentFee = data.estimatedSalePrice * (data.agentCommission / 100);
    const totalSellCosts = data.sellingCosts + agentFee;
    
    const totalCosts = totalAcquisition + totalRenovation + holdingCosts + totalSellCosts;
    const netProfit = data.estimatedSalePrice - totalCosts;
    
    const totalInvestment = data.downPayment + totalRenovation + holdingCosts;
    const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
    
    const cashOnCash = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
    
    // IRR simplificado (asumiendo flujo final único)
    const months = data.renovationTime + data.holdingTime;
    const irr = months > 0 ? ((Math.pow(1 + (roi / 100), 12 / months) - 1) * 100) : 0;
    
    const breakEvenPrice = totalCosts;
    
    return {
      totalInvestment,
      totalRenovation,
      totalCosts,
      netProfit,
      roi,
      irr,
      cashOnCash,
      holdingCosts,
      monthlyMortgage,
      breakEvenPrice,
    };
  };

  const results = calculateResults();

  const updateField = (field: keyof CalculatorData, value: number) => {
    setData({ ...data, [field]: value });
  };

  const resetData = () => {
    setData(DEFAULT_DATA);
    toast.success('Datos reiniciados');
  };

  const saveToHistory = () => {
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      purchasePrice: data.purchasePrice,
      salePrice: data.estimatedSalePrice,
      roi: results.roi,
      netProfit: results.netProfit,
    };
    setHistory(prev => [entry, ...prev].slice(0, 10)); // Max 10 entries
    toast.success('Análisis guardado en historial');
  };

  const loadFromHistory = (entry: HistoryEntry) => {
    setData(prev => ({
      ...prev,
      purchasePrice: entry.purchasePrice,
      estimatedSalePrice: entry.salePrice,
    }));
    setShowHistory(false);
    toast.info('Datos cargados del historial');
  };

  const clearHistory = () => {
    setHistory([]);
    toast.success('Historial borrado');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const renovationBreakdown = [
    { name: 'Estructura', value: data.structuralWork },
    { name: 'Electricidad', value: data.electrical },
    { name: 'Fontanería', value: data.plumbing },
    { name: 'Suelos', value: data.flooring },
    { name: 'Pintura', value: data.painting },
    { name: 'Cocina', value: data.kitchen },
    { name: 'Baños', value: data.bathrooms },
    { name: 'Exterior', value: data.exterior },
    { name: 'Jardín', value: data.landscaping },
    { name: 'Contingencia', value: data.contingency },
  ];

  const cashflowData = Array.from({ length: data.renovationTime + data.holdingTime + 1 }, (_, i) => {
    if (i === 0) return { month: 'Mes 0', cashflow: -(data.downPayment + data.closingCosts) };
    if (i <= data.renovationTime) return { month: `Mes ${i}`, cashflow: -(results.totalRenovation / data.renovationTime) };
    if (i === data.renovationTime + data.holdingTime) return { month: `Mes ${i}`, cashflow: results.netProfit };
    return { month: `Mes ${i}`, cashflow: -results.monthlyMortgage };
  });

  const saveProject = async () => {
    try {
      const response = await fetch('/api/flipping/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          calculatorData: data,
          results,
        }),
      });

      if (response.ok) {
        toast.success('Proyecto guardado correctamente');
        router.push('/flipping');
      } else {
        toast.error('Error al guardar proyecto');
      }
    } catch (error) {
      toast.error('Error al guardar proyecto');
    }
  };

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Calculadora ROI/TIR Avanzada
                </h1>
                <p className="text-muted-foreground mt-2">
                  Calcula la rentabilidad de tu proyecto de flipping inmobiliario
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={() => router.push('/flipping')}>
                  Volver a Proyectos
                </Button>
                <Button variant="outline" onClick={resetData}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpiar Datos
                </Button>
                <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
                  <History className="h-4 w-4 mr-2" />
                  Historial ({history.length})
                </Button>
                <Button variant="outline" onClick={saveToHistory}>
                  <Clock className="h-4 w-4 mr-2" />
                  Guardar Análisis
                </Button>
                <Button onClick={saveProject}>
                  Guardar Proyecto
                </Button>
              </div>
            </div>

            {/* Panel de Historial */}
            {showHistory && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Historial de Análisis
                  </CardTitle>
                  {history.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearHistory}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Borrar Todo
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {history.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No hay análisis guardados. Usa "Guardar Análisis" para almacenar tus cálculos.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {history.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted cursor-pointer"
                          onClick={() => loadFromHistory(entry)}
                        >
                          <div>
                            <p className="font-medium">{formatCurrency(entry.purchasePrice)} → {formatCurrency(entry.salePrice)}</p>
                            <p className="text-xs text-muted-foreground">{entry.date}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={entry.roi >= 20 ? 'default' : entry.roi >= 10 ? 'secondary' : 'destructive'}>
                              ROI: {entry.roi.toFixed(1)}%
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {entry.netProfit >= 0 ? '+' : ''}{formatCurrency(entry.netProfit)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Resultados Principales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className={`border-l-4 ${results.roi >= 20 ? 'border-l-green-500' : results.roi >= 10 ? 'border-l-yellow-500' : 'border-l-red-500'}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">ROI</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${results.roi >= 20 ? 'text-green-600' : results.roi >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {results.roi.toFixed(2)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Return on Investment</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">TIR Anualizada</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {results.irr.toFixed(2)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Internal Rate of Return</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Beneficio Neto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${results.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(results.netProfit)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Ganancia estimada</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Punto de Equilibrio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(results.breakEvenPrice)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Precio mínimo venta</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="inputs" className="space-y-4">
              <TabsList>
                <TabsTrigger value="inputs">Datos de Entrada</TabsTrigger>
                <TabsTrigger value="charts">Análisis Visual</TabsTrigger>
                <TabsTrigger value="cashflow">Flujo de Caja</TabsTrigger>
                <TabsTrigger value="sensitivity">Análisis Sensibilidad</TabsTrigger>
              </TabsList>

              <TabsContent value="inputs" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Compra */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Home className="h-5 w-5" />
                        Adquisición
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Precio de Compra</Label>
                        <Input
                          type="number"
                          value={data.purchasePrice}
                          onChange={(e) => updateField('purchasePrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>Costes de Cierre</Label>
                        <Input
                          type="number"
                          value={data.closingCosts}
                          onChange={(e) => updateField('closingCosts', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>Inspección/Due Diligence</Label>
                        <Input
                          type="number"
                          value={data.inspectionCosts}
                          onChange={(e) => updateField('inspectionCosts', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between">
                          <span className="font-semibold">Total Adquisición:</span>
                          <span className="font-bold text-lg">
                            {formatCurrency(data.purchasePrice + data.closingCosts + data.inspectionCosts)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Renovación */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Hammer className="h-5 w-5" />
                        Renovación
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Estructura</Label>
                          <Input
                            type="number"
                            value={data.structuralWork}
                            onChange={(e) => updateField('structuralWork', parseFloat(e.target.value) || 0)}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Electricidad</Label>
                          <Input
                            type="number"
                            value={data.electrical}
                            onChange={(e) => updateField('electrical', parseFloat(e.target.value) || 0)}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Fontanería</Label>
                          <Input
                            type="number"
                            value={data.plumbing}
                            onChange={(e) => updateField('plumbing', parseFloat(e.target.value) || 0)}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Suelos</Label>
                          <Input
                            type="number"
                            value={data.flooring}
                            onChange={(e) => updateField('flooring', parseFloat(e.target.value) || 0)}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Pintura</Label>
                          <Input
                            type="number"
                            value={data.painting}
                            onChange={(e) => updateField('painting', parseFloat(e.target.value) || 0)}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Cocina</Label>
                          <Input
                            type="number"
                            value={data.kitchen}
                            onChange={(e) => updateField('kitchen', parseFloat(e.target.value) || 0)}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Baños</Label>
                          <Input
                            type="number"
                            value={data.bathrooms}
                            onChange={(e) => updateField('bathrooms', parseFloat(e.target.value) || 0)}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Exterior</Label>
                          <Input
                            type="number"
                            value={data.exterior}
                            onChange={(e) => updateField('exterior', parseFloat(e.target.value) || 0)}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Jardín</Label>
                          <Input
                            type="number"
                            value={data.landscaping}
                            onChange={(e) => updateField('landscaping', parseFloat(e.target.value) || 0)}
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Contingencia</Label>
                          <Input
                            type="number"
                            value={data.contingency}
                            onChange={(e) => updateField('contingency', parseFloat(e.target.value) || 0)}
                            className="h-8"
                          />
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between">
                          <span className="font-semibold">Total Renovación:</span>
                          <span className="font-bold text-lg text-orange-600">
                            {formatCurrency(results.totalRenovation)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Venta */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Venta
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Precio Estimado de Venta</Label>
                        <Input
                          type="number"
                          value={data.estimatedSalePrice}
                          onChange={(e) => updateField('estimatedSalePrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>Costes de Venta</Label>
                        <Input
                          type="number"
                          value={data.sellingCosts}
                          onChange={(e) => updateField('sellingCosts', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>Comisión Agente (%)</Label>
                        <Input
                          type="number"
                          value={data.agentCommission}
                          onChange={(e) => updateField('agentCommission', parseFloat(e.target.value) || 0)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          = {formatCurrency(data.estimatedSalePrice * (data.agentCommission / 100))}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Financiación y Tiempo */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Financiación y Tiempo
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Entrada / Capital Propio</Label>
                        <Input
                          type="number"
                          value={data.downPayment}
                          onChange={(e) => updateField('downPayment', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>Préstamo</Label>
                        <Input
                          type="number"
                          value={data.loanAmount}
                          onChange={(e) => updateField('loanAmount', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>Interés Anual (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={data.interestRate}
                          onChange={(e) => updateField('interestRate', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>Tiempo Renovación (meses)</Label>
                        <Input
                          type="number"
                          value={data.renovationTime}
                          onChange={(e) => updateField('renovationTime', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>Tiempo Total Tenencia (meses)</Label>
                        <Input
                          type="number"
                          value={data.holdingTime}
                          onChange={(e) => updateField('holdingTime', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Cuota Mensual:</span>
                          <span className="font-medium">{formatCurrency(results.monthlyMortgage)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Coste Total Holding:</span>
                          <span className="font-medium">{formatCurrency(results.holdingCosts)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="charts" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Desglose de Renovación</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={renovationBreakdown}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {renovationBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Distribución de Costes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={[
                            { name: 'Adquisición', value: data.purchasePrice + data.closingCosts + data.inspectionCosts },
                            { name: 'Renovación', value: results.totalRenovation },
                            { name: 'Holding', value: results.holdingCosts },
                            { name: 'Venta', value: data.sellingCosts + (data.estimatedSalePrice * data.agentCommission / 100) },
                          ]}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value: any) => formatCurrency(value)} />
                          <Bar dataKey="value" fill="#4F46E5" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="cashflow" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Flujo de Caja Proyectado</CardTitle>
                    <CardDescription>
                      Visualización del flujo de caja mensual durante todo el proyecto
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={cashflowData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => formatCurrency(value)} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="cashflow"
                          stroke="#4F46E5"
                          strokeWidth={2}
                          name="Flujo de Caja (€)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sensitivity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Análisis de Sensibilidad</CardTitle>
                    <CardDescription>
                      ¿Cómo afectan los cambios en variables clave a tu ROI?
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {[
                      { label: 'Precio de Venta -10%', change: -10, type: 'sale' },
                      { label: 'Precio de Venta -5%', change: -5, type: 'sale' },
                      { label: 'Escenario Base', change: 0, type: 'base' },
                      { label: 'Precio de Venta +5%', change: 5, type: 'sale' },
                      { label: 'Precio de Venta +10%', change: 10, type: 'sale' },
                    ].map((scenario, idx) => {
                      const adjustedSalePrice = data.estimatedSalePrice * (1 + scenario.change / 100);
                      const adjustedProfit = adjustedSalePrice - results.totalCosts + (data.estimatedSalePrice - adjustedSalePrice);
                      const adjustedROI = results.totalInvestment > 0 ? (adjustedProfit / results.totalInvestment) * 100 : 0;
                      
                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{scenario.label}</span>
                            <Badge variant={scenario.type === 'base' ? 'default' : adjustedROI > results.roi ? 'default' : 'secondary'}>
                              ROI: {adjustedROI.toFixed(2)}%
                            </Badge>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${adjustedROI >= 20 ? 'bg-green-500' : adjustedROI >= 10 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(Math.max(adjustedROI, 0), 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-4">Recomendaciones</h4>
                      <div className="space-y-3">
                        {results.roi >= 20 && (
                          <div className="flex gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-green-900">Excelente oportunidad</p>
                              <p className="text-sm text-green-700">El ROI proyectado es superior al 20%. Proyecto muy rentable.</p>
                            </div>
                          </div>
                        )}
                        {results.roi < 20 && results.roi >= 10 && (
                          <div className="flex gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-yellow-900">Oportunidad moderada</p>
                              <p className="text-sm text-yellow-700">ROI aceptable. Considera optimizar costes de renovación.</p>
                            </div>
                          </div>
                        )}
                        {results.roi < 10 && (
                          <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-red-900">ROI bajo</p>
                              <p className="text-sm text-red-700">Considera negociar el precio de compra o revisar el alcance de la renovación.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </AuthenticatedLayout>
  );
}
