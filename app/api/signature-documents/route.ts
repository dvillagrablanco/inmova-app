/**
 * API Route: /api/signature-documents
 * 
 * Gestiona documentos para firma digital usando DocuSign.
 * Permite crear borradores, enviar para firma, y consultar estado.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';
import { z } from 'zod';
// import { docuSignService } from '@/lib/signature-providers/docusign-service';
import { generateContractPDF } from '@/lib/pdf-generator';
import { uploadFile } from '@/lib/s3';

// ============================================
// SCHEMAS DE VALIDACIÓN
// ============================================

const firmanteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  telefono: z.string().optional(),
  rol: z.string().default('inquilino'),
  orden: z.number().int().positive().default(1)
});

const createDocumentSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido'),
  descripcion: z.string().optional(),
  tipo: z.enum([
    'arrendamiento_vivienda',
    'arrendamiento_comercial',
    'arrendamiento_temporal',
    'compraventa',
    'gestion_inmobiliaria',
    'otro'
  ]),
  templateId: z.string().optional(),
  contractId: z.string().optional(),
  firmantes: z.array(firmanteSchema).min(1, 'Debe haber al menos un firmante'),
  requiereOrden: z.boolean().default(false),
  diasExpiracion: z.number().int().positive().default(30),
  recordatorios: z.boolean().default(true),
  variables: z.record(z.any()).optional()
});

// ============================================
// GET: Listar documentos
// ============================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const contractId = searchParams.get('contractId');

    // Construir filtros
    const where: any = {
      companyId: session.user.companyId
    };

    if (estado) {
      where.estado = estado;
    }

    if (contractId) {
      where.contractId = contractId;
    }

    const documents = await prisma.documentoFirma.findMany({
      where,
      include: {
        template: {
          select: {
            id: true,
            nombre: true,
            tipo: true
          }
        },
        contract: {
          select: {
            id: true,
            unit: {
              select: {
                numero: true,
                building: {
                  select: {
                    nombre: true
                  }
                }
              }
            }
          }
        },
        firmantes: {
          select: {
            id: true,
            nombre: true,
            email: true,
            estado: true,
            orden: true,
            firmadoEn: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    logger.info('[API] Documentos de firma listados', {
      companyId: session.user.companyId,
      count: documents.length
    });

    return NextResponse.json(documents);
  } catch (error: any) {
    logError(error, { message: '[API] Error al listar documentos' });
    return NextResponse.json(
      { error: 'Error al obtener documentos' },
      { status: 500 }
    );
  }
}

// ============================================
// POST: Crear documento (borrador)
// ============================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();

    // Validar datos
    const validatedData = createDocumentSchema.parse(body);

    // Si se usa plantilla, obtenerla
    let contenidoHTML = '';
    let templateVariables = validatedData.variables || {};

    if (validatedData.templateId) {
      const template = await prisma.contractTemplate.findUnique({
        where: { 
          id: validatedData.templateId,
          companyId: session.user.companyId 
        }
      });

      if (!template) {
        return NextResponse.json(
          { error: 'Plantilla no encontrada' },
          { status: 404 }
        );
      }

      contenidoHTML = template.contenido;
      const templateVars = (template.variables as Record<string, any>) || {};
      templateVariables = { ...templateVars, ...templateVariables };
    }

    // Generar PDF del contrato
    const pdfBuffer = await generateContractPDF({
      titulo: validatedData.titulo,
      contenidoHTML: contenidoHTML || '<h1>Contrato</h1><p>Contenido del contrato...</p>',
      variables: templateVariables,
      companyInfo: {
        nombre: 'INMOVA'
      }
    });

    // Subir PDF a S3
    const fileName = `contratos/${Date.now()}-${validatedData.titulo.replace(/\s+/g, '_')}.pdf`;
    const cloud_storage_path = await uploadFile(pdfBuffer, fileName);

    // Crear documento en la base de datos
    const documento = await prisma.documentoFirma.create({
      data: {
        titulo: validatedData.titulo,
        descripcion: validatedData.descripcion,
        tipoDocumento: validatedData.tipo,
        companyId: session.user.companyId,
        templateId: validatedData.templateId,
        contractId: validatedData.contractId,
        proveedor: 'docusign',
        estado: 'borrador',
        cloud_storage_path,
        isPublic: false,
        requiereOrden: validatedData.requiereOrden,
        diasExpiracion: validatedData.diasExpiracion,
        recordatorios: validatedData.recordatorios,
        creadoPor: session.user.id,
        firmantes: {
          create: validatedData.firmantes.map((firmante) => ({
            nombre: firmante.nombre,
            email: firmante.email,
            telefono: firmante.telefono,
            rol: firmante.rol,
            orden: firmante.orden,
            estado: 'pendiente'
          }))
        }
      },
      include: {
        firmantes: true,
        template: true
      }
    });

    // Registrar evento en audit log
    await prisma.signatureAuditLog.create({
      data: {
        documentoId: documento.id,
        evento: 'creado',
        descripcion: `Documento creado: ${documento.titulo}`
      }
    });

    logger.info('[API] Documento de firma creado', {
      documentoId: documento.id,
      titulo: documento.titulo,
      firmantes: validatedData.firmantes.length,
      companyId: session.user.companyId
    });

    return NextResponse.json(documento, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    logError(error, { message: '[API] Error al crear documento' });
    return NextResponse.json(
      { error: 'Error al crear documento', details: error.message },
      { status: 500 }
    );
  }
}
