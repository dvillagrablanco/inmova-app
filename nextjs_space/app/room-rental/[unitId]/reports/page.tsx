'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingState } from '@/components/ui/loading-state';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  FileText, 
  Download,
  TrendingUp,
  Calendar,
  DoorOpen,
  Users,
  Euro,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import logger, { logError } from '@/lib/logger';

interface OccupancyReport {
  unit: {
    id: string;
    nombre: string;
  };
  period: {
    start: string;
    end: string;
  };
  summary: {
    averageOccupancyRate: number;
    totalRevenue: number;
    totalOccupiedDays: number;
    totalAvailableDays: number;
    avgRevPerRoom: number;
  };
  roomsData: {
    roomId: string;
    numero: string;
    superficie: number;
    precio: number;
    occupancyRate: number;
    daysOccupied: number;
    revenue: number;
    tenantName: string | null;
    checkInDate: string | null;
    checkOutDate: string | null;
  }[];
  timeline: {
    date: string;
    occupiedRooms: number;
    revenue: number;
  }[];
}

export default function OccupancyReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const unitId = params?.unitId as string;

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<OccupancyReport | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // Initialize selectedMonth on client to avoid hydration errors
  useEffect(() => {
    if (!selectedMonth) {
      setSelectedMonth(format(new Date(), 'yyyy-MM'));
    }
  }, [selectedMonth]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && unitId) {
      loadReport();
    }
  }, [status, unitId, selectedMonth]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/room-rental/${unitId}/reports?month=${selectedMonth}`);
      if (response.ok) {
        const data = await response.json();
        setReport(data);
      } else {
        toast.error('Error al cargar reporte');
      }
    } catch (error) {
      logger.error('Error loading report:', error);
      toast.error('Error al cargar reporte');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/room-rental/${unitId}/reports/export?month=${selectedMonth}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-ocupacion-${selectedMonth}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Reporte exportado');
      } else {
        toast.error('Error al exportar reporte');
      }
    } catch (error) {
      logger.error('Error exporting report:', error);
      toast.error('Error al exportar reporte');
    }
  };

  const generateMonthOptions = () => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      options.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy', { locale: es })
      });
    }
    return options;
  };

  if (loading || !report) {
    return <LoadingState message="Generando reporte..." />;
  }

  const monthOptions = generateMonthOptions();

  return (
    <div className="flex min-h-screen bg-gradient-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Breadcrumb */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/home">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/room-rental">Co-Living</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/room-rental/${unitId}`}>{report.unit.nombre}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Reportes de Ocupación</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reportes de Ocupación</h1>
                  <p className="text-sm text-gray-600 mt-1">{report.unit.nombre}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleExport} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar PDF
                </Button>
              </div>
            </div>

            {/* KPIs del período */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Tasa de Ocupación</p>
                      <p className="text-3xl font-bold text-indigo-900">
                        {report.summary.averageOccupancyRate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {report.summary.totalOccupiedDays} de {report.summary.totalAvailableDays} días
                      </p>
                    </div>
                    <div className="p-3 bg-indigo-600 rounded-xl">
                      <PieChartIcon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Ingresos Totales</p>
                      <p className="text-3xl font-bold text-green-900">
                        {report.summary.totalRevenue.toFixed(0)}€
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        En el período seleccionado
                      </p>
                    </div>
                    <div className="p-3 bg-green-600 rounded-xl">
                      <Euro className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Ingreso por Habitación</p>
                      <p className="text-3xl font-bold text-purple-900">
                        {report.summary.avgRevPerRoom.toFixed(0)}€
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Promedio del período
                      </p>
                    </div>
                    <div className="p-3 bg-purple-600 rounded-xl">
                      <TrendingUp className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Habitaciones</p>
                      <p className="text-3xl font-bold text-orange-900">
                        {report.roomsData.length}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        En esta propiedad
                      </p>
                    </div>
                    <div className="p-3 bg-orange-600 rounded-xl">
                      <DoorOpen className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Desglose por habitación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  Desglose por Habitación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.roomsData.map((room) => (
                    <div key={room.roomId} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-indigo-100 rounded-lg">
                            <DoorOpen className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">Habitación {room.numero}</h3>
                              <Badge variant="outline">{room.superficie}m²</Badge>
                              <Badge variant="outline">{room.precio}€/mes</Badge>
                            </div>
                            {room.tenantName && (
                              <p className="text-sm text-gray-600 mb-2">
                                <Users className="inline h-3 w-3 mr-1" />
                                {room.tenantName}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                              {room.checkInDate && (
                                <span>
                                  Check-in: {format(new Date(room.checkInDate), 'dd MMM yyyy', { locale: es })}
                                </span>
                              )}
                              {room.checkOutDate && (
                                <span>
                                  Check-out: {format(new Date(room.checkOutDate), 'dd MMM yyyy', { locale: es })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end gap-4 sm:gap-2">
                          <div className="text-left sm:text-right">
                            <p className="text-sm text-gray-600">Tasa de Ocupación</p>
                            <p className="text-2xl font-bold text-indigo-600">{room.occupancyRate.toFixed(1)}%</p>
                            <p className="text-xs text-gray-500">{room.daysOccupied} días ocupados</p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-sm text-gray-600">Ingresos</p>
                            <p className="text-2xl font-bold text-green-600">{room.revenue.toFixed(0)}€</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Línea de tiempo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  Línea de Tiempo de Ocupación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.timeline.slice(0, 10).map((day) => {
                    const totalRooms = report.roomsData.length;
                    const occupancyPercent = (day.occupiedRooms / totalRooms) * 100;

                    return (
                      <div key={day.date} className="flex items-center gap-3">
                        <div className="w-24 text-sm text-gray-600">
                          {format(new Date(day.date), 'dd MMM', { locale: es })}
                        </div>
                        <div className="flex-1">
                          <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-end pr-3 text-white text-sm font-medium transition-all"
                              style={{ width: `${occupancyPercent}%` }}
                            >
                              {occupancyPercent > 20 && `${occupancyPercent.toFixed(0)}%`}
                            </div>
                          </div>
                        </div>
                        <div className="w-32 text-right text-sm">
                          <span className="font-semibold text-gray-900">{day.occupiedRooms}</span>
                          <span className="text-gray-500"> / {totalRooms} hab.</span>
                        </div>
                        <div className="w-24 text-right text-sm font-semibold text-green-600">
                          {day.revenue.toFixed(0)}€
                        </div>
                      </div>
                    );
                  })}
                </div>
                {report.timeline.length > 10 && (
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    Mostrando primeros 10 días. Exporta el reporte completo para ver todos los datos.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
