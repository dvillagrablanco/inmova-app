'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  UserCheck, 
  Target, 
  Phone, 
  Calendar, 
  TrendingUp,
  Mail,
  CheckCircle2,
  ArrowRight,
  Star,
} from 'lucide-react';

const beneficios = [
  {
    icon: Target,
    titulo: 'CRM Inmobiliario',
    descripcion: 'Gestiona leads, clientes y propiedades en un CRM diseñado para agentes.',
  },
  {
    icon: Calendar,
    titulo: 'Agenda de Visitas',
    descripcion: 'Programa y gestiona visitas con recordatorios automáticos.',
  },
  {
    icon: Phone,
    titulo: 'Seguimiento de Leads',
    descripcion: 'No pierdas ninguna oportunidad con el seguimiento automatizado.',
  },
  {
    icon: Mail,
    titulo: 'Email Marketing',
    descripcion: 'Envía propiedades a tu cartera de clientes con un clic.',
  },
  {
    icon: TrendingUp,
    titulo: 'Análisis de Ventas',
    descripcion: 'Visualiza tu rendimiento y objetivos en tiempo real.',
  },
  {
    icon: Star,
    titulo: 'Valoraciones',
    descripcion: 'Genera valoraciones automáticas basadas en datos del mercado.',
  },
];

export default function AgentesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-3xl">
            <div className="flex items-center space-x-2 mb-4">
              <UserCheck className="w-8 h-8" />
              <span className="text-amber-200 font-medium">Para Agentes Inmobiliarios</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Cierra más ventas, dedica menos tiempo a admin
            </h1>
            <p className="text-xl text-amber-100 mb-8">
              CRM inmobiliario completo con gestión de leads, agenda de visitas y marketing automatizado.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="lg" variant="secondary" className="text-amber-600">
                  Probar 14 días gratis
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
            <p className="text-3xl font-bold text-amber-600">+35%</p>
            <p className="text-gray-600 text-sm">Conversión</p>
          </Card>
          <Card className="text-center p-6">
            <p className="text-3xl font-bold text-amber-600">-50%</p>
            <p className="text-gray-600 text-sm">Tiempo admin</p>
          </Card>
          <Card className="text-center p-6">
            <p className="text-3xl font-bold text-amber-600">0</p>
            <p className="text-gray-600 text-sm">Leads perdidos</p>
          </Card>
        </div>
      </div>

      {/* Beneficios */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Herramientas que impulsan tus ventas
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {beneficios.map((b, i) => (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <b.icon className="w-10 h-10 text-amber-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{b.titulo}</h3>
                <p className="text-gray-600">{b.descripcion}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-amber-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Potencia tu carrera como agente
          </h2>
          <p className="text-amber-100 mb-8">
            14 días gratis. Sin tarjeta. Sin compromiso.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary">
              Empezar Prueba Gratuita
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
