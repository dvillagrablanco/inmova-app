'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { X, ArrowRight, ArrowLeft, Check, PlayCircle, BookOpen, Sparkles, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  detailedContent: string[];
  action?: { label: string; route: string };
  videoUrl?: string;
  tips: string[];
  icon: string;
  estimatedTime: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido a INMOVA! 🚀',
    description: 'La plataforma más completa para gestión inmobiliaria',
    detailedContent: [
      'INMOVA automatiza todos tus procesos inmobiliarios',
      'Accede a 88 módulos especializados',
      'Inteligencia artificial incluida en toda la plataforma',
      'Soporte 24/7 con chatbot inteligente',
    ],
    tips: [
      'Este tour toma solo 3 minutos',
      'Puedes saltarlo y volver después desde Ayuda',
      'Todos los módulos tienen tutoriales integrados',
    ],
    icon: '🎉',
    estimatedTime: '30 seg',
    videoUrl: 'https://www.youtube.com/embed/zm55Gdl5G1Q',
  },
  {
    id: 'buildings',
    title: 'Paso 1: Gestiona tus Edificios',
    description: 'Registra y administra todas tus propiedades',
    detailedContent: [
      'Crea edificios con información completa',
      'Sube fotos, planos y documentos',
      'Organiza por zonas y grupos',
      'Vista en mapa georreferenciado',
    ],
    action: { label: 'Crear Primer Edificio', route: '/edificios/nuevo' },
    tips: [
      'Puedes importar edificios desde Excel',
      'Cada edificio puede tener unidades ilimitadas',
      'Configura alertas de mantenimiento preventivo',
    ],
    icon: '🏛️',
    estimatedTime: '45 seg',
    videoUrl: 'https://www.youtube.com/embed/zm55Gdl5G1Q',
  },
  {
    id: 'units',
    title: 'Paso 2: Configura Unidades',
    description: 'Define apartamentos, locales y habitaciones',
    detailedContent: [
      'Crea diferentes tipos de unidades',
      'Gestiona disponibilidad en tiempo real',
      'Configura precios dinámicos',
      'Alquiler tradicional o por habitaciones',
    ],
    action: { label: 'Ver Unidades', route: '/unidades' },
    tips: [
      'Las unidades vacías se destacan automáticamente',
      'Puedes clonar configuraciones para ahorrar tiempo',
      'Sistema de pricing dinámico basado en temporada',
    ],
    icon: '🏠',
    estimatedTime: '40 seg',
    videoUrl: 'https://www.youtube.com/embed/zm55Gdl5G1Q',
  },
  {
    id: 'tenants',
    title: 'Paso 3: Administra Inquilinos',
    description: 'Screening, contratos y comunicación',
    detailedContent: [
      'Sistema de verificación automático',
      'Scoring de solvencia con IA',
      'Portal de autoservicio para inquilinos',
      'Chat integrado y notificaciones',
    ],
    action: { label: 'Gestionar Inquilinos', route: '/inquilinos' },
    tips: [
      'El screening reduce morosidad en 70%',
      'Inquilinos pueden pagar online desde su portal',
      'Sistema de referencias automático',
    ],
    icon: '👥',
    estimatedTime: '50 seg',
    videoUrl: 'https://www.youtube.com/embed/zm55Gdl5G1Q',
  },
  {
    id: 'automation',
    title: 'Paso 4: Automatiza Todo',
    description: 'Ahorra tiempo con automatizaciones inteligentes',
    detailedContent: [
      'Recordatorios de pago automáticos',
      'Renovación de contratos sin intervención',
      'Gestión de morosidad automatizada',
      'Reportes y análisis periódicos',
    ],
    action: { label: 'Configurar Automatizaciones', route: '/automatizacion' },
    tips: [
      'Las automatizaciones ahorran 15 horas/semana',
      'IA predice morosidad con 85% de precisión',
      'Workflows personalizables sin código',
    ],
    icon: '⚡',
    estimatedTime: '45 seg',
    videoUrl: 'https://www.youtube.com/embed/zm55Gdl5G1Q',
  },
  {
    id: 'dashboard',
    title: 'Tu Dashboard Inteligente',
    description: 'Visualiza todo tu negocio en tiempo real',
    detailedContent: [
      'KPIs actualizados en tiempo real',
      'Análisis predictivo con IA',
      'Alertas proactivas de problemas',
      'Módulo BI con 50+ reportes',
    ],
    action: { label: 'Explorar Dashboard', route: '/dashboard' },
    tips: [
      'Dashboard personalizable a tus necesidades',
      'Exporta cualquier gráfico con un clic',
      'Acceso móvil completo',
    ],
    icon: '📊',
    estimatedTime: '30 seg',
    videoUrl: 'https://www.youtube.com/embed/zm55Gdl5G1Q',
  },
  {
    id: 'complete',
    title: '¡Listo para Empezar! ✨',
    description: 'Ya conoces los fundamentos de INMOVA',
    detailedContent: [
      'Tienes acceso a 88 módulos completos',
      'Soporte 24/7 con chatbot IA',
      'Base de conocimiento con 100+ artículos',
      'Webinars mensuales gratuitos',
    ],
    tips: [
      'Usa el chatbot IA si tienes dudas (ícono abajo a la derecha)',
      'Cada módulo tiene ayuda contextual',
      'Explora los 88 módulos desde el menú lateral',
    ],
    icon: '🎖️',
    estimatedTime: '30 seg',
  },
];

