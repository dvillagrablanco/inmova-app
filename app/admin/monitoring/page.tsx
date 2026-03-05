'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Server, Database, Shield, Cpu, HardDrive, Clock, Activity } from 'lucide-react';
import { toast } from 'sonner';

export default function MonitoringPage() {
  const { status } = useSession();
  const router = useRouter();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') loadMetrics();
  }, [status, router]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/monitoring');
      if (res.ok) setMetrics(await res.json());
      else toast.error('Sin permisos de administrador');
    } catch {
      toast.error('Error cargando métricas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <AuthenticatedLayout><div className="max-w-6xl mx-auto space-y-4"><Skeleton className="h-8 w-48" /><div className="grid gap-4 md:grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}</div></div></AuthenticatedLayout>;

  if (!metrics) return <AuthenticatedLayout><div className="max-w-6xl mx-auto p-8 text-center text-muted-foreground">Sin datos de monitoreo disponibles</div></AuthenticatedLayout>;

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="h-6 w-6" /> Monitoreo del Sistema</h1>
            <p className="text-sm text-muted-foreground">Última actualización: {new Date(metrics.timestamp).toLocaleString('es-ES')}</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadMetrics}><RefreshCw className="h-4 w-4 mr-1" /> Actualizar</Button>
        </div>

        {/* System KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6 text-center">
            <Clock className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <p className="text-xs text-muted-foreground">Uptime</p>
            <p className="text-xl font-bold">{metrics.system.uptimeFormatted}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <Cpu className="h-5 w-5 mx-auto mb-1 text-purple-600" />
            <p className="text-xs text-muted-foreground">Heap Usado</p>
            <p className="text-xl font-bold">{metrics.memory.heapUsed}MB <span className="text-xs text-muted-foreground">/ {metrics.memory.heapTotal}MB</span></p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <HardDrive className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <p className="text-xs text-muted-foreground">RSS Memory</p>
            <p className="text-xl font-bold">{metrics.memory.rss}MB</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <Database className="h-5 w-5 mx-auto mb-1 text-amber-600" />
            <p className="text-xs text-muted-foreground">Base de Datos</p>
            <Badge className={metrics.database.status === 'connected' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>{metrics.database.status}</Badge>
          </CardContent></Card>
        </div>

        {/* Security */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" /> Seguridad</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><p className="text-muted-foreground">Cuentas monitorizadas</p><p className="font-bold">{metrics.security.accountsTracked}</p></div>
              <div><p className="text-muted-foreground">Cuentas bloqueadas</p><p className="font-bold text-red-600">{metrics.security.accountsLocked}</p></div>
              <div><p className="text-muted-foreground">Heap %</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div className={`h-2 rounded-full ${metrics.memory.heapUsagePercent > 80 ? 'bg-red-600' : metrics.memory.heapUsagePercent > 60 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${metrics.memory.heapUsagePercent}%` }} />
                </div>
                <p className="text-xs mt-0.5">{metrics.memory.heapUsagePercent}%</p>
              </div>
              <div><p className="text-muted-foreground">PID</p><p className="font-mono text-xs">{metrics.system.pid}</p></div>
            </div>
          </CardContent>
        </Card>

        {/* Integrations Status */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Server className="h-4 w-4" /> Integraciones</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(metrics.environment).filter(([k]) => k !== 'nodeEnv').map(([key, configured]) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${configured ? 'bg-green-500' : 'bg-red-400'}`} />
                  <span className="capitalize">{key.replace('Configured', '').replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Sistema</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div><span className="text-muted-foreground">Node.js:</span> <span className="font-mono">{metrics.system.nodeVersion}</span></div>
              <div><span className="text-muted-foreground">Platform:</span> <span className="font-mono">{metrics.system.platform} {metrics.system.arch}</span></div>
              <div><span className="text-muted-foreground">Env:</span> <Badge variant="outline">{metrics.environment.nodeEnv}</Badge></div>
              <div><span className="text-muted-foreground">External mem:</span> {metrics.memory.external}MB</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
