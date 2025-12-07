/**
 * Página de Detalle de Factura B2B
 * Muestra información completa de una factura y permite registrar pagos
 */

'use client';

import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Building,
  Calendar,
  FileText,
  DollarSign,
  Download,
  CheckCircle,
  CreditCard,
  AlertCircle,
  Clock,
  XCircle,
  Edit,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger, { logError } from '@/lib/logger';

interface InvoiceItem {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

interface Payment {
  id: string;
  monto: number;
  metodoPago: string;
  fechaPago: string;
  referencia?: string;
  estado: string;
}

interface Invoice {
  id: string;
  numeroFactura: string;
  fechaEmision: string;
  fechaVencimiento: string;
  periodo: string;
  subtotal: number;
  descuento: number;
  impuestos: number;
  total: number;
  estado: string;
  metodoPago?: string;
  fechaPago?: string;
  notas?: string;
  terminosPago?: string;
  conceptos: InvoiceItem[];
  company: {
    id: string;
    nombre: string;
    email: string;
    cif?: string;
    direccion?: string;
    ciudad?: string;
    codigoPostal?: string;
  };
  subscriptionPlan?: {
    nombre: string;
    tier: string;
  };
  payments: Payment[];
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession() || {};
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentData, setPaymentData] = useState({
    monto: '',
    metodoPago: 'transferencia',
    referencia: '',
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [editData, setEditData] = useState({
    notas: '',
    terminosPago: '',
    fechaVencimiento: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (params?.id) {
      loadInvoice();
    }
  }, [params?.id]);

  const loadInvoice = async () => {
    if (!params?.id) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/b2b-billing/invoices/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setInvoice(data);
        setPaymentData(prev => ({ ...prev, monto: data.total.toString() }));
        setEditData({
          notas: data.notas || '',
          terminosPago: data.terminosPago || '',
          fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento).toISOString().split('T')[0] : '',
        });
      } else {
        toast.error('Error al cargar la factura');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al cargar la factura');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPayment = async () => {
    if (!invoice) return;

    try {
      setIsProcessingPayment(true);
      const res = await fetch('/api/b2b-billing/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          monto: parseFloat(paymentData.monto),
          metodoPago: paymentData.metodoPago,
          referencia: paymentData.referencia || undefined,
        }),
      });

