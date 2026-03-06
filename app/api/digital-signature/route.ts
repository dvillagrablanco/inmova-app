import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { resolveCompanyScope } from '@/lib/company-scope';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = await getPrisma();
    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: (session.user as any).role,
      primaryCompanyId: (session.user as any).companyId,
      request: req,
    });

    if (!scope.activeCompanyId) {
      return NextResponse.json([]);
    }

    const companyFilter =
      scope.scopeCompanyIds.length > 1 ? { in: scope.scopeCompanyIds } : scope.activeCompanyId;

    const documentos = await prisma.documentoFirma.findMany({
      where: { companyId: companyFilter },
      include: {
        firmantes: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
            estado: true,
          },
        },
        tenant: { select: { nombreCompleto: true } },
        contract: {
          select: {
            unit: {
              select: {
                numero: true,
                building: { select: { nombre: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = documentos.map((doc) => ({
      id: doc.id,
      titulo: doc.titulo,
      tipoDocumento: doc.tipoDocumento,
      estado: mapEstado(doc.estado),
      documentUrl: doc.urlDocumento || '',
      fechaExpiracion: doc.fechaExpiracion.toISOString(),
      createdAt: doc.createdAt.toISOString(),
      firmantes: doc.firmantes.map((f) => ({
        id: f.id,
        nombre: f.nombre,
        email: f.email,
        rol: f.rol,
        estado: f.estado,
      })),
      tenant: doc.tenant ? { nombreCompleto: doc.tenant.nombreCompleto } : undefined,
      contract: doc.contract
        ? {
            unit: {
              numero: doc.contract.unit.numero,
              building: { nombre: doc.contract.unit.building.nombre },
            },
          }
        : undefined,
    }));

    return NextResponse.json(mapped);
  } catch (error: any) {
    logger.error('[Digital Signature] Error listing:', error);
    return NextResponse.json({ error: 'Error obteniendo documentos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const prisma = await getPrisma();
    const companyId = (session.user as any).companyId;
    const body = await req.json();
    const {
      titulo,
      tipoDocumento,
      contractId,
      tenantId,
      firmantes,
      diasExpiracion,
      // Nuevos campos para envío a DocuSign
      sendToSign,
      documentUrl,
      provider,
      operatorName,
    } = body;

    if (!titulo || !tipoDocumento) {
      return NextResponse.json({ error: 'Título y tipo de documento requeridos' }, { status: 400 });
    }

    const expDays = diasExpiracion || 30;
    const fechaExpiracion = new Date(Date.now() + expDays * 24 * 60 * 60 * 1000);

    const documento = await prisma.documentoFirma.create({
      data: {
        companyId,
        titulo,
        tipoDocumento,
        contractId: contractId || null,
        tenantId: tenantId || null,
        estado: 'PENDING',
        fechaExpiracion,
        urlDocumento: documentUrl || null,
        creadoPor: session.user.id as string,
        firmantes: {
          create: (firmantes || []).map((f: any, i: number) => ({
            nombre: f.nombre,
            email: f.email,
            rol: f.rol || 'firmante',
            orden: i + 1,
          })),
        },
      },
      include: { firmantes: true },
    });

    // Si se pide enviar a firma y hay contractId + documentUrl, usar la API de firma
    let signatureResult = null;
    if (sendToSign && contractId && documentUrl && firmantes?.length > 0) {
      try {
        const { isDocuSignConfigured, isSignaturitConfigured } = await import('@/lib/digital-signature-service');
        const activeProvider = provider || (isDocuSignConfigured() ? 'DOCUSIGN' : isSignaturitConfigured() ? 'SIGNATURIT' : null);

        if (activeProvider) {
          const { createSignatureRequest } = await import('@/lib/digital-signature-service');
          signatureResult = await createSignatureRequest({
            contractId,
            companyId,
            documentUrl,
            documentName: titulo,
            signatories: firmantes.map((f: any) => ({
              name: f.nombre,
              email: f.email,
              role: f.rol === 'propietario' ? 'LANDLORD' : f.rol === 'inquilino' ? 'TENANT' : 'OTHER',
            })),
            provider: activeProvider,
            emailSubject: operatorName
              ? `Firma contrato ${operatorName} - ${titulo}`
              : `Firma de contrato: ${titulo}`,
            emailMessage: operatorName
              ? `Contrato de media estancia con ${operatorName}. Por favor, revisa y firma.`
              : 'Por favor, revisa y firma el documento adjunto.',
            expiresInDays: expDays,
            requestedBy: session.user.id as string,
          });

          // Update DocumentoFirma with signature info
          await prisma.documentoFirma.update({
            where: { id: documento.id },
            data: {
              signaturitId: signatureResult.externalId || signatureResult.signatureId,
              estado: 'PENDING',
            },
          });
        }
      } catch (signErr: any) {
        logger.warn('[Digital Signature] Could not send to sign:', signErr.message);
        // Don't fail the creation, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      documento,
      ...(signatureResult && {
        signature: {
          id: signatureResult.signatureId,
          provider: provider || 'DOCUSIGN',
          signingUrl: signatureResult.signingUrl,
          status: signatureResult.status,
        },
      }),
    }, { status: 201 });
  } catch (error: any) {
    logger.error('[Digital Signature] Error creating:', error);
    return NextResponse.json({ error: 'Error creando documento' }, { status: 500 });
  }
}

function mapEstado(estado: string): string {
  const map: Record<string, string> = {
    PENDING: 'pendiente',
    SIGNED: 'firmado',
    DECLINED: 'rechazado',
    EXPIRED: 'expirado',
    CANCELLED: 'cancelado',
  };
  return map[estado] || estado;
}
