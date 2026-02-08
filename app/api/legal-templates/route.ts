import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import type { Prisma } from '@/types/prisma-types';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const LEGAL_TEMPLATE_CATEGORIES = [
  'contrato_arrendamiento',
  'anexo_contrato',
  'notificacion_inquilino',
  'reclamacion',
  'finalizacion_contrato',
  'inspeccion',
  'certificado',
  'otro',
] as const;

type LegalTemplateCategoryValue = (typeof LEGAL_TEMPLATE_CATEGORIES)[number];

const parseCategoria = (value?: string | null): LegalTemplateCategoryValue | null => {
  if (!value) return null;
  const match = LEGAL_TEMPLATE_CATEGORIES.find(
    (item): item is LegalTemplateCategoryValue => item === value
  );
  return match ?? null;
};

// GET - Obtener plantillas legales (accesible para todos los usuarios autenticados)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');
    const activo = searchParams.get('activo');

    const where: Prisma.LegalTemplateWhereInput = {};
    
    if (categoria && categoria !== 'all') {
      const categoriaValue = parseCategoria(categoria);
      if (!categoriaValue) {
        return NextResponse.json(
          { error: 'Categoría inválida' },
          { status: 400 }
        );
      }
      where.categoria = categoriaValue;
    }
    
    // Por defecto solo mostrar activas a usuarios normales
    if (session.user.role !== 'super_admin') {
      where.activo = true;
    } else if (activo !== null) {
      where.activo = activo === 'true';
    }

    const templates = await prisma.legalTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(templates);
  } catch (error: unknown) {
    logger.error('Error fetching legal templates:', error);
    return NextResponse.json(
      { error: 'Error al obtener las plantillas' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva plantilla (solo admin/gestor)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo admin, gestor y super_admin pueden crear plantillas
    const allowedRoles = ['super_admin', 'administrador', 'gestor'];
    if (!allowedRoles.includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear plantillas' },
        { status: 403 }
      );
    }

    const body: {
      nombre?: string;
      categoria?: string;
      descripcion?: string;
      contenido?: string;
      variables?: string[];
      jurisdiccion?: string;
      aplicableA?: string[];
      activo?: boolean;
    } = await request.json();
    const {
      nombre,
      categoria,
      descripcion,
      contenido,
      variables,
      jurisdiccion,
      aplicableA,
      activo,
    } = body;

    const categoriaValue = parseCategoria(categoria);

    if (!nombre || !categoriaValue || !contenido) {
      return NextResponse.json(
        { error: 'Nombre, categoría y contenido son requeridos' },
        { status: 400 }
      );
    }

    const companyId = session.user.companyId;
    if (!companyId) {
      return NextResponse.json(
        { error: 'Empresa requerida para crear plantilla' },
        { status: 400 }
      );
    }

    const template = await prisma.legalTemplate.create({
      data: {
        companyId,
        nombre,
        categoria: categoriaValue,
        descripcion,
        contenido,
        variables: variables || [],
        jurisdiccion,
        aplicableA: aplicableA || [],
        activo: activo ?? true,
        ultimaRevision: new Date(),
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error: unknown) {
    logger.error('Error creating legal template:', error);
    return NextResponse.json(
      { error: 'Error al crear la plantilla' },
      { status: 500 }
    );
  }
}
