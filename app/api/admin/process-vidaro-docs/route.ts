/**
 * POST /api/admin/process-vidaro-docs
 *
 * Procesa en BATCH todos los documentos PDF en S3 del grupo Vidaro:
 * 1. Lista documents en BD con cloudStoragePath en S3 (no Drive links)
 * 2. Para cada PDF: descarga, pdftotext, Claude IA extrae datos
 * 3. Aplica los datos extraídos a las entidades:
 *    - Contrato → Contract.rentaMensual, fianza, fechaInicio, fechaFin, iban
 *    - Sepa → Tenant.iban
 *    - Fianza → Contract.deposito
 *    - Póliza → Insurance.numeroPoliza, primaAnual
 * 4. Marca el Document como procesado (descripcion contiene JSON extraído)
 *
 * Body opcional: { limit?: number (default 50), dryRun?: bool, docId?: string }
 *
 * Solo super_admin / administrador.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { processS3Document, detectDocType } from '@/lib/document-extractor-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 900; // 15 min

const VIDARO_GROUP = [
  'cef19f55f7b6ce0637d5ffb53',
  'c65159283deeaf6815f8eda95',
  'cmkctneuh0001nokn7nvhuweq',
];

const ALLOWED_ROLES = new Set(['administrador', 'super_admin']);

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

interface ProcessResult {
  documentId: string;
  filename: string;
  s3Key: string;
  docType: string;
  status: 'extracted' | 'applied' | 'skipped' | 'error';
  appliedTo?: { entity: string; entityId: string; fields: string[] };
  data?: any;
  error?: string;
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
    const limit = Math.min(Math.max(Number(body?.limit) || 30, 1), 200);
    const dryRun = body?.dryRun === true;
    const onlyDocId = body?.docId;
    const forceOcr = body?.forceOcr === true;

    const prisma = await getPrisma();

    // Buscar documents Vidaro con PDF/DOCX en S3 (no Drive)
    const where: any = onlyDocId
      ? { id: onlyDocId }
      : {
          AND: [
            {
              OR: [
                { building: { companyId: { in: VIDARO_GROUP } } },
                { unit: { building: { companyId: { in: VIDARO_GROUP } } } },
                { tenant: { companyId: { in: VIDARO_GROUP } } },
              ],
            },
            // Solo PDFs/DOCX en S3 (no Google Drive)
            { cloudStoragePath: { not: { contains: 'drive.google' } } },
            {
              OR: [
                { cloudStoragePath: { contains: '.pdf' } },
                { cloudStoragePath: { contains: '.docx' } },
                { cloudStoragePath: { contains: '.doc' } },
              ],
            },
            // No procesados todavía
            {
              OR: [
                { descripcion: null },
                { descripcion: { not: { contains: '<!--EXTRACTED_DATA_JSON-->' } } },
              ],
            },
          ],
        };

    const documents = await prisma.document.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        tipo: true,
        cloudStoragePath: true,
        buildingId: true,
        unitId: true,
        contractId: true,
        tenantId: true,
        descripcion: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    logger.info(`[ProcessVidaroDocs] Procesando ${documents.length} documentos`);

    const results: ProcessResult[] = [];
    let extractedCount = 0;
    let appliedCount = 0;
    let errorCount = 0;

    for (const doc of documents) {
      const r: ProcessResult = {
        documentId: doc.id,
        filename: doc.nombre,
        s3Key: doc.cloudStoragePath || '',
        docType: 'unknown',
        status: 'skipped',
      };

      try {
        if (!doc.cloudStoragePath || doc.cloudStoragePath.includes('drive.google')) {
          r.status = 'skipped';
          r.error = 'No es PDF en S3';
          results.push(r);
          continue;
        }

        // Detectar tipo
        const docType = detectDocType(doc.nombre);
        r.docType = docType;

        // Hard timeout por documento: 60s sin OCR, 240s con OCR
        // (OCR 2 páginas a 200 DPI con preprocess + tesseract puede tardar)
        const docTimeout = forceOcr ? 240_000 : 60_000;
        const result = await Promise.race([
          processS3Document(doc.cloudStoragePath, docType, forceOcr),
          new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), docTimeout)
          ),
        ]);
        if (!result || !result.data) {
          r.status = 'skipped';
          r.error = 'No se pudo extraer';
          results.push(r);
          continue;
        }

        r.data = result.data;
        r.status = 'extracted';
        extractedCount++;

        if (dryRun) {
          results.push(r);
          continue;
        }

        // Aplicar datos extraídos a entidades
        const data: any = result.data;

        // ============ CONTRATOS DE ALQUILER ============
        if (docType === 'contrato_alquiler' && data) {
          // Si el doc está vinculado a un Contract, actualizarlo
          if (doc.contractId) {
            const updates: any = {};
            if (data.rentaMensual && typeof data.rentaMensual === 'number') {
              updates.rentaMensual = data.rentaMensual;
            }
            if (data.fianza && typeof data.fianza === 'number') {
              updates.deposito = data.fianza;
            }
            if (data.mesesFianza && typeof data.mesesFianza === 'number') {
              updates.mesesFianza = data.mesesFianza;
            }
            if (data.fechaInicio) {
              const dt = new Date(data.fechaInicio);
              if (!isNaN(dt.getTime())) updates.fechaInicio = dt;
            }
            if (data.fechaFin) {
              const dt = new Date(data.fechaFin);
              if (!isNaN(dt.getTime())) updates.fechaFin = dt;
            }
            if (data.iban) updates.iban = String(data.iban).replace(/\s/g, '');
            if (data.diaPago && typeof data.diaPago === 'number') {
              updates.diaPago = data.diaPago;
            }

            if (Object.keys(updates).length > 0) {
              await prisma.contract.update({
                where: { id: doc.contractId },
                data: updates,
              });
              r.status = 'applied';
              r.appliedTo = {
                entity: 'Contract',
                entityId: doc.contractId,
                fields: Object.keys(updates),
              };
              appliedCount++;
            }
          }

          // Si tiene tenantId, actualizar también tenant
          if (doc.tenantId && data.arrendatarioTelefono) {
            await prisma.tenant
              .update({
                where: { id: doc.tenantId },
                data: {
                  telefono: data.arrendatarioTelefono,
                  email: data.arrendatarioEmail || undefined,
                },
              })
              .catch(() => {});
          }
        }

        // ============ SEPA ============
        if (docType === 'sepa' && data && doc.tenantId && data.iban) {
          await prisma.tenant.update({
            where: { id: doc.tenantId },
            data: {
              iban: String(data.iban).replace(/\s/g, ''),
            },
          });
          r.status = 'applied';
          r.appliedTo = { entity: 'Tenant', entityId: doc.tenantId, fields: ['iban'] };
          appliedCount++;
        }

        // ============ FIANZA ============
        if (docType === 'fianza' && data && doc.contractId && data.importe) {
          await prisma.contract
            .update({
              where: { id: doc.contractId },
              data: { deposito: data.importe },
            })
            .catch(() => {});
          r.status = 'applied';
          r.appliedTo = { entity: 'Contract', entityId: doc.contractId, fields: ['deposito'] };
          appliedCount++;
        }

        // ============ PÓLIZA ============
        if (docType === 'poliza_seguro' && data && doc.buildingId) {
          // Buscar insurance vinculada
          const insurance = await prisma.insurance.findFirst({
            where: {
              buildingId: doc.buildingId,
              numeroPoliza: data.numeroPoliza || undefined,
            },
          });
          if (insurance) {
            await prisma.insurance.update({
              where: { id: insurance.id },
              data: {
                primaAnual: data.primaAnual || undefined,
                primaMensual: data.primaMensual || undefined,
                sumaAsegurada: data.sumaAsegurada || undefined,
              },
            });
            r.status = 'applied';
            r.appliedTo = {
              entity: 'Insurance',
              entityId: insurance.id,
              fields: ['primaAnual', 'sumaAsegurada'],
            };
            appliedCount++;
          }
        }

        // Persistir el JSON extraído en el Document para no reprocesar
        await prisma.document.update({
          where: { id: doc.id },
          data: {
            descripcion: `${doc.descripcion || ''}\n\n<!--EXTRACTED_DATA_JSON-->\n${JSON.stringify(
              data
            ).substring(0, 10000)}\n<!--/EXTRACTED_DATA_JSON-->`,
          },
        });

        results.push(r);
      } catch (e: any) {
        r.status = 'error';
        r.error = e?.message || String(e);
        errorCount++;
        results.push(r);
      }
    }

    logger.info(
      `[ProcessVidaroDocs] Done: ${extractedCount} extracted, ${appliedCount} applied, ${errorCount} errors`
    );

    return NextResponse.json({
      success: true,
      processed: documents.length,
      extracted: extractedCount,
      applied: appliedCount,
      errors: errorCount,
      results,
    });
  } catch (error: any) {
    logger.error('[ProcessVidaroDocs] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Error procesando documentos' },
      { status: 500 }
    );
  }
}
