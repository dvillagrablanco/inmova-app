'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle2, Clock, Building2, User } from 'lucide-react';
import { toast } from 'sonner';

export default function FianzasPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [fianzas, setFianzas] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') loadData();
  }, [status, router]);

  const loadData = async () => {
    try {
      const res = await fetch('/api/investment/fianzas');
      if (res.ok) {
        const data = await res.json();
        setFianzas(data.data || []);
        setSummary(data.summary);
      }
    } catch { toast.error('Error cargando fianzas'); }
    finally { setLoading(false); }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  const estadoBadge: Record<string, { color: string; icon: any; label: string }> = {
    pendiente_deposito: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Pendiente deposito' },
    depositada: { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Depositada' },
    devuelta: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle2, label: 'Devuelta' },
    retenida_parcial: { color: 'bg-orange-100 text-orange-700', icon: AlertTriangle, label: 'Retenida parcial' },
    retenida_total: { color: 'bg-red-100 text-red-700', icon: AlertTriangle, label: 'Retenida total' },
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
          <h1 className="text-2xl font-bold text-gray-900">Fianzas y Depositos</h1>
          <p className="text-gray-500">Control de fianzas depositadas en organismos autonomicos</p>
        </div>

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-500">Total fianzas</div>
                <div className="text-2xl font-bold">{summary.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" /> Pendientes deposito
                </div>
                <div className="text-2xl font-bold text-yellow-600">{summary.pendientes}</div>
                <div className="text-xs text-gray-400">{fmt(summary.totalPendiente)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Depositadas
                </div>
                <div className="text-2xl font-bold text-green-600">{summary.depositadas}</div>
                <div className="text-xs text-gray-400">{fmt(summary.totalDepositado)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-500">Total en deposito</div>
                <div className="text-2xl font-bold">{fmt(summary.totalDepositado)}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="space-y-3">
          {fianzas.map((f) => {
            const badge = estadoBadge[f.estado] || estadoBadge.pendiente_deposito;
            const Icon = badge.icon;
            return (
              <Card key={f.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {fmt(f.importeFianza)}
                          <span className="text-sm text-gray-400">({f.mesesFianza} mes{f.mesesFianza > 1 ? 'es' : ''})</span>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {f.contract?.unit?.building?.nombre || '-'} - {f.contract?.unit?.numero || '-'}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {f.contract?.tenant?.nombreCompleto || 'Sin inquilino'}
                        </div>
                        {f.organismoDeposito && (
                          <div className="text-xs text-gray-400 mt-1">
                            Organismo: {f.organismoDeposito} {f.numeroDeposito ? `(Ref: ${f.numeroDeposito})` : ''}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge className={badge.color}>
                      <Icon className="h-3 w-3 mr-1" />
                      {badge.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {fianzas.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                No hay fianzas registradas. Se crean automaticamente al firmar contratos.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
