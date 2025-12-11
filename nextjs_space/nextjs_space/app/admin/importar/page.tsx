'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Upload,
  FileText,
  Home,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Download,
  X,
  Eye,
  FileSpreadsheet,
  Database,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import logger, { logError } from '@/lib/logger';

type ImportStep = 'select' | 'validate' | 'preview' | 'import' | 'results';

interface ValidationResult {
  valid: boolean;
  errors: any[];
  warnings: string[];
  preview: any[];
  totalRecords?: number;
}

interface ImportResult {
  success: boolean;
  totalRows: number;
  successfulImports: number;
  failedImports: number;
  errors: any[];
  warnings: string[];
  importedIds: string[];
}

const SYSTEM_INFO: Record<
  string,
  { name: string; description: string; icon: string; website?: string }
> = {
  homming: {
    name: 'Homming',
    description: 'Sistema de gestión inmobiliaria español',
    icon: '🏢',
    website: 'https://www.homming.es',
  },
  rentger: {
    name: 'Rentger',
    description: 'Software de administración de fincas',
    icon: '🏘️',
    website: 'https://www.rentger.com',
  },
  nester: {
    name: 'Nester',
    description: 'Plataforma de gestión de alquileres',
    icon: '🏠',
    website: 'https://www.nester.com',
  },
  buildium: {
    name: 'Buildium',
    description: 'Property management software (USA)',
    icon: '🇺🇸',
    website: 'https://www.buildium.com',
  },
  appfolio: {
    name: 'AppFolio',
    description: 'Cloud-based property management',
    icon: '☁️',
    website: 'https://www.appfolio.com',
  },
  generic_csv: {
    name: 'CSV Genérico',
    description: 'Formato CSV estándar con cabeceras descriptivas',
    icon: '📄',
  },
};

const ENTITY_LABELS = {
  buildings: 'Edificios',
  units: 'Unidades',
  tenants: 'Inquilinos',
  contracts: 'Contratos',
  payments: 'Pagos',
  providers: 'Proveedores',
  expenses: 'Gastos',
};

