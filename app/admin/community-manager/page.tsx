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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Bot,
  Settings,
  Calendar as CalendarIcon,
  Clock,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  FileText,
  PenTool,
  Sparkles,
  Send,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Plus,
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  Edit,
  Trash2,
  Image as ImageIcon,
  Palette,
  Zap,
  Target,
  Users,
  Globe,
  Newspaper,
  BookOpen,
  ExternalLink,
  Loader2,
  Link2,
  AlertTriangle,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

// Tipos
interface SocialAccount {
  id: string;
  platform: 'instagram' | 'facebook' | 'linkedin' | 'twitter';
  name: string;
  username: string;
  followers: number;
  connected: boolean;
  lastPost?: string;
}

interface ScheduledPost {
  id: string;
  content: string;
  platforms: string[];
  scheduledDate: string;
  status: 'scheduled' | 'published' | 'failed' | 'draft';
  type: 'post' | 'story' | 'reel' | 'article';
  mediaUrl?: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
  };
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  status: 'draft' | 'scheduled' | 'published';
  publishDate?: string;
  views?: number;
  category: string;
}

interface CMConfig {
  autoPost: boolean;
  postFrequency: 'daily' | 'weekly' | 'custom';
  customDaysPerWeek: number;
  bestTimeToPost: string;
  hashtagStrategy: 'auto' | 'manual' | 'mixed';
  contentStyle: 'professional' | 'casual' | 'mixed';
  aiModel: string;
  temperature: number;
}

// Iconos de plataforma
const platformIcons: Record<string, any> = {
  instagram: Instagram,
  facebook: Facebook,
  linkedin: Linkedin,
  twitter: Twitter,
};

const platformColors: Record<string, string> = {
  instagram: 'from-pink-500 via-purple-500 to-orange-500',
  facebook: 'from-blue-600 to-blue-700',
  linkedin: 'from-blue-500 to-blue-700',
  twitter: 'from-sky-400 to-sky-500',
};

// Skeleton para carga
function CMSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

