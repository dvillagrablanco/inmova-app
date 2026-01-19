'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  RefreshCw,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Calculator,
  Calendar,
  Euro,
  AlertTriangle,
  CheckCircle,
  LineChart,
} from 'lucide-react';
import { toast } from 'sonner';

interface SimulacionRenovacion {
  cuotaActual: number;
  ipcAplicado: number;
  cuotaNueva: number;
  diferencia: number;
  porcentajeCambio: number;
}

export default function RenovacionesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [ipcActual, setIpcActual] = useState(3.2); // IPC actual simulado
  const [cuotaBase, setCuotaBase] = useState(150);
  const [simulacion, setSimulacion] = useState<SimulacionRenovacion | null>(null);

  const comunidadId = searchParams.get('comunidadId');

  // Datos históricos de IPC (simulados)
  const historicoIPC = [
    { año: '2019', valor: 0.8 },
    { año: '2020', valor: -0.5 },
    { año: '2021', valor: 6.5 },
    { año: '2022', valor: 5.7 },
    { año: '2023', valor: 3.1 },
    { año: '2024', valor: 3.2 },
  ];

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      setLoading(false);
      calcularSimulacion();
    }
  }, [status, router]);

  const calcularSimulacion = () => {
    const cuotaNueva = cuotaBase * (1 + ipcActual / 100);
    const diferencia = cuotaNueva - cuotaBase;
    
    setSimulacion({
      cuotaActual: cuotaBase,
      ipcAplicado: ipcActual,
      cuotaNueva: Math.round(cuotaNueva * 100) / 100,
      diferencia: Math.round(diferencia * 100) / 100,
      porcentajeCambio: ipcActual,
    });
  };

  useEffect(() => {
    calcularSimulacion();
  }, [cuotaBase, ipcActual]);

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/comunidades')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Renovaciones Inteligentes</h1>
            <p className="text-muted-foreground">
              Análisis IPC, predicciones y simulador de actualización de cuotas
            </p>
          </div>
        </div>

        {/* IPC Actual */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">IPC Interanual</CardTitle>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{ipcActual}%</div>
              <p className="text-xs text-blue-600">Último dato publicado INE</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Predicción 2025</CardTitle>
              <LineChart className="w-4 h-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">2.8%</div>
              <p className="text-xs text-muted-foreground">Estimación BCE</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Media 5 años</CardTitle>
              <Calculator className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {(historicoIPC.slice(-5).reduce((acc, h) => acc + h.valor, 0) / 5).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">2020-2024</p>
            </CardContent>
          </Card>
        </div>

        {/* Simulador */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Simulador de Actualización de Cuotas
            </CardTitle>
            <CardDescription>
              Calcula el impacto del IPC en las cuotas de la comunidad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Inputs */}
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="cuotaBase">Cuota Mensual Actual (€)</Label>
                  <Input
                    id="cuotaBase"
                    type="number"
                    value={cuotaBase}
                    onChange={(e) => setCuotaBase(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ipc">IPC a Aplicar (%)</Label>
                  <Input
                    id="ipc"
                    type="number"
                    step="0.1"
                    value={ipcActual}
                    onChange={(e) => setIpcActual(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIpcActual(3.2)}>
                    IPC Actual
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIpcActual(2.0)}>
                    2%
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIpcActual(5.0)}>
                    5%
                  </Button>
                </div>
              </div>

              {/* Resultado */}
              {simulacion && (
                <div className="bg-muted p-6 rounded-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Cuota actual:</span>
                    <span className="font-medium">{simulacion.cuotaActual.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">IPC aplicado:</span>
                    <span className="font-medium">+{simulacion.ipcAplicado}%</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Nueva cuota:</span>
                      <span className="text-2xl font-bold text-green-600">
                        {simulacion.cuotaNueva.toFixed(2)}€
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-muted-foreground">Incremento:</span>
                      <Badge className={simulacion.diferencia > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                        {simulacion.diferencia > 0 ? '+' : ''}{simulacion.diferencia.toFixed(2)}€/mes
                      </Badge>
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg mt-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <strong>Impacto anual:</strong> {(simulacion.diferencia * 12).toFixed(2)}€ adicionales por propietario
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Histórico IPC */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico IPC España</CardTitle>
            <CardDescription>Evolución del IPC interanual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {historicoIPC.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-16 text-sm font-medium">{item.año}</div>
                  <div className="flex-1">
                    <div className="h-6 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.valor >= 0 ? 'bg-blue-500' : 'bg-red-500'
                        }`}
                        style={{
                          width: `${Math.min(Math.abs(item.valor) * 10, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className={`w-16 text-right font-medium ${
                    item.valor >= 0 ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {item.valor > 0 ? '+' : ''}{item.valor}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recomendaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Recomendaciones para la Próxima Junta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">✓ Aplicar IPC según estatutos</h4>
              <p className="text-sm text-green-700">
                Si los estatutos permiten la actualización automática por IPC, se recomienda
                aplicar el {ipcActual}% de incremento para mantener el poder adquisitivo de la comunidad.
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">💡 Considerar inflación de servicios</h4>
              <p className="text-sm text-blue-700">
                Los costes de mantenimiento, limpieza y suministros han subido por encima del IPC general.
                Valorar un incremento adicional del 1-2% para cubrir estos gastos.
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">⚠️ Comunicar con antelación</h4>
              <p className="text-sm text-yellow-700">
                Notificar a los propietarios con al menos 30 días de antelación sobre la
                actualización de cuotas y los motivos de la misma.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
