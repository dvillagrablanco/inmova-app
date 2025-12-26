'use client';

/**
 * SOCIAL MEDIA DASHBOARD - POMELLI INTEGRATION
 * Dashboard completo para gestión de redes sociales
 * - Conectar/desconectar perfiles (LinkedIn, Instagram, X)
 * - Crear y programar publicaciones
 * - Ver analytics consolidados
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Linkedin,
  Instagram,
  Twitter,
  BarChart3,
  Calendar,
  Image as ImageIcon,
  Send,
  Clock,
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Plus,
  Loader2,
} from 'lucide-react';

interface SocialProfile {
  id: string;
  platform: string;
  profileName: string;
  profileUsername: string;
  profileImageUrl?: string;
  isConnected: boolean;
  isActive: boolean;
  followersCount: number;
  lastSyncAt: string;
}

interface SocialPost {
  id: string;
  content: string;
  platforms: string[];
  status: string;
  scheduledAt?: string;
  publishedAt?: string;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
}

interface Analytics {
  totals: {
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
    postsCount: number;
    avgEngagementRate: number;
  };
  byPlatform: Record<string, any>;
  profiles: SocialProfile[];
}

export default function SocialMediaDashboard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [configured, setConfigured] = useState(false);

  // Formulario de nueva publicación
  const [newPost, setNewPost] = useState({
    content: '',
    platforms: [] as string[],
    mediaUrls: [] as string[],
    scheduledAt: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar configuración y perfiles
      const configRes = await fetch('/api/pomelli/config');
      const configData = await configRes.json();

      setConfigured(configData.configured);
      setProfiles(configData.profiles || []);

      if (configData.configured) {
        // Cargar publicaciones
        const postsRes = await fetch('/api/pomelli/posts?limit=20');
        const postsData = await postsRes.json();
        setPosts(postsData.posts || []);

        // Cargar analytics
        const analyticsRes = await fetch('/api/pomelli/analytics');
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectPlatform = async (platform: string) => {
    try {
      const res = await fetch('/api/pomelli/profiles/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });

      const data = await res.json();

      if (data.authUrl) {
        // Abrir ventana de autorización
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error connecting platform:', error);
    }
  };

  const createPost = async () => {
    try {
      setCreating(true);

      const res = await fetch('/api/pomelli/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPost,
          publishNow: !newPost.scheduledAt,
        }),
      });

      if (res.ok) {
        setNewPost({
          content: '',
          platforms: [],
          mediaUrls: [],
          scheduledAt: '',
        });
        loadData();
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setCreating(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin':
        return <Linkedin className="h-5 w-5 text-blue-600" />;
      case 'instagram':
        return <Instagram className="h-5 w-5 text-pink-600" />;
      case 'x':
        return <Twitter className="h-5 w-5 text-black" />;
      default:
        return null;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'linkedin':
        return 'bg-blue-100 text-blue-800';
      case 'instagram':
        return 'bg-pink-100 text-pink-800';
      case 'x':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            Pomelli no está configurado. Por favor, configura tus credenciales de API primero.
          </AlertDescription>
        </Alert>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Configurar Pomelli</CardTitle>
            <CardDescription>
              Ingresa tus credenciales de API de Pomelli para comenzar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>API Key</Label>
                <Input placeholder="Tu API Key de Pomelli" />
              </div>
              <div>
                <Label>API Secret</Label>
                <Input type="password" placeholder="Tu API Secret de Pomelli" />
              </div>
              <Button>Guardar Configuración</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Redes Sociales</h1>
          <p className="text-gray-600 mt-1">Gestiona LinkedIn, Instagram y X desde un solo lugar</p>
        </div>
        <Button onClick={() => loadData()}>
          <BarChart3 className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Impresiones</p>
                  <p className="text-2xl font-bold">
                    {analytics.totals.impressions.toLocaleString()}
                  </p>
                </div>
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Me Gusta</p>
                  <p className="text-2xl font-bold">{analytics.totals.likes.toLocaleString()}</p>
                </div>
                <Heart className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Comentarios</p>
                  <p className="text-2xl font-bold">{analytics.totals.comments.toLocaleString()}</p>
                </div>
                <MessageCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Engagement</p>
                  <p className="text-2xl font-bold">
                    {analytics.totals.avgEngagementRate.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="profiles" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profiles">Perfiles</TabsTrigger>
          <TabsTrigger value="create">Nueva Publicación</TabsTrigger>
          <TabsTrigger value="posts">Publicaciones</TabsTrigger>
        </TabsList>

        {/* TAB: Perfiles Conectados */}
        <TabsContent value="profiles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Perfiles Conectados</CardTitle>
              <CardDescription>Conecta y gestiona tus perfiles de redes sociales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* LinkedIn */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Linkedin className="h-10 w-10 text-blue-600" />
                      {profiles.some((p) => p.platform === 'linkedin' && p.isConnected) ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <h3 className="font-semibold text-lg">LinkedIn</h3>
                    {profiles.find((p) => p.platform === 'linkedin') ? (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">
                          @{profiles.find((p) => p.platform === 'linkedin')?.profileUsername}
                        </p>
                        <p className="text-xs text-gray-500">
                          {profiles.find((p) => p.platform === 'linkedin')?.followersCount}{' '}
                          seguidores
                        </p>
                      </div>
                    ) : (
                      <Button className="mt-4 w-full" onClick={() => connectPlatform('linkedin')}>
                        Conectar LinkedIn
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Instagram */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Instagram className="h-10 w-10 text-pink-600" />
                      {profiles.some((p) => p.platform === 'instagram' && p.isConnected) ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <h3 className="font-semibold text-lg">Instagram</h3>
                    {profiles.find((p) => p.platform === 'instagram') ? (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">
                          @{profiles.find((p) => p.platform === 'instagram')?.profileUsername}
                        </p>
                        <p className="text-xs text-gray-500">
                          {profiles.find((p) => p.platform === 'instagram')?.followersCount}{' '}
                          seguidores
                        </p>
                      </div>
                    ) : (
                      <Button className="mt-4 w-full" onClick={() => connectPlatform('instagram')}>
                        Conectar Instagram
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* X (Twitter) */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Twitter className="h-10 w-10" />
                      {profiles.some((p) => p.platform === 'x' && p.isConnected) ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <h3 className="font-semibold text-lg">X (Twitter)</h3>
                    {profiles.find((p) => p.platform === 'x') ? (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">
                          @{profiles.find((p) => p.platform === 'x')?.profileUsername}
                        </p>
                        <p className="text-xs text-gray-500">
                          {profiles.find((p) => p.platform === 'x')?.followersCount} seguidores
                        </p>
                      </div>
                    ) : (
                      <Button className="mt-4 w-full" onClick={() => connectPlatform('x')}>
                        Conectar X
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Crear Publicación */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nueva Publicación</CardTitle>
              <CardDescription>Crea una publicación para múltiples redes sociales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Contenido</Label>
                <Textarea
                  placeholder="Escribe tu publicación aquí..."
                  rows={6}
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">{newPost.content.length} caracteres</p>
              </div>

              <div>
                <Label className="mb-3 block">Plataformas</Label>
                <div className="space-y-2">
                  {profiles
                    .filter((p) => p.isConnected)
                    .map((profile) => (
                      <div key={profile.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={profile.platform}
                          checked={newPost.platforms.includes(profile.platform)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewPost({
                                ...newPost,
                                platforms: [...newPost.platforms, profile.platform],
                              });
                            } else {
                              setNewPost({
                                ...newPost,
                                platforms: newPost.platforms.filter((p) => p !== profile.platform),
                              });
                            }
                          }}
                        />
                        <label
                          htmlFor={profile.platform}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          {getPlatformIcon(profile.platform)}
                          <span className="capitalize">{profile.platform}</span>
                          <span className="text-xs text-gray-500">
                            (@{profile.profileUsername})
                          </span>
                        </label>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <Label>Programar Publicación (Opcional)</Label>
                <Input
                  type="datetime-local"
                  value={newPost.scheduledAt}
                  onChange={(e) => setNewPost({ ...newPost, scheduledAt: e.target.value })}
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={createPost}
                  disabled={
                    creating || newPost.content.length === 0 || newPost.platforms.length === 0
                  }
                  className="flex-1"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : newPost.scheduledAt ? (
                    <Clock className="h-4 w-4 mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {newPost.scheduledAt ? 'Programar' : 'Publicar Ahora'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    setNewPost({
                      content: '',
                      platforms: [],
                      mediaUrls: [],
                      scheduledAt: '',
                    })
                  }
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Publicaciones */}
        <TabsContent value="posts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Publicaciones</CardTitle>
              <CardDescription>Todas tus publicaciones en redes sociales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {post.platforms.map((platform) => (
                              <Badge key={platform} className={getPlatformColor(platform)}>
                                {platform}
                              </Badge>
                            ))}
                            <Badge className={getStatusColor(post.status)}>{post.status}</Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-3">
                            {post.content.substring(0, 200)}
                            {post.content.length > 200 && '...'}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Eye className="h-3 w-3 mr-1" />
                              {post.impressions}
                            </span>
                            <span className="flex items-center">
                              <Heart className="h-3 w-3 mr-1" />
                              {post.likes}
                            </span>
                            <span className="flex items-center">
                              <MessageCircle className="h-3 w-3 mr-1" />
                              {post.comments}
                            </span>
                            <span className="flex items-center">
                              <Share2 className="h-3 w-3 mr-1" />
                              {post.shares}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
