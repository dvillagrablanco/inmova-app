'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, FileText, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LoadingState } from '@/components/ui/loading-state';

interface BatchItem {
  id: string;
  name: string | null;
  status: string;
  progress: number;
  totalFiles: number;
  processedFiles: number;
  successfulFiles: number;
  failedFiles: number;
  createdAt: string;
}

export default function DocumentosImportarPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [batchName, setBatchName] = useState('');
  const [batchDescription, setBatchDescription] = useState('');
  const [autoApprove, setAutoApprove] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState('0.8');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchBatches = async () => {
    try {
      const res = await fetch('/api/onboarding/documents/batches?limit=10');
      if (res.ok) {
        const data = await res.json();
        setBatches(data.data || []);
      }
    } catch {
      toast.error('Error cargando batches');
    } finally {
      setLoadingBatches(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchBatches();
    }
  }, [session]);

  const totalSize = useMemo(
    () => files.reduce((sum, file) => sum + file.size, 0),
    [files]
  );

  const handleFiles = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list);
    setFiles((prev) => [...prev, ...next]);
  };

  const handleClear = () => {
    setFiles([]);
  };

  const handleUpload = async () => {
    if (!files.length) {
      toast.error('Selecciona archivos o carpeta');
      return;
    }

    setUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      const options = {
        batchName: batchName || undefined,
        batchDescription: batchDescription || undefined,
        autoApprove,
        confidenceThreshold: parseFloat(confidenceThreshold || '0.8'),
      };
      formData.append('options', JSON.stringify(options));

      const res = await fetch('/api/onboarding/documents/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      setResult(data);

      if (res.ok) {
        toast.success('Importación iniciada');
        fetchBatches();
        if (data.batchId) {
          router.push(`/documentos/importar/${data.batchId}`);
        }
      } else {
        toast.error(data.error || 'Error en la importación');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error en la importación');
    } finally {
      setUploading(false);
    }
  };

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <LoadingState message="Cargando..." />
      </AuthenticatedLayout>
    );
  }

  if (!session) return null;

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/documentos')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Documentos
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Carga masiva de documentos</h1>
          <p className="text-muted-foreground">
            Sube múltiples archivos o una carpeta completa para análisis automático.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Importación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre del lote</Label>
                <Input
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="Ej: Documentación Reina"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input
                  value={batchDescription}
                  onChange={(e) => setBatchDescription(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Archivos</Label>
                <Input
                  type="file"
                  multiple
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <p className="text-xs text-muted-foreground">
                  Puedes añadir múltiples archivos o usar carga de carpeta.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Carpeta completa</Label>
                <input
                  type="file"
                  multiple
                  // @ts-expect-error webkitdirectory
                  webkitdirectory="true"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <p className="text-xs text-muted-foreground">
                  Disponible en Chrome/Edge. Selecciona una carpeta completa.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
                <span className="text-sm">Auto aprobar alta confianza</span>
              </div>
              <div className="flex items-center gap-2">
                <Label>Umbral</Label>
                <Input
                  className="w-24"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(e.target.value)}
                  placeholder="0.8"
                />
              </div>
            </div>

            <div className="rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span>Archivos seleccionados</span>
                <span className="font-semibold">{files.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tamaño total</span>
                <span className="font-semibold">
                  {(totalSize / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              {uploading && <Progress value={60} className="mt-2" />}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleUpload} disabled={uploading}>
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? 'Subiendo...' : 'Iniciar importación'}
              </Button>
              <Button variant="outline" onClick={handleClear} disabled={uploading}>
                Limpiar selección
              </Button>
            </div>

            {result && (
              <div className="rounded-lg border p-3 text-sm">
                <div className="font-medium">{result.message}</div>
                <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
                  <span>Total: {result.totalFiles}</span>
                  <span>Exitosos: {result.successfulFiles}</span>
                  <span>Fallidos: {result.failedFiles}</span>
                  {result.batchId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/documentos/importar/${result.batchId}`)}
                    >
                      Ver batch
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimos batches</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingBatches ? (
              <LoadingState message="Cargando batches..." />
            ) : batches.length === 0 ? (
              <div className="text-sm text-muted-foreground">No hay batches recientes</div>
            ) : (
              <div className="space-y-3">
                {batches.map((batch) => (
                  <div
                    key={batch.id}
                    className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{batch.name || 'Lote sin nombre'}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(batch.createdAt), 'PPpp', { locale: es })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {batch.successfulFiles}/{batch.totalFiles} procesados · {batch.status}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="hidden w-40 md:block">
                        <Progress value={batch.progress} />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/documentos/importar/${batch.id}`)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Ver detalle
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
