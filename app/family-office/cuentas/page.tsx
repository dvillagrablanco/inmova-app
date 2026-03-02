'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Home, Landmark, Link2, Wifi, FileText, ScanLine, CheckCircle2, ExternalLink } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BankEntity {
  id: string;
  name: string;
  country: string;
  type: string;
  integrationLevel: string;
  capabilities: string[];
  notes: string;
  connected: boolean;
  accounts: Array<{
    id: string;
    alias: string | null;
    saldo: number;
    valorMercado: number;
    posiciones: number;
    movimientos: number;
    ultimaSync: string | null;
  }>;
}

interface BankStatusData {
  resumen: {
    entidadesConectadas: number;
    entidadesTotales: number;
    cuentasTotales: number;
    saldoTotal: number;
    valorMercadoTotal: number;
  };
  entidades: BankEntity[];
}

const INTEGRATION_LABELS: Record<string, { label: string; icon: typeof Wifi; color: string; description: string }> = {
  psd2: { label: 'PSD2 / Open Banking', icon: Wifi, color: 'text-green-600 bg-green-50', description: 'Conexión automática. Se te redirigirá al portal del banco para autorizar.' },
  swift: { label: 'SWIFT MT940/MT535', icon: FileText, color: 'text-blue-600 bg-blue-50', description: 'Semi-automático. Sube extractos SWIFT desde la sección de importación.' },
  ocr_pdf: { label: 'OCR PDF (IA)', icon: ScanLine, color: 'text-purple-600 bg-purple-50', description: 'Sube extractos PDF y la IA extraerá los datos automáticamente.' },
  manual: { label: 'Manual', icon: FileText, color: 'text-gray-600 bg-gray-50', description: 'Introduce los datos manualmente.' },
};

