'use client';

import { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  HardHat,
  Building2,
  Hammer,
  RefreshCw,
  Star,
  Users,
  Percent,
  DollarSign,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';

interface EwoorkerPlan {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  precioMensual: number;
  precioAnual: number | null;
  maxOfertas: number;
  comisionEscrow: number;
  features: string[];
  socioPercentage: number;
  plataformaPercentage: number;
  destacado: boolean;
  activo: boolean;
  orden: number;
}

const planIcons: Record<string, any> = {
  OBRERO: Hammer,
  CAPATAZ: HardHat,
  CONSTRUCTOR: Building2,
};

const planColors: Record<string, string> = {
  OBRERO: 'bg-gray-100 text-gray-800 border-gray-300',
  CAPATAZ: 'bg-amber-100 text-amber-800 border-amber-300',
  CONSTRUCTOR: 'bg-blue-100 text-blue-800 border-blue-300',
};

export default function AdminEwoorkerPlanesPage() {
  const [planes, setPlanes] = useState<EwoorkerPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<EwoorkerPlan | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    precioMensual: 0,
    precioAnual: 0,
    maxOfertas: 0,
    comisionEscrow: 0,
    features: [] as string[],
    socioPercentage: 50,
    plataformaPercentage: 50,
    destacado: false,
    activo: true,
  });

  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    loadPlanes();
  }, []);

  const loadPlanes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/ewoorker-planes');

      if (!res.ok) {
        throw new Error('Error al cargar planes');
      }

      const data = await res.json();
      setPlanes(data.data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar los planes de eWoorker');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: 'eWoorker ',
      descripcion: '',
      precioMensual: 0,
      precioAnual: 0,
      maxOfertas: 0,
      comisionEscrow: 0,
      features: [],
      socioPercentage: 50,
      plataformaPercentage: 50,
      destacado: false,
      activo: true,
    });
    setNewFeature('');
  };

  const openNewDialog = () => {
    resetForm();
    setEditingPlan(null);
    setShowNewDialog(true);
  };

  const openEditDialog = (plan: EwoorkerPlan) => {
    setEditingPlan(plan);
    setFormData({
      codigo: plan.codigo,
      nombre: plan.nombre,
      descripcion: plan.descripcion,
      precioMensual: plan.precioMensual,
      precioAnual: plan.precioAnual || 0,
      maxOfertas: plan.maxOfertas,
      comisionEscrow: plan.comisionEscrow,
      features: plan.features || [],
      socioPercentage: plan.socioPercentage,
      plataformaPercentage: plan.plataformaPercentage,
      destacado: plan.destacado,
      activo: plan.activo !== false,
    });
    setShowEditDialog(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const url = editingPlan
        ? `/api/admin/ewoorker-planes/${editingPlan.id}`
        : '/api/admin/ewoorker-planes';

      const res = await fetch(url, {
        method: editingPlan ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al guardar');
      }

      toast.success(editingPlan ? 'Plan actualizado' : 'Plan creado');
      setShowEditDialog(false);
      setShowNewDialog(false);
      loadPlanes();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()],
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    const features = [...formData.features];
    features.splice(index, 1);
    setFormData({ ...formData, features });
  };

  // Estadísticas
  const totalPlanes = planes.length;
  const planesActivos = planes.filter((p) => p.activo).length;
  const planDestacado = planes.find((p) => p.destacado);
  const avgComision =
    planes.length > 0 ? planes.reduce((sum, p) => sum + p.comisionEscrow, 0) / planes.length : 0;

  const PlanForm = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="codigo">Código</Label>
          <Input
            id="codigo"
            value={formData.codigo}
            onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
            placeholder="CONSTRUCTOR"
            disabled={!!editingPlan}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="eWoorker Constructor"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          placeholder="Descripción del plan..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="precioMensual">Precio Mensual (€)</Label>
          <Input
            id="precioMensual"
            type="number"
            value={formData.precioMensual}
            onChange={(e) =>
              setFormData({ ...formData, precioMensual: parseFloat(e.target.value) || 0 })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="precioAnual">Precio Anual (€)</Label>
          <Input
            id="precioAnual"
            type="number"
            value={formData.precioAnual}
            onChange={(e) =>
              setFormData({ ...formData, precioAnual: parseFloat(e.target.value) || 0 })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="comisionEscrow">Comisión Escrow (%)</Label>
          <Input
            id="comisionEscrow"
            type="number"
            step="0.5"
            value={formData.comisionEscrow}
            onChange={(e) =>
              setFormData({ ...formData, comisionEscrow: parseFloat(e.target.value) || 0 })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxOfertas">Máximo Ofertas/mes (-1 = ilimitado)</Label>
        <Input
          id="maxOfertas"
          type="number"
          value={formData.maxOfertas}
          onChange={(e) => setFormData({ ...formData, maxOfertas: parseInt(e.target.value) || 0 })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="socioPercentage">% para Socio Fundador</Label>
          <Input
            id="socioPercentage"
            type="number"
            value={formData.socioPercentage}
            onChange={(e) => {
              const socio = parseFloat(e.target.value) || 0;
              setFormData({
                ...formData,
                socioPercentage: socio,
                plataformaPercentage: 100 - socio,
              });
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="plataformaPercentage">% para Plataforma</Label>
          <Input
            id="plataformaPercentage"
            type="number"
            value={formData.plataformaPercentage}
            disabled
            className="bg-muted"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Características incluidas:</Label>
        <div className="flex gap-2">
          <Input
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            placeholder="Nueva característica..."
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
          />
          <Button type="button" onClick={addFeature} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.features.map((feature, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {feature}
              <button
                type="button"
                onClick={() => removeFeature(index)}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="destacado"
            checked={formData.destacado}
            onCheckedChange={(v) => setFormData({ ...formData, destacado: v })}
          />
          <Label htmlFor="destacado">Plan destacado (MÁS POPULAR)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="activo"
            checked={formData.activo}
            onCheckedChange={(v) => setFormData({ ...formData, activo: v })}
          />
          <Label htmlFor="activo" className={formData.activo ? 'text-green-600' : 'text-red-600'}>
            {formData.activo ? 'Activo' : 'Inactivo'}
          </Label>
        </div>
      </div>
    </div>
  );

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <HardHat className="h-8 w-8 text-amber-500" />
              Planes eWoorker
            </h1>
            <p className="text-muted-foreground">
              Gestiona los planes de suscripción de la vertical de construcción B2B
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadPlanes}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
            <Button onClick={openNewDialog} className="bg-amber-500 hover:bg-amber-600">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Plan
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Planes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPlanes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Planes Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{planesActivos}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Plan Destacado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-amber-600">
                {planDestacado?.codigo || 'Ninguno'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Comisión Promedio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{avgComision.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Información del modelo de negocio */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Modelo de Negocio eWoorker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium">Freemium + Comisión</p>
                <p className="text-muted-foreground">
                  Plan gratuito con comisión alta (5%) para adquisición
                </p>
              </div>
              <div>
                <p className="font-medium">Revenue Split</p>
                <p className="text-muted-foreground">50% socio fundador / 50% plataforma</p>
              </div>
              <div>
                <p className="font-medium">Escrow</p>
                <p className="text-muted-foreground">Comisión por transacción en pagos escrow</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Planes */}
        <Card>
          <CardHeader>
            <CardTitle>Planes de Suscripción eWoorker</CardTitle>
            <CardDescription>
              Los planes para constructoras, subcontratistas y profesionales de la construcción
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Cargando...</div>
            ) : planes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay planes. Ejecuta el seed: npx tsx prisma/seed-addons.ts
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Precio/mes</TableHead>
                    <TableHead className="text-right">Comisión Escrow</TableHead>
                    <TableHead className="text-center">Ofertas/mes</TableHead>
                    <TableHead>Revenue Split</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planes.map((plan) => {
                    const Icon = planIcons[plan.codigo] || HardHat;
                    const colorClass = planColors[plan.codigo] || planColors.OBRERO;

                    return (
                      <TableRow key={plan.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${colorClass}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {plan.nombre}
                                {plan.destacado && (
                                  <Badge className="bg-amber-500">
                                    <Star className="h-3 w-3 mr-1 fill-white" />
                                    MÁS POPULAR
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                                {plan.descripcion}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-mono">
                            {plan.precioMensual === 0 ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                GRATIS
                              </Badge>
                            ) : (
                              <>€{plan.precioMensual}</>
                            )}
                          </div>
                          {plan.precioAnual ? (
                            <div className="text-xs text-muted-foreground">
                              €{plan.precioAnual}/año
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={plan.comisionEscrow === 0 ? 'outline' : 'default'}>
                            {plan.comisionEscrow}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {plan.maxOfertas === -1 ? (
                            <Badge variant="outline" className="bg-blue-50">
                              Ilimitadas
                            </Badge>
                          ) : (
                            <Badge variant="secondary">{plan.maxOfertas}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            <Users className="h-3 w-3" />
                            <span>{plan.socioPercentage}% socio</span>
                            <span className="text-muted-foreground">|</span>
                            <span>{plan.plataformaPercentage}% plataforma</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={plan.activo !== false ? 'default' : 'secondary'}>
                            {plan.activo !== false ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(plan)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async () => {
                                if (confirm(`¿Eliminar el plan "${plan.nombre}"?`)) {
                                  try {
                                    const res = await fetch(
                                      `/api/admin/ewoorker-planes/${plan.id}`,
                                      {
                                        method: 'DELETE',
                                      }
                                    );
                                    if (res.ok) {
                                      toast.success('Plan eliminado');
                                      loadPlanes();
                                    } else {
                                      toast.error('Error al eliminar');
                                    }
                                  } catch {
                                    toast.error('Error al eliminar');
                                  }
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog para nuevo plan */}
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HardHat className="h-5 w-5 text-amber-500" />
                Nuevo Plan eWoorker
              </DialogTitle>
              <DialogDescription>
                Crea un nuevo plan de suscripción para la vertical de construcción
              </DialogDescription>
            </DialogHeader>
            <PlanForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {saving ? 'Guardando...' : 'Crear Plan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para editar plan */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5" />
                Editar Plan eWoorker
              </DialogTitle>
              <DialogDescription>Modifica la configuración del plan</DialogDescription>
            </DialogHeader>
            <PlanForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
