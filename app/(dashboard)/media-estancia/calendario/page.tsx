'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Plus,
  Download,
  Link as LinkIcon,
  Home,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// ==========================================
// TIPOS
// ==========================================

type DayStatus = 'available' | 'occupied' | 'reserved' | 'blocked' | 'checkout' | 'checkin';

interface CalendarDay {
  date: string;
  status: DayStatus;
  occupancy?: {
    tenantName: string;
    contractId: string;
  };
}

interface PropertyCalendar {
  propertyId: string;
  propertyName: string;
  address: string;
  days: CalendarDay[];
}

interface CalendarStats {
  totalDays: number;
  occupiedDays: number;
  availableDays: number;
  occupancyRate: number;
  gapsDetected: number;
  propertiesCount: number;
}

// ==========================================
// COMPONENTES
// ==========================================

function StatusLegend() {
  const items = [
    { status: 'available', label: 'Disponible', color: 'bg-green-100 border-green-300' },
    { status: 'occupied', label: 'Ocupado', color: 'bg-blue-200 border-blue-400' },
    { status: 'reserved', label: 'Reservado', color: 'bg-yellow-100 border-yellow-300' },
    { status: 'checkin', label: 'Check-in', color: 'bg-green-300 border-green-500' },
    { status: 'checkout', label: 'Check-out', color: 'bg-orange-200 border-orange-400' },
    { status: 'blocked', label: 'Bloqueado', color: 'bg-gray-200 border-gray-400' },
  ];

  return (
    <div className="flex flex-wrap gap-4">
      {items.map((item) => (
        <div key={item.status} className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded border ${item.color}`} />
          <span className="text-sm text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function PropertyRow({ property, currentMonth }: { property: PropertyCalendar; currentMonth: Date }) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getStatusColor = (status: DayStatus) => {
    switch (status) {
      case 'available': return 'bg-green-50 hover:bg-green-100';
      case 'occupied': return 'bg-blue-200';
      case 'reserved': return 'bg-yellow-100';
      case 'checkin': return 'bg-green-300';
      case 'checkout': return 'bg-orange-200';
      case 'blocked': return 'bg-gray-200';
      default: return 'bg-white';
    }
  };

  // Mapear los días del API a los días del mes
  const dayStatusMap = new Map<string, CalendarDay>();
  property.days.forEach((day) => {
    dayStatusMap.set(day.date, day);
  });

  return (
    <div className="flex items-center border-b">
      {/* Propiedad */}
      <div className="w-48 p-3 flex-shrink-0 border-r bg-gray-50">
        <div className="flex items-center gap-2">
          <Home className="h-4 w-4 text-gray-500" />
          <div>
            <p className="font-medium text-sm truncate" title={property.propertyName}>
              {property.propertyName}
            </p>
            <p className="text-xs text-muted-foreground truncate" title={property.address}>
              {property.address}
            </p>
          </div>
        </div>
      </div>

      {/* Dias del mes */}
      <div className="flex overflow-x-auto">
        {daysInMonth.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayData = dayStatusMap.get(dateStr);
          const status = dayData?.status || 'available';
          
          return (
            <div
              key={day.toISOString()}
              className={`
                w-8 h-12 flex-shrink-0 border-r flex items-center justify-center
                cursor-pointer transition-colors
                ${getStatusColor(status)}
                ${isToday(day) ? 'ring-2 ring-blue-500 ring-inset' : ''}
              `}
              title={`${format(day, 'd MMM', { locale: es })} - ${status}${dayData?.occupancy ? ` (${dayData.occupancy.tenantName})` : ''}`}
            >
              <span className={`text-xs ${status === 'occupied' ? 'text-blue-800' : ''}`}>
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-6 w-12 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center border-b py-3">
              <Skeleton className="w-48 h-10 mr-4" />
              <div className="flex gap-1">
                {[...Array(15)].map((_, j) => (
                  <Skeleton key={j} className="w-8 h-12" />
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ==========================================
// PAGINA PRINCIPAL
// ==========================================

export default function CalendarioPage() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'month' | 'quarter'>('month');
  const [properties, setProperties] = useState<PropertyCalendar[]>([]);
  const [stats, setStats] = useState<CalendarStats>({
    totalDays: 0,
    occupiedDays: 0,
    availableDays: 0,
    occupancyRate: 0,
    gapsDetected: 0,
    propertiesCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockStartDate, setBlockStartDate] = useState('');
  const [blockEndDate, setBlockEndDate] = useState('');
  const [blockPropertyId, setBlockPropertyId] = useState<string>('all');

  const fetchCalendarData = async () => {
    try {
      const params = new URLSearchParams({
        month: (currentMonth.getMonth() + 1).toString(),
        year: currentMonth.getFullYear().toString(),
      });
      if (selectedProperty !== 'all') {
        params.set('propertyId', selectedProperty);
      }

      const response = await fetch(`/api/media-estancia/calendario?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setProperties(data.properties || []);
        setStats(data.stats || {
          totalDays: 0,
          occupiedDays: 0,
          availableDays: 0,
          occupancyRate: 0,
          gapsDetected: 0,
          propertiesCount: 0,
        });
      } else {
        toast.error('Error al cargar datos del calendario');
      }
    } catch (error) {
      console.error('Error fetching calendar:', error);
      toast.error('Error al cargar datos del calendario');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, [currentMonth, selectedProperty]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCalendarData();
  };

  const handleSyncIcal = () => {
    router.push('/media-estancia/configuracion');
    toast.info('Configura la sincronización iCal desde Portales');
  };

  const downloadCsv = (filename: string, rows: Array<Array<string | number>>) => {
    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(';')
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    if (!properties.length) {
      toast.error('No hay datos para exportar');
      return;
    }

    const rows: Array<Array<string | number>> = [
      ['Propiedad', 'Direccion', 'Ocupados', 'Disponibles', 'Reservados', 'Bloqueados', 'Ocupacion %'],
    ];

    properties.forEach((property) => {
      const occupied = property.days.filter((day) => day.status === 'occupied').length;
      const available = property.days.filter((day) => day.status === 'available').length;
      const reserved = property.days.filter((day) => day.status === 'reserved').length;
      const blocked = property.days.filter((day) => day.status === 'blocked').length;
      const total = property.days.length || 1;
      const occupancyRate = Math.round((occupied / total) * 100);

      rows.push([
        property.propertyName,
        property.address,
        occupied,
        available,
        reserved,
        blocked,
        occupancyRate,
      ]);
    });

    downloadCsv(
      `calendario_media_estancia_${format(currentMonth, 'yyyy_MM')}.csv`,
      rows
    );
    toast.success('Exportación generada');
  };

  const handleOpenBlockDialog = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    setBlockStartDate((prev) => prev || today);
    setBlockEndDate((prev) => prev || today);
    setBlockDialogOpen(true);
  };

  const handleBlockDates = () => {
    if (!blockStartDate || !blockEndDate) {
      toast.error('Selecciona un rango de fechas');
      return;
    }

    const start = parseISO(blockStartDate);
    const end = parseISO(blockEndDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      toast.error('Fechas inválidas');
      return;
    }

    if (end < start) {
      toast.error('La fecha fin debe ser posterior a la fecha inicio');
      return;
    }

    const daysToBlock = eachDayOfInterval({ start, end }).map((day) =>
      format(day, 'yyyy-MM-dd')
    );
    const daysToBlockSet = new Set(daysToBlock);

    setProperties((prev) =>
      prev.map((property) => {
        if (blockPropertyId !== 'all' && property.propertyId !== blockPropertyId) {
          return property;
        }

        const existingDates = new Set(property.days.map((day) => day.date));
        const updatedDays = property.days.map((day) =>
          daysToBlockSet.has(day.date) ? { ...day, status: 'blocked' as DayStatus } : day
        );
        const newDays = daysToBlock
          .filter((date) => !existingDates.has(date))
          .map((date) => ({ date, status: 'blocked' as DayStatus }));

        return {
          ...property,
          days: [...updatedDays, ...newDays],
        };
      })
    );

    toast.success('Fechas bloqueadas');
    setBlockDialogOpen(false);
  };

  const filteredProperties = selectedProperty === 'all' 
    ? properties 
    : properties.filter(p => p.propertyId === selectedProperty);

  const days = eachDayOfInterval({ 
    start: startOfMonth(currentMonth), 
    end: endOfMonth(currentMonth) 
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Calendario de Disponibilidad</h1>
            <p className="text-muted-foreground">
              Vista general de ocupacion de todas las propiedades
            </p>
          </div>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendario de Disponibilidad</h1>
          <p className="text-muted-foreground">
            Vista general de ocupacion de todas las propiedades
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button variant="outline" onClick={handleSyncIcal}>
            <LinkIcon className="h-4 w-4 mr-2" />
            Sincronizar iCal
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={handleOpenBlockDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Bloquear Fechas
          </Button>
        </div>
      </div>

      {/* Controles */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Navegacion de meses */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={goToToday}>
                Hoy
              </Button>
              <h2 className="text-xl font-semibold px-4 capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </h2>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-4">
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todas las propiedades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las propiedades</SelectItem>
                  {properties.map((p) => (
                    <SelectItem key={p.propertyId} value={p.propertyId}>
                      {p.propertyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={viewMode} onValueChange={(v) => setViewMode(v as 'month' | 'quarter')}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Vista Mensual</SelectItem>
                  <SelectItem value="quarter">Vista Trimestral</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leyenda */}
      <Card>
        <CardContent className="p-4">
          <StatusLegend />
        </CardContent>
      </Card>

      {/* Calendario */}
      <Card>
        <CardContent className="p-0">
          {/* Header de dias */}
          <div className="flex items-center border-b bg-gray-100">
            <div className="w-48 p-3 flex-shrink-0 border-r">
              <span className="font-medium text-sm">Propiedad</span>
            </div>
            <div className="flex overflow-x-auto">
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className={`
                    w-8 flex-shrink-0 border-r text-center py-2
                    ${day.getDay() === 0 || day.getDay() === 6 ? 'bg-gray-50' : ''}
                  `}
                >
                  <div className="text-xs text-muted-foreground">
                    {format(day, 'EEE', { locale: es })[0]}
                  </div>
                  <div className={`text-sm font-medium ${isToday(day) ? 'text-blue-600' : ''}`}>
                    {day.getDate()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filas de propiedades */}
          {filteredProperties.map((property) => (
            <PropertyRow 
              key={property.propertyId} 
              property={property} 
              currentMonth={currentMonth}
            />
          ))}

          {filteredProperties.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No hay propiedades que mostrar</p>
              <p className="text-sm">Agrega unidades desde la seccion de Edificios para ver el calendario</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dias disponibles</p>
                <p className="text-2xl font-bold">{stats.availableDays}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Home className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dias ocupados</p>
                <p className="text-2xl font-bold">{stats.occupiedDays}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Huecos detectados</p>
                <p className="text-2xl font-bold">{stats.gapsDetected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ocupacion mes</p>
                <p className="text-2xl font-bold">{stats.occupancyRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear fechas</DialogTitle>
            <DialogDescription>
              Marca un rango como bloqueado para evitar nuevas reservas.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Propiedad</Label>
              <Select value={blockPropertyId} onValueChange={setBlockPropertyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las propiedades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las propiedades</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.propertyId} value={property.propertyId}>
                      {property.propertyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Fecha inicio</Label>
                <Input
                  type="date"
                  value={blockStartDate}
                  onChange={(event) => setBlockStartDate(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Fecha fin</Label>
                <Input
                  type="date"
                  value={blockEndDate}
                  onChange={(event) => setBlockEndDate(event.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBlockDates}>Bloquear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
