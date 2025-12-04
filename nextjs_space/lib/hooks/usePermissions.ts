import { useSession } from 'next-auth/react';
import { UserRole } from '@prisma/client';

type Permission = 'read' | 'create' | 'update' | 'delete' | 'manageUsers' | 'manageCompany' | 'viewReports' | 'manageClients';

const PERMISSIONS = {
  super_admin: {
    read: true,
    create: true,
    update: true,
    delete: true,
    manageUsers: true,
    manageCompany: true,
    viewReports: true,
    manageClients: true,
  },
  administrador: {
    read: true,
    create: true,
    update: true,
    delete: true,
    manageUsers: true,
    manageCompany: true,
    viewReports: true,
    manageClients: false,
  },
  gestor: {
    read: true,
    create: true,
    update: true,
    delete: true,
    manageUsers: false,
    manageCompany: false,
    viewReports: true,
    manageClients: false,
  },
  operador: {
    read: true,
    create: true, // Puede crear reportes de trabajo y adjuntar fotos
    update: true, // Puede actualizar órdenes de trabajo y mantenimiento
    delete: false,
    manageUsers: false,
    manageCompany: false,
    viewReports: true, // Puede ver reportes de sus trabajos
    manageClients: false,
  },
  tenant: {
    read: true,
    create: false,
    update: false,
    delete: false,
    manageUsers: false,
    manageCompany: false,
    viewReports: true,
    manageClients: false,
  },
  soporte: {
    read: true,
    create: true,
    update: true,
    delete: true,
    manageUsers: true,
    manageCompany: true,
    viewReports: true,
    manageClients: true,
  },
} as const;

export function usePermissions() {
  const { data: session, status } = useSession() || {};
  const role = (session?.user as any)?.role as UserRole | undefined;

  const hasPermission = (permission: Permission): boolean => {
    if (!role) return false;
    return PERMISSIONS[role]?.[permission] ?? false;
  };

  const canRead = hasPermission('read');
  const canCreate = hasPermission('create');
  const canUpdate = hasPermission('update');
  const canDelete = hasPermission('delete');
  const canManageUsers = hasPermission('manageUsers');
  const canManageCompany = hasPermission('manageCompany');
  const canViewReports = hasPermission('viewReports');

  const canManageClients = hasPermission('manageClients');

  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'administrador' || role === 'super_admin'; // Super admins también tienen permisos de admin
  const isGestor = role === 'gestor';
  const isOperador = role === 'operador';

  return {
    role,
    hasPermission,
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    canManageUsers,
    canManageCompany,
    canViewReports,
    canManageClients,
    isSuperAdmin,
    isAdmin,
    isGestor,
    isOperador,
    isLoading: status === 'loading',
  };
}
