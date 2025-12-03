'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { OnboardingTourEnhanced } from '@/components/OnboardingTourEnhanced';
import { QuickAccessMenu } from '@/components/ui/quick-access-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, Users, TrendingUp, Zap, Shield, Bot, Leaf, Wallet, 
  CheckCircle, Star, ArrowRight, Play, Hotel, Hammer, Briefcase,
  Cloud, Calendar, MessageSquare, FileText, CreditCard, BarChart3,
  Lock, Globe, Smartphone, Award, Target, Rocket, Home,
  Link as LinkIcon, Recycle, Phone, Mail, MapPin, Sparkles, HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import logger, { logError } from '@/lib/logger';

// Mapeo de códigos de módulos a información visual
const MODULE_INFO: Record<string, { icon: any; title: string; description: string; gradient: string; route: string }> = {
  dashboard: { icon: Home, title: 'Dashboard', description: 'Vista general del sistema', gradient: 'from-blue-500 to-cyan-500', route: '/dashboard' },
  edificios: { icon: Building2, title: 'Edificios', description: 'Gestión de propiedades', gradient: 'from-indigo-500 to-blue-500', route: '/edificios' },
  unidades: { icon: Home, title: 'Unidades', description: 'Apartamentos y locales', gradient: 'from-violet-500 to-purple-500', route: '/unidades' },
  inquilinos: { icon: Users, title: 'Inquilinos', description: 'Gestión de arrendatarios', gradient: 'from-pink-500 to-rose-500', route: '/inquilinos' },
  contratos: { icon: FileText, title: 'Contratos', description: 'Contratos de alquiler', gradient: 'from-orange-500 to-red-500', route: '/contratos' },
  pagos: { icon: CreditCard, title: 'Pagos', description: 'Gestión de cobros', gradient: 'from-green-500 to-emerald-500', route: '/pagos' },
  mantenimiento: { icon: Hammer, title: 'Mantenimiento', description: 'Solicitudes y reparaciones', gradient: 'from-yellow-500 to-amber-500', route: '/mantenimiento' },
  chat: { icon: MessageSquare, title: 'Chat', description: 'Mensajería interna', gradient: 'from-cyan-500 to-teal-500', route: '/chat' },
  calendario: { icon: Calendar, title: 'Calendario', description: 'Eventos y recordatorios', gradient: 'from-blue-500 to-indigo-500', route: '/calendario' },
  bi: { icon: BarChart3, title: 'Business Intelligence', description: 'Análisis avanzado', gradient: 'from-purple-500 to-violet-500', route: '/bi' },
  asistente_ia: { icon: Bot, title: 'Asistente IA', description: 'GPT-4 Conversacional', gradient: 'from-violet-500 to-purple-500', route: '/asistente-ia' },
  blockchain: { icon: LinkIcon, title: 'Blockchain', description: 'Tokenización', gradient: 'from-cyan-500 to-blue-500', route: '/blockchain' },
  esg: { icon: Leaf, title: 'ESG Sostenibilidad', description: 'Huella de carbono', gradient: 'from-green-500 to-lime-500', route: '/esg' },
  str_listings: { icon: Hotel, title: 'Anuncios STR', description: 'Propiedades turísticas', gradient: 'from-orange-500 to-amber-500', route: '/str/listings' },
  str_bookings: { icon: Calendar, title: 'Reservas STR', description: 'Gestión de reservas', gradient: 'from-blue-500 to-cyan-500', route: '/str/bookings' },
  str_channels: { icon: Globe, title: 'Channel Manager', description: 'Sincronización canales', gradient: 'from-purple-500 to-pink-500', route: '/str/channels' },
  flipping_projects: { icon: TrendingUp, title: 'House Flipping', description: 'Proyectos de inversión', gradient: 'from-green-500 to-teal-500', route: '/flipping/projects' },
  construction_projects: { icon: Building2, title: 'Construcción', description: 'Obras y desarrollo', gradient: 'from-orange-500 to-red-500', route: '/construction/projects' },
  professional_projects: { icon: Briefcase, title: 'Servicios Profesionales', description: 'Arquitectura y asesoría', gradient: 'from-indigo-500 to-violet-500', route: '/professional/projects' },
  usuarios: { icon: Shield, title: 'Usuarios', description: 'Gestión de accesos', gradient: 'from-red-500 to-pink-500', route: '/admin/usuarios' },
  proveedores: { icon: Briefcase, title: 'Proveedores', description: 'Directorio de servicios', gradient: 'from-teal-500 to-cyan-500', route: '/proveedores' },
  reportes: { icon: BarChart3, title: 'Reportes', description: 'Informes financieros', gradient: 'from-blue-500 to-purple-500', route: '/reportes' },
};

