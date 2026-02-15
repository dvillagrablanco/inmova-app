'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calculator,
  Home,
  ArrowLeft,
  Building2,
  Euro,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  RefreshCw,
  CheckCircle,
  History,
  Target,
  Bed,
  Bath,
  Maximize2,
  Car,
  Trees,
  Waves,
  Sun,
  ParkingSquare,
  Brain,
  BarChart3,
  Calendar,
  Info,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// TIPOS
// ============================================================================

interface Valuation {
  id: string;
  address: string;
  city: string;
  postalCode: string;
  squareMeters: number;
  rooms: number;
  bathrooms: number;
  condition: string;
  estimatedValue: number;
  confidenceScore: number;
  minValue: number;
  maxValue: number;
  pricePerM2: number;
  estimatedRent?: number;
  estimatedROI?: number;
  capRate?: number;
  model: string;
  createdAt: string;
  user?: { name: string; email: string };
  unit?: { numero: string; building?: { nombre: string } };
}

interface ValuationFormData {
  address: string;
  postalCode: string;
  city: string;
  province: string;
  squareMeters: number;
  rooms: number;
  bathrooms: number;
  floor: number;
  condition: string;
  yearBuilt: number;
  hasElevator: boolean;
  hasParking: boolean;
  hasGarden: boolean;
  hasPool: boolean;
  hasTerrace: boolean;
  hasGarage: boolean;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function ValoracionesPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();

