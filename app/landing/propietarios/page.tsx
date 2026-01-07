'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Home, 
  Euro, 
  FileText, 
  Bell, 
  Shield, 
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Clock,
  Users,
} from 'lucide-react';

const beneficios = [
  {
    icon: Euro,
    titulo: 'Cobro Automático',
    descripcion: 'Recibe las rentas puntualmente cada mes sin tener que perseguir a nadie.',
  },
  {
    icon: FileText,
    titulo: 'Contratos Digitales',
    descripcion: 'Genera y firma contratos legales en minutos, no en días.',
  },
  {
    icon: Bell,
    titulo: 'Alertas Inteligentes',
    descripcion: 'Recibe notificaciones de vencimientos, impagos y renovaciones.',
  },
  {
    icon: Shield,
    titulo: 'Documentación Segura',
    descripcion: 'Todos tus documentos organizados y accesibles desde cualquier lugar.',
  },
  {
    icon: TrendingUp,
    titulo: 'Informes Financieros',
    descripcion: 'Visualiza la rentabilidad de tus propiedades con informes detallados.',
  },
  {
    icon: Users,
    titulo: 'Gestión de Inquilinos',
    descripcion: 'Comunícate con tus inquilinos y gestiona incidencias fácilmente.',
  },
];

export default function PropietariosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-3xl">
            <div className="flex items-center space-x-2 mb-4">
              <Home className="w-8 h-8" />
              <span className="text-blue-200 font-medium">Para Propietarios</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Gestiona tus alquileres sin complicaciones
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Automatiza el cobro de rentas, genera contratos legales y mantén toda tu documentación organizada desde un solo lugar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="lg" variant="secondary" className="text-blue-600">
                  Empezar Gratis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/landing/demo">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Ver Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 -mt-10">
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center p-6">
            <p className="text-3xl font-bold text-blue-600">98%</p>
            <p className="text-gray-600 text-sm">Cobro puntual</p>
          </Card>
          <Card className="text-center p-6">
            <p className="text-3xl font-bold text-blue-600">5 min</p>
            <p className="text-gray-600 text-sm">Crear contrato</p>
          </Card>
          <Card className="text-center p-6">
            <p className="text-3xl font-bold text-blue-600">24/7</p>
            <p className="text-gray-600 text-sm">Acceso a docs</p>
          </Card>
        </div>
      </div>

      {/* Beneficios */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Todo lo que necesitas para gestionar tus alquileres
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {beneficios.map((b, i) => (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <b.icon className="w-10 h-10 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{b.titulo}</h3>
                <p className="text-gray-600">{b.descripcion}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Empieza a gestionar tus propiedades hoy
          </h2>
          <p className="text-blue-100 mb-8">
            Prueba gratis durante 30 días. Sin tarjeta de crédito.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary">
              Crear Cuenta Gratis
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
