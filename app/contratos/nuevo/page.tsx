'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { FileText, Home, ArrowLeft, Save, Upload, X, Loader2, Building2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// Cargar el analizador de contratos con IA
const ContractDocumentAnalyzer = dynamic(
  () => import('@/components/contracts/ContractDocumentAnalyzer'),
  { ssr: false }
);
import { Button } from '@/components/ui/button';
import { ButtonWithLoading } from '@/components/ui/button-with-loading';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { BackButton } from '@/components/ui/back-button';
import { MobileFormWizard, FormStep } from '@/components/ui/mobile-form-wizard';
import { Badge } from '@/components/ui/badge';
import { AIDocumentAssistant } from '@/components/ai/AIDocumentAssistant';

interface Building {
  id: string;
  nombre: string;
  direccion: string;
}

interface Unit {
  id: string;
  numero: string;
  estado: string;
  rentaMensual: number;
  building: { id: string; nombre: string };
  tenant?: { nombreCompleto: string } | null;
}

interface Tenant {
  id: string;
  nombreCompleto: string;
  email: string;
}

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  url?: string;
  uploading?: boolean;
  progress?: number;
}

export default function NuevoContratoPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [isLoading, setIsLoading] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [formData, setFormData] = useState({
    unitId: '',
    tenantId: '',
    fechaInicio: '',
    fechaFin: '',
    rentaMensual: '0',
    deposito: '0',
    tipo: 'residencial',
  });

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const docId = `doc-${Date.now()}-${i}`;
      
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} es demasiado grande (máximo 10MB)`);
        continue;
      }

      setDocuments(prev => [...prev, {
        id: docId,
        name: file.name,
        type: file.type,
        uploading: true,
        progress: 0
      }]);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'contracts');
        formData.append('entityType', 'contract');

        const progressInterval = setInterval(() => {
          setDocuments(prev => prev.map(d => 
            d.id === docId ? { ...d, progress: Math.min((d.progress || 0) + 20, 90) } : d
          ));
        }, 200);

        const response = await fetch('/api/upload/private', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);

        if (response.ok) {
          const data = await response.json();
          setDocuments(prev => prev.map(d => 
            d.id === docId ? { ...d, uploading: false, progress: 100, url: data.url || data.key } : d
          ));
          toast.success(`${file.name} subido correctamente`);
        } else {
          throw new Error('Error al subir');
        }
      } catch (error) {
        setDocuments(prev => prev.filter(d => d.id !== docId));
        toast.error(`Error al subir ${file.name}`);
      }
    }
    e.target.value = '';
  };

  const removeDocument = (docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [buildingsRes, unitsRes, tenantsRes] = await Promise.all([
          fetch('/api/buildings'),
          fetch('/api/units'), // Cargar TODAS las unidades
          fetch('/api/tenants'),
        ]);

        if (buildingsRes.ok) {
          const buildingsData = await buildingsRes.json();
          setBuildings(Array.isArray(buildingsData) ? buildingsData : buildingsData.data || []);
        }

        if (unitsRes.ok) {
          const unitsData = await unitsRes.json();
          setUnits(Array.isArray(unitsData) ? unitsData : unitsData.data || []);
        }

        if (tenantsRes.ok) {
          const tenantsData = await tenantsRes.json();
          setTenants(Array.isArray(tenantsData) ? tenantsData : tenantsData.data || []);
        }
      } catch (error) {
        logger.error('Error fetching data:', error);
      }
    };

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  // Filtrar unidades cuando cambia el edificio seleccionado
  useEffect(() => {
    if (selectedBuildingId) {
      const filtered = units.filter(unit => unit.building?.id === selectedBuildingId);
      setFilteredUnits(filtered);
      // Limpiar la unidad seleccionada si ya no está en el edificio
      if (formData.unitId && !filtered.find(u => u.id === formData.unitId)) {
        setFormData(prev => ({ ...prev, unitId: '' }));
      }
    } else {
      setFilteredUnits([]);
    }
  }, [selectedBuildingId, units]);

  // Cuando se selecciona una unidad, actualizar la renta mensual sugerida
  useEffect(() => {
    if (formData.unitId) {
      const selectedUnit = units.find(u => u.id === formData.unitId);
      if (selectedUnit && selectedUnit.rentaMensual > 0) {
        setFormData(prev => ({
          ...prev,
          rentaMensual: selectedUnit.rentaMensual.toString(),
        }));
      }
    }
  }, [formData.unitId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId: formData.unitId,
          tenantId: formData.tenantId,
          fechaInicio: new Date(formData.fechaInicio).toISOString(),
          fechaFin: new Date(formData.fechaFin).toISOString(),
          rentaMensual: parseFloat(formData.rentaMensual),
          deposito: parseFloat(formData.deposito),
          tipo: formData.tipo,
          estado: 'activo',
        }),
      });

      if (response.ok) {
        toast.success('Contrato creado correctamente');
        router.push('/contratos');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear el contrato');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al crear el contrato');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handler para datos extraídos del agente de contratos IA
  const handleContractDataExtracted = (contractData: Partial<typeof formData>, tenantData?: any) => {
    setFormData(prev => ({
      ...prev,
      ...contractData,
    }));
    
    // Si se extrajo info del inquilino, podría notificarse
    if (tenantData?.nombre) {
      toast.info(`Inquilino detectado: ${tenantData.nombre}. Selecciónalo de la lista si ya existe.`);
    }
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
                onClick={() => router.push('/contratos')}
                className="gap-2 shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a Contratos
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
                    <BreadcrumbLink href="/contratos">Contratos</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Nuevo Contrato</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Header Section */}
            <div className="space-y-4">
              <BackButton href="/contratos" label="Volver a Contratos" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Nuevo Contrato</h1>
                <p className="text-muted-foreground">Crea un nuevo contrato de arrendamiento</p>
              </div>
            </div>

            {/* Agente de Contratos IA */}
            <ContractDocumentAnalyzer 
              onDataExtracted={handleContractDataExtracted}
              currentFormData={formData}
            />

            {/* Formulario con Wizard para móvil */}
            <form onSubmit={handleSubmit}>
              <MobileFormWizard
                steps={[
                  {
                    id: 'basic',
                    title: 'Información Básica',
                    description: 'Selecciona la unidad, inquilino y tipo de contrato',
                    fields: (
                      <div className="space-y-4">
                        {/* Edificio */}
                        <div className="space-y-2">
                          <Label htmlFor="buildingId">Edificio *</Label>
                          <Select
                            value={selectedBuildingId}
                            onValueChange={(value) => {
                              setSelectedBuildingId(value);
                              setFormData(prev => ({ ...prev, unitId: '' }));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un edificio" />
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

                        {/* Unidad */}
                        <div className="space-y-2">
                          <Label htmlFor="unitId">Unidad *</Label>
                          <Select
                            value={formData.unitId}
                            onValueChange={(value) => setFormData({ ...formData, unitId: value })}
                            disabled={!selectedBuildingId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={selectedBuildingId ? "Selecciona una unidad" : "Primero selecciona un edificio"} />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredUnits.map((unit) => {
                                const estadoLabel = unit.estado?.toLowerCase();
                                const isOcupada = estadoLabel === 'ocupada' || estadoLabel === 'ocupado';
                                return (
                                  <SelectItem key={unit.id} value={unit.id}>
                                    <div className="flex items-center gap-2">
                                      <span>{unit.numero}</span>
                                      <Badge 
                                        variant={isOcupada ? "destructive" : estadoLabel === 'disponible' ? "default" : "secondary"}
                                        className="text-xs"
                                      >
                                        {unit.estado}
                                      </Badge>
                                      {unit.rentaMensual > 0 && (
                                        <span className="text-muted-foreground text-xs">
                                          €{unit.rentaMensual}/mes
                                        </span>
                                      )}
                                      {unit.tenant && (
                                        <span className="text-muted-foreground text-xs">
                                          ({unit.tenant.nombreCompleto})
                                        </span>
                                      )}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                              {filteredUnits.length === 0 && selectedBuildingId && (
                                <SelectItem value="no-units" disabled>
                                  No hay unidades en este edificio
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          {formData.unitId && (
                            <p className="text-xs text-muted-foreground">
                              {(() => {
                                const selectedUnit = filteredUnits.find(u => u.id === formData.unitId);
                                if (selectedUnit?.estado?.toLowerCase() === 'ocupada' || selectedUnit?.estado?.toLowerCase() === 'ocupado') {
                                  return `⚠️ Esta unidad está actualmente ocupada por ${selectedUnit.tenant?.nombreCompleto || 'un inquilino'}. Al crear el contrato se actualizará el estado.`;
                                }
                                return null;
                              })()}
                            </p>
                          )}
                        </div>

                        {/* Inquilino */}
                        <div className="space-y-2">
                          <Label htmlFor="tenantId">Inquilino *</Label>
                          <Select
                            value={formData.tenantId}
                            onValueChange={(value) => setFormData({ ...formData, tenantId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un inquilino" />
                            </SelectTrigger>
                            <SelectContent>
                              {tenants.map((tenant) => (
                                <SelectItem key={tenant.id} value={tenant.id}>
                                  {tenant.nombreCompleto} - {tenant.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Tipo de Contrato */}
                        <div className="space-y-2">
                          <Label htmlFor="tipo">Tipo de Contrato *</Label>
                          <Select
                            value={formData.tipo}
                            onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="residencial">Residencial</SelectItem>
                              <SelectItem value="comercial">Comercial</SelectItem>
                              <SelectItem value="temporal">Temporal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ),
                  },
                  {
                    id: 'financial',
                    title: 'Términos Financieros',
                    description: 'Define la renta mensual y el depósito de garantía',
                    fields: (
                      <div className="space-y-4">
                        {/* Renta Mensual */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="rentaMensual">Renta Mensual (€) *</Label>
                            <InfoTooltip content="Monto mensual que el inquilino debe pagar. Este valor se usará para generar automáticamente los pagos recurrentes." />
                          </div>
                          <Input
                            id="rentaMensual"
                            name="rentaMensual"
                            type="number"
                            step="0.01"
                            value={formData.rentaMensual}
                            onChange={handleChange}
                            required
                            min="0"
                            placeholder="Ej: 850.00"
                          />
                        </div>

                        {/* Depósito */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="deposito">Depósito (€) *</Label>
                            <InfoTooltip content="Cantidad de dinero que se retiene como garantía. Típicamente equivale a 1-2 meses de renta." />
                          </div>
                          <Input
                            id="deposito"
                            name="deposito"
                            type="number"
                            step="0.01"
                            value={formData.deposito}
                            onChange={handleChange}
                            required
                            min="0"
                            placeholder="Ej: 1700.00"
                          />
                        </div>
                      </div>
                    ),
                  },
                  {
                    id: 'dates',
                    title: 'Fechas y Confirmación',
                    description: 'Establece el período de vigencia del contrato',
                    fields: (
                      <div className="space-y-4">
                        {/* Fecha de Inicio */}
                        <div className="space-y-2">
                          <Label htmlFor="fechaInicio">Fecha de Inicio *</Label>
                          <Input
                            id="fechaInicio"
                            name="fechaInicio"
                            type="date"
                            value={formData.fechaInicio}
                            onChange={handleChange}
                            required
                          />
                        </div>

                        {/* Fecha de Fin */}
                        <div className="space-y-2">
                          <Label htmlFor="fechaFin">Fecha de Fin *</Label>
                          <Input
                            id="fechaFin"
                            name="fechaFin"
                            type="date"
                            value={formData.fechaFin}
                            onChange={handleChange}
                            required
                          />
                        </div>

                        {/* Carga de Documentos */}
                        <div className="space-y-3 pt-4 border-t">
                          <Label className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Documentos del Contrato
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Sube el contrato firmado, anexos, documentos de identidad, etc.
                          </p>
                          
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                            <label htmlFor="contract-doc-upload" className="cursor-pointer">
                              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-600">
                                <span className="font-medium text-primary">Click para subir</span> o arrastra archivos
                              </p>
                              <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (máx. 10MB)</p>
                              <input
                                id="contract-doc-upload"
                                type="file"
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                multiple
                                onChange={handleDocumentUpload}
                              />
                            </label>
                          </div>

                          {documents.length > 0 && (
                            <div className="space-y-2">
                              {documents.map((doc) => (
                                <div key={doc.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                    <span className="text-sm truncate">{doc.name}</span>
                                    {doc.uploading ? (
                                      <Badge variant="secondary" className="text-xs">
                                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                        {doc.progress}%
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-xs text-green-600">✓</Badge>
                                    )}
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeDocument(doc.id)}
                                    disabled={doc.uploading}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Resumen */}
                        {formData.unitId && formData.tenantId && (
                          <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-2">
                            <h4 className="font-medium text-sm">Resumen del Contrato</h4>
                            <div className="text-sm space-y-1">
                              <p>
                                <span className="text-muted-foreground">Edificio:</span>{' '}
                                {buildings.find((b) => b.id === selectedBuildingId)?.nombre}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Unidad:</span>{' '}
                                {filteredUnits.find((u) => u.id === formData.unitId)?.numero}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Inquilino:</span>{' '}
                                {tenants.find((t) => t.id === formData.tenantId)?.nombreCompleto}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Tipo:</span> {formData.tipo}
                              </p>
                              {formData.rentaMensual !== '0' && (
                                <p>
                                  <span className="text-muted-foreground">Renta:</span> €
                                  {parseFloat(formData.rentaMensual).toFixed(2)}/mes
                                </p>
                              )}
                              {formData.deposito !== '0' && (
                                <p>
                                  <span className="text-muted-foreground">Depósito:</span> €
                                  {parseFloat(formData.deposito).toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ),
                  },
                ]}
                submitButton={
                  <div className="flex gap-3">
                    <ButtonWithLoading
                      type="submit"
                      isLoading={isLoading}
                      disabled={!formData.unitId || !formData.tenantId}
                      loadingText="Guardando..."
                      icon={Save}
                    >
                      Crear Contrato
                    </ButtonWithLoading>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/contratos')}
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                  </div>
                }
              />
            </form>

            {/* Asistente IA de Documentos */}
            <AIDocumentAssistant 
              context="contratos"
              variant="floating"
              position="bottom-right"
              onApplyData={(data) => {
                // Aplicar datos extraídos del documento al formulario
                if (data.rentaMensual) setFormData(prev => ({ ...prev, rentaMensual: data.rentaMensual }));
                if (data.deposito) setFormData(prev => ({ ...prev, deposito: data.deposito }));
                if (data.fechaInicio) setFormData(prev => ({ ...prev, fechaInicio: data.fechaInicio }));
                if (data.fechaFin) setFormData(prev => ({ ...prev, fechaFin: data.fechaFin }));
                toast.success('Datos del documento aplicados al formulario');
              }}
            />
          </div>
        </AuthenticatedLayout>
  );
}
