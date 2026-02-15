'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Landmark, Euro, Percent, Calendar, Building2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function HipotecasPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mortgages, setMortgages] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') loadData();
  }, [status, router]);

  const loadData = async () => {
    try {
      const res = await fetch('/api/investment/mortgages');
      if (res.ok) {
        const data = await res.json();
        setMortgages(data.data || []);
        setSummary(data.summary);
      }
    } catch { toast.error('Error cargando hipotecas'); }
    finally { setLoading(false); }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  const tipoLabel: Record<string, string> = { fijo: 'Tipo Fijo', variable: 'Variable', mixto: 'Mixto' };
  const estadoColor: Record<string, string> = {
    activa: 'bg-green-100 text-green-700',
    amortizada: 'bg-blue-100 text-blue-700',
    cancelada: 'bg-gray-100 text-gray-700',
    novada: 'bg-yellow-100 text-yellow-700',
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hipotecas del Grupo</h1>
          <p className="text-gray-500">Tracking de financiacion inmobiliaria</p>
        </div>

        {/* KPIs */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-500 flex items-center gap-1"><Landmark className="h-4 w-4" /> Hipotecas activas</div>
                <div className="text-2xl font-bold">{summary.totalActive}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-500">Deuda total</div>
                <div className="text-2xl font-bold text-red-600">{fmt(summary.totalDebt)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-500">Cuota mensual total</div>
                <div className="text-2xl font-bold text-orange-600">{fmt(summary.totalMonthlyPayment)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-500">Tipo medio</div>
                <div className="text-2xl font-bold">{summary.avgInterestRate}%</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lista de hipotecas */}
        <div className="space-y-3">
          {mortgages.map((m) => {
            const amortizado = m.capitalInicial - m.capitalPendiente;
            const pctAmortizado = m.capitalInicial > 0 ? (amortizado / m.capitalInicial) * 100 : 0;
            const fechaVenc = new Date(m.fechaVencimiento);
            const diasRestantes = Math.ceil((fechaVenc.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

            return (
              <Card key={m.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{m.entidadFinanciera}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {m.asset?.building?.nombre || 'Activo'} {m.asset?.unit?.numero ? `- ${m.asset.unit.numero}` : ''}
                      </div>
                      <div className="flex gap-2 mt-1">
                        <Badge className={estadoColor[m.estado] || 'bg-gray-100'}>{m.estado}</Badge>
                        <Badge variant="outline">{tipoLabel[m.tipoHipoteca]}</Badge>
                        {m.tipoHipoteca !== 'fijo' && m.diferencial && (
                          <Badge variant="outline">Euribor + {m.diferencial}%</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Capital pendiente</div>
                      <div className="text-lg font-bold text-red-600">{fmt(m.capitalPendiente)}</div>
                      <div className="text-xs text-gray-400">de {fmt(m.capitalInicial)}</div>
                    </div>
                  </div>

                  {/* Barra de amortizacion */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Amortizado: {fmt(amortizado)} ({Math.round(pctAmortizado)}%)</span>
                      <span>Pendiente: {fmt(m.capitalPendiente)}</span>
                    </div>
                    <Progress value={pctAmortizado} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Cuota mensual</span>
                      <div className="font-medium">{fmt(m.cuotaMensual)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Tipo interes</span>
                      <div className="font-medium">{m.tipoInteres}%</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Plazo</span>
                      <div className="font-medium">{m.plazoAnos} anos</div>
                    </div>
                    <div>
                      <span className="text-gray-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Vencimiento
                      </span>
                      <div className="font-medium">
                        {fechaVenc.toLocaleDateString('es-ES')}
                        {diasRestantes < 365 && diasRestantes > 0 && (
                          <span className="text-orange-600 text-xs ml-1 flex items-center gap-0.5">
                            <AlertTriangle className="h-3 w-3" /> {diasRestantes}d
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {mortgages.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No hay hipotecas registradas. Registra la primera al dar de alta un activo.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
