// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

const createSchema = z.object({
  tipoSeguro: z.string().min(1),
  descripcion: z.string().min(1),
  sumaAsegurada: z.number().positive().optional().nullable(),
  coberturasSolicitadas: z.array(z.string()).default([]),
  direccionInmueble: z.string().optional().nullable(),
  superficieM2: z.number().positive().optional().nullable(),
  anoConstruccion: z.number().int().optional().nullable(),
  usoPrincipal: z.string().optional().nullable(),
  buildingId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  fechaLimiteRespuesta: z.string().optional().nullable(),
  proveedorIds: z.array(z.string()).min(1, 'Selecciona al menos un proveedor'),
  estado: z.string().default('borrador'),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = await getPrisma();

    const solicitudes = await prisma.insuranceQuoteRequest.findMany({
      where: { companyId: session.user.companyId },
      include: {
        company: { select: { id: true, nombre: true } },
        building: { select: { id: true, nombre: true, direccion: true } },
        proveedores: {
          include: {
            provider: { select: { id: true, nombre: true, email: true } },
          },
        },
        _count: { select: { quotations: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(solicitudes);
  } catch (error) {
    logger.error('[API] Error listing quote requests:', error);
    return NextResponse.json(
      { error: 'Error al obtener solicitudes de cotización' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { proveedorIds, fechaLimiteRespuesta, ...data } = parsed.data;

    const { generateQuoteRequestCode } = await import('@/lib/insurance/quote-request-service');
    const codigo = await generateQuoteRequestCode();

    const prisma = await getPrisma();

    const solicitud = await prisma.insuranceQuoteRequest.create({
      data: {
        ...data,
        codigo,
        companyId: session.user.companyId,
        creadoPor: session.user.id,
        tipoSeguro: data.tipoSeguro as any,
        estado: data.estado as any,
        fechaLimiteRespuesta: fechaLimiteRespuesta ? new Date(fechaLimiteRespuesta) : null,
        proveedores: {
          create: proveedorIds.map((providerId) => ({ providerId })),
        },
      },
      include: {
        company: { select: { id: true, nombre: true } },
        building: { select: { id: true, nombre: true, direccion: true } },
        proveedores: {
          include: {
            provider: { select: { id: true, nombre: true, email: true } },
          },
        },
        _count: { select: { quotations: true } },
      },
    });

    return NextResponse.json(solicitud, { status: 201 });
  } catch (error) {
    logger.error('[API] Error creating quote request:', error);
    return NextResponse.json({ error: 'Error al crear solicitud de cotización' }, { status: 500 });
  }
}
