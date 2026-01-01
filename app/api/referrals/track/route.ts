import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const trackSchema = z.object({
  codigoReferido: z.string(),
  origenInvitacion: z.string().optional(),
});

/**
 * API para trackear y crear relación Partner-Client (Referral)
 * Se llama cuando un partner refiere un nuevo cliente
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = trackSchema.parse(body);

    // Buscar partner por código de referido
    const partner = await prisma.partner.findFirst({
      where: {
        // Assuming Partner has some reference code field
        // If not, we'd need to add it or use another identifier
        activo: true,
      },
    });

    if (!partner) {
      return NextResponse.json({ error: 'Código de referido inválido' }, { status: 404 });
    }

    // Note: Company creation happens in signup flow
    // This endpoint can be used to track referral intent
    return NextResponse.json({
      success: true,
      data: {
        partnerId: partner.id,
        nombre: partner.nombre,
        tipo: partner.tipo,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[Referral Track Error]:', error);
    return NextResponse.json({ error: 'Error registrando referral' }, { status: 500 });
  }
}

/**
 * API para crear relación PartnerClient cuando el usuario se registra
 * Se llama desde el proceso de registro de nuevas companies
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { partnerId, companyId, codigoReferido, origenInvitacion } = body;

    if (!partnerId || !companyId) {
      return NextResponse.json(
        { error: 'partnerId y companyId requeridos' },
        { status: 400 }
      );
    }

    // Verificar que partner y company existen
    const [partner, company] = await Promise.all([
      prisma.partner.findUnique({ where: { id: partnerId } }),
      prisma.company.findUnique({ where: { id: companyId } }),
    ]);

    if (!partner || !company) {
      return NextResponse.json(
        { error: 'Partner o Company no encontrado' },
        { status: 404 }
      );
    }

    // Crear relación PartnerClient
    const partnerClient = await prisma.partnerClient.create({
      data: {
        partnerId,
        companyId,
        estado: 'activo',
        origenInvitacion: origenInvitacion || 'directo',
        codigoReferido,
        fechaActivacion: new Date(),
      },
      include: {
        partner: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
          },
        },
        company: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    // Actualizar contadores del partner si existen
    await prisma.partner.update({
      where: { id: partnerId },
      data: {
        ultimoAcceso: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        partnerClientId: partnerClient.id,
        partner: partnerClient.partner,
        company: partnerClient.company,
      },
    });
  } catch (error: any) {
    console.error('[Referral Update Error]:', error);
    return NextResponse.json(
      { error: 'Error creando relación partner-client' },
      { status: 500 }
    );
  }
}
