/**
 * Helper para generar URLs de CDN para assets estáticos
 * Soporta transformaciones de imágenes y cache busting
 */

const CDN_BASE_URL = process.env.NEXT_PUBLIC_CDN_URL || '';
const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || '';

/**
 * Genera URL de CDN para un asset
 * Si no hay CDN configurado, retorna la URL local
 */
export function getCDNUrl(path: string): string {
  if (!CDN_BASE_URL) {
    return path; // Fallback a URL local
  }

  // Remover slash inicial si existe
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  return `${CDN_BASE_URL}/${cleanPath}`;
}

/**
 * Opciones para optimización de imágenes
 */
export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
}

/**
 * Genera URL optimizada de imagen con transformaciones
 * Compatible con servicios de transformación de imágenes
 */
export function getOptimizedImageUrl(path: string, options?: ImageOptimizationOptions): string {
  const baseUrl = getCDNUrl(path);

  if (!options) return baseUrl;

  // Construir query params para transformaciones
  const params = new URLSearchParams();
  if (options.width) params.set('w', options.width.toString());
  if (options.height) params.set('h', options.height.toString());
  if (options.quality) params.set('q', options.quality.toString());
  if (options.format) params.set('fm', options.format);

  return `${baseUrl}?${params.toString()}`;
}

/**
 * URLs responsive para diferentes breakpoints
 */
export interface ResponsiveImageUrls {
  sm: string; // Mobile - 640px
  md: string; // Tablet - 1024px
  lg: string; // Desktop - 1920px
  xl: string; // 4K - 3840px
}

/**
 * Genera URLs para diferentes tamaños (responsive)
 * Optimizado para diferentes dispositivos
 */
export function getResponsiveImageUrls(path: string): ResponsiveImageUrls {
  return {
    sm: getOptimizedImageUrl(path, { width: 640, quality: 80, format: 'webp' }),
    md: getOptimizedImageUrl(path, { width: 1024, quality: 80, format: 'webp' }),
    lg: getOptimizedImageUrl(path, { width: 1920, quality: 85, format: 'webp' }),
    xl: getOptimizedImageUrl(path, { width: 3840, quality: 85, format: 'webp' }),
  };
}

/**
 * Genera srcset para imágenes responsive
 * Para usar con <Image> o <img srcset>
 */
export function getImageSrcSet(path: string): string {
  const urls = getResponsiveImageUrls(path);

  return [`${urls.sm} 640w`, `${urls.md} 1024w`, `${urls.lg} 1920w`, `${urls.xl} 3840w`].join(', ');
}

/**
 * Genera URL con cache busting
 * Útil para forzar recarga de assets actualizados
 */
export function getCDNUrlWithVersion(path: string): string {
  const version = BUILD_ID || Date.now().toString();
  const baseUrl = getCDNUrl(path);
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}v=${version}`;
}

/**
 * Verifica si una URL es de CDN
 */
export function isCDNUrl(url: string): boolean {
  if (!CDN_BASE_URL) return false;
  return url.startsWith(CDN_BASE_URL);
}

/**
 * Convierte URL de CDN a path relativo
 */
export function cdnUrlToPath(url: string): string {
  if (!isCDNUrl(url)) return url;
  return url.replace(CDN_BASE_URL, '');
}

/**
 * Genera URL de placeholder para imágenes
 * Usa blur placeholder muy pequeño para mejorar UX
 */
export function getImagePlaceholder(path: string): string {
  return getOptimizedImageUrl(path, {
    width: 10,
    quality: 10,
    format: 'webp',
  });
}

/**
 * Tipos de assets soportados
 */
export type AssetType = 'image' | 'document' | 'video' | 'audio' | 'other';

/**
 * Determina el tipo de asset según la extensión
 */
export function getAssetType(path: string): AssetType {
  const ext = path.split('.').pop()?.toLowerCase();

  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'];
  const documentExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
  const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi'];
  const audioExts = ['mp3', 'wav', 'ogg', 'aac'];

  if (ext && imageExts.includes(ext)) return 'image';
  if (ext && documentExts.includes(ext)) return 'document';
  if (ext && videoExts.includes(ext)) return 'video';
  if (ext && audioExts.includes(ext)) return 'audio';

  return 'other';
}

/**
 * Genera URL apropiada según el tipo de asset
 */
export function getAssetUrl(path: string, optimization?: ImageOptimizationOptions): string {
  const assetType = getAssetType(path);

  // Solo optimizar imágenes
  if (assetType === 'image' && optimization) {
    return getOptimizedImageUrl(path, optimization);
  }

  // Para otros tipos, solo usar CDN básico
  return getCDNUrl(path);
}

/**
 * Configuración de headers de cache recomendados
 */
export const CACHE_HEADERS = {
  // Inmutable: nunca cambiará (usa versioning)
  immutable: 'public, max-age=31536000, immutable',

  // Assets estáticos (1 año)
  longTerm: 'public, max-age=31536000, s-maxage=31536000',

  // Imágenes y documentos (1 mes)
  mediumTerm: 'public, max-age=2592000, s-maxage=2592000',

  // Contenido dinámico (1 hora)
  shortTerm: 'public, max-age=3600, s-maxage=3600',

  // Sin cache
  noCache: 'no-store, no-cache, must-revalidate',
} as const;

/**
 * Obtiene headers de cache recomendados para un asset
 */
export function getCacheHeaders(path: string): string {
  const assetType = getAssetType(path);

  // Assets con version en URL
  if (path.includes('?v=') || path.includes('&v=')) {
    return CACHE_HEADERS.immutable;
  }

  // Imágenes y documentos
  if (assetType === 'image' || assetType === 'document') {
    return CACHE_HEADERS.mediumTerm;
  }

  // Videos y audio
  if (assetType === 'video' || assetType === 'audio') {
    return CACHE_HEADERS.longTerm;
  }

  // Por defecto
  return CACHE_HEADERS.shortTerm;
}
