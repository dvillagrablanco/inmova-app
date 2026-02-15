'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Home,
  Settings,
  User,
  Bell,
  Palette,
  Shield,
  CreditCard,
  FileSignature,
  Building2,
  Plug,
  ChevronRight,
  Globe,
  Moon,
  Sun,
  Smartphone,
} from 'lucide-react';
import Link from 'next/link';

interface ConfigSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
}

const configSections: ConfigSection[] = [
  {
    id: 'perfil',
    title: 'Mi Perfil',
    description: 'Datos personales, email y contraseña',
    icon: <User className="h-5 w-5" />,
    href: '/perfil',
  },
  {
    id: 'notificaciones',
    title: 'Notificaciones',
    description: 'Configura alertas y recordatorios',
    icon: <Bell className="h-5 w-5" />,
    href: '/configuracion/notificaciones',
  },
  {
    id: 'integraciones',
    title: 'Integraciones',
    description: 'Conecta con servicios externos',
    icon: <Plug className="h-5 w-5" />,
    href: '/configuracion/integraciones',
  },
  {
    id: 'pagos',
    title: 'Métodos de Pago',
    description: 'Configura pasarelas de cobro',
    icon: <CreditCard className="h-5 w-5" />,
    href: '/pagos/configuracion',
  },
  {
    id: 'firma',
    title: 'Firma Digital',
    description: 'DocuSign y Signaturit',
    icon: <FileSignature className="h-5 w-5" />,
    href: '/firma-digital/configuracion',
  },
  {
    id: 'empresa',
    title: 'Mi Empresa',
    description: 'Datos fiscales y configuración',
    icon: <Building2 className="h-5 w-5" />,
    href: '/empresa/configuracion',
  },
  {
    id: 'empresas-holding',
    title: 'Empresas y Holding',
    description: 'Gestiona empresas del grupo y consolidación',
    icon: <Building2 className="h-5 w-5" />,
    href: '/configuracion/empresas',
  },
  {
    id: 'apariencia',
    title: 'Apariencia',
    description: 'Tema y personalización visual',
    icon: <Palette className="h-5 w-5" />,
    href: '/configuracion/ui-mode',
  },
  {
    id: 'seguridad',
    title: 'Seguridad',
    description: '2FA, sesiones y privacidad',
    icon: <Shield className="h-5 w-5" />,
    href: '/seguridad',
  },
  {
    id: 'contabilidad',
    title: 'Contabilidad',
    description: 'Integraciones contables',
    icon: <Building2 className="h-5 w-5" />,
    href: '/contabilidad/integraciones',
  },
];

export default function ConfiguracionPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto space-y-6 px-4">
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
              <BreadcrumbPage>Configuración</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Configuración</h1>
          <p className="text-muted-foreground mt-1">
            Personaliza tu experiencia en Inmova
          </p>
        </div>

        {/* Secciones */}
        <div className="grid gap-3 md:gap-4">
          {configSections.map((section) => (
            <Link key={section.id} href={section.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="h-10 w-10 md:h-12 md:w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {section.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm md:text-base">{section.title}</h3>
                          {section.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {section.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {section.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Settings (mobile-friendly) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Ajustes Rápidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tema */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Tema Oscuro</p>
                  <p className="text-xs text-muted-foreground">Reduce la fatiga visual</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push('/configuracion/ui-mode')}>
                Cambiar
              </Button>
            </div>

            {/* Idioma */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Idioma</p>
                  <p className="text-xs text-muted-foreground">Español</p>
                </div>
              </div>
              <Badge variant="outline">ES</Badge>
            </div>

            {/* Notificaciones Push */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Notificaciones Push</p>
                  <p className="text-xs text-muted-foreground">Alertas en tiempo real</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push('/configuracion/notificaciones')}>
                Configurar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help */}
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">¿Necesitas ayuda?</p>
                <p className="text-xs text-muted-foreground">
                  Visita nuestro centro de soporte
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push('/soporte')}>
                Ayuda
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
