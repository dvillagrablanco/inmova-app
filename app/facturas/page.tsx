'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ExportCSVButton } from '@/components/ui/export-csv-button';
import { FileText, Printer, Loader2, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Payment {
  id: string;
  monto: number;
  estado: string;
  fechaPago: string | null;
  fechaVencimiento: string;
  periodo?: string;
  contract: {
    tenant: { nombreCompleto: string };
    unit: { numero: string; building: { nombre: string } };
  };
}

interface Invoice {
  id: string;
  numero: string;
  fecha: string;
  emisor: { nombre: string; cif: string; direccion: string };
  receptor: { nombre: string; nif: string; direccion: string };
  conceptos: Array<{
    descripcion: string;
    baseImponible: number;
    tipoIva: number;
    cuotaIva: number;
    tipoIrpf: number;
    cuotaIrpf: number;
    total: number;
  }>;
  subtotal: number;
  totalIva: number;
  totalIrpf: number;
  total: number;
}

export default function FacturasPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [invoiceDialog, setInvoiceDialog] = useState<Invoice | null>(null);
  const [invoiceNumbers, setInvoiceNumbers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [paymentsRes, invoicesRes] = await Promise.all([
          fetch('/api/payments?limit=200&estado=pagado'),
          fetch('/api/invoices/list'),
        ]);
        if (paymentsRes.ok) {
          const json = await paymentsRes.json();
          const data = Array.isArray(json) ? json : json.data || [];
          setPayments(data);
        }
        if (invoicesRes.ok) {
          const invoices = await invoicesRes.json();
          setInvoiceNumbers(invoices);
        }
      } catch (err) {
        toast.error('Error al cargar datos');
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  const handleGenerateInvoice = async (paymentId: string) => {
    setGeneratingId(paymentId);
    try {
      const res = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data.invoice) {
          setInvoiceNumbers((prev) => ({ ...prev, [paymentId]: data.invoice.numero }));
          setInvoiceDialog(data.invoice);
          toast.info(`Factura ya generada: ${data.invoice.numero}`);
        } else if (res.status === 409) {
          setInvoiceNumbers((prev) => ({ ...prev, [paymentId]: data.invoiceNumber }));
          toast.info(`Factura ya generada: ${data.invoiceNumber}`);
        } else {
          toast.error(data.error || 'Error al generar factura');
        }
        return;
      }

      setInvoiceNumbers((prev) => ({ ...prev, [paymentId]: data.numero }));
      setInvoiceDialog(data);
      toast.success(`Factura ${data.numero} generada`);
    } catch {
      toast.error('Error de conexión');
    } finally {
      setGeneratingId(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const pagados = payments.filter((p) => p.estado?.toLowerCase() === 'pagado');
  const totalFacturado = pagados.reduce((acc, p) => acc + Number(p.monto || 0), 0);
  const facturasGeneradas = Object.keys(invoiceNumbers).length;
  const pendientesCount = pagados.length - facturasGeneradas;

  const tableData = payments.map((p) => ({
    fechaPago: p.fechaPago ? format(new Date(p.fechaPago), 'dd MMM yyyy', { locale: es }) : '-',
    inquilino: p.contract?.tenant?.nombreCompleto || '-',
    unidad: p.contract?.unit ? `${p.contract.unit.building?.nombre} - ${p.contract.unit.numero}` : '-',
    importe: Number(p.monto || 0),
    numeroFactura: invoiceNumbers[p.id] || '-',
  }));

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!session) return null;

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Facturas</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Facturas</h1>
          <p className="text-sm text-muted-foreground">
            Genera facturas a partir de los pagos cobrados
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Facturado</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                €{totalFacturado.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Pagos cobrados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Facturas Generadas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{facturasGeneradas}</div>
              <p className="text-xs text-muted-foreground">Con número de factura</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes de Facturar</CardTitle>
              <FileText className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{pendientesCount}</div>
              <p className="text-xs text-muted-foreground">Sin factura generada</p>
            </CardContent>
          </Card>
        </div>

        {payments.length > 0 && (
          <div className="flex justify-end">
            <ExportCSVButton
              data={tableData}
              filename="facturas"
              columns={[
                { key: 'fechaPago', label: 'Fecha Pago' },
                { key: 'inquilino', label: 'Inquilino' },
                { key: 'unidad', label: 'Unidad' },
                { key: 'importe', label: 'Importe' },
                { key: 'numeroFactura', label: 'Nº Factura' },
              ]}
            />
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Pagos cobrados</CardTitle>
            <p className="text-sm text-muted-foreground">
              Haz clic en Generar Factura para crear la factura del pago
            </p>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No hay pagos cobrados para facturar
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha Pago</TableHead>
                    <TableHead>Inquilino</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                    <TableHead>Nº Factura</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        {p.fechaPago
                          ? format(new Date(p.fechaPago), 'dd MMM yyyy', { locale: es })
                          : '-'}
                      </TableCell>
                      <TableCell>{p.contract?.tenant?.nombreCompleto || '-'}</TableCell>
                      <TableCell>
                        {p.contract?.unit
                          ? `${p.contract.unit.building?.nombre} - ${p.contract.unit.numero}`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        €{Number(p.monto || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>{invoiceNumbers[p.id] || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={invoiceNumbers[p.id] ? 'outline' : 'default'}
                          disabled={!!generatingId}
                          onClick={() => handleGenerateInvoice(p.id)}
                        >
                          {generatingId === p.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : null}
                          {invoiceNumbers[p.id] ? 'Ver factura' : 'Generar Factura'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!invoiceDialog} onOpenChange={() => setInvoiceDialog(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto print:block">
            <DialogHeader>
              <DialogTitle>Factura {invoiceDialog?.numero}</DialogTitle>
            </DialogHeader>
            {invoiceDialog && (
              <div className="space-y-6 print:p-4" id="invoice-print">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground">Emisor</h3>
                    <p className="font-medium">{invoiceDialog.emisor.nombre}</p>
                    {invoiceDialog.emisor.cif && <p className="text-sm">CIF: {invoiceDialog.emisor.cif}</p>}
                    {invoiceDialog.emisor.direccion && (
                      <p className="text-sm text-muted-foreground">{invoiceDialog.emisor.direccion}</p>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground">Receptor</h3>
                    <p className="font-medium">{invoiceDialog.receptor.nombre}</p>
                    <p className="text-sm">NIF: {invoiceDialog.receptor.nif}</p>
                    {invoiceDialog.receptor.direccion && (
                      <p className="text-sm text-muted-foreground">{invoiceDialog.receptor.direccion}</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Fecha: {invoiceDialog.fecha} | Factura: {invoiceDialog.numero}
                  </p>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead className="text-right">Base</TableHead>
                      <TableHead className="text-right">IVA</TableHead>
                      <TableHead className="text-right">IRPF</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceDialog.conceptos.map((c, i) => (
                      <TableRow key={i}>
                        <TableCell>{c.descripcion}</TableCell>
                        <TableCell className="text-right">€{c.baseImponible.toFixed(2)}</TableCell>
                        <TableCell className="text-right">€{c.cuotaIva.toFixed(2)}</TableCell>
                        <TableCell className="text-right">-€{c.cuotaIrpf.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">€{c.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="text-right space-y-1 border-t pt-4">
                  <p>Subtotal: €{invoiceDialog.subtotal.toFixed(2)}</p>
                  {invoiceDialog.totalIva > 0 && (
                    <p>IVA: €{invoiceDialog.totalIva.toFixed(2)}</p>
                  )}
                  {invoiceDialog.totalIrpf > 0 && (
                    <p>Retención IRPF: -€{invoiceDialog.totalIrpf.toFixed(2)}</p>
                  )}
                  <p className="text-xl font-bold">Total: €{invoiceDialog.total.toFixed(2)}</p>
                </div>
              </div>
            )}
            <DialogFooter className="print:hidden">
              <Button variant="outline" onClick={() => setInvoiceDialog(null)}>
                Cerrar
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
