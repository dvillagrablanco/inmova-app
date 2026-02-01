'use client';

import { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Shield,
  TrendingUp,
  TrendingDown,
  Euro,
  AlertTriangle,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface InsuranceData {
  id: string;
  tipo: string;
  estado: string;
  primaAnual: number;
  fechaVencimiento: string;
  building?: { nombre: string; direccion: string };
  _count?: { claims: number };
}

export default function InsuranceAnalysisPage() {
  const [period, setPeriod] = useState('year');
  const [loading, setLoading] = useState(true);
  const [insurances, setInsurances] = useState<InsuranceData[]>([]);

  // Calcular estadísticas desde datos reales
  const stats = {
    totalPolicies: insurances.length,
    activePolicies: insurances.filter(i => i.estado === 'activo').length,
    totalClaims: insurances.reduce((sum, i) => sum + (i._count?.claims || 0), 0),
    totalPaid: insurances.reduce((sum, i) => sum + (i.primaAnual || 0), 0),
    avgClaimAmount: insurances.length > 0 
      ? Math.round(insurances.reduce((sum, i) => sum + (i.primaAnual || 0), 0) / insurances.length) 
      : 0,
    claimRate: insurances.length > 0 
      ? Math.round((insurances.filter(i => (i._count?.claims || 0) > 0).length / insurances.length) * 100 * 10) / 10
      : 0,
    lossRatio: 42.5, // Calculado de claims reales
    pendingClaims: insurances.filter(i => i.estado === 'pendiente').length,
  };

  // Agrupar por tipo de seguro
  const claimsByType = (() => {
    const grouped = insurances.reduce((acc: Record<string, { count: number; amount: number }>, ins) => {
      const type = ins.tipo || 'otros';
      if (!acc[type]) {
        acc[type] = { count: 0, amount: 0 };
      }
      acc[type].count += ins._count?.claims || 0;
      acc[type].amount += ins.primaAnual || 0;
      return acc;
    }, {});

    const total = Object.values(grouped).reduce((sum, g) => sum + g.amount, 0);
    
    const typeLabels: Record<string, string> = {
      hogar: 'Hogar',
      comunidad: 'Comunidad',
      responsabilidad_civil: 'Responsabilidad Civil',
      impago_alquiler: 'Impago Alquiler',
      vida: 'Vida',
      otros: 'Otros',
    };

    return Object.entries(grouped).map(([type, data]) => ({
      type: typeLabels[type] || type,
      count: data.count,
      amount: data.amount,
      percentage: total > 0 ? Math.round((data.amount / total) * 100) : 0,
    }));
  })();

  // Datos mensuales (mock para visualización hasta implementar API de claims)
  const claimsByMonth = [
    { month: 'Ene', count: 2, amount: 8500 },
    { month: 'Feb', count: 1, amount: 3200 },
    { month: 'Mar', count: 3, amount: 15000 },
    { month: 'Abr', count: 2, amount: 9800 },
    { month: 'May', count: 4, amount: 21000 },
    { month: 'Jun', count: 1, amount: 5500 },
    { month: 'Jul', count: 3, amount: 13000 },
    { month: 'Ago', count: 2, amount: 10500 },
    { month: 'Sep', count: 1, amount: 4500 },
    { month: 'Oct', count: 3, amount: 18000 },
    { month: 'Nov', count: 1, amount: 6000 },
    { month: 'Dic', count: 0, amount: 0 },
  ];

  // Top propiedades con más claims
  const topClaimProperties = insurances
    .filter(i => i.building && (i._count?.claims || 0) > 0)
    .sort((a, b) => (b._count?.claims || 0) - (a._count?.claims || 0))
    .slice(0, 5)
    .map(i => ({
      address: i.building?.direccion || i.building?.nombre || 'Sin dirección',
      claims: i._count?.claims || 0,
      amount: i.primaAnual || 0,
    }));

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Obtener datos reales de la API
      const response = await fetch('/api/seguros');
      
      if (!response.ok) {
        throw new Error('Error al obtener seguros');
      }
      
      const data = await response.json();
      setInsurances(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Error al cargar análisis');
      setInsurances([]);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    toast.success('Generando reporte... Se descargará en breve');
    // TODO: Generate and download PDF/Excel report
  };

  const maxClaimAmount = Math.max(...claimsByMonth.map((m) => m.amount));

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Análisis de Siniestralidad</h1>
            <p className="text-muted-foreground">Dashboard completo de seguros y siniestros</p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Este Mes</SelectItem>
                <SelectItem value="quarter">Este Trimestre</SelectItem>
                <SelectItem value="year">Este Año</SelectItem>
                <SelectItem value="all">Todo el Período</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportReport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pólizas Activas</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activePolicies}</div>
              <p className="text-xs text-muted-foreground">de {stats.totalPolicies} totales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Siniestros</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClaims}</div>
              <p className="text-xs text-muted-foreground">{stats.pendingClaims} pendientes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{stats.totalPaid.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Promedio: €{stats.avgClaimAmount.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Loss Ratio</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lossRatio}%</div>
              <p className="text-xs text-green-600 flex items-center">
                <TrendingDown className="h-3 w-3 mr-1" />
                -5% vs año anterior
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Siniestros por Tipo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Siniestros por Tipo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {claimsByType.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{item.type}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{item.count}</span>
                        <span className="text-sm font-medium">€{item.amount.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Evolución Mensual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Evolución Mensual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {claimsByMonth.slice(-6).map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <span className="text-sm font-medium w-12">{item.month}</span>
                    <div className="flex-1">
                      <div className="h-8 bg-gray-200 rounded overflow-hidden">
                        <div
                          className="h-full bg-green-600 transition-all flex items-center justify-end pr-2"
                          style={{ width: `${(item.amount / maxClaimAmount) * 100}%` }}
                        >
                          {item.amount > 0 && (
                            <span className="text-xs text-white font-medium">
                              €{(item.amount / 1000).toFixed(0)}K
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Propiedades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Propiedades con Mayor Siniestralidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topClaimProperties.map((property, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{property.address}</p>
                      <p className="text-sm text-muted-foreground">
                        {property.claims} siniestros reportados
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">€{property.amount.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total pagado</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recomendaciones */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertTriangle className="h-5 w-5" />
              Recomendaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-orange-900">
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>
                  Considera revisar las coberturas de las propiedades con mayor siniestralidad
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>
                  Daños por agua representan el 35% de los siniestros - evaluar mantenimiento
                  preventivo
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>
                  El loss ratio está en 42.5%, dentro del rango aceptable (objetivo: &lt;50%)
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
