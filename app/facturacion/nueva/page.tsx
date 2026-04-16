'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Serie {
  id: string;
  prefijo: string;
  nombre: string;
  ultimoNumero: number;
  impuestoPorDefecto: { iva: number; irpf: number };
  activa: boolean;
}

interface UnitOption {
  id: string;
  display: string;
}

export default function NuevaFacturaPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [series, setSeries] = useState<Serie[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    serieId: '',
    tipo: 'factura' as 'factura' | 'proforma' | 'rectificativa',
    destinatarioNombre: '',
    destinatarioNif: '',
    inmueble: '',
    concepto: '',
    baseImponible: '',
    iva: 21,
    irpf: 0,
    notas: '',
  });

  useEffect(() => {
    if (session?.user) {
      loadSeries();
      loadUnits();
    }
  }, [session]);

  const loadSeries = async () => {
    try {
      const res = await fetch('/api/facturacion/series');
      if (res.ok) {
        const json = await res.json();
        const data = (json.data || []).filter((s: Serie) => s.activa);
        setSeries(data);
        if (data.length > 0 && !form.serieId) {
          const defaultSerie = data.find((s: Serie) => s.prefijo.startsWith('F-')) || data[0];
          setForm((f) => ({
            ...f,
            serieId: defaultSerie.id,
            iva: defaultSerie.impuestoPorDefecto.iva,
            irpf: defaultSerie.impuestoPorDefecto.irpf,
          }));
        }
      }
    } catch {
      toast.error('Error al cargar series');
    } finally {
      setLoading(false);
    }
  };

  const loadUnits = async () => {
    try {
      const res = await fetch('/api/units?limit=100');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.data || data.units || [];
        setUnits(
          list.map((u: { id: string; numero?: string; building?: { nombre?: string; direccion?: string } }) => ({
            id: u.id,
            display: u.building
              ? `${u.building.nombre || u.building.direccion || 'Edificio'} - ${u.numero || u.id}`
              : u.numero || u.id,
          }))
        );
      }
    } catch {
      // Silently fail - inmueble is optional
    }
  };

  const selectedSerie = series.find((s) => s.id === form.serieId);

  const base = parseFloat(form.baseImponible) || 0;
  const ivaImporte = (base * form.iva) / 100;
  const irpfImporte = (base * form.irpf) / 100;
  const totalImpuestos = ivaImporte - irpfImporte;
  const total = base + totalImpuestos;

  const siguienteNumero = selectedSerie
    ? `${selectedSerie.prefijo}${String(selectedSerie.ultimoNumero + 1).padStart(5, '0')}`
    : '-';

  const handleSerieChange = (id: string) => {
    const s = series.find((x) => x.id === id);
    setForm((f) => ({
      ...f,
      serieId: id,
      iva: s?.impuestoPorDefecto.iva ?? 21,
      irpf: s?.impuestoPorDefecto.irpf ?? 0,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.serieId || !form.destinatarioNombre.trim() || !form.concepto.trim()) {
      toast.error('Serie, destinatario y concepto son obligatorios');
      return;
    }
    const baseNum = parseFloat(form.baseImponible);
    if (isNaN(baseNum) || baseNum < 0) {
      toast.error('Base imponible debe ser un número válido');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/facturacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serieId: selectedSerie?.prefijo || form.serieId,
          tipo: form.tipo,
          destinatario: {
            nombre: form.destinatarioNombre.trim(),
            nif: form.destinatarioNif.trim() || undefined,
          },
          inmueble: form.inmueble.trim() || undefined,
          concepto: form.concepto.trim(),
          baseImponible: baseNum,
          iva: form.iva,
          irpf: form.irpf,
          notas: form.notas.trim() || undefined,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        toast.success('Factura creada correctamente');
        router.push(`/facturacion/${json.data.id}`);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error al crear factura');
      }
    } catch {
      toast.error('Error al crear factura');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-2xl mx-auto flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/facturacion')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nueva factura</h1>
            <p className="text-muted-foreground">
              Crea una factura, proforma o rectificativa
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Datos de la factura
              </CardTitle>
              <CardDescription>
                Número auto-generado: {siguienteNumero}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Serie *</Label>
                  <Select value={form.serieId} onValueChange={handleSerieChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar serie" />
                    </SelectTrigger>
                    <SelectContent>
                      {series.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.prefijo} - {s.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={form.tipo}
                    onValueChange={(v) => setForm({ ...form, tipo: v as typeof form.tipo })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="factura">Factura</SelectItem>
                      <SelectItem value="proforma">Proforma</SelectItem>
                      <SelectItem value="rectificativa">Rectificativa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Destinatario (nombre) *</Label>
                <Input
                  placeholder="Nombre o razón social"
                  value={form.destinatarioNombre}
                  onChange={(e) => setForm({ ...form, destinatarioNombre: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>NIF/CIF</Label>
                <Input
                  placeholder="12345678A o B12345678"
                  value={form.destinatarioNif}
                  onChange={(e) => setForm({ ...form, destinatarioNif: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Inmueble (opcional)</Label>
                {units.length > 0 ? (
                  <Select
                    value={form.inmueble || '__none__'}
                    onValueChange={(v) => setForm({ ...form, inmueble: v === '__none__' ? '' : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar inmueble" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Ninguno</SelectItem>
                      {units.map((u) => (
                        <SelectItem key={u.id} value={u.display}>
                          {u.display}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="Ej: Calle Mayor 15, 3ºB"
                    value={form.inmueble}
                    onChange={(e) => setForm({ ...form, inmueble: e.target.value })}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>Concepto *</Label>
                <Input
                  placeholder="Ej: Alquiler mensual marzo 2025"
                  value={form.concepto}
                  onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Base imponible (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.baseImponible}
                  onChange={(e) => setForm({ ...form, baseImponible: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>IVA %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.iva}
                    onChange={(e) => setForm({ ...form, iva: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>IRPF %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.irpf}
                    onChange={(e) => setForm({ ...form, irpf: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {base > 0 && (
                <div className="bg-muted p-4 rounded-lg space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Base imponible:</span>
                    <span>€{base.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA ({form.iva}%):</span>
                    <span>€{ivaImporte.toFixed(2)}</span>
                  </div>
                  {form.irpf > 0 && (
                    <div className="flex justify-between">
                      <span>IRPF ({form.irpf}%):</span>
                      <span>-€{irpfImporte.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>€{total.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  placeholder="Notas adicionales..."
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Creando...' : 'Crear factura'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push('/facturacion')}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
