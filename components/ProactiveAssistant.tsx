'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, HelpCircle, Lightbulb, Zap, ExternalLink, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import logger from '@/lib/logger';

interface ProactiveSuggestion {
  id: string;
  type: 'tip' | 'warning' | 'guide' | 'shortcut';
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  dismissible: boolean;
}

// Sugerencias contextuales por ruta
const CONTEXTUAL_SUGGESTIONS: Record<string, ProactiveSuggestion[]> = {
  '/dashboard': [
    {
      id: 'dashboard-customize',
      type: 'tip',
      title: '🎨 Personaliza tu Dashboard',
      description: 'Puedes reordenar las tarjetas arrastrándolas y ocultar las que no necesites.',
      action: {
        label: 'Ver Tutorial',
        href: '/knowledge-base?article=kb-001'
      },
      dismissible: true
    },
    {
      id: 'dashboard-bi',
      type: 'guide',
      title: '📊 Explora Business Intelligence',
      description: 'Obtén insights avanzados con nuestro módulo de BI y análisis predictivo.',
      action: {
        label: 'Ir a BI',
        href: '/bi'
      },
      dismissible: true
    }
  ],
  '/edificios': [
    {
      id: 'buildings-import',
      type: 'tip',
      title: '⚡ Importación Rápida',
      description: '¿Tienes muchos edificios? Puedes importarlos desde un archivo Excel.',
      action: {
        label: 'Ver Cómo',
        href: '/knowledge-base?article=kb-002'
      },
      dismissible: true
    },
    {
      id: 'buildings-map',
      type: 'guide',
      title: '🗺️ Vista de Mapa',
      description: 'Visualiza todos tus edificios en un mapa interactivo georreferenciado.',
      action: {
        label: 'Ver Mapa',
        href: '/edificios/mapa'
      },
      dismissible: true
    }
  ],
  '/inquilinos': [
    {
      id: 'tenants-screening',
      type: 'warning',
      title: '🔍 Verifica a tus Inquilinos',
      description: 'El screening automático reduce la morosidad hasta en un 70%. ¡Activa la verificación!',
      action: {
        label: 'Configurar',
        href: '/configuracion/screening'
      },
      dismissible: true
    },
    {
      id: 'tenants-portal',
      type: 'tip',
      title: '📱 Portal del Inquilino',
      description: 'Tus inquilinos pueden pagar, ver recibos y reportar incidencias desde su portal.',
      action: {
        label: 'Más Info',
        href: '/knowledge-base?article=kb-012'
      },
      dismissible: true
    }
  ],
  '/pagos': [
    {
      id: 'payments-auto',
      type: 'shortcut',
      title: '🤖 Automatiza los Cobros',
      description: 'Configura pagos recurrentes y olvídate de perseguir a los inquilinos cada mes.',
      action: {
        label: 'Configurar Ahora',
        href: '/automatizacion/pagos'
      },
      dismissible: true
    },
    {
      id: 'payments-reminders',
      type: 'tip',
      title: '🔔 Recordatorios Automáticos',
      description: 'Envía recordatorios de pago automáticamente 3 días antes del vencimiento.',
      action: {
        label: 'Activar',
        href: '/automatizacion/recordatorios'
      },
      dismissible: true
    }
  ],
  '/contratos': [
    {
      id: 'contracts-templates',
      type: 'tip',
      title: '📝 Plantillas Listas',
      description: 'Usa nuestras plantillas de contrato que cumplen toda la normativa vigente.',
      action: {
        label: 'Ver Plantillas',
        href: '/contratos/plantillas'
      },
      dismissible: true
    },
    {
      id: 'contracts-digital',
      type: 'guide',
      title: '✍️ Firma Digital',
      description: 'Los contratos con firma digital tienen validez legal completa y ahorran tiempo.',
      action: {
        label: 'Aprender Más',
        href: '/knowledge-base?article=kb-005'
      },
      dismissible: true
    }
  ],
  '/mantenimiento': [
    {
      id: 'maintenance-preventive',
      type: 'warning',
      title: '⚙️ Mantenimiento Preventivo',
      description: 'Programa revisiones periódicas para evitar problemas mayores y ahorrar costos.',
      action: {
        label: 'Programar',
        href: '/mantenimiento/preventivo'
      },
      dismissible: true
    },
    {
      id: 'maintenance-providers',
      type: 'tip',
      title: '👷 Red de Proveedores',
      description: 'Construye una base de datos de proveedores de confianza para respuestas rápidas.',
      action: {
        label: 'Gestionar',
        href: '/proveedores'
      },
      dismissible: true
    }
  ]
};

