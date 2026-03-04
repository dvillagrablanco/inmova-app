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
  Briefcase,
  Wallet,
  Loader2,
  RefreshCw,
  Home,
  ToggleLeft,
  ToggleRight,
  Info,
  FileText,
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
import { SuggestionsWidget } from '@/components/smart-suggestions/SuggestionsWidget';

interface EdificioData {
  id: string;
  nombre: string;
  direccion: string;
  unidades: number;
  ocupadas: number;
  valor: number;
  renta: number;
}

interface CuentaData {
  id: string;
  entidad: string;
  alias: string;
  divisa: string;
  valor: number;
  pnl: number;
  saldo: number;
  posiciones: number;
}

interface ParticipacionData {
  id: string;
  nombre: string;
  cif: string;
  tipo: string;
  porcentaje: number;
  valor: number;
  coste: number;
}

interface DashboardData {
  inmobiliario: { valor: number; renta: number; rentaAnual: number; edificios: EdificioData[] };
  financiero: { valor: number; pnl: number; cuentas: CuentaData[] };
  privateEquity: { valor: number; participaciones: ParticipacionData[] };
  tesoreria: { saldo: number; porEntidad: { entidad: string; saldo: number }[] };
  assetAllocation: Record<string, number>;
  patrimonio: { total: number };
}

export default function FamilyOfficeDashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [view, setView] = useState<'holding' | 'consolidated'>('holding');
  const [viewLabel, setViewLabel] = useState('');
  const [viewDescription, setViewDescription] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') loadData(view);
  }, [status, router, view]);

  const loadData = async (v: 'holding' | 'consolidated' = view) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/family-office/dashboard?view=${v}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data || json);
        setViewLabel(json.viewLabel || '');
        setViewDescription(json.viewDescription || '');
      }
    } catch {
      toast.error('Error cargando dashboard patrimonial');
    } finally {
      setLoading(false);
    }
  };

  const toggleView = () => {
    const next = view === 'holding' ? 'consolidated' : 'holding';
    setView(next);
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
            <p className="text-gray-500">{viewLabel || 'Visión patrimonial'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={view === 'holding' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('holding')}
              className="text-xs"
            >
              {view === 'holding' ? <ToggleRight className="h-4 w-4 mr-1" /> : <ToggleLeft className="h-4 w-4 mr-1" />}
              Holding
            </Button>
            <Button
              variant={view === 'consolidated' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('consolidated')}
              className="text-xs"
            >
              {view === 'consolidated' ? <ToggleRight className="h-4 w-4 mr-1" /> : <ToggleLeft className="h-4 w-4 mr-1" />}
              Consolidado
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={async () => {
                try {
                  const res = await fetch(`/api/family-office/report?view=${view}`);
                  if (res.ok) {
                    const { html } = await res.json();
                    const w = window.open('', '_blank');
                    if (w) { w.document.write(html); w.document.close(); w.print(); }
                  } else {
                    toast.error('Error generando informe');
                  }
                } catch { toast.error('Error de conexión'); }
              }}
            >
              <FileText className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button variant="ghost" onClick={() => loadData()} size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* View explanation */}
        {viewDescription && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{viewDescription}</span>
          </div>
        )}

        {/* Quick Navigation */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { label: 'Private Equity', href: '/family-office/pe', icon: Briefcase, color: 'text-purple-600 bg-purple-50' },
            { label: 'Cuentas', href: '/family-office/cuentas', icon: Building2, color: 'text-blue-600 bg-blue-50' },
            { label: 'Carteras P&L', href: '/family-office/cartera', icon: TrendingUp, color: 'text-green-600 bg-green-50' },
            { label: 'Tesorería', href: '/family-office/tesoreria', icon: Wallet, color: 'text-amber-600 bg-amber-50' },
            { label: 'Cuadro Mandos', href: '/finanzas/cuadro-de-mandos', icon: TrendingUp, color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Reportes', href: '/reportes/financieros', icon: Building2, color: 'text-gray-600 bg-gray-50' },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="flex flex-col items-center gap-1 p-3 rounded-lg border hover:shadow-md transition-shadow cursor-pointer text-center">
                <div className={`w-8 h-8 rounded-lg ${item.color.split(' ')[1]} flex items-center justify-center`}>
                  <item.icon className={`h-4 w-4 ${item.color.split(' ')[0]}`} />
                </div>
                <span className="text-[10px] font-medium text-gray-700">{item.label}</span>
              </div>
            </Link>
          ))}
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
              <div className="text-xl font-bold">{fmt(d?.inmobiliario?.valor ?? 0)}</div>
              <div className="text-xs text-gray-400">{(alloc.inmobiliario ?? 0).toFixed(0)}% del total</div>
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
              <div className="text-xl font-bold">{fmt(d?.financiero?.valor ?? 0)}</div>
              <div className={`text-xs ${(d?.financiero?.pnl ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {fmt(d?.financiero?.pnl ?? 0)} P&L
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
              <div className="text-xl font-bold">{fmt(d?.privateEquity?.valor ?? 0)}</div>
              <div className="text-xs text-gray-400">{d?.privateEquity?.participaciones?.length ?? 0} participaciones</div>
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
              <div className="text-xl font-bold">{fmt(d?.tesoreria?.saldo ?? 0)}</div>
              <div className="text-xs text-gray-400">{d?.tesoreria?.porEntidad?.length ?? 0} entidades</div>
            </CardContent>
          </Card>
        </div>

        {/* Sugerencias inteligentes */}
        <SuggestionsWidget limit={3} />

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
                  <span className="font-medium">{d?.inmobiliario?.edificios?.length ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Unidades</span>
                  <span className="font-medium">{d?.inmobiliario?.edificios?.reduce((sum, e) => sum + e.unidades, 0) ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ocupación</span>
                  <span className="font-medium">
                    {(() => {
                      const eds = d?.inmobiliario?.edificios ?? [];
                      const totalU = eds.reduce((s, e) => s + e.unidades, 0);
                      const totalO = eds.reduce((s, e) => s + e.ocupadas, 0);
                      return totalU > 0 ? ((totalO / totalU) * 100).toFixed(1) : '0.0';
                    })()}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Renta mensual</span>
                  <span className="font-bold text-blue-600">{fmt(d?.inmobiliario?.renta ?? 0)}</span>
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
                  <span className="font-medium">{d?.financiero?.cuentas?.length ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Posiciones</span>
                  <span className="font-medium">{d?.financiero?.cuentas?.reduce((s, c) => s + c.posiciones, 0) ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">P&L total</span>
                  <span className={`font-bold ${(d?.financiero?.pnl ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {fmt(d?.financiero?.pnl ?? 0)}
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
                  <span className="font-medium">{d?.privateEquity?.participaciones?.length ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Coste adquisición</span>
                  <span className="font-medium">{fmt(d?.privateEquity?.participaciones?.reduce((s, p) => s + (p.coste ?? 0), 0) ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Valor actual</span>
                  <span className="font-bold text-purple-600">{fmt(d?.privateEquity?.valor ?? 0)}</span>
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
                {(d?.tesoreria?.porEntidad ?? []).map((item) => (
                  <div key={item.entidad} className="flex justify-between">
                    <span className="text-gray-500">{item.entidad}</span>
                    <span className="font-medium">{fmt(item.saldo)}</span>
                  </div>
                ))}
                {(d?.tesoreria?.porEntidad ?? []).length === 0 && (
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
