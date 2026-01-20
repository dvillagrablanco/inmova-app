'use client';

/**
 * Workspace - Dashboard
 * 
 * Panel de control para gestión de espacios de coworking
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Users,
  Euro,
  Calendar,
  Clock,
  TrendingUp,
  Laptop,
  Coffee,
  CalendarDays,
  Monitor,
} from 'lucide-react';
import Link from 'next/link';

const STATS = {
  totalEspacios: 45,
  ocupados: 38,
  disponibles: 7,
  ocupacion: 84.4,
  ingresosMes: 28500,
  miembrosActivos: 156,
  reservasHoy: 23,
};

const ESPACIOS = [
  { tipo: 'Hot Desks', total: 20, ocupados: 18, precio: '€15/día' },
  { tipo: 'Dedicated Desks', total: 15, ocupados: 14, precio: '€250/mes' },
  { tipo: 'Oficinas Privadas', total: 8, ocupados: 5, precio: '€800/mes' },
  { tipo: 'Salas de Reuniones', total: 2, ocupados: 1, precio: '€25/hora' },
];

const RESERVAS_HOY = [
  { id: 1, espacio: 'Sala A', miembro: 'Tech Startup SL', hora: '09:00 - 11:00' },
  { id: 2, espacio: 'Desk #12', miembro: 'María García', hora: '08:00 - 18:00' },
  { id: 3, espacio: 'Sala B', miembro: 'Consulting Group', hora: '14:00 - 16:00' },
];

export default function WorkspaceDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Laptop className="h-6 w-6" />
            Workspace / Coworking
          </h1>
          <p className="text-muted-foreground">
            Gestión de espacios de trabajo compartido
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/workspace/booking">
              Nueva Reserva
            </Link>
          </Button>
          <Button asChild>
            <Link href="/workspace/members">
              Ver Miembros
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
                  {STATS.ocupados}/{STATS.totalEspacios} espacios
                </p>
              </div>
              <Monitor className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Miembros</p>
                <p className="text-2xl font-bold">{STATS.miembrosActivos}</p>
                <p className="text-xs text-green-600">+8 este mes</p>
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
                <p className="text-xs text-green-600">+12.3% vs anterior</p>
              </div>
              <Euro className="h-8 w-8 text-emerald-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reservas Hoy</p>
                <p className="text-2xl font-bold">{STATS.reservasHoy}</p>
                <p className="text-xs text-muted-foreground">activas</p>
              </div>
              <CalendarDays className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Espacios por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Espacios por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ESPACIOS.map((espacio) => (
              <div key={espacio.tipo} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{espacio.tipo}</span>
                  <span className="text-muted-foreground">
                    {espacio.ocupados}/{espacio.total} · {espacio.precio}
                  </span>
                </div>
                <Progress value={(espacio.ocupados / espacio.total) * 100} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Reservas de Hoy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Reservas de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {RESERVAS_HOY.map((reserva) => (
              <div key={reserva.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{reserva.espacio}</p>
                  <p className="text-xs text-muted-foreground">{reserva.miembro}</p>
                </div>
                <Badge variant="outline">{reserva.hora}</Badge>
              </div>
            ))}
            <Button variant="outline" className="w-full" asChild>
              <Link href="/workspace/booking">Ver todas las reservas</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Amenities Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coffee className="h-5 w-5" />
            Estado de Amenities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { nombre: 'WiFi', estado: 'OK', icon: '📶' },
              { nombre: 'Café', estado: 'OK', icon: '☕' },
              { nombre: 'Impresora', estado: 'OK', icon: '🖨️' },
              { nombre: 'Sala de llamadas', estado: 'Libre', icon: '📞' },
            ].map((amenity) => (
              <div key={amenity.nombre} className="p-4 border rounded-lg text-center">
                <span className="text-2xl">{amenity.icon}</span>
                <p className="font-medium mt-2">{amenity.nombre}</p>
                <Badge variant="outline" className="mt-1 text-green-600">
                  {amenity.estado}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <Link href="/workspace/coworking">
                <Laptop className="h-6 w-6 mb-2" />
                <span>Espacios</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <Link href="/workspace/booking">
                <Calendar className="h-6 w-6 mb-2" />
                <span>Reservas</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <Link href="/workspace/members">
                <Users className="h-6 w-6 mb-2" />
                <span>Miembros</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col">
              <TrendingUp className="h-6 w-6 mb-2" />
              <span>Reportes</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
