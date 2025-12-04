import { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth-options';
import { prisma } from './db';

/**
 * Permisos por rol
 */
export const PERMISSIONS = {
  super_admin: {
    read: true,
    create: true,
    update: true,
    delete: true,
    manageUsers: true,
    manageCompany: true,
    viewReports: true,
    manageClients: true, // Gestión de empresas/clientes
    impersonateClients: true, // Acceso a múltiples clientes
  },
  soporte: {
    read: true,
    create: true,
    update: true,
    delete: true,
    manageUsers: true,
    manageCompany: true,
    viewReports: true,
    manageClients: true, // Gestión de empresas/clientes
    impersonateClients: true, // Acceso a múltiples clientes
  },
  administrador: {
    read: true,
    create: true,
    update: true,
    delete: true,
    manageUsers: true,
    manageCompany: true,
    viewReports: true,
  },
  gestor: {
    read: true,
    create: true,
    update: true,
    delete: true,
    manageUsers: false,
    manageCompany: false,
    viewReports: true,
  },
  operador: {
    read: true,
    create: true, // Puede crear reportes de trabajo y adjuntar fotos
    update: true, // Puede actualizar órdenes de trabajo y mantenimiento
    delete: false,
    manageUsers: false,
    manageCompany: false,
    viewReports: true, // Puede ver reportes de sus trabajos
    uploadFiles: true, // Puede subir fotos desde campo
    viewMaintenanceHistory: true, // Puede ver historial completo de mantenimiento
    checkInOut: true, // Puede hacer check-in/check-out en trabajos
  },
} as const;

/**
 * Verifica si un rol tiene un permiso específico
 */
export function hasPermission(
  role: UserRole,
  permission: keyof typeof PERMISSIONS.administrador
): boolean {
  return PERMISSIONS[role]?.[permission] ?? false;
}

/**
 * Obtiene el usuario autenticado con sus datos completos
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      company: true,
    },
  });

  return user;
}

/**
 * Middleware para proteger APIs - verifica autenticación y devuelve usuario
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('No autenticado');
  }

  if (!user.activo) {
    throw new Error('Usuario inactivo');
  }

  return user;
}

/**
 * Middleware para verificar permiso específico
 */
export async function requirePermission(
  permission: keyof typeof PERMISSIONS.administrador
) {
  const user = await requireAuth();
  
  if (!hasPermission(user.role, permission)) {
    throw new Error(`No tienes permiso para: ${permission}`);
  }

  return user;
}

/**
 * Obtiene la empresa del usuario autenticado
 */
export async function getUserCompany() {
  const user = await requireAuth();
  return user.companyId;
}

/**
 * Verifica si el usuario puede acceder a un recurso de una empresa específica
 */
export async function canAccessCompanyResource(companyId: string) {
  const user = await requireAuth();
  
  // Super_admin y soporte pueden acceder a cualquier empresa
  if (user.role === 'super_admin' || user.role === 'soporte') {
    return true;
  }
  
  if (user.companyId !== companyId) {
    throw new Error('No tienes acceso a recursos de esta empresa');
  }

  return true;
}

/**
 * Tipos de respuesta de error estándar
 */
export function unauthorizedResponse(message = 'No autorizado') {
  return Response.json(
    { error: message },
    { status: 401 }
  );
}

export function forbiddenResponse(message = 'Permiso denegado') {
  return Response.json(
    { error: message },
    { status: 403 }
  );
}

export function notFoundResponse(message = 'Recurso no encontrado') {
  return Response.json(
    { error: message },
    { status: 404 }
  );
}

export function badRequestResponse(message = 'Solicitud inválida') {
  return Response.json(
    { error: message },
    { status: 400 }
  );
}
