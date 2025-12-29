import { PrismaClient } from '@prisma/client';
import logger from './logger';

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
 * Variable para almacenar la instancia lazy de Prisma
 */
let _lazyPrismaClient: PrismaClient | null = null;

/**
 * Crea o retorna la instancia singleton del cliente Prisma
 * Esta función se ejecuta SOLO cuando se accede realmente a Prisma
 */
function initPrismaClient(): PrismaClient {
  if (_lazyPrismaClient) {
    return _lazyPrismaClient;
  }

  if (globalForPrisma.prisma) {
    _lazyPrismaClient = globalForPrisma.prisma;
    return _lazyPrismaClient;
  }

  console.log('[Prisma] Inicializando cliente Prisma...');

  const client = new PrismaClient(prismaClientOptions);

  // Agregar middleware de optimización de queries (Semana 2, Tarea 2.4)
  // Solo en desarrollo para evitar overhead en producción
  if (process.env.NODE_ENV === 'development') {
    client.$use(prismaQueryMiddleware);
  }

  // Event listeners para logging
  client.$on('warn' as any, (e: any) => {
    logger.warn('Prisma warning:', e);
  });

  client.$on('error' as any, (e: any) => {
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

  _lazyPrismaClient = client;

  // Guardar en global para evitar múltiples instancias
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }

  return client;
}

/**
 * Proxy que lazy-load Prisma Client
 * Solo se inicializa cuando se accede a alguna propiedad
 */
export const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop: string | symbol) => {
    // Inicializar el cliente real si no existe
    const realClient = initPrismaClient();

    // Retornar la propiedad del cliente real
    const value = (realClient as any)[prop];

    // Si es una función, bindearla al cliente real
    if (typeof value === 'function') {
      return value.bind(realClient);
    }

    return value;
  },
});

export const db = prisma; // Alias para compatibilidad
export default prisma; // Default export para compatibilidad

/**
 * Función helper para testing
 */
export async function disconnectDb() {
  if (_lazyPrismaClient) {
    await _lazyPrismaClient.$disconnect();
    _lazyPrismaClient = null;
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
