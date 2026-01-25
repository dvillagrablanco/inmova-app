'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Home,
  ArrowLeft,
  Brain,
  TrendingUp,
  TrendingDown,
  Building2,
  MapPin,
  Euro,
  BarChart3,
  PieChart,
  Target,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Calculator,
  FileText,
  Download,
  RefreshCw,
  Info,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Award,
  Lightbulb,
  Clock,
  Users,
  Ruler,
  Car,
  Trees,
  Waves,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// Cargar AuthenticatedLayout solo en el cliente para evitar errores de hidratación
const AuthenticatedLayout = dynamic(
  () => import('@/components/layout/authenticated-layout').then(mod => mod.AuthenticatedLayout),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Cargando interfaz...</p>
        </div>
      </div>
    )
  }
);

// AIDocumentAssistant se carga de forma dinámica
const AIDocumentAssistant = dynamic(
  () => import('@/components/ai/AIDocumentAssistant').then(mod => mod.AIDocumentAssistant),
  { ssr: false }
);

// Tipos para la valoración
interface Building {
  id: string;
  nombre: string;
  direccion?: string;
  ciudad?: string;
  codigoPostal?: string;
  tipoEdificio?: string;
  anosConstruccion?: number;
  numPlantas?: number;
  units?: Unit[];
}

interface Unit {
  id: string;
  numero: string;
  tipo?: string;
  superficie?: number;
  habitaciones?: number;
  banos?: number;
  estado?: string;
  rentaMensual?: number;
  buildingId?: string;
  building?: {
    id: string;
    nombre: string;
    direccion?: string;
    ciudad?: string;
  };
}

interface ValoracionResult {
  valorEstimado: number;
  valorMinimo: number;
  valorMaximo: number;
  precioM2: number;
  confianza: number;
  tendenciaMercado: 'alcista' | 'bajista' | 'estable';
  porcentajeTendencia: number;
  comparables: Array<{
    direccion: string;
    precio: number;
    superficie: number;
    precioM2: number;
    similitud: number;
  }>;
  factoresPositivos: string[];
  factoresNegativos: string[];
  recomendaciones: string[];
  analisisMercado: string;
  tiempoEstimadoVenta: string;
  rentabilidadAlquiler: number;
  alquilerEstimado: number;
}

// Características del inmueble
const CARACTERISTICAS = [
  { id: 'ascensor', label: 'Ascensor', icon: ArrowUpRight },
  { id: 'terraza', label: 'Terraza', icon: Trees },
  { id: 'piscina', label: 'Piscina', icon: Waves },
  { id: 'garaje', label: 'Garaje', icon: Car },
  { id: 'trastero', label: 'Trastero', icon: Building2 },
  { id: 'aire_acondicionado', label: 'Aire acondicionado', icon: Zap },
  { id: 'calefaccion', label: 'Calefacción', icon: Zap },
  { id: 'jardin', label: 'Jardín', icon: Trees },
];

