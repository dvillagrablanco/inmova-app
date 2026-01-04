/**
 * Usage Optimizations
 * 
 * Optimizaciones para reducir costos de integraciones
 * 
 * Features:
 * - Rate limiting por usuario (prevenir abuso)
 * - Compresión de archivos en S3 (reducir storage)
 * - Cache de respuestas IA (reducir tokens)
 * - Batch processing para firmas (reducir requests)
 */

import { redis } from './redis';
import { createHash } from 'crypto';
import pako from 'pako';

// ═══════════════════════════════════════════════════════════════
// RATE LIMITING POR USUARIO (Prevenir abuso)
// ═══════════════════════════════════════════════════════════════

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
}

/**
 * Rate limiting por usuario para prevenir abuso de integraciones
 * 
 * Límites:
 * - Firmas: 10/hora por usuario
 * - Uploads: 50/hora por usuario
 * - IA: 30/hora por usuario
 * - SMS: 10/hora por usuario
 */
export async function checkUserRateLimit(
  userId: string,
  service: 'signatures' | 'uploads' | 'ai' | 'sms'
): Promise<RateLimitResult> {
  const limits = {
    signatures: { max: 10, window: 3600 }, // 10 por hora
    uploads: { max: 50, window: 3600 }, // 50 por hora
    ai: { max: 30, window: 3600 }, // 30 por hora
    sms: { max: 10, window: 3600 }, // 10 por hora
  };
  
  const { max, window } = limits[service];
  const key = `ratelimit:user:${userId}:${service}`;
  
  try {
    const current = await redis.get(key);
    const count = current ? parseInt(current) : 0;
    
    if (count >= max) {
      const ttl = await redis.ttl(key);
      return {
        allowed: false,
        remaining: 0,
        reset: Date.now() + ttl * 1000,
      };
    }
    
    // Incrementar contador
    await redis.incr(key);
    
    // Si es el primer request, establecer TTL
    if (count === 0) {
      await redis.expire(key, window);
    }
    
    return {
      allowed: true,
      remaining: max - count - 1,
      reset: Date.now() + window * 1000,
    };
  } catch (error) {
    console.error('[Rate Limit] Error checking limit:', error);
    // Si Redis falla, permitir el request (fail open)
    return {
      allowed: true,
      remaining: max,
      reset: Date.now() + window * 1000,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// COMPRESIÓN DE ARCHIVOS (Reducir storage en S3)
// ═══════════════════════════════════════════════════════════════

/**
 * Comprime archivos antes de subirlos a S3 (reduce storage)
 * 
 * Solo comprime archivos > 1MB y que no sean ya comprimidos (jpg, png, mp4, etc.)
 */
export function shouldCompressFile(
  fileName: string,
  fileSize: number
): boolean {
  const MIN_SIZE = 1 * 1024 * 1024; // 1 MB
  
  if (fileSize < MIN_SIZE) {
    return false; // Archivos pequeños no vale la pena
  }
  
  const compressibleExtensions = [
    '.pdf',
    '.txt',
    '.csv',
    '.json',
    '.xml',
    '.svg',
    '.html',
    '.css',
    '.js',
  ];
  
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return compressibleExtensions.includes(ext);
}

/**
 * Comprime un buffer usando gzip
 */
export function compressBuffer(buffer: Buffer): Buffer {
  try {
    const compressed = pako.gzip(buffer);
    return Buffer.from(compressed);
  } catch (error) {
    console.error('[Compression] Error compressing file:', error);
    return buffer; // Si falla, retornar original
  }
}

/**
 * Descomprime un buffer gzip
 */
export function decompressBuffer(buffer: Buffer): Buffer {
  try {
    const decompressed = pako.ungzip(buffer);
    return Buffer.from(decompressed);
  } catch (error) {
    console.error('[Compression] Error decompressing file:', error);
    return buffer; // Si falla, retornar original
  }
}

/**
 * Calcula ahorro de storage (porcentaje)
 */
export function calculateCompressionSavings(
  originalSize: number,
  compressedSize: number
): number {
  return Math.round(((originalSize - compressedSize) / originalSize) * 100);
}

// ═══════════════════════════════════════════════════════════════
// CACHE DE RESPUESTAS IA (Reducir tokens)
// ═══════════════════════════════════════════════════════════════

/**
 * Cache de respuestas IA para reducir consumo de tokens
 * 
 * Cachea por 7 días respuestas idénticas (mismo prompt)
 */
export async function getCachedAIResponse(
  prompt: string
): Promise<string | null> {
  const cacheKey = generateAICacheKey(prompt);
  
  try {
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      console.log('[AI Cache] Cache HIT:', cacheKey.substring(0, 20));
      return cached;
    }
    
    console.log('[AI Cache] Cache MISS:', cacheKey.substring(0, 20));
    return null;
  } catch (error) {
    console.error('[AI Cache] Error reading cache:', error);
    return null;
  }
}

/**
 * Guarda respuesta IA en cache
 */
export async function cacheAIResponse(
  prompt: string,
  response: string
): Promise<void> {
  const cacheKey = generateAICacheKey(prompt);
  const TTL = 7 * 24 * 60 * 60; // 7 días
  
  try {
    await redis.setex(cacheKey, TTL, response);
    console.log('[AI Cache] Response cached:', cacheKey.substring(0, 20));
  } catch (error) {
    console.error('[AI Cache] Error caching response:', error);
  }
}

/**
 * Genera key de cache basada en hash del prompt
 */
function generateAICacheKey(prompt: string): string {
  const hash = createHash('sha256').update(prompt).digest('hex');
  return `ai:cache:${hash}`;
}

/**
 * Invalida cache de IA (si se actualiza el modelo o datos)
 */
export async function invalidateAICache(pattern?: string): Promise<number> {
  try {
    const searchPattern = pattern || 'ai:cache:*';
    const keys = await redis.keys(searchPattern);
    
    if (keys.length === 0) {
      return 0;
    }
    
    await redis.del(...keys);
    console.log(`[AI Cache] Invalidated ${keys.length} cache entries`);
    
    return keys.length;
  } catch (error) {
    console.error('[AI Cache] Error invalidating cache:', error);
    return 0;
  }
}

// ═══════════════════════════════════════════════════════════════
// BATCH PROCESSING PARA FIRMAS (Reducir requests)
// ═══════════════════════════════════════════════════════════════

interface BatchSignatureRequest {
  id: string;
  contractId: string;
  signers: Array<{ name: string; email: string }>;
}

const pendingSignatures: BatchSignatureRequest[] = [];
let batchTimer: NodeJS.Timeout | null = null;

/**
 * Añade firma a batch queue
 * 
 * Agrupa múltiples firmas y las envía juntas a Signaturit
 * (reduce requests API y costo)
 */
export async function addToBatchSignatures(
  request: BatchSignatureRequest
): Promise<void> {
  pendingSignatures.push(request);
  
  // Si hay 5+ firmas pendientes, procesar inmediatamente
  if (pendingSignatures.length >= 5) {
    await processBatchSignatures();
    return;
  }
  
  // Si no, esperar 30 segundos para agrupar más
  if (!batchTimer) {
    batchTimer = setTimeout(() => {
      processBatchSignatures();
    }, 30000); // 30 segundos
  }
}

/**
 * Procesa batch de firmas
 */
async function processBatchSignatures(): Promise<void> {
  if (pendingSignatures.length === 0) {
    return;
  }
  
  console.log(`[Batch Signatures] Processing ${pendingSignatures.length} signatures...`);
  
  // TODO: Implementar lógica de envío batch a Signaturit
  // Por ahora, solo limpia el array
  
  pendingSignatures.length = 0;
  
  if (batchTimer) {
    clearTimeout(batchTimer);
    batchTimer = null;
  }
}

// ═══════════════════════════════════════════════════════════════
// ESTADÍSTICAS DE OPTIMIZACIONES
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene estadísticas de optimizaciones (para dashboard admin)
 */
export async function getOptimizationStats(): Promise<{
  cacheHitRate: number;
  compressionSavings: number;
  rateLimitBlocks: number;
  batchedSignatures: number;
}> {
  try {
    const [
      cacheHits,
      cacheMisses,
      compressionSavings,
      rateLimitBlocks,
      batchedSignatures,
    ] = await Promise.all([
      redis.get('stats:ai:cache:hits').then((v) => parseInt(v || '0')),
      redis.get('stats:ai:cache:misses').then((v) => parseInt(v || '0')),
      redis.get('stats:compression:savings').then((v) => parseFloat(v || '0')),
      redis.get('stats:ratelimit:blocks').then((v) => parseInt(v || '0')),
      redis.get('stats:signatures:batched').then((v) => parseInt(v || '0')),
    ]);
    
    const totalRequests = cacheHits + cacheMisses;
    const cacheHitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;
    
    return {
      cacheHitRate: Math.round(cacheHitRate),
      compressionSavings: Math.round(compressionSavings),
      rateLimitBlocks,
      batchedSignatures,
    };
  } catch (error) {
    console.error('[Optimization Stats] Error:', error);
    return {
      cacheHitRate: 0,
      compressionSavings: 0,
      rateLimitBlocks: 0,
      batchedSignatures: 0,
    };
  }
}

/**
 * Incrementa contador de estadísticas
 */
export async function incrementOptimizationStat(
  stat: 'cache:hits' | 'cache:misses' | 'ratelimit:blocks' | 'signatures:batched',
  value: number = 1
): Promise<void> {
  try {
    await redis.incrby(`stats:${stat}`, value);
  } catch (error) {
    console.error('[Optimization Stats] Error incrementing stat:', error);
  }
}

/**
 * Añade ahorro de compresión a estadísticas
 */
export async function addCompressionSavings(savingsGB: number): Promise<void> {
  try {
    await redis.incrbyfloat('stats:compression:savings', savingsGB);
  } catch (error) {
    console.error('[Optimization Stats] Error adding compression savings:', error);
  }
}
