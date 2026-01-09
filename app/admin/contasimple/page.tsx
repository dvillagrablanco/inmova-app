'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Calculator,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  FileText,
  CreditCard,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Save,
  Eye,
  EyeOff,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ContasimpleStatus {
  configured: boolean;
  enabled: boolean;
  lastSync?: string;
  invoicesSynced?: number;
  pendingSync?: number;
}

interface SyncedInvoice {
  id: string;
  numeroFactura: string;
  company: { nombre: string };
  total: number;
  estado: string;
  contasimpleInvoiceId: string | null;
  createdAt: string;
}

export default function ContasimplePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const [integrationStatus, setIntegrationStatus] = useState<ContasimpleStatus>({
    configured: false,
    enabled: false,
  });
  
  const [config, setConfig] = useState({
    authKey: '',
    enabled: false,
  });
  
  const [showAuthKey, setShowAuthKey] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [syncedInvoices, setSyncedInvoices] = useState<SyncedInvoice[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<SyncedInvoice[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'super_admin') {
        router.push('/dashboard');
        toast.error('Solo Super Admin puede acceder a esta página');
        return;
      }
      loadStatus();
      loadInvoices();
    }
  }, [status, session, router]);

  const loadStatus = async () => {
    try {
      setLoading(true);
      // Check environment variables for platform-level config
      const response = await fetch('/api/admin/integrations/contasimple/status');
      if (response.ok) {
        const data = await response.json();
        setIntegrationStatus(data);
        setConfig({
          authKey: data.authKeyMasked || '',
          enabled: data.enabled || false,
        });
      }
    } catch (error) {
      console.error('Error loading status:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      // Load synced and pending invoices
      const [syncedRes, pendingRes] = await Promise.all([
        fetch('/api/admin/integrations/contasimple/invoices?synced=true'),
        fetch('/api/admin/integrations/contasimple/invoices?synced=false'),
      ]);
      
      if (syncedRes.ok) {
        const data = await syncedRes.json();
        setSyncedInvoices(data.invoices || []);
      }
      
      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setPendingInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const handleSaveConfig = async () => {
    if (!config.authKey || config.authKey.startsWith('****')) {
      toast.error('Por favor introduce la clave de autorización');
      return;
    }
    
    setSaving(true);
    try {
      const response = await fetch('/api/admin/integrations/contasimple/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authKey: config.authKey,
          enabled: config.enabled,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error guardando configuración');
      }
      
      toast.success('Configuración guardada correctamente');
      setShowConfigDialog(false);
      loadStatus();
    } catch (error: any) {
      toast.error(error.message || 'Error guardando configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/admin/integrations/contasimple/test', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('✅ Conexión exitosa con Contasimple');
      } else {
        toast.error(data.error || 'Error de conexión');
      }
    } catch (error) {
      toast.error('Error probando conexión');
    } finally {
      setTesting(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/admin/integrations/contasimple/sync', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Sincronización completada: ${data.synced} facturas sincronizadas`);
        loadInvoices();
        loadStatus();
      } else {
        toast.error(data.error || 'Error en sincronización');
      }
    } catch (error) {
      toast.error('Error sincronizando facturas');
    } finally {
      setSyncing(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Calculator className="h-8 w-8 text-blue-600" />
              Contabilidad - Contasimple
            </h1>
            <p className="text-muted-foreground mt-1">
              Integración de facturación B2B de Inmova con Contasimple
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.open('https://app.contasimple.com', '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir Contasimple
            </Button>
            <Button onClick={() => setShowConfigDialog(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Configurar
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <div className="flex items-center gap-2 mt-1">
                    {integrationStatus.configured ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-semibold text-green-600">Conectado</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="font-semibold text-red-600">No configurado</span>
                      </>
                    )}
                  </div>
                </div>
                <Zap className={`h-8 w-8 ${integrationStatus.configured ? 'text-green-500' : 'text-gray-300'}`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Facturas Sincronizadas</p>
                  <p className="text-2xl font-bold mt-1">{syncedInvoices.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes de Sync</p>
                  <p className="text-2xl font-bold mt-1">{pendingInvoices.length}</p>
                </div>
                <AlertTriangle className={`h-8 w-8 ${pendingInvoices.length > 0 ? 'text-yellow-500' : 'text-gray-300'}`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Facturado</p>
                  <p className="text-2xl font-bold mt-1">
                    €{syncedInvoices.reduce((sum, inv) => sum + inv.total, 0).toLocaleString('es-ES')}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vista General</TabsTrigger>
            <TabsTrigger value="synced">Facturas Sincronizadas</TabsTrigger>
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Integration Info */}
            <Card>
              <CardHeader>
                <CardTitle>Información de Integración</CardTitle>
                <CardDescription>
                  Contasimple gestiona la contabilidad oficial de Inmova
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">¿Qué hace esta integración?</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        Sincroniza facturas B2B de Inmova con Contasimple
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        Registra pagos de Stripe automáticamente
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        Crea clientes en Contasimple por cada empresa B2B
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        Genera facturas oficiales con numeración legal
                      </li>
                    </ul>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold">Acciones</h4>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        onClick={handleTestConnection}
                        disabled={testing || !integrationStatus.configured}
                      >
                        {testing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Zap className="mr-2 h-4 w-4" />
                        )}
                        Probar Conexión
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleSyncAll}
                        disabled={syncing || !integrationStatus.configured || pendingInvoices.length === 0}
                      >
                        {syncing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Sincronizar Pendientes ({pendingInvoices.length})
                      </Button>
                    </div>
                  </div>
                </div>

                {!integrationStatus.configured && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-yellow-800">Configuración Requerida</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Para usar la integración con Contasimple, configura las credenciales de API
                          en las variables de entorno:
                        </p>
                        <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside">
                          <li><code>INMOVA_CONTASIMPLE_AUTH_KEY</code> - Clave de autorización</li>
                          <li><code>CONTASIMPLE_API_URL</code> - URL del API (opcional)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="synced">
            <Card>
              <CardHeader>
                <CardTitle>Facturas Sincronizadas</CardTitle>
                <CardDescription>
                  Facturas B2B que ya están en Contasimple
                </CardDescription>
              </CardHeader>
              <CardContent>
                {syncedInvoices.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay facturas sincronizadas
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nº Factura</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>ID Contasimple</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {syncedInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.numeroFactura}</TableCell>
                          <TableCell>{invoice.company?.nombre || '-'}</TableCell>
                          <TableCell>€{invoice.total.toLocaleString('es-ES')}</TableCell>
                          <TableCell>
                            <Badge variant={invoice.estado === 'PAGADA' ? 'default' : 'secondary'}>
                              {invoice.estado}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs">{invoice.contasimpleInvoiceId}</code>
                          </TableCell>
                          <TableCell>
                            {format(new Date(invoice.createdAt), 'dd/MM/yyyy', { locale: es })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Facturas Pendientes de Sincronizar</CardTitle>
                    <CardDescription>
                      Facturas B2B que aún no están en Contasimple
                    </CardDescription>
                  </div>
                  {pendingInvoices.length > 0 && (
                    <Button onClick={handleSyncAll} disabled={syncing || !integrationStatus.configured}>
                      {syncing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Sincronizar Todas
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {pendingInvoices.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      ¡Todas las facturas están sincronizadas!
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nº Factura</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.numeroFactura}</TableCell>
                          <TableCell>{invoice.company?.nombre || '-'}</TableCell>
                          <TableCell>€{invoice.total.toLocaleString('es-ES')}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{invoice.estado}</Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(invoice.createdAt), 'dd/MM/yyyy', { locale: es })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Config Dialog */}
        <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configurar Contasimple</DialogTitle>
              <DialogDescription>
                Configura las credenciales de la API de Contasimple para Inmova
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="authKey">Clave de Autorización (Auth Key)</Label>
                <div className="relative">
                  <Input
                    id="authKey"
                    type={showAuthKey ? 'text' : 'password'}
                    value={config.authKey}
                    onChange={(e) => setConfig({ ...config, authKey: e.target.value })}
                    placeholder="Tu clave de API de Contasimple"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAuthKey(!showAuthKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showAuthKey ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Obtén tu clave en Contasimple → Configuración → API
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enabled">Integración Activa</Label>
                  <p className="text-xs text-muted-foreground">
                    Activar sincronización automática
                  </p>
                </div>
                <Switch
                  id="enabled"
                  checked={config.enabled}
                  onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveConfig} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
