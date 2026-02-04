"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import logger from '@/lib/logger';

const ESTADOS = [
  'nuevo',
  'contactado',
  'calificado',
  'visitado',
  'propuesta_enviada',
  'negociacion',
  'ganado',
  'perdido',
] as const;

const normalizeEstado = (estado?: string | null) => {
  if (!estado) return 'nuevo';
  if (estado === 'cualificado') return 'calificado';
  if (estado === 'propuesta') return 'propuesta_enviada';
  return ESTADOS.includes(estado as (typeof ESTADOS)[number]) ? estado : 'nuevo';
};

interface LeadDetail {
  id: string;
  nombre?: string;
  apellidos?: string | null;
  email: string;
  telefono?: string | null;
  empresa?: string | null;
  estado?: string | null;
  notas?: string | null;
  presupuestoMensual?: number | null;
}

export default function EditLeadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const leadId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [formState, setFormState] = useState({
    nombreCompleto: '',
    email: '',
    telefono: '',
    empresa: '',
    estado: 'nuevo',
    presupuestoMensual: '',
    notas: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchLead();
    }
  }, [status, router, leadId]);

  const fetchLead = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/crm/leads/${leadId}`);
      if (!response.ok) throw new Error('Error cargando lead');
      const data = await response.json();
      setLead(data);
      const nombreCompleto = `${data.nombre || ''} ${data.apellidos || ''}`.trim();
      setFormState({
        nombreCompleto,
        email: data.email || '',
        telefono: data.telefono || '',
        empresa: data.empresa || '',
        estado: normalizeEstado(data.estado),
        presupuestoMensual: data.presupuestoMensual?.toString() || '',
        notas: data.notas || '',
      });
    } catch (error) {
      logger.error('Error loading lead:', error);
      toast.error('No se pudo cargar el lead');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formState.nombreCompleto.trim() || !formState.email.trim()) {
      toast.error('Nombre y email son obligatorios');
      return;
    }

    const [nombre, ...apellidosParts] = formState.nombreCompleto.trim().split(' ');
    const apellidos = apellidosParts.join(' ') || undefined;

    try {
      setSaving(true);
      const response = await fetch(`/api/crm/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          apellidos,
          email: formState.email.trim(),
          telefono: formState.telefono.trim() || undefined,
          empresa: formState.empresa.trim() || undefined,
          estado: formState.estado,
          presupuestoMensual: formState.presupuestoMensual
            ? parseFloat(formState.presupuestoMensual)
            : undefined,
          notas: formState.notas.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Error actualizando lead');
      }

      toast.success('Lead actualizado correctamente');
      router.push(`/leads/${leadId}`);
    } catch (error) {
      logger.error('Error updating lead:', error);
      toast.error('No se pudo actualizar el lead');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!lead) return null;

  return (
    <AuthenticatedLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Editar Lead</h1>
            <p className="text-muted-foreground">Actualiza la información del lead</p>
          </div>
          <Button variant="outline" onClick={() => router.push(`/leads/${leadId}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Datos del lead</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombreCompleto">Nombre completo</Label>
              <Input
                id="nombreCompleto"
                value={formState.nombreCompleto}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, nombreCompleto: event.target.value }))
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formState.email}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, email: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formState.telefono}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, telefono: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa</Label>
                <Input
                  id="empresa"
                  value={formState.empresa}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, empresa: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={formState.estado}
                  onValueChange={(value) =>
                    setFormState((prev) => ({ ...prev, estado: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS.map((estado) => (
                      <SelectItem key={estado} value={estado}>
                        {estado.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="presupuesto">Presupuesto mensual (€)</Label>
              <Input
                id="presupuesto"
                type="number"
                value={formState.presupuestoMensual}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, presupuestoMensual: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                value={formState.notas}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, notas: event.target.value }))
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.push(`/leads/${leadId}`)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
