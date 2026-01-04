-- AddCompanyIntegrations
-- Añade campos para almacenar credenciales de integraciones por empresa

-- Signaturit / DocuSign
ALTER TABLE "companies" ADD COLUMN "signatureProvider" TEXT;
ALTER TABLE "companies" ADD COLUMN "signatureApiKey" TEXT;
ALTER TABLE "companies" ADD COLUMN "signatureWebhookSecret" TEXT;
ALTER TABLE "companies" ADD COLUMN "signatureEnvironment" TEXT DEFAULT 'sandbox';

-- AWS S3
ALTER TABLE "companies" ADD COLUMN "awsAccessKeyId" TEXT;
ALTER TABLE "companies" ADD COLUMN "awsSecretAccessKey" TEXT;
ALTER TABLE "companies" ADD COLUMN "awsBucket" TEXT;
ALTER TABLE "companies" ADD COLUMN "awsRegion" TEXT DEFAULT 'eu-west-1';

-- Anthropic Claude
ALTER TABLE "companies" ADD COLUMN "anthropicApiKey" TEXT;

-- Twilio (SMS/WhatsApp)
ALTER TABLE "companies" ADD COLUMN "twilioAccountSid" TEXT;
ALTER TABLE "companies" ADD COLUMN "twilioAuthToken" TEXT;
ALTER TABLE "companies" ADD COLUMN "twilioPhoneNumber" TEXT;

-- Comentarios
COMMENT ON COLUMN "companies"."signatureProvider" IS 'Proveedor de firma digital: signaturit, docusign, null';
COMMENT ON COLUMN "companies"."signatureApiKey" IS 'API key del proveedor de firma (encriptada)';
COMMENT ON COLUMN "companies"."signatureWebhookSecret" IS 'Webhook secret para verificar eventos (encriptado)';
COMMENT ON COLUMN "companies"."signatureEnvironment" IS 'Entorno de firma: sandbox, production';
COMMENT ON COLUMN "companies"."awsAccessKeyId" IS 'AWS Access Key ID (encriptada) - null usa la de Inmova';
COMMENT ON COLUMN "companies"."awsSecretAccessKey" IS 'AWS Secret Access Key (encriptada)';
COMMENT ON COLUMN "companies"."awsBucket" IS 'Nombre del bucket S3 de la empresa';
COMMENT ON COLUMN "companies"."awsRegion" IS 'Región de AWS S3';
COMMENT ON COLUMN "companies"."anthropicApiKey" IS 'API key de Anthropic Claude (encriptada) - null usa la de Inmova';
COMMENT ON COLUMN "companies"."twilioAccountSid" IS 'Twilio Account SID (encriptado)';
COMMENT ON COLUMN "companies"."twilioAuthToken" IS 'Twilio Auth Token (encriptado)';
COMMENT ON COLUMN "companies"."twilioPhoneNumber" IS 'Número de teléfono de Twilio';
