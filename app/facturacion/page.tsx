/**
 * Página de Facturación para Empresas Clientes
 * Permite a las empresas ver sus facturas y suscripción
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  FileText,
  Download,
  CreditCard,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  TrendingUp,
  Package,
  Users,
  Building,
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
  total: number;
  estado: string;
  stripePdfUrl?: string;
}

interface SubscriptionPlan {
  id: string;
  nombre: string;
  tier: string;
  precioMensual: number;
  maxUsuarios: number;
  maxPropiedades: number;
}

interface Company {
  id: string;
  nombre: string;
  estadoCliente: string;
  subscriptionPlan?: SubscriptionPlan;
  maxUsuarios?: number;
  maxPropiedades?: number;
}

export default function FacturacionPage() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [usageStats, setUsageStats] = useState({
    usuarios: 0,
    propiedades: 0,
  });

  useEffect(() => {
    if (session?.user) {
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar facturas de la empresa
      const invoicesRes = await fetch('/api/b2b-billing/invoices');
      if (invoicesRes.ok) {
        const data = await invoicesRes.json();
        setInvoices(data.invoices);
      }

      // Cargar información de la empresa
      const companyRes = await fetch('/api/company');
      if (companyRes.ok) {
        const companyData = await companyRes.json();
        setCompany(companyData);
      }

      // Cargar estadísticas de uso
      const statsRes = await fetch('/api/dashboard?stats=usage');
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setUsageStats({
          usuarios: stats.totalUsers || 0,
          propiedades: stats.totalBuildings || 0,
        });
      }
    } catch (error) {
      logger.error('Error al cargar datos:', error);
      toast.error('Error al cargar datos de facturación');
    } finally {
      setLoading(false);
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
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${badge.color}`}
      >
        <Icon className="w-3 h-3" />
        {estado.replace('_', ' ')}
      </span>
    );
  };

  const calculateUsagePercentage = (current: number, max: number | undefined) => {
    if (!max || max === 0) return 0;
    return Math.min((current / max) * 100, 100);
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Cargando información...</p>
                </div>
              </div>
            </div>
          </AuthenticatedLayout>
    );
  }

  const pendingInvoices = invoices.filter(
    (inv) => inv.estado === 'PENDIENTE' || inv.estado === 'VENCIDA'
  );
  const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.total, 0);

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Facturación y Suscripción</h1>
        <p className="text-muted-foreground">Gestiona tus facturas, pagos y plan de suscripción</p>
      </div>

      {/* Resumen de Suscripción */}
      {company?.subscriptionPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Plan Actual: {company.subscriptionPlan.nombre}
            </CardTitle>
            <CardDescription>
              {company.subscriptionPlan.tier} - €{company.subscriptionPlan.precioMensual}/mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Uso de Usuarios */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Usuarios</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {usageStats.usuarios} /{' '}
                    {company.maxUsuarios || company.subscriptionPlan.maxUsuarios}
                  </span>
                </div>
                <Progress
                  value={calculateUsagePercentage(
                    usageStats.usuarios,
                    company.maxUsuarios || company.subscriptionPlan.maxUsuarios
                  )}
                  className="h-2"
                />
              </div>

              {/* Uso de Propiedades */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Propiedades</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {usageStats.propiedades} /{' '}
                    {company.maxPropiedades || company.subscriptionPlan.maxPropiedades}
                  </span>
                </div>
                <Progress
                  value={calculateUsagePercentage(
                    usageStats.propiedades,
                    company.maxPropiedades || company.subscriptionPlan.maxPropiedades
                  )}
                  className="h-2"
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado de la cuenta</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {company.estadoCliente || 'Activo'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas de Facturas Pendientes */}
      {pendingInvoices.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="w-5 h-5" />
              Facturas Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700 mb-4">
              Tienes {pendingInvoices.length} factura(s) pendiente(s) por un total de €
              {totalPending.toFixed(2)}
            </p>
            <Button variant="default" size="sm">
              <CreditCard className="w-4 h-4 mr-2" />
              Pagar Ahora
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tabs de Facturas */}
      <Card>
        <CardHeader>
          <CardTitle>Facturas</CardTitle>
          <CardDescription>Historial completo de facturas</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Todas ({invoices.length})</TabsTrigger>
              <TabsTrigger value="pending">
                Pendientes ({invoices.filter((inv) => inv.estado === 'PENDIENTE').length})
              </TabsTrigger>
              <TabsTrigger value="paid">
                Pagadas ({invoices.filter((inv) => inv.estado === 'PAGADA').length})
              </TabsTrigger>
              <TabsTrigger value="overdue">
                Vencidas ({invoices.filter((inv) => inv.estado === 'VENCIDA').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <InvoiceTable invoices={invoices} getEstadoBadge={getEstadoBadge} />
            </TabsContent>

            <TabsContent value="pending" className="mt-6">
              <InvoiceTable
                invoices={invoices.filter((inv) => inv.estado === 'PENDIENTE')}
                getEstadoBadge={getEstadoBadge}
              />
            </TabsContent>

            <TabsContent value="paid" className="mt-6">
              <InvoiceTable
                invoices={invoices.filter((inv) => inv.estado === 'PAGADA')}
                getEstadoBadge={getEstadoBadge}
              />
            </TabsContent>

            <TabsContent value="overdue" className="mt-6">
              <InvoiceTable
                invoices={invoices.filter((inv) => inv.estado === 'VENCIDA')}
                getEstadoBadge={getEstadoBadge}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Integraciones Contables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Integraciones Contables
          </CardTitle>
          <CardDescription>Conecta tu sistema contable para sincronización automática</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {/* Contasimple */}
            <Card className="border-2 hover:border-primary transition-colors cursor-pointer">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold">Contasimple</h3>
                <p className="text-sm text-muted-foreground mt-1">Contabilidad para autónomos y pymes</p>
                <Badge variant="outline" className="mt-2">Popular en España</Badge>
              </CardContent>
            </Card>

            {/* Holded */}
            <Card className="border-2 hover:border-primary transition-colors cursor-pointer">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold">Holded</h3>
                <p className="text-sm text-muted-foreground mt-1">ERP y contabilidad todo en uno</p>
                <Badge variant="outline" className="mt-2">ERP Completo</Badge>
              </CardContent>
            </Card>

            {/* A3 Software */}
            <Card className="border-2 hover:border-primary transition-colors cursor-pointer">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold">A3 Software</h3>
                <p className="text-sm text-muted-foreground mt-1">Software de gestión empresarial</p>
                <Badge variant="outline" className="mt-2">Profesional</Badge>
              </CardContent>
            </Card>

            {/* Sage */}
            <Card className="border-2 hover:border-primary transition-colors cursor-pointer">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold">Sage</h3>
                <p className="text-sm text-muted-foreground mt-1">Soluciones contables empresariales</p>
                <Badge variant="outline" className="mt-2">Enterprise</Badge>
              </CardContent>
            </Card>

            {/* QuickBooks */}
            <Card className="border-2 hover:border-primary transition-colors cursor-pointer">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-teal-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-teal-600" />
                </div>
                <h3 className="font-semibold">QuickBooks</h3>
                <p className="text-sm text-muted-foreground mt-1">Contabilidad en la nube</p>
                <Badge variant="outline" className="mt-2">Internacional</Badge>
              </CardContent>
            </Card>

            {/* Xero */}
            <Card className="border-2 hover:border-primary transition-colors cursor-pointer">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-cyan-600" />
                </div>
                <h3 className="font-semibold">Xero</h3>
                <p className="text-sm text-muted-foreground mt-1">Contabilidad cloud global</p>
                <Badge variant="outline" className="mt-2">Global</Badge>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>¿No ves tu software contable?</strong> Contacta con nuestro equipo de soporte para solicitar una nueva integración.
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </AuthenticatedLayout>
  );
}

// Componente de tabla de facturas
function InvoiceTable({
  invoices,
  getEstadoBadge,
}: {
  invoices: Invoice[];
  getEstadoBadge: (estado: string) => JSX.Element;
}) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No hay facturas en esta categoría</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nº Factura</TableHead>
            <TableHead>Período</TableHead>
            <TableHead>Fecha Emisión</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">{invoice.numeroFactura}</TableCell>
              <TableCell>{invoice.periodo}</TableCell>
              <TableCell>
                {format(new Date(invoice.fechaEmision), 'dd/MM/yyyy', { locale: es })}
              </TableCell>
              <TableCell>
                {format(new Date(invoice.fechaVencimiento), 'dd/MM/yyyy', { locale: es })}
              </TableCell>
              <TableCell className="text-right font-medium">€{invoice.total.toFixed(2)}</TableCell>
              <TableCell>{getEstadoBadge(invoice.estado)}</TableCell>
              <TableCell className="text-right">
                <div className="flex gap-1 justify-end">
                  {(invoice.estado === 'PENDIENTE' || invoice.estado === 'VENCIDA') && (
                    <Button variant="default" size="sm">
                      <CreditCard className="w-4 h-4 mr-1" />
                      Pagar
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (invoice.stripePdfUrl) {
                        window.open(invoice.stripePdfUrl, '_blank');
                      } else {
                        toast.info('PDF no disponible');
                      }
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
  );
}
