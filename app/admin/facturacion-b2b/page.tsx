/**
 * Dashboard de Facturación B2B para Super Admin
 * Gestión completa de facturas de INMOVA a empresas clientes
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Download,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Building,
  CreditCard,
  Pencil,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger, { logError } from '@/lib/logger';

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
  company: {
    id: string;
    nombre: string;
    email: string;
  };
  subscriptionPlan?: {
    id: string;
    nombre: string;
    tier: string;
  };
}

interface BillingStats {
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  monthlyRevenue: number;
  pendingAmount: number;
}

export default function B2BBillingDashboard() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedEstado, setSelectedEstado] = useState<string>('all');
  const [isGeneratingMonthly, setIsGeneratingMonthly] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editForm, setEditForm] = useState({
    notas: '',
    terminosPago: '',
    fechaVencimiento: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Estado para crear nueva factura
  const [companies, setCompanies] = useState<{ id: string; nombre: string; email: string }[]>([]);
  const [createForm, setCreateForm] = useState({
    companyId: '',
    concepto: '',
    subtotal: '',
    descuento: '0',
    impuestos: '21',
    notas: '',
    fechaVencimiento: '',
  });

  // Authentication and Authorization check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'super_admin') {
      router.push('/unauthorized');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'super_admin') {
      loadData();
      loadCompanies();
    }
  }, [status, session]);

  const loadCompanies = async () => {
    try {
      const res = await fetch('/api/admin/companies?limit=500&includeTest=false');
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
      }
    } catch (error) {
      logger.error('Error loading companies:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar estadísticas
      const statsRes = await fetch('/api/b2b-billing/reports?action=stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Cargar facturas
      const invoicesRes = await fetch('/api/b2b-billing/invoices?limit=20');
      if (invoicesRes.ok) {
        const data = await invoicesRes.json();
        setInvoices(data.invoices);
      }
    } catch (error) {
      logger.error('Error al cargar datos:', error);
      toast.error('Error al cargar datos de facturación');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMonthlyInvoices = async () => {
    try {
      setIsGeneratingMonthly(true);
      const currentPeriod = format(new Date(), 'yyyy-MM');

      const res = await fetch('/api/b2b-billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-monthly',
          periodo: currentPeriod,
        }),
      });

      if (res.ok) {
        const results = await res.json();
        toast.success(`Generadas ${results.success.length} facturas mensuales`);
        if (results.errors.length > 0) {
          toast.warning(`${results.errors.length} facturas con errores`);
        }
        loadData();
      } else {
        toast.error('Error al generar facturas mensuales');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al generar facturas mensuales');
    } finally {
      setIsGeneratingMonthly(false);
    }
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setEditForm({
      notas: '',
      terminosPago: '',
      fechaVencimiento: invoice.fechaVencimiento.split('T')[0],
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedInvoice) return;
    
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/b2b-billing/invoices/${selectedInvoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        toast.success('Factura actualizada correctamente');
        setShowEditDialog(false);
        loadData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al actualizar factura');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al actualizar factura');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedInvoice) return;
    
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/b2b-billing/invoices/${selectedInvoice.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Factura cancelada correctamente');
        setShowDeleteDialog(false);
        loadData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al cancelar factura');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al cancelar factura');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateManualInvoice = async () => {
    if (!createForm.companyId || !createForm.concepto || !createForm.subtotal) {
      toast.error('Empresa, concepto y subtotal son obligatorios');
      return;
    }

    try {
      setIsProcessing(true);
      const subtotal = parseFloat(createForm.subtotal);
      const descuento = parseFloat(createForm.descuento || '0');
      const impuestosPorcentaje = parseFloat(createForm.impuestos || '21');
      const impuestos = (subtotal - descuento) * (impuestosPorcentaje / 100);
      const total = subtotal - descuento + impuestos;

      const res = await fetch('/api/b2b-billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-manual',
          companyId: createForm.companyId,
          concepto: createForm.concepto,
          subtotal,
          descuento,
          impuestos,
          total,
          notas: createForm.notas,
          fechaVencimiento: createForm.fechaVencimiento || undefined,
        }),
      });

      if (res.ok) {
        toast.success('Factura creada correctamente');
        setShowCreateDialog(false);
        setCreateForm({
          companyId: '',
          concepto: '',
          subtotal: '',
          descuento: '0',
          impuestos: '21',
          notas: '',
          fechaVencimiento: '',
        });
        loadData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al crear factura');
      }
    } catch (error) {
      logger.error('Error creating invoice:', error);
      toast.error('Error al crear factura');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAsPaid = async (invoice: Invoice) => {
    try {
      const res = await fetch(`/api/b2b-billing/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          monto: invoice.total,
          metodoPago: 'MANUAL',
          referencia: `Pago manual - ${format(new Date(), 'dd/MM/yyyy')}`,
        }),
      });

      if (res.ok) {
        toast.success('Factura marcada como pagada');
        loadData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al marcar como pagada');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al marcar como pagada');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { variant: any; icon: any }> = {
      PENDIENTE: { variant: 'default', icon: Clock },
      PAGADA: { variant: 'default', icon: CheckCircle },
      VENCIDA: { variant: 'destructive', icon: AlertCircle },
      CANCELADA: { variant: 'secondary', icon: XCircle },
      PARCIALMENTE_PAGADA: { variant: 'default', icon: Clock },
    };

    const badge = badges[estado] || { variant: 'default', icon: FileText };
    const Icon = badge.icon;

    const colors: Record<string, string> = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      PAGADA: 'bg-green-100 text-green-800 border-green-300',
      VENCIDA: 'bg-red-100 text-red-800 border-red-300',
      CANCELADA: 'bg-gray-100 text-gray-800 border-gray-300',
      PARCIALMENTE_PAGADA: 'bg-blue-100 text-blue-800 border-blue-300',
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${colors[estado] || 'bg-gray-100 text-gray-800'}`}
      >
        <Icon className="w-3 h-3" />
        {estado.replace('_', ' ')}
      </span>
    );
  };

  const filteredInvoices =
    selectedEstado === 'all' ? invoices : invoices.filter((inv) => inv.estado === selectedEstado);

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando datos de facturación...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
          <div className="container mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Facturación B2B</h1>
                <p className="text-muted-foreground">
                  Gestión de facturación de INMOVA a empresas clientes
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleGenerateMonthlyInvoices}
                  disabled={isGeneratingMonthly}
                  variant="outline"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {isGeneratingMonthly ? 'Generando...' : 'Generar Facturas Mensuales'}
                </Button>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva Factura
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Crear Factura Manual</DialogTitle>
                      <DialogDescription>
                        Crea una factura manual para un cliente. Se sincronizará con Contasimple si está habilitado.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="company">Empresa *</Label>
                        <Select
                          value={createForm.companyId}
                          onValueChange={(v) => setCreateForm({ ...createForm, companyId: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar empresa" />
                          </SelectTrigger>
                          <SelectContent>
                            {companies.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="concepto">Concepto *</Label>
                        <Input
                          id="concepto"
                          placeholder="Ej: Suscripción mensual Plan Business"
                          value={createForm.concepto}
                          onChange={(e) => setCreateForm({ ...createForm, concepto: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="subtotal">Subtotal (€) *</Label>
                          <Input
                            id="subtotal"
                            type="number"
                            step="0.01"
                            placeholder="129.00"
                            value={createForm.subtotal}
                            onChange={(e) => setCreateForm({ ...createForm, subtotal: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="descuento">Descuento (€)</Label>
                          <Input
                            id="descuento"
                            type="number"
                            step="0.01"
                            value={createForm.descuento}
                            onChange={(e) => setCreateForm({ ...createForm, descuento: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="impuestos">IVA (%)</Label>
                          <Select
                            value={createForm.impuestos}
                            onValueChange={(v) => setCreateForm({ ...createForm, impuestos: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0% (Exento)</SelectItem>
                              <SelectItem value="4">4% (Superreducido)</SelectItem>
                              <SelectItem value="10">10% (Reducido)</SelectItem>
                              <SelectItem value="21">21% (General)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="fechaVencimiento">Vencimiento</Label>
                          <Input
                            id="fechaVencimiento"
                            type="date"
                            value={createForm.fechaVencimiento}
                            onChange={(e) => setCreateForm({ ...createForm, fechaVencimiento: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notas">Notas</Label>
                        <Textarea
                          id="notas"
                          placeholder="Notas adicionales..."
                          value={createForm.notas}
                          onChange={(e) => setCreateForm({ ...createForm, notas: e.target.value })}
                        />
                      </div>
                      {createForm.subtotal && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span>€{parseFloat(createForm.subtotal || '0').toFixed(2)}</span>
                            </div>
                            {parseFloat(createForm.descuento) > 0 && (
                              <div className="flex justify-between text-red-600">
                                <span>Descuento:</span>
                                <span>-€{parseFloat(createForm.descuento).toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>IVA ({createForm.impuestos}%):</span>
                              <span>
                                €{((parseFloat(createForm.subtotal || '0') - parseFloat(createForm.descuento || '0')) * parseFloat(createForm.impuestos) / 100).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between font-bold border-t pt-1">
                              <span>Total:</span>
                              <span>
                                €{(
                                  parseFloat(createForm.subtotal || '0') -
                                  parseFloat(createForm.descuento || '0') +
                                  (parseFloat(createForm.subtotal || '0') - parseFloat(createForm.descuento || '0')) * parseFloat(createForm.impuestos) / 100
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateManualInvoice} disabled={isProcessing}>
                        {isProcessing ? 'Creando...' : 'Crear Factura'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    €{stats?.monthlyRevenue.toFixed(2) || '0.00'}
                  </div>
                  <p className="text-xs text-muted-foreground">Facturas pagadas este mes</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendiente de Cobro</CardTitle>
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    €{stats?.pendingAmount.toFixed(2) || '0.00'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.pendingInvoices || 0} facturas pendientes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Facturas</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalInvoices || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.paidInvoices || 0} pagadas, {stats?.overdueInvoices || 0} vencidas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tasa de Pago</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.totalInvoices
                      ? Math.round((stats.paidInvoices / stats.totalInvoices) * 100)
                      : 0}
                    %
                  </div>
                  <p className="text-xs text-muted-foreground">Facturas pagadas a tiempo</p>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Facturas */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Facturas Recientes</CardTitle>
                    <CardDescription>Gestiona las facturas emitidas a las empresas</CardDescription>
                  </div>
                  <Select value={selectedEstado} onValueChange={setSelectedEstado}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                      <SelectItem value="PAGADA">Pagada</SelectItem>
                      <SelectItem value="VENCIDA">Vencida</SelectItem>
                      <SelectItem value="CANCELADA">Cancelada</SelectItem>
                      <SelectItem value="PARCIALMENTE_PAGADA">Parcialmente Pagada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {filteredInvoices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>
                      No hay facturas{' '}
                      {selectedEstado !== 'all' ? `con estado ${selectedEstado}` : ''}.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nº Factura</TableHead>
                          <TableHead>Empresa</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Período</TableHead>
                          <TableHead>Emisión</TableHead>
                          <TableHead>Vencimiento</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInvoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.numeroFactura}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">{invoice.company.nombre}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {invoice.company.email}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {invoice.subscriptionPlan ? (
                                <Badge variant="outline">{invoice.subscriptionPlan.nombre}</Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>{invoice.periodo}</TableCell>
                            <TableCell>
                              {format(new Date(invoice.fechaEmision), 'dd/MM/yyyy', { locale: es })}
                            </TableCell>
                            <TableCell>
                              {format(new Date(invoice.fechaVencimiento), 'dd/MM/yyyy', {
                                locale: es,
                              })}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              €{invoice.total.toFixed(2)}
                            </TableCell>
                            <TableCell>{getEstadoBadge(invoice.estado)}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/admin/facturacion-b2b/${invoice.id}`)}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver Detalles
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => window.open(`/api/b2b-billing/invoices/${invoice.id}/pdf`, '_blank')}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Descargar PDF
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Editar Factura
                                  </DropdownMenuItem>
                                  {invoice.estado === 'PENDIENTE' && (
                                    <DropdownMenuItem onClick={() => handleMarkAsPaid(invoice)}>
                                      <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                      Marcar como Pagada
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteInvoice(invoice)}
                                    className="text-red-600"
                                    disabled={invoice.estado === 'CANCELADA'}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Cancelar Factura
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dialog de Edición */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Factura</DialogTitle>
                  <DialogDescription>
                    Editar factura {selectedInvoice?.numeroFactura}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="fechaVencimiento">Fecha de Vencimiento</Label>
                    <Input
                      id="fechaVencimiento"
                      type="date"
                      value={editForm.fechaVencimiento}
                      onChange={(e) => setEditForm({ ...editForm, fechaVencimiento: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="terminosPago">Términos de Pago</Label>
                    <Input
                      id="terminosPago"
                      placeholder="Ej: Pago a 30 días"
                      value={editForm.terminosPago}
                      onChange={(e) => setEditForm({ ...editForm, terminosPago: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notas">Notas</Label>
                    <Textarea
                      id="notas"
                      placeholder="Notas adicionales..."
                      value={editForm.notas}
                      onChange={(e) => setEditForm({ ...editForm, notas: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveEdit} disabled={isProcessing}>
                    {isProcessing ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Dialog de Confirmación de Eliminación */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Cancelar factura?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción cancelará la factura <strong>{selectedInvoice?.numeroFactura}</strong> 
                    por un total de <strong>€{selectedInvoice?.total.toFixed(2)}</strong>.
                    La factura quedará marcada como cancelada pero no se eliminará del sistema.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>No, mantener</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleConfirmDelete}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Cancelando...' : 'Sí, cancelar factura'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </AuthenticatedLayout>
  );
}
