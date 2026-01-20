'use client';

/**
 * Vivienda Social - Dashboard
 * 
 * Panel de control para programas de vivienda social (VPO)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Home,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Euro,
  Scale,
  Building,
  Calendar,
  ClipboardCheck,
} from 'lucide-react';
import Link from 'next/link';

const STATS = {
  totalViviendas: 420,
  ocupadas: 398,
  disponibles: 12,
  enTramite: 10,
  ocupacion: 94.8,
  solicitudesPendientes: 156,
  listaEspera: 234,
  ingresosMes: 178500,
  cumplimientoNormativo: 98.5,
};

const ALERTAS = [
  { id: 1, tipo: 'revision', mensaje: '12 contratos pendientes de renovación', severidad: 'media' },
  { id: 2, tipo: 'ingresos', mensaje: '5 familias superan límite de ingresos', severidad: 'alta' },
  { id: 3, tipo: 'documentacion', mensaje: '8 expedientes con documentación incompleta', severidad: 'baja' },
];

const VIVIENDAS_POR_TIPO = [
  { tipo: 'VPO General', total: 280, ocupadas: 272 },
  { tipo: 'VPO Jóvenes', total: 80, ocupadas: 76 },
  { tipo: 'Alquiler Social', total: 60, ocupadas: 50 },
];

const SOLICITUDES_RECIENTES = [
  { id: 1, nombre: 'García Martínez, Juan', tipo: 'VPO General', fecha: '2026-01-18', estado: 'pendiente' },
  { id: 2, nombre: 'López Fernández, María', tipo: 'VPO Jóvenes', fecha: '2026-01-17', estado: 'en_revision' },
  { id: 3, nombre: 'Sánchez Torres, Pedro', tipo: 'Alquiler Social', fecha: '2026-01-16', estado: 'aprobada' },
];

export default function ViviendaSocialDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Home className="h-6 w-6" />
            Vivienda Social
          </h1>
          <p className="text-muted-foreground">
            Gestión de programas de vivienda protegida (VPO)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/vivienda-social/applications">
              Ver Solicitudes
            </Link>
          </Button>
          <Button asChild>
            <Link href="/vivienda-social/reporting">
              Generar Informes
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
                  {STATS.ocupadas}/{STATS.totalViviendas} viviendas
                </p>
              </div>
              <Building className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Solicitudes</p>
                <p className="text-2xl font-bold text-yellow-600">{STATS.solicitudesPendientes}</p>
                <p className="text-xs text-muted-foreground">pendientes</p>
              </div>
              <FileText className="h-8 w-8 text-yellow-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lista Espera</p>
                <p className="text-2xl font-bold">{STATS.listaEspera}</p>
                <p className="text-xs text-muted-foreground">familias</p>
              </div>
              <Users className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cumplimiento</p>
                <p className="text-2xl font-bold text-green-600">{STATS.cumplimientoNormativo}%</p>
                <p className="text-xs text-muted-foreground">normativo</p>
              </div>
              <Scale className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Viviendas por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Viviendas por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {VIVIENDAS_POR_TIPO.map((tipo) => (
              <div key={tipo.tipo} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{tipo.tipo}</span>
                  <span className="text-muted-foreground">
                    {tipo.ocupadas}/{tipo.total} ({Math.round((tipo.ocupadas / tipo.total) * 100)}%)
                  </span>
                </div>
                <Progress value={(tipo.ocupadas / tipo.total) * 100} />
              </div>
            ))}
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
                className={`p-3 rounded-lg border ${
                  alerta.severidad === 'alta'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200'
                    : alerta.severidad === 'media'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200'
                }`}
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

        {/* Solicitudes Recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Solicitudes Recientes
            </CardTitle>
            <CardDescription>Últimas solicitudes recibidas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {SOLICITUDES_RECIENTES.map((solicitud) => (
              <div
                key={solicitud.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm">{solicitud.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {solicitud.tipo} · {solicitud.fecha}
                  </p>
                </div>
                <Badge
                  className={
                    solicitud.estado === 'aprobada'
                      ? 'bg-green-100 text-green-700'
                      : solicitud.estado === 'en_revision'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }
                >
                  {solicitud.estado === 'aprobada'
                    ? 'Aprobada'
                    : solicitud.estado === 'en_revision'
                    ? 'En Revisión'
                    : 'Pendiente'}
                </Badge>
              </div>
            ))}
            <Button variant="outline" className="w-full" asChild>
              <Link href="/vivienda-social/applications">Ver todas</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Indicadores de Gestión */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Indicadores de Gestión
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Tiempo medio resolución</span>
              </div>
              <span className="font-medium">45 días</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Tasa de aprobación</span>
              </div>
              <span className="font-medium text-green-600">68%</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Recaudación mensual</span>
              </div>
              <span className="font-medium">€{STATS.ingresosMes.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Renovaciones este mes</span>
              </div>
              <span className="font-medium">23</span>
            </div>
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
              <Link href="/vivienda-social/applications">
                <FileText className="h-6 w-6 mb-2" />
                <span>Solicitudes</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <Link href="/vivienda-social/eligibility">
                <ClipboardCheck className="h-6 w-6 mb-2" />
                <span>Elegibilidad</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <Link href="/vivienda-social/compliance">
                <Scale className="h-6 w-6 mb-2" />
                <span>Cumplimiento</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <Link href="/vivienda-social/reporting">
                <TrendingUp className="h-6 w-6 mb-2" />
                <span>Informes</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
