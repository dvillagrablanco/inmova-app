'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Users,
  DollarSign,
  Briefcase,
  FileText,
  BarChart3,
  Download,
  Calendar,
  Target,
  Award,
  AlertCircle,
  CheckCircle2,
  Building2,
  HardHat,
} from 'lucide-react';
import { toast } from 'sonner';

interface Metrics {
  totalEmpresas: number;
  empresasActivas: number;
  nuevasEmpresasMes: number;
  obrasPublicadas: number;
  ofertasEnviadas: number;
  contratosActivos: number;
  contratosCompletados: number;
  gmvTotal: number;
  comisionesGeneradas: number;
  beneficioSocio: number;
  beneficioPlataforma: number;
  suscripcionesActivas: number;
  mrrSuscripciones: number;
  usuariosObrero: number;
  usuariosCapataz: number;
  usuariosConstructor: number;
  tasaConversion: number;
  tiempoMedioAdjudicacion: number;
  valoracionMediaPlataforma: number;
  comisionSuscripciones: number;
  comisionEscrow: number;
  comisionUrgentes: number;
  comisionOtros: number;
}

export default function AdminSocioPage() {
  const { data: session, status } = useSession();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<'mes_actual' | 'mes_anterior' | 'trimestre' | 'anual'>('mes_actual');

  useEffect(() => {
    if (status === 'authenticated') {
      fetchMetrics();
    }
  }, [status, periodo]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ewoorker/admin-socio/metrics?periodo=${periodo}`);
      if (!response.ok) throw new Error('Error al cargar métricas');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      toast.error('Error al cargar métricas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      const response = await fetch(`/api/ewoorker/admin-socio/export?periodo=${periodo}`);
      if (!response.ok) throw new Error('Error al exportar reporte');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ewoorker-reporte-socio-${periodo}-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      toast.success('Reporte exportado correctamente');
    } catch (error) {
      toast.error('Error al exportar reporte');
      console.error(error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-white flex items-center justify-center">
        <div className="text-center">
          <HardHat className="w-16 h-16 text-orange-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 text-lg">Cargando panel del socio...</p>
        </div>
      </div>
    );
  }

  // Verificar roles permitidos para el panel del socio
  const allowedRoles = ['super_admin', 'administrador'];
  const hasAccess = session && allowedRoles.includes(session.user.role as string);

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-2" />
            <CardTitle className="text-center text-red-600">Sesión No Iniciada</CardTitle>
            <CardDescription className="text-center">
              Debes iniciar sesión para acceder al panel del socio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
              onClick={() => window.location.href = '/login?callbackUrl=/ewoorker/admin-socio'}
            >
              Iniciar Sesión
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/ewoorker/landing'}
            >
              Volver a eWoorker
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-2" />
            <CardTitle className="text-center text-red-600">Acceso Denegado</CardTitle>
            <CardDescription className="text-center">
              Este panel es exclusivo para el socio fundador de eWoorker.
              <br />
              <span className="text-xs text-gray-500 mt-2 block">
                Rol actual: {session.user.role || 'No definido'}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              onClick={() => window.location.href = '/dashboard'}
            >
              Ir al Dashboard
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/ewoorker/landing'}
            >
              Volver a eWoorker
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <p className="text-gray-700">Error al cargar métricas</p>
      </div>
    );
  }

  const formatEuros = (centimos: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(centimos / 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-yellow-600 text-white py-8 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <HardHat className="w-10 h-10" />
                <h1 className="text-4xl font-extrabold">Panel del Socio</h1>
              </div>
              <p className="text-orange-100">Métricas y análisis de eWoorker</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={periodo} onValueChange={(value: any) => setPeriodo(value)}>
                <SelectTrigger className="bg-white text-gray-900 w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mes_actual">Mes Actual</SelectItem>
                  <SelectItem value="mes_anterior">Mes Anterior</SelectItem>
                  <SelectItem value="trimestre">Último Trimestre</SelectItem>
                  <SelectItem value="anual">Año Completo</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="secondary"
                onClick={exportReport}
                className="bg-white text-orange-600 hover:bg-gray-100"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KPIs Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-green-500 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Tu Beneficio (50%)
              </CardTitle>
              <DollarSign className="w-6 h-6 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-green-700">
                {formatEuros(metrics.beneficioSocio)}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                De {formatEuros(metrics.comisionesGeneradas)} totales
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-blue-500 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                GMV Total
              </CardTitle>
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-blue-700">
                {formatEuros(metrics.gmvTotal)}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Gross Merchandise Value
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-orange-500 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                MRR Suscripciones
              </CardTitle>
              <Award className="w-6 h-6 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-orange-700">
                {formatEuros(metrics.mrrSuscripciones)}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {metrics.suscripcionesActivas} suscripciones activas
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-purple-500 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                Contratos Activos
              </CardTitle>
              <FileText className="w-6 h-6 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-purple-700">
                {metrics.contratosActivos}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {metrics.contratosCompletados} completados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="financiero" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-orange-100">
            <TabsTrigger value="financiero">Financiero</TabsTrigger>
            <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
            <TabsTrigger value="operaciones">Operaciones</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Tab Financiero */}
          <TabsContent value="financiero" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Desglose de Comisiones</CardTitle>
                  <CardDescription>Por tipo de servicio</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Suscripciones</span>
                    <span className="font-bold text-green-700">
                      {formatEuros(metrics.comisionSuscripciones)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Escrow (2-3%)</span>
                    <span className="font-bold text-blue-700">
                      {formatEuros(metrics.comisionEscrow)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Urgentes (5-10%)</span>
                    <span className="font-bold text-orange-700">
                      {formatEuros(metrics.comisionUrgentes)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Otros</span>
                    <span className="font-bold text-purple-700">
                      {formatEuros(metrics.comisionOtros)}
                    </span>
                  </div>
                  <div className="pt-4 border-t-2 border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="font-extrabold text-2xl text-green-700">
                        {formatEuros(metrics.comisionesGeneradas)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>División de Beneficios</CardTitle>
                  <CardDescription>50% Socio / 50% Plataforma</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Tu parte (50%)</span>
                      <span className="font-bold text-2xl text-green-700">
                        {formatEuros(metrics.beneficioSocio)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div className="bg-green-600 h-4 rounded-full" style={{ width: '50%' }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Plataforma (50%)</span>
                      <span className="font-bold text-2xl text-blue-700">
                        {formatEuros(metrics.beneficioPlataforma)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div className="bg-blue-600 h-4 rounded-full" style={{ width: '50%' }} />
                    </div>
                  </div>
                  <div className="pt-4 border-t-2 border-gray-200">
                    <p className="text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 inline-block text-green-600 mr-1" />
                      División automática según acuerdo 50/50
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Usuarios */}
          <TabsContent value="usuarios" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Empresas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-extrabold text-gray-900 mb-2">
                    {metrics.totalEmpresas}
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Badge variant="success">{metrics.empresasActivas} activas</Badge>
                    <Badge variant="secondary">{metrics.nuevasEmpresasMes} nuevas este mes</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Por Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Obrero (Gratis)</span>
                    <Badge variant="outline">{metrics.usuariosObrero}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Capataz (€49)</span>
                    <Badge className="bg-orange-600">{metrics.usuariosCapataz}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Constructor (€149)</span>
                    <Badge className="bg-blue-700">{metrics.usuariosConstructor}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Crecimiento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-extrabold text-green-700 mb-2">
                    +{metrics.nuevasEmpresasMes}
                  </div>
                  <p className="text-sm text-gray-600">Empresas nuevas este mes</p>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Tasa de activación</span>
                      <span>{((metrics.empresasActivas / metrics.totalEmpresas) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(metrics.empresasActivas / metrics.totalEmpresas) * 100}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Operaciones */}
          <TabsContent value="operaciones" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <Building2 className="w-8 h-8 text-blue-600 mb-2" />
                  <CardTitle>Obras Publicadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-extrabold text-blue-700">
                    {metrics.obrasPublicadas}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <FileText className="w-8 h-8 text-orange-600 mb-2" />
                  <CardTitle>Ofertas Enviadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-extrabold text-orange-700">
                    {metrics.ofertasEnviadas}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Briefcase className="w-8 h-8 text-green-600 mb-2" />
                  <CardTitle>Contratos Activos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-extrabold text-green-700">
                    {metrics.contratosActivos}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CheckCircle2 className="w-8 h-8 text-purple-600 mb-2" />
                  <CardTitle>Completados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-extrabold text-purple-700">
                    {metrics.contratosCompletados}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Performance */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <Target className="w-8 h-8 text-green-600 mb-2" />
                  <CardTitle>Tasa de Conversión</CardTitle>
                  <CardDescription>Ofertas → Contratos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-extrabold text-green-700 mb-2">
                    {metrics.tasaConversion.toFixed(1)}%
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-green-600 h-4 rounded-full"
                      style={{ width: `${Math.min(metrics.tasaConversion, 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Calendar className="w-8 h-8 text-blue-600 mb-2" />
                  <CardTitle>Tiempo Medio Adjudicación</CardTitle>
                  <CardDescription>Desde publicación a firma</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-extrabold text-blue-700 mb-2">
                    {metrics.tiempoMedioAdjudicacion.toFixed(1)}
                  </div>
                  <p className="text-sm text-gray-600">días promedio</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Award className="w-8 h-8 text-yellow-600 mb-2" />
                  <CardTitle>Valoración Plataforma</CardTitle>
                  <CardDescription>Rating promedio usuarios</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-extrabold text-yellow-700 mb-2">
                    {metrics.valoracionMediaPlataforma.toFixed(1)} / 5.0
                  </div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-6 h-6 ${
                          star <= Math.round(metrics.valoracionMediaPlataforma)
                            ? 'text-yellow-500'
                            : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Info */}
        <Card className="mt-8 bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  <strong>Modelo de Negocio eWoorker:</strong> B2B Marketplace para subcontratación en construcción
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Ingresos: Suscripciones mensuales + Comisiones por éxito • División: 50% Socio / 50% Plataforma
                </p>
              </div>
              <Badge className="bg-green-600 text-white text-lg px-4 py-2">
                50% Beneficios
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
