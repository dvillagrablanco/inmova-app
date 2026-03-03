'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Home,
  Upload,
  FileSpreadsheet,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Landmark,
  FileType,
  Banknote,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type TabId =
  | 'diario'
  | 'mapeo'
  | 'mt940'
  | 'mt535'
  | 'pictet';

interface JournalResult {
  company?: string;
  totalEntries?: number;
  totalDebe?: number;
  totalHaber?: number;
  dateRange?: { from?: string; to?: string };
  success?: boolean;
  entriesProcessed?: number;
  entriesWithAuxiliar1Override?: number;
  entriesFromMapping?: number;
  entriesDefault?: number;
  byCostCenter?: Record<string, number>;
  byCategory?: Record<string, number>;
  errors?: string[];
}

interface AnalyticsMappingResult {
  company?: string;
  totalAccounts?: number;
  monthsAvailable?: string[];
}

interface SwiftResult {
  type: 'mt940' | 'mt535';
  statementCount?: number;
  statements?: Array<{
    accountId?: string;
    currency?: string;
    statementNumber?: string;
    openingBalance?: number;
    closingBalance?: number;
    transactionCount?: number;
    totalMarketValue?: number;
    positionCount?: number;
  }>;
  totalBalance?: number;
  totalMarketValue?: number;
}

interface PictetResult {
  accountName?: string;
  currency?: string;
  period?: string;
  transactionCount?: number;
  closingBalance?: number;
}

type ImportResult =
  | JournalResult
  | AnalyticsMappingResult
  | SwiftResult
  | PictetResult
  | null;

const TAB_CONFIG: Record<
  TabId,
  {
    label: string;
    icon: React.ElementType;
    description: string;
    accept: string;
    endpoint: string;
    extraFormData?: Record<string, string>;
  }
> = {
  diario: {
    label: 'Diario Contable',
    icon: FileSpreadsheet,
    description: 'Importar extracto de subcuentas de Vidaro, Rovida o Viroda',
    accept: '.xlsx',
    endpoint: '/api/family-office/import/journal',
  },
  mapeo: {
    label: 'Mapeo Analítica',
    icon: Building2,
    description: 'Importar mapeo de subcuentas a centros de coste (DIR, CDI, DF-GEN, DI-COGE)',
    accept: '.xlsx',
    endpoint: '/api/family-office/import/analytics-mapping',
  },
  mt940: {
    label: 'SWIFT MT940',
    icon: Landmark,
    description: 'Extracto bancario estándar (Inversis, Banca March)',
    accept: '.txt,.sta',
    endpoint: '/api/family-office/import/swift',
    extraFormData: { type: 'mt940' },
  },
  mt535: {
    label: 'SWIFT MT535',
    icon: FileType,
    description: 'Posiciones de custodia (CACEIS, Banca March, Inversis)',
    accept: '.txt',
    endpoint: '/api/family-office/import/swift',
    extraFormData: { type: 'mt535' },
  },
  pictet: {
    label: 'Pictet PDF',
    icon: Banknote,
    description: 'Extracto mensual de inversiones Pictet (EUR o USD)',
    accept: '.pdf',
    endpoint: '/api/family-office/import/pictet-pdf',
  },
};

function FileDropZone({
  accept,
  file,
  onFileChange,
  disabled,
  label,
  id,
}: {
  accept: string;
  file: File | null;
  onFileChange: (f: File | null) => void;
  disabled?: boolean;
  label: string;
  id: string;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled) return;
      const dropped = e.dataTransfer.files?.[0];
      if (dropped) {
        onFileChange(dropped);
      }
    },
    [disabled, onFileChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    onFileChange(selected ?? null);
  };

  const acceptList = accept.split(',').map((a) => a.trim());

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging && 'border-primary bg-primary/5',
          !isDragging && 'border-muted-foreground/25 hover:border-muted-foreground/50',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
      >
        <input
          type="file"
          id={id}
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />
        <label
          htmlFor={id}
          className={cn(
            'cursor-pointer block',
            disabled && 'cursor-not-allowed pointer-events-none'
          )}
        >
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm font-medium">
            {file ? file.name : 'Arrastra el archivo aquí o haz clic para seleccionar'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Formatos: {acceptList.join(', ')}
          </p>
          {file && (
            <Badge variant="secondary" className="mt-2">
              {(file.size / 1024).toFixed(1)} KB
            </Badge>
          )}
        </label>
      </div>
    </div>
  );
}

