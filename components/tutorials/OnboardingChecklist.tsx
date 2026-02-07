'use client';

/**
 * CHECKLIST DE ONBOARDING
 * Muestra visualmente el progreso del usuario en configuración inicial
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  User,
  Building2,
  Users,
  FileText,
  Settings,
  Trophy,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { safeLocalStorage } from '@/lib/safe-storage';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  route: string;
  isCompleted: boolean;
  estimatedTime: number;
}

interface OnboardingChecklistProps {
  userId: string;
  isNewUser: boolean;
  onDismiss?: () => void;
}

const DISMISS_KEY = 'onboarding_checklist_dismissed';
const MINIMIZED_KEY = 'onboarding_checklist_minimized';

export function OnboardingChecklist({ userId, isNewUser, onDismiss }: OnboardingChecklistProps) {
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return safeLocalStorage.getItem(DISMISS_KEY) === 'true';
    } catch (error) {
      return false;
    }
  });
  const [isMinimized, setIsMinimized] = useState(() => {
    try {
      return safeLocalStorage.getItem(MINIMIZED_KEY) === 'true';
    } catch (error) {
      return false;
    }
  });
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      id: 'complete-profile',
      title: 'Completa tu perfil',
      description: 'Añade tu foto, teléfono y dirección',
      icon: User,
      route: '/configuracion',
      isCompleted: false,
      estimatedTime: 2
    },
    {
      id: 'add-property',
      title: 'Añade tu primera propiedad',
      description: 'Crea un edificio o inmueble',
      icon: Building2,
      route: '/edificios',
      isCompleted: false,
      estimatedTime: 5
    },
    {
      id: 'add-tenant',
      title: 'Registra un inquilino',
      description: 'Añade la información de tu arrendatario',
      icon: Users,
      route: '/inquilinos',
      isCompleted: false,
      estimatedTime: 3
    },
    {
      id: 'create-contract',
      title: 'Crea tu primer contrato',
      description: 'Genera un contrato desde plantilla',
      icon: FileText,
      route: '/contratos',
      isCompleted: false,
      estimatedTime: 7
    },
    {
      id: 'customize-experience',
      title: 'Personaliza tu experiencia',
      description: 'Ajusta nivel y funciones activas',
      icon: Settings,
      route: '/configuracion',
      isCompleted: false,
      estimatedTime: 2
    }
  ]);

  const router = useRouter();

  useEffect(() => {
    // Cargar estado del checklist desde el servidor
    const loadChecklist = async () => {
      try {
        const response = await fetch('/api/onboarding/checklist');
        if (response.ok) {
          const data = await response.json();
          // Verificar que checklist sea un array antes de usar .includes()
          if (Array.isArray(data.checklist)) {
            setChecklist(prev =>
              prev.map(item => ({
                ...item,
                isCompleted: data.checklist.includes(item.id)
              }))
            );
          }
        }
      } catch (error) {
        console.error('Error loading checklist:', error);
      }
    };

    loadChecklist();
  }, []);

  const handleItemClick = async (item: ChecklistItem) => {
    router.push(item.route);
  };

  const handleMarkComplete = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const updatedChecklist = checklist.map(item =>
      item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
    );

    setChecklist(updatedChecklist);

    // Guardar en servidor
    try {
      await fetch('/api/onboarding/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completedItems: updatedChecklist.filter(i => i.isCompleted).map(i => i.id)
        })
      });
    } catch (error) {
      console.error('Error saving checklist:', error);
    }
  };

  const completedCount = checklist.filter(item => item.isCompleted).length;
  const progress = (completedCount / checklist.length) * 100;
  const isComplete = completedCount === checklist.length;

  useEffect(() => {
    if (isComplete && !isDismissed && !isMinimized) {
      setIsMinimized(true);
      safeLocalStorage.setItem(MINIMIZED_KEY, 'true');
    }
  }, [isComplete, isDismissed, isMinimized]);

  if (isDismissed) {
    return null;
  }

  if (isMinimized) {
    return (
      // Posicionado en la izquierda para no solapar con chatbot
      <div className="fixed bottom-4 left-4 z-40 lg:bottom-6 lg:left-6">
        <Button
          onClick={() => {
            setIsMinimized(false);
            safeLocalStorage.setItem(MINIMIZED_KEY, 'false');
          }}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xl hover:shadow-2xl transition-all"
          size="default"
        >
          <Trophy className="w-4 h-4 mr-2" />
          {completedCount}/{checklist.length} Pasos
          <ChevronUp className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        // Posicionado en la izquierda para no solapar con chatbot
        className="fixed bottom-4 left-4 z-40 w-80 lg:w-96 lg:bottom-6 lg:left-6 max-h-[80vh]"
      >
        <Card className="bg-white shadow-2xl border-2 border-indigo-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  {isComplete ? (
                    <Trophy className="w-5 h-5" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    {isComplete ? '¡Configuración completa!' : 'Primeros Pasos'}
                  </h3>
                  <p className="text-xs text-indigo-100">
                    {isComplete
                      ? '¡Ya puedes usar todas las funciones!'
                      : `${completedCount} de ${checklist.length} completados`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsMinimized(true);
                    safeLocalStorage.setItem(MINIMIZED_KEY, 'true');
                  }}
                  className="text-white hover:bg-white/20"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
                {onDismiss && isComplete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      safeLocalStorage.setItem(DISMISS_KEY, 'true');
                      setIsDismissed(true);
                      onDismiss();
                    }}
                    className="text-white hover:bg-white/20"
                  >
                    ✕
                  </Button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Progreso</span>
                <span className="font-semibold">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2 bg-indigo-400" />
            </div>
          </div>

          {/* Checklist items */}
          <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
            {isComplete ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">¡Enhorabuena!</h4>
                <p className="text-gray-600 mb-4">
                  Has completado todos los pasos iniciales. Ya estás listo para gestionar tus propiedades como un profesional.
                </p>
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Configuración Completa
                </Badge>
              </motion.div>
            ) : (
              checklist.map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div
                      onClick={() => !item.isCompleted && handleItemClick(item)}
                      className={`p-3 rounded-lg border-2 transition-all cursor-pointer group ${
                        item.isCompleted
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={(e) => handleMarkComplete(item.id, e)}
                          className="mt-0.5 flex-shrink-0"
                        >
                          {item.isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400 group-hover:text-indigo-400" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className={`w-4 h-4 flex-shrink-0 ${
                              item.isCompleted ? 'text-green-600' : 'text-gray-400'
                            }`} />
                            <h4 className={`font-semibold text-sm ${
                              item.isCompleted ? 'text-green-900' : 'text-gray-900'
                            }`}>
                              {item.title}
                            </h4>
                          </div>
                          <p className={`text-xs ${
                            item.isCompleted ? 'text-green-700' : 'text-gray-600'
                          }`}>
                            {item.description}
                          </p>
                          {!item.isCompleted && (
                            <div className="flex items-center gap-3 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                ~{item.estimatedTime} min
                              </Badge>
                              <span className="text-xs text-indigo-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                                Empezar
                                <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Footer tip */}
          {!isComplete && (
            <div className="border-t p-3 bg-gray-50">
              <p className="text-xs text-gray-600 text-center">
                💡 <strong>Consejo:</strong> Completa estos pasos para aprovechar al máximo la plataforma
              </p>
            </div>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
