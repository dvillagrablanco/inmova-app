'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Building,
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Calendar,
  Plane,
  Hotel,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  ArrowRight,
  Star,
} from 'lucide-react';
import Link from 'next/link';

// Mock data para estadísticas
const STATS = {
  reservasActivas: 45,
  reservasMes: 128,
  gastoMes: 84500,
  presupuestoMes: 100000,
  empleadosViajando: 32,
  satisfaccion: 4.6,
  ahorroNegociado: 12500,
  cumplimientoPoliticas: 94,
};

// Gastos por departamento
const GASTOS_DEPARTAMENTO = [
  { departamento: 'Ventas', gasto: 28500, presupuesto: 30000, color: 'bg-blue-500' },
  { departamento: 'Dirección', gasto: 22000, presupuesto: 25000, color: 'bg-purple-500' },
  { departamento: 'Operaciones', gasto: 18500, presupuesto: 20000, color: 'bg-green-500' },
  { departamento: 'Marketing', gasto: 12000, presupuesto: 15000, color: 'bg-orange-500' },
  { departamento: 'IT', gasto: 3500, presupuesto: 10000, color: 'bg-cyan-500' },
];

// Alertas activas
const ALERTAS = [
  { id: 1, tipo: 'warning', mensaje: '3 reservas pendientes de aprobación', fecha: 'Hace 2 horas' },
  { id: 2, tipo: 'info', mensaje: 'Nuevo acuerdo con Hotel Intercontinental - 15% dto', fecha: 'Hoy' },
  { id: 3, tipo: 'warning', mensaje: 'Presupuesto de Ventas al 95%', fecha: 'Ayer' },
  { id: 4, tipo: 'success', mensaje: 'Informe mensual de Enero generado', fecha: 'Hace 3 días' },
];

// Próximas reservas
const PROXIMAS_RESERVAS = [
  { id: 1, empleado: 'Carlos Martínez', destino: 'Barcelona', hotel: 'Hotel Arts', fechaEntrada: '25 Ene', noches: 3, estado: 'confirmada' },
  { id: 2, empleado: 'Laura García', destino: 'Madrid', hotel: 'NH Collection', fechaEntrada: '26 Ene', noches: 2, estado: 'pendiente' },
  { id: 3, empleado: 'Miguel Torres', destino: 'Valencia', hotel: 'Westin Valencia', fechaEntrada: '28 Ene', noches: 4, estado: 'confirmada' },
  { id: 4, empleado: 'Ana Sánchez', destino: 'Sevilla', hotel: 'Alfonso XIII', fechaEntrada: '30 Ene', noches: 2, estado: 'pendiente' },
];

// Métricas de rendimiento
const METRICAS = {
  tiempoMedioReserva: '2.4 días',
  tasaAprobacion: '89%',
  reservasRechazadas: 12,
  ahorroVsMarket: '18%',
};

