'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Plus,
  Filter,
  Download,
  Link as LinkIcon,
  Home,
  AlertTriangle,
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

// ==========================================
// TIPOS
// ==========================================

type DayStatus = 'available' | 'occupied' | 'reserved' | 'blocked' | 'checkout' | 'checkin';

interface CalendarDay {
  date: Date;
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

// ==========================================
// DATOS DE EJEMPLO
// ==========================================

const PROPERTIES: PropertyCalendar[] = [
  {
    propertyId: '1',
    propertyName: 'Piso Gran Vía',
    address: 'Gran Vía 42, 3ºB',
    days: [],
  },
  {
    propertyId: '2',
    propertyName: 'Apartamento Castellana',
    address: 'Paseo de la Castellana 120',
    days: [],
  },
  {
    propertyId: '3',
    propertyName: 'Estudio Serrano',
    address: 'Calle Serrano 85',
    days: [],
  },
];

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
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Simular ocupación
  const getRandomStatus = (day: Date): DayStatus => {
    const dayOfMonth = day.getDate();
    if (dayOfMonth >= 5 && dayOfMonth <= 20) return 'occupied';
    if (dayOfMonth === 4) return 'checkin';
    if (dayOfMonth === 21) return 'checkout';
    if (dayOfMonth === 25 || dayOfMonth === 26) return 'blocked';
    return 'available';
  };

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

  return (
    <div className="flex items-center border-b">
      {/* Propiedad */}
      <div className="w-48 p-3 flex-shrink-0 border-r bg-gray-50">
        <div className="flex items-center gap-2">
          <Home className="h-4 w-4 text-gray-500" />
          <div>
            <p className="font-medium text-sm">{property.propertyName}</p>
            <p className="text-xs text-muted-foreground truncate">{property.address}</p>
          </div>
        </div>
      </div>

      {/* Días del mes */}
      <div className="flex overflow-x-auto">
        {days.map((day) => {
          const status = getRandomStatus(day);
          return (
            <div
              key={day.toISOString()}
              className={`
                w-8 h-12 flex-shrink-0 border-r flex items-center justify-center
                cursor-pointer transition-colors
                ${getStatusColor(status)}
                ${isToday(day) ? 'ring-2 ring-blue-500 ring-inset' : ''}
              `}
              title={`${format(day, 'd MMM', { locale: es })} - ${status}`}
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

// ==========================================
// PÁGINA PRINCIPAL
// ==========================================

export default function CalendarioPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'month' | 'quarter'>('month');

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const filteredProperties = selectedProperty === 'all' 
    ? PROPERTIES 
    : PROPERTIES.filter(p => p.propertyId === selectedProperty);

  const days = eachDayOfInterval({ 
    start: startOfMonth(currentMonth), 
    end: endOfMonth(currentMonth) 
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendario de Disponibilidad</h1>
          <p className="text-muted-foreground">
            Vista general de ocupación de todas las propiedades
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <LinkIcon className="h-4 w-4 mr-2" />
            Sincronizar iCal
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Bloquear Fechas
          </Button>
        </div>
      </div>

      {/* Controles */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Navegación de meses */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={goToToday}>
                Hoy
              </Button>
              <h2 className="text-xl font-semibold px-4">
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
                  {PROPERTIES.map((p) => (
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
          {/* Header de días */}
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
              <p>No hay propiedades que mostrar</p>
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
                <p className="text-sm text-muted-foreground">Días disponibles</p>
                <p className="text-2xl font-bold">12</p>
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
                <p className="text-sm text-muted-foreground">Días ocupados</p>
                <p className="text-2xl font-bold">16</p>
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
                <p className="text-2xl font-bold">2</p>
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
                <p className="text-sm text-muted-foreground">Ocupación mes</p>
                <p className="text-2xl font-bold">78%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
