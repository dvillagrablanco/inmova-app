'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  responseTime: number;
  uptime: number;
}

interface Incident {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  createdAt: string;
  updates: {
    message: string;
    timestamp: string;
  }[];
}

export default function APIStatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'API v1', status: 'operational', responseTime: 87, uptime: 99.98 },
    { name: 'Webhooks', status: 'operational', responseTime: 45, uptime: 99.99 },
    { name: 'OAuth', status: 'operational', responseTime: 120, uptime: 99.97 },
    { name: 'Database', status: 'operational', responseTime: 23, uptime: 99.99 },
  ]);

  const [incidents, setIncidents] = useState<Incident[]>([]);

  const [uptimeData, setUptimeData] = useState<{ date: string; uptime: number }[]>([]);

  useEffect(() => {
    // Simulate uptime data for last 90 days
    const data = [];
    for (let i = 90; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        uptime: Math.random() > 0.05 ? 100 : Math.random() * 100,
      });
    }
    setUptimeData(data);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'outage':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'outage':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational':
        return 'Operacional';
      case 'degraded':
        return 'Degradado';
      case 'outage':
        return 'Caído';
      default:
        return 'Desconocido';
    }
  };

  const overallStatus = services.every((s) => s.status === 'operational')
    ? 'operational'
    : services.some((s) => s.status === 'outage')
      ? 'outage'
      : 'degraded';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Overall Status */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl">Estado de la API de Inmova</CardTitle>
            <div className="flex items-center gap-2">
              {getStatusIcon(overallStatus)}
              <span className="text-lg font-semibold">
                {overallStatus === 'operational'
                  ? 'Todos los Sistemas Operacionales'
                  : 'Algunos Sistemas con Problemas'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            Última actualización: {new Date().toLocaleString('es-ES')}
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Servicios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service) => (
              <div key={service.name} className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-gray-600">
                      Tiempo de respuesta: {service.responseTime}ms
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{getStatusText(service.status)}</div>
                  <div className="text-sm text-gray-600">{service.uptime}% uptime</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Uptime Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Uptime de los Últimos 90 Días</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1 h-12 items-end">
            {uptimeData.map((day, index) => (
              <div
                key={index}
                className={`flex-1 ${
                  day.uptime === 100
                    ? 'bg-green-500'
                    : day.uptime > 95
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                } hover:opacity-80 transition-opacity cursor-pointer`}
                style={{ height: `${day.uptime}%` }}
                title={`${day.date}: ${day.uptime.toFixed(2)}%`}
              />
            ))}
          </div>
          <div className="text-center mt-4 text-2xl font-bold text-green-600">99.98% Uptime</div>
          <div className="text-center text-sm text-gray-600">Promedio de los últimos 90 días</div>
        </CardContent>
      </Card>

      {/* Incidents */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Incidentes</CardTitle>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-600" />
              <p className="text-lg font-medium">No hay incidentes en los últimos 90 días</p>
              <p className="text-sm">¡Todos los sistemas funcionando correctamente!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {incidents.map((incident) => (
                <div key={incident.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{incident.title}</h3>
                      <div className="text-sm text-gray-600">
                        {new Date(incident.createdAt).toLocaleString('es-ES')}
                      </div>
                    </div>
                    <Badge
                      variant={
                        incident.severity === 'critical'
                          ? 'destructive'
                          : incident.severity === 'major'
                            ? 'default'
                            : 'secondary'
                      }
                    >
                      {incident.severity}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {incident.updates.map((update, index) => (
                      <div key={index} className="bg-gray-50 rounded p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{incident.status}</Badge>
                          <span className="text-sm text-gray-600">
                            {new Date(update.timestamp).toLocaleString('es-ES')}
                          </span>
                        </div>
                        <p className="text-sm">{update.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscribe */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Suscríbete a Actualizaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Recibe notificaciones por email cuando haya incidentes o mantenimiento programado.
          </p>
          <form className="flex gap-2">
            <input
              type="email"
              placeholder="tu@email.com"
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Suscribirse
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
