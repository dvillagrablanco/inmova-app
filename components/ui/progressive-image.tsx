'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useProgressiveImage } from '@/lib/hooks/useProgressiveImage';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  placeholderSrc?: string;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  sizes?: string;
  threshold?: number;
  rootMargin?: string;
  onLoad?: () => void;
}

/**
 * ProgressiveImage - Componente de imagen optimizado con lazy loading progresivo
 * 
 * Características:
 * - Lazy loading con Intersection Observer
 * - Placeholder de baja calidad mientras carga
 * - Transición suave entre placeholder y imagen final
 * - Compatible con Next.js Image component
 * - Configuración personalizable de threshold y rootMargin
 * 
 * @example
 * ```tsx
 * <ProgressiveImage
 *   src="/images/property.jpg"
 *   alt="Propiedad"
 *   width={400}
 *   height={300}
 *   placeholderSrc="/images/property-thumb.jpg"
 * />
 * ```
 */
export function ProgressiveImage({
  src,
  alt,
  width,
  height,
  fill = false,
  placeholderSrc,
  className,
  containerClassName,
  priority = false,
  sizes,
  threshold = 0.01,
  rootMargin = '50px',
  onLoad,
}: ProgressiveImageProps) {
  const { imageSrc, isLoading, imgRef } = useProgressiveImage({
    src,
    placeholderSrc,
    threshold,
    rootMargin,
  });

  // Si es priority, usar Next.js Image directamente sin lazy loading
  if (priority) {
    return (
      <div
        className={cn('relative overflow-hidden', containerClassName)}
        style={{ aspectRatio: width && height ? `${width}/${height}` : undefined }}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          fill={fill}
          priority
          sizes={sizes}
          className={cn('object-cover', className)}
          onLoad={onLoad}
        />
      </div>
    );
  }

  return (
    <div
      ref={imgRef as any}
      className={cn(
        'relative overflow-hidden bg-muted',
        containerClassName
      )}
      style={{ aspectRatio: width && height ? `${width}/${height}` : undefined }}
    >
      {/* Placeholder */}
      {isLoading && placeholderSrc && (
        <div
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted/80 to-muted"
        >
          <Image
            src={placeholderSrc}
            alt={`${alt} (cargando)`}
            width={width}
            height={height}
            fill={fill}
            className={cn(
              'object-cover blur-sm scale-105 transition-all duration-300',
              className
            )}
            unoptimized
          />
        </div>
      )}

      {/* Loading skeleton si no hay placeholder */}
      {isLoading && !placeholderSrc && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted/80 to-muted" />
      )}

      {/* Imagen principal */}
      {imageSrc && (
        <Image
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          fill={fill}
          sizes={sizes}
          className={cn(
            'object-cover transition-opacity duration-500',
            isLoading ? 'opacity-0' : 'opacity-100',
            className
          )}
          onLoad={() => {
            if (onLoad) onLoad();
          }}
          loading="lazy"
        />
      )}
    </div>
  );
}

/**
 * ProgressiveImageGrid - Grid optimizado para múltiples imágenes
 * Carga imágenes progresivamente a medida que entran en el viewport
 */
interface ProgressiveImageGridProps {
  images: Array<{
    src: string;
    alt: string;
    placeholderSrc?: string;
  }>;
  columns?: 2 | 3 | 4;
  gap?: number;
  aspectRatio?: string;
  className?: string;
}

export function ProgressiveImageGrid({
  images,
  columns = 3,
  gap = 4,
  aspectRatio = '4/3',
  className,
}: ProgressiveImageGridProps) {
  return (
    <div
      className={cn(
        'grid',
        columns === 2 && 'grid-cols-1 sm:grid-cols-2',
        columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        `gap-${gap}`,
        className
      )}
    >
      {images.map((image, index) => (
        <div key={index} style={{ aspectRatio }}>
          <ProgressiveImage
            src={image.src}
            alt={image.alt}
            fill
            placeholderSrc={image.placeholderSrc}
            priority={index < 2} // Priorizar las primeras 2 imágenes
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      ))}
    </div>
  );
}
