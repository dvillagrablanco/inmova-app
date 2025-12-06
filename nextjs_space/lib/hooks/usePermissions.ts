import { useSession } from 'next-auth/react';
import { UserRole } from '@prisma/client';

type Permission = 
  | 'read' 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'manageUsers' 
  | 'manageCompany' 
  | 'viewReports' 
  | 'manageClients' 
  | 'impersonateClients'
  | 'viewFinances'
  | 'manageEvents'
  | 'moderateCommunity'
  | 'viewEngagement'
  | 'manageSocialPosts'
  | 'manageAnnouncements'
  | 'viewCommunityStats';

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
    impersonateClients: true,
    viewFinances: true,
    manageEvents: true,
    moderateCommunity: true,
    viewEngagement: true,
    manageSocialPosts: true,
    manageAnnouncements: true,
    viewCommunityStats: true,
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
    impersonateClients: false,
    viewFinances: true,
    manageEvents: true,
    moderateCommunity: true,
    viewEngagement: true,
    manageSocialPosts: true,
    manageAnnouncements: true,
    viewCommunityStats: true,
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
    impersonateClients: false,
    viewFinances: true,
    manageEvents: true,
    moderateCommunity: false,
    viewEngagement: true,
    manageSocialPosts: false,
    manageAnnouncements: false,
    viewCommunityStats: true,
  },
  operador: {
    read: true,
    create: true,
    update: true,
    delete: false,
    manageUsers: false,
    manageCompany: false,
    viewReports: true,
    manageClients: false,
    impersonateClients: false,
    viewFinances: false,
    manageEvents: false,
    moderateCommunity: false,
    viewEngagement: false,
    manageSocialPosts: false,
    manageAnnouncements: false,
    viewCommunityStats: false,
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
    impersonateClients: false,
    viewFinances: false,
    manageEvents: false,
    moderateCommunity: false,
    viewEngagement: false,
    manageSocialPosts: false,
    manageAnnouncements: false,
    viewCommunityStats: false,
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
    impersonateClients: true,
    viewFinances: true,
    manageEvents: true,
    moderateCommunity: true,
    viewEngagement: true,
    manageSocialPosts: true,
    manageAnnouncements: true,
    viewCommunityStats: true,
  },
  // NUEVO ROL: Community Manager - Gestión de eventos y comunidad sin acceso a finanzas
  community_manager: {
    read: true,
    create: true,
    update: true,
    delete: false,
    manageUsers: false,
    manageCompany: false,
    viewReports: true,
    manageClients: false,
    impersonateClients: false,
    viewFinances: false, // ❌ SIN ACCESO a finanzas
    manageEvents: true, // ✅ Gestión completa de eventos
    moderateCommunity: true, // ✅ Moderación de comunidad social
    viewEngagement: true, // ✅ Analytics de engagement
    manageSocialPosts: true, // ✅ Gestión de posts sociales
    manageAnnouncements: true, // ✅ Gestión de anuncios
    viewCommunityStats: true, // ✅ Estadísticas de comunidad
  },
} as const;

export function usePermissions() {
  const { data: session, status } = useSession() || {};
  const role = (session?.user as any)?.role as UserRole | undefined;

  const hasPermission = (permission: Permission): boolean => {
    if (!role) return false;
    return PERMISSIONS[role]?.[permission] ?? false;
  };

  // Permisos básicos
  const canRead = hasPermission('read');
  const canCreate = hasPermission('create');
  const canUpdate = hasPermission('update');
  const canDelete = hasPermission('delete');
  const canManageUsers = hasPermission('manageUsers');
  const canManageCompany = hasPermission('manageCompany');
  const canViewReports = hasPermission('viewReports');
  const canManageClients = hasPermission('manageClients');

  // Permisos financieros
  const canViewFinances = hasPermission('viewFinances');

  // Permisos de Community Manager
  const canManageEvents = hasPermission('manageEvents');
  const canModerateCommunity = hasPermission('moderateCommunity');
  const canViewEngagement = hasPermission('viewEngagement');
  const canManageSocialPosts = hasPermission('manageSocialPosts');
  const canManageAnnouncements = hasPermission('manageAnnouncements');
  const canViewCommunityStats = hasPermission('viewCommunityStats');

  // Roles específicos
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'administrador' || role === 'super_admin';
  const isGestor = role === 'gestor';
  const isOperador = role === 'operador';
  const isCommunityManager = role === 'community_manager';

  return {
    role,
    hasPermission,
    // Permisos básicos
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    canManageUsers,
    canManageCompany,
    canViewReports,
    canManageClients,
    // Permisos financieros
    canViewFinances,
    // Permisos de Community Manager
    canManageEvents,
    canModerateCommunity,
    canViewEngagement,
    canManageSocialPosts,
    canManageAnnouncements,
    canViewCommunityStats,
    // Roles
    isSuperAdmin,
    isAdmin,
    isGestor,
    isOperador,
    isCommunityManager,
    isLoading: status === 'loading',
  };
}
