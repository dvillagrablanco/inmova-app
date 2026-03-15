/**
 * DocuSign Connection Test
 * GET /api/admin/integraciones/docusign/test
 *
 * Verifica que las credenciales DocuSign son válidas intentando
 * obtener un JWT access token. Solo admins.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;

  if (!session?.user || !['super_admin', 'administrador'].includes(role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY;
  const userId = process.env.DOCUSIGN_USER_ID;
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID;
  const privateKey = (process.env.DOCUSIGN_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const basePath = process.env.DOCUSIGN_BASE_PATH || 'https://www.docusign.net/restapi';
  const isDemo = basePath.includes('demo');
  const oAuthHost = isDemo ? 'account-d.docusign.com' : 'account.docusign.com';

  const missing: string[] = [];
  if (!integrationKey) missing.push('DOCUSIGN_INTEGRATION_KEY');
  if (!userId) missing.push('DOCUSIGN_USER_ID');
  if (!accountId) missing.push('DOCUSIGN_ACCOUNT_ID');
  if (!privateKey || privateKey.length < 50) missing.push('DOCUSIGN_PRIVATE_KEY');

  if (missing.length > 0) {
    return NextResponse.json({
      success: false,
      error: `Variables faltantes: ${missing.join(', ')}`,
      environment: isDemo ? 'demo' : 'production',
      configured: false,
    });
  }

  try {
    const docusignModule = 'docusign-esign';
    const docusign = await import(/* webpackIgnore: true */ docusignModule);

    const apiClient = new docusign.ApiClient();
    apiClient.setOAuthBasePath(oAuthHost);

    const results = await apiClient.requestJWTUserToken(
      integrationKey!,
      userId!,
      ['signature', 'impersonation'],
      Buffer.from(privateKey, 'utf8'),
      3600
    );

    const accessToken = results.body.access_token;
    const tokenType = results.body.token_type;
    const expiresIn = results.body.expires_in;

    // Verify account access
    apiClient.setBasePath(basePath);
    apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);

    let accountInfo = null;
    try {
      const userInfo = await apiClient.getUserInfo(accessToken);
      const accounts = userInfo.accounts || [];
      accountInfo = accounts.find((a: any) => a.accountId === accountId) || accounts[0];
    } catch {
      // Non-critical
    }

    logger.info('[DocuSign Test] Connection successful', {
      environment: isDemo ? 'demo' : 'production',
      accountId,
    });

    return NextResponse.json({
      success: true,
      environment: isDemo ? 'demo' : 'production',
      configured: true,
      tokenType,
      expiresIn,
      accountId,
      accountName: accountInfo?.accountName || null,
      baseUri: accountInfo?.baseUri || basePath,
      message: 'Conexion DocuSign verificada correctamente',
    });
  } catch (err: any) {
    const errorBody = err?.response?.body;
    const errorMsg = errorBody?.error || err.message || 'Error desconocido';

    if (errorMsg === 'consent_required') {
      const consentUrl = `https://${oAuthHost}/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${integrationKey}&redirect_uri=${encodeURIComponent((process.env.NEXTAUTH_URL || 'https://inmovaapp.com') + '/api/integrations/docusign/callback')}`;

      return NextResponse.json({
        success: false,
        error: 'consent_required',
        message: 'El usuario debe conceder consentimiento a la app DocuSign.',
        consentUrl,
        environment: isDemo ? 'demo' : 'production',
        configured: true,
      });
    }

    logger.error('[DocuSign Test] Connection failed', { error: errorMsg });

    return NextResponse.json({
      success: false,
      error: errorMsg,
      errorDetails: errorBody?.error_description || null,
      environment: isDemo ? 'demo' : 'production',
      configured: true,
    });
  }
}
