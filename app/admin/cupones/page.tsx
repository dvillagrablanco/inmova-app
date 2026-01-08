'use client';

import { useState, useEffect, useCallback } from 'react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  Tag,
  Calendar,
  Clock,
  Users,
  Percent,
  Gift,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Copy,
  MoreHorizontal,
  Play,
  Pause,
  Eye,
  Send,
  TrendingUp,
  Timer,
  Sparkles,
  ArrowRight,
  Building2,
  Bell,
  BarChart3,
} from 'lucide-react';

// Tipos
interface PromoCoupon {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  tipo: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_MONTHS' | 'TRIAL_EXTENSION';
  valor: number;
  fechaInicio: string;
  fechaExpiracion: string;
  alertaEnviada7d: boolean;
  alertaEnviada3d: boolean;
  alertaEnviada1d: boolean;
  ultimaAlertaFecha: string | null;
  usosMaximos: number | null;
  usosActuales: number;
  usosPorUsuario: number;
  duracionMeses: number;
  planesPermitidos: string[];
  stripeCouponId: string | null;
  estado: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'EXHAUSTED';
  activo: boolean;
  destacado: boolean;
  creadoPor: string | null;
  notas: string | null;
  createdAt: string;
  updatedAt: string;
  diasRestantes?: number;
  _count?: { usos: number };
}

interface Stats {
  total: number;
  activos: number;
  porExpirar: number;
  usosHoy: number;
}

// Constantes
const tipoOptions = [
  { value: 'PERCENTAGE', label: 'Porcentaje de descuento', icon: Percent },
  { value: 'FIXED_AMOUNT', label: 'Cantidad fija', icon: Tag },
  { value: 'FREE_MONTHS', label: 'Meses gratis', icon: Gift },
  { value: 'TRIAL_EXTENSION', label: 'Extensión de prueba', icon: Timer },
];

