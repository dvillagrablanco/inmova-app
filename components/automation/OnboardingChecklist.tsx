'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronRight, Trophy, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getOnboardingProgress, type OnboardingProgress } from '@/lib/ai-automation-service';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import logger, { logError } from '@/lib/logger';

interface OnboardingChecklistProps {
  userId: string;
}

export function OnboardingChecklist({ userId }: OnboardingChecklistProps) {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const router = useRouter();
  const { width, height } = useWindowSize();

  useEffect(() => {
    loadProgress();
    // Check if was dismissed
    const dismissed = localStorage.getItem('onboardingChecklistDismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, [userId]);

  const loadProgress = async () => {
    try {
      const data = await getOnboardingProgress(userId);
      setProgress(data);

      // Show confetti if 100% complete and not shown before
      if (data.percentage === 100) {
        const confettiShown = sessionStorage.getItem('confettiShown');
        if (!confettiShown) {
          setShowConfetti(true);
          sessionStorage.setItem('confettiShown', 'true');
          setTimeout(() => setShowConfetti(false), 5000);
        }
      }
    } catch (error) {
      logger.error('Error loading progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('onboardingChecklistDismissed', 'true');
  };

  const handleAction = (route: string) => {
    router.push(route);
  };

  if (isDismissed || isLoading || !progress) return null;

  // Si ya está 100% completo, mostrar solo si no fue colapsado
  if (progress.percentage === 100 && isCollapsed) return null;

  return (
    <>
      {showConfetti && (
        <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />
      )}

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-6"
        >
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-white to-indigo-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {progress.percentage === 100 ? (
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-white" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {progress.percentage}%
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg">
                      {progress.percentage === 100
                        ? '¡Felicitaciones! 🎉'
                        : 'Completa tu configuración'}
                    </CardTitle>
                    <CardDescription>
                      {progress.percentage === 100
                        ? 'Has completado todos los pasos del onboarding'
                        : `${progress.completedSteps.length} de ${progress.totalSteps} pasos completados`}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  {progress.percentage < 100 && (
                    <Button size="sm" variant="ghost" onClick={() => setIsCollapsed(!isCollapsed)}>
                      {isCollapsed ? 'Mostrar' : 'Ocultar'}
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleDismiss}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {!isCollapsed && <Progress value={progress.percentage} className="mt-4 h-2" />}
            </CardHeader>

            {!isCollapsed && progress.percentage < 100 && (
              <CardContent className="space-y-3">
                {progress.steps?.map((step: any) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                      step.completed
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          step.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {step.completed ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <span className="text-xs font-bold">
                            {(progress.steps?.indexOf(step) ?? -1) + 1}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{step.title}</p>
                        {step.required && !step.completed && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            Requerido
                          </Badge>
                        )}
                      </div>
                    </div>
                    {!step.completed && <ChevronRight className="h-5 w-5 text-gray-400" />}
                  </motion.div>
                ))}

                {progress.nextRecommendedAction && (
                  <div className="pt-4 mt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-3">
                      👉 Siguiente paso recomendado:
                    </p>
                    <Button
                      onClick={() => handleAction(progress.nextRecommendedAction!.route)}
                      className="w-full gradient-primary shadow-primary"
                      size="lg"
                    >
                      {progress.nextRecommendedAction.title}
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            )}

            {progress.percentage === 100 && !isCollapsed && (
              <CardContent>
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    ¡Excelente trabajo! Has completado todos los pasos esenciales. Ahora estás listo
                    para aprovechar al máximo INMOVA.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => router.push('/dashboard')} className="gradient-primary">
                      Ir al Dashboard
                    </Button>
                    <Button variant="outline" onClick={handleDismiss}>
                      Cerrar
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
