'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Home, Building, Users, ArrowRight, UserCircle, Hammer } from 'lucide-react';

export function AccessPortalsSection() {
  const portals = [
    {
      title: 'Portal de Proveedores',
      description: 'Acceso para empresas de mantenimiento, limpieza y servicios',
      icon: Briefcase,
      link: '/portal-proveedor/login',
      color: 'from-blue-600 to-cyan-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      features: [
        'Gestión de órdenes de trabajo',
        'Facturación automática',
        'Calendario de servicios',
        'Comunicación directa',
      ],
    },
    {
      title: 'Portal de Inquilinos',
      description: 'Acceso para residentes y arrendatarios',
      icon: Home,
      link: '/portal-inquilino/login',
      color: 'from-indigo-600 to-purple-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      features: [
        'Pago de rentas online',
        'Solicitudes de mantenimiento',
        'Documentos del contrato',
        'Chat con administración',
      ],
    },
    {
      title: 'Portal de Propietarios',
      description: 'Acceso para inversores y dueños de propiedades',
      icon: Building,
      link: '/portal-propietario/login',
      color: 'from-violet-600 to-pink-600',
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-200',
      features: [
        'Informes financieros',
        'Estado de propiedades',
        'Análisis de rentabilidad',
        'Alertas en tiempo real',
      ],
    },
    {
      title: 'Portal Administrativo',
      description: 'Acceso para gestores y administradores de fincas',
      icon: Users,
      link: '/login',
      color: 'from-green-600 to-emerald-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      features: [
        '100+ módulos profesionales',
        'Gestión multi-vertical',
        'Informes avanzados',
        'Automatizaciones IA',
      ],
    },
    {
      title: 'ewoorker (Construcción B2B)',
      description: 'Plataforma para constructores y subcontratistas',
      icon: Hammer,
      link: '/ewoorker/dashboard',
      color: 'from-orange-600 to-yellow-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      badge: 'NUEVO',
      features: [
        'Marketplace de obras',
        'Compliance Ley 32/2006',
        'Escrow de pagos',
        'Gestión documental',
      ],
    },
  ];

  return (
    <section id="accesos" className="py-24 px-4 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0">
            <UserCircle className="h-3 w-3 mr-1" />
            Acceso por Perfil
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              Accede a Tu Portal
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Cada perfil tiene su propio portal optimizado con funcionalidades específicas
          </p>
        </div>

        {/* Portals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <Card
                key={portal.title}
                className={`relative overflow-hidden border-2 ${portal.borderColor} hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group`}
              >
                {/* Badge si tiene */}
                {portal.badge && (
                  <div className="absolute top-3 right-3 z-20">
                    <Badge className="bg-orange-500 text-white text-xs">{portal.badge}</Badge>
                  </div>
                )}

                {/* Background Gradient */}
                <div
                  className={`absolute inset-0 ${portal.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />

                <CardHeader className="relative z-10">
                  <div
                    className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${portal.color} mb-4`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold mb-2">{portal.title}</CardTitle>
                  <CardDescription className="text-sm">{portal.description}</CardDescription>
                </CardHeader>

                <CardContent className="relative z-10 space-y-4">
                  {/* Features List */}
                  <ul className="space-y-2">
                    {portal.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <ArrowRight className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Link href={portal.link} className="block mt-6">
                    <Button
                      className={`w-full bg-gradient-to-r ${portal.color} hover:opacity-90 text-white shadow-lg group`}
                    >
                      Acceder
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Help Text */}
        <div className="mt-12 text-center">
          <p className="text-gray-700">
            ¿No tienes cuenta aún?{' '}
            <Link
              href="/register"
              className="text-indigo-700 hover:text-indigo-800 font-bold underline"
            >
              Regístrate gratis
            </Link>{' '}
            o{' '}
            <Link
              href="/landing/contacto"
              className="text-indigo-700 hover:text-indigo-800 font-bold underline"
            >
              contacta con ventas
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
