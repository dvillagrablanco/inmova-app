'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Home, Globe, AlertTriangle, CheckCircle2, Download } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';

interface ForeignAsset {
  entidad: string;
  pais: string;
  tipo: string;
  iban: string;
  saldo: number;
  obligacion720: boolean;
}

export default function Modelo720Page() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<ForeignAsset[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') loadData();
  }, [status, router]);

  const loadData = async () => {
    try {
      // Load from financial accounts with foreign IBANs
      const res = await fetch('/api/family-office/accounts');
      if (res.ok) {
        const data = await res.json();
        const accounts = data.data || data.accounts || data || [];
        const foreign = (Array.isArray(accounts) ? accounts : [])
          .filter((a: { numeroCuenta?: string }) => {
            const iban = a.numeroCuenta || '';
            return iban.startsWith('CH') || iban.startsWith('LU') || iban.startsWith('FR') || iban.startsWith('DE') || iban.startsWith('GB');
          })
          .map((a: { entidad: string; numeroCuenta: string; saldoActual: number }) => {
            const iban = a.numeroCuenta || '';
            let pais = 'Desconocido';
            if (iban.startsWith('CH')) pais = 'Suiza';
            else if (iban.startsWith('LU')) pais = 'Luxemburgo';
            else if (iban.startsWith('FR')) pais = 'Francia';
            else if (iban.startsWith('DE')) pais = 'Alemania';
            else if (iban.startsWith('GB')) pais = 'Reino Unido';

            return {
              entidad: a.entidad,
              pais,
              tipo: 'Cuenta bancaria',
              iban: a.numeroCuenta,
              saldo: a.saldoActual || 0,
              obligacion720: (a.saldoActual || 0) > 50000, // Umbral Modelo 720
            };
          });
        setAssets(foreign);
      }
    } catch {
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const totalExtranjero = assets.reduce((s, a) => s + a.saldo, 0);
  const obligatorios = assets.filter((a) => a.obligacion720);
  const paisesAfectados = [...new Set(assets.map((a) => a.pais))];

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/inversiones">Inversiones</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Modelo 720</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Modelo 720 — Declaración de Bienes en el Extranjero</h1>
            <p className="text-gray-500">Obligación informativa AEAT · Cuentas y valores en el exterior</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => toast.info('Exportación disponible próximamente')}>
            <Download className="h-4 w-4 mr-2" /> Exportar borrador
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500 mb-1">Total en extranjero</div>
              <div className="text-xl font-bold">{fmt(totalExtranjero)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500 mb-1">Cuentas</div>
              <div className="text-xl font-bold">{assets.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500 mb-1">Países</div>
              <div className="text-xl font-bold">{paisesAfectados.join(', ') || 'Ninguno'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500 mb-1">Con obligación 720</div>
              <div className={`text-xl font-bold ${obligatorios.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {obligatorios.length > 0 ? `${obligatorios.length} cuentas` : 'Ninguna'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert si hay obligación */}
        {obligatorios.length > 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-4 pb-3 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-amber-800">Obligación de declaración Modelo 720</p>
                <p className="text-sm text-amber-700 mt-1">
                  {obligatorios.length} cuenta(s) superan el umbral de 50.000€. Plazo: 1 enero - 31 marzo del año siguiente.
                  Cuentas en: {[...new Set(obligatorios.map((a) => a.pais))].join(', ')}.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabla de activos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-600" />
              Activos en el Extranjero
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Entidad</th>
                    <th className="text-left py-2 font-medium">País</th>
                    <th className="text-left py-2 font-medium">IBAN</th>
                    <th className="text-right py-2 font-medium">Saldo</th>
                    <th className="text-center py-2 font-medium">Modelo 720</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((a, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 font-medium">{a.entidad}</td>
                      <td className="py-2">
                        <Badge variant="secondary">{a.pais}</Badge>
                      </td>
                      <td className="py-2 text-xs font-mono text-gray-500">{a.iban}</td>
                      <td className="py-2 text-right tabular-nums font-medium">{fmt(a.saldo)}</td>
                      <td className="py-2 text-center">
                        {a.obligacion720 ? (
                          <Badge variant="destructive" className="text-[10px]">Declarar</Badge>
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                  {assets.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-gray-400 py-8">
                        Sin activos en el extranjero registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
