/**
 * API v1 - Property by ID Endpoint
 * GET /api/v1/properties/[id] - Obtener propiedad
 * PUT /api/v1/properties/[id] - Actualizar propiedad
 * DELETE /api/v1/properties/[id] - Eliminar propiedad
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAPIv1 } from '@/lib/api-v1/middleware';
import { NotFoundError, ForbiddenError } from '@/lib/api-v1/errors';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const updatePropertySchema = z.object({
  address: z.string().min(5).optional(),
  city: z.string().min(2).optional(),
  postalCode: z.string().optional(),
  status: z.enum(['AVAILABLE', 'RENTED', 'MAINTENANCE', 'INACTIVE']).optional(),
  price: z.number().positive().optional(),
  rooms: z.number().int().positive().optional(),
  bathrooms: z.number().int().positive().optional(),
  squareMeters: z.number().positive().optional(),
  description: z.string().optional(),
});

/**
 * GET /api/v1/properties/[id]
 */
export const GET = withAPIv1(
  async (req: NextRequest, auth) => {
    const propertyId = req.nextUrl.pathname.split('/').filter(Boolean).pop();
    if (!propertyId) {
      throw new NotFoundError('Property');
    }

    const property = await (prisma as any).property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        address: true,
        city: true,
        postalCode: true,
        country: true,
        type: true,
        status: true,
        price: true,
        rooms: true,
        bathrooms: true,
        squareMeters: true,
        description: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!property) {
      throw new NotFoundError('Property');
    }

    // Verificar ownership
    if (property.companyId !== auth.companyId) {
      throw new ForbiddenError('You do not have access to this property');
    }

    return NextResponse.json({
      success: true,
      data: property,
    });
  },
  {
    requiredScopes: ['properties:read'],
  }
);

/**
 * PUT /api/v1/properties/[id]
 */
export const PUT = withAPIv1(
  async (req: NextRequest, auth) => {
    const propertyId = req.nextUrl.pathname.split('/').filter(Boolean).pop();
    if (!propertyId) {
      throw new NotFoundError('Property');
    }

    const body = await req.json();
    const validated = updatePropertySchema.parse(body);

    // Verificar existencia y ownership
    const existing = await (prisma as any).property.findUnique({
      where: { id: propertyId },
      select: { companyId: true },
    });

    if (!existing) {
      throw new NotFoundError('Property');
    }

    if (existing.companyId !== auth.companyId) {
      throw new ForbiddenError('You do not have access to this property');
    }

    // Actualizar
    const updated = await (prisma as any).property.update({
      where: { id: propertyId },
      data: validated,
      select: {
        id: true,
        address: true,
        city: true,
        postalCode: true,
        type: true,
        status: true,
        price: true,
        rooms: true,
        bathrooms: true,
        squareMeters: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Property updated successfully',
    });
  },
  {
    requiredScopes: ['properties:write'],
  }
);

/**
 * DELETE /api/v1/properties/[id]
 */
export const DELETE = withAPIv1(
  async (req: NextRequest, auth) => {
    const propertyId = req.nextUrl.pathname.split('/').filter(Boolean).pop();
    if (!propertyId) {
      throw new NotFoundError('Property');
    }

    // Verificar existencia y ownership
    const existing = await (prisma as any).property.findUnique({
      where: { id: propertyId },
      select: { companyId: true },
    });

    if (!existing) {
      throw new NotFoundError('Property');
    }

    if (existing.companyId !== auth.companyId) {
      throw new ForbiddenError('You do not have access to this property');
    }

    // Soft delete (actualizar status)
    await (prisma as any).property.update({
      where: { id: propertyId },
      data: {
        status: 'INACTIVE',
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Property deleted successfully',
    });
  },
  {
    requiredScopes: ['properties:write'],
  }
);
