'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Download,
  Send,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  DollarSign,
  TrendingUp,
  Calendar,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from '@/components/ui/lazy-charts-extended';

interface Invoice {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  notes?: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default function ProfessionalInvoicingPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedTab, setSelectedTab] = useState('all');
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      loadInvoices();
    }
  }, [status]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/b2b-billing/invoices');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar facturas');
      }

      const data = (await response.json()) as {
        invoices: Array<{
          id: string;
          numeroFactura: string;
          fechaEmision: string;
          fechaVencimiento: string;
          total: number;
          estado: 'PENDIENTE' | 'PAGADA' | 'VENCIDA' | 'CANCELADA' | 'PARCIALMENTE_PAGADA';
          conceptos: Array<{
            descripcion: string;
            cantidad?: number;
            precioUnitario?: number;
            total?: number;
          }>;
          notas?: string | null;
          company: { id: string; nombre: string };
        }>;
      };

      const mapped = data.invoices.map((invoice) => {
        const statusMap: Record<string, Invoice['status']> = {
          PENDIENTE: 'sent',
          PAGADA: 'paid',
          VENCIDA: 'overdue',
          CANCELADA: 'cancelled',
          PARCIALMENTE_PAGADA: 'sent',
        };

        const items = (invoice.conceptos || []).map((item) => {
          const quantity = item.cantidad ?? 1;
          const unitPrice = item.precioUnitario ?? 0;
          const total = item.total ?? quantity * unitPrice;
          return {
            description: item.descripcion,
            quantity,
            unitPrice,
            total,
          };
        });

        return {
          id: invoice.id,
          number: invoice.numeroFactura,
          clientId: invoice.company.id,
          clientName: invoice.company.nombre,
          issueDate: invoice.fechaEmision,
          dueDate: invoice.fechaVencimiento,
          amount: invoice.total,
          status: statusMap[invoice.estado] || 'draft',
          items,
          notes: invoice.notas || undefined,
        } as Invoice;
      });

      setInvoices(mapped);
    } catch (error) {
      toast.error('Error al cargar facturas');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      draft: { color: 'bg-gray-500', label: 'Borrador', icon: FileText },
      sent: { color: 'bg-blue-500', label: 'Enviada', icon: Send },
      paid: { color: 'bg-green-500', label: 'Pagada', icon: CheckCircle },
      overdue: { color: 'bg-red-500', label: 'Vencida', icon: AlertTriangle },
      cancelled: { color: 'bg-gray-400', label: 'Cancelada', icon: Clock },
    };
    const { color, label, icon: Icon } = config[status as keyof typeof config] || config.draft;
    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleDownload = async (invoiceId: string) => {
    try {
      setDownloadingId(invoiceId);
      window.open(`/api/b2b-billing/invoices/${invoiceId}/pdf`, '_blank');
    } catch (error) {
      toast.error('Error al descargar factura');
    } finally {
      setTimeout(() => setDownloadingId(null), 500);
    }
  };

  const handleSendReminder = async (invoiceId: string) => {
    try {
      setSendingId(invoiceId);
      const response = await fetch('/api/b2b-billing/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-single-reminder', invoiceId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar recordatorio');
      }
      toast.success('Recordatorio enviado');
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar recordatorio');
    } finally {
      setSendingId(null);
    }
  };

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const pendingAmount = invoices.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + inv.amount, 0);
  const overdueAmount = invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0);

  const filteredInvoices = selectedTab === 'all' 
    ? invoices 
    : invoices.filter(inv => inv.status === selectedTab);

  const monthlyTotals = invoices.reduce<Record<string, number>>((acc, invoice) => {
    const date = new Date(invoice.issueDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    acc[key] = (acc[key] || 0) + invoice.amount;
    return acc;
  }, {});

  const monthlyData = Array.from({ length: 6 }).map((_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString('es-ES', { month: 'short' });
    return {
      month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
      amount: monthlyTotals[key] || 0,
    };
  });

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Cargando facturas...</p>
            </div>
          </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">Facturación Automatizada</h1>
                <p className="text-muted-foreground mt-2">
                  Gestión completa de facturación y cobros
                </p>
              </div>
              <Button onClick={() => router.push('/professional/invoicing/nueva')}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Factura
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Facturado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Este mes</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Cobrado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(paidAmount)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0}% del total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Pendiente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(pendingAmount)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Por cobrar</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Vencido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(overdueAmount)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Requiere atención</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Evolución Facturación</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => formatCurrency(value)} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#10B981"
                        strokeWidth={2}
                        name="Facturación (€)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estado de Facturas</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={[
                        { status: 'Pagadas', count: invoices.filter(i => i.status === 'paid').length },
                        { status: 'Enviadas', count: invoices.filter(i => i.status === 'sent').length },
                        { status: 'Vencidas', count: invoices.filter(i => i.status === 'overdue').length },
                        { status: 'Borrador', count: invoices.filter(i => i.status === 'draft').length },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#4F46E5" name="Cantidad" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Invoices Tabs */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">Todas ({invoices.length})</TabsTrigger>
                <TabsTrigger value="draft">Borrador ({invoices.filter(i => i.status === 'draft').length})</TabsTrigger>
                <TabsTrigger value="sent">Enviadas ({invoices.filter(i => i.status === 'sent').length})</TabsTrigger>
                <TabsTrigger value="paid">Pagadas ({invoices.filter(i => i.status === 'paid').length})</TabsTrigger>
                <TabsTrigger value="overdue">Vencidas ({invoices.filter(i => i.status === 'overdue').length})</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedTab}>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {filteredInvoices.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold">{invoice.number}</h4>
                              {getStatusBadge(invoice.status)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              Cliente: <span className="font-medium">{invoice.clientName}</span>
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Emitida: {formatDate(invoice.issueDate)}</span>
                              <span>Vencimiento: {formatDate(invoice.dueDate)}</span>
                            </div>
                            {invoice.notes && (
                              <p className="text-xs text-red-600 mt-2">{invoice.notes}</p>
                            )}
                          </div>
                          <div className="text-right mr-6">
                            <p className="text-2xl font-bold">{formatCurrency(invoice.amount)}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {invoice.items.length} {invoice.items.length === 1 ? 'concepto' : 'conceptos'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(invoice.id)}
                              disabled={downloadingId === invoice.id}
                            >
                              {downloadingId === invoice.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                            {invoice.status === 'draft' && (
                              <Button size="sm" onClick={() => handleSendReminder(invoice.id)} disabled={sendingId === invoice.id}>
                                {sendingId === invoice.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                  <Send className="h-4 w-4 mr-1" />
                                )}
                                Enviar
                              </Button>
                            )}
                            {invoice.status === 'overdue' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleSendReminder(invoice.id)}
                                disabled={sendingId === invoice.id}
                              >
                                {sendingId === invoice.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 mr-1" />
                                )}
                                Reclamar
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}

                      {filteredInvoices.length === 0 && (
                        <div className="text-center py-12">
                          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No hay facturas</h3>
                          <p className="text-muted-foreground">
                            {selectedTab === 'all' ? 'Crea tu primera factura' : `No hay facturas en estado "${selectedTab}"`}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </AuthenticatedLayout>
  );
}
