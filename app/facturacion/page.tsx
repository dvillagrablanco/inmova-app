/**
 * Página de Facturación para Empresas Clientes
 * Tabs: Facturas (inmobiliarias), Series, Suscripción (B2B)
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  FileText,
  Download,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  TrendingUp,
  Package,
  Users,
  Building,
  Plus,
  Euro,
  Settings,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger from '@/lib/logger';
import { ErrorBoundary } from '@/components/ui/error-boundary';

function safeFormatDate(dateStr: string | null | undefined, fmt: string = 'dd/MM/yyyy'): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return format(d, fmt, { locale: es });
  } catch {
    return '—';
  }
}

interface FacturaInmobiliaria {
  id: string;
  numeroFactura: string;
  serie: string;
  fecha: string;
  concepto: string;
  baseImponible: number;
  total: number;
  estado: string;
  tipo: string;
  destinatario: { nombre: string; nif?: string };
  inmueble?: string;
}

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

function FacturacionContent() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [usageStats, setUsageStats] = useState({
    usuarios: 0,
    propiedades: 0,
  });

  // Facturas inmobiliarias (Homming-style)
  const [facturas, setFacturas] = useState<FacturaInmobiliaria[]>([]);
  const [kpis, setKpis] = useState({
    totalFacturado: 0,
    pendientesCobro: 0,
    facturasEsteMes: 0,
  });
  const [filtrosFacturas, setFiltrosFacturas] = useState({
    serie: '',
    estado: '',
    tipo: '',
    fechaDesde: '',
    fechaHasta: '',
    destinatario: '',
  });

  useEffect(() => {
    if (session?.user) loadData();
  }, [session]);

  useEffect(() => {
    if (session?.user) loadFacturasInmobiliarias();
  }, [session, filtrosFacturas.serie, filtrosFacturas.estado, filtrosFacturas.tipo, filtrosFacturas.fechaDesde, filtrosFacturas.fechaHasta, filtrosFacturas.destinatario]);

  const loadData = async () => {
    try {
      setLoading(true);

      try {
        const invoicesRes = await fetch('/api/b2b-billing/invoices');
        if (invoicesRes.ok) {
          const data = await invoicesRes.json();
          setInvoices(data.invoices || []);
        }
      } catch {}

      try {
        const companyRes = await fetch('/api/company');
        if (companyRes.ok) {
          const companyData = await companyRes.json();
          setCompany(companyData);
        }
      } catch {}

      try {
        const statsRes = await fetch('/api/dashboard?stats=usage');
        if (statsRes.ok) {
          const stats = await statsRes.json();
          setUsageStats({
            usuarios: stats.totalUsers || 0,
            propiedades: stats.totalBuildings || 0,
          });
        }
      } catch {}
    } catch (error) {
      logger.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFacturasInmobiliarias = async () => {
    try {
      const params = new URLSearchParams();
      if (filtrosFacturas.serie) params.set('serie', filtrosFacturas.serie);
      if (filtrosFacturas.estado) params.set('estado', filtrosFacturas.estado);
      if (filtrosFacturas.tipo) params.set('tipo', filtrosFacturas.tipo);
      if (filtrosFacturas.fechaDesde) params.set('fechaDesde', filtrosFacturas.fechaDesde);
      if (filtrosFacturas.fechaHasta) params.set('fechaHasta', filtrosFacturas.fechaHasta);
      if (filtrosFacturas.destinatario) params.set('destinatario', filtrosFacturas.destinatario);

      const res = await fetch(`/api/facturacion?${params}`);
      if (res.ok) {
        const json = await res.json();
        setFacturas(json.data || []);
        setKpis(json.kpis || { totalFacturado: 0, pendientesCobro: 0, facturasEsteMes: 0 });
      }
    } catch {
      toast.error('Error al cargar facturas');
    }
  };


  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { color: string; icon: any }> = {
      PENDIENTE: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
      PAGADA: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
      VENCIDA: { color: 'bg-red-100 text-red-800 border-red-300', icon: AlertCircle },
      CANCELADA: { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: XCircle },
      PARCIALMENTE_PAGADA: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Clock },
      borrador: { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: FileText },
      emitida: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Clock },
      pagada: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
      anulada: { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
      rectificada: { color: 'bg-purple-100 text-purple-800 border-purple-300', icon: FileText },
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
        <div>
          <h1 className="text-3xl font-bold">Facturación y Suscripción</h1>
          <p className="text-muted-foreground">Gestiona tus facturas inmobiliarias, series y plan de suscripción</p>
        </div>

        <Tabs defaultValue="facturas" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="facturas" className="gap-2">
              <FileText className="w-4 h-4" />
              Facturas ({facturas.length})
            </TabsTrigger>
            <TabsTrigger value="series" className="gap-2">
              <Settings className="w-4 h-4" />
              Series
            </TabsTrigger>
            <TabsTrigger value="suscripcion" className="gap-2">
              <Package className="w-4 h-4" />
              Suscripción
            </TabsTrigger>
          </TabsList>

          {/* Tab Facturas */}
          <TabsContent value="facturas" className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total facturado</CardTitle>
                    <Euro className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">€{(kpis.totalFacturado || 0).toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Facturas emitidas y pagadas</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pendientes de cobro</CardTitle>
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">€{(kpis.pendientesCobro || 0).toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Facturas emitidas sin cobrar</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Este mes</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpis.facturasEsteMes}</div>
                    <p className="text-xs text-muted-foreground">Facturas emitidas este mes</p>
                  </CardContent>
                </Card>
              </div>
              <Button asChild>
                <Link href="/facturacion/nueva">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva factura
                </Link>
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Facturas inmobiliarias</CardTitle>
                <CardDescription>Facturas, proformas y rectificativas de propiedades</CardDescription>
                <div className="flex flex-wrap gap-2 pt-4">
                  <Input
                    placeholder="Buscar destinatario..."
                    className="max-w-[200px]"
                    value={filtrosFacturas.destinatario}
                    onChange={(e) => setFiltrosFacturas({ ...filtrosFacturas, destinatario: e.target.value })}
                  />
                  <Select value={filtrosFacturas.estado} onValueChange={(v) => setFiltrosFacturas({ ...filtrosFacturas, estado: v })}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="borrador">Borrador</SelectItem>
                      <SelectItem value="emitida">Emitida</SelectItem>
                      <SelectItem value="pagada">Pagada</SelectItem>
                      <SelectItem value="anulada">Anulada</SelectItem>
                      <SelectItem value="rectificada">Rectificada</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filtrosFacturas.tipo} onValueChange={(v) => setFiltrosFacturas({ ...filtrosFacturas, tipo: v })}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="factura">Factura</SelectItem>
                      <SelectItem value="proforma">Proforma</SelectItem>
                      <SelectItem value="rectificativa">Rectificativa</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    placeholder="Desde"
                    className="w-[140px]"
                    value={filtrosFacturas.fechaDesde}
                    onChange={(e) => setFiltrosFacturas({ ...filtrosFacturas, fechaDesde: e.target.value })}
                  />
                  <Input
                    type="date"
                    placeholder="Hasta"
                    className="w-[140px]"
                    value={filtrosFacturas.fechaHasta}
                    onChange={(e) => setFiltrosFacturas({ ...filtrosFacturas, fechaHasta: e.target.value })}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {facturas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay facturas. Crea la primera.</p>
                    <Button asChild className="mt-4">
                      <Link href="/facturacion/nueva">
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva factura
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nº</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Concepto</TableHead>
                          <TableHead>Destinatario</TableHead>
                          <TableHead>Inmueble</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {facturas.map((f) => (
                          <TableRow key={f.id}>
                            <TableCell className="font-medium">{f.numeroFactura}</TableCell>
                            <TableCell>{safeFormatDate(f.fecha)}</TableCell>
                            <TableCell>{f.concepto}</TableCell>
                            <TableCell>{f.destinatario.nombre}</TableCell>
                            <TableCell>{f.inmueble || '-'}</TableCell>
                            <TableCell className="text-right font-medium">€{(f.total || 0).toFixed(2)}</TableCell>
                            <TableCell>{getEstadoBadge(f.estado)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => router.push(`/facturacion/${f.id}`)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Series */}
          <TabsContent value="series" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Series de facturación</CardTitle>
                <CardDescription>
                  Gestiona los prefijos y numeración para facturas, proformas y rectificativas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/facturacion/series">
                    <Settings className="w-4 h-4 mr-2" />
                    Ir a Series
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Suscripción */}
          <TabsContent value="suscripcion" className="space-y-6 mt-6">
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
          </TabsContent>
        </Tabs>
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
                {safeFormatDate(invoice.fechaEmision)}
              </TableCell>
              <TableCell>
                {safeFormatDate(invoice.fechaVencimiento)}
              </TableCell>
              <TableCell className="text-right font-medium">€{(invoice.total || 0).toFixed(2)}</TableCell>
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

export default function FacturacionPage() {
  return (
    <ErrorBoundary>
      <FacturacionContent />
    </ErrorBoundary>
  );
}
