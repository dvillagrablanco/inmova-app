// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Home, Wallet, AlertTriangle, CreditCard, FileBarChart } from 'lucide-react';
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

interface ForecastRow {
  mes: string;
  mesNum: string;
  cobros: number;
  ingresosFinancieros?: number;
  gastos: number;
  hipotecas: number;
  pagoIS: number;
  neto: number;
  saldoProyectado: number;
}

interface TreasuryData {
  saldoActual: number;
  flujosMensuales: {
    cobros: number;
    ingresosFinancieros?: number;
    gastos: number;
    hipotecas: number;
    netoMensual: number;
  };
  forecast: ForecastRow[];
  alertas: string[];
}

export default function TesoreriaPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TreasuryData | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') loadData();
  }, [status, router]);

  const loadData = async () => {
    try {
      const res = await fetch('/api/family-office/treasury-forecast');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      toast.error('Error cargando previsión de tesorería');
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

  const flujos = data?.flujosMensuales || {};
  const forecast = data?.forecast || [];
  const alertas = data?.alertas || [];

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
              <BreadcrumbPage>Tesorería</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tesorería y Cash Forecast</h1>
            <p className="text-gray-500">Saldo actual y previsión a 6 meses</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/family-office/cuentas">
              <Button variant="ghost" size="sm">
                <CreditCard className="h-4 w-4 mr-1.5" />
                Cuentas
              </Button>
            </Link>
            <Link href="/inversiones/modelo-720">
              <Button variant="ghost" size="sm">
                <FileBarChart className="h-4 w-4 mr-1.5" />
                Modelo 720
              </Button>
            </Link>
          </div>
        </div>

        {/* Saldo actual */}
        <Card className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
          <CardContent className="pt-6 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-5 w-5" />
              <span className="text-sm opacity-90">Saldo actual</span>
            </div>
            <div className="text-4xl font-black">{fmt(data?.saldoActual || 0)}</div>
          </CardContent>
        </Card>

        {/* Flujos mensuales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Flujos mensuales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Cobros</div>
                <div className="font-bold text-green-600">{fmt(flujos.cobros || 0)}</div>
              </div>
              <div>
                <div className="text-gray-500">Ingresos financieros</div>
                <div className="font-bold text-green-600">
                  {fmt(flujos.ingresosFinancieros || 0)}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Gastos</div>
                <div className="font-bold text-red-600">{fmt(flujos.gastos || 0)}</div>
              </div>
              <div>
                <div className="text-gray-500">Hipotecas</div>
                <div className="font-bold text-red-600">{fmt(flujos.hipotecas || 0)}</div>
              </div>
              <div>
                <div className="text-gray-500">Neto mensual</div>
                <div
                  className={`font-bold ${(flujos.netoMensual || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {fmt(flujos.netoMensual || 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        {alertas.length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-4 w-4" /> Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-amber-800">
                {alertas.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Tabla forecast 6 meses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Previsión 6 meses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Mes</th>
                    <th className="text-right py-2 font-medium">Cobros</th>
                    <th className="text-right py-2 font-medium">Financieros</th>
                    <th className="text-right py-2 font-medium">Gastos</th>
                    <th className="text-right py-2 font-medium">Hipotecas</th>
                    <th className="text-right py-2 font-medium">IS</th>
                    <th className="text-right py-2 font-medium">Neto</th>
                    <th className="text-right py-2 font-medium">Saldo proyectado</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.map((f) => (
                    <tr key={f.mesNum} className="border-b last:border-0">
                      <td className="py-2">{f.mes}</td>
                      <td className="text-right py-2 text-green-600">{fmt(f.cobros)}</td>
                      <td className="text-right py-2 text-green-600">
                        {fmt(f.ingresosFinancieros || 0)}
                      </td>
                      <td className="text-right py-2 text-red-600">{fmt(f.gastos)}</td>
                      <td className="text-right py-2 text-red-600">{fmt(f.hipotecas)}</td>
                      <td className="text-right py-2 text-red-600">{fmt(f.pagoIS)}</td>
                      <td
                        className={`text-right py-2 font-medium ${f.neto >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {fmt(f.neto)}
                      </td>
                      <td className="text-right py-2 font-bold">{fmt(f.saldoProyectado)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {forecast.length === 0 && (
                <div className="text-center text-gray-400 py-8">Sin datos de previsión.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
