/**
 * Cliente de Prisma con configuración optimizada de connection pooling
 * 
 * Configuración de Connection Pool:
 * - connection_limit: Número máximo de conexiones en el pool
 * - pool_timeout: Tiempo máximo de espera para obtener una conexión
 * - Prisma usa PgBouncer internamente para pooling eficiente
 * 
 * Para usar con PgBouncer externo:
 * 1. Configurar DATABASE_URL con connection_limit pequeño (ej: 5-10)
 * 2. Usar pgbouncer=true en la URL si se usa en modo transaction
 * 3. Configurar DIRECT_URL para migraciones (sin PgBouncer)
 */

import 'server-only'
import { PrismaClient } from '@prisma/client'
import logger from './logger'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Configuración optimizada del cliente Prisma
 */
const prismaClientOptions = {
  log: [
    { level: 'warn' as const, emit: 'event' as const },
    { level: 'error' as const, emit: 'event' as const },
  ],
  // Estas opciones se pueden configurar vía DATABASE_URL
  // Ejemplo: postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20
}

/**
 * Crea o retorna la instancia singleton del cliente Prisma
 */
function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  const client = new PrismaClient(prismaClientOptions)

  // Event listeners para logging
  client.$on('warn' as any, (e: any) => {
    logger.warn('Prisma warning:', e)
  })

  client.$on('error' as any, (e: any) => {
    logger.error('Prisma error:', e)
  })

  // Manejar cierre graceful
  if (typeof process !== 'undefined') {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, disconnecting Prisma...`)
      await client.$disconnect()
      logger.info('Prisma disconnected successfully')
    }

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))
  }

  return client
}

export const prisma = globalForPrisma.prisma ?? getPrismaClient()
export const db = prisma // Alias para compatibilidad

// Guardar en global solo en desarrollo para evitar múltiples instancias
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

/**
 * Extensiones de Prisma para optimizaciones adicionales
 */

/**
 * Helper para ejecutar queries con retry automático
 * Útil para manejar errores transitorios de conexión
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      // Solo reintentar en errores de conexión
      const isConnectionError = 
        error.code === 'P1001' || // Can't reach database server
        error.code === 'P1002' || // Database server timeout
        error.code === 'P1008' || // Operations timed out
        error.code === 'P1017'    // Server has closed the connection

      if (!isConnectionError || attempt === maxRetries) {
        throw error
      }

      logger.warn(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying...`, {
        error: error.message,
        code: error.code,
      })

      // Esperar antes de reintentar (con backoff exponencial)
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt))
    }
  }

  throw lastError
}

/**
 * Obtiene estadísticas de conexiones del pool
 */
export async function getConnectionPoolStats(): Promise<any> {
  try {
    // Ejecutar query raw para obtener información de conexiones
    const result = await prisma.$queryRaw`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity
      WHERE datname = current_database()
    `

    return result
  } catch (error) {
    logger.error('Failed to get connection pool stats:', error)
    return null
  }
}

export default prisma
