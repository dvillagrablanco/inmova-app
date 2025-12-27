'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Share2,
  Plus,
  TrendingUp,
  Users,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  ArrowLeft,
  Home,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { logError } from '@/lib/logger';

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
  estado: 'borrador' | 'programado' | 'publicado' | 'error';
  fechaProgramada?: string;
  fechaPublicacion?: string;
  alcance?: number;
  likes?: number;
  account: SocialMediaAccount;
  createdAt: string;
}

interface Stats {
  totalPosts: number;
  publishedPosts: number;
  scheduledPosts: number;
  connectedAccounts: number;
  totalReach: number;
  totalEngagement: number;
}

export default function RedesSocialesPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<SocialMediaAccount[]>([]);
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsRes, postsRes, statsRes] = await Promise.all([
        fetch('/api/social-media/accounts'),
        fetch('/api/social-media/posts'),
        fetch('/api/social-media/stats'),
      ]);

      if (accountsRes.ok) setAccounts(await accountsRes.json());
      if (postsRes.ok) setPosts(await postsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Error loading social media data'), {
        context: 'loadData',
      });
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, any> = {
      facebook: Facebook,
      twitter: Twitter,
      linkedin: Linkedin,
      instagram: Instagram,
    };
    const Icon = icons[platform.toLowerCase()] || Share2;
    return <Icon className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <LoadingState message="Cargando redes sociales..." />
      </AuthenticatedLayout>
    );
  }

  if (!session) return null;

  return (
    <AuthenticatedLayout>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
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
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Redes Sociales</h1>
              <p className="text-muted-foreground">Gestiona tus publicaciones y cuentas</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => router.push('/redes-sociales/conectar')}>
                <Plus className="h-4 w-4 mr-2" />
                Conectar Cuenta
              </Button>
              <Button onClick={() => router.push('/redes-sociales/nuevo-post')}>
                <Share2 className="h-4 w-4 mr-2" />
                Nueva Publicación
              </Button>
            </div>
          </div>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Publicaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPosts}</div>
                  <p className="text-xs text-muted-foreground">totales</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Publicadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.publishedPosts}</div>
                  <p className="text-xs text-muted-foreground">activas</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Programadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.scheduledPosts}</div>
                  <p className="text-xs text-muted-foreground">pendientes</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Cuentas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.connectedAccounts}</div>
                  <p className="text-xs text-muted-foreground">conectadas</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Alcance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.totalReach.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">impresiones</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Interacciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.totalEngagement.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">totales</p>
                </CardContent>
              </Card>
            </div>
          )}

          {accounts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Share2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay cuentas conectadas</h3>
                <p className="text-muted-foreground mb-4">
                  Conecta tus cuentas de redes sociales para empezar
                </p>
                <Button onClick={() => router.push('/redes-sociales/conectar')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Conectar Primera Cuenta
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Cuentas Conectadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accounts.map((account) => (
                    <Card key={account.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getPlatformIcon(account.platform)}
                            <div>
                              <p className="font-medium">{account.accountName}</p>
                              <p className="text-sm text-muted-foreground">{account.platform}</p>
                            </div>
                          </div>
                          <Badge variant={account.activo ? 'default' : 'secondary'}>
                            {account.activo ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {posts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Publicaciones Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {posts.slice(0, 5).map((post) => (
                    <div key={post.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(post.account.platform)}
                          <span className="font-medium">{post.account.accountName}</span>
                        </div>
                        <Badge variant={post.estado === 'publicado' ? 'default' : 'secondary'}>
                          {post.estado}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">{post.mensaje}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {post.fechaPublicacion && (
                          <span>
                            Publicado: {format(new Date(post.fechaPublicacion), 'dd MMM yyyy HH:mm', { locale: es })}
                          </span>
                        )}
                        {post.alcance && <span>Alcance: {post.alcance.toLocaleString()}</span>}
                        {post.likes && <span>Likes: {post.likes.toLocaleString()}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </AuthenticatedLayout>
  );
}
