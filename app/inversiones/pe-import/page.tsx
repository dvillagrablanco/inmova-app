'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Upload, FileText, CheckCircle, AlertTriangle, Loader2, Home, Brain, RefreshCw, Briefcase,
} from 'lucide-react';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';

interface ImportResult {
  success: boolean;
  file: string;
  transactionsParsed: number;
  fundsDetected: number;
  updated: number;
  created: number;
  funds: Array<{
    name: string;
    transactions: number;
    totalCalled: number;
    totalDistributed: number;
    netInvested: number;
  }>;
  message?: string;
}

export default function PEImportPage() {
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/pe/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResult(data);
        toast.success(`${data.transactionsParsed} transacciones procesadas de ${data.fundsDetected} fondos`);
      } else {
        toast.error(data.error || data.message || 'Error procesando archivo');
        if (data.parsed === 0) {
          setResult({ ...data, success: false, funds: [] });
        }
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/inversiones">Inversiones</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Importar PE</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            Importar Datos Private Equity
          </h1>
          <p className="text-muted-foreground">
            Sube documentos de MdF Gestefin para actualizar automáticamente tu portfolio PE
          </p>
        </div>

        {/* Upload area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Subir Documento
            </CardTitle>
            <CardDescription>
              Acepta Excel (.xlsx, .csv) con transacciones PE y PDF con informes de MdF
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
                dragOver ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950' : 'border-gray-300 hover:border-indigo-400'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('pe-file-input')?.click()}
            >
              {file ? (
                <div className="space-y-2">
                  <FileText className="mx-auto h-12 w-12 text-indigo-500" />
                  <p className="text-lg font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} KB · {file.type || 'documento'}
                  </p>
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}>
                    Cambiar archivo
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div>
                    <p className="text-lg font-medium">Arrastra el archivo aquí</p>
                    <p className="text-sm text-muted-foreground">o haz click para seleccionar</p>
                  </div>
                  <div className="flex justify-center gap-2">
                    <Badge variant="outline">.xlsx</Badge>
                    <Badge variant="outline">.csv</Badge>
                    <Badge variant="outline">.pdf</Badge>
                  </div>
                </div>
              )}
              <input
                id="pe-file-input"
                type="file"
                accept=".xlsx,.xls,.csv,.pdf"
                className="hidden"
                onChange={(e) => { setFile(e.target.files?.[0] || null); setResult(null); }}
              />
            </div>

            {/* AI indicator */}
            <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
              <Brain className="h-5 w-5 text-indigo-600" />
              <div className="text-sm">
                <p className="font-medium text-indigo-800 dark:text-indigo-200">Procesamiento con IA</p>
                <p className="text-indigo-600 dark:text-indigo-400">
                  Los Excel se parsean directamente. Los PDF se analizan con Claude AI para extraer las transacciones automáticamente.
                </p>
              </div>
            </div>

            <Button
              onClick={handleUpload}
              disabled={!file || loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Procesando con IA...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  Procesar e Importar
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <>
            {/* Summary */}
            <Card className={result.success ? 'border-green-200' : 'border-amber-200'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  )}
                  {result.success ? 'Importación Completada' : 'Sin Datos'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{result.transactionsParsed}</p>
                    <p className="text-xs text-muted-foreground">Transacciones</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{result.fundsDetected}</p>
                    <p className="text-xs text-muted-foreground">Fondos detectados</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{result.updated}</p>
                    <p className="text-xs text-muted-foreground">Actualizados</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{result.created}</p>
                    <p className="text-xs text-muted-foreground">Nuevos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Funds detail */}
            {result.funds && result.funds.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Detalle por Fondo</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fondo</TableHead>
                        <TableHead className="text-right">Operaciones</TableHead>
                        <TableHead className="text-right">Capital Calls</TableHead>
                        <TableHead className="text-right">Distribuciones</TableHead>
                        <TableHead className="text-right">Neto Invertido</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.funds.map((fund) => (
                        <TableRow key={fund.name}>
                          <TableCell className="font-medium">{fund.name}</TableCell>
                          <TableCell className="text-right">{fund.transactions}</TableCell>
                          <TableCell className="text-right">{fmt(fund.totalCalled)}</TableCell>
                          <TableCell className="text-right text-green-600">{fmt(fund.totalDistributed)}</TableCell>
                          <TableCell className="text-right font-bold">{fmt(fund.netInvested)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="border-t-2 font-bold">
                        <TableCell>TOTAL</TableCell>
                        <TableCell className="text-right">{result.funds.reduce((s, f) => s + f.transactions, 0)}</TableCell>
                        <TableCell className="text-right">{fmt(result.funds.reduce((s, f) => s + f.totalCalled, 0))}</TableCell>
                        <TableCell className="text-right text-green-600">{fmt(result.funds.reduce((s, f) => s + f.totalDistributed, 0))}</TableCell>
                        <TableCell className="text-right">{fmt(result.funds.reduce((s, f) => s + f.netInvested, 0))}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Formatos soportados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-medium">📊 Excel MdF Gestefin (.xlsx, .csv)</p>
              <p className="text-muted-foreground">
                Formato estándar con columnas: Estado, F.operación, ISIN (nombre fondo), Sentido (Compra/Venta), Efectivo final. 
                Se detectan automáticamente las cabeceras.
              </p>
            </div>
            <div>
              <p className="font-medium">📄 PDF MdF Gestefin</p>
              <p className="text-muted-foreground">
                Informes trimestrales, reportes de cartera o extractos de movimientos. 
                La IA (Claude) analiza el documento y extrae las transacciones automáticamente.
              </p>
            </div>
            <div>
              <p className="font-medium">🔄 Actualización incremental</p>
              <p className="text-muted-foreground">
                Al importar, los fondos existentes se actualizan con los nuevos totales. 
                Los fondos nuevos se crean automáticamente. No se duplican transacciones.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
