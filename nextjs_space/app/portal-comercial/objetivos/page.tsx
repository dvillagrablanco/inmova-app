'use client';

import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';

import { useEffect, useState } from 'react';
import logger from '@/lib/logger';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { toast } from 'sonner';
import {
  Target,
  ArrowLeft,
  Calendar,
  TrendingUp,
  Users,
  CheckCircle,
  DollarSign,
  Award,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface Objetivo {
  id: string;
  periodo: string;
  fechaInicio: Date;
  fechaFin: Date;
  metaVentas: number | null;
  metaLeads: number | null;
  metaConversiones: number | null;
  metaRevenue: number | null;
  ventasActuales: number;
  leadsActuales: number;
  conversionesActuales: number;
  revenueActual: number;
  descripcion: string | null;
  activo: boolean;
}

export default function ObjetivosPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      loadObjetivos();
    }
  }, [session]);

  const loadObjetivos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sales/targets?activo=true');
      if (response.ok) {
        const data = await response.json();
        setObjetivos(data);
      } else {
        toast.error('Error al cargar objetivos');
      }
    } catch (error) {
      logger.error('Error loading targets:', error);
      toast.error('Error al cargar objetivos');
    } finally {
      setLoading(false);
    }
  };

  const calcularProgreso = (actual: number, meta: number | null): number => {
    if (!meta || meta === 0) return 0;
    return Math.min(100, (actual / meta) * 100);
  };

  const isObjetivoActivo = (objetivo: Objetivo): boolean => {
    const now = new Date();
    const inicio = new Date(objetivo.fechaInicio);
    const fin = new Date(objetivo.fechaFin);
    return now >= inicio && now <= fin && objetivo.activo;
  };

  const getDiasRestantes = (objetivo: Objetivo): number => {
    const now = new Date();
    const fin = new Date(objetivo.fechaFin);
    return differenceInDays(fin, now);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <LoadingState message="Cargando objetivos..." />
            </div>
          </main>
        </div>
      </div>
    );
  }

  const objetivosActivos = objetivos.filter(isObjetivoActivo);
  const objetivosHistoricos = objetivos.filter((o) => !isObjetivoActivo(o));

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/portal-comercial">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold gradient-text">Mis Objetivos</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                  Seguimiento de objetivos y metas comerciales
                </p>
              </div>
            </div>
            <Button onClick={loadObjetivos} variant="outline">
              Actualizar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Objetivos Activos */}
        <div>
          <h2 className="text-xl font-bold mb-4">Objetivos Activos</h2>
            {objetivosActivos.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">
                    No tienes objetivos activos
                  </p>
                  <p className="text-sm">
                    Los objetivos serán asignados por tu administrador
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {objetivosActivos.map((objetivo) => {
                const diasRestantes = getDiasRestantes(objetivo);
                const progresoLeads = calcularProgreso(
                  objetivo.leadsActuales,
                  objetivo.metaLeads
                );
                const progresoConversiones = calcularProgreso(
                  objetivo.conversionesActuales,
                  objetivo.metaConversiones
                );
                const progresoVentas = calcularProgreso(
                  objetivo.ventasActuales,
                  objetivo.metaVentas
                );
                const progresoRevenue = calcularProgreso(
                  objetivo.revenueActual,
                  objetivo.metaRevenue
                );

                // Calcular progreso general
                let contadores = 0;
                let sumaProgreso = 0;
                if (objetivo.metaLeads) {
                  contadores++;
                  sumaProgreso += progresoLeads;
                }
                if (objetivo.metaConversiones) {
                  contadores++;
                  sumaProgreso += progresoConversiones;
                }
                if (objetivo.metaVentas) {
                  contadores++;
                  sumaProgreso += progresoVentas;
                }
                if (objetivo.metaRevenue) {
                  contadores++;
                  sumaProgreso += progresoRevenue;
                }
                const progresoGeneral = contadores > 0 ? sumaProgreso / contadores : 0;

                return (
                  <Card key={objetivo.id} className="card-hover">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Target className="h-6 w-6 text-primary" />
                          <div>
                            <CardTitle>Objetivos - {objetivo.periodo}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                              {format(new Date(objetivo.fechaInicio), "d 'de' MMM", {
                                locale: es,
                              })}
                              {' - '}
                              {format(new Date(objetivo.fechaFin), "d 'de' MMM 'de' yyyy", {
                                locale: es,
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={diasRestantes > 7 ? 'default' : 'destructive'}
                            className="mb-2"
                          >
                            {diasRestantes > 0
                              ? `${diasRestantes} días restantes`
                              : 'Finalizado'}
                          </Badge>
                          <div className="text-2xl font-bold">
                            {progresoGeneral.toFixed(0)}%
                          </div>
                          <p className="text-xs text-muted-foreground">Progreso general</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {objetivo.descripcion && (
                        <p className="text-sm text-muted-foreground pb-4 border-b">
                          {objetivo.descripcion}
                        </p>
                      )}

                      {/* Metas */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Leads */}
                        {objetivo.metaLeads && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Leads Generados</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {objetivo.leadsActuales} / {objetivo.metaLeads}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
                                style={{ width: `${Math.min(100, progresoLeads)}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {progresoLeads.toFixed(0)}% completado
                            </p>
                          </div>
                        )}

                        {/* Conversiones */}
                        {objetivo.metaConversiones && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Conversiones</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {objetivo.conversionesActuales} / {objetivo.metaConversiones}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all"
                                style={{ width: `${Math.min(100, progresoConversiones)}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {progresoConversiones.toFixed(0)}% completado
                            </p>
                          </div>
                        )}

                        {/* Ventas */}
                        {objetivo.metaVentas && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Ventas</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {objetivo.ventasActuales} / {objetivo.metaVentas}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all"
                                style={{ width: `${Math.min(100, progresoVentas)}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {progresoVentas.toFixed(0)}% completado
                            </p>
                          </div>
                        )}

                        {/* Revenue */}
                        {objetivo.metaRevenue && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Revenue</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {objetivo.revenueActual.toFixed(2)}€ /{' '}
                                {objetivo.metaRevenue.toFixed(2)}€
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-3 rounded-full transition-all"
                                style={{ width: `${Math.min(100, progresoRevenue)}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {progresoRevenue.toFixed(0)}% completado
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Mensaje de cumplimiento */}
                      {progresoGeneral >= 100 && (
                        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                          <Award className="h-8 w-8 text-green-600" />
                          <div>
                            <p className="font-medium text-green-900">
                              ¡Felicidades! Has alcanzado tu objetivo
                            </p>
                            <p className="text-sm text-green-700">
                              Excelente trabajo este período
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Objetivos Históricos */}
        {objetivosHistoricos.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Objetivos Anteriores</h2>
              <div className="space-y-4">
              {objetivosHistoricos.map((objetivo) => {
                const progresoLeads = calcularProgreso(
                  objetivo.leadsActuales,
                  objetivo.metaLeads
                );
                const progresoConversiones = calcularProgreso(
                  objetivo.conversionesActuales,
                  objetivo.metaConversiones
                );
                const progresoVentas = calcularProgreso(
                  objetivo.ventasActuales,
                  objetivo.metaVentas
                );
                const progresoRevenue = calcularProgreso(
                  objetivo.revenueActual,
                  objetivo.metaRevenue
                );

                let contadores = 0;
                let sumaProgreso = 0;
                if (objetivo.metaLeads) {
                  contadores++;
                  sumaProgreso += progresoLeads;
                }
                if (objetivo.metaConversiones) {
                  contadores++;
                  sumaProgreso += progresoConversiones;
                }
                if (objetivo.metaVentas) {
                  contadores++;
                  sumaProgreso += progresoVentas;
                }
                if (objetivo.metaRevenue) {
                  contadores++;
                  sumaProgreso += progresoRevenue;
                }
                const progresoGeneral = contadores > 0 ? sumaProgreso / contadores : 0;

                return (
                  <Card key={objetivo.id} className="opacity-75">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{objetivo.periodo}</h3>
                            <p className="text-sm text-muted-foreground">
                            {format(new Date(objetivo.fechaInicio), "d 'de' MMM", {
                              locale: es,
                            })}
                            {' - '}
                            {format(new Date(objetivo.fechaFin), "d 'de' MMM 'de' yyyy", {
                              locale: es,
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {progresoGeneral.toFixed(0)}%
                          </div>
                          <Badge
                            variant={progresoGeneral >= 100 ? 'default' : 'outline'}
                            className="mt-1"
                          >
                            {progresoGeneral >= 100 ? 'Cumplido' : 'No cumplido'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
