'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Building2,
  CreditCard,
  Zap,
  FileSignature,
  HardDrive,
  MessageSquare,
  Settings,
  RefreshCw,
  Check,
  X,
} from 'lucide-react';

interface Plan {
  id: string;
  nombre: string;
  tier: string;
  descripcion: string;
  precioMensual: number;
  maxUsuarios: number;
  maxPropiedades: number;
  modulosIncluidos: string[];
  signaturesIncludedMonth: number;
  extraSignaturePrice: number;
  storageIncludedGB: number;
  extraStorageGBPrice: number;
  aiTokensIncludedMonth: number;
  extraAITokensPrice: number;
  smsIncludedMonth: number;
  extraSMSPrice: number;
  activo: boolean;
  empresasUsando: number;
  createdAt: string;
  updatedAt: string;
}

const tierColors: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-800',
  STARTER: 'bg-blue-100 text-blue-800',
  PROFESSIONAL: 'bg-purple-100 text-purple-800',
  BUSINESS: 'bg-amber-100 text-amber-800',
  ENTERPRISE: 'bg-emerald-100 text-emerald-800',
};

const tierOptions = [
  { value: 'FREE', label: 'Free' },
  { value: 'STARTER', label: 'Starter' },
  { value: 'PROFESSIONAL', label: 'Professional' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'ENTERPRISE', label: 'Enterprise' },
];

const modulosDisponibles = [
  { codigo: 'edificios', nombre: 'Edificios' },
  { codigo: 'unidades', nombre: 'Unidades' },
  { codigo: 'inquilinos', nombre: 'Inquilinos' },
  { codigo: 'contratos', nombre: 'Contratos' },
  { codigo: 'pagos', nombre: 'Pagos' },
  { codigo: 'documentos', nombre: 'Documentos' },
  { codigo: 'mantenimiento', nombre: 'Mantenimiento' },
  { codigo: 'comunicaciones', nombre: 'Comunicaciones' },
  { codigo: 'firma_digital', nombre: 'Firma Digital' },
  { codigo: 'reportes', nombre: 'Reportes' },
  { codigo: 'crm', nombre: 'CRM' },
  { codigo: 'analytics', nombre: 'Analytics' },
  { codigo: 'api_access', nombre: 'API Access' },
  { codigo: 'white_label', nombre: 'White Label' },
  { codigo: 'construccion', nombre: 'Construcción' },
  { codigo: 'str', nombre: 'STR' },
  { codigo: 'coliving', nombre: 'Coliving' },
  { codigo: 'comunidades', nombre: 'Comunidades' },
];

