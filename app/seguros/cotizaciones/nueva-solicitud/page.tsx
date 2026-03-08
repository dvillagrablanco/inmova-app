'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  FileText,
  ArrowLeft,
  ArrowRight,
  Check,
  Send,
  Save,
  Building2,
  Shield,
  Users,
  ClipboardList,
  Calendar,
  Euro,
  MapPin,
  Ruler,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const TIPOS_SEGURO = [
  { value: 'incendio', label: 'Incendio' },
  { value: 'robo', label: 'Robo' },
  { value: 'responsabilidad_civil', label: 'Responsabilidad Civil' },
  { value: 'hogar', label: 'Hogar' },
  { value: 'comunidad', label: 'Comunidad / Edificio' },
  { value: 'vida', label: 'Vida' },
  { value: 'accidentes', label: 'Accidentes' },
  { value: 'impago_alquiler', label: 'Impago de Alquiler' },
  { value: 'otro', label: 'Otro' },
];

const COBERTURAS_COMUNES = [
  'Incendio y explosión',
  'Daños por agua',
  'Robo y vandalismo',
  'Responsabilidad civil',
  'Fenómenos atmosféricos',
  'Daños eléctricos',
  'Rotura de cristales',
  'Asistencia en el hogar 24h',
  'Defensa jurídica',
  'Impago de alquiler',
  'Daños estéticos',
  'Inhabilitación de vivienda',
];

const USOS_PRINCIPALES = [
  { value: 'residencial', label: 'Residencial' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'mixto', label: 'Mixto' },
];

const STEPS = [
  { id: 0, label: 'Tipo de Seguro', icon: Shield },
  { id: 1, label: 'Coberturas', icon: ClipboardList },
  { id: 2, label: 'Proveedores', icon: Users },
  { id: 3, label: 'Revisar y Enviar', icon: Send },
];

interface BuildingOption {
  id: string;
  nombre: string;
  direccion: string;
}

interface UnitOption {
  id: string;
  numero: string;
  tipo: string;
  superficie: number;
}

interface Provider {
  id: string;
  nombre: string;
  email: string | null;
  contactoEmail: string | null;
  contactoNombre: string | null;
  tiposSeguro: string[];
  activo: boolean;
  _count?: { quotations: number; quoteRequests: number };
}

interface FormData {
  tipoSeguro: string;
  direccionInmueble: string;
  superficieM2: string;
  anoConstruccion: string;
  usoPrincipal: string;
  sumaAsegurada: string;
  buildingId: string;
  descripcion: string;
  coberturasSolicitadas: string[];
  fechaLimiteRespuesta: string;
  proveedorIds: string[];
}

