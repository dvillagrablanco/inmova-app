'use client';

export const dynamic = 'force-dynamic';

/**
 * Real Estate Developer - Comercial
 * 
 * Gestión del equipo comercial y seguimiento de ventas
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  TrendingUp,
  Target,
  Euro,
  Phone,
  Calendar,
  CheckCircle,
  Clock,
  Award,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';

interface Comercial {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  proyectosAsignados: string[];
  ventasMes: number;
  objetivoMes: number;
  ventasAnual: number;
  leadsPendientes: number;
  citasSemana: number;
}

// Datos cargados desde API /api/real-estate-developer/commercial

interface Cita {
  id: string;
  cliente: string;
  tipo: string;
  proyecto: string;
  comercial: string;
  fecha: string;
  hora: string;
}

export default function RealEstateDeveloperCommercialPage() {
  const [comerciales, setComerciales] = useState<Comercial[]>([]);
  const [citasProximas, setCitasProximas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComerciales = async () => {
      try {
        const response = await fetch('/api/real-estate-developer/commercial');
        if (response.ok) {
          const data = await response.json();
          setComerciales(data.data?.comerciales || data.data || []);
          setCitasProximas(data.data?.citasProximas || []);
        }
      } catch (error) {
        console.error('Error fetching commercial:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchComerciales();
  }, []);

  // Stats totales
  const stats = {
    totalComerciales: comerciales.length,
    ventasMes: comerciales.reduce((acc, c) => acc + c.ventasMes, 0),
    leadsPendientes: comerciales.reduce((acc, c) => acc + c.leadsPendientes, 0),
    citasSemana: comerciales.reduce((acc, c) => acc + c.citasSemana, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Equipo Comercial
          </h1>
          <p className="text-muted-foreground">
            Gestión y seguimiento del equipo de ventas
          </p>
        </div>
        <Button>
          <BarChart3 className="h-4 w-4 mr-2" />
          Ver Informes
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Equipo</p>
                <p className="text-2xl font-bold">{stats.totalComerciales}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ventas Mes</p>
                <p className="text-2xl font-bold text-green-600">{stats.ventasMes}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Leads Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.leadsPendientes}</p>
              </div>
              <Target className="h-8 w-8 text-yellow-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Citas Semana</p>
                <p className="text-2xl font-bold">{stats.citasSemana}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Objetivos del Mes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Objetivos del Mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Ventas</span>
                <span className="font-medium">
                  {OBJETIVOS_MENSUALES.ventasActuales}/{OBJETIVOS_MENSUALES.ventasObjetivo}
                </span>
              </div>
              <Progress
                value={
                  (OBJETIVOS_MENSUALES.ventasActuales / OBJETIVOS_MENSUALES.ventasObjetivo) * 100
                }
              />
              <p className="text-xs text-muted-foreground">
                {Math.round(
                  (OBJETIVOS_MENSUALES.ventasActuales / OBJETIVOS_MENSUALES.ventasObjetivo) * 100
                )}
                % del objetivo
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Visitas</span>
                <span className="font-medium">
                  {OBJETIVOS_MENSUALES.visitasActuales}/{OBJETIVOS_MENSUALES.visitasObjetivo}
                </span>
              </div>
              <Progress
                value={
                  (OBJETIVOS_MENSUALES.visitasActuales / OBJETIVOS_MENSUALES.visitasObjetivo) * 100
                }
              />
              <p className="text-xs text-muted-foreground">
                {Math.round(
                  (OBJETIVOS_MENSUALES.visitasActuales / OBJETIVOS_MENSUALES.visitasObjetivo) * 100
                )}
                % del objetivo
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Leads</span>
                <span className="font-medium">
                  {OBJETIVOS_MENSUALES.leadsActuales}/{OBJETIVOS_MENSUALES.leadsObjetivo}
                </span>
              </div>
              <Progress
                value={
                  (OBJETIVOS_MENSUALES.leadsActuales / OBJETIVOS_MENSUALES.leadsObjetivo) * 100
                }
              />
              <p className="text-xs text-muted-foreground">
                {Math.round(
                  (OBJETIVOS_MENSUALES.leadsActuales / OBJETIVOS_MENSUALES.leadsObjetivo) * 100
                )}
                % del objetivo
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Equipo Comercial */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento del Equipo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {comerciales.map((comercial) => {
                const porcentajeObjetivo = Math.round(
                  (comercial.ventasMes / comercial.objetivoMes) * 100
                );
                return (
                  <div key={comercial.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-blue-100 text-blue-700">
                            {comercial.nombre
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{comercial.nombre}</h4>
                          <p className="text-sm text-muted-foreground">
                            {comercial.proyectosAsignados.join(', ')}
                          </p>
                        </div>
                      </div>
                      {porcentajeObjetivo >= 100 && (
                        <Badge className="bg-green-100 text-green-700">
                          <Award className="h-3 w-3 mr-1" />
                          Objetivo alcanzado
                        </Badge>
                      )}
                    </div>
                    <div className="mt-4 grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold text-green-600">
                          {comercial.ventasMes}/{comercial.objetivoMes}
                        </p>
                        <p className="text-xs text-muted-foreground">Ventas/Mes</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{comercial.ventasAnual}</p>
                        <p className="text-xs text-muted-foreground">Ventas Año</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-yellow-600">
                          {comercial.leadsPendientes}
                        </p>
                        <p className="text-xs text-muted-foreground">Leads</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-blue-600">
                          {comercial.citasSemana}
                        </p>
                        <p className="text-xs text-muted-foreground">Citas</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Objetivo mensual</span>
                        <span className="font-medium">{porcentajeObjetivo}%</span>
                      </div>
                      <Progress value={Math.min(porcentajeObjetivo, 100)} />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Phone className="h-4 w-4 mr-1" />
                        Contactar
                      </Button>
                      <Button size="sm" className="flex-1">
                        Ver Actividad
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Citas Próximas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximas Citas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {citasProximas.map((cita) => (
              <div
                key={cita.id}
                className="p-3 border rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">{cita.cliente}</p>
                  <Badge variant="outline" className="text-xs">
                    {cita.tipo}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{cita.proyecto}</p>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{cita.comercial}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {cita.fecha} - {cita.hora}
                  </span>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              Ver Agenda Completa
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
