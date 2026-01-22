'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Shield,
  ArrowLeft,
  Building2,
  Calculator,
  CheckCircle2,
  TrendingDown,
  Info,
  FileText,
  Calendar,
  Home,
  Euro,
  Sparkles,
} from 'lucide-react';

// AI Components - Dynamic imports for client-side only
const InsuranceDocumentAnalyzer = dynamic(
  () => import('@/components/seguros/InsuranceDocumentAnalyzer').then(mod => ({ default: mod.InsuranceDocumentAnalyzer })),
  { ssr: false }
);

const FormAIAssistant = dynamic(
  () => import('@/components/ai/FormAIAssistant').then(mod => ({ default: mod.FormAIAssistant })),
  { ssr: false }
);
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InsuranceQuote {
  provider: string;
  annualPremium: number;
  coverage: number;
  deductible: number;
  features: string[];
  validUntil: string;
}

interface Building {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  codigoPostal: string;
  anoConstru?: number;
  superficieTotal?: number;
}

const tiposSeguro = [
  { value: 'EDIFICIO', label: 'Edificio Completo' },
  { value: 'RESPONSABILIDAD_CIVIL', label: 'Responsabilidad Civil' },
  { value: 'HOGAR', label: 'Hogar/Vivienda' },
  { value: 'ALQUILER', label: 'Impago de Alquiler' },
  { value: 'VIDA', label: 'Vida' },
  { value: 'ACCIDENTES', label: 'Accidentes' },
];

const aseguradoras = [
  'Mapfre',
  'AXA',
  'Segurcaixa',
  'Mutua Madrileña',
  'Allianz',
  'Generali',
  'Zurich',
  'Catalana Occidente',
  'Otro',
];

