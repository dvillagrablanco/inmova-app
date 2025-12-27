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
      if (!res.ok) throw new Error('Error');
      const data = await res.json();
      setTransacciones(Array.isArray(data) ? data : []);
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Error loading transactions'), {
        context: 'cargarTransacciones',
      });
      setTransacciones([]);
    }
  };

  const conectarBankinter = async () => {
    try {
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
        window.location.href = data.authUrl;
      }
    } catch (error) {
      toast.error('Error al iniciar conexión bancaria');
      logError(error instanceof Error ? error : new Error('Error connecting bank'), {
        context: 'conectarBankinter',
      });
    }
  };

  const sincronizarConexion = async (connectionId: string) => {
    try {
      setSyncingId(connectionId);
      const res = await fetch('/api/open-banking/bankinter/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId }),
      });

      if (res.ok) {
        toast.success('Sincronización completada');
        await cargarConexiones();
        await cargarTransacciones();
      } else {
        throw new Error('Error en sincronización');
      }
    } catch (error) {
      toast.error('Error al sincronizar');
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

      if (res.ok) {
        toast.success('Conexión eliminada');
        setShowDeleteDialog(false);
        await cargarConexiones();
      } else {
        throw new Error('Error');
      }
    } catch (error) {
      toast.error('Error al eliminar conexión');
    } finally {
      setDeletingId(null);
    }
  };

  const conciliarPagos = async () => {
    try {
      setReconciling(true);
      const res = await fetch('/api/open-banking/reconcile', {
        method: 'POST',
      });

      if (res.ok) {
        toast.success('Conciliación completada');
        await cargarTransacciones();
      } else {
        throw new Error('Error');
      }
    } catch (error) {
      toast.error('Error al conciliar pagos');
    } finally {
      setReconciling(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
      </AuthenticatedLayout>
    );
  }

  if (!session) return null;

  return (
    <AuthenticatedLayout>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="gap-2"
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
          </div>

          {/* Title & Actions */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Building2 className="h-8 w-8 text-primary" />
                Open Banking
              </h1>
              <p className="text-muted-foreground">Conecta tus cuentas bancarias y sincroniza transacciones</p>
            </div>
            <Button onClick={conectarBankinter}>
              <Plus className="h-4 w-4 mr-2" />
              Conectar Banco
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Cuentas Conectadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{conexiones.length}</div>
                <p className="text-xs text-muted-foreground">activas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Transacciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{transacciones.length}</div>
                <p className="text-xs text-muted-foreground">sincronizadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Por Conciliar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {transacciones.filter((t) => !t.conciliado).length}
                </div>
                <p className="text-xs text-muted-foreground">pendientes</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="conexiones">Conexiones</TabsTrigger>
              <TabsTrigger value="transacciones">Transacciones</TabsTrigger>
            </TabsList>

            <TabsContent value="conexiones" className="space-y-4 mt-4">
              {conexiones.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Building2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay cuentas conectadas</h3>
                    <p className="text-muted-foreground mb-4">Conecta tu primera cuenta bancaria</p>
                    <Button onClick={conectarBankinter}>
                      <Plus className="h-4 w-4 mr-2" />
                      Conectar Banco
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {conexiones.map((conn) => (
                    <Card key={conn.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-8 w-8 text-blue-600" />
                            <div>
                              <CardTitle className="text-lg">{conn.nombreBanco}</CardTitle>
                              <CardDescription>
                                {conn.tipoCuenta} •••• {conn.ultimosDigitos}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge
                            variant={conn.estado === 'ACTIVA' ? 'default' : 'secondary'}
                          >
                            {conn.estado}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Última Sync</p>
                            <p className="font-medium">
                              {conn.ultimaSync
                                ? format(new Date(conn.ultimaSync), 'dd MMM yyyy HH:mm', {
                                    locale: es,
                                  })
                                : 'Nunca'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Consentimiento</p>
                            <p className="font-medium">
                              {conn.consentValidUntil
                                ? format(new Date(conn.consentValidUntil), 'dd MMM yyyy', {
                                    locale: es,
                                  })
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sincronizarConexion(conn.id)}
                          disabled={syncingId === conn.id}
                        >
                          <RefreshCw
                            className={`h-4 w-4 mr-2 ${syncingId === conn.id ? 'animate-spin' : ''}`}
                          />
                          Sincronizar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDeletingId(conn.id);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="transacciones" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {transacciones.length} transacciones sincronizadas
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={conciliarPagos}
                  disabled={reconciling}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Conciliar Pagos
                </Button>
              </div>

              {transacciones.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <TrendingUp className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay transacciones</h3>
                    <p className="text-muted-foreground">
                      Sincroniza una conexión bancaria para ver transacciones
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-2">
                  {transacciones.map((tx) => (
                    <Card key={tx.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{tx.descripcion}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(tx.fecha), 'dd MMM yyyy', { locale: es })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-lg font-bold ${
                                tx.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {tx.tipo === 'ingreso' ? '+' : '-'}
                              {tx.moneda} {Math.abs(tx.monto).toLocaleString()}
                            </p>
                            {tx.conciliado && (
                              <Badge variant="outline" className="mt-1">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Conciliado
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar conexión bancaria?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará la conexión y todos sus datos sincronizados.
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
    </AuthenticatedLayout>
  );
}
