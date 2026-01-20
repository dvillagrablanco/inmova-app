/**
 * API de Generación de Contratos
 * 
 * POST /api/tools/contracts - Genera un contrato de arrendamiento
 * GET /api/tools/contracts/templates - Obtiene plantillas disponibles
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateRentalContract } from '@/lib/contract-generator';
import { ContractData } from '@/lib/contract-generator/types';
import { z } from 'zod';

import logger from '@/lib/logger';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema de validación
const personSchema = z.object({
  name: z.string().min(2),
  documentId: z.string().min(5),
  documentType: z.enum(['DNI', 'NIE', 'CIF', 'PASSPORT']),
  address: z.string().min(5),
  city: z.string().min(2),
  postalCode: z.string().min(4),
  email: z.string().email(),
  phone: z.string().min(6),
});

const propertySchema = z.object({
  address: z.string().min(5),
  city: z.string().min(2),
  postalCode: z.string().min(4),
  province: z.string().min(2),
  cadastralReference: z.string().optional(),
  area: z.number().positive(),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(1),
  floor: z.string().optional(),
  door: z.string().optional(),
  hasGarage: z.boolean().optional(),
  hasStorage: z.boolean().optional(),
  furnished: z.boolean(),
  energyCertificate: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']).optional(),
  habitabilityCertificate: z.boolean().optional(),
});

const termsSchema = z.object({
  type: z.enum(['HABITUAL', 'TEMPORADA', 'HABITACION', 'LOCAL']),
  startDate: z.string().transform((val) => new Date(val)),
  durationMonths: z.number().int().positive(),
  monthlyRent: z.number().positive(),
  depositMonths: z.number().int().min(1).max(3),
  additionalGuarantee: z.number().optional(),
  paymentDay: z.number().int().min(1).max(28),
  paymentMethod: z.enum(['TRANSFER', 'DOMICILIATION', 'CASH']),
  iban: z.string().optional(),
  includedExpenses: z.object({
    water: z.boolean(),
    electricity: z.boolean(),
    gas: z.boolean(),
    internet: z.boolean(),
    community: z.boolean(),
  }),
  updateIndex: z.enum(['IPC', 'IGC', 'IRAV']),
  petsAllowed: z.boolean(),
  sublettingAllowed: z.boolean(),
  additionalClauses: z.array(z.string()).optional(),
});

const inventoryItemSchema = z.object({
  item: z.string(),
  quantity: z.number().int().positive(),
  condition: z.enum(['NUEVO', 'BUENO', 'REGULAR', 'MALO']),
  notes: z.string().optional(),
});

const contractDataSchema = z.object({
  landlord: personSchema,
  tenant: personSchema,
  property: propertySchema,
  terms: termsSchema,
  inventory: z.array(inventoryItemSchema).optional(),
  digitalSignature: z.boolean().optional(),
});

/**
 * POST /api/tools/contracts
 * Genera un nuevo contrato de arrendamiento
 */
export async function POST(request: NextRequest) {
  try {
    // Autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Parsear body
    const body = await request.json();

    // Validar datos
    const validatedData = contractDataSchema.parse(body);

    // Generar contrato
    const contract = generateRentalContract(validatedData as ContractData);

    // Responder con el contrato generado
    return NextResponse.json({
      success: true,
      contract: {
        id: contract.id,
        html: contract.html,
        generatedAt: contract.generatedAt,
        hash: contract.hash,
      },
    }, { status: 201 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos de contrato inválidos',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    logger.error('[Contract API Error]:', error);
    return NextResponse.json(
      { error: 'Error generando contrato' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tools/contracts
 * Obtiene plantillas de contratos disponibles
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Plantillas disponibles
    const templates = [
      {
        id: 'habitual',
        name: 'Contrato de Vivienda Habitual',
        description: 'Arrendamiento de vivienda para uso habitual y permanente. Regulado por LAU.',
        type: 'HABITUAL',
        minDuration: 12,
        defaultDuration: 12,
        depositMonths: 1,
        icon: '🏠',
      },
      {
        id: 'temporada',
        name: 'Contrato de Temporada',
        description: 'Arrendamiento para uso temporal (vacaciones, estudios, trabajo temporal).',
        type: 'TEMPORADA',
        minDuration: 1,
        defaultDuration: 3,
        depositMonths: 2,
        icon: '🏖️',
      },
      {
        id: 'habitacion',
        name: 'Contrato de Habitación',
        description: 'Arrendamiento de habitación en vivienda compartida (coliving).',
        type: 'HABITACION',
        minDuration: 1,
        defaultDuration: 6,
        depositMonths: 1,
        icon: '🛏️',
      },
      {
        id: 'local',
        name: 'Contrato de Local Comercial',
        description: 'Arrendamiento de local para uso comercial o profesional.',
        type: 'LOCAL',
        minDuration: 12,
        defaultDuration: 60,
        depositMonths: 2,
        icon: '🏪',
      },
    ];

    return NextResponse.json({
      success: true,
      templates,
    });

  } catch (error: any) {
    logger.error('[Contract Templates API Error]:', error);
    return NextResponse.json(
      { error: 'Error obteniendo plantillas' },
      { status: 500 }
    );
  }
}
