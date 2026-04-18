'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Building2,
  FileText,
  Upload,
  Plus,
  Loader2,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Policy {
  id: string;
  tipo: string;
  aseguradora: string;
  numeroPoliza: string;
  sumaAsegurada: number | null;
  primaAnual: number | null;
  fechaVencimiento: string;
  estado: string;
  documentoPath: string | null;
  buildingName?: string;
  unidadesCubiertas?: number;
  unitNumero?: string;
}

interface SiblingPolicy {
  id: string;
  tipo: string;
  aseguradora: string;
  numeroPoliza: string;
  unitNumero: string;
  estado: string;
}

interface CoverageData {
  hasCoverage: boolean;
  coverageSource: 'direct' | 'building' | 'both' | 'none';
  directPolicies: Policy[];
  buildingPolicies: Policy[];
  siblingPolicies?: SiblingPolicy[];
  buildingId?: string;
  buildingName?: string;
  unitNumber?: string;
  summary: {
    totalPolicies: number;
    activePolicies: number;
    totalCoverage: number;
  };
}

const tiposSeguro = [
  { value: 'hogar', label: 'Hogar/Vivienda' },
  { value: 'comunidad', label: 'Comunidad/Edificio' },
  { value: 'responsabilidad_civil', label: 'Responsabilidad Civil' },
  { value: 'impago_alquiler', label: 'Impago de Alquiler' },
  { value: 'incendio', label: 'Incendio' },
  { value: 'robo', label: 'Robo' },
  { value: 'otro', label: 'Otro' },
];