const estadoOptions = [
  { value: 'DRAFT', label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
  { value: 'ACTIVE', label: 'Activo', color: 'bg-green-100 text-green-800' },
  { value: 'PAUSED', label: 'Pausado', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'EXPIRED', label: 'Expirado', color: 'bg-red-100 text-red-800' },
  { value: 'EXHAUSTED', label: 'Agotado', color: 'bg-purple-100 text-purple-800' },
];

const planOptions = [
  { value: 'STARTER', label: 'Starter' },
  { value: 'PROFESSIONAL', label: 'Professional' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'ENTERPRISE', label: 'Enterprise' },
];

const tipoDescriptions: Record<string, string> = {
  'PERCENTAGE': 'Descuento porcentual sobre el precio del plan',
  'FIXED_AMOUNT': 'Descuento de cantidad fija en €',
  'FREE_MONTHS': 'Meses gratuitos antes de empezar a pagar',
  'TRIAL_EXTENSION': 'Días adicionales de prueba gratuita',
};

export default function AdminCuponesPage() {
  const router = useRouter();
  const [cupones, setCupones] = useState<PromoCoupon[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, activos: 0, porExpirar: 0, usosHoy: 0 });
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<PromoCoupon | null>(null);
  const [viewingCoupon, setViewingCoupon] = useState<PromoCoupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterEstado, setFilterEstado] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    tipo: 'PERCENTAGE' as const,
    valor: 0,
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaExpiracion: '',
    usosMaximos: null as number | null,
    usosPorUsuario: 1,
    duracionMeses: 1,
    planesPermitidos: [] as string[],
    destacado: false,
    notas: '',
  });

  const loadCupones = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterEstado !== 'all') {
        params.append('estado', filterEstado);
      }
      
      const res = await fetch(`/api/admin/promo-coupons?${params.toString()}`);
      
      if (!res.ok) {
        throw new Error('Error al cargar cupones');
      }
      
      const data = await res.json();
      setCupones(data.data || []);
      setStats(data.stats || { total: 0, activos: 0, porExpirar: 0, usosHoy: 0 });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar los cupones');
    } finally {
      setLoading(false);
    }
  }, [filterEstado]);

  useEffect(() => {
    loadCupones();
  }, [loadCupones]);

  const resetForm = () => {
    const fechaExpDefault = new Date();
    fechaExpDefault.setMonth(fechaExpDefault.getMonth() + 3);
    
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      tipo: 'PERCENTAGE',
      valor: 0,
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaExpiracion: fechaExpDefault.toISOString().split('T')[0],
      usosMaximos: null,
      usosPorUsuario: 1,
      duracionMeses: 1,
      planesPermitidos: [],
      destacado: false,
      notas: '',
    });
  };

  const openEditDialog = (coupon: PromoCoupon) => {
    setEditingCoupon(coupon);
    setFormData({
      codigo: coupon.codigo,
      nombre: coupon.nombre,
      descripcion: coupon.descripcion || '',
      tipo: coupon.tipo,
      valor: coupon.valor,
      fechaInicio: new Date(coupon.fechaInicio).toISOString().split('T')[0],
      fechaExpiracion: new Date(coupon.fechaExpiracion).toISOString().split('T')[0],
      usosMaximos: coupon.usosMaximos,
      usosPorUsuario: coupon.usosPorUsuario,
      duracionMeses: coupon.duracionMeses,
      planesPermitidos: coupon.planesPermitidos,
      destacado: coupon.destacado,
      notas: coupon.notas || '',
    });
    setShowEditDialog(true);
  };

  const openNewDialog = () => {
    resetForm();
    setShowNewDialog(true);
  };

  const openViewDialog = (coupon: PromoCoupon) => {
    setViewingCoupon(coupon);
    setShowViewDialog(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validaciones
      if (!formData.codigo || formData.codigo.length < 3) {
        toast.error('El código debe tener al menos 3 caracteres');
        return;
      }
      if (!formData.nombre) {
        toast.error('El nombre es obligatorio');
        return;
      }
      if (formData.valor <= 0) {
        toast.error('El valor debe ser mayor a 0');
        return;
      }
      if (!formData.fechaExpiracion) {
        toast.error('La fecha de expiración es obligatoria');
        return;
      }

      const payload = {
        ...formData,
        fechaInicio: new Date(formData.fechaInicio).toISOString(),
        fechaExpiracion: new Date(formData.fechaExpiracion + 'T23:59:59').toISOString(),
      };

      if (editingCoupon) {
        // Actualizar
        const res = await fetch(`/api/admin/promo-coupons/${editingCoupon.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Error al actualizar');
        }

        toast.success('Cupón actualizado correctamente');
        setShowEditDialog(false);
      } else {
        // Crear nuevo
        const res = await fetch('/api/admin/promo-coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Error al crear');
        }

        toast.success('Cupón creado correctamente');
        setShowNewDialog(false);
      }

      loadCupones();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (coupon: PromoCoupon) => {
    if (coupon.usosActuales > 0) {
      toast.error(`No se puede eliminar: el cupón tiene ${coupon.usosActuales} usos registrados`);
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar el cupón "${coupon.codigo}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/promo-coupons/${coupon.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al eliminar');
      }

      toast.success('Cupón eliminado');
      loadCupones();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar');
    }
  };

  const handleToggleEstado = async (coupon: PromoCoupon, nuevoEstado: 'ACTIVE' | 'PAUSED') => {
    try {
      const res = await fetch(`/api/admin/promo-coupons/${coupon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado, activo: nuevoEstado === 'ACTIVE' }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al actualizar estado');
      }

      toast.success(`Cupón ${nuevoEstado === 'ACTIVE' ? 'activado' : 'pausado'}`);
      loadCupones();
    } catch (error: any) {
      toast.error(error.message || 'Error al cambiar estado');
    }
  };

  const handleCopyCode = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    toast.success(`Código "${codigo}" copiado al portapapeles`);
  };

  const handleSendTestAlert = async () => {
    try {
      const res = await fetch('/api/cron/check-coupons', {
        headers: { 'Authorization': `Bearer inmova-cron-secret` },
      });
      
      if (!res.ok) {
        throw new Error('Error al ejecutar verificación');
      }

      const data = await res.json();
      toast.success(`Verificación completada: ${data.alertasEnviadas} alertas enviadas`);
      loadCupones();
    } catch (error: any) {
      toast.error(error.message || 'Error al ejecutar verificación');
    }
  };

  const togglePlanPermitido = (plan: string) => {
    setFormData(prev => ({
      ...prev,
      planesPermitidos: prev.planesPermitidos.includes(plan)
        ? prev.planesPermitidos.filter(p => p !== plan)
        : [...prev.planesPermitidos, plan],
    }));
  };

  const getValorDisplay = (coupon: PromoCoupon) => {
    switch (coupon.tipo) {
      case 'PERCENTAGE':
        return `${coupon.valor}%`;
      case 'FIXED_AMOUNT':
        return `€${coupon.valor}`;
      case 'FREE_MONTHS':
        return `${coupon.valor} mes${coupon.valor > 1 ? 'es' : ''}`;
      case 'TRIAL_EXTENSION':
        return `+${coupon.valor} días`;
      default:
        return coupon.valor;
    }
  };

  const getEstadoBadge = (estado: string) => {
    const opt = estadoOptions.find(o => o.value === estado);
    return opt ? (
      <Badge className={opt.color}>{opt.label}</Badge>
    ) : (
      <Badge variant="outline">{estado}</Badge>
    );
  };

  const getDiasRestantesColor = (dias: number | undefined) => {
    if (dias === undefined) return 'text-gray-500';
    if (dias <= 1) return 'text-red-600';
    if (dias <= 3) return 'text-orange-600';
    if (dias <= 7) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Form Component
  const CouponForm = () => (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="restricciones">Restricciones</TabsTrigger>
        <TabsTrigger value="avanzado">Avanzado</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="codigo">Código del Cupón *</Label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="codigo"
                className="pl-10 uppercase"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                placeholder="Ej: STARTER26"
                maxLength={20}
              />
            </div>
            <p className="text-xs text-muted-foreground">Código único que usarán los clientes</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: ¡Empieza a €17/mes!"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea
            id="descripcion"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            placeholder="Descripción visible para los usuarios..."
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Descuento *</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {tipoOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <opt.icon className="h-4 w-4" />
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{tipoDescriptions[formData.tipo]}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="valor">
              Valor * {formData.tipo === 'PERCENTAGE' ? '(%)' : formData.tipo === 'FIXED_AMOUNT' ? '(€)' : formData.tipo === 'FREE_MONTHS' ? '(meses)' : '(días)'}
            </Label>
            <Input
              id="valor"
              type="number"
              min={0}
              max={formData.tipo === 'PERCENTAGE' ? 100 : undefined}
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fechaInicio">Fecha de Inicio *</Label>
            <Input
              id="fechaInicio"
              type="date"
              value={formData.fechaInicio}
              onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fechaExpiracion">Fecha de Expiración *</Label>
            <Input
              id="fechaExpiracion"
              type="date"
              value={formData.fechaExpiracion}
              onChange={(e) => setFormData({ ...formData, fechaExpiracion: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duracionMeses">Duración del Descuento (meses)</Label>
          <Input
            id="duracionMeses"
            type="number"
            min={1}
            max={24}
            value={formData.duracionMeses}
            onChange={(e) => setFormData({ ...formData, duracionMeses: parseInt(e.target.value) || 1 })}
          />
          <p className="text-xs text-muted-foreground">
            Cuántos meses se aplicará el descuento después de activar el cupón
          </p>
        </div>
      </TabsContent>

      <TabsContent value="restricciones" className="space-y-4 mt-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Límites de Uso
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Usos máximos totales</Label>
              <Input
                type="number"
                min={1}
                placeholder="Ilimitado"
                value={formData.usosMaximos || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  usosMaximos: e.target.value ? parseInt(e.target.value) : null 
                })}
              />
              <p className="text-xs text-muted-foreground">
                Dejar vacío para ilimitado
              </p>
            </div>
            <div className="space-y-2">
              <Label>Usos por usuario</Label>
              <Input
                type="number"
                min={1}
                value={formData.usosPorUsuario}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  usosPorUsuario: parseInt(e.target.value) || 1 
                })}
              />
              <p className="text-xs text-muted-foreground">
                Cuántas veces puede usar el cupón cada usuario
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Planes Permitidos
            </CardTitle>
            <CardDescription>
              Selecciona los planes donde se puede aplicar este cupón. 
              Si no seleccionas ninguno, aplica a todos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {planOptions.map(plan => (
                <div
                  key={plan.value}
                  className={`
                    p-3 rounded-lg border cursor-pointer transition-colors
                    ${formData.planesPermitidos.includes(plan.value)
                      ? 'bg-primary/10 border-primary'
                      : 'bg-muted/50 hover:bg-muted'
                    }
                  `}
                  onClick={() => togglePlanPermitido(plan.value)}
                >
                  <div className="flex items-center gap-2">
                    {formData.planesPermitidos.includes(plan.value) ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">{plan.label}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Seleccionados: {formData.planesPermitidos.length || 'Todos'}
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="avanzado" className="space-y-4 mt-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label className="text-base">Cupón Destacado</Label>
            <p className="text-sm text-muted-foreground">
              Mostrar este cupón de forma destacada en la landing page
            </p>
          </div>
          <Switch
            checked={formData.destacado}
            onCheckedChange={(checked) => setFormData({ ...formData, destacado: checked })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notas">Notas Internas</Label>
          <Textarea
            id="notas"
            value={formData.notas}
            onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
            placeholder="Notas para el equipo (no visibles para clientes)..."
            rows={4}
          />
        </div>
      </TabsContent>
    </Tabs>
  );

  // View Dialog Component
  const CouponViewDialog = () => {
    if (!viewingCoupon) return null;

    const porcentajeUso = viewingCoupon.usosMaximos 
      ? Math.round((viewingCoupon.usosActuales / viewingCoupon.usosMaximos) * 100)
      : 0;

    return (
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl text-white">
                <Tag className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl">{viewingCoupon.codigo}</DialogTitle>
                <DialogDescription>{viewingCoupon.nombre}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Estado y Métricas */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold">{getValorDisplay(viewingCoupon)}</div>
                  <p className="text-xs text-muted-foreground">Descuento</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold">
                    {viewingCoupon.usosActuales}/{viewingCoupon.usosMaximos || '∞'}
                  </div>
                  <p className="text-xs text-muted-foreground">Usos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className={`text-2xl font-bold ${getDiasRestantesColor(viewingCoupon.diasRestantes)}`}>
                    {viewingCoupon.diasRestantes || 0}d
                  </div>
                  <p className="text-xs text-muted-foreground">Días restantes</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="mb-2">{getEstadoBadge(viewingCoupon.estado)}</div>
                  <p className="text-xs text-muted-foreground">Estado</p>
                </CardContent>
              </Card>
            </div>

            {/* Barra de progreso de usos */}
            {viewingCoupon.usosMaximos && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Usos del cupón</span>
                  <span className="font-medium">{porcentajeUso}%</span>
                </div>
                <Progress value={porcentajeUso} className="h-2" />
              </div>
            )}

            {/* Detalles */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Vigencia
                </h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Inicio:</span> {new Date(viewingCoupon.fechaInicio).toLocaleDateString('es-ES')}</p>
                  <p><span className="text-muted-foreground">Fin:</span> {new Date(viewingCoupon.fechaExpiracion).toLocaleDateString('es-ES')}</p>
                  <p><span className="text-muted-foreground">Duración descuento:</span> {viewingCoupon.duracionMeses} mes(es)</p>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Alertas
                </h4>
                <div className="space-y-1 text-sm">
                  <p className="flex items-center gap-2">
                    {viewingCoupon.alertaEnviada7d ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-gray-300" />}
                    Alerta 7 días
                  </p>
                  <p className="flex items-center gap-2">
                    {viewingCoupon.alertaEnviada3d ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-gray-300" />}
                    Alerta 3 días
                  </p>
                  <p className="flex items-center gap-2">
                    {viewingCoupon.alertaEnviada1d ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-gray-300" />}
                    Alerta 1 día
                  </p>
                </div>
              </div>
            </div>

            {/* Planes permitidos */}
            <div className="space-y-2">
              <h4 className="font-semibold">Planes Permitidos</h4>
              <div className="flex gap-2 flex-wrap">
                {viewingCoupon.planesPermitidos.length > 0 ? (
                  viewingCoupon.planesPermitidos.map(plan => (
                    <Badge key={plan} variant="secondary">{plan}</Badge>
                  ))
                ) : (
                  <Badge variant="outline">Todos los planes</Badge>
                )}
              </div>
            </div>

            {/* Descripción y notas */}
            {viewingCoupon.descripcion && (
              <div className="space-y-2">
                <h4 className="font-semibold">Descripción</h4>
                <p className="text-sm text-muted-foreground">{viewingCoupon.descripcion}</p>
              </div>
            )}

            {viewingCoupon.notas && (
              <div className="space-y-2 p-3 bg-muted rounded-lg">
                <h4 className="font-semibold text-sm">Notas Internas</h4>
                <p className="text-sm text-muted-foreground">{viewingCoupon.notas}</p>
              </div>
            )}

            {/* URL de uso */}
            <div className="space-y-2 p-3 bg-indigo-50 rounded-lg">
              <h4 className="font-semibold text-sm text-indigo-800">URL con cupón aplicado</h4>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-white p-2 rounded border">
                  https://inmovaapp.com/register?coupon={viewingCoupon.codigo}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`https://inmovaapp.com/register?coupon=${viewingCoupon.codigo}`);
                    toast.success('URL copiada');
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Cerrar
            </Button>
            <Button onClick={() => {
              setShowViewDialog(false);
              openEditDialog(viewingCoupon);
            }}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tag className="h-6 w-6 text-indigo-600" />
            Cupones Promocionales
          </h1>
          <p className="text-muted-foreground">
            Gestiona los cupones de descuento para suscripciones INMOVA
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSendTestAlert} title="Ejecutar verificación manual">
            <Bell className="h-4 w-4 mr-2" />
            Verificar Alertas
          </Button>
          <Button variant="outline" onClick={loadCupones}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Recargar
          </Button>
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cupón
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Cupón</DialogTitle>
                <DialogDescription>
                  Define los parámetros del nuevo cupón promocional
                </DialogDescription>
              </DialogHeader>
              <CouponForm />
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Guardando...' : 'Crear Cupón'}
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
                <Tag className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Cupones</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Activos</p>
                <p className="text-2xl font-bold">{stats.activos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-100">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Por Expirar</p>
                <p className="text-2xl font-bold">{stats.porExpirar}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-100">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usos Totales</p>
                <p className="text-2xl font-bold">
                  {cupones.reduce((sum, c) => sum + c.usosActuales, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 mb-6">
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {estadoOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Alertas de cupones por expirar */}
      {stats.porExpirar > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">
                  {stats.porExpirar} cupón(es) expiran en los próximos 7 días
                </p>
                <p className="text-sm text-orange-600">
                  Revisa los cupones y decide si necesitas extenderlos o crear nuevas promociones.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cupón</TableHead>
                <TableHead>Descuento</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Planes</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cupones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No hay cupones. Crea uno nuevo para empezar.
                  </TableCell>
                </TableRow>
              ) : (
                cupones.map((coupon) => (
                  <TableRow key={coupon.id} className={coupon.diasRestantes && coupon.diasRestantes <= 7 ? 'bg-orange-50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                          <Tag className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div>
                          <div className="font-mono font-bold text-lg flex items-center gap-2">
                            {coupon.codigo}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleCopyCode(coupon.codigo)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-sm text-muted-foreground">{coupon.nombre}</div>
                          {coupon.destacado && (
                            <Badge variant="outline" className="mt-1">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Destacado
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-lg">{getValorDisplay(coupon)}</div>
                      <div className="text-xs text-muted-foreground">
                        {tipoOptions.find(t => t.value === coupon.tipo)?.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Durante {coupon.duracionMeses} mes(es)
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {new Date(coupon.fechaInicio).toLocaleDateString('es-ES')} - {new Date(coupon.fechaExpiracion).toLocaleDateString('es-ES')}
                        </div>
                        <div className={`text-sm font-medium ${getDiasRestantesColor(coupon.diasRestantes)}`}>
                          {coupon.diasRestantes !== undefined && coupon.diasRestantes > 0 
                            ? `${coupon.diasRestantes} días restantes`
                            : 'Expirado'
                          }
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-semibold">
                          {coupon.usosActuales} / {coupon.usosMaximos || '∞'}
                        </div>
                        {coupon.usosMaximos && (
                          <Progress 
                            value={(coupon.usosActuales / coupon.usosMaximos) * 100} 
                            className="h-1 w-20" 
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap max-w-[150px]">
                        {coupon.planesPermitidos.length > 0 ? (
                          coupon.planesPermitidos.slice(0, 2).map(plan => (
                            <Badge key={plan} variant="secondary" className="text-xs">{plan}</Badge>
                          ))
                        ) : (
                          <Badge variant="outline" className="text-xs">Todos</Badge>
                        )}
                        {coupon.planesPermitidos.length > 2 && (
                          <Badge variant="secondary" className="text-xs">+{coupon.planesPermitidos.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getEstadoBadge(coupon.estado)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openViewDialog(coupon)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(coupon)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyCode(coupon.codigo)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copiar Código
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {coupon.estado === 'ACTIVE' ? (
                            <DropdownMenuItem onClick={() => handleToggleEstado(coupon, 'PAUSED')}>
                              <Pause className="h-4 w-4 mr-2" />
                              Pausar
                            </DropdownMenuItem>
                          ) : coupon.estado === 'PAUSED' || coupon.estado === 'DRAFT' ? (
                            <DropdownMenuItem onClick={() => handleToggleEstado(coupon, 'ACTIVE')}>
                              <Play className="h-4 w-4 mr-2" />
                              Activar
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(coupon)}
                            className="text-destructive"
                            disabled={coupon.usosActuales > 0}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cupón: {editingCoupon?.codigo}</DialogTitle>
            <DialogDescription>
              Modifica los parámetros del cupón
            </DialogDescription>
          </DialogHeader>
          <CouponForm />
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

      {/* View Dialog */}
      <CouponViewDialog />
    </div>
  );
}
