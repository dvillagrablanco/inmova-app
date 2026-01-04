/**
 * API Route: Test de Firma Digital
 * 
 * POST /api/settings/integrations/signature/test
 * Prueba la conexión con Signaturit/DocuSign
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import fetch from 'node-fetch';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { companyId } = await request.json();

    // Verificar permisos
    if (companyId !== session.user.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // 2. Obtener configuración
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        signatureProvider: true,
        signatureApiKey: true,
        signatureEnvironment: true,
      },
    });

    if (!company || !company.signatureApiKey) {
      return NextResponse.json(
        { error: 'No hay configuración de firma digital' },
        { status: 400 }
      );
    }

    // 3. Desencriptar API key
    const apiKey = decrypt(company.signatureApiKey);

    // 4. Test según proveedor
    if (company.signatureProvider === 'signaturit') {
      const baseUrl =
        company.signatureEnvironment === 'production'
          ? 'https://api.signaturit.com/v3'
          : 'https://api.sandbox.signaturit.com/v3';

      const response = await fetch(`${baseUrl}/account.json`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return NextResponse.json({
        success: true,
        provider: 'signaturit',
        environment: company.signatureEnvironment,
        account: data,
      });
    } else if (company.signatureProvider === 'docusign') {
      // TODO: Implementar test de DocuSign
      return NextResponse.json({
        success: true,
        provider: 'docusign',
        message: 'Test de DocuSign no implementado aún',
      });
    }

    return NextResponse.json({ error: 'Proveedor no soportado' }, { status: 400 });
  } catch (error: any) {
    console.error('[Signature Test] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error en la prueba de conexión' },
      { status: 500 }
    );
  }
}
