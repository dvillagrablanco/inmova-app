'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Euro,
  Calendar,
  User,
  Building2,
  FileText,
  CreditCard,
  Receipt,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Payment {
  id: string;
  periodo: string;
  monto: number;
  fechaVencimiento: string;
  fechaPago?: string;
  estado: string;
  metodoPago?: string;
  concepto?: string | null;
  referencia?: string | null;
  baseImponible?: number | null;
  iva?: number | null;
  irpf?: number | null;
  contract?: {
    id: string;
    rentaMensual: number;
    tenant?: { nombreCompleto: string; email?: string; telefono?: string };
    unit?: { numero: string; building?: { nombre: string; direccion: string } };
  };
}

export default function PagoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const id = params.id as string;

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (!id || !session) return;
    (async () => {
      try {
        const res = await fetch(`/api/payments/${id}`);
        if (res.ok) {
          const data = await res.json();
          setPayment({ ...data, monto: Number(data.monto || 0) });
        } else {
          toast.error('Pago no encontrado');
        }
      } catch {
        toast.error('Error al cargar el pago');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, session]);

  const estadoConfig: Record<string, { color: string; label: string }> = {
    pendiente: { color: 'bg-amber-500', label: 'Pendiente' },
    pagado: { color: 'bg-green-500', label: 'Pagado' },
    atrasado: { color: 'bg-red-500', label: 'Atrasado' },
    parcial: { color: 'bg-blue-500', label: 'Parcial' },
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const est = estadoConfig[payment?.estado || 'pendiente'] || estadoConfig.pendiente;

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/pagos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Pago #{id.substring(0, 8)}</h1>
            <p className="text-muted-foreground">{payment?.periodo}</p>
          </div>
          {payment && (
            <Badge className={`${est.color} text-white text-sm px-3 py-1`}>{est.label}</Badge>
          )}
        </div>

        {!payment ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Pago no encontrado
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Euro className="h-5 w-5" /> Importe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-green-600">
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
                    payment.monto
                  )}
                </p>
                {payment.metodoPago && (
                  <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                    <CreditCard className="h-4 w-4" /> {payment.metodoPago}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" /> Fechas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vencimiento</span>
                  <span>
                    {(() => {
                      try {
                        if (!payment.fechaVencimiento) return '-';
                        const d = new Date(payment.fechaVencimiento);
                        if (isNaN(d.getTime())) return '-';
                        return format(d, 'dd MMM yyyy', { locale: es });
                      } catch {
                        return '-';
                      }
                    })()}
                  </span>
                </div>
                {payment.fechaPago && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha pago</span>
                    <span className="text-green-600 font-medium">
                      {(() => {
                        try {
                          const d = new Date(payment.fechaPago);
                          if (isNaN(d.getTime())) return '—';
                          return format(d, 'dd MMM yyyy', { locale: es });
                        } catch {
                          return '—';
                        }
                      })()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Período</span>
                  <span>{payment.periodo}</span>
                </div>
              </CardContent>
            </Card>

            {(payment.baseImponible != null || payment.iva != null) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Receipt className="h-5 w-5" /> Desglose Fiscal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {payment.concepto && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Concepto</span>
                      <span className="text-sm">{payment.concepto}</span>
                    </div>
                  )}
                  {payment.referencia && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Referencia / Nº factura</span>
                      <span className="font-medium">{payment.referencia}</span>
                    </div>
                  )}
                  {payment.baseImponible != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base imponible</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('es-ES', {
                          style: 'currency',
                          currency: 'EUR',
                        }).format(payment.baseImponible)}
                      </span>
                    </div>
                  )}
                  {payment.iva != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IVA</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('es-ES', {
                          style: 'currency',
                          currency: 'EUR',
                        }).format(payment.iva)}
                      </span>
                    </div>
                  )}
                  {payment.irpf != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IRPF</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('es-ES', {
                          style: 'currency',
                          currency: 'EUR',
                        }).format(payment.irpf)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {payment.contract?.tenant && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" /> Inquilino
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-medium">{payment.contract.tenant.nombreCompleto}</p>
                  {payment.contract.tenant.email && (
                    <p className="text-sm text-muted-foreground">{payment.contract.tenant.email}</p>
                  )}
                  {payment.contract.tenant.telefono && (
                    <p className="text-sm text-muted-foreground">
                      {payment.contract.tenant.telefono}
                    </p>
                  )}
                  <Link href={`/contratos/${payment.contract.id}`}>
                    <Button variant="outline" size="sm" className="mt-2">
                      <FileText className="h-4 w-4 mr-1" /> Ver Contrato
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {payment.contract?.unit && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5" /> Inmueble
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unidad</span>
                    <span className="font-medium">{payment.contract.unit.numero}</span>
                  </div>
                  {payment.contract.unit.building && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Edificio</span>
                        <span>{payment.contract.unit.building.nombre}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {payment.contract.unit.building.direccion}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
