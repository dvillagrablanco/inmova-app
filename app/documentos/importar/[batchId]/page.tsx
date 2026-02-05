'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, RefreshCcw, CheckCircle, XCircle, Eye } from 'lucide-react';
import { LoadingState } from '@/components/ui/loading-state';

interface BatchDetail {
  batch: any;
  documents: any[];
  stats: any;
}

export default function DocumentosBatchDetailPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const params = useParams();
  const batchId = params?.batchId as string;
  const [data, setData] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<any>(null);
  const [openPreview, setOpenPreview] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchBatch = async () => {
    try {
      const res = await fetch(`/api/onboarding/documents/batch/${batchId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        toast.error('No se pudo cargar el batch');
      }
    } catch {
      toast.error('No se pudo cargar el batch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && batchId) {
      fetchBatch();
    }
  }, [session, batchId]);

  const bulkReview = async (action: 'approve_all' | 'approve_high_confidence' | 'reject_all') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/onboarding/documents/review?bulk=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId,
          action,
          confidenceThreshold: 0.8,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(json.message || 'Acción aplicada');
        fetchBatch();
      } else {
        toast.error(json.error || 'Error al aplicar acción');
      }
    } catch {
      toast.error('Error al aplicar acción');
    } finally {
      setActionLoading(false);
    }
  };

  const reviewDocument = async (documentId: string, action: 'approve' | 'reject') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/onboarding/documents/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, action }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(json.message || 'Documento actualizado');
        fetchBatch();
      } else {
        toast.error(json.error || 'Error al actualizar documento');
      }
    } catch {
      toast.error('Error al actualizar documento');
    } finally {
      setActionLoading(false);
    }
  };

  const loadPreview = async () => {
    try {
      const res = await fetch(`/api/onboarding/documents/apply?batchId=${batchId}`);
      const json = await res.json();
      if (res.ok) {
        setPreview(json);
        setOpenPreview(true);
      } else {
        toast.error(json.error || 'No se pudo obtener preview');
      }
    } catch {
      toast.error('No se pudo obtener preview');
    }
  };

  const applyChanges = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/onboarding/documents/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId, confirmChanges: true }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success('Cambios aplicados');
        setOpenPreview(false);
        fetchBatch();
      } else {
        toast.error(json.error || 'No se pudieron aplicar cambios');
      }
    } catch {
      toast.error('No se pudieron aplicar cambios');
    } finally {
      setActionLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <LoadingState message="Cargando batch..." />
      </AuthenticatedLayout>
    );
  }

  if (!session || !data) return null;

  const { batch, documents, stats } = data;

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/documentos/importar')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a batches
          </Button>
          <Button variant="ghost" size="sm" onClick={fetchBatch}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refrescar
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-bold">{batch.name || 'Lote sin nombre'}</h1>
          <p className="text-muted-foreground">{batch.description || 'Sin descripción'}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Progress value={batch.progress} />
              <Badge variant="secondary">{batch.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 text-sm">
              <div>Total: {stats.totalFiles}</div>
              <div>Procesados: {stats.processed}</div>
              <div>Pendientes: {stats.pending}</div>
              <div>En revisión: {stats.awaitingReview}</div>
              <div>Aprobados: {stats.approved}</div>
              <div>Rechazados: {stats.rejected}</div>
              <div>Fallidos: {stats.failed}</div>
              <div>Datos pendientes: {stats.dataAwaitingReview}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => bulkReview('approve_high_confidence')}
                disabled={actionLoading}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Aprobar alta confianza
              </Button>
              <Button
                size="sm"
                onClick={() => bulkReview('approve_all')}
                disabled={actionLoading}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Aprobar todo
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => bulkReview('reject_all')}
                disabled={actionLoading}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Rechazar todo
              </Button>
              <Button size="sm" variant="secondary" onClick={loadPreview} disabled={actionLoading}>
                <Eye className="mr-2 h-4 w-4" />
                Previsualizar cambios
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">{doc.originalFilename}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{doc.status}</Badge>
                    {doc.detectedCategory && (
                      <Badge variant="secondary">
                        {doc.detectedCategory} · {Math.round((doc.categoryConfidence || 0) * 100)}%
                      </Badge>
                    )}
                  </div>
                </div>
                {doc.errorMessage && (
                  <div className="text-sm text-red-600">Error: {doc.errorMessage}</div>
                )}
                {doc.analyses?.[0]?.summary && (
                  <div className="text-sm text-muted-foreground">{doc.analyses[0].summary}</div>
                )}
                <div className="flex flex-wrap gap-2">
                  {doc.status === 'awaiting_review' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reviewDocument(doc.id, 'approve')}
                        disabled={actionLoading}
                      >
                        Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => reviewDocument(doc.id, 'reject')}
                        disabled={actionLoading}
                      >
                        Rechazar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Dialog open={openPreview} onOpenChange={setOpenPreview}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Previsualización de cambios</DialogTitle>
            </DialogHeader>
            {preview ? (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <div>Crear: {preview.summary?.willCreate}</div>
                  <div>Actualizar: {preview.summary?.willUpdate}</div>
                  <div>Conflictos: {preview.summary?.conflicts}</div>
                </div>
                <div className="rounded border p-2 max-h-64 overflow-auto">
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(preview.preview, null, 2)}
                  </pre>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpenPreview(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={applyChanges} disabled={actionLoading}>
                    Aplicar cambios
                  </Button>
                </div>
              </div>
            ) : (
              <LoadingState message="Cargando preview..." />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
