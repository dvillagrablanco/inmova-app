/**
 * Configuración centralizada de roles de administración
 * 
 * Usar en todas las APIs admin para consistencia
 */

// Roles con acceso completo de super administrador
export const SUPER_ADMIN_ROLES = ['super_admin', 'SUPERADMIN'] as const;

// Roles con acceso de administrador (incluye super_admin)
export const ADMIN_ROLES = ['super_admin', 'SUPERADMIN', 'administrador', 'ADMIN'] as const;

// Roles con acceso de gestión (incluye admin)
export const MANAGER_ROLES = [...ADMIN_ROLES, 'gestor', 'GESTOR'] as const;

// Type helpers
export type SuperAdminRole = typeof SUPER_ADMIN_ROLES[number];
export type AdminRole = typeof ADMIN_ROLES[number];
export type ManagerRole = typeof MANAGER_ROLES[number];

/**
 * Verifica si un rol tiene permisos de super administrador
 */
export function isSuperAdmin(role: string | undefined | null): boolean {
  if (!role) return false;
  return SUPER_ADMIN_ROLES.includes(role as SuperAdminRole);
}

/**
 * Verifica si un rol tiene permisos de administrador
 */
export function isAdmin(role: string | undefined | null): boolean {
  if (!role) return false;
  return ADMIN_ROLES.includes(role as AdminRole);
}

/**
 * Verifica si un rol tiene permisos de gestión
 */
export function isManager(role: string | undefined | null): boolean {
  if (!role) return false;
  return MANAGER_ROLES.includes(role as ManagerRole);
}

/**
 * Helper para usar en API routes
 * 
 * @example
 * const { authorized, response } = checkAdminAccess(session, 'super_admin');
 * if (!authorized) return response;
 */
export function checkAdminAccess(
  session: any,
  requiredLevel: 'super_admin' | 'admin' | 'manager' = 'admin'
) {
  if (!session?.user) {
    return {
      authorized: false,
      response: { error: 'No autenticado', status: 401 },
    };
  }

  const role = session.user.role;
  let hasAccess = false;

  switch (requiredLevel) {
    case 'super_admin':
      hasAccess = isSuperAdmin(role);
      break;
    case 'admin':
      hasAccess = isAdmin(role);
      break;
    case 'manager':
      hasAccess = isManager(role);
      break;
  }

  if (!hasAccess) {
    return {
      authorized: false,
      response: { 
        error: `Acceso denegado. Se requiere rol ${requiredLevel}`, 
        status: 403 
      },
    };
  }

  return { authorized: true, response: null };
}
