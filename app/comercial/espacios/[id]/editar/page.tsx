'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditarEspacioComercialPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { data: session, status } = useSession();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [buildings, setBuildings] = useState<any[]>([]);

  const [form, setForm] = useState({
    nombre: '',
    tipo: 'local_comercial',
    buildingId: '',
    direccion: '',
    ciudad: '',
    codigoPostal: '',
    provincia: '',
    superficieConstruida: '',
    superficieUtil: '',
    rentaMensualBase: '',
    descripcion: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        const r = await fetch('/api/buildings');
        const j = await r.json();
        setBuildings(Array.isArray(j) ? j : j.data || []);
      } catch {}
    })();
  }, [session]);

  useEffect(() => {
    if (!session || !id) return;
    (async () => {
      try {
        const res = await fetch(`/api/comercial/spaces/${id}`);
        if (!res.ok) {
          toast.error('Espacio no encontrado');
          router.push('/comercial');
          return;
        }
        const s = await res.json();
        setForm({
          nombre: s.nombre || '',
          tipo: s.tipo || 'local_comercial',
          buildingId: s.buildingId || '',
          direccion: s.direccion || '',
          ciudad: s.ciudad || '',
          codigoPostal: s.codigoPostal || '',
          provincia: s.provincia || '',
          superficieConstruida:
            s.superficieConstruida != null ? String(s.superficieConstruida) : '',
          superficieUtil: s.superficieUtil != null ? String(s.superficieUtil) : '',
          rentaMensualBase: s.rentaMensualBase != null ? String(s.rentaMensualBase) : '',
          descripcion: s.descripcion || '',
        });
      } catch {
        toast.error('Error al cargar');
        router.push('/comercial');
      } finally {
        setLoading(false);
      }
    })();
  }, [session, id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.tipo || !form.direccion || !form.ciudad) {
      toast.error('Rellena los campos obligatorios');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/comercial/spaces/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          superficieConstruida: parseFloat(form.superficieConstruida) || 0,
          superficieUtil: parseFloat(form.superficieUtil) || 0,
          rentaMensualBase: parseFloat(form.rentaMensualBase) || 0,
          buildingId: form.buildingId || undefined,
        }),
      });

      if (res.ok) {
        toast.success('Espacio actualizado');
        router.push(`/comercial/espacios/${id}`);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Error al guardar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    if (field === 'buildingId' && value) {
      const b = buildings.find((x: any) => x.id === value);
      if (b) {
        setForm((prev) => ({
          ...prev,
          buildingId: value,
          direccion: b.direccion || prev.direccion,
          ciudad: b.ciudad || prev.ciudad,
        }));
      }
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Skeleton className="h-8 w-64" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/comercial/espacios/${id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Editar espacio comercial</h1>
            <p className="text-muted-foreground">Actualiza los datos del espacio</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Información básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={form.nombre}
                    onChange={(e) => handleChange('nombre', e.target.value)}
                    placeholder="Ej: Local 1A"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select value={form.tipo} onValueChange={(v) => handleChange('tipo', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local_comercial">Local Comercial</SelectItem>
                      <SelectItem value="oficina_privada">Oficina Privada</SelectItem>
                      <SelectItem value="oficina_abierta">Oficina Abierta</SelectItem>
                      <SelectItem value="nave_industrial">Nave Industrial</SelectItem>
                      <SelectItem value="almacen">Almacén</SelectItem>
                      <SelectItem value="coworking_hot_desk">Coworking Hot Desk</SelectItem>
                      <SelectItem value="coworking_dedicated">Coworking Dedicado</SelectItem>
                      <SelectItem value="sala_reuniones">Sala de Reuniones</SelectItem>
                      <SelectItem value="showroom">Showroom</SelectItem>
                      <SelectItem value="taller">Taller</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="building">Edificio (opcional)</Label>
                <Select
                  value={form.buildingId}
                  onValueChange={(v) => handleChange('buildingId', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar edificio..." />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Ubicación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="direccion">Dirección *</Label>
                <Input
                  id="direccion"
                  value={form.direccion}
                  onChange={(e) => handleChange('direccion', e.target.value)}
                  placeholder="Calle, número"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="ciudad">Ciudad *</Label>
                  <Input
                    id="ciudad"
                    value={form.ciudad}
                    onChange={(e) => handleChange('ciudad', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="codigoPostal">Código Postal</Label>
                  <Input
                    id="codigoPostal"
                    value={form.codigoPostal}
                    onChange={(e) => handleChange('codigoPostal', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="provincia">Provincia</Label>
                  <Input
                    id="provincia"
                    value={form.provincia}
                    onChange={(e) => handleChange('provincia', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Superficie y Precio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="superficieConstruida">Superficie construida (m²)</Label>
                  <Input
                    id="superficieConstruida"
                    type="number"
                    value={form.superficieConstruida}
                    onChange={(e) => handleChange('superficieConstruida', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="superficieUtil">Superficie útil (m²)</Label>
                  <Input
                    id="superficieUtil"
                    type="number"
                    value={form.superficieUtil}
                    onChange={(e) => handleChange('superficieUtil', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="rentaMensualBase">Renta mensual base (€)</Label>
                  <Input
                    id="rentaMensualBase"
                    type="number"
                    value={form.rentaMensualBase}
                    onChange={(e) => handleChange('rentaMensualBase', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={form.descripcion}
                onChange={(e) => handleChange('descripcion', e.target.value)}
                placeholder="Descripción del espacio..."
                rows={3}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 mt-6">
            <Link href={`/comercial/espacios/${id}`}>
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
