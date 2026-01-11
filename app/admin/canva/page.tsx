'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Palette,
  Plus,
  Image as ImageIcon,
  FileImage,
  Share2,
  Download,
  ExternalLink,
  Sparkles,
  LayoutTemplate,
  Presentation,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Building2,
  Home,
  Users,
  TrendingUp,
  Calendar,
  Clock,
  Eye,
  Edit,
  Trash2,
  Copy,
  Settings,
  Zap,
  FolderOpen,
  Grid3X3,
  List,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

// Tipos
interface CanvaDesign {
  id: string;
  name: string;
  category: string;
  thumbnail?: string;
  dimensions: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'published';
}

interface Template {
  id: string;
  name: string;
  category: string;
  platform?: string;
  dimensions: string;
  description: string;
  popular?: boolean;
}

// Categorías de plantillas para PropTech
const TEMPLATE_CATEGORIES = [
  { id: 'social', name: 'Redes Sociales', icon: Share2, description: 'Posts para Instagram, Facebook, LinkedIn y X' },
  { id: 'presentations', name: 'Presentaciones', icon: Presentation, description: 'Slides para inversores y clientes' },
  { id: 'properties', name: 'Propiedades', icon: Home, description: 'Fichas y anuncios de inmuebles' },
  { id: 'marketing', name: 'Marketing', icon: TrendingUp, description: 'Banners, flyers y promociones' },
  { id: 'reports', name: 'Informes', icon: FileImage, description: 'Reportes visuales y dashboards' },
];

// Plantillas disponibles (estas son las plantillas base del sistema)
const AVAILABLE_TEMPLATES: Template[] = [
  { 
    id: 'instagram-property', 
    name: 'Propiedad Destacada - Instagram', 
    category: 'social',
    platform: 'instagram',
    dimensions: '1080x1080',
    description: 'Plantilla para destacar propiedades en Instagram',
    popular: true,
  },
  { 
    id: 'instagram-story', 
    name: 'Historia Instagram - Nuevo Inmueble', 
    category: 'social',
    platform: 'instagram',
    dimensions: '1080x1920',
    description: 'Historia vertical para anunciar nuevos inmuebles',
    popular: true,
  },
  { 
    id: 'facebook-post', 
    name: 'Post Facebook - Propiedades', 
    category: 'social',
    platform: 'facebook',
    dimensions: '1200x630',
    description: 'Post optimizado para Facebook',
  },
  { 
    id: 'linkedin-post', 
    name: 'Post LinkedIn - Profesional', 
    category: 'social',
    platform: 'linkedin',
    dimensions: '1200x627',
    description: 'Diseño profesional para LinkedIn',
  },
  { 
    id: 'investor-pitch', 
    name: 'Presentación para Inversores', 
    category: 'presentations',
    dimensions: '1920x1080',
    description: 'Deck profesional para reuniones con inversores',
    popular: true,
  },
  { 
    id: 'property-brochure', 
    name: 'Dossier de Propiedad', 
    category: 'properties',
    dimensions: 'A4',
    description: 'Dossier completo con información del inmueble',
    popular: true,
  },
  { 
    id: 'open-house', 
    name: 'Jornada de Puertas Abiertas', 
    category: 'marketing',
    dimensions: '1080x1080',
    description: 'Anuncio para open house',
  },
  { 
    id: 'monthly-report', 
    name: 'Informe Mensual', 
    category: 'reports',
    dimensions: 'A4',
    description: 'Reporte visual de rendimiento',
  },
];

// Iconos de plataforma
const platformIcons: Record<string, any> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  twitter: Twitter,
};

// Skeleton para carga
function CanvaSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i}>
          <CardContent className="p-0">
            <Skeleton className="h-40 w-full rounded-t-lg" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Estado vacío para diseños
function EmptyDesigns({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <Card>
      <CardContent className="pt-12 pb-12 text-center">
        <Palette className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Sin diseños creados</h3>
        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
          Aún no has creado ningún diseño. Usa las plantillas o crea uno desde cero.
        </p>
        <Button onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Primer Diseño
        </Button>
      </CardContent>
    </Card>
  );
}

