import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  registerEnergyCertificate,
  registerHabitabilityCertificate,
  checkCEEExpirations,
  CreateCEEParams,
  CreateHabitabilityParams,
} from '@/lib/services/compliance-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/compliance/certificates:
 *   get:
 *     summary: Obtener certificados (CEE, habitabilidad)
 *     tags: [Cumplimiento]
 *   post:
 *     summary: Registrar nuevo certificado
 *     tags: [Cumplimiento]
 */

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'energy' o 'habitability'
    const companyId = searchParams.get('companyId');
    const unitId = searchParams.get('unitId');

    if (type === 'energy') {
      const where: any = {};
      if (companyId) where.companyId = companyId;
      if (unitId) where.unitId = unitId;

      const certificates = await prisma.energyCertificate.findMany({
        where,
        include: {
          unit: {
            include: { building: true },
          },
        },
        orderBy: { fechaEmision: 'desc' },
      });

      return NextResponse.json(certificates);
    }

    if (type === 'habitability') {
      const where: any = {};
      if (companyId) where.companyId = companyId;
      if (unitId) where.unitId = unitId;

      const certificates = await prisma.habitabilityCertificate.findMany({
        where,
        include: {
          unit: {
            include: { building: true },
          },
        },
        orderBy: { fechaEmision: 'desc' },
      });

      return NextResponse.json(certificates);
    }

    return NextResponse.json({ error: 'Tipo de certificado no válido' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener certificados' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await req.json();

    if (body.type === 'energy') {
      // Registrar CEE
      const params: CreateCEEParams = {
        unitId: body.unitId,
        companyId: body.companyId,
        calificacion: body.calificacion,
        numeroCertificado: body.numeroCertificado,
        nombreTecnico: body.nombreTecnico,
        fechaEmision: new Date(body.fechaEmision),
        validezAnios: body.validezAnios,
      };

      const certificate = await registerEnergyCertificate(params);
      return NextResponse.json(certificate, { status: 201 });
    }

    if (body.type === 'habitability') {
      // Registrar cédula de habitabilidad
      const params: CreateHabitabilityParams = {
        unitId: body.unitId,
        companyId: body.companyId,
        numeroCedula: body.numeroCedula,
        fechaEmision: new Date(body.fechaEmision),
        ccaa: body.ccaa,
        validezAnios: body.validezAnios,
      };

      const certificate = await registerHabitabilityCertificate(params);
      return NextResponse.json(certificate, { status: 201 });
    }

    if (body.action === 'check_expirations' && body.type === 'energy') {
      // Verificar certificados próximos a vencer
      const expiringCerts = await checkCEEExpirations(body.companyId, body.diasAnticipacion || 90);
      return NextResponse.json(expiringCerts);
    }

    return NextResponse.json({ error: 'Tipo o acción no válida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al registrar certificado' },
      { status: 500 }
    );
  }
}
