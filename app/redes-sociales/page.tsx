'use client';
export const dynamic = 'force-dynamic';


import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/lazy-tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/lazy-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { 
  Share2, Plus, Calendar, TrendingUp, Users, Eye,
  Facebook, Twitter, Linkedin, Instagram, MessageCircle,
  MoreVertical, Trash2, Edit, Send, Image as ImageIcon, Clock, CheckCircle, AlertCircle, ArrowLeft, Home
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { logger, logError } from '@/lib/logger';


interface SocialMediaAccount {
  id: string;
  platform: string;
  accountName: string;
  activo: boolean;
}

interface SocialMediaPost {
  id: string;
  accountId: string;
  mensaje: string;
  imagenesUrls?: string[];
  videoUrl?: string;
  enlace?: string;
  estado: 'borrador' | 'programado' | 'publicado' | 'error';
  fechaProgramada?: string;
  fechaPublicacion?: string;
  alcance?: number;
  likes?: number;
  comentarios?: number;
  compartidos?: number;
  account: SocialMediaAccount;
  createdAt: string;
}

interface Stats {
  totalPosts: number;
  publishedPosts: number;
  scheduledPosts: number;
  connectedAccounts: number;
  totalAlcance: number;
  totalLikes: number;
}

const platformIcons: Record<string, any> = {
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  instagram: Instagram,
  whatsapp: MessageCircle
};

export default function RedesSocialesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [accounts, setAccounts] = useState<SocialMediaAccount[]>([]);
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  
  // Form state
  const [formData, setFormData] = useState({
    accountId: '',
    mensaje: '',
    scheduledFor: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadData();
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsRes, postsRes, statsRes] = await Promise.all([
        fetch('/api/social-media/accounts'),
        fetch('/api/social-media/posts'),
        fetch('/api/social-media/posts?stats=true')
      ]);

      if (accountsRes.ok) {
        const data = await accountsRes.json();
        setAccounts(data);
      }

      if (postsRes.ok) {
        const data = await postsRes.json();
        setPosts(data);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (error) {
      logError(new Error(error instanceof Error ? error.message : 'Error cargando datos'), {
        context: 'RedesSocialesPage'
      });
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!formData.accountId || !formData.mensaje) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    try {
      const res = await fetch('/api/social-media/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: formData.accountId,
          content: {
            mensaje: formData.mensaje
          },
          scheduledFor: formData.scheduledFor || undefined
        })
      });

      if (res.ok) {
        toast.success('Post creado exitosamente');
        setShowNewPostDialog(false);
        setFormData({ accountId: '', mensaje: '', scheduledFor: '' });
        loadData();
      } else {
        toast.error('Error al crear el post');
      }
    } catch (error) {
      logError(new Error(error instanceof Error ? error.message : 'Error creando post'), {
        context: 'handleCreatePost'
      });
      toast.error('Error al crear el post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('¿Estás seguro de eliminar este post?')) return;

    try {
      const res = await fetch(`/api/social-media/posts/${postId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success('Post eliminado');
        loadData();
      } else {
        toast.error('Error al eliminar el post');
      }
    } catch (error) {
      logError(new Error(error instanceof Error ? error.message : 'Error eliminando post'), {
        context: 'handleDeletePost'
      });
      toast.error('Error al eliminar el post');
    }
  };

  const handleConnectAccount = () => {
    toast.info('Para conectar una cuenta, configura las credenciales de API en las variables de entorno. Consulta la documentación.');
  };

  const getStatusBadge = (estado: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      borrador: { variant: 'outline', label: 'Borrador' },
      programado: { variant: 'default', label: 'Programado' },
      publicado: { variant: 'success' as any, label: 'Publicado' },
      error: { variant: 'destructive', label: 'Error' },
    };

    const config = variants[estado] || variants.borrador;
    return (
      <Badge variant={config.variant} className={estado === 'publicado' ? 'bg-green-500' : ''}>
        {config.label}
      </Badge>
    );
  };

  const filteredPosts = posts.filter(post => {
    if (activeTab === 'scheduled') return post.estado === 'programado';
    if (activeTab === 'published') return post.estado === 'publicado';
    return true;
  });

  if (loading) {
    return <LoadingState fullScreen message="Cargando redes sociales..." />;
  }

  return (
    <div className="flex min-h-screen bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Breadcrumb */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Redes Sociales</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold gradient-text">Redes Sociales</h1>
                <p className="text-muted-foreground mt-1">
                  Gestiona y automatiza tus publicaciones en redes sociales
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleConnectAccount}>
                  <Plus className="h-4 w-4 mr-2" />
                  Conectar Cuenta
                </Button>
                <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
                  <DialogTrigger asChild>
                    <Button className="gradient-primary">
                      <Send className="h-4 w-4 mr-2" />
                      Nuevo Post
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Crear Nueva Publicación</DialogTitle>
                      <DialogDescription>
                        Crea o programa una nueva publicación en redes sociales
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="account">Cuenta *</Label>
                        <Select
                          value={formData.accountId}
                          onValueChange={(value) => setFormData({ ...formData, accountId: value })}
                        >
                          <SelectTrigger id="account">
                            <SelectValue placeholder="Selecciona una cuenta" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map((account) => {
                              const Icon = platformIcons[account.platform.toLowerCase()] || Share2;
                              return (
                                <SelectItem key={account.id} value={account.id}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    {account.accountName}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="mensaje">Mensaje *</Label>
                        <Textarea
                          id="mensaje"
                          value={formData.mensaje}
                          onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                          placeholder="Escribe tu mensaje aquí..."
                          rows={6}
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          {formData.mensaje.length} caracteres
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="scheduledFor">Programar para (opcional)</Label>
                        <Input
                          id="scheduledFor"
                          type="datetime-local"
                          value={formData.scheduledFor}
                          onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                          min={new Date().toISOString().slice(0, 16)}
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowNewPostDialog(false)}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleCreatePost} className="gradient-primary">
                          {formData.scheduledFor ? 'Programar' : 'Publicar'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Stats */}
            {stats && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Posts Totales</CardTitle>
                    <Send className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalPosts}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.publishedPosts} publicados
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cuentas Conectadas</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.connectedAccounts}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.scheduledPosts} posts programados
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Alcance Total</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.totalAlcance.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Impresiones acumuladas
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.totalLikes.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total de likes
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Posts List */}
            <Card>
              <CardHeader>
                <CardTitle>Publicaciones</CardTitle>
                <CardDescription>
                  Administra tus posts programados y publicados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="posts">Todos</TabsTrigger>
                    <TabsTrigger value="scheduled">Programados</TabsTrigger>
                    <TabsTrigger value="published">Publicados</TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeTab} className="space-y-4 mt-4">
                    {filteredPosts.length === 0 ? (
                      <EmptyState
                        icon={<Send className="h-12 w-12" aria-hidden="true" />}
                        title="No hay publicaciones"
                        description={`No hay posts ${activeTab === 'scheduled' ? 'programados' : activeTab === 'published' ? 'publicados' : 'disponibles'}`}
                        actions={[
                          {
                            label: 'Crear Post',
                            onClick: () => setShowNewPostDialog(true),
                            icon: <Plus className="h-4 w-4" aria-hidden="true" />
                          }
                        ]}
                      />
                    ) : (
                      filteredPosts.map((post) => {
                        const Icon = platformIcons[post.account.platform.toLowerCase()] || Share2;
                        return (
                          <Card key={post.id}>
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4 flex-1">
                                  <div className="flex-shrink-0">
                                    <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center">
                                      <Icon className="h-5 w-5 text-white" />
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <p className="text-sm font-medium text-muted-foreground">
                                        {post.account.accountName}
                                      </p>
                                      {getStatusBadge(post.estado)}
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap mb-2">
                                      {post.mensaje}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                      {post.estado === 'programado' && post.fechaProgramada && (
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {format(new Date(post.fechaProgramada), "d 'de' MMMM, HH:mm", { locale: es })}
                                        </span>
                                      )}
                                      {post.estado === 'publicado' && post.fechaPublicacion && (
                                        <>
                                          <span className="flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3" />
                                            {format(new Date(post.fechaPublicacion), "d 'de' MMMM", { locale: es })}
                                          </span>
                                          {post.alcance !== undefined && (
                                            <span className="flex items-center gap-1">
                                              <Eye className="h-3 w-3" />
                                              {post.alcance} alcance
                                            </span>
                                          )}
                                          {post.likes !== undefined && (
                                            <span>❤️ {post.likes}</span>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleDeletePost(post.id)}>
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Eliminar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Connected Accounts */}
            {accounts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Cuentas Conectadas</CardTitle>
                  <CardDescription>
                    Plataformas de redes sociales configuradas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {accounts.map((account) => {
                      const Icon = platformIcons[account.platform.toLowerCase()] || Share2;
                      return (
                        <Card key={account.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center">
                                  <Icon className="h-5 w-5 text-white" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{account.accountName}</p>
                                <p className="text-sm text-muted-foreground capitalize">
                                  {account.platform}
                                </p>
                              </div>
                              {account.activo && (
                                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
