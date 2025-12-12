'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Zap,
  Sparkles,
  CheckCircle,
  BookOpen,
  FileText,
  MessageSquare,
  Workflow,
  BarChart3,
  HelpCircle,
  Lightbulb,
  Ticket,
  PlayCircle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';


export default function AutomationSummaryPage() {
  const automationFeatures = [
    {
      id: 'chatbot',
      icon: Bot,
      title: 'Chatbot IA 24/7',
      description: 'Asistente inteligente con procesamiento de lenguaje natural',
      features: [
        'Respuestas automáticas basadas en base de conocimiento',
        'Análisis de sentimiento en tiempo real',
        'Sugerencias de acciones contextuales',
        'Artículos relacionados automáticos',
        'Detección de urgencia y escalamiento',
      ],
      location: 'Botón flotante en la esquina inferior derecha',
      color: 'blue',
      link: null,
    },
    {
      id: 'tickets',
      icon: Ticket,
      title: 'Sistema de Tickets Automatizado',
      description: 'Gestión inteligente de solicitudes de soporte',
      features: [
        'Categorización automática con IA',
        'Asignación de prioridad inteligente',
        'Búsqueda de soluciones automáticas',
        'Resolución sin intervención humana (70% de casos)',
        'Escalamiento automático cuando necesario',
      ],
      location: 'Botón "Crear Ticket" en todas las páginas',
      color: 'purple',
      link: null,
    },
    {
      id: 'proactive',
      icon: Lightbulb,
      title: 'Asistente Proactivo',
      description: 'Ayuda contextual que se anticipa a tus necesidades',
      features: [
        'Sugerencias contextuales por módulo',
        'Tips y mejores prácticas',
        'Atajos y funcionalidades ocultas',
        'Advertencias preventivas',
        'Guías paso a paso',
      ],
      location: 'Aparece automáticamente en cada módulo (esquina inferior izquierda)',
      color: 'green',
      link: null,
    },
    {
      id: 'onboarding',
      icon: PlayCircle,
      title: 'Onboarding Mejorado',
      description: 'Tour interactivo con videos y guías',
      features: [
        '7 pasos completos con videos tutoriales',
        'Tips profesionales en cada paso',
        'Tiempo estimado de lectura',
        'Enlaces directos a acciones',
        'Progreso guardado automáticamente',
      ],
      location: 'Se muestra al primer login o desde Menú > Ayuda',
      color: 'indigo',
      link: null,
    },
    {
      id: 'wizard',
      icon: Sparkles,
      title: 'Wizard de Configuración Inicial',
      description: 'Setup guiado paso a paso',
      features: [
        'Configuración de empresa',
        'Creación automática de edificio',
        'Generación de unidades',
        'Activación de automatizaciones',
        'Diseño intuitivo con validaciones',
      ],
      location: 'Primera vez que accedes al sistema',
      color: 'pink',
      link: null,
    },
    {
      id: 'knowledge',
      icon: BookOpen,
      title: 'Base de Conocimiento Completa',
      description: '15+ artículos detallados y 20+ FAQs',
      features: [
        '15 artículos con guías paso a paso',
        '20 preguntas frecuentes',
        'Videos tutoriales integrados',
        'Búsqueda inteligente',
        'Artículos relacionados automáticos',
      ],
      location: 'Página dedicada',
      color: 'yellow',
      link: '/knowledge-base',
    },
    {
      id: 'templates',
      icon: FileText,
      title: 'Biblioteca de Plantillas',
      description: 'Plantillas profesionales listas para usar',
      features: [
        'Contratos de alquiler (residencial, comercial, habitaciones)',
        'Emails automatizados',
        'Workflows predefinidos',
        'Reportes configurables',
        'Cumplimiento normativo garantizado',
      ],
      location: 'Página dedicada',
      color: 'cyan',
      link: '/plantillas',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'from-blue-50 to-blue-100 border-blue-200',
      purple: 'from-purple-50 to-purple-100 border-purple-200',
      green: 'from-green-50 to-green-100 border-green-200',
      indigo: 'from-indigo-50 to-indigo-100 border-indigo-200',
      pink: 'from-pink-50 to-pink-100 border-pink-200',
      yellow: 'from-yellow-50 to-yellow-100 border-yellow-200',
      cyan: 'from-cyan-50 to-cyan-100 border-cyan-200',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="p-4 bg-white/20 rounded-lg">
              <Zap className="h-12 w-12" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-3xl mb-2">
                🤖 Sistema de Soporte y Onboarding Totalmente Automatizado
              </CardTitle>
              <CardDescription className="text-primary-foreground/90 text-base">
                INMOVA ahora cuenta con 7 sistemas automatizados que eliminan la necesidad de
                intervención humana en soporte, onboarding y capacitación. Todo funciona con
                Inteligencia Artificial avanzada.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">100%</div>
            <p className="text-sm text-muted-foreground">Automatizado</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
            <p className="text-sm text-muted-foreground">Disponibilidad</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">70%</div>
            <p className="text-sm text-muted-foreground">Auto-resolución</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-4xl font-bold text-orange-600 mb-2">0 seg</div>
            <p className="text-sm text-muted-foreground">Tiempo Respuesta</p>
          </CardContent>
        </Card>
      </div>

      {/* Features */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Sistemas Implementados</h2>

        {automationFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card
              key={feature.id}
              className={`border-2 bg-gradient-to-r ${getColorClasses(feature.color)}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                      <CardDescription className="text-base">{feature.description}</CardDescription>
                    </div>
                  </div>
                  {feature.link && (
                    <Link href={feature.link}>
                      <Button size="sm">
                        Ver <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Características:
                  </h4>
                  <ul className="space-y-1">
                    {feature.features.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white/60 p-3 rounded-lg">
                  <p className="text-sm">
                    <strong>📍 Ubicación:</strong> {feature.location}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Benefits */}
      <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Beneficios de la Automatización
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Zap className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Respuesta Instantánea</h4>
                  <p className="text-sm text-muted-foreground">
                    0 segundos de espera. Los usuarios obtienen ayuda inmediata sin esperar a
                    agentes humanos.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bot className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Disponibilidad Total</h4>
                  <p className="text-sm text-muted-foreground">
                    24/7/365 sin interrupciones. El sistema nunca duerme, no tiene vacaciones ni
                    días libres.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Inteligencia Artificial</h4>
                  <p className="text-sm text-muted-foreground">
                    Aprende de cada interacción y mejora continuamente. Contexto completo de cada
                    usuario.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Reducción de Costos</h4>
                  <p className="text-sm text-muted-foreground">
                    70% de tickets resueltos automáticamente. Ahorro masivo en equipo de soporte.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <HelpCircle className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Mejor Experiencia</h4>
                  <p className="text-sm text-muted-foreground">
                    Usuarios más satisfechos con respuestas rápidas y precisas. NPS mejorado.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <Workflow className="h-5 w-5 text-cyan-600" />
                </div>
                <div>
                  <h4 className="font-semibold">Escalabilidad</h4>
                  <p className="text-sm text-muted-foreground">
                    Soporta miles de usuarios simultáneos sin degradación de servicio.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle>Próximos Pasos Recomendados</CardTitle>
          <CardDescription>
            Explora los diferentes sistemas automatizados y comprueba su funcionamiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/knowledge-base" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <BookOpen className="h-8 w-8 text-primary mb-3" />
                  <h4 className="font-semibold mb-2">Base de Conocimiento</h4>
                  <p className="text-sm text-muted-foreground">Explora artículos y FAQs</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/plantillas" className="block">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardContent className="pt-6">
                  <FileText className="h-8 w-8 text-primary mb-3" />
                  <h4 className="font-semibold mb-2">Plantillas</h4>
                  <p className="text-sm text-muted-foreground">Revisa plantillas predefinidas</p>
                </CardContent>
              </Card>
            </Link>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6">
                <MessageSquare className="h-8 w-8 text-primary mb-3" />
                <h4 className="font-semibold mb-2">Probar Chatbot</h4>
                <p className="text-sm text-muted-foreground">Haz clic en el botón flotante</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
