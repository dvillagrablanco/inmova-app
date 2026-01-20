'use client';

/**
 * Automatización - Resumen
 * 
 * Dashboard con métricas y estadísticas de todas las automatizaciones
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Play,
  Pause,
  Settings,
  Mail,
  Bell,
  FileText,
  Calendar,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface Automation {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'email' | 'notificacion' | 'documento' | 'recordatorio' | 'workflow';
  activo: boolean;
  ejecuciones: number;
  ultimaEjecucion: string;
  proximaEjecucion?: string;
  tasaExito: number;
  tiempoAhorrado: number; // en minutos
}

const AUTOMATIONS: Automation[] = [
  {
    id: '1',
    nombre: 'Recordatorio de pago',
    descripcion: 'Envía recordatorio 5 días antes del vencimiento',
    tipo: 'email',
    activo: true,
    ejecuciones: 1250,
    ultimaEjecucion: '2026-01-20 08:00',
    proximaEjecucion: '2026-01-21 08:00',
    tasaExito: 98.5,
    tiempoAhorrado: 625,
  },
  {
    id: '2',
    nombre: 'Confirmación de pago',
    descripcion: 'Envía confirmación automática al recibir pago',
    tipo: 'notificacion',
    activo: true,
    ejecuciones: 890,
    ultimaEjecucion: '2026-01-20 14:32',
    tasaExito: 100,
    tiempoAhorrado: 267,
  },
  {
    id: '3',
    nombre: 'Generación de recibos',
    descripcion: 'Genera y envía recibos PDF automáticamente',
    tipo: 'documento',
    activo: true,
    ejecuciones: 890,
    ultimaEjecucion: '2026-01-20 14:32',
    tasaExito: 99.2,
    tiempoAhorrado: 445,
  },
  {
    id: '4',
    nombre: 'Aviso vencimiento contrato',
    descripcion: 'Notifica 60 días antes del fin de contrato',
    tipo: 'recordatorio',
    activo: true,
    ejecuciones: 45,
    ultimaEjecucion: '2026-01-15 09:00',
    proximaEjecucion: '2026-01-22 09:00',
    tasaExito: 100,
    tiempoAhorrado: 90,
  },
  {
    id: '5',
    nombre: 'Workflow nuevo inquilino',
    descripcion: 'Secuencia de onboarding para nuevos inquilinos',
    tipo: 'workflow',
    activo: true,
    ejecuciones: 78,
    ultimaEjecucion: '2026-01-18 11:20',
    tasaExito: 95.5,
    tiempoAhorrado: 390,
  },
  {
    id: '6',
    nombre: 'Informe mensual propietarios',
    descripcion: 'Genera y envía informe mensual a propietarios',
    tipo: 'documento',
    activo: false,
    ejecuciones: 12,
    ultimaEjecucion: '2025-12-01 10:00',
    proximaEjecucion: '2026-02-01 10:00',
    tasaExito: 100,
    tiempoAhorrado: 120,
  },
];

const TYPE_CONFIG = {
  email: { icon: Mail, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  notificacion: { icon: Bell, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  documento: { icon: FileText, color: 'text-purple-500', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  recordatorio: { icon: Calendar, color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  workflow: { icon: Zap, color: 'text-pink-500', bgColor: 'bg-pink-100 dark:bg-pink-900/30' },
};

export default function AutomatizacionResumenPage() {
  const [automations, setAutomations] = useState<Automation[]>(AUTOMATIONS);

  const handleToggle = (id: string) => {
    setAutomations(automations.map(a =>
      a.id === id ? { ...a, activo: !a.activo } : a
    ));
    const automation = automations.find(a => a.id === id);
    toast.success(
      automation?.activo
        ? `"${automation.nombre}" desactivada`
        : `"${automation?.nombre}" activada`
    );
  };

  const totalEjecuciones = automations.reduce((sum, a) => sum + a.ejecuciones, 0);
  const totalTiempoAhorrado = automations.reduce((sum, a) => sum + a.tiempoAhorrado, 0);
  const tasaExitoPromedio = automations.reduce((sum, a) => sum + a.tasaExito, 0) / automations.length;
  const activasCount = automations.filter(a => a.activo).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Resumen de Automatizaciones</h1>
          <p className="text-muted-foreground">
            Métricas y estado de todas las automatizaciones
          </p>
        </div>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Configurar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Automatizaciones</p>
                <p className="text-2xl font-bold">
                  {activasCount}/{automations.length}
                </p>
                <p className="text-xs text-muted-foreground">activas</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ejecuciones</p>
                <p className="text-2xl font-bold">{totalEjecuciones.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">totales</p>
              </div>
              <RefreshCw className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasa de Éxito</p>
                <p className="text-2xl font-bold">{tasaExitoPromedio.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">promedio</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tiempo Ahorrado</p>
                <p className="text-2xl font-bold">{Math.round(totalTiempoAhorrado / 60)}h</p>
                <p className="text-xs text-muted-foreground">este mes</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Efficiency Card */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Eficiencia del 94.2%</h3>
                <p className="text-muted-foreground">
                  Has automatizado el equivalente a {Math.round(totalTiempoAhorrado / 60)} horas de trabajo manual
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-green-600">
                €{Math.round(totalTiempoAhorrado * 0.5).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">ahorro estimado</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automations List */}
      <Card>
        <CardHeader>
          <CardTitle>Todas las Automatizaciones</CardTitle>
          <CardDescription>
            Gestiona y monitoriza el estado de cada automatización
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {automations.map((automation) => {
            const config = TYPE_CONFIG[automation.tipo];
            const Icon = config.icon;
            
            return (
              <div
                key={automation.id}
                className={`p-4 border rounded-lg ${!automation.activo ? 'opacity-60' : ''}`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`${config.bgColor} p-3 rounded-lg`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{automation.nombre}</h4>
                        <Badge variant={automation.activo ? 'default' : 'secondary'}>
                          {automation.activo ? 'Activa' : 'Pausada'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {automation.descripcion}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <RefreshCw className="h-3 w-3" />
                          {automation.ejecuciones} ejecuciones
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {Math.round(automation.tiempoAhorrado / 60)}h ahorradas
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {automation.tasaExito}% éxito
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">Última ejecución</p>
                      <p className="font-medium">{automation.ultimaEjecucion}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={automation.activo}
                        onCheckedChange={() => handleToggle(automation.id)}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Success Rate Bar */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Tasa de éxito</span>
                  <Progress value={automation.tasaExito} className="flex-1 h-2" />
                  <span className="text-xs font-medium">{automation.tasaExito}%</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Recomendaciones de Optimización
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Informe mensual pausado
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  La automatización "Informe mensual propietarios" está desactivada. 
                  Considera reactivarla para mantener informados a los propietarios.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Nueva automatización disponible
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Puedes configurar recordatorios automáticos para renovación de seguros
                  de los inquilinos.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  Excelente rendimiento
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Todas las automatizaciones activas tienen una tasa de éxito superior al 95%.
                  ¡Buen trabajo!
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
