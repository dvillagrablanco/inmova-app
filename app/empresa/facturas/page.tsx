'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  Download,
  ExternalLink,
  CreditCard,
  Calendar,
  Euro,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Receipt,
} from 'lucide-react';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  number: string | null;
  date: string | null;
  dueDate: string | null;
  amount: number;
  amountPaid: number;
  currency: string;
  status: string;
  paid: boolean;
  description: string | null;
  invoiceUrl: string | null;
  pdfUrl: string | null;
  lines: Array<{
    description: string;
    amount: number;
    quantity: number;
  }>;
}

export default function FacturasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar permisos
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    const userRole = (session.user as any)?.role;
    const allowedRoles = ['administrador', 'super_admin', 'propietario'];
    
    if (!allowedRoles.includes(userRole)) {
      toast.error('No tienes permisos para acceder a esta página');
      router.push('/dashboard');
      return;
    }

    loadInvoices();
  }, [session, status, router]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/empresa/facturas');
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cargar facturas');
      }

      const data = await response.json();
      setInvoices(data.invoices || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error cargando facturas:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, paid: boolean) => {
    if (paid) {
      return (
        <Badge className="bg-green-100 text-green-700">
          <CheckCircle className="w-3 h-3 mr-1" />
          Pagada
        </Badge>
      );
    }

    switch (status) {
      case 'open':
        return (
          <Badge className="bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'draft':
        return (
          <Badge className="bg-gray-100 text-gray-700">
            <FileText className="w-3 h-3 mr-1" />
            Borrador
          </Badge>
        );
      case 'uncollectible':
        return (
          <Badge className="bg-red-100 text-red-700">
            <AlertCircle className="w-3 h-3 mr-1" />
            Impagada
          </Badge>
        );
      case 'void':
        return (
          <Badge className="bg-gray-100 text-gray-500">
            Anulada
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">{status}</Badge>
        );
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Calcular totales
  const totalPaid = invoices
    .filter(inv => inv.paid)
    .reduce((sum, inv) => sum + inv.amountPaid, 0);
  
  const totalPending = invoices
    .filter(inv => !inv.paid && inv.status === 'open')
    .reduce((sum, inv) => sum + inv.amount, 0);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Cargando facturas...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/empresa/configuracion">Empresa</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Facturas</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Receipt className="w-8 h-8 text-primary" />
            Facturas
          </h1>
          <p className="text-muted-foreground mt-1">
            Historial de facturación de tu suscripción y add-ons
          </p>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Facturado</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendiente de Pago</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Facturas</p>
                <p className="text-2xl font-bold">{invoices.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de facturas */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Facturas</CardTitle>
          <CardDescription>
            Todas las facturas generadas automáticamente por Stripe
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-500">{error}</p>
              <Button onClick={loadInvoices} className="mt-4" variant="outline">
                Reintentar
              </Button>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay facturas todavía</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Las facturas se generarán automáticamente cuando contrates un plan o add-ons.
                Recibirás una copia por email cada mes.
              </p>
              <Button onClick={() => router.push('/empresa/modulos')} className="mt-4">
                Ver Módulos
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Factura</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Importe</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.number || invoice.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(invoice.date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {invoice.description || invoice.lines[0]?.description || 'Suscripción INMOVA'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-semibold">
                        <Euro className="w-4 h-4" />
                        {invoice.amount.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invoice.status, invoice.paid)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {invoice.invoiceUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(invoice.invoiceUrl!, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                        {invoice.pdfUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(invoice.pdfUrl!, '_blank')}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Facturación Automática</h3>
              <p className="text-sm text-muted-foreground">
                Todas las facturas se generan y cobran automáticamente a través de Stripe.
                Recibirás una copia por email cada mes con el detalle de tu suscripción y add-ons activos.
                Si tienes dudas sobre alguna factura, contacta con{' '}
                <a href="mailto:facturacion@inmovaapp.com" className="text-primary hover:underline">
                  facturacion@inmovaapp.com
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
