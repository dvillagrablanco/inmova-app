-- Add new webhook event type for onboarding completion
ALTER TYPE "WebhookEventType" ADD VALUE IF NOT EXISTS 'USER_ONBOARDING_COMPLETED';
