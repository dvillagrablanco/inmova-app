'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Home,
  FileText,
  CreditCard,
  Wrench,
  LogOut,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  tenant: {
    id: string;
    nombreCompleto: string;
    email: string;
    telefono: string;
    dni: string;
  };
  contracts: any[];
  payments: any[];
  maintenanceRequests: any[];
  stats: {
    contractsCount: number;
    paymentsCount: number;
    maintenanceCount: number;
    totalPagado: number;
    totalPendiente: number;
  };
}

export default function PortalInquilinoDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('tenant_token');
      if (!token) {
        router.push('/portal-inquilino/login');
        return;
      }

      const res = await fetch('/api/portal-inquilino/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const dashboardData = await res.json();
        setData(dashboardData);
      } else {
        toast.error('Sesión expirada');
        localStorage.removeItem('tenant_token');
        router.push('/portal-inquilino/login');
      }
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tenant_token');
    router.push('/portal-inquilino/login');
    toast.success('Sesión cerrada');
  };

  const getPaymentBadge = (estado: string) => {
    switch (estado) {
      case 'pagado':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Pagado' };
      case 'pendiente':
        return { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pendiente' };
      case 'atrasado':
        return { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Atrasado' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: Clock, label: estado };
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-black rounded-full">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">INMOVA</h1>
                <p className="text-sm text-muted-foreground">Portal del Inquilino</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Bienvenida */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Hola, {data.tenant.nombreCompleto}</h2>
          <p className="text-muted-foreground mt-1">
            Bienvenido a tu portal de inquilino
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Contratos Activos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.contractsCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                €{data.stats.totalPagado.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pendiente de Pago</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                €{data.stats.totalPendiente.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mantenimiento</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.maintenanceCount}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Contratos */}
          <Card>
            <CardHeader>
              <CardTitle>Mis Contratos</CardTitle>
            </CardHeader>
            <CardContent>
              {data.contracts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay contratos activos</p>
              ) : (
                <div className="space-y-4">
                  {data.contracts.map((contract) => (
                    <div key={contract.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold">
                          {contract.unit.building.nombre} - {contract.unit.numero}
                        </p>
                        <Badge>Activo</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Renta: €{contract.rentaMensual}/mes
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Desde:{' '}
                        {new Date(contract.fechaInicio).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagos Recientes */}
          <Card>
            <CardHeader>
              <CardTitle>Pagos Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              {data.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay pagos registrados</p>
              ) : (
                <div className="space-y-3">
                  {data.payments.slice(0, 5).map((payment) => {
                    const badge = getPaymentBadge(payment.estado);
                    const Icon = badge.icon;
                    return (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between border-b pb-3 last:border-0"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{payment.periodo}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.fechaVencimiento).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-bold">€{payment.monto}</p>
                          <Badge className={badge.color}>
                            <Icon className="mr-1 h-3 w-3" />
                            {badge.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Solicitudes de Mantenimiento */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Solicitudes de Mantenimiento</CardTitle>
              <Link href="/portal-inquilino/mantenimiento">
                <Button size="sm">
                  <Wrench className="mr-2 h-4 w-4" />
                  Nueva Solicitud
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.maintenanceRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay solicitudes de mantenimiento
              </p>
            ) : (
              <div className="space-y-3">
                {data.maintenanceRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold">{request.titulo}</p>
                      <Badge
                        className={
                          request.estado === 'completado'
                            ? 'bg-green-100 text-green-800'
                            : request.estado === 'en_progreso'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {request.estado}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{request.descripcion}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Creado: {new Date(request.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
