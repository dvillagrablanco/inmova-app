'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Change {
  field: string;
  from: any;
  to: any;
  willApply: boolean;
}

interface PreviewResult {
  success: boolean;
  unit: { id: string; numero: string; buildingId: string };
  currentValues: Record<string, any>;
  autoFillResult: {
    source: 'escritura' | 'catastro_unidad' | 'catastro_edificio_matching' | 'none';
    confidence: 'high' | 'medium' | 'low';
    fields: Record<string, any>;
    rawNote?: string;
  };
  changes: Change[];
}

const fieldLabels: Record<string, string> = {
  superficie: 'Superficie (m²)',
  superficieUtil: 'Sup. útil (m²)',
  habitaciones: 'Habitaciones',
  banos: 'Baños',
  planta: 'Planta',
  orientacion: 'Orientación',
  referenciaCatastral: 'Ref. catastral',
  anoConstruccion: 'Año construcción',
  uso: 'Uso',
};

const sourceLabels: Record<string, string> = {
  escritura: 'Escritura notarial (alta fiabilidad)',
  catastro_unidad: 'Catastro (RC de la unidad — alta fiabilidad)',
  catastro_edificio_matching: 'Catastro edificio + matching automático',
  none: 'Sin datos disponibles',
};

const confidenceColor: Record<string, string> = {
  high: 'bg-green-600 text-white',
  medium: 'bg-amber-500 text-white',
  low: 'bg-gray-400 text-white',
};

export function AutoFillDimensionsButton({ unitId }: { unitId: string }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [open, setOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const router = useRouter();

  const handlePreview = async () => {
    setLoading(true);
    setPreview(null);
    try {
      const res = await fetch(
        `/api/units/${unitId}/auto-fill-dimensions?preview=true`,
        { method: 'POST', cache: 'no-store' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al consultar fuentes');
      setPreview(data);
      setOpen(true);
    } catch (e: any) {
      toast.error(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (force = false) => {
    if (!preview) return;
    setApplying(true);
    try {
      const res = await fetch(
        `/api/units/${unitId}/auto-fill-dimensions${force ? '?force=true' : ''}`,
        { method: 'POST', cache: 'no-store' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error aplicando');
      const updated = data.applied?.updatedUnit || 0;
      if (updated > 0) {
        toast.success(`✅ ${updated} campo(s) actualizado(s) desde ${sourceLabels[data.autoFillResult?.source || 'none']}`);
        setOpen(false);
        // Refresh la página para que se vean los nuevos valores
        router.refresh();
      } else {
        toast.info('Sin cambios aplicados (datos ya estaban actualizados)');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error aplicando');
    } finally {
      setApplying(false);
    }
  };

  const renderValue = (v: any) => {
    if (v === null || v === undefined || v === '') return <span className="text-muted-foreground">—</span>;
    if (v === 0) return <span className="text-muted-foreground">0</span>;
    return <span className="font-mono">{String(v)}</span>;
  };

  const willApplyCount = preview?.changes.filter((c) => c.willApply).length || 0;
  const wouldOverrideCount = preview?.changes.filter((c) => !c.willApply).length || 0;
  const noData = preview?.autoFillResult.source === 'none';

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePreview}
        disabled={loading}
        title="Auto-rellenar dimensiones desde Catastro o escrituras notariales en BD"
      >
        {loading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            Consultando…
          </>
        ) : (
          <>
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            Auto-rellenar
          </>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-600" />
              Auto-rellenar dimensiones
            </DialogTitle>
            <DialogDescription>
              {preview && (
                <>
                  Fuente:{' '}
                  <Badge className={confidenceColor[preview.autoFillResult.confidence] || ''}>
                    {sourceLabels[preview.autoFillResult.source] || preview.autoFillResult.source}
                  </Badge>{' '}
                  {preview.autoFillResult.rawNote && (
                    <span className="text-xs text-muted-foreground block mt-1">
                      {preview.autoFillResult.rawNote}
                    </span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {noData && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 text-sm text-amber-900 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                No se han encontrado datos en escrituras procesadas ni en Catastro para esta
                unidad. Puedes:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>
                    Subir una escritura notarial (PDF) en{' '}
                    <a className="underline" href="/firma-digital">
                      Firma Digital
                    </a>{' '}
                    o procesarla con OCR.
                  </li>
                  <li>
                    Verificar la referencia catastral del edificio en{' '}
                    <a className="underline" href={`/edificios/${preview?.unit.buildingId || ''}`}>
                      el edificio
                    </a>
                    .
                  </li>
                  <li>Rellenar los campos manualmente en "Editar".</li>
                </ul>
              </div>
            </div>
          )}

          {preview && !noData && preview.changes.length === 0 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 text-sm text-blue-900 flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
              Los datos en BD ya coinciden con la fuente. Sin cambios pendientes.
            </div>
          )}

          {preview && !noData && preview.changes.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {willApplyCount} cambio(s) se aplicarán automáticamente
                {wouldOverrideCount > 0 &&
                  `. ${wouldOverrideCount} requerirían sobrescribir valores existentes (botón "Sobrescribir todo")`}
                .
              </p>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left">Campo</th>
                      <th className="px-3 py-2 text-left">Actual</th>
                      <th className="px-3 py-2 text-left">Detectado</th>
                      <th className="px-3 py-2 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.changes.map((c, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2 font-medium">
                          {fieldLabels[c.field] || c.field}
                        </td>
                        <td className="px-3 py-2">{renderValue(c.from)}</td>
                        <td className="px-3 py-2 text-violet-700">{renderValue(c.to)}</td>
                        <td className="px-3 py-2 text-center">
                          {c.willApply ? (
                            <Badge variant="outline" className="text-green-700 border-green-300">
                              ✓ Aplicar
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-700 border-amber-300">
                              Conservar
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={applying}>
              Cancelar
            </Button>
            {preview && !noData && willApplyCount > 0 && (
              <Button onClick={() => handleApply(false)} disabled={applying}>
                {applying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Aplicando…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Aplicar {willApplyCount} cambio(s)
                  </>
                )}
              </Button>
            )}
            {preview && !noData && wouldOverrideCount > 0 && (
              <Button
                variant="destructive"
                onClick={() => handleApply(true)}
                disabled={applying}
              >
                <FileText className="h-4 w-4 mr-1" />
                Sobrescribir todo ({preview.changes.length})
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