export default function NuevoSeguroPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [activeTab, setActiveTab] = useState('manual');

  // Form data
  const [formData, setFormData] = useState({
    tipo: '',
    buildingId: '',
    unitId: '',
    aseguradora: '',
    numeroPoliza: '',
    fechaInicio: '',
    fechaVencimiento: '',
    prima: '',
    cobertura: '',
    franquicia: '',
    observaciones: '',
  });

  // Quote comparison
  const [quotes, setQuotes] = useState<InsuranceQuote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<InsuranceQuote | null>(null);

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    try {
      const response = await fetch('/api/buildings');
      if (!response.ok) throw new Error();
      const data = await response.json();
      setBuildings(data);
    } catch (error) {
      console.error('Error loading buildings:', error);
      toast.error('Error al cargar edificios');
    } finally {
      setLoadingBuildings(false);
    }
  };

  const handleGetQuotes = async () => {
    const building = buildings.find((b) => b.id === formData.buildingId);
    if (!building) {
      toast.error('Selecciona un edificio primero');
      return;
    }

    if (!formData.cobertura) {
      toast.error('Indica el valor de cobertura');
      return;
    }

    setLoadingQuotes(true);
    try {
      const response = await fetch('/api/seguros/cotizaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyType: formData.tipo === 'EDIFICIO' ? 'EDIFICIO' : 'VIVIENDA',
          propertyValue: parseFloat(formData.cobertura),
          propertyAddress: building.direccion,
          postalCode: building.codigoPostal || '',
          city: building.ciudad || '',
          province: '',
          constructionYear: building.anoConstru || 2000,
          squareMeters: building.superficieTotal || 100,
          coverageTypes: [formData.tipo],
        }),
      });

      if (!response.ok) throw new Error();
      const data = await response.json();
      setQuotes(data.quotes || []);
      toast.success(`${data.quotes?.length || 0} cotizaciones obtenidas`);
    } catch (error) {
      console.error('Error getting quotes:', error);
      toast.error('Error al obtener cotizaciones');
    } finally {
      setLoadingQuotes(false);
    }
  };

  const handleSelectQuote = (quote: InsuranceQuote) => {
    setSelectedQuote(quote);
    setFormData({
      ...formData,
      aseguradora: quote.provider,
      prima: quote.annualPremium.toString(),
      cobertura: quote.coverage.toString(),
      franquicia: quote.deductible.toString(),
    });
    setActiveTab('manual');
    toast.success(`Cotización de ${quote.provider} seleccionada`);
  };

  // AI Document Analysis handler
  const handleInsuranceDataExtracted = (extractedData: Partial<typeof formData>) => {
    setFormData(prev => ({
      ...prev,
      ...extractedData,
    }));
    toast.success('Datos del seguro aplicados desde el documento');
  };

  // AI Form Assistant handler
  const handleAISuggestions = (suggestions: Record<string, any>) => {
    setFormData(prev => ({
      ...prev,
      ...suggestions,
    }));
  };

  // Form fields definition for AI Assistant
  const formFields = [
    { name: 'tipo', label: 'Tipo de Seguro', type: 'select' as const, required: true, options: tiposSeguro },
    { name: 'aseguradora', label: 'Aseguradora', type: 'select' as const, required: true, options: aseguradoras.map(a => ({ value: a, label: a })) },
    { name: 'numeroPoliza', label: 'Número de Póliza', type: 'text' as const },
    { name: 'fechaInicio', label: 'Fecha de Inicio', type: 'date' as const },
    { name: 'fechaVencimiento', label: 'Fecha de Vencimiento', type: 'date' as const },
    { name: 'prima', label: 'Prima Anual (€)', type: 'currency' as const },
    { name: 'cobertura', label: 'Cobertura (€)', type: 'currency' as const },
    { name: 'franquicia', label: 'Franquicia (€)', type: 'currency' as const },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.tipo || !formData.buildingId || !formData.aseguradora) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/seguros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: formData.tipo,
          buildingId: formData.buildingId,
          unitId: formData.unitId || null,
          aseguradora: formData.aseguradora,
          numeroPoliza: formData.numeroPoliza || `POL-${Date.now()}`,
          poliza: formData.numeroPoliza || `POL-${Date.now()}`,
          fechaInicio: formData.fechaInicio || new Date().toISOString(),
          fechaVencimiento: formData.fechaVencimiento,
          prima: parseFloat(formData.prima) || 0,
          cobertura: parseFloat(formData.cobertura) || 0,
          franquicia: parseFloat(formData.franquicia) || 0,
          observaciones: formData.observaciones,
          estado: 'ACTIVO',
        }),
      });

      if (!response.ok) throw new Error();

      const data = await response.json();
      toast.success('Seguro creado correctamente');
      router.push(`/seguros/${data.id}`);
    } catch (error) {
      console.error('Error creating insurance:', error);
      toast.error('Error al crear seguro');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="space-y-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/seguros">Seguros</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Nuevo Seguro</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Contratar Seguro</h1>
                <p className="text-sm text-muted-foreground">
                  Compara ofertas y contrata tu póliza
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <FormAIAssistant
                formContext="seguro"
                fields={formFields}
                currentValues={formData}
                onSuggestionsApply={handleAISuggestions}
                additionalContext={buildings.length > 0 ? `Edificios: ${buildings.map(b => `${b.nombre} (${b.ciudad})`).join(', ')}` : undefined}
              />
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </Button>
            </div>
          </div>

          {/* AI Document Analyzer for Insurance Documents */}
          <InsuranceDocumentAnalyzer
            onDataExtracted={handleInsuranceDataExtracted}
            currentFormData={formData}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="comparador">
              <Calculator className="mr-2 h-4 w-4" />
              Comparador
            </TabsTrigger>
            <TabsTrigger value="manual">
              <FileText className="mr-2 h-4 w-4" />
              Entrada Manual
            </TabsTrigger>
          </TabsList>

          {/* Comparador Tab */}
          <TabsContent value="comparador" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  Comparador de Seguros
                </CardTitle>
                <CardDescription>
                  Obtén cotizaciones de múltiples aseguradoras y elige la mejor oferta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tipo de Seguro *</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposSeguro.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Edificio *</Label>
                    <Select
                      value={formData.buildingId}
                      onValueChange={(value) => setFormData({ ...formData, buildingId: value })}
                      disabled={loadingBuildings}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona edificio" />
                      </SelectTrigger>
                      <SelectContent>
                        {buildings.map((building) => (
                          <SelectItem key={building.id} value={building.id}>
                            {building.nombre} - {building.direccion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Valor de Cobertura (€) *</Label>
                    <Input
                      type="number"
                      value={formData.cobertura}
                      onChange={(e) => setFormData({ ...formData, cobertura: e.target.value })}
                      placeholder="500000"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleGetQuotes}
                  disabled={
                    !formData.tipo || !formData.buildingId || !formData.cobertura || loadingQuotes
                  }
                  className="w-full"
                  size="lg"
                >
                  {loadingQuotes ? (
                    'Obteniendo cotizaciones...'
                  ) : (
                    <>
                      <Calculator className="mr-2 h-4 w-4" />
                      Comparar Ofertas
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Quotes Results */}
            {quotes.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Cotizaciones Disponibles ({quotes.length})
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  {quotes.map((quote, index) => (
                    <Card
                      key={index}
                      className={
                        selectedQuote?.provider === quote.provider
                          ? 'border-primary ring-2 ring-primary'
                          : ''
                      }
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{quote.provider}</CardTitle>
                            {index === 0 && (
                              <Badge variant="success" className="mt-1 gap-1">
                                <TrendingDown className="h-3 w-3" />
                                Mejor Precio
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              {new Intl.NumberFormat('es-ES', {
                                style: 'currency',
                                currency: 'EUR',
                                maximumFractionDigits: 0,
                              }).format(quote.annualPremium)}
                            </div>
                            <div className="text-xs text-muted-foreground">Prima anual</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="text-muted-foreground">Cobertura</div>
                            <div className="font-medium">
                              {new Intl.NumberFormat('es-ES', {
                                style: 'currency',
                                currency: 'EUR',
                                maximumFractionDigits: 0,
                              }).format(quote.coverage)}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Franquicia</div>
                            <div className="font-medium">
                              {new Intl.NumberFormat('es-ES', {
                                style: 'currency',
                                currency: 'EUR',
                              }).format(quote.deductible)}
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="text-sm font-medium mb-1">Incluye:</div>
                          <ul className="text-xs space-y-1 text-muted-foreground">
                            {quote.features.slice(0, 3).map((feature, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          onClick={() => handleSelectQuote(quote)}
                          variant={
                            selectedQuote?.provider === quote.provider ? 'default' : 'outline'
                          }
                          className="w-full"
                        >
                          {selectedQuote?.provider === quote.provider
                            ? 'Seleccionada'
                            : 'Seleccionar'}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Manual Tab */}
          <TabsContent value="manual">
            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle>Datos del Seguro</CardTitle>
                  <CardDescription>Completa la información de la póliza</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Tipo de Seguro *</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                        disabled={!!selectedQuote}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {tiposSeguro.map((tipo) => (
                            <SelectItem key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Aseguradora *</Label>
                      <Select
                        value={formData.aseguradora}
                        onValueChange={(value) => setFormData({ ...formData, aseguradora: value })}
                        disabled={!!selectedQuote}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona aseguradora" />
                        </SelectTrigger>
                        <SelectContent>
                          {aseguradoras.map((aseg) => (
                            <SelectItem key={aseg} value={aseg}>
                              {aseg}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Edificio *</Label>
                      <Select
                        value={formData.buildingId}
                        onValueChange={(value) => setFormData({ ...formData, buildingId: value })}
                        disabled={loadingBuildings}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona edificio" />
                        </SelectTrigger>
                        <SelectContent>
                          {buildings.map((building) => (
                            <SelectItem key={building.id} value={building.id}>
                              {building.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Número de Póliza</Label>
                      <Input
                        value={formData.numeroPoliza}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            numeroPoliza: e.target.value,
                          })
                        }
                        placeholder="POL-123456"
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Fecha de Inicio</Label>
                      <Input
                        type="date"
                        value={formData.fechaInicio}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fechaInicio: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Fecha de Vencimiento *</Label>
                      <Input
                        type="date"
                        value={formData.fechaVencimiento}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fechaVencimiento: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  {/* Financial */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Prima Anual (€) *</Label>
                      <Input
                        type="number"
                        value={formData.prima}
                        onChange={(e) => setFormData({ ...formData, prima: e.target.value })}
                        placeholder="1200"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Cobertura (€) *</Label>
                      <Input
                        type="number"
                        value={formData.cobertura}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cobertura: e.target.value,
                          })
                        }
                        placeholder="500000"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Franquicia (€)</Label>
                      <Input
                        type="number"
                        value={formData.franquicia}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            franquicia: e.target.value,
                          })
                        }
                        placeholder="300"
                      />
                    </div>
                  </div>

                  {/* Observations */}
                  <div className="space-y-2">
                    <Label>Observaciones</Label>
                    <Textarea
                      value={formData.observaciones}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          observaciones: e.target.value,
                        })
                      }
                      placeholder="Notas adicionales sobre la póliza..."
                      rows={3}
                    />
                  </div>

                  {selectedQuote && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Datos prellenados desde cotización de{' '}
                        <strong>{selectedQuote.provider}</strong>. Puedes modificarlos antes de
                        guardar.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? 'Creando...' : 'Crear Seguro'}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
