import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CalendarDays, Download } from 'lucide-react';
import { AdvancedAnalytics } from '@/app/dashboard/components/advanced-analytics';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

export const metadata: Metadata = {
  title: 'Analytics | Inmova',
  description: 'Análisis y reportes',
};

// Mock data to populate the view until API integration is refined
const MOCK_MONTHLY_DATA = [
  { name: 'Ene', income: 4500, expenses: 2100 },
  { name: 'Feb', income: 5200, expenses: 1800 },
  { name: 'Mar', income: 4800, expenses: 2400 },
  { name: 'Abr', income: 6100, expenses: 2000 },
  { name: 'May', income: 5900, expenses: 2200 },
  { name: 'Jun', income: 7200, expenses: 2500 },
];

export default function AnalyticsPage() {
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-2">
              Visión profunda del rendimiento de tu cartera
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <CalendarDays size={16} /> Últimos 6 meses
            </Button>
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Download size={16} /> Exportar Informe
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {/* KPI Cards Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Ingresos Totales (YTD)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€33,700</div>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  +12.5% vs año anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Ocupación Promedio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94.2%</div>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  +2.1% vs mes anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Gastos Operativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€13,000</div>
                <p className="text-xs text-red-600 mt-1 flex items-center">
                  +5.4% vs objetivo (Alerta)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Rendimiento Financiero</CardTitle>
              <CardDescription>Comparativa de ingresos vs gastos mensuales</CardDescription>
            </CardHeader>
            <CardContent className="pl-0">
              {/* Reusing the AdvancedAnalytics component which likely contains charts */}
              <AdvancedAnalytics monthlyData={MOCK_MONTHLY_DATA} />
            </CardContent>
          </Card>

          {/* Detailed Metrics Tabs */}
          <Tabs defaultValue="occupancy" className="w-full">
            <TabsList>
              <TabsTrigger value="occupancy">Ocupación</TabsTrigger>
              <TabsTrigger value="maintenance">Mantenimiento</TabsTrigger>
              <TabsTrigger value="tenants">Inquilinos</TabsTrigger>
            </TabsList>
            <TabsContent value="occupancy" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Métricas de Ocupación</CardTitle>
                  <CardDescription>Análisis de vacancia y rotación</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                    Gráfico de ocupación detallado próximamente
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="maintenance" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Eficiencia de Mantenimiento</CardTitle>
                  <CardDescription>Tiempos de respuesta y costes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                    Gráfico de mantenimiento próximamente
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
