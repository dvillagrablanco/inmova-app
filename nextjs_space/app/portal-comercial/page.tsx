'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { toast } from 'sonner';
import {
  Target,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Award,
  Activity,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface DashboardStats {
  leads: {
    total: number;
    nuevos: number;
    enProceso: number;
    convertidos: number;
    tasaConversion: number;
  };
  comisiones: {
    totalMes: number;
    pendientes: number;
    pagadas: number;
    acumuladoAnio: number;
  };
  objetivos: {
    leadsActuales: number;
    leadsObjetivo: number;
    conversionesActuales: number;
    conversionesObjetivo: number;
    progreso: number;
  };
  recentLeads: Array<{
    id: string;
    nombreCompleto: string;
    empresa: string;
    estado: string;
    fechaCreacion: Date;
  }>;
}

export default function PortalComercialPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [salesRepData, setSalesRepData] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      loadDashboardData();
    }
  }, [session]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar información del representante de ventas
      const repResponse = await fetch('/api/sales/representatives/me');
      if (repResponse.ok) {
        const repData = await repResponse.json();
        setSalesRepData(repData);
      }

      // Cargar estadísticas del dashboard
      const statsResponse = await fetch('/api/sales/dashboard');
      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats(data);
      } else {
        toast.error('Error al cargar estadísticas');
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-bg flex items-center justify-center">
        <LoadingState message="Cargando dashboard..." />
      </div>
    );
  }

  if (!stats) return null;

  const progresoObjetivos = stats.objetivos.progreso || 0;

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold gradient-text">Portal Comercial</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Bienvenido, {salesRepData?.nombreCompleto || session?.user?.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/portal-comercial/leads">
                <Button variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Mis Leads
                </Button>
              </Link>
              <Link href="/portal-comercial/comisiones">
                <Button variant="outline">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Comisiones
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="card-hover">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Leads Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.leads.total}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {stats.leads.nuevos} nuevos
                </Badge>
                <Badge className="text-xs bg-green-100 text-green-700">
                  {stats.leads.enProceso} en proceso
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <CheckCircle className="mr-2 h-4 w-4" />
                Conversiones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.leads.convertidos}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Tasa de conversión: {stats.leads.tasaConversion.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover gradient-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white flex items-center">
                <DollarSign className="mr-2 h-4 w-4" />
                Comisiones Este Mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {stats.comisiones.totalMes.toFixed(2)}€
              </div>
              <p className="text-xs text-white/80 mt-2">
                {stats.comisiones.pendientes} pendientes
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Award className="mr-2 h-4 w-4" />
                Total Año
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.comisiones.acumuladoAnio.toFixed(2)}€
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.comisiones.pagadas} comisiones pagadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Objetivos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Objetivos del Mes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progreso de Leads */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Leads Generados</span>
                <span className="text-sm text-muted-foreground">
                  {stats.objetivos.leadsActuales} / {stats.objetivos.leadsObjetivo}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (stats.objetivos.leadsActuales / stats.objetivos.leadsObjetivo) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Progreso de Conversiones */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Conversiones</span>
                <span className="text-sm text-muted-foreground">
                  {stats.objetivos.conversionesActuales} / {stats.objetivos.conversionesObjetivo}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (stats.objetivos.conversionesActuales /
                        stats.objetivos.conversionesObjetivo) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Progreso General */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Activity className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium">Progreso General</p>
                  <p className="text-xs text-muted-foreground">Este mes</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{progresoObjetivos.toFixed(0)}%</div>
                <Badge
                  variant={progresoObjetivos >= 100 ? 'default' : 'outline'}
                  className="mt-1"
                >
                  {progresoObjetivos >= 100 ? '¡Objetivo cumplido!' : 'En progreso'}
                </Badge>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/portal-comercial/objetivos">
                <Button variant="outline">
                  Ver Detalles
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Leads Recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Leads Recientes
              </span>
              <Link href="/portal-comercial/leads">
                <Button variant="outline" size="sm">
                  Ver todos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentLeads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No tienes leads recientes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentLeads.map((lead) => (
                  <Link key={lead.id} href={`/portal-comercial/leads/${lead.id}`}>
                    <div className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer">
                      <div className="flex-1">
                        <p className="font-medium">{lead.nombreCompleto}</p>
                        <p className="text-sm text-muted-foreground">
                          {lead.empresa || 'Sin empresa'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{lead.estado}</Badge>
                        <p className="text-xs text-muted-foreground">
                          {lead.fechaCreacion
                            ? format(new Date(lead.fechaCreacion), "d 'de' MMM", {
                                locale: es,
                              })
                            : 'Sin fecha'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
