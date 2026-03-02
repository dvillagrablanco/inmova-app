import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { BANK_ENTITIES, getBankEntity } from '@/lib/family-office/banking-integrations';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * POST /api/family-office/connect-bank
 * Iniciar conexión con una entidad bancaria.
 * Para PSD2: genera link de autorización Nordigen.
 * Para SWIFT/OCR: registra la cuenta para import manual.
 */
export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { entityId, numeroCuenta, alias } = await request.json();
    const entity = getBankEntity(entityId);

    if (!entity) {
      return NextResponse.json({
        error: 'Entidad no soportada',
        entidadesDisponibles: BANK_ENTITIES.map((e) => ({ id: e.id, name: e.name, level: e.integrationLevel })),
      }, { status: 400 });
    }

    // Crear cuenta financiera
    const account = await prisma.financialAccount.create({
      data: {
        companyId: session.user.companyId,
        entidad: entity.name,
        tipoEntidad: entity.type,
        numeroCuenta: numeroCuenta || null,
        alias: alias || `${entity.name}`,
        divisa: entity.country === 'CH' ? 'CHF' : 'EUR',
        conexionTipo: entity.integrationLevel,
        activa: true,
        apiConfig: {
          entityId: entity.id,
          nordigenInstitutionId: entity.nordigenInstitutionId || null,
          swiftBIC: entity.swiftBIC || null,
          country: entity.country,
        },
      },
    });

    let connectionUrl = null;

    // Para PSD2: generar link de autorización via Nordigen
    if (entity.integrationLevel === 'psd2' && entity.nordigenInstitutionId) {
      try {
        const { createRequisition, isNordigenConfigured } = await import('@/lib/nordigen-service');
        if (isNordigenConfigured()) {
          const requisition = await createRequisition({
            institutionId: entity.nordigenInstitutionId,
            companyId: session.user.companyId,
            userId: session.user.id,
          });
          if (requisition) {
            connectionUrl = requisition.link;
            // Save requisition ID for callback
            await prisma.financialAccount.update({
              where: { id: account.id },
              data: {
                apiConfig: {
                  ...((account.apiConfig as Record<string, unknown>) || {}),
                  nordigenRequisitionId: requisition.requisitionId,
                },
              },
            });
            logger.info(`[FO Connect] Nordigen requisition created: ${requisition.requisitionId}`);
          }
        } else {
          // Nordigen not configured — provide manual link
          connectionUrl = `https://ob.nordigen.com/psd2/start/${entity.nordigenInstitutionId}/${account.id}`;
          logger.info(`[FO Connect] Nordigen not configured, using stub link`);
        }
      } catch (err) {
        logger.warn('[FO Connect] Nordigen requisition failed, using stub:', err);
        connectionUrl = `https://ob.nordigen.com/psd2/start/${entity.nordigenInstitutionId}/${account.id}`;
      }
    }

    return NextResponse.json({
      success: true,
      account,
      entity: {
        name: entity.name,
        integrationLevel: entity.integrationLevel,
        capabilities: entity.capabilities,
      },
      connectionUrl,
      nextStep: entity.integrationLevel === 'psd2'
        ? 'Autoriza la conexión en el link proporcionado'
        : entity.integrationLevel === 'swift'
          ? 'Sube extractos SWIFT MT940/MT535 en la sección de importación'
          : 'Sube extractos PDF en la sección de importación',
    }, { status: 201 });
  } catch (error: any) {
    logger.error('[FO Connect Bank]:', error);
    return NextResponse.json({ error: 'Error conectando banco' }, { status: 500 });
  }
}
