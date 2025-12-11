'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { BackButton } from '@/components/ui/back-button';
import { toast } from 'sonner';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Building2,
  Users,
  CheckCircle,
  XCircle,
  ArrowLeft,
  DollarSign,
  Star,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger, { logError } from '@/lib/logger';

interface SubscriptionPlan {
  id: string;
  nombre: string;
  descripcion: string | null;
  tier: string;
  precioMensual: number;
  maxUsuarios: number | null;
  maxPropiedades: number | null;
  modulosIncluidos: string[];
  activo: boolean;
  createdAt: string;
  _count: {
    companies: number;
  };
}

export default function PlanesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [planes, setPlanes] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<{ id: string; nombre: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tier: 'basico',
    precioMensual: 0,
    maxUsuarios: null as number | null,
    maxPropiedades: null as number | null,
    modulosIncluidos: [] as string[],
    activo: true,
  });

  // Verificar autenticación y rol
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    if (session.user.role !== 'super_admin') {
      router.push('/unauthorized');
      return;
    }
    loadPlanes();
  }, [session, status, router]);

  const loadPlanes = async () => {
    try {
      const response = await fetch('/api/admin/subscription-plans');
      if (response.ok) {
        const data = await response.json();
        setPlanes(data);
      } else {
        toast.error('Error al cargar los planes');
      }
    } catch (error) {
      logger.error('Error loading plans:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        nombre: plan.nombre,
        descripcion: plan.descripcion || '',
        tier: plan.tier,
        precioMensual: plan.precioMensual,
        maxUsuarios: plan.maxUsuarios,
        maxPropiedades: plan.maxPropiedades,
        modulosIncluidos: plan.modulosIncluidos,
        activo: plan.activo,
      });
    } else {
      setEditingPlan(null);
      setFormData({
        nombre: '',
        descripcion: '',
        tier: 'basico',
        precioMensual: 0,
        maxUsuarios: null,
        maxPropiedades: null,
        modulosIncluidos: [],
        activo: true,
      });
    }
    setOpenDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSaving) return;

    setIsSaving(true);

    try {
      const url = editingPlan
        ? `/api/admin/subscription-plans/${editingPlan.id}`
        : '/api/admin/subscription-plans';
      const method = editingPlan ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingPlan ? 'Plan actualizado' : 'Plan creado');
        setOpenDialog(false);
        loadPlanes();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Error al guardar el plan');
      }
    } catch (error) {
      logger.error('Error saving plan:', error);
      toast.error('Error de conexión');
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteDialog = (id: string, nombre: string) => {
    setDeletingPlan({ id, nombre });
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!deletingPlan) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/admin/subscription-plans/${deletingPlan.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Plan eliminado');
        setShowDeleteDialog(false);
        setDeletingPlan(null);
        loadPlanes();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Error al eliminar el plan');
      }
    } catch (error) {
      logger.error('Error deleting plan:', error);
      toast.error('Error de conexión');
    } finally {
      setIsDeleting(false);
    }
  };

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      basico: 'bg-slate-100 text-slate-800',
      profesional: 'bg-blue-100 text-blue-800',
      empresarial: 'bg-violet-100 text-violet-800',
      premium: 'bg-amber-100 text-amber-800',
    };
    return colors[tier] || 'bg-gray-100 text-gray-800';
  };

  if (loading && planes.length === 0) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col ml-0 lg:ml-64 bg-gradient-bg">
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-0 lg:ml-64 bg-gradient-bg">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-4">
              <BackButton fallbackUrl="/dashboard" />
            </div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold gradient-text">Planes de Suscripción</h1>
                <p className="text-gray-600 mt-1">
                  Gestiona los planes disponibles para las empresas
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => handleOpenDialog()}
                className="gradient-primary shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nuevo Plan
              </Button>
            </div>

            {/* Lista de Planes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {planes.map((plan) => (
                <Card key={plan.id} className="card-hover">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 gradient-primary rounded-lg">
                          <Package className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{plan.nombre}</CardTitle>
                          <Badge className={getTierBadge(plan.tier)} variant="secondary">
                            {plan.tier.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(plan)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(plan.id, plan.nombre)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-bold text-indigo-600">
                          €{plan.precioMensual}
                        </span>
                        <span className="text-gray-500">/mes</span>
                      </div>

                      {plan.descripcion && (
                        <p className="text-sm text-gray-600">{plan.descripcion}</p>
                      )}

                      <div className="space-y-2 pt-4 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            Usuarios
                          </span>
                          <span className="font-medium">
                            {plan.maxUsuarios ? plan.maxUsuarios : 'Ilimitado'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 flex items-center">
                            <Building2 className="h-4 w-4 mr-2" />
                            Propiedades
                          </span>
                          <span className="font-medium">
                            {plan.maxPropiedades ? plan.maxPropiedades : 'Ilimitado'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Módulos</span>
                          <span className="font-medium">{plan.modulosIncluidos.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Empresas activas</span>
                          <span className="font-medium">{plan._count.companies}</span>
                        </div>
                      </div>

                      <div className="flex items-center pt-2">
                        {plan.activo ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactivo
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Dialog para Crear/Editar Plan */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Editar Plan' : 'Nuevo Plan de Suscripción'}</DialogTitle>
            <DialogDescription>Define los límites y características del plan</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="nombre">Nombre del Plan *</Label>
                  <InfoTooltip content="Nombre comercial del plan que verán las empresas. Ejemplo: 'Plan Starter', 'Plan Profesional'." />
                </div>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  placeholder="Ej: Plan Profesional"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <InfoTooltip content="Descripción breve de las características principales del plan." />
                </div>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción breve del plan"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="tier">Tier *</Label>
                    <InfoTooltip content="Nivel del plan: Básico (funciones esenciales), Profesional (más funciones), Empresarial (funciones avanzadas), Premium (todo incluido)." />
                  </div>
                  <select
                    id="tier"
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  >
                    <option value="basico">Básico</option>
                    <option value="profesional">Profesional</option>
                    <option value="empresarial">Empresarial</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="precio">Precio Mensual (€) *</Label>
                    <InfoTooltip content="Precio de suscripción mensual que pagará cada empresa. Puedes ajustarlo en cualquier momento." />
                  </div>
                  <Input
                    id="precio"
                    type="number"
                    value={formData.precioMensual}
                    onChange={(e) =>
                      setFormData({ ...formData, precioMensual: parseFloat(e.target.value) })
                    }
                    required
                    min="0"
                    step="0.01"
                    placeholder="99.99"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="maxUsuarios">Máximo de Usuarios</Label>
                    <InfoTooltip content="Límite de usuarios que puede tener una empresa con este plan. Deja vacío para ilimitado." />
                  </div>
                  <Input
                    id="maxUsuarios"
                    type="number"
                    value={formData.maxUsuarios || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxUsuarios: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="Ilimitado si vacío"
                    min="1"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="maxPropiedades">Máximo de Propiedades</Label>
                    <InfoTooltip content="Límite de propiedades/edificios que puede gestionar una empresa. Deja vacío para ilimitado." />
                  </div>
                  <Input
                    id="maxPropiedades"
                    type="number"
                    value={formData.maxPropiedades || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxPropiedades: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    placeholder="Ilimitado si vacío"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="activo" className="cursor-pointer">
                  Plan activo (disponible para asignación)
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenDialog(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" className="gradient-primary" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Guardando...
                  </>
                ) : editingPlan ? (
                  'Actualizar'
                ) : (
                  'Crear Plan'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Confirmar Eliminación"
        description={
          <>
            ¿Estás seguro de que deseas eliminar el plan <strong>{deletingPlan?.nombre}</strong>?
            <br />
            <br />
            Esta acción no se puede deshacer. Las empresas con este plan asignado deberán ser
            reasignadas a otro plan.
          </>
        }
        onConfirm={handleDelete}
        confirmText="Eliminar"
        variant="destructive"
        loading={isDeleting}
      />
    </div>
  );
}
