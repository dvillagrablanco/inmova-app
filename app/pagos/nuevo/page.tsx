'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { CreditCard, Home, ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { toast } from 'sonner';
import logger, { logError } from '@/lib/logger';
import { AIDocumentAssistant } from '@/components/ai/AIDocumentAssistant';

interface Contract {
  id: string;
  unit: { numero: string; building: { nombre: string } };
  tenant: { nombre?: string; nombreCompleto?: string };
}

function ContractSearchSelect({
  contracts,
  value,
  onValueChange,
}: {
  contracts: Contract[];
  value: string;
  onValueChange: (value: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const getLabel = (c: Contract) =>
    `${c.unit?.building?.nombre || '—'} - ${c.unit?.numero || '—'} (${c.tenant?.nombreCompleto || c.tenant?.nombre || '—'})`;

  const filtered = search
    ? contracts.filter((c) => getLabel(c).toLowerCase().includes(search.toLowerCase()))
    : contracts;

  const selectedContract = contracts.find((c) => c.id === value);

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="Buscar contrato por edificio, unidad o inquilino..."
        value={open ? search : selectedContract ? getLabel(selectedContract) : search}
        onChange={(e) => {
          setSearch(e.target.value);
          if (!open) setOpen(true);
          if (value) onValueChange('');
        }}
        onFocus={() => setOpen(true)}
        className={selectedContract && !open ? 'text-foreground' : ''}
      />
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-popover shadow-md">
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              No se encontraron contratos
            </div>
          ) : (
            filtered.map((contract) => (
              <div
                key={contract.id}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-accent ${contract.id === value ? 'bg-accent font-medium' : ''}`}
                onClick={() => {
                  onValueChange(contract.id);
                  setSearch('');
                  setOpen(false);
                }}
              >
                {getLabel(contract)}
              </div>
            ))
          )}
        </div>
      )}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  );
}

export default function NuevoPagoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const buildingIdFromQuery = searchParams.get('buildingId');
  const { data: session, status } = useSession() || {};
  const [isLoading, setIsLoading] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  // Generar periodo actual: "Marzo 2026"
  const currentPeriod = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const capitalizedPeriod = currentPeriod.charAt(0).toUpperCase() + currentPeriod.slice(1);

  const [formData, setFormData] = useState({
    contractId: '',
    periodo: capitalizedPeriod,
    monto: '0',
    fechaVencimiento: '',
    fechaPago: '',
    estado: 'pendiente',
    metodoPago: 'transferencia',
    concepto: '',
    referencia: '',
    baseImponible: '',
    iva: '',
    irpf: '',
  });

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const q = buildingIdFromQuery
          ? `limit=500&estado=activo&buildingId=${encodeURIComponent(buildingIdFromQuery)}`
          : 'limit=500&estado=activo';
        const response = await fetch(`/api/contracts?${q}`);
        if (response.ok) {
          const json = await response.json();
          const contractsArray = Array.isArray(json) ? json : json.data || [];
          const active = contractsArray.filter((c: any) => c.estado === 'activo');
          setContracts(active);
          if (buildingIdFromQuery && active.length === 1) {
            setFormData((prev) => ({ ...prev, contractId: active[0].id }));
          }
        }
      } catch (error) {
        logger.error('Error fetching contracts:', error);
      }
    };

    if (status === 'authenticated') {
      fetchContracts();
    }
  }, [status, buildingIdFromQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: formData.contractId,
          periodo: formData.periodo,
          monto: parseFloat(formData.monto),
          fechaVencimiento: new Date(formData.fechaVencimiento).toISOString(),
          fechaPago: formData.fechaPago ? new Date(formData.fechaPago).toISOString() : null,
          estado: formData.estado,
          metodoPago: formData.metodoPago,
          concepto: formData.concepto || undefined,
          referencia: formData.referencia || undefined,
          baseImponible: formData.baseImponible ? parseFloat(formData.baseImponible) : undefined,
          iva: formData.iva ? parseFloat(formData.iva) : undefined,
          irpf: formData.irpf ? parseFloat(formData.irpf) : undefined,
        }),
      });

      if (response.ok) {
        toast.success('Pago registrado correctamente');
        router.push('/pagos');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al registrar el pago');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al registrar el pago');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Botón Volver y Breadcrumbs */}
        <div className="flex items-center gap-4 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/pagos')}
            className="gap-2 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Pagos
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
                <BreadcrumbLink href="/pagos">Pagos</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Nuevo Pago</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header Section */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Pago</h1>
          <p className="text-muted-foreground">Registra un nuevo pago o cuota de alquiler</p>
        </div>

        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Información del Pago
            </CardTitle>
            <CardDescription>Completa los datos del pago o cuota de alquiler</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Contrato - Buscador */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="contractId">Contrato *</Label>
                  <ContractSearchSelect
                    contracts={contracts}
                    value={formData.contractId}
                    onValueChange={(value) => setFormData({ ...formData, contractId: value })}
                  />
                </div>

                {/* Periodo */}
                <div className="space-y-2">
                  <Label htmlFor="periodo">Periodo *</Label>
                  <Input
                    id="periodo"
                    name="periodo"
                    value={formData.periodo}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Marzo 2026"
                  />
                </div>

                {/* Importe */}
                <div className="space-y-2">
                  <Label htmlFor="monto">Importe (€) *</Label>
                  <Input
                    id="monto"
                    name="monto"
                    type="number"
                    step="0.01"
                    value={formData.monto}
                    onChange={handleChange}
                    required
                    min="0"
                  />
                </div>

                {/* Fecha de Vencimiento */}
                <div className="space-y-2">
                  <Label htmlFor="fechaVencimiento">Fecha de Vencimiento *</Label>
                  <Input
                    id="fechaVencimiento"
                    name="fechaVencimiento"
                    type="date"
                    value={formData.fechaVencimiento}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Fecha de Pago */}
                <div className="space-y-2">
                  <Label htmlFor="fechaPago">Fecha de Pago (opcional)</Label>
                  <Input
                    id="fechaPago"
                    name="fechaPago"
                    type="date"
                    value={formData.fechaPago}
                    onChange={handleChange}
                  />
                </div>

                {/* Estado */}
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado *</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value) => setFormData({ ...formData, estado: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="pagado">Pagado</SelectItem>
                      <SelectItem value="vencido">Vencido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Método de Pago */}
                <div className="space-y-2">
                  <Label htmlFor="metodoPago">Método de Pago</Label>
                  <Select
                    value={formData.metodoPago}
                    onValueChange={(value) => setFormData({ ...formData, metodoPago: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="tarjeta">Tarjeta</SelectItem>
                      <SelectItem value="domiciliacion">Domiciliación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Desglose Fiscal (opcional) */}
                <div className="space-y-4 pt-4 border-t md:col-span-2">
                  <h4 className="text-sm font-medium">Desglose Fiscal (opcional)</h4>
                  <div className="space-y-2">
                    <Label htmlFor="concepto">Concepto</Label>
                    <Textarea
                      id="concepto"
                      name="concepto"
                      value={formData.concepto}
                      onChange={handleChange}
                      placeholder="Descripción del concepto"
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referencia">Referencia / Nº factura</Label>
                    <Input
                      id="referencia"
                      name="referencia"
                      type="text"
                      value={formData.referencia}
                      onChange={handleChange}
                      placeholder="Opcional"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="baseImponible">Base imponible (€)</Label>
                      <Input
                        id="baseImponible"
                        name="baseImponible"
                        type="number"
                        step="0.01"
                        value={formData.baseImponible}
                        onChange={handleChange}
                        placeholder="Opcional"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="iva">IVA (€)</Label>
                      <Input
                        id="iva"
                        name="iva"
                        type="number"
                        step="0.01"
                        value={formData.iva}
                        onChange={handleChange}
                        placeholder="Opcional"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="irpf">IRPF (€)</Label>
                      <Input
                        id="irpf"
                        name="irpf"
                        type="number"
                        step="0.01"
                        value={formData.irpf}
                        onChange={handleChange}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isLoading || !formData.contractId}>
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Registrar Pago
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/pagos')}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Asistente IA de Documentos para facturas y recibos */}
        <AIDocumentAssistant
          context="facturas"
          variant="floating"
          position="bottom-right"
          onApplyData={(data) => {
            // Aplicar datos extraídos del documento (factura, recibo) al formulario
            if (data.monto || data.importe || data.total) {
              setFormData((prev) => ({ ...prev, monto: data.monto || data.importe || data.total }));
            }
            if (data.fechaPago || data.fecha) {
              const fecha = new Date(data.fechaPago || data.fecha);
              if (!isNaN(fecha.getTime())) {
                setFormData((prev) => ({ ...prev, fechaPago: fecha.toISOString().split('T')[0] }));
              }
            }
            if (data.fechaVencimiento) {
              const fecha = new Date(data.fechaVencimiento);
              if (!isNaN(fecha.getTime())) {
                setFormData((prev) => ({
                  ...prev,
                  fechaVencimiento: fecha.toISOString().split('T')[0],
                }));
              }
            }
            if (data.periodo || data.concepto) {
              setFormData((prev) => ({ ...prev, periodo: data.periodo || data.concepto }));
            }
            if (data.metodoPago) {
              const metodo = data.metodoPago.toLowerCase();
              if (['transferencia', 'efectivo', 'tarjeta', 'domiciliacion'].includes(metodo)) {
                setFormData((prev) => ({ ...prev, metodoPago: metodo }));
              }
            }
            toast.success('Datos del documento aplicados al formulario');
          }}
        />
      </div>
    </AuthenticatedLayout>
  );
}
