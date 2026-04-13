'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';

export default function EditarContratoGestionPage() {
  const router = useRouter();
  const params = useParams();
  const { status } = useSession();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    propietario: '',
    inmuebles: '',
    tipo: 'integral',
    honorariosTipo: 'porcentaje' as 'porcentaje' | 'fijo',
    honorariosValor: '',
    fechaInicio: '',
    fechaFin: '',
    condiciones: '',
    estado: 'activo',
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !id) return;
    (async () => {
      try {
        const res = await fetch(`/api/contratos-gestion/${id}`);
        if (!res.ok) {
          toast.error('Contrato no encontrado');
          router.push('/contratos-gestion');
          return;
        }
        const c = await res.json();
        const honorariosTipo = c.honorarios != null ? 'fijo' : 'porcentaje';
        const honorariosValor =
          c.honorarios != null ? String(c.honorarios) : String(c.honorariosPorcentaje ?? '');
        setForm({
          propietario: c.propietario || '',
          inmuebles: Array.isArray(c.inmuebles) ? c.inmuebles.join(', ') : '',
          tipo: c.tipo || 'integral',
          honorariosTipo,
          honorariosValor,
          fechaInicio: c.fechaInicio ? c.fechaInicio.slice(0, 10) : '',
          fechaFin: c.fechaFin ? c.fechaFin.slice(0, 10) : '',
          condiciones: c.condiciones || '',
          estado: c.estado || 'activo',
        });
      } catch {
        toast.error('Error al cargar');
        router.push('/contratos-gestion');
      } finally {
        setLoading(false);
      }
    })();
  }, [status, id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.propietario || !form.honorariosValor || !form.fechaInicio) {
      toast.error('Completa los campos obligatorios');
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        propietario: form.propietario,
        inmuebles: form.inmuebles
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        tipo: form.tipo,
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin || form.fechaInicio,
        condiciones: form.condiciones || undefined,
        estado: form.estado,
      };
      if (form.honorariosTipo === 'fijo') {
        body.honorarios = parseFloat(form.honorariosValor);
        body.honorariosPorcentaje = null;
      } else {
        body.honorariosPorcentaje = parseFloat(form.honorariosValor);
        body.honorarios = null;
      }

      const res = await fetch(`/api/contratos-gestion/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Error');
      toast.success('Contrato actualizado');
      router.push(`/contratos-gestion/${id}`);
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="container max-w-3xl py-6 px-4">
          <Skeleton className="h-10 w-full" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4 max-w-3xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/contratos-gestion/${id}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">Editar contrato de gestión</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Datos del contrato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="propietario">Propietario *</Label>
                  <Input
                    id="propietario"
                    value={form.propietario}
                    onChange={(e) => setForm({ ...form, propietario: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inmuebles">Inmuebles (coma)</Label>
                  <Input
                    id="inmuebles"
                    value={form.inmuebles}
                    onChange={(e) => setForm({ ...form, inmuebles: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="integral">Gestión integral</SelectItem>
                      <SelectItem value="parcial">Gestión parcial</SelectItem>
                      <SelectItem value="subarriendo">Subarriendo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Honorarios</Label>
                  <Select
                    value={form.honorariosTipo}
                    onValueChange={(v) =>
                      setForm({ ...form, honorariosTipo: v as 'porcentaje' | 'fijo' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="porcentaje">% renta</SelectItem>
                      <SelectItem value="fijo">€/mes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="honorariosValor">
                    {form.honorariosTipo === 'porcentaje' ? 'Porcentaje' : 'Importe'} *
                  </Label>
                  <Input
                    id="honorariosValor"
                    type="number"
                    step="0.01"
                    value={form.honorariosValor}
                    onChange={(e) => setForm({ ...form, honorariosValor: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fechaInicio">Inicio *</Label>
                  <Input
                    id="fechaInicio"
                    type="date"
                    value={form.fechaInicio}
                    onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaFin">Fin</Label>
                  <Input
                    id="fechaFin"
                    type="date"
                    value={form.fechaFin}
                    onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="borrador">Borrador</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condiciones">Condiciones</Label>
                <Textarea
                  id="condiciones"
                  value={form.condiciones}
                  onChange={(e) => setForm({ ...form, condiciones: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
