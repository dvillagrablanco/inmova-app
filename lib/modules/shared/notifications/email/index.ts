/**
 * Email Notification Service
 * Handles all email sending functionality
 */

import { NotificationPayload, NotificationRecipient, NotificationResult } from '../types';
import logger from '@/lib/logger';
import { sendEmail as sendSendGridEmail, isSendGridConfigured } from '@/lib/sendgrid-service';
import { sendEmail as sendNodemailerEmail } from '@/lib/email-service';

export interface EmailConfig {
  from: string;
  replyTo?: string;
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

/**
 * Send email notification
 */
export async function sendEmail(
  recipient: NotificationRecipient,
  payload: NotificationPayload,
  config?: EmailConfig
): Promise<NotificationResult> {
  try {
    if (!recipient.email) {
      throw new Error('Recipient email is required');
    }
    const subject = payload.subject || payload.title || 'Notificación';
    const html = payload.html || payload.body;

    if (isSendGridConfigured()) {
      const response = await sendSendGridEmail({
        to: recipient.email,
        subject,
        html,
        from: config?.from,
        replyTo: config?.replyTo,
      });

      if (!response.success) {
        throw new Error(response.error || 'Error enviando email con SendGrid');
      }

      return {
        success: true,
        messageId: response.messageId,
        deliveredAt: new Date(),
      };
    }

    const smtpConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASSWORD);
    if (!smtpConfigured && process.env.NODE_ENV === 'production') {
      throw new Error('SMTP no configurado');
    }

    const ok = await sendNodemailerEmail({
      to: recipient.email,
      subject,
      html,
      from: config?.from,
      replyTo: config?.replyTo,
      attachments: config?.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: typeof attachment.content === 'string' ? attachment.content : undefined,
      })),
    });

    if (!ok) {
      throw new Error('Error enviando email con SMTP');
    }

    return {
      success: true,
      deliveredAt: new Date(),
    };
  } catch (error: any) {
    logger.error('Error sending email:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send bulk emails
 */
export async function sendBulkEmails(
  recipients: NotificationRecipient[],
  payload: NotificationPayload,
  config?: EmailConfig
): Promise<NotificationResult[]> {
  const results = await Promise.allSettled(
    recipients.map((recipient) => sendEmail(recipient, payload, config))
  );

  return results.map((result) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      success: false,
      error: result.reason?.message || 'Unknown error',
    };
  });
}

/**
 * Send email with template
 */
export async function sendTemplatedEmail(
  recipient: NotificationRecipient,
  templateId: string,
  variables: Record<string, any>,
  config?: EmailConfig
): Promise<NotificationResult> {
  // TODO: Load template from database or file system
  // TODO: Render template with variables (use handlebars, ejs, etc.)
  
  const payload: NotificationPayload = {
    subject: `Template ${templateId}`,
    body: JSON.stringify(variables),
  };

  return sendEmail(recipient, payload, config);
}
