import { useState, useEffect, useRef } from 'react';

interface UseProgressiveImageOptions {
  src: string;
  placeholderSrc?: string;
  threshold?: number;
  rootMargin?: string;
}

export function useProgressiveImage({
  src,
  placeholderSrc,
  threshold = 0.01,
  rootMargin = '50px',
}: UseProgressiveImageOptions) {
  const [imageSrc, setImageSrc] = useState(placeholderSrc || '');
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer para detectar cuándo la imagen entra en el viewport
  useEffect(() => {
    if (!imgRef.current || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [threshold, rootMargin, isInView]);

  // Cargar la imagen cuando está en el viewport
  useEffect(() => {
    if (!isInView || !src) return;

    const img = new Image();
    img.src = src;

    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };

    img.onerror = () => {
      setIsLoading(false);
      // Mantener el placeholder si hay error
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, isInView]);

  return {
    imageSrc,
    isLoading,
    imgRef,
  };
}
