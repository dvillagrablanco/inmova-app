'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Building2,
  Euro,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Mail,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


export default function PartnersProgramPage() {
  const benefits = [
    {
      icon: Euro,
      title: 'Ingresos Recurrentes',
      description:
        'Comisiones mensuales automáticas por cada cliente activo. Hasta 70% de comisión según volumen.',
    },
    {
      icon: Users,
      title: 'Sin Inversión Inicial',
      description: 'Plataforma lista para usar sin costes de desarrollo ni equipo técnico propio.',
    },
    {
      icon: Building2,
      title: 'White Label Completo',
      description: 'Personaliza con tu logo, colores corporativos y dominio propio.',
    },
    {
      icon: TrendingUp,
      title: 'Escalable y Predecible',
      description: 'Modelo SaaS con ingresos predecibles que crecen con tu cartera de clientes.',
    },
  ];

  const targetProfiles = [
    {
      title: 'Bancos y Entidades Financieras',
      description:
        'Ofrece a tus clientes con hipotecas una herramienta profesional de gestión inmobiliaria.',
      commission: '60-70%',
    },
    {
      title: 'Multifamily Offices',
      description:
        'Centraliza y profesionaliza la gestión del patrimonio inmobiliario de tus clientes VIP.',
      commission: '50-60%',
    },
    {
      title: 'Plataformas de Membresía',
      description: 'Añade valor agregado con acceso a gestión inmobiliaria para tus miembros.',
      commission: '40-50%',
    },
    {
      title: 'Consultoras e Inmobiliarias',
      description: 'Herramienta post-venta para fidelizar clientes y generar ingresos recurrentes.',
      commission: '30-40%',
    },
  ];

  const commissionTiers = [
    { clients: '1-10', commission: '20%', example: '€29.80/cliente' },
    { clients: '11-25', commission: '30%', example: '€44.70/cliente' },
    { clients: '26-50', commission: '40%', example: '€59.60/cliente' },
    { clients: '51-100', commission: '50%', example: '€74.50/cliente' },
    { clients: '101-250', commission: '60%', example: '€89.40/cliente' },
    { clients: '251+', commission: '70%', example: '€104.30/cliente' },
  ];

  const features = [
    'Dashboard ejecutivo con métricas en tiempo real',
    'Sistema de invitaciones masivas a clientes',
    'Tracking automático de comisiones mensuales',
    'Reportes detallados de uso y engagement',
    'Soporte técnico dedicado para Partners',
    'Materiales de marketing personalizados',
    'Formación y onboarding del equipo',
    'API para integraciones personalizadas',
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-gray-900">INMOVA</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/partners/login">
                <Button variant="ghost">Login Partners</Button>
              </Link>
              <Link href="/partners/register">
                <Button>Regístrate</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-white to-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">Programa de Partners B2B</h1>
              <p className="text-xl text-gray-600 mb-8">
                Ofrece INMOVA a tus clientes y genera{' '}
                <span className="text-primary font-semibold">ingresos recurrentes</span> sin
                inversión inicial. Hasta{' '}
                <span className="text-primary font-semibold">70% de comisión</span> según volumen.
              </p>
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href="/partners/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Convertirse en Partner
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#como-funciona">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Ver Cómo Funciona
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="https://cdn.abacus.ai/images/ee1e6444-0033-47b4-86eb-3628991d86fb.jpg"
                alt="B2B Partnership"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Beneficios del Programa</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Un modelo de negocio completo que te permite ofrecer valor agregado a tus clientes
              mientras generas ingresos predecibles y escalables
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="border-t-4 border-primary">
                  <CardHeader>
                    <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle>{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Target Profiles */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">¿Para quién es este programa?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Diseñado para entidades que tienen acceso a clientes potenciales que necesitan gestión
              inmobiliaria profesional
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {targetProfiles.map((profile, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {profile.title}
                    <span className="text-sm font-normal bg-green-100 text-green-800 px-3 py-1 rounded-full">
                      {profile.commission}
                    </span>
                  </CardTitle>
                  <CardDescription>{profile.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Commission Structure */}
      <section id="comisiones" className="py-20 bg-gradient-to-br from-primary/5 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Escala de Comisiones</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tu comisión crece automáticamente según el número de clientes activos. Cuantos más
              clientes, mayor tu porcentaje.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {commissionTiers.map((tier, index) => (
              <Card key={index} className="border-2 hover:border-primary transition-colors">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-gray-600 text-sm mb-2">Clientes Activos</p>
                    <p className="text-3xl font-bold text-gray-900 mb-2">{tier.clients}</p>
                    <div className="bg-primary/10 rounded-full py-2 px-4 mb-3">
                      <p className="text-2xl font-bold text-primary">{tier.commission}</p>
                    </div>
                    <p className="text-sm text-gray-600">{tier.example}/mes</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Example Calculation */}
          <Card className="bg-primary text-white">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <p className="text-primary-foreground/80 mb-2">Con 50 Clientes</p>
                  <p className="text-4xl font-bold mb-2">€2,980</p>
                  <p className="text-primary-foreground/80 text-sm">por mes</p>
                </div>
                <div>
                  <p className="text-primary-foreground/80 mb-2">Con 100 Clientes</p>
                  <p className="text-4xl font-bold mb-2">€7,450</p>
                  <p className="text-primary-foreground/80 text-sm">por mes</p>
                </div>
                <div>
                  <p className="text-primary-foreground/80 mb-2">Con 250 Clientes</p>
                  <p className="text-4xl font-bold mb-2">€22,350</p>
                  <p className="text-primary-foreground/80 text-sm">por mes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="https://cdn.abacus.ai/images/2c4969fc-00e0-4e85-bffa-e64790551308.jpg"
                alt="Business Dashboard"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Todo lo que necesitas</h2>
              <p className="text-lg text-gray-600 mb-8">
                Portal completo para Partners con todas las herramientas necesarias para gestionar
                tus clientes y comisiones
              </p>
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="como-funciona" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">¿Cómo Funciona?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Proceso simple de 4 pasos para empezar a generar ingresos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                title: 'Registro',
                description: 'Regístrate como Partner y envía tu solicitud',
              },
              {
                step: '2',
                title: 'Aprobación',
                description: 'Revisamos tu solicitud en 24-48 horas',
              },
              {
                step: '3',
                title: 'Invita Clientes',
                description: 'Usa el dashboard para invitar a tus clientes',
              },
              {
                step: '4',
                title: 'Cobra Comisiones',
                description: 'Recibe comisiones mensuales automáticas',
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">¿Listo para convertirte en Partner?</h2>
          <p className="text-xl text-primary-foreground/90 mb-8">
            Únete a los Partners que ya están generando ingresos recurrentes con INMOVA. Sin
            inversión inicial, sin riesgo.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link href="/partners/register">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Regístrate Ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary"
            >
              <Mail className="mr-2 h-5 w-5" />
              partners@inmova.com
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-8 w-8" />
                <span className="text-xl font-bold">INMOVA</span>
              </div>
              <p className="text-gray-400">
                Plataforma de gestión inmobiliaria integral para profesionales.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contacto Partners</h4>
              <div className="space-y-2 text-gray-400">
                <p className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>partners@inmova.com</span>
                </p>
                <p className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>+34 900 123 456</span>
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Enlaces</h4>
              <div className="space-y-2">
                <Link href="/partners/login" className="block text-gray-400 hover:text-white">
                  Login Partners
                </Link>
                <Link href="/partners/register" className="block text-gray-400 hover:text-white">
                  Registro Partners
                </Link>
                <Link href="/" className="block text-gray-400 hover:text-white">
                  Web Principal
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© 2025 INMOVA - Enxames Investments SL. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
