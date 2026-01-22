#!/usr/bin/env tsx
/**
 * Verificación completa de integraciones
 * Ejecutar: npx tsx scripts/verify-integrations.ts
 */

import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import Stripe from 'stripe';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import Anthropic from '@anthropic-ai/sdk';

const prisma = new PrismaClient();

interface CheckResult {
  name: string;
  status: 'ok' | 'error' | 'warning' | 'skipped';
  message: string;
  critical: boolean;
}

const results: CheckResult[] = [];

async function checkDatabase(): Promise<CheckResult> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      name: 'Database (PostgreSQL)',
      status: 'ok',
      message: 'Conexión exitosa',
      critical: true,
    };
  } catch (error: any) {
    return {
      name: 'Database (PostgreSQL)',
      status: 'error',
      message: error.message,
      critical: true,
    };
  }
}

async function checkStripe(): Promise<CheckResult> {
  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      name: 'Stripe',
      status: 'error',
      message: 'STRIPE_SECRET_KEY no configurada',
      critical: true,
    };
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    await stripe.balance.retrieve();
    const mode = process.env.STRIPE_SECRET_KEY.includes('test') ? 'TEST' : 'LIVE';
    return {
      name: 'Stripe',
      status: 'ok',
      message: `Conexión exitosa (${mode} mode)`,
      critical: true,
    };
  } catch (error: any) {
    return {
      name: 'Stripe',
      status: 'error',
      message: error.message,
      critical: true,
    };
  }
}

async function checkSMTP(): Promise<CheckResult> {
  if (!process.env.SMTP_HOST) {
    return {
      name: 'Gmail SMTP',
      status: 'error',
      message: 'SMTP_HOST no configurada',
      critical: true,
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.verify();
    return {
      name: 'Gmail SMTP',
      status: 'ok',
      message: `Conexión exitosa (${process.env.SMTP_USER})`,
      critical: true,
    };
  } catch (error: any) {
    return {
      name: 'Gmail SMTP',
      status: 'error',
      message: error.message,
      critical: true,
    };
  }
}

async function checkS3(): Promise<CheckResult> {
  if (!process.env.AWS_ACCESS_KEY_ID) {
    return {
      name: 'AWS S3',
      status: 'error',
      message: 'AWS_ACCESS_KEY_ID no configurada',
      critical: true,
    };
  }

  try {
    const s3 = new S3Client({
      region: process.env.AWS_REGION || 'eu-west-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    await s3.send(new ListBucketsCommand({}));
    return {
      name: 'AWS S3',
      status: 'ok',
      message: `Conexión exitosa (bucket: ${process.env.AWS_BUCKET})`,
      critical: true,
    };
  } catch (error: any) {
    return {
      name: 'AWS S3',
      status: 'error',
      message: error.message,
      critical: true,
    };
  }
}

async function checkNextAuth(): Promise<CheckResult> {
  if (!process.env.NEXTAUTH_URL || !process.env.NEXTAUTH_SECRET) {
    return {
      name: 'NextAuth',
      status: 'error',
      message: 'NEXTAUTH_URL o NEXTAUTH_SECRET no configuradas',
      critical: true,
    };
  }

  return {
    name: 'NextAuth',
    status: 'ok',
    message: `Configurado (${process.env.NEXTAUTH_URL})`,
    critical: true,
  };
}

async function checkSignaturit(): Promise<CheckResult> {
  if (!process.env.SIGNATURIT_API_KEY) {
    return {
      name: 'Signaturit (Firma Digital)',
      status: 'warning',
      message: 'SIGNATURIT_API_KEY no configurada',
      critical: true,
    };
  }

  return {
    name: 'Signaturit (Firma Digital)',
    status: 'ok',
    message: 'API key configurada',
    critical: true,
  };
}

async function checkDocuSign(): Promise<CheckResult> {
  if (!process.env.DOCUSIGN_INTEGRATION_KEY) {
    return {
      name: 'DocuSign (Firma Digital)',
      status: 'warning',
      message: 'DOCUSIGN_INTEGRATION_KEY no configurada (opcional si Signaturit está activo)',
      critical: false,
    };
  }

  return {
    name: 'DocuSign (Firma Digital)',
    status: 'ok',
    message: 'Integration key configurada',
    critical: false,
  };
}

async function checkAnthropic(): Promise<CheckResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      name: 'Anthropic Claude (IA)',
      status: 'warning',
      message: 'ANTHROPIC_API_KEY no configurada (necesaria para valoraciones IA)',
      critical: false,
    };
  }

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Test simple
    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'test' }],
    });

    return {
      name: 'Anthropic Claude (IA)',
      status: 'ok',
      message: 'API key válida - Feature: Valoraciones IA',
      critical: false,
    };
  } catch (error: any) {
    return {
      name: 'Anthropic Claude (IA)',
      status: 'error',
      message: error.message,
      critical: false,
    };
  }
}

