import { getApiDocs } from '@/lib/swagger-config';
import { NextResponse } from 'next/server';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/docs:
 *   get:
 *     description: Returns the OpenAPI specification
 *     responses:
 *       200:
 *         description: OpenAPI specification JSON
 */
export async function GET() {
  try {
    const spec = getApiDocs();
    return NextResponse.json(spec);
  } catch (error) {
    logger.error('Error generating API docs:', error);
    return NextResponse.json(
      { error: 'Failed to generate API documentation' },
      { status: 500 }
    );
  }
}
