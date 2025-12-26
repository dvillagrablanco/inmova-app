'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import {
  Building2,
  Home,
  FileText,
  TrendingUp,
  Users,
  Calendar,
  AlertCircle,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { MobileFAB } from '@/components/mobile/MobileFAB';
import { MobileSheet } from '@/components/mobile/MobileSheet';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import toast from 'react-hot-toast';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

interface DashboardStats {
  totalEdificios: number;
  totalUnidades: number;
  ocupacionPromedio: number;
  ingresosMensuales: number;
  contratosActivos: number;
  pagosVencidos: number;
}

export default function HomeMobilePage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const isMobile = useIsMobile();
  const [stats, setStats] = useState<DashboardStats>({
    totalEdificios: 0,
    totalUnidades: 0,
    ocupacionPromedio: 0,
    ingresosMensuales: 0,
    contratosActivos: 0,
    pagosVencidos: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Error al cargar las estadísticas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchStats();
    }
  }, [status]);

  const handleRefresh = async () => {
    await fetchStats();
    toast.success('¡Datos actualizados!');
  };

  const quickActions = [
    {
      id: 'building',
      label: 'Nuevo Edificio',
      icon: <Building2 className="h-6 w-6" />,
      href: '/edificios/nuevo',
      color: 'bg-blue-500',
    },
    {
      id: 'unit',
      label: 'Nueva Unidad',
      icon: <Home className="h-6 w-6" />,
      href: '/unidades/nueva',
      color: 'bg-green-500',
    },
    {
      id: 'contract',
      label: 'Nuevo Contrato',
      icon: <FileText className="h-6 w-6" />,
      href: '/contratos/nuevo',
      color: 'bg-purple-500',
    },
    {
      id: 'tenant',
      label: 'Nuevo Inquilino',
      icon: <Users className="h-6 w-6" />,
      href: '/inquilinos/nuevo',
      color: 'bg-orange-500',
    },
  ];

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const mainContent = (
    <div className="space-y-6 pb-safe-bottom">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-white">
        <CardContent className="pt-6">
          <h1 className="text-2xl font-bold mb-2">
            ¡Hola, {session?.user?.name || 'Usuario'}!
          </h1>
          <p className="text-white/90">
            Bienvenido a tu dashboard de gestión inmobiliaria
          </p>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="responsive-grid">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Edificios</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEdificios}</div>
            <p className="text-xs text-muted-foreground">En cartera</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unidades</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUnidades}</div>
            <p className="text-xs text-muted-foreground">Total disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocupación</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ocupacionPromedio}%</div>
            <p className="text-xs text-muted-foreground">Promedio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{stats.ingresosMensuales.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Mensuales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contratosActivos}</div>
            <p className="text-xs text-muted-foreground">Activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.pagosVencidos}
            </div>
            <p className="text-xs text-muted-foreground">Pagos vencidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Links */}
      <Card>
        <CardHeader>
          <CardTitle>Acceso Rápido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/edificios">
              <div className="p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors text-center cursor-pointer">
                <Building2 className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium">Edificios</p>
              </div>
            </Link>
            <Link href="/unidades">
              <div className="p-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors text-center cursor-pointer">
                <Home className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-sm font-medium">Unidades</p>
              </div>
            </Link>
            <Link href="/contratos">
              <div className="p-4 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors text-center cursor-pointer">
                <FileText className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="text-sm font-medium">Contratos</p>
              </div>
            </Link>
            <Link href="/inquilinos">
              <div className="p-4 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors text-center cursor-pointer">
                <Users className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <p className="text-sm font-medium">Inquilinos</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximos Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No hay eventos próximos programados.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <AuthenticatedLayout>
      <div className="container-mobile-first py-6">
            {isMobile ? (
              <PullToRefresh onRefresh={handleRefresh}>
                {mainContent}
              </PullToRefresh>
            ) : (
              mainContent
            )}
      </div>

      {/* Mobile FAB for Quick Actions */}
      {isMobile && (
          <>
            <MobileFAB onClick={() => setIsQuickActionsOpen(true)} label="Acciones rápidas" />
            <MobileSheet
              isOpen={isQuickActionsOpen}
              onClose={() => setIsQuickActionsOpen(false)}
              title="Acciones Rápidas"
            >
              <div className="space-y-3">
                {quickActions.map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    className="w-full justify-start h-14"
                    onClick={() => {
                      router.push(action.href);
                      setIsQuickActionsOpen(false);
                    }}
                  >
                    <div className={`p-2 rounded-lg ${action.color} text-white mr-3`}>
                      {action.icon}
                    </div>
                    <span className="font-medium">{action.label}</span>
                  </Button>
                ))}
              </div>
            </MobileSheet>
          </>
        )}
    </div>
      </AuthenticatedLayout>
  );
}
