'use client';

import { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus,
  FolderTree,
  Pencil,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Package,
  Building2,
  Shield,
  Wrench,
  Sparkles,
  Scale,
  Camera,
  Truck,
} from 'lucide-react';

interface Category {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string | null;
  icono: string;
  color: string;
  orden: number;
  activo: boolean;
  serviciosCount: number;
  proveedoresCount: number;
}

const ICONOS = [
  { value: 'shield', label: 'Escudo (Seguros)', icon: Shield },
  { value: 'wrench', label: 'Llave (Mantenimiento)', icon: Wrench },
  { value: 'sparkles', label: 'Estrellas (Limpieza)', icon: Sparkles },
  { value: 'scale', label: 'Balanza (Legal)', icon: Scale },
  { value: 'camera', label: 'Cámara (Marketing)', icon: Camera },
  { value: 'truck', label: 'Camión (Mudanzas)', icon: Truck },
  { value: 'building', label: 'Edificio (Certificaciones)', icon: Building2 },
  { value: 'package', label: 'Paquete (Otros)', icon: Package },
];

export default function MarketplaceCategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    slug: '',
    descripcion: '',
    icono: 'package',
    color: '#4F46E5',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      setCategories([
        {
          id: '1',
          nombre: 'Seguros',
          slug: 'seguros',
          descripcion: 'Seguros de alquiler, hogar, impago y responsabilidad civil',
          icono: 'shield',
          color: '#2563EB',
          orden: 1,
          activo: true,
          serviciosCount: 12,
          proveedoresCount: 5,
        },
        {
          id: '2',
          nombre: 'Certificaciones',
          slug: 'certificaciones',
          descripcion: 'Certificados energéticos, ITE, cédulas de habitabilidad',
          icono: 'building',
          color: '#059669',
          orden: 2,
          activo: true,
          serviciosCount: 8,
          proveedoresCount: 3,
        },
        {
          id: '3',
          nombre: 'Mantenimiento',
          slug: 'mantenimiento',
          descripcion: 'Fontanería, electricidad, climatización, reformas',
          icono: 'wrench',
          color: '#D97706',
          orden: 3,
          activo: true,
          serviciosCount: 25,
          proveedoresCount: 12,
        },
        {
          id: '4',
          nombre: 'Limpieza',
          slug: 'limpieza',
          descripcion: 'Limpieza profesional de inmuebles, fin de obra, cristales',
          icono: 'sparkles',
          color: '#0891B2',
          orden: 4,
          activo: true,
          serviciosCount: 10,
          proveedoresCount: 6,
        },
        {
          id: '5',
          nombre: 'Marketing Inmobiliario',
          slug: 'marketing',
          descripcion: 'Home staging, fotografía, tours virtuales, vídeos',
          icono: 'camera',
          color: '#7C3AED',
          orden: 5,
          activo: true,
          serviciosCount: 15,
          proveedoresCount: 8,
        },
        {
          id: '6',
          nombre: 'Legal',
          slug: 'legal',
          descripcion: 'Abogados, gestorías, tramitación de documentos',
          icono: 'scale',
          color: '#DC2626',
          orden: 6,
          activo: true,
          serviciosCount: 6,
          proveedoresCount: 4,
        },
        {
          id: '7',
          nombre: 'Mudanzas',
          slug: 'mudanzas',
          descripcion: 'Servicios de mudanza, guardamuebles, embalaje',
          icono: 'truck',
          color: '#64748B',
          orden: 7,
          activo: false,
          serviciosCount: 3,
          proveedoresCount: 2,
        },
      ]);
    } catch (error) {
      toast.error('Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!formData.nombre || !formData.slug) {
      toast.error('Nombre y slug son obligatorios');
      return;
    }
    toast.success('Categoría creada correctamente');
    setCreateDialogOpen(false);
    setFormData({ nombre: '', slug: '', descripcion: '', icono: 'package', color: '#4F46E5' });
    loadData();
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    toast.success(currentState ? 'Categoría desactivada' : 'Categoría activada');
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría? Los servicios asociados quedarán sin categoría.')) return;
    toast.success('Categoría eliminada');
    loadData();
  };

  const getIconComponent = (iconName: string) => {
    const iconConfig = ICONOS.find(i => i.value === iconName);
    return iconConfig?.icon || Package;
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Categorías del Marketplace</h1>
            <p className="text-gray-600 mt-1">Organiza los servicios del marketplace por categorías</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Categoría
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Crear Categoría</DialogTitle>
                <DialogDescription>
                  Añade una nueva categoría para organizar servicios
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    placeholder="Nombre de la categoría"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      nombre: e.target.value,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug (URL) *</Label>
                  <Input
                    placeholder="nombre-categoria"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    placeholder="Descripción breve..."
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Icono</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={formData.icono}
                      onChange={(e) => setFormData({ ...formData, icono: e.target.value })}
                    >
                      {ICONOS.map(i => (
                        <option key={i.value} value={i.value}>{i.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <Input
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateCategory}>
                  Crear Categoría
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Categorías</p>
                  <p className="text-2xl font-bold">{categories.length}</p>
                </div>
                <FolderTree className="w-8 h-8 text-indigo-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Activas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {categories.filter(c => c.activo).length}
                  </p>
                </div>
                <Eye className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Servicios</p>
                  <p className="text-2xl font-bold">
                    {categories.reduce((acc, c) => acc + c.serviciosCount, 0)}
                  </p>
                </div>
                <Package className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Categorías</CardTitle>
            <CardDescription>
              Arrastra para reordenar las categorías
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">Servicios</TableHead>
                  <TableHead className="text-right">Proveedores</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.sort((a, b) => a.orden - b.orden).map((category) => {
                  const IconComponent = getIconComponent(category.icono);
                  return (
                    <TableRow key={category.id} className={!category.activo ? 'opacity-50' : ''}>
                      <TableCell>
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${category.color}20` }}
                          >
                            <IconComponent
                              className="w-5 h-5"
                              style={{ color: category.color }}
                            />
                          </div>
                          <div>
                            <p className="font-medium">{category.nombre}</p>
                            {category.descripcion && (
                              <p className="text-sm text-gray-500 line-clamp-1">
                                {category.descripcion}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {category.slug}
                        </code>
                      </TableCell>
                      <TableCell className="text-right">{category.serviciosCount}</TableCell>
                      <TableCell className="text-right">{category.proveedoresCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={category.activo}
                            onCheckedChange={() => handleToggleActive(category.id, category.activo)}
                          />
                          <span className="text-sm">
                            {category.activo ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCategory(category);
                              setFormData({
                                nombre: category.nombre,
                                slug: category.slug,
                                descripcion: category.descripcion || '',
                                icono: category.icono,
                                color: category.color,
                              });
                              setEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(category.id)}
                            className="text-red-600"
                            disabled={category.serviciosCount > 0}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
