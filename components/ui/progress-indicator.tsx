'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep?: string;
  className?: string;
}

export function ProgressIndicator({ steps, currentStep, className }: ProgressIndicatorProps) {
  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <div className={cn('space-y-4', className)}>
      <Progress value={progress} className="h-2" />
      <div className="space-y-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border transition-colors',
              step.status === 'in_progress' && 'bg-primary/5 border-primary',
              step.status === 'completed' && 'bg-green-50 border-green-200',
              step.status === 'error' && 'bg-red-50 border-red-200'
            )}
          >
            {step.status === 'pending' && (
              <div className="h-5 w-5 rounded-full border-2 border-muted" />
            )}
            {step.status === 'in_progress' && (
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            )}
            {step.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
            {step.status === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
            <span
              className={cn(
                'text-sm font-medium',
                step.status === 'pending' && 'text-muted-foreground',
                step.status === 'in_progress' && 'text-primary',
                step.status === 'completed' && 'text-green-600',
                step.status === 'error' && 'text-red-600'
              )}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
      <div className="text-sm text-muted-foreground text-center">
        {completedCount} de {steps.length} completados ({Math.round(progress)}%)
      </div>
    </div>
  );
}

interface SimpleProgressProps {
  current: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
}

export function SimpleProgress({
  current,
  total,
  label,
  showPercentage = true,
}: SimpleProgressProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          {showPercentage && <span className="font-medium">{percentage}%</span>}
        </div>
      )}
      <Progress value={percentage} className="h-2" />
      {!label && showPercentage && (
        <div className="text-sm text-muted-foreground text-center">
          {current} / {total} ({percentage}%)
        </div>
      )}
    </div>
  );
}
