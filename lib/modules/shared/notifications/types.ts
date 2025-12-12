/**
 * Common types for notification services
 */

export interface NotificationRecipient {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  pushSubscription?: any;
}

export interface NotificationPayload {
  subject?: string;
  title?: string;
  body: string;
  html?: string;
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduledFor?: Date;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  deliveredAt?: Date;
}

export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  subject?: string;
  body: string;
  variables: string[];
}
