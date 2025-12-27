/**
 * Página de Onboarding
 * Muestra el progreso de configuración inicial del usuario
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { usePageTracking } from '@/lib/hooks/usePageTracking';
import { trackOnboardingStart } from '@/lib/analytics-service';

import { OnboardingProgressTracker } from '@/components/onboarding/OnboardingProgressTracker';
import OnboardingChatbot from '@/components/onboarding/OnboardingChatbot';
import { ContextualHelp } from '@/components/ui/contextual-help';
import { LoadingState } from '@/components/ui/loading-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Rocket,
  CheckCircle,
  BookOpen,
  MessageCircle,
  Play,
  Lightbulb,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Page tracking
  usePageTracking('/onboarding', 'Onboarding - INMOVA');

  // Track onboarding start (solo una vez)
  useEffect(() => {
    if (session?.user?.id) {
      trackOnboardingStart(
        session.user.id,
        (session.user as any).vertical,
        (session.user as any).experienceLevel
      );
    }
  }, [session?.user?.id]);

  // Redireccionar si no está autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <LoadingState message="Cargando configuración..." />;
  }

  if (!session) {
    return null;
  }

  const handleTaskComplete = (taskId: string) => {
    console.log('Tarea completada:', taskId);
  };

  const handleTaskSkip = (taskId: string) => {
    console.log('Tarea saltada:', taskId);
  };

  return (
    <AuthenticatedLayout>
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Rocket className="h-8 w-8 text-primary" />
                  Configuración Inicial
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                  Completa estos pasos para activar todas las funcionalidades de INMOVA
                </p>
              </div>

              {/* Ayuda contextual */}
              <ContextualHelp
                title="¿Cómo funciona el onboarding?"
                content={[
                  'Cada tarea te guiará paso a paso para configurar INMOVA según tu negocio.',
                  'Las tareas marcadas como "Obligatorio" son esenciales para usar la plataforma.',
                  'Puedes saltar tareas no obligatorias y completarlas después.',
                  'El tiempo estimado es aproximado. Puedes ir a tu ritmo.',
                ]}
              />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna principal: Tracker de progreso */}
            <div className="lg:col-span-2">
              <OnboardingProgressTracker
                userId={session.user.id}
                onTaskComplete={handleTaskComplete}
                onTaskSkip={handleTaskSkip}
              />
            </div>

            {/* Columna lateral: Recursos y ayuda */}
            <div className="space-y-6">
              {/* Beneficios de completar */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      ¿Por qué completar la configuración?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🚀</span>
                      <div>
                        <h4 className="font-semibold text-sm">Acceso completo</h4>
                        <p className="text-xs text-muted-foreground">
                          Desbloquea los 88 módulos de INMOVA
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="text-2xl">⏱️</span>
                      <div>
                        <h4 className="font-semibold text-sm">Ahorra tiempo</h4>
                        <p className="text-xs text-muted-foreground">
                          Automatiza procesos desde el día 1
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🎯</span>
                      <div>
                        <h4 className="font-semibold text-sm">Configuración personalizada</h4>
                        <p className="text-xs text-muted-foreground">
                          Adaptado a tu modelo de negocio
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recursos de ayuda */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Lightbulb className="h-5 w-5 text-yellow-600" />
                      Recursos de Ayuda
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.open('/docs/video-tutorials', '_blank')}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Video Tutoriales
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.open('/docs', '_blank')}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Base de Conocimiento
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        console.log('Abrir chat de soporte');
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat con Soporte
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Consejos rápidos */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-900">💡 Consejos Pro</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>Puedes pausar y volver cuando quieras</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>Cada wizard tiene ayuda contextual</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>Usa datos de ejemplo si aún no tienes los tuyos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>El chatbot IA está disponible 24/7</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* Chatbot flotante */}
      <OnboardingChatbot />
    </AuthenticatedLayout>
  );
}
