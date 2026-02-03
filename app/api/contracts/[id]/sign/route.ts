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
import { generateContractPDF as generateContractPdf } from '@/lib/pdf-generator-service';
import { SignatureType } from '@/lib/signaturit-service';
import crypto from 'crypto';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validación
const signRequestSchema = z.object({
  signatories: z
    .array(
      z.object({
        email: z.string().email(),
        name: z.string(),
        role: z.enum(['LANDLORD', 'TENANT', 'GUARANTOR', 'WITNESS']),
      })
    )
    .min(2),
  expirationDays: z.number().optional().default(30),
});

// Detectar proveedor configurado
const getActiveProvider = (): 'signaturit' | 'docusign' | 'demo' => {
  if (process.env.SIGNATURIT_API_KEY) return 'signaturit';
  if (process.env.DOCUSIGN_INTEGRATION_KEY) return 'docusign';
  return 'demo';
};

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 1. Autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // 2. Obtener contrato
    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: {
        unit: {
          include: {
            building: {
              include: {
                company: true,
              },
            },
          },
        },
        tenant: true,
      },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    // 3. Verificar permisos
    const companyId = contract.unit?.building?.companyId;
    if (
      !companyId ||
      (companyId !== session.user.companyId && session.user.role !== 'super_admin')
    ) {
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

    // 6. Obtener metadata
    const ipAddress =
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
    const userAgent = req.headers.get('user-agent') || undefined;

    // 7. Enviar documento según proveedor
    const contractPdfData = buildContractPdfData(contract);
    const pdfBuffer = await generateContractPdf(contractPdfData);
    const documentName = `contrato-${contract.id}.pdf`;
    const documentUrl = `${process.env.NEXTAUTH_URL}/api/v1/reports/contract/${contract.id}`;
    const documentHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
    const expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000);

    let signatureData;

    switch (provider) {
      case 'signaturit':
        signatureData = await sendToSignaturit(
          contract,
          signatories,
          expirationDays,
          pdfBuffer,
          documentName
        );
        break;

      case 'docusign':
        signatureData = await sendToDocuSign(contract, signatories, expirationDays);
        break;

      case 'demo':
        signatureData = await sendToDemo(contract, signatories);
        break;
    }

    const signatureRecord = await prisma.contractSignature.create({
      data: {
        companyId,
        contractId: contract.id,
        provider:
          provider === 'signaturit'
            ? 'SIGNATURIT'
            : provider === 'docusign'
              ? 'DOCUSIGN'
              : 'SELF_HOSTED',
        externalId: signatureData.externalId || signatureData.id,
        documentUrl,
        documentName,
        documentHash,
        signatories: signatories.map((signer) => ({
          name: signer.name,
          email: signer.email,
          role: signer.role,
          status: 'PENDING',
        })),
        status: 'PENDING',
        signingUrl: signatureData.url,
        emailSubject: `Firma de contrato - ${contract.unit?.numero || 'Unidad'}`,
        emailMessage: 'Por favor, revisa y firma el contrato de arrendamiento adjunto.',
        remindersSent: 0,
        sentAt: new Date(),
        expiresAt,
        ipAddress,
        userAgent,
        requestedBy: session.user.id,
      },
    });

    await prisma.documentoFirma.create({
      data: {
        companyId,
        contractId: contract.id,
        tenantId: contract.tenantId,
        titulo: `Contrato ${contract.unit?.numero || contract.id}`,
        descripcion: `Contrato de arrendamiento para ${contract.unit?.building?.direccion || 'propiedad'}`,
        tipoDocumento: 'contrato',
        signaturitId: signatureData.externalId || signatureData.id,
        estado: 'PENDING',
        urlDocumento: documentUrl,
        requiereOrden: false,
        diasExpiracion: expirationDays,
        fechaExpiracion: expiresAt,
        recordatorios: true,
        diasRecordatorio: 3,
        creadoPor: session.user.id,
        firmantes: {
          create: signatories.map((signer, index) => ({
            nombre: signer.name,
            email: signer.email,
            rol: mapSignerRole(signer.role),
            orden: index + 1,
            estado: 'pendiente',
          })),
        },
      },
    });

    // 8. Respuesta
    return NextResponse.json({
      success: true,
      provider,
      signatureId: signatureRecord.id,
      signatureUrl: signatureData.url,
      message:
        provider === 'demo'
          ? '⚠️ Modo DEMO - Configura credenciales para producción'
          : 'Documento enviado para firma',
    });
  } catch (error: any) {
    logger.error('[Contract Sign Error]:', error);

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
  expirationDays: number,
  pdfBuffer: Buffer,
  documentName: string
) {
  const SignaturitService = await import('@/lib/signaturit-service');

  if (!SignaturitService.isSignaturitConfigured()) {
    throw new Error('SIGNATURIT_API_KEY no configurada');
  }

  const signature = await SignaturitService.createSignature(pdfBuffer, documentName, signatories, {
    type: SignatureType.SIMPLE,
    subject: `Firma de contrato - ${contract.unit?.numero || 'Unidad'}`,
    body: 'Por favor, revisa y firma el contrato de arrendamiento adjunto.',
    expireDays: expirationDays,
    deliveryType: 'email',
    sendCopyToSender: true,
    sequentialSignature: false,
    callbackUrl: `${process.env.NEXTAUTH_URL}/api/webhooks/signaturit`,
  });

  return {
    id: signature.id,
    externalId: signature.id,
    url: signature.signers?.find((signer: any) => signer.signUrl)?.signUrl,
    provider: 'signaturit',
  };
}

