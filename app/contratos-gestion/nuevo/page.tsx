'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { SmartBreadcrumbs } from '@/components/navigation/smart-breadcrumbs';
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
import { toast } from 'sonner';
import { ArrowLeft, Save, FileSignature, Home } from 'lucide-react';

export default function NuevoContratoGestionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    propietario: '',
    inmuebles: '',
    tipo: 'integral',
    honorariosTipo: 'porcentaje',
    honorariosValor: '',
    fechaInicio: '',
    fechaFin: '',
    condiciones: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.propietario || !form.honorariosValor || !form.fechaInicio) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contratos-gestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          honorariosValor: parseFloat(form.honorariosValor),
          inmuebles: form.inmuebles.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });

      if (!res.ok) throw new Error('Error al crear contrato');

      toast.success('Contrato de gestión creado correctamente');
      router.push('/contratos-gestion');
    } catch {
      toast.error('Error al crear el contrato de gestión');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') return null;

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4 max-w-3xl">
        <SmartBreadcrumbs />

        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.push('/contratos-gestion')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold">Nuevo Contrato de Gestión</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="h-5 w-5" />
                Datos del contrato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="propietario">Propietario *</Label>
                  <Input
                    id="propietario"
                    placeholder="Nombre del propietario"
                    value={form.propietario}
                    onChange={(e) => setForm({ ...form, propietario: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inmuebles">Inmuebles (separados por coma)</Label>
                  <Input
                    id="inmuebles"
                    placeholder="Piso 1A, Local B..."
                    value={form.inmuebles}
                    onChange={(e) => setForm({ ...form, inmuebles: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de gestión *</Label>
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
                  <Label>Tipo de honorarios</Label>
                  <Select
                    value={form.honorariosTipo}
                    onValueChange={(v) => setForm({ ...form, honorariosTipo: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="porcentaje">% de la renta</SelectItem>
                      <SelectItem value="fijo">Importe fijo (€/mes)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="honorarios">
                    {form.honorariosTipo === 'porcentaje' ? 'Porcentaje (%)' : 'Importe (€/mes)'} *
                  </Label>
                  <Input
                    id="honorarios"
                    type="number"
                    step="0.01"
                    placeholder={form.honorariosTipo === 'porcentaje' ? '8' : '150'}
                    value={form.honorariosValor}
                    onChange={(e) => setForm({ ...form, honorariosValor: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fechaInicio">Fecha de inicio *</Label>
                  <Input
                    id="fechaInicio"
                    type="date"
                    value={form.fechaInicio}
                    onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fechaFin">Fecha de fin</Label>
                  <Input
                    id="fechaFin"
                    type="date"
                    value={form.fechaFin}
                    onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condiciones">Condiciones especiales</Label>
                <Textarea
                  id="condiciones"
                  placeholder="Cláusulas adicionales, condiciones de rescisión, etc."
                  value={form.condiciones}
                  onChange={(e) => setForm({ ...form, condiciones: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/contratos-gestion')}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Creando...' : 'Crear contrato'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
