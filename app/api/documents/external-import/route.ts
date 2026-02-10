/**
 * API Route: Importar documentos externos (Google Drive, URLs)
 * POST /api/documents/external-import
 * 
 * Permite registrar documentos externos (Google Drive, Dropbox, etc.)
 * en el sistema documental de Inmova sin necesidad de subir el archivo.
 * 
 * El documento se almacena como referencia (enlace) y es accesible
 * desde el gestor documental, seguros, contratos y contabilidad.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema de validación
const externalDocumentSchema = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(500),
  tipo: z.enum([
    'contrato', 'dni', 'nomina', 'certificado_energetico',
    'ite', 'seguro', 'factura', 'contabilidad', 'otro'
  ]),
  url: z.string().url('URL inválida'),
  descripcion: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  folderId: z.string().optional(),
  folderName: z.string().optional(),
  fechaVencimiento: z.string().optional(),
  // Relaciones opcionales
  tenantId: z.string().optional(),
  unitId: z.string().optional(),
  buildingId: z.string().optional(),
  contractId: z.string().optional(),
});

const batchImportSchema = z.object({
  documents: z.array(externalDocumentSchema).min(1, 'Al menos un documento requerido'),
});

// POST - Importar documento(s) externo(s)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const queryCompanyId = searchParams.get('companyId');
    const userRole = (session.user as any).role;
    const sessionCompanyId = session.user.companyId;
    const companyId =
      queryCompanyId && (userRole === 'super_admin' || userRole === 'soporte')
        ? queryCompanyId
        : sessionCompanyId;

    if (!companyId) {
      return NextResponse.json({ error: 'Empresa no válida' }, { status: 400 });
    }

    const body = await req.json();

    // Verificar si es importación individual o batch
    const isBatch = Array.isArray(body.documents);
    const documents = isBatch
      ? batchImportSchema.parse(body).documents
      : [externalDocumentSchema.parse(body)];

    const results: Array<{
      nombre: string;
      id: string;
      status: 'created' | 'updated' | 'error';
      error?: string;
    }> = [];

    for (const doc of documents) {
      try {
        // Resolver carpeta
        let folderId = doc.folderId;

        if (!folderId && doc.folderName) {
          // Buscar o crear carpeta por nombre
          let folder = await prisma.documentFolder.findFirst({
            where: { companyId, nombre: doc.folderName },
          });

          if (!folder) {
            folder = await prisma.documentFolder.create({
              data: {
                companyId,
                nombre: doc.folderName,
                descripcion: `Carpeta creada automáticamente para documentos importados`,
                color: '#6366f1',
                icono: 'ExternalLink',
              },
            });
          }
          folderId = folder.id;
        }

        if (!folderId) {
          // Usar carpeta General por defecto
          let generalFolder = await prisma.documentFolder.findFirst({
            where: { companyId, nombre: 'General', parentFolderId: null },
          });

          if (!generalFolder) {
            generalFolder = await prisma.documentFolder.create({
              data: {
                companyId,
                nombre: 'General',
                descripcion: 'Documentos generales',
                color: '#111827',
                icono: 'Folder',
              },
            });
          }
          folderId = generalFolder.id;
        }

        // Verificar si ya existe un documento con la misma URL en la misma carpeta
        const existing = await prisma.document.findFirst({
          where: {
            cloudStoragePath: doc.url,
            folderId: folderId,
          },
        });

        if (existing) {
          // Actualizar metadatos
          await prisma.document.update({
            where: { id: existing.id },
            data: {
              nombre: doc.nombre,
              descripcion: doc.descripcion,
              tags: [...new Set([...existing.tags, ...doc.tags, 'google-drive', 'importado'])],
            },
          });

          results.push({
            nombre: doc.nombre,
            id: existing.id,
            status: 'updated',
          });
          continue;
        }

        // Crear documento con enlace externo
        const allTags = [...new Set([...doc.tags, 'google-drive', 'importado'])];

        const document = await prisma.document.create({
          data: {
            nombre: doc.nombre,
            tipo: doc.tipo,
            cloudStoragePath: doc.url,
            descripcion: doc.descripcion,
            tags: allTags,
            folderId: folderId,
            tenantId: doc.tenantId || undefined,
            unitId: doc.unitId || undefined,
            buildingId: doc.buildingId || undefined,
            contractId: doc.contractId || undefined,
            fechaVencimiento: doc.fechaVencimiento
              ? new Date(doc.fechaVencimiento)
              : undefined,
          },
        });

        // Crear versión inicial
        await prisma.documentVersion.create({
          data: {
            documentId: document.id,
            versionNumero: 1,
            cloud_storage_path: doc.url,
            tamano: 0,
            uploadedBy: session.user.id,
            comentario: 'Enlace externo importado desde Google Drive',
          },
        });

        // Registrar en audit log
        try {
          await prisma.auditLog.create({
            data: {
              companyId,
              userId: session.user.id,
              action: 'CREATE',
              entityType: 'DOCUMENT',
              entityId: document.id,
              entityName: doc.nombre,
              details: {
                source: 'google-drive',
                url: doc.url,
                tipo: doc.tipo,
              },
            },
          });
        } catch {
          // No fallar si audit log falla
        }

        results.push({
          nombre: doc.nombre,
          id: document.id,
          status: 'created',
        });
      } catch (docError: any) {
        logger.error(`Error importando documento ${doc.nombre}:`, docError);
        results.push({
          nombre: doc.nombre,
          id: '',
          status: 'error',
          error: docError.message || 'Error desconocido',
        });
      }
    }

    const created = results.filter((r) => r.status === 'created').length;
    const updated = results.filter((r) => r.status === 'updated').length;
    const errors = results.filter((r) => r.status === 'error').length;

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        created,
        updated,
        errors,
      },
      results,
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Datos de entrada inválidos',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    logger.error('Error en importación externa:', error);
    return NextResponse.json(
      { error: 'Error al importar documentos externos' },
      { status: 500 }
    );
  }
}

// GET - Listar documentos externos importados
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const queryCompanyId = searchParams.get('companyId');
    const userRole = (session.user as any).role;
    const sessionCompanyId = session.user.companyId;
    const companyId =
      queryCompanyId && (userRole === 'super_admin' || userRole === 'soporte')
        ? queryCompanyId
        : sessionCompanyId;

    if (!companyId) {
      return NextResponse.json({ error: 'Empresa no válida' }, { status: 400 });
    }

    // Buscar documentos que son enlaces externos (Google Drive, etc.)
    const documents = await prisma.document.findMany({
      where: {
        folder: { companyId },
        cloudStoragePath: {
          startsWith: 'https://',
        },
        tags: {
          hasSome: ['google-drive', 'importado'],
        },
      },
      include: {
        folder: { select: { nombre: true, color: true, icono: true } },
        _count: {
          select: { versions: true, shares: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      documents,
      count: documents.length,
    });
  } catch (error) {
    logger.error('Error listando documentos externos:', error);
    return NextResponse.json(
      { error: 'Error al listar documentos externos' },
      { status: 500 }
    );
  }
}