export default function ProactiveAssistant() {
  const pathname = usePathname();
  const [currentSuggestion, setCurrentSuggestion] = useState<ProactiveSuggestion | null>(null);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [showAssistant, setShowAssistant] = useState(false);

  useEffect(() => {
    // Cargar sugerencias descartadas del localStorage
    const dismissed = localStorage.getItem('dismissedSuggestions');
    if (dismissed) {
      setDismissedSuggestions(new Set(JSON.parse(dismissed)));
    }
  }, []);

  useEffect(() => {
    // Determinar si mostrar asistente basado en la ruta
    if (!pathname) return;
    
    const suggestions = CONTEXTUAL_SUGGESTIONS[pathname] || [];
    const availableSuggestions = suggestions.filter(
      (s: ProactiveSuggestion) => !dismissedSuggestions.has(s.id)
    );

    if (availableSuggestions.length > 0) {
      // Esperar 3 segundos antes de mostrar la primera sugerencia
      const timer = setTimeout(() => {
        setCurrentSuggestion(availableSuggestions[0]);
        setShowAssistant(true);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setShowAssistant(false);
    }
  }, [pathname, dismissedSuggestions]);

  const handleDismiss = () => {
    if (currentSuggestion) {
      const newDismissed = new Set(dismissedSuggestions);
      newDismissed.add(currentSuggestion.id);
      setDismissedSuggestions(newDismissed);
      localStorage.setItem('dismissedSuggestions', JSON.stringify(Array.from(newDismissed)));
    }
    setShowAssistant(false);
  };

  const handleDismissAll = () => {
    if (!pathname) return;
    
    const suggestions = CONTEXTUAL_SUGGESTIONS[pathname] || [];
    const newDismissed = new Set(dismissedSuggestions);
    suggestions.forEach((s: ProactiveSuggestion) => newDismissed.add(s.id));
    setDismissedSuggestions(newDismissed);
    localStorage.setItem('dismissedSuggestions', JSON.stringify(Array.from(newDismissed)));
    setShowAssistant(false);
  };

  if (!showAssistant || !currentSuggestion) return null;

  const getIcon = () => {
    switch (currentSuggestion.type) {
      case 'tip':
        return <Lightbulb className="h-5 w-5 text-yellow-600" />;
      case 'warning':
        return <HelpCircle className="h-5 w-5 text-orange-600" />;
      case 'guide':
        return <BookOpen className="h-5 w-5 text-blue-600" />;
      case 'shortcut':
        return <Zap className="h-5 w-5 text-purple-600" />;
      default:
        return <HelpCircle className="h-5 w-5" />;
    }
  };

  const getBackgroundColor = () => {
    switch (currentSuggestion.type) {
      case 'tip':
        return 'bg-yellow-50 border-yellow-200';
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      case 'guide':
        return 'bg-blue-50 border-blue-200';
      case 'shortcut':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        // Posicionado arriba del OnboardingChecklist cuando está en la izquierda
        className="fixed bottom-32 left-6 z-30 max-w-sm hidden lg:block lg:bottom-36 lg:left-6"
      >
        <Card className={`shadow-2xl border-2 ${getBackgroundColor()}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getIcon()}</div>
                <div className="flex-1">
                  <CardTitle className="text-base">
                    {currentSuggestion.title}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {currentSuggestion.description}
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mt-1 -mr-1"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          {currentSuggestion.action && (
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Link href={currentSuggestion.action.href} className="flex-1">
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={handleDismiss}
                  >
                    {currentSuggestion.action.label}
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismissAll}
                >
                  No mostrar más
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
