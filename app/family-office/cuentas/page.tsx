'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Home, Landmark, Link2 } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import Link from 'next/link';

interface BankEntity {
  id: string;
  name: string;
  connected: boolean;
  accounts: Array<{
    id: string;
    alias: string | null;
    saldo: number;
    valorMercado: number;
    posiciones: number;
    movimientos: number;
    ultimaSync: string | null;
  }>;
}

interface BankStatusData {
  resumen: {
    entidadesConectadas: number;
    entidadesTotales: number;
    cuentasTotales: number;
    saldoTotal: number;
    valorMercadoTotal: number;
  };
  entidades: BankEntity[];
}

export default function CuentasPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BankStatusData | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') loadData();
  }, [status, router]);

  const loadData = async () => {
    try {
      const res = await fetch('/api/family-office/bank-status');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      toast.error('Error cargando estado bancario');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(n);

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const r = data?.resumen || {};
  const entidades = data?.entidades || [];

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/family-office/dashboard">Family Office</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Cuentas</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cuentas y Entidades Bancarias</h1>
            <p className="text-gray-500">Estado de conexión y saldos por entidad</p>
          </div>
          <Button onClick={() => toast.info('Conectar banco disponible próximamente')} size="sm">
            <Link2 className="h-4 w-4 mr-2" /> Conectar banco
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500 mb-1">Entidades conectadas</div>
              <div className="text-xl font-bold">
                {r.entidadesConectadas || 0} / {r.entidadesTotales || 9}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500 mb-1">Cuentas totales</div>
              <div className="text-xl font-bold">{r.cuentasTotales || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500 mb-1">Saldo total</div>
              <div className="text-xl font-bold">{fmt(r.saldoTotal || 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500 mb-1">Valor mercado total</div>
              <div className="text-xl font-bold">{fmt(r.valorMercadoTotal || 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de entidades */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entidades bancarias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {entidades.map((e) => {
                const balance = e.accounts.reduce((s, a) => s + a.saldo, 0);
                const valorMercado = e.accounts.reduce((s, a) => s + a.valorMercado, 0);
                return (
                  <div
                    key={e.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Landmark className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium">{e.name}</div>
                        <div className="text-sm text-gray-500">
                          {e.accounts.length} cuenta(s) · Saldo: {fmt(balance)}
                          {valorMercado > 0 && ` · Valor mercado: ${fmt(valorMercado)}`}
                        </div>
                      </div>
                    </div>
                    <Badge variant={e.connected ? 'default' : 'secondary'}>
                      {e.connected ? 'Conectado' : 'No conectado'}
                    </Badge>
                  </div>
                );
              })}
              {entidades.length === 0 && (
                <div className="text-center text-gray-400 py-8">No hay entidades configuradas.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
