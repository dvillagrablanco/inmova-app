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
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

// Tipos de plantillas para PropTech
const TEMPLATE_CATEGORIES = [
  { id: 'social', name: 'Redes Sociales', icon: Share2, description: 'Posts para Instagram, Facebook, LinkedIn y X' },
  { id: 'presentations', name: 'Presentaciones', icon: Presentation, description: 'Slides para inversores y clientes' },
  { id: 'properties', name: 'Propiedades', icon: Home, description: 'Fichas y anuncios de inmuebles' },
  { id: 'marketing', name: 'Marketing', icon: TrendingUp, description: 'Banners, flyers y promociones' },
  { id: 'reports', name: 'Informes', icon: FileImage, description: 'Reportes visuales y dashboards' },
];

// Plantillas predefinidas para PropTech
const TEMPLATES = [
  // Redes Sociales
  { 
    id: 'instagram-property', 
    name: 'Propiedad Destacada - Instagram', 
    category: 'social',
    platform: 'instagram',
    dimensions: '1080x1080',
    thumbnail: '/templates/instagram-property.jpg',
    description: 'Plantilla para destacar propiedades en Instagram',
    popular: true,
  },
  { 
    id: 'instagram-story', 
    name: 'Historia Instagram - Nuevo Inmueble', 
    category: 'social',
    platform: 'instagram',
    dimensions: '1080x1920',
    thumbnail: '/templates/instagram-story.jpg',
    description: 'Historia vertical para anunciar nuevos inmuebles',
    popular: true,
  },
  { 
    id: 'facebook-cover', 
    name: 'Portada Facebook - Inmobiliaria', 
    category: 'social',
    platform: 'facebook',
    dimensions: '820x312',
    thumbnail: '/templates/facebook-cover.jpg',
    description: 'Portada profesional para página de empresa',
  },
  { 
    id: 'linkedin-post', 
    name: 'Post LinkedIn - Logro/Noticia', 
    category: 'social',
    platform: 'linkedin',
    dimensions: '1200x627',
    thumbnail: '/templates/linkedin-post.jpg',
    description: 'Post profesional para logros y noticias',
    popular: true,
  },
  { 
    id: 'twitter-post', 
    name: 'Post X/Twitter - Promoción', 
    category: 'social',
    platform: 'twitter',
    dimensions: '1200x675',
    thumbnail: '/templates/twitter-post.jpg',
    description: 'Post promocional para X',
  },
  // Presentaciones
  { 
    id: 'investor-deck', 
    name: 'Presentación Inversores', 
    category: 'presentations',
    platform: 'presentation',
    dimensions: '1920x1080',
    thumbnail: '/templates/investor-deck.jpg',
    description: 'Deck profesional para reuniones con inversores',
    popular: true,
  },
  { 
    id: 'client-proposal', 
    name: 'Propuesta Cliente', 
    category: 'presentations',
    platform: 'presentation',
    dimensions: '1920x1080',
    thumbnail: '/templates/client-proposal.jpg',
    description: 'Presentación de servicios para clientes potenciales',
  },
  { 
    id: 'property-portfolio', 
    name: 'Portfolio de Propiedades', 
    category: 'presentations',
    platform: 'presentation',
    dimensions: '1920x1080',
    thumbnail: '/templates/property-portfolio.jpg',
    description: 'Catálogo visual de propiedades disponibles',
  },
  // Propiedades
  { 
    id: 'property-card', 
    name: 'Ficha de Propiedad', 
    category: 'properties',
    platform: 'print',
    dimensions: 'A4',
    thumbnail: '/templates/property-card.jpg',
    description: 'Ficha detallada para impresión o digital',
    popular: true,
  },
  { 
    id: 'property-flyer', 
    name: 'Flyer Propiedad', 
    category: 'properties',
    platform: 'print',
    dimensions: 'A5',
    thumbnail: '/templates/property-flyer.jpg',
    description: 'Flyer promocional para open houses',
  },
  { 
    id: 'sold-announcement', 
    name: 'Anuncio Vendido/Alquilado', 
    category: 'properties',
    platform: 'social',
    dimensions: '1080x1080',
    thumbnail: '/templates/sold-announcement.jpg',
    description: 'Celebrar cierres de operaciones',
  },
  // Marketing
  { 
    id: 'promo-banner', 
    name: 'Banner Promocional', 
    category: 'marketing',
    platform: 'web',
    dimensions: '1200x628',
    thumbnail: '/templates/promo-banner.jpg',
    description: 'Banner para campañas publicitarias',
  },
  { 
    id: 'email-header', 
    name: 'Cabecera Email Marketing', 
    category: 'marketing',
    platform: 'email',
    dimensions: '600x200',
    thumbnail: '/templates/email-header.jpg',
    description: 'Header para newsletters y emails',
  },
  { 
    id: 'testimonial', 
    name: 'Testimonio Cliente', 
    category: 'marketing',
    platform: 'social',
    dimensions: '1080x1080',
    thumbnail: '/templates/testimonial.jpg',
    description: 'Compartir reseñas y testimonios',
  },
  // Informes
  { 
    id: 'market-report', 
    name: 'Informe de Mercado', 
    category: 'reports',
    platform: 'print',
    dimensions: 'A4',
    thumbnail: '/templates/market-report.jpg',
    description: 'Análisis visual del mercado inmobiliario',
  },
  { 
    id: 'monthly-stats', 
    name: 'Estadísticas Mensuales', 
    category: 'reports',
    platform: 'presentation',
    dimensions: '1920x1080',
    thumbnail: '/templates/monthly-stats.jpg',
    description: 'Resumen visual de métricas mensuales',
  },
];

