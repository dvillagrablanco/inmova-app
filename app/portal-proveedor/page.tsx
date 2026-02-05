'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ClipboardList,
  FileText,
  DollarSign,
  MessageSquare,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface DashboardStats {
  ordenesPendientes: number;
  ordenesCompletadas: number;
  presupuestosPendientes: number;
  facturasPendientes: number;
  ingresosMes: number;
  calificacionPromedio: number;
}

export default function PortalProveedorPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/portal-proveedor/dashboard');
      if (response.ok) {
        const data = await response.json();
        setStats(
          data.data || {
            ordenesPendientes: 0,
            ordenesCompletadas: 0,
            presupuestosPendientes: 0,
            facturasPendientes: 0,
            ingresosMes: 0,
            calificacionPromedio: 0,
          }
        );
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const cards = [
    {
      title: 'Órdenes de Trabajo',
      description: 'Ver órdenes asignadas',
      icon: ClipboardList,
      href: '/portal-proveedor/ordenes',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Presupuestos',
      description: 'Gestionar presupuestos',
      icon: FileText,
      href: '/portal-proveedor/presupuestos',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Facturas',
      description: 'Facturación y cobros',
      icon: DollarSign,
      href: '/portal-proveedor/facturas',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Chat',
      description: 'Comunicación con clientes',
      icon: MessageSquare,
      href: '/portal-proveedor/chat',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Reseñas',
      description: 'Ver valoraciones',
      icon: Star,
      href: '/portal-proveedor/resenas',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Portal de Proveedores</h1>
          <p className="text-gray-600 mt-2">Gestión de servicios y órdenes de trabajo</p>
        </div>
        <Button variant="outline" onClick={fetchDashboard} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                {loading ? (
                  <Skeleton className="h-6 w-8" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.ordenesPendientes || 0}</p>
                )}
                <p className="text-xs text-muted-foreground">Órdenes Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                {loading ? (
                  <Skeleton className="h-6 w-8" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.ordenesCompletadas || 0}</p>
                )}
                <p className="text-xs text-muted-foreground">Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                {loading ? (
                  <Skeleton className="h-6 w-8" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.presupuestosPendientes || 0}</p>
                )}
                <p className="text-xs text-muted-foreground">Presupuestos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                {loading ? (
                  <Skeleton className="h-6 w-8" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.facturasPendientes || 0}</p>
                )}
                <p className="text-xs text-muted-foreground">Facturas Pend.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                {loading ? (
                  <Skeleton className="h-6 w-12" />
                ) : (
                  <p className="text-2xl font-bold">
                    {(stats?.ingresosMes || 0).toLocaleString()}€
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Ingresos Mes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                {loading ? (
                  <Skeleton className="h-6 w-8" />
                ) : (
                  <p className="text-2xl font-bold">
                    {(stats?.calificacionPromedio || 0).toFixed(1)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Calificación</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div
                  className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center mb-2`}
                >
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Acceder
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