/**
 * DocuSign
 * Documentación: https://developers.docusign.com/
 */
async function sendToDocuSign(contract: any, signatories: any[], expirationDays: number) {
  const INTEGRATION_KEY = process.env.DOCUSIGN_INTEGRATION_KEY;
  const USER_ID = process.env.DOCUSIGN_USER_ID;

  if (!INTEGRATION_KEY || !USER_ID) {
    throw new Error('Credenciales de DocuSign no configuradas');
  }

  // TODO: Implementar cuando se tengan credenciales
  logger.info('[DocuSign] Credenciales configuradas pero implementación pendiente');

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
  logger.info('[Demo Mode] Simulating signature request', {
    contractId: contract.id,
    signatories: signatories.map((s) => s.email),
  });

  return {
    id: `demo_${Date.now()}`,
    url: `https://demo.firma-digital.com/${Date.now()}`,
    provider: 'demo',
    demo: true,
    signatories: signatories.map((s) => ({
      email: s.email,
      status: 'PENDING',
    })),
  };
}

function buildContractPdfData(contract: any) {
  const company = contract.unit?.building?.company;

  return {
    contractId: contract.id,
    property: {
      address: contract.unit?.building?.direccion || '',
      city: contract.unit?.building?.ciudad || '',
      postalCode: contract.unit?.building?.codigoPostal || '',
      rooms: contract.unit?.habitaciones || 0,
      bathrooms: contract.unit?.banos || 0,
      squareMeters: contract.unit?.superficie || 0,
    },
    landlord: {
      name: company?.contactoPrincipal || company?.nombre || 'Propietario',
      dni: company?.cif || 'N/A',
      email: company?.email || company?.emailContacto || '',
      phone: company?.telefono || company?.telefonoContacto || '',
    },
    tenant: {
      name: contract.tenant?.nombreCompleto || 'Inquilino',
      dni: contract.tenant?.dni || 'N/A',
      email: contract.tenant?.email || '',
      phone: contract.tenant?.telefono || 'N/A',
    },
    terms: {
      rentAmount: contract.rentaMensual || 0,
      deposit: contract.deposito || 0,
      startDate: contract.fechaInicio,
      endDate: contract.fechaFin,
      paymentDay: contract.diaPago || 1,
      includedServices: contract.gastosIncluidos?.length ? contract.gastosIncluidos : [],
    },
  };
}

function mapSignerRole(role: string) {
  switch (role) {
    case 'LANDLORD':
      return 'propietario';
    case 'GUARANTOR':
      return 'fiador';
    case 'WITNESS':
      return 'testigo';
    case 'TENANT':
    default:
      return 'inquilino';
  }
}
