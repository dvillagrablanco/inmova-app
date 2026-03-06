/**
 * API Route: Firma Digital de Contratos
 * POST /api/contracts/[id]/sign
 * 
 * Soporta:
 * - DocuSign (Grupo Vidaro — producción)
 * - Signaturit (eIDAS UE compliant)
 * 
 * Flujos soportados:
 * - Contratos de arrendamiento propios (Viroda/Rovida)
 * - Contratos de operadores de media estancia (Álamo, etc.)
 * - Cualquier documento PDF asociado a un contrato
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import crypto from 'crypto';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// Validación — permite seleccionar proveedor y origen del contrato
const signRequestSchema = z.object({
  signatories: z.array(z.object({
    email: z.string().email(),
    name: z.string(),
    role: z.enum(['LANDLORD', 'TENANT', 'GUARANTOR', 'WITNESS', 'OPERATOR', 'OTHER']),
  })).min(1),
  expirationDays: z.number().optional().default(30),
  provider: z.enum(['signaturit', 'docusign']).optional(),
  // Soporte para contratos de operadores de media estancia (Álamo, etc.)
  operatorName: z.string().optional(), // Nombre del operador (ej: "Álamo")
  emailSubject: z.string().optional(), // Asunto personalizado
  emailMessage: z.string().optional(), // Mensaje personalizado
});

type SignatoryInput = z.infer<typeof signRequestSchema>['signatories'][number];

const getCompanyContext = async (
  userId: string,
  role?: string | null,
  companyId?: string | null
) => {
  const prisma = await getPrisma();
  if (companyId) {
    return { role, companyId };
  }
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

// Detectar proveedor configurado — DocuSign tiene prioridad (Grupo Vidaro producción)
const getActiveProvider = (): 'signaturit' | 'docusign' | null => {
  if (process.env.DOCUSIGN_INTEGRATION_KEY && process.env.DOCUSIGN_USER_ID && 
      process.env.DOCUSIGN_ACCOUNT_ID && process.env.DOCUSIGN_PRIVATE_KEY) return 'docusign';
  if (process.env.SIGNATURIT_API_KEY) return 'signaturit';
  return null;
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
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

    // 2. Obtener contrato
    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: {
        unit: {
          include: {
            building: {
              select: {
                companyId: true,
                nombre: true,
              },
            },
          },
        },
        tenant: {
          select: {
            email: true,
            nombreCompleto: true,
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

    // 3. Verificar permisos — incluye acceso a empresas del grupo (parent/child)
    let isAllowed = role === 'super_admin' || (companyId && companyId === contractCompanyId);
    
    // Verificar si el usuario pertenece al grupo (empresa padre/hija)
    if (!isAllowed && companyId) {
      const userCompany = await prisma.company.findUnique({
        where: { id: companyId },
        select: { parentCompanyId: true },
      });
      const contractCompany = await prisma.company.findUnique({
        where: { id: contractCompanyId },
        select: { parentCompanyId: true },
      });
      // Mismo grupo si comparten padre o uno es padre del otro
      if (userCompany && contractCompany) {
        const sameGroup = 
          userCompany.parentCompanyId === contractCompany.parentCompanyId ||
          userCompany.parentCompanyId === contractCompanyId ||
          contractCompany.parentCompanyId === companyId;
        if (sameGroup) isAllowed = true;
      }
    }

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'No tienes permiso para firmar este contrato' },
        { status: 403 }
      );
    }

    // 4. Parsear y validar body
    const body = signRequestSchema.parse(await req.json());
    const { signatories, expirationDays, operatorName, emailSubject: customSubject, emailMessage: customMessage } = body;

    // 5. Determinar proveedor activo
    const requestedProvider = body.provider;
    const activeProvider = requestedProvider || getActiveProvider();
    
    if (!activeProvider) {
      return NextResponse.json(
        {
          error: 'Firma digital no configurada',
          message: 'Configura DOCUSIGN_INTEGRATION_KEY o SIGNATURIT_API_KEY para habilitar la firma digital.',
        },
        { status: 503 }
      );
    }

    // 6. Verificar que no hay firma pendiente
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

    // 7. Obtener metadata
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

    const unitNumero = contract.unit?.numero ?? null;
    const buildingNombre = contract.unit?.building?.nombre ?? null;
    const documentName = `contrato-${contract.id}.pdf`;

    // Personalizar subject/message para operadores de media estancia (Álamo, etc.)
    const defaultSubject = operatorName
      ? `Firma de contrato ${operatorName} - ${buildingNombre ?? 'Unidad'} ${unitNumero ?? ''}`
      : `Firma de contrato - ${buildingNombre ?? 'Unidad'} ${unitNumero ?? ''}`;
    const defaultMessage = operatorName
      ? `Contrato de media estancia con ${operatorName}. Por favor, revisa y firma el documento adjunto.`
      : 'Por favor, revisa y firma el contrato de arrendamiento adjunto.';

    const emailSubject = customSubject || defaultSubject;
    const emailMessage = customMessage || defaultMessage;

    // 8. Enviar a proveedor
    let signatureData: {
      id: string;
      externalId: string | null;
      url: string | null;
      documentName: string;
      emailSubject: string;
      emailMessage: string;
    };

    const providerEnum = activeProvider === 'docusign' ? 'DOCUSIGN' : 'SIGNATURIT';

    if (activeProvider === 'docusign') {
      signatureData = await sendToDocuSign({
        contractId: contract.id,
        unitNumero,
        documentName,
        pdfBuffer,
        signatories,
        expirationDays,
        emailSubject,
        emailMessage,
        operatorName,
      });
    } else {
      signatureData = await sendToSignaturit({
        contractId: contract.id,
        unitNumero,
        documentName,
        pdfBuffer,
        signatories,
        expirationDays,
      });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expirationDays * 24 * 60 * 60 * 1000);

    const signatureRecord = await prisma.contractSignature.create({
      data: {
        companyId: contractCompanyId,
        contractId: contract.id,
        provider: providerEnum,
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

    // 9. Respuesta
    return NextResponse.json({
      success: true,
      provider: activeProvider,
      signatureId: signatureRecord.id,
      signatureUrl: signatureRecord.signingUrl,
      message: `Documento enviado para firma via ${activeProvider === 'docusign' ? 'DocuSign' : 'Signaturit'}`,
      ...(operatorName && { operator: operatorName }),
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
// PROVEEDOR: DOCUSIGN (Grupo Vidaro producción)
// ============================================

/**
 * Envía contrato a DocuSign para firma digital.
 * Soporta contratos propios y de operadores de media estancia (Álamo, etc.)
 * 
 * Flujo:
 * 1. Obtiene JWT access token via RSA private key
 * 2. Crea envelope con PDF en base64
 * 3. Añade firmantes con tabs de firma
 * 4. Envía envelope — firmantes reciben email de DocuSign
 */
