'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle,
  Settings,
  RefreshCw,
  ExternalLink,
  Facebook,
  Instagram,
  Linkedin,
  Twitter
} from 'lucide-react';
import Link from 'next/link';

export default function SocialPlataformaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

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

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  const socialNetworks = [
    {
      id: 'facebook',
      name: 'Facebook / Meta',
      icon: Facebook,
      color: 'from-blue-600 to-blue-700',
      connected: true,
      followers: '2,340',
      posts: 45,
      engagement: '3.2%'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'from-pink-500 to-purple-600',
      connected: true,
      followers: '5,890',
      posts: 89,
      engagement: '4.8%'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'from-blue-700 to-blue-800',
      connected: true,
      followers: '1,234',
      posts: 23,
      engagement: '2.1%'
    },
    {
      id: 'twitter',
      name: 'X (Twitter)',
      icon: Twitter,
      color: 'from-gray-800 to-black',
      connected: false,
      followers: '890',
      posts: 0,
      engagement: '0%'
    },
  ];

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/integraciones-plataforma" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Integraciones Plataforma
        </Link>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <Instagram className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Redes Sociales</h1>
            <p className="text-muted-foreground">Facebook, Instagram, LinkedIn y X para marketing de Inmova</p>
          </div>
        </div>
      </div>

      {/* Resumen Global */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Resumen de Redes Sociales</CardTitle>
          <CardDescription>Métricas agregadas de todas las redes conectadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Total Seguidores</p>
              <p className="text-2xl font-bold">10,354</p>
              <p className="text-xs text-green-500">+234 este mes</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Publicaciones</p>
              <p className="text-2xl font-bold">157</p>
              <p className="text-xs text-muted-foreground">Último mes</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Engagement Medio</p>
              <p className="text-2xl font-bold">3.4%</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Alcance</p>
              <p className="text-2xl font-bold">45,230</p>
              <p className="text-xs text-muted-foreground">Última semana</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Redes Individuales */}
      <div className="grid gap-6 md:grid-cols-2">
        {socialNetworks.map((network) => (
          <Card key={network.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${network.color} flex items-center justify-center`}>
                    <network.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{network.name}</CardTitle>
                  </div>
                </div>
                <Badge variant={network.connected ? "default" : "secondary"}>
                  {network.connected ? (
                    <><CheckCircle2 className="h-3 w-3 mr-1" /> Conectado</>
                  ) : (
                    <><XCircle className="h-3 w-3 mr-1" /> Desconectado</>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="p-2 bg-muted rounded">
                  <p className="text-lg font-bold">{network.followers}</p>
                  <p className="text-xs text-muted-foreground">Seguidores</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="text-lg font-bold">{network.posts}</p>
                  <p className="text-xs text-muted-foreground">Posts</p>
                </div>
                <div className="p-2 bg-muted rounded">
                  <p className="text-lg font-bold">{network.engagement}</p>
                  <p className="text-xs text-muted-foreground">Engagement</p>
                </div>
              </div>
              <div className="flex gap-2">
                {network.connected ? (
                  <>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Settings className="h-4 w-4 mr-1" />
                      Configurar
                    </Button>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button size="sm" className="w-full">
                    Conectar Cuenta
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Automatización */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Automatización de Publicaciones</CardTitle>
          <CardDescription>Configurar publicación automática de propiedades</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Auto-publicar nuevas propiedades</p>
              <p className="text-sm text-muted-foreground">Publicar automáticamente cuando se cree una propiedad</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Incluir imágenes</p>
              <p className="text-sm text-muted-foreground">Adjuntar fotos de la propiedad</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Hashtags automáticos</p>
              <p className="text-sm text-muted-foreground">Generar hashtags basados en ubicación y tipo</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
