'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  HardHat, 
  Building2, 
  Hammer, 
  Users, 
  FileText, 
  TrendingUp,
  ClipboardCheck,
  Euro,
  Briefcase,
  Settings,
  Bell,
  Search,
  Plus,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

export default function EwoorkerPanelPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/ewoorker/login');
      return;
    }

    // Verificar que es un usuario de eWoorker
    const ewoorkerRoles = ['socio_ewoorker', 'contratista_ewoorker', 'subcontratista_ewoorker'];
    if (session?.user?.role && !ewoorkerRoles.includes(session.user.role)) {
      // No es usuario de eWoorker, redirigir al dashboard normal
      router.push('/dashboard');
      return;
    }

    setLoading(false);
  }, [session, status, router]);

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando panel...</p>
        </div>
      </div>
    );
  }

  const userRole = session?.user?.role || '';
  const userName = session?.user?.name || 'Usuario';

  // Configuración según rol
  const roleConfig: Record<string, { title: string; color: string; icon: any; quickActions: any[] }> = {
    socio_ewoorker: {
      title: 'Panel de Socio',
      color: 'from-emerald-500 to-emerald-600',
      icon: Users,
      quickActions: [
        { label: 'Ver Métricas', href: '/ewoorker/admin-socio', icon: TrendingUp },
        { label: 'Ingresos', href: '/ewoorker/admin-socio/ingresos', icon: Euro },
        { label: 'Empresas', href: '/ewoorker/empresas', icon: Building2 },
        { label: 'Configuración', href: '/ewoorker/config', icon: Settings },
      ],
    },
    contratista_ewoorker: {
      title: 'Panel de Contratista',
      color: 'from-orange-500 to-orange-600',
      icon: Building2,
      quickActions: [
        { label: 'Mis Obras', href: '/ewoorker/obras', icon: ClipboardCheck },
        { label: 'Buscar Subcontratistas', href: '/ewoorker/empresas', icon: Search },
        { label: 'Contratos', href: '/ewoorker/contratos', icon: FileText },
        { label: 'Mi Perfil', href: '/ewoorker/perfil', icon: Briefcase },
      ],
    },
    subcontratista_ewoorker: {
      title: 'Panel de Subcontratista',
      color: 'from-yellow-500 to-yellow-600',
      icon: Hammer,
      quickActions: [
        { label: 'Ver Obras Disponibles', href: '/ewoorker/obras', icon: Search },
        { label: 'Mis Ofertas', href: '/ewoorker/ofertas', icon: FileText },
        { label: 'Contratos', href: '/ewoorker/contratos', icon: ClipboardCheck },
        { label: 'Mi Perfil', href: '/ewoorker/perfil', icon: Briefcase },
      ],
    },
  };

  const config = roleConfig[userRole] || roleConfig.subcontratista_ewoorker;
  const RoleIcon = config.icon;

  // Stats según rol
  const getStats = () => {
    if (userRole === 'socio_ewoorker') {
      return [
        { label: 'Empresas Activas', value: '156', change: '+12%' },
        { label: 'Obras en Curso', value: '45', change: '+8%' },
        { label: 'Ingresos Mes', value: '€12,450', change: '+23%' },
        { label: 'Comisiones', value: '€2,890', change: '+15%' },
      ];
    } else if (userRole === 'contratista_ewoorker') {
      return [
        { label: 'Obras Activas', value: '8', change: '' },
        { label: 'Subcontratistas', value: '24', change: '' },
        { label: 'Ofertas Pendientes', value: '12', change: '' },
        { label: 'Contratos Mes', value: '€145K', change: '' },
      ];
    } else {
      return [
        { label: 'Obras Disponibles', value: '34', change: '' },
        { label: 'Ofertas Enviadas', value: '5', change: '' },
        { label: 'Contratos Activos', value: '2', change: '' },
        { label: 'Facturado Mes', value: '€18,500', change: '' },
      ];
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100">
      {/* Header */}
      <header className="bg-white border-b border-orange-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/ewoorker/landing" className="flex items-center space-x-2">
              <HardHat className="h-8 w-8 text-orange-600" />
              <span className="text-xl font-bold text-orange-600">eWoorker</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5 text-gray-600" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  <Badge variant="outline" className="text-xs">
                    {userRole.replace('_ewoorker', '').replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <Card className={`bg-gradient-to-r ${config.color} text-white mb-8`}>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <RoleIcon className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{config.title}</h1>
                  <p className="text-white/80">Bienvenido, {userName}</p>
                </div>
              </div>
              <Button variant="secondary" className="bg-white text-orange-600 hover:bg-white/90">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {getStats().map((stat, i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <p className="text-sm text-gray-500">{stat.label}</p>
                <div className="flex items-baseline space-x-2">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  {stat.change && (
                    <span className="text-sm text-green-600">{stat.change}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {config.quickActions.map((action, i) => {
            const ActionIcon = action.icon;
            return (
              <Link key={i} href={action.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="py-6 text-center">
                    <div className="p-3 bg-orange-100 rounded-full w-fit mx-auto mb-3 group-hover:bg-orange-200 transition-colors">
                      <ActionIcon className="h-6 w-6 text-orange-600" />
                    </div>
                    <p className="font-medium text-gray-900">{action.label}</p>
                    <ArrowRight className="h-4 w-4 mx-auto mt-2 text-gray-400 group-hover:text-orange-600 transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Role-specific content */}
        {userRole === 'contratista_ewoorker' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Publicar Nueva Obra</span>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Obra
                </Button>
              </CardTitle>
              <CardDescription>
                Publica una obra para recibir ofertas de subcontratistas verificados
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {userRole === 'subcontratista_ewoorker' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Obras Disponibles</span>
                <Link href="/ewoorker/obras">
                  <Button variant="outline">Ver todas</Button>
                </Link>
              </CardTitle>
              <CardDescription>
                Obras que coinciden con tus especialidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Explora las obras disponibles en tu zona</p>
                <Link href="/ewoorker/obras">
                  <Button className="mt-4 bg-orange-600 hover:bg-orange-700">
                    Buscar Obras
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {userRole === 'socio_ewoorker' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Resumen de Plataforma</CardTitle>
              <CardDescription>
                Vista general de la actividad de eWoorker
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Building2 className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                  <p className="text-2xl font-bold">156</p>
                  <p className="text-sm text-gray-500">Contratistas</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Hammer className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                  <p className="text-2xl font-bold">489</p>
                  <p className="text-sm text-gray-500">Subcontratistas</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <FileText className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
                  <p className="text-2xl font-bold">€1.2M</p>
                  <p className="text-sm text-gray-500">Volumen Mes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