async function sendToDocuSign({
  contractId,
  unitNumero,
  documentName,
  pdfBuffer,
  signatories,
  expirationDays,
  emailSubject,
  emailMessage,
  operatorName,
}: {
  contractId: string;
  unitNumero: string | null;
  documentName: string;
  pdfBuffer: Buffer;
  signatories: SignatoryInput[];
  expirationDays: number;
  emailSubject: string;
  emailMessage: string;
  operatorName?: string;
}): Promise<{
  id: string;
  externalId: string | null;
  url: string | null;
  documentName: string;
  emailSubject: string;
  emailMessage: string;
}> {
  // Dynamic import to avoid webpack analysis of docusign-esign (has broken relative imports)
  const docusignModule = 'docusign-esign';
  const docusign = await import(/* webpackIgnore: true */ docusignModule);

  // 1. Configuración
  const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY!;
  const userId = process.env.DOCUSIGN_USER_ID!;
  const accountId = process.env.DOCUSIGN_ACCOUNT_ID!;
  const basePath = process.env.DOCUSIGN_BASE_PATH || 'https://www.docusign.net/restapi';
  const privateKey = (process.env.DOCUSIGN_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const isProduction = !basePath.includes('demo');
  const oAuthHost = isProduction ? 'account.docusign.com' : 'account-d.docusign.com';

  if (!integrationKey || !userId || !accountId || !privateKey) {
    throw new Error('DocuSign no está completamente configurado. Verifica DOCUSIGN_INTEGRATION_KEY, DOCUSIGN_USER_ID, DOCUSIGN_ACCOUNT_ID y DOCUSIGN_PRIVATE_KEY.');
  }

  // 2. Obtener JWT access token
  const apiClient = new docusign.ApiClient();
  apiClient.setOAuthBasePath(oAuthHost);

  let accessToken: string;
  try {
    const results = await apiClient.requestJWTUserToken(
      integrationKey,
      userId,
      ['signature', 'impersonation'],
      Buffer.from(privateKey, 'utf8'),
      3600
    );
    accessToken = results.body.access_token;
  } catch (authError: any) {
    const errorMsg = authError?.response?.body?.error || authError.message || 'Auth failed';
    if (errorMsg === 'consent_required') {
      const consentUrl = `https://${oAuthHost}/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${integrationKey}&redirect_uri=${encodeURIComponent((process.env.NEXTAUTH_URL || 'https://inmovaapp.com') + '/api/integrations/docusign/callback')}`;
      throw new Error(`DocuSign requiere consentimiento. Visita: ${consentUrl}`);
    }
    throw new Error(`Error de autenticación DocuSign: ${errorMsg}`);
  }

  // 3. Configurar cliente API con token
  apiClient.setBasePath(basePath);
  apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);

  const envelopesApi = new docusign.EnvelopesApi(apiClient);

  // 4. Crear documento
  const document = new docusign.Document();
  document.documentBase64 = pdfBuffer.toString('base64');
  document.name = operatorName
    ? `Contrato ${operatorName} - ${unitNumero || contractId}`
    : documentName;
  document.fileExtension = 'pdf';
  document.documentId = '1';

  // 5. Crear firmantes con tabs
  const signers = signatories.map((s, idx) => {
    const signer = new docusign.Signer();
    signer.email = s.email;
    signer.name = s.name;
    signer.recipientId = String(idx + 1);
    signer.routingOrder = String(idx + 1);
    
    // Tab de firma — posicionamiento automático por anchor text o al final del documento
    const signHere = new docusign.SignHere();
    signHere.anchorString = '/firma/';
    signHere.anchorUnits = 'pixels';
    signHere.anchorXOffset = '0';
    signHere.anchorYOffset = '0';
    
    // Tab de fecha
    const dateSigned = new docusign.DateSigned();
    dateSigned.anchorString = '/fecha/';
    dateSigned.anchorUnits = 'pixels';
    dateSigned.anchorXOffset = '0';
    dateSigned.anchorYOffset = '0';
    
    signer.tabs = new docusign.Tabs();
    signer.tabs.signHereTabs = [signHere];
    signer.tabs.dateSignedTabs = [dateSigned];
    
    return signer;
  });

  const recipients = new docusign.Recipients();
  recipients.signers = signers;

  // 6. Crear envelope definition
  const envelopeDefinition = new docusign.EnvelopeDefinition();
  envelopeDefinition.emailSubject = emailSubject;
  envelopeDefinition.emailBlurb = emailMessage;
  envelopeDefinition.recipients = recipients;
  envelopeDefinition.documents = [document];
  envelopeDefinition.status = 'sent'; // Enviar inmediatamente

  // Configurar expiración y recordatorios
  const notification = new docusign.Notification();
  notification.useAccountDefaults = false;
  
  const reminders = new docusign.Reminders();
  reminders.reminderEnabled = 'true';
  reminders.reminderDelay = '3'; // Primer recordatorio a los 3 días
  reminders.reminderFrequency = '5'; // Recordatorio cada 5 días
  notification.reminders = reminders;
  
  const expirations = new docusign.Expirations();
  expirations.expireEnabled = 'true';
  expirations.expireAfter = String(expirationDays);
  expirations.expireWarn = '5'; // Aviso 5 días antes de expirar
  notification.expirations = expirations;
  
  envelopeDefinition.notification = notification;

  // 7. Enviar envelope
  const results = await envelopesApi.createEnvelope(accountId, {
    envelopeDefinition,
  });

  const envelopeId = results.envelopeId;

  logger.info('✅ [DocuSign] Envelope creado y enviado', {
    envelopeId,
    contractId,
    signatories: signatories.length,
    operator: operatorName || 'directo',
    environment: isProduction ? 'production' : 'demo',
  });

  // 8. Intentar obtener URL de firma embebida (para el primer firmante)
  let signingUrl: string | null = null;
  try {
    const viewRequest = new docusign.RecipientViewRequest();
    viewRequest.returnUrl = `${process.env.NEXTAUTH_URL || 'https://inmovaapp.com'}/firma-digital?signed=true&envelope=${envelopeId}`;
    viewRequest.authenticationMethod = 'none';
    viewRequest.email = signatories[0].email;
    viewRequest.userName = signatories[0].name;
    viewRequest.recipientId = '1';
    
    const viewResults = await envelopesApi.createRecipientView(accountId, envelopeId, {
      recipientViewRequest: viewRequest,
    });
    signingUrl = viewResults.url;
  } catch {
    // Firma remota por email — no se necesita embedded view
    logger.info('[DocuSign] Firma remota por email — firmantes recibirán enlace vía DocuSign');
  }

  return {
    id: envelopeId,
    externalId: envelopeId,
    url: signingUrl,
    documentName,
    emailSubject,
    emailMessage,
  };
}

// ============================================
// PROVEEDOR: SIGNATURIT (eIDAS UE)
// ============================================

/**
 * Signaturit — Firma electrónica cualificada conforme eIDAS
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
