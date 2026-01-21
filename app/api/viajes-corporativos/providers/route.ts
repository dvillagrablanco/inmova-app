import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const providerSchema = z.object({
  nombre: z.string().min(1),
  tipo: z.enum(['hotel', 'aerolinea', 'alquiler', 'transporte', 'otro']),
  descuento: z.string().min(1).optional(),
  contrato: z.string().min(1).optional(),
  vencimiento: z.string().min(1).optional(),
});

const getProviders = (metadata: any) => {
  const providers = metadata?.proveedoresViaje || [];
  return Array.isArray(providers) ? providers : [];
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

    return NextResponse.json({ success: true, data: getProviders(company?.metadata) });
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
    const validationResult = providerSchema.safeParse(body);
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

    const providers = getProviders(company?.metadata);
    const newProvider = {
      id: `PROV-${Date.now()}`,
      nombre: validationResult.data.nombre,
      tipo: validationResult.data.tipo,
      descuento: validationResult.data.descuento || '0%',
      contrato: validationResult.data.contrato || 'Activo',
      vencimiento: validationResult.data.vencimiento || new Date().toISOString().slice(0, 10),
    };

    const updatedProviders = [newProvider, ...providers];

    await prisma.company.update({
      where: { id: session.user.companyId },
      data: {
        metadata: {
          ...(company?.metadata as object),
          proveedoresViaje: updatedProviders,
        },
      },
    });

    return NextResponse.json({ success: true, data: newProvider }, { status: 201 });
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
    const validationResult = z
      .object({
        id: z.string().min(1),
        updates: providerSchema.partial(),
      })
      .safeParse(body);

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

    const providers = getProviders(company?.metadata);
    const updatedProviders = providers.map((provider: any) => {
      if (provider.id !== validationResult.data.id) return provider;
      return {
        ...provider,
        ...validationResult.data.updates,
      };
    });

    await prisma.company.update({
      where: { id: session.user.companyId },
      data: {
        metadata: {
          ...(company?.metadata as object),
          proveedoresViaje: updatedProviders,
        },
      },
    });

    const updatedProvider = updatedProviders.find(
      (provider: any) => provider.id === validationResult.data.id
    );

    return NextResponse.json({ success: true, data: updatedProvider });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Id requerido' }, { status: 400 });
    }

    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { metadata: true },
    });

    const providers = getProviders(company?.metadata);
    const updatedProviders = providers.filter((provider: any) => provider.id !== id);

    await prisma.company.update({
      where: { id: session.user.companyId },
      data: {
        metadata: {
          ...(company?.metadata as object),
          proveedoresViaje: updatedProviders,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
