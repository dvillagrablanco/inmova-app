'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowLeft, Leaf, Target, Plus, Trash2 } from 'lucide-react';

interface Action {
  name: string;
  impact: number;
  cost: number;
  deadline: string;
}

export default function NuevoPlanESGPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [form, setForm] = useState({
    buildingId: '',
    targetYear: new Date().getFullYear() + 5,
    targetReduction: 30,
    description: '',
  });
  const [actions, setActions] = useState<Action[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchBuildings();
    }
  }, [status, router]);

  const fetchBuildings = async () => {
    try {
      const response = await fetch('/api/buildings');
      if (response.ok) {
        const data = await response.json();
        setBuildings(data);
      }
    } catch (error) {
      console.error('Error fetching buildings:', error);
    }
  };

  const addAction = () => {
    setActions([...actions, { name: '', impact: 0, cost: 0, deadline: '' }]);
  };

  const removeAction = (index: number) => {
    if (actions.length > 1) {
      setActions(actions.filter((_, i) => i !== index));
    }
  };

  const updateAction = (index: number, field: keyof Action, value: string | number) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setActions(newActions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/esg/decarbonization-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          actions: actions.filter((a) => a.name.trim() !== ''),
        }),
      });

      if (response.ok) {
        toast.success('Plan de descarbonización creado exitosamente');
        router.push('/esg');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Error al crear el plan');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al crear el plan');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Leaf className="h-8 w-8 text-green-600" />
              Nuevo Plan de Descarbonización
            </h1>
            <p className="text-muted-foreground mt-1">
              Define objetivos y acciones para reducir las emisiones de CO₂
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información General */}
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>Datos básicos del plan de descarbonización</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="buildingId">Edificio *</Label>
                <Select
                  value={form.buildingId}
                  onValueChange={(v) => setForm({ ...form, buildingId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un edificio" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((building) => (
                      <SelectItem key={building.id} value={building.id}>
                        {building.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetYear">Año Objetivo *</Label>
                  <Input
                    id="targetYear"
                    type="number"
                    min={new Date().getFullYear()}
                    max={2050}
                    value={form.targetYear}
                    onChange={(e) =>
                      setForm({ ...form, targetYear: parseInt(e.target.value) || 2030 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetReduction">Reducción Objetivo (%) *</Label>
                  <Input
                    id="targetReduction"
                    type="number"
                    min={1}
                    max={100}
                    value={form.targetReduction}
                    onChange={(e) =>
                      setForm({ ...form, targetReduction: parseInt(e.target.value) || 30 })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción del Plan</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe los objetivos generales del plan..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Acciones del Plan */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Acciones del Plan</CardTitle>
                  <CardDescription>
                    Define las acciones específicas para reducir emisiones
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addAction}>
                  <Plus className="h-4 w-4 mr-1" />
                  Añadir Acción
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {actions.map((action, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Acción {index + 1}</span>
                    {actions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAction(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Nombre de la acción</Label>
                    <Input
                      value={action.name}
                      onChange={(e) => updateAction(index, 'name', e.target.value)}
                      placeholder="ej: Instalación paneles solares"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Impacto (kg CO₂/año)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={action.impact}
                        onChange={(e) =>
                          updateAction(index, 'impact', parseInt(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Coste (€)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={action.cost}
                        onChange={(e) =>
                          updateAction(index, 'cost', parseInt(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha límite</Label>
                      <Input
                        type="date"
                        value={action.deadline}
                        onChange={(e) => updateAction(index, 'deadline', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Acciones */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !form.buildingId}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                <>
                  <Target className="h-4 w-4 mr-2" />
                  Crear Plan
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
