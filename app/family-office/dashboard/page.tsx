'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  TrendingUp,
  Euro,
  Landmark,
  Briefcase,
  PieChart,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Plus,
  RefreshCw,
  Home,
} from 'lucide-react';
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

interface DashboardData {
  inmobiliario: { valor: number; rentaMensual: number; edificios: number; unidades: number; ocupacion: number };
  financiero: { valorTotal: number; pnlTotal: number; pnlPct: number; cuentas: number; posiciones: number };
  privateEquity: { valorTotal: number; participaciones: number; costeTotal: number };
  tesoreria: { saldoTotal: number; porEntidad: Record<string, number> };
  assetAllocation: Record<string, number>;
  patrimonio: { total: number };
}

export default function FamilyOfficeDashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') loadData();
  }, [status, router]);

  const loadData = async () => {
    try {
      const res = await fetch('/api/family-office/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json.data || json);
      }
    } catch {
      toast.error('Error cargando dashboard patrimonial');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const d = data;
  const patrimonio = d?.patrimonio?.total || 0;
  const alloc = d?.assetAllocation || {};

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Family Office</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Patrimonial 360°</h1>
            <p className="text-gray-500">Visión consolidada: inmobiliario + financiero + private equity</p>
          </div>
          <Button variant="outline" onClick={loadData} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
          </Button>
        </div>

        {/* Patrimonio Total */}
        <Card className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
          <CardContent className="pt-6 pb-4">
            <div className="text-center">
              <div className="text-sm opacity-80 mb-1">Patrimonio Total del Grupo</div>
              <div className="text-5xl font-black">{fmt(patrimonio)}</div>
            </div>
          </CardContent>
        </Card>

        {/* Asset Allocation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-xs text-gray-500">Inmobiliario</div>
              </div>
              <div className="text-xl font-bold">{fmt(d?.inmobiliario?.valor || 0)}</div>
              <div className="text-xs text-gray-400">{(alloc.inmobiliario || 0).toFixed(0)}% del total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-xs text-gray-500">Financiero</div>
              </div>
              <div className="text-xl font-bold">{fmt(d?.financiero?.valorTotal || 0)}</div>
              <div className={`text-xs ${(d?.financiero?.pnlPct || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {fmtPct(d?.financiero?.pnlPct || 0)} P&L
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Briefcase className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-xs text-gray-500">Private Equity</div>
              </div>
              <div className="text-xl font-bold">{fmt(d?.privateEquity?.valorTotal || 0)}</div>
              <div className="text-xs text-gray-400">{d?.privateEquity?.participaciones || 0} participaciones</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-amber-600" />
                </div>
                <div className="text-xs text-gray-500">Tesorería</div>
              </div>
              <div className="text-xl font-bold">{fmt(d?.tesoreria?.saldoTotal || 0)}</div>
              <div className="text-xs text-gray-400">{Object.keys(d?.tesoreria?.porEntidad || {}).length} entidades</div>
            </CardContent>
          </Card>
        </div>

        {/* Detalle por bloque */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Inmobiliario */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" /> Inmobiliario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Edificios</span>
                  <span className="font-medium">{d?.inmobiliario?.edificios || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Unidades</span>
                  <span className="font-medium">{d?.inmobiliario?.unidades || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ocupación</span>
                  <span className="font-medium">{(d?.inmobiliario?.ocupacion || 0).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Renta mensual</span>
                  <span className="font-bold text-blue-600">{fmt(d?.inmobiliario?.rentaMensual || 0)}</span>
                </div>
              </div>
              <Link href="/inversiones">
                <Button variant="outline" size="sm" className="w-full mt-4">Ver detalle inmobiliario</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Financiero */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" /> Carteras Financieras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Cuentas</span>
                  <span className="font-medium">{d?.financiero?.cuentas || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Posiciones</span>
                  <span className="font-medium">{d?.financiero?.posiciones || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">P&L total</span>
                  <span className={`font-bold ${(d?.financiero?.pnlTotal || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {fmt(d?.financiero?.pnlTotal || 0)}
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => toast.info('Gestión de cuentas disponible próximamente')}>
                Gestionar cuentas
              </Button>
            </CardContent>
          </Card>

          {/* Private Equity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-purple-600" /> Private Equity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Participaciones</span>
                  <span className="font-medium">{d?.privateEquity?.participaciones || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Coste adquisición</span>
                  <span className="font-medium">{fmt(d?.privateEquity?.costeTotal || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Valor actual</span>
                  <span className="font-bold text-purple-600">{fmt(d?.privateEquity?.valorTotal || 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tesorería */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-4 w-4 text-amber-600" /> Tesorería
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 text-sm">
                {Object.entries(d?.tesoreria?.porEntidad || {}).map(([entidad, saldo]) => (
                  <div key={entidad} className="flex justify-between">
                    <span className="text-gray-500">{entidad}</span>
                    <span className="font-medium">{fmt(saldo as number)}</span>
                  </div>
                ))}
                {Object.keys(d?.tesoreria?.porEntidad || {}).length === 0 && (
                  <div className="text-center text-gray-400 py-4">
                    Sin cuentas registradas. Añade tu primera cuenta.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
