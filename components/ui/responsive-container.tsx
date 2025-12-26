import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

const maxWidthClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
};

const paddingClasses = {
  none: '',
  sm: 'px-4 py-2',
  md: 'px-6 py-4',
  lg: 'px-8 py-6',
};

/**
 * Contenedor responsive que asegura:
 * - Márgenes apropiados en mobile (320px+)
 * - Contenido centrado en pantallas grandes
 * - Padding consistente
 */
export function ResponsiveContainer({
  children,
  maxWidth = 'xl',
  padding = 'md',
  className,
}: ResponsiveContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        // Responsive padding para mobile
        'px-4 sm:px-6 lg:px-8',
        className
      )}
    >
      {children}
    </div>
  );
}
