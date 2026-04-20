/**
 * POST /api/admin/cleanup-gdrive
 *
 * Limpia las referencias a Google Drive del grupo Vidaro tras la migración:
 *
 * 1. Reporta cuántos archivos se han migrado a S3 (documents/gdrive-vidaro/...)
 * 2. Reporta cuántos Documents quedan apuntando a Google Drive
 * 3. Si dryRun=false:
 *    - Marca los Documents legacy de Drive con etiqueta 'gdrive-legacy'
 *    - Opcionalmente los elimina (deleteOldDriveDocs)
 *    - Limpia descripciones que mencionen Google Drive
 *
 * Body opcional: { dryRun?: boolean (default true), deleteOldDriveDocs?: boolean }
 *
 * Solo super_admin / administrador.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

const VIDARO_GROUP = [
  'cef19f55f7b6ce0637d5ffb53', // Rovida
  'c65159283deeaf6815f8eda95', // Vidaro
  'cmkctneuh0001nokn7nvhuweq', // Viroda
];

const ALLOWED_ROLES = new Set(['administrador', 'super_admin']);

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (!ALLOWED_ROLES.has(role)) {
      return NextResponse.json({ error: 'Solo administradores' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const dryRun = body?.dryRun !== false;
    const deleteOldDriveDocs = body?.deleteOldDriveDocs === true;

    const prisma = await getPrisma();

    // Estado actual
    const driveCount = await prisma.$queryRawUnsafe<any[]>(
      `
      SELECT COUNT(*)::int AS n
      FROM documents d
      LEFT JOIN buildings b ON b.id = d."buildingId"
      LEFT JOIN units u ON u.id = d."unitId"
      LEFT JOIN tenants t ON t.id = d."tenantId"
      WHERE d."cloudStoragePath" LIKE '%drive.google.com%'
        AND (b."companyId" = ANY($1::text[]) OR u."buildingId" IN (SELECT id FROM buildings WHERE "companyId" = ANY($1::text[])) OR t."companyId" = ANY($1::text[]))
      `,
      VIDARO_GROUP
    );
    const drive = driveCount[0]?.n || 0;

    const s3MigratedCount = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*)::int AS n FROM documents WHERE "cloudStoragePath" LIKE 'documents/gdrive-vidaro/%'`
    );
    const s3Migrated = s3MigratedCount[0]?.n || 0;

    let deleted = 0;
    let updated = 0;

    if (!dryRun) {
      // Etiquetar todos los documents Drive con tag 'gdrive-legacy'
      const tagged = await prisma.$executeRawUnsafe(
        `
        UPDATE documents
        SET tags = ARRAY_APPEND(COALESCE(tags, ARRAY[]::text[]), 'gdrive-legacy')
        WHERE "cloudStoragePath" LIKE '%drive.google.com%'
          AND NOT (tags @> ARRAY['gdrive-legacy'])
          AND id IN (
            SELECT d.id FROM documents d
            LEFT JOIN buildings b ON b.id = d."buildingId"
            LEFT JOIN units u ON u.id = d."unitId"
            LEFT JOIN tenants t ON t.id = d."tenantId"
            WHERE b."companyId" = ANY($1::text[])
               OR u."buildingId" IN (SELECT id FROM buildings WHERE "companyId" = ANY($1::text[]))
               OR t."companyId" = ANY($1::text[])
          )
        `,
        VIDARO_GROUP
      );
      updated = tagged;

      if (deleteOldDriveDocs) {
        // Eliminar los Documents Drive (ya migrados a S3)
        const removed = await prisma.$executeRawUnsafe(
          `
          DELETE FROM documents
          WHERE "cloudStoragePath" LIKE '%drive.google.com%'
            AND id IN (
              SELECT d.id FROM documents d
              LEFT JOIN buildings b ON b.id = d."buildingId"
              LEFT JOIN units u ON u.id = d."unitId"
              LEFT JOIN tenants t ON t.id = d."tenantId"
              WHERE b."companyId" = ANY($1::text[])
                 OR u."buildingId" IN (SELECT id FROM buildings WHERE "companyId" = ANY($1::text[]))
                 OR t."companyId" = ANY($1::text[])
            )
          `,
          VIDARO_GROUP
        );
        deleted = removed;
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      stats: {
        gdriveDocsRemaining: drive,
        s3MigratedDocs: s3Migrated,
        taggedAsLegacy: updated,
        deleted,
      },
    });
  } catch (error: any) {
    logger.error('[Cleanup gdrive] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error en cleanup' },
      { status: 500 }
    );
  }
}