  // Estados
  const [loading, setLoading] = useState(true);
  const [valuating, setValuating] = useState(false);
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedValuation, setSelectedValuation] = useState<Valuation | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('historial');

  // Form state
  const [formData, setFormData] = useState<ValuationFormData>({
    address: '',
    postalCode: '',
    city: '',
    province: '',
    squareMeters: 0,
    rooms: 2,
    bathrooms: 1,
    floor: 1,
    condition: 'GOOD',
    yearBuilt: 2000,
    hasElevator: false,
    hasParking: false,
    hasGarden: false,
    hasPool: false,
    hasTerrace: false,
    hasGarage: false,
  });

  // Cargar datos
  useEffect(() => {
    if (status === 'authenticated') {
      loadValuations();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const loadValuations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/valuations?limit=50');
      if (response.ok) {
        const result = await response.json();
        setValuations(result.data || []);
      }
    } catch (error) {
      console.error('Error loading valuations:', error);
      toast.error('Error al cargar valoraciones');
    } finally {
      setLoading(false);
    }
  };

  const handleValuate = async () => {
    if (!formData.address || !formData.city || !formData.postalCode || !formData.squareMeters) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    try {
      setValuating(true);

      const response = await fetch('/api/valuations/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error en la valoración');
      }

      toast.success('Valoración completada');
      setShowNewDialog(false);
      loadValuations();

      // Mostrar resultado
      if (result.data) {
        setSelectedValuation({
          id: result.data.id,
          ...formData,
          estimatedValue: result.data.estimatedValue,
          confidenceScore: result.data.confidenceScore,
          minValue: result.data.minValue,
          maxValue: result.data.maxValue,
          pricePerM2: result.data.pricePerM2,
          estimatedRent: result.data.estimatedRent,
          estimatedROI: result.data.estimatedROI,
          capRate: result.data.capRate,
          model: 'Claude AI',
          createdAt: result.data.createdAt,
        } as Valuation);
        setShowDetailDialog(true);
      }

      // Reset form
      setFormData({
        address: '',
        postalCode: '',
        city: '',
        province: '',
        squareMeters: 0,
        rooms: 2,
        bathrooms: 1,
        floor: 1,
        condition: 'GOOD',
        yearBuilt: 2000,
        hasElevator: false,
        hasParking: false,
        hasGarden: false,
        hasPool: false,
        hasTerrace: false,
        hasGarage: false,
      });
    } catch (error: any) {
      console.error('Error valuating:', error);
      toast.error(error.message || 'Error al realizar valoración');
    } finally {
      setValuating(false);
    }
  };

  const getConditionLabel = (condition: string) => {
    const labels: Record<string, string> = {
      NEW: 'Nuevo',
      EXCELLENT: 'Excelente',
      GOOD: 'Bueno',
      FAIR: 'Regular',
      NEEDS_RENOVATION: 'Necesita reforma',
      POOR: 'Malo',
    };
    return labels[condition] || condition;
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  // Stats
  const stats = {
    total: valuations.length,
    avgValue: valuations.length > 0
      ? Math.round(valuations.reduce((sum, v) => sum + (v.estimatedValue || 0), 0) / valuations.length)
      : 0,
    avgConfidence: valuations.length > 0
      ? Math.round(valuations.reduce((sum, v) => sum + (v.confidenceScore || 0), 0) / valuations.length)
      : 0,
    thisMonth: valuations.filter(v => {
      const date = new Date(v.createdAt);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length,
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
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
                <BreadcrumbPage>Valoraciones</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <Calculator className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Valoraciones IA</h1>
              <p className="text-muted-foreground">
                Valoración automática de propiedades con inteligencia artificial
              </p>
            </div>
          </div>
          <Button onClick={() => setShowNewDialog(true)} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Nueva Valoración
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Valoraciones</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.avgValue.toLocaleString('es-ES')}€</p>
                  <p className="text-xs text-muted-foreground">Valor Promedio</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.avgConfidence}%</p>
                  <p className="text-xs text-muted-foreground">Confianza Media</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.thisMonth}</p>
                  <p className="text-xs text-muted-foreground">Este Mes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contenido Principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historial de Valoraciones
            </CardTitle>
            <CardDescription>
              Todas las valoraciones realizadas con IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            {valuations.length === 0 ? (
              <div className="text-center py-12">
                <Calculator className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">Sin valoraciones</h3>
                <p className="text-muted-foreground mb-4">
                  Realiza tu primera valoración de propiedad con IA
                </p>
                <Button onClick={() => setShowNewDialog(true)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Nueva Valoración
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {valuations.map((valuation) => (
                  <div
                    key={valuation.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => {
                      setSelectedValuation(valuation);
                      setShowDetailDialog(true);
                    }}
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Building2 className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{valuation.address}</h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {valuation.city}, {valuation.postalCode}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge variant="secondary">
                                <Maximize2 className="h-3 w-3 mr-1" />
                                {valuation.squareMeters}m²
                              </Badge>
                              <Badge variant="secondary">
                                <Bed className="h-3 w-3 mr-1" />
                                {valuation.rooms} hab
                              </Badge>
                              <Badge variant="secondary">
                                <Bath className="h-3 w-3 mr-1" />
                                {valuation.bathrooms} baños
                              </Badge>
                              <Badge variant="outline">
                                {getConditionLabel(valuation.condition)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          {valuation.estimatedValue?.toLocaleString('es-ES')}€
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {valuation.pricePerM2?.toLocaleString('es-ES')}€/m²
                        </p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className={`text-sm font-medium ${getConfidenceColor(valuation.confidenceScore)}`}>
                            {valuation.confidenceScore}% confianza
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(valuation.createdAt).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Nueva Valoración */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Nueva Valoración con IA
            </DialogTitle>
            <DialogDescription>
              Completa los datos de la propiedad para obtener una valoración automática
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Ubicación */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Ubicación
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Dirección *</Label>
                  <Input
                    placeholder="Calle, número, piso..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Ciudad *</Label>
                  <Input
                    placeholder="Madrid"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Código Postal *</Label>
                  <Input
                    placeholder="28001"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Provincia</Label>
                  <Input
                    placeholder="Madrid"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Planta</Label>
                  <Input
                    type="number"
                    min={-2}
                    max={50}
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            {/* Características */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Características
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label>Superficie (m²) *</Label>
                  <Input
                    type="number"
                    min={10}
                    max={10000}
                    value={formData.squareMeters || ''}
                    onChange={(e) => setFormData({ ...formData, squareMeters: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Habitaciones *</Label>
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    value={formData.rooms}
                    onChange={(e) => setFormData({ ...formData, rooms: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Baños *</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Año Construcción</Label>
                  <Input
                    type="number"
                    min={1800}
                    max={new Date().getFullYear()}
                    value={formData.yearBuilt}
                    onChange={(e) => setFormData({ ...formData, yearBuilt: parseInt(e.target.value) || 2000 })}
                  />
                </div>
              </div>
              <div>
                <Label>Estado de Conservación *</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => setFormData({ ...formData, condition: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">Nuevo / A estrenar</SelectItem>
                    <SelectItem value="EXCELLENT">Excelente</SelectItem>
                    <SelectItem value="GOOD">Bueno</SelectItem>
                    <SelectItem value="FAIR">Regular</SelectItem>
                    <SelectItem value="NEEDS_RENOVATION">Necesita reforma</SelectItem>
                    <SelectItem value="POOR">Malo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Extras */}
            <div className="space-y-4">
              <h4 className="font-semibold">Extras y Servicios</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="elevator"
                    checked={formData.hasElevator}
                    onCheckedChange={(checked) => setFormData({ ...formData, hasElevator: !!checked })}
                  />
                  <Label htmlFor="elevator" className="cursor-pointer">Ascensor</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="parking"
                    checked={formData.hasParking}
                    onCheckedChange={(checked) => setFormData({ ...formData, hasParking: !!checked })}
                  />
                  <Label htmlFor="parking" className="cursor-pointer">Parking</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="garage"
                    checked={formData.hasGarage}
                    onCheckedChange={(checked) => setFormData({ ...formData, hasGarage: !!checked })}
                  />
                  <Label htmlFor="garage" className="cursor-pointer">Garaje</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="garden"
                    checked={formData.hasGarden}
                    onCheckedChange={(checked) => setFormData({ ...formData, hasGarden: !!checked })}
                  />
                  <Label htmlFor="garden" className="cursor-pointer">Jardín</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terrace"
                    checked={formData.hasTerrace}
                    onCheckedChange={(checked) => setFormData({ ...formData, hasTerrace: !!checked })}
                  />
                  <Label htmlFor="terrace" className="cursor-pointer">Terraza</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pool"
                    checked={formData.hasPool}
                    onCheckedChange={(checked) => setFormData({ ...formData, hasPool: !!checked })}
                  />
                  <Label htmlFor="pool" className="cursor-pointer">Piscina</Label>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                La valoración utiliza inteligencia artificial (Claude) para estimar el valor de mercado basándose en datos comparables y tendencias del mercado inmobiliario.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleValuate} disabled={valuating}>
              {valuating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Valorando...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Obtener Valoración
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Detalle */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Resultado de Valoración</DialogTitle>
            <DialogDescription>
              {selectedValuation?.address}
            </DialogDescription>
          </DialogHeader>
          {selectedValuation && (
            <div className="space-y-6">
              {/* Valor Principal */}
              <div className="text-center p-6 bg-green-50 rounded-xl">
                <p className="text-sm text-muted-foreground mb-1">Valor Estimado</p>
                <p className="text-4xl font-bold text-green-600">
                  {selectedValuation.estimatedValue?.toLocaleString('es-ES')}€
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Rango: {selectedValuation.minValue?.toLocaleString('es-ES')}€ - {selectedValuation.maxValue?.toLocaleString('es-ES')}€
                </p>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Precio/m²</p>
                  <p className="text-xl font-bold">
                    {selectedValuation.pricePerM2?.toLocaleString('es-ES')}€
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Confianza</p>
                  <p className={`text-xl font-bold ${getConfidenceColor(selectedValuation.confidenceScore)}`}>
                    {selectedValuation.confidenceScore}%
                  </p>
                </div>
                {selectedValuation.estimatedRent && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Alquiler Est.</p>
                    <p className="text-xl font-bold">
                      {selectedValuation.estimatedRent.toLocaleString('es-ES')}€/mes
                    </p>
                  </div>
                )}
                {selectedValuation.estimatedROI && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">ROI Estimado</p>
                    <p className="text-xl font-bold text-blue-600">
                      {selectedValuation.estimatedROI.toFixed(2)}%
                    </p>
                  </div>
                )}
              </div>

              {/* Detalles */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Superficie</span>
                  <span className="font-medium">{selectedValuation.squareMeters}m²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Habitaciones</span>
                  <span className="font-medium">{selectedValuation.rooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Baños</span>
                  <span className="font-medium">{selectedValuation.bathrooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado</span>
                  <span className="font-medium">{getConditionLabel(selectedValuation.condition)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modelo IA</span>
                  <Badge variant="outline">{selectedValuation.model}</Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
