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

interface ContractForm {
  fechaInicio: string;
  fechaFin: string;
  rentaMensual: string;
  deposito: string;
  estado: string;
  tipo: string;
}

export default function EditarContratoPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession() || {};
  const contractId = params?.id as string;

  const [formData, setFormData] = useState<ContractForm>({
    fechaInicio: '',
    fechaFin: '',
    rentaMensual: '',
    deposito: '',
    estado: 'activo',
    tipo: 'residencial',
  });
  const [tenantName, setTenantName] = useState('');
  const [unitLabel, setUnitLabel] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const res = await fetch(`/api/contracts/${contractId}`);
        if (!res.ok) {
          toast.error('No se pudo cargar el contrato');
          router.push('/contratos');
          return;
        }
        const data = await res.json();
        setFormData({
          fechaInicio: data.fechaInicio ? new Date(data.fechaInicio).toISOString().slice(0, 10) : '',
          fechaFin: data.fechaFin ? new Date(data.fechaFin).toISOString().slice(0, 10) : '',
          rentaMensual: data.rentaMensual ? String(data.rentaMensual) : '',
          deposito: data.deposito ? String(data.deposito) : '',
          estado: data.estado || 'activo',
          tipo: data.tipo || 'residencial',
        });
        setTenantName(data.tenant?.nombreCompleto || '');
        setUnitLabel(
          data.unit
            ? `${data.unit?.building?.nombre || 'Edificio'} - ${data.unit?.numero || ''}`
            : ''
        );
      } catch (error) {
        toast.error('Error al cargar el contrato');
        router.push('/contratos');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated' && contractId) {
      fetchContract();
    }
  }, [status, contractId, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        estado: formData.estado,
        tipo: formData.tipo,
      };
      if (formData.fechaInicio) payload.fechaInicio = formData.fechaInicio;
      if (formData.fechaFin) payload.fechaFin = formData.fechaFin;
      if (formData.rentaMensual !== '') payload.rentaMensual = parseFloat(formData.rentaMensual);
      if (formData.deposito !== '') payload.deposito = parseFloat(formData.deposito);

      const response = await fetch(`/api/contracts/${contractId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Contrato actualizado');
        router.push(`/contratos/${contractId}`);
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || 'Error al actualizar contrato');
      }
    } catch {
      toast.error('Error al actualizar contrato');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <LoadingState message="Cargando contrato..." />
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
              <BreadcrumbLink href="/contratos">Contratos</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Editar contrato</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardHeader>
            <CardTitle>Editar contrato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 text-sm text-muted-foreground">
              {tenantName && <div>Inquilino: {tenantName}</div>}
              {unitLabel && <div>Unidad: {unitLabel}</div>}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fechaInicio">Fecha inicio</Label>
                  <Input
                    id="fechaInicio"
                    type="date"
                    value={formData.fechaInicio}
                    onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaFin">Fecha fin</Label>
                  <Input
                    id="fechaFin"
                    type="date"
                    value={formData.fechaFin}
                    onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rentaMensual">Renta mensual</Label>
                  <Input
                    id="rentaMensual"
                    type="number"
                    value={formData.rentaMensual}
                    onChange={(e) => setFormData({ ...formData, rentaMensual: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposito">Depósito</Label>
                  <Input
                    id="deposito"
                    type="number"
                    value={formData.deposito}
                    onChange={(e) => setFormData({ ...formData, deposito: e.target.value })}
                  />
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
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="vencido">Vencido</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
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
                      <SelectItem value="residencial">Residencial</SelectItem>
                      <SelectItem value="comercial">Comercial</SelectItem>
                      <SelectItem value="temporal">Temporal</SelectItem>
                    </SelectContent>
                  </Select>
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
