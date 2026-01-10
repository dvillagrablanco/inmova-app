import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar estado de integraciones basado en variables de entorno
    const integrationStatus: Record<string, { connected: boolean; status: string }> = {
      stripe: {
        connected: !!process.env.STRIPE_SECRET_KEY,
        status: process.env.STRIPE_SECRET_KEY ? 'active' : 'inactive',
      },
      docusign: {
        connected: !!process.env.DOCUSIGN_INTEGRATION_KEY,
        status: process.env.DOCUSIGN_INTEGRATION_KEY ? 'active' : 'inactive',
      },
      signaturit: {
        connected: !!process.env.SIGNATURIT_API_KEY,
        status: process.env.SIGNATURIT_API_KEY ? 'active' : 'inactive',
      },
      twilio: {
        connected: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
        status: process.env.TWILIO_ACCOUNT_SID ? 'active' : 'inactive',
      },
      sendgrid: {
        connected: !!process.env.SENDGRID_API_KEY,
        status: process.env.SENDGRID_API_KEY ? 'active' : 'inactive',
      },
      'google-analytics': {
        connected: !!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
        status: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ? 'active' : 'inactive',
      },
      crisp: {
        connected: !!process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID,
        status: process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID ? 'active' : 'inactive',
      },
      contasimple: {
        connected: !!process.env.CONTASIMPLE_API_KEY,
        status: process.env.CONTASIMPLE_API_KEY ? 'active' : 'inactive',
      },
      gocardless: {
        connected: !!process.env.GOCARDLESS_ACCESS_TOKEN,
        status: process.env.GOCARDLESS_ACCESS_TOKEN ? 'active' : 'inactive',
      },
      openbanking: {
        connected: !!process.env.OPENBANKING_CLIENT_ID,
        status: process.env.OPENBANKING_CLIENT_ID ? 'active' : 'inactive',
      },
    };

    return NextResponse.json(integrationStatus);
  } catch (error) {
    logger.error('Error fetching integration status:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
