'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Building,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Info,
  Download,
  ExternalLink,
  Banknote,
  Home,
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';

interface ImportResult {
  success: boolean;
  resumen: {
    fichero: string;
    empresa: string;
    cuentas: Array<{
      iban: string;
      banco: string;
      transacciones: number;
      duplicadas: number;
      saldoInicial: number;
      saldoFinal: number;
    }>;
    totalTransacciones: number;
    totalDuplicadas: number;
    errores: string[];
    avisos: string[];
  };
  message: string;
}

interface CompanyOption {
  id: string;
  nombre: string;
  iban?: string | null;
}

export default function ImportarExtractoBancarioPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cargar empresas del usuario dinámicamente
  const loadCompanies = useCallback(async () => {
    try {
      setLoadingCompanies(true);
      const res = await fetch('/api/bank-import/companies');
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
        // Auto-seleccionar si solo hay una
        if (data.companies?.length === 1) {
          setSelectedCompany(data.companies[0].id);
        }
      }
    } catch {
      // Silenciar error - las empresas se pueden seleccionar manualmente
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  // Cargar empresas al montar
  useEffect(() => { loadCompanies(); }, [loadCompanies]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar extensión
      const validExtensions = ['.n43', '.txt', '.aeb', '.q43', '.c43'];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!validExtensions.includes(ext)) {
        toast.error(`Extensión no válida. Extensiones aceptadas: ${validExtensions.join(', ')}`);
        return;
      }
      setSelectedFile(file);
      setImportResult(null);
      setError(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
      setError(null);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleUpload = async () => {
    if (!selectedFile || !selectedCompany) {
      toast.error('Selecciona una sociedad y un fichero');
      return;
    }

    setIsUploading(true);
    setError(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('companyId', selectedCompany);

      const response = await fetch('/api/bank-import/norma43', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al importar fichero');
        if (data.details) {
          setError(`${data.error}: ${Array.isArray(data.details) ? data.details.join(', ') : data.details}`);
        }
        toast.error(data.error || 'Error al importar');
        return;
      }

      setImportResult(data);
      toast.success(data.message);
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
      toast.error('Error al importar fichero');
    } finally {
      setIsUploading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push('/finanzas')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Finanzas
          </Button>
        </div>

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/finanzas">Finanzas</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Importar Extracto Bancario</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Banknote className="h-8 w-8 text-primary" />
            Importar Extracto Bancario
          </h1>
          <p className="text-muted-foreground mt-2">
            Sube el fichero Norma 43 descargado de tu banca online para importar movimientos
          </p>
        </div>

        {/* Instrucciones */}
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800 dark:text-blue-200">Como obtener el fichero de Bankinter</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300 mt-2">
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Entra en <strong>Bankinter Online</strong> (empresas.bankinter.com)</li>
              <li>Ve a <strong>Cuentas</strong> &rarr; <strong>Movimientos</strong></li>
              <li>Selecciona el rango de fechas deseado</li>
              <li>Pulsa <strong>Descargar</strong> &rarr; Formato <strong>Norma 43</strong> (.n43 o .q43)</li>
              <li>Sube el fichero descargado aqui abajo</li>
            </ol>
            <p className="mt-2 text-xs text-blue-600">
              Compatible con Bankinter, BBVA, Santander, CaixaBank, Sabadell, ING y cualquier banco espanol.
              Coste: gratuito.
            </p>
          </AlertDescription>
        </Alert>

        {/* Formulario de importación */}
        <Card>
          <CardHeader>
            <CardTitle>Subir Extracto</CardTitle>
            <CardDescription>
              Selecciona la sociedad y arrastra el fichero Norma 43
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selector de sociedad */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sociedad</label>
              {loadingCompanies ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Cargando sociedades...
                </div>
              ) : companies.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No se encontraron sociedades. Contacta con el administrador.
                </p>
              ) : (
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la sociedad..." />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          {c.nombre}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Zona de drop */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                selectedFile
                  ? 'border-green-300 bg-green-50 dark:bg-green-950/20'
                  : 'border-gray-300 hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-900'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".n43,.txt,.aeb,.q43,.c43"
                onChange={handleFileChange}
                className="hidden"
              />
              {selectedFile ? (
                <div className="space-y-2">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
                  <p className="font-semibold text-green-800 dark:text-green-300">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB - Click para cambiar
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="font-medium">Arrastra el fichero aqui o haz click para seleccionar</p>
                  <p className="text-sm text-muted-foreground">
                    Formatos: .n43, .q43, .c43, .aeb, .txt
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => { setSelectedFile(null); setImportResult(null); setError(null); }}>
              Limpiar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !selectedCompany || isUploading}
            >
              {isUploading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Importar Movimientos
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Resultado de la importación */}
        {importResult && importResult.success && (
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                Importacion Completada
              </CardTitle>
              <CardDescription>
                {importResult.message}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Resumen por cuenta */}
              {importResult.resumen.cuentas.map((cuenta, i) => (
                <div key={i} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{cuenta.banco}</span>
                      <Badge variant="outline">****{cuenta.iban.slice(-4)}</Badge>
                    </div>
                    <Badge className="bg-green-500">{cuenta.transacciones} importadas</Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Saldo Inicial</p>
                      <p className={`font-semibold ${cuenta.saldoInicial >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(cuenta.saldoInicial)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Saldo Final</p>
                      <p className={`font-semibold ${cuenta.saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(cuenta.saldoFinal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Movimientos</p>
                      <p className="font-semibold">{cuenta.transacciones}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Duplicadas (omitidas)</p>
                      <p className="font-semibold text-orange-600">{cuenta.duplicadas}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Avisos */}
              {importResult.resumen.avisos.length > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside text-sm">
                      {importResult.resumen.avisos.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Acciones post-importación */}
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={() => router.push('/finanzas/conciliacion')}>
                  Ir a Conciliacion
                </Button>
                <Button variant="outline" onClick={() => { setSelectedFile(null); setImportResult(null); }}>
                  Importar otro fichero
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info adicional */}
        <Card className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30">
          <CardContent className="py-6">
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold">Norma 43</h3>
                <p className="text-sm text-muted-foreground">
                  Formato estandar AEB usado por todos los bancos espanoles
                </p>
              </div>
              <div>
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-semibold">Conciliacion Automatica</h3>
                <p className="text-sm text-muted-foreground">
                  Los movimientos se cruzan automaticamente con pagos pendientes
                </p>
              </div>
              <div>
                <Banknote className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-semibold">Coste Cero</h3>
                <p className="text-sm text-muted-foreground">
                  Sin licencias, sin APIs de pago, sin intermediarios
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
