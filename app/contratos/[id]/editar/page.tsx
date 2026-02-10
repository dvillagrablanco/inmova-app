'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ArrowLeft, Home, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Contract {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  rentaMensual: number;
  deposito: number;
  estado: string;
  tipo: string;
  clausulasAdicionales?: string;
  unit?: {
    numero: string;
    building?: {
      nombre: string;
    };
  };
  tenant?: {
    nombreCompleto: string;
  };
}

export default function EditarContratoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const contractId = params.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    fechaInicio: '',
    fechaFin: '',
    rentaMensual: '',
    deposito: '',
    estado: '',
    tipo: '',
    clausulasAdicionales: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && contractId) {
      fetchContract();
    }
  }, [status, contractId]);

  const fetchContract = async () => {
    try {
      const response = await fetch(`/api/contracts/${contractId}`);
      if (!response.ok) {
        toast.error('Contrato no encontrado');
        router.push('/contratos');
        return;
      }
      const data = await response.json();
      setContract(data);
      setForm({
        fechaInicio: data.fechaInicio ? data.fechaInicio.split('T')[0] : '',
        fechaFin: data.fechaFin ? data.fechaFin.split('T')[0] : '',
        rentaMensual: String(data.rentaMensual || ''),
        deposito: String(data.deposito || ''),
        estado: data.estado || 'activo',
        tipo: data.tipo || 'residencial',
        clausulasAdicionales: data.clausulasAdicionales || '',
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar el contrato');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fechaInicio: form.fechaInicio || undefined,
          fechaFin: form.fechaFin || undefined,
          rentaMensual: form.rentaMensual ? parseFloat(form.rentaMensual) : undefined,
          deposito: form.deposito ? parseFloat(form.deposito) : undefined,
          estado: form.estado || undefined,
          tipo: form.tipo || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Error al guardar');
      }

      toast.success('Contrato actualizado correctamente');
      router.push(`/contratos/${contractId}`);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al guardar el contrato');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!contract) return null;

  return (
    <AuthenticatedLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/contratos/${contractId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/contratos">Contratos</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/contratos/${contractId}`}>
                #{contractId.slice(-6).toUpperCase()}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Editar</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h1 className="text-2xl font-bold">Editar Contrato</h1>

        {/* Info del contrato */}
        {(contract.tenant || contract.unit) && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-6 text-sm">
                {contract.tenant && (
                  <div>
                    <span className="text-muted-foreground">Inquilino: </span>
                    <span className="font-medium">{contract.tenant.nombreCompleto}</span>
                  </div>
                )}
                {contract.unit && (
                  <div>
                    <span className="text-muted-foreground">Unidad: </span>
                    <span className="font-medium">
                      {contract.unit.building?.nombre} - {contract.unit.numero}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle>Datos del Contrato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={form.fechaInicio}
                  onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaFin">Fecha Fin</Label>
                <Input
                  id="fechaFin"
                  type="date"
                  value={form.fechaFin}
                  onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rentaMensual">Renta Mensual (€)</Label>
                <Input
                  id="rentaMensual"
                  type="number"
                  step="0.01"
                  value={form.rentaMensual}
                  onChange={(e) => setForm({ ...form, rentaMensual: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deposito">Depósito (€)</Label>
                <Input
                  id="deposito"
                  type="number"
                  step="0.01"
                  value={form.deposito}
                  onChange={(e) => setForm({ ...form, deposito: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select
                  value={form.estado}
                  onValueChange={(v) => setForm({ ...form, estado: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  value={form.tipo}
                  onValueChange={(v) => setForm({ ...form, tipo: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residencial">Residencial</SelectItem>
                    <SelectItem value="comercial">Comercial</SelectItem>
                    <SelectItem value="temporal">Temporal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clausulas">Cláusulas Adicionales</Label>
              <Textarea
                id="clausulas"
                value={form.clausulasAdicionales}
                onChange={(e) => setForm({ ...form, clausulasAdicionales: e.target.value })}
                rows={4}
                placeholder="Condiciones especiales, restricciones..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/contratos/${contractId}`)}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar Cambios
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
