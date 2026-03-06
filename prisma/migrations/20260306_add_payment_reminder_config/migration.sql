-- AlterTable: Add payment reminder configuration to Company
ALTER TABLE "Company" ADD COLUMN "paymentRemindersEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Company" ADD COLUMN "paymentRemindersOverdueEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Company" ADD COLUMN "paymentRemindersPreventiveEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Company" ADD COLUMN "paymentRemindersSendToTenant" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Company" ADD COLUMN "paymentRemindersSendToAdmin" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Company" ADD COLUMN "paymentRemindersMinDaysOverdue" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "Company" ADD COLUMN "paymentRemindersPreventiveDays" INTEGER[] DEFAULT ARRAY[7, 3, 1]::INTEGER[];

-- Desactivar recordatorios para todas las empresas existentes
UPDATE "Company" SET "paymentRemindersEnabled" = false;
