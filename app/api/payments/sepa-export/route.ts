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

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatIban(iban: string): string {
  return (iban || '').replace(/\s/g, '').toUpperCase();
}

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Genera una remesa SEPA simplificada en formato pain.008.001.02
 * para pagos pendientes de domiciliación con inquilinos que tienen IBAN.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const scope = await resolveCompanyScope({
      userId: session.user.id as string,
      role: (session.user as any).role,
      primaryCompanyId: session.user?.companyId,
      request: req,
    });

    if (!scope.activeCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }

    const prisma = await getPrisma();
    const companyFilter =
      scope.scopeCompanyIds.length > 1
        ? { in: scope.scopeCompanyIds }
        : scope.activeCompanyId;

    const company = await prisma.company.findUnique({
      where: { id: scope.activeCompanyId },
      select: { nombre: true, iban: true, cif: true },
    });

    if (!company?.iban) {
      return NextResponse.json(
        { error: 'La empresa no tiene IBAN configurado para remesas SEPA' },
        { status: 400 }
      );
    }

    const payments = await prisma.payment.findMany({
      where: {
        estado: 'pendiente',
        contract: {
          unit: { building: { companyId: companyFilter } },
          tenant: { iban: { not: null } },
        },
      },
      include: {
        contract: {
          include: {
            tenant: { select: { id: true, nombreCompleto: true, iban: true } },
            unit: { select: { numero: true, building: { select: { nombre: true } } } },
          },
        },
      },
      orderBy: { fechaVencimiento: 'asc' },
    });

    if (payments.length === 0) {
      return NextResponse.json(
        { error: 'No hay pagos pendientes con IBAN para domiciliación' },
        { status: 404 }
      );
    }

    const msgId = `SEPA-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const creDtTm = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15);
    const ctrlSum = payments.reduce((sum, p) => sum + Number(p.monto), 0);

    const drctDbtTxInfList = payments
      .filter((p) => p.contract?.tenant?.iban)
      .map((p, idx) => {
        const tenant = p.contract!.tenant!;
        const iban = formatIban(tenant.iban!);
        const amt = formatAmount(Number(p.monto));
        const endToEndId = `PAG-${p.id}-${idx + 1}`;
        const mndtId = `MND-${tenant.id}`;
        return `    <DrctDbtTxInf>
      <PmtId>
        <EndToEndId>${escapeXml(endToEndId)}</EndToEndId>
      </PmtId>
      <InstdAmt Ccy="EUR">${amt}</InstdAmt>
      <DrctDbtTx>
        <MndtRltdInf>
          <MndtId>${escapeXml(mndtId)}</MndtId>
        </MndtRltdInf>
        <DbtrAgt>
          <FinInstnId/>
        </DbtrAgt>
        <Dbtr>
          <Nm>${escapeXml(tenant.nombreCompleto || 'Inquilino')}</Nm>
        </Dbtr>
        <DbtrAcct>
          <Id>
            <IBAN>${iban}</IBAN>
          </Id>
        </DbtrAcct>
        <RmtInf>
          <Ustrd>${escapeXml(p.periodo || p.concepto || 'Alquiler')}</Ustrd>
        </RmtInf>
      </DrctDbtTx>
    </DrctDbtTxInf>`;
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.001.02" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <CstmrDrctDbtInitn>
    <GrpHdr>
      <MsgId>${escapeXml(msgId)}</MsgId>
      <CreDtTm>${creDtTm}</CreDtTm>
      <NbOfTxs>${payments.length}</NbOfTxs>
      <CtrlSum>${formatAmount(ctrlSum)}</CtrlSum>
      <InitgPty>
        <Nm>${escapeXml(company.nombre || 'Empresa')}</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${escapeXml(msgId)}-PMT</PmtInfId>
      <PmtMtd>DD</PmtMtd>
      <ReqdColltnDt>${new Date().toISOString().slice(0, 10)}</ReqdColltnDt>
      <Cdtr>
        <Nm>${escapeXml(company.nombre || 'Empresa')}</Nm>
      </Cdtr>
      <CdtrAcct>
        <Id>
          <IBAN>${formatIban(company.iban)}</IBAN>
        </Id>
      </CdtrAcct>
      <CdtrAgt>
        <FinInstnId/>
      </CdtrAgt>
      <CdtrSchmeId>
        <Id>
          <PrvtId>
            <Othr>
              <Id>${escapeXml(company.cif || 'CIF')}</Id>
            </Othr>
          </PrvtId>
        </Id>
      </CdtrSchmeId>
${drctDbtTxInfList}
    </PmtInf>
  </CstmrDrctDbtInitn>
</Document>`;

    const filename = `remesa-sepa-${new Date().toISOString().slice(0, 10)}.xml`;

    logger.info('SEPA export generated', {
      userId: session.user.id,
      companyId: scope.activeCompanyId,
      paymentCount: payments.length,
      totalAmount: ctrlSum,
    });

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    logger.error('SEPA export error', { error });
    return NextResponse.json(
      { error: 'Error generando remesa SEPA' },
      { status: 500 }
    );
  }
}
