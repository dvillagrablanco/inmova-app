import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/permissions';
import logger from '@/lib/logger';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const itemSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  descripcion: z.string(),
  estado: z.enum(['activo', 'inactivo']),
  createdAt: z.string(),
});

const createSchema = z.object({
  nombre: z.string().min(3),
  descripcion: z.string().min(1),
  estado: z.enum(['activo', 'inactivo']).default('activo'),
});

const updateSchema = z.object({
  id: z.string().min(1),
  updates: z.object({
    nombre: z.string().min(3).optional(),
    descripcion: z.string().min(1).optional(),
    estado: z.enum(['activo', 'inactivo']).optional(),
  }),
});

type UXItem = z.infer<typeof itemSchema>;

const normalizeItems = (metadata: any): UXItem[] => {
  const rawItems = Array.isArray(metadata?.uxItems) ? metadata.uxItems : [];
  const parsed = z.array(itemSchema).safeParse(rawItems);
  if (!parsed.success) {
    logger.warn('[Ejemplo UX] metadata.uxItems inválido, reiniciando');
    return [];
  }
  return parsed.data;
};

export async function GET() {
  try {
    const user = await requireAuth();
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { metadata: true },
    });
    const items = normalizeItems(company?.metadata);

    return NextResponse.json({ data: items });
  } catch (error) {
    logger.error('[Ejemplo UX] Error al obtener items', error);
    return NextResponse.json({ error: 'Error al obtener items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = createSchema.parse(body);

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { metadata: true },
    });

    const items = normalizeItems(company?.metadata);
    const newItem: UXItem = {
      id: crypto.randomUUID(),
      nombre: validated.nombre,
      descripcion: validated.descripcion,
      estado: validated.estado,
      createdAt: new Date().toISOString(),
    };

    const updatedMetadata = {
      ...(company?.metadata || {}),
      uxItems: [newItem, ...items],
    };

    await prisma.company.update({
      where: { id: user.companyId },
      data: { metadata: updatedMetadata },
    });

    return NextResponse.json({ data: newItem }, { status: 201 });
  } catch (error) {
    logger.error('[Ejemplo UX] Error al crear item', error);
    return NextResponse.json({ error: 'Error al crear item' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = updateSchema.parse(body);

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { metadata: true },
    });
    const items = normalizeItems(company?.metadata);
    const existing = items.find((item) => item.id === validated.id);

    if (!existing) {
      return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });
    }

    const updatedItem: UXItem = {
      ...existing,
      ...validated.updates,
    };

    const updatedMetadata = {
      ...(company?.metadata || {}),
      uxItems: items.map((item) => (item.id === validated.id ? updatedItem : item)),
    };

    await prisma.company.update({
      where: { id: user.companyId },
      data: { metadata: updatedMetadata },
    });

    return NextResponse.json({ data: updatedItem });
  } catch (error) {
    logger.error('[Ejemplo UX] Error al actualizar item', error);
    return NextResponse.json({ error: 'Error al actualizar item' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const idFromQuery = searchParams.get('id');
    let id = idFromQuery;

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {
        id = idFromQuery;
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'Id requerido' }, { status: 400 });
    }

    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { metadata: true },
    });
    const items = normalizeItems(company?.metadata);
    const updatedItems = items.filter((item) => item.id !== id);

    const updatedMetadata = {
      ...(company?.metadata || {}),
      uxItems: updatedItems,
    };

    await prisma.company.update({
      where: { id: user.companyId },
      data: { metadata: updatedMetadata },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[Ejemplo UX] Error al eliminar item', error);
    return NextResponse.json({ error: 'Error al eliminar item' }, { status: 500 });
  }
}
