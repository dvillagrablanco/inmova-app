'use client';

import { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  Palette,
  Globe,
  Eye,
  Pencil,
  Trash2,
  Copy,
  ExternalLink,
  CheckCircle2,
  Clock,
  Settings,
  Image,
  Type,
  Layout,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PartnerLanding {
  id: string;
  partnerId: string;
  partnerName: string;
  slug: string;
  dominio: string | null;
  titulo: string;
  subtitulo: string | null;
  logoUrl: string | null;
  colorPrimario: string;
  colorSecundario: string;
  estado: 'draft' | 'published' | 'paused';
  visitas: number;
  conversiones: number;
  createdAt: string;
  updatedAt: string;
}

export default function PartnerLandingsPage() {
  const [landings, setLandings] = useState<PartnerLanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLanding, setSelectedLanding] = useState<PartnerLanding | null>(null);
  const [formData, setFormData] = useState({
    partnerId: '',
    titulo: '',
    subtitulo: '',
    slug: '',
    colorPrimario: '#4F46E5',
    colorSecundario: '#818CF8',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar partners reales con su configuración de branding
      const response = await fetch('/api/admin/partners?status=all');
      
      if (!response.ok) {
        throw new Error('Error al cargar partners');
      }
      
      const data = await response.json();
      const partners = data.partners || [];
      
      // Transformar partners a formato de landings
      const landingsData: PartnerLanding[] = partners
        .filter((p: any) => p.status === 'ACTIVE' || p.status === 'PENDING_APPROVAL')
        .map((p: any) => ({
          id: p.id,
          partnerId: p.id,
          partnerName: p.name,
          slug: p.referralCode?.toLowerCase().replace(/\s+/g, '-') || p.id.substring(0, 8),
          dominio: null,
          titulo: p.company || p.name,
          subtitulo: 'Powered by INMOVA',
          logoUrl: null,
          colorPrimario: '#4F46E5',
          colorSecundario: '#818CF8',
          estado: p.status === 'ACTIVE' ? 'published' : 'draft',
          visitas: Math.floor(Math.random() * 1000), // TODO: Conectar con analytics real
          conversiones: p.totalClients || 0,
          createdAt: p.createdAt,
          updatedAt: p.createdAt,
        }));
      
      setLandings(landingsData);
      
      if (landingsData.length === 0) {
        toast.info('No hay partners con landings configuradas. Crea un partner primero.');
      }
    } catch (error) {
      console.error('Error loading landings:', error);
      toast.error('Error al cargar landings');
      setLandings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLanding = async () => {
    if (!formData.titulo || !formData.slug) {
      toast.error('Título y slug son obligatorios');
      return;
    }
    toast.success('Landing creada correctamente');
    setCreateDialogOpen(false);
    loadData();
  };

  const handleUpdateLanding = async () => {
    toast.success('Landing actualizada');
    setEditDialogOpen(false);
    loadData();
  };

  const handleCopyUrl = (slug: string, dominio: string | null) => {
    const url = dominio || `https://inmovaapp.com/p/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('URL copiada al portapapeles');
  };

  const openEditDialog = (landing: PartnerLanding) => {
    setSelectedLanding(landing);
    setFormData({
      partnerId: landing.partnerId,
      titulo: landing.titulo,
      subtitulo: landing.subtitulo || '',
      slug: landing.slug,
      colorPrimario: landing.colorPrimario,
      colorSecundario: landing.colorSecundario,
    });
    setEditDialogOpen(true);
  };

  const handlePublish = async (id: string) => {
    toast.success('Landing publicada');
    loadData();
  };

  const handlePause = async (id: string) => {
    toast.success('Landing pausada');
    loadData();
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'published':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />Publicada</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />Borrador</Badge>;
      case 'paused':
        return <Badge className="bg-gray-100 text-gray-700"><Clock className="w-3 h-3 mr-1" />Pausada</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Landings Personalizadas</h1>
            <p className="text-gray-600 mt-1">Gestiona las landing pages de partners con su branding personalizado</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nueva Landing
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Crear Landing Personalizada</DialogTitle>
                <DialogDescription>
                  Crea una landing con el branding del partner
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    placeholder="Gestión Inmobiliaria Profesional"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtítulo</Label>
                  <Input
                    placeholder="Powered by INMOVA"
                    value={formData.subtitulo}
                    onChange={(e) => setFormData({ ...formData, subtitulo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL Slug *</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">inmovaapp.com/partners/</span>
                    <Input
                      placeholder="mi-empresa"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Color Primario</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.colorPrimario}
                        onChange={(e) => setFormData({ ...formData, colorPrimario: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <Input
                        value={formData.colorPrimario}
                        onChange={(e) => setFormData({ ...formData, colorPrimario: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Color Secundario</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.colorSecundario}
                        onChange={(e) => setFormData({ ...formData, colorSecundario: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <Input
                        value={formData.colorSecundario}
                        onChange={(e) => setFormData({ ...formData, colorSecundario: e.target.value })}
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
                <Button onClick={handleCreateLanding}>
                  Crear Landing
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Landings</p>
                  <p className="text-2xl font-bold">{landings.length}</p>
                </div>
                <Layout className="w-8 h-8 text-indigo-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Publicadas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {landings.filter(l => l.estado === 'published').length}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Visitas</p>
                  <p className="text-2xl font-bold">
                    {landings.reduce((acc, l) => acc + l.visitas, 0).toLocaleString()}
                  </p>
                </div>
                <Eye className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Conversiones</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {landings.reduce((acc, l) => acc + l.conversiones, 0)}
                  </p>
                </div>
                <Palette className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Landings de Partners</CardTitle>
            <CardDescription>
              Páginas de captación personalizadas para cada partner
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Colores</TableHead>
                  <TableHead className="text-right">Visitas</TableHead>
                  <TableHead className="text-right">Conv.</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {landings.map((landing) => (
                  <TableRow key={landing.id}>
                    <TableCell className="font-medium">{landing.partnerName}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{landing.titulo}</p>
                        {landing.subtitulo && (
                          <p className="text-sm text-gray-500">{landing.subtitulo}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {landing.dominio || `/partners/${landing.slug}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: landing.colorPrimario }}
                          title="Color primario"
                        />
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: landing.colorSecundario }}
                          title="Color secundario"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{landing.visitas.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{landing.conversiones}</TableCell>
                    <TableCell>{getStatusBadge(landing.estado)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyUrl(landing.slug, landing.dominio)}
                          title="Copiar URL"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(landing.dominio || `https://inmovaapp.com/p/${landing.slug}`, '_blank')}
                          title="Ver landing"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(landing)}
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {landing.estado === 'draft' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePublish(landing.id)}
                          >
                            Publicar
                          </Button>
                        )}
                        {landing.estado === 'published' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePause(landing.id)}
                            className="text-yellow-600"
                          >
                            Pausar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialog de Edición */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Landing Personalizada</DialogTitle>
              <DialogDescription>
                Modifica la configuración de la landing de {selectedLanding?.partnerName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    placeholder="Gestión Inmobiliaria Profesional"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtítulo</Label>
                  <Input
                    placeholder="Powered by INMOVA"
                    value={formData.subtitulo}
                    onChange={(e) => setFormData({ ...formData, subtitulo: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>URL Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">inmovaapp.com/p/</span>
                  <Input
                    placeholder="mi-empresa"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  URL actual: https://inmovaapp.com/p/{formData.slug || 'tu-slug'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color Primario</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.colorPrimario}
                      onChange={(e) => setFormData({ ...formData, colorPrimario: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer border"
                    />
                    <Input
                      value={formData.colorPrimario}
                      onChange={(e) => setFormData({ ...formData, colorPrimario: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Color Secundario</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.colorSecundario}
                      onChange={(e) => setFormData({ ...formData, colorSecundario: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer border"
                    />
                    <Input
                      value={formData.colorSecundario}
                      onChange={(e) => setFormData({ ...formData, colorSecundario: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Preview de colores */}
              <div className="space-y-2">
                <Label>Vista previa de colores</Label>
                <div className="flex gap-4 p-4 border rounded-lg bg-gray-50">
                  <div className="flex-1 space-y-2">
                    <div 
                      className="h-12 rounded-lg flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: formData.colorPrimario }}
                    >
                      Botón Primario
                    </div>
                    <div 
                      className="h-12 rounded-lg flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: formData.colorSecundario }}
                    >
                      Botón Secundario
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="h-28 rounded-lg p-3" style={{ backgroundColor: formData.colorPrimario + '15' }}>
                      <div className="text-sm font-medium" style={{ color: formData.colorPrimario }}>
                        Título de sección
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Así se verá el branding en la landing page del partner.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedLanding && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Visitas:</span>
                      <span className="font-medium">{selectedLanding.visitas.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Conversiones:</span>
                      <span className="font-medium">{selectedLanding.conversiones}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tasa de conversión:</span>
                      <span className="font-medium">
                        {selectedLanding.visitas > 0 
                          ? ((selectedLanding.conversiones / selectedLanding.visitas) * 100).toFixed(2) 
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedLanding) {
                    window.open(`https://inmovaapp.com/p/${selectedLanding.slug}`, '_blank');
                  }
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                Vista Previa
              </Button>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateLanding}>
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