export function InsuranceCoverageCard({ unitId }: { unitId: string }) {
  const [data, setData] = useState<CoverageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    tipo: 'hogar',
    aseguradora: '',
    numeroPoliza: '',
    nombreAsegurado: '',
    fechaInicio: '',
    fechaVencimiento: '',
    primaAnual: '',
    sumaAsegurada: '',
    file: null as File | null,
  });

  const reload = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/units/${unitId}/insurance-coverage`, {
        cache: 'no-store',
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // Silently fail - insurance is supplementary info
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, [unitId]);

  if (loading) return null;
  if (!data) return null;

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(n);

  const allPolicies = [...data.directPolicies, ...data.buildingPolicies];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm((f) => ({ ...f, file }));
  };

  const handleUpload = async () => {
    if (!form.tipo || !form.aseguradora || !form.numeroPoliza || !form.nombreAsegurado) {
      toast.error('Completa los campos obligatorios');
      return;
    }
    if (!form.fechaVencimiento) {
      toast.error('Indica la fecha de vencimiento');
      return;
    }

    setUploading(true);
    try {
      // 1) Si hay archivo, subir primero a S3 y obtener URL
      let urlDocumento: string | null = null;
      if (form.file) {
        const fd = new FormData();
        fd.append('files', form.file);
        fd.append('folder', 'seguros');
        // Detectar tipo: image o document (PDF)
        const isImage = form.file.type.startsWith('image/');
        fd.append('fileType', isImage ? 'image' : 'document');

        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          urlDocumento =
            uploadData.uploads?.[0]?.url ||
            uploadData.url ||
            uploadData.fileUrl ||
            uploadData.location ||
            null;
        } else {
          const err = await uploadRes.json().catch(() => ({}));
          toast.warning(
            `Subida de PDF falló: ${err.error || uploadRes.statusText}. Se creará la póliza sin documento.`
          );
        }
      }

      // 2) Crear el seguro
      const res = await fetch('/api/seguros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: form.tipo,
          unitId,
          buildingId: data.buildingId || null,
          aseguradora: form.aseguradora,
          numeroPoliza: form.numeroPoliza,
          nombreAsegurado: form.nombreAsegurado,
          fechaInicio: form.fechaInicio || new Date().toISOString(),
          fechaVencimiento: new Date(form.fechaVencimiento).toISOString(),
          primaAnual: form.primaAnual ? parseFloat(form.primaAnual) : null,
          sumaAsegurada: form.sumaAsegurada ? parseFloat(form.sumaAsegurada) : null,
          urlDocumento,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al crear el seguro');
      }

      toast.success('Seguro cargado correctamente');
      setUploadOpen(false);
      setForm({
        tipo: 'hogar',
        aseguradora: '',
        numeroPoliza: '',
        nombreAsegurado: '',
        fechaInicio: '',
        fechaVencimiento: '',
        primaAnual: '',
        sumaAsegurada: '',
        file: null,
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      await reload();
    } catch (e: any) {
      toast.error(e.message || 'Error al crear el seguro');
    } finally {
      setUploading(false);
    }
  };

  const newSeguroLink = `/seguros/nuevo?unitId=${encodeURIComponent(unitId)}${
    data.buildingId ? `&buildingId=${encodeURIComponent(data.buildingId)}` : ''
  }`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {data.hasCoverage ? (
            <ShieldCheck className="h-5 w-5 text-green-600" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-amber-500" />
          )}
          Seguro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.hasCoverage ? (
          <>
            {/* Coverage badge */}
            <div
              className={`p-3 rounded-lg ${
                data.coverageSource === 'building'
                  ? 'bg-blue-50 dark:bg-blue-950'
                  : data.coverageSource === 'direct'
                    ? 'bg-green-50 dark:bg-green-950'
                    : 'bg-emerald-50 dark:bg-emerald-950'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-green-600 text-white text-xs">Asegurado</Badge>
                {data.coverageSource === 'building' && (
                  <Badge variant="outline" className="text-xs">
                    <Building2 className="h-3 w-3 mr-1" />
                    Póliza de edificio
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.summary.activePolicies} póliza
                {data.summary.activePolicies !== 1 ? 's' : ''} activa
                {data.summary.activePolicies !== 1 ? 's' : ''}
                {data.summary.totalCoverage > 0 &&
                  ` · Cobertura: ${fmt(data.summary.totalCoverage)}`}
              </p>
            </div>

            {/* Policy details */}
            {allPolicies.map((policy) => (
              <div key={policy.id} className="border rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">
                    {policy.tipo.replace('_', ' ')}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      policy.estado === 'activa'
                        ? 'border-green-300 text-green-700'
                        : 'border-red-300 text-red-700'
                    }`}
                  >
                    {policy.estado}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{policy.aseguradora}</p>
                <p className="text-xs font-mono text-muted-foreground">
                  Póliza: {policy.numeroPoliza}
                </p>
                {policy.buildingName && (
                  <p className="text-xs text-blue-600 flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Cubre todo {policy.buildingName}
                    {policy.unidadesCubiertas
                      ? ` (${policy.unidadesCubiertas} unidades)`
                      : ''}
                  </p>
                )}
                {policy.sumaAsegurada && (
                  <p className="text-xs">
                    Suma asegurada: <strong>{fmt(policy.sumaAsegurada)}</strong>
                  </p>
                )}
                {(policy as any).cobertura && (
                  <details className="mt-1">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                      Ver coberturas de tu unidad
                    </summary>
                    <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs text-muted-foreground leading-relaxed">
                      {(policy as any).cobertura
                        .split(/[.,;]/)
                        .filter((c: string) => c.trim())
                        .map((c: string, i: number) => (
                          <p key={i} className="flex items-start gap-1 mb-0.5">
                            <span className="text-green-500 flex-shrink-0">✓</span>
                            <span>{c.trim()}</span>
                          </p>
                        ))}
                    </div>
                  </details>
                )}
                <div className="flex gap-2 pt-1">
                  <Link href={`/seguros/${policy.id}`}>
                    <Button variant="outline" size="sm" className="text-xs h-7">
                      <FileText className="h-3 w-3 mr-1" />
                      Ver póliza
                    </Button>
                  </Link>
                  {policy.documentoPath && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => window.open(policy.documentoPath!, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Documento
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Acción para añadir otra póliza */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="text-xs flex-1"
                onClick={() => setUploadOpen(true)}
              >
                <Upload className="h-3 w-3 mr-1" />
                Añadir póliza
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="text-center py-3">
              <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-amber-400" />
              <p className="text-sm font-medium text-amber-700">Sin seguro activo</p>
              <p className="text-xs text-muted-foreground">
                Esta unidad no tiene póliza de seguro activa, ni directa ni a través del
                edificio.
              </p>
            </div>

            {/* Pólizas hermanas: existen pólizas en el mismo edificio para otras unidades */}
            {data.siblingPolicies && data.siblingPolicies.length > 0 && (
              <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-900">
                    Este edificio tiene {data.siblingPolicies.length} póliza
                    {data.siblingPolicies.length !== 1 ? 's' : ''} en otra
                    {data.siblingPolicies.length !== 1 ? 's' : ''} unidad
                    {data.siblingPolicies.length !== 1 ? 'es' : ''}:
                  </div>
                </div>
                <ul className="space-y-1 ml-6">
                  {data.siblingPolicies.slice(0, 5).map((p) => (
                    <li key={p.id} className="text-xs flex items-center justify-between">
                      <span>
                        <span className="capitalize">{p.tipo.replace('_', ' ')}</span> ·{' '}
                        {p.aseguradora} · Unidad {p.unitNumero}
                      </span>
                      <Link href={`/seguros/${p.id}`}>
                        <Button variant="ghost" size="sm" className="h-5 px-1 text-xs">
                          Ver
                        </Button>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Acciones */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="default"
                size="sm"
                className="text-xs"
                onClick={() => setUploadOpen(true)}
              >
                <Upload className="h-3 w-3 mr-1" />
                Cargar seguro
              </Button>
              <Link href={newSeguroLink} className="contents">
                <Button variant="outline" size="sm" className="text-xs w-full">
                  <Shield className="h-3 w-3 mr-1" />
                  Contratar nuevo
                </Button>
              </Link>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              "Cargar seguro": sube el PDF de una póliza ya existente. "Contratar nuevo":
              compara cotizaciones.
            </p>
          </div>
        )}
      </CardContent>

      {/* Dialog para cargar póliza existente */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cargar póliza existente</DialogTitle>
            <DialogDescription>
              Sube el PDF y los datos básicos de una póliza ya contratada.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ic-tipo">Tipo *</Label>
                <Select
                  value={form.tipo}
                  onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}
                >
                  <SelectTrigger id="ic-tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposSeguro.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ic-aseg">Aseguradora *</Label>
                <Input
                  id="ic-aseg"
                  value={form.aseguradora}
                  onChange={(e) => setForm((f) => ({ ...f, aseguradora: e.target.value }))}
                  placeholder="Ej. AXA, Mapfre…"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ic-num">Nº póliza *</Label>
                <Input
                  id="ic-num"
                  value={form.numeroPoliza}
                  onChange={(e) => setForm((f) => ({ ...f, numeroPoliza: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="ic-asegurado">Tomador *</Label>
                <Input
                  id="ic-asegurado"
                  value={form.nombreAsegurado}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nombreAsegurado: e.target.value }))
                  }
                  placeholder="Nombre del asegurado"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ic-inicio">Inicio</Label>
                <Input
                  id="ic-inicio"
                  type="date"
                  value={form.fechaInicio}
                  onChange={(e) => setForm((f) => ({ ...f, fechaInicio: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="ic-fin">Vencimiento *</Label>
                <Input
                  id="ic-fin"
                  type="date"
                  value={form.fechaVencimiento}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fechaVencimiento: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ic-prima">Prima anual (€)</Label>
                <Input
                  id="ic-prima"
                  type="number"
                  value={form.primaAnual}
                  onChange={(e) => setForm((f) => ({ ...f, primaAnual: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="ic-suma">Suma asegurada (€)</Label>
                <Input
                  id="ic-suma"
                  type="number"
                  value={form.sumaAsegurada}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sumaAsegurada: e.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="ic-file">Documento PDF (opcional)</Label>
              <Input
                id="ic-file"
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/*"
                onChange={handleFileChange}
              />
              {form.file && (
                <p className="text-xs text-muted-foreground mt-1">
                  Archivo: {form.file.name} ({(form.file.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={uploading}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Cargando…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Crear póliza
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
