'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WizardStepperProps {
  steps: string[];
  currentStep: number; // 0-based
  className?: string;
}

export function WizardStepper({ steps, currentStep, className }: WizardStepperProps) {
  return (
    <div className={cn('flex items-start justify-between', className)}>
      {steps.map((label, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isFuture = index > currentStep;

        return (
          <div key={index} className="flex flex-1 flex-col items-center">
            {/* Step circle and connector */}
            <div className="flex w-full items-center">
              {/* Connector line (before) */}
              {index > 0 && (
                <div
                  className={cn(
                    'h-0.5 flex-1',
                    isCompleted ? 'bg-green-500' : 'bg-muted'
                  )}
                />
              )}

              {/* Circle */}
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors',
                  isCompleted && 'bg-green-500 text-white',
                  isCurrent && 'bg-indigo-600 text-white',
                  isFuture && 'border-2 border-muted-foreground/30 bg-background text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>

              {/* Connector line (after) */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1',
                    isCompleted ? 'bg-green-500' : 'bg-muted'
                  )}
                />
              )}
            </div>

            {/* Label - hidden on mobile */}
            <span
              className={cn(
                'mt-2 hidden text-center text-xs font-medium sm:block',
                isCurrent ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
