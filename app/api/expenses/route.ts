/**
 * Endpoints API para Gastos
 * 
 * Implementa operaciones CRUD con validación Zod, manejo de errores
 * y códigos de estado HTTP correctos.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/permissions';
import { prisma } from '@/lib/db';
import { resolveCompanyScope } from '@/lib/company-scope';
import logger from '@/lib/logger';
import { expenseCreateSchema } from '@/lib/validations';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/expenses
 * Obtiene gastos con filtros opcionales
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const scope = await resolveCompanyScope({
      userId: user.id,
      role: user.role as any,
      primaryCompanyId: user.companyId,
      request: req,
    });
    const { searchParams } = new URL(req.url);

    const buildingId = searchParams.get('buildingId');
    const unitId = searchParams.get('unitId');
    const providerId = searchParams.get('providerId');
    const categoria = searchParams.get('categoria');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    if (!scope.activeCompanyId) {
      return NextResponse.json({ data: [], meta: { total: 0 } }, { status: 200 });
    }

    const where: any = {
      building: {
        companyId: scope.scopeCompanyIds.length > 1 ? { in: scope.scopeCompanyIds } : scope.activeCompanyId,
      },
    };

    if (buildingId) where.buildingId = buildingId;
    if (unitId) where.unitId = unitId;
    if (providerId) where.providerId = providerId;
    if (categoria) where.categoria = categoria;
    
    if (fechaDesde || fechaHasta) {
      where.fecha = {};
      if (fechaDesde) where.fecha.gte = new Date(fechaDesde);
      if (fechaHasta) where.fecha.lte = new Date(fechaHasta);
    }

    // Paginación
    const take = limit ? parseInt(limit) : undefined;
    const skip = offset ? parseInt(offset) : undefined;

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          building: { select: { nombre: true, id: true } },
          unit: { select: { numero: true, id: true } },
          provider: { select: { nombre: true, id: true } },
        },
        orderBy: { fecha: 'desc' },
        take,
        skip,
      }),
      prisma.expense.count({ where }),
    ]);

    logger.info(`Gastos obtenidos: ${expenses.length} de ${total}`, { userId: user.id });
    
    // Convertir valores Decimal a números
    const expensesWithNumbers = expenses.map(expense => ({
      ...expense,
      monto: Number(expense.monto || 0),
    }));
    
    return NextResponse.json({
      data: expensesWithNumbers,
      meta: {
        total,
        limit: take,
        offset: skip,
      },
    }, { status: 200 });
    
  } catch (error: any) {
    logger.error('Error fetching expenses:', error);
    
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado', message: 'Debe iniciar sesión' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor', message: 'Error al obtener gastos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/expenses
 * Crea un nuevo gasto con validación Zod
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission('create');
    const scope = await resolveCompanyScope({
      userId: user.id,
      role: user.role as any,
      primaryCompanyId: user.companyId,
      request: req,
    });

    if (!scope.activeCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    const body = await req.json();

    // Validación con Zod
    const validatedData = expenseCreateSchema.parse(body);

    // Verificar que el edificio pertenece a la compañía
    if (validatedData.buildingId) {
      const building = await prisma.building.findUnique({
        where: { id: validatedData.buildingId },
      });

      if (!building) {
        return NextResponse.json(
          { error: 'No encontrado', message: 'Edificio no encontrado' },
          { status: 404 }
        );
      }

      if (!scope.scopeCompanyIds.includes(building.companyId)) {
        return NextResponse.json(
          { error: 'Prohibido', message: 'No tiene acceso a este edificio' },
          { status: 403 }
        );
      }
    }

    // Verificar que la unidad pertenece al edificio
    if (validatedData.unitId) {
      const unit = await prisma.unit.findUnique({
        where: { id: validatedData.unitId },
        include: { building: true },
      });

      if (!unit) {
        return NextResponse.json(
          { error: 'No encontrado', message: 'Unidad no encontrada' },
          { status: 404 }
        );
      }

      if (!scope.scopeCompanyIds.includes(unit.building.companyId)) {
        return NextResponse.json(
          { error: 'Prohibido', message: 'No tiene acceso a esta unidad' },
          { status: 403 }
        );
      }
    }

    // Verificar que el proveedor pertenece a la compañía
    if (validatedData.providerId) {
      const provider = await prisma.provider.findUnique({
        where: { id: validatedData.providerId },
      });

      if (!provider) {
        return NextResponse.json(
          { error: 'No encontrado', message: 'Proveedor no encontrado' },
          { status: 404 }
        );
      }

      if (!scope.scopeCompanyIds.includes(provider.companyId)) {
        return NextResponse.json(
          { error: 'Prohibido', message: 'No tiene acceso a este proveedor' },
          { status: 403 }
        );
      }
    }

    const expenseData: any = {
      buildingId: validatedData.buildingId || null,
      unitId: validatedData.unitId || null,
      providerId: validatedData.providerId || null,
      concepto: validatedData.concepto,
      categoria: validatedData.categoria,
      monto: validatedData.monto,
      fecha: new Date(validatedData.fecha),
      facturaPdfPath: validatedData.facturaPdfPath || null,
      numeroFactura: validatedData.numeroFactura || null,
      notas: validatedData.notas || null,
    };

    const expense = await prisma.expense.create({
      data: expenseData,
      include: {
        building: { select: { nombre: true, id: true } },
        unit: { select: { numero: true, id: true } },
        provider: { select: { nombre: true, id: true } },
      },
    });

    logger.info(`Gasto creado: ${expense.id}`, { userId: user.id, expenseId: expense.id });
    return NextResponse.json(expense, { status: 201 });
    
  } catch (error: any) {
    logger.error('Error creating expense:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validación fallida',
          message: 'Los datos proporcionados no son válidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    if (error.message?.includes('permiso')) {
      return NextResponse.json(
        { error: 'Prohibido', message: error.message },
        { status: 403 }
      );
    }
    
    if (error.message === 'No autenticado') {
      return NextResponse.json(
        { error: 'No autenticado', message: 'Debe iniciar sesión' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor', message: 'Error al crear gasto' },
      { status: 500 }
    );
  }
}
