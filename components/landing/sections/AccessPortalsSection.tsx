'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Briefcase, Home, Building, Users, ArrowRight, UserCircle,
  Hammer, Shield, Handshake, Eye,
} from 'lucide-react';

const portals = [
  {
    id: 'admin',
    title: 'Gestor Inmobiliario',
    subtitle: 'Administradores y gestores',
    description: '180+ módulos, IA integrada, multi-sociedad',
    icon: Users,
    link: '/login',
    color: 'from-emerald-600 to-green-600',
    bgHover: 'hover:bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  {
    id: 'inquilino',
    title: 'Inquilino',
    subtitle: 'Portal del inquilino',
    description: 'Pagos, incidencias, documentos y chat 24/7',
    icon: Home,
    link: '/portal-inquilino/login',
    color: 'from-indigo-600 to-purple-600',
    bgHover: 'hover:bg-indigo-50',
    borderColor: 'border-indigo-200',
  },
  {
    id: 'propietario',
    title: 'Propietario',
    subtitle: 'Portal del propietario',
    description: '8 páginas: dashboard, propiedades, contratos, pagos, liquidaciones, incidencias, comunicación, informe mensual',
    icon: Building,
    link: '/portal-propietario/dashboard',
    color: 'from-amber-600 to-yellow-600',
    bgHover: 'hover:bg-amber-50',
    borderColor: 'border-amber-200',
  },
  {
    id: 'proveedor',
    title: 'Proveedor',
    subtitle: 'Portal de proveedores',
    description: 'Órdenes de trabajo, presupuestos, facturas, chat y reseñas',
    icon: Briefcase,
    link: '/portal-proveedor/login',
    color: 'from-blue-600 to-cyan-600',
    bgHover: 'hover:bg-blue-50',
    borderColor: 'border-blue-200',
  },
  {
    id: 'partner',
    title: 'Partner',
    subtitle: 'Programa de partners',
    description: 'Comisiones, recursos, capacitación y soporte',
    icon: Handshake,
    link: '/partners/login',
    color: 'from-rose-600 to-pink-600',
    bgHover: 'hover:bg-rose-50',
    borderColor: 'border-rose-200',
  },
  {
    id: 'ewoorker',
    title: 'Construcción',
    subtitle: 'ewoorker B2B',
    description: 'Marketplace de obras, compliance y analytics',
    icon: Hammer,
    link: '/ewoorker/dashboard',
    color: 'from-orange-600 to-yellow-500',
    bgHover: 'hover:bg-orange-50',
    borderColor: 'border-orange-200',
  },
];

export function AccessPortalsSection() {
  return (
    <section id="accesos" className="py-20 px-4 bg-gradient-to-b from-white to-slate-50">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-0 text-sm px-4 py-1">
            <UserCircle className="h-3.5 w-3.5 mr-1.5" />
            Acceso Directo
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Cuál es tu perfil?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Accede directamente a tu portal personalizado
          </p>
        </div>

        {/* Portals Grid — 2 cols mobile, 3 cols desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <Link key={portal.id} href={portal.link} className="group">
                <Card
                  className={`h-full border-2 ${portal.borderColor} ${portal.bgHover} hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer`}
                >
                  <CardContent className="pt-6 pb-4 text-center">
                    {/* Icon */}
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${portal.color} mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold mb-1">{portal.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{portal.subtitle}</p>
                    <p className="text-sm text-gray-600 leading-snug">{portal.description}</p>
                  </CardContent>

                  <CardFooter className="pt-0 pb-5 justify-center">
                    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold bg-gradient-to-r ${portal.color} bg-clip-text text-transparent group-hover:gap-2.5 transition-all`}>
                      Acceder
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </CardFooter>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick access bar for mobile */}
        <div className="mt-8 text-center space-y-3">
          <p className="text-sm text-gray-500">¿No tienes cuenta?</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg">
                Registrarme Gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/landing/contacto">
              <Button size="lg" variant="outline">
                Contactar con Ventas
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
