'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function NuevoEspacioComercialPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tipoInicial = searchParams.get('tipo') || 'oficina_privada';

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    tipo: tipoInicial,
    direccion: '',
    ciudad: '',
    codigoPostal: '',
    planta: '',
    superficieConstruida: '',
    superficieUtil: '',
    precioAlquiler: '',
    descripcion: '',
  });

  const handleSave = async () => {
    if (!form.nombre || !form.direccion || !form.ciudad || !form.superficieConstruida || !form.precioAlquiler) {
      toast.error('Completa los campos obligatorios');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/comercial/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          superficieConstruida: Number(form.superficieConstruida),
          superficieUtil: form.superficieUtil ? Number(form.superficieUtil) : undefined,
          planta: form.planta ? Number(form.planta) : undefined,
        }),
      });
      if (res.ok) {
        toast.success('Espacio comercial creado');
        router.push('/comercial');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al crear espacio');
      }
    } catch {
      toast.error('Error de conexion');
    } finally {
      setSaving(false);
    }
  };

  const tipoOpciones = [
    { value: 'oficina_privada', label: 'Oficina Privada' },
    { value: 'oficina_abierta', label: 'Oficina Abierta' },
    { value: 'local_comercial', label: 'Local Comercial' },
    { value: 'local_centro_comercial', label: 'Local Centro Comercial' },
    { value: 'nave_industrial', label: 'Nave Industrial' },
    { value: 'almacen', label: 'Almacen' },
    { value: 'taller', label: 'Taller' },
    { value: 'coworking_hot_desk', label: 'Coworking - Hot Desk' },
    { value: 'coworking_dedicated', label: 'Coworking - Puesto Dedicado' },
    { value: 'coworking_office', label: 'Coworking - Oficina Privada' },
  ];

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4 max-w-3xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6 text-blue-600" />
              Nuevo Espacio Comercial
            </h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Datos del Espacio</CardTitle>
            <CardDescription>Completa la informacion del nuevo espacio comercial</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input placeholder="Ej: Oficina 301" value={form.nombre} onChange={e => setForm(p => ({...p, nombre: e.target.value}))} />
              </div>
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={form.tipo} onValueChange={v => setForm(p => ({...p, tipo: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {tipoOpciones.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Direccion *</Label>
              <Input placeholder="Calle, numero" value={form.direccion} onChange={e => setForm(p => ({...p, direccion: e.target.value}))} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Ciudad *</Label>
                <Input placeholder="Madrid" value={form.ciudad} onChange={e => setForm(p => ({...p, ciudad: e.target.value}))} />
              </div>
              <div className="space-y-2">
                <Label>Codigo Postal</Label>
                <Input placeholder="28001" value={form.codigoPostal} onChange={e => setForm(p => ({...p, codigoPostal: e.target.value}))} />
              </div>
              <div className="space-y-2">
                <Label>Planta</Label>
                <Input type="number" placeholder="3" value={form.planta} onChange={e => setForm(p => ({...p, planta: e.target.value}))} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Superficie construida (m2) *</Label>
                <Input type="number" placeholder="120" value={form.superficieConstruida} onChange={e => setForm(p => ({...p, superficieConstruida: e.target.value}))} />
              </div>
              <div className="space-y-2">
                <Label>Superficie util (m2)</Label>
                <Input type="number" placeholder="108" value={form.superficieUtil} onChange={e => setForm(p => ({...p, superficieUtil: e.target.value}))} />
              </div>
              <div className="space-y-2">
                <Label>Precio alquiler (EUR/mes) *</Label>
                <Input type="number" placeholder="1500" value={form.precioAlquiler} onChange={e => setForm(p => ({...p, precioAlquiler: e.target.value}))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripcion</Label>
              <Textarea placeholder="Descripcion del espacio..." value={form.descripcion} onChange={e => setForm(p => ({...p, descripcion: e.target.value}))} rows={3} />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Crear Espacio'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