export default function NuevaSolicitudCotizacionPage() {
  const router = useRouter();
  useSession({ required: true });
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [buildings, setBuildings] = useState<BuildingOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(false);

  const [formData, setFormData] = useState<FormData & { unitId: string }>({
    tipoSeguro: '',
    direccionInmueble: '',
    superficieM2: '',
    anoConstruccion: '',
    usoPrincipal: '',
    sumaAsegurada: '',
    buildingId: '',
    unitId: '',
    descripcion: '',
    coberturasSolicitadas: [],
    fechaLimiteRespuesta: '',
    proveedorIds: [],
  });

  useEffect(() => {
    fetchBuildings();
  }, []);

  useEffect(() => {
    if (currentStep === 2) {
      fetchProviders();
    }
  }, [currentStep]);

  const fetchBuildings = async () => {
    setLoadingBuildings(true);
    try {
      const res = await fetch('/api/buildings');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.buildings ?? data.data ?? []);
        setBuildings(list);
      }
    } catch {
      // non-critical
    } finally {
      setLoadingBuildings(false);
    }
  };

  const fetchProviders = async () => {
    setLoadingProviders(true);
    try {
      const res = await fetch('/api/seguros/proveedores?activo=true');
      if (res.ok) {
        const data = await res.json();
        setProviders(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error('Error al cargar proveedores');
    } finally {
      setLoadingProviders(false);
    }
  };

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCobertura = (cobertura: string) => {
    setFormData((prev) => {
      const exists = prev.coberturasSolicitadas.includes(cobertura);
      return {
        ...prev,
        coberturasSolicitadas: exists
          ? prev.coberturasSolicitadas.filter((c) => c !== cobertura)
          : [...prev.coberturasSolicitadas, cobertura],
      };
    });
  };

  const toggleProvider = (id: string) => {
    setFormData((prev) => {
      const exists = prev.proveedorIds.includes(id);
      return {
        ...prev,
        proveedorIds: exists
          ? prev.proveedorIds.filter((p) => p !== id)
          : [...prev.proveedorIds, id],
      };
    });
  };

  const selectAllProviders = () => {
    setFormData((prev) => ({
      ...prev,
      proveedorIds: providers.map((p) => p.id),
    }));
  };

  const handleBuildingSelect = async (buildingId: string) => {
    const id = buildingId === '_none' ? '' : buildingId;
    updateField('buildingId', id);
    setFormData(prev => ({ ...prev, buildingId: id, unitId: '' }));
    setUnits([]);

    if (id) {
      const building = buildings.find((b) => b.id === id);
      if (building?.direccion && !formData.direccionInmueble) {
        updateField('direccionInmueble', building.direccion);
      }
      // Load units for this building
      setLoadingUnits(true);
      try {
        const res = await fetch(`/api/units?buildingId=${id}`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.data ?? []);
          setUnits(list.map((u: any) => ({ id: u.id, numero: u.numero, tipo: u.tipo, superficie: u.superficie || 0 })));
        }
      } catch {} finally { setLoadingUnits(false); }
    }
  };

  const handleUnitSelect = (unitId: string) => {
    setFormData(prev => ({ ...prev, unitId: unitId === '_none' ? '' : unitId }));
    if (unitId && unitId !== '_none') {
      const unit = units.find(u => u.id === unitId);
      if (unit?.superficie && !formData.superficieM2) {
        updateField('superficieM2', String(unit.superficie));
      }
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        if (!formData.tipoSeguro) {
          toast.error('Selecciona un tipo de seguro');
          return false;
        }
        if (!formData.direccionInmueble.trim()) {
          toast.error('Introduce la dirección del inmueble');
          return false;
        }
        return true;
      case 1:
        if (formData.coberturasSolicitadas.length === 0) {
          toast.error('Selecciona al menos una cobertura');
          return false;
        }
        return true;
      case 2:
        if (formData.proveedorIds.length === 0) {
          toast.error('Selecciona al menos un proveedor');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const goNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((s) => Math.min(s + 1, 3));
    }
  };

  const goBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const buildPayload = () => ({
    tipoSeguro: formData.tipoSeguro,
    descripcion:
      formData.descripcion ||
      `Solicitud de seguro de ${TIPOS_SEGURO.find((t) => t.value === formData.tipoSeguro)?.label ?? formData.tipoSeguro}`,
    direccionInmueble: formData.direccionInmueble || null,
    superficieM2: formData.superficieM2 ? parseFloat(formData.superficieM2) : null,
    anoConstruccion: formData.anoConstruccion ? parseInt(formData.anoConstruccion, 10) : null,
    usoPrincipal: formData.usoPrincipal || null,
    sumaAsegurada: formData.sumaAsegurada ? parseFloat(formData.sumaAsegurada) : null,
    buildingId: formData.buildingId || null,
    coberturasSolicitadas: formData.coberturasSolicitadas,
    fechaLimiteRespuesta: formData.fechaLimiteRespuesta || null,
    proveedorIds: formData.proveedorIds,
  });

  const handleSaveDraft = async () => {
    if (!formData.tipoSeguro) {
      toast.error('Selecciona un tipo de seguro antes de guardar');
      return;
    }
    if (formData.proveedorIds.length === 0) {
      toast.error('Selecciona al menos un proveedor');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/seguros/cotizaciones/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buildPayload(), estado: 'borrador' }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Error al guardar borrador');
      }

      toast.success('Borrador guardado correctamente');
      router.push('/seguros/cotizaciones');
    } catch (error: any) {
      toast.error(error?.message || 'Error al guardar borrador');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndSend = async () => {
    for (let step = 0; step <= 2; step++) {
      if (!validateStep(step)) return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/seguros/cotizaciones/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...buildPayload(), estado: 'enviada' }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Error al crear solicitud');
      }

      const solicitud = await res.json();

      const sendRes = await fetch(`/api/seguros/cotizaciones/solicitudes/${solicitud.id}/enviar`, {
        method: 'POST',
      });

      if (!sendRes.ok) {
        toast.warning(
          'Solicitud creada pero hubo un error al enviar los emails. Puedes reenviar desde el detalle.'
        );
        router.push(`/seguros/cotizaciones/${solicitud.id}`);
        return;
      }

      toast.success('Solicitud creada y enviada a los proveedores');
      router.push(`/seguros/cotizaciones/${solicitud.id}`);
    } catch (error: any) {
      toast.error(error?.message || 'Error al crear y enviar solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTipoLabel = (value: string) =>
    TIPOS_SEGURO.find((t) => t.value === value)?.label ?? value;

  const getUsoLabel = (value: string) =>
    USOS_PRINCIPALES.find((u) => u.value === value)?.label ?? value;

  const selectedBuilding = buildings.find((b) => b.id === formData.buildingId);

  const currencyFormatter = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  });

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="space-y-1">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/seguros">Seguros</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/seguros/cotizaciones">Cotizaciones</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Nueva Solicitud</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Nueva Solicitud de Cotización</h1>
              <p className="text-sm text-muted-foreground">
                Solicita cotizaciones de seguros a múltiples proveedores
              </p>
            </div>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-initial">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                      isCompleted
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isActive
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-muted-foreground/30 text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                  </div>
                  <span
                    className={`text-xs font-medium text-center hidden sm:block ${
                      isActive
                        ? 'text-primary'
                        : isCompleted
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-3 mt-[-1.25rem] sm:mt-0 ${
                      currentStep > step.id ? 'bg-primary' : 'bg-muted-foreground/20'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <Card>
          {/* Step 0: Tipo de Seguro y Datos del Inmueble */}
          {currentStep === 0 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Tipo de Seguro y Datos del Inmueble
                </CardTitle>
                <CardDescription>
                  Define el tipo de seguro y los datos básicos del inmueble a asegurar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tipoSeguro">
                      Tipo de Seguro <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.tipoSeguro}
                      onValueChange={(v) => updateField('tipoSeguro', v)}
                    >
                      <SelectTrigger id="tipoSeguro">
                        <SelectValue placeholder="Seleccionar tipo de seguro" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_SEGURO.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buildingId">Edificio</Label>
                    <Select
                      value={formData.buildingId || '_none'}
                      onValueChange={handleBuildingSelect}
                    >
                      <SelectTrigger id="buildingId">
                        <SelectValue
                          placeholder={loadingBuildings ? 'Cargando...' : 'Seleccionar edificio'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">Sin seleccionar</SelectItem>
                        {buildings.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.nombre} — {b.direccion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Selector de unidad (aparece al seleccionar edificio) */}
                {formData.buildingId && (
                  <div className="space-y-2">
                    <Label htmlFor="unitId">Unidad del edificio (opcional)</Label>
                    <Select
                      value={formData.unitId || '_none'}
                      onValueChange={handleUnitSelect}
                    >
                      <SelectTrigger id="unitId">
                        <SelectValue
                          placeholder={loadingUnits ? 'Cargando unidades...' : 'Seleccionar unidad (todo el edificio si no se selecciona)'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">Todo el edificio</SelectItem>
                        {units.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.numero} — {u.tipo} {u.superficie > 0 ? `(${u.superficie}m²)` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="direccionInmueble">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Dirección del Inmueble <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="direccionInmueble"
                    placeholder="Calle, número, ciudad, código postal"
                    value={formData.direccionInmueble}
                    onChange={(e) => updateField('direccionInmueble', e.target.value)}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="superficieM2">
                      <Ruler className="inline h-4 w-4 mr-1" />
                      Superficie (m²)
                    </Label>
                    <Input
                      id="superficieM2"
                      type="number"
                      min="0"
                      placeholder="Ej: 120"
                      value={formData.superficieM2}
                      onChange={(e) => updateField('superficieM2', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="anoConstruccion">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Año de Construcción
                    </Label>
                    <Input
                      id="anoConstruccion"
                      type="number"
                      min="1800"
                      max={new Date().getFullYear()}
                      placeholder="Ej: 1990"
                      value={formData.anoConstruccion}
                      onChange={(e) => updateField('anoConstruccion', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="usoPrincipal">Uso Principal</Label>
                    <Select
                      value={formData.usoPrincipal}
                      onValueChange={(v) => updateField('usoPrincipal', v)}
                    >
                      <SelectTrigger id="usoPrincipal">
                        <SelectValue placeholder="Seleccionar uso" />
                      </SelectTrigger>
                      <SelectContent>
                        {USOS_PRINCIPALES.map((u) => (
                          <SelectItem key={u.value} value={u.value}>
                            {u.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sumaAsegurada">
                    <Euro className="inline h-4 w-4 mr-1" />
                    Suma Asegurada (€)
                  </Label>
                  <Input
                    id="sumaAsegurada"
                    type="number"
                    min="0"
                    placeholder="Ej: 250000"
                    value={formData.sumaAsegurada}
                    onChange={(e) => updateField('sumaAsegurada', e.target.value)}
                  />
                  {formData.sumaAsegurada && parseFloat(formData.sumaAsegurada) > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {currencyFormatter.format(parseFloat(formData.sumaAsegurada))}
                    </p>
                  )}
                </div>
              </CardContent>
            </>
          )}

          {/* Step 1: Coberturas Solicitadas */}
          {currentStep === 1 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Coberturas Solicitadas
                </CardTitle>
                <CardDescription>
                  Selecciona las coberturas que deseas incluir en la solicitud
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {COBERTURAS_COMUNES.map((cobertura) => {
                    const checked = formData.coberturasSolicitadas.includes(cobertura);
                    return (
                      <label
                        key={cobertura}
                        className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                          checked ? 'border-primary bg-primary/5' : ''
                        }`}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleCobertura(cobertura)}
                        />
                        <span className="text-sm font-medium">{cobertura}</span>
                      </label>
                    );
                  })}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="descripcion">
                    Descripción adicional / Notas para el proveedor
                  </Label>
                  <Textarea
                    id="descripcion"
                    placeholder="Información adicional relevante para la cotización, requisitos especiales, contexto del inmueble..."
                    rows={4}
                    value={formData.descripcion}
                    onChange={(e) => updateField('descripcion', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fechaLimiteRespuesta">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Fecha límite de respuesta
                  </Label>
                  <Input
                    id="fechaLimiteRespuesta"
                    type="date"
                    min={format(new Date(), 'yyyy-MM-dd')}
                    value={formData.fechaLimiteRespuesta}
                    onChange={(e) => updateField('fechaLimiteRespuesta', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Los proveedores verán esta fecha como plazo para enviar su cotización
                  </p>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: Seleccionar Proveedores */}
          {currentStep === 2 && (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Seleccionar Proveedores
                    </CardTitle>
                    <CardDescription>
                      Elige los proveedores a los que enviar la solicitud de cotización
                    </CardDescription>
                  </div>
                  {providers.length > 0 && (
                    <Button type="button" variant="outline" size="sm" onClick={selectAllProviders}>
                      Seleccionar todos
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loadingProviders ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    Cargando proveedores...
                  </div>
                ) : providers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay proveedores</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Añade proveedores de seguros antes de crear una solicitud
                    </p>
                    <Button onClick={() => router.push('/seguros/proveedores')}>
                      Ir a Proveedores
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {providers.map((provider) => {
                      const selected = formData.proveedorIds.includes(provider.id);
                      const contactEmail = provider.contactoEmail || provider.email;

                      return (
                        <div
                          key={provider.id}
                          onClick={() => toggleProvider(provider.id)}
                          className={`relative flex flex-col gap-2 rounded-lg border p-4 cursor-pointer transition-all hover:shadow-sm ${
                            selected
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'hover:border-muted-foreground/40'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={selected}
                                onCheckedChange={() => toggleProvider(provider.id)}
                              />
                              <span className="font-medium text-sm">{provider.nombre}</span>
                            </div>
                            {selected && <Check className="h-4 w-4 text-primary" />}
                          </div>
                          {provider.contactoNombre && (
                            <p className="text-xs text-muted-foreground pl-6 truncate">
                              {provider.contactoNombre}
                            </p>
                          )}
                          {contactEmail && (
                            <p className="text-xs text-muted-foreground pl-6 truncate">
                              {contactEmail}
                            </p>
                          )}
                          {provider.tiposSeguro.length > 0 && (
                            <div className="flex flex-wrap gap-1 pl-6">
                              {provider.tiposSeguro.slice(0, 3).map((tipo) => (
                                <Badge
                                  key={tipo}
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  {getTipoLabel(tipo)}
                                </Badge>
                              ))}
                              {provider.tiposSeguro.length > 3 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  +{provider.tiposSeguro.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {formData.proveedorIds.length > 0 && (
                  <p className="mt-4 text-sm text-muted-foreground">
                    {formData.proveedorIds.length} proveedor
                    {formData.proveedorIds.length !== 1 ? 'es' : ''} seleccionado
                    {formData.proveedorIds.length !== 1 ? 's' : ''}
                  </p>
                )}
              </CardContent>
            </>
          )}

          {/* Step 3: Revisar y Enviar */}
          {currentStep === 3 && (
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Revisar y Enviar
                </CardTitle>
                <CardDescription>
                  Revisa los datos antes de enviar la solicitud a los proveedores
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Insurance details summary */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Datos del Seguro
                  </h3>
                  <div className="rounded-lg border p-4 space-y-2">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <span className="text-xs text-muted-foreground">Tipo de Seguro</span>
                        <p className="font-medium">{getTipoLabel(formData.tipoSeguro)}</p>
                      </div>
                      {formData.usoPrincipal && (
                        <div>
                          <span className="text-xs text-muted-foreground">Uso Principal</span>
                          <p className="font-medium">{getUsoLabel(formData.usoPrincipal)}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Dirección</span>
                      <p className="font-medium">{formData.direccionInmueble}</p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {formData.superficieM2 && (
                        <div>
                          <span className="text-xs text-muted-foreground">Superficie</span>
                          <p className="font-medium">{formData.superficieM2} m²</p>
                        </div>
                      )}
                      {formData.anoConstruccion && (
                        <div>
                          <span className="text-xs text-muted-foreground">Año Construcción</span>
                          <p className="font-medium">{formData.anoConstruccion}</p>
                        </div>
                      )}
                      {formData.sumaAsegurada && (
                        <div>
                          <span className="text-xs text-muted-foreground">Suma Asegurada</span>
                          <p className="font-medium">
                            {currencyFormatter.format(parseFloat(formData.sumaAsegurada))}
                          </p>
                        </div>
                      )}
                    </div>
                    {selectedBuilding && (
                      <div>
                        <span className="text-xs text-muted-foreground">Inmueble vinculado</span>
                        <p className="font-medium">
                          <Building2 className="inline h-3.5 w-3.5 mr-1" />
                          {selectedBuilding.nombre}
                        </p>
                      </div>
                    )}
                    {formData.descripcion && (
                      <div>
                        <span className="text-xs text-muted-foreground">Notas</span>
                        <p className="text-sm whitespace-pre-wrap">{formData.descripcion}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Coverages summary */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Coberturas Solicitadas ({formData.coberturasSolicitadas.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.coberturasSolicitadas.map((c) => (
                      <Badge key={c} variant="secondary">
                        {c}
                      </Badge>
                    ))}
                  </div>
                  {formData.fechaLimiteRespuesta && (
                    <p className="text-sm text-muted-foreground">
                      <Clock className="inline h-3.5 w-3.5 mr-1" />
                      Fecha límite de respuesta:{' '}
                      {format(
                        new Date(formData.fechaLimiteRespuesta + 'T00:00:00'),
                        "d 'de' MMMM, yyyy",
                        { locale: es }
                      )}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Providers summary */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Proveedores Seleccionados ({formData.proveedorIds.length})
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {formData.proveedorIds.map((id) => {
                      const p = providers.find((prov) => prov.id === id);
                      if (!p) return null;
                      return (
                        <div key={id} className="flex items-center gap-2 rounded-lg border p-3">
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{p.nombre}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {p.contactoEmail || p.email}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Email preview */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Vista previa del contenido del email
                  </h3>
                  <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-2">
                    <p>
                      Se enviará un email a cada proveedor seleccionado con la siguiente
                      información:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>
                        Tipo de seguro: <strong>{getTipoLabel(formData.tipoSeguro)}</strong>
                      </li>
                      <li>
                        Dirección del inmueble: <strong>{formData.direccionInmueble}</strong>
                      </li>
                      {formData.superficieM2 && (
                        <li>
                          Superficie: <strong>{formData.superficieM2} m²</strong>
                        </li>
                      )}
                      {formData.anoConstruccion && (
                        <li>
                          Año de construcción: <strong>{formData.anoConstruccion}</strong>
                        </li>
                      )}
                      {formData.usoPrincipal && (
                        <li>
                          Uso principal: <strong>{getUsoLabel(formData.usoPrincipal)}</strong>
                        </li>
                      )}
                      {formData.sumaAsegurada && (
                        <li>
                          Suma asegurada:{' '}
                          <strong>
                            {currencyFormatter.format(parseFloat(formData.sumaAsegurada))}
                          </strong>
                        </li>
                      )}
                      <li>
                        Coberturas solicitadas:{' '}
                        <strong>{formData.coberturasSolicitadas.join(', ')}</strong>
                      </li>
                      {formData.fechaLimiteRespuesta && (
                        <li>
                          Fecha límite de respuesta:{' '}
                          <strong>
                            {format(
                              new Date(formData.fechaLimiteRespuesta + 'T00:00:00'),
                              "d 'de' MMMM, yyyy",
                              { locale: es }
                            )}
                          </strong>
                        </li>
                      )}
                      {formData.descripcion && (
                        <li>
                          Notas adicionales: <strong>{formData.descripcion}</strong>
                        </li>
                      )}
                    </ul>
                    <p className="text-muted-foreground pt-2">
                      Cada proveedor recibirá un enlace para responder con su cotización.
                    </p>
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={currentStep === 0 ? () => router.push('/seguros/cotizaciones') : goBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {currentStep === 0 ? 'Cancelar' : 'Anterior'}
          </Button>

          <div className="flex gap-2">
            {currentStep === 3 ? (
              <>
                <Button variant="outline" onClick={handleSaveDraft} disabled={isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Guardando...' : 'Guardar como Borrador'}
                </Button>
                <Button onClick={handleSaveAndSend} disabled={isSubmitting}>
                  <Send className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Enviando...' : 'Guardar y Enviar'}
                </Button>
              </>
            ) : (
              <Button onClick={goNext}>
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