export default function AdminPlanesPage() {
  const router = useRouter();
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    tier: 'STARTER',
    descripcion: '',
    precioMensual: 0,
    maxUsuarios: 5,
    maxPropiedades: 10,
    modulosIncluidos: [] as string[],
    signaturesIncludedMonth: 5,
    extraSignaturePrice: 2.0,
    storageIncludedGB: 2,
    extraStorageGBPrice: 0.10,
    aiTokensIncludedMonth: 10000,
    extraAITokensPrice: 0.02,
    smsIncludedMonth: 0,
    extraSMSPrice: 0.12,
    activo: true,
  });

  useEffect(() => {
    loadPlanes();
  }, []);

  const loadPlanes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/planes');
      
      if (!res.ok) {
        throw new Error('Error al cargar planes');
      }
      
      const data = await res.json();
      setPlanes(data.planes || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar los planes');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      tier: 'STARTER',
      descripcion: '',
      precioMensual: 0,
      maxUsuarios: 5,
      maxPropiedades: 10,
      modulosIncluidos: [],
      signaturesIncludedMonth: 5,
      extraSignaturePrice: 2.0,
      storageIncludedGB: 2,
      extraStorageGBPrice: 0.10,
      aiTokensIncludedMonth: 10000,
      extraAITokensPrice: 0.02,
      smsIncludedMonth: 0,
      extraSMSPrice: 0.12,
      activo: true,
    });
  };

  const openEditDialog = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      nombre: plan.nombre,
      tier: plan.tier,
      descripcion: plan.descripcion,
      precioMensual: plan.precioMensual,
      maxUsuarios: plan.maxUsuarios,
      maxPropiedades: plan.maxPropiedades,
      modulosIncluidos: plan.modulosIncluidos as string[],
      signaturesIncludedMonth: plan.signaturesIncludedMonth,
      extraSignaturePrice: plan.extraSignaturePrice,
      storageIncludedGB: plan.storageIncludedGB,
      extraStorageGBPrice: plan.extraStorageGBPrice,
      aiTokensIncludedMonth: plan.aiTokensIncludedMonth,
      extraAITokensPrice: plan.extraAITokensPrice,
      smsIncludedMonth: plan.smsIncludedMonth,
      extraSMSPrice: plan.extraSMSPrice,
      activo: plan.activo,
    });
    setShowEditDialog(true);
  };

  const openNewDialog = () => {
    resetForm();
    setShowNewDialog(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (editingPlan) {
        // Actualizar
        const res = await fetch(`/api/admin/planes/${editingPlan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Error al actualizar');
        }

        toast.success('Plan actualizado correctamente');
        setShowEditDialog(false);
      } else {
        // Crear nuevo
        const res = await fetch('/api/admin/planes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Error al crear');
        }

        toast.success('Plan creado correctamente');
        setShowNewDialog(false);
      }

      loadPlanes();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (plan: Plan) => {
    if (plan.empresasUsando > 0) {
      toast.error(`No se puede eliminar: ${plan.empresasUsando} empresas usando este plan`);
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar el plan "${plan.nombre}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/planes/${plan.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al eliminar');
      }

      toast.success('Plan eliminado');
      loadPlanes();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar');
    }
  };

  const toggleModulo = (codigo: string) => {
    setFormData(prev => ({
      ...prev,
      modulosIncluidos: prev.modulosIncluidos.includes(codigo)
        ? prev.modulosIncluidos.filter(m => m !== codigo)
        : [...prev.modulosIncluidos, codigo],
    }));
  };

  const PlanForm = () => (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="limites">Límites</TabsTrigger>
        <TabsTrigger value="modulos">Módulos</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Plan</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Professional"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tier">Tier</Label>
            <Select
              value={formData.tier}
              onValueChange={(value) => setFormData({ ...formData, tier: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tier" />
              </SelectTrigger>
              <SelectContent>
                {tierOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea
            id="descripcion"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            placeholder="Descripción del plan..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="precioMensual">Precio Mensual (€)</Label>
            <Input
              id="precioMensual"
              type="number"
              min={0}
              step={0.01}
              value={formData.precioMensual}
              onChange={(e) => setFormData({ ...formData, precioMensual: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxUsuarios">Máx. Usuarios</Label>
            <Input
              id="maxUsuarios"
              type="number"
              min={1}
              value={formData.maxUsuarios}
              onChange={(e) => setFormData({ ...formData, maxUsuarios: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxPropiedades">Máx. Propiedades</Label>
            <Input
              id="maxPropiedades"
              type="number"
              min={1}
              value={formData.maxPropiedades}
              onChange={(e) => setFormData({ ...formData, maxPropiedades: parseInt(e.target.value) || 1 })}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="activo"
            checked={formData.activo}
            onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
          />
          <Label htmlFor="activo">Plan activo</Label>
        </div>
      </TabsContent>

      <TabsContent value="limites" className="space-y-4 mt-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileSignature className="h-4 w-4" />
              Firma Digital (Signaturit)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Firmas incluidas/mes</Label>
              <Input
                type="number"
                min={0}
                value={formData.signaturesIncludedMonth}
                onChange={(e) => setFormData({ ...formData, signaturesIncludedMonth: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Precio extra (€/firma)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={formData.extraSignaturePrice}
                onChange={(e) => setFormData({ ...formData, extraSignaturePrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Almacenamiento (AWS S3)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>GB incluidos</Label>
              <Input
                type="number"
                min={0}
                step={0.1}
                value={formData.storageIncludedGB}
                onChange={(e) => setFormData({ ...formData, storageIncludedGB: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Precio extra (€/GB/mes)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={formData.extraStorageGBPrice}
                onChange={(e) => setFormData({ ...formData, extraStorageGBPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              IA (Anthropic Claude)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tokens incluidos/mes</Label>
              <Input
                type="number"
                min={0}
                step={1000}
                value={formData.aiTokensIncludedMonth}
                onChange={(e) => setFormData({ ...formData, aiTokensIncludedMonth: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Precio extra (€/1K tokens)</Label>
              <Input
                type="number"
                min={0}
                step={0.001}
                value={formData.extraAITokensPrice}
                onChange={(e) => setFormData({ ...formData, extraAITokensPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              SMS (Twilio)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SMS incluidos/mes</Label>
              <Input
                type="number"
                min={0}
                value={formData.smsIncludedMonth}
                onChange={(e) => setFormData({ ...formData, smsIncludedMonth: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Precio extra (€/SMS)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={formData.extraSMSPrice}
                onChange={(e) => setFormData({ ...formData, extraSMSPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="modulos" className="mt-4">
        <div className="grid grid-cols-3 gap-3">
          {modulosDisponibles.map(modulo => (
            <div
              key={modulo.codigo}
              className={`
                p-3 rounded-lg border cursor-pointer transition-colors
                ${formData.modulosIncluidos.includes(modulo.codigo)
                  ? 'bg-primary/10 border-primary'
                  : 'bg-muted/50 hover:bg-muted'
                }
              `}
              onClick={() => toggleModulo(modulo.codigo)}
            >
              <div className="flex items-center gap-2">
                {formData.modulosIncluidos.includes(modulo.codigo) ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">{modulo.nombre}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Seleccionados: {formData.modulosIncluidos.length} módulos
        </p>
      </TabsContent>
    </Tabs>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Planes</h1>
          <p className="text-muted-foreground">
            Configura los planes de suscripción y sus límites
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadPlanes}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Recargar
          </Button>
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Plan</DialogTitle>
                <DialogDescription>
                  Define los parámetros del nuevo plan de suscripción
                </DialogDescription>
              </DialogHeader>
              <PlanForm />
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Guardando...' : 'Crear Plan'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Planes</p>
                <p className="text-2xl font-bold">{planes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Activos</p>
                <p className="text-2xl font-bold">
                  {planes.filter(p => p.activo).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-100">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Empresas</p>
                <p className="text-2xl font-bold">
                  {planes.reduce((sum, p) => sum + p.empresasUsando, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-100">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Precio Medio</p>
                <p className="text-2xl font-bold">
                  €{Math.round(planes.reduce((sum, p) => sum + p.precioMensual, 0) / planes.length || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Límites</TableHead>
                <TableHead>Integraciones</TableHead>
                <TableHead>Empresas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planes.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium">{plan.nombre}</div>
                        <Badge className={tierColors[plan.tier] || 'bg-gray-100'}>
                          {plan.tier}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-lg">
                      {plan.precioMensual === 0 ? 'Gratis' : `€${plan.precioMensual}/mes`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {plan.maxUsuarios} usuarios
                      </div>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {plan.maxPropiedades} propiedades
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <div>✍️ {plan.signaturesIncludedMonth} firmas</div>
                      <div>💾 {plan.storageIncludedGB} GB</div>
                      <div>🤖 {(plan.aiTokensIncludedMonth / 1000).toFixed(0)}K tokens</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {plan.empresasUsando}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {plan.activo ? (
                      <Badge className="bg-green-100 text-green-800">Activo</Badge>
                    ) : (
                      <Badge variant="outline">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
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
                        onClick={() => handleDelete(plan)}
                        disabled={plan.empresasUsando > 0}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Plan: {editingPlan?.nombre}</DialogTitle>
            <DialogDescription>
              Modifica los parámetros del plan
            </DialogDescription>
          </DialogHeader>
          <PlanForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