export default function ImportarPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<ImportStep>('select');
  const [file, setFile] = useState<File | null>(null);
  const [entityType, setEntityType] = useState('');
  const [sourceSystem, setSourceSystem] = useState('generic_csv');
  const [buildingId, setBuildingId] = useState('auto-detect');
  const [buildings, setBuildings] = useState<any[]>([]);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    if (entityType === 'units') {
      fetchBuildings();
    }
  }, [entityType]);

  const fetchBuildings = async () => {
    try {
      const response = await fetch('/api/buildings');
      if (response.ok) {
        const data = await response.json();
        setBuildings(data);
      }
    } catch (error) {
      logger.error('Error fetching buildings:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error('Por favor selecciona un archivo CSV');
        return;
      }
      setFile(selectedFile);
      setCurrentStep('validate');
    }
  };

  const handleValidate = async () => {
    if (!file || !entityType) {
      toast.error('Por favor selecciona un archivo y un tipo de datos');
      return;
    }

    setValidating(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', entityType);
      formData.append('sourceSystem', sourceSystem);

      const response = await fetch('/api/import/validate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setValidationResult(data);
        if (data.valid) {
          setCurrentStep('preview');
          toast.success('Validación completada sin errores');
        } else {
          toast.error(`Se encontraron ${data.errors.length} errores de validación`);
        }
      } else {
        toast.error(data.error || 'Error al validar el archivo');
      }
    } catch (error) {
      logger.error('Error validating:', error);
      toast.error('Error al validar el archivo');
    } finally {
      setValidating(false);
    }
  };

  const handleImport = async () => {
    if (!file || !entityType) {
      return;
    }

    setImporting(true);
    setCurrentStep('import');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', entityType);
      formData.append('sourceSystem', sourceSystem);
      if (buildingId && buildingId !== 'auto-detect') {
        formData.append('buildingId', buildingId);
      }

      const response = await fetch('/api/import/execute', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setImportResult(data);
        setCurrentStep('results');
        if (data.success) {
          toast.success(`Importación completada: ${data.successfulImports} registros importados`);
        } else {
          toast.error('La importación falló completamente');
        }
      } else {
        toast.error(data.error || 'Error al importar datos');
        setCurrentStep('preview');
      }
    } catch (error) {
      logger.error('Error importing:', error);
      toast.error('Error al importar datos');
      setCurrentStep('preview');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setEntityType('');
    setSourceSystem('generic_csv');
    setBuildingId('auto-detect');
    setValidationResult(null);
    setImportResult(null);
    setCurrentStep('select');
  };

  const downloadTemplate = () => {
    if (!entityType) {
      toast.error('Selecciona primero el tipo de datos');
      return;
    }
    window.open(`/api/import/template?entityType=${entityType}`, '_blank');
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {['select', 'validate', 'preview', 'import', 'results'].map((step, index) => {
        const isActive = currentStep === step;
        const isCompleted =
          ['select', 'validate', 'preview', 'import', 'results'].indexOf(currentStep) > index;

        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
              </div>
              <span className="text-xs mt-1 text-center hidden sm:block">
                {step === 'select' && 'Seleccionar'}
                {step === 'validate' && 'Validar'}
                {step === 'preview' && 'Vista Previa'}
                {step === 'import' && 'Importar'}
                {step === 'results' && 'Resultados'}
              </span>
            </div>
            {index < 4 && (
              <div className={`flex-1 h-1 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderSelectStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Sistema de Origen
          </CardTitle>
          <CardDescription>Selecciona el sistema desde el que estás migrando</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(SYSTEM_INFO).map(([key, info]) => (
              <Card
                key={key}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  sourceSystem === key ? 'ring-2 ring-indigo-600' : ''
                }`}
                onClick={() => setSourceSystem(key)}
              >
                <CardContent className="p-4">
                  <div className="text-3xl mb-2">{info.icon}</div>
                  <h3 className="font-semibold">{info.name}</h3>
                  <p className="text-sm text-muted-foreground">{info.description}</p>
                  {info.website && (
                    <a
                      href={info.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mt-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Más info <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Tipo de Datos a Importar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="entityType">Selecciona el tipo de datos</Label>
            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de datos" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ENTITY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {entityType === 'units' && buildings.length > 0 && (
            <div>
              <Label htmlFor="buildingId">Edificio (opcional)</Label>
              <Select value={buildingId} onValueChange={setBuildingId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un edificio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto-detect">Detectar automáticamente</SelectItem>
                  {buildings.map((building) => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.nombre} - {building.direccion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Si no se especifica, se intentará asociar cada unidad a su edificio automáticamente
              </p>
            </div>
          )}

          {entityType && (
            <Button onClick={downloadTemplate} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Descargar Plantilla CSV
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Subir Archivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors">
              <Input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm font-medium">Click para seleccionar archivo CSV</p>
                <p className="text-xs text-muted-foreground mt-1">o arrastra y suelta aquí</p>
              </label>
            </div>
            {file && (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {(file.size / 1024).toFixed(2)} KB
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setFile(null);
                    setCurrentStep('select');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderValidateStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Validar Datos
        </CardTitle>
        <CardDescription>
          Verificaremos que el archivo contenga todos los campos obligatorios y que los datos sean
          válidos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {file && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900">Archivo seleccionado</h4>
                <p className="text-sm text-blue-700 mt-1">{file.name}</p>
                <p className="text-xs text-blue-600 mt-1">
                  Tipo: {ENTITY_LABELS[entityType as keyof typeof ENTITY_LABELS]}
                  <br />
                  Sistema: {SYSTEM_INFO[sourceSystem as keyof typeof SYSTEM_INFO].name}
                </p>
              </div>
            </div>
          </div>
        )}

        {validationResult && (
          <div className="space-y-4">
            {validationResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Errores encontrados ({validationResult.errors.length})</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {validationResult.errors.slice(0, 5).map((error, index) => (
                      <li key={index} className="text-sm">
                        Fila {error.row}: {error.message}
                      </li>
                    ))}
                  </ul>
                  {validationResult.errors.length > 5 && (
                    <p className="text-sm mt-2">
                      Y {validationResult.errors.length - 5} errores más...
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {validationResult.warnings.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Advertencias ({validationResult.warnings.length})</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {validationResult.warnings.slice(0, 3).map((warning, index) => (
                      <li key={index} className="text-sm">
                        {warning}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {validationResult.valid && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-900">Validación exitosa</AlertTitle>
                <AlertDescription className="text-green-700">
                  El archivo contiene {validationResult.totalRecords} registros válidos listos para
                  importar.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleReset} variant="outline" className="flex-1">
            Cancelar
          </Button>
          <Button
            onClick={handleValidate}
            disabled={validating || !file || !entityType}
            className="flex-1 gradient-primary"
          >
            {validating ? 'Validando...' : 'Validar Archivo'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Vista Previa de Datos
          </CardTitle>
          <CardDescription>Primeros registros que se importarán</CardDescription>
        </CardHeader>
        <CardContent>
          {validationResult?.preview && validationResult.preview.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(validationResult.preview[0]).map((key) => (
                      <TableHead key={key}>{key}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validationResult.preview.map((row, index) => (
                    <TableRow key={index}>
                      {Object.values(row).map((value: any, cellIndex) => (
                        <TableCell key={cellIndex}>
                          {value !== null && value !== undefined ? String(value) : '-'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No hay datos para mostrar</p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleReset} variant="outline" className="flex-1">
          Cancelar
        </Button>
        <Button
          onClick={handleImport}
          disabled={importing || !validationResult?.valid}
          className="flex-1 gradient-primary"
        >
          <ArrowRight className="h-4 w-4 mr-2" />
          Continuar con Importación
        </Button>
      </div>
    </div>
  );

  const renderImportStep = () => (
    <Card>
      <CardContent className="py-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <h3 className="text-lg font-semibold">Importando datos...</h3>
          <p className="text-sm text-muted-foreground">
            Por favor espera mientras procesamos tu archivo
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const renderResultsStep = () => (
    <div className="space-y-6">
      {importResult && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {importResult.success ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                )}
                Resultados de la Importación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-gray-900">{importResult.totalRows}</div>
                    <div className="text-sm text-muted-foreground">Total registros</div>
                  </CardContent>
                </Card>
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-700">
                      {importResult.successfulImports}
                    </div>
                    <div className="text-sm text-green-600">Importados exitosamente</div>
                  </CardContent>
                </Card>
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-red-700">
                      {importResult.failedImports}
                    </div>
                    <div className="text-sm text-red-600">Fallidos</div>
                  </CardContent>
                </Card>
              </div>

              {importResult.successfulImports > 0 && (
                <div className="mt-4">
                  <Progress
                    value={(importResult.successfulImports / importResult.totalRows) * 100}
                    className="h-2"
                  />
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    {((importResult.successfulImports / importResult.totalRows) * 100).toFixed(1)}%
                    completado
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {importResult.errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  Errores ({importResult.errors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fila</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importResult.errors.map((error, index) => (
                        <TableRow key={index}>
                          <TableCell>{error.row}</TableCell>
                          <TableCell className="text-red-600">{error.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {importResult.warnings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700">
                  <AlertCircle className="h-5 w-5" />
                  Advertencias ({importResult.warnings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {importResult.warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-yellow-700">
                      {warning}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="flex gap-2">
        <Button onClick={handleReset} className="flex-1 gradient-primary">
          Nueva Importación
        </Button>
        <Button onClick={() => router.push(`/${entityType}`)} variant="outline" className="flex-1">
          Ver {ENTITY_LABELS[entityType as keyof typeof ENTITY_LABELS]}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/home">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Importar Datos</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="mb-8">
              <h1 className="text-3xl font-bold gradient-text mb-2">
                Migración desde Otros Sistemas
              </h1>
              <p className="text-muted-foreground">
                Importa tus datos desde Homming, Rentger, Nester, Buildium, AppFolio y otros
                sistemas de gestión
              </p>
            </div>

            {renderStepIndicator()}

            {currentStep === 'select' && renderSelectStep()}
            {currentStep === 'validate' && renderValidateStep()}
            {currentStep === 'preview' && renderPreviewStep()}
            {currentStep === 'import' && renderImportStep()}
            {currentStep === 'results' && renderResultsStep()}
          </div>
        </main>
      </div>
    </div>
  );
}