export default function CuentasPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BankStatusData | null>(null);

  // Connect bank dialog state
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [connectStep, setConnectStep] = useState<'select' | 'configure' | 'result'>('select');
  const [selectedEntity, setSelectedEntity] = useState<BankEntity | null>(null);
  const [alias, setAlias] = useState('');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectResult, setConnectResult] = useState<{
    success: boolean;
    connectionUrl?: string;
    nextStep?: string;
  } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') loadData();
  }, [status, router]);

  const loadData = async () => {
    try {
      const res = await fetch('/api/family-office/bank-status');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      toast.error('Error cargando estado bancario');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(n);

  const openConnectDialog = () => {
    setConnectStep('select');
    setSelectedEntity(null);
    setAlias('');
    setNumeroCuenta('');
    setConnectResult(null);
    setConnectDialogOpen(true);
  };

  const selectEntity = (entity: BankEntity) => {
    setSelectedEntity(entity);
    setAlias(entity.name);
    setConnectStep('configure');
  };

  const connectBank = async () => {
    if (!selectedEntity) return;
    setConnecting(true);

    try {
      const res = await fetch('/api/family-office/connect-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityId: selectedEntity.id,
          numeroCuenta: numeroCuenta || undefined,
          alias: alias || selectedEntity.name,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        setConnectResult({
          success: true,
          connectionUrl: json.connectionUrl,
          nextStep: json.nextStep,
        });
        setConnectStep('result');
        toast.success(`Cuenta de ${selectedEntity.name} registrada`);
        loadData(); // Recargar lista
      } else {
        toast.error(json.error || 'Error al conectar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const r = data?.resumen || { entidadesConectadas: 0, entidadesTotales: 9, cuentasTotales: 0, saldoTotal: 0, valorMercadoTotal: 0 };
  const entidades = data?.entidades || [];

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/family-office/dashboard">Family Office</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Cuentas</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cuentas y Entidades Bancarias</h1>
            <p className="text-gray-500">Estado de conexión y saldos por entidad</p>
          </div>
          <Button onClick={openConnectDialog} size="sm">
            <Link2 className="h-4 w-4 mr-2" /> Conectar banco
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500 mb-1">Entidades conectadas</div>
              <div className="text-xl font-bold">
                {r.entidadesConectadas} / {r.entidadesTotales}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500 mb-1">Cuentas totales</div>
              <div className="text-xl font-bold">{r.cuentasTotales}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500 mb-1">Saldo total</div>
              <div className="text-xl font-bold">{fmt(r.saldoTotal)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500 mb-1">Valor mercado total</div>
              <div className="text-xl font-bold">{fmt(r.valorMercadoTotal)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de entidades */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entidades bancarias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {entidades.map((e) => {
                const balance = e.accounts.reduce((s, a) => s + a.saldo, 0);
                const valorMercado = e.accounts.reduce((s, a) => s + a.valorMercado, 0);
                const integration = INTEGRATION_LABELS[e.integrationLevel];
                const IntIcon = integration?.icon || FileText;

                return (
                  <div
                    key={e.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Landmark className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {e.name}
                          {integration && (
                            <span className={cn('inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium', integration.color)}>
                              <IntIcon className="h-2.5 w-2.5" />
                              {integration.label}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {e.connected ? (
                            <>
                              {e.accounts.length} cuenta(s) · Saldo: {fmt(balance)}
                              {valorMercado > 0 && ` · Valor mercado: ${fmt(valorMercado)}`}
                            </>
                          ) : (
                            <span className="text-gray-400">Sin cuentas conectadas</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!e.connected && (
                        <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => { setConnectDialogOpen(true); selectEntity(e); }}>
                          Conectar
                        </Button>
                      )}
                      <Badge variant={e.connected ? 'default' : 'secondary'}>
                        {e.connected ? 'Conectado' : 'No conectado'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {entidades.length === 0 && (
                <div className="text-center text-gray-400 py-8">No hay entidades configuradas.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── DIALOG: CONECTAR BANCO ─── */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          {/* STEP 1: Seleccionar entidad */}
          {connectStep === 'select' && (
            <>
              <DialogHeader>
                <DialogTitle>Conectar entidad bancaria</DialogTitle>
                <DialogDescription>
                  Selecciona la entidad que deseas conectar. Cada una tiene un método de integración diferente.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 max-h-[400px] overflow-y-auto py-2">
                {entidades.filter((e) => !e.connected).map((entity) => {
                  const integration = INTEGRATION_LABELS[entity.integrationLevel];
                  const IntIcon = integration?.icon || FileText;

                  return (
                    <button
                      key={entity.id}
                      onClick={() => selectEntity(entity)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <Landmark className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{entity.name}</div>
                        <div className="text-xs text-gray-500 truncate">{entity.notes}</div>
                      </div>
                      {integration && (
                        <span className={cn('inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-medium shrink-0', integration.color)}>
                          <IntIcon className="h-3 w-3" />
                          {integration.label}
                        </span>
                      )}
                    </button>
                  );
                })}
                {entidades.filter((e) => !e.connected).length === 0 && (
                  <div className="text-center text-gray-400 py-6">
                    Todas las entidades ya están conectadas.
                  </div>
                )}
              </div>
            </>
          )}

          {/* STEP 2: Configurar conexión */}
          {connectStep === 'configure' && selectedEntity && (
            <>
              <DialogHeader>
                <DialogTitle>Conectar {selectedEntity.name}</DialogTitle>
                <DialogDescription>
                  {INTEGRATION_LABELS[selectedEntity.integrationLevel]?.description}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                {/* Integration level badge */}
                <div className="flex items-center gap-2">
                  {(() => {
                    const integration = INTEGRATION_LABELS[selectedEntity.integrationLevel];
                    const IntIcon = integration?.icon || FileText;
                    return (
                      <span className={cn('inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium', integration?.color)}>
                        <IntIcon className="h-3.5 w-3.5" />
                        {integration?.label}
                      </span>
                    );
                  })()}
                  <span className="text-xs text-gray-400">
                    {selectedEntity.capabilities.join(', ')}
                  </span>
                </div>

                <div>
                  <Label htmlFor="alias" className="text-sm">Alias de la cuenta</Label>
                  <Input
                    id="alias"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    placeholder={`Ej: ${selectedEntity.name} - Principal`}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="numeroCuenta" className="text-sm">Número de cuenta (opcional)</Label>
                  <Input
                    id="numeroCuenta"
                    value={numeroCuenta}
                    onChange={(e) => setNumeroCuenta(e.target.value)}
                    placeholder="ES00 0000 0000 00 0000000000"
                    className="mt-1"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setConnectStep('select')}>
                  Atrás
                </Button>
                <Button onClick={connectBank} disabled={connecting}>
                  {connecting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4 mr-2" />
                  )}
                  {connecting ? 'Conectando...' : 'Conectar'}
                </Button>
              </DialogFooter>
            </>
          )}

          {/* STEP 3: Resultado */}
          {connectStep === 'result' && connectResult && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Cuenta registrada
                </DialogTitle>
                <DialogDescription>
                  {connectResult.nextStep}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                {connectResult.connectionUrl && (
                  <a
                    href={connectResult.connectionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Autorizar conexión en el banco
                  </a>
                )}
                {!connectResult.connectionUrl && selectedEntity?.integrationLevel === 'swift' && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setConnectDialogOpen(false);
                      router.push('/family-office/cuentas');
                      toast.info('Sube extractos SWIFT desde la sección de importación');
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Ir a importar extractos
                  </Button>
                )}
                {!connectResult.connectionUrl && selectedEntity?.integrationLevel === 'ocr_pdf' && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setConnectDialogOpen(false);
                      toast.info('Sube extractos PDF desde la sección de importación');
                    }}
                  >
                    <ScanLine className="h-4 w-4 mr-2" />
                    Ir a importar PDFs
                  </Button>
                )}
              </div>
              <DialogFooter>
                <Button onClick={() => setConnectDialogOpen(false)}>
                  Cerrar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