async function checkTwilio(): Promise<CheckResult> {
  if (!process.env.TWILIO_ACCOUNT_SID) {
    return {
      name: 'Twilio (SMS/WhatsApp)',
      status: 'warning',
      message: 'TWILIO_ACCOUNT_SID no configurada (necesaria para notificaciones SMS)',
      critical: false,
    };
  }

  return {
    name: 'Twilio (SMS/WhatsApp)',
    status: 'ok',
    message: 'Account SID configurada',
    critical: false,
  };
}

async function main() {
  console.log('═'.repeat(80));
  console.log('🔍 VERIFICANDO INTEGRACIONES - INMOVA APP');
  console.log('═'.repeat(80));
  console.log('');

  // Ejecutar checks
  console.log('⏳ Ejecutando verificaciones...\n');

  results.push(await checkNextAuth());
  results.push(await checkDatabase());
  results.push(await checkStripe());
  results.push(await checkSMTP());
  results.push(await checkS3());
  results.push(await checkSignaturit());
  results.push(await checkDocuSign());
  results.push(await checkAnthropic());
  results.push(await checkTwilio());

  // Resultados
  console.log('═'.repeat(80));
  console.log('📊 RESULTADOS\n');

  const criticalChecks = results.filter((r) => r.critical);
  const criticalPassed = criticalChecks.filter((r) => r.status === 'ok').length;
  const criticalTotal = criticalChecks.length;

  const importantChecks = results.filter((r) => !r.critical);
  const importantPassed = importantChecks.filter((r) => r.status === 'ok').length;
  const importantTotal = importantChecks.length;

  results.forEach((result) => {
    const emoji =
      result.status === 'ok'
        ? '✅'
        : result.status === 'error'
        ? '❌'
        : result.status === 'warning'
        ? '⚠️'
        : '⏸️';
    const critical = result.critical ? '[CRÍTICO]' : '[IMPORTANTE]';
    console.log(`${emoji} ${result.name} ${critical}`);
    console.log(`   ${result.message}\n`);
  });

  console.log('═'.repeat(80));
  console.log('\n📈 RESUMEN:\n');
  console.log(`  🔴 Integraciones críticas: ${criticalPassed}/${criticalTotal} (${Math.round((criticalPassed / criticalTotal) * 100)}%)`);
  console.log(`  🟡 Integraciones importantes: ${importantPassed}/${importantTotal} (${Math.round((importantPassed / importantTotal) * 100)}%)`);
  console.log(`  🟢 Total: ${criticalPassed + importantPassed}/${criticalTotal + importantTotal} (${Math.round(((criticalPassed + importantPassed) / (criticalTotal + importantTotal)) * 100)}%)\n`);

  console.log('═'.repeat(80));

  if (criticalPassed < criticalTotal) {
    const failedCritical = results.filter((r) => r.critical && r.status !== 'ok');
    console.log('\n❌ HAY INTEGRACIONES CRÍTICAS FALLANDO:\n');
    failedCritical.forEach((r) => {
      console.log(`  - ${r.name}: ${r.message}`);
    });
    console.log('\n⚠️  La aplicación puede no funcionar correctamente.\n');
    console.log('═'.repeat(80));
    process.exit(1);
  } else {
    console.log('\n✅ TODAS LAS INTEGRACIONES CRÍTICAS FUNCIONANDO CORRECTAMENTE\n');

    if (importantPassed < importantTotal) {
      console.log('⚠️  Algunas integraciones importantes están pendientes:');
      const failedImportant = results.filter((r) => !r.critical && r.status !== 'ok');
      failedImportant.forEach((r) => {
        console.log(`  - ${r.name}`);
      });
      console.log('');
    }

    console.log('═'.repeat(80));
    process.exit(0);
  }
}

main()
  .catch((error) => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