      if (res.ok) {
        toast.success('Pago registrado correctamente');
        setShowPaymentDialog(false);
        loadInvoice();
      } else {
        toast.error('Error al registrar el pago');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al registrar el pago');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;

    try {
      const res = await fetch(`/api/b2b-billing/invoices/${invoice.id}/pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Factura_${invoice.numeroFactura.replace(/\//g, '-')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('PDF descargado correctamente');
      } else {
        toast.error('Error al descargar el PDF');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al descargar el PDF');
    }
  };

  const handleUpdateInvoice = async () => {
    if (!invoice) return;

    try {
      setIsUpdating(true);
      const res = await fetch(`/api/b2b-billing/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notas: editData.notas || undefined,
          terminosPago: editData.terminosPago || undefined,
          fechaVencimiento: editData.fechaVencimiento || undefined,
        }),
      });

      if (res.ok) {
        toast.success('Factura actualizada correctamente');
        setShowEditDialog(false);
        loadInvoice();
      } else {
        toast.error('Error al actualizar la factura');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al actualizar la factura');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelInvoice = async () => {
    if (!invoice) return;

    try {
      setIsCancelling(true);
      const res = await fetch(`/api/b2b-billing/invoices/${invoice.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Factura cancelada correctamente');
        setShowCancelDialog(false);
        loadInvoice();
      } else {
        toast.error('Error al cancelar la factura');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al cancelar la factura');
    } finally {
      setIsCancelling(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { color: string; icon: any }> = {
      PENDIENTE: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
      PAGADA: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
      VENCIDA: { color: 'bg-red-100 text-red-800 border-red-300', icon: AlertCircle },
      CANCELADA: { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: XCircle },
      PARCIALMENTE_PAGADA: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Clock },
    };

    const badge = badges[estado] || { color: 'bg-gray-100 text-gray-800', icon: FileText };
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium border ${badge.color}`}>
        <Icon className="w-4 h-4" />
        {estado.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando factura...</p>
          </div>
        </div>
      </div>
        </main>
      </div>
    </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Factura no encontrada</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.back()}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Factura {invoice.numeroFactura}</h1>
            <p className="text-muted-foreground">Detalle completo de la factura</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="w-4 h-4 mr-2" />
            Descargar PDF
          </Button>
          {invoice.estado !== 'CANCELADA' && invoice.estado !== 'PAGADA' && (
            <>
              <Button variant="outline" onClick={() => setShowEditDialog(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button variant="outline" onClick={() => setShowCancelDialog(true)} className="text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </>
          )}
          {(invoice.estado === 'PENDIENTE' || invoice.estado === 'PARCIALMENTE_PAGADA' || invoice.estado === 'VENCIDA') && (
            <Button onClick={() => setShowPaymentDialog(true)}>
              <DollarSign className="w-4 h-4 mr-2" />
              Registrar Pago
            </Button>
          )}
        </div>
      </div>

      {/* Estado y Datos Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getEstadoBadge(invoice.estado)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fecha de Emisión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">
                {format(new Date(invoice.fechaEmision), 'dd/MM/yyyy', { locale: es })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Fecha de Vencimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">
                {format(new Date(invoice.fechaVencimiento), 'dd/MM/yyyy', { locale: es })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{invoice.total.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información del Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Información del Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Empresa</p>
              <p className="font-medium">{invoice.company.nombre}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{invoice.company.email}</p>
            </div>
            {invoice.company.cif && (
              <div>
                <p className="text-sm text-muted-foreground">CIF</p>
                <p className="font-medium">{invoice.company.cif}</p>
              </div>
            )}
            {invoice.company.direccion && (
              <div>
                <p className="text-sm text-muted-foreground">Dirección</p>
                <p className="font-medium">
                  {invoice.company.direccion}
                  {invoice.company.ciudad && `, ${invoice.company.ciudad}`}
                  {invoice.company.codigoPostal && ` ${invoice.company.codigoPostal}`}
                </p>
              </div>
            )}
          </div>
          {invoice.subscriptionPlan && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Plan de Suscripción</p>
              <Badge variant="outline" className="mt-1">
                {invoice.subscriptionPlan.nombre} ({invoice.subscriptionPlan.tier})
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conceptos de Factura */}
      <Card>
        <CardHeader>
          <CardTitle>Conceptos</CardTitle>
          <CardDescription>Detalle de los servicios facturados</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-center">Cantidad</TableHead>
                <TableHead className="text-right">Precio Unitario</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.conceptos.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.descripcion}</TableCell>
                  <TableCell className="text-center">{item.cantidad}</TableCell>
                  <TableCell className="text-right">
                    €{item.precioUnitario.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    €{item.total.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="text-right font-medium">
                  Subtotal
                </TableCell>
                <TableCell className="text-right">
                  €{invoice.subtotal.toFixed(2)}
                </TableCell>
              </TableRow>
              {invoice.descuento > 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium">
                    Descuento
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    -€{invoice.descuento.toFixed(2)}
                  </TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell colSpan={3} className="text-right font-medium">
                  IVA (21%)
                </TableCell>
                <TableCell className="text-right">
                  €{invoice.impuestos.toFixed(2)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="text-right text-lg font-bold">
                  Total
                </TableCell>
                <TableCell className="text-right text-lg font-bold">
                  €{invoice.total.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>

          {invoice.notas && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Notas</p>
              <p className="text-sm text-muted-foreground">{invoice.notas}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de Pagos */}
      {invoice.payments && invoice.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Historial de Pagos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Método de Pago</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {format(new Date(payment.fechaPago), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </TableCell>
                    <TableCell className="capitalize">{payment.metodoPago}</TableCell>
                    <TableCell>{payment.referencia || '-'}</TableCell>
                    <TableCell className="text-right font-medium">
                      €{payment.monto.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        {payment.estado}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Diálogo de Registro de Pago */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              Registra el pago recibido para la factura {invoice.numeroFactura}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="monto">Monto</Label>
              <Input
                id="monto"
                type="number"
                step="0.01"
                value={paymentData.monto}
                onChange={(e) => setPaymentData({ ...paymentData, monto: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metodoPago">Método de Pago</Label>
              <Select
                value={paymentData.metodoPago}
                onValueChange={(value) => setPaymentData({ ...paymentData, metodoPago: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta de Crédito</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="referencia">Referencia (Opcional)</Label>
              <Input
                id="referencia"
                value={paymentData.referencia}
                onChange={(e) => setPaymentData({ ...paymentData, referencia: e.target.value })}
                placeholder="Número de transacción, comprobante, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
              disabled={isProcessingPayment}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRegisterPayment}
              disabled={isProcessingPayment || !paymentData.monto}
            >
              {isProcessingPayment ? 'Procesando...' : 'Registrar Pago'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Edición */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Factura</DialogTitle>
            <DialogDescription>
              Actualiza los detalles de la factura {invoice.numeroFactura}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fechaVencimiento">Fecha de Vencimiento</Label>
              <Input
                id="fechaVencimiento"
                type="date"
                value={editData.fechaVencimiento}
                onChange={(e) => setEditData({ ...editData, fechaVencimiento: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="terminosPago">Términos de Pago</Label>
              <Textarea
                id="terminosPago"
                value={editData.terminosPago}
                onChange={(e) => setEditData({ ...editData, terminosPago: e.target.value })}
                placeholder="Ej: Pago a 30 días desde la fecha de emisión"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                value={editData.notas}
                onChange={(e) => setEditData({ ...editData, notas: e.target.value })}
                placeholder="Notas adicionales sobre la factura"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateInvoice}
              disabled={isUpdating}
            >
              {isUpdating ? 'Actualizando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Cancelación */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Factura</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas cancelar la factura {invoice.numeroFactura}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-semibold mb-1">Advertencia</p>
                  <p>Al cancelar esta factura, se marcará como cancelada y no podrá ser reactivada. Los registros de pago asociados se mantendrán para fines de auditoría.</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={isCancelling}
            >
              No, mantener factura
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelInvoice}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelando...' : 'Sí, cancelar factura'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
        </main>
      </div>
    </div>
  );
}