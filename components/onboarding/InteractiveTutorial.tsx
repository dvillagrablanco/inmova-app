'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ChevronRight, ChevronLeft, CheckCircle, Play } from 'lucide-react';

export interface TutorialStep {
  title: string;
  description: string;
  targetSelector?: string;
  action?: 'click' | 'navigate' | 'observe';
  targetUrl?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  steps: TutorialStep[];
}

export const TUTORIALS: Tutorial[] = [
  {
    id: 'getting-started',
    title: 'Primeros pasos en INMOVA',
    description: 'Aprende a configurar tu cuenta y crear tu primer edificio en 5 minutos',
    estimatedMinutes: 5,
    steps: [
      { title: 'Bienvenido a INMOVA', description: 'Esta guía te enseñará a configurar tu cuenta paso a paso. Haz clic en "Siguiente" para comenzar.', position: 'center' },
      { title: 'Tu Dashboard', description: 'Este es tu panel principal. Aquí verás un resumen de tus propiedades, pagos, ocupación y morosidad. Los datos se llenan automáticamente conforme añades información.', targetSelector: '[data-testid="dashboard-stats"], .grid', position: 'bottom' },
      { title: 'Menú lateral', description: 'En el menú de la izquierda encontrarás todas las secciones: Edificios, Inquilinos, Contratos, Pagos, Mantenimiento y más. Las secciones se adaptan a tu plan y módulos activos.', targetSelector: 'nav', position: 'right' },
      { title: 'Crear tu primer edificio', description: 'Ve a "Edificios" en el menú lateral y haz clic en "Nuevo Edificio". Solo necesitas nombre, dirección y tipo de propiedad.', action: 'navigate', targetUrl: '/edificios', position: 'center' },
      { title: 'Añadir unidades', description: 'Dentro del edificio, añade las unidades individuales (viviendas, locales, garajes). Indica la superficie y renta mensual de cada una.', position: 'center' },
      { title: 'Registrar inquilino', description: 'Ve a "Inquilinos" y crea tu primer inquilino con nombre, DNI y email. El inquilino recibirá acceso automático a su portal.', action: 'navigate', targetUrl: '/inquilinos', position: 'center' },
      { title: 'Crear contrato', description: 'Ve a "Contratos" y vincula el inquilino con la unidad. Define fecha inicio, duración y renta. INMOVA generará los recibos automáticamente.', action: 'navigate', targetUrl: '/contratos', position: 'center' },
      { title: '¡Listo!', description: 'Ya tienes tu primera propiedad configurada. INMOVA se encarga automáticamente de:\n\n• Generar recibos mensuales\n• Enviar recordatorios de pago\n• Notificarte de vencimientos\n• Calcular tu rentabilidad', position: 'center' },
    ],
  },
  {
    id: 'payments-setup',
    title: 'Configurar cobros automáticos',
    description: 'Activa el cobro automático de rentas con Stripe',
    estimatedMinutes: 3,
    steps: [
      { title: 'Cobros automáticos', description: 'INMOVA puede cobrar las rentas automáticamente cada mes con Stripe. Tus inquilinos configuran su tarjeta una vez y se les cobra el día indicado.', position: 'center' },
      { title: 'Ir a Pagos', description: 'Navega a la sección de Pagos para ver todos los recibos pendientes y pagados.', action: 'navigate', targetUrl: '/pagos', position: 'center' },
      { title: 'Activar cobro automático', description: 'En cada contrato puedes activar el "Cobro automático". El inquilino recibe un email con enlace seguro para registrar su tarjeta.', position: 'center' },
      { title: 'Recordatorios', description: 'INMOVA envía recordatorios automáticos 3 y 1 días antes del vencimiento. Si hay impago, recibirás una alerta.', position: 'center' },
      { title: 'Dashboard de pagos', description: 'En el Dashboard verás el resumen: ingresos del mes, pagos pendientes, tasa de morosidad y evolución mensual.', action: 'navigate', targetUrl: '/dashboard', position: 'center' },
    ],
  },
  {
    id: 'maintenance-guide',
    title: 'Gestionar incidencias',
    description: 'Aprende a recibir y resolver incidencias de tus inquilinos',
    estimatedMinutes: 2,
    steps: [
      { title: 'Incidencias de mantenimiento', description: 'Tus inquilinos pueden reportar incidencias desde su portal. Tú las recibes como notificación y las gestionas desde aquí.', position: 'center' },
      { title: 'Ver incidencias', description: 'Navega a Mantenimiento para ver todas las incidencias activas, ordenadas por prioridad.', action: 'navigate', targetUrl: '/mantenimiento', position: 'center' },
      { title: 'Flujo de trabajo', description: 'Cada incidencia sigue el flujo: Pendiente → En Progreso → Resuelta. Puedes asignar proveedores y adjuntar fotos.', position: 'center' },
      { title: '¡Configurado!', description: 'Las incidencias se gestionan solas. El inquilino reporta, tú asignas, y el sistema notifica a todos los implicados automáticamente.', position: 'center' },
    ],
  },
];

