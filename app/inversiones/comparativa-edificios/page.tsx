// @ts-nocheck
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Building2, ArrowUpDown, ArrowUp, ArrowDown, Home, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BuildingMetric {
  id: string;
  nombre: string;
  direccion: string;
  totalUnidades: number;
  unidadesOcupadas: number;
  metrics: {
    totalUnits: number;
    occupiedUnits: number;
    ocupacionPct: number;
    ingresosMensuales: number;
  };
  anoConstructor?: number;
}

type SortKey = 'nombre' | 'direccion' | 'unidades' | 'ocupadas' | 'ocupacion' | 'ingresos' | 'ano';
type SortDir = 'asc' | 'desc';

export default function ComparativaEdificiosPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [buildings, setBuildings] = useState<BuildingMetric[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('nombre');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') loadData();
  }, [status, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/buildings?limit=500');
      if (!res.ok) throw new Error('Error cargando edificios');
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data || [];
      setBuildings(list);
    } catch (e) {
      toast.error('Error al cargar edificios');
      setBuildings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedBuildings = useMemo(() => {
    return [...buildings].sort((a, b) => {
      let va: number | string;
      let vb: number | string;
      switch (sortKey) {
        case 'nombre':
          va = a.nombre ?? '';
          vb = b.nombre ?? '';
          break;
        case 'direccion':
          va = a.direccion ?? '';
          vb = b.direccion ?? '';
          break;
        case 'unidades':
          va = a.totalUnidades ?? a.metrics?.totalUnits ?? 0;
          vb = b.totalUnidades ?? b.metrics?.totalUnits ?? 0;
          break;
        case 'ocupadas':
          va = a.unidadesOcupadas ?? a.metrics?.occupiedUnits ?? 0;
          vb = b.unidadesOcupadas ?? b.metrics?.occupiedUnits ?? 0;
          break;
        case 'ocupacion':
          va = a.metrics?.ocupacionPct ?? 0;
          vb = b.metrics?.ocupacionPct ?? 0;
          break;
        case 'ingresos':
          va = a.metrics?.ingresosMensuales ?? 0;
          vb = b.metrics?.ingresosMensuales ?? 0;
          break;
        case 'ano':
          va = a.anoConstructor ?? 0;
          vb = b.anoConstructor ?? 0;
          break;
        default:
          return 0;
      }
      const cmp = typeof va === 'string' ? va.localeCompare(String(vb)) : va - vb;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [buildings, sortKey, sortDir]);

  const totalEdificios = buildings.length;
  const mediaOcupacion =
    buildings.length > 0
      ? buildings.reduce((s, b) => s + (b.metrics?.ocupacionPct ?? 0), 0) / buildings.length
      : 0;
  const totalIngresos = buildings.reduce((s, b) => s + (b.metrics?.ingresosMensuales ?? 0), 0);

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="ml-1 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4" />
    );
  };

  return (
    <AuthenticatedLayout maxWidth="7xl">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/inversiones">Inversiones</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Comparativa Edificios</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comparativa Edificios</h1>
          <p className="text-muted-foreground">
            Compara todos tus edificios por ocupación, ingresos y características
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Edificios</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalEdificios}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Media Ocupación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mediaOcupacion.toFixed(1)}%</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Ingresos/mes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalIngresos.toLocaleString('es-ES', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Tabla comparativa</CardTitle>
                <CardDescription>
                  Haz clic en las cabeceras para ordenar por cada columna
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-3 h-8"
                          onClick={() => handleSort('nombre')}
                        >
                          Nombre
                          <SortIcon column="nombre" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-3 h-8"
                          onClick={() => handleSort('direccion')}
                        >
                          Dirección
                          <SortIcon column="direccion" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-3 h-8"
                          onClick={() => handleSort('unidades')}
                        >
                          Unidades
                          <SortIcon column="unidades" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-3 h-8"
                          onClick={() => handleSort('ocupadas')}
                        >
                          Ocupadas
                          <SortIcon column="ocupadas" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-3 h-8"
                          onClick={() => handleSort('ocupacion')}
                        >
                          Ocupación %
                          <SortIcon column="ocupacion" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-3 h-8"
                          onClick={() => handleSort('ingresos')}
                        >
                          Ingresos/mes
                          <SortIcon column="ingresos" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-3 h-8"
                          onClick={() => handleSort('ano')}
                        >
                          Año construcción
                          <SortIcon column="ano" />
                        </Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedBuildings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.nombre}</TableCell>
                        <TableCell>{b.direccion || '-'}</TableCell>
                        <TableCell>{b.totalUnidades ?? b.metrics?.totalUnits ?? 0}</TableCell>
                        <TableCell>{b.unidadesOcupadas ?? b.metrics?.occupiedUnits ?? 0}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {(b.metrics?.ocupacionPct ?? 0).toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(b.metrics?.ingresosMensuales ?? 0).toLocaleString('es-ES', {
                            style: 'currency',
                            currency: 'EUR',
                          })}
                        </TableCell>
                        <TableCell>{b.anoConstructor ?? '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {sortedBuildings.length === 0 && (
                  <p className="py-8 text-center text-muted-foreground">
                    No hay edificios para mostrar
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
