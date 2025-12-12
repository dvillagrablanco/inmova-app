'use client';
export const dynamic = 'force-dynamic';


import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

import { useEffect, useState } from 'react';
import logger from '@/lib/logger';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingState } from '@/components/ui/loading-state';
import { toast } from 'sonner';
import {
  DollarSign,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Filter,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';


interface Comision {
  id: string;
  monto: number;
  periodo: string;
  estado: string;
  concepto: string | null;
  detalles: string | null;
  porcentaje: number | null;
  baseCalculo: number | null;
  fechaCalculo: Date;
  fechaPago: Date | null;
}

const estadosComision = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'APROBADA', label: 'Aprobada' },
  { value: 'PAGADA', label: 'Pagada' },
  { value: 'RECHAZADA', label: 'Rechazada' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 3 }, (_, i) => currentYear - i);

const months = [
  { value: 'all', label: 'Todos los meses' },
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

export default function ComisionesPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [comisiones, setComisiones] = useState<Comision[]>([]);
  const [filteredComisiones, setFilteredComisiones] = useState<Comision[]>([]);
  const [loading, setLoading] = useState(true);
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState(currentYear.toString());
  const [monthFilter, setMonthFilter] = useState('all');

  // Estadísticas
  const [totalComisiones, setTotalComisiones] = useState(0);
  const [totalPendientes, setTotalPendientes] = useState(0);
  const [totalPagadas, setTotalPagadas] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      loadComisiones();
    }
  }, [session]);

  useEffect(() => {
    applyFilters();
  }, [comisiones, estadoFilter, yearFilter, monthFilter]);

  const loadComisiones = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sales/commissions');
      if (response.ok) {
        const data = await response.json();
        setComisiones(data);
      } else {
        toast.error('Error al cargar comisiones');
      }
    } catch (error) {
      logger.error('Error loading commissions:', error);
      toast.error('Error al cargar comisiones');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...comisiones];

    // Filtro de estado
    if (estadoFilter && estadoFilter !== 'all') {
      filtered = filtered.filter((c) => c.estado === estadoFilter);
    }

    // Filtro de año y mes
    if (yearFilter || monthFilter !== 'all') {
      filtered = filtered.filter((c) => {
        const fecha = new Date(c.fechaCalculo);
        const year = fecha.getFullYear();
        const month = fecha.getMonth() + 1;

        const yearMatch = yearFilter ? year === parseInt(yearFilter) : true;
        const monthMatch =
          monthFilter !== 'all' ? month === parseInt(monthFilter) : true;

        return yearMatch && monthMatch;
      });
    }

    setFilteredComisiones(filtered);

    // Calcular estadísticas
    const total = filtered.reduce((sum, c) => sum + parseFloat(c.monto.toString()), 0);
    const pendientes = filtered
      .filter((c) => c.estado === 'PENDIENTE' || c.estado === 'APROBADA')
      .reduce((sum, c) => sum + parseFloat(c.monto.toString()), 0);
    const pagadas = filtered
      .filter((c) => c.estado === 'PAGADA')
      .reduce((sum, c) => sum + parseFloat(c.monto.toString()), 0);

    setTotalComisiones(total);
    setTotalPendientes(pendientes);
    setTotalPagadas(pagadas);
  };

  const getBadgeColor = (estado: string) => {
    const colors: Record<string, string> = {
      PENDIENTE: 'bg-yellow-100 text-yellow-700',
      APROBADA: 'bg-blue-100 text-blue-700',
      PAGADA: 'bg-green-100 text-green-700',
      RECHAZADA: 'bg-red-100 text-red-700',
    };
    return colors[estado] || 'bg-gray-100 text-gray-700';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <LoadingState message="Cargando comisiones..." />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/portal-comercial">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold gradient-text">Mis Comisiones</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                  Historial de comisiones y pagos
                </p>
              </div>
            </div>
            <Button onClick={loadComisiones} variant="outline">
              Actualizar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-hover">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <DollarSign className="mr-2 h-4 w-4" />
                Total Comisiones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalComisiones.toFixed(2)}€</div>
                <p className="text-xs text-muted-foreground mt-2">
                {filteredComisiones.length} comisiones
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {totalPendientes.toFixed(2)}€
              </div>
              <p className="text-xs text-muted-foreground mt-2">Por pagar</p>
            </CardContent>
          </Card>

          <Card className="card-hover gradient-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white flex items-center">
                <CheckCircle className="mr-2 h-4 w-4" />
                Pagadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {totalPagadas.toFixed(2)}€
              </div>
              <p className="text-xs text-white/80 mt-2">Cobradas</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Estado */}
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  {estadosComision.map((estado) => (
                    <SelectItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Año */}
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Mes */}
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Resultados */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredComisiones.length} comisiones encontradas
              </p>
              {(estadoFilter !== 'all' || monthFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEstadoFilter('all');
                    setYearFilter(currentYear.toString());
                    setMonthFilter('all');
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Comisiones */}
        {filteredComisiones.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No se encontraron comisiones</p>
                  <p className="text-sm">
                  {estadoFilter !== 'all' || monthFilter !== 'all'
                    ? 'Intenta ajustar los filtros'
                    : 'Aún no tienes comisiones registradas'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredComisiones.map((comision) => (
              <Card key={comision.id} className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Cabecera */}
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">
                          {comision.monto.toFixed(2)}€
                        </h3>
                        <Badge className={getBadgeColor(comision.estado)}>
                          {comision.estado}
                        </Badge>
                      </div>

                      {/* Detalles */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Período: {comision.periodo}</span>
                        </div>

                        {comision.concepto && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <span>{comision.concepto}</span>
                          </div>
                        )}

                        {comision.porcentaje && comision.baseCalculo && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <TrendingUp className="h-4 w-4" />
                            <span>
                              {comision.porcentaje}% sobre {comision.baseCalculo.toFixed(2)}€
                            </span>
                          </div>
                        )}

                        {comision.detalles && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {comision.detalles}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Fechas */}
                    <div className="text-right text-sm text-muted-foreground">
                      <p>
                        Calculado:{' '}
                        {comision.fechaCalculo
                          ? format(new Date(comision.fechaCalculo), "d 'de' MMM 'de' yyyy", {
                              locale: es,
                            })
                          : 'Sin fecha'}
                      </p>
                      {comision.fechaPago && (
                        <p className="text-green-600 font-medium mt-1">
                          Pagado:{' '}
                          {format(new Date(comision.fechaPago), "d 'de' MMM 'de' yyyy", {
                            locale: es,
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
