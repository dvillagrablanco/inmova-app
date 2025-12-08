/**
 * OptimizedImage Component
 * Provides automatic AVIF/WebP format support with blur placeholders
 * Uses Next.js Image component with modern optimizations
 */

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Generate a simple blur placeholder
 */
function generateBlurPlaceholder(width: number = 8, height: number = 8): string {
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  if (!canvas) {
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  }
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, width, height);
  }
  return canvas.toDataURL();
}

/**
 * OptimizedImage with automatic format detection and blur placeholder
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill,
  className,
  priority = false,
  quality = 85,
  sizes,
  objectFit = 'cover',
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  if (hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground',
          className
        )}
        style={{ width, height }}
      >
        <svg
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {isLoading && (
        <div
          className="absolute inset-0 bg-muted animate-pulse"
          style={{ zIndex: 1 }}
        />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        priority={priority}
        quality={quality}
        sizes={sizes}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          fill && `object-${objectFit}`
        )}
        placeholder={placeholder}
        blurDataURL={blurDataURL || generateBlurPlaceholder()}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

/**
 * Optimized Image with aspect ratio container
 */
interface ResponsiveImageProps extends Omit<OptimizedImageProps, 'fill'> {
  aspectRatio?: string; // e.g., "16/9", "4/3", "1/1"
}

export function ResponsiveImage({
  aspectRatio = '16/9',
  className,
  ...props
}: ResponsiveImageProps) {
  return (
    <div
      className={cn('relative w-full bg-muted', className)}
      style={{ aspectRatio }}
    >
      <OptimizedImage {...props} fill objectFit="cover" />
    </div>
  );
}

/**
 * Gallery grid of optimized images
 */
interface ImageGalleryProps {
  images: Array<{ src: string; alt: string; id?: string }>;
  columns?: number;
  gap?: number;
  aspectRatio?: string;
  onImageClick?: (index: number) => void;
}

export function ImageGallery({
  images,
  columns = 3,
  gap = 4,
  aspectRatio = '1/1',
  onImageClick,
}: ImageGalleryProps) {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: `${gap * 0.25}rem`,
      }}
    >
      {images.map((image, index) => (
        <div
          key={image.id || index}
          className={cn(
            'cursor-pointer transition-transform hover:scale-105',
            onImageClick && 'cursor-pointer'
          )}
          onClick={() => onImageClick?.(index)}
        >
          <ResponsiveImage
            src={image.src}
            alt={image.alt}
            aspectRatio={aspectRatio}
          />
        </div>
      ))}
    </div>
  );
}
