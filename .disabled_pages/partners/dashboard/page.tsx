'use client';

import { useEffect, useState } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { useRouter } from 'next/navigation';
import { Users, Euro, Mail, TrendingUp, Building, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface DashboardData {
  partner: any;
  metrics: {
    totalClientes: number;
    totalComisionMes: string;
    totalComisionHistorica: string;
    totalPendientePago: string;
    invitacionesPendientes: number;
    invitacionesAceptadas: number;
    tasaConversion: string;
  };
  clientes: any[];
  comisiones: any[];
  invitacionesRecientes: any[];
}

export default function PartnerDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('partnerToken');
      
      if (!token) {
        router.push('/partners/login');
        return;
      }

      const response = await fetch('/api/partners/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('partnerToken');
          router.push('/partners/login');
          return;
        }
        throw new Error('Error al cargar el dashboard');
      }

      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-bg">
        
        
          
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error || 'Error al cargar los datos'}
        </div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Clientes Activos',
      value: data.metrics.totalClientes,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Comisión Este Mes',
      value: `€${data.metrics.totalComisionMes}`,
      icon: Euro,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Comisión Total',
      value: `€${data.metrics.totalComisionHistorica}`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Pendiente de Pago',
      value: `€${data.metrics.totalPendientePago}`,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      
      
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                ¡Hola, {data.partner.nombre}!
              </h1>
              <p className="text-gray-600">
                Aquí tienes un resumen de tu actividad como Partner
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">
                            {stat.title}
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {stat.value}
                          </p>
                        </div>
                        <div className={`${stat.bgColor} p-3 rounded-full`}>
                          <Icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Clientes Recientes */}
              <Card>
                <CardHeader>
                  <CardTitle>Clientes Recientes</CardTitle>
                  <CardDescription>
                    Últimos clientes que se han unido a través de tu Partner
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.clientes.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Aún no tienes clientes activos
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {data.clientes.slice(0, 5).map((cliente: any) => (
                        <div key={cliente.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="bg-primary/10 p-2 rounded-full">
                              <Building className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {cliente.company.nombre}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(cliente.fechaActivacion).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Activo
                          </span>
                        </div>
                      ))}
                      {data.clientes.length > 5 && (
                        <Link href="/partners/clients">
                          <Button variant="outline" className="w-full">
                            Ver todos los clientes ({data.clientes.length})
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Invitaciones Recientes */}
              <Card>
                <CardHeader>
                  <CardTitle>Invitaciones Recientes</CardTitle>
                  <CardDescription>
                    Estado de tus últimas invitaciones enviadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.invitacionesRecientes.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-gray-500 mb-4">Aún no has enviado invitaciones</p>
                      <Link href="/partners/invitations">
                        <Button>Enviar Invitación</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {data.invitacionesRecientes.slice(0, 5).map((inv: any) => {
                        let statusIcon;
                        let statusColor;
                        let statusText;

                        if (inv.estado === 'ACCEPTED') {
                          statusIcon = CheckCircle;
                          statusColor = 'text-green-600';
                          statusText = 'Aceptada';
                        } else if (inv.estado === 'PENDING') {
                          statusIcon = Clock;
                          statusColor = 'text-yellow-600';
                          statusText = 'Pendiente';
                        } else {
                          statusIcon = XCircle;
                          statusColor = 'text-gray-400';
                          statusText = 'Expirada';
                        }

                        const StatusIcon = statusIcon;

                        return (
                          <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Mail className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  {inv.email}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(inv.enviadoFecha).toLocaleDateString('es-ES')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1">
                              <StatusIcon className={`h-4 w-4 ${statusColor}`} />
                              <span className={`text-xs ${statusColor}`}>
                                {statusText}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      <Link href="/partners/invitations">
                        <Button variant="outline" className="w-full">
                          Ver todas las invitaciones
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Comisiones Mensuales */}
            <Card>
              <CardHeader>
                <CardTitle>Historial de Comisiones</CardTitle>
                <CardDescription>
                  Últimos 6 meses de comisiones generadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.comisiones.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    Aún no se han generado comisiones
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-5 gap-4 pb-2 border-b font-medium text-sm text-gray-600">
                      <div>Periodo</div>
                      <div>Cliente</div>
                      <div className="text-right">Monto Bruto</div>
                      <div className="text-right">% Comisión</div>
                      <div className="text-right">Tu Comisión</div>
                    </div>
                    {data.comisiones.map((com: any) => (
                      <div key={com.id} className="grid grid-cols-5 gap-4 py-2 text-sm">
                        <div className="font-medium">{com.periodo}</div>
                        <div className="text-gray-600 truncate">{com.planNombre || 'Plan Profesional'}</div>
                        <div className="text-right">€{com.montoBruto.toFixed(2)}</div>
                        <div className="text-right text-primary font-medium">{com.porcentaje}%</div>
                        <div className="text-right font-bold text-green-600">€{com.montoComision.toFixed(2)}</div>
                      </div>
                    ))}
                    <Link href="/partners/commissions">
                      <Button variant="outline" className="w-full mt-4">
                        Ver todas las comisiones
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-gradient-to-r from-primary to-primary/80 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2">¿Listo para crecer?</h3>
                    <p className="text-primary-foreground/90">
                      Invita a nuevos clientes y aumenta tus comisiones mensuales
                    </p>
                  </div>
                  <Link href="/partners/invitations">
                    <Button size="lg" variant="secondary">
                      Enviar Invitación
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
