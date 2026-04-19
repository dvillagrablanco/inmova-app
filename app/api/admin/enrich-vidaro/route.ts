/**
 * POST /api/admin/enrich-vidaro
 *
 * Auto-rellena MASIVAMENTE campos vacíos en Inmova del grupo Vidaro a partir
 * de los datos de Zucchetti SQL Server ya sincronizados.
 *
 * Solo super_admin / administrador.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

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

    const prisma = await getPrisma();
    const startedAt = Date.now();
    const results: Record<string, any> = {};

    // ============ 1. Building.ibiAnual ← apuntes 631% del año ============
    const ibiUpdate = await prisma.$executeRawUnsafe(`
      WITH ibi_acc AS (
        SELECT "buildingId" AS bid, SUM(monto)::float AS total
        FROM accounting_transactions
        WHERE "esCorporativo"=false AND fecha >= '2026-01-01' AND fecha < '2027-01-01'
          AND categoria = 'gasto_impuesto' AND "buildingId" IS NOT NULL
          AND "companyId" = ANY($1::text[])
        GROUP BY "buildingId"
      )
      UPDATE buildings b SET "ibiAnual" = ROUND(ibi_acc.total::numeric, 2)
      FROM ibi_acc WHERE b.id = ibi_acc.bid
        AND b."companyId" = ANY($1::text[])
        AND ibi_acc.total > 0
        AND (b."ibiAnual" IS NULL OR b."ibiAnual" = 0 OR b."ibiAnual" < ibi_acc.total * 0.5)
    `, VIDARO_GROUP);
    results.buildingsIbiUpdated = ibiUpdate;

    // ============ 2. Building.gastosComunidad ← media mensual 627% últimos 12m ============
    const comUpdate = await prisma.$executeRawUnsafe(`
      WITH com_acc AS (
        SELECT "buildingId" AS bid, AVG(monthly_total)::float AS prom
        FROM (
          SELECT "buildingId", date_trunc('month', fecha) AS m, SUM(monto) AS monthly_total
          FROM accounting_transactions
          WHERE "esCorporativo"=false AND fecha >= '2025-01-01'
            AND categoria = 'gasto_comunidad' AND "buildingId" IS NOT NULL
            AND "companyId" = ANY($1::text[])
          GROUP BY 1, 2
        ) t GROUP BY "buildingId"
      )
      UPDATE buildings b SET "gastosComunidad" = ROUND(com_acc.prom::numeric, 2)
      FROM com_acc WHERE b.id = com_acc.bid
        AND b."companyId" = ANY($1::text[])
        AND com_acc.prom > 0
        AND (b."gastosComunidad" IS NULL OR b."gastosComunidad" = 0)
    `, VIDARO_GROUP);
    results.buildingsComunidadUpdated = comUpdate;

    // ============ 3. Insurance.primaAnual ← SUM 625% por building (anual 2026) ============
    const segUpdate = await prisma.$executeRawUnsafe(`
      WITH seg_acc AS (
        SELECT "buildingId" AS bid, SUM(monto)::float AS total
        FROM accounting_transactions
        WHERE "esCorporativo"=false AND fecha >= '2026-01-01' AND fecha < '2027-01-01'
          AND categoria = 'gasto_seguro' AND "buildingId" IS NOT NULL
          AND "companyId" = ANY($1::text[])
        GROUP BY "buildingId"
      )
      UPDATE insurances i SET "primaAnual" = ROUND(seg_acc.total::numeric, 2),
        "primaMensual" = ROUND((seg_acc.total/12)::numeric, 2)
      FROM seg_acc WHERE i."buildingId" = seg_acc.bid
        AND i."companyId" = ANY($1::text[])
        AND seg_acc.total > 0
        AND (i."primaAnual" IS NULL OR i."primaAnual" = 0)
    `, VIDARO_GROUP);
    results.insurancesUpdated = segUpdate;

    // ============ 4. ZucchettiTercero ↔ Tenant link por NIF ============
    const tenantLink = await prisma.$executeRawUnsafe(`
      UPDATE zucchetti_terceros zt SET "tenantId" = t.id
      FROM tenants t
      WHERE zt."companyId" = ANY($1::text[]) AND t."companyId" = ANY($1::text[])
        AND zt.nif = t.dni AND zt.nif IS NOT NULL AND zt.nif != ''
        AND zt.tipo = 'cliente' AND zt."tenantId" IS NULL
    `, VIDARO_GROUP);
    results.terceroTenantLinks = tenantLink;

    // ============ 5. ZucchettiTercero ↔ Provider link (por nombre, Provider no tiene NIF) ============
    const provLink = await prisma.$executeRawUnsafe(`
      UPDATE zucchetti_terceros zt SET "providerId" = p.id
      FROM providers p
      WHERE zt."companyId" = ANY($1::text[]) AND p."companyId" = ANY($1::text[])
        AND zt.nombre = p.nombre
        AND zt.tipo = 'proveedor' AND zt."providerId" IS NULL
    `, VIDARO_GROUP);
    results.terceroProviderLinks = provLink;

    // ============ 6. Tenants.iban / telefono / email desde Zucchetti ============
    const tenantUpdate = await prisma.$executeRawUnsafe(`
      UPDATE tenants t SET
        iban = COALESCE(NULLIF(t.iban, ''), zt.iban, t.iban),
        telefono = COALESCE(NULLIF(t.telefono, ''), zt.telefono, t.telefono),
        email = COALESCE(NULLIF(t.email, ''), zt.email, t.email)
      FROM zucchetti_terceros zt
      WHERE zt."companyId" = ANY($1::text[]) AND t."companyId" = ANY($1::text[])
        AND zt."tenantId" = t.id
    `, VIDARO_GROUP);
    results.tenantsUpdated = tenantUpdate;

    // ============ 7. AccountingTransaction.unitId ← matching por subcuenta + concepto ============
    // Para subcuentas 752xxxxx (ingresos por unidad) intentamos vincular a la unit
    const atUnitMatch = await prisma.$executeRawUnsafe(`
      WITH unit_match AS (
        SELECT DISTINCT ON (at.id) at.id AS at_id, u.id AS uid
        FROM accounting_transactions at
        JOIN units u ON u."buildingId" = at."buildingId"
        WHERE at."companyId" = ANY($1::text[])
          AND at."esCorporativo" = false
          AND at."buildingId" IS NOT NULL
          AND at."unitId" IS NULL
          AND (at.subcuenta LIKE '752%' OR at.subcuenta LIKE '631%' OR at.subcuenta LIKE '627%' OR at.subcuenta LIKE '622%' OR at.subcuenta LIKE '628%')
          AND u.numero IS NOT NULL
          AND at.concepto ILIKE '%' || u.numero || '%'
        ORDER BY at.id, LENGTH(u.numero) DESC
      )
      UPDATE accounting_transactions at SET "unitId" = um.uid
      FROM unit_match um WHERE at.id = um.at_id
    `, VIDARO_GROUP);
    results.accountingUnitsMatched = atUnitMatch;

    // ============ 8. Building.tipo ← inferir de las units si no está bien ============
    // (Si todas las units son 'garaje', el building debería ser tipo 'garaje')
    const buildingTypeUpdate = await prisma.$executeRawUnsafe(`
      WITH inferred AS (
        SELECT b.id, MODE() WITHIN GROUP (ORDER BY u.tipo) AS tipo_pred,
               COUNT(*) AS units_count
        FROM buildings b
        JOIN units u ON u."buildingId" = b.id
        WHERE b."companyId" = ANY($1::text[])
        GROUP BY b.id
      )
      SELECT 1 -- read-only para auditoría futura, no actualizar tipo automáticamente
    `, VIDARO_GROUP);

    // ============ 9. Resumen ============
    const summary = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 'Buildings con IBI' AS metrica, COUNT(*)::int AS valor FROM buildings WHERE "companyId" = ANY($1::text[]) AND "ibiAnual" > 0
      UNION ALL
      SELECT 'Buildings con gastos comunidad', COUNT(*)::int FROM buildings WHERE "companyId" = ANY($1::text[]) AND "gastosComunidad" > 0
      UNION ALL
      SELECT 'Insurances con primaAnual', COUNT(*)::int FROM insurances WHERE "companyId" = ANY($1::text[]) AND "primaAnual" > 0
      UNION ALL
      SELECT 'Tenants con IBAN', COUNT(*)::int FROM tenants WHERE "companyId" = ANY($1::text[]) AND iban IS NOT NULL AND iban != ''
      UNION ALL
      SELECT 'Tenants vinculados con Tercero', COUNT(*)::int FROM zucchetti_terceros WHERE "companyId" = ANY($1::text[]) AND "tenantId" IS NOT NULL
      UNION ALL
      SELECT 'AT con unitId', COUNT(*)::int FROM accounting_transactions WHERE "companyId" = ANY($1::text[]) AND "unitId" IS NOT NULL
      UNION ALL
      SELECT 'AT operativos asignados a building', COUNT(*)::int FROM accounting_transactions WHERE "companyId" = ANY($1::text[]) AND NOT "esCorporativo" AND "buildingId" IS NOT NULL
      UNION ALL
      SELECT 'AT corporativos', COUNT(*)::int FROM accounting_transactions WHERE "companyId" = ANY($1::text[]) AND "esCorporativo"
    `, VIDARO_GROUP);

    logger.info(`[Enrich Vidaro] Completed in ${Date.now() - startedAt}ms`);

    return NextResponse.json({
      success: true,
      durationMs: Date.now() - startedAt,
      updates: results,
      summary,
    });
  } catch (error: any) {
    logger.error('[Enrich Vidaro] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error en enrichment' },
      { status: 500 }
    );
  }
}
