/**
 * API Route: /api/contract-templates
 * 
 * Gestiona las plantillas de contratos para firma digital.
 * Permite crear, listar y gestionar plantillas predefinidas.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';
import { z } from 'zod';

// ============================================
// SCHEMAS DE VALIDACIÓN
// ============================================

const createTemplateSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  tipo: z.enum([
    'arrendamiento_vivienda',
    'arrendamiento_comercial',
    'arrendamiento_temporal',
    'compraventa',
    'gestion_inmobiliaria',
    'otro'
  ]),
  contenido: z.string().min(1, 'El contenido es requerido'),
  variables: z.record(z.any()).optional(),
  activo: z.boolean().default(true)
});

// ============================================
// GET: Listar plantillas
// ============================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activo = searchParams.get('activo');
    const tipo = searchParams.get('tipo');

    // Construir filtros
    const where: any = {
      companyId: session.user.companyId
    };

    if (activo !== null) {
      where.activo = activo === 'true';
    }

    if (tipo) {
      where.tipo = tipo;
    }

    const templates = await prisma.contractTemplate.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            documents: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    logger.info('[API] Plantillas de contratos listadas', {
      companyId: session.user.companyId,
      count: templates.length
    });

    return NextResponse.json(templates);
  } catch (error: any) {
    logError(error, { message: '[API] Error al listar plantillas' });
    return NextResponse.json(
      { error: 'Error al obtener plantillas' },
      { status: 500 }
    );
  }
}

// ============================================
// POST: Crear plantilla
// ============================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();

    // Validar datos
    const validatedData = createTemplateSchema.parse(body);

    // Crear plantilla
    const template = await prisma.contractTemplate.create({
      data: {
        nombre: validatedData.nombre,
        descripcion: validatedData.descripcion,
        tipo: validatedData.tipo,
        contenido: validatedData.contenido,
        variables: validatedData.variables,
        activo: validatedData.activo,
        companyId: session.user.companyId,
        createdBy: session.user.id
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    logger.info('[API] Plantilla de contrato creada', {
      templateId: template.id,
      nombre: template.nombre,
      tipo: template.tipo,
      companyId: session.user.companyId
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    logError(error, { message: '[API] Error al crear plantilla' });
    return NextResponse.json(
      { error: 'Error al crear plantilla' },
      { status: 500 }
    );
  }
}
