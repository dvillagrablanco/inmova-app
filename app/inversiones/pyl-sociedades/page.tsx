'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home, TrendingUp, TrendingDown, Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface CompanyPl {
  ingresos: number;
  gastos: number;
  beneficio: number;
  roe: number | null;
  totalEquity: number;
}

interface CompanyNode {
  id: string;
  nombre: string;
  parent: string | null;
  stats: {
    edificios: number;
    unidades: number;
    inquilinos: number;
    participaciones: number;
    cuentasBancarias: number;
    posicionesFinancieras: number;
  };
  pl?: CompanyPl;
}

export default function PylSociedadesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<CompanyNode[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') loadData();
  }, [status, router]);

  const loadData = async () => {
    try {
      const res = await fetch('/api/inversiones/grupo?pl=true');
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
      }
    } catch {
      toast.error('Error cargando P&L por sociedades');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  const companiesWithPl = companies.filter((c) => c.pl);
  const beneficioConsolidado = companiesWithPl.reduce((s, c) => s + (c.pl!.beneficio || 0), 0);
  const masRentable = companiesWithPl.length
    ? companiesWithPl.reduce((a, b) => (a.pl!.beneficio > b.pl!.beneficio ? a : b))
    : null;
  const menosRentable = companiesWithPl.length
    ? companiesWithPl.reduce((a, b) => (a.pl!.beneficio < b.pl!.beneficio ? a : b))
    : null;

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <Home className="h-3.5 w-3.5" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/inversiones">Inversiones</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>P&L Sociedades</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">P&L por Sociedad</h1>
            <p className="text-gray-500">Ingresos, gastos y beneficio neto por empresa del grupo</p>
          </div>
          <Link href="/inversiones">
            <Badge variant="outline" className="cursor-pointer hover:bg-gray-50">
              Volver a Inversiones
            </Badge>
          </Link>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Beneficio Consolidado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${beneficioConsolidado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {fmt(beneficioConsolidado)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Sociedad más rentable</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-green-600">{masRentable?.nombre ?? '-'}</div>
              {masRentable?.pl && (
                <div className="text-sm text-gray-500">{fmt(masRentable.pl.beneficio)}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Sociedad menos rentable</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-red-600">{menosRentable?.nombre ?? '-'}</div>
              {menosRentable?.pl && (
                <div className="text-sm text-gray-500">{fmt(menosRentable.pl.beneficio)}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* P&L Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companiesWithPl.map((company) => (
            <Card key={company.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <CardTitle className="text-base">{company.nombre}</CardTitle>
                </div>
                <CardDescription>{company.stats.edificios} edificios · {company.stats.unidades} unidades</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ingresos</span>
                  <span className="text-green-600 font-medium">{fmt(company.pl!.ingresos)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Gastos</span>
                  <span className="text-red-600 font-medium">{fmt(company.pl!.gastos)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t pt-2">
                  <span>Beneficio neto</span>
                  <span className={company.pl!.beneficio >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {fmt(company.pl!.beneficio)}
                  </span>
                </div>
                {company.pl!.roe != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">ROE</span>
                    <span className="font-medium">{company.pl!.roe.toFixed(1)}%</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>Comparativa</CardTitle>
            <CardDescription>Sociedad, Ingresos, Gastos, Beneficio, Margen %, ROE</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sociedad</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                  <TableHead className="text-right">Gastos</TableHead>
                  <TableHead className="text-right">Beneficio</TableHead>
                  <TableHead className="text-right">Margen %</TableHead>
                  <TableHead className="text-right">ROE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companiesWithPl.map((company) => {
                  const pl = company.pl!;
                  const margen = pl.ingresos > 0 ? (pl.beneficio / pl.ingresos) * 100 : 0;
                  return (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.nombre}</TableCell>
                      <TableCell className="text-right">{fmt(pl.ingresos)}</TableCell>
                      <TableCell className="text-right">{fmt(pl.gastos)}</TableCell>
                      <TableCell className={`text-right font-medium ${pl.beneficio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {fmt(pl.beneficio)}
                      </TableCell>
                      <TableCell className="text-right">{margen.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{pl.roe != null ? `${pl.roe.toFixed(1)}%` : '-'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {companiesWithPl.length === 0 && (
              <div className="py-8 text-center text-gray-500">
                No hay empresas con datos P&L. Configura el grupo y activos en Inversiones.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