interface OnboardingTourEnhancedProps {
  onComplete: () => void;
}

export function OnboardingTourEnhanced({ onComplete }: OnboardingTourEnhancedProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTour, setShowTour] = useState(true);
  const [watchedVideo, setWatchedVideo] = useState(false);
  const router = useRouter();

  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;
  const step = ONBOARDING_STEPS[currentStep];

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setWatchedVideo(false);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setShowTour(false);
    onComplete();
  };

  const handleComplete = () => {
    setShowTour(false);
    onComplete();
  };

  const handleAction = () => {
    if (step.action) {
      router.push(step.action.route);
      handleComplete();
    }
  };

  if (!showTour) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-3xl max-h-[95vh] overflow-y-auto"
      >
        <Card className="w-full shadow-2xl border-2 border-primary/20">
          <CardHeader className="relative pb-3 px-4 sm:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 sm:right-4 sm:top-4 hover:bg-gray-100 h-8 w-8 sm:h-10 sm:w-10"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="flex items-start gap-2 sm:gap-4">
              <div className="text-4xl sm:text-6xl flex-shrink-0">{step.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                  <CardTitle className="text-lg sm:text-2xl leading-tight">{step.title}</CardTitle>
                  <Badge variant="outline" className="text-xs self-start">
                    {step.estimatedTime}
                  </Badge>
                </div>
                <CardDescription className="text-sm sm:text-base">
                  {step.description}
                </CardDescription>
              </div>
            </div>

            <Progress value={progress} className="mt-3 sm:mt-4 h-2" />
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              Paso {currentStep + 1} de {ONBOARDING_STEPS.length}
            </p>
          </CardHeader>

          <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
            {/* Video Tutorial */}
            {step.videoUrl && (
              <div className="bg-gray-100 rounded-lg p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                    <PlayCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    Video Tutorial
                  </h4>
                  {watchedVideo && (
                    <Badge variant="default" className="text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      Visto
                    </Badge>
                  )}
                </div>
                <div className="aspect-video bg-gray-200 rounded overflow-hidden">
                  <iframe
                    src={step.videoUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={() => setWatchedVideo(true)}
                  />
                </div>
              </div>
            )}

            {/* Contenido Detallado */}
            <div>
              <h4 className="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                ¿Qué puedes hacer?
              </h4>
              <ul className="space-y-2">
                {step.detailedContent.map((content, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-2 text-xs sm:text-sm"
                  >
                    <span className="text-primary mt-0.5 flex-shrink-0">✓</span>
                    <span className="flex-1">{content}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-900 text-sm sm:text-base">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                Consejos Pro
              </h4>
              <ul className="space-y-1.5">
                {step.tips.map((tip, index) => (
                  <li
                    key={index}
                    className="text-xs sm:text-sm text-blue-800 flex items-start gap-2"
                  >
                    <span className="text-blue-600 flex-shrink-0">•</span>
                    <span className="flex-1">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0 pt-4 border-t px-4 sm:px-6">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="w-full sm:w-auto text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {currentStep < ONBOARDING_STEPS.length - 1 && (
                <Button variant="ghost" onClick={handleSkip} className="w-full sm:w-auto text-sm">
                  Saltar tour
                </Button>
              )}

              {step.action && (
                <Button
                  onClick={handleAction}
                  className="gradient-primary shadow-lg w-full sm:w-auto text-sm"
                >
                  <span className="truncate">{step.action.label}</span>
                  <Zap className="h-4 w-4 ml-2 flex-shrink-0" />
                </Button>
              )}

              {!step.action && (
                <Button
                  onClick={handleNext}
                  className="gradient-primary shadow-lg w-full sm:w-auto text-sm"
                >
                  {currentStep === ONBOARDING_STEPS.length - 1 ? (
                    <>
                      <Check className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">Comenzar a usar INMOVA</span>
                    </>
                  ) : (
                    <>
                      Siguiente
                      <ArrowRight className="h-4 w-4 ml-2 flex-shrink-0" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
