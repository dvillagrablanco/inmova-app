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
import { z } from 'zod';
import crypto from 'crypto';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validación
const signRequestSchema = z.object({
  signatories: z.array(z.object({
    email: z.string().email(),
    name: z.string(),
    role: z.enum(['LANDLORD', 'TENANT', 'GUARANTOR', 'WITNESS']),
  })).min(2),
  expirationDays: z.number().optional().default(30),
});

type SignatoryInput = z.infer<typeof signRequestSchema>['signatories'][number];

const getCompanyContext = async (
  userId: string,
  role?: string | null,
  companyId?: string | null
) => {
  if (companyId) {
    return { role, companyId };
  }

  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, companyId: true },
  });

  return {
    role: role ?? user?.role ?? null,
    companyId: companyId ?? user?.companyId ?? null,
  };
};

const resolvePdfBuffer = async (pdfPath: string): Promise<Buffer> => {
  if (pdfPath.startsWith('http://') || pdfPath.startsWith('https://')) {
    const response = await fetch(pdfPath);
    if (!response.ok) {
      throw new Error('No se pudo descargar el PDF del contrato');
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  const { downloadFile } = await import('@/lib/s3');
  return await downloadFile(pdfPath);
};

// Detectar proveedor configurado
const getActiveProvider = (): 'signaturit' | 'docusign' | null => {
  if (process.env.SIGNATURIT_API_KEY) return 'signaturit';
  if (process.env.DOCUSIGN_INTEGRATION_KEY) return 'docusign';
  return null;
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Autenticación
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as
      | { id?: string; role?: string | null; companyId?: string | null }
      | undefined;

    if (!sessionUser?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    // 2. Obtener contrato
    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: {
        unit: {
          include: {
            building: {
              select: {
                companyId: true,
              },
            },
          },
        },
        tenant: {
          select: {
            email: true,
            nombre: true,
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato no encontrado' },
        { status: 404 }
      );
    }

    const contractCompanyId = contract.unit?.building?.companyId ?? null;

    if (!contractCompanyId) {
      return NextResponse.json(
        { error: 'No se pudo determinar la empresa del contrato' },
        { status: 400 }
      );
    }

    const { role, companyId } = await getCompanyContext(
      sessionUser.id,
      sessionUser.role,
      sessionUser.companyId
    );

    // 3. Verificar permisos
    const isAllowed =
      role === 'super_admin' || (companyId && companyId === contractCompanyId);
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'No tienes permiso para firmar este contrato' },
        { status: 403 }
      );
    }

    // 4. Parsear y validar body
    const body = signRequestSchema.parse(await req.json());
    const { signatories, expirationDays } = body;

    // 5. Determinar proveedor activo
    const provider = getActiveProvider();
    if (!provider) {
      return NextResponse.json(
        {
          error: 'Firma digital no configurada',
          message: 'Configura SIGNATURIT_API_KEY para habilitar la firma digital.',
        },
        { status: 503 }
      );
    }

    if (provider === 'docusign') {
      return NextResponse.json(
        { error: 'DocuSign no está disponible actualmente' },
        { status: 501 }
      );
    }

    const existingSignature = await prisma.contractSignature.findFirst({
      where: {
        contractId: contract.id,
        status: 'PENDING',
      },
    });

    if (existingSignature) {
      return NextResponse.json(
        { error: 'Ya existe una solicitud de firma pendiente' },
        { status: 409 }
      );
    }

    // 6. Obtener metadata
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
    const userAgent = req.headers.get('user-agent') || undefined;

    if (!contract.contractPdfPath) {
      return NextResponse.json(
        { error: 'El contrato no tiene PDF asociado' },
        { status: 400 }
      );
    }

    const pdfBuffer = await resolvePdfBuffer(contract.contractPdfPath);
    const documentHash = crypto
      .createHash('sha256')
      .update(pdfBuffer)
      .digest('hex');

    const signatureData = await sendToSignaturit({
      contractId: contract.id,
      unitNumero: contract.unit?.numero ?? null,
      documentName: `contrato-${contract.id}.pdf`,
      pdfBuffer,
      signatories,
      expirationDays,
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expirationDays * 24 * 60 * 60 * 1000);

    const signatureRecord = await prisma.contractSignature.create({
      data: {
        companyId: contractCompanyId,
        contractId: contract.id,
        provider: 'SIGNATURIT',
        externalId: signatureData.externalId ?? signatureData.id,
        documentUrl: contract.contractPdfPath,
        documentName: signatureData.documentName,
        documentHash,
        signatories: signatories.map((signatory) => ({
          ...signatory,
          status: 'PENDING',
        })),
        status: 'PENDING',
        signingUrl: signatureData.url ?? undefined,
        emailSubject: signatureData.emailSubject,
        emailMessage: signatureData.emailMessage,
        sentAt: now,
        expiresAt,
        ipAddress,
        userAgent,
        requestedBy: sessionUser.id,
      },
    });

    // 8. Respuesta
    return NextResponse.json({
      success: true,
      provider: 'signaturit',
      signatureId: signatureRecord.id,
      signatureUrl: signatureRecord.signingUrl,
      message: 'Documento enviado para firma',
    });

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Contract Sign Error]:', { message });
    
    return NextResponse.json(
      {
        error: 'Error enviando documento para firma',
        message,
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
async function sendToSignaturit({
  contractId,
  unitNumero,
  documentName,
  pdfBuffer,
  signatories,
  expirationDays,
}: {
  contractId: string;
  unitNumero: string | null;
  documentName: string;
  pdfBuffer: Buffer;
  signatories: SignatoryInput[];
  expirationDays: number;
}): Promise<{
  id: string;
  externalId: string | null;
  url: string | null;
  documentName: string;
  emailSubject: string;
  emailMessage: string;
}> {
  const {
    createSignature,
    isSignaturitConfigured,
    SignatureType,
  } = await import('@/lib/signaturit-service');

  if (!isSignaturitConfigured()) {
    throw new Error('SIGNATURIT_API_KEY no configurada');
  }

  const emailSubject = `Firma de contrato - ${unitNumero ?? 'Unidad'}`;
  const emailMessage =
    'Por favor, revisa y firma el contrato de arrendamiento adjunto.';

  const result = await createSignature(
    pdfBuffer,
    documentName,
    signatories.map((signatory) => ({
      email: signatory.email,
      name: signatory.name,
    })),
    {
      type: SignatureType.SIMPLE,
      subject: emailSubject,
      body: emailMessage,
      expireDays: expirationDays,
      deliveryType: 'url',
      sequentialSignature: true,
      callbackUrl: `${process.env.NEXTAUTH_URL}/api/webhooks/signaturit`,
    }
  );

  const signingUrl = result.signers?.[0]?.signUrl ?? null;

  return {
    id: result.id,
    externalId: result.id,
    url: signingUrl,
    documentName,
    emailSubject,
    emailMessage,
  };
}
