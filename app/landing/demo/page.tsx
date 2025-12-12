'use client';
export const dynamic = 'force-dynamic';


import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Home,
  Hotel,
  Hammer,
  Briefcase,
  Users,
  ArrowLeft,
  Play,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import logger from '@/lib/logger';;

type BusinessVertical = {
  id: string;
  title: string;
  description: string;
  icon: any;
  features: string[];
  gradient: string;
};

const businessVerticals: BusinessVertical[] = [
  {
    id: 'alquiler_tradicional',
    title: 'Alquiler Tradicional',
    description: 'Gestión de alquileres residenciales y comerciales de largo plazo',
    icon: Building2,
    features: ['Contratos', 'Pagos automáticos', 'Portal inquilinos', 'Mantenimiento'],
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'coliving',
    title: 'Coliving / Habitaciones',
    description: 'Gestión de coliving y alquiler por habitaciones con prorrateo automático',
    icon: Home,
    features: [
      'Prorrateo servicios',
      'Gestión individual',
      'Calendario limpieza',
      'Contratos flexibles',
    ],
    gradient: 'from-teal-500 to-green-600',
  },
  {
    id: 'str_vacacional',
    title: 'STR / Alquiler Vacacional',
    description: 'Gestión de alquileres vacacionales con channel manager integrado',
    icon: Hotel,
    features: ['Airbnb/Booking sync', 'Pricing dinámico', 'Calendario reservas', 'Check-in/out'],
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    id: 'flipping',
    title: 'House Flipping',
    description: 'Gestión de inversiones inmobiliarias y renovaciones',
    icon: Hammer,
    features: ['ROI automático', 'Timeline renovación', 'Presupuestos', 'Tracking gastos'],
    gradient: 'from-green-500 to-teal-500',
  },
  {
    id: 'servicios_profesionales',
    title: 'Servicios Profesionales',
    description: 'Para arquitectos, aparejadores y consultores inmobiliarios',
    icon: Briefcase,
    features: ['Portfolio proyectos', 'CRM clientes', 'Entregables', 'Facturación'],
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'mixto',
    title: 'Multi-Vertical',
    description: 'Gestión de múltiples modelos de negocio en una sola plataforma',
    icon: Users,
    features: ['Todos los módulos', 'Dashboards unificados', 'Reportes consolidados', 'Vista 360°'],
    gradient: 'from-indigo-500 to-violet-500',
  },
];

export default function DemoPage() {
  const router = useRouter();
  const [selectedVertical, setSelectedVertical] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartDemo = async (verticalId: string) => {
    setSelectedVertical(verticalId);
    setIsLoading(true);

    try {
      // Send notification to super admins about demo request
      await fetch('/api/landing/demo-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verticalId,
          email: 'demo-user@inmova.app', // You can collect this from a form if needed
          name: 'Usuario Demo',
        }),
      });
    } catch (error) {
      logger.error('Error al notificar solicitud de demo:', error);
      // Continue even if notification fails
    }

    // Redirect to register with the vertical preselected
    setTimeout(() => {
      router.push(`/register?vertical=${verticalId}&demo=true`);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-violet-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/landing"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Building2 className="h-6 w-6 text-indigo-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                INMOVA
              </span>
            </Link>
            <Link href="/landing">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-gradient-to-r from-indigo-100 to-violet-100 text-indigo-700 border-indigo-200 px-4 py-2">
              <Sparkles className="h-4 w-4 mr-2 inline" />
              Demo Interactiva
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Explora INMOVA según tu Negocio
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Selecciona tu modelo de negocio para ver una demo adaptada con datos precargados y
              funcionalidades específicas
            </p>
          </div>

          {/* Vertical Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {businessVerticals.map((vertical) => (
              <Card
                key={vertical.id}
                className={`group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 ${
                  selectedVertical === vertical.id
                    ? 'border-indigo-500 ring-2 ring-indigo-200'
                    : 'hover:border-indigo-300'
                }`}
                onClick={() => !isLoading && setSelectedVertical(vertical.id)}
              >
                <CardHeader>
                  <div
                    className={`p-3 bg-gradient-to-br ${vertical.gradient} rounded-xl w-fit mb-3 group-hover:scale-110 transition-transform`}
                  >
                    <vertical.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-indigo-600 transition-colors">
                    {vertical.title}
                  </CardTitle>
                  <CardDescription className="text-sm">{vertical.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {vertical.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${selectedVertical === vertical.id ? 'bg-gradient-to-r from-indigo-600 to-violet-600' : ''}`}
                    variant={selectedVertical === vertical.id ? 'default' : 'outline'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartDemo(vertical.id);
                    }}
                    disabled={isLoading}
                  >
                    {isLoading && selectedVertical === vertical.id ? (
                      'Preparando demo...'
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Ver Demo
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">
              ¿Prefieres una Demo Personalizada?
            </h3>
            <p className="text-indigo-100 mb-6">
              Agenda una llamada con nuestro equipo para una presentación adaptada a tus necesidades
              específicas
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/landing/contacto">
                <Button
                  size="lg"
                  className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold"
                >
                  Contactar con Ventas
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/30 font-semibold"
                >
                  Prueba Gratis 30 Días
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
