'use client';

import { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle, PlayCircle, BookOpen, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface HelpTooltipProps {
  title?: string;
  description: string;
  videoUrl?: string;
  articleUrl?: string;
  tips?: string[];
  examples?: string[];
  size?: 'sm' | 'md' | 'lg';
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export default function HelpTooltip({
  title,
  description,
  videoUrl,
  articleUrl,
  tips = [],
  examples = [],
  size = 'md',
  side = 'top',
  className = ''
}: HelpTooltipProps) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button 
            className={`inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors ${className}`}
            type="button"
          >
            <HelpCircle className={iconSize} />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          className="max-w-sm p-4 bg-popover text-popover-foreground shadow-lg border"
          sideOffset={5}
        >
          <div className="space-y-3">
            {title && (
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                {title}
              </h4>
            )}
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>

            {tips.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-semibold mb-2 text-primary">✨ Tips:</p>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    {tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {examples.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-semibold mb-2 text-primary">💡 Ejemplos:</p>
                  <ul className="text-xs space-y-1">
                    {examples.map((example, idx) => (
                      <li key={idx} className="bg-muted/50 p-2 rounded text-muted-foreground">
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {(videoUrl || articleUrl) && (
              <>
                <Separator />
                <div className="flex gap-2">
                  {videoUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => window.open(videoUrl, '_blank')}
                    >
                      <PlayCircle className="h-3 w-3 mr-1" />
                      Ver tutorial
                    </Button>
                  )}
                  {articleUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => window.open(articleUrl, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Leer más
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Componente simplificado para ayuda básica
export function QuickHelp({ text, className = '' }: { text: string; className?: string }) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button 
            className={`inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors ${className}`}
            type="button"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
