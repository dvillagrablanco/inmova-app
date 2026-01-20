'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Home, 
  Users, 
  FileText, 
  Percent,
  Calendar,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DashboardStats {
  totalBuildings: number;
  totalUnits: number;
  totalTenants: number;
  totalContracts: number;
  activeContracts: number;
  occupancyRate: number;
  monthlyIncome: number;
  pendingPayments: number;
  expiringContracts: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch multiple endpoints to build analytics
      const [buildingsRes, unitsRes, tenantsRes, contractsRes] = await Promise.all([
        fetch('/api/buildings'),
        fetch('/api/units'),
        fetch('/api/tenants'),
        fetch('/api/contracts'),
      ]);

      const buildings = buildingsRes.ok ? await buildingsRes.json() : [];
      const units = unitsRes.ok ? await unitsRes.json() : [];
      const tenants = tenantsRes.ok ? await tenantsRes.json() : [];
      const contracts = contractsRes.ok ? await contractsRes.json() : [];

      const buildingsData = Array.isArray(buildings) ? buildings : buildings.data || [];
      const unitsData = Array.isArray(units) ? units : units.data || [];
      const tenantsData = Array.isArray(tenants) ? tenants : tenants.data || [];
      const contractsData = Array.isArray(contracts) ? contracts : contracts.data || [];

      const activeContracts = contractsData.filter((c: any) => c.estado === 'activo');
      const occupiedUnits = unitsData.filter((u: any) => u.estado === 'ocupada');
      const monthlyIncome = activeContracts.reduce((sum: number, c: any) => sum + (Number(c.rentaMensual) || 0), 0);
      
      const today = new Date();
      const expiringContracts = contractsData.filter((c: any) => {
        const endDate = new Date(c.fechaFin);
        const daysUntil = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntil > 0 && daysUntil <= 30;
      });

      setStats({
        totalBuildings: buildingsData.length,
        totalUnits: unitsData.length,
        totalTenants: tenantsData.length,
        totalContracts: contractsData.length,
        activeContracts: activeContracts.length,
        occupancyRate: unitsData.length > 0 ? Math.round((occupiedUnits.length / unitsData.length) * 100) : 0,
        monthlyIncome,
        pendingPayments: 0, // Would need payments API
        expiringContracts: expiringContracts.length,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [period]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Ingresos Mensuales',
      value: `€${stats?.monthlyIncome?.toLocaleString() || 0}`,
      change: '+12%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Tasa de Ocupación',
      value: `${stats?.occupancyRate || 0}%`,
      change: '+5%',
      trend: 'up',
      icon: Percent,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Propiedades',
      value: stats?.totalBuildings || 0,
      subtitle: `${stats?.totalUnits || 0} unidades`,
      icon: Home,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Inquilinos Activos',
      value: stats?.totalTenants || 0,
      icon: Users,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Contratos Activos',
      value: stats?.activeContracts || 0,
      subtitle: `de ${stats?.totalContracts || 0} total`,
      icon: FileText,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Por Vencer (30 días)',
      value: stats?.expiringContracts || 0,
      trend: stats?.expiringContracts ? 'warning' : 'neutral',
      icon: Calendar,
      color: stats?.expiringContracts ? 'text-yellow-500' : 'text-gray-500',
      bgColor: stats?.expiringContracts ? 'bg-yellow-50' : 'bg-gray-50',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">
            Resumen de métricas y rendimiento de tu cartera
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="quarter">Este trimestre</SelectItem>
              <SelectItem value="year">Este año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
                    <p className="text-3xl font-bold mt-1">{kpi.value}</p>
                    {kpi.subtitle && (
                      <p className="text-sm text-gray-500 mt-1">{kpi.subtitle}</p>
                    )}
                    {kpi.change && (
                      <div className={`flex items-center mt-2 ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {kpi.trend === 'up' ? (
                          <ArrowUpRight className="h-4 w-4 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 mr-1" />
                        )}
                        <span className="text-sm font-medium">{kpi.change}</span>
                        <span className="text-xs text-gray-500 ml-1">vs período anterior</span>
                      </div>
                    )}
                  </div>
                  <div className={`p-3 rounded-lg ${kpi.bgColor}`}>
                    <Icon className={`h-6 w-6 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos por Mes</CardTitle>
            <CardDescription>Evolución de ingresos mensuales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Gráfico de ingresos</p>
                <p className="text-sm text-gray-400">Integración con librería de gráficos pendiente</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ocupación por Tipo</CardTitle>
            <CardDescription>Distribución de ocupación por tipo de propiedad</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <Percent className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Gráfico de ocupación</p>
                <p className="text-sm text-gray-400">Integración con librería de gráficos pendiente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Resumen Rápido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {stats?.activeContracts || 0}
              </p>
              <p className="text-sm text-gray-500">Contratos activos</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {stats?.totalUnits ? stats.totalUnits - Math.round(stats.totalUnits * (stats.occupancyRate / 100)) : 0}
              </p>
              <p className="text-sm text-gray-500">Unidades disponibles</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">
                {stats?.expiringContracts || 0}
              </p>
              <p className="text-sm text-gray-500">Contratos por vencer</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                €{stats?.monthlyIncome?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-gray-500">Ingresos proyectados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
