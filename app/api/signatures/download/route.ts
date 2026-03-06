/**
 * POST /api/signatures/download
 * Descarga un documento firmado desde DocuSign y lo guarda en S3
 * 
 * Body: { signatureId: string }
 * 
 * Flujo:
 * 1. Busca ContractSignature con status SIGNED
 * 2. Descarga el combined document de DocuSign
 * 3. Sube a S3 como signed-{contractId}-{timestamp}.pdf
 * 4. Actualiza ContractSignature.completedUrl y Contract.contractPdfPath
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function POST(req: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const { signatureId } = await req.json();

    if (!signatureId) {
      return NextResponse.json({ error: 'signatureId requerido' }, { status: 400 });
    }

    // 1. Find signature
    const signature = await prisma.contractSignature.findFirst({
      where: { id: signatureId, companyId, status: 'SIGNED' },
    });

    if (!signature) {
      return NextResponse.json({ error: 'Firma no encontrada o no completada' }, { status: 404 });
    }

    if (signature.provider !== 'DOCUSIGN' || !signature.externalId) {
      return NextResponse.json({ error: 'Solo soportado para firmas de DocuSign' }, { status: 400 });
    }

    // 2. Download from DocuSign
    const docusignModule = 'docusign-esign';
    const docusign = await import(/* webpackIgnore: true */ docusignModule);
    const integrationKey = process.env.DOCUSIGN_INTEGRATION_KEY!;
    const userId = process.env.DOCUSIGN_USER_ID!;
    const accountId = process.env.DOCUSIGN_ACCOUNT_ID!;
    const basePath = process.env.DOCUSIGN_BASE_PATH || 'https://www.docusign.net/restapi';
    const privateKey = (process.env.DOCUSIGN_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    const isProduction = !basePath.includes('demo');
    const oAuthHost = isProduction ? 'account.docusign.com' : 'account-d.docusign.com';

    const apiClient = new docusign.ApiClient();
    apiClient.setOAuthBasePath(oAuthHost);
    
    const authResult = await apiClient.requestJWTUserToken(
      integrationKey, userId, ['signature', 'impersonation'],
      Buffer.from(privateKey, 'utf8'), 3600
    );

    apiClient.setBasePath(basePath);
    apiClient.addDefaultHeader('Authorization', `Bearer ${authResult.body.access_token}`);

    const envelopesApi = new docusign.EnvelopesApi(apiClient);
    const documentBuffer = await envelopesApi.getDocument(accountId, signature.externalId, 'combined');
    const pdfBuffer = Buffer.from(documentBuffer);

    logger.info('[SignedDoc Download] Downloaded from DocuSign', {
      envelopeId: signature.externalId,
      size: pdfBuffer.length,
    });

    // 3. Upload to S3
    const timestamp = Date.now();
    const s3Key = `contratos/firmados/signed-${signature.contractId}-${timestamp}.pdf`;
    
    try {
      const { uploadFile } = await import('@/lib/s3');
      await uploadFile(s3Key, pdfBuffer, 'application/pdf');
      
      logger.info('[SignedDoc Download] Uploaded to S3', { key: s3Key });

      // 4. Update ContractSignature
      await prisma.contractSignature.update({
        where: { id: signatureId },
        data: { completedUrl: s3Key },
      });

      // 5. Update Contract.contractPdfPath with signed version
      if (signature.contractId && !signature.contractId.startsWith('operator-')) {
        try {
          await prisma.contract.update({
            where: { id: signature.contractId },
            data: { contractPdfPath: s3Key },
          });
        } catch {
          // Contract might not exist if it's an operator-generated ID
        }
      }

      // 6. Update OperatorSignatureRequest if applicable
      try {
        await prisma.operatorSignatureRequest.updateMany({
          where: { signatureId: signatureId, status: 'sent_to_sign' },
          data: { status: 'signed', signedAt: new Date() },
        });
      } catch {
        // May not have operator request
      }

      return NextResponse.json({
        success: true,
        s3Key,
        size: pdfBuffer.length,
        message: 'Documento firmado descargado y guardado en S3',
      });
    } catch (s3Error: any) {
      logger.error('[SignedDoc Download] S3 upload failed:', s3Error.message);
      
      // Still return the PDF directly if S3 fails
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="signed-${signature.contractId}.pdf"`,
          'Content-Length': String(pdfBuffer.length),
        },
      });
    }
  } catch (error: any) {
    logger.error('[SignedDoc Download] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