// Diseños de ejemplo (simulados)
const SAMPLE_DESIGNS = [
  { id: '1', name: 'Post Instagram - Ático Barcelona', template: 'instagram-property', createdAt: '2026-01-10', status: 'published', views: 234, thumbnail: '/designs/design-1.jpg' },
  { id: '2', name: 'Presentación Q1 2026', template: 'investor-deck', createdAt: '2026-01-08', status: 'draft', views: 0, thumbnail: '/designs/design-2.jpg' },
  { id: '3', name: 'LinkedIn - Nuevo Proyecto', template: 'linkedin-post', createdAt: '2026-01-05', status: 'published', views: 567, thumbnail: '/designs/design-3.jpg' },
  { id: '4', name: 'Ficha - Piso Madrid Centro', template: 'property-card', createdAt: '2026-01-03', status: 'published', views: 123, thumbnail: '/designs/design-4.jpg' },
];

export default function CanvaStudioPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isConnected, setIsConnected] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[0] | null>(null);
  const [newDesignName, setNewDesignName] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    const allowedRoles = ['super_admin', 'SUPER_ADMIN', 'superadmin', 'admin', 'ADMIN'];
    const userRole = session?.user?.role?.toLowerCase();
    if (status === 'authenticated' && userRole && !allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
      router.push('/unauthorized');
    }
  }, [status, session, router]);

  // Verificar conexión con Canva
  useEffect(() => {
    const checkCanvaConnection = async () => {
      try {
        const res = await fetch('/api/admin/canva/status');
        if (res.ok) {
          const data = await res.json();
          setIsConnected(data.connected);
        }
      } catch (error) {
        setIsConnected(false);
      }
    };
    if (status === 'authenticated') {
      checkCanvaConnection();
    }
  }, [status]);

  const filteredTemplates = TEMPLATES.filter(template => {
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleConnectCanva = () => {
    // Redirigir a OAuth de Canva
    window.open('/api/admin/canva/auth', '_blank');
  };

  const handleCreateDesign = async () => {
    if (!selectedTemplate || !newDesignName) return;
    
    try {
      const res = await fetch('/api/admin/canva/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDesignName,
          templateId: selectedTemplate.id,
          dimensions: selectedTemplate.dimensions,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        // Abrir editor de Canva
        if (data.editUrl) {
          window.open(data.editUrl, '_blank');
        }
        setShowCreateDialog(false);
        setNewDesignName('');
        setSelectedTemplate(null);
      }
    } catch (error) {
      console.error('Error creating design:', error);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'facebook': return <Facebook className="h-4 w-4" />;
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'presentation': return <Presentation className="h-4 w-4" />;
      case 'print': return <FileImage className="h-4 w-4" />;
      case 'web': return <LayoutTemplate className="h-4 w-4" />;
      case 'email': return <FileImage className="h-4 w-4" />;
      default: return <ImageIcon className="h-4 w-4" />;
    }
  };

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                <Palette className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Canva Studio</h1>
                <p className="text-muted-foreground">Crea contenido visual profesional para marketing y presentaciones</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isConnected ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Conectado con Canva
                </Badge>
              ) : (
                <Button onClick={handleConnectCanva} variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Conectar Canva
                </Button>
              )}
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Diseño
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Diseño</DialogTitle>
                    <DialogDescription>
                      Selecciona una plantilla y personalízala con el editor de Canva
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nombre del diseño</Label>
                      <Input 
                        placeholder="Ej: Post Instagram - Nuevo Piso Barcelona"
                        value={newDesignName}
                        onChange={(e) => setNewDesignName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Plantilla base</Label>
                      <Select 
                        value={selectedTemplate?.id || ''} 
                        onValueChange={(v) => setSelectedTemplate(TEMPLATES.find(t => t.id === v) || null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una plantilla" />
                        </SelectTrigger>
                        <SelectContent>
                          {TEMPLATE_CATEGORIES.map(cat => (
                            <div key={cat.id}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{cat.name}</div>
                              {TEMPLATES.filter(t => t.category === cat.id).map(template => (
                                <SelectItem key={template.id} value={template.id}>
                                  <div className="flex items-center gap-2">
                                    {getPlatformIcon(template.platform)}
                                    <span>{template.name}</span>
                                    <span className="text-xs text-muted-foreground">({template.dimensions})</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedTemplate && (
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm font-medium">{selectedTemplate.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedTemplate.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{selectedTemplate.dimensions}</Badge>
                          <Badge variant="outline">{selectedTemplate.platform}</Badge>
                        </div>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleCreateDesign}
                      disabled={!selectedTemplate || !newDesignName}
                      className="bg-gradient-to-r from-purple-500 to-pink-500"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Crear y Editar en Canva
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Diseños Creados</p>
                  <p className="text-2xl font-bold">{SAMPLE_DESIGNS.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Publicados</p>
                  <p className="text-2xl font-bold">{SAMPLE_DESIGNS.filter(d => d.status === 'published').length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Share2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Visualizaciones</p>
                  <p className="text-2xl font-bold">{SAMPLE_DESIGNS.reduce((sum, d) => sum + d.views, 0)}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Eye className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Plantillas</p>
                  <p className="text-2xl font-bold">{TEMPLATES.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                  <LayoutTemplate className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="templates">
                <LayoutTemplate className="h-4 w-4 mr-2" />
                Plantillas
              </TabsTrigger>
              <TabsTrigger value="designs">
                <FolderOpen className="h-4 w-4 mr-2" />
                Mis Diseños
              </TabsTrigger>
              <TabsTrigger value="brand">
                <Palette className="h-4 w-4 mr-2" />
                Marca
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Buscar..." 
                  className="pl-9 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* Plantillas Tab */}
          <TabsContent value="templates" className="space-y-6">
            {/* Categorías */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={selectedCategory === null ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                Todas
              </Button>
              {TEMPLATE_CATEGORIES.map(cat => (
                <Button 
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <cat.icon className="h-4 w-4 mr-2" />
                  {cat.name}
                </Button>
              ))}
            </div>

            {/* Plantillas Populares */}
            {!selectedCategory && (
              <>
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    Plantillas Populares
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {TEMPLATES.filter(t => t.popular).map(template => (
                      <Card key={template.id} className="group hover:shadow-lg transition-all cursor-pointer border-2 hover:border-purple-300">
                        <CardContent className="p-0">
                          <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
                            {getPlatformIcon(template.platform)}
                            <span className="absolute bottom-2 right-2 text-xs bg-black/50 text-white px-2 py-1 rounded">
                              {template.dimensions}
                            </span>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button size="sm" variant="secondary" onClick={() => {
                                setSelectedTemplate(template);
                                setShowCreateDialog(true);
                              }}>
                                <Plus className="h-4 w-4 mr-1" />
                                Usar
                              </Button>
                            </div>
                          </div>
                          <div className="p-3">
                            <p className="font-medium text-sm truncate">{template.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{template.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Todas las Plantillas */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                {selectedCategory ? TEMPLATE_CATEGORIES.find(c => c.id === selectedCategory)?.name : 'Todas las Plantillas'}
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {filteredTemplates.map(template => (
                  <Card key={template.id} className="group hover:shadow-lg transition-all cursor-pointer">
                    <CardContent className="p-0">
                      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                        {getPlatformIcon(template.platform)}
                        <span className="absolute bottom-2 right-2 text-xs bg-black/50 text-white px-2 py-1 rounded">
                          {template.dimensions}
                        </span>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button size="sm" variant="secondary" onClick={() => {
                            setSelectedTemplate(template);
                            setShowCreateDialog(true);
                          }}>
                            <Plus className="h-4 w-4 mr-1" />
                            Usar
                          </Button>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          {getPlatformIcon(template.platform)}
                          <p className="font-medium text-sm truncate">{template.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{template.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Mis Diseños Tab */}
          <TabsContent value="designs" className="space-y-6">
            {SAMPLE_DESIGNS.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay diseños todavía</h3>
                  <p className="text-muted-foreground mb-4">Crea tu primer diseño usando una de nuestras plantillas</p>
                  <Button onClick={() => setActiveTab('templates')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Explorar Plantillas
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-4' : 'space-y-4'}>
                {SAMPLE_DESIGNS.map(design => (
                  <Card key={design.id} className="group hover:shadow-lg transition-all">
                    {viewMode === 'grid' ? (
                      <CardContent className="p-0">
                        <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          <Badge 
                            variant={design.status === 'published' ? 'default' : 'secondary'}
                            className="absolute top-2 right-2"
                          >
                            {design.status === 'published' ? 'Publicado' : 'Borrador'}
                          </Badge>
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button size="icon" variant="secondary">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="secondary">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="secondary">
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="font-medium text-sm truncate">{design.name}</p>
                          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {design.createdAt}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {design.views}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    ) : (
                      <CardContent className="flex items-center justify-between py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{design.name}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {design.createdAt}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {design.views} vistas
                              </span>
                              <Badge variant={design.status === 'published' ? 'default' : 'secondary'}>
                                {design.status === 'published' ? 'Publicado' : 'Borrador'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-1" />
                            Descargar
                          </Button>
                          <Button size="sm" variant="outline">
                            <Share2 className="h-4 w-4 mr-1" />
                            Compartir
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Marca Tab */}
          <TabsContent value="brand" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Kit de Marca Inmova
                </CardTitle>
                <CardDescription>
                  Gestiona los elementos de tu marca para mantener consistencia en todos los diseños
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo */}
                <div>
                  <h4 className="font-medium mb-3">Logo</h4>
                  <div className="flex gap-4">
                    <div className="h-24 w-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
                      IN
                    </div>
                    <div className="h-24 w-24 bg-white border rounded-lg flex items-center justify-center text-indigo-600 font-bold text-2xl">
                      IN
                    </div>
                    <div className="h-24 w-24 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
                      IN
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Colores */}
                <div>
                  <h4 className="font-medium mb-3">Colores de Marca</h4>
                  <div className="flex flex-wrap gap-3">
                    <div className="text-center">
                      <div className="h-16 w-16 rounded-lg bg-indigo-600" />
                      <p className="text-xs mt-1">#4F46E5</p>
                      <p className="text-xs text-muted-foreground">Principal</p>
                    </div>
                    <div className="text-center">
                      <div className="h-16 w-16 rounded-lg bg-purple-600" />
                      <p className="text-xs mt-1">#9333EA</p>
                      <p className="text-xs text-muted-foreground">Secundario</p>
                    </div>
                    <div className="text-center">
                      <div className="h-16 w-16 rounded-lg bg-emerald-500" />
                      <p className="text-xs mt-1">#10B981</p>
                      <p className="text-xs text-muted-foreground">Éxito</p>
                    </div>
                    <div className="text-center">
                      <div className="h-16 w-16 rounded-lg bg-amber-500" />
                      <p className="text-xs mt-1">#F59E0B</p>
                      <p className="text-xs text-muted-foreground">Alerta</p>
                    </div>
                    <div className="text-center">
                      <div className="h-16 w-16 rounded-lg bg-gray-900" />
                      <p className="text-xs mt-1">#111827</p>
                      <p className="text-xs text-muted-foreground">Texto</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Tipografía */}
                <div>
                  <h4 className="font-medium mb-3">Tipografía</h4>
                  <div className="space-y-3">
                    <div className="p-4 border rounded-lg">
                      <p className="text-2xl font-bold">Inter Bold</p>
                      <p className="text-sm text-muted-foreground">Títulos y encabezados</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-lg">Inter Regular</p>
                      <p className="text-sm text-muted-foreground">Texto de cuerpo</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Editar Kit de Marca
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="fixed bottom-6 right-6">
          <div className="flex flex-col gap-2">
            <Button 
              size="lg" 
              className="rounded-full shadow-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              onClick={() => setShowCreateDialog(true)}
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Crear con IA
            </Button>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
