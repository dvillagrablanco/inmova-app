'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, FileText, Send, Download } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface Invoice {
  id: string;
  numeroFactura: string;
  workOrderId: string;
  estado: string;
  conceptos: any[];
  subtotal: number;
  iva: number;
  total: number;
  fechaEmision: string;
  fechaEnvio?: string;
  fechaVencimiento?: string;
  notas?: string;
  workOrder: {
    id: string;
    titulo: string;
    descripcion: string;
    building: {
      id: string;
      nombre: string;
      direccion: string;
    };
  };
  payments: any[];
  provider: {
    id: string;
    nombreEmpresa: string;
    nombreContacto: string;
    email: string;
    telefono: string;
    cif: string;
  };
}

const estadoBadgeColor: { [key: string]: string } = {
  borrador: 'bg-gray-500',
  enviada: 'bg-blue-500',
  pagada: 'bg-green-500',
  cancelada: 'bg-red-500',
};

const estadoLabel: { [key: string]: string } = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  pagada: 'Pagada',
  cancelada: 'Cancelada',
};

export default function DetalleFacturaPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params?.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/portal-proveedor/invoices/${invoiceId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al cargar factura');
      }

      const data = await response.json();
      setInvoice(data);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Error al cargar la factura');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!invoice) return;

    setSending(true);
    try {
      const response = await fetch(`/api/portal-proveedor/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ estado: 'enviada' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al enviar factura');
      }

      toast.success('Factura enviada correctamente');
      fetchInvoice();
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error(
        error instanceof Error ? error.message : 'Error al enviar la factura'
      );
    } finally {
      setSending(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const calculateTotalPagado = () => {
    if (!invoice?.payments) return 0;
    return invoice.payments.reduce((sum, payment) => sum + payment.monto, 0);
  };

  const calculatePendiente = () => {
    if (!invoice) return 0;
    return invoice.total - calculateTotalPagado();
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-8">
          <p className="text-gray-500">Cargando factura...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-8">
          <p className="text-gray-500">Factura no encontrada</p>
          <Button
            onClick={() => router.push('/portal-proveedor/facturas')}
            variant="outline"
            className="mt-4"
          >
            Volver a facturas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/portal-proveedor/facturas')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Factura {invoice.numeroFactura}
            </h1>
            <p className="text-gray-600">Detalles y seguimiento de la factura</p>
          </div>
        </div>
        <div className="flex gap-2">
          {invoice.estado === 'borrador' && (
            <Button onClick={handleSend} disabled={sending} className="gap-2">
              <Send className="h-4 w-4" />
              {sending ? 'Enviando...' : 'Enviar Factura'}
            </Button>
          )}
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Descargar PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contenido principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información general */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Información de la Factura</CardTitle>
                </div>
                <Badge
                  className={`${estadoBadgeColor[invoice.estado] || 'bg-gray-500'}`}
                >
                  {estadoLabel[invoice.estado] || invoice.estado}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Número de Factura</p>
                  <p className="font-medium">{invoice.numeroFactura}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de Emisión</p>
                  <p className="font-medium">
                    {format(
                      new Date(invoice.fechaEmision),
                      'dd MMMM yyyy',
                      { locale: es }
                    )}
                  </p>
                </div>
                {invoice.fechaEnvio && (
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Envío</p>
                    <p className="font-medium">
                      {format(
                        new Date(invoice.fechaEnvio),
                        'dd MMMM yyyy',
                        { locale: es }
                      )}
                    </p>
                  </div>
                )}
                {invoice.fechaVencimiento && (
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Vencimiento</p>
                    <p className="font-medium">
                      {format(
                        new Date(invoice.fechaVencimiento),
                        'dd MMMM yyyy',
                        { locale: es }
                      )}
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-sm text-gray-600 mb-2">Orden de Trabajo</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{invoice.workOrder.titulo}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {invoice.workOrder.building.nombre}
                  </p>
                  <p className="text-sm text-gray-500">
                    {invoice.workOrder.building.direccion}
                  </p>
                </div>
              </div>

              {invoice.notas && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Notas</p>
                  <p className="text-sm bg-gray-50 p-4 rounded-lg">
                    {invoice.notas}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conceptos */}
          <Card>
            <CardHeader>
              <CardTitle>Conceptos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoice.conceptos.map((concepto: any, index: number) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-lg space-y-2"
                  >
                    <p className="font-medium">{concepto.descripcion}</p>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>
                        {concepto.cantidad} x {formatCurrency(concepto.precioUnitario)}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(concepto.cantidad * concepto.precioUnitario)}
                      </span>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">
                      {formatCurrency(invoice.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">IVA (21%):</span>
                    <span className="font-medium">
                      {formatCurrency(invoice.iva)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span>{formatCurrency(invoice.total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Historial de pagos */}
          {invoice.payments && invoice.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Historial de Pagos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoice.payments.map((payment: any) => (
                    <div
                      key={payment.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {formatCurrency(payment.monto)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {format(
                            new Date(payment.fechaPago),
                            'dd MMMM yyyy',
                            { locale: es }
                          )}
                        </p>
                      </div>
                      <Badge className="bg-green-500">
                        {payment.metodoPago || 'Pagado'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Resumen de pago */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Facturado:</span>
                  <span className="font-medium">
                    {formatCurrency(invoice.total)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Pagado:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(calculateTotalPagado())}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Pendiente:</span>
                  <span
                    className={
                      calculatePendiente() > 0
                        ? 'text-orange-600'
                        : 'text-green-600'
                    }
                  >
                    {formatCurrency(calculatePendiente())}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datos del proveedor */}
          <Card>
            <CardHeader>
              <CardTitle>Datos del Proveedor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Empresa</p>
                <p className="font-medium">{invoice.provider.nombreEmpresa}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Contacto</p>
                <p className="font-medium">{invoice.provider.nombreContacto}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">CIF</p>
                <p className="font-medium">{invoice.provider.cif}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-sm">{invoice.provider.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Teléfono</p>
                <p className="font-medium">{invoice.provider.telefono}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
