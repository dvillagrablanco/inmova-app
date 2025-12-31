import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Sandbox Environment
 *
 * Provides mock data for testing without affecting production data
 */

const MOCK_PROPERTIES = [
  {
    id: 'prop_sandbox_1',
    address: 'Calle Sandbox 123',
    city: 'Madrid',
    postalCode: '28001',
    country: 'ES',
    price: 1200,
    type: 'APARTMENT',
    status: 'AVAILABLE',
    rooms: 3,
    bathrooms: 2,
    squareMeters: 85,
    floor: 4,
    description: 'Propiedad de prueba en sandbox',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    companyId: 'company_sandbox',
  },
  {
    id: 'prop_sandbox_2',
    address: 'Avenida Test 456',
    city: 'Barcelona',
    postalCode: '08001',
    country: 'ES',
    price: 1500,
    type: 'HOUSE',
    status: 'AVAILABLE',
    rooms: 4,
    bathrooms: 3,
    squareMeters: 120,
    floor: null,
    description: 'Casa de prueba en sandbox',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    companyId: 'company_sandbox',
  },
];

const MOCK_TENANTS = [
  {
    id: 'tenant_sandbox_1',
    firstName: 'Juan',
    lastName: 'Prueba',
    email: 'juan.prueba@sandbox.inmova.app',
    phone: '+34600000001',
    dni: '12345678A',
    nationality: 'ES',
    birthDate: '1990-01-01',
    createdAt: new Date().toISOString(),
    companyId: 'company_sandbox',
  },
  {
    id: 'tenant_sandbox_2',
    firstName: 'María',
    lastName: 'Test',
    email: 'maria.test@sandbox.inmova.app',
    phone: '+34600000002',
    dni: '87654321B',
    nationality: 'ES',
    birthDate: '1992-05-15',
    createdAt: new Date().toISOString(),
    companyId: 'company_sandbox',
  },
];

const MOCK_CONTRACTS = [
  {
    id: 'contract_sandbox_1',
    propertyId: 'prop_sandbox_1',
    tenantId: 'tenant_sandbox_1',
    startDate: '2025-02-01',
    endDate: '2026-01-31',
    monthlyRent: 1200,
    deposit: 1200,
    status: 'SIGNED',
    contractType: 'RESIDENTIAL',
    signedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    companyId: 'company_sandbox',
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const resource = searchParams.get('resource');

  // Check for sandbox API key
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.includes('sk_test_')) {
    return NextResponse.json(
      {
        error: 'Sandbox endpoint requires test API key (sk_test_...)',
        hint: 'Get a test API key from dashboard',
      },
      { status: 401 }
    );
  }

  switch (resource) {
    case 'properties':
      return NextResponse.json({
        success: true,
        data: MOCK_PROPERTIES,
        pagination: {
          page: 1,
          limit: 20,
          total: MOCK_PROPERTIES.length,
          pages: 1,
        },
      });

    case 'tenants':
      return NextResponse.json({
        success: true,
        data: MOCK_TENANTS,
        pagination: {
          page: 1,
          limit: 20,
          total: MOCK_TENANTS.length,
          pages: 1,
        },
      });

    case 'contracts':
      return NextResponse.json({
        success: true,
        data: MOCK_CONTRACTS,
        pagination: {
          page: 1,
          limit: 20,
          total: MOCK_CONTRACTS.length,
          pages: 1,
        },
      });

    default:
      return NextResponse.json(
        {
          error: 'Invalid resource',
          available: ['properties', 'tenants', 'contracts'],
        },
        { status: 400 }
      );
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.includes('sk_test_')) {
    return NextResponse.json({ error: 'Sandbox endpoint requires test API key' }, { status: 401 });
  }

  const body = await request.json();
  const { searchParams } = new URL(request.url);
  const resource = searchParams.get('resource');

  // Simulate creation
  const newId = `${resource}_sandbox_${Date.now()}`;

  return NextResponse.json({
    success: true,
    data: {
      id: newId,
      ...body,
      createdAt: new Date().toISOString(),
      companyId: 'company_sandbox',
    },
    message: `${resource} created in sandbox (not persisted)`,
  });
}
