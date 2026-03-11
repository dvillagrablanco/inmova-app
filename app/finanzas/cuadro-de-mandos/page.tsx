'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home, RefreshCw, LayoutDashboard, Landmark, FileBarChart } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { KpiCardsRow } from '@/components/finanzas/cuadro-mandos/KpiCardsRow';
import { FilterPanel } from '@/components/finanzas/cuadro-mandos/FilterPanel';
import { PygTable } from '@/components/finanzas/cuadro-mandos/PygTable';
import { ComparativoEjercicios } from '@/components/finanzas/cuadro-mandos/ComparativoEjercicios';
import { CostCenterBreakdown } from '@/components/finanzas/cuadro-mandos/CostCenterBreakdown';
import { ExportButton } from '@/components/finanzas/cuadro-mandos/ExportButton';

import type { CuadroMandosResponse, FiltrosDisponibles, CuadroMandosFilters } from '@/types/finanzas';

export default function CuadroDeMandosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [data, setData] = useState<CuadroMandosResponse | null>(null);
  const [filtrosDisponibles, setFiltrosDisponibles] = useState<FiltrosDisponibles | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<CuadroMandosFilters>({
    ejercicio: new Date().getFullYear(),
  });

  const costCenterBreakdownData = data
    ? {
        categories: data.centrosCoste
          .map((centro) => {
            const ingresos = Math.max(0, centro.pyg.totalIngresos.importe);
            const gastos = Math.abs(Math.min(0, centro.pyg.totalGastos.importe));
            const saldo = centro.pyg.resultadoPeriodo.importe;

            return {
              code: centro.codigo,
              name: centro.nombre,
              ingresos,
              gastos,
              saldo,
              percentage: ingresos + gastos > 0 ? gastos / (ingresos + gastos) : 0,
              color: centro.tipo,
            };
          })
          .filter((centro) => centro.ingresos > 0 || centro.gastos > 0 || centro.saldo !== 0),
        total: {
          ingresos: Math.max(0, data.pygTotal.totalIngresos.importe),
          gastos: Math.abs(Math.min(0, data.pygTotal.totalGastos.importe)),
          saldo: data.pygTotal.resultadoPeriodo.importe,
        },
      }
    : undefined;

  // Cargar filtros disponibles
  useEffect(() => {
    async function loadFiltros() {
      try {
        const res = await fetch('/api/finanzas/cuadro-de-mandos/filtros');
        if (res.ok) {
          const filtros = await res.json();
          setFiltrosDisponibles(filtros);
        }
      } catch (error) {
        console.error('Error cargando filtros:', error);
      }
    }
    if (status === 'authenticated') {
      loadFiltros();
    }
  }, [status]);

  // Cargar datos del cuadro de mandos
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set('ejercicio', String(filters.ejercicio));
      if (filters.buildingIds && filters.buildingIds.length > 0) {
        params.set('buildingIds', filters.buildingIds.join(','));
      }
      if (filters.costCenterIds && filters.costCenterIds.length > 0) {
        params.set('costCenterIds', filters.costCenterIds.join(','));
      }

      const res = await fetch(`/api/finanzas/cuadro-de-mandos?${params.toString()}`);
      if (!res.ok) throw new Error('Error cargando datos');

      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error('Error cargando cuadro de mandos:', error);
      toast.error('Error al cargar el cuadro de mandos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    }
  }, [status, loadData]);

  // Redirect si no autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading' || (status === 'authenticated' && loading && !data)) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto px-4 py-6 max-w-[1600px]">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-6 max-w-[1600px]">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard" className="flex items-center gap-1">
                <Home className="h-3.5 w-3.5" />
                Inicio
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/finanzas">Finanzas</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Cuadro de Mandos</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <LayoutDashboard className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Cuadro de Mandos Financiero</h1>
              <p className="text-xs text-gray-500">
                PyG Analítica por Centro de Coste · Ejercicio {filters.ejercicio}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/family-office/dashboard">
              <Button variant="ghost" size="sm">
                <Landmark className="h-4 w-4 mr-1.5" />
                Family Office
              </Button>
            </Link>
            <Link href="/reportes/financieros">
              <Button variant="ghost" size="sm">
                <FileBarChart className="h-4 w-4 mr-1.5" />
                Reportes
              </Button>
            </Link>
            <ExportButton data={data} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadData(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* KPIs */}
        {data && (
          <div className="mb-6">
            <KpiCardsRow
              kpis={data.kpis}
              ejerciciosComparativos={data.ejerciciosComparativos}
              ejercicioActual={filters.ejercicio}
            />
          </div>
        )}

        {/* Main content: Filters + PyG Table */}
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 mb-6">
          {/* Filter Panel */}
          {filtrosDisponibles && (
            <FilterPanel
              filtros={filtrosDisponibles}
              currentFilters={filters}
              onFiltersChange={setFilters}
            />
          )}

          {/* PyG Table */}
          {data && <PygTable pygTotal={data.pygTotal} centrosCoste={data.centrosCoste} />}
        </div>

        {/* Comparativo Multi-Ejercicio */}
        {data && data.ejerciciosComparativos.length > 0 && (
          <ComparativoEjercicios
            ejercicios={data.ejerciciosComparativos}
            ejercicioActual={filters.ejercicio}
          />
        )}

        {/* Desglose por Centro de Coste */}
        <section className="mt-6">
          <h2 className="text-lg font-semibold mb-4">Desglose por Centro de Coste</h2>
          <CostCenterBreakdown data={costCenterBreakdownData} />
        </section>
      </div>
    </AuthenticatedLayout>
  );
}
