import Image, { ImageProps } from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImageProps, 'onError'> {
  fallbackClassName?: string;
  showErrorMessage?: boolean;
}

/**
 * Componente de imagen optimizado con:
 * - Lazy loading automático
 * - Placeholder blur
 * - Manejo de errores
 * - Formatos modernos (AVIF/WebP)
 * - Optimización automática de Next.js
 */
export function OptimizedImage({
  src,
  alt,
  className,
  fallbackClassName,
  priority = false,
  quality = 85,
  showErrorMessage = false,
  ...props
}: OptimizedImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (error) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground text-sm',
          fallbackClassName || className
        )}
      >
        {showErrorMessage ? '⚠️ Error al cargar imagen' : null}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={cn(
        'transition-opacity duration-300',
        loading ? 'opacity-0' : 'opacity-100',
        className
      )}
      priority={priority}
      loading={priority ? undefined : 'lazy'}
      quality={quality}
      placeholder="blur"
      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmM2Y0ZjYiLz48L3N2Zz4="
      onError={() => setError(true)}
      onLoad={() => setLoading(false)}
      {...props}
    />
  );
}

/**
 * Componente de imagen optimizado con aspect ratio fijo
 */
interface OptimizedImageWithAspectRatioProps extends OptimizedImageProps {
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape' | string;
  containerClassName?: string;
}

export function OptimizedImageWithAspectRatio({
  aspectRatio = 'video',
  containerClassName,
  ...props
}: OptimizedImageWithAspectRatioProps) {
  const aspectRatioClass =
    {
      square: 'aspect-square',
      video: 'aspect-video',
      portrait: 'aspect-[3/4]',
      landscape: 'aspect-[4/3]',
    }[aspectRatio] || aspectRatio;

  return (
    <div className={cn('relative bg-muted', aspectRatioClass, containerClassName)}>
      <OptimizedImage {...props} fill className="object-cover" />
    </div>
  );
}
