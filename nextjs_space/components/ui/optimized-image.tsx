/**
 * Optimized Image Component
 * Wrapper around Next/Image with loading states and error handling
 */

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoadingComplete'> {
  containerClassName?: string;
  fallbackSrc?: string;
}

export function OptimizedImage({
  src,
  alt,
  className,
  containerClassName,
  priority = false,
  fallbackSrc = '/placeholder-image.svg',
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <div className={cn('relative overflow-hidden bg-muted', containerClassName)}>
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}
      <Image
        src={error ? fallbackSrc : imgSrc}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        priority={priority}
        quality={85}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setError(true);
          setImgSrc(fallbackSrc);
          setIsLoading(false);
        }}
        {...props}
      />
    </div>
  );
}

/**
 * AspectRatioImage - Image with fixed aspect ratio container
 */
interface AspectRatioImageProps extends OptimizedImageProps {
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape' | number;
}

export function AspectRatioImage({
  aspectRatio = 'video',
  containerClassName,
  ...props
}: AspectRatioImageProps) {
  const aspectClass = typeof aspectRatio === 'number'
    ? ''
    : {
        square: 'aspect-square',
        video: 'aspect-video',
        portrait: 'aspect-[2/3]',
        landscape: 'aspect-[3/2]',
      }[aspectRatio];

  const style = typeof aspectRatio === 'number'
    ? { aspectRatio: aspectRatio.toString() }
    : {};

  return (
    <div
      className={cn('relative', aspectClass, containerClassName)}
      style={style}
    >
      <OptimizedImage
        {...props}
        fill
        className={cn('object-cover', props.className)}
      />
    </div>
  );
}