interface HomeStats {
  totalPropiedades: number;
  totalInquilinos: number;
  ingresosMes: number;
  tasaOcupacion: number;
}

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if user has seen onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding && session) {
      setShowOnboarding(true);
    }
  }, [session]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch active modules
        const modulesResponse = await fetch('/api/modules/active');
        if (modulesResponse.ok) {
          const data = await modulesResponse.json();
          // El API devuelve { activeModules: [...] }, extraemos el array
          const modulesArray = data.activeModules || data || [];
          setActiveModules(Array.isArray(modulesArray) ? modulesArray : []);
        }

        // Fetch basic stats
        const statsResponse = await fetch('/api/dashboard');
        if (statsResponse.ok) {
          const dashboardData = await statsResponse.json();
          setStats({
            totalPropiedades: dashboardData.kpis?.numeroPropiedades || 0,
            totalInquilinos: 0, // Podrías añadir este dato al API
            ingresosMes: dashboardData.kpis?.ingresosTotalesMensuales || 0,
            tasaOcupacion: dashboardData.kpis?.tasaOcupacion || 0
          });
        }
      } catch (error) {
        logger.error('Error fetching data:', error);
        // En caso de error, asegurarse de que activeModules sea un array vacío
        setActiveModules([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando tu espacio de trabajo...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Filtrar módulos activos que tenemos información
  const availableModules = activeModules.filter(code => MODULE_INFO[code]).slice(0, 12);

  const handleOnboardingComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  return (
    <>
      {showOnboarding && <OnboardingTourEnhanced onComplete={handleOnboardingComplete} />}
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Sidebar />
        <div className="flex-1 flex flex-col ml-0 lg:ml-64">
          <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Welcome Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-8 text-white shadow-2xl">
              <div className="absolute inset-0 bg-grid-white/10" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                  <span className="text-sm font-semibold opacity-90">Bienvenido de vuelta</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  ¡Hola, {session?.user?.name || 'Usuario'}! 👋
                </h1>
                <p className="text-lg opacity-90">
                  Tienes acceso a <span className="font-bold">{availableModules.length} módulos</span> activos en tu plataforma INMOVA
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-blue-600 font-medium">Total Propiedades</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-black text-blue-700">{stats.totalPropiedades}</div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-green-600 font-medium">Ingresos Mensuales</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-black text-green-700">€{stats.ingresosMes.toLocaleString()}</div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-violet-600 font-medium">Tasa Ocupación</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-black text-violet-700">{stats.tasaOcupacion}%</div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
                  <CardHeader className="pb-3">
                    <CardDescription className="text-orange-600 font-medium">Dashboard Completo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/dashboard">
                      <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                        Ver Analytics
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Active Modules */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Tus Módulos Activos</h2>
                  <p className="text-gray-600 mt-1">Accede rápidamente a las funcionalidades contratadas</p>
                </div>
                <Link href="/admin/modulos">
                  <Button variant="outline" className="gap-2">
                    <Award className="h-4 w-4" />
                    Gestionar Módulos
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {availableModules.map((moduleCode) => {
                  const module = MODULE_INFO[moduleCode];
                  return (
                    <Link href={module.route} key={moduleCode}>
                      <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-indigo-300 cursor-pointer h-full">
                        <CardHeader>
                          <div className={`p-3 bg-gradient-to-br ${module.gradient} rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform shadow-lg`}>
                            <module.icon className="h-6 w-6 text-white" />
                          </div>
                          <CardTitle className="text-lg group-hover:text-indigo-600 transition-colors">
                            {module.title}
                          </CardTitle>
                          <CardDescription>{module.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button variant="ghost" size="sm" className="w-full group-hover:bg-indigo-50 group-hover:text-indigo-600">
                            Acceder
                            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-indigo-600" />
                  Acciones Rápidas
                </CardTitle>
                <CardDescription>Tareas frecuentes de un solo click</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link href="/edificios/nuevo">
                    <Button variant="outline" className="w-full h-full flex-col gap-2 py-6">
                      <Building2 className="h-6 w-6 text-blue-600" />
                      <span className="text-sm">Nuevo Edificio</span>
                    </Button>
                  </Link>
                  <Link href="/inquilinos/nuevo">
                    <Button variant="outline" className="w-full h-full flex-col gap-2 py-6">
                      <Users className="h-6 w-6 text-purple-600" />
                      <span className="text-sm">Nuevo Inquilino</span>
                    </Button>
                  </Link>
                  <Link href="/contratos/nuevo">
                    <Button variant="outline" className="w-full h-full flex-col gap-2 py-6">
                      <FileText className="h-6 w-6 text-orange-600" />
                      <span className="text-sm">Nuevo Contrato</span>
                    </Button>
                  </Link>
                  <Link href="/mantenimiento/nuevo">
                    <Button variant="outline" className="w-full h-full flex-col gap-2 py-6">
                      <Hammer className="h-6 w-6 text-green-600" />
                      <span className="text-sm">Nueva Solicitud</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Quick Access Menu */}
          <QuickAccessMenu />
        </main>
      </div>
    </div>
    </>
  );
}
