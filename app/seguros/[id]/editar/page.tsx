'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface SeguroData {
  id: string;
  numeroPoliza: string;
  tipo: string;
  aseguradora: string;
  nombreAsegurado: string;
  telefonoAseguradora?: string;
  emailAseguradora?: string;
  contactoAgente?: string;
  cobertura?: string;
  sumaAsegurada?: number;
  franquicia?: number;
  fechaInicio: string;
  fechaVencimiento: string;
  primaMensual?: number;
  primaAnual?: number;
  estado?: string;
  notas?: string;
  buildingId?: string;
  unitId?: string;
}

export default function EditarSeguroPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SeguroData | null>(null);

  useEffect(() => {
    loadSeguro();
  }, [id]);

  async function loadSeguro() {
    try {
      const res = await fetch(`/api/seguros/${id}`);
      if (!res.ok) throw new Error('No encontrado');
      const data = await res.json();
      setForm({
        ...data,
        fechaInicio: data.fechaInicio?.split('T')[0] || '',
        fechaVencimiento: data.fechaVencimiento?.split('T')[0] || '',
      });
    } catch {
      toast.error('Error cargando seguro');
      router.push('/seguros');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/seguros/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success('Seguro actualizado');
        router.push(`/seguros/${id}`);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Error al guardar');
      }
    } catch {
      toast.error('Error de conexion');
    } finally {
      setSaving(false);
    }
  }

  const updateField = (field: string, value: any) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  if (loading || !form) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-2xl font-bold">Editar Seguro</h1>
            <p className="text-muted-foreground">Poliza: {form.numeroPoliza}</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Datos de la Poliza</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Numero de Poliza</Label>
                <Input
                  value={form.numeroPoliza}
                  onChange={(e) => updateField('numeroPoliza', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Seguro</Label>
                <Select value={form.tipo} onValueChange={(v) => updateField('tipo', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hogar">Hogar</SelectItem>
                    <SelectItem value="comunidad">Comunidad</SelectItem>
                    <SelectItem value="responsabilidad_civil">Responsabilidad Civil</SelectItem>
                    <SelectItem value="vida">Vida</SelectItem>
                    <SelectItem value="impago_alquiler">Impago Alquiler</SelectItem>
                    <SelectItem value="multirriesgo">Multirriesgo</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Aseguradora</Label>
                <Input
                  value={form.aseguradora}
                  onChange={(e) => updateField('aseguradora', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre Asegurado</Label>
                <Input
                  value={form.nombreAsegurado}
                  onChange={(e) => updateField('nombreAsegurado', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fechas y Costos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha Inicio</Label>
                <Input
                  type="date"
                  value={form.fechaInicio}
                  onChange={(e) => updateField('fechaInicio', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha Vencimiento</Label>
                <Input
                  type="date"
                  value={form.fechaVencimiento}
                  onChange={(e) => updateField('fechaVencimiento', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Prima Anual (EUR)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.primaAnual || ''}
                  onChange={(e) => updateField('primaAnual', parseFloat(e.target.value) || null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Prima Mensual (EUR)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.primaMensual || ''}
                  onChange={(e) => updateField('primaMensual', parseFloat(e.target.value) || null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Suma Asegurada (EUR)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.sumaAsegurada || ''}
                  onChange={(e) => updateField('sumaAsegurada', parseFloat(e.target.value) || null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Franquicia (EUR)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.franquicia || ''}
                  onChange={(e) => updateField('franquicia', parseFloat(e.target.value) || null)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefono Aseguradora</Label>
                <Input
                  value={form.telefonoAseguradora || ''}
                  onChange={(e) => updateField('telefonoAseguradora', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email Aseguradora</Label>
                <Input
                  type="email"
                  value={form.emailAseguradora || ''}
                  onChange={(e) => updateField('emailAseguradora', e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Contacto Agente</Label>
                <Input
                  value={form.contactoAgente || ''}
                  onChange={(e) => updateField('contactoAgente', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coberturas y Notas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Coberturas</Label>
              <Textarea
                rows={3}
                value={form.cobertura || ''}
                onChange={(e) => updateField('cobertura', e.target.value)}
                placeholder="Detalle de coberturas incluidas..."
              />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                rows={3}
                value={form.notas || ''}
                onChange={(e) => updateField('notas', e.target.value)}
                placeholder="Notas adicionales..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pb-8">
          <Button variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
