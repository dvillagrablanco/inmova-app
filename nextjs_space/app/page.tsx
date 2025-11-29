'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Users, 
  FileText, 
  CreditCard, 
  Wrench, 
  FileBarChart,
  Calendar,
  MessageSquare,
  Vote,
  Megaphone,
  Shield,
  Zap,
  UserCheck,
  Briefcase,
  TrendingUp,
  Home as HomeIcon
} from 'lucide-react';

interface QuickAccessCard {
  title: string;
  description: string;
  icon: any;
  href: string;
  color: string;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const quickAccessCards: QuickAccessCard[] = [
    // Gestión de Propiedades
    {
      title: 'Edificios',
      description: 'Administra tus edificios y comunidades',
      icon: Building2,
      href: '/edificios',
      color: 'text-blue-500'
    },
    {
      title: 'Unidades',
      description: 'Gestión de pisos y locales',
      icon: HomeIcon,
      href: '/unidades',
      color: 'text-green-500'
    },
    {
      title: 'Inquilinos',
      description: 'Gestiona tus inquilinos',
      icon: Users,
      href: '/inquilinos',
      color: 'text-purple-500'
    },
    {
      title: 'Contratos',
      description: 'Contratos de alquiler',
      icon: FileText,
      href: '/contratos',
      color: 'text-amber-500'
    },
    
    // Gestión Financiera
    {
      title: 'Pagos',
      description: 'Gestión de cobros y pagos',
      icon: CreditCard,
      href: '/pagos',
      color: 'text-emerald-500'
    },
    {
      title: 'Gastos',
      description: 'Control de gastos',
      icon: TrendingUp,
      href: '/gastos',
      color: 'text-red-500'
    },
    {
      title: 'Reportes',
      description: 'Análisis financiero',
      icon: FileBarChart,
      href: '/reportes',
      color: 'text-indigo-500'
    },
    
    // Mantenimiento
    {
      title: 'Mantenimiento',
      description: 'Solicitudes y órdenes',
      icon: Wrench,
      href: '/mantenimiento',
      color: 'text-orange-500'
    },
    {
      title: 'Proveedores',
      description: 'Gestión de proveedores',
      icon: Briefcase,
      href: '/proveedores',
      color: 'text-cyan-500'
    },
    
    // Comunicación
    {
      title: 'Chat',
      description: 'Comunicación con inquilinos',
      icon: MessageSquare,
      href: '/chat',
      color: 'text-pink-500'
    },
    {
      title: 'Votaciones',
      description: 'Votaciones de comunidad',
      icon: Vote,
      href: '/votaciones',
      color: 'text-violet-500'
    },
    {
      title: 'Anuncios',
      description: 'Tablón de anuncios',
      icon: Megaphone,
      href: '/anuncios',
      color: 'text-yellow-500'
    },
    
    // Herramientas
    {
      title: 'Calendario',
      description: 'Calendario unificado',
      icon: Calendar,
      href: '/calendario',
      color: 'text-teal-500'
    },
    {
      title: 'Seguros',
      description: 'Pólizas de seguro',
      icon: Shield,
      href: '/seguros',
      color: 'text-blue-600'
    },
    {
      title: 'Energía',
      description: 'Gestión energética',
      icon: Zap,
      href: '/energia',
      color: 'text-yellow-600'
    },
    {
      title: 'Portal Propietario',
      description: 'Vista de propietarios',
      icon: UserCheck,
      href: '/portal-propietario',
      color: 'text-gray-600'
    }
  ];

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {/* Hero Section */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              Bienvenido a INMOVA
            </h1>
            <p className="text-muted-foreground text-lg">
              Gestión integral de propiedades inmobiliarias
            </p>
          </div>

          {/* Quick Access Cards */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Acceso Rápido</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {quickAccessCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Card
                    key={card.href}
                    className="hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => router.push(card.href)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{card.title}</CardTitle>
                        <Icon className={`h-5 w-5 ${card.color} group-hover:scale-110 transition-transform`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm">{card.description}</CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <Building2 className="h-12 w-12" />
                  <span className="text-4xl font-bold">•</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Dashboard Completo</h3>
                <p className="text-blue-100 text-sm mb-4">
                  Métricas y KPIs en tiempo real
                </p>
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => router.push('/dashboard')}
                >
                  Ver Dashboard
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <FileBarChart className="h-12 w-12" />
                  <span className="text-4xl font-bold">📊</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Analytics</h3>
                <p className="text-green-100 text-sm mb-4">
                  Análisis avanzado de datos
                </p>
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => router.push('/analytics')}
                >
                  Ver Analytics
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <MessageSquare className="h-12 w-12" />
                  <span className="text-4xl font-bold">💬</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Comunicación</h3>
                <p className="text-purple-100 text-sm mb-4">
                  Chat y notificaciones
                </p>
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => router.push('/chat')}
                >
                  Abrir Chat
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
