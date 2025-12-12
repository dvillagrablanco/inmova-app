"use client";

import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Check, Lightbulb } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import logger from '@/lib/logger';

export interface QuickGuideStep {
  title: string;
  description: string;
  completed?: boolean;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

interface ModuleQuickGuideProps {
  moduleId: string;
  moduleName: string;
  steps: QuickGuideStep[];
  dismissible?: boolean;
  className?: string;
}

export function ModuleQuickGuide({
  moduleId,
  moduleName,
  steps,
  dismissible = true,
  className,
}: ModuleQuickGuideProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const storageKey = `module-guide-dismissed-${moduleId}`;
  const completedKey = `module-guide-completed-${moduleId}`;

  useEffect(() => {
    // Cargar estado de dismissal
    const dismissed = localStorage.getItem(storageKey);
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    // Cargar pasos completados
    const completed = localStorage.getItem(completedKey);
    if (completed) {
      try {
        const completedArray = JSON.parse(completed);
        setCompletedSteps(new Set(completedArray));
      } catch (e) {
        logger.error('Error loading completed steps:', e);
      }
    }
  }, [storageKey, completedKey]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(storageKey, 'true');
  };

  const handleToggleStep = (index: number) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedSteps(newCompleted);
    localStorage.setItem(completedKey, JSON.stringify([...newCompleted]));
  };

  const handleReset = () => {
    setCompletedSteps(new Set());
    setIsDismissed(false);
    localStorage.removeItem(storageKey);
    localStorage.removeItem(completedKey);
  };

  if (isDismissed) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleReset}
        className="text-xs text-muted-foreground"
        aria-label="Mostrar guía rápida nuevamente"
      >
        <Lightbulb className="h-3 w-3 mr-1" aria-hidden="true" />
        Mostrar guía rápida
      </Button>
    );
  }

  const completionPercentage = Math.round((completedSteps.size / steps.length) * 100);
  const allCompleted = completedSteps.size === steps.length;

  return (
    <Card className={cn('border-primary/20 bg-gradient-to-br from-primary/5 to-background', className)}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-2 flex-1">
            <Lightbulb className="h-5 w-5 text-primary mt-0.5 shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm">Guía rápida: {moduleName}</h3>
                {allCompleted && (
                  <Badge variant="default" className="text-xs">
                    <Check className="h-3 w-3 mr-1" aria-hidden="true" />
                    Completado
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {allCompleted
                  ? '¡Excelente! Has completado todos los pasos de la guía.'
                  : `${completedSteps.size} de ${steps.length} pasos completados (${completionPercentage}%)`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? 'Contraer guía' : 'Expandir guía'}
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
            {dismissible && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleDismiss}
                aria-label="Cerrar guía"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {!allCompleted && (
          <div className="w-full bg-secondary rounded-full h-1.5 mb-3" role="progressbar" aria-valuenow={completionPercentage} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        )}

        {/* Steps */}
        {isExpanded && (
          <div className="space-y-2">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.has(index);
              return (
                <div
                  key={index}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border transition-all',
                    isCompleted
                      ? 'bg-primary/5 border-primary/20'
                      : 'bg-background border-border hover:border-primary/30'
                  )}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleStep(index)}
                    className={cn(
                      'mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                      isCompleted
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground/30 hover:border-primary'
                    )}
                    aria-label={isCompleted ? `Marcar paso ${index + 1} como no completado` : `Marcar paso ${index + 1} como completado`}
                    aria-pressed={isCompleted}
                  >
                    {isCompleted && <Check className="h-3 w-3" aria-hidden="true" />}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className={cn('font-medium text-sm', isCompleted && 'text-muted-foreground')}>
                      {step.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                    {step.action && !isCompleted && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 mt-2 text-xs font-medium"
                        onClick={step.action.onClick}
                        asChild={!!step.action.href}
                      >
                        {step.action.href ? (
                          <a href={step.action.href}>{step.action.label} →</a>
                        ) : (
                          <span>{step.action.label} →</span>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Completion Message */}
        {allCompleted && isExpanded && (
          <div className="mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">
              🎉 ¡Felicitaciones! Ya dominas los conceptos básicos de este módulo. Explora funcionalidades avanzadas o contacta a soporte si necesitas ayuda.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
