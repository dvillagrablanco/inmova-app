/**
 * Utilidades para verificar estado de la base de datos
 * y manejar modo demo sin BD
 */

import { prisma } from './db';
import logger from './logger';

let dbAvailable: boolean | null = null;
let lastCheck: number = 0;
const CHECK_INTERVAL = 30000; // 30 segundos

/**
 * Verifica si la base de datos está disponible
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  // Modo demo/desarrollo sin BD
  if (process.env.DEMO_MODE === 'true' || process.env.NO_DATABASE === 'true') {
    return false;
  }

  const now = Date.now();

  // Cache del resultado por 30 segundos
  if (dbAvailable !== null && now - lastCheck < CHECK_INTERVAL) {
    return dbAvailable;
  }

  try {
    // Intento rápido de conexión
    await prisma.$queryRaw`SELECT 1`;
    dbAvailable = true;
    lastCheck = now;
    return true;
  } catch (error) {
    dbAvailable = false;
    lastCheck = now;
    return false;
  }
}

/**
 * Ejecuta una operación de BD con fallback a datos demo
 */
export async function withDatabaseFallback<T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    const hasDb = await isDatabaseAvailable();
    if (!hasDb) {
      return fallback;
    }
    return await operation();
  } catch (error: any) {
    // Si es error de conexión, devolver fallback
    if (
      error.code === 'P1001' || // Can't reach database server
      error.code === 'P1002' || // Database server timeout
      error.code === 'P1008' || // Operations timed out
      error.code === 'P1017' || // Server has closed the connection
      error.message?.includes('ECONNREFUSED') ||
      error.message?.includes('Connection refused')
    ) {
      logger.warn('Base de datos no disponible, usando datos por defecto');
      return fallback;
    }
    // Otros errores se propagan
    throw error;
  }
}

/**
 * Datos demo/por defecto para desarrollo sin BD
 */
export const DEMO_DATA = {
  activeModules: ['inquilinos', 'contratos', 'pagos', 'mantenimiento', 'documentos', 'reportes'],

  user: {
    id: 'demo-user',
    name: 'Usuario Demo',
    email: 'demo@inmova.app',
    role: 'super_admin',
    companyId: 'demo-company',
  },

  company: {
    id: 'demo-company',
    nombre: 'INMOVA Demo',
    cif: 'B00000000',
    email: 'demo@inmova.app',
    activo: true,
  },

  notifications: {
    unreadCount: 0,
    notifications: [],
  },
};
