/**
 * API v1 - Properties Endpoint
 * GET /api/v1/properties - Listar propiedades
 * POST /api/v1/properties - Crear propiedad
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAPIv1, parsePaginationParams, createPaginatedResponse } from '@/lib/api-v1/middleware';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema de validación para crear propiedad
const createPropertySchema = z.object({
  address: z.string().min(5),
  city: z.string().min(2),
  postalCode: z.string().optional(),
  country: z.string().default('España'),
  type: z
    .enum(['HOUSE', 'APARTMENT', 'STUDIO', 'ROOM', 'OFFICE', 'LOCAL', 'PARKING', 'STORAGE'])
    .default('APARTMENT'),
  status: z.enum(['AVAILABLE', 'RENTED', 'MAINTENANCE', 'INACTIVE']).default('AVAILABLE'),
  price: z.number().positive(),
  rooms: z.number().int().positive().optional(),
  bathrooms: z.number().int().positive().optional(),
  squareMeters: z.number().positive().optional(),
  description: z.string().optional(),
});

/**
 * GET /api/v1/properties
 * Lista propiedades de la empresa autenticada
 */
export const GET = withAPIv1(
  async (req: NextRequest, auth) => {
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePaginationParams(searchParams);

    // Filtros opcionales
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const city = searchParams.get('city');

    // Query
    const where = {
      companyId: auth.companyId!,
      ...(status && { status }),
      ...(type && { type }),
      ...(city && { city: { contains: city, mode: 'insensitive' as const } }),
    };

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      prisma.property.count({ where }),
    ]);

    return NextResponse.json(createPaginatedResponse(properties, total, page, limit));
  },
  {
    requiredScopes: ['properties:read'],
  }
);

/**
 * POST /api/v1/properties
 * Crear una nueva propiedad
 */
export const POST = withAPIv1(
  async (req: NextRequest, auth) => {
    const body = await req.json();

    // Validar
    const validated = createPropertySchema.parse(body);

    // Crear propiedad
    const property = await prisma.property.create({
      data: {
        ...validated,
        companyId: auth.companyId!,
      },
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

    return NextResponse.json(
      {
        success: true,
        data: property,
        message: 'Property created successfully',
      },
      { status: 201 }
    );
  },
  {
    requiredScopes: ['properties:write'],
  }
);
