'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  ArrowLeft,
  FileText,
  Download,
  Send,
  XCircle,
  FileEdit,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { FacturaItem } from '@/lib/facturacion-homming-store';

function safeFmtDate(iso: string | Date | null | undefined, fmt: string): string {
  try {
    if (!iso) return '—';
    const d = iso instanceof Date ? iso : new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return format(d, fmt, { locale: es });
  } catch {
    return '—';
  }
}

const ESTADO_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  emitida: 'Emitida',
  pagada: 'Pagada',
  anulada: 'Anulada',
  rectificada: 'Rectificada',
};

const TIPO_LABELS: Record<string, string> = {
  factura: 'Factura',
  proforma: 'Proforma',
  rectificativa: 'Rectificativa',
};

export default function FacturaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const id = params?.id as string;

  const [factura, setFactura] = useState<FacturaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (session?.user && id) loadFactura();
  }, [session, id]);

  const loadFactura = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/facturacion/${id}`);
      if (res.ok) {
        const json = await res.json().catch(() => null);
        setFactura(json?.data || null);
      } else if (res.status === 404) {
        toast.error('Factura no encontrada');
        router.push('/facturacion');
      } else {
        toast.error('Error al cargar factura');
      }
    } catch {
      toast.error('Error al cargar factura');
    } finally {
      setLoading(false);
    }
  };

  const handleEmitir = async () => {
    if (!factura) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/facturacion/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'emitida' }),
      });
      if (res.ok) {
        toast.success('Factura emitida');
        loadFactura();
      } else {
        toast.error('Error al emitir');
      }
    } catch {
      toast.error('Error al emitir');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAnular = async () => {
    if (!factura) return;
    if (!confirm('¿Anular esta factura? Esta acción no se puede deshacer.')) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/facturacion/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'anulada' }),
      });
      if (res.ok) {
        toast.success('Factura anulada');
        loadFactura();
      } else {
        toast.error('Error al anular');
      }
    } catch {
      toast.error('Error al anular');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDescargarPDF = () => {
    toast.info('Descarga PDF en desarrollo');
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-3xl mx-auto flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando factura...</p>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!factura) {
    return null;
  }

  const estadoVariant =
    factura.estado === 'pagada'
      ? 'default'
      : factura.estado === 'anulada'
        ? 'destructive'
        : factura.estado === 'emitida'
          ? 'secondary'
          : 'outline';

  return (
    <AuthenticatedLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/facturacion')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Factura {factura.numeroFactura}</h1>
              <p className="text-muted-foreground">
                {TIPO_LABELS[factura.tipo] || factura.tipo} · {safeFmtDate(factura.fecha, 'dd MMM yyyy')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={estadoVariant}>{ESTADO_LABELS[factura.estado] || factura.estado}</Badge>
            {factura.estado === 'borrador' && (
              <Button size="sm" onClick={handleEmitir} disabled={actionLoading}>
                <Send className="w-4 h-4 mr-1" />
                Emitir
              </Button>
            )}
            {['borrador', 'emitida'].includes(factura.estado) && (
              <Button size="sm" variant="outline" onClick={handleAnular} disabled={actionLoading}>
                <XCircle className="w-4 h-4 mr-1" />
                Anular
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleDescargarPDF}>
              <Download className="w-4 h-4 mr-1" />
              Descargar PDF
            </Button>
          </div>
        </div>

        {/* Factura estilo español */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {factura.numeroFactura}
                </CardTitle>
                <CardDescription>
                  Fecha: {safeFmtDate(factura.fecha, 'dd/MM/yyyy')} ·{' '}
                  Fecha contable: {safeFmtDate(factura.fechaContable, 'dd/MM/yyyy')}
                </CardDescription>
              </div>
              <Badge variant="outline">{TIPO_LABELS[factura.tipo]}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Destinatario */}
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-semibold">{factura.destinatario.nombre}</p>
                {factura.destinatario.nif && (
                  <p className="text-sm text-muted-foreground">NIF/CIF: {factura.destinatario.nif}</p>
                )}
                {factura.inmueble && (
                  <p className="text-sm text-muted-foreground mt-1">{factura.inmueble}</p>
                )}
              </div>
            </div>

            {/* Líneas */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left p-3 font-medium">Concepto</th>
                    <th className="text-right p-3 font-medium">Base</th>
                    <th className="text-right p-3 font-medium">IVA</th>
                    <th className="text-right p-3 font-medium">IRPF</th>
                    <th className="text-right p-3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-3">{factura.concepto}</td>
                    <td className="p-3 text-right">€{factura.baseImponible.toFixed(2)}</td>
                    <td className="p-3 text-right">€{((factura.baseImponible * factura.iva) / 100).toFixed(2)}</td>
                    <td className="p-3 text-right">
                      {factura.irpf > 0 ? `-€${((factura.baseImponible * factura.irpf) / 100).toFixed(2)}` : '-'}
                    </td>
                    <td className="p-3 text-right font-semibold">€{factura.total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Desglose */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Base imponible:</span>
                  <span>€{factura.baseImponible.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA ({factura.iva}%):</span>
                  <span>€{((factura.baseImponible * factura.iva) / 100).toFixed(2)}</span>
                </div>
                {factura.irpf > 0 && (
                  <div className="flex justify-between">
                    <span>IRPF ({factura.irpf}%):</span>
                    <span>-€{((factura.baseImponible * factura.irpf) / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t pt-2 text-base">
                  <span>Total:</span>
                  <span>€{factura.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {factura.notas && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  <strong>Notas:</strong> {factura.notas}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rectificar */}
        {factura.estado === 'emitida' && factura.tipo === 'factura' && (
          <Card>
            <CardContent className="pt-6">
              <Button variant="outline" disabled>
                <FileEdit className="w-4 h-4 mr-2" />
                Nueva rectificativa (próximamente)
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
