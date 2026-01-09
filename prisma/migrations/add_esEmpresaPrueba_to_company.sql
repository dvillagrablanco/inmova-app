-- Migration: Add esEmpresaPrueba field to Company table
-- This field is used to mark test/demo companies that should be excluded from analytics

-- Add the column with default value false
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "esEmpresaPrueba" BOOLEAN NOT NULL DEFAULT false;

-- Create index for better filtering performance
CREATE INDEX IF NOT EXISTS "Company_esEmpresaPrueba_idx" ON "Company"("esEmpresaPrueba");

-- Update companies with estadoCliente = 'prueba' to mark them as test companies
UPDATE "Company" SET "esEmpresaPrueba" = true WHERE "estadoCliente" = 'prueba';
