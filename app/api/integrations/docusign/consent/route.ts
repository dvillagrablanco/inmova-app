/**
 * DocuSign Consent URL Redirect
 * GET /api/integrations/docusign/consent
 * 
 * Builds and redirects to the DocuSign consent URL using server-side env vars.
 * This avoids exposing the integration key in the client.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // Only authenticated admins can trigger consent
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  
  if (!session?.user || !['super_admin', 'administrador'].includes(role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY;
  if (!integrationKey) {
    return NextResponse.json(
      { error: 'DOCUSIGN_INTEGRATION_KEY no configurada' },
      { status: 503 }
    );
  }

  const basePath = process.env.DOCUSIGN_BASE_PATH || 'https://www.docusign.net/restapi';
  const isProduction = !basePath.includes('demo');
  const oAuthHost = isProduction ? 'account.docusign.com' : 'account-d.docusign.com';
  
  const redirectUri = `${process.env.NEXTAUTH_URL || 'https://inmovaapp.com'}/api/integrations/docusign/callback`;

  const consentUrl = `https://${oAuthHost}/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${integrationKey}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return NextResponse.redirect(consentUrl);
}
