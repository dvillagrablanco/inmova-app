import { PrismaClient } from '@prisma/client';
import logger from './logger';

/**
 * Detectar si estamos en build-time
 * Durante el build de Next.js, evitamos inicializar Prisma
 */
const isBuildTime =
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.NODE_ENV === 'test' ||
  typeof window !== 'undefined';

/**
 * Configuración del cliente Prisma
 * Documentación: https://pris.ly/d/prisma-schema
 */
const prismaClientOptions = {
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
  // errorFormat: 'minimal', // Cambiado de 'colorless' a 'minimal'
} as any;

/**
 * Middleware de optimización de queries (Semana 2, Tarea 2.4)
 */
const prismaQueryMiddleware = async (params: any, next: any) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  const queryTime = after - before;

  if (queryTime > 1000) {
    logger.warn(`⚠️  Query lenta detectada: ${params.model}.${params.action} (${queryTime}ms)`);
  }

  return result;
};

declare global {
  var prisma: PrismaClient | undefined;
}

const globalForPrisma = global as typeof globalThis & {
  prisma: PrismaClient | undefined;
};

/**
 * Crear o retornar instancia singleton de Prisma
 * Patrón estándar para Next.js con protección para build-time
 */
function createPrismaClient(): PrismaClient {
  // Durante el build, retornar un mock que no hace nada
  if (isBuildTime) {
    console.log('[Prisma] Build-time detected, skipping Prisma initialization');
    return {} as PrismaClient;
  }

  console.log('[Prisma] Inicializando cliente Prisma...');

  const client = new PrismaClient(prismaClientOptions);

  // Agregar middleware de optimización de queries (Semana 2, Tarea 2.4)
  // Solo en desarrollo para evitar overhead en producción
  if (process.env.NODE_ENV === 'development') {
    client.$use(prismaQueryMiddleware);
  }

  // Event listeners para logging
  const clientAny = client as any;
  clientAny.$on('warn', (e: any) => {
    logger.warn('Prisma warning:', e);
  });

  clientAny.$on('error', (e: any) => {
    logger.error('Prisma error:', e);
  });

  // Manejar cierre graceful
  if (typeof process !== 'undefined') {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, disconnecting Prisma...`);
      await client.$disconnect();
      logger.info('Prisma disconnected successfully');
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Guardar en global para desarrollo (evitar múltiples instancias en hot reload)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export const db = prisma; // Alias para compatibilidad
export default prisma; // Default export para compatibilidad

/**
 * Función para obtener instancia de Prisma (lazy loading compatible)
 * Usar en APIs con `const prisma = getPrismaClient()`
 */
export function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  // Crear nueva instancia si no existe
  const client = createPrismaClient();
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }

  return client;
}

/**
 * Función helper para testing
 */
export async function disconnectDb() {
  if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect();
    globalForPrisma.prisma = undefined;
  }
}

/**
 * Función helper para verificar conexión
 */
export async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database connection check failed:', error);
    return false;
  }
}
