'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TrendingUp,
  Calculator,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Home,
  Euro,
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';

interface IPCPreview {
  contractId: string;
  inquilino: string;
  unidad: string;
  rentaActual: number;
  nuevaRenta: number;
  incremento: number;
  incrementoPct: number;
}

interface IPCResult {
  success: boolean;
  dryRun: boolean;
  contratos: IPCPreview[];
  resumen: {
    total: number;
    rentaActualTotal: number;
    nuevaRentaTotal: number;
    incrementoTotal: number;
    ipcPct: number;
  };
  message?: string;
}

export default function ActualizacionIPCPage() {
  const { data: session } = useSession();
  const [ipcPct, setIpcPct] = useState('2.8');
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<IPCResult | null>(null);

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n);

  const handlePreview = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/contracts/apply-ipc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipcPct: parseFloat(ipcPct), dryRun: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        if (data.contratos?.length === 0) {
          toast.info('No hay contratos elegibles para actualización de IPC');
        }
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error al calcular IPC');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!result || result.contratos.length === 0) return;
    setApplying(true);
    try {
      const res = await fetch('/api/contracts/apply-ipc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipcPct: parseFloat(ipcPct), dryRun: false }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`IPC aplicado a ${data.resumen?.total || 0} contratos`);
        setResult(data);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error al aplicar IPC');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setApplying(false);
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/contratos">Contratos</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Actualización IPC</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Actualización de Rentas por IPC
          </h1>
          <p className="text-muted-foreground">
            Calcula y aplica el incremento de IPC a los contratos elegibles
          </p>
        </div>

        {/* Configuración */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Parámetros
            </CardTitle>
            <CardDescription>
              Solo se actualizan contratos activos con tipo de incremento IPC y al menos 12 meses de antigüedad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="ipc">Porcentaje IPC (%)</Label>
                <Input
                  id="ipc"
                  type="number"
                  step="0.1"
                  min="-10"
                  max="50"
                  value={ipcPct}
                  onChange={(e) => setIpcPct(e.target.value)}
                  className="w-32"
                />
              </div>
              <Button onClick={handlePreview} disabled={loading}>
                {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Calculator className="h-4 w-4 mr-2" />}
                Calcular Preview
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        {result && (
          <>
            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground">Contratos Elegibles</p>
                  <p className="text-2xl font-bold">{result.resumen?.total || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground">Renta Actual Total</p>
                  <p className="text-2xl font-bold">{fmt(result.resumen?.rentaActualTotal || 0)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground">Nueva Renta Total</p>
                  <p className="text-2xl font-bold text-green-600">{fmt(result.resumen?.nuevaRentaTotal || 0)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground">Incremento Total/mes</p>
                  <p className="text-2xl font-bold text-blue-600">+{fmt(result.resumen?.incrementoTotal || 0)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabla de contratos */}
            {result.contratos && result.contratos.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Detalle por Contrato</CardTitle>
                    {result.dryRun && (
                      <Button onClick={handleApply} disabled={applying} className="bg-green-600 hover:bg-green-700">
                        {applying ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                        Aplicar IPC a {result.contratos.length} contratos
                      </Button>
                    )}
                    {!result.dryRun && (
                      <Badge className="bg-green-600 text-white">✓ IPC Aplicado</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Inquilino</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead className="text-right">Renta Actual</TableHead>
                        <TableHead className="text-right">Nueva Renta</TableHead>
                        <TableHead className="text-right">Incremento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.contratos.map((c) => (
                        <TableRow key={c.contractId}>
                          <TableCell className="font-medium">{c.inquilino}</TableCell>
                          <TableCell>{c.unidad}</TableCell>
                          <TableCell className="text-right">{fmt(c.rentaActual)}</TableCell>
                          <TableCell className="text-right font-medium text-green-600">{fmt(c.nuevaRenta)}</TableCell>
                          <TableCell className="text-right text-blue-600">+{fmt(c.incremento)} ({c.incrementoPct?.toFixed(1)}%)</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {result.contratos?.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-400" />
                  <p className="text-lg font-medium">No hay contratos elegibles</p>
                  <p className="text-muted-foreground">
                    Los contratos deben tener tipo de incremento IPC y al menos 12 meses de antigüedad.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
