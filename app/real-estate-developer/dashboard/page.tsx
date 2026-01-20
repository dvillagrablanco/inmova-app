'use client';

/**
 * Real Estate Developer - Dashboard
 * 
 * Panel de control para promotores inmobiliarios
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Euro,
  TrendingUp,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Home,
  FileText,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';

const STATS = {
  proyectosActivos: 5,
  unidadesTotales: 342,
  unidadesVendidas: 218,
  unidadesReservadas: 45,
  ventasTotales: 48500000,
  ventasMes: 3200000,
  margenPromedio: 22.5,
};

const PROYECTOS = [
  { id: 1, nombre: 'Residencial Aurora', ubicacion: 'Madrid Norte', unidades: 120, vendidas: 98, entrega: '2026-06' },
  { id: 2, nombre: 'Torre Skyline', ubicacion: 'Barcelona', unidades: 80, vendidas: 65, entrega: '2026-09' },
  { id: 3, nombre: 'Jardines del Sur', ubicacion: 'Sevilla', unidades: 60, vendidas: 35, entrega: '2027-03' },
  { id: 4, nombre: 'Mirador Costa', ubicacion: 'Valencia', unidades: 45, vendidas: 12, entrega: '2027-09' },
  { id: 5, nombre: 'Urban Living', ubicacion: 'Bilbao', unidades: 37, vendidas: 8, entrega: '2028-01' },
];

const ALERTAS = [
  { id: 1, mensaje: 'Residencial Aurora: Licencia de primera ocupación pendiente', tipo: 'urgente' },
  { id: 2, mensaje: 'Torre Skyline: Retraso de 2 semanas en acabados', tipo: 'aviso' },
  { id: 3, mensaje: 'Mirador Costa: Nuevo interesado VIP', tipo: 'info' },
];

const EVENTOS_PROXIMOS = [
  { id: 1, titulo: 'Entrega Residencial Aurora Fase 1', fecha: '2026-02-15', tipo: 'entrega' },
  { id: 2, titulo: 'Reunión inversores Torre Skyline', fecha: '2026-01-25', tipo: 'reunion' },
  { id: 3, titulo: 'Open House Jardines del Sur', fecha: '2026-01-28', tipo: 'comercial' },
];

export default function RealEstateDeveloperDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Promotor Inmobiliario
          </h1>
          <p className="text-muted-foreground">
            Panel de control de desarrollo y comercialización
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/real-estate-developer/sales">
              Ver Ventas
            </Link>
          </Button>
          <Button asChild>
            <Link href="/real-estate-developer/projects">
              Gestionar Proyectos
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
                <p className="text-sm text-muted-foreground">Proyectos Activos</p>
                <p className="text-2xl font-bold">{STATS.proyectosActivos}</p>
                <p className="text-xs text-muted-foreground">en desarrollo</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ventas Totales</p>
                <p className="text-2xl font-bold">€{(STATS.ventasTotales / 1000000).toFixed(1)}M</p>
                <p className="text-xs text-green-600">+€{(STATS.ventasMes / 1000000).toFixed(1)}M este mes</p>
              </div>
              <Euro className="h-8 w-8 text-emerald-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unidades Vendidas</p>
                <p className="text-2xl font-bold">{STATS.unidadesVendidas}</p>
                <p className="text-xs text-muted-foreground">
                  de {STATS.unidadesTotales} ({Math.round((STATS.unidadesVendidas / STATS.unidadesTotales) * 100)}%)
                </p>
              </div>
              <Home className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Margen Promedio</p>
                <p className="text-2xl font-bold text-green-600">{STATS.margenPromedio}%</p>
                <p className="text-xs text-muted-foreground">sobre ventas</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Proyectos Activos */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Proyectos en Desarrollo
            </CardTitle>
            <CardDescription>
              Estado de comercialización de cada proyecto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {PROYECTOS.map((proyecto) => {
                const porcentajeVendido = Math.round((proyecto.vendidas / proyecto.unidades) * 100);
                return (
                  <div key={proyecto.id} className="p-4 border rounded-lg">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                      <div>
                        <h4 className="font-semibold">{proyecto.nombre}</h4>
                        <p className="text-sm text-muted-foreground">{proyecto.ubicacion}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Entrega: {proyecto.entrega}
                        </Badge>
                        <Badge
                          className={
                            porcentajeVendido >= 80
                              ? 'bg-green-100 text-green-700'
                              : porcentajeVendido >= 50
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }
                        >
                          {porcentajeVendido}% vendido
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progreso de ventas</span>
                        <span className="font-medium">
                          {proyecto.vendidas}/{proyecto.unidades} unidades
                        </span>
                      </div>
                      <Progress value={porcentajeVendido} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas y Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ALERTAS.map((alerta) => (
              <div
                key={alerta.id}
                className={`p-3 rounded-lg border ${
                  alerta.tipo === 'urgente'
                    ? 'bg-red-50 border-red-200'
                    : alerta.tipo === 'aviso'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <p className="text-sm">{alerta.mensaje}</p>
                <Badge
                  variant="outline"
                  className={`mt-1 ${
                    alerta.tipo === 'urgente'
                      ? 'border-red-500 text-red-600'
                      : alerta.tipo === 'aviso'
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

        {/* Próximos Eventos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximos Eventos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {EVENTOS_PROXIMOS.map((evento) => (
              <div
                key={evento.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm">{evento.titulo}</p>
                  <p className="text-xs text-muted-foreground">{evento.fecha}</p>
                </div>
                <Badge variant="outline">{evento.tipo}</Badge>
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
              <Link href="/real-estate-developer/projects">
                <Building2 className="h-6 w-6 mb-2" />
                <span>Proyectos</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <Link href="/real-estate-developer/sales">
                <Euro className="h-6 w-6 mb-2" />
                <span>Ventas</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <Link href="/real-estate-developer/marketing">
                <Users className="h-6 w-6 mb-2" />
                <span>Marketing</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <Link href="/real-estate-developer/commercial">
                <BarChart3 className="h-6 w-6 mb-2" />
                <span>Comercial</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
