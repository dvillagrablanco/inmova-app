'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Euro, TrendingUp, Clock, CheckCircle, Calendar, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface CommissionsData {
  comisiones: any[];
  totales: {
    pending: number;
    approved: number;
    paid: number;
    total: number;
  };
}

export default function PartnerCommissionsPage() {
  const router = useRouter();
  const [data, setData] = useState<CommissionsData | null>(null);
  const [filteredComisiones, setFilteredComisiones] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchComisiones();
  }, []);

  useEffect(() => {
    if (data) {
      if (filterStatus === 'all') {
        setFilteredComisiones(data.comisiones);
      } else {
        setFilteredComisiones(data.comisiones.filter((c) => c.estado === filterStatus));
      }
    }
  }, [filterStatus, data]);

  const fetchComisiones = async () => {
    try {
      const token = localStorage.getItem('partnerToken');
      if (!token) {
        router.push('/partners/login');
        return;
      }

      const response = await fetch('/api/partners/commissions', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Error al cargar comisiones');
      }

      const commissionsData = await response.json();
      setData(commissionsData);
      setFilteredComisiones(commissionsData.comisiones);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Cargando comisiones...</div>;
  }

  if (error || !data) {
    return <div className="p-8 text-red-600">{error || 'Error al cargar datos'}</div>;
  }

  const getStatusBadge = (estado: string) => {
    const badges: any = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente', icon: Clock },
      APPROVED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Aprobada', icon: CheckCircle },
      PAID: { bg: 'bg-green-100', text: 'text-green-800', label: 'Pagada', icon: CheckCircle },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelada', icon: Clock },
    };
    return badges[estado] || badges.PENDING;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Comisiones</h1>
              <p className="text-gray-600">Visualiza y gestiona tus comisiones</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Total Comisiones</p>
                      <p className="text-2xl font-bold text-gray-900">
                        €{data.totales.total.toFixed(2)}
                      </p>
                    </div>
                    <Euro className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Pendientes</p>
                      <p className="text-2xl font-bold text-gray-900">
                        €{data.totales.pending.toFixed(2)}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Aprobadas</p>
                      <p className="text-2xl font-bold text-gray-900">
                        €{data.totales.approved.toFixed(2)}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Pagadas</p>
                      <p className="text-2xl font-bold text-gray-900">
                        €{data.totales.paid.toFixed(2)}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filtros</CardTitle>
                <CardDescription>Filtra las comisiones por estado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Filter className="h-5 w-5 text-gray-400" />
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="PENDING">Pendientes</SelectItem>
                      <SelectItem value="APPROVED">Aprobadas</SelectItem>
                      <SelectItem value="PAID">Pagadas</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-600">
                    {filteredComisiones.length} comisión
                    {filteredComisiones.length !== 1 ? 'es' : ''}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Comisiones List */}
            <Card>
              <CardHeader>
                <CardTitle>Historial de Comisiones</CardTitle>
                <CardDescription>Detalle completo de todas tus comisiones</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredComisiones.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {filterStatus === 'all'
                      ? 'Aún no se han generado comisiones'
                      : 'No hay comisiones con este estado'}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="hidden md:grid grid-cols-6 gap-4 pb-3 border-b font-medium text-sm text-gray-600">
                      <div>Periodo</div>
                      <div>Cliente</div>
                      <div className="text-right">Monto Bruto</div>
                      <div className="text-right">% Comisión</div>
                      <div className="text-right">Tu Comisión</div>
                      <div className="text-center">Estado</div>
                    </div>

                    {/* Rows */}
                    {filteredComisiones.map((com: any) => {
                      const statusBadge = getStatusBadge(com.estado);
                      const StatusIcon = statusBadge.icon;

                      return (
                        <div
                          key={com.id}
                          className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            {/* Periodo */}
                            <div className="flex items-center">
                              <Calendar className="h-5 w-5 text-gray-400 mr-2 md:hidden" />
                              <div>
                                <p className="font-medium text-gray-900">{com.periodo}</p>
                                <p className="text-xs text-gray-500 md:hidden">Periodo</p>
                              </div>
                            </div>

                            {/* Cliente */}
                            <div>
                              <p className="font-medium text-gray-900">
                                {com.company?.nombre || 'Cliente'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {com.planNombre || 'Plan Profesional'}
                              </p>
                            </div>

                            {/* Monto Bruto */}
                            <div className="text-left md:text-right">
                              <p className="font-medium text-gray-900">
                                €{com.montoBruto.toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">Monto bruto</p>
                            </div>

                            {/* Porcentaje */}
                            <div className="text-left md:text-right">
                              <p className="font-bold text-primary">{com.porcentaje}%</p>
                              <p className="text-xs text-gray-500">Tu %</p>
                            </div>

                            {/* Comisión */}
                            <div className="text-left md:text-right">
                              <p className="font-bold text-green-600 text-lg">
                                €{com.montoComision.toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">Tu comisión</p>
                            </div>

                            {/* Estado */}
                            <div className="flex items-center justify-start md:justify-center">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text} flex items-center space-x-1`}
                              >
                                <StatusIcon className="h-3 w-3" />
                                <span>{statusBadge.label}</span>
                              </span>
                            </div>
                          </div>

                          {/* Additional Info */}
                          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 grid grid-cols-2 gap-2">
                            <div>
                              Clientes activos:{' '}
                              <span className="font-medium">{com.clientesActivos}</span>
                            </div>
                            <div>
                              Creada:{' '}
                              <span className="font-medium">
                                {new Date(com.createdAt).toLocaleDateString('es-ES')}
                              </span>
                            </div>
                            {com.fechaPago && (
                              <div className="col-span-2 text-green-600">
                                Pagada el:{' '}
                                <span className="font-medium">
                                  {new Date(com.fechaPago).toLocaleDateString('es-ES')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Box */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-600 p-2 rounded-full">
                    <Euro className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">
                      ¿Cómo funcionan las comisiones?
                    </h4>
                    <p className="text-sm text-blue-800">
                      Las comisiones se calculan automáticamente cada mes según el número de
                      clientes activos que tengas. Cuantos más clientes, mayor será tu porcentaje de
                      comisión (hasta un 70%). Las comisiones se aprueban y pagan mensualmente según
                      los términos del programa de Partners.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
