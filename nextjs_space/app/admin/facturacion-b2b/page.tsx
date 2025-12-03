/**
 * Dashboard de Facturación B2B para Super Admin
 * Gestión completa de facturas de INMOVA a empresas clientes
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
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
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedEstado, setSelectedEstado] = useState<string>('all');
  const [isGeneratingMonthly, setIsGeneratingMonthly] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (session?.user) {
      loadData();
    }
  }, [session]);

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
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${colors[estado] || 'bg-gray-100 text-gray-800'}`}>
        <Icon className="w-3 h-3" />
        {estado.replace('_', ' ')}
      </span>
    );
  };

  const filteredInvoices = selectedEstado === 'all' 
    ? invoices 
    : invoices.filter(inv => inv.estado === selectedEstado);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando datos de facturación...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Factura Manual</DialogTitle>
                <DialogDescription>
                  Funcionalidad disponible próximamente
                </DialogDescription>
              </DialogHeader>
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
            <p className="text-xs text-muted-foreground">
              Facturas pagadas este mes
            </p>
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
              {stats?.totalInvoices ? Math.round((stats.paidInvoices / stats.totalInvoices) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Facturas pagadas a tiempo
            </p>
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
              <p>No hay facturas {selectedEstado !== 'all' ? `con estado ${selectedEstado}` : ''}.</p>
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
                      <TableCell className="font-medium">
                        {invoice.numeroFactura}
                      </TableCell>
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
                          <Badge variant="outline">
                            {invoice.subscriptionPlan.nombre}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{invoice.periodo}</TableCell>
                      <TableCell>
                        {format(new Date(invoice.fechaEmision), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.fechaVencimiento), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        €{invoice.total.toFixed(2)}
                      </TableCell>
                      <TableCell>{getEstadoBadge(invoice.estado)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/facturacion-b2b/${invoice.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              toast.info('Funcionalidad de descarga disponible próximamente');
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
