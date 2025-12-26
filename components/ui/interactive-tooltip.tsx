'use client';

import { ReactNode, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Lightbulb, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InteractiveTooltipProps {
  children: ReactNode;
  title?: string;
  description: string;
  type?: 'info' | 'tip' | 'warning' | 'success';
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Tooltip interactivo con acciones y diferentes tipos
 * Mejora la intuitividad de la UI
 */
export function InteractiveTooltip({
  children,
  title,
  description,
  type = 'info',
  action,
  className,
}: InteractiveTooltipProps) {
  const [open, setOpen] = useState(false);

  const icons = {
    info: Info,
    tip: Lightbulb,
    warning: AlertCircle,
    success: CheckCircle,
  };

  const colors = {
    info: 'text-blue-500',
    tip: 'text-yellow-500',
    warning: 'text-orange-500',
    success: 'text-green-500',
  };

  const Icon = icons[type];

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side="top"
          className={cn(
            'max-w-xs p-4 bg-white border border-gray-200 shadow-xl rounded-lg',
            className
          )}
        >
          <div className="space-y-2">
            {title && (
              <div className="flex items-center gap-2">
                <Icon className={cn('h-4 w-4', colors[type])} />
                <h4 className="font-semibold text-sm">{title}</h4>
              </div>
            )}
            <p className="text-sm text-gray-600">{description}</p>
            {action && (
              <button
                onClick={() => {
                  action.onClick();
                  setOpen(false);
                }}
                className="mt-2 w-full px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors"
              >
                {action.label}
              </button>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
