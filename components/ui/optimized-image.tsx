'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Componente OptimizedImage - Optimiza la carga de imágenes
 * 
 * Características:
 * - Lazy loading automático (excepto con priority=true)
 * - Blur placeholder mientras carga
 * - Fallback a imagen por defecto si falla
 * - Soporte para Next.js Image optimization
 * - Responsive con sizes
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  objectFit = 'cover',
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  sizes,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Imagen por defecto si falla la carga
  const fallbackSrc = '/placeholder-image.svg';

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    setIsLoading(false);
    onError?.();
  };

  // Si fill=true, no usar width/height
  const imageDimensions = fill
    ? {}
    : {
        width: width || 400,
        height: height || 300,
      };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
      <Image
        src={imageError ? fallbackSrc : src}
        alt={alt}
        {...imageDimensions}
        fill={fill}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          fill && `object-${objectFit}`
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
      />
    </div>
  );
}

/**
 * Variante OptimizedImageCard - Para usar en cards con aspect ratio fijo
 */
export function OptimizedImageCard({
  src,
  alt,
  className,
  aspectRatio = 'video', // 16:9
  ...props
}: Omit<OptimizedImageProps, 'fill' | 'width' | 'height'> & {
  aspectRatio?: 'video' | 'square' | 'portrait' | 'landscape';
}) {
  const aspectRatioClass = {
    video: 'aspect-video',
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
  }[aspectRatio];

  return (
    <div className={cn('relative', aspectRatioClass, className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        objectFit="cover"
        {...props}
      />
    </div>
  );
}

/**
 * Variante OptimizedAvatar - Para imágenes de perfil circulares
 */
export function OptimizedAvatar({
  src,
  alt,
  size = 'md',
  className,
  ...props
}: Omit<OptimizedImageProps, 'fill' | 'width' | 'height'> & {
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  }[size];

  return (
    <div className={cn('relative rounded-full overflow-hidden', sizeClasses, className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        objectFit="cover"
        {...props}
      />
    </div>
  );
}
