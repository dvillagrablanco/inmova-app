'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ArrowLeft, Home, Save } from 'lucide-react';
import { LoadingState } from '@/components/ui/loading-state';

interface UnitForm {
  numero: string;
  tipo: string;
  estado: string;
  superficie: string;
  habitaciones: string;
  banos: string;
  rentaMensual: string;
  tenantId: string;
}

interface Tenant {
  id: string;
  nombreCompleto: string;
}

export default function EditarUnidadPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession() || {};
  const unitId = params?.id as string;

  const [formData, setFormData] = useState<UnitForm>({
    numero: '',
    tipo: 'vivienda',
    estado: 'disponible',
    superficie: '',
    habitaciones: '',
    banos: '',
    rentaMensual: '',
    tenantId: '',
  });
  const [buildingName, setBuildingName] = useState('');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchUnit = async () => {
      try {
        const res = await fetch(`/api/units/${unitId}`);
        if (!res.ok) {
          toast.error('No se pudo cargar la unidad');
          router.push('/unidades');
          return;
        }
        const data = await res.json();
        setFormData({
          numero: data.numero || '',
          tipo: data.tipo || 'vivienda',
          estado: data.estado || 'disponible',
          superficie: data.superficie ? String(data.superficie) : '',
          habitaciones: data.habitaciones !== null && data.habitaciones !== undefined ? String(data.habitaciones) : '',
          banos: data.banos !== null && data.banos !== undefined ? String(data.banos) : '',
          rentaMensual: data.rentaMensual ? String(data.rentaMensual) : '',
          tenantId: data.tenant?.id || '',
        });
        setBuildingName(data.building?.nombre || '');
      } catch (error) {
        toast.error('Error al cargar la unidad');
        router.push('/unidades');
      } finally {
        setLoading(false);
      }
    };

    const fetchTenants = async () => {
      try {
        const res = await fetch('/api/tenants');
        if (res.ok) {
          const data = await res.json();
          setTenants(Array.isArray(data) ? data : data.data || []);
        }
      } catch {
        setTenants([]);
      }
    };

    if (status === 'authenticated' && unitId) {
      fetchUnit();
      fetchTenants();
    }
  }, [status, unitId, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        numero: formData.numero,
        tipo: formData.tipo,
        estado: formData.estado,
        tenantId: formData.tenantId || null,
      };
      if (formData.superficie !== '') payload.superficie = parseFloat(formData.superficie);
      if (formData.habitaciones !== '') payload.habitaciones = parseInt(formData.habitaciones);
      if (formData.banos !== '') payload.banos = parseInt(formData.banos);
      if (formData.rentaMensual !== '') payload.rentaMensual = parseFloat(formData.rentaMensual);

      const response = await fetch(`/api/units/${unitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Unidad actualizada');
        router.push(`/unidades/${unitId}`);
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || 'Error al actualizar la unidad');
      }
    } catch {
      toast.error('Error al actualizar la unidad');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <LoadingState message="Cargando unidad..." />
      </AuthenticatedLayout>
    );
  }

  if (!session) return null;

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/unidades">Unidades</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Editar unidad</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardHeader>
            <CardTitle>Editar unidad {buildingName && `(${buildingName})`}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vivienda">Vivienda</SelectItem>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="garaje">Garaje</SelectItem>
                      <SelectItem value="trastero">Trastero</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value) => setFormData({ ...formData, estado: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disponible">Disponible</SelectItem>
                      <SelectItem value="ocupada">Ocupada</SelectItem>
                      <SelectItem value="en_mantenimiento">En mantenimiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Inquilino</Label>
                  <Select
                    value={formData.tenantId || 'none'}
                    onValueChange={(value) =>
                      setFormData({ ...formData, tenantId: value === 'none' ? '' : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona inquilino" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin inquilino</SelectItem>
                      {tenants.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.nombreCompleto}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="superficie">Superficie (m²)</Label>
                  <Input
                    id="superficie"
                    type="number"
                    value={formData.superficie}
                    onChange={(e) => setFormData({ ...formData, superficie: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rentaMensual">Renta mensual</Label>
                  <Input
                    id="rentaMensual"
                    type="number"
                    value={formData.rentaMensual}
                    onChange={(e) => setFormData({ ...formData, rentaMensual: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="habitaciones">Habitaciones</Label>
                  <Input
                    id="habitaciones"
                    type="number"
                    value={formData.habitaciones}
                    onChange={(e) => setFormData({ ...formData, habitaciones: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banos">Baños</Label>
                  <Input
                    id="banos"
                    type="number"
                    value={formData.banos}
                    onChange={(e) => setFormData({ ...formData, banos: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
