/**
 * SMS Notification Service
 * Handles SMS sending via Twilio or similar services
 */

import { NotificationPayload, NotificationRecipient, NotificationResult } from '../types';
import logger from '@/lib/logger';

export interface SMSConfig {
  from?: string;
  provider?: 'twilio' | 'aws-sns' | 'vonage';
}

/**
 * Send SMS notification
 */
export async function sendSMS(
  recipient: NotificationRecipient,
  payload: NotificationPayload,
  config?: SMSConfig
): Promise<NotificationResult> {
  try {
    if (!recipient.phone) {
      throw new Error('Recipient phone number is required');
    }

    // TODO: Integrate with SMS provider
    logger.info('Sending SMS', {
      to: recipient.phone,
      message: payload.body,
      provider: config?.provider || 'default',
    });

    // Simulate SMS sending
    await new Promise((resolve) => setTimeout(resolve, 150));

    return {
      success: true,
      messageId: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      deliveredAt: new Date(),
    };
  } catch (error: any) {
    logger.error('Error sending SMS:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send bulk SMS
 */
export async function sendBulkSMS(
  recipients: NotificationRecipient[],
  payload: NotificationPayload,
  config?: SMSConfig
): Promise<NotificationResult[]> {
  const results = await Promise.allSettled(
    recipients.map((recipient) => sendSMS(recipient, payload, config))
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
