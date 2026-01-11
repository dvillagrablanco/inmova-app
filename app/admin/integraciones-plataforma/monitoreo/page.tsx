'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle,
  Settings,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Bug,
  Activity,
  Bell
} from 'lucide-react';
import Link from 'next/link';

export default function MonitoreoPlataformaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    const allowedRoles = ['super_admin', 'SUPER_ADMIN', 'superadmin', 'admin', 'ADMIN'];
    const userRole = session?.user?.role?.toLowerCase();
    if (status === 'authenticated' && userRole && !allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
      router.push('/unauthorized');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  const recentErrors = [
    { id: 1, type: 'Error', message: 'TypeError: Cannot read property...', time: 'Hace 2h', count: 3 },
    { id: 2, type: 'Warning', message: 'Slow database query detected', time: 'Hace 4h', count: 12 },
    { id: 3, type: 'Error', message: 'Failed to fetch user data', time: 'Hace 6h', count: 1 },
  ];

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/integraciones-plataforma" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Integraciones Plataforma
        </Link>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Bug className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Monitoreo</h1>
            <p className="text-muted-foreground">Sentry para tracking de errores y performance</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Estado General */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Estado del Sistema
              </CardTitle>
              <Badge variant="default" className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Operativo
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Errores (24h)</p>
                <p className="text-2xl font-bold text-red-500">7</p>
                <p className="text-xs text-green-500">-45% vs ayer</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Warnings (24h)</p>
                <p className="text-2xl font-bold text-yellow-500">23</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Crash-Free Sessions</p>
                <p className="text-2xl font-bold text-green-500">99.8%</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Apdex Score</p>
                <p className="text-2xl font-bold">0.94</p>
                <p className="text-xs text-muted-foreground">Excelente</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Errores Recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Errores Recientes
            </CardTitle>
            <CardDescription>Últimos errores detectados por Sentry</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentErrors.map((error) => (
                <div key={error.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {error.type === 'Error' ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{error.message}</p>
                      <p className="text-xs text-muted-foreground">{error.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{error.count}x</Badge>
                    <Button size="sm" variant="ghost">Ver</Button>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver todos en Sentry
            </Button>
          </CardContent>
        </Card>

        {/* Configuración */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración de Sentry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>DSN</Label>
              <Input type="password" defaultValue="https://xxxx@sentry.io/yyyy" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Project</Label>
                <Input readOnly defaultValue="inmova-production" />
              </div>
              <div className="space-y-2">
                <Label>Environment</Label>
                <Input readOnly defaultValue="production" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sample Rate (%)</Label>
              <Input defaultValue="100" type="number" min="0" max="100" />
              <p className="text-xs text-muted-foreground">Porcentaje de errores a capturar (100 = todos)</p>
            </div>
            <div className="flex gap-2">
              <Button>
                <RefreshCw className="h-4 w-4 mr-2" />
                Probar Conexión
              </Button>
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir Sentry
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Configuración de Alertas
            </CardTitle>
            <CardDescription>Notificaciones de errores y problemas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Alertas por Email</p>
                <p className="text-sm text-muted-foreground">Enviar email cuando ocurran errores críticos</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Alertas a Slack</p>
                <p className="text-sm text-muted-foreground">Notificar en canal #dev-alerts</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Alertas de Performance</p>
                <p className="text-sm text-muted-foreground">Notificar queries lentas o timeouts</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Resumen Diario</p>
                <p className="text-sm text-muted-foreground">Enviar resumen de errores cada mañana</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
