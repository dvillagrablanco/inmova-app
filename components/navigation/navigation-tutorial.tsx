'use client';

/**
 * NAVIGATION TUTORIAL
 * Tutorial interactivo para nuevos usuarios sobre el sistema de navegación
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Keyboard,
  Command,
  Search,
  Zap,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle,
  Home,
  Building2,
  Users,
  FileText,
  DollarSign,
  ArrowUpDown,
  MousePointer,
  Lightbulb,
  Play,
} from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  shortcuts: Array<{ keys: string; description: string }>;
  tip?: string;
  demo?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido al Sistema de Navegación!',
    description: 'Descubre cómo navegar por Inmova de forma ultrarrápida usando solo tu teclado.',
    icon: Lightbulb,
    shortcuts: [],
    tip: 'Este tutorial toma solo 2 minutos. Puedes omitirlo y verlo después presionando "?"',
  },
  {
    id: 'command-palette',
    title: 'Command Palette',
    description: 'Tu centro de comando. Busca cualquier cosa, navega a cualquier página y ejecuta acciones sin tocar el mouse.',
    icon: Command,
    shortcuts: [
      { keys: 'Cmd+K', description: 'Abrir Command Palette' },
      { keys: 'Ctrl+K', description: 'Abrir Command Palette (Windows/Linux)' },
    ],
    tip: 'Escribe "propiedades", "inquilinos" o cualquier acción y presiona Enter',
    demo: '🎬 Prueba ahora: Presiona Cmd+K (o Ctrl+K)',
  },
  {
    id: 'quick-navigation',
    title: 'Navegación Rápida (Estilo Gmail)',
    description: 'Usa secuencias de 2 teclas para navegar instantáneamente a cualquier sección.',
    icon: Zap,
    shortcuts: [
      { keys: 'G + D', description: 'Ir a Dashboard' },
      { keys: 'G + P', description: 'Ir a Propiedades' },
      { keys: 'G + T', description: 'Ir a Inquilinos' },
      { keys: 'G + C', description: 'Ir a Contratos' },
      { keys: 'G + $', description: 'Ir a Pagos' },
      { keys: 'G + M', description: 'Ir a Mantenimiento' },
    ],
    tip: 'Presiona "G" seguido de la letra. Tienes 1 segundo entre cada tecla.',
    demo: '🎬 Prueba: Presiona G luego P (sin mantener presionado)',
  },
  {
    id: 'quick-actions',
    title: 'Quick Actions',
    description: 'Botones contextuales inteligentes en cada página con contadores y accesos directos.',
    icon: MousePointer,
    shortcuts: [
      { keys: 'N', description: 'Crear nuevo en listas' },
      { keys: 'F', description: 'Focus en búsqueda' },
    ],
    tip: 'Los Quick Actions cambian según la página y muestran badges con contadores',
  },
  {
    id: 'tabs-navigation',
    title: 'Navegación por Tabs',
    description: 'Cambia entre tabs sin usar el mouse. Especialmente útil en páginas con múltiples tabs.',
    icon: ArrowUpDown,
    shortcuts: [
      { keys: '1', description: 'Ir al primer tab' },
      { keys: '2', description: 'Ir al segundo tab' },
      { keys: '3', description: 'Ir al tercer tab' },
      { keys: '4-9', description: 'Tabs 4 a 9' },
    ],
    tip: 'Útil en páginas como Pagos (Lista/Calendario/Stripe) y Mantenimiento',
    demo: '🎬 Ve a cualquier página con tabs y presiona 1, 2, 3...',
  },
  {
    id: 'list-navigation',
    title: 'Navegación en Listas (Estilo Vim)',
    description: 'Navega por listas de propiedades, inquilinos, contratos usando solo el teclado.',
    icon: Building2,
    shortcuts: [
      { keys: 'J', description: 'Siguiente elemento' },
      { keys: 'K', description: 'Elemento anterior' },
      { keys: 'Enter', description: 'Abrir elemento seleccionado' },
    ],
    tip: 'Prueba en cualquier lista: Propiedades, Inquilinos, Contratos, etc.',
    demo: '🎬 Ve a Propiedades y presiona J/K para navegar',
  },
  {
    id: 'other-shortcuts',
    title: 'Más Atajos Útiles',
    description: 'Otros shortcuts que te ahorrarán tiempo en tu día a día.',
    icon: Keyboard,
    shortcuts: [
      { keys: 'Cmd+H', description: 'Ir a Dashboard (Home)' },
      { keys: 'Cmd+/', description: 'Focus en búsqueda global' },
      { keys: 'Backspace', description: 'Volver atrás' },
      { keys: '?', description: 'Ver ayuda de shortcuts' },
      { keys: 'Esc', description: 'Cerrar modales' },
    ],
    tip: 'Presiona "?" en cualquier momento para ver la lista completa de shortcuts',
  },
  {
    id: 'customize',
    title: 'Personalización',
    description: 'Personaliza los shortcuts según tus preferencias. Cambia cualquier atajo de teclado.',
    icon: CheckCircle,
    shortcuts: [],
    tip: 'Ve a Configuración → Shortcuts para personalizar',
    demo: '✨ ¡Ya estás listo! Empieza a usar Inmova como un pro',
  },
];

const STORAGE_KEY = 'inmova_tutorial_completed';
const DONT_SHOW_KEY = 'inmova_tutorial_dont_show';

export function NavigationTutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showOnFirstVisit, setShowOnFirstVisit] = useState(false);

  useEffect(() => {
    // Verificar si es la primera visita
    const tutorialCompleted = localStorage.getItem(STORAGE_KEY);
    const dontShow = localStorage.getItem(DONT_SHOW_KEY);
    
    if (!tutorialCompleted && !dontShow) {
      // Mostrar después de 2 segundos en la primera visita
      const timer = setTimeout(() => {
        setIsOpen(true);
        setShowOnFirstVisit(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listener para abrir el tutorial manualmente
  useEffect(() => {
    const handleOpenTutorial = () => {
      setIsOpen(true);
      setCurrentStep(0);
    };

    window.addEventListener('open-navigation-tutorial', handleOpenTutorial);
    return () => window.removeEventListener('open-navigation-tutorial', handleOpenTutorial);
  }, []);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
    setCurrentStep(0);
  };

  const handleSkip = () => {
    localStorage.setItem(DONT_SHOW_KEY, 'true');
    setIsOpen(false);
    setCurrentStep(0);
  };

  const handleDontShowAgain = () => {
    localStorage.setItem(DONT_SHOW_KEY, 'true');
    setIsOpen(false);
  };

  const step = TUTORIAL_STEPS[currentStep];
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;
  const StepIcon = step.icon;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0">
          <Progress value={progress} className="h-1 rounded-none" />
        </div>

        <DialogHeader className="mt-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-lg bg-primary/10">
              <StepIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-2">
                Paso {currentStep + 1} de {TUTORIAL_STEPS.length}
              </Badge>
              <DialogTitle className="text-2xl">{step.title}</DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-base">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-4 py-4">
          {/* Shortcuts List */}
          {step.shortcuts.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {step.shortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between gap-4">
                      <span className="text-sm text-muted-foreground flex-1">
                        {shortcut.description}
                      </span>
                      <Badge variant="outline" className="font-mono text-sm gap-1 shrink-0">
                        {shortcut.keys.split('+').map((key, i) => (
                          <span key={i} className="inline-flex items-center">
                            {i > 0 && <span className="mx-1">+</span>}
                            <kbd className="px-2 py-1 rounded bg-muted text-xs font-semibold">
                              {key}
                            </kbd>
                          </span>
                        ))}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tip */}
          {step.tip && (
            <div className="flex gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950 dark:border-blue-800">
              <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Consejo
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {step.tip}
                </p>
              </div>
            </div>
          )}

          {/* Demo */}
          {step.demo && (
            <div className="flex gap-3 p-4 rounded-lg bg-green-50 border border-green-200 dark:bg-green-950 dark:border-green-800">
              <Play className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Pruébalo ahora
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {step.demo}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between border-t pt-4">
          <div className="flex gap-2">
            {showOnFirstVisit && currentStep === 0 && (
              <Button variant="ghost" size="sm" onClick={handleDontShowAgain}>
                No mostrar de nuevo
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Omitir tutorial
            </Button>
          </div>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
            )}
            
            {currentStep < TUTORIAL_STEPS.length - 1 ? (
              <Button onClick={handleNext}>
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleComplete} className="gap-2">
                <CheckCircle className="h-4 w-4" />
                ¡Empezar a usar!
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Botón para abrir el tutorial manualmente
 */
export function TutorialTrigger() {
  const handleOpen = () => {
    window.dispatchEvent(new CustomEvent('open-navigation-tutorial'));
  };

  return (
    <Button variant="outline" size="sm" onClick={handleOpen} className="gap-2">
      <Play className="h-4 w-4" />
      Ver Tutorial de Navegación
    </Button>
  );
}
