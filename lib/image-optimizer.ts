/**
 * Utilidades para optimización de imágenes
 */

/**
 * Genera una URL de placeholder de baja calidad para una imagen
 * En producción, esto debería usar un servicio de thumbnails o sharp
 */
export function generatePlaceholder(originalSrc: string): string {
  // Por ahora, retornar un placeholder genérico o la misma URL
  // En producción, esto debería generar thumbnails de 20x20px
  return originalSrc;
}

/**
 * Obtiene las dimensiones recomendadas basadas en el tipo de contenido
 */
export function getRecommendedDimensions(type: 'card' | 'hero' | 'thumbnail' | 'gallery') {
  const dimensions = {
    card: { width: 400, height: 300, aspectRatio: '4/3' },
    hero: { width: 1200, height: 600, aspectRatio: '2/1' },
    thumbnail: { width: 200, height: 200, aspectRatio: '1/1' },
    gallery: { width: 800, height: 600, aspectRatio: '4/3' },
  };

  return dimensions[type];
}

/**
 * Genera srcset para imágenes responsivas
 */
export function generateSrcSet(
  src: string,
  widths: number[] = [320, 640, 960, 1280, 1920]
): string {
  return widths.map((width) => `${src}?w=${width} ${width}w`).join(', ');
}

/**
 * Calcula el tamaño de imagen apropiado basado en el viewport
 */
export function calculateImageSizes(breakpoints?: Record<string, string>): string {
  const defaultSizes = [
    '(max-width: 640px) 100vw',
    '(max-width: 768px) 90vw',
    '(max-width: 1024px) 70vw',
    '50vw',
  ];

  if (breakpoints) {
    return Object.entries(breakpoints)
      .map(([bp, size]) => `(max-width: ${bp}) ${size}`)
      .join(', ');
  }

  return defaultSizes.join(', ');
}

/**
 * Prioriza la carga de imágenes críticas
 */
export function shouldPrioritizeImage(
  index: number,
  viewportPosition: 'above-fold' | 'below-fold'
): boolean {
  // Priorizar las primeras 2 imágenes above-fold
  if (viewportPosition === 'above-fold' && index < 2) {
    return true;
  }
  return false;
}

/**
 * Configuración de loading strategy por tipo de página
 */
export const loadingStrategies = {
  landing: {
    heroImages: { priority: true, quality: 90 },
    featuresImages: { priority: false, quality: 80, threshold: 0.1 },
    testimonialsImages: { priority: false, quality: 75, threshold: 0.1 },
  },
  listing: {
    mainImage: { priority: true, quality: 85 },
    thumbnails: { priority: false, quality: 70, threshold: 0.01 },
  },
  detail: {
    hero: { priority: true, quality: 90 },
    gallery: { priority: false, quality: 80, threshold: 0.05 },
  },
  dashboard: {
    avatars: { priority: false, quality: 60, threshold: 0 },
    charts: { priority: true, quality: 85 },
  },
};