export default function ValoracionIAPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Estado para controlar si el componente está montado
  const [isMounted, setIsMounted] = useState(false);
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [valorando, setValorando] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [valorarEdificioCompleto, setValorarEdificioCompleto] = useState(false);
  const [resultado, setResultado] = useState<ValoracionResult | null>(null);
  
  // Unidades filtradas por edificio seleccionado
  const filteredUnits = selectedBuilding 
    ? units.filter(u => u.buildingId === selectedBuilding || u.building?.id === selectedBuilding)
    : [];
  
  // Datos del formulario
  const [formData, setFormData] = useState({
    superficie: '',
    habitaciones: '',
    banos: '',
    antiguedad: '',
    estadoConservacion: 'bueno',
    orientacion: 'sur',
    planta: '',
    finalidad: 'venta',
    caracteristicas: [] as string[],
    descripcionAdicional: '',
  });

  // Marcar como montado
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Cargar datos
  useEffect(() => {
    if (!isMounted) return;
    
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      fetchAssets();
    }
  }, [status, router, isMounted]);

  const fetchAssets = async () => {
    try {
      const [buildingsRes, unitsRes] = await Promise.allSettled([
        fetch('/api/buildings', { credentials: 'include' }),
        fetch('/api/units', { credentials: 'include' }),
      ]);
      
      if (buildingsRes.status === 'fulfilled' && buildingsRes.value.ok) {
        try {
          const buildingsData = await buildingsRes.value.json();
          setBuildings(Array.isArray(buildingsData) ? buildingsData : []);
        } catch {
          setBuildings([]);
        }
      }
      
      if (unitsRes.status === 'fulfilled' && unitsRes.value.ok) {
        try {
          const unitsData = await unitsRes.value.json();
          setUnits(Array.isArray(unitsData) ? unitsData : []);
        } catch {
          setUnits([]);
        }
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuildingSelect = (buildingId: string) => {
    setSelectedBuilding(buildingId);
    setSelectedUnit('');
    setValorarEdificioCompleto(false);
    
    // Limpiar formulario cuando se cambia de edificio
    setFormData(prev => ({
      ...prev,
      superficie: '',
      habitaciones: '',
      banos: '',
    }));
  };
  
  const handleUnitSelect = (unitId: string) => {
    setSelectedUnit(unitId);
    setValorarEdificioCompleto(false);
    
    const unit = units.find(u => u.id === unitId);
    if (unit) {
      setFormData(prev => ({
        ...prev,
        superficie: unit.superficie?.toString() || '',
        habitaciones: unit.habitaciones?.toString() || '',
        banos: unit.banos?.toString() || '',
      }));
    }
  };
  
  const handleValorarEdificioCompleto = (checked: boolean) => {
    setValorarEdificioCompleto(checked);
    setSelectedUnit('');
    
    if (checked && selectedBuilding) {
      // Calcular suma de superficies, habitaciones y baños de todas las unidades del edificio
      const buildingUnits = units.filter(u => 
        u.buildingId === selectedBuilding || u.building?.id === selectedBuilding
      );
      
      const totalSuperficie = buildingUnits.reduce((sum, u) => sum + (u.superficie || 0), 0);
      const totalHabitaciones = buildingUnits.reduce((sum, u) => sum + (u.habitaciones || 0), 0);
      const totalBanos = buildingUnits.reduce((sum, u) => sum + (u.banos || 0), 0);
      
      setFormData(prev => ({
        ...prev,
        superficie: totalSuperficie.toString(),
        habitaciones: totalHabitaciones.toString(),
        banos: totalBanos.toString(),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        superficie: '',
        habitaciones: '',
        banos: '',
      }));
    }
  };

  const handleValorar = async () => {
    if (!formData.superficie || parseFloat(formData.superficie) <= 0) {
      toast.error('Por favor indica la superficie del inmueble');
      return;
    }

    setValorando(true);
    setResultado(null);

    try {
      let direccion = '';
      let ciudad = '';
      
      // Obtener datos del edificio seleccionado
      if (selectedBuilding) {
        const building = buildings.find(b => b.id === selectedBuilding);
        direccion = building?.direccion || '';
        ciudad = building?.ciudad || 'Madrid';
      }
      
      // Si es una unidad específica, usar sus datos de edificio
      if (selectedUnit && !valorarEdificioCompleto) {
        const unit = units.find(u => u.id === selectedUnit);
        if (unit?.building) {
          direccion = unit.building.direccion || direccion;
          ciudad = unit.building.ciudad || ciudad;
        }
      }

      const response = await fetch('/api/ai/valuate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          superficie: parseFloat(formData.superficie),
          habitaciones: parseInt(formData.habitaciones) || 0,
          banos: parseInt(formData.banos) || 0,
          antiguedad: parseInt(formData.antiguedad) || 0,
          planta: parseInt(formData.planta) || 0,
          direccion,
          ciudad,
          codigoPostal: '',
          unitId: selectedUnit || undefined,
          buildingId: selectedBuilding || undefined,
          valorarEdificioCompleto,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Error al realizar la valoración');
      }

      const data = await response.json();
      
      // Validar que la respuesta tiene los campos esperados
      if (!data.valorEstimado || typeof data.valorEstimado !== 'number') {
        console.error('Respuesta de valoración inválida:', data);
        toast.error('La valoración devolvió datos incompletos. Inténtalo de nuevo.');
        return;
      }
      
      // Asegurar valores por defecto
      const resultadoValidado = {
        ...data,
        valorEstimado: data.valorEstimado || 0,
        valorMinimo: data.valorMinimo || Math.round(data.valorEstimado * 0.9),
        valorMaximo: data.valorMaximo || Math.round(data.valorEstimado * 1.1),
        precioM2: data.precioM2 || Math.round(data.valorEstimado / parseFloat(formData.superficie)),
        confianza: data.confianza || 70,
        tendenciaMercado: data.tendenciaMercado || 'estable',
        porcentajeTendencia: data.porcentajeTendencia || 0,
        factoresPositivos: data.factoresPositivos || [],
        factoresNegativos: data.factoresNegativos || [],
        recomendaciones: data.recomendaciones || [],
        comparables: data.comparables || [],
        analisisMercado: data.analisisMercado || '',
        tiempoEstimadoVenta: data.tiempoEstimadoVenta || '2-4 meses',
        rentabilidadAlquiler: data.rentabilidadAlquiler || 4.5,
        alquilerEstimado: data.alquilerEstimado || Math.round(data.valorEstimado * 0.004),
      };
      
      setResultado(resultadoValidado);
      toast.success('Valoración completada');
    } catch (error: any) {
      console.error('Error valorando:', error);
      toast.error(error.message || 'Error al realizar la valoración');
    } finally {
      setValorando(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'alcista':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'bajista':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  // Estado de carga inicial - sin AuthenticatedLayout para evitar hidratación
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Preparando página...</p>
        </div>
      </div>
    );
  }

  // Sesión cargando
  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">
              {status === 'loading' ? 'Verificando sesión...' : 'Cargando activos...'}
            </p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }
  
  // No autenticado
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Sesión requerida</h2>
          <p className="text-muted-foreground mb-4">
            Necesitas iniciar sesión para acceder a esta página.
          </p>
          <Button onClick={() => router.push('/login')}>
            Iniciar sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </div>

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Valoración IA</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <Brain className="h-8 w-8 text-primary" />
                Valoración Inteligente
              </h1>
              <p className="text-muted-foreground mt-1">
                Obtén una valoración precisa de tu inmueble usando IA avanzada
              </p>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Powered by Claude
            </Badge>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Datos del Inmueble
                </CardTitle>
                <CardDescription>
                  Introduce los datos del inmueble para obtener una valoración precisa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Selección de edificio y unidad */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Seleccionar activo a valorar</Label>
                  
                  {/* Selector de Edificio */}
                  <div className="space-y-2">
                    <Label>Edificio</Label>
                    <Select value={selectedBuilding} onValueChange={handleBuildingSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un edificio" />
                      </SelectTrigger>
                      <SelectContent>
                        {buildings.length > 0 ? (
                          buildings.map((building) => (
                            <SelectItem key={building.id} value={building.id}>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                {building.nombre} - {building.direccion || 'Sin dirección'}
                                {building.ciudad && ` (${building.ciudad})`}
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-buildings" disabled>
                            No hay edificios disponibles
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Opciones cuando hay edificio seleccionado */}
                  {selectedBuilding && (
                    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                      {/* Opción: Valorar edificio completo */}
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="valorar-edificio"
                          checked={valorarEdificioCompleto}
                          onChange={(e) => handleValorarEdificioCompleto(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="valorar-edificio" className="text-sm font-medium cursor-pointer">
                          Valorar edificio completo (suma de {filteredUnits.length} unidades)
                        </Label>
                      </div>
                      
                      {/* Selector de Unidad (solo si no se valora edificio completo) */}
                      {!valorarEdificioCompleto && (
                        <div className="space-y-2">
                          <Label>Unidad específica</Label>
                          <Select value={selectedUnit} onValueChange={handleUnitSelect}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una unidad del edificio" />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredUnits.length > 0 ? (
                                filteredUnits.map((unit) => (
                                  <SelectItem key={unit.id} value={unit.id}>
                                    <div className="flex items-center justify-between gap-4">
                                      <span>{unit.numero} - {unit.tipo || 'Unidad'}</span>
                                      <span className="text-muted-foreground text-xs">
                                        {unit.superficie && `${unit.superficie}m²`}
                                        {unit.habitaciones && ` · ${unit.habitaciones} hab`}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-units" disabled>
                                  No hay unidades en este edificio
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      {/* Resumen de selección */}
                      {(valorarEdificioCompleto || selectedUnit) && (
                        <div className="p-3 bg-primary/10 rounded-md">
                          <p className="text-sm font-medium text-primary">
                            {valorarEdificioCompleto ? (
                              <>
                                <Building2 className="h-4 w-4 inline mr-1" />
                                Valorando: Edificio completo ({filteredUnits.length} unidades, {formData.superficie}m² total)
                              </>
                            ) : (
                              <>
                                <Home className="h-4 w-4 inline mr-1" />
                                Valorando: Unidad {units.find(u => u.id === selectedUnit)?.numero}
                              </>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Mensaje si no hay edificios */}
                  {buildings.length === 0 && !loading && (
                    <p className="text-sm text-muted-foreground">
                      No tienes edificios registrados. Puedes introducir los datos manualmente o{' '}
                      <a href="/edificios/nuevo" className="text-primary underline">crear un edificio</a>.
                    </p>
                  )}
                </div>

                <Separator />

                {/* Datos principales */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="superficie">Superficie (m²) *</Label>
                    <Input
                      id="superficie"
                      type="number"
                      placeholder="80"
                      value={formData.superficie}
                      onChange={(e) => setFormData({ ...formData, superficie: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="habitaciones">Habitaciones</Label>
                    <Input
                      id="habitaciones"
                      type="number"
                      placeholder="3"
                      value={formData.habitaciones}
                      onChange={(e) => setFormData({ ...formData, habitaciones: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="banos">Baños</Label>
                    <Input
                      id="banos"
                      type="number"
                      placeholder="2"
                      value={formData.banos}
                      onChange={(e) => setFormData({ ...formData, banos: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="antiguedad">Antigüedad (años)</Label>
                    <Input
                      id="antiguedad"
                      type="number"
                      placeholder="10"
                      value={formData.antiguedad}
                      onChange={(e) => setFormData({ ...formData, antiguedad: e.target.value })}
                    />
                  </div>
                </div>

                {/* Estado y orientación */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Estado de conservación</Label>
                    <Select
                      value={formData.estadoConservacion}
                      onValueChange={(value) => setFormData({ ...formData, estadoConservacion: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nuevo">Nuevo / A estrenar</SelectItem>
                        <SelectItem value="excelente">Excelente</SelectItem>
                        <SelectItem value="bueno">Bueno</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="reformar">A reformar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Orientación principal</Label>
                    <Select
                      value={formData.orientacion}
                      onValueChange={(value) => setFormData({ ...formData, orientacion: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="norte">Norte</SelectItem>
                        <SelectItem value="sur">Sur</SelectItem>
                        <SelectItem value="este">Este</SelectItem>
                        <SelectItem value="oeste">Oeste</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="planta">Planta</Label>
                    <Input
                      id="planta"
                      type="number"
                      placeholder="3"
                      value={formData.planta}
                      onChange={(e) => setFormData({ ...formData, planta: e.target.value })}
                    />
                  </div>
                </div>

                {/* Finalidad */}
                <div className="space-y-2">
                  <Label>Finalidad de la valoración</Label>
                  <Select
                    value={formData.finalidad}
                    onValueChange={(value) => setFormData({ ...formData, finalidad: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="venta">Venta</SelectItem>
                      <SelectItem value="alquiler">Alquiler</SelectItem>
                      <SelectItem value="ambos">Venta y Alquiler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Características */}
                <div className="space-y-2">
                  <Label>Características adicionales</Label>
                  <div className="flex flex-wrap gap-2">
                    {CARACTERISTICAS.map((car) => {
                      const isSelected = formData.caracteristicas.includes(car.id);
                      const Icon = car.icon;
                      return (
                        <Button
                          key={car.id}
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              caracteristicas: isSelected
                                ? prev.caracteristicas.filter((c) => c !== car.id)
                                : [...prev.caracteristicas, car.id],
                            }));
                          }}
                        >
                          <Icon className="h-3 w-3 mr-1" />
                          {car.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Descripción adicional */}
                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción adicional</Label>
                  <Textarea
                    id="descripcion"
                    placeholder="Información adicional relevante para la valoración..."
                    value={formData.descripcionAdicional}
                    onChange={(e) => setFormData({ ...formData, descripcionAdicional: e.target.value })}
                  />
                </div>

                {/* Botón de valorar */}
                <Button
                  onClick={handleValorar}
                  disabled={valorando || !formData.superficie}
                  className="w-full"
                  size="lg"
                >
                  {valorando ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analizando con IA...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Obtener Valoración
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Panel lateral con resultados */}
          <div className="space-y-6">
            {resultado ? (
              <>
                {/* Resultado principal */}
                <Card className="border-2 border-primary">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Target className="h-5 w-5 text-primary" />
                      Valoración Estimada
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary">
                        {formatCurrency(resultado.valorEstimado)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Rango: {formatCurrency(resultado.valorMinimo)} - {formatCurrency(resultado.valorMaximo)}
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      <Badge className={getTrendColor(resultado.tendenciaMercado)}>
                        {resultado.tendenciaMercado === 'alcista' && <TrendingUp className="h-3 w-3 mr-1" />}
                        {resultado.tendenciaMercado === 'bajista' && <TrendingDown className="h-3 w-3 mr-1" />}
                        {resultado.tendenciaMercado === 'estable' && <Minus className="h-3 w-3 mr-1" />}
                        {resultado.tendenciaMercado.charAt(0).toUpperCase() + resultado.tendenciaMercado.slice(1)}
                        ({resultado.porcentajeTendencia > 0 ? '+' : ''}{resultado.porcentajeTendencia}%)
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Confianza</span>
                        <span className="font-medium">{resultado.confianza}%</span>
                      </div>
                      <Progress value={resultado.confianza} />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-semibold">{formatCurrency(resultado.precioM2)}</div>
                        <div className="text-xs text-muted-foreground">por m²</div>
                      </div>
                      <div>
                        <div className="text-2xl font-semibold">{formatCurrency(resultado.alquilerEstimado)}</div>
                        <div className="text-xs text-muted-foreground">alquiler/mes</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Factores */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Análisis de Factores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="positivos">
                        <AccordionTrigger className="text-green-600">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Factores Positivos ({resultado.factoresPositivos.length})
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-1">
                            {resultado.factoresPositivos.map((factor, i) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <CheckCircle2 className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
                                {factor}
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="negativos">
                        <AccordionTrigger className="text-red-600">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Factores Negativos ({resultado.factoresNegativos.length})
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-1">
                            {resultado.factoresNegativos.map((factor, i) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <AlertTriangle className="h-3 w-3 text-red-500 mt-1 flex-shrink-0" />
                                {factor}
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="recomendaciones">
                        <AccordionTrigger className="text-blue-600">
                          <div className="flex items-center gap-2">
                            <Lightbulb className="h-4 w-4" />
                            Recomendaciones ({resultado.recomendaciones.length})
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-1">
                            {resultado.recomendaciones.map((rec, i) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <Lightbulb className="h-3 w-3 text-blue-500 mt-1 flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">Obtén una valoración precisa</h3>
                  <p className="text-sm text-muted-foreground">
                    Introduce los datos del inmueble y nuestra IA te proporcionará una valoración detallada.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Info */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Esta valoración es orientativa y se basa en datos del mercado y algoritmos de IA.
                    Para una tasación oficial, contacta con un tasador certificado.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
