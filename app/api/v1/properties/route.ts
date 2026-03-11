/**
 * API v1 - Properties Endpoint (DEPRECATED)
 *
 * The Property model has been removed from the schema.
 * Properties are now managed through Buildings and Units.
 * Use /api/buildings and /api/units instead.
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DEPRECATION_RESPONSE = NextResponse.json(
  {
    error: 'Gone',
    message: 'The /api/v1/properties endpoint has been deprecated. The Property model no longer exists. Use /api/buildings and /api/units instead.',
    migration: {
      buildings: '/api/buildings',
      units: '/api/units',
    },
  },
  { status: 410 }
);

export async function GET() {
  return DEPRECATION_RESPONSE;
}

export async function POST() {
  return DEPRECATION_RESPONSE;
}
