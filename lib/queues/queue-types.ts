/**
 * Tipos de trabajos para las diferentes colas
 */

/**
 * Trabajo de envío de email
 */
export interface EmailJobData {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content?: string;
    path?: string;
  }>;
}

/**
 * Tipos de emails predefinidos
 */
export enum EmailType {
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
  PAYMENT_REMINDER = 'payment_reminder',
  PAYMENT_CONFIRMATION = 'payment_confirmation',
  CONTRACT_EXPIRING = 'contract_expiring',
  MAINTENANCE_UPDATE = 'maintenance_update',
  INVOICE = 'invoice',
}

/**
 * Trabajo de generación de reportes
 */
export interface ReportJobData {
  type: ReportType;
  companyId: string;
  userId: string;
  parameters: {
    startDate?: Date;
    endDate?: Date;
    buildingId?: string;
    format?: 'pdf' | 'excel' | 'csv';
    [key: string]: any;
  };
  notifyEmail?: string;
}

/**
 * Tipos de reportes disponibles
 */
export enum ReportType {
  FINANCIAL = 'financial',
  OCCUPANCY = 'occupancy',
  PAYMENTS = 'payments',
  MAINTENANCE = 'maintenance',
  TENANTS = 'tenants',
  CONTRACTS = 'contracts',
  CUSTOM = 'custom',
}

/**
 * Trabajo de sincronización
 */
export interface SyncJobData {
  type: SyncType;
  companyId: string;
  entityId?: string;
  force?: boolean;
}

/**
 * Tipos de sincronización
 */
export enum SyncType {
  PAYMENT_STATUS = 'payment_status',
  CONTRACT_STATUS = 'contract_status',
  UNIT_AVAILABILITY = 'unit_availability',
  EXTERNAL_API = 'external_api',
  BACKUP = 'backup',
}

/**
 * Trabajo de notificación
 */
export interface NotificationJobData {
  type: NotificationType;
  userId: string;
  title: string;
  message: string;
  data?: any;
  channels?: NotificationChannel[];
}

/**
 * Tipos de notificaciones
 */
export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}

/**
 * Canales de notificación
 */
export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
}
