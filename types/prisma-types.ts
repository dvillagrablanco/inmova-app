/**
 * Tipos de Prisma exportados centralmente
 *
 * Este archivo re-exporta tipos de Prisma para evitar importaciones directas
 * de @prisma/client durante el build de Next.js
 */

// Re-exportar tipos de Prisma cuando están disponibles
export type {
  // User types
  User,
  UserRole,
  ProfileType,
  UIMode,

  // Company types
  Company,

  // Property types
  Property,
  PropertyStatus,
  PropertyType,
  UnitStatus,

  // Room types
  Room,
  RoomStatus,

  // Contract types
  Contract,
  ContractStatus,
  RentUpdateType,

  // CRM types
  CRMLead,
  CRMLeadStatus,
  CRMLeadSource,
  CRMLeadPriority,
  CRMActivity,
  CRMDeal,
  CRMDealStage,
  CompanySize,

  // Notification types
  Notification,
  NotificationType,

  // Payment types
  Payment,
  PaymentStatus,
  PaymentMethod,

  // Invoice types
  Invoice,
  InvoiceStatus,

  // Message types
  Message,
  Conversation,

  // Maintenance types
  MaintenanceRequest,
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceCategory,

  // Calendar types
  CalendarEvent,
  EventType,
  EventStatus,

  // Document types
  Document,
  DocumentType,

  // Analytics types
  AnalyticsSnapshot,

  // Module types
  Module,

  // Audit types
  AuditLog,
  AuditAction,

  // Community types
  Comunidad,

  // Voting types
  Votacion,

  // Gallery types
  Galeria,

  // Photo types
  Photo,

  // SMS types
  SMSTemplate,

  // Package types (Coliving)
  Package,
  PackageStatus,

  // Group types (Coliving)
  ColivingGroup,

  // CheckInOut types (Coliving)
  CheckInOut,

  // Feed types (Coliving)
  FeedPost,

  // Profile types (Coliving)
  ColivingProfile,

  // Event types (Coliving)
  ColivingEvent,

  // Smart Lock types (Coliving)
  SmartLock,
  SmartLockAccess,

  // Service types (Coliving)
  ColivingService,
  ColivingServiceBooking,
  BookingStatus,

  // Match types (Coliving)
  ColivingMatch,

  // Prisma utility types
  Prisma,
} from '@prisma/client';

// Para development/build sin DATABASE_URL, definir tipos mínimos
export type SafePrismaTypes = {
  CRMLeadStatus: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';
  CRMLeadSource: 'WEB' | 'LINKEDIN' | 'REFERRAL' | 'EVENT' | 'COLD_CALL' | 'EMAIL' | 'OTHER';
  CRMLeadPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  CompanySize: 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';
  // Añadir más según necesidad
};
