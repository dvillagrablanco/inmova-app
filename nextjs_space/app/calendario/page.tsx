'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, Euro } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

interface Payment {
  id: string;
  periodo: string;
  monto: number;
  fechaVencimiento: string;
  fechaPago: string | null;
  estado: string;
  contract: {
    tenant: {
      nombreCompleto: string;
    };
    unit: {
      numero: string;
      building: {
        nombre: string;
      };
    };
  };
}

export default function CalendarioPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchPayments();
    }
  }, [status, router, currentMonth]);

  const fetchPayments = async () => {
    try {
      const res = await fetch('/api/payments');
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (error) {
      console.error('Error al cargar pagos:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getPaymentsForDate = (date: Date) => {
    return payments.filter((p) => {
      const paymentDate = new Date(p.fechaVencimiento);
      return isSameDay(paymentDate, date);
    });
  };

  const selectedPayments = selectedDate ? getPaymentsForDate(selectedDate) : [];

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'pagado':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'atrasado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando calendario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Calendar className="h-8 w-8" />
          Calendario de Pagos
        </h1>
        <p className="text-muted-foreground mt-2">
          Vista mensual de vencimientos y pagos realizados
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendario */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle>
                {format(currentMonth, 'MMMM yyyy', { locale: es }).charAt(0).toUpperCase() +
                  format(currentMonth, 'MMMM yyyy', { locale: es }).slice(1)}
              </CardTitle>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Días del mes */}
            <div className="grid grid-cols-7 gap-2">
              {/* Espacios en blanco para días antes del mes */}
              {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Días del mes */}
              {days.map((day) => {
                const dayPayments = getPaymentsForDate(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());

                return (
                  <button
                    key={day.toString()}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      aspect-square p-2 rounded-lg border text-left hover:border-primary transition-colors
                      ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-200'}
                      ${isToday ? 'bg-blue-50' : ''}
                    `}
                  >
                    <div className="text-sm font-semibold mb-1">{format(day, 'd')}</div>
                    {dayPayments.length > 0 && (
                      <div className="space-y-1">
                        {dayPayments.slice(0, 2).map((payment) => (
                          <div
                            key={payment.id}
                            className={`text-xs px-1 py-0.5 rounded truncate ${getStatusColor(
                              payment.estado
                            )}`}
                          >
                            €{payment.monto}
                          </div>
                        ))}
                        {dayPayments.length > 2 && (
                          <div className="text-xs text-muted-foreground">+{dayPayments.length - 2}</div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Detalles de pagos del día seleccionado */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate
                ? format(selectedDate, "d 'de' MMMM", { locale: es })
                : 'Selecciona un día'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {selectedDate
                  ? 'No hay pagos programados para este día'
                  : 'Haz clic en un día para ver los pagos'}
              </p>
            ) : (
              <div className="space-y-4">
                {selectedPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="border rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusColor(payment.estado)}>
                        {payment.estado}
                      </Badge>
                      <span className="font-bold text-lg">€{payment.monto}</span>
                    </div>
                    <div className="text-sm">
                      <p className="font-semibold">{payment.contract.tenant.nombreCompleto}</p>
                      <p className="text-muted-foreground">
                        {payment.contract.unit.building.nombre} - {payment.contract.unit.numero}
                      </p>
                      <p className="text-muted-foreground mt-1">{payment.periodo}</p>
                    </div>
                    {payment.fechaPago && (
                      <p className="text-xs text-muted-foreground">
                        Pagado: {format(new Date(payment.fechaPago), "d 'de' MMMM", { locale: es })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumen del mes */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Resumen del Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              {
                label: 'Total a Cobrar',
                value: payments
                  .filter((p) => {
                    const date = new Date(p.fechaVencimiento);
                    return isSameMonth(date, currentMonth);
                  })
                  .reduce((sum, p) => sum + p.monto, 0),
                color: 'text-blue-600',
              },
              {
                label: 'Cobrado',
                value: payments
                  .filter((p) => {
                    const date = new Date(p.fechaVencimiento);
                    return isSameMonth(date, currentMonth) && p.estado === 'pagado';
                  })
                  .reduce((sum, p) => sum + p.monto, 0),
                color: 'text-green-600',
              },
              {
                label: 'Pendiente',
                value: payments
                  .filter((p) => {
                    const date = new Date(p.fechaVencimiento);
                    return isSameMonth(date, currentMonth) && p.estado === 'pendiente';
                  })
                  .reduce((sum, p) => sum + p.monto, 0),
                color: 'text-yellow-600',
              },
              {
                label: 'Atrasado',
                value: payments
                  .filter((p) => {
                    const date = new Date(p.fechaVencimiento);
                    return isSameMonth(date, currentMonth) && p.estado === 'atrasado';
                  })
                  .reduce((sum, p) => sum + p.monto, 0),
                color: 'text-red-600',
              },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>
                  €{stat.value.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
