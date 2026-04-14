// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AiInsightPanel } from '@/components/ai/AiInsightPanel';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Home,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Euro,
  RefreshCw,
  Search,
  TrendingUp,
  Loader2,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { AIDocumentAssistant } from '@/components/ai/AIDocumentAssistant';

interface Contrato {
  id: string;
  tenantName: string;
  buildingName: string;
  buildingId: string;
  unitNumber: string;
  fechaFin: string;
  rentaMensual: number;
  diasRestantes: number;
  estado: string;
}

interface BatchPreview {
  resumen: {
    totalContratos: number;
    rentaActualTotal: number;
    nuevaRentaTotal: number;
    incrementoTotal: number;
    incrementoPct: number;
  };
  renovaciones: Array<{
    contractId: string;
    inquilino: string;
    edificio: string;
    unidad: string;
    rentaActual: number;
    nuevaRenta: number;
    incremento: number;
  }>;
}

export default function RenovacionesContratosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEdificio, setFilterEdificio] = useState<string>('all');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Batch dialog
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [batchPreview, setBatchPreview] = useState<BatchPreview | null>(null);
  const [incrementoPct, setIncrementoPct] = useState('3.0');
  const [duracionMeses, setDuracionMeses] = useState('12');
  const [batchLoading, setBatchLoading] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') loadContratos();
  }, [status, router]);

  const loadContratos = async () => {
    try {
      const res = await fetch('/api/contracts?limit=1000&estado=activo');
      if (!res.ok) throw new Error('Error cargando contratos');
      const data = await res.json();

      const list = (Array.isArray(data) ? data : data.data || []).map((c: any) => {
        const fechaFin = new Date(c.fechaFin);
        const diasRestantes = differenceInDays(fechaFin, new Date());
        return {
          id: c.id,
          tenantName: c.tenant?.nombreCompleto || 'Sin inquilino',
          buildingName: c.unit?.building?.nombre || 'Sin edificio',
          buildingId: c.unit?.building?.id || '',
          unitNumber: c.unit?.numero || '-',
          fechaFin: c.fechaFin,
          rentaMensual: c.rentaMensual || 0,
          diasRestantes,
          estado: c.estado,
        };
      });

      // Ordenar por días restantes (más urgentes primero)
      list.sort((a: Contrato, b: Contrato) => a.diasRestantes - b.diasRestantes);
      setContratos(list);
    } catch {
      toast.error('Error cargando contratos');
    } finally {
      setLoading(false);
    }
  };

  // Edificios únicos para filtro
  const edificios = [...new Set(contratos.map((c) => c.buildingName))].sort();

  // Filtrado
  const filtered = contratos.filter((c) => {
    const matchSearch =
      c.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.buildingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.unitNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEdificio = filterEdificio === 'all' || c.buildingName === filterEdificio;
    const matchEstado =
      filterEstado === 'all' ||
      (filterEstado === 'por_vencer' && c.diasRestantes <= 90 && c.diasRestantes > 0) ||
      (filterEstado === 'vencido' && c.diasRestantes <= 0) ||
      (filterEstado === 'activo' && c.diasRestantes > 90);
    return matchSearch && matchEdificio && matchEstado;
  });

  // Selección
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id)));
    }
  };

  const selectEdificio = (buildingName: string) => {
    const ids = filtered.filter((c) => c.buildingName === buildingName).map((c) => c.id);
    setSelectedIds(new Set(ids));
  };

  // Batch preview (dry run)
  const previewBatch = async () => {
    if (selectedIds.size === 0) {
      toast.error('Selecciona al menos un contrato');
      return;
    }
    setBatchLoading(true);
    try {
      const res = await fetch('/api/renewals/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractIds: Array.from(selectedIds),
          incrementoPct: parseFloat(incrementoPct),
          duracionMeses: parseInt(duracionMeses),
          dryRun: true,
        }),
      });
      if (!res.ok) throw new Error('Error calculando renovación');
      const data = await res.json();
      setBatchPreview(data);
      setShowBatchDialog(true);
    } catch {
      toast.error('Error al calcular renovación en lote');
    } finally {
      setBatchLoading(false);
    }
  };

  // Apply batch
  const applyBatch = async () => {
    setApplying(true);
    try {
      const res = await fetch('/api/renewals/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractIds: Array.from(selectedIds),
          incrementoPct: parseFloat(incrementoPct),
          duracionMeses: parseInt(duracionMeses),
          dryRun: false,
        }),
      });
      if (!res.ok) throw new Error('Error aplicando renovación');
      const data = await res.json();
      toast.success(
        `${data.resumen.exitosos} contratos renovados (+${incrementoPct}% IPC, ${duracionMeses} meses)`
      );
      setShowBatchDialog(false);
      setSelectedIds(new Set());
      setBatchPreview(null);
      loadContratos();
    } catch {
      toast.error('Error al aplicar renovación');
    } finally {
      setApplying(false);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(n);

  const estadoBadge = (dias: number) => {
    if (dias <= 0)
      return (
        <Badge className="bg-red-100 text-red-700">
          <AlertTriangle className="h-3 w-3 mr-1" /> Vencido
        </Badge>
      );
    if (dias <= 30)
      return (
        <Badge className="bg-orange-100 text-orange-700">
          <Clock className="h-3 w-3 mr-1" /> {dias}d
        </Badge>
      );
    if (dias <= 90)
      return (
        <Badge className="bg-yellow-100 text-yellow-700">
          <Calendar className="h-3 w-3 mr-1" /> {dias}d
        </Badge>
      );
    return (
      <Badge className="bg-green-100 text-green-700">
        <CheckCircle2 className="h-3 w-3 mr-1" /> Activo
      </Badge>
    );
  };

  // KPIs
  const totalContratos = contratos.length;
  const porVencer = contratos.filter((c) => c.diasRestantes > 0 && c.diasRestantes <= 90).length;
  const vencidos = contratos.filter((c) => c.diasRestantes <= 0).length;
  const rentaTotal = contratos.reduce((s, c) => s + c.rentaMensual, 0);

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Renovaciones de Contratos</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Renovaciones de Contratos</h1>
            <p className="text-gray-500">
              Gestiona renovaciones individuales o en lote por edificio
            </p>
          </div>
          <Button
            onClick={previewBatch}
            disabled={selectedIds.size === 0 || batchLoading}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
          >
            {batchLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Layers className="h-4 w-4 mr-2" />
            )}
            Renovar en lote ({selectedIds.size})
          </Button>
        </div>

        {/* Panel IA: Sugerencias de Renovación */}
        <AiInsightPanel
          apiUrl="/api/ai/renewal-suggestions"
          mode="insights"
          title="Sugerencias IA de Renovación"
          transformResponse={(data) => {
            const recs = data.recommendations || [];
            if (recs.length === 0)
              return [
                {
                  id: 'ok',
                  nivel: 'verde',
                  titulo: 'Sin renovaciones próximas',
                  detalle: 'No hay contratos que venzan en los próximos 6 meses.',
                },
              ];
            return recs.slice(0, 12).map((r: any, i: number) => ({
              id: `ren-${i}`,
              nivel:
                r.riskLevel === 'alto' ? 'rojo' : r.riskLevel === 'medio' ? 'amarillo' : 'verde',
              titulo: `${r.building} ${r.unit} — ${r.tenant} (vence ${r.expiryDate})`,
              detalle: r.reason,
              accion:
                r.recommendation === 'no_renovar'
                  ? '⛔ No renovar'
                  : r.recommendation === 'evaluar_no_renovar'
                    ? '⚠️ Evaluar condiciones'
                    : `Subir a ${r.suggestedRent}€/mes (+${r.incrementPercent}%)`,
            }));
          }}
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-sm text-gray-500">Total contratos</div>
              <div className="text-2xl font-bold">{totalContratos}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-orange-500" /> Por vencer (90d)
              </div>
              <div className="text-2xl font-bold text-orange-600">{porVencer}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-red-500" /> Vencidos
              </div>
              <div className="text-2xl font-bold text-red-600">{vencidos}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-sm text-gray-500">Renta mensual total</div>
              <div className="text-2xl font-bold text-green-600">{fmt(rentaTotal)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por inquilino, edificio o unidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterEdificio} onValueChange={setFilterEdificio}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Edificio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los edificios</SelectItem>
              {edificios.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="por_vencer">Por vencer (90d)</SelectItem>
              <SelectItem value="vencido">Vencidos</SelectItem>
              <SelectItem value="activo">Activos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quick select por edificio */}
        {edificios.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-500 py-1">Selección rápida:</span>
            {edificios.map((e) => {
              const count = filtered.filter((c) => c.buildingName === e).length;
              if (count === 0) return null;
              return (
                <Button
                  key={e}
                  variant="outline"
                  size="sm"
                  onClick={() => selectEdificio(e)}
                  className="text-xs"
                >
                  <Building2 className="h-3 w-3 mr-1" />
                  {e} ({count})
                </Button>
              );
            })}
          </div>
        )}

        {/* IPC y duración */}
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="ipc" className="text-sm font-medium">
                  Incremento IPC (%)
                </Label>
                <Input
                  id="ipc"
                  type="number"
                  step="0.1"
                  value={incrementoPct}
                  onChange={(e) => setIncrementoPct(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="duracion" className="text-sm font-medium">
                  Duración renovación (meses)
                </Label>
                <Input
                  id="duracion"
                  type="number"
                  value={duracionMeses}
                  onChange={(e) => setDuracionMeses(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button variant="outline" onClick={selectAll} className="whitespace-nowrap">
                {selectedIds.size === filtered.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de contratos */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-3 text-left w-10">
                      <Checkbox
                        checked={selectedIds.size === filtered.length && filtered.length > 0}
                        onCheckedChange={selectAll}
                      />
                    </th>
                    <th className="p-3 text-left font-medium text-gray-500">Inquilino</th>
                    <th className="p-3 text-left font-medium text-gray-500">Edificio</th>
                    <th className="p-3 text-left font-medium text-gray-500">Unidad</th>
                    <th className="p-3 text-right font-medium text-gray-500">Renta</th>
                    <th className="p-3 text-right font-medium text-gray-500">Vencimiento</th>
                    <th className="p-3 text-center font-medium text-gray-500">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((c) => (
                    <tr
                      key={c.id}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        selectedIds.has(c.id) ? 'bg-indigo-50' : ''
                      }`}
                      onClick={() => toggleSelect(c.id)}
                    >
                      <td className="p-3">
                        <Checkbox
                          checked={selectedIds.has(c.id)}
                          onCheckedChange={() => toggleSelect(c.id)}
                        />
                      </td>
                      <td className="p-3 font-medium text-gray-900">{c.tenantName}</td>
                      <td className="p-3 text-gray-600">{c.buildingName}</td>
                      <td className="p-3 text-gray-600">{c.unitNumber}</td>
                      <td className="p-3 text-right font-medium">{fmt(c.rentaMensual)}</td>
                      <td className="p-3 text-right text-gray-600">
                        {format(new Date(c.fechaFin), 'dd MMM yyyy', { locale: es })}
                      </td>
                      <td className="p-3 text-center">{estadoBadge(c.diasRestantes)}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500">
                        No se encontraron contratos con los filtros actuales.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Batch Confirmation Dialog */}
        <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-600" />
                Confirmar Renovación en Lote
              </DialogTitle>
              <DialogDescription>
                Revisa los cambios antes de aplicarlos. Esta acción actualizará la renta y fecha de
                fin de cada contrato.
              </DialogDescription>
            </DialogHeader>

            {batchPreview && (
              <div className="space-y-4">
                {/* Resumen */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="text-xs text-gray-500">Contratos</div>
                    <div className="text-lg font-bold">{batchPreview.resumen.totalContratos}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="text-xs text-gray-500">Renta actual</div>
                    <div className="text-lg font-bold">
                      {fmt(batchPreview.resumen.rentaActualTotal)}
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <div className="text-xs text-green-600">Nueva renta</div>
                    <div className="text-lg font-bold text-green-700">
                      {fmt(batchPreview.resumen.nuevaRentaTotal)}
                    </div>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-lg text-center">
                    <div className="text-xs text-indigo-600">Incremento</div>
                    <div className="text-lg font-bold text-indigo-700">
                      +{fmt(batchPreview.resumen.incrementoTotal)}/mes
                    </div>
                  </div>
                </div>

                {/* Detalle */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="p-2 text-left text-gray-500">Inquilino</th>
                        <th className="p-2 text-left text-gray-500">Edificio</th>
                        <th className="p-2 text-right text-gray-500">Actual</th>
                        <th className="p-2 text-right text-gray-500">Nueva</th>
                        <th className="p-2 text-right text-gray-500">Δ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {batchPreview.renovaciones.map((r) => (
                        <tr key={r.contractId}>
                          <td className="p-2 font-medium">{r.inquilino}</td>
                          <td className="p-2 text-gray-600">
                            {r.edificio} - {r.unidad}
                          </td>
                          <td className="p-2 text-right">{fmt(r.rentaActual)}</td>
                          <td className="p-2 text-right font-medium text-green-700">
                            {fmt(r.nuevaRenta)}
                          </td>
                          <td className="p-2 text-right text-indigo-600">+{fmt(r.incremento)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowBatchDialog(false)}
                disabled={applying}
              >
                Cancelar
              </Button>
              <Button
                onClick={applyBatch}
                disabled={applying}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
              >
                {applying ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Aplicar Renovación
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <AIDocumentAssistant />
    </AuthenticatedLayout>
  );
}
