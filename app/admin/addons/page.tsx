'use client';

import { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  FileSignature,
  HardDrive,
  Bot,
  MessageSquare,
  Palette,
  Code,
  Leaf,
  TrendingUp,
  Eye,
  RefreshCw,
  Star,
  DollarSign,
  Percent,
} from 'lucide-react';

interface AddOn {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precioMensual: number;
  precioAnual: number | null;
  unidades: number | null;
  tipoUnidad: string | null;
  disponiblePara: string[];
  incluidoEn: string[];
  margenPorcentaje: number | null;
  costoUnitario: number | null;
  destacado: boolean;
  activo: boolean;
  orden: number;
}

const categoriaColors: Record<string, string> = {
  usage: 'bg-blue-100 text-blue-800',
  feature: 'bg-purple-100 text-purple-800',
  premium: 'bg-amber-100 text-amber-800',
};

const categoriaIcons: Record<string, any> = {
  usage: Package,
  feature: Star,
  premium: DollarSign,
};

const tierOptions = ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'];
const ewoorkerTierOptions = ['OBRERO', 'CAPATAZ', 'CONSTRUCTOR'];

export default function AdminAddonsPage() {
  const router = useRouter();
  const [addons, setAddons] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [editingAddon, setEditingAddon] = useState<AddOn | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'inmova' | 'ewoorker'>('inmova');
  const [allAddons, setAllAddons] = useState<AddOn[]>([]); // Todos los add-ons sin filtrar

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: 'usage',
    precioMensual: 0,
    precioAnual: 0,
    unidades: 0,
    tipoUnidad: '',
    disponiblePara: [] as string[],
    incluidoEn: [] as string[],
    margenPorcentaje: 0,
    costoUnitario: 0,
    destacado: false,
    activo: true,
    vertical: 'inmova' as 'inmova' | 'ewoorker',
  });

  useEffect(() => {
    loadAddons();
  }, []);

  // Filtrar add-ons según el tab activo
  useEffect(() => {
    const filtered = allAddons.filter((addon: any) => {
      const vertical = addon.vertical || 'inmova';
      if (activeTab === 'inmova') {
        return vertical === 'inmova' || !addon.codigo?.startsWith('ewoorker_');
      } else {
        return vertical === 'ewoorker' || addon.codigo?.startsWith('ewoorker_');
      }
    });
    setAddons(filtered);
  }, [activeTab, allAddons]);

  const loadAddons = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/addons?vertical=all');

      if (!res.ok) {
        throw new Error('Error al cargar add-ons');
      }

      const data = await res.json();
      setAllAddons(data.data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar los add-ons');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      codigo: activeTab === 'ewoorker' ? 'ewoorker_' : '',
      nombre: '',
      descripcion: '',
      categoria: 'usage',
      precioMensual: 0,
      precioAnual: 0,
      unidades: 0,
      tipoUnidad: '',
      disponiblePara: [],
      incluidoEn: [],
      margenPorcentaje: 0,
      costoUnitario: 0,
      destacado: false,
      activo: true,
      vertical: activeTab,
    });
  };

  const openNewDialog = () => {
    resetForm();
    setEditingAddon(null);
    setShowNewDialog(true);
  };

  const openEditDialog = (addon: AddOn) => {
    setEditingAddon(addon);
    const isEwoorker =
      addon.codigo?.startsWith('ewoorker_') || (addon as any).vertical === 'ewoorker';
    setFormData({
      codigo: addon.codigo,
      nombre: addon.nombre,
      descripcion: addon.descripcion,
      categoria: addon.categoria,
      precioMensual: addon.precioMensual,
      precioAnual: addon.precioAnual || 0,
      unidades: addon.unidades || 0,
      tipoUnidad: addon.tipoUnidad || '',
      disponiblePara: addon.disponiblePara || [],
      incluidoEn: addon.incluidoEn || [],
      margenPorcentaje: addon.margenPorcentaje || 0,
      costoUnitario: addon.costoUnitario || 0,
      destacado: addon.destacado,
      activo: addon.activo !== false,
      vertical: isEwoorker ? 'ewoorker' : 'inmova',
    });
    setShowEditDialog(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const url = editingAddon ? `/api/addons/${editingAddon.id}` : '/api/addons';

      const res = await fetch(url, {
        method: editingAddon ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al guardar');
      }

      toast.success(editingAddon ? 'Add-on actualizado' : 'Add-on creado');
      setShowEditDialog(false);
      setShowNewDialog(false);
      loadAddons();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const toggleTier = (tier: string, field: 'disponiblePara' | 'incluidoEn') => {
    const current = formData[field];
    if (current.includes(tier)) {
      setFormData({ ...formData, [field]: current.filter((t) => t !== tier) });
    } else {
      setFormData({ ...formData, [field]: [...current, tier] });
    }
  };

  const getAddonIcon = (codigo: string) => {
    if (codigo.includes('signature')) return FileSignature;
    if (codigo.includes('storage')) return HardDrive;
    if (codigo.includes('ai')) return Bot;
    if (codigo.includes('sms')) return MessageSquare;
    if (codigo.includes('whitelabel')) return Palette;
    if (codigo.includes('api')) return Code;
    if (codigo.includes('esg')) return Leaf;
    if (codigo.includes('pricing')) return TrendingUp;
    if (codigo.includes('tour')) return Eye;
    return Package;
  };

  // Calcular estadísticas
  const totalAddons = addons.length;
  const addonsDestacados = addons.filter((a) => a.destacado).length;
  const avgMargen =
    addons.length > 0
      ? addons.reduce((sum, a) => sum + (a.margenPorcentaje || 0), 0) / addons.length
      : 0;

  const AddOnForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="codigo">Código</Label>
          <Input
            id="codigo"
            value={formData.codigo}
            onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
            placeholder="signatures_pack_10"
            disabled={!!editingAddon}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Pack 10 Firmas"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          placeholder="Descripción del add-on..."
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Categoría</Label>
          <Select
            value={formData.categoria}
            onValueChange={(v) => setFormData({ ...formData, categoria: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="usage">Uso (packs)</SelectItem>
              <SelectItem value="feature">Funcionalidad</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unidades">Unidades</Label>
          <Input
            id="unidades"
            type="number"
            value={formData.unidades}
            onChange={(e) => setFormData({ ...formData, unidades: parseInt(e.target.value) || 0 })}
            placeholder="10"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tipoUnidad">Tipo Unidad</Label>
          <Input
            id="tipoUnidad"
            value={formData.tipoUnidad}
            onChange={(e) => setFormData({ ...formData, tipoUnidad: e.target.value })}
            placeholder="firmas, GB, tokens..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="costoUnitario">Costo (€)</Label>
          <Input
            id="costoUnitario"
            type="number"
            step="0.01"
            value={formData.costoUnitario}
            onChange={(e) =>
              setFormData({ ...formData, costoUnitario: parseFloat(e.target.value) || 0 })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="margenPorcentaje">Margen (%)</Label>
          <Input
            id="margenPorcentaje"
            type="number"
            value={formData.margenPorcentaje}
            onChange={(e) =>
              setFormData({ ...formData, margenPorcentaje: parseFloat(e.target.value) || 0 })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Producto/Vertical:</Label>
        <div className="flex gap-2">
          <Badge
            variant={formData.vertical === 'inmova' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() =>
              setFormData({ ...formData, vertical: 'inmova', disponiblePara: [], incluidoEn: [] })
            }
          >
            INMOVA
          </Badge>
          <Badge
            variant={formData.vertical === 'ewoorker' ? 'default' : 'outline'}
            className="cursor-pointer bg-amber-500 hover:bg-amber-600"
            onClick={() =>
              setFormData({ ...formData, vertical: 'ewoorker', disponiblePara: [], incluidoEn: [] })
            }
          >
            eWoorker
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Disponible para planes:</Label>
        <div className="flex gap-2 flex-wrap">
          {(formData.vertical === 'ewoorker' ? ewoorkerTierOptions : tierOptions).map((tier) => (
            <Badge
              key={tier}
              variant={formData.disponiblePara.includes(tier) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleTier(tier, 'disponiblePara')}
            >
              {tier}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Incluido gratis en:</Label>
        <div className="flex gap-2 flex-wrap">
          {(formData.vertical === 'ewoorker' ? ewoorkerTierOptions : tierOptions).map((tier) => (
            <Badge
              key={tier}
              variant={formData.incluidoEn.includes(tier) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleTier(tier, 'incluidoEn')}
            >
              {tier}
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
          <Label htmlFor="destacado">Destacar este add-on</Label>
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
            <h1 className="text-3xl font-bold">Add-ons & Mejoras</h1>
            <p className="text-muted-foreground">
              Gestiona los add-ons disponibles para los planes de suscripción
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadAddons}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
            <Button onClick={openNewDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Add-on
            </Button>
          </div>
        </div>

        {/* Tabs INMOVA / eWoorker */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'inmova' | 'ewoorker')}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger
              value="inmova"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              🏠 INMOVA (
              {
                allAddons.filter(
                  (a) => !a.codigo?.startsWith('ewoorker_') && (a as any).vertical !== 'ewoorker'
                ).length
              }
              )
            </TabsTrigger>
            <TabsTrigger
              value="ewoorker"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-white"
            >
              🏗️ eWoorker (
              {
                allAddons.filter(
                  (a) => a.codigo?.startsWith('ewoorker_') || (a as any).vertical === 'ewoorker'
                ).length
              }
              )
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Estadísticas */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Add-ons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAddons}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Destacados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{addonsDestacados}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Margen Promedio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{avgMargen.toFixed(0)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Categorías
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-1">
                <Badge variant="outline">
                  {addons.filter((a) => a.categoria === 'usage').length} uso
                </Badge>
                <Badge variant="outline">
                  {addons.filter((a) => a.categoria === 'feature').length} feat
                </Badge>
                <Badge variant="outline">
                  {addons.filter((a) => a.categoria === 'premium').length} prem
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de Add-ons */}
        <Card>
          <CardHeader>
            <CardTitle>Add-ons Disponibles</CardTitle>
            <CardDescription>
              Los add-ons mostrados aquí se sincronizan con la landing page y el sistema de
              facturación
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Cargando...</div>
            ) : addons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay add-ons. Ejecuta el seed: npx tsx prisma/seed-addons.ts
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Add-on</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Precio/mes</TableHead>
                    <TableHead className="text-right">Costo</TableHead>
                    <TableHead className="text-right">Margen</TableHead>
                    <TableHead>Disponible</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {addons.map((addon) => {
                    const Icon = getAddonIcon(addon.codigo);
                    return (
                      <TableRow key={addon.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {addon.nombre}
                                {addon.destacado && (
                                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {addon.descripcion}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={categoriaColors[addon.categoria] || 'bg-gray-100'}>
                            {addon.categoria}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          €{addon.precioMensual}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          €{addon.costoUnitario || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="outline"
                            className={
                              (addon.margenPorcentaje || 0) >= 70
                                ? 'border-green-500 text-green-700'
                                : 'border-amber-500 text-amber-700'
                            }
                          >
                            {addon.margenPorcentaje || 0}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(addon.disponiblePara || []).slice(0, 2).map((tier) => (
                              <Badge key={tier} variant="outline" className="text-xs">
                                {tier.substring(0, 4)}
                              </Badge>
                            ))}
                            {(addon.disponiblePara || []).length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{(addon.disponiblePara || []).length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={addon.activo !== false ? 'default' : 'secondary'}>
                            {addon.activo !== false ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(addon)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async () => {
                                if (confirm(`¿Eliminar el add-on "${addon.nombre}"?`)) {
                                  try {
                                    const res = await fetch(`/api/addons/${addon.id}`, {
                                      method: 'DELETE',
                                    });
                                    if (res.ok) {
                                      toast.success('Add-on eliminado');
                                      loadAddons();
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

        {/* Dialog para nuevo add-on */}
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nuevo Add-on</DialogTitle>
              <DialogDescription>
                Crea un nuevo add-on para ofrecer a los suscriptores
              </DialogDescription>
            </DialogHeader>
            <AddOnForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : 'Crear Add-on'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para editar add-on */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Add-on</DialogTitle>
              <DialogDescription>Modifica la configuración del add-on</DialogDescription>
            </DialogHeader>
            <AddOnForm />
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
    </AuthenticatedLayout>
  );
}
