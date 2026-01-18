import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

interface SignatureProvider {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  compliance: string[];
  stats: {
    envelopes: number;
    signed: number;
    pending: number;
    rate: string;
  };
}

interface SignatureSummary {
  totalEnvelopes: number;
  totalSigned: number;
  totalPending: number;
  completionRate: number;
}

interface DocumentTemplate {
  name: string;
  provider: string;
  uses: number;
}

interface CompanySignatures {
  name: string;
  documents: number;
  pending: number;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['super_admin', 'admin', 'SUPER_ADMIN', 'ADMIN'].includes(session.user?.role || '')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar configuración desde variables de entorno
    const docusignConnected = !!(process.env.DOCUSIGN_INTEGRATION_KEY && process.env.DOCUSIGN_ACCOUNT_ID);
    const signaturitConnected = !!(process.env.SIGNATURIT_API_TOKEN);

    // Intentar obtener datos reales de contratos/firmas
    let signatureStats = { total: 0, signed: 0, pending: 0 };

    try {
      // Contar contratos si la tabla existe
      const contracts = await prisma.contract.findMany({
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(1)) // Desde el primer día del mes
          }
        },
        select: {
          status: true
        }
      });

      signatureStats = {
        total: contracts.length,
        signed: contracts.filter(c => c.status === 'signed' || c.status === 'active').length,
        pending: contracts.filter(c => c.status === 'pending_signature' || c.status === 'draft').length
      };
    } catch (dbError) {
      logger.warn('Error consultando contratos:', dbError);
    }

    // Distribuir entre proveedores
    const docusignPercent = 0.6;
    const signaturitPercent = 0.4;

    const providers: SignatureProvider[] = [
      {
        id: 'docusign',
        name: 'DocuSign',
        description: 'Firma electrónica avanzada internacional',
        status: docusignConnected ? 'connected' : 'disconnected',
        compliance: ['eIDAS', 'ESIGN', 'UETA'],
        stats: {
          envelopes: Math.round(signatureStats.total * docusignPercent),
          signed: Math.round(signatureStats.signed * docusignPercent),
          pending: Math.round(signatureStats.pending * docusignPercent),
          rate: signatureStats.total > 0 
            ? `${Math.round((signatureStats.signed / signatureStats.total) * 100)}%` 
            : '0%'
        }
      },
      {
        id: 'signaturit',
        name: 'Signaturit',
        description: 'Firma electrónica cualificada España/UE',
        status: signaturitConnected ? 'connected' : 'disconnected',
        compliance: ['eIDAS QES', 'LOPD'],
        stats: {
          envelopes: Math.round(signatureStats.total * signaturitPercent),
          signed: Math.round(signatureStats.signed * signaturitPercent),
          pending: Math.round(signatureStats.pending * signaturitPercent),
          rate: signatureStats.total > 0 
            ? `${Math.round((signatureStats.signed / signatureStats.total) * 100)}%` 
            : '0%'
        }
      },
    ];

    // Resumen global
    const summary: SignatureSummary = {
      totalEnvelopes: signatureStats.total,
      totalSigned: signatureStats.signed,
      totalPending: signatureStats.pending,
      completionRate: signatureStats.total > 0 
        ? Math.round((signatureStats.signed / signatureStats.total) * 1000) / 10 
        : 0
    };

    // Plantillas de documentos (estáticas por ahora)
    const documentTemplates: DocumentTemplate[] = [
      { name: 'Contrato de Arrendamiento', provider: 'DocuSign', uses: 0 },
      { name: 'Anexo de Inventario', provider: 'DocuSign', uses: 0 },
      { name: 'Fianza y Depósito', provider: 'Signaturit', uses: 0 },
      { name: 'Acta de Entrega de Llaves', provider: 'Signaturit', uses: 0 },
      { name: 'Rescisión de Contrato', provider: 'DocuSign', uses: 0 },
    ];

    // Empresas con firma activa
    let companiesWithSignatures: CompanySignatures[] = [];
    try {
      const companies = await prisma.company.findMany({
        where: {
          activo: true,
        },
        select: {
          nombre: true,
          contracts: {
            select: { status: true }
          }
        },
        take: 5
      });

      companiesWithSignatures = companies
        .filter(c => c.contracts.length > 0)
        .map(c => ({
          name: c.nombre,
          documents: c.contracts.filter(ct => ct.status === 'signed' || ct.status === 'active').length,
          pending: c.contracts.filter(ct => ct.status === 'pending_signature' || ct.status === 'draft').length
        }));
    } catch (dbError) {
      logger.warn('Error consultando empresas con firmas:', dbError);
    }

    return NextResponse.json({
      providers,
      summary,
      documentTemplates,
      companiesWithSignatures
    });
  } catch (error) {
    logger.error('Error al obtener estado de firma digital:', error);
    return NextResponse.json(
      { error: 'Error al obtener estado' },
      { status: 500 }
    );
  }
}
