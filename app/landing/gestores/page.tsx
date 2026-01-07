'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Briefcase, 
  Users, 
  BarChart3, 
  FileText, 
  Euro,
  Building2,
  CheckCircle2,
  ArrowRight,
  Zap,
} from 'lucide-react';

const beneficios = [
  {
    icon: Building2,
    titulo: 'Multi-Propietario',
    descripcion: 'Gestiona propiedades de múltiples clientes desde un único panel.',
  },
  {
    icon: Users,
    titulo: 'Portal del Propietario',
    descripcion: 'Cada propietario accede a sus propiedades e informes en tiempo real.',
  },
  {
    icon: BarChart3,
    titulo: 'Informes Avanzados',
    descripcion: 'Genera informes de rentabilidad, ocupación y morosidad automáticamente.',
  },
  {
    icon: Euro,
    titulo: 'Facturación Integrada',
    descripcion: 'Cobra a tus clientes y gestiona tu propia contabilidad.',
  },
  {
    icon: Zap,
    titulo: 'Automatización',
    descripcion: 'Cobros, recordatorios, renovaciones y más, todo automático.',
  },
  {
    icon: FileText,
    titulo: 'White-Label',
    descripcion: 'Personaliza la plataforma con tu marca para tus clientes.',
  },
];

export default function GestoresPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-3xl">
            <div className="flex items-center space-x-2 mb-4">
              <Briefcase className="w-8 h-8" />
              <span className="text-purple-200 font-medium">Para Gestores</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Escala tu negocio de gestión inmobiliaria
            </h1>
            <p className="text-xl text-purple-100 mb-8">
              Gestiona cientos de propiedades de múltiples propietarios con la eficiencia de un equipo pequeño.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/landing/demo">
                <Button size="lg" variant="secondary" className="text-purple-600">
                  Solicitar Demo
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/landing/contacto">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Contactar Ventas
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
            <p className="text-3xl font-bold text-purple-600">∞</p>
            <p className="text-gray-600 text-sm">Propiedades</p>
          </Card>
          <Card className="text-center p-6">
            <p className="text-3xl font-bold text-purple-600">-60%</p>
            <p className="text-gray-600 text-sm">Tiempo admin</p>
          </Card>
          <Card className="text-center p-6">
            <p className="text-3xl font-bold text-purple-600">API</p>
            <p className="text-gray-600 text-sm">Integraciones</p>
          </Card>
        </div>
      </div>

      {/* Beneficios */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Herramientas profesionales para gestores
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {beneficios.map((b, i) => (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <b.icon className="w-10 h-10 text-purple-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{b.titulo}</h3>
                <p className="text-gray-600">{b.descripcion}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Profesionaliza tu gestión inmobiliaria
          </h2>
          <p className="text-purple-100 mb-8">
            Prueba gratis 30 días. Planes Business desde €149/mes.
          </p>
          <Link href="/landing/demo">
            <Button size="lg" variant="secondary">
              Solicitar Demo Personalizada
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
