/**
 * API: INVENTARIO DE CONTRATO MEDIA ESTANCIA
 * 
 * Gestión del inventario de entrada y salida
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { inventarioCompletoSchema } from '@/lib/validations/medium-term-rental';
import {
  registrarInventarioEntrada,
  registrarInventarioSalida,
  generarPlantillaInventario,
  compararInventarios,
} from '@/lib/medium-term-rental-service';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET: Obtener inventarios del contrato
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const contrato = await prisma.contract.findFirst({
      where: {
        id: params.id,
        unit: { building: { companyId: session.user.companyId } },
      },
      select: {
        id: true,
        estadoInventario: true,
        inventarioEntrada: true,
        inventarioSalida: true,
        fechaInventarioEntrada: true,
        fechaInventarioSalida: true,
        fotosEntrada: true,
        fotosSalida: true,
        incidenciasInventario: true,
        importeIncidencias: true,
      },
    });

    if (!contrato) {
      return NextResponse.json(
        { error: 'Contrato no encontrado' },
        { status: 404 }
      );
    }

    // Si se solicita plantilla vacía
    const { searchParams } = new URL(request.url);
    if (searchParams.get('plantilla') === 'true') {
      return NextResponse.json({
        success: true,
        plantilla: generarPlantillaInventario(),
      });
    }

    // Si hay ambos inventarios, incluir comparación
    let comparacion = null;
    if (contrato.inventarioEntrada && contrato.inventarioSalida) {
      comparacion = compararInventarios(
        contrato.inventarioEntrada as any,
        contrato.inventarioSalida as any
      );
    }

    return NextResponse.json({
      success: true,
      data: contrato,
      comparacion,
    });
  } catch (error: any) {
    logger.error('[API Error] GET /api/contracts/medium-term/[id]/inventory:', error);
    return NextResponse.json(
      { error: 'Error obteniendo inventario' },
      { status: 500 }
    );
  }
}

/**
 * POST: Registrar inventario (entrada o salida)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo'); // 'entrada' o 'salida'

    if (!tipo || !['entrada', 'salida'].includes(tipo)) {
      return NextResponse.json(
        { error: 'Debe especificar tipo=entrada o tipo=salida' },
        { status: 400 }
      );
    }

    // Verificar contrato
    const contrato = await prisma.contract.findFirst({
      where: {
        id: params.id,
        unit: { building: { companyId: session.user.companyId } },
      },
    });

    if (!contrato) {
      return NextResponse.json(
        { error: 'Contrato no encontrado' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const inventario = inventarioCompletoSchema.parse(body);

    let resultado;
    let comparacion = null;

    if (tipo === 'entrada') {
      // Verificar que no existe inventario de entrada
      if (contrato.inventarioEntrada) {
        return NextResponse.json(
          { error: 'Ya existe un inventario de entrada para este contrato' },
          { status: 409 }
        );
      }

      resultado = await registrarInventarioEntrada(params.id, inventario as any);
    } else {
      // Verificar que existe inventario de entrada
      if (!contrato.inventarioEntrada) {
        return NextResponse.json(
          { error: 'Debe registrar primero el inventario de entrada' },
          { status: 400 }
        );
      }

      const resultadoSalida = await registrarInventarioSalida(params.id, inventario as any);
      resultado = resultadoSalida.contrato;
      comparacion = resultadoSalida.comparacion;
    }

    return NextResponse.json({
      success: true,
      data: resultado,
      comparacion,
      message: `Inventario de ${tipo} registrado correctamente`,
    }, { status: 201 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos de inventario inválidos',
          detalles: error.errors,
        },
        { status: 400 }
      );
    }

    logger.error('[API Error] POST /api/contracts/medium-term/[id]/inventory:', error);
    return NextResponse.json(
      { error: error.message || 'Error registrando inventario' },
      { status: 500 }
    );
  }
}
