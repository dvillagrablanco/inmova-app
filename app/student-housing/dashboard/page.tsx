'use client';

/**
 * Student Housing - Dashboard
 * 
 * Panel de control para gestión de residencias estudiantiles
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  GraduationCap,
  Home,
  Users,
  Euro,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Bed,
  CalendarDays,
  PartyPopper,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';

const STATS = {
  totalCamas: 256,
  ocupadas: 234,
  disponibles: 22,
  ocupacion: 91.4,
  ingresosMes: 89500,
  pagosAlDia: 87,
  solicitudesPendientes: 12,
  mantenimientoPendiente: 5,
};

const RESIDENTES_POR_CURSO = [
  { curso: '1º Universidad', count: 85 },
  { curso: '2º Universidad', count: 72 },
  { curso: '3º Universidad', count: 45 },
  { curso: '4º Universidad', count: 32 },
];

const PROXIMOS_EVENTOS = [
  { id: 1, titulo: 'Noche de estudio grupal', fecha: '2026-01-22', asistentes: 28 },
  { id: 2, titulo: 'Torneo de videojuegos', fecha: '2026-01-25', asistentes: 45 },
  { id: 3, titulo: 'Charla: Orientación laboral', fecha: '2026-01-28', asistentes: 62 },
];

const ALERTAS = [
  { id: 1, tipo: 'pago', mensaje: '3 estudiantes con pago pendiente > 15 días', severidad: 'alta' },
  { id: 2, tipo: 'mantenimiento', mensaje: 'Avería en caldera edificio B', severidad: 'media' },
  { id: 3, tipo: 'ocupacion', mensaje: 'Disponibilidad baja para próximo curso', severidad: 'baja' },
];

export default function StudentHousingDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            Student Housing
          </h1>
          <p className="text-muted-foreground">
            Gestión de residencias estudiantiles
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/student-housing/aplicaciones">
              Ver Solicitudes
            </Link>
          </Button>
          <Button asChild>
            <Link href="/student-housing/residentes">
              Gestionar Residentes
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ocupación</p>
                <p className="text-2xl font-bold">{STATS.ocupacion}%</p>
                <p className="text-xs text-muted-foreground">
                  {STATS.ocupadas}/{STATS.totalCamas} camas
                </p>
              </div>
              <Bed className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Residentes</p>
                <p className="text-2xl font-bold">{STATS.ocupadas}</p>
                <p className="text-xs text-green-600">+12 este mes</p>
              </div>
              <Users className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos/mes</p>
                <p className="text-2xl font-bold">€{STATS.ingresosMes.toLocaleString()}</p>
                <p className="text-xs text-green-600">+5.2% vs anterior</p>
              </div>
              <Euro className="h-8 w-8 text-emerald-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Solicitudes</p>
                <p className="text-2xl font-bold">{STATS.solicitudesPendientes}</p>
                <p className="text-xs text-muted-foreground">pendientes</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Ocupación por Edificio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Ocupación por Edificio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {['Edificio A', 'Edificio B', 'Edificio C'].map((edificio, i) => {
              const ocupacion = [95, 89, 92][i];
              return (
                <div key={edificio} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{edificio}</span>
                    <span className="text-muted-foreground">{ocupacion}%</span>
                  </div>
                  <Progress value={ocupacion} />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Residentes por Curso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Residentes por Curso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {RESIDENTES_POR_CURSO.map((item) => (
              <div key={item.curso} className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm font-medium">{item.curso}</span>
                <Badge variant="secondary">{item.count} estudiantes</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Próximos Eventos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PartyPopper className="h-5 w-5" />
              Próximos Eventos
            </CardTitle>
            <CardDescription>
              Actividades programadas para residentes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {PROXIMOS_EVENTOS.map((evento) => (
              <div key={evento.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{evento.titulo}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {evento.fecha}
                  </p>
                </div>
                <Badge variant="outline">{evento.asistentes} inscritos</Badge>
              </div>
            ))}
            <Button variant="outline" className="w-full" asChild>
              <Link href="/student-housing/actividades">Ver todos los eventos</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas Activas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ALERTAS.map((alerta) => (
              <div
                key={alerta.id}
                className={`p-3 rounded-lg ${
                  alerta.severidad === 'alta'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200'
                    : alerta.severidad === 'media'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200'
                } border`}
              >
                <p className="text-sm font-medium">{alerta.mensaje}</p>
                <Badge
                  variant="outline"
                  className={`mt-1 ${
                    alerta.severidad === 'alta'
                      ? 'border-red-500 text-red-600'
                      : alerta.severidad === 'media'
                      ? 'border-yellow-500 text-yellow-600'
                      : 'border-blue-500 text-blue-600'
                  }`}
                >
                  {alerta.tipo}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <Link href="/student-housing/residentes">
                <Users className="h-6 w-6 mb-2" />
                <span>Residentes</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <Link href="/student-housing/habitaciones">
                <Bed className="h-6 w-6 mb-2" />
                <span>Habitaciones</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <Link href="/student-housing/pagos">
                <Euro className="h-6 w-6 mb-2" />
                <span>Pagos</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <Link href="/student-housing/mantenimiento">
                <AlertTriangle className="h-6 w-6 mb-2" />
                <span>Mantenimiento</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
