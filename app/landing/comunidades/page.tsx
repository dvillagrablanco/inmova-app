'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Building, 
  Vote, 
  Euro, 
  FileText, 
  Bell,
  Users,
  CheckCircle2,
  ArrowRight,
  Calendar,
} from 'lucide-react';

const beneficios = [
  {
    icon: Vote,
    titulo: 'Votaciones Online',
    descripcion: 'Realiza juntas y votaciones de forma digital con validez legal.',
  },
  {
    icon: Euro,
    titulo: 'Gestión de Cuotas',
    descripcion: 'Cobra cuotas comunitarias automáticamente y controla la morosidad.',
  },
  {
    icon: FileText,
    titulo: 'Actas Digitales',
    descripcion: 'Genera y almacena actas de reuniones de forma automática.',
  },
  {
    icon: Calendar,
    titulo: 'Convocatorias',
    descripcion: 'Convoca juntas y envía documentación a todos los propietarios.',
  },
  {
    icon: Bell,
    titulo: 'Comunicados',
    descripcion: 'Envía avisos y comunicados a toda la comunidad en segundos.',
  },
  {
    icon: Users,
    titulo: 'Portal del Vecino',
    descripcion: 'Cada vecino accede a sus pagos, documentos y votaciones.',
  },
];

export default function ComunidadesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-3xl">
            <div className="flex items-center space-x-2 mb-4">
              <Building className="w-8 h-8" />
              <span className="text-teal-200 font-medium">Para Comunidades de Propietarios</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Gestión de comunidades moderna y transparente
            </h1>
            <p className="text-xl text-teal-100 mb-8">
              Votaciones online, cobro de cuotas, actas digitales y comunicación fluida con todos los vecinos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/landing/demo">
                <Button size="lg" variant="secondary" className="text-teal-600">
                  Solicitar Demo
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/landing/contacto">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Contactar
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
            <p className="text-3xl font-bold text-teal-600">-80%</p>
            <p className="text-gray-600 text-sm">Morosidad</p>
          </Card>
          <Card className="text-center p-6">
            <p className="text-3xl font-bold text-teal-600">100%</p>
            <p className="text-gray-600 text-sm">Digital</p>
          </Card>
          <Card className="text-center p-6">
            <p className="text-3xl font-bold text-teal-600">Legal</p>
            <p className="text-gray-600 text-sm">Votaciones</p>
          </Card>
        </div>
      </div>

      {/* Beneficios */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Todo lo que tu comunidad necesita
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {beneficios.map((b, i) => (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <b.icon className="w-10 h-10 text-teal-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{b.titulo}</h3>
                <p className="text-gray-600">{b.descripcion}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-teal-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Moderniza la gestión de tu comunidad
          </h2>
          <p className="text-teal-100 mb-8">
            Demo gratuita y presupuesto sin compromiso
          </p>
          <Link href="/landing/contacto">
            <Button size="lg" variant="secondary">
              Solicitar Información
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
