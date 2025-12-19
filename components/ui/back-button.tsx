'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  /**
   * Ruta personalizada a la que volver. Si no se proporciona, usa router.back()
   */
  href?: string;
  /**
   * Texto del botón. Por defecto: "Atrás"
   */
  label?: string;
  /**
   * Variante del botón
   */
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'secondary';
  /**
   * Tamaño del botón
   */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /**
   * Clases CSS adicionales
   */
  className?: string;
  /**
   * Si true, muestra solo el icono sin texto
   */
  iconOnly?: boolean;
}

/**
 * Componente de botón de navegación "Atrás"
 * Proporciona una forma consistente de volver a la página anterior
 * 
 * Ejemplos de uso:
 * ```tsx
 * // Botón básico que vuelve a la página anterior
 * <BackButton />
 * 
 * // Botón con ruta personalizada
 * <BackButton href="/edificios" label="Volver a Edificios" />
 * 
 * // Botón solo icono
 * <BackButton iconOnly variant="ghost" />
 * ```
 */
export function BackButton({
  href,
  label = 'Atrás',
  variant = 'outline',
  size = 'default',
  className,
  iconOnly = false
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <Button
      variant={variant}
      size={iconOnly ? 'icon' : size}
      onClick={handleClick}
      className={cn(
        'gap-2',
        iconOnly && 'h-9 w-9',
        className
      )}
      aria-label={iconOnly ? label : undefined}
    >
      <ArrowLeft className={cn(
        'h-4 w-4',
        !iconOnly && 'flex-shrink-0'
      )} />
      {!iconOnly && <span>{label}</span>}
    </Button>
  );
}