export default function CanvaStudioPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [isLoading, setIsLoading] = useState(true);
  const [canvaStatus, setCanvaStatus] = useState<'connected' | 'disconnected' | 'unknown'>('unknown');
  const [designs, setDesigns] = useState<CanvaDesign[]>([]);
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [newDesignName, setNewDesignName] = useState('');

  // Verificar autenticación
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Cargar datos
  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    }
  }, [status]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Verificar estado de conexión con Canva
      const statusRes = await fetch('/api/admin/canva/status');
      if (statusRes.ok) {
        const data = await statusRes.json();
        setCanvaStatus(data.connected ? 'connected' : 'disconnected');
      }

      // Cargar diseños del usuario
      const designsRes = await fetch('/api/admin/canva/designs');
      if (designsRes.ok) {
        const data = await designsRes.json();
        setDesigns(data.designs || []);
      }
    } catch (error) {
      console.error('Error loading Canva data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar plantillas
  const filteredTemplates = AVAILABLE_TEMPLATES.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Crear nuevo diseño
  const createDesign = async () => {
    if (!newDesignName.trim()) {
      toast.error('Introduce un nombre para el diseño');
      return;
    }

    try {
      const res = await fetch('/api/admin/canva/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDesignName,
          templateId: selectedTemplate?.id,
          category: selectedTemplate?.category || 'custom',
          dimensions: selectedTemplate?.dimensions || '1080x1080',
        }),
      });

      if (res.ok) {
        toast.success('Diseño creado correctamente');
        setShowCreateDialog(false);
        setNewDesignName('');
        setSelectedTemplate(null);
        loadData();
      } else {
        toast.error('Error al crear diseño');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  // Conectar con Canva
  const connectCanva = () => {
    // TODO: Implementar OAuth con Canva Connect API
    toast.info('La integración con Canva Connect API está en desarrollo. Por ahora puedes usar las plantillas locales.');
  };

  // Estadísticas
  const stats = {
    totalDesigns: designs.length,
    published: designs.filter(d => d.status === 'published').length,
    drafts: designs.filter(d => d.status === 'draft').length,
    templates: AVAILABLE_TEMPLATES.length,
  };

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto py-6 px-4 max-w-7xl">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-16 w-16 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          <CanvaSkeleton />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 flex items-center justify-center">
              <Palette className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">Canva Studio</h1>
                <Badge 
                  variant={canvaStatus === 'connected' ? 'default' : 'secondary'}
                  className={canvaStatus === 'connected' ? 'bg-green-500' : ''}
                >
                  {canvaStatus === 'connected' ? '✓ Conectado' : '⚠️ Local'}
                </Badge>
              </div>
              <p className="text-muted-foreground">Crea contenido visual profesional para Inmova</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            {canvaStatus !== 'connected' && (
              <Button variant="outline" onClick={connectCanva}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Conectar Canva
              </Button>
            )}
            <Button 
              className="bg-gradient-to-r from-purple-500 to-pink-500"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Diseño
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mis Diseños</p>
                  <p className="text-2xl font-bold">{stats.totalDesigns}</p>
                </div>
                <FolderOpen className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Publicados</p>
                  <p className="text-2xl font-bold text-green-600">{stats.published}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Borradores</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.drafts}</p>
                </div>
                <Edit className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Plantillas</p>
                  <p className="text-2xl font-bold">{stats.templates}</p>
                </div>
                <LayoutTemplate className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="templates" className="gap-2">
              <LayoutTemplate className="h-4 w-4" />
              Plantillas
            </TabsTrigger>
            <TabsTrigger value="designs" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Mis Diseños
            </TabsTrigger>
            <TabsTrigger value="brand" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Marca
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            {/* Filtros */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                >
                  Todas
                </Button>
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <cat.icon className="h-4 w-4 mr-1" />
                    {cat.name}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar plantillas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                >
                  {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Lista de plantillas */}
            {filteredTemplates.length > 0 ? (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                : 'space-y-4'
              }>
                {filteredTemplates.map((template) => {
                  const PlatformIcon = template.platform ? platformIcons[template.platform] : null;
                  
                  return viewMode === 'grid' ? (
                    <Card 
                      key={template.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow group"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowCreateDialog(true);
                      }}
                    >
                      <CardContent className="p-0">
                        <div className="h-40 bg-gradient-to-br from-purple-100 to-pink-100 rounded-t-lg flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-purple-300" />
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            {PlatformIcon && <PlatformIcon className="h-4 w-4 text-muted-foreground" />}
                            <h4 className="font-medium text-sm line-clamp-1">{template.name}</h4>
                            {template.popular && (
                              <Badge variant="secondary" className="text-xs">Popular</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{template.dimensions}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card 
                      key={template.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setShowCreateDialog(true);
                      }}
                    >
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-16 w-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="h-8 w-8 text-purple-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {PlatformIcon && <PlatformIcon className="h-4 w-4 text-muted-foreground" />}
                            <h4 className="font-medium">{template.name}</h4>
                            {template.popular && (
                              <Badge variant="secondary">Popular</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                          <p className="text-xs text-muted-foreground">{template.dimensions}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Usar
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No se encontraron plantillas con ese filtro</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Designs Tab */}
          <TabsContent value="designs" className="space-y-6">
            {designs.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {designs.map((design) => (
                  <Card key={design.id} className="group">
                    <CardContent className="p-0">
                      <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg flex items-center justify-center relative">
                        {design.thumbnail ? (
                          <img src={design.thumbnail} alt={design.name} className="w-full h-full object-cover rounded-t-lg" />
                        ) : (
                          <ImageIcon className="h-12 w-12 text-gray-300" />
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg flex items-center justify-center gap-2">
                          <Button size="icon" variant="secondary">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="secondary">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm line-clamp-1">{design.name}</h4>
                          <Badge variant={design.status === 'published' ? 'default' : 'secondary'}>
                            {design.status === 'published' ? '✓' : '📝'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{design.dimensions}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyDesigns onCreateNew={() => setShowCreateDialog(true)} />
            )}
          </TabsContent>

          {/* Brand Tab */}
          <TabsContent value="brand" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Kit de Marca Inmova
                </CardTitle>
                <CardDescription>
                  Elementos visuales de la marca para tus diseños
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Colores */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Colores de Marca</h4>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <div className="h-12 w-full rounded-lg bg-violet-600"></div>
                        <p className="text-xs text-center">#7C3AED</p>
                      </div>
                      <div className="space-y-1">
                        <div className="h-12 w-full rounded-lg bg-purple-500"></div>
                        <p className="text-xs text-center">#A855F7</p>
                      </div>
                      <div className="space-y-1">
                        <div className="h-12 w-full rounded-lg bg-fuchsia-500"></div>
                        <p className="text-xs text-center">#D946EF</p>
                      </div>
                      <div className="space-y-1">
                        <div className="h-12 w-full rounded-lg bg-slate-900"></div>
                        <p className="text-xs text-center">#0F172A</p>
                      </div>
                    </div>
                  </div>

                  {/* Tipografía */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Tipografía</h4>
                    <div className="space-y-2">
                      <div className="p-3 border rounded-lg">
                        <p className="text-2xl font-bold">Inter Bold</p>
                        <p className="text-xs text-muted-foreground">Títulos principales</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <p className="text-lg">Inter Regular</p>
                        <p className="text-xs text-muted-foreground">Texto de cuerpo</p>
                      </div>
                    </div>
                  </div>

                  {/* Logo */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Logo</h4>
                    <div className="flex gap-4">
                      <div className="p-4 border rounded-lg bg-white flex items-center justify-center">
                        <div className="h-12 w-12 bg-gradient-to-br from-violet-600 to-purple-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-xl">i</span>
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg bg-slate-900 flex items-center justify-center">
                        <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center">
                          <span className="text-violet-600 font-bold text-xl">i</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Usa el logo en fondos claros u oscuros según el contexto
                    </p>
                  </div>

                  {/* Estilo Visual */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Estilo Visual</h4>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Diseños limpios y modernos
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Gradientes sutiles de violeta a púrpura
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Fotografías de alta calidad de propiedades
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Iconografía simple y consistente
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog: Crear Diseño */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-purple-500" />
                {selectedTemplate ? `Crear desde: ${selectedTemplate.name}` : 'Nuevo Diseño'}
              </DialogTitle>
              <DialogDescription>
                {selectedTemplate 
                  ? `Basado en la plantilla "${selectedTemplate.name}" (${selectedTemplate.dimensions})`
                  : 'Crea un diseño personalizado desde cero'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre del Diseño</Label>
                <Input
                  placeholder="Ej: Post Instagram - Propiedad Madrid"
                  value={newDesignName}
                  onChange={(e) => setNewDesignName(e.target.value)}
                />
              </div>

              {!selectedTemplate && (
                <>
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Dimensiones</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tamaño" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1080x1080">1080x1080 (Instagram Post)</SelectItem>
                        <SelectItem value="1080x1920">1080x1920 (Instagram Story)</SelectItem>
                        <SelectItem value="1200x630">1200x630 (Facebook/LinkedIn)</SelectItem>
                        <SelectItem value="1920x1080">1920x1080 (Presentación)</SelectItem>
                        <SelectItem value="A4">A4 (Documento)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {selectedTemplate && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-purple-300" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedTemplate.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                      <p className="text-xs text-muted-foreground">{selectedTemplate.dimensions}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateDialog(false);
                  setSelectedTemplate(null);
                  setNewDesignName('');
                }}
              >
                Cancelar
              </Button>
              <Button 
                className="bg-gradient-to-r from-purple-500 to-pink-500"
                onClick={createDesign}
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Diseño
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