export default function ViajesCorporativosDashboardPage() {
  const porcentajePresupuesto = (STATS.gastoMes / STATS.presupuestoMes) * 100;

  const getAlertIcon = (tipo: string) => {
    switch (tipo) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'confirmada':
        return <Badge className="bg-green-100 text-green-700">Confirmada</Badge>;
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-700">Pendiente</Badge>;
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Viajes Corporativos</h1>
          <p className="text-muted-foreground">Gestión centralizada de viajes empresariales</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/viajes-corporativos/expense-reports">
              <BarChart3 className="h-4 w-4 mr-2" />
              Ver Informes
            </Link>
          </Button>
          <Button asChild>
            <Link href="/viajes-corporativos/bookings">
              <Calendar className="h-4 w-4 mr-2" />
              Nueva Reserva
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reservas Activas</p>
                <p className="text-2xl font-bold">{STATS.reservasActivas}</p>
                <p className="text-xs text-muted-foreground">
                  {STATS.reservasMes} este mes
                </p>
              </div>
              <Hotel className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gasto del Mes</p>
                <p className="text-2xl font-bold">{STATS.gastoMes.toLocaleString()}€</p>
                <div className="flex items-center gap-1 text-xs">
                  <span className={porcentajePresupuesto > 90 ? 'text-red-500' : 'text-green-500'}>
                    {porcentajePresupuesto.toFixed(0)}% del presupuesto
                  </span>
                </div>
              </div>
              <CreditCard className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Empleados Viajando</p>
                <p className="text-2xl font-bold">{STATS.empleadosViajando}</p>
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +8 vs. mes anterior
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cumplimiento Políticas</p>
                <p className="text-2xl font-bold">{STATS.cumplimientoPoliticas}%</p>
                <p className="text-xs text-muted-foreground">
                  Satisfacción: {STATS.satisfaccion}/5 ⭐
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Presupuesto y Gastos por Departamento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Presupuesto Mensual
            </CardTitle>
            <CardDescription>Consumo de presupuesto por departamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total consumido</span>
                <span className="font-medium">{STATS.gastoMes.toLocaleString()}€ / {STATS.presupuestoMes.toLocaleString()}€</span>
              </div>
              <Progress value={porcentajePresupuesto} className={porcentajePresupuesto > 90 ? 'bg-red-100' : ''} />
            </div>
            
            <div className="space-y-3 mt-4">
              {GASTOS_DEPARTAMENTO.map((dept) => {
                const porcentaje = (dept.gasto / dept.presupuesto) * 100;
                return (
                  <div key={dept.departamento} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{dept.departamento}</span>
                      <span className="text-muted-foreground">
                        {dept.gasto.toLocaleString()}€ / {dept.presupuesto.toLocaleString()}€
                      </span>
                    </div>
                    <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`absolute h-full ${dept.color} rounded-full`}
                        style={{ width: `${Math.min(porcentaje, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ahorro negociado</p>
                  <p className="text-lg font-bold text-green-600">+{STATS.ahorroNegociado.toLocaleString()}€</p>
                </div>
                <Badge className="bg-green-100 text-green-700">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {METRICAS.ahorroVsMarket} vs mercado
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas y Notificaciones
            </CardTitle>
            <CardDescription>Actividad reciente del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ALERTAS.map((alerta) => (
                <div
                  key={alerta.id}
                  className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  {getAlertIcon(alerta.tipo)}
                  <div className="flex-1">
                    <p className="text-sm">{alerta.mensaje}</p>
                    <p className="text-xs text-muted-foreground">{alerta.fecha}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Tiempo medio reserva</p>
                  <p className="font-bold">{METRICAS.tiempoMedioReserva}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tasa aprobación</p>
                  <p className="font-bold text-green-600">{METRICAS.tasaAprobacion}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Próximas Reservas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Próximas Reservas
              </CardTitle>
              <CardDescription>Reservas programadas para los próximos días</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/viajes-corporativos/bookings">
                Ver todas
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {PROXIMAS_RESERVAS.map((reserva) => (
              <div
                key={reserva.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-3"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Plane className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{reserva.empleado}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {reserva.destino}
                      </span>
                      <span className="flex items-center gap-1">
                        <Hotel className="h-3 w-3" />
                        {reserva.hotel}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <p className="font-medium">{reserva.fechaEntrada}</p>
                    <p className="text-sm text-muted-foreground">{reserva.noches} noches</p>
                  </div>
                  {getEstadoBadge(reserva.estado)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Métricas de Satisfacción */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-3xl font-bold">{STATS.satisfaccion}</p>
              <p className="text-sm text-muted-foreground">Satisfacción empleados</p>
              <p className="text-xs text-green-500 mt-1">+0.3 vs trimestre anterior</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-3xl font-bold">{METRICAS.ahorroVsMarket}</p>
              <p className="text-sm text-muted-foreground">Ahorro vs mercado</p>
              <p className="text-xs text-muted-foreground mt-1">Gracias a acuerdos corporativos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-3xl font-bold">{STATS.cumplimientoPoliticas}%</p>
              <p className="text-sm text-muted-foreground">Cumplimiento políticas</p>
              <p className="text-xs text-muted-foreground mt-1">{METRICAS.reservasRechazadas} rechazadas este mes</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
