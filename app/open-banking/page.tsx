'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  CreditCard,
  Home,
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { logError } from '@/lib/logger';

interface BankConnection {
  id: string;
  nombreBanco: string;
  proveedor: string;
  estado: string;
  tipoCuenta?: string;
  ultimosDigitos?: string;
  ultimaSync?: string;
  consentValidUntil?: string;
  transactions?: BankTransaction[];
}

interface BankTransaction {
  id: string;
  fecha: string;
  descripcion: string;
  monto: number;
  moneda: string;
  tipo: string;
  conciliado: boolean;
}

export default function OpenBankingPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [conexiones, setConexiones] = useState<BankConnection[]>([]);
  const [transacciones, setTransacciones] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<BankConnection | null>(null);
  const [showTransactions, setShowTransactions] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [activeTab, setActiveTab] = useState('conexiones');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      cargarConexiones();
      cargarTransacciones();
    }
  }, [session]);

  const cargarConexiones = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/open-banking/connections');
      if (!res.ok) throw new Error('Error');
      const data = await res.json();
      setConexiones(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Error al cargar conexiones');
      setConexiones([]);
    } finally {
      setLoading(false);
    }
  };

  const cargarTransacciones = async () => {
    try {
      const res = await fetch('/api/open-banking/sync');
      if (!res.ok) return;
      const data = await res.json();
      setTransacciones(Array.isArray(data.transacciones) ? data.transacciones : []);
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error('Error al cargar transacciones en Open Banking');
      logError(err, { context: 'OpenBanking.loadTransactions' });
      setTransacciones([]);
      toast.error('Error al cargar transacciones');
    }
  };

  const conectarBankinter = async () => {
    try {
      toast.info('Iniciando conexión con Bankinter...');
      const res = await fetch('/api/open-banking/bankinter/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al conectar');
      }

      const data = await res.json();

      if (data.authUrl) {
        toast.success('Redirigiendo a Bankinter...');
        window.location.href = data.authUrl;
      } else {
        toast.info(data.message || 'Conexión iniciada');
        await cargarConexiones();
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al conectar con Bankinter');
    }
  };

  const sincronizarConexion = async (connectionId: string) => {
    try {
      setSyncingId(connectionId);
      toast.info('Sincronizando transacciones...');

      const res = await fetch('/api/open-banking/bankinter/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId, diasAtras: 90 }),
      });

      if (!res.ok) throw new Error('Error al sincronizar');

      const data = await res.json();
      toast.success(`${data.total || 0} transacciones sincronizadas`);
      await cargarConexiones();
      await cargarTransacciones();
    } catch (error: any) {
      toast.error(error.message || 'Error al sincronizar');
    } finally {
      setSyncingId(null);
    }
  };

  const eliminarConexion = async () => {
    if (!deletingId) return;

    try {
      const res = await fetch(`/api/open-banking/connections?id=${deletingId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Error al eliminar');

      toast.success('Conexión eliminada');
      setShowDeleteDialog(false);
      setDeletingId(null);
      await cargarConexiones();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar conexión');
    }
  };

  const conciliarPagos = async () => {
    try {
      setReconciling(true);
      toast.info('Conciliando pagos automáticamente...');

      const res = await fetch('/api/open-banking/bankinter/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesesAtras: 3 }),
      });

      if (!res.ok) throw new Error('Error al conciliar');

      const data = await res.json();
      toast.success(`${data.conciliados || 0} pagos conciliados de ${data.total || 0}`);
      await cargarTransacciones();
    } catch (error: any) {
      toast.error(error.message || 'Error al conciliar pagos');
    } finally {
      setReconciling(false);
    }
  };

  const verTransacciones = (connection: BankConnection) => {
    setSelectedConnection(connection);
    setShowTransactions(true);
  };

  const exportarTransacciones = () => {
    try {
      const csvContent = [
        ['Fecha', 'Descripción', 'Monto', 'Moneda', 'Tipo', 'Conciliado'].join(','),
        ...transacciones.map((t) =>
          [
            format(new Date(t.fecha), 'dd/MM/yyyy'),
            `"${t.descripcion}"`,
            t.monto,
            t.moneda,
            t.tipo,
            t.conciliado ? 'Sí' : 'No',
          ].join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `transacciones_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      toast.success('Transacciones exportadas');
    } catch (error) {
      toast.error('Error al exportar transacciones');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const conexionesActivas = conexiones.filter((c) => c.estado === 'conectado').length;
  const totalTransacciones = transacciones.length;
  const transaccionesConciliadas = transacciones.filter((t) => t.conciliado).length;

  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="gap-2 mb-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">
                      <Home className="h-4 w-4" />
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Open Banking</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <div className="flex items-center justify-between mt-2">
                <div>
                  <h1 className="text-2xl font-bold md:text-3xl">🏦 Open Banking</h1>
                  <p className="text-muted-foreground">
                    Gestión de conexiones bancarias y conciliación automática
                  </p>
                </div>
                <Button onClick={conectarBankinter} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Conectar Bankinter
                </Button>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">
                    Conexiones Activas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{conexionesActivas}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    de {conexiones.length} totales
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Transacciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalTransacciones}</div>
                  <p className="text-xs text-muted-foreground mt-1">sincronizadas</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Conciliadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{transaccionesConciliadas}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalTransacciones > 0
                      ? `${Math.round((transaccionesConciliadas / totalTransacciones) * 100)}%`
                      : '0%'}{' '}
                    del total
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Acciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={conciliarPagos}
                    disabled={reconciling || totalTransacciones === 0}
                    size="sm"
                    className="w-full"
                  >
                    {reconciling ? (
                      <>
                        <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                        Conciliando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-2" />
                        Conciliar Pagos
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="conexiones">Conexiones Bancarias</TabsTrigger>
                <TabsTrigger value="transacciones">Transacciones</TabsTrigger>
              </TabsList>

              {/* Tab: Conexiones */}
              <TabsContent value="conexiones" className="space-y-4">
                {conexiones.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <CreditCard className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-lg font-medium mb-2">No hay conexiones bancarias</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Conecta tu cuenta de Bankinter para comenzar
                      </p>
                      <Button onClick={conectarBankinter} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Conectar Bankinter
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {conexiones.map((conn) => (
                      <Card key={conn.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex gap-3">
                              <div className="rounded-full bg-primary/10 p-2">
                                <Building2 className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-base">{conn.nombreBanco}</CardTitle>
                                <CardDescription>
                                  {conn.proveedor === 'bankinter_redsys'
                                    ? 'Bankinter Open Banking'
                                    : conn.proveedor}
                                </CardDescription>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {conn.tipoCuenta && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Cuenta:</span>
                                <span className="font-medium">
                                  ****{conn.ultimosDigitos || '****'}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Estado:</span>
                              <Badge
                                variant={conn.estado === 'conectado' ? 'default' : 'secondary'}
                              >
                                {conn.estado === 'conectado' ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Conectado
                                  </>
                                ) : conn.estado === 'pendiente' ? (
                                  <>
                                    <Clock className="h-3 w-3 mr-1" /> Pendiente
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="h-3 w-3 mr-1" /> {conn.estado}
                                  </>
                                )}
                              </Badge>
                            </div>
                            {conn.ultimaSync && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Última sync:</span>
                                <span className="font-medium">
                                  {format(new Date(conn.ultimaSync), 'dd/MM/yyyy HH:mm', {
                                    locale: es,
                                  })}
                                </span>
                              </div>
                            )}
                            {conn.consentValidUntil && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Válido hasta:</span>
                                <span className="font-medium">
                                  {format(new Date(conn.consentValidUntil), 'dd/MM/yyyy', {
                                    locale: es,
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="flex gap-2">
                          <Button
                            onClick={() => sincronizarConexion(conn.id)}
                            disabled={syncingId === conn.id || conn.estado !== 'conectado'}
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            {syncingId === conn.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1" /> Sincronizar
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => verTransacciones(conn)}
                            size="sm"
                            variant="outline"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={() => {
                              setDeletingId(conn.id);
                              setShowDeleteDialog(true);
                            }}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Tab: Transacciones */}
              <TabsContent value="transacciones" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Transacciones Sincronizadas</CardTitle>
                        <CardDescription>
                          {totalTransacciones} transacciones, {transaccionesConciliadas} conciliadas
                        </CardDescription>
                      </div>
                      <Button
                        onClick={exportarTransacciones}
                        disabled={totalTransacciones === 0}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar CSV
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {transacciones.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <TrendingUp className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">No hay transacciones sincronizadas</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {transacciones.slice(0, 50).map((tx) => (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{tx.descripcion}</p>
                                {tx.conciliado && (
                                  <Badge variant="outline" className="text-xs">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Conciliado
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(tx.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p
                                className={`font-semibold ${tx.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}
                              >
                                {tx.tipo === 'ingreso' ? '+' : '-'}
                                {tx.monto.toFixed(2)} {tx.moneda}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">{tx.tipo}</p>
                            </div>
                          </div>
                        ))}
                        {transacciones.length > 50 && (
                          <p className="text-sm text-muted-foreground text-center pt-2">
                            Mostrando 50 de {transacciones.length} transacciones
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Info Box */}
            <Card className="mt-6 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-blue-900 dark:text-blue-100">
                      Integración con Bankinter (Open Banking PSD2)
                    </p>
                    <p className="text-blue-800 dark:text-blue-200">
                      Esta integración utiliza Redsys PSD2 para conectarse de forma segura con
                      Bankinter. Las transacciones se sincronizan automáticamente y pueden
                      conciliarse con los pagos de alquiler de forma automática.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('/INTEGRACION_BANKINTER_GUIA.pdf', '_blank')}
                        className="gap-2"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Ver Documentación
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Dialog: Confirmar eliminación */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar conexión bancaria?</DialogTitle>
            <DialogDescription>
              Esta acción eliminará la conexión y todas las transacciones sincronizadas. Esta acción
              no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={eliminarConexion}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Ver transacciones de una conexión */}
      <Dialog open={showTransactions} onOpenChange={setShowTransactions}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Transacciones de {selectedConnection?.nombreBanco}</DialogTitle>
            <DialogDescription>
              Transacciones sincronizadas de esta cuenta bancaria
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {selectedConnection?.transactions && selectedConnection.transactions.length > 0 ? (
              <div className="space-y-2">
                {selectedConnection.transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{tx.descripcion}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(tx.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${tx.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {tx.tipo === 'ingreso' ? '+' : '-'}
                        {tx.monto.toFixed(2)} {tx.moneda}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No hay transacciones para esta conexión</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
