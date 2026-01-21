import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const policySchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  nivelEmpleado: z.enum(['standard', 'sales', 'executive', 'custom']).optional(),
  activa: z.boolean().optional(),
  limites: z
    .object({
      hotelNoche: z.number().min(0).optional(),
      vueloDomestico: z.number().min(0).optional(),
      vueloEuropeo: z.number().min(0).optional(),
      vueloIntercontinental: z.number().min(0).optional(),
      dietaDiaria: z.number().min(0).optional(),
      transporteLocal: z.number().min(0).optional(),
    })
    .optional(),
  restricciones: z
    .object({
      claseVuelo: z.string().optional(),
      categoriaHotel: z.string().optional(),
      anticipacionReserva: z.number().min(0).optional(),
      aprobacionRequerida: z.boolean().optional(),
      nivelAprobacion: z.string().nullable().optional(),
    })
    .optional(),
  proveedoresAutorizados: z.array(z.string().min(1)).optional(),
  excepciones: z.string().optional(),
});

const updateSchema = z.object({
  id: z.string().min(1),
  updates: policySchema.partial(),
});

const getPolicies = (metadata: any) => {
  const policies = metadata?.politicasViaje || [];
  return Array.isArray(policies) ? policies : [];
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { metadata: true },
    });

    const policies = getPolicies(company?.metadata);
    return NextResponse.json({ success: true, data: policies });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = policySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Datos invalidos', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { metadata: true },
    });

    const policies = getPolicies(company?.metadata);
    const newPolicy = {
      id: `POL-${Date.now()}`,
      nombre: validationResult.data.nombre,
      descripcion: validationResult.data.descripcion || '',
      nivelEmpleado: validationResult.data.nivelEmpleado || 'standard',
      activa: validationResult.data.activa ?? true,
      limites: {
        hotelNoche: validationResult.data.limites?.hotelNoche ?? 0,
        vueloDomestico: validationResult.data.limites?.vueloDomestico ?? 0,
        vueloEuropeo: validationResult.data.limites?.vueloEuropeo ?? 0,
        vueloIntercontinental: validationResult.data.limites?.vueloIntercontinental ?? 0,
        dietaDiaria: validationResult.data.limites?.dietaDiaria ?? 0,
        transporteLocal: validationResult.data.limites?.transporteLocal ?? 0,
      },
      restricciones: {
        claseVuelo: validationResult.data.restricciones?.claseVuelo || '',
        categoriaHotel: validationResult.data.restricciones?.categoriaHotel || '',
        anticipacionReserva: validationResult.data.restricciones?.anticipacionReserva ?? 0,
        aprobacionRequerida: validationResult.data.restricciones?.aprobacionRequerida ?? true,
        nivelAprobacion: validationResult.data.restricciones?.nivelAprobacion ?? null,
      },
      proveedoresAutorizados: validationResult.data.proveedoresAutorizados || [],
      excepciones: validationResult.data.excepciones || '',
      fechaCreacion: new Date().toISOString(),
      ultimaModificacion: new Date().toISOString(),
    };

    const updatedPolicies = [newPolicy, ...policies];

    await prisma.company.update({
      where: { id: session.user.companyId },
      data: {
        metadata: {
          ...(company?.metadata as object),
          politicasViaje: updatedPolicies,
        },
      },
    });

    return NextResponse.json({ success: true, data: newPolicy }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = updateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Datos invalidos', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { metadata: true },
    });

    const policies = getPolicies(company?.metadata);
    const updated = policies.map((policy: any) => {
      if (policy.id !== validationResult.data.id) return policy;
      return {
        ...policy,
        ...validationResult.data.updates,
        limites: {
          ...(policy.limites || {}),
          ...(validationResult.data.updates.limites || {}),
        },
        restricciones: {
          ...(policy.restricciones || {}),
          ...(validationResult.data.updates.restricciones || {}),
        },
        proveedoresAutorizados:
          validationResult.data.updates.proveedoresAutorizados ?? policy.proveedoresAutorizados,
        ultimaModificacion: new Date().toISOString(),
      };
    });

    await prisma.company.update({
      where: { id: session.user.companyId },
      data: {
        metadata: {
          ...(company?.metadata as object),
          politicasViaje: updated,
        },
      },
    });

    const updatedPolicy = updated.find((policy: any) => policy.id === validationResult.data.id);
    return NextResponse.json({ success: true, data: updatedPolicy });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