interface InteractiveTutorialProps {
  tutorialId: string;
  onClose: () => void;
  onComplete: () => void;
}

export function InteractiveTutorial({ tutorialId, onClose, onComplete }: InteractiveTutorialProps) {
  const tutorial = TUTORIALS.find(t => t.id === tutorialId);
  const [currentStep, setCurrentStep] = useState(0);

  if (!tutorial) return null;

  const step = tutorial.steps[currentStep];
  const isLast = currentStep === tutorial.steps.length - 1;
  const progress = ((currentStep + 1) / tutorial.steps.length) * 100;

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      if (step.action === 'navigate' && step.targetUrl) {
        window.location.href = step.targetUrl;
      }
      setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[9998]" onClick={onClose} />
      <div className="fixed z-[9999] bottom-6 left-1/2 -translate-x-1/2 w-full max-w-lg px-4">
        <Card className="shadow-2xl border-indigo-200">
          <CardContent className="pt-4">
            {/* Progress */}
            <div className="flex items-center justify-between mb-3">
              <Badge variant="secondary" className="text-xs">
                Paso {currentStep + 1} de {tutorial.steps.length}
              </Badge>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-4">
              <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>

            {/* Content */}
            <h3 className="font-semibold text-base mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line mb-4">{step.description}</p>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" disabled={currentStep === 0} onClick={() => setCurrentStep(prev => prev - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
              </Button>
              <Button size="sm" onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700">
                {isLast ? (
                  <><CheckCircle className="h-4 w-4 mr-1" /> Finalizar</>
                ) : (
                  <>Siguiente <ChevronRight className="h-4 w-4 ml-1" /></>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

interface TutorialLauncherProps {
  className?: string;
}

export function TutorialLauncher({ className }: TutorialLauncherProps) {
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);
  const [completedTutorials, setCompletedTutorials] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('completed_tutorials');
      if (stored) setCompletedTutorials(JSON.parse(stored));
    } catch {}
  }, []);

  const handleComplete = (id: string) => {
    const updated = [...completedTutorials, id];
    setCompletedTutorials(updated);
    try { localStorage.setItem('completed_tutorials', JSON.stringify(updated)); } catch {}
    setActiveTutorial(null);
  };

  return (
    <>
      <Card className={className}>
        <CardContent className="pt-6">
          <h3 className="font-semibold text-lg mb-1">Tutoriales interactivos</h3>
          <p className="text-sm text-muted-foreground mb-4">Aprende a usar INMOVA paso a paso</p>
          <div className="space-y-3">
            {TUTORIALS.map(t => {
              const done = completedTutorials.includes(t.id);
              return (
                <button key={t.id} className="w-full text-left p-3 rounded-lg border hover:border-indigo-300 hover:bg-indigo-50/50 transition-all flex items-center gap-3"
                  onClick={() => setActiveTutorial(t.id)}>
                  {done ? (
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <Play className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${done ? 'text-muted-foreground line-through' : ''}`}>{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.estimatedMinutes} min · {t.steps.length} pasos</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {activeTutorial && (
        <InteractiveTutorial
          tutorialId={activeTutorial}
          onClose={() => setActiveTutorial(null)}
          onComplete={() => handleComplete(activeTutorial)}
        />
      )}
    </>
  );
}
