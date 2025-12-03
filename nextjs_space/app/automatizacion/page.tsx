'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Home, Wand2, CheckCircle, Zap, Bot, BookOpen, MessageSquare, Sparkles } from 'lucide-react';
import WizardDialog from '@/components/automation/WizardDialog';
import { AIAssistant } from '@/components/automation/AIAssistant';
import { initialSetupWizard, createBuildingWizard, createTenantWizard } from '@/lib/wizard-config';
import { toast } from 'sonner';

export default function AutomatizacionPage() {
  const router = useRouter();
  const [activeWizard, setActiveWizard] = useState<string | null>(null);

  const features = [
    {
      icon: <Wand2 className="h-8 w-8" />,
      title: 'Wizards Inteligentes',
      description: 'Asistentes paso a paso que guían todo el proceso',
      color: 'from-purple-500 to-pink-500',
      action: () => setActiveWizard('building'),
      buttonText: 'Probar Wizard',
    },
    {
      icon: <Bot className="h-8 w-8" />,
      title: 'Asistente IA 24/7',
      description: 'Chatbot inteligente que responde consultas al instante',
      color: 'from-blue-500 to-cyan-500',
      action: () => toast.info('Haz clic en el botón flotante abajo a la derecha'),
      buttonText: 'Ver Asistente',
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: 'Sugerencias Proactivas',
      description: 'IA que detecta oportunidades y sugiere acciones',
      color: 'from-green-500 to-emerald-500',
      action: () => router.push('/dashboard'),
      buttonText: 'Ver en Dashboard',
    },
    {
      icon: <CheckCircle className="h-8 w-8" />,
      title: 'Checklist Onboarding',
      description: 'Progreso visual con guía paso a paso',
      color: 'from-orange-500 to-red-500',
      action: () => router.push('/dashboard'),
      buttonText: 'Ver Checklist',
    },
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: 'Tickets Automáticos',
      description: 'Categorización y respuesta automática de tickets',
      color: 'from-indigo-500 to-purple-500',
      action: () => router.push('/soporte'),
      buttonText: 'Probar Sistema',
    },
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: 'Base de Conocimientos',
      description: 'Búsqueda inteligente en documentación',
      color: 'from-yellow-500 to-orange-500',
      action: () => router.push('/knowledge-base'),
      buttonText: 'Explorar',
    },
  ];

  const handleWizardComplete = async (data: any) => {
    console.log('Wizard completed with data:', data);
    toast.success('¡Wizard completado exitosamente!');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Breadcrumb className="mb-6">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Sistema de Automatización</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Hero Section */}
            <div className="mb-12 text-center">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-100 to-purple-100 px-4 py-2 rounded-full mb-6">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-semibold text-indigo-900">
                  Sistema de Automatización con IA
                </span>
              </div>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Automatización Total de Soporte y Onboarding
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Elimina la intervención humana con nuestro sistema completo de asistentes
                inteligentes, wizards guiados y respuestas automáticas.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/50 group"
                >
                  <CardHeader>
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}
                    >
                      {feature.icon}
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors">
                      {feature.title}
                    </CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={feature.action}
                      className="w-full gradient-primary"
                      size="lg"
                    >
                      {feature.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Benefits Section */}
            <Card className="mb-12 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
              <CardHeader>
                <CardTitle className="text-2xl">Beneficios de la Automatización</CardTitle>
                <CardDescription>
                  Cómo nuestra IA transforma tu experiencia en INMOVA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Ahorro de Tiempo</h3>
                      <p className="text-sm text-muted-foreground">
                        Reduce hasta 80% el tiempo de configuración y gestión diaria con nuestros
                        wizards y automatizaciones.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Respuestas Instantáneas</h3>
                      <p className="text-sm text-muted-foreground">
                        El asistente IA responde consultas en segundos, 24/7, sin esperas ni
                        horarios.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Cero Errores</h3>
                      <p className="text-sm text-muted-foreground">
                        Los wizards validan datos en tiempo real y previenen errores comunes de
                        entrada.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Sugerencias Inteligentes</h3>
                      <p className="text-sm text-muted-foreground">
                        La IA analiza tu uso y sugiere proactivamente acciones para optimizar tu
                        gestión.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Demo Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Prueba los Wizards Ahora</CardTitle>
                <CardDescription>
                  Experimenta cómo los asistentes paso a paso simplifican tareas complejas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => setActiveWizard('setup')}
                    variant="outline"
                    size="lg"
                    className="h-auto py-6 flex flex-col gap-2"
                  >
                    <Wand2 className="h-6 w-6 text-purple-600" />
                    <span className="font-semibold">Configuración Inicial</span>
                    <span className="text-xs text-muted-foreground">4 pasos</span>
                  </Button>
                  <Button
                    onClick={() => setActiveWizard('building')}
                    variant="outline"
                    size="lg"
                    className="h-auto py-6 flex flex-col gap-2"
                  >
                    <Wand2 className="h-6 w-6 text-indigo-600" />
                    <span className="font-semibold">Crear Edificio</span>
                    <span className="text-xs text-muted-foreground">4 pasos</span>
                  </Button>
                  <Button
                    onClick={() => setActiveWizard('tenant')}
                    variant="outline"
                    size="lg"
                    className="h-auto py-6 flex flex-col gap-2"
                  >
                    <Wand2 className="h-6 w-6 text-blue-600" />
                    <span className="font-semibold">Registrar Inquilino</span>
                    <span className="text-xs text-muted-foreground">4 pasos</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Wizards */}
      <WizardDialog
        open={activeWizard === 'setup'}
        onClose={() => setActiveWizard(null)}
        title="Configuración Inicial"
        description="Completa la configuración de tu cuenta en pocos minutos"
        steps={initialSetupWizard}
        onComplete={handleWizardComplete}
      />

      <WizardDialog
        open={activeWizard === 'building'}
        onClose={() => setActiveWizard(null)}
        title="Crear Edificio"
        description="Registra un nuevo edificio con el asistente"
        steps={createBuildingWizard}
        onComplete={handleWizardComplete}
      />

      <WizardDialog
        open={activeWizard === 'tenant'}
        onClose={() => setActiveWizard(null)}
        title="Registrar Inquilino"
        description="Añade un nuevo inquilino al sistema"
        steps={createTenantWizard}
        onComplete={handleWizardComplete}
      />

      <AIAssistant />
    </div>
  );
}
