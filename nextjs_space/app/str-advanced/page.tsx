'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Hotel,
  Zap,
  DollarSign,
  RefreshCw,
  Calendar,
  Users,
  Star,
  TrendingUp,
  Settings,
  BarChart3,
  Sparkles,
  Wrench,
  FileText,
  Shield
} from 'lucide-react';

const STR_MODULES = [
  {
    id: 'channel-manager',
    title: 'Channel Manager',
    description: 'Gestiona todos tus canales de reserva desde un solo lugar',
    icon: Zap,
    href: '/str-advanced/channel-manager',
    color: 'bg-blue-500',
    features: ['Sincronización bidireccional', 'Pricing dinámico', 'Análisis de competencia']
  },
  {
    id: 'revenue',
    title: 'Revenue Management',
    description: 'Optimiza tus precios con algoritmos inteligentes',
    icon: DollarSign,
    href: '/str-advanced/revenue',
    color: 'bg-green-500',
    features: ['Pricing automático', 'Reglas dinámicas', 'Proyecciones de ingresos']
  },
  {
    id: 'housekeeping',
    title: 'Housekeeping',
    description: 'Gestiona la limpieza y turnovers eficientemente',
    icon: Wrench,
    href: '/str-advanced/housekeeping',
    color: 'bg-purple-500',
    features: ['App móvil', 'Asignación automática', 'Control de inventario']
  },
  {
    id: 'guest-experience',
    title: 'Guest Experience',
    description: 'Mejora la experiencia de tus huéspedes',
    icon: Star,
    href: '/str-advanced/guest-experience',
    color: 'bg-amber-500',
    features: ['Guía digital', 'Upselling', 'Comunicación automatizada']
  },
  {
    id: 'legal',
    title: 'Compliance & Legal',
    description: 'Mantén tu negocio en regla',
    icon: Shield,
    href: '/str-advanced/legal',
    color: 'bg-red-500',
    features: ['Licencias', 'Impuesto turístico', 'Registro de viajeros']
  },
];

export default function STRAdvancedPage() {
  const { data: session, status } = useSession() || {};
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/str/channel-manager');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            STR Avanzado
          </h1>
          <p className="text-muted-foreground mt-1">
            Herramientas avanzadas para gestionar tu negocio de alquiler vacacional
          </p>
        </div>
        
        <div className="flex gap-2">
          <Link href="/str">
            <Button variant="outline">
              <Hotel className="h-4 w-4 mr-2" />
              Dashboard STR
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Canales Activos</p>
                  <p className="text-2xl font-bold">{stats.channels?.length || 0}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tasa de Sincronización</p>
                  <p className="text-2xl font-bold">{stats.syncStats?.tasaExito || 100}%</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sincronizaciones (30d)</p>
                  <p className="text-2xl font-bold">{stats.syncStats?.total || 0}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Errores</p>
                  <p className="text-2xl font-bold text-red-600">{stats.syncStats?.fallidos || 0}</p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {STR_MODULES.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.id} href={module.href}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${module.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant="secondary" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Ver más
                    </Badge>
                  </div>
                  <CardTitle className="mt-4">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {module.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity */}
      {stats?.recentSyncs?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Ultimas sincronizaciones de canales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentSyncs.slice(0, 5).map((sync: any) => (
                <div key={sync.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${sync.exitoso ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="text-sm font-medium">{sync.tipoEvento.replace('_', ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sync.iniciadoEn).toLocaleString('es-ES')}
                      </p>
                    </div>
                  </div>
                  <Badge variant={sync.exitoso ? 'default' : 'destructive'}>
                    {sync.exitoso ? 'Exitoso' : 'Error'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
