'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Home, Building2, Briefcase, Landmark, TrendingUp, Users,
  FileText, Euro, Loader2, RefreshCw, ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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
}

const CARD_COLOR_MAP: Record<
  string,
  { bg: string; text: string }
> = {
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

export default function GrupoPage() {
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
      const res = await fetch('/api/inversiones/grupo');
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
      }
    } catch {
      toast.error('Error cargando estructura del grupo');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const holding = companies.find((c) => !c.parent);
  const filiales = companies.filter((c) => c.parent);

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard"><Home className="h-3.5 w-3.5" /></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/inversiones">Inversiones</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Estructura del Grupo</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Organigrama del Grupo</h1>
            <p className="text-gray-500">Estructura societaria y KPIs por empresa</p>
          </div>
          <div className="flex gap-2">
            <Link href="/family-office/dashboard">
              <Button variant="ghost" size="sm"><Landmark className="h-4 w-4 mr-1.5" />Patrimonio 360°</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />Actualizar
            </Button>
          </div>
        </div>

        {/* Holding */}
        {holding && (
          <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-white">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Landmark className="h-7 w-7 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-indigo-900">{holding.nombre}</h2>
                  <p className="text-sm text-indigo-600">Sociedad Holding · Matriz del grupo</p>
                </div>
                <div className="flex gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-indigo-700">{holding.stats.participaciones}</div>
                    <div className="text-[10px] text-gray-500">Participaciones</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-indigo-700">{holding.stats.cuentasBancarias}</div>
                    <div className="text-[10px] text-gray-500">Cuentas</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-indigo-700">{holding.stats.posicionesFinancieras}</div>
                    <div className="text-[10px] text-gray-500">Posiciones</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Connector line */}
        {filiales.length > 0 && (
          <div className="flex justify-center">
            <div className="w-0.5 h-8 bg-gray-300"></div>
          </div>
        )}

        {/* Filiales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filiales.map((filial) => {
            const isInmobiliaria = filial.stats.edificios > 0;
            const isPE = filial.nombre.includes('SCR') || filial.nombre.includes('PE');
            const color = isPE ? 'purple' : isInmobiliaria ? 'blue' : 'gray';
            const Icon = isPE ? Briefcase : isInmobiliaria ? Building2 : TrendingUp;
            const colorClasses = CARD_COLOR_MAP[color];

            return (
              <Card key={filial.id} className={cn('hover:shadow-lg transition-shadow',
                isPE && 'border-purple-200',
                isInmobiliaria && 'border-blue-200'
              )}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colorClasses.bg)}>
                      <Icon className={cn('h-5 w-5', colorClasses.text)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm truncate">{filial.nombre}</CardTitle>
                      <Badge variant="secondary" className="text-[10px] mt-0.5">
                        {isPE ? 'Private Equity SCR' : isInmobiliaria ? 'Gestión Inmobiliaria' : 'Inversiones'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {filial.stats.edificios > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3 w-3 text-gray-400" />
                        <span><strong>{filial.stats.edificios}</strong> edificios</span>
                      </div>
                    )}
                    {filial.stats.unidades > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Home className="h-3 w-3 text-gray-400" />
                        <span><strong>{filial.stats.unidades}</strong> unidades</span>
                      </div>
                    )}
                    {filial.stats.inquilinos > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3 w-3 text-gray-400" />
                        <span><strong>{filial.stats.inquilinos}</strong> inquilinos</span>
                      </div>
                    )}
                    {filial.stats.participaciones > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="h-3 w-3 text-gray-400" />
                        <span><strong>{filial.stats.participaciones}</strong> fondos</span>
                      </div>
                    )}
                    {filial.stats.cuentasBancarias > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Euro className="h-3 w-3 text-gray-400" />
                        <span><strong>{filial.stats.cuentasBancarias}</strong> cuentas</span>
                      </div>
                    )}
                  </div>

                  {/* Quick link */}
                  {isInmobiliaria && (
                    <Link href="/finanzas/cuadro-de-mandos" className="flex items-center gap-1 text-xs text-blue-600 mt-3 hover:underline">
                      Ver Cuadro de Mandos <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                  {isPE && (
                    <Link href="/family-office/pe" className="flex items-center gap-1 text-xs text-purple-600 mt-3 hover:underline">
                      Ver Private Equity <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Participadas externas */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              Sociedades Participadas del Grupo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500 mb-3">
              Participaciones directas del holding en empresas del grupo (100% control)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {companies
                .filter((c) => c.parent)
                .map((c) => (
                  <div key={c.id} className="flex items-center gap-2 p-2 rounded bg-gray-50 text-xs">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="truncate">{c.nombre}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
