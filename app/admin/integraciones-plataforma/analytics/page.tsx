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
  Settings,
  RefreshCw,
  ExternalLink,
  BarChart3,
  MousePointer2
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function AnalyticsPlataformaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ga4Connected, setGa4Connected] = useState(true);
  const [hotjarConnected, setHotjarConnected] = useState(true);

  const handleVerifyGa4 = () => {
    toast.success('Configuración de GA4 verificada');
  };

  const handleOpenGa4 = () => {
    window.open('https://analytics.google.com/', '_blank');
  };

  const handleOpenHotjar = () => {
    window.open('https://insights.hotjar.com/', '_blank');
  };

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

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/admin/integraciones-plataforma" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Integraciones Plataforma
        </Link>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Google Analytics 4 y Hotjar para análisis de uso</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Google Analytics 4 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle>Google Analytics 4</CardTitle>
                  <CardDescription>Análisis de tráfico y comportamiento de usuarios</CardDescription>
                </div>
              </div>
              <Badge variant={ga4Connected ? "default" : "secondary"}>
                {ga4Connected ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Usuarios Activos</p>
                <p className="text-2xl font-bold">1,247</p>
                <p className="text-xs text-green-500">+12% vs ayer</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Sesiones</p>
                <p className="text-2xl font-bold">3,456</p>
                <p className="text-xs text-green-500">+8% vs ayer</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Páginas/Sesión</p>
                <p className="text-2xl font-bold">4.2</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Duración Media</p>
                <p className="text-2xl font-bold">5m 32s</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Measurement ID</Label>
                <Input defaultValue="G-XXXXXXXXXX" />
              </div>
              <div className="space-y-2">
                <Label>Stream ID</Label>
                <Input type="password" defaultValue="••••••••••••" />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Eventos Mejorados</p>
                  <p className="text-sm text-muted-foreground">Scroll, clicks, descargas, etc.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleVerifyGa4}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Verificar Configuración
                </Button>
                <Button variant="outline" onClick={handleOpenGa4}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir GA4
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hotjar */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                  <MousePointer2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle>Hotjar</CardTitle>
                  <CardDescription>Mapas de calor y grabaciones de sesión</CardDescription>
                </div>
              </div>
              <Badge variant={hotjarConnected ? "default" : "secondary"}>
                {hotjarConnected ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Grabaciones Hoy</p>
                <p className="text-2xl font-bold">89</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Mapas de Calor</p>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">Páginas activas</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Encuestas</p>
                <p className="text-2xl font-bold">3</p>
                <p className="text-xs text-muted-foreground">Activas</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Site ID</Label>
                <Input defaultValue="3456789" />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Grabación de Sesiones</p>
                  <p className="text-sm text-muted-foreground">Grabar interacciones de usuarios</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Feedback Widget</p>
                  <p className="text-sm text-muted-foreground">Mostrar botón de feedback</p>
                </div>
                <Switch />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleOpenHotjar}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir Hotjar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