function ResultCard({
  tabId,
  result,
}: {
  tabId: TabId;
  result: ImportResult;
}) {
  if (!result) return null;

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Importación completada
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tabId === 'diario' && (
          <>
            {(result as JournalResult).company && (
              <p>
                <span className="font-medium">Empresa:</span>{' '}
                {(result as JournalResult).company}
              </p>
            )}
            {(result as JournalResult).totalEntries !== undefined && (
              <p>
                <span className="font-medium">Asientos:</span>{' '}
                {(result as JournalResult).totalEntries}
              </p>
            )}
            {(result as JournalResult).totalDebe !== undefined && (
              <p>
                <span className="font-medium">Total Debe:</span>{' '}
                {(result as JournalResult).totalDebe?.toLocaleString('es-ES', {
                  minimumFractionDigits: 2,
                })}{' '}
                €
              </p>
            )}
            {(result as JournalResult).totalHaber !== undefined && (
              <p>
                <span className="font-medium">Total Haber:</span>{' '}
                {(result as JournalResult).totalHaber?.toLocaleString('es-ES', {
                  minimumFractionDigits: 2,
                })}{' '}
                €
              </p>
            )}
            {(result as JournalResult).dateRange && (
              <p>
                <span className="font-medium">Período:</span>{' '}
                {(result as JournalResult).dateRange?.from} -{' '}
                {(result as JournalResult).dateRange?.to}
              </p>
            )}
            {(result as JournalResult).entriesProcessed !== undefined && (
              <p>
                <span className="font-medium">Procesados:</span>{' '}
                {(result as JournalResult).entriesProcessed}
              </p>
            )}
          </>
        )}
        {tabId === 'mapeo' && (
          <>
            {(result as AnalyticsMappingResult).company && (
              <p>
                <span className="font-medium">Empresa:</span>{' '}
                {(result as AnalyticsMappingResult).company}
              </p>
            )}
            {(result as AnalyticsMappingResult).totalAccounts !== undefined && (
              <p>
                <span className="font-medium">Subcuentas:</span>{' '}
                {(result as AnalyticsMappingResult).totalAccounts}
              </p>
            )}
            {(result as AnalyticsMappingResult).monthsAvailable && (
              <p>
                <span className="font-medium">Meses disponibles:</span>{' '}
                {(result as AnalyticsMappingResult).monthsAvailable?.join(', ')}
              </p>
            )}
          </>
        )}
        {(tabId === 'mt940' || tabId === 'mt535') && (
          <>
            {(result as SwiftResult).statementCount !== undefined && (
              <p>
                <span className="font-medium">Extractos:</span>{' '}
                {(result as SwiftResult).statementCount}
              </p>
            )}
            {(result as SwiftResult).statements?.map((s, i) => (
              <div key={i} className="text-sm border-l-2 border-green-300 pl-3">
                <p>
                  <span className="font-medium">Cuenta:</span> {s.accountId}
                </p>
                {s.currency && <p>Moneda: {s.currency}</p>}
                {s.transactionCount !== undefined && (
                  <p>Transacciones: {s.transactionCount}</p>
                )}
                {s.closingBalance !== undefined && (
                  <p>
                    Saldo: {s.closingBalance?.toLocaleString('es-ES', { minimumFractionDigits: 2 })}{' '}
                    €
                  </p>
                )}
                {s.positionCount !== undefined && (
                  <p>Posiciones: {s.positionCount}</p>
                )}
                {s.totalMarketValue !== undefined && (
                  <p>
                    Valor mercado: {s.totalMarketValue?.toLocaleString('es-ES', { minimumFractionDigits: 2 })}{' '}
                    €
                  </p>
                )}
              </div>
            ))}
            {(result as SwiftResult).totalBalance !== undefined && (
              <p className="font-medium">
                Saldo total: {(result as SwiftResult).totalBalance?.toLocaleString('es-ES', { minimumFractionDigits: 2 })}{' '}
                €
              </p>
            )}
            {(result as SwiftResult).totalMarketValue !== undefined && (
              <p className="font-medium">
                Valor mercado total: {(result as SwiftResult).totalMarketValue?.toLocaleString('es-ES', { minimumFractionDigits: 2 })}{' '}
                €
              </p>
            )}
          </>
        )}
        {tabId === 'pictet' && (
          <>
            {(result as PictetResult).accountName && (
              <p>
                <span className="font-medium">Cuenta:</span>{' '}
                {(result as PictetResult).accountName}
              </p>
            )}
            {(result as PictetResult).currency && (
              <p>
                <span className="font-medium">Moneda:</span>{' '}
                {(result as PictetResult).currency}
              </p>
            )}
            {(result as PictetResult).period && (
              <p>
                <span className="font-medium">Período:</span>{' '}
                {(result as PictetResult).period}
              </p>
            )}
            {(result as PictetResult).transactionCount !== undefined && (
              <p>
                <span className="font-medium">Transacciones:</span>{' '}
                {(result as PictetResult).transactionCount}
              </p>
            )}
            {(result as PictetResult).closingBalance !== undefined && (
              <p>
                <span className="font-medium">Saldo cierre:</span>{' '}
                {(result as PictetResult).closingBalance?.toLocaleString('es-ES', { minimumFractionDigits: 2 })}{' '}
                {(result as PictetResult).currency || 'EUR'}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function ImportarContabilidadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabId>('diario');
  const [files, setFiles] = useState<Partial<Record<TabId, File>>>({});
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<Partial<Record<TabId, ImportResult>>>({});
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (
    file: File,
    endpoint: string,
    extraFormData?: Record<string, string>
  ) => {
    setUploading(true);
    setError(null);
    setResults((prev) => ({ ...prev, [activeTab]: null }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (extraFormData) {
        Object.entries(extraFormData).forEach(([k, v]) => formData.append(k, v));
      }

      const res = await fetch(endpoint, { method: 'POST', body: formData });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}: ${res.statusText}`);
      }

      setResults((prev) => ({ ...prev, [activeTab]: data }));
      toast.success('Archivo importado correctamente');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al importar';
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleTabUpload = () => {
    const file = files[activeTab];
    const config = TAB_CONFIG[activeTab];
    if (!file || !config) {
      toast.error('Selecciona un archivo primero');
      return;
    }
    handleUpload(file, config.endpoint, config.extraFormData);
  };

  const setFileForTab = (tab: TabId, file: File | null) => {
    setFiles((prev) => {
      const next = { ...prev };
      if (file) next[tab] = file;
      else delete next[tab];
      return next;
    });
    setError(null);
    setResults((prev) => ({ ...prev, [tab]: null }));
  };

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  const adminRoles = ['super_admin', 'administrador'];
  if (!adminRoles.includes(session.user?.role || '')) {
    router.push('/dashboard');
    return null;
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Importar Datos Financieros</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Importar Datos Financieros</h1>
          <p className="text-muted-foreground mt-1">
            Importar datos del Director Financiero: diarios contables, mapeos analíticos, extractos
            SWIFT y PDFs de Pictet
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto flex-wrap gap-1">
            {(Object.entries(TAB_CONFIG) as [TabId, (typeof TAB_CONFIG)[TabId]][]).map(
              ([id, config]) => {
                const Icon = config.icon;
                return (
                  <TabsTrigger key={id} value={id} className="flex items-center gap-2 text-xs">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">{config.label}</span>
                  </TabsTrigger>
                );
              }
            )}
          </TabsList>

          {(Object.entries(TAB_CONFIG) as [TabId, (typeof TAB_CONFIG)[TabId]][]).map(
            ([tabId, config]) => {
              const Icon = config.icon;
              const file = files[tabId];
              const result = results[tabId];
              const isActive = activeTab === tabId;

              return (
                <TabsContent key={tabId} value={tabId} className="space-y-4 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        {config.label}
                      </CardTitle>
                      <CardDescription>{config.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FileDropZone
                        accept={config.accept}
                        file={file ?? null}
                        onFileChange={(f) => setFileForTab(tabId, f)}
                        disabled={uploading}
                        label="Archivo"
                        id={`file-upload-${tabId}`}
                      />

                      {error && isActive && (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <Button
                        onClick={handleTabUpload}
                        disabled={!file || uploading}
                        className="gap-2"
                      >
                        {uploading && isActive ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Importando...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Importar
                          </>
                        )}
                      </Button>

                      {result && isActive && <ResultCard tabId={tabId} result={result} />}
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            }
          )}
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
