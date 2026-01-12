import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Función para verificar si una variable de entorno está configurada (no vacía y no placeholder)
function isConfigured(envVar: string | undefined): boolean {
  if (!envVar) return false;
  const val = envVar.toLowerCase();
  if (val.includes('placeholder') || val.includes('dummy') || val.includes('your_') || val.includes('change_me')) return false;
  if (envVar.length < 5) return false;
  return true;
}

// Función para enmascarar un valor
function maskValue(value: string | undefined): string {
  if (!value) return '';
  if (value.length <= 8) return '••••••••';
  return value.substring(0, 4) + '••••••••' + value.substring(value.length - 4);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Solo super_admin puede ver el estado completo
    const allowedRoles = ['super_admin', 'SUPER_ADMIN', 'superadmin', 'admin', 'administrador'];
    const userRole = session?.user?.role?.toLowerCase();
    
    if (!session || !userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // ============================================
    // INTEGRACIONES DE PLATAFORMA (Solo Inmova)
    // ============================================
    const plataforma = {
      contabilidad: {
        contasimple: {
          configured: isConfigured(process.env.CONTASIMPLE_API_KEY),
          status: isConfigured(process.env.CONTASIMPLE_API_KEY) ? 'integrado' : 'pendiente',
          masked: maskValue(process.env.CONTASIMPLE_API_KEY),
        },
      },
      comunicacion: {
        crisp: {
          configured: isConfigured(process.env.CRISP_WEBSITE_ID),
          status: isConfigured(process.env.CRISP_WEBSITE_ID) ? 'integrado' : 'pendiente',
          websiteId: maskValue(process.env.CRISP_WEBSITE_ID),
        },
        twilio: {
          configured: isConfigured(process.env.TWILIO_ACCOUNT_SID) && isConfigured(process.env.TWILIO_AUTH_TOKEN),
          status: isConfigured(process.env.TWILIO_ACCOUNT_SID) ? 'integrado' : 'pendiente',
          accountSid: maskValue(process.env.TWILIO_ACCOUNT_SID),
          phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
        },
        sendgrid: {
          configured: isConfigured(process.env.SENDGRID_API_KEY),
          status: isConfigured(process.env.SENDGRID_API_KEY) ? 'integrado' : 'pendiente',
          masked: maskValue(process.env.SENDGRID_API_KEY),
        },
        gmail: {
          configured: isConfigured(process.env.SMTP_HOST) && isConfigured(process.env.SMTP_USER),
          status: (isConfigured(process.env.SMTP_HOST) && isConfigured(process.env.SMTP_USER)) ? 'integrado' : 'pendiente',
          host: process.env.SMTP_HOST || '',
          user: process.env.SMTP_USER || '',
          from: process.env.SMTP_FROM || '',
        },
      },
      analytics: {
        ga4: {
          configured: isConfigured(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
          status: isConfigured(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) ? 'integrado' : 'pendiente',
          measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '',
        },
        hotjar: {
          configured: isConfigured(process.env.NEXT_PUBLIC_HOTJAR_ID),
          status: isConfigured(process.env.NEXT_PUBLIC_HOTJAR_ID) ? 'integrado' : 'pendiente',
          siteId: process.env.NEXT_PUBLIC_HOTJAR_ID || '',
        },
      },
      social: {
        facebook: {
          configured: isConfigured(process.env.FACEBOOK_ACCESS_TOKEN),
          status: isConfigured(process.env.FACEBOOK_ACCESS_TOKEN) ? 'integrado' : 'pendiente',
        },
        instagram: {
          configured: isConfigured(process.env.INSTAGRAM_ACCESS_TOKEN),
          status: isConfigured(process.env.INSTAGRAM_ACCESS_TOKEN) ? 'integrado' : 'pendiente',
        },
        linkedin: {
          configured: isConfigured(process.env.LINKEDIN_ACCESS_TOKEN),
          status: isConfigured(process.env.LINKEDIN_ACCESS_TOKEN) ? 'integrado' : 'pendiente',
        },
        twitter: {
          configured: isConfigured(process.env.TWITTER_API_KEY),
          status: isConfigured(process.env.TWITTER_API_KEY) ? 'integrado' : 'pendiente',
        },
      },
      infraestructura: {
        aws: {
          configured: isConfigured(process.env.AWS_ACCESS_KEY_ID) && isConfigured(process.env.AWS_SECRET_ACCESS_KEY) && 
                      !process.env.AWS_ACCESS_KEY_ID?.includes('your_'),
          status: (isConfigured(process.env.AWS_ACCESS_KEY_ID) && !process.env.AWS_ACCESS_KEY_ID?.includes('your_')) ? 'integrado' : 'pendiente',
          region: process.env.AWS_REGION || '',
          bucket: process.env.AWS_BUCKET_NAME || process.env.AWS_S3_BUCKET || '',
        },
        postgresql: {
          configured: isConfigured(process.env.DATABASE_URL) && !process.env.DATABASE_URL?.includes('dummy'),
          status: (isConfigured(process.env.DATABASE_URL) && !process.env.DATABASE_URL?.includes('dummy')) ? 'integrado' : 'pendiente',
          host: process.env.DATABASE_URL ? 'Configurado' : '',
        },
      },
      ia: {
        claude: {
          configured: isConfigured(process.env.ANTHROPIC_API_KEY),
          status: isConfigured(process.env.ANTHROPIC_API_KEY) ? 'integrado' : 'pendiente',
          masked: maskValue(process.env.ANTHROPIC_API_KEY),
        },
      },
      monitoreo: {
        sentry: {
          configured: isConfigured(process.env.SENTRY_DSN) || isConfigured(process.env.NEXT_PUBLIC_SENTRY_DSN),
          status: (isConfigured(process.env.SENTRY_DSN) || isConfigured(process.env.NEXT_PUBLIC_SENTRY_DSN)) ? 'integrado' : 'pendiente',
          dsn: maskValue(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
        },
      },
    };

    // ============================================
    // INTEGRACIONES COMPARTIDAS
    // ============================================
    const stripeConfigured = isConfigured(process.env.STRIPE_SECRET_KEY);
    const stripeMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live') ? 'live' : 
                       process.env.STRIPE_SECRET_KEY?.startsWith('sk_test') ? 'test' : 'no configurado';

    const compartidas = {
      pagos: {
        stripe: {
          configured: stripeConfigured,
          status: stripeConfigured ? 'integrado' : 'pendiente',
          mode: stripeMode,
          publishableKey: maskValue(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
          secretKey: maskValue(process.env.STRIPE_SECRET_KEY),
          webhookSecret: isConfigured(process.env.STRIPE_WEBHOOK_SECRET) ? 'Configurado' : 'No configurado',
        },
        gocardless: {
          configured: isConfigured(process.env.GOCARDLESS_ACCESS_TOKEN),
          status: isConfigured(process.env.GOCARDLESS_ACCESS_TOKEN) ? 'integrado' : 'pendiente',
          mode: process.env.GOCARDLESS_ENVIRONMENT || 'sandbox',
          accessToken: maskValue(process.env.GOCARDLESS_ACCESS_TOKEN),
        },
        redsys: {
          configured: isConfigured(process.env.REDSYS_MERCHANT_CODE),
          status: isConfigured(process.env.REDSYS_MERCHANT_CODE) ? 'integrado' : 'pendiente',
          merchantCode: process.env.REDSYS_MERCHANT_CODE || '',
          terminal: process.env.REDSYS_TERMINAL || '',
          mode: process.env.REDSYS_ENVIRONMENT || 'test',
        },
      },
      firma: {
        docusign: {
          configured: isConfigured(process.env.DOCUSIGN_INTEGRATION_KEY),
          status: isConfigured(process.env.DOCUSIGN_INTEGRATION_KEY) ? 'integrado' : 'pendiente',
          integrationKey: maskValue(process.env.DOCUSIGN_INTEGRATION_KEY),
          accountId: maskValue(process.env.DOCUSIGN_ACCOUNT_ID),
          environment: process.env.DOCUSIGN_ENVIRONMENT || 'demo',
        },
        signaturit: {
          configured: isConfigured(process.env.SIGNATURIT_API_KEY),
          status: isConfigured(process.env.SIGNATURIT_API_KEY) ? 'integrado' : 'pendiente',
          apiKey: maskValue(process.env.SIGNATURIT_API_KEY),
          environment: process.env.SIGNATURIT_ENVIRONMENT || 'sandbox',
        },
      },
    };

    // Resumen
    const countConfigured = (obj: any): { configured: number; total: number } => {
      let configured = 0;
      let total = 0;
      
      const check = (o: any) => {
        for (const key in o) {
          if (typeof o[key] === 'object' && o[key] !== null) {
            if ('configured' in o[key]) {
              total++;
              if (o[key].configured) configured++;
            } else {
              check(o[key]);
            }
          }
        }
      };
      
      check(obj);
      return { configured, total };
    };

    const plataformaStats = countConfigured(plataforma);
    const compartidasStats = countConfigured(compartidas);

    return NextResponse.json({
      success: true,
      plataforma,
      compartidas,
      resumen: {
        plataforma: plataformaStats,
        compartidas: compartidasStats,
        total: {
          configured: plataformaStats.configured + compartidasStats.configured,
          total: plataformaStats.total + compartidasStats.total,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo estado de integraciones' },
      { status: 500 }
    );
  }
}
