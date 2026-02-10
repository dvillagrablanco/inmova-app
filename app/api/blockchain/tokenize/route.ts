export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API: Tokenización de Propiedades
 * POST: Iniciar proceso de tokenización
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';
import { z } from 'zod';

// Schema de validación
const tokenizeSchema = z.object({
  propertyId: z.string().min(1, 'La propiedad es requerida'),
  totalValue: z.number().positive('El valor debe ser positivo'),
  tokenSupply: z.number().int().positive().min(100).max(1000000),
  tokenPrice: z.number().positive(),
  minInvestment: z.number().positive(),
  maxInvestment: z.number().positive(),
  annualYieldTarget: z.number().min(0).max(100),
  description: z.string().optional(),
  legalCompliance: z.object({
    kycRequired: z.boolean().default(true),
    accreditedOnly: z.boolean().default(false),
    maxInvestors: z.number().int().positive().default(500),
    jurisdictions: z.array(z.string()).default(['ES', 'EU']),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;, { status: 401 });
    }

    const body = await request.json();
    const validatedData = tokenizeSchema.parse(body);

    // Verificar que la propiedad existe y pertenece a la empresa
    const property = await prisma.unit.findFirst({
      where: {
        id: validatedData.propertyId,
        building: {
          companyId: session.user.companyId,
        },
      },
      include: {
        building: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada o no pertenece a tu empresa' },
        { status: 404 }
      );
    }

    // Verificar que no esté ya tokenizada
    const existingToken = await prisma.propertyToken.findFirst({
      where: {
        unitId: validatedData.propertyId,
        estado: { in: ['active', 'pending'] },
      },
    });

    if (existingToken) {
      return NextResponse.json(
        { error: 'Esta propiedad ya está tokenizada o tiene un proceso pendiente' },
        { status: 400 }
      );
    }

    // Crear registro de tokenización
    const tokenSymbol = `INM${property.building.nombre.substring(0, 2).toUpperCase()}${property.numero}`.replace(/[^A-Z0-9]/g, '').substring(0, 10);
    
    const propertyToken = await prisma.propertyToken.create({
      data: {
        companyId: session.user.companyId,
        unitId: validatedData.propertyId,
        buildingId: property.buildingId,
        nombre: `${property.building.nombre} - ${property.numero}`,
        simbolo: tokenSymbol,
        tokenSymbol,
        totalSupply: validatedData.tokenSupply,
        tokensPorPropiedad: validatedData.tokenSupply,
        precioPorToken: validatedData.tokenPrice,
        valorPropiedad: validatedData.totalValue,
        valorActual: validatedData.totalValue,
        estado: 'pending',
        blockchain: 'Polygon',
        metadata: {
          minInvestment: validatedData.minInvestment,
          maxInvestment: validatedData.maxInvestment,
          annualYieldTarget: validatedData.annualYieldTarget,
          description: validatedData.description || '',
          legalCompliance: validatedData.legalCompliance ?? null,
        },
      },
      include: {
        unit: {
          select: {
            id: true,
            numero: true,
            tipo: true,
          },
        },
        building: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    logger.info('Property tokenization initiated:', {
      tokenId: propertyToken.id,
      propertyId: validatedData.propertyId,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Proceso de tokenización iniciado correctamente',
      token: {
        id: propertyToken.id,
        name: propertyToken.nombre,
        symbol: propertyToken.simbolo,
        status: propertyToken.estado,
        totalValue: propertyToken.valorPropiedad,
        tokenSupply: propertyToken.totalSupply,
        tokenPrice: propertyToken.precioPorToken,
      },
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Error tokenizing property:', error);
    return NextResponse.json(
      { error: error.message || 'Error al iniciar tokenización' },
      { status: 500 }
    );
  }
}