// Estado vacío genérico
function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}: { 
  icon: any; 
  title: string; 
  description: string; 
  actionLabel?: string; 
  onAction?: () => void;
}) {
  return (
    <Card>
      <CardContent className="pt-12 pb-12 text-center">
        <Icon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4 max-w-md mx-auto">{description}</p>
        {onAction && actionLabel && (
          <Button onClick={onAction}>
            <Plus className="h-4 w-4 mr-2" />
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function CommunityManagerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  
  // Datos desde API
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [config, setConfig] = useState<CMConfig>({
    autoPost: false,
    postFrequency: 'weekly',
    customDaysPerWeek: 3,
    bestTimeToPost: '10:00',
    hashtagStrategy: 'auto',
    contentStyle: 'professional',
    aiModel: 'claude-3-haiku-20240307',
    temperature: 0.7,
  });
  
  // Estados de UI
  const [showCreatePostDialog, setShowCreatePostDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostPlatforms, setNewPostPlatforms] = useState<string[]>([]);
  
  // Autenticación
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
      // Cargar cuentas sociales conectadas
      const accountsRes = await fetch('/api/admin/community-manager/accounts');
      if (accountsRes.ok) {
        const data = await accountsRes.json();
        setAccounts(data.accounts || []);
      }

      // Cargar posts programados
      const postsRes = await fetch('/api/admin/community-manager/posts');
      if (postsRes.ok) {
        const data = await postsRes.json();
        setScheduledPosts(data.posts || []);
      }

      // Cargar posts del blog
      const blogRes = await fetch('/api/admin/community-manager/blog');
      if (blogRes.ok) {
        const data = await blogRes.json();
        setBlogPosts(data.posts || []);
      }

      // Cargar configuración
      const configRes = await fetch('/api/admin/community-manager/config');
      if (configRes.ok) {
        const data = await configRes.json();
        if (data.config) {
          setConfig(data.config);
        }
      }
    } catch (error) {
      console.error('Error loading community manager data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generar contenido con IA
  const generateContent = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/admin/community-manager/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'social_post',
          style: config.contentStyle,
          platforms: newPostPlatforms,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setNewPostContent(data.content || '');
        toast.success('Contenido generado con IA');
      } else {
        toast.error('Error al generar contenido');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsGenerating(false);
    }
  };

  // Publicar post
  const publishPost = async (draft = false) => {
    if (!newPostContent.trim()) {
      toast.error('El contenido no puede estar vacío');
      return;
    }
    
    if (newPostPlatforms.length === 0) {
      toast.error('Selecciona al menos una plataforma');
      return;
    }

    try {
      const res = await fetch('/api/admin/community-manager/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newPostContent,
          platforms: newPostPlatforms,
          status: draft ? 'draft' : 'scheduled',
          scheduledDate: addDays(new Date(), 1).toISOString(),
        }),
      });
      
      if (res.ok) {
        toast.success(draft ? 'Borrador guardado' : 'Post programado');
        setShowCreatePostDialog(false);
        setNewPostContent('');
        setNewPostPlatforms([]);
        loadData();
      } else {
        toast.error('Error al guardar');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  // Guardar configuración
  const saveConfig = async () => {
    try {
      const res = await fetch('/api/admin/community-manager/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      
      if (res.ok) {
        toast.success('Configuración guardada');
        setShowConfigDialog(false);
      } else {
        toast.error('Error al guardar configuración');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  // Estadísticas calculadas
  const stats = {
    totalAccounts: accounts.length,
    connectedAccounts: accounts.filter(a => a.connected).length,
    totalFollowers: accounts.reduce((sum, a) => sum + (a.followers || 0), 0),
    scheduledPosts: scheduledPosts.filter(p => p.status === 'scheduled').length,
    publishedPosts: scheduledPosts.filter(p => p.status === 'published').length,
    blogDrafts: blogPosts.filter(p => p.status === 'draft').length,
    blogPublished: blogPosts.filter(p => p.status === 'published').length,
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
          <CMSkeleton />
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
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-pink-500 flex items-center justify-center">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">Community Manager IA</h1>
                <Badge variant="outline" className={config.autoPost ? 'bg-green-50 text-green-700 border-green-200' : ''}>
                  {config.autoPost ? '🤖 Automático' : '✋ Manual'}
                </Badge>
              </div>
              <p className="text-muted-foreground">Gestión inteligente de redes sociales y blog</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button variant="outline" onClick={() => setShowConfigDialog(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </Button>
            <Button 
              className="bg-gradient-to-r from-fuchsia-500 to-purple-500"
              onClick={() => setShowCreatePostDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Publicación
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cuentas Conectadas</p>
                  <p className="text-2xl font-bold">{stats.connectedAccounts}/{stats.totalAccounts}</p>
                </div>
                <Users className="h-8 w-8 text-fuchsia-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Seguidores Total</p>
                  <p className="text-2xl font-bold">
                    {stats.totalFollowers > 0 ? stats.totalFollowers.toLocaleString() : '-'}
                  </p>
                </div>
                <Heart className="h-8 w-8 text-pink-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Posts Programados</p>
                  <p className="text-2xl font-bold">{stats.scheduledPosts}</p>
                </div>
                <CalendarIcon className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Blog Posts</p>
                  <p className="text-2xl font-bold">{stats.blogPublished}</p>
                </div>
                <Newspaper className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden md:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden md:inline">Redes</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span className="hidden md:inline">Calendario</span>
            </TabsTrigger>
            <TabsTrigger value="blog" className="gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden md:inline">Blog</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {accounts.length > 0 || scheduledPosts.length > 0 ? (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Cuentas Conectadas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-fuchsia-500" />
                      Cuentas de Redes Sociales
                    </CardTitle>
                    <CardDescription>Estado de las conexiones</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {accounts.length > 0 ? (
                      <div className="space-y-4">
                        {accounts.map((account) => {
                          const Icon = platformIcons[account.platform];
                          return (
                            <div key={account.id} className="flex items-center justify-between p-3 rounded-lg border">
                              <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${platformColors[account.platform]} flex items-center justify-center`}>
                                  <Icon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <p className="font-medium">{account.name}</p>
                                  <p className="text-sm text-muted-foreground">@{account.username}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant={account.connected ? 'default' : 'secondary'} className={account.connected ? 'bg-green-500' : ''}>
                                  {account.connected ? '✓ Conectado' : 'Desconectado'}
                                </Badge>
                                {account.followers > 0 && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {account.followers.toLocaleString()} seguidores
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">No hay cuentas conectadas</p>
                        <Button variant="outline" className="mt-4" onClick={() => setActiveTab('social')}>
                          Conectar Cuentas
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Posts Recientes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-blue-500" />
                      Publicaciones Programadas
                    </CardTitle>
                    <CardDescription>Próximas publicaciones</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {scheduledPosts.length > 0 ? (
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-4">
                          {scheduledPosts
                            .filter(p => p.status === 'scheduled')
                            .slice(0, 5)
                            .map((post) => (
                              <div key={post.id} className="p-3 rounded-lg border">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex gap-1">
                                    {post.platforms.map(p => {
                                      const Icon = platformIcons[p];
                                      return Icon ? <Icon key={p} className="h-4 w-4 text-muted-foreground" /> : null;
                                    })}
                                  </div>
                                  <Badge variant="outline">
                                    {format(new Date(post.scheduledDate), 'dd/MM HH:mm')}
                                  </Badge>
                                </div>
                                <p className="text-sm line-clamp-2">{post.content}</p>
                              </div>
                            ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-8">
                        <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">No hay publicaciones programadas</p>
                        <Button className="mt-4" onClick={() => setShowCreatePostDialog(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Crear Primera Publicación
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <EmptyState 
                icon={Bot}
                title="Comienza a gestionar tus redes"
                description="Conecta tus cuentas de redes sociales para comenzar a programar publicaciones con ayuda de IA."
                actionLabel="Conectar Cuentas"
                onAction={() => setActiveTab('social')}
              />
            )}

            {/* Accesos Rápidos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  Acciones Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setShowCreatePostDialog(true)}>
                    <PenTool className="h-6 w-6 text-fuchsia-500" />
                    <span>Crear Post</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => router.push('/admin/canva')}>
                    <Palette className="h-6 w-6 text-purple-500" />
                    <span>Canva Studio</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setActiveTab('blog')}>
                    <Newspaper className="h-6 w-6 text-emerald-500" />
                    <span>Nuevo Artículo</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setActiveTab('calendar')}>
                    <CalendarIcon className="h-6 w-6 text-blue-500" />
                    <span>Ver Calendario</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Conectar Redes Sociales</CardTitle>
                    <CardDescription>Vincula tus cuentas para publicar automáticamente</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {['instagram', 'facebook', 'linkedin', 'twitter'].map((platform) => {
                    const Icon = platformIcons[platform];
                    const account = accounts.find(a => a.platform === platform);
                    const isConnected = account?.connected;
                    
                    return (
                      <div
                        key={platform}
                        className={`p-4 rounded-lg border ${isConnected ? 'bg-green-50 border-green-200' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${platformColors[platform]} flex items-center justify-center`}>
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold capitalize">{platform}</h4>
                              {account ? (
                                <p className="text-sm text-muted-foreground">@{account.username}</p>
                              ) : (
                                <p className="text-sm text-muted-foreground">No conectado</p>
                              )}
                            </div>
                          </div>
                          <Badge variant={isConnected ? 'default' : 'secondary'} className={isConnected ? 'bg-green-500' : ''}>
                            {isConnected ? '✓ Conectado' : 'Sin conectar'}
                          </Badge>
                        </div>
                        {isConnected && account ? (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              {account.followers.toLocaleString()} seguidores
                            </span>
                            <Button variant="outline" size="sm">
                              Desconectar
                            </Button>
                          </div>
                        ) : (
                          <Button className="w-full" variant="outline">
                            <Link2 className="h-4 w-4 mr-2" />
                            Conectar {platform.charAt(0).toUpperCase() + platform.slice(1)}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6">
            {scheduledPosts.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-blue-500" />
                    Calendario de Publicaciones
                  </CardTitle>
                  <CardDescription>Vista de todas las publicaciones programadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {scheduledPosts
                        .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
                        .map((post) => (
                          <div key={post.id} className="flex gap-4 p-4 rounded-lg border">
                            <div className="text-center min-w-16 p-2 bg-muted rounded-lg">
                              <p className="text-2xl font-bold">{format(new Date(post.scheduledDate), 'dd')}</p>
                              <p className="text-xs text-muted-foreground uppercase">
                                {format(new Date(post.scheduledDate), 'MMM', { locale: es })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(post.scheduledDate), 'HH:mm')}
                              </p>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {post.platforms.map(p => {
                                  const Icon = platformIcons[p];
                                  return Icon ? <Icon key={p} className="h-4 w-4" /> : null;
                                })}
                                <Badge variant={
                                  post.status === 'published' ? 'default' : 
                                  post.status === 'scheduled' ? 'outline' : 
                                  post.status === 'failed' ? 'destructive' : 'secondary'
                                }>
                                  {post.status === 'published' ? '✓ Publicado' : 
                                   post.status === 'scheduled' ? '⏰ Programado' : 
                                   post.status === 'failed' ? '✗ Error' : '📝 Borrador'}
                                </Badge>
                              </div>
                              <p className="text-sm line-clamp-2">{post.content}</p>
                              {post.engagement && (
                                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Heart className="h-3 w-3" /> {post.engagement.likes}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MessageCircle className="h-3 w-3" /> {post.engagement.comments}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Share2 className="h-3 w-3" /> {post.engagement.shares}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <EmptyState 
                icon={CalendarIcon}
                title="Sin publicaciones programadas"
                description="Crea tu primera publicación para verla en el calendario."
                actionLabel="Crear Publicación"
                onAction={() => setShowCreatePostDialog(true)}
              />
            )}
          </TabsContent>

          {/* Blog Tab */}
          <TabsContent value="blog" className="space-y-6">
            {blogPosts.length > 0 ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Newspaper className="h-5 w-5 text-emerald-500" />
                        Gestión del Blog
                      </CardTitle>
                      <CardDescription>Artículos y contenido del blog de Inmova</CardDescription>
                    </div>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Artículo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {blogPosts.map((post) => (
                      <div key={post.id} className="p-4 rounded-lg border">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{post.category}</Badge>
                              <Badge variant={
                                post.status === 'published' ? 'default' : 
                                post.status === 'scheduled' ? 'outline' : 'secondary'
                              }>
                                {post.status === 'published' ? '✓ Publicado' : 
                                 post.status === 'scheduled' ? '⏰ Programado' : '📝 Borrador'}
                              </Badge>
                            </div>
                            <h4 className="font-semibold">{post.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                            {post.views !== undefined && post.views > 0 && (
                              <p className="text-xs text-muted-foreground mt-2">
                                <Eye className="h-3 w-3 inline mr-1" />
                                {post.views.toLocaleString()} visitas
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <EmptyState 
                icon={Newspaper}
                title="Sin artículos de blog"
                description="Crea tu primer artículo para el blog de Inmova."
                actionLabel="Crear Artículo"
                onAction={() => toast.info('Funcionalidad en desarrollo')}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Dialog: Crear Post */}
        <Dialog open={showCreatePostDialog} onOpenChange={setShowCreatePostDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PenTool className="h-5 w-5 text-fuchsia-500" />
                Crear Nueva Publicación
              </DialogTitle>
              <DialogDescription>
                Crea contenido para tus redes sociales con ayuda de IA
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Plataformas */}
              <div className="space-y-2">
                <Label>Plataformas</Label>
                <div className="flex gap-2">
                  {['instagram', 'facebook', 'linkedin', 'twitter'].map((platform) => {
                    const Icon = platformIcons[platform];
                    const isSelected = newPostPlatforms.includes(platform);
                    return (
                      <Button
                        key={platform}
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          if (isSelected) {
                            setNewPostPlatforms(prev => prev.filter(p => p !== platform));
                          } else {
                            setNewPostPlatforms(prev => [...prev, platform]);
                          }
                        }}
                      >
                        <Icon className="h-4 w-4 mr-1" />
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Contenido */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Contenido</Label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={generateContent}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generar con IA
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  placeholder="Escribe tu publicación aquí o genera contenido con IA..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  rows={6}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {newPostContent.length}/2200 caracteres
                </p>
              </div>

              {/* Vista previa */}
              {newPostContent && (
                <div className="space-y-2">
                  <Label>Vista Previa</Label>
                  <div className="p-4 rounded-lg border bg-muted/50">
                    <div className="flex gap-2 mb-2">
                      {newPostPlatforms.map(p => {
                        const Icon = platformIcons[p];
                        return Icon ? <Icon key={p} className="h-4 w-4" /> : null;
                      })}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{newPostContent}</p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => publishPost(true)}>
                Guardar Borrador
              </Button>
              <Button 
                className="bg-gradient-to-r from-fuchsia-500 to-purple-500"
                onClick={() => publishPost(false)}
              >
                <Send className="h-4 w-4 mr-2" />
                Programar Publicación
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Configuración */}
        <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración del Community Manager
              </DialogTitle>
              <DialogDescription>
                Ajusta el comportamiento del agente de IA
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Publicación Automática</Label>
                  <p className="text-xs text-muted-foreground">
                    El agente publicará contenido automáticamente
                  </p>
                </div>
                <Switch 
                  checked={config.autoPost}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, autoPost: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Frecuencia de Publicación</Label>
                <Select 
                  value={config.postFrequency}
                  onValueChange={(v: 'daily' | 'weekly' | 'custom') => setConfig(prev => ({ ...prev, postFrequency: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diaria (1 post/día)</SelectItem>
                    <SelectItem value="weekly">Semanal (3 posts/semana)</SelectItem>
                    <SelectItem value="custom">Personalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.postFrequency === 'custom' && (
                <div className="space-y-2">
                  <Label>Posts por semana: {config.customDaysPerWeek}</Label>
                  <Slider
                    value={[config.customDaysPerWeek]}
                    onValueChange={([v]) => setConfig(prev => ({ ...prev, customDaysPerWeek: v }))}
                    min={1}
                    max={7}
                    step={1}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Mejor Hora para Publicar</Label>
                <Input
                  type="time"
                  value={config.bestTimeToPost}
                  onChange={(e) => setConfig(prev => ({ ...prev, bestTimeToPost: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Estilo de Contenido</Label>
                <Select 
                  value={config.contentStyle}
                  onValueChange={(v: 'professional' | 'casual' | 'mixed') => setConfig(prev => ({ ...prev, contentStyle: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Profesional</SelectItem>
                    <SelectItem value="casual">Casual/Cercano</SelectItem>
                    <SelectItem value="mixed">Mixto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estrategia de Hashtags</Label>
                <Select 
                  value={config.hashtagStrategy}
                  onValueChange={(v: 'auto' | 'manual' | 'mixed') => setConfig(prev => ({ ...prev, hashtagStrategy: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automático (IA sugiere)</SelectItem>
                    <SelectItem value="manual">Manual (tú eliges)</SelectItem>
                    <SelectItem value="mixed">Mixto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                Cancelar
              </Button>
              <Button 
                className="bg-gradient-to-r from-fuchsia-500 to-purple-500"
                onClick={saveConfig}
              >
                Guardar Configuración
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
