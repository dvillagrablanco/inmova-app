'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Home, Briefcase } from 'lucide-react';
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

interface Participation {
  id: string;
  sociedad: string | null;
  porcentaje: number | null;
  capital: {
    compromiso: number;
    llamado: number;
    pendiente: number;
    distribuido: number;
  };
  valoracion: {
    coste: number;
    contable: number;
    estimado: number;
    plusvalia: number;
  };
  metricas: {
    dpi: number;
    tvpi: number;
    moic: number;
    irr: number;
  };
}

interface PEModuleData {
  resumen: {
    participaciones: number;
    totalComprometido: number;
    totalLlamado: number;
    capitalPendiente: number;
    totalDistribuido: number;
    valorActual: number;
    costeTotal: number;
    plusvaliaTotal: number;
    dpiGlobal: number;
    tvpiGlobal: number;
  };
  participaciones: Participation[];
}

export default function PEPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PEModuleData | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') loadData();
  }, [status, router]);

  const loadData = async () => {
    try {
      const res = await fetch('/api/family-office/pe-module');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      toast.error('Error cargando módulo Private Equity');
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

  const pnlColor = (n: number) => (n >= 0 ? 'text-green-600' : 'text-red-600');

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
  const participaciones = data?.participaciones || [];

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
              <BreadcrumbPage>Private Equity</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Private Equity</h1>
          <p className="text-gray-500">Participaciones, DPI, TVPI e IRR</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500 mb-1">Participaciones</div>
              <div className="text-xl font-bold">{r.participaciones || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500 mb-1">Comprometido</div>
              <div className="text-xl font-bold">{fmt(r.totalComprometido || 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500 mb-1">Llamado</div>
              <div className="text-xl font-bold">{fmt(r.totalLlamado || 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500 mb-1">Distribuido</div>
              <div className="text-xl font-bold">{fmt(r.totalDistribuido || 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500 mb-1">DPI</div>
              <div className="text-xl font-bold">{(r.dpiGlobal || 0).toFixed(2)}x</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500 mb-1">TVPI</div>
              <div className="text-xl font-bold">{(r.tvpiGlobal || 0).toFixed(2)}x</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla participaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-purple-600" /> Participaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Sociedad</th>
                    <th className="text-right py-2 font-medium">%</th>
                    <th className="text-right py-2 font-medium">Coste</th>
                    <th className="text-right py-2 font-medium">Valor actual</th>
                    <th className="text-right py-2 font-medium">P&L</th>
                    <th className="text-right py-2 font-medium">DPI</th>
                    <th className="text-right py-2 font-medium">TVPI</th>
                    <th className="text-right py-2 font-medium">IRR %</th>
                  </tr>
                </thead>
                <tbody>
                  {participaciones.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2">{p.sociedad || '—'}</td>
                      <td className="text-right py-2">
                        {p.porcentaje != null ? `${p.porcentaje}%` : '—'}
                      </td>
                      <td className="text-right py-2">{fmt(p.valoracion.coste)}</td>
                      <td className="text-right py-2">{fmt(p.valoracion.estimado)}</td>
                      <td
                        className={`text-right py-2 font-medium ${pnlColor(p.valoracion.plusvalia)}`}
                      >
                        {fmt(p.valoracion.plusvalia)}
                      </td>
                      <td className="text-right py-2">{p.metricas.dpi.toFixed(2)}x</td>
                      <td className="text-right py-2">{p.metricas.tvpi.toFixed(2)}x</td>
                      <td className="text-right py-2">{p.metricas.irr.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {participaciones.length === 0 && (
                <div className="text-center text-gray-400 py-8">Sin participaciones.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
