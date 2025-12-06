import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, Users, DollarSign, Star, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

interface ColivingAnalytics {
  id: string;
  periodo: string;
  mes: number;
  anio: number;
  totalColivers: number;
  coliversSalieron: number;
  churnRate: number;
  promedioEstanciaMeses: number;
  ltvPromedio: number;
  ltvMinimo: number;
  ltvMaximo: number;
  totalEncuestas: number;
  promotores: number;
  pasivos: number;
  detractores: number;
  npsScore: number | null;
  perfilIdealEdadMin: number | null;
  perfilIdealEdadMax: number | null;
  perfilIdealOcupacion: string | null;
  perfilIdealIngresoMin: number | null;
  perfilIdealEstanciaMeses: number | null;
  prediccionOcupacionProximoMes: number | null;
  prediccionDisponibilidadRoomsProximoMes: number | null;
  nivelConfianzaPrediccion: string;
}

export default function ColivingAnalyticsDashboard() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [analytics, setAnalytics] = useState<ColivingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAnalytics();
    }
  }, [status, selectedMonth, selectedYear]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/coliving/analytics?mes=${selectedMonth}&anio=${selectedYear}`
      );

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        toast.error('Error al cargar analytics');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar analytics');
    } finally {
      setLoading(false);
    }
  };

  const regenerateAnalytics = async () => {
    try {
      setGenerating(true);
      const periodo = new Date(selectedYear, selectedMonth - 1, 1);

      const response = await fetch('/api/coliving/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodo }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
        toast.success('¡Analytics regenerados exitosamente!');
      } else {
        toast.error('Error al regenerar analytics');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al regenerar analytics');
    } finally {
      setGenerating(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>No hay datos disponibles</CardTitle>
            <CardDescription>
              Genera los analytics para el periodo seleccionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={regenerateAnalytics} disabled={generating}>
              {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generar Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics de Coliving</h1>
          <p className="text-muted-foreground">
            Métricas avanzadas y predicciones para tu negocio de coliving
          </p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={m.toString()}>
                  {new Date(2024, m - 1, 1).toLocaleDateString('es-ES', { month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025].map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={regenerateAnalytics} disabled={generating}>
            {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Regenerar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="churn">Rotación (Churn)</TabsTrigger>
          <TabsTrigger value="ltv">Lifetime Value</TabsTrigger>
          <TabsTrigger value="nps">Net Promoter Score</TabsTrigger>
          <TabsTrigger value="profile">Perfil Ideal</TabsTrigger>
          <TabsTrigger value="prediction">Predicciones</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Colivers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalColivers}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.coliversSalieron} salieron este mes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                {analytics.churnRate > 15 ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.churnRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Promedio estancia: {analytics.promedioEstanciaMeses} meses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">LTV Promedio</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€{analytics.ltvPromedio.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Mín: €{analytics.ltvMinimo} / Máx: €{analytics.ltvMaximo}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">NPS Score</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.npsScore !== null ? analytics.npsScore : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.totalEncuestas} encuestas respondidas
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Churn Tab */}
        <TabsContent value="churn" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Rotación</CardTitle>
              <CardDescription>
                Métricas de retención y permanencia de colivers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Colivers</p>
                  <p className="text-3xl font-bold">{analytics.totalColivers}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Salieron</p>
                  <p className="text-3xl font-bold text-red-500">{analytics.coliversSalieron}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Tasa de Rotación</p>
                  <p className="text-3xl font-bold">{analytics.churnRate}%</p>
                </div>
              </div>
              <div className="pt-4">
                <p className="text-sm font-medium mb-2">Promedio de Estancia</p>
                <p className="text-2xl font-bold">{analytics.promedioEstanciaMeses} meses</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Los colivers permanecen en promedio {analytics.promedioEstanciaMeses} meses
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LTV Tab */}
        <TabsContent value="ltv" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lifetime Value (LTV)</CardTitle>
              <CardDescription>
                Valor generado por coliver durante su estancia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">LTV Promedio</p>
                  <p className="text-3xl font-bold">€{analytics.ltvPromedio.toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">LTV Mínimo</p>
                  <p className="text-3xl font-bold text-orange-500">€{analytics.ltvMinimo.toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">LTV Máximo</p>
                  <p className="text-3xl font-bold text-green-500">€{analytics.ltvMaximo.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NPS Tab */}
        <TabsContent value="nps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Net Promoter Score</CardTitle>
              <CardDescription>
                Satisfacción y lealtad de los colivers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-6">
                <p className="text-sm font-medium text-muted-foreground mb-2">NPS Score</p>
                <p className="text-6xl font-bold">
                  {analytics.npsScore !== null ? analytics.npsScore : 'N/A'}
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-700">Promotores (9-10)</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.promotores}</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-yellow-700">Pasivos (7-8)</p>
                  <p className="text-2xl font-bold text-yellow-600">{analytics.pasivos}</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm font-medium text-red-700">Detractores (0-6)</p>
                  <p className="text-2xl font-bold text-red-600">{analytics.detractores}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Total de encuestas: {analytics.totalEncuestas}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Perfil Ideal de Inquilino</CardTitle>
              <CardDescription>
                Características del inquilino ideal según datos históricos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Rango de Edad</p>
                  <p className="text-2xl font-bold">
                    {analytics.perfilIdealEdadMin && analytics.perfilIdealEdadMax
                      ? `${analytics.perfilIdealEdadMin} - ${analytics.perfilIdealEdadMax} años`
                      : 'No disponible'}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Ocupación Ideal</p>
                  <p className="text-2xl font-bold capitalize">
                    {analytics.perfilIdealOcupacion || 'No disponible'}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Ingreso Mínimo</p>
                  <p className="text-2xl font-bold">
                    {analytics.perfilIdealIngresoMin
                      ? `€${analytics.perfilIdealIngresoMin.toLocaleString()}`
                      : 'No disponible'}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Estancia Óptima</p>
                  <p className="text-2xl font-bold">
                    {analytics.perfilIdealEstanciaMeses
                      ? `${analytics.perfilIdealEstanciaMeses} meses`
                      : 'No disponible'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prediction Tab */}
        <TabsContent value="prediction" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Predicciones</CardTitle>
              <CardDescription>
                Proyecciones de ocupación para el próximo mes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Ocupación Estimada</p>
                  <p className="text-4xl font-bold">
                    {analytics.prediccionOcupacionProximoMes !== null
                      ? `${analytics.prediccionOcupacionProximoMes}%`
                      : 'No disponible'}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Habitaciones Disponibles</p>
                  <p className="text-4xl font-bold">
                    {analytics.prediccionDisponibilidadRoomsProximoMes !== null
                      ? analytics.prediccionDisponibilidadRoomsProximoMes
                      : 'No disponible'}
                  </p>
                </div>
              </div>
              <div className="pt-4">
                <p className="text-sm font-medium mb-2">Nivel de Confianza</p>
                <Badge
                  variant={
                    analytics.nivelConfianzaPrediccion === 'favorable'
                      ? 'default'
                      : analytics.nivelConfianzaPrediccion === 'desfavorable'
                      ? 'destructive'
                      : 'secondary'
                  }
                  className="text-lg px-4 py-2"
                >
                  {analytics.nivelConfianzaPrediccion.toUpperCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
