'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

const CATEGORIAS = [
  'Estructura', 'Albañilería', 'Electricidad', 'Fontanería', 'Climatización',
  'Carpintería', 'Pintura', 'Reformas integrales', 'Impermeabilización',
  'Pavimentos', 'Cubiertas', 'Fachadas', 'Demolición', 'Otro',
];

const PROVINCIAS = [
  'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza', 'Málaga',
  'Murcia', 'Palma de Mallorca', 'Las Palmas', 'Bilbao', 'Alicante',
  'Córdoba', 'Valladolid', 'Vigo', 'Gijón', 'Palencia', 'Otra',
];

export default function NuevaObraPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    provincia: '',
    municipio: '',
    direccion: '',
    categoria: '',
    presupuestoMinimo: '',
    presupuestoMaximo: '',
    fechaInicioDeseada: '',
    duracionEstimadaDias: '',
    tipoContrato: 'ALZADO',
    formaPago: 'MENSUAL',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo || !form.descripcion || !form.provincia || !form.categoria) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/ewoorker/obras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          presupuestoMinimo: parseFloat(form.presupuestoMinimo) || 0,
          presupuestoMaximo: parseFloat(form.presupuestoMaximo) || 0,
          duracionEstimadaDias: parseInt(form.duracionEstimadaDias) || 30,
          unidadesObra: [],
          subcategorias: [],
          especialidadesRequeridas: [form.categoria],
        }),
      });

      if (res.ok) {
        toast.success('Obra creada correctamente');
        router.push('/ewoorker/obras');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error al crear obra');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/ewoorker/obras">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Volver</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Nueva Obra</h1>
            <p className="text-muted-foreground text-sm">Publica un proyecto para recibir ofertas</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información del proyecto</CardTitle>
              <CardDescription>Datos básicos de la obra</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título del proyecto *</Label>
                <Input id="titulo" value={form.titulo} onChange={e => update('titulo', e.target.value)} placeholder="Ej: Reforma integral vivienda 80m²" />
              </div>
              <div>
                <Label htmlFor="descripcion">Descripción *</Label>
                <Textarea id="descripcion" value={form.descripcion} onChange={e => update('descripcion', e.target.value)} placeholder="Describe el alcance del trabajo, materiales, requisitos..." rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categoría *</Label>
                  <Select value={form.categoria} onValueChange={v => update('categoria', v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo de contrato</Label>
                  <Select value={form.tipoContrato} onValueChange={v => update('tipoContrato', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALZADO">Precio alzado</SelectItem>
                      <SelectItem value="POR_UNIDADES">Por unidades de obra</SelectItem>
                      <SelectItem value="ADMINISTRACION">Por administración</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ubicación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Provincia *</Label>
                  <Select value={form.provincia} onValueChange={v => update('provincia', v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {PROVINCIAS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="municipio">Municipio</Label>
                  <Input id="municipio" value={form.municipio} onChange={e => update('municipio', e.target.value)} placeholder="Madrid, Getafe..." />
                </div>
              </div>
              <div>
                <Label htmlFor="direccion">Dirección</Label>
                <Input id="direccion" value={form.direccion} onChange={e => update('direccion', e.target.value)} placeholder="Calle, número..." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Presupuesto y plazos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="presupuestoMinimo">Presupuesto mínimo (€)</Label>
                  <Input id="presupuestoMinimo" type="number" value={form.presupuestoMinimo} onChange={e => update('presupuestoMinimo', e.target.value)} placeholder="10000" />
                </div>
                <div>
                  <Label htmlFor="presupuestoMaximo">Presupuesto máximo (€)</Label>
                  <Input id="presupuestoMaximo" type="number" value={form.presupuestoMaximo} onChange={e => update('presupuestoMaximo', e.target.value)} placeholder="25000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fechaInicioDeseada">Fecha inicio deseada</Label>
                  <Input id="fechaInicioDeseada" type="date" value={form.fechaInicioDeseada} onChange={e => update('fechaInicioDeseada', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="duracionEstimadaDias">Duración estimada (días)</Label>
                  <Input id="duracionEstimadaDias" type="number" value={form.duracionEstimadaDias} onChange={e => update('duracionEstimadaDias', e.target.value)} placeholder="30" />
                </div>
              </div>
              <div>
                <Label>Forma de pago</Label>
                <Select value={form.formaPago} onValueChange={v => update('formaPago', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MENSUAL">Mensual</SelectItem>
                    <SelectItem value="POR_CERTIFICACION">Por certificación</SelectItem>
                    <SelectItem value="FIN_OBRA">Fin de obra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end">
            <Link href="/ewoorker/obras">
              <Button variant="outline" type="button">Cancelar</Button>
            </Link>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Guardando...' : 'Publicar obra'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
