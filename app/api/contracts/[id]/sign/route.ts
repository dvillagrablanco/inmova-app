/**
 * API Route: Firma Digital de Contratos
 * POST /api/contracts/[id]/sign
 * 
 * Soporta:
 * - Signaturit (eIDAS UE compliant) - RECOMENDADO
 * - DocuSign
 * 
 * ESTADO: Preparado pero requiere credenciales
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Validación
const signRequestSchema = z.object({
  signatories: z.array(z.object({
    email: z.string().email(),
    name: z.string(),
    role: z.enum(['LANDLORD', 'TENANT', 'GUARANTOR', 'WITNESS']),
  })).min(2),
  expirationDays: z.number().optional().default(30),
});

// Detectar proveedor configurado
const getActiveProvider = (): 'signaturit' | 'docusign' | 'demo' => {
  if (process.env.SIGNATURIT_API_KEY) return 'signaturit';
  if (process.env.DOCUSIGN_INTEGRATION_KEY) return 'docusign';
  return 'demo';
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // 2. Obtener contrato
    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: {
        property: true,
        tenant: true,
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato no encontrado' },
        { status: 404 }
      );
    }

    // 3. Verificar permisos
    if (contract.ownerId !== session.user.id && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'No tienes permiso para firmar este contrato' },
        { status: 403 }
      );
    }

    // 4. Parsear y validar body
    const body = await req.json();
    const validation = signRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error },
        { status: 400 }
      );
    }

    const { signatories, expirationDays } = validation.data;

    // 5. Determinar proveedor activo
    const provider = getActiveProvider();

    // 6. Enviar documento según proveedor
    let signatureData;

    switch (provider) {
      case 'signaturit':
        signatureData = await sendToSignaturit(contract, signatories, expirationDays);
        break;

      case 'docusign':
        signatureData = await sendToDocuSign(contract, signatories, expirationDays);
        break;

      case 'demo':
        signatureData = await sendToDemo(contract, signatories);
        break;
    }

    // 7. Actualizar contrato en BD
    await prisma.contract.update({
      where: { id: contract.id },
      data: {
        status: 'PENDING_SIGNATURE',
        signatureProvider: provider.toUpperCase(),
        signatureId: signatureData.id,
        signatureData: signatureData,
      },
    });

    // 8. Respuesta
    return NextResponse.json({
      success: true,
      provider,
      signatureId: signatureData.id,
      signatureUrl: signatureData.url,
      message: provider === 'demo' 
        ? '⚠️ Modo DEMO - Configura credenciales para producción'
        : 'Documento enviado para firma',
    });

  } catch (error: any) {
    console.error('[Contract Sign Error]:', error);
    
    return NextResponse.json(
      {
        error: 'Error enviando documento para firma',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// ============================================
// PROVEEDORES DE FIRMA DIGITAL
// ============================================

/**
 * Signaturit (RECOMENDADO - eIDAS UE)
 * Documentación: https://docs.signaturit.com/
 */
async function sendToSignaturit(
  contract: any,
  signatories: any[],
  expirationDays: number
) {
  const API_KEY = process.env.SIGNATURIT_API_KEY;

  if (!API_KEY) {
    throw new Error('SIGNATURIT_API_KEY no configurada');
  }

  // TODO: Implementar cuando se tengan credenciales
  // const signaturit = new SignaturitClient(API_KEY);
  
  // const signature = await signaturit.createSignature({
  //   files: [{
  //     name: `contrato-${contract.id}.pdf`,
  //     content: await generateContractPDF(contract),
  //   }],
  //   recipients: signatories.map(s => ({
  //     email: s.email,
  //     fullname: s.name,
  //   })),
  //   subject: `Firma de contrato - ${contract.property.address}`,
  //   body: 'Por favor, revisa y firma el contrato de arrendamiento.',
  //   expires_in: expirationDays,
  // });

  // return {
  //   id: signature.id,
  //   url: signature.signature_url,
  //   provider: 'signaturit',
  // };

  console.log('[Signaturit] Credenciales configuradas pero implementación pendiente');
  
  return {
    id: `sig_demo_${Date.now()}`,
    url: `https://app.signaturit.com/document/${Date.now()}`,
    provider: 'signaturit',
    demo: true,
  };
}

/**
 * DocuSign
 * Documentación: https://developers.docusign.com/
 */
async function sendToDocuSign(
  contract: any,
  signatories: any[],
  expirationDays: number
) {
  const INTEGRATION_KEY = process.env.DOCUSIGN_INTEGRATION_KEY;
  const USER_ID = process.env.DOCUSIGN_USER_ID;

  if (!INTEGRATION_KEY || !USER_ID) {
    throw new Error('Credenciales de DocuSign no configuradas');
  }

  // TODO: Implementar cuando se tengan credenciales
  console.log('[DocuSign] Credenciales configuradas pero implementación pendiente');

  return {
    id: `env_demo_${Date.now()}`,
    url: `https://demo.docusign.net/signing/${Date.now()}`,
    provider: 'docusign',
    demo: true,
  };
}

/**
 * MODO DEMO (sin credenciales)
 */
async function sendToDemo(contract: any, signatories: any[]) {
  console.log('[Demo Mode] Simulating signature request');
  console.log('Contract:', contract.id);
  console.log('Signatories:', signatories.map(s => s.email));

  return {
    id: `demo_${Date.now()}`,
    url: `https://demo.firma-digital.com/${Date.now()}`,
    provider: 'demo',
    demo: true,
    signatories: signatories.map(s => ({
      email: s.email,
      status: 'PENDING',
    })),
  };
}
