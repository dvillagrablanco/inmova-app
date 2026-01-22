'use client';

/**
 * Portal del Inquilino - Página Principal
 * 
 * Redirige automáticamente al dashboard del inquilino
 * Incluye navegación lateral para acceso a todas las funcionalidades
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import {
  Home,
  FileText,
  CreditCard,
  Wrench,
  MessageSquare,
  FolderOpen,
  Trophy,
  Users,
  Star,
  Bot,
  User,
  LogOut,
  ArrowRight,
  Sparkles,
  Bell,
  Calendar,
  Shield,
  Loader2,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';

// Menú de navegación del portal
const menuItems = [
  {
    title: 'Dashboard',
    description: 'Vista general de tu situación',
    href: '/portal-inquilino/dashboard',
    icon: Home,
    color: 'bg-blue-100 text-blue-600',
    featured: true,
  },
  {
    title: 'Mi Contrato',
    description: 'Información y documentos del contrato',
    href: '/portal-inquilino/contrato',
    icon: FileText,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    title: 'Pagos',
    description: 'Historial y gestión de pagos',
    href: '/portal-inquilino/pagos',
    icon: CreditCard,
    color: 'bg-green-100 text-green-600',
    badge: 'Stripe',
  },
  {
    title: 'Incidencias',
    description: 'Reportar y seguir problemas',
    href: '/portal-inquilino/incidencias',
    icon: Wrench,
    color: 'bg-orange-100 text-orange-600',
    badge: 'IA',
  },
  {
    title: 'Mantenimiento',
    description: 'Solicitudes de mantenimiento',
    href: '/portal-inquilino/mantenimiento',
    icon: Wrench,
    color: 'bg-amber-100 text-amber-600',
  },
  {
    title: 'Comunicación',
    description: 'Chat con propietario y gestor',
    href: '/portal-inquilino/comunicacion',
    icon: MessageSquare,
    color: 'bg-cyan-100 text-cyan-600',
  },
  {
    title: 'Documentos',
    description: 'Facturas, recibos y documentación',
    href: '/portal-inquilino/documentos',
    icon: FolderOpen,
    color: 'bg-indigo-100 text-indigo-600',
  },
  {
    title: 'Chatbot IA',
    description: 'Asistente virtual 24/7',
    href: '/portal-inquilino/chatbot',
    icon: Bot,
    color: 'bg-violet-100 text-violet-600',
    badge: '24/7',
  },
  {
    title: 'Valoraciones',
    description: 'Opina sobre el servicio',
    href: '/portal-inquilino/valoraciones',
    icon: Star,
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    title: 'Logros',
    description: 'Recompensas y beneficios',
    href: '/portal-inquilino/logros',
    icon: Trophy,
    color: 'bg-rose-100 text-rose-600',
  },
  {
    title: 'Referidos',
    description: 'Invita amigos y gana recompensas',
    href: '/portal-inquilino/referidos',
    icon: Users,
    color: 'bg-teal-100 text-teal-600',
  },
  {
    title: 'Mi Perfil',
    description: 'Datos personales y configuración',
    href: '/portal-inquilino/perfil',
    icon: User,
    color: 'bg-gray-100 text-gray-600',
  },
];

export default function PortalInquilinoPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/portal-inquilino/login');
    } else if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status, router]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/portal-inquilino/dashboard');
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/portal-inquilino/login');
    toast.success('Sesión cerrada correctamente');
  };

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando portal...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    return null;
  }

  const userName = (session?.user as any)?.name || 'Inquilino';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-black rounded-full">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">INMOVA</h1>
                <p className="text-sm text-muted-foreground">Portal del Inquilino</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  2
                </span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold">¡Hola, {userName}! 👋</h2>
          <p className="text-muted-foreground mt-2">
            Bienvenido a tu portal de inquilino. Gestiona todo desde aquí.
          </p>
        </div>

        {/* Quick Stats */}
        {dashboardData && (
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Contratos Activos</p>
                    <p className="text-3xl font-bold">{dashboardData.stats?.contractsCount || 0}</p>
                  </div>
                  <FileText className="h-10 w-10 opacity-80" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Total Pagado</p>
                    <p className="text-3xl font-bold">€{(dashboardData.stats?.totalPagado || 0).toFixed(0)}</p>
                  </div>
                  <CreditCard className="h-10 w-10 opacity-80" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Pendiente</p>
                    <p className="text-3xl font-bold">€{(dashboardData.stats?.totalPendiente || 0).toFixed(0)}</p>
                  </div>
                  <Calendar className="h-10 w-10 opacity-80" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Incidencias</p>
                    <p className="text-3xl font-bold">{dashboardData.stats?.maintenanceCount || 0}</p>
                  </div>
                  <Wrench className="h-10 w-10 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Access - Featured */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-primary/20 rounded-xl">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold">Asistente Virtual IA</h3>
                      <Sparkles className="h-5 w-5 text-yellow-500" />
                    </div>
                    <p className="text-muted-foreground">
                      Tu asistente disponible 24/7. Pregunta sobre pagos, contratos, incidencias y más.
                    </p>
                  </div>
                </div>
                <Link href="/portal-inquilino/chatbot">
                  <Button size="lg" className="gap-2">
                    <Bot className="h-5 w-5" />
                    Iniciar Chat
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Menu Grid */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Accesos Rápidos</h3>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Card className={`h-full transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer ${item.featured ? 'ring-2 ring-primary' : ''}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${item.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{item.title}</h4>
                          {item.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Security Notice */}
        <div className="mt-8">
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-600" />
                <p className="text-sm text-muted-foreground">
                  Tu información está protegida con encriptación de grado bancario.
                  Conexión segura SSL/TLS.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 INMOVA. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/terminos" className="text-sm text-muted-foreground hover:underline">
                Términos de Uso
              </Link>
              <Link href="/privacidad" className="text-sm text-muted-foreground hover:underline">
                Privacidad
              </Link>
              <Link href="/ayuda" className="text-sm text-muted-foreground hover:underline">
                Ayuda
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
