'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function EditarUnidadPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const id = params.id as string;

  const [form, setForm] = useState({
    numero: '',
    tipo: 'vivienda',
    estado: 'disponible',
    planta: '',
    superficie: '',
    habitaciones: '',
    banos: '',
    rentaMensual: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (!id || !session) return;
    (async () => {
      try {
        const res = await fetch(`/api/units/${id}`);
        if (res.ok) {
          const data = await res.json();
          setForm({
            numero: data.numero || '',
            tipo: data.tipo || 'vivienda',
            estado: data.estado || 'disponible',
            planta: data.planta?.toString() || '',
            superficie: data.superficie?.toString() || '',
            habitaciones: data.habitaciones?.toString() || '',
            banos: data.banos?.toString() || '',
            rentaMensual: data.rentaMensual?.toString() || '',
          });
        } else {
          toast.error('Unidad no encontrada');
        }
      } catch {
        toast.error('Error al cargar la unidad');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/units/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: form.numero,
          tipo: form.tipo,
          estado: form.estado,
          planta: form.planta ? parseInt(form.planta) : undefined,
          superficie: form.superficie ? parseFloat(form.superficie) : undefined,
          habitaciones: form.habitaciones ? parseInt(form.habitaciones) : undefined,
          banos: form.banos ? parseInt(form.banos) : undefined,
          rentaMensual: form.rentaMensual ? parseFloat(form.rentaMensual) : undefined,
        }),
      });
      if (res.ok) {
        toast.success('Unidad actualizada');
        router.push(`/unidades/${id}`);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error al actualizar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/unidades/${id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Editar Unidad</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader><CardTitle>Información de la Unidad</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Número / Identificador *</Label>
                  <Input value={form.numero} onChange={e => setForm(p => ({ ...p, numero: e.target.value }))} required />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vivienda">Vivienda</SelectItem>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="oficina">Oficina</SelectItem>
                      <SelectItem value="garaje">Garaje</SelectItem>
                      <SelectItem value="trastero">Trastero</SelectItem>
                      <SelectItem value="nave_industrial">Nave Industrial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estado</Label>
                  <Select value={form.estado} onValueChange={v => setForm(p => ({ ...p, estado: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disponible">Disponible</SelectItem>
                      <SelectItem value="ocupada">Ocupada</SelectItem>
                      <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                      <SelectItem value="reservada">Reservada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Planta</Label>
                  <Input type="number" value={form.planta} onChange={e => setForm(p => ({ ...p, planta: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Superficie (m²)</Label>
                  <Input type="number" step="0.01" value={form.superficie} onChange={e => setForm(p => ({ ...p, superficie: e.target.value }))} />
                </div>
                <div>
                  <Label>Habitaciones</Label>
                  <Input type="number" value={form.habitaciones} onChange={e => setForm(p => ({ ...p, habitaciones: e.target.value }))} />
                </div>
                <div>
                  <Label>Baños</Label>
                  <Input type="number" value={form.banos} onChange={e => setForm(p => ({ ...p, banos: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Renta Mensual (€)</Label>
                <Input type="number" step="0.01" value={form.rentaMensual} onChange={e => setForm(p => ({ ...p, rentaMensual: e.target.value }))} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 mt-6">
            <Link href={`/unidades/${id}`}>
              <Button variant="outline">Cancelar</Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
