'use client';

/**
 * WIZARD DE CONTRATO DE MEDIA ESTANCIA
 * 
 * Componente multi-paso para crear contratos de alquiler temporal (1-11 meses)
 * con validaciones legales, cálculo de prorrateo y gestión de inventario.
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, addMonths, differenceInMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Info,
  Home,
  User,
  FileText,
  Calculator,
  Wifi,
  Droplets,
  Zap,
  Flame,
  Sparkles,
  ClipboardList,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ==========================================
// TIPOS
// ==========================================

interface MediumTermContractWizardProps {
  onComplete?: (contract: any) => void;
  onCancel?: () => void;
  preselectedUnit?: {
    id: string;
    direccion: string;
    ciudad: string;
    superficie?: number;
    habitaciones?: number;
    banos?: number;
  };
  preselectedTenant?: {
    id: string;
    nombre: string;
    email: string;
  };
}

interface FormData {
  // Paso 1: Propiedad e Inquilino
  unitId: string;
  tenantId: string;
  
  // Paso 2: Tipo y Duración
  tipoArrendamiento: 'temporada' | 'vivienda_habitual';
  motivoTemporalidad: string;
  descripcionMotivo: string;
  fechaInicio: string;
  fechaFin: string;
  
  // Paso 3: Económico
  rentaMensual: number;
  mesesFianza: number;
  depositoSuministros: number;
  
  // Paso 4: Servicios
  serviciosIncluidos: {
    wifi: boolean;
    agua: boolean;
    luz: boolean;
    gas: boolean;
    calefaccion: boolean;
    limpieza: boolean;
    limpiezaFrecuencia?: string;
    comunidad: boolean;
    seguro: boolean;
  };
  limiteConsumoLuz?: number;
  limiteConsumoAgua?: number;
  limiteConsumoGas?: number;
  
  // Paso 5: Condiciones
  prorrateable: boolean;
  penalizacionDesistimiento: number;
  diasPreaviso: number;
  clausulasAdicionales: string;
}

interface ProrrateoData {
  diasPrimerMes: number;
  diasUltimoMes: number;
  mesesCompletos: number;
  importePrimerMes: number;
  importeUltimoMes: number;
  importeTotal: number;
  resumenTexto: string;
}

interface ValidationResult {
  esValido: boolean;
  errores: string[];
  advertencias: string[];
  fianzaRequerida: number;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export function MediumTermContractWizard({
  onComplete,
  onCancel,
  preselectedUnit,
  preselectedTenant,
}: MediumTermContractWizardProps) {
  // Estado
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prorrateo, setProrrateo] = useState<ProrrateoData | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [pricingSuggestion, setPricingSuggestion] = useState<number | null>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);
  
  // Form
  const [formData, setFormData] = useState<FormData>({
    unitId: preselectedUnit?.id || '',
    tenantId: preselectedTenant?.id || '',
    tipoArrendamiento: 'temporada',
    motivoTemporalidad: '',
    descripcionMotivo: '',
    fechaInicio: format(new Date(), 'yyyy-MM-dd'),
    fechaFin: format(addMonths(new Date(), 6), 'yyyy-MM-dd'),
    rentaMensual: 0,
    mesesFianza: 2,
    depositoSuministros: 0,
    serviciosIncluidos: {
      wifi: true,
      agua: true,
      luz: false,
      gas: false,
      calefaccion: false,
      limpieza: false,
      comunidad: false,
      seguro: false,
    },
    prorrateable: true,
    penalizacionDesistimiento: 50,
    diasPreaviso: 30,
    clausulasAdicionales: '',
  });
  
  // ==========================================
  // EFECTOS
  // ==========================================
  
  // Calcular prorrateo cuando cambian las fechas
  useEffect(() => {
    if (formData.fechaInicio && formData.fechaFin && formData.rentaMensual > 0) {
      calcularProrrateo();
    }
  }, [formData.fechaInicio, formData.fechaFin, formData.rentaMensual]);
  
  // Validar contrato cuando cambian datos relevantes
  useEffect(() => {
    if (formData.tipoArrendamiento && formData.fechaInicio && formData.fechaFin) {
      validarContrato();
    }
  }, [formData.tipoArrendamiento, formData.motivoTemporalidad, formData.fechaInicio, formData.fechaFin]);
  
  // ==========================================
  // FUNCIONES
  // ==========================================
  
  const calcularProrrateo = async () => {
    try {
      const response = await fetch('/api/contracts/medium-term/prorate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fechaInicio: formData.fechaInicio,
          fechaFin: formData.fechaFin,
          rentaMensual: formData.rentaMensual,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setProrrateo(data.data);
      }
    } catch (error) {
      console.error('Error calculando prorrateo:', error);
    }
  };
  
  const validarContrato = () => {
    const fechaInicio = new Date(formData.fechaInicio);
    const fechaFin = new Date(formData.fechaFin);
    const duracionMeses = differenceInMonths(fechaFin, fechaInicio);
    
    const errores: string[] = [];
    const advertencias: string[] = [];
    
    // Validaciones básicas
    if (fechaFin <= fechaInicio) {
      errores.push('La fecha de fin debe ser posterior a la fecha de inicio');
    }
    
    // Validaciones específicas para temporada
    if (formData.tipoArrendamiento === 'temporada') {
      if (!formData.motivoTemporalidad) {
        errores.push('Debe especificar el motivo de temporalidad');
      }
      if (duracionMeses > 11) {
        errores.push('Los contratos de temporada no pueden exceder 11 meses');
      }
      if (duracionMeses < 1) {
        advertencias.push('Contratos menores a 1 mes podrían considerarse vacacionales');
      }
    }
    
    // Calcular fianza requerida
    const fianzaRequerida = formData.tipoArrendamiento === 'temporada' 
      ? formData.rentaMensual * 2 
      : formData.rentaMensual;
    
    setValidation({
      esValido: errores.length === 0,
      errores,
      advertencias,
      fianzaRequerida,
    });
  };
  
  const obtenerSugerenciaPricing = async () => {
    if (!preselectedUnit) return;
    
    setIsLoadingPricing(true);
    try {
      const response = await fetch('/api/contracts/medium-term/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inmueble: {
            ciudad: preselectedUnit.ciudad,
            codigoPostal: '28001', // Simplificado
            superficie: preselectedUnit.superficie || 60,
            habitaciones: preselectedUnit.habitaciones || 2,
            banos: preselectedUnit.banos || 1,
            amueblado: true,
            extras: [],
            estadoConservacion: 'bueno',
          },
          parametros: {
            duracionMeses: differenceInMonths(
              new Date(formData.fechaFin),
              new Date(formData.fechaInicio)
            ),
            fechaInicio: formData.fechaInicio,
            serviciosIncluidos: Object.entries(formData.serviciosIncluidos)
              .filter(([_, v]) => v)
              .map(([k]) => k),
            aceptaMascotas: false,
            aceptaFumadores: false,
          },
          incluirAnalisisIA: false,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setPricingSuggestion(data.data.pricing.precioRecomendado);
        toast.success(`Precio sugerido: ${data.data.pricing.precioRecomendado}€/mes`);
      }
    } catch (error) {
      console.error('Error obteniendo pricing:', error);
      toast.error('No se pudo obtener sugerencia de precio');
    } finally {
      setIsLoadingPricing(false);
    }
  };
  
  const handleSubmit = async () => {
    if (!validation?.esValido) {
      toast.error('Por favor, corrija los errores antes de continuar');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contracts/medium-term', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fechaInicio: new Date(formData.fechaInicio).toISOString(),
          fechaFin: new Date(formData.fechaFin).toISOString(),
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success('Contrato creado correctamente');
        onComplete?.(data.data);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error creando contrato');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error creando contrato');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  const updateServicio = (servicio: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      serviciosIncluidos: {
        ...prev.serviciosIncluidos,
        [servicio]: value,
      },
    }));
  };
  
  // ==========================================
  // PASOS DEL WIZARD
  // ==========================================
  
  const steps = [
    { number: 1, title: 'Propiedad', icon: Home },
    { number: 2, title: 'Tipo y Duración', icon: Calendar },
    { number: 3, title: 'Económico', icon: Calculator },
    { number: 4, title: 'Servicios', icon: Wifi },
    { number: 5, title: 'Revisión', icon: CheckCircle2 },
  ];
  
  const duracionMeses = differenceInMonths(
    new Date(formData.fechaFin),
    new Date(formData.fechaInicio)
  );
  
  // ==========================================
  // RENDER
  // ==========================================
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Contrato de Media Estancia</h2>
          <Badge variant={formData.tipoArrendamiento === 'temporada' ? 'default' : 'secondary'}>
            {formData.tipoArrendamiento === 'temporada' ? 'LAU Art. 3.2' : 'LAU Art. 2'}
          </Badge>
        </div>
        
        {/* Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div 
                className={cn(
                  "flex items-center gap-2",
                  currentStep >= step.number ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  currentStep > step.number 
                    ? "bg-primary text-primary-foreground" 
                    : currentStep === step.number 
                      ? "bg-primary/20 text-primary border-2 border-primary" 
                      : "bg-muted"
                )}>
                  {currentStep > step.number ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span className="hidden sm:inline text-sm font-medium">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "flex-1 h-1 mx-2",
                  currentStep > step.number ? "bg-primary" : "bg-muted"
                )} />
              )}
            </React.Fragment>
          ))}
        </div>
        
        <Progress value={(currentStep / steps.length) * 100} className="mt-4" />
      </div>
      
      {/* Validation Alerts */}
      {validation?.errores.length > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Errores de validación</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside">
              {validation.errores.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      {validation?.advertencias.length > 0 && (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Advertencias</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside">
              {validation.advertencias.map((adv, i) => (
                <li key={i}>{adv}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Content */}
      <Card>
        <CardContent className="pt-6">
          {/* PASO 1: Propiedad e Inquilino */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Selección de Propiedad e Inquilino</h3>
                
                {preselectedUnit ? (
                  <div className="p-4 bg-muted rounded-lg mb-4">
                    <Label className="text-sm text-muted-foreground">Propiedad seleccionada</Label>
                    <p className="font-medium">{preselectedUnit.direccion}</p>
                    <p className="text-sm text-muted-foreground">{preselectedUnit.ciudad}</p>
                    {preselectedUnit.superficie && (
                      <p className="text-sm">{preselectedUnit.superficie}m² · {preselectedUnit.habitaciones} hab · {preselectedUnit.banos} baños</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="unitId">ID de Unidad</Label>
                    <Input
                      id="unitId"
                      value={formData.unitId}
                      onChange={(e) => updateFormData('unitId', e.target.value)}
                      placeholder="Seleccione o introduzca el ID de la unidad"
                    />
                  </div>
                )}
                
                {preselectedTenant ? (
                  <div className="p-4 bg-muted rounded-lg">
                    <Label className="text-sm text-muted-foreground">Inquilino seleccionado</Label>
                    <p className="font-medium">{preselectedTenant.nombre}</p>
                    <p className="text-sm text-muted-foreground">{preselectedTenant.email}</p>
                  </div>
                ) : (
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="tenantId">ID de Inquilino</Label>
                    <Input
                      id="tenantId"
                      value={formData.tenantId}
                      onChange={(e) => updateFormData('tenantId', e.target.value)}
                      placeholder="Seleccione o introduzca el ID del inquilino"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* PASO 2: Tipo y Duración */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Tipo de Arrendamiento y Duración</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer transition-all",
                      formData.tipoArrendamiento === 'temporada' 
                        ? "border-primary bg-primary/5" 
                        : "hover:border-primary/50"
                    )}
                    onClick={() => updateFormData('tipoArrendamiento', 'temporada')}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5" />
                      <span className="font-medium">Temporada</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      1-11 meses. Requiere motivo justificado. Fianza: 2 meses.
                    </p>
                    <Badge variant="outline" className="mt-2">LAU Art. 3.2</Badge>
                  </div>
                  
                  <div
                    className={cn(
                      "p-4 border rounded-lg cursor-pointer transition-all",
                      formData.tipoArrendamiento === 'vivienda_habitual' 
                        ? "border-primary bg-primary/5" 
                        : "hover:border-primary/50"
                    )}
                    onClick={() => updateFormData('tipoArrendamiento', 'vivienda_habitual')}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Home className="w-5 h-5" />
                      <span className="font-medium">Vivienda Habitual</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      12+ meses. Prórroga obligatoria hasta 5 años. Fianza: 1 mes.
                    </p>
                    <Badge variant="outline" className="mt-2">LAU Art. 2</Badge>
                  </div>
                </div>
                
                {formData.tipoArrendamiento === 'temporada' && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="motivoTemporalidad">Motivo de la Estancia Temporal *</Label>
                      <Select
                        value={formData.motivoTemporalidad}
                        onValueChange={(value) => updateFormData('motivoTemporalidad', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione el motivo..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trabajo">Desplazamiento laboral</SelectItem>
                          <SelectItem value="estudios">Estudios (curso, máster, Erasmus)</SelectItem>
                          <SelectItem value="tratamiento_medico">Tratamiento médico</SelectItem>
                          <SelectItem value="proyecto_profesional">Proyecto profesional temporal</SelectItem>
                          <SelectItem value="transicion">Transición entre viviendas</SelectItem>
                          <SelectItem value="turismo_extendido">Turismo extendido (1-3 meses)</SelectItem>
                          <SelectItem value="otro">Otro motivo justificado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="descripcionMotivo">Descripción del motivo</Label>
                      <Textarea
                        id="descripcionMotivo"
                        value={formData.descripcionMotivo}
                        onChange={(e) => updateFormData('descripcionMotivo', e.target.value)}
                        placeholder="Describa brevemente el motivo de la estancia temporal..."
                        rows={3}
                      />
                    </div>
                  </div>
                )}
                
                <Separator className="my-6" />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fechaInicio">Fecha de Inicio</Label>
                    <Input
                      id="fechaInicio"
                      type="date"
                      value={formData.fechaInicio}
                      onChange={(e) => updateFormData('fechaInicio', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fechaFin">Fecha de Fin</Label>
                    <Input
                      id="fechaFin"
                      type="date"
                      value={formData.fechaFin}
                      onChange={(e) => updateFormData('fechaFin', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-primary/5 rounded-lg flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span>
                    Duración: <strong>{duracionMeses} meses</strong>
                    {duracionMeses > 11 && formData.tipoArrendamiento === 'temporada' && (
                      <Badge variant="destructive" className="ml-2">Excede máximo</Badge>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* PASO 3: Económico */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Condiciones Económicas</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rentaMensual">Renta Mensual (€)</Label>
                    <div className="relative">
                      <Input
                        id="rentaMensual"
                        type="number"
                        value={formData.rentaMensual || ''}
                        onChange={(e) => updateFormData('rentaMensual', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="pr-24"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="absolute right-1 top-1"
                        onClick={obtenerSugerenciaPricing}
                        disabled={isLoadingPricing}
                      >
                        {isLoadingPricing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-1" />
                            IA
                          </>
                        )}
                      </Button>
                    </div>
                    {pricingSuggestion && (
                      <p className="text-sm text-muted-foreground">
                        Sugerencia IA: <strong>{pricingSuggestion}€</strong>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="p-0 h-auto ml-2"
                          onClick={() => updateFormData('rentaMensual', pricingSuggestion)}
                        >
                          Aplicar
                        </Button>
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mesesFianza">Meses de Fianza</Label>
                    <Select
                      value={formData.mesesFianza.toString()}
                      onValueChange={(value) => updateFormData('mesesFianza', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 mes</SelectItem>
                        <SelectItem value="2">2 meses (recomendado temporada)</SelectItem>
                        <SelectItem value="3">3 meses</SelectItem>
                      </SelectContent>
                    </Select>
                    {formData.tipoArrendamiento === 'temporada' && formData.mesesFianza < 2 && (
                      <p className="text-sm text-orange-600">
                        ⚠️ LAU recomienda 2 meses para temporada
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="depositoSuministros">Depósito Suministros (€)</Label>
                    <Input
                      id="depositoSuministros"
                      type="number"
                      value={formData.depositoSuministros || ''}
                      onChange={(e) => updateFormData('depositoSuministros', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      Garantía adicional para cubrir suministros
                    </p>
                  </div>
                </div>
                
                {/* Resumen de Fianza */}
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Resumen de Depósitos</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Fianza legal ({formData.mesesFianza} meses)</span>
                      <span className="font-medium">{(formData.rentaMensual * formData.mesesFianza).toFixed(2)}€</span>
                    </div>
                    {formData.depositoSuministros > 0 && (
                      <div className="flex justify-between">
                        <span>Depósito suministros</span>
                        <span className="font-medium">{formData.depositoSuministros.toFixed(2)}€</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Total a entregar</span>
                      <span>
                        {(formData.rentaMensual * formData.mesesFianza + formData.depositoSuministros).toFixed(2)}€
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Prorrateo */}
                {prorrateo && formData.rentaMensual > 0 && (
                  <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Calculator className="w-4 h-4" />
                      Cálculo de Prorrateo
                    </h4>
                    <div className="space-y-1 text-sm">
                      {prorrateo.diasPrimerMes > 0 && (
                        <div className="flex justify-between">
                          <span>Primer mes ({prorrateo.diasPrimerMes} días)</span>
                          <span>{prorrateo.importePrimerMes.toFixed(2)}€</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Meses completos ({prorrateo.mesesCompletos})</span>
                        <span>{(formData.rentaMensual * prorrateo.mesesCompletos).toFixed(2)}€</span>
                      </div>
                      {prorrateo.diasUltimoMes > 0 && (
                        <div className="flex justify-between">
                          <span>Último mes ({prorrateo.diasUltimoMes} días)</span>
                          <span>{prorrateo.importeUltimoMes.toFixed(2)}€</span>
                        </div>
                      )}
                      <Separator className="my-2" />
                      <div className="flex justify-between font-semibold">
                        <span>Total contrato</span>
                        <span>{prorrateo.importeTotal.toFixed(2)}€</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* PASO 4: Servicios */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Servicios Incluidos en la Renta</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { key: 'wifi', label: 'WiFi', icon: Wifi },
                    { key: 'agua', label: 'Agua', icon: Droplets },
                    { key: 'luz', label: 'Electricidad', icon: Zap },
                    { key: 'gas', label: 'Gas', icon: Flame },
                    { key: 'calefaccion', label: 'Calefacción', icon: Flame },
                    { key: 'comunidad', label: 'Comunidad', icon: Home },
                  ].map((servicio) => (
                    <div
                      key={servicio.key}
                      className={cn(
                        "p-4 border rounded-lg cursor-pointer transition-all",
                        formData.serviciosIncluidos[servicio.key as keyof typeof formData.serviciosIncluidos]
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      )}
                      onClick={() => updateServicio(
                        servicio.key,
                        !formData.serviciosIncluidos[servicio.key as keyof typeof formData.serviciosIncluidos]
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <servicio.icon className="w-5 h-5" />
                        <span className="font-medium">{servicio.label}</span>
                        <Switch
                          checked={formData.serviciosIncluidos[servicio.key as keyof typeof formData.serviciosIncluidos] as boolean}
                          onCheckedChange={(checked) => updateServicio(servicio.key, checked)}
                          className="ml-auto"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Limpieza con frecuencia */}
                <div className="mt-6 p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <ClipboardList className="w-5 h-5" />
                      <span className="font-medium">Servicio de Limpieza</span>
                    </div>
                    <Switch
                      checked={formData.serviciosIncluidos.limpieza}
                      onCheckedChange={(checked) => updateServicio('limpieza', checked)}
                    />
                  </div>
                  
                  {formData.serviciosIncluidos.limpieza && (
                    <div className="mt-4">
                      <Label>Frecuencia de limpieza</Label>
                      <Select
                        value={formData.serviciosIncluidos.limpiezaFrecuencia || 'semanal'}
                        onValueChange={(value) => setFormData(prev => ({
                          ...prev,
                          serviciosIncluidos: {
                            ...prev.serviciosIncluidos,
                            limpiezaFrecuencia: value,
                          },
                        }))}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="semanal">Semanal (~200€/mes)</SelectItem>
                          <SelectItem value="quincenal">Quincenal (~120€/mes)</SelectItem>
                          <SelectItem value="mensual">Mensual (~60€/mes)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                {/* Resumen de servicios */}
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Servicios incluidos en la renta:</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(formData.serviciosIncluidos)
                      .filter(([key, value]) => value && key !== 'limpiezaFrecuencia')
                      .map(([key]) => (
                        <Badge key={key} variant="secondary">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </Badge>
                      ))}
                    {!Object.values(formData.serviciosIncluidos).some(v => v) && (
                      <span className="text-sm text-muted-foreground">
                        Ningún servicio incluido
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* PASO 5: Revisión */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Revisión del Contrato</h3>
                
                <div className="space-y-4">
                  {/* Tipo de contrato */}
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Tipo de Arrendamiento</h4>
                    <Badge className="mb-2">
                      {formData.tipoArrendamiento === 'temporada' ? 'Arrendamiento por Temporada' : 'Vivienda Habitual'}
                    </Badge>
                    {formData.tipoArrendamiento === 'temporada' && formData.motivoTemporalidad && (
                      <p className="text-sm">
                        Motivo: <strong>{formData.motivoTemporalidad}</strong>
                      </p>
                    )}
                  </div>
                  
                  {/* Duración */}
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Duración</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Inicio:</span>
                        <p className="font-medium">
                          {format(new Date(formData.fechaInicio), "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fin:</span>
                        <p className="font-medium">
                          {format(new Date(formData.fechaFin), "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-sm">
                      Duración total: <strong>{duracionMeses} meses</strong>
                    </p>
                  </div>
                  
                  {/* Económico */}
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Condiciones Económicas</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Renta mensual</span>
                        <span className="font-medium">{formData.rentaMensual.toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fianza ({formData.mesesFianza} meses)</span>
                        <span className="font-medium">{(formData.rentaMensual * formData.mesesFianza).toFixed(2)}€</span>
                      </div>
                      {formData.depositoSuministros > 0 && (
                        <div className="flex justify-between">
                          <span>Depósito suministros</span>
                          <span className="font-medium">{formData.depositoSuministros.toFixed(2)}€</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Total contrato</span>
                        <span>{prorrateo?.importeTotal.toFixed(2) || '0.00'}€</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Servicios */}
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Servicios Incluidos</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(formData.serviciosIncluidos)
                        .filter(([key, value]) => value && key !== 'limpiezaFrecuencia')
                        .map(([key]) => (
                          <Badge key={key} variant="outline">
                            ✓ {key.charAt(0).toUpperCase() + key.slice(1)}
                          </Badge>
                        ))}
                    </div>
                  </div>
                  
                  {/* Condiciones adicionales */}
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Condiciones Adicionales</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Días de preaviso</span>
                        <span>{formData.diasPreaviso} días</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Penalización por desistimiento</span>
                        <span>{formData.penalizacionDesistimiento}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Prorrateo de días</span>
                        <span>{formData.prorrateable ? 'Sí' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Validación final */}
                {validation?.esValido ? (
                  <Alert className="mt-4 bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Contrato listo para crear</AlertTitle>
                    <AlertDescription className="text-green-700">
                      Todos los datos han sido validados correctamente.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Hay errores que corregir</AlertTitle>
                    <AlertDescription>
                      Revise los pasos anteriores para corregir los errores.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(prev => prev - 1)}
                disabled={isSubmitting}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>
            )}
            {onCancel && currentStep === 1 && (
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
          </div>
          
          <div>
            {currentStep < 5 ? (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={currentStep === 2 && formData.tipoArrendamiento === 'temporada' && !formData.motivoTemporalidad}
              >
                Siguiente
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !validation?.esValido}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Crear Contrato
                  </>
                )}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default MediumTermContractWizard;
