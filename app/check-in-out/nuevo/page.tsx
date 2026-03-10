'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { SmartBreadcrumbs } from '@/components/navigation/smart-breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ChecklistItem {
  nombre: string;
  estado: string;
  valor?: string;
  foto?: string;
}

const ITEMS_PREDETERMINADOS = [
  'Llaves de entrada',
  'Contador agua',
  'Contador luz',
  'Contador gas',
  'Estado paredes',
  'Estado suelos',
  'Electrodomésticos',
  'Inventario muebles',
];

export default function NuevoCheckInOutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const tipoParam = searchParams.get('tipo') || 'check-in';

  const [tipo, setTipo] = useState(tipoParam);
  const [inquilinoId, setInquilinoId] = useState('');
  const [inmuebleId, setInmuebleId] = useState('');
  const [fecha, setFecha] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [inquilinos, setInquilinos] = useState<{ id: string; nombre: string }[]>([]);
  const [inmuebles, setInmuebles] = useState<{ id: string; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    setTipo(tipoParam);
  }, [tipoParam]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [tenantsRes, unitsRes] = await Promise.all([
          fetch('/api/tenants?limit=100'),
          fetch('/api/units?limit=100'),
        ]);
        const [tenantsData, unitsData] = await Promise.all([
          tenantsRes.json(),
          unitsRes.json(),
        ]);
        const tenants = Array.isArray(tenantsData) ? tenantsData : tenantsData.data || tenantsData.tenants || [];
        const units = Array.isArray(unitsData) ? unitsData : unitsData.data || unitsData.units || [];
        setInquilinos(
          tenants.map((t: { id: string; nombreCompleto?: string; name?: string }) => ({
            id: t.id,
            nombre: t.nombreCompleto || t.name || t.id,
          }))
        );
        setInmuebles(
          units.map((u: { id: string; numero?: string; building?: { nombre?: string } }) => ({
            id: u.id,
            nombre: u.building ? `${u.building.nombre || 'Edificio'} - ${u.numero || u.id}` : u.numero || u.id,
          }))
        );
      } catch {
        toast.error('Error al cargar opciones');
        setInquilinos([
          { id: 'inq-1', nombre: 'María García López' },
          { id: 'inq-2', nombre: 'Carlos Ruiz Martínez' },
        ]);
        setInmuebles([
          { id: 'unit-1', nombre: 'Edificio Centro - 3A' },
          { id: 'unit-2', nombre: 'Residencial Norte - 5B' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    if (status === 'authenticated') fetchOptions();
  }, [status]);

  const addItem = (nombre?: string) => {
    setItems((prev) => [
      ...prev,
      { nombre: nombre || 'Nuevo item', estado: 'pendiente' },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ChecklistItem, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquilinoId || !inmuebleId) {
      toast.error('Selecciona inquilino e inmueble');
      return;
    }
    const inquilino = inquilinos.find((i) => i.id === inquilinoId);
    const inmueble = inmuebles.find((i) => i.id === inmuebleId);
    setSaving(true);
    try {
      const res = await fetch('/api/check-in-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          inquilinoId,
          inquilinoNombre: inquilino?.nombre || '',
          inmuebleId,
          inmuebleNombre: inmueble?.nombre || '',
          fecha,
          items: items.length ? items : [
            { nombre: 'Llaves de entrada', estado: 'pendiente' },
            { nombre: 'Contador agua', estado: 'pendiente' },
            { nombre: 'Contador luz', estado: 'pendiente' },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success('Registro creado correctamente');
        router.push(`/check-in-out?token=${data.token}`);
      } else {
        toast.error('Error al crear');
      }
    } catch {
      toast.error('Error al crear');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthenticatedLayout>
      <SmartBreadcrumbs
        customSegments={[
          { label: 'Check-in / Check-out', href: '/check-in-out' },
          { label: 'Nuevo', href: '/check-in-out/nuevo' },
        ]}
      />
      <div className="space-y-6 p-4 md:p-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Nuevo {tipo === 'check-in' ? 'Check-in' : 'Check-out'}</CardTitle>
            <CardDescription>
              Crea un registro y genera el enlace para el formulario digital
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="check-in">Check-in</SelectItem>
                      <SelectItem value="check-out">Check-out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha programada</Label>
                  <Input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Inquilino</Label>
                  <Select value={inquilinoId} onValueChange={setInquilinoId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar inquilino" />
                    </SelectTrigger>
                    <SelectContent>
                      {inquilinos.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Inmueble</Label>
                  <Select value={inmuebleId} onValueChange={setInmuebleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar inmueble" />
                    </SelectTrigger>
                    <SelectContent>
                      {inmuebles.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Items del checklist</Label>
                  <div className="flex gap-2">
                    {ITEMS_PREDETERMINADOS.slice(0, 4).map((nombre) => (
                      <Button
                        key={nombre}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addItem(nombre)}
                      >
                        + {nombre}
                      </Button>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => addItem()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 rounded-md border p-4">
                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Añade items o usa los predeterminados al crear
                    </p>
                  ) : (
                    items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          value={item.nombre}
                          onChange={(e) => updateItem(idx, 'nombre', e.target.value)}
                          placeholder="Nombre del item"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving || loading}>
                  {saving ? 'Creando...' : 'Crear y generar enlace'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
