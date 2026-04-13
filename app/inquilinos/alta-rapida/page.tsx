'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatUnitTipoLabel } from '@/lib/utils';

interface Unit {
  id: string;
  numero: string;
  tipo: string;
  estado: string;
  rentaMensual: number;
  building?: { nombre?: string; direccion?: string };
}

const STEPS = [
  { id: 1, title: 'Datos del Inquilino' },
  { id: 2, title: 'Seleccionar Unidad' },
  { id: 3, title: 'Configurar Contrato' },
  { id: 4, title: 'Confirmación' },
];

export default function AltaRapidaInquilinoPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [creating, setCreating] = useState(false);

  const [tenantData, setTenantData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    documentoIdentidad: '',
    tipoDocumento: 'dni' as 'dni' | 'nie' | 'pasaporte',
  });

  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [contractData, setContractData] = useState({
    fechaInicio: new Date().toISOString().slice(0, 10),
    duracionMeses: 12,
    rentaMensual: 0,
    tipoIncremento: 'ipc' as 'ipc' | 'fijo',
    mesesFianza: 1,
  });

  const selectedUnit = units.find((u) => u.id === selectedUnitId);

  useEffect(() => {
    if (step === 2) {
      setLoadingUnits(true);
      fetch('/api/units?estado=disponible')
        .then((r) => r.json())
        .then((data) => {
          setUnits(Array.isArray(data) ? data : data?.data ?? []);
          if (selectedUnitId && !Array.isArray(data) && data?.data) {
            const stillExists = data.data.some((u: Unit) => u.id === selectedUnitId);
            if (!stillExists) setSelectedUnitId(null);
          }
        })
        .catch(() => {
          toast.error('Error al cargar unidades');
          setUnits([]);
        })
        .finally(() => setLoadingUnits(false));
    }
  }, [step]);

  useEffect(() => {
    if (selectedUnit && contractData.rentaMensual === 0) {
      setContractData((p) => ({ ...p, rentaMensual: selectedUnit.rentaMensual || 0 }));
    }
  }, [selectedUnit, contractData.rentaMensual]);

  const canProceedStep1 = tenantData.nombre.trim() && tenantData.email.trim() && tenantData.telefono.trim();
  const canProceedStep2 = !!selectedUnitId;
  const canProceedStep3 =
    contractData.fechaInicio &&
    contractData.duracionMeses > 0 &&
    contractData.rentaMensual > 0 &&
    contractData.mesesFianza >= 1;

  const handleNext = () => {
    if (step === 1 && !canProceedStep1) {
      toast.error('Completa nombre, email y teléfono');
      return;
    }
    if (step === 2 && !canProceedStep2) {
      toast.error('Selecciona una unidad');
      return;
    }
    if (step === 3 && !canProceedStep3) {
      toast.error('Completa los datos del contrato');
      return;
    }
    if (step < 4) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleCrearTodo = async () => {
    if (!selectedUnitId || !canProceedStep1 || !canProceedStep3) {
      toast.error('Completa todos los pasos');
      return;
    }

    setCreating(true);
    try {
      const [nombre, ...apellidosParts] = tenantData.nombre.trim().split(/\s+/);
      const apellidos = apellidosParts.length ? apellidosParts.join(' ') : nombre;

      const tenantRes = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          apellidos,
          email: tenantData.email.trim(),
          telefono: tenantData.telefono.trim(),
          dni: tenantData.documentoIdentidad.trim() || undefined,
        }),
      });

      if (!tenantRes.ok) {
        const err = await tenantRes.json();
        throw new Error(err.error || 'Error al crear inquilino');
      }

      const tenant = await tenantRes.json();
      const tenantId = tenant.id;

      const fechaInicio = new Date(contractData.fechaInicio);
      const fechaFin = new Date(fechaInicio);
      fechaFin.setMonth(fechaFin.getMonth() + contractData.duracionMeses);

      const deposito = contractData.rentaMensual * contractData.mesesFianza;

      const contractRes = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId: selectedUnitId,
          tenantId,
          fechaInicio: fechaInicio.toISOString(),
          fechaFin: fechaFin.toISOString(),
          rentaMensual: contractData.rentaMensual,
          deposito,
          diaCobranza: 1,
          estado: 'activo',
        }),
      });

      if (!contractRes.ok) {
        const err = await contractRes.json();
        throw new Error(err.error || 'Error al crear contrato');
      }

      const contract = await contractRes.json();
      toast.success('Inquilino y contrato creados correctamente');

      router.push(`/inquilinos/${tenantId}?created=1&contractId=${contract.id}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al crear');
    } finally {
      setCreating(false);
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-3xl mx-auto space-y-6 p-4 md:p-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/inquilinos">Inquilinos</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Alta Rápida</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors ${
                  step >= s.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted bg-muted text-muted-foreground'
                }`}
              >
                {step > s.id ? <Check className="h-4 w-4" /> : s.id}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-1 h-0.5 w-6 md:w-12 ${
                    step > s.id ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{STEPS[step - 1].title}</CardTitle>
            <CardDescription>
              Paso {step} de 4
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="nombre">Nombre completo</Label>
                  <Input
                    id="nombre"
                    value={tenantData.nombre}
                    onChange={(e) =>
                      setTenantData((p) => ({ ...p, nombre: e.target.value }))
                    }
                    placeholder="Juan García López"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={tenantData.email}
                    onChange={(e) =>
                      setTenantData((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="juan@ejemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={tenantData.telefono}
                    onChange={(e) =>
                      setTenantData((p) => ({ ...p, telefono: e.target.value }))
                    }
                    placeholder="+34 612 345 678"
                  />
                </div>
                <div>
                  <Label htmlFor="tipoDocumento">Tipo documento</Label>
                  <Select
                    value={tenantData.tipoDocumento}
                    onValueChange={(v: 'dni' | 'nie' | 'pasaporte') =>
                      setTenantData((p) => ({ ...p, tipoDocumento: v }))
                    }
                  >
                    <SelectTrigger id="tipoDocumento">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dni">DNI</SelectItem>
                      <SelectItem value="nie">NIE</SelectItem>
                      <SelectItem value="pasaporte">Pasaporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="documentoIdentidad">Documento de identidad</Label>
                  <Input
                    id="documentoIdentidad"
                    value={tenantData.documentoIdentidad}
                    onChange={(e) =>
                      setTenantData((p) => ({
                        ...p,
                        documentoIdentidad: e.target.value,
                      }))
                    }
                    placeholder={
                      tenantData.tipoDocumento === 'dni'
                        ? '12345678A'
                        : tenantData.tipoDocumento === 'nie'
                          ? 'X1234567A'
                          : 'AB123456'
                    }
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                {loadingUnits ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : units.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No hay unidades disponibles. Crea una unidad o libera una existente.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {units.map((u) => (
                      <Card
                        key={u.id}
                        className={`cursor-pointer transition-colors ${
                          selectedUnitId === u.id
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'hover:border-muted-foreground/50'
                        }`}
                        onClick={() => setSelectedUnitId(u.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                {u.building?.nombre || 'Edificio'} - {u.numero}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatUnitTipoLabel(u.tipo)} · {u.rentaMensual}€/mes
                              </p>
                            </div>
                            {selectedUnitId === u.id && (
                              <Badge variant="default">Seleccionada</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="fechaInicio">Fecha de inicio</Label>
                  <Input
                    id="fechaInicio"
                    type="date"
                    value={contractData.fechaInicio}
                    onChange={(e) =>
                      setContractData((p) => ({
                        ...p,
                        fechaInicio: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="duracionMeses">Duración (meses)</Label>
                  <Select
                    value={String(contractData.duracionMeses)}
                    onValueChange={(v) =>
                      setContractData((p) => ({
                        ...p,
                        duracionMeses: parseInt(v, 10),
                      }))
                    }
                  >
                    <SelectTrigger id="duracionMeses">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12 meses</SelectItem>
                      <SelectItem value="24">24 meses</SelectItem>
                      <SelectItem value="36">36 meses</SelectItem>
                      <SelectItem value="60">60 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="rentaMensual">Renta mensual (€)</Label>
                  <Input
                    id="rentaMensual"
                    type="number"
                    min={1}
                    value={contractData.rentaMensual || ''}
                    onChange={(e) =>
                      setContractData((p) => ({
                        ...p,
                        rentaMensual: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="Ej: 850"
                  />
                </div>
                <div>
                  <Label htmlFor="tipoIncremento">Tipo de incremento</Label>
                  <Select
                    value={contractData.tipoIncremento}
                    onValueChange={(v: 'ipc' | 'fijo') =>
                      setContractData((p) => ({ ...p, tipoIncremento: v }))
                    }
                  >
                    <SelectTrigger id="tipoIncremento">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ipc">IPC</SelectItem>
                      <SelectItem value="fijo">Fijo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="mesesFianza">Meses de fianza</Label>
                  <Select
                    value={String(contractData.mesesFianza)}
                    onValueChange={(v) =>
                      setContractData((p) => ({
                        ...p,
                        mesesFianza: parseInt(v, 10),
                      }))
                    }
                  >
                    <SelectTrigger id="mesesFianza">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 mes</SelectItem>
                      <SelectItem value="2">2 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Inquilino</p>
                  <p className="font-medium">{tenantData.nombre}</p>
                  <p>{tenantData.email}</p>
                  <p>{tenantData.telefono}</p>
                  {tenantData.documentoIdentidad && (
                    <p>
                      {tenantData.tipoDocumento.toUpperCase()}: {tenantData.documentoIdentidad}
                    </p>
                  )}
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Unidad</p>
                  <p className="font-medium">
                    {selectedUnit?.building?.nombre} - {selectedUnit?.numero}
                  </p>
                  <p>{selectedUnit?.rentaMensual}€/mes</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Contrato</p>
                  <p>
                    Inicio: {contractData.fechaInicio} · {contractData.duracionMeses} meses
                  </p>
                  <p>
                    Renta: {contractData.rentaMensual}€ · Fianza:{' '}
                    {contractData.rentaMensual * contractData.mesesFianza}€ (
                    {contractData.mesesFianza} meses)
                  </p>
                  <p>Incremento: {contractData.tipoIncremento === 'ipc' ? 'IPC' : 'Fijo'}</p>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack} disabled={step === 1}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
              {step < 4 ? (
                <Button onClick={handleNext} disabled={
                  (step === 1 && !canProceedStep1) ||
                  (step === 2 && !canProceedStep2) ||
                  (step === 3 && !canProceedStep3)
                }>
                  Siguiente
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleCrearTodo} disabled={creating}>
                  {creating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Crear Todo
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
