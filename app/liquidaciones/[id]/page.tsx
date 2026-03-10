'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { SmartBreadcrumbs } from '@/components/navigation/smart-breadcrumbs';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileDown,
  FileText,
  Home,
  Calendar,
  User,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Liquidacion {
  id: string;
  propietarioId: string;
  propietarioNombre: string;
  propietarioEmail: string;
  inmuebleId: string;
  inmuebleNombre: string;
  inmuebleDireccion: string;
  periodoMes: number;
  periodoAnio: number;
  rentaCobrada: number;
  honorariosGestion: number;
  honorariosMonto: number;
  gastosRepercutibles: number;
  otrosGastos: number;
  netoAPagar: number;
  estado: string;
  notas: string;
  fechaPago: string | null;
  createdAt: string;
  updatedAt: string;
  history: Array<{ fecha: string; estado: string; nota?: string }>;
}

const MESES: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril', 5: 'Mayo', 6: 'Junio',
  7: 'Julio', 8: 'Agosto', 9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};

function formatEuro(n: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(n);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function EstadoBadge({ estado }: { estado: string }) {
  const config: Record<string, { className: string; label: string }> = {
    pendiente: {
      className: 'bg-amber-100 text-amber-800 border-amber-200',
      label: 'Pendiente',
    },
    pagada: {
      className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      label: 'Pagada',
    },
    anulada: {
      className: 'bg-red-100 text-red-800 border-red-200',
      label: 'Anulada',
    },
  };
  const c = config[estado] || { className: '', label: estado };
  return (
    <Badge variant="outline" className={c.className}>
      {c.label}
    </Badge>
  );
}

export default function LiquidacionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [liquidacion, setLiquidacion] = useState<Liquidacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const id = params?.id as string;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || status !== 'authenticated') return;
      try {
        const res = await fetch(`/api/liquidaciones/${id}`);
        const json = await res.json();
        if (json.success && json.data) {
          setLiquidacion(json.data);
        } else {
          toast.error('Liquidación no encontrada');
          router.push('/liquidaciones');
        }
      } catch (err) {
        console.error(err);
        toast.error('Error al cargar liquidación');
        router.push('/liquidaciones');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, status, router]);

  const handleMarcarPagada = async () => {
    try {
      const res = await fetch(`/api/liquidaciones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'pagada' }),
      });
      if (!res.ok) throw new Error('Error');
      const json = await res.json();
      if (json.success && json.data) setLiquidacion(json.data);
      toast.success('Liquidación marcada como pagada');
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const handleAnular = async () => {
    try {
      const res = await fetch(`/api/liquidaciones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'anulada' }),
      });
      if (!res.ok) throw new Error('Error');
      const json = await res.json();
      if (json.success && json.data) setLiquidacion(json.data);
      toast.success('Liquidación anulada');
    } catch {
      toast.error('Error al anular');
    }
  };

  const handleDescargarPDF = () => {
    toast.info('Descarga de PDF en desarrollo');
  };

  if (status === 'loading' || isLoading || !liquidacion) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-pulse text-muted-foreground">Cargando...</div>
        </div>
      </AuthenticatedLayout>
    );
  }

  const periodo = `${MESES[liquidacion.periodoMes]} ${liquidacion.periodoAnio}`;

  return (
    <AuthenticatedLayout maxWidth="5xl">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SmartBreadcrumbs
            customSegments={[
              { label: 'Inicio', href: '/dashboard', icon: Home },
              { label: 'Liquidaciones', href: '/liquidaciones', icon: FileText },
              { label: `Liquidación ${periodo}`, href: `/liquidaciones/${id}` },
            ]}
          />
          <Button variant="outline" asChild>
            <Link href="/liquidaciones" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al listado
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Liquidación {periodo}</h1>
            <p className="text-muted-foreground mt-1">
              Creada el {formatDate(liquidacion.createdAt)}
            </p>
          </div>
          <EstadoBadge estado={liquidacion.estado} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Desglose */}
          <Card>
            <CardHeader>
              <CardTitle>Desglose</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{liquidacion.propietarioNombre}</p>
                  {liquidacion.propietarioEmail && (
                    <p className="text-sm text-muted-foreground">{liquidacion.propietarioEmail}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{liquidacion.inmuebleNombre}</p>
                  {liquidacion.inmuebleDireccion && (
                    <p className="text-sm text-muted-foreground">{liquidacion.inmuebleDireccion}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <p className="font-medium">{periodo}</p>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Renta cobrada</span>
                  <span>{formatEuro(liquidacion.rentaCobrada)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Honorarios gestión ({liquidacion.honorariosGestion}%)</span>
                  <span className="text-red-600">-{formatEuro(liquidacion.honorariosMonto)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Gastos repercutidos</span>
                  <span className="text-red-600">
                    -{formatEuro(liquidacion.gastosRepercutibles + liquidacion.otrosGastos)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>Importe neto a pagar</span>
                  <span>{formatEuro(liquidacion.netoAPagar)}</span>
                </div>
              </div>

              {liquidacion.notas && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Notas</p>
                  <p className="text-sm">{liquidacion.notas}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Acciones y timeline */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {liquidacion.estado === 'pendiente' && (
                  <Button onClick={handleMarcarPagada} className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Marcar como pagada
                  </Button>
                )}
                {liquidacion.estado !== 'anulada' && (
                  <Button variant="destructive" onClick={handleAnular} className="gap-2">
                    <XCircle className="h-4 w-4" />
                    Anular liquidación
                  </Button>
                )}
                <Button variant="outline" onClick={handleDescargarPDF} className="gap-2">
                  <FileDown className="h-4 w-4" />
                  Descargar PDF
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historial de cambios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {liquidacion.history?.map((h, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        {i < (liquidacion.history?.length ?? 0) - 1 && (
                          <div className="w-px flex-1 min-h-[20px] bg-border" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="font-medium capitalize">{h.estado}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(h.fecha)}</p>
                        {h.nota && (
                          <p className="text-sm text-muted-foreground mt-1">{h.nota}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
